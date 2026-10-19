import { $http } from '../../http';
import FormData from 'form-data';
import * as buffer from 'buffer';
import crypto from 'crypto';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Guid, logger } from '@/utils';
import { ZhihuArticleTaskInput } from '@/media-platform/zhihu/zhihu-article';
import { errorCode } from '@/media-platform/errorCode';

/**
 * 上传图片
 * @param cookie
 * @param imgUrl 图片地址
 */
export const getImgFromUrl = async (cookie: string, imgUrl: string): Promise<UploadZhihuImageByUrlResponse> => {
  const url = 'https://zhuanlan.zhihu.com/api/uploaded_images';

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'fetch',
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const multiFormData = new FormData();
  multiFormData.append('url', imgUrl);
  multiFormData.append('source', 'article');

  const result = await $http.post(url, multiFormData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadZhihuImageByUrlResponse {
  src: string;
  hash: string;
  watermark: string;
  watermark_src: string;
  original_hash: string;
  original_src: string;
  'data-rawheight': number;
  'data-rawwidth': number;
  watermark_hash: string;
  class: string;
}

/**
 * 获取上传图片的参数
 * @param cookie
 * @param imageData 图片数据
 */
export const getUploadZhihuImageParamsAsync = async (
  cookie: string,
  imageData: buffer.Buffer,
): Promise<UploadZhihuImageParamsResponse> => {
  const imageMd5 = crypto.createHash('md5').update(imageData).digest('hex').toString();

  const headers = {
    Host: 'api.zhihu.com',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    Connection: 'keep-alive',
    cookie: cookie,
    Referer: 'https://zhuanlan.zhihu.com/write',
  };

  const postData = {
    image_hash: imageMd5,
    source: 'article',
  };

  const url = 'https://api.zhihu.com/images';

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadZhihuImageParamsResponse {
  upload_token: {
    access_key: string;
    access_token: string;
    access_timestamp: number;
    access_id: string;
  };
  upload_file: {
    image_id: string;
    state: number;
    object_key: string;
  };
}

export const uploadImageBinary = async (
  cookie: string,
  imageData: buffer.Buffer,
  fileExt: string = 'jpeg',
  params: UploadZhihuImageParamsResponse,
): Promise<string> => {
  const xOssUserAgent = 'aliyun-sdk-js/6.8.0 Chrome 120.0.0.0 on Windows 10 64-bit';
  const timeStr = new Date().toUTCString();
  const keyParamList = new Array<string>(
    'PUT',
    '',
    'image/' + fileExt,
    timeStr,
    'x-oss-date:' + timeStr,
    'x-oss-security-token:' + params.upload_token.access_token,
    'x-oss-user-agent:' + xOssUserAgent,
    '/zhihu-pics/' + params.upload_file.object_key,
  );
  const authorization = crypto
    .createHmac('sha1', params.upload_token.access_key)
    .update(keyParamList.join('\n'))
    .digest('base64');

  const headers = {
    cookie: cookie,
    Host: 'zhihu-pics-upload.zhimg.com',
    'Content-Type': 'image/' + fileExt,
    'x-oss-date': timeStr,
    'x-oss-security-token': params.upload_token.access_token,
    'x-oss-user-agent': xOssUserAgent,
    authorization: 'OSS ' + params.upload_token.access_id + ':' + authorization,
    Connection: 'keep-alive',
  };

  const url = 'https://zhihu-pics-upload.zhimg.com/' + params.upload_file.object_key;

  const result = await $http.put(url, imageData, {
    headers: headers,
  });

  const etag = result?.headers?.Etag ?? result?.headers?.etag;
  const errorMsg = result?.headers?.ErrorMsg ?? result?.headers?.ErrorMsg;

  if (result.status != 200 || !errorMsg || result) {
    return 'fail';
  }

  if (!etag) {
    return 'fail';
  }

  return 'success';
};

/**
 * 上传图片状态
 * @param cookie
 * @param image_id 图片id
 */
export const uploadingStatus = async (cookie: string, image_id: string): Promise<string> => {
  const url = 'https://api.zhihu.com/images/' + image_id + '/uploading_status';

  const headers = {
    authority: 'api.zhihu.com',
    cookie: cookie,
  };

  const postData = {
    upload_result: 'success',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  if (result.status != 200) {
    return 'fail';
  } else {
    return 'success';
  }
};

/**
 * 获取上传图片信息
 * @param cookie
 * @param image_id 图片id
 */
export const getUploadInfoAsync = async (cookie: string, image_id: string): Promise<ZhihuUploadInfoResponse> => {
  const url = 'https://api.zhihu.com/images/' + image_id;
  const result = await $http.get<unknown, AxiosResponse<ZhihuUploadInfoResponse>>(url, {
    headers: {
      cookie: cookie,
      authority: 'api.zhihu.com',
    },
  });

  if (result.status != 200) {
    throw '图片上传失败:' + result;
  }

  return result.data;
};

export interface ZhihuUploadInfoResponse {
  status: string;
  watermark?: string;
  watermark_hash?: string;
  watermark_src?: string;
  original_hash?: string;
  original_src?: string;
}

/**
 * 保存草稿
 * @param cookie
 * @param postData
 */
export const zhihuSaveArticleDraftAsync = async (cookie: string, postData: string): Promise<ZhihuDraftResponse> => {
  const headers = {
    cookie: cookie,
    Referer: 'https://zhuanlan.zhihu.com/write',
  };

  const url = 'https://zhuanlan.zhihu.com/api/articles/drafts';

  const result = await $http.post(url, JSON.parse(postData), {
    headers: headers,
  });

  return result.data;
};

export interface ZhihuDraftResponse {
  image_url: string;
  updated: number;
  copyright_permission: string;
  reviewers: [];
  topics: [];
  excerpt: string;
  article_type: string;
  excerpt_title: string;
  summary: string;
  title_image_size: {
    width: number;
    height: number;
  };
  id: number;
  url: string;
  comment_permission: string;
  created: number;
  content: string;
  has_publishing_draft: boolean;
  state: string;
  is_title_image_full_screen: boolean;
  title: string;
  title_image: string;
  type: string;
  error: { code: number; message: string };
}

/**
 * 设置话题
 * @param cookie
 * @param articleId 文章id
 * @param topicInput 标签
 */
export const zhihuAddTopicToArticle = async (
  cookie: string,
  articleId: number,
  topicInput: ArticleSetTopicInput,
): Promise<ZhihuSetTopicResponse> => {
  const headers = {
    cookie: cookie,
    Referer: `https://zhuanlan.zhihu.com/p/${articleId}/edit`,
  };

  const url = `https://zhuanlan.zhihu.com/api/articles/${articleId}/topics`;

  const postData = {
    introduction: topicInput.introduction,
    avatar_url: topicInput.avatar_url,
    name: topicInput.name,
    url: topicInput.url,
    type: topicInput.type,
    excerpt: topicInput.excerpt,
    id: topicInput.id,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface ArticleSetTopicInput {
  introduction: string;
  avatar_url: string;
  name: string;
  url: string;
  type: string;
  excerpt: string;
  id: string;
}

export interface ZhihuSetTopicResponse {
  url: string;
  type: string;
  id: string;
  name: string;
}

export const publish = async (
  cookie: string,
  articleId: number,
  taskData: ZhihuArticleTaskInput,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<ZhihuPublishArticleResult> => {
  const headers = {
    cookie: cookie,
    Referer: `https://zhuanlan.zhihu.com/p/${articleId}/edit`,
  };

  const url = `https://www.zhihu.com/api/v4/content/publish`;

  const postData = {
    action: 'article',
    data: {
      publish: { traceId: `${Date.now()},${Guid.NewGuid().toString()}` },
      extra_info: {
        publisher: 'pc',
        pc_business_params:
          '{"commentPermission":"anyone","disclaimer_type":"none","disclaimer_status":"close","table_of_contents_enabled":false,"commercial_report_info":{"commercial_types":[]},"commercial_zhitask_bind_info":null,"canReward":false}',
      },
      draft: { disabled: 1, id: articleId, isPublished: false },
      commentsPermission: { comment_permission: 'anyone' },
      creationStatement: taskData?.creationStatement
        ? taskData.creationStatement
        : { disclaimer_type: 'none', disclaimer_status: 'close' },
      contentsTables: { table_of_contents_enabled: false },
      commercialReportInfo: { isReport: 0 },
      appreciate: { can_reward: false, tagline: '' },
      hybridInfo: {},
    },
  };

  const result = await $http.post(url, postData, {
    headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  if (result.status == 200 && result?.data?.data?.result) {
    return result.data;
  } else {
    //throw new Error(result?.data?.error?.message ?? '未知原因');
    //logger.info(`知乎文章发布失败:${result.status}:${JSON.stringify(result.data ?? {})}-->${cookie},`);
    return typeof result.data === 'object'
      ? {
          code: result.data.code ?? result.status ?? errorCode.request_error,
          message: `${result.data?.message ?? result.data?.toast_message ?? result.statusText}`,
          toast_message: undefined,
          data: result.data?.data,
        }
      : {
          code: result.status ?? errorCode.request_error,
          message: `${result.statusText}`,
          toast_message: undefined,
          data: result.data?.data,
        };
  }
};

export interface ZhihuPublishArticleResult {
  code: number;
  message: string;
  toast_message?: string;
  data: {
    result: string; //'{"publish":{"id":"1969857104992011813","content":"\\u003cp data-pid=\\"u8ADFIG1\\"\\u003e水电费水电费\\u003c/p\\u003e"},"pinDraft":null,"pinResp":""}';
    publish_type: 'article';
  };
}
