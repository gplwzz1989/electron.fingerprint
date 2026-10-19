import { $http } from '../../http';
import * as buffer from 'buffer';
import { BaseTask } from '../baseTask';
import { BilibiliVideoTopicInfo } from './bilibili-topic.service';
import { htmlDecode, isJson } from '../../utils';
import { HtmlDocument } from '../../htmlAgilityPack';

import { CancelToken } from '../../utils/CancelToken';
import FormData from 'form-data';
import { BilibiliVideoCategoryInfo } from './bilibili-category.service';
import { KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getBilibiliVideoTopic } from '@/media-platform/bilibili/bilibili-common';
import { ListItemInfo } from '@/media-platform';
import {
  BilibiliVideoParticipationTopicSelection,
  resolveBilibiliVideoParticipationTopic,
} from './bilibili-participation-topic.service';

/**
 * 获取上传domain，默认用第一个
 * @param cookie
 */
export const getUploadDomainResponse = async (cookie: string): Promise<BilibiliUploadDomainResponse> => {
  const url = 'https://member.bilibili.com/preupload?r=probe';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface BilibiliUploadDomainResponse {
  /**
   * 状态码
   */
  OK: number;

  /**
   * 上传domain列表
   */
  lines: Array<{
    os: string;
    query: string;
    probe_url: string;
  }>;
  probe: { post: number };
}

/**
 * 获取预发布参数
 * @param cookie
 */
export const getPreUploadArgsResponse = async (cookie: string): Promise<UploadArgsResponse> => {
  const url =
    'https://member.bilibili.com/preupload?name=file_meta.txt&size=2000&r=upos&profile=fxmeta%2Fbup&ssl=0&version=2.14.0.0&build=2140000&webVersion=2.14.0';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame?page_from=creative_home_top_upload',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data ? result.data : { OK: result.status };
};

/**
 * 获取上传参数
 * @param cookie
 * @param fileName 文件名
 * @param fileSize 文件大小
 * @param uploadDomain 相关域名参数
 */
export const getUploadArgsResponse = async (
  cookie: string,
  fileName: string,
  fileSize: number,
  uploadDomain: BilibiliUploadDomainResponse,
): Promise<UploadArgsResponse> => {
  // noinspection SpellCheckingInspection
  const preQuery =
    uploadDomain.lines?.length > 0
      ? uploadDomain.lines[0].query + '&r=' + uploadDomain.lines[0].os
      : 'upcdn=bda2&probe_version=20200224&r=upos';

  // noinspection SpellCheckingInspection
  const url = `https://member.bilibili.com/preupload?${preQuery}`;

  const params = {
    name: 'frames_' + fileName + '.zip',
    size: fileSize,
    profile: 'ugcupos/bup',
    ssl: 0,
    version: '2.7.1',
    build: 2070100,
  };

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame?page_from=creative_home_top_upload',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data ? result.data : { OK: result.status };
};

// noinspection SpellCheckingInspection
export interface UploadArgsResponse {
  /**
   * 状态码，正常是1,没什么卵用，异常情况会使用http状态码表示,http状态码会填充到这里
   */
  OK: number;
  /**
   * 请求头需要的认证参数
   */
  auth?: string;
  biz_id?: number;
  chunk_retry?: number;
  chunk_retry_delay?: number;
  chunk_size?: number;
  /**
   *  上传域名
   */
  endpoint?: string;
  /**
   * 上传备用域名列表
   */
  endpoints?: Array<string>;
  expose_params?: null;
  put_query?: string;
  // 并发数?
  threads?: number;
  timeout?: number;
  uip?: string;
  upos_uri?: string;
  message?: string;
}

/**
 * 获取上传id
 * @param uploadArgs
 */
// noinspection SpellCheckingInspection
export const getUploadIdResponse = async (uploadArgs: UploadArgsResponse): Promise<UploadIdResponse> => {
  // noinspection SpellCheckingInspection
  const url = `https:${uploadArgs.endpoint}/${uploadArgs.upos_uri?.split('//')[1]}?uploads&output=json`;

  // noinspection SpellCheckingInspection
  const headers = {
    Referer: 'https://member.bilibili.com/',
    'X-Upos-Auth': uploadArgs.auth,
  };

  const result = await $http.post(url, '', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data ? result.data : { OK: result.status };
};

export interface UploadIdResponse {
  /**
   * 状态码，正常是1,没什么卵用，异常情况会使用http状态码表示,http状态码会填充到这里
   */
  OK: number;
  /**
   * 上传id
   */
  upload_id?: string;
  /**
   * 存储桶
   */
  bucket?: string;
  key?: string;
}

/**
 * 上传视频分片
 * @param uploadArgs 上传参数
 * @param videoData 视频分片数据
 * @param partNum 分片编号
 * @param startIndex 分片起始索引
 * @param fileSize 视频文件大小
 * @param uploadId 上传id
 * @param totalParts 总分片数
 * @param endPoint
 * @return MULTIPART_PUT_SUCCESS 表示成功
 */
export const uploadVideoPart = async (
  uploadArgs: UploadArgsResponse,
  videoData: buffer.Buffer,
  partNum: number,
  startIndex: number,
  fileSize: number,
  uploadId: string,
  totalParts: number,
  endPoint: string,
): Promise<string> => {
  let status = '';
  for (let i = 0; i < 3; i++) {
    const url = `https:${
      i > 0 && uploadArgs.endpoints ? uploadArgs.endpoints[i % uploadArgs.endpoints?.length] : endPoint
    }/${uploadArgs.upos_uri?.split('//')[1]}`;

    const params = {
      partNumber: partNum,
      uploadId: uploadId,
      chunk: partNum - 1,
      chunks: totalParts,
      size: videoData.length,
      start: startIndex,
      end: startIndex + videoData.length,
      total: fileSize,
    };

    // noinspection SpellCheckingInspection
    const headers = {
      Referer: 'https://member.bilibili.com/',
      'X-Upos-Auth': uploadArgs.auth,
    };

    const result = await $http.put(url, buffer.Buffer.from(videoData), {
      headers: headers,
      params: params,
      responseType: 'text',
    });
    status = result.status.toString();
    if (result.status > 204) {
      continue;
    }

    //状态码200表示成功
    return status;
  }
  return status;
};

/**
 * 获取上传完成视频信息
 * @param uploadArgs 上传参数
 * @param totalParts 总分片数
 * @param fileName 文件名
 * @param uploadId 上传id
 */
export const getUploadedVideoInfoResponse = async (
  uploadArgs: UploadArgsResponse,
  totalParts: number,
  fileName: string,
  uploadId: string,
): Promise<UploadedVideoInfoResponse> => {
  const url = `https://${uploadArgs.endpoint}/${uploadArgs.upos_uri?.split('//')[1]}`;

  // noinspection SpellCheckingInspection
  const headers = {
    Referer: 'https://member.bilibili.com/',
    'X-Upos-Auth': uploadArgs.auth,
  };

  // noinspection SpellCheckingInspection
  const params = {
    output: 'json',
    name: fileName,
    profile: 'ugcupos/bup',
    uploadId: uploadId,
    biz_id: uploadArgs.biz_id,
  };

  const postData: Array<{ eTag: string; partNumber: number }> = [];
  for (let part = 1; part <= totalParts; part++) {
    postData.push({ eTag: 'etag', partNumber: part });
  }

  const result = await $http.post(
    url,
    { parts: postData },
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: headers,
      params: params,
    },
  );

  return result.data;
};

export interface UploadedVideoInfoResponse {
  /**
   * 正常情况1 非1表示异常
   */
  OK?: number;
  bucket?: string;
  location?: string;
  key?: string;
  etag?: string;
  error?: string;
  http_code?: number;
  title?: string;
}

/**
 * 组装发布参数
 * @param taskData 发布任务体
 * @param coverUrl 上传完成的封面url
 * @param uploadArgs 视频上传参数体
 * @param csrfToken cookie中bili_jct值
 * @param uploadKey 获取上传id参数中的key
 * @param cookie
 */
export const buildPostData = async (
  taskData: BilibiliVideoTaskInput,
  coverUrl: string,
  uploadArgs: UploadArgsResponse,
  csrfToken: string,
  uploadKey: string,
  cookie: string,
): Promise<string> => {
  const result = {};

  // 申明自制
  result['copyright'] = taskData.copyright ?? 3;
  result['act_reserve_create'] = 0;
  result['csrf'] = csrfToken;
  result['lossless_music'] = 0;
  result['no_disturbance'] = 0;
  result['recreate'] = -1;
  result['web_os'] = 1;

  //转载来源
  const src = taskData.source ?? '';
  if (src && src.startsWith('http')) {
    result['source'] = src;
    result['copyright'] = 2;
  } else {
    result['copyright'] = 1;

    // 禁止转载
    result['no_reprint'] = taskData.no_reprint ?? 1;
    result['interactive'] = 0;

    // 是否启用充电面板
    // noinspection SpellCheckingInspection
    result['open_elec'] = taskData.open_elec ?? 1;
  }

  // 封面
  result['cover'] = coverUrl;

  let newDesc = taskData.desc ?? '';
  // 描述
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //适应产品要求，兼容话题
      if (!taskData.topic?.topic_name) {
        const topics = html.DocumentNode.SelectNodes('//topic');
        if (topics?.length > 0) {
          const topicStr = htmlDecode(decodeURIComponent(topics[0]?.getAttribute('raw') ?? ''));
          if (topicStr?.startsWith('{')) {
            taskData.topic = JSON.parse(topicStr).raw;
            // 清除topic在描述中的文字
            for (const inTopic of topics) {
              inTopic.innerHTML = '';
            }
          } else {
            const text = topics[0]?.getAttribute('text') ?? '';
            const tmpTopic = await getBilibiliVideoTopic(cookie, taskData.tid ?? taskData.category?.id ?? 21, text);
            if (tmpTopic?.dataList?.length) {
              taskData.topic = tmpTopic?.dataList[0].raw as BilibiliVideoTopicInfo;
              for (const inTopic of topics) {
                inTopic.innerHTML = '';
              }
            }
          }
        }
      }

      ////替换缓存
      const tmpDataMap = new Map<string, string>();
      let iCount = 0;
      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          iCount++;
          const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!friendStr?.startsWith('{')) {
            continue;
          }
          const key = `{tmp_f${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, friendStr);
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      //缓存替换
      const regex = /\{tmp_[^}]+\}/g;

      const matches: string[] = [];

      let match;
      while ((match = regex.exec(newText)) !== null) {
        matches.push(match[0]);
      }

      const strList: Array<string> = [];

      //分割
      for (const tmpKey of matches) {
        const preStr = newText.split(tmpKey)[0];
        if (preStr.length > 0) {
          strList.push(preStr.trimStart());
        }
        strList.push(tmpKey);
        newText = newText.replace(preStr + tmpKey, '');
      }
      if (newText?.trim()) {
        strList.push(newText.trim());
      }
      const descv2: Array<{ biz_id: string; raw_text: string; type: number }> = [];
      //替换好友
      for (let i = 0; i < strList.length; i++) {
        const item = strList[i];
        if (item.includes('tmp_f')) {
          const jo = JSON.parse(tmpDataMap.get(item) ?? '{}');
          strList[i] = `@${jo.name}  `;
          descv2.push({ biz_id: jo.uid, raw_text: strList[i].trim().substring(1), type: 2 });
          descv2.push({ biz_id: '', raw_text: ' ', type: 1 });
        } else {
          descv2.push({ biz_id: '', raw_text: htmlDecode(item), type: 1 });
        }
      }
      newDesc = htmlDecode(strList.join(''));
      if (taskData.pubType != 0) {
        result['desc_v2'] = descv2;
      }
    } else {
      newDesc = html.DocumentNode.InnerText();
    }
    result['desc'] = htmlDecode(newDesc ?? '');
  } else {
    result['desc'] = htmlDecode(newDesc);
  }

  result['desc_format_id'] = 0;

  // 普通话题和参与话题是两种不同的能力，分别保留原有 topic 和新的
  // participationTopic 字段。参与话题的统一列表项 raw 中保存官方返回值。
  const tags = [...(taskData.tags ?? [])];
  const participationTopic = resolveBilibiliVideoParticipationTopic(taskData.participationTopic ?? taskData.activity);
  const topicName = taskData.topic?.topic_name;
  const participationTopicName = participationTopic?.topic_name;

  // 参与话题/普通话题文字需要加到标签列表中，占用标签数量。
  if (topicName && !tags.includes(topicName)) {
    tags.push(topicName);
  }
  if (participationTopicName && !tags.includes(participationTopicName)) {
    tags.push(participationTopicName);
  }

  // 组装标签
  result['tag'] = tags.length > 0 ? tags.join(',') : '';

  // 粉丝动态
  result['dynamic'] = taskData?.dynamic ?? '';

  // 参与话题/普通话题的官方关联字段。新的参与话题优先，兼容旧 topic。
  const topicId = participationTopic?.topic_id ?? taskData.topic?.topic_id;
  const missionId = participationTopic?.mission_id ?? taskData.topic?.mission_id;
  if (topicId !== undefined && topicId !== null && topicId !== '') {
    result['mission_id'] = missionId ?? 0;
    result['topic_id'] = topicId;
    result['topic_detail'] = {};
    result['topic_detail']['from_source'] = 'arc.web.recommend';
    result['topic_detail']['from_topic_id'] = topicId;
  }
  //分区分类
  result['tid'] = taskData?.tid ?? 21;
  if (taskData.category?.id) {
    //result['tid'] = taskData?.category?.id;
    //新分类
    result['human_type2'] = taskData?.category?.id;
  }
  result['title'] = taskData?.title ?? '';

  // 字幕设置及是否允许弹幕
  result['subtitle'] = {};

  // 弹幕语言
  result['subtitle']['lan'] = taskData.subtitle_lan ? taskData.subtitle_lan : '';
  result['subtitle']['open'] = taskData.subtitle_open ?? 0;

  result['desc_format_id'] = 0;

  // 是否关闭评论
  result['up_close_reply'] = taskData.up_close_reply ?? false;

  // 是否关闭弹幕
  // noinspection SpellCheckingInspection
  result['up_close_danmu'] = taskData.up_close_danmu ?? false;

  // 是否开启精彩评论
  result['up_selection_reply'] = taskData.up_selection_reply ?? false;

  //杜比音效
  result['dolby'] = taskData.dolby ?? 0;

  //创作者申明
  if (taskData.neutral_mark) {
    result['neutral_mark'] = taskData.neutral_mark ?? '';
  }
  // 定时发布
  if (taskData.dtime) {
    // noinspection SpellCheckingInspection
    result['dtime'] = taskData.dtime;
  }

  //合集
  if (taskData.collection?.yixiaoerId) {
    result['season_id'] = Number(taskData.collection.yixiaoerId);
  }

  // 视频信息
  const video: { cid?: number; desc?: string; title?: string; filename?: string } = {};
  const videoJa: Array<{ cid?: number; desc?: string; title?: string; filename?: string }> = [];
  video.cid = uploadArgs.biz_id;
  video.desc = '';
  video.title = taskData.title;
  video.filename = uploadKey.split('.')[0].split('/')[1];
  videoJa.push(video);
  result['videos'] = videoJa;

  return JSON.stringify(result);
};

export interface BilibiliVideoTaskInput extends BaseTask {
  cancelToken?: CancelToken;
  /**
   * 申明自制 1为自制，2为转载
   */
  copyright?: number;

  /**
   * 转载来源url
   */
  source: string;

  /**
   * 禁止转载 1为禁止 非1不禁止
   */
  no_reprint: number;

  // noinspection SpellCheckingInspection
  /**
   * 是否启用充电面板 1是，非1 否 ，当创作类型为自制时才能使用
   */
  open_elec: number;

  /**
   * 标签，不可与官方已有话题同名
   */
  tags?: Array<string>;

  /**
   * 粉丝动态
   */
  dynamic?: string;

  /**
   * 分区/分类信息id，使用二级分类id，当没有二级分类时，使用一级分类
   */
  tid: number;

  /**
   * 新版 分区/分类信息id，使用二级分类，当没有二级分类时，使用一级分类
   */
  category?: BilibiliVideoCategoryInfo;

  /**
   * 弹幕/字幕语言 默认中文
   */
  subtitle_lan?: string;

  /**
   * 允许投稿字幕 1开启 0不开启
   */
  subtitle_open?: number;

  /**
   * 是否关闭评论，和开启精彩评论互斥
   */
  up_close_reply: boolean;

  // noinspection SpellCheckingInspection
  /**
   * 是否关闭弹幕
   */
  up_close_danmu: boolean;

  /**
   * 是否开启精彩评判 和关闭评论互斥
   */
  up_selection_reply: boolean;

  /**
   *  是否杜比音效 1是 0否
   */
  dolby?: number;

  // noinspection SpellCheckingInspection
  /**
   * 定时发布时间 10位时间戳
   */
  dtime?: number;

  /**
   * 普通话题兼容字段，与 participationTopic 独立
   */
  topic?: BilibiliVideoTopicInfo;

  /**
   * 参与话题，与普通 topic 独立。应传入参与话题查询/搜索返回的完整列表项，
   * 或其 raw 官方原始数据。
   */
  participationTopic?: BilibiliVideoParticipationTopicSelection;

  /**
   * 兼容统一发布任务中的 activity 字段；仅作为参与话题读取。
   */
  activity?: BilibiliVideoParticipationTopicSelection;

  /**
   * 创作者申明
   * 作者声明：该视频使用人工智能合成技术
   * 作者声明：视频内含有危险行为，请勿轻易模仿
   * 作者声明：该内容仅供娱乐，请勿过分解读
   * 作者声明：该内容可能引人不适，请谨慎选择观看
   * 作者声明：请理性适度消费
   * 作者声明：个人观点，仅供参考
   */
  neutral_mark?: string;
  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 合集
   */
  collection?: ListItemInfo;
}

/**
 * 推送发布数据到官方
 * @param cookie
 * @param postData 组装好的数据
 * @param csrfToken cookie中bili_jct值
 * @param pubType 发布类型 1直接发布 0存草稿
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  postData: string,
  csrfToken: string,
  pubType: number = 1,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<PublishResultResponse> => {
  let url = 'https://member.bilibili.com/x/vu/web/add/v3';
  if (pubType == 0) {
    url = 'https://member.bilibili.com/x/vupre/web/draft/add';
  }

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const params = {
    t: new Date().getTime(),
    csrf: csrfToken,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PublishResultResponse {
  /**
   * 状态码 0:正常 非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  data: {
    /**
     * 作品唯一Id
     */
    aid: number;
    // noinspection SpellCheckingInspection
    /**
     * 视频id
     */
    bvid: string;
  };
}

/**
 * 获取推荐标签
 * @param cookie
 * @param tid
 * @param upFileName
 * @param title
 * @param desc
 * @param uploadId
 */
export const getRecTagsResponse = async (
  cookie: string,
  tid: number,
  upFileName: string,
  title: string,
  desc: string,
  uploadId: string,
): Promise<RecTagsResponse> => {
  const url = 'https://member.bilibili.com/x/vupre/web/tag/recommend';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame',
  };

  const tm = new Date().getTime();
  const params = {
    t: tm,
    upload_id: uploadId,
    subtype_id: tid,
    title: title ?? '',
    filename: upFileName,
    description: desc ?? '',
    cover_url: '',
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface RecTagsResponse {
  code: number;
  //标签列表
  data: Array<{
    tag: string;
    checked: number;
    request_id: string;
  }>;
  message: string;
  request_id: string;
}

/**
 * 获取推荐分类
 * @param cookie
 * @param csrf
 * @param title
 * @param upFileName
 * @param uploadId
 */
export const getRecCategoryResponse = async (
  cookie: string,
  csrf: string,
  title: string,
  upFileName: string,
  uploadId: string,
): Promise<RecCategoryResponse> => {
  const url = 'https://member.bilibili.com/x/vupre/web/archive/types/predict';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame',
  };

  const tm = new Date().getTime();
  const params = {
    t: tm,
    csrf: csrf,
  };

  const multiFormData = new FormData();
  multiFormData.append('title', title ?? '');
  multiFormData.append('upload_id', uploadId);
  multiFormData.append('filename', upFileName);

  const result = await $http.post(url, multiFormData, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface RecCategoryResponse {
  code: number;
  message: string;
  ttl: 1;
  data: Array<{
    id: number;
    parent: number;
    parent_name: string;
    name: string;
    desc: string;
  }>;
}
