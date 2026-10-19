import {
  getFengWangUserInfo,
  deleteFengWangContent,
  getFengWangMediaStatus,
  getFengWangVideoCategory,
  getFengWangUserCanPubInfo,
} from './fengwang-common';
import { publishFengWangVideo } from './fengwang-video';

export const FengWang = {
  publishVideo: publishFengWangVideo,
  getFengWangUserInfo,
  deleteFengWangContent,
  getFengWangMediaStatus,
  getFengWangVideoCategory,
  getFengWangUserCanPubInfo,
};
