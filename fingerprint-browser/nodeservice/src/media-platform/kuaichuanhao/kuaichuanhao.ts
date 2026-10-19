import { publishKuaiChuanArticle } from './kuaichuanhao-article';
import { deleteKuaiChuanArticleContent, getKuaiChuanArticleStatus, getKuaiChuanUserInfo } from './kuaichuanhao-common';

export const KuaiChuanHao = {
  publishArticle: publishKuaiChuanArticle,
  getKuaiChuanUserInfo,
  getKuaiChuanArticleStatus,
  deleteKuaiChuanArticleContent,
};
