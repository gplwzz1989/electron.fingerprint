import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import {
  IYiDianHaoArticleData,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  Yidianhao,
  YidianhaoVideoTaskInput,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { convertToMinuteMultipleOf5 } from '@/utils';
import { BaseResult } from '../../../media-platform/baseResult';
import { YiDianHaoStatementType } from '@/platform-body/video';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';
import { LocationTypePrivilege } from '@/cloud/model/SearchDataModel';

export class YiDianHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Yidianhao.getYidianhaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code == 401 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: YidianhaoVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        title: task.title,
        desc: task.desc,
        tags: task.tags,
        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,
        categoryName: task.category?.yixiaoerName ?? '',
        subCategoryName: task.subCategory?.yixiaoerName ?? '',
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        wm_content_source: undefined,
        publishTime: convertToMinuteMultipleOf5(task.prePubTime ?? 0),
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      Object.keys(taskData).forEach((key) => {
        if (taskData[key] === undefined || taskData[key] === '' || taskData[key] === null) {
          delete taskData[key];
        }
      });
      //申明
      if (task.statement?.type) {
        taskData.wm_content_source = {
          type: task.statement.type as YiDianHaoStatementType,
        };
      }
      const re = await Yidianhao.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: IYiDianHaoArticleData = {
        cancelToken: task.cancelToken,
        /**
         * 内容html
         */
        content: task.content,

        pulishId: undefined,

        /**
         * 是否直接发布， 0保存草稿 1直接发布
         */
        pubType: task.pubType ?? 1,

        /**
         * 封面图
         */
        covers: task.covers,

        /**
         * 标题
         */
        title: task.title,

        /**
         * 定时发布时间 13位时间戳
         */

        prePubTime: convertToMinuteMultipleOf5(task.prePubTime ?? 0),
        /**
         * 任务唯一标志id
         */
        taskId: task.taskId,

        /**
         * 原创申明 1:申明 0:不申明
         */
        original: task.createType === ContentCreateTypeEnum.original ? 1 : 0,

        /**
         * 代理参数
         */
        proxy: task.proxy,
      };
      //申明
      if (task.statement?.type) {
        taskData.wm_content_source = {
          type: task.statement.type as unknown as YiDianHaoStatementType,
        };
      }
      return this.checkResult(await Yidianhao.publishArticle(taskData, this.cookies, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await Yidianhao.getYidianhaoMediaStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await Yidianhao.deleteYidianhaoContent(this.cookies, docId));
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === 'video'
        ? await Yidianhao.getYidianhaoVideoCategory(this.cookies)
        : { code: 445, msg: '不支持的类型' },
    );
  }

  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    if (!this.userInfo?.yixiaoerId) {
      return this.checkResult({
        code: this.userInfo?.code ?? -1,
        msg: this.userInfo?.msg,
      });
    }
    const oriInfo = this.userInfo?.raw as any;
    return this.checkResult({
      code: 0,
      msg: '',
      article_original: oriInfo?.original === 2,
      video_original: oriInfo?.original === 2,
    } as never) as never;
  }
}
