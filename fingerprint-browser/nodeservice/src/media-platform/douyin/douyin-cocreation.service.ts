import { $http, HttpConfig } from '@/http';

export const getCoCreationResponse = async (cookie: string): Promise<DouYinCoCreatePermissionResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/co/settings?device_platform=pc&version_code=300000&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=&a_bogus=`;
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page',
  };
  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

/**
 * 共创权限与角色配置响应数据结构
 */
export interface DouYinCoCreatePermissionResponse {
  data: {
    album_entry_status: number;
    cert_status: number;
    co_publish_times: number;
    entry_status: number;
    external_contribute_status: number;
    max_role_num: number;
    restriction_msg: string;
    restriction_type: number;
    roles: Array<{
      desc: string;
      id: number;
      title: string;
      max_num?: number; // 部分角色特有可选字段
    }>;
    total_co_publish_times: number;
    without_permission_reason: string;
  };
  extra: {
    logid: string;
    now: number; // 毫秒级时间戳
  };
  log_pb: {
    impr_id: string;
  };
  status_code: number;
  status_msg: string;
}
