import { $http } from '../../http';
import * as buffer from 'buffer';
import { convertImageFileToBuffer, isJson, Task } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

//region 签名服务参数
const signUrl = 'http://qianming.yixiaoer.cn:';
let signIndex = 0;
const signPorts = ['5061', '5062', '5063'];
//endregion
/**
 * 获取用户基础信息/判断登录是否有效
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfo = async (cookie: string, proxyAgent?: object): Promise<XiaohongshuUserInfoResponse> => {
  const url = 'https://creator.xiaohongshu.com/api/galaxy/user/info';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/creator/home',
    Authorization: '',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 获取直播数据概览，用于判断登录是否有效
 * @param cookie
 * @param proxyAgent
 */
export const getXiaohongshuLiveDataOverview = async (
  cookie: string,
  proxyAgent?: object,
): Promise<XiaohongshuLiveDataOverviewResponse> => {
  const urlPath = '/api/galaxy/v2/creator/datacenter/livedata/overview';
  const url = `https://creator.xiaohongshu.com${urlPath}`;
  const now = new Date();
  const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
    .getDate()
    .toString()
    .padStart(2, '0')}`;
  const postData = JSON.stringify({ start_time: date, end_time: date });
  const signStr = await getNewSign(urlPath, postData);
  const sign = signStr ? JSON.parse(signStr) : undefined;
  if (!sign?.['X-s']) {
    throw new Error('小红书直播数据概览签名失败，请稍后重试');
  }
  if (sign['a1']) {
    cookie = cookie.replace(/(^|;\s*)a1=/, '$1a1old=');
    cookie = `${cookie};a1=${sign['a1']}`;
  }

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/new/home',
    Authorization: '',
    'Content-Type': 'application/json',
    'X-s': sign['X-s'],
    'X-t': sign['X-t'],
    'X-S-Common': sign['X-S-Common'] ?? '',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface XiaohongshuLiveDataOverviewResponse {
  /**
   * 状态码，0表示成功，-100表示无登录信息，906表示账号存在风险
   */
  code: number;
  /**
   * 接口是否成功
   */
  success: boolean;
  /**
   * 提示消息
   */
  msg?: string;
  data?: {
    live_overview_data?: {
      duration_of_live: number;
      average_num_of_viewers: number;
      average_num_of_interactive: number;
      num_of_potato_diamonds: number;
      valid_live_num: number;
      num_of_new_fans: number;
      seller_real_income_amount: number;
      deal_pkg_cnt: number;
      dtm: string;
    };
  };
}

export interface XiaohongshuUserInfoResponse {
  /**
   * 状态码 -100表示登录失效/过期
   */
  result: number;
  /**
   * 接口是否成功
   */
  success: boolean;
  /**
   * 数据体
   */
  data?: {
    /**
     * 用户id
     */
    userId: string;
    /**
     * 用户昵称
     */
    userName: string;
    /**
     * 用户头像
     */
    userAvatar: string;
    /**
     *小红书号
     */
    redId: string;
    /**
     * 角色 创作者/商家/等等
     */
    role: string;
    permissions: Array<string>;
  };

  /**
   * 提示消息  比如:登录已过期
   */
  msg?: string;
}

/**
 * 获取上传参数，视频上传的第一步
 * @param cookie
 * @param scene 场景，可选video、image, 默认video上传视频，可能还有上传图片，音频等场景
 */
export const getUploadArgsResponse = async (
  cookie: string,
  scene: string = 'video',
): Promise<XiaohongshuUploadArgsResponse> => {
  const url = `https://creator.xiaohongshu.com/api/media/v1/upload/web/permit?biz_name=spectrum&scene=${scene}&file_count=1&version=1&source=web`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/publish/publish',
    Authorization: '',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface XiaohongshuUploadArgsResponse {
  /**
   * 状态码
   * 0正常 非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg?: string;
  success: boolean;
  data: {
    uploadTempPermits: Array<XiaohongshuUploadNode>;
  };
}
export interface XiaohongshuUploadNode {
  /**
   * 上传文件id，默认只有一个
   */
  fileIds: Array<string>;
  token: string;
  /**
   * 过期时间错
   */
  expireTime: number;
  qos: number;
  cloudType: number;
  /**
   * 上传地址你域名
   */
  uploadAddr: string;
  /**
   * 存储桶
   */
  bucket: string;
  /**
   * 区域
   */
  region: string;
  /**
   * 上传id,多分片上传不需要
   */
  uploadId: number;
}

/**
 * 上传图片
 * @param imageData 图片二进制数据
 * @param uploadArgs 上传参数，来源于获取上传参数接口
 */
export const uploadImage = async (imageData: buffer.Buffer, uploadArgs: XiaohongshuUploadNode): Promise<string> => {
  const url = `https://${uploadArgs.uploadAddr}/${uploadArgs.fileIds[0]}`;

  const headers = {
    'x-cos-security-token': uploadArgs.token,
    referer: 'https://creator.xiaohongshu.com/',
    Origin: 'https://creator.xiaohongshu.com',
    Authorization: '',
    'Content-Type': '',
  };

  const result = await $http.put(url, imageData, {
    headers: headers,
    responseType: 'text',
  });

  return result?.headers['x-ros-preview-url'] ?? result.data;
};

export interface XiaohongshuDynamicImageUploadResult {
  uploadNode: XiaohongshuUploadNode;
  fileId: string;
  previewUrl: string;
}

export const uploadXiaohongshuDynamicImage = async (
  cookie: string,
  imgUrlPath: string,
): Promise<XiaohongshuDynamicImageUploadResult> => {
  let uploadCoverArgs;
  try {
    uploadCoverArgs = await getUploadArgsResponse(cookie, 'image');
  } catch (e) {
    throw new Error('获取图片上传参数失败，请稍后重试');
  }
  if (
    !uploadCoverArgs?.data?.uploadTempPermits?.length ||
    !uploadCoverArgs?.data?.uploadTempPermits[0]?.fileIds?.length
  ) {
    throw new Error('获取图片上传参数失败:' + (uploadCoverArgs?.msg ?? ''));
  }

  const imageUploadNode = uploadCoverArgs.data.uploadTempPermits[0];
  let imageData: buffer.Buffer;
  try {
    imageData = await convertImageFileToBuffer(imgUrlPath);
  } catch (e) {
    throw new Error(`图片读取失败:${imgUrlPath}`);
  }
  let imageResult: string;
  try {
    imageResult = await uploadImage(imageData, imageUploadNode);
  } catch (e) {
    throw new Error(`图片上传失败:${imgUrlPath}`);
  }

  if (!imageResult?.toString()?.includes(imageUploadNode.fileIds[0])) {
    let msg = `图片上传失败:${imgUrlPath}`;
    if (imageResult?.startsWith('{')) {
      try {
        const imageReJo = JSON.parse(imageResult);
        msg = `${imageReJo?.msg ?? '图片上传失败'}${imgUrlPath}`;
      } catch (e) {
        msg = `图片上传失败:${imgUrlPath}`;
      }
    }
    throw new Error(msg);
  }

  return {
    uploadNode: imageUploadNode,
    fileId: imageUploadNode.fileIds[0],
    previewUrl: imageResult,
  };
};

/**
 * 小红书用户首页数据
 * @param cookie
 * @param proxyAgent
 */
export const getPersonalInfoAsync = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<XiaohongshuPersonalInfoResponse> => {
  const url = 'https://creator.xiaohongshu.com/api/galaxy/creator/home/personal_info';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/creator/home',
    Authorization: '',
  };

  const result = await $http.get(url, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface XiaohongshuPersonalInfoResponse {
  result: number;
  success: boolean;
  data: {
    /**
     * 昵称
     */
    name: string;

    /**
     * 头像
     */
    avatar: string;

    /**
     * 关注
     */
    follow_count: number;

    /**
     * 粉丝数
     */
    fans_count: number;

    /**
     * 获赞与收藏
     */
    faved_count: number;
    red_num: string;
    personal_desc: string;
    /**
     * 1:正常 2:异常
     */
    diagnosis_status: number;
    live_info: { live_status: 0; live_data_link: null };
    grow_info: { level: 1; fans_count: 0; max_fans_count: 500; min_fans_count: 0 };
  };

  /**
   * 提示消息  比如:登录已过期
   */
  msg?: string;
}

/**
 * 签名
 * @param urlPath
 * @param postStr
 */
export const getNewSign = async (urlPath: string, postStr: string | undefined): Promise<string> => {
  let tmpIndex = signIndex;
  signIndex++;
  for (let i = 0; i < 3; i++) {
    try {
      const url = `${signUrl}${signPorts[tmpIndex % signPorts.length]}/Sign/GetSign`;
      tmpIndex++;

      // noinspection SpellCheckingInspection
      const signDataList = [urlPath];
      if (postStr) {
        signDataList.push(encodeURIComponent(postStr));
      }
      const postData = {
        url: '',
        cookie: JSON.stringify(signDataList),
        signType: 'browser',
        signCommand: 'newxiaohongshu',
      };

      let result = await $http.post(url, postData);

      if (!result.data?.signature) {
        await Task.Delay(1000);
        result = await $http.post(url, postData);
      }

      const signStr = result.data?.signature?.toString()?.replace(/\\/g, '"');

      if (signStr) {
        return signStr;
      }
    } catch (e) {
      console.debug('小红书签名异常', e?.toString());
    }
  }
  return '';
};
