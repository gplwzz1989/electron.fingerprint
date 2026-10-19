import {
  deleteCheJiaHaoContent,
  getCheJiaHaoMediaStatus,
  getCheJiaHaoTopicInfo,
  getCheJiaHaoUserInfo,
} from './chejiahao-common';
import { publishCheJiaHaoVideo } from '@/media-platform/chejiahao/chejiahao-video';
import { publishCheJiaHaoArticle } from '@/media-platform/chejiahao/chejiahao-article';

export const CheJiaHao = {
  publishVideo: publishCheJiaHaoVideo,
  publishArticle: publishCheJiaHaoArticle,
  getCheJiaHaoUserInfo,
  deleteCheJiaHaoContent,
  getCheJiaHaoMediaStatus,
  getCheJiaHaoTopicInfo,
};
