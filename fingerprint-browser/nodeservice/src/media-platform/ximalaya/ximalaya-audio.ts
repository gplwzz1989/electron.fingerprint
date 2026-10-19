import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { EventEmitter } from 'events';
import { ListItemInfo, PublishResult } from '../baseModel';
import { ITask } from '../baseTask';
import { errorCode } from '../errorCode';
import { downloadFile, isUrl } from '@/ai-platform/file-utils';
import { StatementTypeEnum } from '@/cloud/model/BaseTaskFormModel';
import { VisibleTypeEnum } from '@/cloud/model/TypeEnum';
import { publishStatusEnum, SetProgressNewEvent } from '@/utils';
import { getXimalayaUserInfo } from './ximalaya-common';
import {
  createXimalayaAudio,
  createXimalayaUploadTraceId,
  getUploadTokenResponse,
  getXimalayaXmSign,
  mergeXimalayaUpload,
  uploadAudioData,
} from './ximalaya-audio.service';

const PART_SIZE = 2 * 1024 * 1024;

/** 喜马拉雅音频发布输入，供 SDK 调用方与云端 Worker 共用。 */
export interface XimalayaAudioTaskInput extends ITask {
  taskId: string;
  audio: { localPath: string; size?: number; duration?: number };
  title: string;
  desc?: string;
  soundRichIntro?: string;
  /** 外部选择的完整专辑项；raw 中必须保留 categoryId 与 albumStatusInfo。 */
  album?: ListItemInfo;
  /** 兼容旧调用；新调用请使用 album。 */
  albumId?: number | string;
  categoryId?: number | string;
  soundCoverPath?: { fileId: number; fileUrl?: string };
  tags?: string[];
  topics?: ListItemInfo[];
  prePubTime?: number;
  visibleCrowdType?: number;
  visibleType?: VisibleTypeEnum;
  isFree?: boolean;
  isTrailer?: boolean;
  trackVipFirst?: boolean;
  statement?: { type: StatementTypeEnum };
  isAiTrack?: boolean;
  lrcPath?: string;
  anchorActivity?: { isSynActivity?: boolean; shareContent?: string };
  communityWidget?: object;
  activityId?: string;
  /** 本地封面文件路径或 URL；存在时自动上传为 soundCoverPath。 */
  cover?: { localPath: string; format?: string };
  /** 可选：覆盖本次自动生成的 xm-sign，便于排查。 */
  xmSign?: string;
}

/** 喜马拉雅音频发布结果，与其他平台的 PublishResultOutput 保持一致。 */
export interface XimalayaAudioPublishResultOutput extends PublishResult {}

/**
 * 喜马拉雅的请求体将普通标签放在 key "0"，话题按其平台 ID 同时写入 soundTags 和 topicTags。
 * 外部调用方只需遵循项目统一的 tags/topics 结构。
 */
export const normalizeXimalayaTags = (
  tags: string[] | undefined,
  topics: ListItemInfo[] | undefined,
): { soundTags: string; topicTags: string } => {
  const soundTags: Record<string, string[]> = {};
  const topicTags: Record<string, string[]> = {};
  const normalizedTags = (tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  if (normalizedTags.length) {
    soundTags['0'] = normalizedTags;
  }
  for (const topic of topics ?? []) {
    const id = String(topic?.yixiaoerId ?? '').trim();
    const name = String(topic?.yixiaoerName ?? '').trim();
    if (!id || !name) continue;
    topicTags[id] = [...(topicTags[id] ?? []), name];
    soundTags[id] = [...(soundTags[id] ?? []), name];
  }
  return { soundTags: JSON.stringify(soundTags), topicTags: JSON.stringify(topicTags) };
};

/** 项目通用可见范围 → 喜马拉雅 visibleCrowdType。 */
export const resolveXimalayaVisibleCrowdType = (
  visibleType?: VisibleTypeEnum,
  explicitValue?: number,
): number => {
  if (explicitValue !== undefined) return explicitValue;
  switch (visibleType) {
    case VisibleTypeEnum.private:
      return 1;
    case VisibleTypeEnum.friend:
      return 3;
    case VisibleTypeEnum.public:
    default:
      return 2;
  }
};

/** 喜马拉雅定时发布仅允许公开可见。 */
export const validateXimalayaScheduleVisibility = (
  prePubTime: number | undefined,
  visibleCrowdType: number,
): string | undefined => {
  if (Number(prePubTime) > Date.now() && visibleCrowdType !== 2) {
    return '喜马拉雅定时发布仅支持公开可见';
  }
  return undefined;
};

/** 统一创作声明 → 喜马拉雅“是否 AI 合成”。 */
export const resolveXimalayaIsAiTrack = (
  statement?: { type: StatementTypeEnum },
  explicitValue?: boolean,
): boolean => {
  if (explicitValue !== undefined) return explicitValue;
  return (
    statement?.type === StatementTypeEnum.AI创作声明 ||
    statement?.type === StatementTypeEnum.图片视频由AI生成
  );
};

type XimalayaAlbumRaw = {
  categoryId?: number | string;
  albumStatusInfo?: { isPublic?: boolean };
};

/** 校验专辑分类和公开状态，并提取最终请求使用的 albumId/categoryId。 */
export const resolveXimalayaAlbumForPublish = (
  album: ListItemInfo | undefined,
  legacyAlbumId: number | string | undefined,
  formCategoryId: number | string | undefined,
  visibleCrowdType: number,
): { albumId?: number | string; categoryId?: number | string; error?: string } => {
  if (!album) {
    if (legacyAlbumId !== undefined && legacyAlbumId !== null && String(legacyAlbumId).trim()) {
      return { error: '选择专辑时必须传入包含raw的album对象' };
    }
    return { categoryId: formCategoryId };
  }
  if (!album.yixiaoerId?.trim() || !album.raw || typeof album.raw !== 'object') {
    return { error: '专辑数据不完整，必须包含yixiaoerId和raw' };
  }
  const raw = album.raw as XimalayaAlbumRaw;
  if (raw.categoryId === undefined || raw.categoryId === null) {
    return { error: '专辑原始数据缺少categoryId' };
  }
  if (String(raw.categoryId) !== String(formCategoryId ?? '')) {
    return { error: '所选专辑分类必须与表单分类一致' };
  }
  if (raw.albumStatusInfo?.isPublic === false && visibleCrowdType !== 1) {
    return { error: '私密专辑下发布的音频必须设为私密' };
  }
  return { albumId: album.yixiaoerId, categoryId: raw.categoryId };
};

const getFileMd5 = async (filePath: string): Promise<string> => {
  const content = await fs.promises.readFile(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * 上传喜马拉雅媒体文件并返回 uploadId 与文件 URL。
 */
const uploadXimalayaFile = async (
  cookie: string,
  uid: number,
  filePath: string,
  uploadType: string,
  mimeType: string,
): Promise<{ uploadId: number; fileName: string; fileUrl?: string }> => {
  const stat = await fs.promises.stat(filePath);
  const fileName = path.basename(filePath);
  const extension = path.extname(fileName).replace('.', '').toLowerCase() || 'mp3';
  const traceId = createXimalayaUploadTraceId();
  const token = await getUploadTokenResponse(cookie, fileName, stat.size, traceId, uploadType);
  if (token.ret !== 0 || !token.token) {
    throw new Error(token.msg || '获取喜马拉雅上传凭证失败');
  }

  const totalParts = Math.ceil(stat.size / PART_SIZE);
  const fileMd5 = await getFileMd5(filePath);
  const ctxList: string[] = [];
  let multipartId = '';
  let serverIp = '';
  const handle = await fs.promises.open(filePath, 'r');
  try {
    for (let partNum = 0; partNum < totalParts; partNum++) {
      const start = partNum * PART_SIZE;
      const length = Math.min(PART_SIZE, stat.size - start);
      const chunk = Buffer.allocUnsafe(length);
      await handle.read(chunk, 0, length, start);
      const part = await uploadAudioData(
        cookie,
        chunk,
        fileName,
        stat.size,
        partNum,
        totalParts,
        // 真实上传链路仅首个分片携带文件 MD5，后续分片传空字符串。
        partNum === 0 ? fileMd5 : '',
        uid,
        token.token,
        traceId,
        multipartId,
        serverIp,
        uploadType,
        mimeType,
      );
      if (part.code !== '000000' || !part.data?.ctx) {
        throw new Error(part.message || `喜马拉雅音频第 ${partNum + 1} 分片上传失败`);
      }
      ctxList.push(part.data.ctx);
      multipartId = part.data.multipartId || multipartId;
      serverIp = part.data.serverIp || serverIp;
    }
  } finally {
    await handle.close();
  }

  const merged = await mergeXimalayaUpload(
    cookie,
    { uid, uploadType, fileSize: stat.size, fileExtName: extension, fileName, ctxList, multipartId },
    token.token,
    traceId,
    serverIp,
  );
  if (merged.code !== '000000' || !merged.data?.uploadId) {
    throw new Error(merged.message || '喜马拉雅音频合并失败');
  }
  return { uploadId: merged.data.uploadId, fileName, fileUrl: merged.data.freeFileUrl };
};

export const publishXimalayaAudio = async (
  cookie: string,
  task: XimalayaAudioTaskInput,
  event?: EventEmitter,
): Promise<XimalayaAudioPublishResultOutput> => {
  const progressEvent = event ?? new EventEmitter();
  let temporaryCoverPath = '';
  if (!task.audio?.localPath || !fs.existsSync(task.audio.localPath)) {
    return { code: errorCode.io_error, msg: '喜马拉雅音频文件不存在', taskId: task.taskId };
  }
  const visibleCrowdType = resolveXimalayaVisibleCrowdType(task.visibleType, task.visibleCrowdType);
  const visibilityError = validateXimalayaScheduleVisibility(task.prePubTime, visibleCrowdType);
  if (visibilityError) {
    return { code: errorCode.data_error, msg: visibilityError, taskId: task.taskId };
  }
  const album = resolveXimalayaAlbumForPublish(task.album, task.albumId, task.categoryId, visibleCrowdType);
  if (album.error) {
    return { code: errorCode.data_error, msg: album.error, taskId: task.taskId };
  }
  try {
    const user = await getXimalayaUserInfo(cookie);
    const uid = Number(user.yixiaoerId);
    if (user.code !== errorCode.ok || !Number.isFinite(uid)) {
      return { code: user.code || errorCode.notLogin, msg: user.msg || '喜马拉雅账号未登录', taskId: task.taskId };
    }
    const xmSign = task.xmSign || (await getXimalayaXmSign());
    const normalizedTags = normalizeXimalayaTags(task.tags, task.topics);
    SetProgressNewEvent(progressEvent, publishStatusEnum.uploading, '开始上传喜马拉雅音频', task.taskId);
    const uploaded = await uploadXimalayaFile(cookie, uid, task.audio.localPath, 'tingWebAudio', 'audio/mpeg');
    SetProgressNewEvent(progressEvent, publishStatusEnum.uploadSuccess, '喜马拉雅音频上传完成', task.taskId);
    let soundCoverPath = task.soundCoverPath;
    if (!soundCoverPath && task.cover?.localPath) {
      let coverPath = task.cover.localPath;
      if (isUrl(coverPath)) {
        const downloadedCover = await downloadFile(coverPath);
        const extension = downloadedCover.fileExtension || task.cover.format || 'jpeg';
        temporaryCoverPath = path.join(os.tmpdir(), `ximalaya-cover-${crypto.randomUUID()}.${extension}`);
        await fs.promises.writeFile(temporaryCoverPath, downloadedCover.buffer);
        coverPath = temporaryCoverPath;
      }
      if (!fs.existsSync(coverPath)) {
        return { code: errorCode.io_error, msg: '喜马拉雅封面文件不存在', taskId: task.taskId };
      }
      SetProgressNewEvent(progressEvent, publishStatusEnum.uploading, '开始上传喜马拉雅封面', task.taskId);
      const extension = path.extname(coverPath).replace('.', '').toLowerCase() || task.cover.format || 'jpeg';
      const cover = await uploadXimalayaFile(cookie, uid, coverPath, 'tingWebImage', `image/${extension}`);
      soundCoverPath = { fileId: cover.uploadId, fileUrl: cover.fileUrl };
      SetProgressNewEvent(progressEvent, publishStatusEnum.uploadSuccess, '喜马拉雅封面上传完成', task.taskId);
    }
    SetProgressNewEvent(progressEvent, publishStatusEnum.pushing, '正在创建喜马拉雅音频作品', task.taskId);
    const created = await createXimalayaAudio(cookie, {
      albumId: album.albumId,
      soundTitle: task.title,
      soundIntro: task.desc,
      soundRichIntro: task.soundRichIntro ?? task.desc,
      soundTags: normalizedTags.soundTags,
      soundCoverPath,
      soundFile: { fileId: uploaded.uploadId, fileName: uploaded.fileName },
      categoryId: album.categoryId,
      time: task.prePubTime,
      visibleCrowdType,
      isFree: task.isFree,
      isTrailer: task.isTrailer,
      trackVipFirst: task.trackVipFirst,
      isAiTrack: resolveXimalayaIsAiTrack(task.statement, task.isAiTrack),
      topicTags: normalizedTags.topicTags,
      lrcPath: task.lrcPath,
      anchorActivity: task.anchorActivity,
      communityWidget: task.communityWidget,
      activityId: task.activityId,
    }, xmSign);
    if (created.ret !== 0 || !created.data?.trackId) {
      return { code: created.ret || errorCode.data_error, msg: created.msg || '喜马拉雅音频创建失败', taskId: task.taskId };
    }
    SetProgressNewEvent(progressEvent, publishStatusEnum.pushSuccess, '喜马拉雅音频发布成功', task.taskId);
    return { code: errorCode.ok, msg: '发布成功', taskId: task.taskId, publishId: String(created.data.trackId) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    SetProgressNewEvent(progressEvent, publishStatusEnum.uploadFail, message, task.taskId);
    return { code: errorCode.data_error, msg: message, taskId: task.taskId };
  } finally {
    if (temporaryCoverPath) {
      await fs.promises.unlink(temporaryCoverPath).catch(() => undefined);
    }
  }
};
