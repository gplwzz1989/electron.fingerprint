import FormData from 'form-data';
import * as buffer from 'buffer';
import { $http } from '../../http';
import { getNowTimeStamp } from '../../utils/use-date';
import { isJson } from '../../utils';
import { getDynamicContentText } from '@/media-platform/weixingongzhonghao/weixingongzhonghao-dynamic';

export interface WeiXinGongZhongHaoVideoInitUploadResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  miss_part_num?: Array<number>;
  vid?: string;
}

export interface WeiXinGongZhongHaoVideoUploadBlockResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
}

export interface WeiXinGongZhongHaoVideoFinishUploadResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
}

export interface WeiXinGongZhongHaoOperateMpVideoResponse {
  appmsgid?: number;
  base_resp: {
    err_msg: string;
    ret: number;
  };
  data_seq: string;
}

export interface WeiXinGongZhongHaoOperateMpVideoArgs {
  title: string;
  appmsgid?: string | number;
  coverUrl: string;
  vid: string;
  danmuPubType?: number;
  applyOri?: number;
  coverUrl16_9?: string;
  coverUrl1_1?: string;
  coverUrlBack?: string;
  cropCoordinate?: string;
  textCoordinate?: string | null;
  remindOri?: number;
  save?: number;
  fingerprint: string;
  remind_ori?: number;
  token?: number;
  lang?: string;
  f?: string;
  ajax?: string;
  danmu_pub_type?: number;
}

export interface WeiXinGongZhongHaoVideoUploadInitArgs {
  filename: string;
  filesize: number;
  width: number;
  height: number;
  videoDuration: number;
  fingerprint: string;
}

export interface WeiXinGongZhongHaoVideoUploadInfo {
  vid: string;
  partSize: number;
  uploadId?: string;
  filename: string;
  filesize: number;
  width: number;
  height: number;
  videoDuration: number;
  fingerprint: string;
}

interface WeiXinGongZhongHaoVideoDraftContentItem {
  title: string;
  desc?: string;
  content?: string;
  coverUrl: string;
  coverUrl16_9?: string;
  coverUrl1_1?: string;
  coverUrlBack?: string;
  cropCoordinate?: string;
  coverWidth?: number;
  coverHeight?: number;
  shareVideoId?: string;
  mpVideoInfo?: string;
  duration?: number;
  width?: number;
  height?: number;
  claimSourceType?: number;
  disableRecommend?: number;
  isOriginal?: number;
  needOpenComment?: number;
  needOpenReply?: number;
  openFansMsg?: number;
  import_to_finder?: number;
}

const normalizeVideoCoverBackUrl = (url: string): string => {
  if (url.startsWith('//')) {
    return `http:${url}`;
  }
  if (url.startsWith('https://')) {
    return url.replace(/^https:\/\//, 'http://');
  }
  return url;
};

const getVideoCropRatio = (ratio: string): number => {
  switch (ratio) {
    case '2.35_1':
      return 2.35;
    case '1_1':
      return 1;
    case '3_4':
      return 3 / 4;
    case '16_9':
      return 16 / 9;
    default:
      return 1;
  }
};

const buildVideoCropCoordinate = (width?: number, height?: number): string => {
  const ratioList = ['2.35_1', '1_1', '16_9'];
  if (!width || !height) {
    return JSON.stringify(
      ratioList.map((ratio) => ({
        ratio,
        x: 0,
        y: 0,
        x2: 0,
        y2: 0,
        w: 0,
        h: 0,
      })),
    );
  }

  const buildCrop = (ratio: string) => {
    const targetRatio = getVideoCropRatio(ratio);
    if (!targetRatio) {
      return {
        ratio,
        x: 0,
        y: 0,
        x2: width,
        y2: height,
        w: width,
        h: height,
      };
    }

    const sourceRatio = width / height;
    if (Math.abs(sourceRatio - targetRatio) < 0.000001) {
      return {
        ratio,
        x: 0,
        y: 0,
        x2: width,
        y2: height,
        w: width,
        h: height,
      };
    }

    if (sourceRatio > targetRatio) {
      const cropWidth = Math.round(height * targetRatio);
      const x = Math.max(0, Math.floor((width - cropWidth) / 2));
      return {
        ratio,
        x,
        y: 0,
        x2: x + cropWidth,
        y2: height,
        w: cropWidth,
        h: height,
      };
    }

    const cropHeight = Math.round(width / targetRatio);
    const y = Math.max(0, Math.floor((height - cropHeight) / 2));
    return {
      ratio,
      x: 0,
      y,
      x2: width,
      y2: y + cropHeight,
      w: width,
      h: cropHeight,
    };
  };

  return JSON.stringify(ratioList.map((ratio) => buildCrop(ratio)));
};

const buildVideoCommentData = (needOpenComment = 0, needOpenReply = 0) => {
  const result = {
    need_open_comment: 0,
    only_fans_can_comment: 0,
    only_fans_days_can_comment: 0,
    reply_flag: 0,
  };

  if (needOpenComment == 1) {
    result.need_open_comment = 1;
    result.only_fans_can_comment = 1;
  } else if (needOpenComment == 2) {
    result.need_open_comment = 1;
    result.only_fans_days_can_comment = 1;
  } else if (needOpenComment == 3) {
    result.need_open_comment = 1;
  }

  if (needOpenComment > 0) {
    result.reply_flag = needOpenReply || 3;
  }

  return result;
};

const buildDefaultMpVideoInfo = (item: WeiXinGongZhongHaoVideoDraftContentItem): string => {
  const duration = Math.max(0, Math.floor(item.duration ?? 0));
  const durationMs = Math.max(0, Math.round((item.duration ?? 0) * 1000));
  const coverUrl = item.coverUrl;
  const coverUrlBack = item.coverUrlBack ?? normalizeVideoCoverBackUrl(coverUrl);
  const cropCoordinate =
    item.cropCoordinate ?? buildVideoCropCoordinate(item.coverWidth ?? item.width, item.coverHeight ?? item.height);

  return JSON.stringify({
    list: [
      {
        base_info: {
          digest: item.desc ?? '',
          duration,
          duration_ms: durationMs,
          height: item.height ?? 0,
          is_from_api: false,
          is_from_app: false,
          is_mp_video: true,
          is_own_vid: true,
          need_vidsn: true,
          ori_status: item.isOriginal ?? 0,
          status: 7,
          title: item.title,
          upload_time: Math.floor(Number(getNowTimeStamp(10))),
          width: item.width ?? 0,
        },
        cover_info: {
          cover_url: coverUrl,
          cover_url_16_9: item.coverUrl16_9 ?? coverUrl,
          cover_url_1_1: item.coverUrl1_1 ?? coverUrl,
          cover_url_back: coverUrlBack,
          crop_coordinate: cropCoordinate,
          text_coordinate: 'null',
        },
        option_info: {
          applyori: item.isOriginal ?? 0,
          can_import_to_finder: true,
          danmu_pub_type: 1,
          save: true,
          reprint_confirm: 0,
        },
        play_info: [],
        status_info: {
          is_appmsg_unauthorized: false,
          is_mp_video_check_fail: false,
          is_mp_video_checking: false,
          is_mp_video_delete: false,
          is_mp_video_forbid: false,
          is_mp_video_transing: false,
          is_mp_video_waiting: false,
          mp_video_forbid_reason: 0,
          mp_video_overseas_limit: 0,
        },
        task_info: {
          reason: 0,
          status: 1,
        },
        vid: item.shareVideoId,
      },
    ],
  });
};

export const initWeiXinGongZhongHaoVideoUpload = async (
  cookie: string,
  userToken: number,
  args: WeiXinGongZhongHaoVideoUploadInitArgs,
): Promise<WeiXinGongZhongHaoVideoUploadInfo | null> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/videoupload?action=init_upload';
  const headers = {
    cookie: cookie,
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/videomsg_edit&action=video_edit&type=15&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const postData = {
    max_part_size: 4194304,
    filename: encodeURIComponent(args.filename),
    filesize: args.filesize,
    width: args.width,
    height: args.height,
    video_duration: args.videoDuration,
    fingerprint: args.fingerprint,
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };
  const result = await $http.post<WeiXinGongZhongHaoVideoInitUploadResponse>(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  if (result?.data?.base_resp?.ret !== 0 || !result?.data?.vid) {
    return null;
  }
  return {
    vid: result.data.vid,
    partSize: 4194304,
    filename: args.filename,
    filesize: args.filesize,
    width: args.width,
    height: args.height,
    videoDuration: args.videoDuration,
    fingerprint: args.fingerprint,
  };
};

export const uploadWeiXinGongZhongHaoVideoPart = async (
  cookie: string,
  userToken: number,
  videoInfo: WeiXinGongZhongHaoVideoUploadInfo,
  partNum: number,
  partSha: string,
  videoData: buffer.Buffer,
): Promise<string> => {
  const url = `https://mp.weixin.qq.com/cgi-bin/videoupload?action=upload_block&part_sha=${partSha}&vid=${
    videoInfo.vid
  }&part_num=${partNum}&f=json&ajax=1&token=${userToken}&lang=zh_CN&t=${Math.random()}`;
  const headers = {
    cookie: cookie,
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/videomsg_edit&action=video_edit&type=15&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
    'Content-Type': 'application/octet-stream',
    'Cache-Control': 'no-cache',
  };
  const result = await $http.post<WeiXinGongZhongHaoVideoUploadBlockResponse>(url, buffer.Buffer.from(videoData), {
    headers: headers,
  });
  if (result.status === 200 && result?.data?.base_resp?.ret === 0) {
    return `${partNum}_${partSha}`;
  }
  return `_${JSON.stringify(result.data)}`;
};

export const finishWeiXinGongZhongHaoVideoUpload = async (
  cookie: string,
  userToken: number,
  vid: string,
): Promise<WeiXinGongZhongHaoVideoFinishUploadResponse> => {
  const url = `https://mp.weixin.qq.com/cgi-bin/videoupload?action=upload_finish&vid=${vid}&screen_shot_type=1&f=json&ajax=1&token=${userToken}&lang=zh_CN&t=${Math.random()}`;
  const headers = {
    cookie: cookie,
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/videomsg_edit&action=video_edit&type=15&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };
  const result = await $http.post(url, '', {
    headers: headers,
  });

  return result.data as WeiXinGongZhongHaoVideoFinishUploadResponse;
};

export const operateWeiXinGongZhongHaoVideo = async (
  cookie: string,
  userToken: number,
  args: WeiXinGongZhongHaoOperateMpVideoArgs,
): Promise<WeiXinGongZhongHaoOperateMpVideoResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/video';
  const headers = {
    cookie: cookie,
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/videomsg_edit&action=video_edit&type=15&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const params = {
    action: 'operate_mp_video',
  };
  const postData = new URLSearchParams();
  const appendField = (key: string, value: unknown, nullValue: string = '') => {
    const normalized = value === undefined ? '' : value === null ? nullValue : String(value);
    postData.append(key, normalized);
  };

  appendField('title', args.title);
  appendField('appmsgid', args.appmsgid ?? '');
  appendField('cover_url', args.coverUrl);
  appendField('vid', args.vid);
  appendField('danmu_pub_type', args.danmuPubType ?? 1);
  appendField('applyori', args.applyOri ?? 0);
  appendField('cover_url_16_9', args.coverUrl16_9 ?? args.coverUrl);
  appendField('cover_url_1_1', args.coverUrl1_1 ?? args.coverUrl);
  appendField('cover_url_back', args.coverUrlBack ?? normalizeVideoCoverBackUrl(args.coverUrl));
  appendField('crop_coordinate', args.cropCoordinate ?? '');
  appendField('text_coordinate', args.textCoordinate ?? null, 'null');
  appendField('remind_ori', args.remindOri ?? 0);
  appendField('save', args.save ?? 1);
  appendField('fingerprint', args.fingerprint);
  appendField('token', userToken);
  appendField('lang', 'zh_CN');
  appendField('f', 'json');
  appendField('ajax', 1);

  const result = await $http.post<WeiXinGongZhongHaoOperateMpVideoResponse>(url, postData.toString(), {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};
export interface WeiXinGongZhongHaoDraftVideoResponse {
  appMsgId?: number;
  base_resp: {
    err_msg: string;
    ret: number;
  };
  data_seq: string;
}
export const saveWeiXinGongZhongHaoVideoDraft = async (
  cookie: string,
  userToken: number,
  postData: FormData,
  isUpdate: boolean,
  draftId?: string,
): Promise<WeiXinGongZhongHaoDraftVideoResponse> => {
  const url =
    'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=' +
    userToken +
    '&lang=zh_CN';
  const headers = {
    cookie: cookie,
    Referer: isUpdate
      ? `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&reprint_confirm=0&type=77&appmsgid=${
          draftId ?? ''
        }&token=${userToken}&lang=zh_CN`
      : `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=5&token=${userToken}&lang=zh_CN&timestamp=${Date.now()}`,
    Origin: 'https://mp.weixin.qq.com',
  };
  const params = {
    t: 'ajax-response',
    sub: isUpdate ? 'update' : 'create',
    type: 77,
    token: userToken,
    lang: 'zh_CN',
  };
  const result = await $http.post<WeiXinGongZhongHaoDraftVideoResponse>(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });
  return result.data;
};

export const buildWeiXinGongZhongHaoVideoInitFormData = (
  userToken: number,
  isCreateDraft: boolean,
  articleCount: number,
  draftId?: string,
): FormData => {
  const formData = new FormData();
  const appendField = (key: string, value: unknown) => {
    const normalized = value === undefined || value === null ? '' : String(value);
    formData.append(key, normalized);
  };
  appendField('token', userToken.toString());
  appendField('lang', 'zh_CN');
  appendField('f', 'json');
  appendField('ajax', '1');
  appendField('fingerprint', '');
  appendField('random', Math.random().toString());
  appendField('AppMsgId', draftId ?? '');
  appendField('count', articleCount.toString());
  appendField('data_seq', '0');
  appendField('operate_from', 'Chrome');
  appendField('isnew', '0');
  appendField('articlenum', articleCount.toString());
  appendField('pre_timesend_set', '0');
  return formData;
};

export const createWeiXinGongZhongHaoVideoFormData = (
  taskData: {
    contentList: Array<WeiXinGongZhongHaoVideoDraftContentItem>;
  },
  userToken: number,
  draftId?: string,
): FormData => {
  const formData = new FormData();
  const appendField = (key: string, value: unknown) => {
    const normalized = value === undefined || value === null ? '' : String(value);
    formData.append(key, normalized);
  };

  appendField('token', userToken.toString());
  appendField('lang', 'zh_CN');
  appendField('f', 'json');
  appendField('ajax', '1');
  appendField('fingerprint', '');
  appendField('random', Math.random().toString());
  appendField('AppMsgId', draftId ?? '');
  appendField('count', taskData.contentList.length.toString());
  appendField('data_seq', '0');
  appendField('operate_from', 'Chrome');
  appendField('isnew', '0');
  appendField('articlenum', taskData.contentList.length.toString());
  appendField('pre_timesend_set', '0');

  taskData.contentList.forEach((item, index) => {
    const suffix = index.toString();
    appendField(`is_finder_video${suffix}`, '0');
    appendField(`finder_draft_id${suffix}`, '0');
    appendField(`applyori${suffix}`, item.isOriginal?.toString() ?? '0');
    appendField(`ad_video_transition${suffix}`, '""');
    //打赏
    appendField(`can_reward${suffix}`, '0');
    appendField(`pay_gifts_count${suffix}`, '0');
    appendField(`related_video${suffix}`, '');
    appendField(`is_video_recommend${suffix}`, '0');
    appendField(`title${suffix}`, item.title);
    appendField(`is_user_title${suffix}`, '');
    appendField(`author${suffix}`, '');
    appendField(`writerid${suffix}`, '0');
    appendField(`fileid${suffix}`, '');
    appendField(`digest${suffix}`, '');
    appendField(`auto_gen_digest${suffix}`, '1');
    appendField(`content${suffix}`, item.content ?? '');
    appendField(`sourceurl${suffix}`, '');
    appendField(`last_choose_cover_from${suffix}`, '0');
    //appendField(`need_open_comment${suffix}`, '1');
    appendField(`only_fans_can_comment${suffix}`, '1');
    appendField(`only_fans_days_can_comment${suffix}`, '0');
    appendField(`reply_flag${suffix}`, '3');
    appendField(`not_pay_can_comment${suffix}`, '0');
    appendField(`auto_elect_comment${suffix}`, '0');
    appendField(`auto_elect_reply${suffix}`, '0');
    appendField(`option_version${suffix}`, '5');
    const commentData = buildVideoCommentData(item.needOpenComment ?? 1, item.needOpenReply ?? 3);
    appendField(`need_open_comment${suffix}`, String(commentData.need_open_comment));
    appendField(`only_fans_can_comment${suffix}`, String(commentData.only_fans_can_comment));
    appendField(`only_fans_days_can_comment${suffix}`, String(commentData.only_fans_days_can_comment));
    appendField(`reply_flag${suffix}`, String(commentData.reply_flag));
    appendField(`open_fansmsg${suffix}`, String(item.openFansMsg ?? 0));
    appendField(`cdn_url${suffix}`, item.coverUrl);
    appendField(`cdn_235_1_url${suffix}`, item.coverUrl16_9 ?? item.coverUrl);
    appendField(`cdn_16_9_url${suffix}`, item.coverUrl16_9 ?? item.coverUrl);
    appendField(`cdn_3_4_url${suffix}`, '');
    appendField(`cdn_1_1_url${suffix}`, item.coverUrl1_1 ?? item.coverUrl);
    appendField(`cdn_finder_url${suffix}`, '');
    appendField(`cdn_video_url${suffix}`, '');
    appendField(`cdn_url_back${suffix}`, item.coverUrlBack ?? normalizeVideoCoverBackUrl(item.coverUrl));
    appendField(
      `crop_list${suffix}`,
      item.cropCoordinate ??
        JSON.stringify({
          crop_list: [
            { ratio: '2.35_1', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: '1_1', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: '3_4', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: '16_9', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: 'video', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: 'finder', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
          ],
          crop_list_percent: [
            { ratio: '2.35_1', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: '1_1', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: '3_4', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: '16_9', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: 'video', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
            { ratio: 'finder', x1: 0, y1: 0, x2: 0, y2: 0, file_id: 0 },
          ],
        }),
    );
    appendField(`app_cover_auto${suffix}`, '0');
    appendField(`music_id${suffix}`, '');
    appendField(`video_id${suffix}`, '');
    appendField(`voteid${suffix}`, '');
    appendField(`voteismlt${suffix}`, '');
    appendField(`supervoteid${suffix}`, '');
    appendField(`super_vote_id${suffix}`, '');
    appendField(`vid_type${suffix}`, '');
    appendField(`show_cover_pic${suffix}`, '0');
    appendField(`copyright_type${suffix}`, String(item.isOriginal ?? 0));
    appendField(`is_cartoon_copyright${suffix}`, '0');
    appendField(`copyright_img_list${suffix}`, '{"max_width":578,"img_list":[]}');
    appendField(`releasefirst${suffix}`, '');
    appendField(`platform${suffix}`, '');
    appendField(`reprint_permit_type${suffix}`, '');
    appendField(`allow_fast_reprint${suffix}`, '0');
    appendField(`allow_reprint${suffix}`, '');
    appendField(`allow_reprint_modify${suffix}`, '');
    appendField(`original_article_type${suffix}`, '');
    appendField(`ori_white_list${suffix}`, '');
    appendField(`video_ori_status${suffix}`, '1');
    appendField(`hit_nickname${suffix}`, '');
    appendField(`free_content${suffix}`, '');
    appendField(`fee${suffix}`, '0');
    appendField(`ad_id${suffix}`, '');
    appendField(`guide_words${suffix}`, getDynamicContentText(item.desc ?? ''));
    appendField(`is_share_copyright${suffix}`, '0');
    appendField(`share_copyright_url${suffix}`, '');
    appendField(`source_article_type${suffix}`, '');
    appendField(`reprint_recommend_title${suffix}`, '');
    appendField(`reprint_recommend_content${suffix}`, '');
    appendField(`share_page_type${suffix}`, '5');
    appendField(`share_imageinfo${suffix}`, '{"list":[]}');
    appendField(`share_video_id${suffix}`, item.shareVideoId);
    appendField(`dot${suffix}`, '{}');
    appendField(`share_voice_id${suffix}`, '');
    appendField(`share_finder_audio_username${suffix}`, '');
    appendField(`share_finder_audio_exportid${suffix}`, '');
    appendField(`mmlistenitem_json_buf${suffix}`, '');
    appendField(`insert_ad_mode${suffix}`, '');
    appendField(`categories_list${suffix}`, '[]');
    appendField(`compose_info${suffix}`, '{"list":""}');
    appendField(`is_pay_subscribe${suffix}`, '0');
    appendField(`pay_fee${suffix}`, '');
    appendField(`pay_preview_percent${suffix}`, '');
    appendField(`pay_desc${suffix}`, '');
    appendField(`pay_album_info${suffix}`, '');
    appendField(`appmsg_album_info${suffix}`, '{"appmsg_album_infos":[]}');
    appendField(`open_keyword_ad${suffix}`, '0');
    appendField(`open_comment_ad${suffix}`, '1');
    appendField(`audio_info${suffix}`, '{"audio_infos":[{"audio_id":"","appmsg_album_info":{"id":"","title":""}}]}');
    appendField(`danmu_pub_type${suffix}`, '0');
    appendField(`mp_video_info${suffix}`, item.mpVideoInfo || buildDefaultMpVideoInfo(item));
    appendField(`appmsg_danmu_pub_type${suffix}`, '');
    appendField(`is_set_sync_to_finder${suffix}`, '0');
    appendField(`sync_to_finder_cover${suffix}`, '');
    appendField(`sync_to_finder_cover_source${suffix}`, '');
    appendField(`import_to_finder${suffix}`, (item.import_to_finder ?? 0)?.toString());
    appendField(`import_from_finder_export_id${suffix}`, '');
    appendField(`style_type${suffix}`, '3');
    appendField(`sticker_info${suffix}`, '{}');
    appendField(`new_pic_process${suffix}`, '0');
    appendField(`disable_recommend${suffix}`, String(item.disableRecommend ?? 0));
    appendField(`claim_source_type${suffix}`, String(item.claimSourceType ?? 0));
    appendField(`is_user_no_claim_source${suffix}`, '0');
    appendField(`msg_index_id${suffix}`, '');
    appendField(`convert_to_image_share_page${suffix}`, '');
    appendField(`convert_from_image_share_page${suffix}`, '');
    appendField(`multi_picture_cover${suffix}`, '0');
    appendField(`title_gen_type${suffix}`, '0');
  });

  appendField(
    'req',
    JSON.stringify({
      idx_infos: taskData.contentList.map((_, index) => ({
        save_old: 0,
        cps_info: { cps_import: 0 },
        red_packet_cover_list: {},
        podcast_task_info: null,
        claim_source: { is_user_no_claim_source: index === 0 ? 0 : 1 },
        line_info: { is_appmsg_flag: 0, scene: 2 },
        window_product: {},
        link_info: { link_type: 1 },
        appmsg_link: {},
        weapp_link: {},
        yqj_info: {},
        ai_pic_info: { ai_pic_id: [] },
        single_video_snap_card: {},
        product_activity: {},
        footer_gift_activity: {},
        footer_common_shops: [],
        footer_product_card: {},
        location: {},
      })),
      appmsg_id: 0,
      is_use_flag: 0,
      template_version: '32551073',
    }),
  );
  appendField('remind_flag', 'null');
  appendField('is_auto_type_setting', '3');
  appendField('save_type', '0');
  appendField('masssend_check', '1');
  appendField('is_masssend', '1');
  appendField('isneedsave', '0');
  return formData;
};
