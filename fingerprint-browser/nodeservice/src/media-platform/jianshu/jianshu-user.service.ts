import { $http } from '@/http';

export const getJianShuHaoUserInfo = async (cookie: string, proxyAgent?: object): Promise<JianShuUserInfo> => {
  const url = 'https://www.jianshu.com/author/current_user';

  const headers = {
    cookie: cookie,
    referer: 'https://www.jianshu.com/writer',
    Origin: 'https://www.jianshu.com',
  };

  const result = await $http.get(url, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent,maxRedirects:0 });

  if (result.status === 302) {
    return { error: '登录' } as JianShuUserInfo;
  }
  return result.data;
};

export interface JianShuUserInfo {
  error: string;
  id: number;
  nickname: string;
  slug: string;
  avatar: string;
  preferred_note_type: string;
  can_publish_paid_note: boolean;
  paid_note_agreement_agreed_at: null | string; // 可能为null或时间字符串
  can_upload_audio: boolean;
  can_update_cover_images: boolean;
  md_auto_scroll: number;
  jsd_level_for_paid_note: {
    name: string;
    min_score: number;
  };
  jsd_level_for_upload_audio: {
    name: string;
    min_score: number;
  };
}
