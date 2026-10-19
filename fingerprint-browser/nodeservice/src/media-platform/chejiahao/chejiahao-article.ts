import { EventEmitter } from 'events';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { ImageInfo } from '../baseModel';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaseResult } from '../baseResult';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import {
  convertCheJiaHaoImageResponse,
  publishCheJiaHaoArticleResponse,
  saveCheJiaHaoArticleResponse,
} from './chejiahao-article.service';
import { getCheJiaHaoImageUploadToken, uploadCheJiaHaoImageResponse } from './chejiahao-video-service';
import { select } from 'xpath';
import dayjs from 'dayjs';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishCheJiaHaoArticle = async (
  cookie: string,
  taskData: CheJiaHaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<CheJiaHaoPublishResultOutput> => {
  logger.info(`车家号图文发布 ${taskData.taskId}`);
  const pubResult: CheJiaHaoPublishResultOutput = {
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

    // 获取上传token
    const uploadToken = await getCheJiaHaoImageUploadToken(cookie);
    if (!uploadToken) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = '获取上传token失败';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //上传正文中的图片
    const content = await replaceImgInHtml(cookie, uploadToken, taskData.content, taskData.taskId, eventCallback, taskData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    pubResult.code = 0;
    pubResult.msg = '';

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);
    //上传封面
    const uploadedCovers: Array<string> = await uploadCovers(cookie, uploadToken, taskData.covers);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //竖版封面
    const verticalCover = await uploadverticalCover(cookie, uploadToken, taskData.verticalCover);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    const postData = buildPostData(taskData, content, uploadedCovers, verticalCover, taskData.verticalCover);

    console.debug('车家号文章推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishCheJiaHaoArticleResponse(cookie, postData, taskData.pubType, webProxy);
    console.debug('车家号文章推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.returncode ?? -1;
    pubResult.msg = publishResult?.message ?? '发布失败';

    pubResult.publishId =
      publishResult?.result?.id?.toString() ??
      publishResult?.result?.draftId?.toString() ??
      publishResult?.result?.toString();

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult?.code === 0 ? -1 : pubResult.code;
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`车家号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`车家号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  token: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: CheJiaHaoArticleTaskInput,
): Promise<string> => {
  const blocks = new Array<any>();
  let contentLength = 0;
  let imageCount = 0;
  let newHtml = '';
  const html = new HtmlDocument();
  html.LoadHtml(content);

  const firstNodes = html.DocumentNode?.SelectNodes('/*');

  if (firstNodes?.length > 0) {
    let processCount = 0;
    await Task.Delay(Math.floor(Math.random() * 501) + 500);
    SetProgressEvent(eventCallback, (50 / firstNodes.length) * processCount + 5, '图片上传中', taskId);
    processCount++;

    for (const node of firstNodes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      const fnode: HTMLElement = node as HTMLElement;
      if (!fnode) {
        continue;
      }
      const nodeStr = fnode.toString()?.trim();

      if (nodeStr?.startsWith('<img')) {
        const nodeDom = fnode;
        let imgUrl = nodeDom.getAttribute('src') ?? nodeDom.getAttribute('data-src');
        if (!imgUrl) {
          continue;
        }
        let imgObj: ImageTmpObj | null = null;
        if (imgUrl.startsWith('//')) {
          imgUrl = 'http:' + imgUrl;
        }
        if (imgUrl.startsWith('http')) {
          const convertRe = await convertCheJiaHaoImageResponse(cookie, imgUrl);
          imgObj = convertRe?.result as ImageTmpObj;
        }
        if (!imgObj?.Url) {
          const imgData = await readImageData(imgUrl, 'jpeg');
          if (!imgData?.data || imgData?.data?.length < 500) {
            throw new Error(`读取图片失败${imgData?.status ?? ''}-${imgUrl}`);
          }
          const ext = imgData.ext || 'jpg';
          const uploadRe = await uploadCheJiaHaoImageResponse(cookie, imgData.data, token, ext);
          if (uploadRe?.code === 0 && uploadRe?.url) {
            imgObj = {
              Url: uploadRe.url,
              Width: 1200,
              Height: 600,
              FileName: '',
              Length: 0,
              ImgShowId: uploadRe.result,
            };
          } else {
            throw new Error(`图片上传失败${uploadRe?.message ?? ''}-${imgUrl}`);
          }
        }
        if (!imgObj?.Url) {
          throw `图片上传失败${imgUrl}`;
        }
        nodeDom.setAttribute('src', imgObj.Url);

        let imgInfo = imgObj?.Width ? imgObj : null;
        if (!imgInfo) {
          const imgInfoStr = htmlDecode(nodeDom?.getAttribute('img-data') ?? '');

          if (imgInfoStr?.startsWith('{')) {
            imgInfo = JSON.parse(imgInfoStr);
          }
        }
        nodeDom.setAttribute('img-data', '');
        nodeDom.setAttribute('data-width', `${imgInfo?.Width ?? 1200}`);
        nodeDom.setAttribute('data-height', `${imgInfo?.Height ?? 600}`);
        const block = {};
        block['attributes'] = [];
        block['caption'] = '';
        block['height'] = imgInfo?.Height ?? 600;
        block['width'] = imgInfo?.Width ?? 1200;
        block['version'] = 1;
        block['type'] = 'image';
        block['src'] = imgObj.Url;
        blocks.push(block);
        newHtml +=
          '<div class="editor-image"><img src="' +
          imgObj.Url +
          '" style="max-width:100%;" data-width="' +
          (imgInfo?.Width ?? 1200) +
          '" data-height="' +
          (imgInfo?.Height ?? 600) +
          '"></div>';
        imageCount++;
      } else if (nodeStr.startsWith('<p')) {
        if (nodeStr.includes('<img')) {
          fnode.setAttribute('class', 'editor-image');
          const nodeDoms = select('.//img', fnode);
          let tmpNodeStr = nodeStr;
          for (const nodeDomPre of nodeDoms) {
            const nodeDom = nodeDomPre as HTMLElement;
            const item = (nodeDom as Element)?.getAttribute('src') ?? (nodeDom as Element)?.getAttribute('data-src');
            if (!item) {
              continue;
            }
            let imgUrl = item;
            const seps = tmpNodeStr.split(item);
            const preHtml = seps[0].split('<img')[0].replace(/<[^>]*>/g, '');
            tmpNodeStr = seps[1]?.substring(seps[1].indexOf('/>') + 2);
            if (preHtml) {
              const block = {};
              block['direction'] = null; //'ltr';

              const data = {};
              data['text'] = preHtml;
              data['detail'] = 0;
              data['format'] = 0;
              data['mode'] = 'normal';
              data['style'] = '';
              data['type'] = 'text';
              data['version'] = 1;

              block['children'] = [data];
              block['format'] = '';
              block['indent'] = 0;
              block['type'] = 'paragraph';
              block['version'] = 1;
              blocks.push(block);
              newHtml += '<p class="editor-paragraph"><span>' + preHtml + '</span></p>';
              contentLength += preHtml.length;
            }

            if (!imgUrl) {
              continue;
            }
            let imgObj: ImageTmpObj | null = null;
            if (imgUrl.startsWith('//')) {
              imgUrl = 'http:' + imgUrl;
            }
            if (imgUrl.startsWith('http')) {
              const convertRe = await convertCheJiaHaoImageResponse(cookie, imgUrl);
              imgObj = convertRe?.result as ImageTmpObj;
            }
            if (!imgObj?.Url) {
              const imgData = await readImageData(imgUrl, 'jpeg');
              if (!imgData?.data || imgData?.data?.length < 500) {
                throw new Error(`读取图片失败${imgData?.status ?? ''}-${imgUrl}`);
              }
              const ext = imgData.ext || 'jpg';
              const uploadRe = await uploadCheJiaHaoImageResponse(cookie, imgData.data, token, ext);
              if (uploadRe?.code === 0 && uploadRe?.url) {
                imgObj = {
                  Url: uploadRe.url,
                  Width: 1200,
                  Height: 600,
                  FileName: '',
                  Length: 0,
                  ImgShowId: uploadRe.result,
                };
              } else {
                throw new Error(`图片上传失败${uploadRe?.message ?? ''}-${imgUrl}`);
              }
            }
            if (!imgObj?.Url) {
              throw `图片上传失败${imgUrl}`;
            }
            (nodeDom as Element).setAttribute('src', imgObj.Url);

            let imgInfo = imgObj?.Width ? imgObj : null;
            if (!imgInfo) {
              const imgInfoStr = htmlDecode(nodeDom?.getAttribute('img-data') ?? '');

              if (imgInfoStr?.startsWith('{')) {
                imgInfo = JSON.parse(imgInfoStr);
              }
            }
            nodeDom.setAttribute('img-data', '');
            nodeDom.setAttribute('data-width', `${imgInfo?.Width ?? 1200}`);
            nodeDom.setAttribute('data-height', `${imgInfo?.Height ?? 600}`);
            const block = {};
            block['attributes'] = [];
            block['caption'] = '';
            block['height'] = imgInfo?.Height ?? 600;
            block['width'] = imgInfo?.Width ?? 1200;
            block['version'] = 1;
            block['type'] = 'image';
            block['src'] = imgObj.Url;
            blocks.push(block);
            newHtml +=
              '<div class="editor-image"><img src="' +
              imgObj.Url +
              '" style="max-width:100%;" data-width="' +
              (imgInfo?.Width ?? 1200) +
              '" data-height="' +
              (imgInfo?.Height ?? 600) +
              '"></div>';
            imageCount++;
          }
          if (tmpNodeStr) {
            tmpNodeStr = tmpNodeStr.replace(/<[^>]*>/g, '');
            if (tmpNodeStr) {
              const block = {};
              block['direction'] = null; //'ltr';

              const data = {};
              data['text'] = tmpNodeStr;
              data['detail'] = 0;
              data['format'] = 0;
              data['mode'] = 'normal';
              data['style'] = '';
              data['type'] = 'text';
              data['version'] = 1;

              block['children'] = [data];
              block['format'] = '';
              block['indent'] = 0;
              block['type'] = 'paragraph';
              block['version'] = 1;
              blocks.push(block);
              newHtml += '<p class="editor-paragraph"><span>' + tmpNodeStr + '</span></p>';
              contentLength += tmpNodeStr.length;
            }
          }
        } else {
          fnode.setAttribute('class', 'editor-paragraph');
          const block = {};
          block['direction'] = null; //'ltr';

          const data = {};
          data['text'] = fnode.innerText ?? fnode.textContent;
          data['detail'] = 0;
          data['format'] = 0;
          data['mode'] = 'normal';
          data['style'] = '';
          data['type'] = 'text';
          data['version'] = 1;

          block['children'] = [data];
          block['format'] = '';
          block['indent'] = 0;
          block['type'] = 'paragraph';
          block['version'] = 1;
          blocks.push(block);
          newHtml += '<p class="editor-paragraph"><span>' + (fnode.innerText ?? fnode.textContent) + '</span></p>';
          contentLength += (fnode.innerText ?? fnode.textContent).length;
        }
      } else if (nodeStr.startsWith('<div')) {
        if (nodeStr.includes('<img')) {
          fnode.setAttribute('class', 'editor-image');
          const nodeDoms = select('.//img', fnode);
          let tmpNodeStr = nodeStr;
          for (const nodeDomPre of nodeDoms) {
            const nodeDom = nodeDomPre as Element;
            const item = nodeDom.getAttribute('src') ?? nodeDom.getAttribute('data-src');
            if (!item) {
              continue;
            }
            let imgUrl = item;
            const seps = tmpNodeStr.split(item);
            const preHtml = seps[0].split('<img')[0].replace(/<[^>]*>/g, '');
            tmpNodeStr = seps[1]?.substring(seps[1].indexOf('/>') + 2);
            if (preHtml) {
              const block = {};
              block['direction'] = null; //'ltr';

              const data = {};
              data['text'] = preHtml;
              data['detail'] = 0;
              data['format'] = 0;
              data['mode'] = 'normal';
              data['style'] = '';
              data['type'] = 'text';
              data['version'] = 1;

              block['children'] = [data];
              block['format'] = '';
              block['indent'] = 0;
              block['type'] = 'paragraph';
              block['version'] = 1;
              blocks.push(block);
              newHtml += '<p class="editor-paragraph"><span>' + preHtml + '</span></p>';
              contentLength += preHtml.length;
            }

            let imgObj: ImageTmpObj | null = null;
            if (imgUrl.startsWith('//')) {
              imgUrl = 'http:' + imgUrl;
            }
            if (imgUrl.startsWith('http')) {
              const convertRe = await convertCheJiaHaoImageResponse(cookie, imgUrl);
              imgObj = convertRe?.result as ImageTmpObj;
            }
            if (!imgObj?.Url) {
              const imgData = await readImageData(imgUrl, 'jpeg');
              if (!imgData?.data || imgData?.data?.length < 500) {
                throw new Error(`读取图片失败${imgData?.status ?? ''}-${imgUrl}`);
              }
              const ext = imgData.ext || 'jpg';
              const uploadRe = await uploadCheJiaHaoImageResponse(cookie, imgData.data, token, ext);
              if (uploadRe?.code === 0 && uploadRe?.url) {
                imgObj = {
                  Url: uploadRe.url,
                  Width: 1200,
                  Height: 600,
                  FileName: '',
                  Length: 0,
                  ImgShowId: uploadRe.result,
                };
              } else {
                throw new Error(`图片上传失败${uploadRe?.message ?? ''}-${imgUrl}`);
              }
            }
            if (!imgObj?.Url) {
              throw `图片上传失败${imgUrl}`;
            }
            nodeDom.setAttribute('src', imgObj.Url);

            let imgInfo = imgObj?.Width ? imgObj : null;
            if (!imgInfo) {
              const imgInfoStr = htmlDecode(nodeDom?.getAttribute('img-data') ?? '');

              if (imgInfoStr?.startsWith('{')) {
                imgInfo = JSON.parse(imgInfoStr);
              }
            }
            nodeDom.setAttribute('img-data', '');
            nodeDom.setAttribute('data-width', `${imgInfo?.Width ?? 1200}`);
            nodeDom.setAttribute('data-height', `${imgInfo?.Height ?? 600}`);
            const block = {};
            block['attributes'] = [];
            block['caption'] = '';
            block['height'] = imgInfo?.Height ?? 600;
            block['width'] = imgInfo?.Width ?? 1200;
            block['version'] = 1;
            block['type'] = 'image';
            block['src'] = imgObj.Url;
            blocks.push(block);
            newHtml +=
              '<div class="editor-image"><img src="' +
              imgObj.Url +
              '" style="max-width:100%;" data-width="' +
              (imgInfo?.Width ?? 1200) +
              '" data-height="' +
              (imgInfo?.Height ?? 600) +
              '"></div>';
            imageCount++;
          }
          if (tmpNodeStr) {
            tmpNodeStr = tmpNodeStr.replace(/<[^>]*>/g, '');
            if (tmpNodeStr) {
              const block = {};
              block['direction'] = null; //'ltr';

              const data = {};
              data['text'] = tmpNodeStr;
              data['detail'] = 0;
              data['format'] = 0;
              data['mode'] = 'normal';
              data['style'] = '';
              data['type'] = 'text';
              data['version'] = 1;

              block['children'] = [data];
              block['format'] = '';
              block['indent'] = 0;
              block['type'] = 'paragraph';
              block['version'] = 1;
              blocks.push(block);
              newHtml += '<p class="editor-paragraph"><span>' + tmpNodeStr + '</span></p>';
              contentLength += tmpNodeStr.length;
            }
          }
        } else {
          fnode.setAttribute('class', 'editor-paragraph');
          const block = {};
          block['direction'] = null; //'ltr';

          const data = {};
          data['text'] = fnode.innerText ?? fnode.textContent;
          data['detail'] = 0;
          data['format'] = 0;
          data['mode'] = 'normal';
          data['style'] = '';
          data['type'] = 'text';
          data['version'] = 1;

          block['children'] = [data];
          block['format'] = '';
          block['indent'] = 0;
          block['type'] = 'paragraph';
          block['version'] = 1;
          blocks.push(block);
          newHtml += '<p class="editor-paragraph"><span>' + (fnode.innerText ?? fnode.textContent) + '</span></p>';
          contentLength += (fnode.innerText ?? fnode.textContent).length;
        }
      } else {
        const block = {};
        block['direction'] = null; //'ltr';

        const data = {};
        data['text'] = fnode.innerText ?? fnode.textContent;
        data['detail'] = 0;
        data['format'] = 0;
        data['mode'] = 'normal';
        data['style'] = '';
        data['type'] = 'text';
        data['version'] = 1;

        block['children'] = [data];
        block['format'] = '';
        block['indent'] = 0;
        block['type'] = 'paragraph';
        block['version'] = 1;
        blocks.push(block);
        newHtml += '<p class="editor-paragraph"><span>' + (fnode.innerText ?? fnode.textContent) + '</span></p>';
        contentLength += (fnode.innerText ?? fnode.textContent).length;
      }
    }

    const root = {};
    root['direction'] = 'ltr';
    root['children'] = blocks;
    root['format'] = '';
    root['indent'] = 0;
    root['type'] = 'root';
    root['version'] = 1;
    taskData['imageCount'] = imageCount;
    taskData['contentLength'] = contentLength;
    taskData['markDownContent'] = JSON.stringify({ root: root });
    return newHtml;
  } else {
    return content;
  }
};

interface ImageTmpObj {
  FileName: string;
  Url: string;
  Width: number;
  Height: number;
  Length: number;
  ImgShowId: string | null;
}

const uploadCovers = async (cookie: string, token: string, covers: Array<ImageInfo>): Promise<Array<string>> => {
  const upCovers: Array<string> = [];
  if (covers?.length > 0) {
    for (const img of covers) {
      if (upCovers.length >= 3) {
        break;
      }
      let imgUrl = img.pathOrUrl;
      if (!imgUrl) {
        continue;
      }
      if (imgUrl.startsWith('//')) {
        imgUrl = 'http:' + imgUrl;
      }

      if (imgUrl?.startsWith('http')) {
        const convertRe = await convertCheJiaHaoImageResponse(cookie, imgUrl);
        if (convertRe?.result?.Url) {
          upCovers?.push(convertRe?.result?.Url);
          continue;
        }
      }
      //下载后再上传
      const imgData = await readImageData(imgUrl, 'jpeg');

      if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
        throw new Error(`封面图片读取失败-${imgData.status}-${imgUrl}`);
      }
      const ext = imgData.ext || 'jpg';
      const binaryResult = await uploadCheJiaHaoImageResponse(cookie, imgData.data, token, ext);
      const uploadedUrl = binaryResult?.code === 0 && binaryResult?.url ? binaryResult.url : '';
      if (!uploadedUrl) {
        throw new Error(`封面图片上传失败-${binaryResult?.message ?? ''}-${imgUrl}`);
      }

      if (!uploadedUrl) {
        throw new Error(`封面图片上传失败-${imgUrl}`);
      }
      upCovers.push(uploadedUrl);
    }
  }

  return upCovers;
};

const uploadverticalCover = async (cookie: string, token: string, img?: ImageInfo): Promise<string> => {
  let imgUrl = img?.pathOrUrl;
  if (!imgUrl) {
    return '';
  }
  if (imgUrl.startsWith('//')) {
    imgUrl = 'http:' + imgUrl;
  }
  if (imgUrl?.startsWith('http')) {
    const convertRe = await convertCheJiaHaoImageResponse(cookie, imgUrl);
    if (convertRe?.result?.Url) {
      return convertRe?.result?.Url;
    }
  }
  //下载后再上传
  const imgData = await readImageData(imgUrl, 'jpeg');

  if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
    throw new Error(`封面图片读取失败-${imgData.status}-${imgUrl}`);
  }
  const ext = imgData.ext || 'jpg';
  const binaryResult = await uploadCheJiaHaoImageResponse(cookie, imgData.data, token, ext);
  const uploadedUrl = binaryResult?.code === 0 && binaryResult?.url ? binaryResult.url : '';
  if (!uploadedUrl) {
    throw new Error(`封面图片上传失败-${binaryResult?.message ?? ''}-${imgUrl}`);
  }

  if (!uploadedUrl) {
    throw new Error(`封面图片上传失败-${imgUrl}`);
  }
  return uploadedUrl;
};

const buildDraftData = (taskData: CheJiaHaoArticleTaskInput, content: string): string => {
  const re = {
    title: taskData.title ?? '',
    content: content ?? '',
    contentJson: taskData['markDownContent'] ?? '',
    contentLength: 0,
    contentImagesLength: 0,
    isMultiTitle: 0,
    columnId: 0,
    activityIds: [0],
    timerStatus: 0,
    timerTime: '',
    publishType: taskData.pubType ?? 1,
    role: 2,
    isOriginal: 0,
    isFirst: 0,
  };
  re['source'] = 'pc';
  re['suggestTitle'] = '';
  re['contentImagesLength'] = taskData['imageCount'];
  re['contentLength'] = taskData['contentLength'];

  /**
   * 论坛
   */
  if (taskData.bbsInfo?.bbsId) {
    re['multibbs'] = taskData.bbsInfo;
  }

  //话题
  if (taskData.topics) {
    re['topic'] = taskData.topics;
  }
  //定时发布
  // if (taskData.publishTime) {
  //   re.timerStatus = 1;
  //   re.timerTime = dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm');
  // }

  // 首发原创
  // if (taskData.isOriginal === 1) {
  //   re.isOriginal = 1;
  // }

  return JSON.stringify(re);
};

const buildPostData = (
  taskData: CheJiaHaoArticleTaskInput,
  content: string,
  coverImages: Array<string>,
  verticalCover: string,
  verticalCoverImage?: ImageInfo,
): string => {
  coverImages = coverImages?.length > 2 ? coverImages.splice(0, 3) : coverImages.slice(0, 1);
  const re = {
    title: taskData.title ?? '',
    content: content ?? '',
    contentJson: taskData['markDownContent'] ?? '',
    contentLength: 0,
    contentImagesLength: 0,
    isMultiTitle: 0,
    coverType: coverImages?.length > 1 ? 1 : 0,
    imageUrls: coverImages,
    imgVerticals: [verticalCover],
    imgVerticalUrl: verticalCover,
    imgVerticalHeight: verticalCoverImage?.height ?? 1280,
    imgVerticalWidth: verticalCoverImage?.width ?? 720,
    columnId: 0,
    activityIds: [0],
    timerStatus: 0,
    timerTime: '',
    publishType: taskData.pubType ?? 1,
    role: 2,
    isOriginal: 0,
    isFirst: 0,
  };
  re['source'] = 'pc';
  re['suggestTitle'] = '';
  re['contentImagesLength'] = taskData['imageCount'];
  re['contentLength'] = taskData['contentLength'];

  //定时发布
  if (taskData.publishTime) {
    re.timerStatus = 1;
    re.timerTime = dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm');
  }

  // 首发原创
  if (taskData.isOriginal === 1) {
    re.isOriginal = 1;
  }

  return JSON.stringify(re);
};

export interface CheJiaHaoArticleTaskInput {
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
   * 文章封面
   */
  covers: Array<ImageInfo>;

  /**
   * 竖版封面
   */
  verticalCover?: ImageInfo;

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 定时发布时间戳 13位
   */
  publishTime?: number;

  /**
   * 1:原创
   */
  isOriginal?: 1 | 0;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 论坛信息
   */
  bbsInfo?: {
    bbsId?: number;
    bbsName?: string;
  };

  /**
   * 话题
   */
  topics?: Array<{ type: number; value: string }>;
}

export interface CheJiaHaoPublishResultOutput extends BaseResult {
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
