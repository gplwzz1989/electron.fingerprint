import {
  deleteMeiPaiShiPinContent,
  getMeiPaiContentList,
  getMeiPaiUserInfo,
  getMeiPaiVideoCategory,
  getMeiPaiVideoStatus,
} from './meipai-common';
import { publishMeiPaiVideo } from './meipai-video';

export const MeiPai = {
  publishVideo: publishMeiPaiVideo,
  getMeiPaiUserInfo,
  getMeiPaiVideoStatus,
  getMeiPaiContentList,
  deleteMeiPaiShiPinContent,
  getMeiPaiVideoCategory,
};
