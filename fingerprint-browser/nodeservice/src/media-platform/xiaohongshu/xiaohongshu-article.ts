import { XiaohongshuPublishResultOutput } from './xiaohongshu-video';
import { EventEmitter } from 'events';
import { XiaohongshuTopicInfo } from './xiaohongshu-topic.service';
import { XiaohongshuFriendInfo } from './xiaohongshu-friend.service';
import { XiaohongshuLocationInfo } from './xiaohongshu-location.service';
import { Guid, htmlDecode, logger, publishStatusEnum, SetProgressEvent, SetProgressNewEvent } from '../../utils';
import { ImageInfo, ListItemInfo } from '../../media-platform/baseModel';
import { getNewSign, uploadXiaohongshuDynamicImage, XiaohongshuUploadNode } from './xiaohongshu-base.service';
import { errorCode } from '@/media-platform/errorCode';
import { XiaohongshuPublishResponse } from './xiaohongshu-video.service';
import { AxiosError } from 'axios';
import { $http } from '@/http';
import { getSign } from './xiaohongshu-sign';
import { HtmlDocument } from '@/htmlAgilityPack';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getXiaohongshuTopicList } from '@/media-platform/xiaohongshu/xiaohongshu-common';
import { CancelToken, privateKey } from '@/utils/CancelToken';
export {
  buildXiaohongshuArticleContent,
  generateXiaohongshuArticleImages,
  generateXiaohongshuSingleImage,
  getXiaohongshuArticleTemplateList,
} from './xiaohongshu-article.service';
export type {
  XiaohongshuArticleImageGenerateOutput,
  XiaohongshuArticleImageGenerateInput,
  XiaohongshuSingleImageGenerateInput,
  XiaohongshuSingleImageGenerateOutput,
  XiaohongshuArticleImageModel,
  XiaohongshuArticleTemplate,
  XiaohongshuArticleTemplateColor,
  XiaohongshuArticleTemplateListItem,
  XiaohongshuArticleTemplateListOutput,
  XiaohongshuLongTextArticleContent,
} from './xiaohongshu-article.service';

/**
 * 发布小红书视频
 * @param cookie
 * @param taskData 小红书视频发布人物体
 * @param eventCallback 事件回调
 * @param retryTimes 最大重试次数
 */
export const xiaohongshuPublishDynamic = async (
  cookie: string,
  taskData: XiaohongshuDynamicTaskInput,
  eventCallback: EventEmitter,
  retryTimes: number = 3,
): Promise<XiaohongshuPublishResultOutput> => {
  logger.info(`小红书图文发布 ${taskData.taskId}`);
  const pubResult: XiaohongshuPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
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
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
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
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      SetProgressEvent(eventCallback, (80 / taskData.images.length) * processCount + 5, '图片上传中', taskData.taskId);
      processCount++;
      let imageUploadNode = await uploadImageProcess(taskData.taskId, img.pathOrUrl, eventCallback, cookie, pubResult);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
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
          logger.error(
            `图片上传失败 ${taskData.taskId} ${cookie} ${img.pathOrUrl} ${JSON.stringify(
              imageUploadNode,
            )} ${JSON.stringify(pubResult)}`,
          );
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult.msg : '上传失败',
            taskData.taskId,
          );
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
        logger.error(
          `图片上传失败 ${taskData.taskId} ${cookie} ${img.pathOrUrl} ${JSON.stringify(
            imageUploadNode,
          )} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    // endregion

    // region 组装并推送数据
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //组装发布数据
    const postData = await buildPostData(taskData, imgInfoList, cookie);
    console.debug('小红书推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    //推送数据
    const publishResult = await publish(cookie, postData, webProxy);
    console.debug('小红书推送返回数据', publishResult);

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
      pubResult.code = pubResult.code === 0 ? -1 : pubResult.code ?? -1;
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`小红书图文发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);

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
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.pushFail,
      pubResult?.msg ? pubResult.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`小红书图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult?.msg?.includes('Network Error')) {
      pubResult.code = errorCode.request_error;
    }
  }

  return pubResult;
};

export interface XiaohongshuDynamicTaskInput {
  cancelToken?: CancelToken;
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

  /**
   * 挂载商品
   */
  shopping_cart?: Array<ListItemInfo>;

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
   * 鍘熷垱澹版槑
   */
  isOriginal?: 0 | 1;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

const uploadImageProcess = async (
  taskId: string,
  imgUrlPath: string,
  eventCallback: EventEmitter,
  cookie: string,
  pubResult: XiaohongshuPublishResultOutput,
): Promise<XiaohongshuUploadNode | null | undefined> => {
  try {
    const uploadResult = await uploadXiaohongshuDynamicImage(cookie, imgUrlPath);
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadResult.uploadNode;
    //endregion
  } catch (e) {
    console.error('小红书图片上传失败', taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = e instanceof Error ? e.message : `图片上传失败${imgUrlPath}`;
    return null;
  }
};

/**
 * 组装发布数据
 * @param taskData 任务数据体
 * @param imageList  上传成功的图片
 * @param cookie
 */
const buildPostData = async (
  taskData: XiaohongshuDynamicTaskInput,
  imageList: Array<ImageInfo>,
  cookie: string,
): Promise<string> => {
  const re = {};

  //图片
  const images: Array<{
    file_id: string;
    height: number;
    width: number;
    extra_info_json: { mimeType: string };
    metadata: {
      source: number;
    };
    stickers?: {
      floating: Array<string>;
      version: number;
    };
  }> = [];
  if (imageList.length > 0) {
    for (const imgObj of imageList) {
      images.push({
        file_id: imgObj?.pathOrUrl,
        height: imgObj.height ?? 4096,
        width: imgObj.width ?? 4096,
        extra_info_json: { mimeType: 'image/png' },
        metadata: {
          source: -1,
        },
        stickers: {
          floating: [],
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
              item.parentNode?.removeChild(item);
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
          const friendJo = JSON.parse(friendStr)?.raw as XiaohongshuFriendInfo;
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

  //定时发布
  const postTime = taskData.postTime?.toString() ?? '';

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
  const groupStr = taskData.group?.yixiaoerId
    ? JSON.stringify({
        groupId: taskData.group.yixiaoerId,
        groupName: taskData.group.yixiaoerName,
        desc: taskData.group.yixiaoerDesc,
        avatar: taskData.group.yixiaoerImageUrl,
      })
    : JSON.stringify({});

  //直播预告
  const liveInfo = taskData.bind_live_info?.yixiaoerId
    ? JSON.stringify({
        id: taskData.bind_live_info.yixiaoerId,
        title: taskData.bind_live_info.yixiaoerName,
        liveNoticeType: taskData.bind_live_info.raw ? taskData.bind_live_info.raw['type'] : 1,
      })
    : JSON.stringify({});

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
  //内容类型申明
  let declareStr: undefined | string = undefined;
  if (taskData.userDeclarationBind?.origin) {
    declareStr = `"userDeclarationBind":${JSON.stringify(taskData.userDeclarationBind)},`;
  }
  let originalStatementStr = '"optionRelationList":[],';
  if (taskData.isOriginal === 1) {
    originalStatementStr = `"optionRelationList":[{"type":"ORIGINAL_STATEMENT","relationList":[{"bizType":"ORIGINAL_STATEMENT","bizId":"${Guid.NewGuid().toString()}","extraInfo":"{}"}]}],`;
  }
  re['common'] = {
    type: 'normal',
    title: taskData?.title ?? '',
    note_id: '',
    desc: content,
    source: '{"type":"web","ids":"","extraInfo":"{\\"systemId\\":\\"web\\"}"}',
    business_binds:
      `{"version":1,"noteId":0,"bizType":0,"noteOrderBind":{},"groupBind":${groupStr},"liveNoticeBind":${liveInfo},"notePostTiming":{"postTime":"${
        taskData.postTime ? taskData.postTime : ''
      }"` +
      `},${declareStr ? declareStr : ''}${originalStatementStr}"noteCollectionBind":{"id":"${
        taskData.collectionId ?? ''
      }"}}`,
    ats: atUserList,
    biz_relations: biz_relations,
    hash_tag: tags,
    post_loc: location,
    privacy_info: {
      op_type: 1,
      type: taskData.visibilityType,
    },
  };
  re['image_info'] = { images: images };
  re['video_info'] = null;

  return JSON.stringify(re);
};

/**
 * 推送组装好的数据到官方
 * @param cookie
 * @param postData 组装好的字符串
 * @param proxyAgent
 */
const publish = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
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
