import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { ListInfoResponse, PlatformAuthorInfo, UserCanPublishNum } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { YiCheHao } from '../../../media-platform/yichehao';
import { YiCheHaoVideoTaskInput } from '../../../media-platform/yichehao/yichehao-video';
import { IWebProxy } from '../../../media-platform/webproxy';
import { YiCheHaoArticleData } from '../../../media-platform/yichehao/yichehao-article';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { ContentCreateTypeEnum } from '../../model/TypeEnum';

export class YiCheHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await YiCheHao.getYiCheHaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 401 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      const verticalCover = task.verticalCovers?.[0];

      const taskData: YiCheHaoVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        title: task.title,
        desc: task.desc,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        verticalCover,
        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,
        allowForward: task['allowForward'] ?? true,
        topics: task.topics,
        statementType: (task.statement?.type ?? 0) as 0 | 1 | 2 | 3,
        recodeNum: task['recodeNum'],
        relateVideoId: task['relateVideoId'],
        relateTime: task['relateTime'],
        videoType: task['videoType'],
        publishTime: task.prePubTime,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      const re = await YiCheHao.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: YiCheHaoArticleData = {
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

        covers: task.covers,

        verticalCover: task.verticalCovers?.length ? task.verticalCovers[0] : ({} as never),
        /**
         * 文章标题
         */
        title: task.title,

        /**
         * 文章内容 html
         */
        content: task.content,

        prePubTime: task.prePubTime,

        topics: task.topics,
        proxy: task.proxy,
        statementType: (task.statement?.type ?? 0) as never,
        allowForward: task['allowForward'] ?? true,
        allowAbstract: task['allowAbstract'] ?? true,
      };

      return this.checkResult(await YiCheHao.publishArticle(taskData, this.cookies, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      return { code: 400, msg: '不支持的类型', taskId: taskDataIn.taskId };
    }
  }

  public async checkAuditStatus(publishId: string, publishType: PubContentEnum): Promise<AuditResult | undefined> {
    if (publishType === PubContentEnum.article) {
      return this.checkResult(await YiCheHao.getYiCheHaoArticleStatus(this.cookies, publishId)) as AuditResult;
    } else {
      return (await YiCheHao.getYiCheHaoMediaStatus(this.cookies, publishId)) as AuditResult;
    }
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum): Promise<BaseResult> {
    return this.checkResult(await YiCheHao.deleteYiCheHaoContent(this.cookies, docId, contentType));
  }

  public async checkUserCanPublishNum(
    createType: PubContentEnum,
    proxy?: IWebProxy,
  ): Promise<UserCanPublishNum | undefined> {
    const result = {
      code: 0,
      msg: '',
      data: { remain_article_num: 1, remain_video_num: 1, remain_total_num: 1, remain_dynamic_num: 1, msg: undefined },
    };
    try {
      if (!this.userInfo) {
        await this.getUserInfo(proxy);
      }

      if (this.userInfo?.yixiaoerId) {
        if (createType === PubContentEnum.article && !((this.userInfo?.raw as any)?.userIdentityList?.length > 0)) {
          result.data = {
            remain_article_num: 0,
            remain_video_num: 1,
            remain_total_num: 1,
            remain_dynamic_num: 1,
            msg: '账号未实名认证，请在创作者中心认证后重试' as never,
          };
          result.msg = '账号未实名认证，请在创作者中心认证后重试';
          result.code = 172004;
        }
        return this.checkResult(result) as never;
      } else {
        return this.checkResult({
          code: this.userInfo?.code ?? -1,
          msg: this.userInfo?.msg,
          data: { remain_article_num: 1, remain_video_num: 1, remain_total_num: 1, remain_dynamic_num: 1 },
        }) as never;
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        result.code = errorCode.request_error;
        result.msg = e.message;
      } else if (e instanceof Error) {
        result.code = errorCode.data_error;
        result.msg = e.message;
      } else {
        result.msg = e?.toString() ?? '';
        result.code = errorCode.unknown_error;
      }
    }
    return result;
  }

  /**
   * 搜索话题
   * @param keyWord
   * @param contentType
   */
  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await YiCheHao.getYiCheTopics(this.cookies, keyWord));
  }
}
