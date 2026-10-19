import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { XueqiuhaoDataOverviewCoreDataResponse } from '@/media-platform/xueqiuhao/xueqiuhao-data-overview.service';

/**
 * 雪球号-首页数据
 * @param cookie
 */
export const getUserInfoAsync = async (cookie: string): Promise<XueqiuhaoUserInfoResponse> => {
  const url = 'https://mp.xueqiu.com';
  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://xueqiu.com/',
    },
  });

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.status, result.data);
  }

  const data: XueqiuhaoUserInfoResponse = {
    data: {
      fans_count: 0,
      read_count: 0,
      reply_count: 0,
      like_count: 0,
      retweet_count: 0,
      fav_count: 0,
    },
  };

  const userResult = new RegExp('UOM_CURRENTUSER = (.*?)<').exec(result.data);

  if (userResult && userResult.length > 0) {
    const userInfo = JSON.parse(userResult[1]);
    data.currentUser = userInfo.currentUser;
  }

  const fans_regex = /"fans_count":(.*?),/;
  const fansArray = fans_regex.exec(result.data);

  if (fansArray != null && fansArray.length > 0) {
    data.data.fans_count = Number(fansArray[1]);
  }

  const read_regex = /"read_count":(.*?),/;
  const readArray = read_regex.exec(result.data);

  if (readArray != null && readArray.length > 0) {
    data.data.read_count = Number(readArray[1]);
  }

  const reply_regex = /"reply_count":(.*?),/;
  const replyArray = reply_regex.exec(result.data);

  if (replyArray != null && replyArray.length > 0) {
    data.data.reply_count = Number(replyArray[1]);
  }

  const like_regex = /"like_count":(.*?),/;
  const likeArray = like_regex.exec(result.data);

  if (likeArray != null && likeArray.length > 0) {
    data.data.like_count = Number(likeArray[1]);
  }

  const retweet_regex = /"retweet_count":(.*?),/;
  const retweetArray = retweet_regex.exec(result.data);

  if (retweetArray != null && retweetArray.length > 0) {
    data.data.retweet_count = Number(retweetArray[1]);
  }

  const fav_regex = /"fav_count":(.*?),/;
  const favArray = fav_regex.exec(result.data);

  if (favArray != null && favArray.length > 0) {
    data.data.fav_count = Number(favArray[1]);
  }

  return data;
};

export interface XueqiuhaoUserInfoResponse {
  data: {
    fans_count: number;
    read_count: number;
    reply_count: number;
    like_count: number;
    retweet_count: number;
    fav_count: number;
  };
  currentUser?: unknown;
}

export const getXueQiuUserInfoResponse = async (cookie: string, proxyAgent?: object): Promise<ColumnData> => {
  const url: string = 'https://mp.xueqiu.com/xq/statuses/original/show.json';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com/dataview',
    origin: 'https://mp.xueqiu.com',
  };

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

interface ColumnData {
  title: string;
  description: string;
  right: number;
  total: number;
  user: UserInfo;
  apply: ApplyInfo;
  state: number;
  error_description: string;
  error_uri: string;
  error_data: null;
  error_code: string;
}

interface UserInfo {
  subscribeable: boolean;
  common_count: number;
  remark: null;
  recommend_reason: null;
  st_color: string;
  intro: null;
  follow_me: boolean;
  allow_all_stock: boolean;
  stock_status_count: null;
  blog_description: null;
  stocks_count: number;
  recommend: null;
  domain: null;
  type: string;
  friends_count: number;
  verified: boolean;
  profile: string;
  location: null;
  description: null;
  province: null;
  city: null;
  gender: string;
  status_count: number;
  last_status_id: number;
  verified_description: null;
  verified_type: number;
  step: string;
  id: number;
  url: null;
  followers_count: number;
  status: number;
  screen_name: string;
  following: boolean;
  blocking: boolean;
  donate_count: number;
  name: null;
  verified_infos: null;
  group_ids: null;
  verified_realname: boolean;
  name_pinyin: null;
  screenname_pinyin: null;
  photo_domain: string;
  live_info: Record<string, any>;
  profile_image_url: string;
}

interface ApplyInfo {
  state: string;
  updated_at: number;
}
