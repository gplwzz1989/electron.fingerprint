import {
  deleteYiCheHaoContent,
  getYiCheHaoArticleStatus,
  getYiCheHaoMediaStatus,
  getYiCheHaoUserInfo,
  getYiCheTopics,
} from './yichehao-common';
import { publishYiCheHaoVideo } from './yichehao-video';
import { publishYiCheHaoArticle } from '@/media-platform/yichehao/yichehao-article';
import {
  getYiCheHaoUserRealAuthResponse,
} from '@/media-platform/yichehao/yichehao-user.service';

export const YiCheHao = {
  publishVideo: publishYiCheHaoVideo,
  publishArticle: publishYiCheHaoArticle,
  getYiCheHaoUserInfo,
  deleteYiCheHaoContent,
  getYiCheHaoArticleStatus,
  getYiCheHaoMediaStatus,
  getYiCheHaoUserRealAuthResponse,
  getYiCheTopics,
};
