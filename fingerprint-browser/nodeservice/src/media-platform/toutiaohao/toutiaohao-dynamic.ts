import { CancelToken, privateKey } from '@/utils/CancelToken';
import { ImageInfo, PublishResult, ToutiaohaoArticleTopicInfo } from '@/media-platform';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { EventEmitter } from 'events';
import { htmlDecode, logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent } from '@/utils';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getImgFromUrl, uploadImageBinary } from './toutiaohao-article.service';
import { HtmlDocument } from '@/htmlAgilityPack';
import { publishTouTiaoDynamic, saveDraftTouTiaoDynamic } from './toutiaohao-dynamic.service';
import { getToutiaohaoArticleTopiclist } from '@/media-platform/toutiaohao/toutiaohao-common';
import { PubContentEnum } from '@/cloud/model/TypeEnum';

/**
 * 发短内容入参
 */
export interface TouTiaoDynamicTaskInput {
  cancelToken?: CancelToken;

  taskId: string;

  /**
   * 内容
   */
  desc?: string;

  // 图片最大限制18张
  images?: Array<ImageInfo>;

  pubType?: 0 | 1;
  infoSource?: number;
  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 头条短内容发布
 * @param cookie 账号cookie
 * @param taskData 任务数据
 * @param eventCallback 事件回调
 */
export const publishToutiaohaoDynamic = async (
  cookie: string,
  taskData: TouTiaoDynamicTaskInput,
  eventCallback: EventEmitter,
): Promise<PublishResult> => {
  logger.info(`头条图文发布 ${taskData.taskId}`);
  const pubResult: PublishResult = {
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
    const postData = {};

    postData['forum_id'] = '';
    postData['is_fans_article'] = 2;
    postData['content_rich_span'] = '';

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    // 图片发布时用到的类型
    const imageList: Array<string> = [];

    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    taskData.images = taskData.images?.slice(0, 18);

    const draftImgs = [];
    // region 上传图片
    if (taskData.images && taskData.images.length > 0) {
      for (const img of taskData.images) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (img.pathOrUrl?.startsWith('http')) {
          const convertRe = await getImgFromUrl(cookie, img.pathOrUrl);
          if (convertRe?.data?.image_uri) {
            imageList.push(convertRe.data?.image_uri);
            if (taskData.pubType === 0) {
              draftImgs.push({
                ic: false,
                url: convertRe?.data?.image_url,
                width: img.width,
                height: img.height,
                web_uri: convertRe?.data?.image_uri,
                uri: convertRe?.data?.image_uri,
                srcType: 1,
                mime_type: 'image/jpeg',
                id: Date.now(),
                with_edit: 0,
                with_cut: 0,
                with_filter: 0,
                with_words: 0,
                with_model: 0,
                origin_web_url: convertRe?.data?.image_url,
                origin_web_uri: convertRe?.data?.image_uri,
                file_size: img.size ?? 0,
              } as never);
            }
            continue;
          }
        }
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const imageData = await readImageData(img.pathOrUrl, 'jpeg');

        if (!(imageData?.data && imageData?.data?.length > 500)) {
          pubResult.msg = `读取图片失败${imageData.status}-${img.pathOrUrl}`;
          pubResult.code = errorCode.io_error;
          return pubResult;
        }

        const fileName = Date.now() + `.${imageData.ext ? imageData.ext : 'jpeg'}`;

        let uploadRe = await uploadImageBinary(
          cookie,
          imageData.data,
          fileName,
          imageData.ext ? imageData.ext : 'jpeg',
        );
        if (!uploadRe?.data?.image_url) {
          uploadRe = await uploadImageBinary(cookie, imageData.data, fileName, imageData.ext ? imageData.ext : 'jpeg');
        }
        if (!uploadRe?.data?.image_url) {
          pubResult.code = uploadRe?.code ?? -1;
          pubResult.msg = uploadRe?.message ?? '';
          return pubResult;
        }
        if (taskData.pubType === 0) {
          draftImgs.push({
            ic: false,
            url: uploadRe?.data?.image_url,
            width: img.width,
            height: img.height,
            web_uri: uploadRe?.data?.image_uri,
            uri: uploadRe?.data?.image_uri,
            srcType: 1,
            mime_type: 'image/jpeg',
            id: Date.now(),
            with_edit: 0,
            with_cut: 0,
            with_filter: 0,
            with_words: 0,
            with_model: 0,
            origin_web_url: uploadRe?.data?.image_url,
            origin_web_uri: uploadRe?.data?.image_uri,
            file_size: img.size ?? 0,
          } as never);
        }
        imageList.push(uploadRe?.data?.image_uri);
      }
    }
    // endregion

    //图片
    if (taskData.pubType === 0) {
      postData['images'] = draftImgs;
    } else {
      postData['image_list'] = imageList;
    }

    if (taskData.infoSource) {
      const extr = {};
      extr['info_source'] = JSON.stringify({
        source_type: taskData.infoSource,
        source_author_uid: '',
        time_format: '',
        position: {},
      });
      postData['extra'] = JSON.stringify(extr);
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    //正文 话题

    const content = '<div>' + taskData.desc + '</div>';
    const topicsList: Array<string> = [];
    const topicLinks = [];
    if (taskData.desc) {
      //从描述中解析话题出来
      const html = new HtmlDocument();
      html.LoadHtml(content);
      const topicMap: Map<string, string> = new Map<string, string>();
      const pList = html.DocumentNode.SelectNodes('//p');
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text') ?? '';
            const tmpTopic = await getToutiaohaoArticleTopiclist(cookie, text, PubContentEnum.dynamic);
            if (tmpTopic?.dataList?.length) {
              topicStr = JSON.stringify(tmpTopic.dataList[0]);
            } else {
              continue;
            }
          }
          const topicItem = JSON.parse(topicStr)?.raw as ToutiaohaoArticleTopicInfo;
          topicsList.push(topicItem.id.toString());
          item.textContent = `#${topicItem.word}#`;
          topicMap.set(item.textContent, topicItem.id.toString());
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }
      newText = htmlDecode(newText);
      //话题位置
      let index = 0;
      for (const topic of topicMap.keys()) {
        const startIndex = newText.indexOf(topic, index);
        const endIndex = startIndex + topic.length - 1;
        topicLinks.push({ start: startIndex, length: topic.length, type: 2, id: topicMap.get(topic) } as never);
        index = endIndex;
      }

      postData['content'] = newText;
      postData['mention_forum_id_list'] = topicsList;
      postData['content_rich_span'] = JSON.stringify({ links: topicLinks });
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    // 数据推送
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    if (taskData.pubType === 0) {
      const postDraftData = { draft_info: JSON.stringify(postData), draft_type: 1 };
      const draftRe = await saveDraftTouTiaoDynamic(cookie, JSON.stringify(postDraftData), webProxy);
      pubResult.code = draftRe?.code ?? -1;
      pubResult.msg = draftRe?.message;
      pubResult.publishId = draftRe?.gid;
      return pubResult;
    }
    const result = await publishTouTiaoDynamic(cookie, JSON.stringify(postData), webProxy);
    // 发布失败
    if (result.code != 0) {
      pubResult.code = result?.code ?? -1;
      pubResult.msg = result.message ?? '发布失败';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      logger.error(
        `头条图文发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(result)}`,
      );
    } else {
      pubResult.msg = '发布成功';
      pubResult.publishId = result.data.thread_id?.toString();
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    }
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
    logger.error(`头条图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};
