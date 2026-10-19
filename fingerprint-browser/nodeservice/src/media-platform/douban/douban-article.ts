import { EventEmitter } from 'events';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent, Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaseResult } from '../baseResult';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import {
  covertImgFromUrl,
  DouBanImageConvertResponse,
  getPublishToken,
  publishDouBanArticleResponse,
  uploadImageResponse,
} from './douban-article.service';
import { VisibleTypeEnum } from '@/cloud/model/TypeEnum';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishDouBanArticle = async (
  cookie: string,
  taskData: DouBanArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<DouBanPublishResultOutput> => {
  logger.info(`豆瓣文章发布 ${taskData.taskId}`);
  const pubResult: DouBanPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };

  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const createNoteStr = await getPublishToken(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    let node_id = createNoteStr?.split('_NOTE_ID = ')[1]?.split(';')[0] ?? '';
    if (node_id?.includes("'")) {
      node_id = node_id?.split("'")[1];
    }
    const upload_auth_token = createNoteStr?.split("upload_auth_token: '")[1]?.split("'")[0].trim() ?? '';
    //const need_captcha = createNoteStr.split('_NEED_CAPTCHA = ')[1].split(';')[0];

    //上传正文中的图片
    const content = await replaceImgInHtml(
      cookie,
      taskData.content,
      taskData.taskId,
      eventCallback,
      taskData,
      node_id,
      upload_auth_token,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    pubResult.code = 0;
    pubResult.msg = '';

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);
    // //上传封面
    // const uploadedCovers = await uploadCovers(cookie, taskData.covers);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, node_id, cookie.split('ck=')[1]?.split(';')[0]);

    console.debug('豆瓣推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishDouBanArticleResponse(cookie, postData, taskData.pubType, webProxy);
    console.debug('豆瓣推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code ? publishResult?.code : 0;
    pubResult.msg = publishResult?.msg ?? '';
    pubResult.publishId = publishResult?.id;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult?.code ? pubResult.code : -1;
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`豆瓣文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    }

    return pubResult;
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
    logger.error(`豆瓣文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: DouBanArticleTaskInput,
  noteId: string,
  uploadToken: string,
): Promise<object> => {
  const html = new HtmlDocument();
  html.LoadHtml(content);

  const note_text: any = {};
  const blocks: any[] = [];
  const entityMap: any = {};
  const imgList: string[] = [];
  const imgMap: Map<string, DouBanImageConvertResponse> = new Map();

  const imgNodes = html.DocumentNode?.SelectNodes('//img');
  if (imgNodes?.length > 0) {
    let processCount = 0;
    for (const img of imgNodes) {
      taskData.cancelToken?.throwIfCancelled(privateKey);
      await Task.Delay(Math.floor(Math.random() * 501) + 500);
      SetProgressEvent(eventCallback, (50 / imgNodes.length) * processCount + 5, '图片上传中', taskId);
      processCount++;

      let imgUrl = img.getAttribute('src') ?? img.getAttribute('data-src');
      if (!imgUrl) continue;
      if (imgUrl.startsWith('//')) imgUrl = 'http:' + imgUrl;

      let uploadedUrl: string | undefined;

      if (imgUrl.toLowerCase().startsWith('http')) {
        const result = await covertImgFromUrl(cookie, imgUrl, noteId);
        if (result.photo?.url) {
          uploadedUrl = result.photo.url;
          imgMap.set(imgUrl, result);
        }
      }

      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');
        if (!imgData?.data || imgData.data.length < 100) {
          throw new Error(`图片读取失败-${imgUrl}`);
        }
        const binaryResult = await uploadImageResponse(cookie, imgData.data, noteId, uploadToken);
        uploadedUrl = binaryResult?.photo?.url;
        if (!uploadedUrl) throw new Error(`图片上传失败-${imgUrl}`);
        imgMap.set(imgUrl, binaryResult);
      }

      imgList.push(imgUrl);
    }
  }

  // helper: 生成图片block
  const pushImageBlock = (imgUrl: string) => {
    const emptyBlock = {
      key: getTxtKey(),
      text: '',
      type: 'unstyled',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    };
    blocks.push(emptyBlock);

    const imgBlock = {
      key: getTxtKey(),
      text: ' ',
      type: 'atomic',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [{ offset: 0, length: 1, key: imgList.indexOf(imgUrl) }],
      data: {},
    };
    blocks.push(imgBlock);

    const emptyBlock1 = { ...emptyBlock, key: getTxtKey() };
    const emptyBlock2 = { ...emptyBlock, key: getTxtKey() };
    blocks.push(emptyBlock1, emptyBlock2);
  };

  // DFS 遍历节点
  const walkNode = (node: any, item: any) => {
    if (!node) return;
    const nodeName = node.nodeName?.toString();

    if (nodeName === '#text') {
      item.text += node.nodeValue?.toString()?.replace(/&amp;nbsp;/g, '&nbsp;') ?? '';
      return;
    }

    if (nodeName === 'strong') {
      const text = node.childNodes?.[0]?.nodeValue?.toString()?.replace(/&amp;nbsp;/g, '&nbsp;') ?? '';
      const offset = item.text.length;
      item.text += text;
      item.inlineStyleRanges.push({ offset, length: text.length, style: 'BOLD' } as never);
      return;
    }

    if (nodeName === 'span') {
      const style = node.getAttribute('style') ?? '';
      const text = node.childNodes?.[0]?.nodeValue?.toString()?.replace(/&amp;nbsp;/g, '&nbsp;') ?? '';
      if (style.includes('bold')) {
        const offset = item.text.length;
        item.text += text;
        item.inlineStyleRanges.push({ offset, length: text.length, style: 'BOLD' } as never);
      } else if (style.includes('italic')) {
        const offset = item.text.length;
        item.text += text;
        item.inlineStyleRanges.push({ offset, length: text.length, style: 'ITALIC' } as never);
      } else if (style.includes('line-through')) {
        const offset = item.text.length;
        item.text += text;
        item.inlineStyleRanges.push({ offset, length: text.length, style: 'STRIKETHROUGH' } as never);
      } else if (style.includes('underline')) {
        const offset = item.text.length;
        item.text += text;
        item.inlineStyleRanges.push({ offset, length: text.length, style: 'UNDERLINE' } as never);
      } else {
        item.text += text;
      }
      return;
    }

    if (nodeName === 'img') {
      let imgUrl = node.getAttribute('src') ?? node.getAttribute('data-src') ?? '';
      if (imgUrl.startsWith('//')) imgUrl = 'http:' + imgUrl;
      if (imgList.includes(imgUrl)) pushImageBlock(imgUrl);
      return;
    }

    if (node.childNodes && node.childNodes.length > 0) {
      for (const child of Array.from(node.childNodes)) {
        walkNode(child, item);
      }
    }
  };

  const nodes = html.DocumentNode.doc.childNodes;
  for (const node of Array.from(nodes)) {
    const item = {
      key: getTxtKey(),
      text: '',
      type: 'unstyled',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: { page: 0 },
    };
    walkNode(node, item);
    if (item.text || node.nodeName?.toString() !== '#text') {
      blocks.push(item);
    }
  }

  note_text['blocks'] = blocks;

  for (const img of imgList) {
    const img_item = {
      type: 'IMAGE',
      mutability: 'IMMUTABLE',
      data: {},
    };
    const imgData = imgMap.get(img)?.photo ?? {};
    imgData['src'] = imgData['url'];
    imgData['entityKey'] = blocks.length + imgList.indexOf(img) + 1;
    img_item['data'] = imgData;
    entityMap[imgList.indexOf(img).toString()] = img_item;
  }
  note_text['entityMap'] = entityMap;

  return note_text;
};

const getTxtKey = (): string => {
  const i = Math.pow(2, 24);
  return Math.floor(Math.random() * i).toString(32);
};

// const uploadCovers = async (cookie: string, covers: Array<ImageInfo>): Promise<Array<string>> => {
//   const upCovers: Array<string> = [];
//   if (covers?.length > 0) {
//     for (const img of covers) {
//       let imgUrl = img.pathOrUrl;
//       if (!imgUrl) {
//         continue;
//       }
//       if (imgUrl.startsWith('//')) {
//         imgUrl = 'http:' + imgUrl;
//       }
//
//       //下载后再上传
//       const imgData = await readImageData(imgUrl, 'jpeg');
//
//       if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
//         throw new Error(`封面图片读取失败-${imgData.status}-${imgUrl}`);
//       }
//       const binaryResult = await uploadImageResponse(cookie, imgData.data);
//       const uploadedUrl = binaryResult?.data?.url;
//       if (!uploadedUrl) {
//         throw new Error(`封面图片上传失败-${binaryResult?.errmsg}-${imgUrl}`);
//       }
//
//       if (!uploadedUrl) {
//         throw new Error(`封面图片上传失败-${imgUrl}`);
//       }
//       upCovers.push(uploadedUrl);
//       if (upCovers.length >= 3) {
//         break;
//       }
//     }
//   }
//
//   return upCovers;
// };

const buildPostData = (taskData: DouBanArticleTaskInput, content: object, noteId: string, ck: string): object => {
  const re = {};

  //隐私设置 P对所有人可见，S对好友可见，X对自己可见
  re['accessible'] = taskData.visibleType === VisibleTypeEnum.public ? 'public' : 'private';
  re['content'] = JSON.stringify(content);
  re['enable_item_tag'] = false;
  re['title'] = taskData.title?.toString() ?? '';
  re['image_layout'] = 'vertical';
  re['explanation_types'] = '';
  re['interest_tags'] = taskData?.tags?.length ? taskData.tags?.join(',') : '';
  re['is_activity_rule'] = false;
  re['is_event'] = false;
  re['original'] = taskData.isOriginal?.toString() == '1' ? true : false; //原创
  re['send_status'] = true;
  re['subtype'] = 'note';
  re['topic_tag_ids'] = '';

  //回应设置 0所有人可回应''  1关注的人可回应'on'
  re['cannot_reply'] = ''; //on 不可回复，不可见

  re['accept_donation'] = ''; //赞赏功能
  re['donation_notice'] = '';

  re['ck'] = ck;

  return re;
};

export interface DouBanArticleTaskInput {
  cancelToken?: CancelToken;
  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 发布类型
   * 0 存草稿 平台支持才有效，否则默认为发布
   * 1 发布
   */
  pubType: 0 | 1;

  /**
   * 文章标题
   */
  title: string;

  /**
   * 可见类型
   */
  visibleType: VisibleTypeEnum;

  tags?: string[];

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 1:原创
   */
  isOriginal?: 1 | 0;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface DouBanPublishResultOutput extends BaseResult {
  /**
   * 任务唯一标志id
   */
  taskId: string;

  /**
   * 详细错误
   */
  errorInfo?: string;

  /**
   * 发布产生唯一id
   */
  publishId?: string;

  /**
   * 返回结果
   */
  mediaContent?: object;
}
