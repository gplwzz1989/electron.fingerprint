import { deleteSouhushipinContent, getSouHuShiPinUserInfo, getSouHuShiPinVideoStatus } from './souhushipin-common';
import { publishSouHuShiPinVideo } from './souhushipin-video';
import { getUserHomeResponse } from '@/media-platform/souhushipin/souhushipin-base.service';

export const SouHuShiPin = {
  publishVideo: publishSouHuShiPinVideo,
  getSouHuShiPinUserInfo,
  getUserHomeResponse,
  getSouHuShiPinVideoStatus,
  deleteSouhushipinContent,
};
