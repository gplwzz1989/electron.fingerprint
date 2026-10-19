import * as buffer from 'buffer';
import { $http } from '../../http';
import { generateRandomFileName, isJson } from '../../utils';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取图片并上传
 * @param cookie
 * @param imgUrl 图片地址
 * @param mediaType 内容类型（news: 图文，videoV2: 视频）
 */
export const getImgFromUrl = async (
  cookie: string,
  imgUrl: string,
  mediaType: 'news' | 'videoV2',
): Promise<UploadBaijiahaoImageByUrlResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/picture/dumpproxy';

  const headers = {
    cookie: cookie,
    referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
    'X-Requested-With': 'XMLHttpRequest',
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const postData = {
    usage: 'content',
    is_waterlog: 1,
    article_type: mediaType,
    url: imgUrl,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadBaijiahaoImageByUrlResponse {
  errno: number;
  errmsg: string;
  error_code: number;
  error_msg: string;
  data: {
    bos_url: string;
    no_waterlog_bos_url: string;
    mime: string;
    height: number;
    width: number;
  };
}

/**
 * 上传图片
 * @param cookie
 * @param app_id 用户app_id
 * @param imageData 图片数据
 * @param mediaType 内容类型（news: 图文， videoV2: 视频）
 * @param fileExt 文件格式/后缀
 */
export const uploadImageBinary = async (
  cookie: string,
  app_id: number,
  imageData: buffer.Buffer,
  mediaType: 'news' | 'videoV2',
  fileExt: string = 'jpeg',
): Promise<UploadBaijiahaoImageResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/picture/uploadproxy';
  const fileName = generateRandomFileName(10, fileExt);

  const multiFormData = new FormData();
  multiFormData.append('media', imageData, { filename: fileName, contentType: `image/${fileExt}` });
  multiFormData.append('app_id', app_id);
  multiFormData.append('type', 'image');
  multiFormData.append('is_waterlog', 0);
  multiFormData.append('save_material', 1);
  multiFormData.append('no_compress', 0);
  multiFormData.append('is_events', '');
  multiFormData.append('article_type', mediaType);

  const headers = {
    cookie: cookie,
    referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
    'Content-type': 'multipart/form-data',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadBaijiahaoImageResponse {
  errmsg: string;
  errno: number;
  error_code: number;
  error_msg: string;
  ret: {
    app_id: number;
    bos_url: string;
    org_url: string;
    mime: string;
    name: string;
    no_waterlog_bos_url: string;
    size: number;
    type: string;
    width: number;
    height: number;
  };
}

/**
 *
 * @param cookie
 * @param width
 * @param height
 * @param imgUrl
 * @param mediaType news:图文封面 ,videoV:视频封面
 * @param coverType news:图文横板封面,newsRow:图文竖版，video:视频横/竖板封面
 */
export const getCoordRcmdAsync = async (
  cookie: string,
  width: number,
  height: number,
  imgUrl: string,
  mediaType: 'news' | 'videoV2',
  coverType: 'news' | 'newsRow' | 'video',
): Promise<CoordRcmdResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/Brain/CoordRcmd';

  const headers = {
    cookie: cookie,
    referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const postData = {
    width: width,
    height: height,
    url: imgUrl,
    type: coverType,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface CoordRcmdResponse {
  errmsg: string;
  errno: number;
  error_code: number;
  error_msg: string;
  data: {
    x: number;
    y: number;
    w: number;
    h: number;
    url: string;
  };
}

/**
 *
 * @param cookie
 * @param x
 * @param y
 * @param width
 * @param height
 * @param imgUrl
 * @param mediaType news:图文封面 ,videoV:视频封面
 * @param coverType news:图文横板封面,newsRow:图文竖版，video:视频横/竖板封面
 */
export const getCuttingPicAsync = async (
  cookie: string,
  x: number,
  y: number,
  width: number,
  height: number,
  imgUrl: string,
  mediaType: 'news' | 'videoV2',
  coverType: 'news' | 'newsRow' | 'video',
): Promise<CuttingPicResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/Picture/CuttingPicproxy';

  const headers = {
    cookie: cookie,
    referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const postData = {
    auto: false,
    x: x,
    y: y,
    w: width,
    h: height,
    src: imgUrl,
    type: coverType,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface CuttingPicResponse {
  errno: number;
  errmsg: string;
  data: {
    origin_src: string;
    src: string;
    https_src: string;
  };
  error_code: number;
  error_msg: string;
}

/**
 * 发布文章
 * @param cookie
 * @param token 发布token
 * @param postData 发布数据
 * @param pubType 发布类型（0：存草稿，1发布）
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  token: string,
  postData: string,
  pubType: 0 | 1 = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<PublishResultResponse> => {
  let url = '';
  if (pubType === 1) {
    //https://baijiahao.baidu.com/pcui/article/publish?callback=bjhpublish
    url = 'https://baijiahao.baidu.com/pcui/article/publish?type=news&callback=bjhpublish';
  } else {
    url = 'https://baijiahao.baidu.com/pcui/article/save?callback=bjhdraft';
  }

  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com/builder/rc/edit?type=news',
    'Content-type': 'application/x-www-form-urlencoded;',
    token: token,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PublishDataResponse {
  is_auto_generate_auth: number;
  cate_user_cms: {
    cate_d1: string;
    cate_d2: string;
    cate_d3: string;
  };
  status: string;
  order_id: string;
  updated_at: number;
  publish_at: number;
  bjh_trace_id: number;
  sub_status_id: number;
  pay_money: number;
  _action: string;
  activity_list: string;
  cover_layout: string;
  mount_goods: number;
  aigc_rebuild: string;
  creative_method: string;
  audit_type: string;
  cover_images: string;
  rewrite_info: string;
  abstract_from: number;
  article_id: string;
  created_at: number;
  tianshou_info: {
    is_first_publish: false;
  };
  id: string;
  ie: string;
  format: string;
  commit_ip: string;
  feed_cat: number;
  queue_level: string;
  displaytype_exinfo: string;
  publish_time: number;
  is_pay: number;
  push_type: number;
  method: string;
  clue: string;
  is_new_feed_content: number;
  create_ip: number;
  abstract: string;
  transform_id: string;
  commit_article: number;
  from: string;
  source_reprinted_allow: string;
  bjhmt: string;
  bjh_is_v: number;
  weixin_import_type: number;
  file_name: string;
  news_mount: [];
  domain: string;
  is_published: number;
  subtitle: string;
  can_reward: number;
  feed_content: string;
  baidu_label: {
    baidu_xiaoduapp: number;
    baidu_ug: number;
    baidu_bdbaike: number;
    baidu_aiqicha: number;
    baidu_qiyefuwu: number;
    baidu_zlax: number;
    baidu_lvlinlaw: number;
    baidu_output: number;
    baidu_union: number;
    baidu_hao123: number;
    baidu_health: number;
    baidu_acgccb: number;
    baidu_duomo: number;
    baidu_baikenew: number;
  };
  content: string;
  vertical_cover: string;
  is_auto_mount_goods: number;
  commit_ip_dual: string;
  url: string;
  call_slot: number;
  bjh_goodsId: string;
  mthvideo: number;
  creation_from: string;
  type: string;
  nid: string;
  source_name: string;
  bjh_ext_info: string;
  commit_at: number;
  title: string;
  _cover_images_map: string;
  bjhtopic_info: string;
  auto_generate_id: string;
  call_from: string;
  shoubai_c_articleid: string;
  cover_source: string;
  bjhtopic_id: string;
  source_type: string;
  issue_status: number;
  res_slot: string;
  has_edited_times: number;
}

export interface PublishResultResponse {
  errno: number;
  errmsg: string;
  ret: PublishDataResponse;
  nid: string;
}

/**
 * 获取百度内容关键字
 * @param cookie
 * @param title 标题
 * @param content 内容
 * @param mediaType 内容类型（news: 图文，videoV2: 视频）
 */
export const getBaijiahaoKeywordListAsync = async (
  cookie: string,
  title: string,
  content: string,
  mediaType: 'news' | 'videoV2',
): Promise<KeywordListResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/Brain/KeywordRcmd';

  const headers = {
    cookie: cookie,
    referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const postData = {
    title: title,
    content: content,
    content_text: '',
    location: '',
    type: mediaType,
    tag_only: 1,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KeywordListResponse {
  errno: number;
  errmsg: string;
  domain?: string;
  data: Array<{
    name: string;
    type_1: number;
    analyze: string;
  }>;
}

export const getBaijiahaoTitleRcmdAsync = async (
  cookie: string,
  postData: string,
  mediaType: 'news' | 'videoV2',
): Promise<TitleRcmdResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/Brain/TitleRcmd';

  const headers = {
    cookie: cookie,
    referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface TitleRcmdResponse {
  errno: number;
  errmsg: string;
  data: Array<{
    title: string;
    name: string;
    rely: string;
  }>;
}

export const getSyncChooseImage = async (
  cookie: string,
  postData: string,
  mediaType: 'news' | 'videoV2',
): Promise<SyncChooseImageResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/picture/syncChooseImg';

  const headers = {
    cookie: cookie,
    referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface SyncChooseImageResponse {
  data: boolean;
  errmsg: string;
  errno: number;
}

export const getChooseImage = async (
  cookie: string,
  postData: string,
  mediaType: 'news' | 'videoV2',
): Promise<ChooseImageResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/Picture/ChooseImg';

  const headers = {
    cookie: cookie,
    referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface ChooseImageResponse {
  errmsg: string;
  errno: number;
  ret: [];
}
