import { getDeWuUserInfo, deleteDeWuContent, getDeWuMediaStatus, getDeWuLocation, getDeWuTopics } from './dewu-common';
import { publishDeWuVideo } from './dewu-video';
import { getDeWuGoodsList } from '@/media-platform/dewu/dewu-shop';

export const DeWu = {
  publishVideo: publishDeWuVideo,
  getDeWuUserInfo,
  deleteDeWuContent,
  getDeWuMediaStatus,
  getDeWuLocation,
  getDeWuTopics,
  getDeWuGoodsList
};
