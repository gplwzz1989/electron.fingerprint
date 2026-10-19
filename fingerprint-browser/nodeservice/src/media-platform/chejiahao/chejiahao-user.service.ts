import { $http } from '@/http';

export const getCheJiaHaoUserInfoResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<CheJiaHaoUserProfileResponse> => {
  const url = 'https://creator.autohome.com.cn/openapi/ypttd/yjc/csc/creator/creatorinfo';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/home',
  };

  const result = await $http.get(url, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface CheJiaHaoUserProfileResponse {
  message: string;
  result: {
    availablefields: []; // 空数组，可根据实际元素类型细化（如 unknown[]）
    effectsharestate: number;
    fanscount: number;
    followcount: number;
    headimage: string;
    newsonly: number;
    nickname: string;
    oaaccount: null;
    pgcunion: number;
    publishcount: number;
    replycount: number;
    role: number;
    showvideocategory: number;
    userstate: number;
    userid: number;
    userlevel: number;
  };
  returncode: number;
}
