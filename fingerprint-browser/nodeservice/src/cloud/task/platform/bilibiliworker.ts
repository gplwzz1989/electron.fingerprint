import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import {
  Bilibili,
  BilibiliArticleTaskInput,
  BilibiliVideoParticipationTopicQuery,
  BilibiliVideoCategoryInfo,
  BilibiliVideoTaskInput,
  ListInfoResponse,
  ListItemInfo,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  UserCanPublishNum,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { convertCookieStr } from '@/utils';
import { BaseResult } from '../../../media-platform/baseResult';
import { BiLiBiLiStatementType } from '@/platform-body/video';
import { IWebProxy } from '../../../media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';
import { LocationTypePrivilege } from '@/cloud/model/SearchDataModel';

const toNonNegativeInteger = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
};

const toQueryId = (value: unknown): string | number | undefined =>
  typeof value === 'string' || typeof value === 'number' ? value : undefined;

const getQueryValue = (args: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (args[key] !== undefined && args[key] !== null) {
      return args[key];
    }
  }
  return undefined;
};

const buildParticipationTopicQuery = (
  categoryId?: string,
  args?: object,
  keyWord?: string,
): BilibiliVideoParticipationTopicQuery => {
  const queryArgs = (args ?? {}) as Record<string, unknown>;
  const pageNum = toNonNegativeInteger(getQueryValue(queryArgs, 'pageNum', 'pn', 'nextPage'));
  const pageSize = toNonNegativeInteger(getQueryValue(queryArgs, 'pageSize', 'ps'));
  const offset = toNonNegativeInteger(getQueryValue(queryArgs, 'offset'));
  const title = getQueryValue(queryArgs, 'title');
  const platform = getQueryValue(queryArgs, 'platform');
  const trackId = getQueryValue(queryArgs, 'trackId', 'track_id');
  const uploadId = getQueryValue(queryArgs, 'uploadId', 'upload_id');
  const zipUrl = getQueryValue(queryArgs, 'zipUrl', 'zip_url');

  return {
    categoryId: toQueryId(getQueryValue(queryArgs, 'categoryId', 'type_id') ?? categoryId),
    parentCategoryId: toQueryId(getQueryValue(queryArgs, 'parentCategoryId', 'type_pid')),
    pageNum,
    pageSize,
    offset,
    title: typeof title === 'string' ? title : undefined,
    trackId: typeof trackId === 'string' ? trackId : undefined,
    uploadId: typeof uploadId === 'string' ? uploadId : undefined,
    zipUrl: typeof zipUrl === 'string' ? zipUrl : undefined,
    platform: typeof platform === 'string' ? platform : undefined,
    keyWord,
  };
};

export class BiliBiliWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Bilibili.getBilibiliUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re.code === -101 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: BilibiliVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        cover: task.covers[0],
        title: task.title,
        desc: task.desc,
        copyright:
          task.createType == ContentCreateTypeEnum.original
            ? 1
            : task.createType == ContentCreateTypeEnum.forward
            ? 2
            : undefined,
        source: task.contentSourceUrl ?? '',
        no_reprint: 1,
        open_elec: 0,
        tags: task.tags,
        participationTopic: (task.participationTopic ?? task.activity) as BilibiliVideoTaskInput['participationTopic'],
        tid: task.subCategory?.yixiaoerId ? parseInt(task.subCategory.yixiaoerId) : 21,
        up_close_danmu: false,
        up_close_reply: false,
        up_selection_reply: false,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      //合集
      if ((task.collection as ListItemInfo)?.yixiaoerId) {
        taskData.collection = task.collection as ListItemInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.dtime = parseInt((task.prePubTime / 1000).toFixed(0));
      }
      //分类,新版没有二级分类
      if (task.category && !task.subCategory) {
        taskData.category = task.category?.raw as BilibiliVideoCategoryInfo;
      }
      //作者申明
      if (task.statement?.type) {
        const bilibiliStatementTypeMap = {
          // 0: '不声明',
          1: '作者声明：该视频使用人工智能合成技术',
          2: '作者声明：视频内含有危险行为，请勿轻易模仿',
          3: '作者声明：该内容仅供娱乐，请勿过分解读',
          4: '作者声明：该内容可能引人不适，请谨慎选择观看',
          5: '作者声明：请理性适度消费',
          6: '作者声明：个人观点，仅供参考',
        };
        const type = task.statement.type as BiLiBiLiStatementType;
        taskData.neutral_mark = bilibiliStatementTypeMap[type];
      }
      const re = await Bilibili.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: BilibiliArticleTaskInput = {
        cancelToken: task.cancelToken,

        taskId: task.taskId,

        pubType: task.pubType ?? 1,

        title: task.title,

        covers: task.covers,

        content: task.content,

        publishTime: task.prePubTime,

        firstCategoryId: 0,
        secondCategoryId: 0,

        tags: task.tags,

        original: task.createType === ContentCreateTypeEnum.original ? 1 : 0,

        proxy: task.proxy,
      };

      if (task.category || task.subCategory) {
        taskData.firstCategoryId = parseInt(task.category?.yixiaoerId ?? '0');
        taskData.secondCategoryId = parseInt(task.subCategory?.yixiaoerId ?? '0');
      }

      return this.checkResult(await Bilibili.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    }
  }

  public async checkAuditStatus(publishId: string, publishType: PubContentEnum): Promise<AuditResult | undefined> {
    switch (publishType) {
      case PubContentEnum.video:
        return this.checkResult(await Bilibili.getBilibiliVideoStatus(this.cookies, publishId)) as AuditResult;
      case PubContentEnum.article:
        return this.checkResult(await Bilibili.getBilibiliArticleStatus(this.cookies, publishId)) as AuditResult;
      default:
        return { code: 444, msg: '不支持的发布类型', publishId: publishId };
    }
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    if (contentType === PubContentEnum.article) {
      return this.checkResult(await Bilibili.deleteBiLiBiLiArticleContent(this.cookies, docId));
    } else {
      return { code: 444, msg: '暂不支持' };
    }
  }

  public refreshCookie(cookie: string, localStorage?: object) {
    this.cookies = convertCookieStr(cookie, 'bilibili.com');
    this.localStorage = localStorage;
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === 'video'
        ? await Bilibili.getBilibiliVideoCategory(this.cookies)
        : await Bilibili.getBilibiliArticleCategory(this.cookies),
    );
  }

  public async searchTopic(
    keyWord: string,
    contentType: PubContentEnum,
    categoryId?: string,
  ): Promise<ListInfoResponse | undefined> {
    const cid = parseInt(categoryId ?? '0');
    return this.checkResult(await Bilibili.getBilibiliVideoTopic(this.cookies, cid ? cid : 0, keyWord));
  }

  /**
   * 获取B站视频发布页推荐的参与话题，不使用普通话题接口。
   */
  public async getParticipationTopicList(
    contentType?: PubContentEnum,
    categoryId?: string,
    args?: object,
  ): Promise<ListInfoResponse | undefined> {
    if (contentType && contentType !== PubContentEnum.video) {
      return { code: 445, msg: 'B站参与话题仅支持视频', dataList: [] };
    }
    return this.checkResult(
      await Bilibili.getBilibiliVideoParticipationTopic(this.cookies, buildParticipationTopicQuery(categoryId, args)),
    );
  }

  /**
   * 搜索B站视频发布页可参与的话题，不使用普通话题接口。
   */
  public async searchParticipationTopic(
    keyWord: string,
    contentType: PubContentEnum,
    categoryId?: string,
    args?: object,
  ): Promise<ListInfoResponse | undefined> {
    if (contentType && contentType !== PubContentEnum.video) {
      return { code: 445, msg: 'B站参与话题仅支持视频', dataList: [] };
    }
    return this.checkResult(
      await Bilibili.getBilibiliVideoParticipationTopic(
        this.cookies,
        buildParticipationTopicQuery(categoryId, args, keyWord),
      ),
    );
  }

  /**
   * 兼容现有“活动”查询流程：B站这里的活动列表实际指参与话题，
   * 与 searchTopic 对应的普通话题保持独立。
   */
  public async getActivityList(
    contentType?: PubContentEnum,
    categoryId?: string,
    keyWord?: string,
    args?: object,
  ): Promise<ListInfoResponse> {
    if (keyWord?.trim()) {
      return (await this.searchParticipationTopic(
        keyWord,
        contentType ?? PubContentEnum.video,
        categoryId,
        args,
      )) as ListInfoResponse;
    }
    return (await this.getParticipationTopicList(contentType, categoryId, args)) as ListInfoResponse;
  }

  public async checkUserCanPublishNum(
    createType: PubContentEnum,
    proxy?: IWebProxy,
  ): Promise<UserCanPublishNum | undefined> {
    const result = {
      code: 0,
      msg: '',
      data: { remain_dynamic_num: 1, remain_video_num: 1, remain_total_num: 1, remain_article_num: 1 },
    };

    if (createType == PubContentEnum.article) {
      let re = this.userInfo;
      if (!re?.yixiaoerId) {
        re = await this.getUserInfo(proxy);
      }
      if (re?.raw && re?.raw['level_info'] && re.raw['level_info']['current_level'] > 0) {
        return this.checkResult(result) as never;
      } else {
        return this.checkResult({
          code: re?.code ?? -1,
          msg: re?.msg,
          data: {
            remain_article_num: 0,
            remain_total_num: 1,
            remain_video_num: 1,
            remain_dynamic_num: 1,
            msg: '等级需要达到lv1才能发布专栏',
          },
        }) as never;
      }
    } else {
      return this.checkResult(result) as never;
    }
  }

  public async getCollectionList(contentType?: PubContentEnum): Promise<BaseResult> {
    return this.checkResult(await Bilibili.getBilibiliCollection(this.cookies));
  }

  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    const priviRe = await Bilibili.checkBilibiliCollectionEquity(this.cookies);
    return this.checkResult({
      code: priviRe?.code ?? -1,
      msg: priviRe?.msg,
      collection_permission: priviRe?.hasEquity ?? false,
    } as never) as never;
  }
}
