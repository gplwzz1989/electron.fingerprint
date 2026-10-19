import { publishDouBanArticle } from './douban-article';
import { deleteDouBanArticleContent, getDouBanArticleStatus, getDouBanUserInfo } from './douban-common';

export const DouBan = {
  publishArticle: publishDouBanArticle,
  getDouBanUserInfo,
  getDouBanArticleStatus,
  deleteDouBanArticleContent,
};
