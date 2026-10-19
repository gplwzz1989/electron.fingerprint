import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
  StatementTypeEnum,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import {
  ActivityItemInfo,
  Baijiahao,
  BaijiahaoLocationItem,
  BaijiahaoVideoTaskInput,
  Douyin,
  ListInfoResponse,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  UserCanPublishNum,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaijiahaoMiniVideoTaskInput } from '../../../media-platform/baijiahao/baijiahao-mini-video';
import { BaijiahaoArticleTaskInput } from '@/media-platform/baijiahao/baijiahao-article';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { BaiJiaHaoDynamicTaskInput } from '../../../media-platform/baijiahao/baijiahao-dynamic';
import { errorCode } from '@/media-platform/errorCode';

type BaiJiaHaoVideoStatementInput = NonNullable<BaseSinglePublishTaskVideo['statement']> & {
  subType?: number;
};

const baiJiaHaoVideoPublishStatementMask = 1 | 2 | 4 | 8 | 16 | 32;
const baiJiaHaoVideoPublishStatementSubMask = 1 | 2 | 4 | 8;

export class BaiJiaHaoWorker extends BaseWorker {
  protected baseToken: string = '';
  private checkResult(re: BaseResult): BaseResult {
    if (re.code === 10001401 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  private normalizeBaijiahaoVideoPublishStatement(value?: number): number | undefined {
    if (!Number.isInteger(value) || (value ?? 0) <= 0) {
      return undefined;
    }
    const statementValue = value as number;
    let normalizedValue = statementValue & baiJiaHaoVideoPublishStatementMask;
    if (!normalizedValue) {
      return undefined;
    }
    if (normalizedValue !== 1 && (normalizedValue & 1) === 1) {
      normalizedValue &= ~1;
    }
    return normalizedValue || 1;
  }

  private normalizeBaijiahaoVideoPublishStatementSub(value?: number): number {
    if (!Number.isInteger(value) || (value ?? 0) <= 0) {
      return 0;
    }
    return (value as number) & baiJiaHaoVideoPublishStatementSubMask;
  }

  private getBaijiahaoVideoStatement(statement?: BaseSinglePublishTaskVideo['statement']): {
    isAigc: boolean;
    statementType: number;
    statementSubType: number;
  } {
    const currentStatement = statement as BaiJiaHaoVideoStatementInput | undefined;
    const publishStatementSub = this.normalizeBaijiahaoVideoPublishStatementSub(currentStatement?.subType);
    const statementType = currentStatement?.type;

    if (statementType == null || statementType === StatementTypeEnum.不声明) {
      return {
        isAigc: false,
        statementType: 1,
        statementSubType: publishStatementSub,
      };
    }

    // 兼容历史任务：旧值 1/2 都按 AI 声明处理，最终推送给百家号为 2
    if (statementType === StatementTypeEnum.AI创作声明 || statementType === StatementTypeEnum.图片视频由AI生成) {
      return {
        isAigc: true,
        statementType: 2,
        statementSubType: publishStatementSub,
      };
    }

    const normalizedStatementType = this.normalizeBaijiahaoVideoPublishStatement(statementType);
    return {
      isAigc: normalizedStatementType === 2,
      statementType: normalizedStatementType ?? 1,
      statementSubType: publishStatementSub,
    };
  }
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Baijiahao.getBaijiahaoUserInfo(this.cookies, proxy);
    if (this.userInfo?.code === 10001401 || this.userInfo?.msg?.includes('登录')) {
      this.userInfo.code = errorCode.loginExpire;
    }
    return this.userInfo;
  }

  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      if (true) {
        //TODO 转换补充数据位发布接口所需的数据
        const statementData = this.getBaijiahaoVideoStatement(task.statement);
        const verticalCover = task.verticalCovers?.[0] ?? task.verticalCover;
        const taskData: BaijiahaoVideoTaskInput = {
          taskId: task.taskId,
          video: task.video,
          isAppContent: task.isAppContent === true,
          cover: {
            width: task.covers[0].width ?? 0,
            height: task.covers[0].height ?? 0,
            pathOrUrl: task.covers[0].pathOrUrl ?? '',
            size: task.covers[0].size ?? 0,
          },
          verticalCover: verticalCover
            ? {
                width: verticalCover.width ?? 0,
                height: verticalCover.height ?? 0,
                pathOrUrl: verticalCover.pathOrUrl ?? '',
                size: verticalCover.size ?? 0,
              }
            : {
                width: task.covers[0].width ?? 0,
                height: task.covers[0].height ?? 0,
                pathOrUrl: task.covers[0].pathOrUrl ?? '',
                size: task.covers[0].size ?? 0,
              },
          pubType: task.pubType ?? 1,
          desc: task.desc,
          title: task.title,
          tags: task.tags,
          original: task.createType == ContentCreateTypeEnum.original ? { firstPub: false } : undefined,
          isAigc: statementData.isAigc,
          statementType: statementData.statementType,
          statementSubType: statementData.statementSubType,
          proxy: task.proxy,
          cancelToken: task.cancelToken,
          needParts: task.needParts,
          collection: task.collection as never,
        };
        if (task.location) {
          //地点
          taskData.location =
            (task.location.raw as BaijiahaoLocationItem) ??
            ((task.location.raw as object)['raw'] as BaijiahaoLocationItem);
        }
        if (task.prePubTime) {
          //定时发布
          taskData.publishTime = parseInt((task.prePubTime / 1000).toFixed(0));
        }
        if (task.category) {
          //分类
          taskData.categoryName = task.category?.yixiaoerName ?? '';
          taskData.subCategoryName = task.subCategory?.yixiaoerName ?? '';
        }
        //活动
        if (task.activity) {
          const activity = task.activity as ActivityItemInfo;
          taskData.activityId = activity.yixiaoerId;
        }

        const re = await Baijiahao.publishVideo(this.cookies, taskData, this.event, 0, '');
        if (re.code === 10001401 || re?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        return re as PublishResult;
      }
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: BaijiahaoArticleTaskInput = {
        cancelToken: task.cancelToken,
        taskId: task.taskId,
        pubType: task.pubType ?? 1,

        title: task.title,

        subTitle: undefined,

        covers: task.covers,

        content: task.content,

        desc: undefined,

        original: 0,

        originalAuthorName: undefined,

        originalUrl: undefined,

        categoryName: [],

        activityId: undefined,

        titleBeautify: undefined,

        generateVideo: undefined,
        verticalCover: '',
        verticalCoverHeight: 0,
        verticalCoverWidth: 0,

        isAigc: undefined,

        reward: undefined,

        selfRecommend: undefined,

        fansAttention: undefined,

        attentionPrecent: undefined,

        kingMang: undefined,

        publishTime: task.prePubTime ? parseInt((task.prePubTime / 1000).toFixed(0)) : undefined,
        proxy: task.proxy,
      };
      //创作申明
      if (task.statement?.type === StatementTypeEnum.AI创作声明) {
        taskData.isAigc = 1;
      }
      if (task.category?.yixiaoerName) {
        taskData.categoryName?.push(task.category.yixiaoerName);
      }
      if (task.subCategory?.yixiaoerName) {
        if (task.subCategory.yixiaoerName?.includes('/')) {
          const cates = task.subCategory.yixiaoerName.split('/');
          taskData.categoryName?.push(cates[0] ?? '');
          taskData.categoryName?.push(cates[1] ?? '');
        } else {
          taskData.categoryName?.push(task.subCategory?.yixiaoerName ?? '');
        }
      }

      //活动
      if (task.activity) {
        taskData.activityId = (task.activity as ActivityItemInfo)?.yixiaoerId;
      }
      const result = await Baijiahao.publishArticle(this.cookies, 0, taskData, '', this.event);
      return result as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: BaiJiaHaoDynamicTaskInput = {
        taskId: task.taskId,
        cover: task.covers[0],
        desc: task.desc,
        proxy: task.proxy,
        images: task.images,
        isAigc: false,
        cancelToken: task.cancelToken,
      };
      if (task.location) {
        taskData.location =
          (task.location.raw as BaijiahaoLocationItem) ??
          (task.location.raw ? ((task.location.raw as object)['raw'] as BaijiahaoLocationItem) : undefined);
      }
      //分类

      if (task.prePubTime) {
        //定时发布
        taskData.publishTime = task.prePubTime;
      }

      //申明
      if (task.statement?.type == StatementTypeEnum.AI创作声明) {
        taskData.isAigc = true;
      }

      if (task.activity) {
        taskData.activity = task.activity as ActivityItemInfo;
      }

      const re = (await Baijiahao.publishDynamic(
        this.cookies,
        taskData,
        parseInt(taskDataIn?.platformAccount?.platformAuthorId ?? '0') ?? 0,
        '',
        this.event,
      )) as PublishResult;
      if (re.code === 10001401 || re?.msg?.includes('登录')) {
        re.code = errorCode.loginExpire;
      }
      return re;
    }
  }

  public async checkAuditStatus(publishId: string, publishType: PubContentEnum): Promise<AuditResult | undefined> {
    switch (publishType) {
      case PubContentEnum.video:
        let re = (await Baijiahao.getBaijiahaoVideoStatus(this.cookies, publishId)) as AuditResult;
        if (re?.auditStatus == undefined || !re.docId) {
          re = (await Baijiahao.getBaijiahaoMiniVideoStatus(this.cookies, publishId, 3)) as AuditResult;
        }
        if (re.code === 10001401 || re?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        return re as AuditResult;
      case PubContentEnum.article:
        const re1 = (await Baijiahao.getBaijiahaoArticleStatus(this.cookies, publishId)) as AuditResult;
        if (re1.code === 10001401 || re1?.msg?.includes('登录')) {
          re1.code = errorCode.loginExpire;
        }
        return re1;
      case PubContentEnum.dynamic:
        const re2 = (await Baijiahao.getBaijiahaoDynamicStatus(this.cookies, publishId)) as AuditResult;
        if (re2.code === 10001401 || re2?.msg?.includes('登录')) {
          re2.code = errorCode.loginExpire;
        }
        return re2;
      default:
        return { code: 444, msg: '不支持的发布类型', publishId: publishId };
    }
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
  ): Promise<ListInfoResponse | undefined> {
    const re = await Baijiahao.getBaijiahaoLocationList(this.cookies, keyWord, 0, proxy);
    if (re.code === 10001401 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    const re = await Baijiahao.deleteBaijiahaoContent(this.cookies, contentType ?? PubContentEnum.article, docId);
    if (re.code === 10001401 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    const re =
      contentType === 'video' || contentType === 'article'
        ? await Baijiahao.getBaijiahaoCategoryList(
            this.cookies,
            contentType === PubContentEnum.video ? 'videoV2' : 'news',
          )
        : { code: 445, msg: '不支持的类型' };
    if (re.code === 10001401 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    const re = await Baijiahao.getBaijiahaoTopicList(this.cookies, keyWord, '');
    if (re.code === 10001401 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async getActivityList(
    contentType?: PubContentEnum,
    categoryId?: string,
    keyWord?: string,
  ): Promise<BaseResult> {
    switch (contentType) {
      case PubContentEnum.video:
        const re = await Baijiahao.getBaijiahaoActivityList(this.cookies, 'video');
        if (re.code === 10001401 || re?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        return re;
      case PubContentEnum.article:
        const re1 = await Baijiahao.getBaijiahaoActivityList(this.cookies, 'news');
        if (re1.code === 10001401 || re1?.msg?.includes('登录')) {
          re1.code = errorCode.loginExpire;
        }
        return re1;
      case PubContentEnum.dynamic:
        return this.checkResult(await Baijiahao.getBaijiahaoActivityList(this.cookies, 'microArticle'));
      default:
        return { code: 400, msg: '不支持的类型' };
    }
  }

  public async checkUserCanPublishNum(
    createType: PubContentEnum,
    proxy?: IWebProxy,
  ): Promise<UserCanPublishNum | undefined> {
    if (!this.baseToken) {
      const re = await Baijiahao.getBaijiahaoBaseToken(this.cookies, proxy);
      if (re?.code != 0) {
        return this.checkResult({ code: re?.code ?? -1, msg: re.msg }) as never;
      }
      this.baseToken = re.token;
    }
    const pubRe = await Baijiahao.getBaijiahaoPublishArticleToken(this.cookies, this.baseToken);
    if (pubRe?.data?.ability?.publish_num_left != undefined) {
      const reNum = pubRe.data.ability.publish_num_left;
      const result = {
        code: 0,
        data: {
          remain_article_num: reNum,
          remain_video_num: reNum,
          remain_dynamic_num: reNum,
          remain_total_num: reNum,
          msg: '',
        },
      };
      if (reNum <= 0) {
        result.data.msg = pubRe?.data?.ability?.publish_num_text ?? '今日还可发布0篇内容';
      }
      return this.checkResult(result) as never;
    } else {
      return this.checkResult({
        code: pubRe?.code ?? -1,
        msg: pubRe?.msg,
        data: { remain_article_num: 1, remain_video_num: 1, remain_total_num: 1, remain_dynamic_num: 1 },
      }) as never;
    }
  }

  public async getCollectionList(contentType?: PubContentEnum): Promise<BaseResult> {
    return this.checkResult(await Baijiahao.getBaijiahaoCollection(this.cookies));
  }
}
