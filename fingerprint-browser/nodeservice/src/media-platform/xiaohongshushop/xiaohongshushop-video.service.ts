import { $http } from '../../http';
import * as buffer from 'buffer';
import { XiaohongshuUploadNode } from './xiaohongshushop-base.service';
import { BaseTask } from '../baseTask';
import { XiaohongshushopTopicInfo } from './xiaohongshushop-topic.service';
import { XiaohongshushopFriendInfo } from './xiaohongshushop-friend.service';
import { XiaohongshushopLocationInfo } from './xiaohongshushop-location.service';

import crypto from 'crypto';
import { XiaohongshushopPubGoodsInfo } from '../xiaohongshushop/xiaohongshushop-goods.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HtmlDocument } from '@/htmlAgilityPack';
import { Guid, htmlDecode } from '@/utils';
import { getXiaohongshuTopicList } from '@/media-platform/xiaohongshu/xiaohongshu-common';
import { getXiaohongshushopTopicList } from '@/media-platform/xiaohongshushop/xiaohongshushop-common';
import { CancelToken } from '@/utils/CancelToken';
import {
  getXiaohongshushopArkSignHeadersByCookie,
  XiaohongshushopArkSignContext,
} from './xiaohongshushop-ark-sign';

/**
 * 获取视频上传id数据
 * @param uploadArgs  来自获取上传参数接口
 */
export const getUploadIdResponse = async (uploadArgs: XiaohongshuUploadNode): Promise<string> => {
  const url = `https://${uploadArgs.uploadAddr}/${uploadArgs.fileIds[0]}?uploads`;

  const headers = {
    'x-cos-security-token': uploadArgs.token,
    'Content-Type': 'video/mp4',
    referer: 'https://ark.xiaohongshu.com',
    Origin: 'https://ark.xiaohongshu.com',
    Authorization: '',
  };

  const postData = '';

  const result = await $http.post(url, postData, {
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};

/**
 * 上传视频分片
 * @param videoData 视频分片数据
 * @param partNum 分片编号
 * @param uploadArgs 上传参数，来自上传接口
 * @param uploadId 上传id，来气获取上传id接口
 */
export const uploadVideoPart = async (
  videoData: buffer.Buffer,
  partNum: number,
  uploadArgs: XiaohongshuUploadNode,
  uploadId: string,
): Promise<{ partNum: number; msg: string }> => {
  const url = `https://${uploadArgs.uploadAddr}/${uploadArgs.fileIds[0]}?partNumber=${partNum}&uploadId=${uploadId}`;

  const headers = {
    'x-cos-security-token': uploadArgs.token,
    referer: 'https://ark.xiaohongshu.com',
    Origin: 'https://ark.xiaohongshu.com',
    Authorization: '',
  };

  const result = await $http.put(url, buffer.Buffer.from(videoData), {
    headers: headers,
    responseType: 'text',
  });

  return { partNum: partNum, msg: result.headers['etag'] ?? result.data };
};

/**
 * 获取上传完成的视频etag，确保上传正常完成
 * @param uploadArgs 上传参数，来自获取上传参数接口
 * @param uploadId 上传id，来自获取上传id接口
 * @param uploadedList 上传完成的分片信息列表，业务处理
 */
export const getUploadedVideoEtag = async (
  uploadArgs: XiaohongshuUploadNode,
  uploadId: string,
  uploadedList: Map<number, string>,
): Promise<string> => {
  const url = `https://${uploadArgs.uploadAddr}/${uploadArgs.fileIds[0]}?uploadId=${uploadId}`;

  const partStrList: Array<string> = [];
  for (let i = 1; i <= uploadedList.size; i++) {
    const partEtag = uploadedList.get(i);
    partStrList.push(`<Part><PartNumber>${i}</PartNumber><ETag>${partEtag}</ETag></Part>`);
  }

  const postData = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <CompleteMultipartUpload>${partStrList.join('')}</CompleteMultipartUpload>`;
  const md5 = crypto.createHash('md5').update(postData).digest('base64');

  const headers = {
    'x-cos-security-token': uploadArgs.token,
    referer: 'https://ark.xiaohongshu.com',
    Origin: 'https://ark.xiaohongshu.com',
    Authorization: '',
    'Content-MD5': md5,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};

/**
 * 组装发布数据
 * @param taskData 任务数据体
 * @param uploadedVideoKey 上传产生的视频id
 * @param uploadedCoverKey 上传产生的封面id
 * @param cookie
 */
export const buildPostData = async (
  taskData: XiaohongshushopVideoTaskInput,
  uploadedVideoKey: string,
  uploadedCoverKey: string,
  cookie: string,
): Promise<string> => {
  const re = {};

  let content = taskData?.desc ?? '';

  let topicsList: Array<{ id: string; name: string; link: string }> = [];
  let tags: Array<{ id: string; name: string; link: string; type: string }> = [];
  let atUserList: Array<{ nickname: string; name: string; user_id: string }> | undefined = [];

  //富文本话题好友
  if (content?.includes('<p') && content?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(content);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        let topicNum = 0;
        for (const item of topics) {
          if (topicNum >= 10) {
            item.parentNode?.removeChild(item);
            continue;
          }
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr || !topicStr.startsWith('{')) {
            const text = htmlDecode(item.getAttribute('text') ?? '');
            const tmpTopic = await getXiaohongshushopTopicList(cookie, text);
            if (tmpTopic?.data?.topic_info_dtos?.length) {
              topicStr = JSON.stringify(tmpTopic.data?.topic_info_dtos[0]);
            } else {
              continue;
            }
          }
          topicNum++;
          const topicJo = JSON.parse(topicStr);
          item.textContent = ` #${topicJo.name}[话题]# `;
          tags.push({ id: topicJo.id, name: topicJo.name, link: topicJo.link, type: 'topic' });
        }
      }
      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!friendStr || !friendStr.startsWith('{')) {
            continue;
          }
          const friendJo = JSON.parse(friendStr);
          item.textContent = ` @${friendJo.user_nickname ?? friendJo?.user_base_dto?.user_nickname}`;
          atUserList.push({
            nickname: friendJo.user_nickname ?? friendJo?.user_base_dto?.user_nickname,
            name: friendJo.user_nickname ?? friendJo?.user_base_dto?.user_nickname,
            user_id: friendJo.user_id ?? friendJo?.user_base_dto?.user_id,
          });
        }
      }
      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        if (!pItem) {
          continue;
        }
        if (pItem.textContent?.length) {
          newText = `${newText}${pItem.textContent.trim()}\n`;
        } else {
          if (pList[pIndex + 1]?.textContent?.length) {
            newText = `${newText}\n\t\n\n\n`;
          } else {
            newText = `${newText}\n\t\n\n`;
          }
        }
      }
      content = htmlDecode(newText);
    }
  } else {
    //话题
    topicsList = taskData.topics?.map((topic) => ({ id: topic.id, name: topic.name, link: topic.link })) ?? [];
    tags = topicsList?.map((topic) => ({ ...topic, type: 'topic' })) ?? [];
    if (topicsList?.length > 0) {
      topicsList.forEach((x) => {
        content += ` #${x.name}[话题]#`;
      });
    }

    //@好友
    atUserList = taskData?.mentionedUser?.map((user) => ({
      nickname: user.user_nickname,
      name: user.user_nickname,
      user_id: user.user_id,
    }));
    if (atUserList?.length) {
      atUserList?.forEach((x) => {
        content += ` @${x.name}`;
      });
    }
  }

  //定时发布
  const postTime = taskData.postTime?.toString();

  //定位地点
  // noinspection SpellCheckingInspection
  let location: { subname: string; name: string; poi_type: number; poi_id: string } | null;
  if (taskData.location?.name) {
    location = {
      poi_id: taskData.location.poiOid,
      name: taskData.location.name,
      poi_type: taskData.location.recommendType,
      subname: taskData.location.subname,
    };
  } else {
    location = null;
  }

  //主体普通信息
  //原创声明
  const optionRelationList =
    taskData.isOriginal === 1
      ? [
          {
            type: 'ORIGINAL_STATEMENT',
            relationList: [
              {
                bizType: 'ORIGINAL_STATEMENT',
                bizId: Guid.NewGuid().toString(),
                extraInfo: '{}',
              },
            ],
          },
        ]
      : [];
  const businessBinds = JSON.stringify({
    version: 1,
    noteId: 0,
    bizType: postTime ? 13 : 0,
    noteOrderBind: {},
    notePostTiming: postTime ? { postTime } : {},
    noteCollectionBind: { id: '' },
    noteSketchCollectionBind: { id: '' },
    coProduceBind: { enable: true },
    noteCopyBind: { copyable: true },
    noteIncentiveBind: { count: 0 },
    interactionPermissionBind: { commentPermission: 0 },
    optionRelationList,
  });

  re['common'] = {
    type: 'video',
    title: taskData?.title ?? '',
    note_id: '',
    desc: content,
    source: '{"type":"web","ids":"","extraInfo":"{\\"systemId\\":\\"ark\\"}"}',
    business_binds: businessBinds,
    ats: atUserList,
    hash_tag: tags,
    post_loc: location,
    privacy_info: {
      op_type: 1,

      //可见类型
      type: taskData.visibilityType ?? 0,
      user_ids: [],
    },
    goods_info: {
      extension: {
        live_preheat: '0',
      },
    },
    biz_relations: [],
  };
  re['image_info'] = null;
  const videoWidth = taskData.video?.width ?? 720;
  const videoHeight = taskData.video?.height ?? 1280;
  const videoDuration = taskData.video?.duration ?? 0;
  const mediaDuration = Math.round(videoDuration * 1000);
  const image_info = {};
  image_info['height'] = taskData.cover?.height ?? 1980;
  image_info['fileid'] = uploadedCoverKey;
  image_info['file_id'] = uploadedCoverKey;
  image_info['width'] = taskData.cover?.width ?? 1080;
  image_info['frame'] = {
    ts: 0,
    is_user_select: false,
    is_upload: false,
  };
  image_info['stickers'] = {
    neptune: [],
    version: 2,
  };
  image_info['fonts'] = [];
  image_info['extra_info_json'] = JSON.stringify({});

  const videoMetadata = {
    bitrate: 0,
    colour_primaries: 'BT.709',
    duration: mediaDuration,
    format: 'AVC',
    frame_rate: 30,
    height: videoHeight,
    matrix_coefficients: 'BT.709',
    rotation: 0,
    transfer_characteristics: 'BT.709',
    width: videoWidth,
  };
  const audioMetadata = {
    bitrate: 0,
    channels: 1,
    duration: mediaDuration,
    format: 'AAC',
    sampling_rate: 0,
  };

  //视频信息
  re['video_info'] = {
    fileid: uploadedVideoKey,
    file_id: uploadedVideoKey,
    format_width: videoWidth,
    format_height: videoHeight,
    video_preview_type: videoWidth / videoHeight <= 0.6 ? 'full_vertical_screen' : '',
    composite_metadata: {
      video: videoMetadata,
      audio: audioMetadata,
    },
    timelines: [],
    cover: image_info,
    chapters: [],
    chapter_sync_text: false,
    segments: {
      count: 1,
      need_slice: false,
      items: [
        {
          mute: 0,
          speed: 1,
          start: 0,
          duration: videoDuration,
          transcoded: 0,
          media_source: 1,
          original_metadata: {
            video: videoMetadata,
            audio: audioMetadata,
          },
        },
      ],
    },
    entrance: 'web',
  };

  //商品
  if (taskData.goods?.length && taskData.goods[0]?.goods_id) {
    const biz_relations = [];
    let i = 0;
    for (const goods of taskData.goods) {
      const extr = {
        goods_id: goods.goods_id,
        goods_name: goods.name,
        goods_type: goods.goods_seller_type,
        tab_id: 1,
        image_type: 'spec',
        left_bottom_type: 'BUY_GOODS',
        bind_order: i,
      };
      i++;
      biz_relations.push({
        biz_id: goods.goods_id.toString(),
        biz_type: 'GOODS_SELLER_V2',
        extra_info: JSON.stringify(extr),
      } as never);
    }
    re['common']['biz_relations'] = biz_relations;
  }
  return JSON.stringify(re);
};

export interface XiaohongshushopVideoTaskInput extends BaseTask {
  /**
   * 浏览器签名上下文。
   */
  signContext?: XiaohongshushopArkSignContext;

  /**
   * 话题
   */
  topics?: Array<XiaohongshushopTopicInfo>;

  /**
   * 好友
   */
  mentionedUser?: Array<XiaohongshushopFriendInfo>;

  /**
   * 定时发布，13位时间戳
   */
  postTime?: number;

  /**
   *地理位置
   */
  location?: XiaohongshushopLocationInfo;

  /**
   * 可见类型
   * 0 公开
   * 1 私密
   * 4 互关好友可见
   */
  visibilityType: number;

  /**
   * 原创声明
   * 1: 声明
   * 0: 不声明
   */
  isOriginal?: 0 | 1;

  /**
   * 挂车商品信息（商品的二级信息）
   */
  goods?: Array<XiaohongshushopPubGoodsInfo>;

  /**
   * 代理
   */
  proxy?: KuaiDaiLiProxy;

  cancelToken?: CancelToken;
}

/**
 * 推送组装好的数据到官方
 * @param cookie
 * @param postData 组装好的字符串
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
  signContext?: XiaohongshushopArkSignContext,
): Promise<XiaohongshuPublishResponse> => {
  const url = 'https://edith.xiaohongshu.com/web_api/sns/v2/note';

  //签名
  const baseurl = '/web_api/sns/v2/note';

  const sign = getXiaohongshushopArkSignHeadersByCookie(baseurl, JSON.parse(postData), cookie, signContext);
  const headers = {
    cookie: cookie,
    referer: 'https://ark.xiaohongshu.com',
    Origin: 'https://ark.xiaohongshu.com',
    Authorization: '',
    'Content-Type': 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 360/4.6.9 Chrome/138.0.7204.185 Safari/537.36',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  headers['X-S-Common'] = sign['X-S-Common'];

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  if (result.status == 461 && result.headers['verifytype']) {
    return { code: 461, msg: 'canvas illegal' } as never;
  }
  if (result.status > 300) {
    return { code: result.data?.code ?? result.status ?? -1, msg: result?.data?.msg ?? result.statusText } as never;
  }
  return result.data;
};

export interface XiaohongshuPublishResponse {
  /**
   * 视频url
   */
  share_link: string;
  business_bind_results: [];
  /**
   * 状态码
   * 0正常，非0异常
   */
  result: number;
  /**
   * 状态码
   * -100表示未登录
   */
  code?: number;

  success: boolean;
  /**
   * 提示消息 如:五登录信息
   */
  msg: string;
  /**
   * 结果数据
   */
  data: {
    /**
     * 发布后的唯一id--publishId
     */
    id: string;
    score: number;
  };
}
