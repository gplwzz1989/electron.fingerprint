import {
  getPipixiaContentList,
  getPipixiaDataOverview,
  getPipixiaDataOverviewCore,
  getPipixiaDataOverviewFans,
  getPipixiaTopics,
  getPiPiXiaUserInfo,
  getPiPiXiaVideoStatus,
} from './pipixia-common';
import { publishPiPiXiaVideo } from './pipixia-video';

export const Pipixia = {
  publishVideo: publishPiPiXiaVideo,
  getPiPiXiaUserInfo,
  getPipixiaContentList,
  getPipixiaDataOverview,
  getPipixiaDataOverviewCore,
  getPipixiaDataOverviewFans,
  getPipixiaTopics,
  getPiPiXiaVideoStatus,
};

export type {
  PipixiaContentListOutput,
  PipixiaDataOverviewOutput,
  PipixiaDataOverviewCoreOutput,
  PipixiaDataOverviewFansOutput,
} from './pipixia-common';

export type { PipixiaMediaContent } from './pipixia-content-list.service';

export type { PipixiaOverviewItemResponse, PipixiaDataOverviewFansItemResponse } from './pipixia-data-overview.service';

export type { PipixiaTopicResponse, PipixiaTagItem, PipixiaHashtagItem } from './pipixia-topic.service';
