import { BaseSinglePublishTask, BaseSinglePublishTaskAudio } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { ListInfoResponse, ListLevelInfoResponse, PlatformAuthorInfo, PublishResult } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { BaseResult } from '@/media-platform/baseResult';
import { Ximalaya } from '@/media-platform/ximalaya';
import { IWebProxy } from '@/media-platform/webproxy';

/** 喜马拉雅音频发布 Worker。视频发布将在拿到对应协议后接入。 */
export class XimalayaWorker extends BaseWorker {
  public async getUserInfo(_proxy?: IWebProxy): Promise<PlatformAuthorInfo> {
    return Ximalaya.getXimalayaUserInfo(this.cookies);
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse> {
    if (contentType !== PubContentEnum.audio) {
      return { code: 444, msg: '喜马拉雅当前仅支持音频发布', dataList: [] };
    }
    return Ximalaya.getXimalayaCategory(this.cookies);
  }

  public async searchTopic(
    keyWord: string,
    contentType: PubContentEnum,
    categoryId?: string,
  ): Promise<ListInfoResponse> {
    if (contentType !== PubContentEnum.audio) {
      return { code: 444, msg: '喜马拉雅当前仅支持音频话题搜索', dataList: [] };
    }
    if (!categoryId?.trim() || !keyWord?.trim()) {
      return { code: errorCode.data_error, msg: 'categoryId和keyword不能为空', dataList: [] };
    }
    return Ximalaya.searchTopic(this.cookies, categoryId, keyWord);
  }

  /** 将喜马拉雅专辑作为音频发布的合集列表对外提供。 */
  public async getCollectionList(contentType?: PubContentEnum, args?: object): Promise<BaseResult> {
    if (contentType && contentType !== PubContentEnum.audio) {
      return { code: 444, msg: '喜马拉雅当前仅支持音频专辑查询' };
    }
    const query = (args ?? {}) as { page?: number; pageNo?: number; pageSize?: number; keyword?: string; kw?: string };
    const page = Number(query.page ?? query.pageNo ?? 1);
    const pageSize = Number(query.pageSize ?? 10);
    const keyword = String(query.keyword ?? query.kw ?? '');
    return Ximalaya.getXimalayaAlbum(
      this.cookies,
      Number.isFinite(page) && page > 0 ? page : 1,
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
      keyword,
    );
  }

  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult> {
    if (taskDataIn.publishType !== PubContentEnum.audio) {
      return { code: 444, msg: '喜马拉雅当前仅支持音频发布', taskId: taskDataIn.taskId };
    }
    const task = taskDataIn as BaseSinglePublishTaskAudio;
    return Ximalaya.publishAudio(
      this.cookies,
      {
        taskId: task.taskId,
        audio: { localPath: task.audio.localPath ?? '', size: task.audio.size, duration: task.audio.duration },
        title: task.title,
        desc: task.desc,
        soundRichIntro: task.soundRichIntro,
        album: task.album,
        albumId: task.albumId,
        categoryId: task.categoryId,
        soundCoverPath: task.soundCoverPath,
        tags: task.tags,
        topics: task.topics,
        prePubTime: task.prePubTime,
        visibleCrowdType: task.visibleCrowdType,
        visibleType: task.visibleType,
        isFree: task.isFree,
        isTrailer: task.isTrailer,
        trackVipFirst: task.trackVipFirst,
        statement: task.statement,
        isAiTrack: task.isAiTrack,
        lrcPath: task.lrcPath,
        anchorActivity: task.anchorActivity,
        communityWidget: task.communityWidget,
        activityId: task.activityId,
        cover: task.cover?.pathOrUrl
          ? { localPath: task.cover.pathOrUrl, format: task.cover.format }
          : task.covers?.[0]?.pathOrUrl
            ? { localPath: task.covers[0].pathOrUrl, format: task.covers[0].format }
            : undefined,
        xmSign: task.xmSign,
      },
      this.event,
    );
  }
}
