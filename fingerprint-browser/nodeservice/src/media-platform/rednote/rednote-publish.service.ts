import { BaseSinglePublishTaskDynamic, BaseSinglePublishTaskVideo } from '@/cloud/model/BaseTaskFormModel';
import { ContentCreateTypeEnum, VisibleTypeEnum } from '@/cloud/model/TypeEnum';
import { HtmlDocument } from '@/htmlAgilityPack';
import { ImageInfo, ListItemInfo, PublishResult } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { IWebProxy } from '@/media-platform/webproxy';
import { Guid, htmlDecode, publishStatusEnum, SetProgressEvent, SetProgressNewEvent } from '@/utils';
import { EventEmitter } from 'events';
import { privateKey } from '@/utils/CancelToken';
import { REDNOTE_CREATOR_ORIGIN, RedNoteLocationInfo } from './rednote-location.service';
import { RedNoteMentionUserInfo } from './rednote-mention-user.service';
import { uploadRedNoteImageFromPath } from './rednote-image-upload.service';
import { redNoteSignedPostRaw } from './rednote-signed-request.service';
import { createRedNoteTopicResponse, RedNoteTopicInfo } from './rednote-topic.service';
import { uploadRedNoteVideoFromPath } from './rednote-video-upload.service';

export const REDNOTE_NOTE_PUBLISH_PATH = '/web_api/sns/v2/note';
export const REDNOTE_MAX_IMAGE_COUNT = 18;
export const REDNOTE_MAX_TOPIC_COUNT = 10;

export interface RedNoteDynamicPublishInput {
  taskId: string;
  title?: string;
  desc?: string;
  images: ImageInfo[];
  topics?: ListItemInfo[];
  mentionedUsers?: ListItemInfo[];
  postTime?: number;
  location?: RedNoteLocationInfo;
  visibilityType: 0 | 1 | 4;
  group?: ListItemInfo;
  statement?: {
    origin?: 1 | 2 | 3 | 4 | 5;
    photoInfo?: {
      photoPlace: { poiId: string; poiType: number; subname: string; name: string };
      photoTime: string;
    };
    repostInfo?: { source?: string };
  };
  isOriginal?: 0 | 1;
  proxy?: IWebProxy;
  cancelToken?: BaseSinglePublishTaskDynamic['cancelToken'];
}

export interface RedNoteVideoPublishInput extends Omit<RedNoteDynamicPublishInput, 'images'> {
  video: BaseSinglePublishTaskVideo['video'];
  cover: ImageInfo;
  needParts?: boolean;
}

interface RedNotePublishResponse {
  code?: number;
  result?: number;
  success?: boolean;
  msg?: string;
  data?: { id?: string };
}

interface RedNoteUploadedImage {
  fileId: string;
  width: number;
  height: number;
  mimeType: string;
  originSizeKb?: number;
}

interface RedNoteTag {
  id: string;
  name: string;
  link?: string;
  type: 'topic';
}

interface RedNoteAtUser {
  nickname: string;
  name: string;
  user_id: string;
}

const parseRaw = <T>(value?: string): T | undefined => {
  if (!value) return undefined;
  try {
    const decoded = htmlDecode(decodeURIComponent(value));
    const parsed = JSON.parse(decoded);
    return (parsed?.raw ?? parsed) as T;
  } catch {
    return undefined;
  }
};

const resolveTopic = async (
  cookie: string,
  raw: string | undefined,
  text: string,
): Promise<RedNoteTopicInfo | undefined> => {
  const existing = parseRaw<RedNoteTopicInfo>(raw);
  if (existing?.id && existing?.name) return existing;
  if (!text.trim()) return undefined;
  const created = await createRedNoteTopicResponse(cookie, text.trim());
  const topic = created.data?.topic_infos?.[0];
  return topic?.id && topic?.name ? topic : undefined;
};

const buildContent = async (
  cookie: string,
  input: RedNoteDynamicPublishInput,
): Promise<{ desc: string; tags: RedNoteTag[]; ats: RedNoteAtUser[] }> => {
  let desc = input.desc ?? '';
  const tags: RedNoteTag[] = [];
  const ats: RedNoteAtUser[] = [];

  if (desc.includes('<p') && desc.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(desc);
    const paragraphs = html.DocumentNode.SelectNodes('//p') ?? [];
    const topicNodes = [
      ...(html.DocumentNode.SelectNodes('//topic') ?? []),
      ...(html.DocumentNode.SelectNodes('//activity') ?? []),
    ];
    for (const node of topicNodes) {
      if (tags.length >= REDNOTE_MAX_TOPIC_COUNT) {
        node.parentNode?.removeChild(node);
        continue;
      }
      const topic = await resolveTopic(
        cookie,
        node.getAttribute('raw') ?? undefined,
        htmlDecode(node.getAttribute('text') ?? node.textContent ?? '').replace(/^#/, ''),
      );
      if (!topic) {
        node.parentNode?.removeChild(node);
        continue;
      }
      node.textContent = ` #${topic.name}[话题]# `;
      tags.push({ id: topic.id, name: topic.name, link: topic.link, type: 'topic' });
    }

    for (const node of html.DocumentNode.SelectNodes('//friend') ?? []) {
      const user = parseRaw<RedNoteMentionUserInfo>(node.getAttribute('raw') ?? undefined);
      if (!user?.user_id || !user?.user_nickname) continue;
      node.textContent = ` @${user.user_nickname}`;
      ats.push({ nickname: user.user_nickname, name: user.user_nickname, user_id: user.user_id });
    }
    desc = htmlDecode(paragraphs.map((paragraph) => (paragraph.textContent ?? '').trim()).join('\n'));
  } else {
    for (const item of (input.topics ?? []).slice(0, REDNOTE_MAX_TOPIC_COUNT)) {
      const topic = (item.raw ?? {}) as RedNoteTopicInfo;
      const id = topic.id ?? item.yixiaoerId;
      const name = topic.name ?? item.yixiaoerName;
      if (!id || !name) continue;
      tags.push({ id, name, link: topic.link, type: 'topic' });
      desc += ` #${name}[话题]#`;
    }
    for (const item of input.mentionedUsers ?? []) {
      const user = (item.raw ?? {}) as RedNoteMentionUserInfo;
      const userId = user.user_id ?? item.yixiaoerId;
      const name = user.user_nickname ?? item.yixiaoerName;
      if (!userId || !name) continue;
      ats.push({ nickname: name, name, user_id: userId });
      desc += ` @${name}`;
    }
  }
  return { desc, tags, ats };
};

export const buildRedNoteDynamicPostData = async (
  cookie: string,
  input: RedNoteDynamicPublishInput,
  uploadedImages: RedNoteUploadedImage[],
): Promise<string> => {
  const content = await buildContent(cookie, input);
  const location = input.location?.name
    ? {
        poi_id: input.location.poi_id,
        poi_type: input.location.poi_type ?? 0,
        name: input.location.name,
        subname: input.location.full_address ?? input.location.city_name ?? '',
      }
    : null;
  const groupBind = input.group?.yixiaoerId
    ? {
        groupId: input.group.yixiaoerId,
        groupName: input.group.yixiaoerName,
        desc: input.group.yixiaoerDesc,
        avatar: input.group.yixiaoerImageUrl,
      }
    : {};
  const optionRelationList =
    input.isOriginal === 1
      ? [
          {
            type: 'ORIGINAL_STATEMENT',
            relationList: [
              { bizType: 'ORIGINAL_STATEMENT', bizId: Guid.NewGuid().toString(), extraInfo: '{}' },
            ],
          },
        ]
      : [];
  const businessBinds: Record<string, unknown> = {
    version: 1,
    noteId: 0,
    bizType: 0,
    noteOrderBind: { brandAccountId: '', orderId: '' },
    groupBind,
    notePostTiming: { postTime: input.postTime ?? 0 },
    // RedNote 抓包中要求这些空占位；服务本身不开放合集能力。
    noteCollectionBind: { id: '' },
    noteSketchCollectionBind: { id: '' },
    coProduceBind: { enable: true },
    noteCopyBind: { copyable: true },
    interactionPermissionBind: { commentPermission: 0 },
    optionRelationList,
  };
  if (input.statement?.origin) businessBinds.userDeclarationBind = input.statement;

  return JSON.stringify({
    common: {
      type: 'normal',
      title: input.title ?? '',
      note_id: '',
      desc: content.desc,
      source: JSON.stringify({ type: 'web', ids: '', extraInfo: JSON.stringify({ systemId: 'web' }) }),
      business_binds: JSON.stringify(businessBinds),
      ats: content.ats,
      hash_tag: content.tags,
      post_loc: location,
      privacy_info: { op_type: 1, type: input.visibilityType, user_ids: [] },
      // 官方请求要求空商品结构，但本服务不接收、转换或挂载任何商品。
      goods_info: {},
      biz_relations: [],
      capa_trace_info: {
        contextJson: JSON.stringify({
          recommend_title: { recommend_title_id: '', is_use: 3, used_index: -1 },
          recommendTitle: [],
          recommend_topics: {
            used: content.tags.map((topic) => ({
              id: topic.id,
              name: topic.name,
              topic_source: 'recommend_exposed_display',
            })),
          },
        }),
      },
    },
    image_info: {
      images: uploadedImages.map((image) => ({
        file_id: image.fileId,
        height: image.height,
        width: image.width,
        extra_info_json: JSON.stringify({
          mimeType: image.mimeType,
          image_metadata: { bg_color: '', origin_size: image.originSizeKb ?? 0 },
        }),
        metadata: { source: -1 },
        stickers: { floating: [], version: 2 },
      })),
    },
    video_info: null,
  });
};

export const publishRedNoteDynamic = async (
  cookie: string,
  input: RedNoteDynamicPublishInput,
  event: EventEmitter,
  retryTimes: number = 3,
): Promise<PublishResult> => {
  const result: PublishResult = { code: errorCode.unknown_error, msg: '', taskId: input.taskId };
  try {
    if (!input.images?.length) throw new Error('最少需要一张图片');
    if (input.images.length > REDNOTE_MAX_IMAGE_COUNT) throw new Error(`RedNote最多支持${REDNOTE_MAX_IMAGE_COUNT}张图片`);
    input.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(event, publishStatusEnum.uploading, '开始发布', input.taskId);
    SetProgressEvent(event, 1, '准备上传图片', input.taskId);

    const uploadedImages: RedNoteUploadedImage[] = [];
    for (let index = 0; index < input.images.length; index++) {
      input.cancelToken?.throwIfCancelled(privateKey);
      const image = input.images[index];
      SetProgressEvent(event, 5 + (80 / input.images.length) * index, '图片上传中', input.taskId);
      let lastError: unknown;
      for (let retry = 0; retry < retryTimes; retry++) {
        try {
          // 任务代理仅用于最终提交发布请求。
          const uploaded = await uploadRedNoteImageFromPath(cookie, image.pathOrUrl);
          uploadedImages.push({
            fileId: uploaded.fileId,
            width: image.width ?? 4096,
            height: image.height ?? 4096,
            mimeType: image.format?.startsWith('image/') ? image.format : `image/${image.format ?? 'png'}`,
            originSizeKb: image.size ? image.size / 1024 : undefined,
          });
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) throw lastError;
    }

    SetProgressNewEvent(event, publishStatusEnum.uploadSuccess, '上传完成', input.taskId);
    SetProgressNewEvent(event, publishStatusEnum.pushing, '推送中', input.taskId);
    SetProgressEvent(event, 95, '正在推送数据', input.taskId);
    const body = await buildRedNoteDynamicPostData(cookie, input, uploadedImages);
    input.cancelToken?.throwIfCancelled(privateKey);
    const response = await redNoteSignedPostRaw<RedNotePublishResponse>(cookie, REDNOTE_NOTE_PUBLISH_PATH, body, {
      proxy: input.proxy,
      referer: `${REDNOTE_CREATOR_ORIGIN}/`,
      headers: { Origin: REDNOTE_CREATOR_ORIGIN },
    });
    result.code = response.result ?? response.code ?? errorCode.unknown_error;
    result.msg = response.msg ?? '';
    result.publishId = response.data?.id;
    if (result.code === 0 && result.publishId) {
      SetProgressNewEvent(event, publishStatusEnum.pushSuccess, '推送成功', input.taskId);
      SetProgressEvent(event, 100, '发布成功', input.taskId);
      return result;
    }
    result.code = result.code === 0 ? errorCode.unknown_error : result.code;
    result.msg = `发布失败${result.msg}`;
    SetProgressNewEvent(event, publishStatusEnum.pushFail, result.msg, input.taskId);
    SetProgressEvent(event, 100, '发布失败', input.taskId);
  } catch (error) {
    result.code = error instanceof Error ? errorCode.data_error : errorCode.unknown_error;
    result.msg = error instanceof Error ? error.message : String(error ?? 'RedNote发布失败');
    SetProgressNewEvent(event, publishStatusEnum.pushFail, result.msg, input.taskId);
    SetProgressEvent(event, 100, '发布失败', input.taskId);
  }
  return result;
};

export const buildRedNoteVideoPostData = async (
  cookie: string,
  input: RedNoteVideoPublishInput,
  videoFileId: string,
  coverFileId: string,
): Promise<string> => {
  const content = await buildContent(cookie, { ...input, images: [] });
  const location = input.location?.name
    ? {
        poi_id: input.location.poi_id,
        poi_type: input.location.poi_type ?? 0,
        name: input.location.name,
        subname: input.location.full_address ?? input.location.city_name ?? '',
      }
    : null;
  const optionRelationList =
    input.isOriginal === 1
      ? [{ type: 'ORIGINAL_STATEMENT', relationList: [{ bizType: 'ORIGINAL_STATEMENT', bizId: Guid.NewGuid().toString(), extraInfo: '{}' }] }]
      : [];
  const businessBinds: Record<string, unknown> = {
    version: 1,
    noteId: 0,
    bizType: 13,
    noteOrderBind: { brandAccountId: '', orderId: '' },
    groupBind: input.group?.yixiaoerId
      ? { groupId: input.group.yixiaoerId, groupName: input.group.yixiaoerName, desc: input.group.yixiaoerDesc, avatar: input.group.yixiaoerImageUrl }
      : {},
    notePostTiming: { postTime: input.postTime ?? 0 },
    noteCollectionBind: { id: '' },
    noteSketchCollectionBind: { id: '' },
    coProduceBind: { enable: true },
    noteCopyBind: { copyable: true },
    interactionPermissionBind: { commentPermission: 0 },
    optionRelationList,
  };
  if (input.statement?.origin) businessBinds.userDeclarationBind = input.statement;
  const videoWidth = input.video.width;
  const videoHeight = input.video.height;
  const videoDuration = input.video.duration;
  const mediaDuration = Math.round(videoDuration * 1000);
  const videoMetadata = {
    bitrate: 0,
    colour_primaries: 'BT.709',
    duration: mediaDuration,
    format: 'AVC',
    frame_rate: 30,
    height: videoHeight,
    matrix_coefficients: 'BT.709',
    rotation: 0,
    transfer_characteristics: 'BT.709',
    width: videoWidth,
  };
  const audioMetadata = {
    bitrate: 0,
    channels: 1,
    duration: mediaDuration,
    format: 'AAC',
    sampling_rate: 0,
  };
  const cover = {
    file_id: coverFileId,
    fileid: coverFileId,
    width: input.cover.width ?? videoWidth,
    height: input.cover.height ?? videoHeight,
    frame: { ts: 0, is_user_select: false, is_upload: true },
    stickers: { neptune: [], version: 2 },
    fonts: [],
    extra_info_json: '{}',
  };
  return JSON.stringify({
    common: {
      type: 'video',
      title: input.title ?? '',
      note_id: '',
      desc: content.desc,
      source: JSON.stringify({ type: 'web', ids: '', extraInfo: JSON.stringify({ systemId: 'web' }) }),
      business_binds: JSON.stringify(businessBinds),
      ats: content.ats,
      hash_tag: content.tags,
      post_loc: location,
      privacy_info: { op_type: 1, type: input.visibilityType, user_ids: [] },
      goods_info: {},
      biz_relations: [],
      capa_trace_info: {
        contextJson: JSON.stringify({
          recommend_title: { recommend_title_id: '', is_use: 3, used_index: -1 },
          recommendTitle: [],
          recommend_topics: {
            used: content.tags.map((topic) => ({
              id: topic.id,
              name: topic.name,
              topic_source: 'recommend',
            })),
          },
        }),
      },
    },
    image_info: null,
    video_info: {
      file_id: videoFileId,
      fileid: videoFileId,
      format_width: videoWidth,
      format_height: videoHeight,
      video_preview_type: videoWidth / videoHeight <= 0.6 ? 'full_vertical_screen' : '',
      composite_metadata: {
        video: videoMetadata,
        audio: audioMetadata,
      },
      timelines: [],
      cover,
      chapters: [],
      chapter_sync_text: false,
      segments: {
        count: 1,
        need_slice: false,
        items: [
          {
            mute: 0,
            speed: 1,
            start: 0,
            duration: videoDuration,
            transcoded: 0,
            media_source: 1,
            original_metadata: { video: videoMetadata, audio: audioMetadata },
          },
        ],
      },
      entrance: 'web',
      pk_cover_biz_relations: [],
    },
  });
};

export const publishRedNoteVideo = async (
  cookie: string,
  input: RedNoteVideoPublishInput,
  event: EventEmitter,
): Promise<PublishResult> => {
  const result: PublishResult = { code: errorCode.unknown_error, msg: '', taskId: input.taskId };
  try {
    if (!input.video?.localPath) throw new Error('RedNote视频文件不能为空');
    if (!input.cover?.pathOrUrl) throw new Error('RedNote视频封面不能为空');
    input.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(event, publishStatusEnum.uploading, '开始发布', input.taskId);
    // 凭证申请及素材上传不使用任务代理，与小红书发布流程保持一致。
    const video = await uploadRedNoteVideoFromPath(cookie, input.video.localPath, undefined, 3, (uploaded, total) => {
      SetProgressNewEvent(event, publishStatusEnum.uploading, '视频上传中', input.taskId, total, uploaded, input.needParts === true);
    });
    input.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(event, 90, '封面上传中', input.taskId);
    const cover = await uploadRedNoteImageFromPath(cookie, input.cover.pathOrUrl);
    SetProgressNewEvent(event, publishStatusEnum.uploadSuccess, '上传完成', input.taskId);
    SetProgressNewEvent(event, publishStatusEnum.pushing, '推送中', input.taskId);
    const body = await buildRedNoteVideoPostData(cookie, input, video.fileId, cover.fileId);
    input.cancelToken?.throwIfCancelled(privateKey);
    const response = await redNoteSignedPostRaw<RedNotePublishResponse>(cookie, REDNOTE_NOTE_PUBLISH_PATH, body, {
      proxy: input.proxy,
      referer: `${REDNOTE_CREATOR_ORIGIN}/`,
      headers: { Origin: REDNOTE_CREATOR_ORIGIN },
    });
    result.code = response.result ?? response.code ?? errorCode.unknown_error;
    result.msg = response.msg ?? '';
    result.publishId = response.data?.id;
    if (result.code === 0 && result.publishId) {
      SetProgressNewEvent(event, publishStatusEnum.pushSuccess, '推送成功', input.taskId);
      SetProgressEvent(event, 100, '发布成功', input.taskId);
      return result;
    }
    result.code = result.code === 0 ? errorCode.unknown_error : result.code;
    result.msg = `发布失败${result.msg}`;
  } catch (error) {
    result.code = error instanceof Error ? errorCode.data_error : errorCode.unknown_error;
    result.msg = error instanceof Error ? error.message : String(error ?? 'RedNote视频发布失败');
  }
  SetProgressNewEvent(event, publishStatusEnum.pushFail, result.msg, input.taskId);
  SetProgressEvent(event, 100, '发布失败', input.taskId);
  return result;
};

export const toRedNoteDynamicPublishInput = (task: BaseSinglePublishTaskDynamic): RedNoteDynamicPublishInput => {
  const statement = task.statement as BaseSinglePublishTaskDynamic['statement'] & {
    forward_source?: string;
    photoInfo?: { address?: ListItemInfo; time?: number };
  };
  const input: RedNoteDynamicPublishInput = {
    taskId: task.taskId,
    title: task.title,
    desc: task.desc,
    images: task.images,
    topics: (task as BaseSinglePublishTaskDynamic & { topics?: ListItemInfo[] }).topics,
    mentionedUsers: (task as BaseSinglePublishTaskDynamic & { mentionedUser?: ListItemInfo[] }).mentionedUser,
    postTime: task.prePubTime,
    location: task.location?.raw as RedNoteLocationInfo | undefined,
    visibilityType:
      task.visibleType === VisibleTypeEnum.private ? 1 : task.visibleType === VisibleTypeEnum.friend ? 4 : 0,
    group: task.group,
    isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,
    proxy: task.proxy,
    cancelToken: task.cancelToken,
  };
  const statementType = statement?.type as number | undefined;
  if (statementType) {
    input.statement = { origin: statementType as 1 | 2 | 3 | 4 | 5 };
    if (statementType === 5) input.statement.repostInfo = { source: statement.forward_source };
    if (statementType === 4 && statement.photoInfo?.address?.yixiaoerId && statement.photoInfo.time) {
      const date = new Date(statement.photoInfo.time);
      input.statement.photoInfo = {
        photoPlace: {
          poiId: statement.photoInfo.address.yixiaoerId,
          poiType: 12,
          subname: statement.photoInfo.address.yixiaoerDesc ?? '',
          name: statement.photoInfo.address.yixiaoerName,
        },
        photoTime: date.toISOString().slice(0, 10),
      };
    }
  }
  return input;
};

export const toRedNoteVideoPublishInput = (task: BaseSinglePublishTaskVideo): RedNoteVideoPublishInput => {
  const common = toRedNoteDynamicPublishInput({
    ...task,
    images: [],
  } as BaseSinglePublishTaskDynamic);
  return {
    ...common,
    video: task.video,
    cover: task.covers[0],
    needParts: task.needParts,
  };
};
