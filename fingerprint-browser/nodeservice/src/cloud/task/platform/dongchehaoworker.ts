import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { DongCheHao } from '../../../media-platform/dongchehao';
import {
  DongCheHaoArticleTaskInput,
  DongCheHaoDynamicTaskInput,
  DongCheHaoVideoTaskInput,
} from '../../../media-platform/dongchehao/dongchehao';
import { IWebProxy } from '../../../media-platform/webproxy';
import { DongCheHaoStatementType } from '@/platform-body/video/dongchehao';

const DONG_CHE_HAO_STATEMENT_TEXT: Partial<Record<DongCheHaoStatementType, string>> = {
  [DongCheHaoStatementType.none]: '内容无需标注',
  [DongCheHaoStatementType.AIGC]: '内容含AI生成',
  [DongCheHaoStatementType.fictional]: '内容含虚构演绎',
  [DongCheHaoStatementType.marketing]: '内容含营销信息',
  [DongCheHaoStatementType.personalOpinion]: '个人观点，仅供参考',
};

export const getDongCheHaoCreatorStatement = (
  statement?: BaseSinglePublishTaskVideo['statement'],
): DongCheHaoVideoTaskInput['creatorStatement'] => {
  const text = statement?.type == null ? undefined : DONG_CHE_HAO_STATEMENT_TEXT[statement.type];
  return text ? { text } : undefined;
};

export class DongCheHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo> {
    this.userInfo = await DongCheHao.getDongCheHaoUserInfo(this.cookies, proxy);
    return this.userInfo;
  }

  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType === PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      const taskData: DongCheHaoVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        cover: task.covers?.[0],
        verticalCover: task.verticalCovers?.[0] ?? task.verticalCover,
        title: task.title,
        desc: task.desc,
        pubType: task.pubType ?? 1,
        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,
        creatorStatement: getDongCheHaoCreatorStatement(task.statement),
        prePubTime: task.prePubTime,
        userId: task.platformAccount?.platformAuthorId,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };
      return DongCheHao.publishVideo(this.cookies, taskData, this.event) as Promise<PublishResult>;
    }

    if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: DongCheHaoArticleTaskInput = {
        taskId: task.taskId,
        title: task.title,
        content: task.content,
        covers: task.covers,
        horizontalCover: task.horizontalCover,
        verticalCover: task.verticalCovers?.[0] ?? task.verticalCover,
        pubType: task.pubType ?? 1,
        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,
        adType: task.advertisement ?? 3,
        prePubTime: task.prePubTime,
        userId: task.platformAccount?.platformAuthorId,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
      };
      return DongCheHao.publishArticle(this.cookies, taskData, this.event) as Promise<PublishResult>;
    }

    if (taskDataIn.publishType === PubContentEnum.dynamic || taskDataIn.publishType === PubContentEnum.ImageText) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      const taskData: DongCheHaoDynamicTaskInput = {
        taskId: task.taskId,
        desc: task.desc,
        images: task.images,
        userId: task.platformAccount?.platformAuthorId,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
      };
      return DongCheHao.publishDynamic(this.cookies, taskData, this.event) as Promise<PublishResult>;
    }

    return { code: 444, msg: '懂车号不支持该发布类型', taskId: taskDataIn.taskId };
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    if (!publishId) {
      throw new Error('publishId不能为空');
    }

    switch (publishType) {
      case PubContentEnum.article:
        return DongCheHao.getDongCheHaoArticleStatus(this.cookies, publishId) as Promise<AuditResult>;
      case PubContentEnum.video:
        return DongCheHao.getDongCheHaoVideoStatus(this.cookies, publishId) as Promise<AuditResult>;
      case PubContentEnum.dynamic:
      case PubContentEnum.ImageText:
        return DongCheHao.getDongCheHaoDynamicStatus(this.cookies, publishId) as Promise<AuditResult>;
      default:
        return { code: 444, msg: '不支持的发布类型', publishId };
    }
  }
}
