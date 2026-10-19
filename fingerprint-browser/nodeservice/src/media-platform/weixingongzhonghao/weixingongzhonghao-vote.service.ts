import { $http } from '@/http';
import * as buffer from 'buffer';
import { getNowTimeStamp } from '@/utils/use-date';
import FormData from 'form-data';
import { isJson } from '@/utils';

export const createWeixinVoteResponse = async (
  cookie: string,
  postDataBody: string,
  userToken: number,
): Promise<WeixingongzhonghaoVoteResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/newoperatevote';

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://mp.weixin.qq.com/cgi-bin/home',
    Origin: 'https://mp.weixin.qq.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    Charset: 'UTF-8',
  };

  const params = {
    action: 'save',
  };

  const postData = `scene=0&supervoteid=&json=${encodeURIComponent(
    postDataBody,
  )}&page_type=0&fingerprint=&token=${userToken}&lang=zh_CN&f=json&ajax=1`;

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeixingongzhonghaoVoteResponse {
  base_resp: { err_msg: string; ret: number };
  /**
   * 投票id
   */
  super_vote_id: number;
}

export const getWeixingongzonghaoVoteListResponse = async (
  cookie: string,
  token: number,
  pageNumber: number = 1,
): Promise<WeixingongzhonghaoVoteListResponse> => {
  const headers = {
    cookie: cookie,
    referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN&timestamp=${Date.now()}`,
    'x-requested-with': 'XMLHttpRequest',
  };

  const params = {
    action: 'list',
    vote_status: 1,
    is_editing: 0,
    f: 'json',
    count: 10,
    begin: (pageNumber - 1) * 10,
    vote_create_type: 0,
    token: token,
    fingerprint: '',
    lang: 'zh_CN',
    ajax: 1,
  };

  const url = 'https://mp.weixin.qq.com/cgi-bin/newoperatevote';

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeixingongzhonghaoVoteListResponse {
  base_resp: { err_msg: string; ret: number };
  bizuin: string;
  data: string;
}

export const getWeixingongzonghaoVoteDetailResponse = async (
  cookie: string,
  voteId: string,
  token: number,
): Promise<WeixingongzhonghaoVoteListResponse> => {
  const headers = {
    cookie: cookie,
    referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN&timestamp=${Date.now()}`,
    'x-requested-with': 'XMLHttpRequest',
  };

  const params = {
    action: 'show',
    supervoteid: voteId,
    token: token,
    fingerprint: '',
    lang: 'zh_CN',
    ajax: 1,
    f: 'json',
  };

  const url = 'https://mp.weixin.qq.com/cgi-bin/newoperatevote';

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeixingongzhonghaoVoteListBody {
  total_count: number;
  super_vote_info: Array<{
    /**
     * 投票id
     */
    super_vote_id: number;
    /**
     * 投票名称
     */
    title: string;
    /**
     * 投票
     */
    person_count: number;
    /**
     * 投票状态 1:正常
     */
    vote_status: number;
    /**
     * 过期时间戳（10位数）
     */
    expire_time: number;
    create_time: number;
    is_editing: 0;
    vote_create_type: 0;
    vote_id_list: { vote_id: [489224599, 489224600] };
  }>;
}

export const uploadWeixinVoteImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  ticketId: string,
  ticket: string,
  userToken: number,
  imgType: string = 'png',
  fileName: string = 'myPic.png',
): Promise<WeixingongzhonghaoUploadVoteImageResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/filetransfer?';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/home',
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    action: 'upload_material',
    f: 'json',
    writetype: 'doublewrite',
    groupid: 1,
    ticket_id: ticketId,
    ticket: ticket,
    svr_time: getNowTimeStamp(10),
    token: userToken,
    lang: 'zh_CN',
    seq: getNowTimeStamp(13),
  };

  const postData = new FormData();
  postData.append('id', 'WU_FILE_0');
  postData.append('name', fileName);
  postData.append('type', `image/${imgType}`);
  postData.append('lastModifiedDate', new Date().toString());
  postData.append('size', imageData.length);
  postData.append('file', imageData, { filename: fileName, contentType: `image/${imgType}` });

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeixingongzhonghaoUploadVoteImageResponse {
  base_resp: { ret: number; err_msg: string };
  location: string;
  type: string;
  content: string;
  cdn_url: string;
}

export interface WeixingongzhonghaoVoteDetailResponse {
  base_resp: { err_msg: string; ret: number };
  data: '{"title":"这是一个HUI过期投票","vote_permission":1,"expire_time":1764597734,"create_time":1749093939,"vote_subject":[{"type":1,"title":"为什么会不过期-单选","options":[{"name":"因为这是带了图片的","url":"https:\\/\\/mmbiz.qpic.cn\\/sz_mmbiz_jpg\\/QTMqVTVBGv4QstiaKUCQZ5eMBs0tHWxI7XgezkBV2BicyicogpWevEx4P6QogrZTeQqTIy7k7Gbkw6eq4BBuibTARA\\/0?wx_fmt=jpeg&from=appmsg","cnt":0},{"name":"因为这是第一个没带图片","url":"","cnt":0},{"name":"因为这是第二个没带图片","url":"","cnt":0}],"total_cnt":0},{"type":2,"title":"为什么不会过期-多选","options":[{"name":"多选选项1-无图","url":"","cnt":0},{"name":"多选选项2-无图","url":"","cnt":0},{"name":"多选选项3-无图","url":"","cnt":0}],"total_cnt":0}],"total_person":0,"del_flag":0,"is_editing":0,"publish_time":1749093939,"vote_create_type":0}';
}
