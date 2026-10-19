import { publishJianShuArticle } from './jianshu-article';
import { deleteJianShuArticleContent, getJianShuArticleStatus, getJianShuUserInfo } from './jianshu-common';

export const JianShu = {
  publishArticle: publishJianShuArticle,
  getJianShuUserInfo,
  getJianShuArticleStatus,
  deleteJianShuArticleContent,
};
