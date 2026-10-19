import { $http } from '../../http';
import * as buffer from 'buffer';
import { getNewSign, XiaohongshuUploadNode } from './xiaohongshu-base.service';
import { BaseTask } from '../baseTask';
import { XiaohongshuTopicInfo } from './xiaohongshu-topic.service';
import { XiaohongshuFriendInfo } from './xiaohongshu-friend.service';
import { XiaohongshuLocationInfo } from './xiaohongshu-location.service';

import crypto from 'crypto';
import { HtmlDocument } from '../../htmlAgilityPack';
import { Guid, htmlDecode } from '../../utils';
import { CancelToken } from '../../utils/CancelToken';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getXiaohongshuTopicList } from '@/media-platform/xiaohongshu/xiaohongshu-common';
import { ListItemInfo } from '@/media-platform';

/**
 * 获取视频上传id数据
 * @param uploadArgs  来自获取上传参数接口
 */
export const getUploadIdResponse = async (uploadArgs: XiaohongshuUploadNode): Promise<string> => {
  const url = `https://${uploadArgs.uploadAddr}/${uploadArgs.fileIds[0]}?uploads`;

  const headers = {
    'x-cos-security-token': uploadArgs.token,
    'Content-Type': 'video/mp4',
    referer: 'https://creator.xiaohongshu.com/',
    Origin: 'https://creator.xiaohongshu.com',
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
    referer: 'https://creator.xiaohongshu.com/',
    Origin: 'https://creator.xiaohongshu.com',
    Authorization: '',
  };

  let result = await $http.put(url, buffer.Buffer.from(videoData), {
    headers: headers,
    responseType: 'text',
  });
  if (!result?.headers['etag']) {
    result = await $http.put(url, buffer.Buffer.from(videoData), {
      headers: headers,
      responseType: 'text',
    });
  }

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
    referer: 'https://creator.xiaohongshu.com/',
    Origin: 'https://creator.xiaohongshu.com',
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
  taskData: XiaohongshuVideoTaskInput,
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
      const topics = html.DocumentNode.SelectNodes('//topic') ?? [];
      const activitis = html.DocumentNode.SelectNodes('//activity') ?? [];
      topics.push(...activitis);
      if (topics?.length > 0) {
        let topicNum = 0;
        for (const item of topics) {
          if (topicNum >= 10) {
            item.parentNode?.removeChild(item);
            continue;
          }
          let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!topicStr || !topicStr.startsWith('{')) {
            const text = htmlDecode(item.getAttribute('text') ?? '');
            const tmpTopic = await getXiaohongshuTopicList(cookie, text);
            if (tmpTopic?.dataList?.length) {
              topicStr = JSON.stringify(tmpTopic.dataList[0]);
            } else {
              continue;
            }
          }
          topicNum++;
          const topicJo = JSON.parse(topicStr).raw;
          if (!topicJo?.name || !topicJo?.id) {
            throw new Error('存在不支持的话题');
          }
          item.textContent = ` #${topicJo.name}[话题]# `;
          tags.push({ id: topicJo.id, name: topicJo.name, link: topicJo.link, type: 'topic' });
        }
      }
      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          const friendStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!friendStr || !friendStr.startsWith('{')) {
            continue;
          }
          const friendJo = JSON.parse(friendStr).raw as XiaohongshuFriendInfo;
          item.textContent = ` @${friendJo.user_nickname ?? friendJo?.user_nickname}`;
          atUserList.push({
            nickname: friendJo.user_nickname ?? friendJo?.user_nickname,
            name: friendJo.user_nickname ?? friendJo?.user_nickname,
            user_id: friendJo.user_id ?? friendJo?.user_id,
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

  //定位地点
  // noinspection SpellCheckingInspection
  let location: { subname: string; name: string; poi_type: number; poi_id: string } | null;
  if (taskData.location?.name) {
    location = {
      poi_id: taskData.location.poiOid,
      name: taskData.location.name,
      poi_type: taskData.location.source,
      subname: taskData.location.subname,
    };
  } else {
    location = null;
  }

  //主体普通信息

  const business_binds = {
    version: 1,
    noteId: 0,
    bizType: 13,
    noteOrderBind: {},
    notePostTiming: {},
    groupBind: {},
    noteCollectionBind: { id: '' },
    optionRelationList: [],
    liveNoticeBind: {},
  };

  //关联直播
  if (taskData.bind_live_info?.yixiaoerId) {
    business_binds.liveNoticeBind = {
      id: taskData.bind_live_info.yixiaoerId,
      title: taskData.bind_live_info.yixiaoerName,
      liveNoticeType: taskData.bind_live_info.raw ? taskData.bind_live_info.raw['type'] : 1,
    };
  }

  //群聊
  if (taskData.group) {
    business_binds.groupBind = {
      groupId: taskData.group.yixiaoerId,
      groupName: taskData.group.yixiaoerName,
      desc: taskData.group.yixiaoerDesc,
      avatar: taskData.group.yixiaoerImageUrl,
    };
  }

  //合集
  if (taskData.collectionId) {
    business_binds.noteCollectionBind.id = taskData.collectionId;
  }

  //内容类型申明
  if (taskData.userDeclarationBind?.origin) {
    business_binds['userDeclarationBind'] = taskData.userDeclarationBind;
  }

  //定时发布
  if (taskData.postTime) {
    business_binds.notePostTiming['postTime'] = taskData.postTime;
  }

  //原创申明
  if (taskData.isOriginal === 1) {
    business_binds.optionRelationList.push({
      type: 'ORIGINAL_STATEMENT',
      relationList: [{ bizType: 'ORIGINAL_STATEMENT', bizId: Guid.NewGuid().toString(), extraInfo: '{}' }],
    } as never);
  }

  let biz_relations: undefined | never[] = undefined;
  //商品
  if (taskData.shopping_cart?.length) {
    const goodslist = [];
    for (const goods of taskData.shopping_cart) {
      const shopInfo = {
        biz_id: goods.yixiaoerId,
        biz_type: 'GOODS_SELLER_V2',
        extra_info: JSON.stringify({
          goods_id: goods.yixiaoerId,
          goods_name: goods.yixiaoerName,
          goods_type: (goods?.raw as any)?.goods_seller_type?.toString?.toLowerCase() ?? 'goods_seller',
          tab_id: 1,
          image_type: 'spec',
          left_bottom_type: 'BUY_GOODS',
          bind_order: 0,
        }),
      };
      goodslist.push(shopInfo as never);
    }
    biz_relations = goodslist;
  }

  re['common'] = {
    type: 'video',
    title: taskData?.title ?? '',
    note_id: '',
    desc: content,
    source: '{"type":"web","ids":"","extraInfo":"{\\"systemId\\":\\"web\\"}"}',
    business_binds: JSON.stringify(business_binds),
    ats: atUserList,
    biz_relations: biz_relations,
    hash_tag: tags,
    post_loc: location,
    privacy_info: {
      op_type: 1,

      //可见类型
      type: taskData.visibilityType ?? 0,
    },
  };
  re['image_info'] = null;
  const image_info = {};
  image_info['height'] = taskData.cover?.height ?? 1980;
  image_info['file_id'] = uploadedCoverKey;
  image_info['fileid'] = uploadedCoverKey;
  image_info['width'] = taskData.cover?.width ?? 1080;
  image_info['frame'] = {
    ts: 0,
    is_user_select: false,
    is_upload: false,
  };

  //视频信息
  re['video_info'] = {
    file_id: uploadedVideoKey,
    fileid: uploadedVideoKey,
    format_width: taskData?.video?.width ?? 720,
    format_height: taskData.video?.height ?? 1280,
    composite_metadata: {
      video: {
        bitrate: 0,
        colour_primaries: 'BT.709',
        duration: taskData?.video?.duration ?? 0,
        format: 'AVC',
        frame_rate: 30,
        height: taskData?.video?.height ?? 1280,
        matrix_coefficients: 'BT.709',
        rotation: 0,
        transfer_characteristics: 'BT.709',
        width: taskData?.video?.width ?? 720,
      },
      audio: {
        bitrate: 0,
        channels: 1,
        duration: taskData.video?.duration ?? 0,
        format: 'AAC',
        sampling_rate: 0,
      },
    },
    timelines: [],
    cover: image_info,
    chapters: [],
    chapter_sync_text: false,
    segments: {
      count: 1,
      need_slice: false,
      items: [],
    },
    entrance: 'web',
  };
  return JSON.stringify(re);
};

export interface XiaohongshuVideoTaskInput extends BaseTask {
  cancelToken?: CancelToken;
  /**
   * 话题
   */
  topics?: Array<XiaohongshuTopicInfo>;

  /**
   * 好友
   */
  mentionedUser?: Array<XiaohongshuFriendInfo>;

  /**
   * 定时发布，13位时间戳
   */
  postTime?: number;

  /**
   *地理位置
   */
  location?: XiaohongshuLocationInfo;

  /**
   * 可见类型
   * 0 公开
   * 1 私密
   * 4 互关好友可见
   */
  visibilityType: number;

  /**
   * 内容类型申明
   * 1：虚构演绎，仅供娱乐
   * 2：笔记含ai合成内容
   * 内容来源申明，暂不支持
   */
  userDeclarationBind?: {
    origin?: 1 | 2 | 3 | 4 | 5;
    photoInfo?: {
      photoPlace: { poiId: string; poiType: number; subname: string; name: string };
      photoTime: string; //'2026-01-14'
    };
    repostInfo?: {
      source?: string;
    };
  };

  /**
   * 原创申明
   * 1:申明
   * 0:不申明
   */
  isOriginal?: 0 | 1;

  /**
   * 合集id
   */
  collectionId?: string;

  /**
   * 群聊
   */
  group?: ListItemInfo;

  /**
   * 直播预告
   */
  bind_live_info?: ListItemInfo;

  /**
   * 挂载商品
   */
  shopping_cart?: Array<ListItemInfo>;
  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
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
  proxyAgent: HttpsProxyAgent<string> | object | undefined,
): Promise<XiaohongshuPublishResponse> => {
  const url = 'https://edith.xiaohongshu.com/web_api/sns/v2/note';

  //签名
  const baseurl = '/web_api/sns/v2/note';

  const sign = await getNewSign(baseurl, postData);
  const signJo = JSON.parse(sign);
  if (signJo && signJo['a1']) {
    cookie = cookie.replace('a1=', 'a1old=');
    cookie = `${cookie};a1=${signJo['a1']}`;
  }
  if (!signJo || !signJo['X-s']) {
    throw new Error('签名失败，请稍后重试');
  }
  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/',
    Origin: 'https://creator.xiaohongshu.com',
    Authorization: '',
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/110.0.0.0',
  };
  headers['X-s'] = signJo['X-s'];
  headers['X-t'] = signJo['X-t'];
  // const commData = {
  //   s0: 'windows',
  //   s1: '',
  //   x0: 'l',
  //   x1: '3.7.8',
  //   x2: 'PC',
  //   x3: 'ugc',
  //   x4: '0.74.2',
  //   x5: signJo['a1'],
  //   x6: signJo['X-t'],
  //   x7: signJo['X-s'],
  //   x8: 'b1', //localStorage.getItem('b1'),
  //   x9: '',
  //   x10: signJo['X-s'].length,
  // };
  headers['X-S-Common'] = signJo['X-S-Common'] ?? '';
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
