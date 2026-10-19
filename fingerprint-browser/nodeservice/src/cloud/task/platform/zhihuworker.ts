import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
  StatementTypeEnum,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import {
  ListInfoResponse,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  Zhihu,
  ZhiHuVideoTaskInput,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { ZhihuTopicInfo } from '../../../media-platform/zhihu/zhihu-topic.service';
import { ZhihuArticleTaskInput } from '../../../media-platform/zhihu/zhihu-article';
import { BaseResult } from '../../../media-platform/baseResult';
import { ZhihuCategoryInfo } from '../../../media-platform/zhihu/zhihu-category.service';
import { ZhiHuDynamicTaskInput } from '../../../media-platform/zhihu/zhihu-dynamic';
import { IWebProxy } from '@/media-platform/webproxy';
import { ZhiHuArticleStatementType } from '@/platform-body/video';
import { errorCode } from '@/media-platform/errorCode';

export class ZhihuWorker extends BaseWorker {
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 100 || re?.msg?.includes('TICKET_NOT_EXIST')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Zhihu.getZhihuUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const topics: ZhihuTopicInfo[] = [];
      if (task.topics?.length) {
        for (const topic of task.topics) {
          topics.push(topic.raw as ZhihuTopicInfo);
        }
      } else if (task.tags) {
        for (const tag of task.tags) {
          const topicList = await Zhihu.getZhihuTopicList(this.cookies, tag);
          if (topicList.data && Array.isArray(topicList.data) && topicList.data.length > 0) {
            const topic = topicList.data[0];
            topics.push(topic);
            if (topics.length >= 6) {
              break;
            }
          }
        }
      }

      const taskData: ZhiHuVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        cover: task.covers[0],
        title: task.title,
        desc: task.desc,
        topics,
        postTime: parseInt(`${(task.prePubTime ?? 0) / 1000}`),
        firstLevel: (task.category?.raw as Record<string, any>)?.data ?? (task.category?.raw as ZhihuCategoryInfo),
        secondLevel:
          (task.subCategory?.raw as Record<string, any>)?.data ?? (task.subCategory?.raw as ZhihuCategoryInfo),
        isOriginal: task.createType == ContentCreateTypeEnum.original ? 1 : 0,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      Object.keys(taskData).forEach((key) => {
        if (taskData[key] === undefined || taskData[key] === '' || taskData[key] === null) {
          delete taskData[key];
        }
      });
      //创作申明
      if (task.statement?.type == StatementTypeEnum.图片视频由AI生成) {
        taskData.contentSource = {
          method: 2,
        };
      }

      const re = await Zhihu.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: ZhihuArticleTaskInput = {
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
         * 文章信息
         */
        title: task.title,

        /**
         * 文章封面
         */
        covers: task.covers,

        /**
         * 文章内容 html
         */
        content: task.content,

        /**
         * 文章话题
         */
        topics: [],

        /**
         * 文章创作声明
         */
        disclaimer: undefined,

        proxy: task.proxy,
      };

      //申明
      if (task.statement?.type) {
        const zhihuStatment = task.statement.type as never as ZhiHuArticleStatementType;
        switch (zhihuStatment) {
          case ZhiHuArticleStatementType.包含AI辅助创作:
            taskData.creationStatement = { disclaimer_status: 'open', disclaimer_type: 'ai_creation' };
            break;
          case ZhiHuArticleStatementType.包含剧透:
            taskData.creationStatement = { disclaimer_status: 'open', disclaimer_type: 'spoiler' };
            break;
          case ZhiHuArticleStatementType.包含医疗建议:
            taskData.creationStatement = { disclaimer_status: 'open', disclaimer_type: 'medical_advice' };
            break;
          case ZhiHuArticleStatementType.包含理财内容:
            taskData.creationStatement = { disclaimer_status: 'open', disclaimer_type: 'contain_finance' };
            break;
          case ZhiHuArticleStatementType.虚构创作:
            taskData.creationStatement = { disclaimer_status: 'open', disclaimer_type: 'fictional_creation' };
            break;
          default:
            break;
        }
      }

      //话题
      if (task.topics?.length) {
        for (const topic of task.topics) {
          taskData.topics.push(topic.raw as ZhihuTopicInfo);
          if (taskData.topics?.length >= 3) {
            break;
          }
        }
      } else if (task.tags?.length) {
        for (const topic of task.tags) {
          const topicRe = await Zhihu.getZhihuTopicList(this.cookies, topic);
          if (topicRe?.data?.length) {
            taskData.topics.push(topicRe.data[0]);
            if (taskData.topics?.length >= 3) {
              break;
            }
          }
        }
      }

      return this.checkResult(await Zhihu.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      const taskData: ZhiHuDynamicTaskInput = {
        taskId: task.taskId,
        title: task.title,
        desc: task.desc,
        proxy: task.proxy,
        images: task.images,
        cancelToken: task.cancelToken,
      };

      const re = await Zhihu.publishDynamic(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    }
  }

  public async checkAuditStatus(publishId: string, publishType: PubContentEnum): Promise<AuditResult | undefined> {
    switch (publishType) {
      case PubContentEnum.video:
        return this.checkResult(await Zhihu.getZhihuVideoStatus(this.cookies, publishId)) as AuditResult;
      case PubContentEnum.article:
        return this.checkResult(await Zhihu.getZhihuArticleStatus(this.cookies, publishId)) as AuditResult;
      case PubContentEnum.dynamic:
        return this.checkResult(await Zhihu.getZhihuDynamicStatus(this.cookies, publishId)) as AuditResult;
      default:
        return { code: 444, msg: '不支持的发布类型', publishId: publishId };
    }
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(
      await Zhihu.deleteZhihuhaoContent(this.cookies, docId, contentType ?? PubContentEnum.article, isDraft ?? false),
    );
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === 'video' ? await Zhihu.getZhihuCategoryList(this.cookies) : { code: 445, msg: '不支持的类型' },
    );
  }

  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Zhihu.getZhihuTopicList(this.cookies, keyWord));
  }
}
