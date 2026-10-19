import { XiaohongshuPublishResultOutput } from './xiaohongshushop-video';
import { EventEmitter } from 'events';
import { XiaohongshushopTopicInfo } from './xiaohongshushop-topic.service';
import { XiaohongshushopFriendInfo } from './xiaohongshushop-friend.service';
import { XiaohongshushopLocationInfo } from './xiaohongshushop-location.service';
import {
  convertImageFileToBuffer,
  Guid,
  htmlDecode,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
} from '../../utils';
import { ImageInfo, ListItemInfo } from '../../media-platform/baseModel';
import { getUploadArgsResponse, uploadImage, XiaohongshuUploadNode } from './xiaohongshushop-base.service';
import { errorCode } from '../errorCode';
import { XiaohongshuPublishResponse } from './xiaohongshushop-video.service';
import { AxiosError } from 'axios';
import { $http } from '../../http';
import { HtmlDocument } from '@/htmlAgilityPack';
import { createKuaiProxyAgent } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getXiaohongshushopTopicList } from './xiaohongshushop-common';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import type { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { XiaohongshushopPubGoodsInfo } from '../xiaohongshushop/xiaohongshushop-goods.service';
import { getXiaohongshushopArkSignHeadersByCookie, XiaohongshushopArkSignContext } from './xiaohongshushop-ark-sign';

/**
 * 发布小红书视频
 * @param cookie
 * @param taskData 小红书视频发布人物体
 * @param eventCallback 事件回调
 * @param retryTimes 最大重试次数
 */
export const xiaohongshuPublishArticle = async (
  cookie: string,
  taskData: XiaohongshushopArticleTaskInput,
  eventCallback: EventEmitter,
  retryTimes: number = 3,
): Promise<XiaohongshuPublishResultOutput> => {
  console.group('小红书图文发布', taskData.taskId);
  const pubResult: XiaohongshuPublishResultOutput = {
    code: 0,
    msg: 'ok',
    taskId: taskData.taskId,
  };
  try {
    taskData.cancelToken?.throwIfCancelled(privateKey);

    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    if (!(taskData.images?.length > 0)) {
      pubResult.code = 2;
      pubResult.msg = '最少需要一张图片';
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }

    //最多支持18张图
    taskData.images = taskData.images.slice(0, 18);

    //获取文件信息
    SetProgressEvent(eventCallback, 3, '正在上传图片', taskData.taskId);

    // region 图片上传
    const imgInfoList: Array<ImageInfo> = [];
    let processCount = 0;
    for (const img of taskData.images) {
      taskData.cancelToken?.throwIfCancelled(privateKey);
      SetProgressEvent(eventCallback, (80 / taskData.images.length) * processCount + 5, '图片上传中', taskData.taskId);
      processCount++;
      let imageUploadNode = await uploadImageProcess(taskData.taskId, img.pathOrUrl, eventCallback, cookie, pubResult);
      for (let i = 0; i < retryTimes; i++) {
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!imageUploadNode || !(imageUploadNode?.fileIds?.length > 0)) {
          if (i < retryTimes - 1 && pubResult?.code != -100) {
            imageUploadNode = await uploadImageProcess(
              taskData.taskId,
              img.pathOrUrl,
              eventCallback,
              cookie,
              pubResult,
            );
            continue;
          }
          pubResult.code = pubResult?.code ?? errorCode.data_error;
          pubResult.msg = pubResult?.msg ?? `图片上传失败${img.pathOrUrl}`;
          return pubResult;
        } else {
          imgInfoList.push({
            width: img.width ?? 4096,
            height: img.height ?? 4096,
            pathOrUrl: imageUploadNode.fileIds[0],
          });
          break;
        }
      }
      if (!imageUploadNode?.fileIds) {
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? '图片上传失败';
        return pubResult;
      }
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    // endregion

    // region 组装并推送数据
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    //组装发布数据
    const postData = await buildPostData(taskData, imgInfoList, cookie);
    console.debug('小红书商家号推送数据', taskData.taskId, cookie, postData);

    taskData.cancelToken?.throwIfCancelled(privateKey);
    taskData.cancelToken?.disable(privateKey);
    //推送数据
    const publishResult = await publish(cookie, postData, taskData.signContext, webProxy);
    console.debug('小红书商家号推送返回数据', publishResult);

    pubResult.code = publishResult?.result ?? publishResult.code;
    pubResult.msg = publishResult?.msg;

    if (publishResult?.msg && publishResult.msg?.toString()?.includes('canvas illegal')) {
      pubResult.msg = '官方提示：请先到创作者中心发布一篇内容或验证后方可一键发布';
      pubResult.code = -110;
    }
    pubResult.publishId = publishResult?.data?.id;
    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult?.code == 0 ? -1 : pubResult.code;
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg, taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    console.debug('发布失败:', taskData.taskId, e?.toString(), taskData);

    //统一异常失败处理
    pubResult.code = -1;
    if (e instanceof AxiosError) {
      pubResult.code = errorCode.request_error;
      pubResult.msg = `网络异常:${e.message}`;
      pubResult.errorInfo = e.stack?.toString();
    } else if (e instanceof Error) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = e.message;
      pubResult.errorInfo = e.stack?.toString();
    } else {
      pubResult.msg = '发布失败，请查看详细错误信息';
      pubResult.errorInfo = e?.toString();
    }
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg, taskData.taskId);
  } finally {
    if (pubResult?.msg?.includes('Network Error')) {
      pubResult.code = errorCode.request_error;
    }
    console.groupEnd();
  }

  return pubResult;
};

export interface XiaohongshushopArticleTaskInput {
  cancelToken?: CancelToken;
  /**
   * 浏览器签名上下文。
   */
  signContext?: XiaohongshushopArkSignContext;

  /**
   * 任务id
   */
  taskId: string;
  /**
   * 标题
   */
  title?: string;

  /**
   * 描述
   */
  desc?: string;

  images: Array<ImageInfo>;
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
   * 4 互关好友
   */
  visibilityType: number;

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
   * 原创声明
   * 1: 声明
   * 0: 不声明
   */
  isOriginal?: 0 | 1;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 挂车商品信息（商品的二级信息）
   */
  goods?: XiaohongshushopPubGoodsInfo;
}

const uploadImageProcess = async (
  taskId: string,
  imgUrlPath: string,
  eventCallback: EventEmitter,
  cookie: string,
  pubResult: XiaohongshuPublishResultOutput,
): Promise<XiaohongshuUploadNode | null | undefined> => {
  try {
    //获取图片上传参数
    const uploadCoverArgs = await getUploadArgsResponse(cookie, 'image');

    //提取图片上传参数
    if (
      !uploadCoverArgs?.data?.uploadTempPermits?.length ||
      !uploadCoverArgs?.data?.uploadTempPermits[0]?.fileIds?.length
    ) {
      console.debug('获取图片上传参数失败', taskId, uploadCoverArgs);
      pubResult.code = errorCode.data_error;
      pubResult.msg = '获取图片上传参数失败:' + (uploadCoverArgs?.msg ?? '');
      return null;
    }
    const imageUploadNode = uploadCoverArgs.data.uploadTempPermits[0];

    //读取图片数据
    const imageData = await convertImageFileToBuffer(imgUrlPath);

    //上传图片数据，返回上传成功的图片url
    const imageResult = await uploadImage(imageData, imageUploadNode);

    //判断封面是否上传成功
    if (!imageResult?.toString()?.includes(imageUploadNode.fileIds[0])) {
      console.debug('图片上传失败', taskId, imgUrlPath, imageResult);
      pubResult.code = -1;
      pubResult.msg = `图片上传失败:${imgUrlPath}`;
      if (imageResult?.startsWith('{')) {
        const imageReJo = JSON.parse(imageResult);
        pubResult.msg = imageReJo?.msg + imgUrlPath;
      }
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return imageUploadNode;
    //endregion
  } catch (e) {
    console.error('小红书图片上传失败', taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `图片上传失败${imgUrlPath}`;
    return null;
  }
};

/**
 * 组装发布数据
 * @param taskData 任务数据体
 * @param imageList  上传成功的图片
 */
const buildPostData = async (
  taskData: XiaohongshushopArticleTaskInput,
  imageList: Array<ImageInfo>,
  cookie: string,
): Promise<string> => {
  const re = {};

  //商品
  const goodsInfo = {
    style: 0,
    anchor_center: '{0, 0}',
    type: 'goods_seller',
    container_size: '{0, 0}',
    unit_center: '{0.5, 0.5}',
    extension: {
      display_image_type: 'spec',
      left_bottom_type: 'BUY_GOODS',
    },
    event: {
      value: {
        id: '',
        name: '',
      },
    },
  };

  const goodList: Array<PushGoodsInfo> = [];
  if (taskData.goods?.goods_id) {
    goodsInfo.event.value.id = taskData.goods.goods_id;
    goodsInfo.event.value.name = taskData.goods.name;
    goodList.push(goodsInfo);
  }

  //图片
  const images: Array<{
    file_id: string;
    height: number;
    width: number;
    extra_info_json: string;
    metadata: {
      source: number;
    };
    stickers?: {
      floating: Array<PushGoodsInfo>;
      version: number;
    };
  }> = [];
  if (imageList.length > 0) {
    for (const imgObj of imageList) {
      const imageFormat = imgObj.format?.toLowerCase();
      const mimeType = imageFormat
        ? imageFormat.includes('/')
          ? imageFormat
          : `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`
        : 'image/png';
      images.push({
        file_id: imgObj?.pathOrUrl,
        height: imgObj.height ?? 4096,
        width: imgObj.width ?? 4096,
        extra_info_json: JSON.stringify({ mimeType }),
        metadata: {
          source: -1,
        },
        stickers: {
          floating: goodList,
          version: 2,
        },
      });
    }
  }

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
      const activities = html.DocumentNode.SelectNodes('//activity') ?? [];
      topics.push(...activities);
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
            const topicResult = await getXiaohongshushopTopicList(cookie, text);
            if (topicResult?.data?.topic_info_dtos?.length) {
              topicStr = JSON.stringify(topicResult.data.topic_info_dtos[0]);
            } else {
              item.parentNode?.removeChild(item);
              continue;
            }
          }
          topicNum++;
          const topicData = JSON.parse(topicStr);
          const topic = topicData.raw ?? topicData;
          if (!topic?.name || !topic?.id) {
            throw new Error('存在不支持的话题');
          }
          item.textContent = ` #${topic.name}[话题]# `;
          tags.push({ id: topic.id, name: topic.name, link: topic.link, type: 'topic' });
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
          const friendData = JSON.parse(friendStr);
          const friend = friendData.raw ?? friendData.user_base_dto ?? friendData;
          item.textContent = ` @${friend.user_nickname}`;
          atUserList.push({
            nickname: friend.user_nickname,
            name: friend.user_nickname,
            user_id: friend.user_id,
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

  //群聊
  const groupBind = taskData.group?.yixiaoerId
    ? {
        groupId: taskData.group.yixiaoerId,
        groupName: taskData.group.yixiaoerName,
        desc: taskData.group.yixiaoerDesc,
        avatar: taskData.group.yixiaoerImageUrl,
      }
    : {};

  //直播预告
  const liveNoticeBind = taskData.bind_live_info?.yixiaoerId
    ? {
        id: taskData.bind_live_info.yixiaoerId,
        title: taskData.bind_live_info.yixiaoerName,
        liveNoticeType: taskData.bind_live_info.raw ? taskData.bind_live_info.raw['type'] : 1,
      }
    : {};

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
    groupBind,
    liveNoticeBind,
    notePostTiming: { postTime: postTime ?? '' },
    userDeclarationBind: taskData.userDeclarationBind?.origin ? taskData.userDeclarationBind : undefined,
    noteCollectionBind: { id: taskData.collectionId ?? '' },
    noteSketchCollectionBind: { id: '' },
    coProduceBind: { enable: true },
    noteCopyBind: { copyable: true },
    noteIncentiveBind: { count: 0 },
    interactionPermissionBind: { commentPermission: 0 },
    optionRelationList,
  });
  const bizRelations = taskData.goods?.goods_id
    ? [
        {
          biz_id: taskData.goods.goods_id.toString(),
          biz_type: 'GOODS_SELLER_V2',
          extra_info: JSON.stringify({
            goods_id: taskData.goods.goods_id,
            goods_name: taskData.goods.name,
            goods_type: taskData.goods.goods_seller_type,
            tab_id: 1,
            image_type: 'spec',
            left_bottom_type: 'BUY_GOODS',
            bind_order: 0,
          }),
        },
      ]
    : [];

  re['common'] = {
    type: 'normal',
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
      type: taskData.visibilityType ?? 0,
      user_ids: [],
    },
    goods_info: {
      extension: {
        live_preheat: '0',
      },
    },
    biz_relations: bizRelations,
  };
  re['image_info'] = { images: images };
  re['video_info'] = null;

  return JSON.stringify(re);
};

/**
 * 推送组装好的数据到官方
 * @param cookie
 * @param postData 组装好的字符串
 */
const publish = async (
  cookie: string,
  postData: string,
  signContext?: XiaohongshushopArkSignContext,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<XiaohongshuPublishResponse> => {
  const url = 'https://edith.xiaohongshu.com/web_api/sns/v2/note';

  const headers = {
    cookie: cookie,
    referer: 'https://ark.xiaohongshu.com',
    Origin: 'https://ark.xiaohongshu.com',
    Authorization: '',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  //签名
  const baseurl = '/web_api/sns/v2/note';
  const sign = getXiaohongshushopArkSignHeadersByCookie(baseurl, JSON.parse(postData), cookie, signContext);

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

export interface PushGoodsInfo {
  style: number;
  anchor_center: string;
  type: string;
  container_size: string;
  unit_center: string;
  extension: {
    display_image_type: string;
    left_bottom_type: string;
  };
  event: {
    value: {
      id: string;
      name: string;
    };
  };
}
