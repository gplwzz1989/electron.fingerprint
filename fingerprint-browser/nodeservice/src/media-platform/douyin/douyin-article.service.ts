import { $http, HttpConfig } from '@/http';

export const getImageFromUrlResponse = async (
  cookie: string,
  imgUrl: string,
): Promise<DouYinGetImageFromUrlResponse> => {
  const url = `https://creator.douyin.com/web/api/media/aweme/save/imagex?read_aid=2906&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=&a_bogus=`;

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com',
    'Content-Type': 'application/json',
  };

  const postData = {
    img_url: imgUrl,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface DouYinGetImageFromUrlResponse {
  height: number;
  status_code: number;
  status_msg: string;
  uri: string;
  width: number;
}

export const getImageUrlInfoResponse = async (cookie: string, imgUri: string): Promise<DouYinImageUrlInfoResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/creator/get/url/?uri=${encodeURIComponent(
    imgUri,
  )}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=&a_bogus=`;

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface DouYinImageUrlInfoResponse {
  status_code: number;
  status_msg: string;
  url: {
    uri: string;
    url_list: Array<string>;
  };
}
