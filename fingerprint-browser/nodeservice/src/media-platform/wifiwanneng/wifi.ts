import { publishWiFiArticle } from './wifi-article';
import { deleteWiFiArticleContent, getWiFiArticleStatus, getWifiMediaCategory, getWiFiUserInfo } from './wifi-common';

export const WiFi = {
  publishArticle: publishWiFiArticle,
  getWiFiUserInfo,
  getWiFiArticleStatus,
  deleteWiFiArticleContent,
  getWifiMediaCategory,
};
