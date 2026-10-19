import {
  getPublishingTasks,
  checkAuditStatus,
  QueryWorker,
  cancelPublishTask,
  pushDataSyncTask,
  pushOpenPlatformPublishTask,
  pushLocalPublishTask,
  getPlatformUserInfo,
  checkAndPublish,
} from './task/taskService';
import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from './model/TypeEnum';
import { PushingScheduleService, StateQueryScheduleService } from './schedule-service';
import { QueryStateScheduledTask } from './schedule-service/schedule/query-state/query-state';
import { getMusicData } from './task/configDataService';
import { CommentMessageService } from './task/comment_message_service';
import { MessageWorkerService } from './task/message_worker_service';

export const Cloud = {
  getPlatformUserInfo,
  checkAndPublish,
  pushOpenPlatformPublishTask,
  pushLocalPublishTask,
  pushDataSyncTask,
  cancelPublishTask,
  checkAuditStatus,
  getPublishingTasks,
  getMusicData,
  ContentCreateTypeEnum,
  PubContentEnum,
  VisibleTypeEnum,
  QueryWorker,
  PushingScheduleService,
  StateQueryScheduleService,
  QueryStateScheduledTask,
  CommentMessageService,
  MessageWorkerService,
};
export type { CloudPublishTaskVideoFromLite } from './model/UIFormModel';
export type { PlatformWorkerActionEvent, WorkerActionType } from '././task/comment_message_service';
export type {
  BaseCloudPublishTaskFormModel,
  CloudPublishTaskFormModelVideo,
  CloudPublishTaskFormModelArticle,
  CloudPublishTaskFormModelDynamic,
} from './model/BaseTaskFormModel';
export type { CheckAndPublishInput, PublishVerifyRequired, PublishVerifyType } from '../media-platform/baseModel';
export type { LocalOpenPlatformTaskSet, PublishFeedbackHandler } from './task/taskService';
