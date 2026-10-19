import { $http } from '@/http';
import { generateRandomFileName, isJson } from '@/utils';
import * as buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getImageFromUrl = async (
  cookie: string,
  imgUrl: string,
  uid: number,
): Promise<AiqiyiImageFromUrlResponse> => {
  const url = 'https://mp-api.iqiyi.com/writer/api/1.0/editor/upload_img';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const token = cookie.split('P00001=')[1].split(';')[0];

  const postData = {
    authToken: token,
    type: ['HEADLINE'],
    uid: uid,
    imgUrl: imgUrl,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result?.data;
};

export interface AiqiyiImageFromUrlResponse {
  httpStatus: number;
  /**
   * 0:正常
   */
  code: number;
  msg: string;
  data: {
    headline: {
      share_url: string;
      file_path: string;
      file_id: string;
      httpInnerUrl: string;
      fileType: string;
    };
  };
}

/**
 * 上传图片
 * @param cookie
 * @param uid 用户id
 * @param imageData 图片数据
 * @param fileExt 文件格式/后缀
 */
export const uploadImageBinary = async (
  cookie: string,
  uid: number,
  imageData: buffer.Buffer,
  fileExt: string = 'jpeg',
): Promise<AiqiyiUploadImageResponse> => {
  const url = 'https://upload.iqiyi.com/common_upload';
  const fileName = generateRandomFileName(10, fileExt);

  const token = cookie.split('P00001=')[1].split(';')[0];

  const multiFormData = new FormData();
  multiFormData.append('name', fileName);
  multiFormData.append('file_type', fileExt);
  multiFormData.append('file_size', imageData.length);
  multiFormData.append('auth_token', token);
  multiFormData.append('business_type', 'image');
  multiFormData.append('share_type', 'external');
  multiFormData.append('share_expire', 0);
  multiFormData.append('uid', uid);
  multiFormData.append('role', 'paopao_image');
  multiFormData.append('bizid', 'jy_opendep_prod');
  multiFormData.append('file', imageData, { contentType: `image/${fileExt}`, filename: fileName });

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface AiqiyiUploadImageResponse {
  code: string;
  msg: string;
  data: {
    httpInnerUrl: string;
    file_path: string;
    share_url: string;
    file_id: string;
  };
}

export interface AuthorDataResponse {
  httpStatus: number;
  code: number;
  msg: string;
  data: {
    uid: number;
    role: { list: ['headline', 'live', 'wemedia', 'video_creator'] };
    biz: ['LIVE', 'WE_MEDIA', 'ICHANNEL', 'HEADLINE'];
    extData: {
      video_creator: { ichannel: { proEditor: false; region: 0; userType: 1; porter: false } };
      wemedia: {
        proEditor: false;
        original: false;
        region: 'cn';
        userType: 'normal';
        porter: false;
        hideLevel: false;
        channels: [];
        identityType: 'OUTER_USER';
        createAlbum: false;
        albumRole: 'NO';
        ishop: false;
        iqiyihaoPartnerType: 'IQIYIHAO_PARTNER_TYPE_COMMON_USER';
        albumPayTypes: null;
      };
      partner: null;
      circles: null;
      finance: null;
      kol: null;
      writings: null;
      live: { channelIds: [null]; userName: null; idNumber: null; channelId: null; nickName: null };
      chat: false;
      paoPaoOffical: null;
      inBlackList: false;
      spreadAuthInfo: null;
      mcnInfo: {
        manager: false;
        mcnId: null;
        isInvited: false;
        mcnStatus: null;
        reason: '';
        mcnOnly: null;
        refuseRead: null;
      };
      level: { level: 'P2'; score: 181.0 };
      contract: false;
      mpContract: { hasContract: false };
      inOriginalWhiteList: false;
      original: false;
      isGreenVip: true;
      isYellowVip: false;
      isVertical: false;
      isBusinessHao: false;
      isBlueVip: false;
      verifyStatus: true;
      primaryAuth: { primaryAuth: 'WE_MEDIA' };
      lingxiAdAuth: { adProducer: false };
      contentLevel: { selfMediaContentLevel: 2; shortVideoContentLevel: 0 };
      fansVipInfo: { fansVipState: 'NOT_AUTHORIZED' };
      microSeriesInfo: null;
      showLecturerMenu: false;
      showLiveCourseAuth: false;
      showCampAuth: false;
      intlFlag: false;
      creditScore: { creditScore: 1000.0; creditLevel: 3 };
      eduPrice: false;
    };
    updateTime: 1733998148609;
  };
  msgCode: null;
}

export const saveAiqiyiArticleDraft = async (cookie: string, postData: string): Promise<AiqiyiSaveDraftResponse> => {
  const url = 'https://mp-api.iqiyi.com/kol/api/1.0/editor/draft';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
    'content-type': 'application/json',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result?.data;
};

export interface AiqiyiSaveDraftResponse {
  code: string;
  msg: string;
  data: {
    /**
     * 草稿id
     */
    draftId: number;
    /**
     * 提交时间，和最终草稿列表中的lastModify时间一致，可考虑为publishId使用
     */
    createdTime: number;
  };
}

export const publishAiqiyiArticleResponse = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<AiqiyiPublishResponse> => {
  const url = 'https://mp-api.iqiyi.com/writer/api/1.0/unify_editor/publish';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
    'content-type': 'application/json',
    dfp: cookie.split('__dfp=')[1]?.split('@')[0],
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result?.data;
};

export interface AiqiyiPublishResponse {
  httpStatus: number;
  /**
   * 状态码 0:正常
   */
  code: number;
  msg: string;
  data: null;
  msgCode: null;
}

//https://mp-api.iqiyi.com/kol/api/1.0/editor/draft/21240

export const getDraftResponse = async (cookie: string, draftId: number): Promise<AiqiyiDraftCheckResponse> => {
  const url = `https://mp-api.iqiyi.com/kol/api/1.0/editor/draft/${draftId}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
    'content-type': 'application/json',
    dfp: cookie.split('__dfp=')[1]?.split('@')[0],
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result?.data;
};

export interface AiqiyiDraftCheckResponse {
  data: {
    draft: {
      cards: Array<object>;
    };
  };
}
