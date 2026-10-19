import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import {
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  Souhuhao,
  SouhuhaoArticleTaskInput,
  SouhuhaoVideoCategoryItem,
  SouhuhaoVideoTaskInput,
  UserCanPublishInfo,
  UserStatus,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '@/media-platform/baseResult';
import { SouHuHaoStatementType } from '@/platform-body/video';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class SouHuHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Souhuhao.getSouhuhaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code == 1211 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: SouhuhaoVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        cover: task.covers[0],
        title: task.title,
        desc: task.desc,
        category: task.category?.raw as SouhuhaoVideoCategoryItem,
        subCategory: task.subCategory?.raw as SouhuhaoVideoCategoryItem,
        topics: [],
        infoResource: 0,
        columnIds: undefined,
        sourceUrl: undefined,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      if (task.tags?.length) {
        for (const tag of task.tags) {
          const topic = await Souhuhao.getSouhuhaoTopic(
            this.cookies,
            parseInt(task.platformAccount.platformAuthorId ?? '0'),
            tag,
          );
          if (topic?.data?.length) {
            taskData.topics?.push(topic.data[0]);
          }
          if (taskData.topics && taskData.topics?.length >= 3) {
            break;
          }
        }
      }
      //申明
      if (task.statement?.type) {
        taskData.infoResource = task.statement.type as SouHuHaoStatementType;
      }
      const re = await Souhuhao.publishVideo(
        this.cookies,
        parseInt(task.platformAccount.platformAuthorId ?? '0', 10),
        taskData,
        this.event,
      );
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: SouhuhaoArticleTaskInput = {
        cancelToken: task.cancelToken,
        /**
         * 任务ID
         */
        taskId: task.taskId,

        /**
         * 发布类型
         * 0 存草稿 平台支持才有效，否则默认为发布
         * 1 发布
         */
        pubType: task.pubType ?? 1,

        /**
         * 文章标题
         */
        title: task.title,

        /**
         * 描述/摘要
         */
        desc: task.desc,

        /**
         * 文章封面
         */
        covers: task.covers,

        /**
         * 文章内容 html
         */
        content: task.content,

        /**
         * 话题，可选，最多3个
         */
        topics: undefined,

        /**
         * 原创申明 1:申明 0:不申明
         */
        original: undefined,

        /**
         * 定时发布时间戳 13位
         */
        publishTime: task.prePubTime,

        /**
         * 创作声明
         */
        infoResource: undefined,

        proxy: task.proxy,
      };

      //申明
      if (task.statement?.type) {
        const typeNum = task.statement.type as number;
        taskData.infoResource = {
          type: typeNum == 0 ? 0 : typeNum === 3 ? 2 : 3,
        };
      }

      return this.checkResult(await Souhuhao.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType: PubContentEnum): Promise<AuditResult | undefined> {
    const userInfo = await Souhuhao.getSouhuhaoUserInfo(this.cookies);
    switch (publishType) {
      case PubContentEnum.video:
        return this.checkResult(
          await Souhuhao.getSouhuhaoVideoStatus(this.cookies, Number(userInfo.yixiaoerId), publishId),
        ) as AuditResult;
      case PubContentEnum.article:
        return this.checkResult(
          await Souhuhao.getSouhuhaoArticleStatus(this.cookies, Number(userInfo.yixiaoerId), publishId),
        ) as AuditResult;
      default:
        return { code: 444, msg: '不支持的发布类型', publishId: publishId };
    }
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    const userInfo = await Souhuhao.getSouhuhaoUserInfo(this.cookies);
    return this.checkResult(
      await Souhuhao.deleteSouhuhaoContent(this.cookies, docId, userInfo?.yixiaoerId ?? ''),
    ) as never;
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === 'video'
        ? await Souhuhao.getSouhuhaoVideoCategory(this.cookies, 0)
        : { code: 445, msg: '不支持的类型' },
    );
  }

  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    const re = await this.getUserInfo(proxy);
    if (re?.verify === false) {
      return this.checkResult({
        code: re?.code ?? -1,
        msg: re?.msg,
        data: { status: UserStatus.unRealAuth, msg: '用户未认证，请打开搜狐号创作中心认证后再试' },
      }) as never;
    } else {
      return this.checkResult({
        code: re?.code ?? -1,
        msg: re?.msg,
        data: { status: UserStatus.ok, msg: '' },
      }) as never;
    }
  }
}
