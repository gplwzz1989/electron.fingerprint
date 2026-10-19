import {
  deleteMeiYouContent,
  getMeiYouMediaStatus,
  getMeiYouUserCAanPubInfo,
  getMeiYouUserInfo,
} from './meiyou-common';
import { getMeiYouUserLoginResponse } from '@/media-platform/meiyou/meiyou-user.service';
import { publishMeiYouVideo } from '@/media-platform/meiyou/meiyou-video';

export const MeiYou = {
  publishVideo: publishMeiYouVideo,
  getMeiYouUserInfo,
  getMeiYouUserLoginResponse,
  deleteMeiYouContent,
  getMeiYouMediaStatus,
  getMeiYouUserCAanPubInfo
};
