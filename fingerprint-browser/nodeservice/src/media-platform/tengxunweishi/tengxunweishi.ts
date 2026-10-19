import {
  getTengxunweishiContentList,
  getTengxunweishiAuthInfo,
  getTengxunweishiUserInfo,
  getWeiShiVideoStatus,
  getWeiShiTopics,
  checkLogin,
  getWeishiContentListView,
  deleteTengXunWeishiContent,
} from './tengxunweishi-common';
import { publishWeishiVideo } from './tengxunweishi-video';
import { getPersonalAccessTokenAsync } from './tengxunweishi-user.service';

export const Tengxunweishi = {
  publishVideo: publishWeishiVideo,
  getTengxunweishiContentList,
  getTengxunweishiUserInfo,
  getTengxunweishiAuthInfo,
  getWeiShiVideoStatus,
  getWeiShiTopics,
  getPersonalAccessTokenAsync,
  checkLogin,
  getWeishiContentListView,
  deleteTengXunWeishiContent,
};

export type {
  TengxunweishiContentListOutput,
  TengxunweishiUserInfoOutput,
  TengxunweishiAuthInfoOutput,
} from './tengxunweishi-common';

export type { TengxunweishiMediaContent } from './tengxunweishi-content-list.service';
export type { WeishiVideoTaskInput } from './tengxunweishi-video';
