import { AiqiyiPublishResultOutput } from './aiqiyi-video';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { EventEmitter } from 'events';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent, Task } from '../../utils';
import { HtmlDocument } from '@/htmlAgilityPack';
import { getAiqiyiUserInfo } from './aiqiyi-common';
import * as xpath from 'xpath';
import {
  getDraftResponse,
  getImageFromUrl,
  publishAiqiyiArticleResponse,
  saveAiqiyiArticleDraft,
  uploadImageBinary,
} from './aiqiyi-article.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishAiqiyiArticle = async (
  cookie: string,
  taskData: AiqiyiArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<AiqiyiPublishResultOutput> => {
  logger.info(`爱奇艺图文发布 ${taskData.taskId}`);
  const pubResult: AiqiyiPublishResultOutput = {
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
    let aiqiyiUserId: number = 0;
    const userInfoPre = await getAiqiyiUserInfo(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!userInfoPre?.data?.uid) {
      logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfoPre)}`);
      pubResult.msg = userInfoPre?.msg ?? '获取用户信息失败';
      pubResult.code = userInfoPre?.code ?? -1;
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }
    aiqiyiUserId = userInfoPre.data?.uid;
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //上传正文中的图片
    const content = await replaceImgInHtml(
      cookie,
      taskData.content,
      taskData.taskId,
      eventCallback,
      aiqiyiUserId,
      taskData,
    );
    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //草稿数据

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const feedModel = {};
    feedModel['cards'] = content;
    feedModel['draftId'] = 0;
    feedModel['feedCircles'] = [];
    feedModel['feedType'] = 'IMAGE_TEXT_TYPE';
    feedModel['summary'] = '';
    feedModel['title'] = taskData?.title ?? '';
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    if (taskData.pubType === 0) {
      //不能取消任务
      taskData.cancelToken?.disable(privateKey);
    }
    const draftResult = await saveAiqiyiArticleDraft(cookie, JSON.stringify(feedModel));

    pubResult.publishId = draftResult.data.createdTime.toString();
    if (!draftResult?.data?.draftId) {
      pubResult.msg = `保存草稿失败:${userInfoPre?.msg}`;
      pubResult.code = userInfoPre?.code ?? -1;
      logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(draftResult)}`);
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }
    if (taskData.pubType === 0) {
      pubResult.msg = '草稿保存成功';
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, pubResult.msg, taskData.taskId);
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);
    //上传封面
    // const uploadedCovers = await uploadCovers(cookie, taskData.covers, aiqiyiUserId);

    //组装数据
    feedModel['draftId'] = 0;
    const headLineModel = {};
    const draftData = await getDraftResponse(cookie, draftResult.data.draftId);
    headLineModel['cards'] = draftData?.data?.draft?.cards ?? content;
    feedModel['cards'] = draftData?.data?.draft?.cards ?? content;
    headLineModel['category'] = '';
    headLineModel['coverImages'] = [];
    headLineModel['draftId'] = draftResult.data.draftId;
    headLineModel['status'] = 0;
    headLineModel['summary'] = '';
    headLineModel['title'] = taskData?.title;

    const postData = {};
    postData['feedModel'] = feedModel;
    postData['headLineModel'] = headLineModel;

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不能取消
    taskData.cancelToken?.disable(privateKey);

    console.debug('爱奇艺文章推送数据', taskData.taskId, cookie, postData);
    const publishResult = await publishAiqiyiArticleResponse(cookie, JSON.stringify(postData), webProxy);
    console.debug('爱奇艺文章推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code ?? -1;
    pubResult.msg = publishResult?.msg;

    if (pubResult.code === 0) {
      pubResult.publishId = draftResult.data.createdTime.toString();
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      logger.error(
        `爱奇艺文章发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
      );
      if (pubResult?.code === -20005) {
        pubResult.msg = '账号登录信息已失效，请重新授权后再试。';
      }
      pubResult.msg = `${pubResult?.msg ?? '发布失败'}`;
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
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
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
    logger.error(`爱奇艺文章发布,异常失败 ${taskData.taskId} ${cookie} ${pubResult.msg}`);
  } finally {
    console.groupEnd();
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  userId: number,
  taskData: AiqiyiArticleTaskInput,
): Promise<Array<Block>> => {
  const html = new HtmlDocument();
  html.LoadHtml(content);
  const firstNode = html.DocumentNode.SelectHtmlNodes('/*');
  const blocks: Array<Block> = [];
  let processCount = 0;
  for (const node of firstNode) {
    SetProgressEvent(eventCallback, (50 / firstNode.length) * processCount + 5, '图片上传中', taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    processCount++;
    const fnode: HTMLElement = node as HTMLElement;
    if (!fnode) continue;
    if (fnode?.toString()?.includes('<img')) {
      const nodeDoms = xpath.select('.//img', fnode);
      if (nodeDoms?.length > 0) {
        for (const nodeDomPre of nodeDoms) {
          const nodeDom = nodeDomPre as Element;
          const imgUrl = nodeDom.getAttribute('src') ?? nodeDom.getAttribute('data-src') ?? '';
          if (!imgUrl) {
            continue;
          }
          const key = blocks.length;

          let uploadedUrlObj;

          //直接官方转换
          if (imgUrl.toLowerCase().startsWith('http')) {
            const result = await getImageFromUrl(cookie, imgUrl, userId);
            if (result.data?.headline?.share_url) {
              uploadedUrlObj = result?.data.headline;
            }
          }

          //下载后再上传
          if (!uploadedUrlObj) {
            const imgData = await readImageData(imgUrl, 'jpeg');

            if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
              throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
            }
            const binaryResult = await uploadImageBinary(cookie, userId, imgData.data, imgData.ext);
            uploadedUrlObj = binaryResult?.data;
            if (!uploadedUrlObj) {
              throw new Error(`图片上传失败-${binaryResult?.msg}-${imgUrl}`);
            }
          }

          const block: Block = { type: 'img', order: key, content: uploadedUrlObj.share_url };
          block.fileId = uploadedUrlObj.file_id;
          block.height = 720;
          block.httpInnerUrl = uploadedUrlObj.httpInnerUrl;
          block.imageType = uploadedUrlObj.fileType ?? 'jpeg';
          block.size = '720*1080';
          block.width = 1080;
          blocks.push(block);
        }
      } else {
        const imgUrl = fnode.getAttribute('src') ?? fnode.getAttribute('data-src');
        if (!imgUrl) {
          continue;
        }
        const key = blocks.length;

        let uploadedUrlObj;

        //直接官方转换
        if (imgUrl.toLowerCase().startsWith('http')) {
          const result = await getImageFromUrl(cookie, imgUrl, userId);
          if (result.data?.headline?.share_url) {
            uploadedUrlObj = result?.data.headline;
          }
        }

        //下载后再上传
        if (!uploadedUrlObj) {
          const imgData = await readImageData(imgUrl, 'jpeg');

          if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
            throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
          }
          const binaryResult = await uploadImageBinary(cookie, userId, imgData.data, imgData.ext);
          uploadedUrlObj = binaryResult?.data;
          if (!uploadedUrlObj) {
            throw new Error(`图片上传失败-${binaryResult?.msg}-${imgUrl}`);
          }
        }

        const block: Block = { type: 'img', order: key, content: uploadedUrlObj.share_url };
        block.fileId = uploadedUrlObj.file_id;
        block.height = 720;
        block.httpInnerUrl = uploadedUrlObj.httpInnerUrl;
        block.imageType = uploadedUrlObj.fileType ?? 'jpeg';
        block.size = '720*1080';
        block.width = 1080;
        blocks.push(block);
      }
    } else {
      const outHtml = fnode?.toString() ?? '';
      const key = blocks.length;
      const block: Block = { type: 'text', order: key, content: outHtml };
      blocks.push(block);
    }
  }
  return blocks;
};

export interface AiqiyiArticleTaskInput {
  /**
   * 取消任务发布
   */
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
   * 文章内容 html
   */
  content: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

interface Block {
  content: string;
  type: string;
  order: number;
  fileId?: string;
  height?: number;
  width?: number;
  httpInnerUrl?: string;
  imageType?: string;
  size?: string;
}
