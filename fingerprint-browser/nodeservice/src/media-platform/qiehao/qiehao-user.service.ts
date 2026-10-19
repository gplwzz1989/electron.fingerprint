import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 企鹅号首页数据
 * @param cookie
 * @param proxyAgent
 */
export const getUserHomeDataAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<QiehaoUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoUserHomeDataResponse>>(
    'https://om.qq.com/mindex/homeInfo',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main',
        host: 'om.qq.com',
      },
      params: {
        app: 'all',
        relogin: 1,
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface QiehaoUserHomeDataResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    name: string;
    avatar: string;
    blackMarketScore: number;
    unreadCount: number;
    total_index_score: number;
    pv: number;
    subscriberCount: number;
    vv: number;
    accountType: number;
    isCopyrightCp: number;
    userCategory: number;
    rightsCandidate: number;
    rightsIsOrigin: number;
    rightsIsAuthed: number;
    rights_auth_state: number;
    weishi_rights_auth_state: number;
    rights_type: number;
    rightsNew: number;
    rightsDaren: number;
    rightsRank: number;
    highQuality: number;
    totalIncome: number;
    showHighQuality: number;
    articleFlow: number;
    videoFlow: number;
    dailyFansNum: number;
    mediaDailyLastDate: string;
    dailyFansLastDate: string;
  };
}

/**
 * 企鹅号用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoAsync = async (cookie: string, proxyAgent?: object): Promise<QiehaoUserInfoResponse> => {
  const url = 'https://om.qq.com/marticle/creation/initInfo?params=%7B%7D&relogin=1';
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://om.qq.com/main',
      host: 'om.qq.com',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface QiehaoUserInfoResponse {
  code: number;
  msg: string;
  response: {
    code: number;
    msg: string;
  };
  data: {
    whitelist: {
      '10354': number;
      '10357': number;
      '10436': number;
      doubleTitle: number;
      rose_live: number;
      rose_live_pay: number;
      rtmp: number;
      sametitle: number;
      pic_nocheck: number;
      novel: number;
      howto: number;
      gongyi: number;
      suspectedblacklist: number;
      sports_category: number;
      weseeredpacket: number;
      rss: number;
      MMSCrawl: number;
      gaoxiaobaimingdan: number;
    };
    cpInfo: {
      influenceOrigin: string;
      mediaid: string;
      medianame: string;
      mediaLevel: string;
      mediaStatus: string;
      videoOrigin: string;
      mediaVCGStatus: string;
      omuin: string;
      qq_openid: string;
      isBindedQQ: false;
      wechat: string;
      golden_penguin_club: string;
      formal_status: string;
      header: string;
      high_quality_pic: string;
      ugc_type: string;
      high_quality_video: string;
      accounttype: string;
      influence_category: string;
      mobile: string;
      maxcategoryid: string;
      category: string;
      ugc_status: string;
      weishi_quality: string;
      base_level_pic: string;
      punishtime: string;
      ugc_submittime: string;
      base_level_video: string;
      high_quality_small_video: string;
      heichanscore: string;
      copyright_content_creation: string;
      origin_statement: string;
      originalapply: string;
      ugc_formaltime: string;
      originalstatus: string;
      special_pub_num: string;
    };
    publishData: {
      publishedCount: number;
      maxPublishCount: number;
    };
  };
}
