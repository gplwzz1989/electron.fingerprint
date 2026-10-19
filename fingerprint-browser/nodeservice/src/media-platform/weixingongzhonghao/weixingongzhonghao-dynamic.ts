import FormData from 'form-data';
import { $http } from '@/http';
import {
  CreateArticleMsgResponse,
  pushMsgResponse,
  uploadWeixinImageResponse,
} from './weixingongzhonghao-article.service';
import {
  buildPushData,
  createPublicMsg,
  createSendMsg,
  uploadImage,
  WeixinMsgTaskInput,
  WeixinPublishResultOutput,
} from './weixingongzhonghao-article';
import { ImageInfo } from '../baseModel';
import { EventEmitter } from 'events';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { checkQrcodeOpen } from '@/media-platform/weixingongzhonghao/weixingongzhonghao-user.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { getNowTimeStamp } from '@/utils/use-date';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {
  Guid,
  htmlDecode,
  isJson,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '@/utils';
import { readImageData } from '@/utils';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';

export const publishGongZhongHaoDynamic = async (
  cookie: string,
  taskData: WeixinDynamicTaskInput,
  ticketId: string,
  ticket: string,
  userToken: number,
  userId: string,
  eventCallback: EventEmitter,
): Promise<WeixinPublishResultOutput> => {
  logger.info(`微信公众号图集发布${taskData.taskId}`);
  const pubResult: WeixinPublishResultOutput = {
    code: 0,
    msg: 'ok',
    taskId: taskData.taskId,
  };

  try {
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (await checkQrcodeOpen(cookie, userToken.toString())) {
      pubResult.code = -1;
      pubResult.msg =
        '发布失败，账号开启了群发保护；需前往微信公众号平台-设置与开发-安全中心-风险操作保护-关闭<群发消息>保护后再试。';
      return pubResult;
    }

    if (!(taskData.images?.length > 0)) {
      pubResult.code = -1;
      pubResult.msg = '图集至少需要一张图片';
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }

    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }

    const postDraftData = await buildDynamicArticles(
      cookie,
      taskData,
      ticketId,
      ticket,
      userToken,
      pubResult,
      eventCallback,
    );
    if (!postDraftData) {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ? pubResult.msg : '创建图集失败',
        taskData.taskId,
      );
      return pubResult;
    }
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 80, '图片上传完成', taskData.taskId);

    const draftResult = await createWeixinDynamicMsgResponse(cookie, postDraftData, userToken, taskData.draftId);
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (draftResult.ret === '64714') {
      pubResult.code = draftResult?.base_resp?.ret ?? -1;
      pubResult.msg = '图集保存失败:请检查原创声明';
      return pubResult;
    }
    if (!draftResult?.appMsgId) {
      pubResult.code = draftResult?.base_resp?.ret ?? -1;
      pubResult.msg = `图集保存失败:${draftResult.base_resp?.err_msg ?? draftResult.msg ?? ''}`;
      return pubResult;
    }

    if (taskData.pubType == 0) {
      pubResult.code = 0;
      pubResult.publishId = `${draftResult.appMsgId}_${userId}`;
      return pubResult;
    }

    let pubReq = '';
    const pubCode = '';
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.notifySubscribers == 0) {
      const publicResult = await createPublicMsg(cookie, draftResult.appMsgId, userToken);
      if (publicResult) {
        pubResult.code = -1;
        pubResult.msg = publicResult;
        return pubResult;
      }
    } else {
      const sendResult = await createSendMsg(cookie, draftResult.appMsgId, userToken);
      if (sendResult && !sendResult?.startsWith('req_')) {
        pubResult.code = -1;
        pubResult.msg = sendResult;
        return pubResult;
      }
      pubReq = sendResult?.substring(4);
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 85, '消息创建完成', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);

    taskData.cancelToken?.throwIfCancelled(privateKey);
    const pushTaskData: WeixinMsgTaskInput = {
      taskId: taskData.taskId,
      pubType: taskData.pubType,
      sex: taskData.sex,
      groupId: taskData.groupId,
      notifySubscribers: taskData.notifySubscribers,
      country: taskData.country,
      province: taskData.province,
      city: taskData.city,
      draftId: taskData.draftId,
      publishTime: taskData.publishTime,
      contentList: [
        {
          title: taskData.title,
          desc: taskData.desc ?? '',
          needOpenComment: taskData.needOpenComment,
          needOpenReply: (taskData.autoSelectComment ?? 2) as never,
          cover: taskData.images[0],
          content: '',
          disableRecommend: taskData.disableRecommend,
          isOriginal: 0,
          contentSource: taskData.contentSource as never,
        },
      ],
      cancelToken: taskData.cancelToken,
      proxy: taskData.proxy,
    };
    const postData = buildPushData(
      pushTaskData,
      draftResult.appMsgId,
      userToken,
      pubReq,
      pubCode,
      taskData.notifySubscribers == 0,
    );
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    taskData.cancelToken?.throwIfCancelled(privateKey);
    taskData.cancelToken?.disable(privateKey);
    let publishResult = await pushMsgResponse(
      cookie,
      postData,
      userToken,
      draftResult.appMsgId,
      taskData.notifySubscribers ?? 0,
      !!taskData.publishTime,
      webProxy,
    );
    if (publishResult?.base_resp?.ret != 0) {
      await Task.Delay(5000);
      publishResult = await pushMsgResponse(
        cookie,
        postData,
        userToken,
        draftResult.appMsgId,
        taskData.notifySubscribers ?? 0,
        !!taskData.publishTime,
        webProxy,
      );
    }

    pubResult.code = publishResult?.base_resp?.ret ?? errorCode.request_error;
    pubResult.msg = publishResult?.base_resp?.err_msg ?? '';
    pubResult.publishId = `${draftResult.appMsgId}_${userId}`;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`微信公众号图集发布失败${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    }

    return pubResult;
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
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
    logger.error(`微信公众号图集发布异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  }

  return pubResult;
};

const buildDynamicArticles = async (
  cookie: string,
  taskData: WeixinDynamicTaskInput,
  ticketId: string,
  ticket: string,
  userToken: number,
  pubResult: WeixinPublishResultOutput,
  eventCallBack: EventEmitter,
): Promise<FormData | null> => {
  const isCreateDraft = !taskData.draftId;
  const isUserNoClaimSource = 0;
  const images: Array<WeixinDynamicUploadImageInfo> = [];
  for (let i = 0; i < taskData.images.length; i++) {
    const item = taskData.images[i];
    let imageUrl = item.pathOrUrl;
    if (imageUrl?.startsWith('//')) {
      imageUrl = `http:${imageUrl}`;
    }
    const themeColor = await getDynamicThemeColor(imageUrl);
    const resultJson = await uploadImage(cookie, imageUrl, ticketId, ticket, userToken);
    if (!resultJson?.url) {
      pubResult.code = -1;
      pubResult.msg = `图集图片上传失败:${imageUrl}`;
      return null;
    }
    images.push({
      url: resultJson.url,
      fileId: parseInt(resultJson.id || '0'),
      width: item.width && item.width > 0 ? item.width : 1,
      height: item.height && item.height > 0 ? item.height : 1,
      themeColor,
    });
    SetProgressEvent(eventCallBack, 20 + 50 * ((i + 1) / taskData.images.length), '图片上传中', taskData.taskId);
  }

  if (isCreateDraft && images.length > 0 && images.length < 3) {
    const padSource = taskData.images[0];
    let padImageUrl = padSource.pathOrUrl;
    if (padImageUrl?.startsWith('//')) {
      padImageUrl = `http:${padImageUrl}`;
    }
    while (images.length < 3) {
      const padResultJson = await uploadImage(cookie, padImageUrl, ticketId, ticket, userToken);
      if (!padResultJson?.url) {
        pubResult.code = -1;
        pubResult.msg = `图集图片补足失败:${padImageUrl}`;
        return null;
      }
      images.push({
        url: padResultJson.url,
        fileId: parseInt(padResultJson.id || '0'),
        width: padSource.width && padSource.width > 0 ? padSource.width : 1,
        height: padSource.height && padSource.height > 0 ? padSource.height : 1,
        themeColor: images[0].themeColor ?? 'rgb(0,0,0)',
      });
    }
  }

  if (!images.length) {
    pubResult.code = -1;
    pubResult.msg = '图集至少需要一张图片';
    return null;
  }

  const firstImage = images[0];
  const contentText = getDynamicContentText(taskData.desc ?? '');
  const titleText = taskData.title;
  const sourceUrlText = '';
  const cropRatioList = getDynamicCropRatioList(images.length);
  const cropImages: Array<WeixinDynamicUploadImageInfo> = [];
  const cropSourceImage = taskData.images[0];
  if (cropSourceImage) {
    let cropImageUrl = cropSourceImage.pathOrUrl;
    if (cropImageUrl?.startsWith('//')) {
      cropImageUrl = `http:${cropImageUrl}`;
    }
    for (const ratio of cropRatioList) {
      const cropResultJson = await uploadDynamicCropImage(cookie, cropImageUrl, ratio, ticketId, ticket, userToken);
      if (!cropResultJson?.url) {
        pubResult.code = -1;
        pubResult.msg = `图集图片裁剪资源上传失败:${cropImageUrl}`;
        return null;
      }
      cropImages.push({
        url: cropResultJson.url,
        fileId: parseInt(cropResultJson.id || '0'),
        width:
          cropResultJson.width && cropResultJson.width > 0
            ? cropResultJson.width
            : cropSourceImage.width && cropSourceImage.width > 0
            ? cropSourceImage.width
            : 1,
        height:
          cropResultJson.height && cropResultJson.height > 0
            ? cropResultJson.height
            : cropSourceImage.height && cropSourceImage.height > 0
            ? cropSourceImage.height
            : 1,
        ratio,
      });
    }
  }
  const shareCoverImage = cropImages[cropImages.length - 1];
  const articleData = {};

  articleData['is_finder_video'] = 0;
  articleData['finder_draft_id'] = 0;
  articleData['applyori'] = 0;
  articleData['ad_video_transition'] = '';
  articleData['can_reward'] = 0;
  articleData['pay_gifts_count'] = 0;
  articleData['reward_reply_id'] = '';
  articleData['related_video'] = '';
  articleData['is_video_recommend'] = -1;
  articleData['title'] = titleText;
  articleData['is_user_title'] = isCreateDraft ? 1 : taskData.title ? 1 : 0;
  articleData['author'] = '';
  articleData['writerid'] = 0;
  articleData['fileid'] = isCreateDraft ? '' : firstImage.fileId;
  articleData['digest'] = '';
  articleData['auto_gen_digest'] = 1;
  articleData['content'] = contentText;
  articleData['sourceurl'] = sourceUrlText;
  articleData['last_choose_cover_from'] = 0;
  const commentData = isCreateDraft
    ? {
        need_open_comment: 1,
        only_fans_can_comment: 0,
        only_fans_days_can_comment: 0,
        reply_flag: 2,
      }
    : buildCommentData(taskData.needOpenComment, taskData.autoSelectComment);
  articleData['need_open_comment'] = commentData.need_open_comment;
  articleData['only_fans_can_comment'] = commentData.only_fans_can_comment;
  articleData['only_fans_days_can_comment'] = commentData.only_fans_days_can_comment;
  articleData['reply_flag'] = commentData.reply_flag;
  articleData['not_pay_can_comment'] = 0;
  articleData['auto_elect_comment'] = 1;
  articleData['auto_elect_reply'] = 1;
  articleData['option_version'] = 5;
  articleData['open_fansmsg'] = 0;
  articleData['cdn_url'] = firstImage.url;
  articleData['cdn_235_1_url'] = firstImage.url;
  articleData['cdn_16_9_url'] = '';
  articleData['cdn_3_4_url'] = firstImage.url;
  articleData['cdn_1_1_url'] = firstImage.url;
  articleData['cdn_finder_url'] = '';
  articleData['cdn_video_url'] = '';
  articleData['cdn_url_back'] = firstImage.url;
  articleData['crop_list'] = JSON.stringify(buildDynamicCropList(cropImages.length ? cropImages : images));
  articleData['app_cover_auto'] = 0;
  articleData['music_id'] = '';
  articleData['video_id'] = '';
  articleData['voteid'] = '';
  articleData['voteismlt'] = '';
  articleData['supervoteid'] = '';
  articleData['super_vote_id'] = '';
  articleData['vid_type'] = '';
  articleData['show_cover_pic'] = 0;
  articleData['copyright_type'] = 0;
  articleData['is_cartoon_copyright'] = 0;
  articleData['copyright_img_list'] = JSON.stringify({ max_width: 578, img_list: [] });
  articleData['releasefirst'] = '';
  articleData['platform'] = '';
  articleData['reprint_permit_type'] = '';
  articleData['allow_fast_reprint'] = 0;
  articleData['allow_reprint'] = '';
  articleData['allow_reprint_modify'] = '';
  articleData['original_article_type'] = '';
  articleData['ori_white_list'] = '';
  articleData['video_ori_status'] = '';
  articleData['hit_nickname'] = '';
  articleData['free_content'] = '';
  articleData['fee'] = 0;
  articleData['ad_id'] = '';
  articleData['guide_words'] = contentText;
  articleData['is_share_copyright'] = 0;
  articleData['share_copyright_url'] = '';
  articleData['source_article_type'] = '';
  articleData['reprint_recommend_title'] = '';
  articleData['reprint_recommend_content'] = '';
  articleData['share_page_type'] = 8;
  articleData['share_imageinfo'] = JSON.stringify({
    list: buildShareImageInfo(images, isCreateDraft, shareCoverImage),
  });
  articleData['share_video_id'] = '';
  articleData['dot'] = '{}';
  articleData['share_voice_id'] = '';
  articleData['share_finder_audio_username'] = '';
  articleData['share_finder_audio_exportid'] = '';
  articleData['mmlistenitem_json_buf'] = '';
  articleData['insert_ad_mode'] = '';
  articleData['categories_list'] = '[]';
  articleData['compose_info'] = '{"list":""}';
  articleData['is_pay_subscribe'] = 0;
  articleData['pay_fee'] = '';
  articleData['pay_preview_percent'] = '';
  articleData['pay_desc'] = '';
  articleData['pay_album_info'] = '';
  const albumId = getDynamicAlbumId();
  articleData['appmsg_album_info'] = '{"appmsg_album_infos":[]}';
  articleData['open_keyword_ad'] = 0;
  articleData['open_comment_ad'] = commentData.need_open_comment;
  articleData['audio_info'] = '{"audio_infos":[{"audio_id":"","appmsg_album_info":{"id":"","title":""}}]}';
  articleData['danmu_pub_type'] = 0;
  articleData['mp_video_info'] = '{"list":[]}';
  articleData['appmsg_danmu_pub_type'] = '';
  articleData['is_set_sync_to_finder'] = 0;
  articleData['sync_to_finder_cover'] = '';
  articleData['sync_to_finder_cover_source'] = '';
  articleData['import_to_finder'] = 0;
  articleData['import_from_finder_export_id'] = '';
  articleData['style_type'] = 3;
  articleData['sticker_info'] = '{}';
  articleData['new_pic_process'] = 1;
  articleData['disable_recommend'] = taskData.disableRecommend > 0 ? 1 : 0;
  articleData['claim_source_type'] = taskData.contentSource;
  articleData['is_user_no_claim_source'] = isUserNoClaimSource;
  articleData['msg_index_id'] = taskData.draftId ? `0_${taskData.draftId}_0` : '';
  articleData['convert_to_image_share_page'] = '';
  articleData['convert_from_image_share_page'] = '';
  articleData['multi_picture_cover'] = 0;
  articleData['title_gen_type'] = 0;

  const postData = new FormData();
  const debugSnapshot: Record<string, unknown> = {};
  const appendField = (key: string, value: unknown) => {
    const normalized = value === undefined || value === null ? '' : String(value);
    postData.append(key, normalized);
  };

  appendField('token', userToken.toString());
  appendField('lang', 'zh_CN');
  appendField('f', 'json');
  appendField('ajax', '1');
  appendField('fingerprint', Guid.NewGuid().toString().replace(/-/g, ''));
  appendField('random', Math.random().toString());
  appendField('AppMsgId', taskData.draftId ?? '');
  appendField('count', '1');
  appendField(
    'data_seq',
    isCreateDraft
      ? '0'
      : `${getNowTimeStamp(13)}${Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, '0')}`,
  );
  appendField('operate_from', 'Chrome');
  appendField('isnew', '0');
  appendField('articlenum', '1');
  appendField('pre_timesend_set', '0');

  for (const item in articleData) {
    appendField(`${item}0`, articleData[item]);
  }

  appendField(
    'req',
    JSON.stringify({
      idx_infos: [
        {
          save_old: 0,
          cps_info: { cps_import: 0 },
          red_packet_cover_list: {},
          podcast_task_info: null,
          claim_source: { is_user_no_claim_source: 1 },
          line_info: { is_appmsg_flag: 0, scene: 2 },
          window_product: {},
          link_info: { link_type: 1 },
          appmsg_link: {},
          weapp_link: {},
          yqj_info: {},
          ai_pic_info: { cover_source: 0, cover_pic_id: '', ai_pic_id: [] },
          single_video_snap_card: {},
          product_activity: {},
          footer_gift_activity: {},
          footer_common_shops: [],
          footer_product_card: {},
          location: {},
        },
      ],
      appmsg_id: 0,
      is_use_flag: 0,
      template_version: '61842274',
    }),
  );
  appendField('remind_flag', 'null');
  appendField('is_auto_type_setting', '3');
  appendField('save_type', '0');
  appendField('masssend_check', '1');
  appendField('is_masssend', '1');
  appendField('isneedsave', '0');
  return postData;
};

const createWeixinDynamicMsgResponse = async (
  cookie: string,
  postData: FormData,
  userToken: number,
  appMsgId: string = '',
): Promise<CreateArticleMsgResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg';
  const headers = {
    cookie: cookie,
    Referer: appMsgId
      ? `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&reprint_confirm=0&type=77&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`
      : `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&createType=8&token=${userToken}&lang=zh_CN&timestamp=${Date.now()}`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    t: 'ajax-response',
    sub: appMsgId ? 'update' : 'create',
    type: 77,
    token: userToken,
    lang: 'zh_CN',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

const buildCommentData = (needOpenComment = 0, needOpenReply = 0) => {
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
    result.reply_flag = needOpenReply || 2;
  }

  return result;
};

const buildDynamicCropList = (images: Array<WeixinDynamicUploadImageInfo>) => {
  const ratioList = getDynamicCropRatioList(images.length);
  const sourceImage = images[0];

  return {
    crop_list: ratioList.map((ratio, index) => {
      const image = images[index] ?? images[0];
      return {
        ratio,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        file_id: image?.fileId ?? 0,
      };
    }),
    crop_list_percent: ratioList.map((ratio, index) => {
      const image = images[index] ?? images[0];
      const cropInfo = sourceImage
        ? buildCropPercent(sourceImage.width, sourceImage.height, ratio)
        : { x1: 0, y1: 0, x2: 1, y2: 1 };
      return {
        ratio,
        x1: cropInfo.x1,
        y1: cropInfo.y1,
        x2: cropInfo.x2,
        y2: cropInfo.y2,
        file_id: image?.fileId ?? 0,
      };
    }),
  };
};

const getDynamicCropRatioList = (imageCount: number) =>
  imageCount >= 4 ? ['16_9', '1_1', '3_4', 'image_share_3_4_edit'] : ['3_4', '1_1', 'image_share_3_4_edit'];

const buildShareImageInfo = (
  images: Array<WeixinDynamicUploadImageInfo>,
  isCreateDraft = false,
  shareCoverImage?: WeixinDynamicUploadImageInfo,
) => {
  return images.map((item, index) => {
    const baseItem = {
      url: item.url,
      file_id: item.fileId,
      height: item.height,
      width: item.width,
      theme_color: item.themeColor ?? 'rgb(0,0,0)',
      disable_theme: 1,
      disable_live: 0,
      cdn_url: item.url,
      cover_info: isCreateDraft
        ? null
        : {
            cdn_url: item.url,
            file_id: item.fileId,
            crop_info: JSON.stringify({ x1: 0, y1: 0, x2: 1, y2: 1 }),
          },
    } as Record<string, unknown>;

    if (index === 0) {
      // const coverImage = shareCoverImage ?? item;
      // const cropInfo = buildCropPercent(coverImage.width, coverImage.height, '3_4');
      // baseItem['share_cover'] = {
      //   cdn_url: normalizeShareCoverUrl(coverImage.url),
      //   file_id: coverImage.fileId,
      //   crop_info: JSON.stringify(cropInfo),
      // };
    }

    return baseItem;
  });
};

const uploadDynamicCropImage = async (
  cookie: string,
  imageUrlOrPath: string,
  ratio: string,
  ticketId: string,
  ticket: string,
  userToken: number,
): Promise<{ url: string; id: string; width: number; height: number } | null> => {
  const imageData = await readImageData(imageUrlOrPath, 'jpeg');
  if (!imageData?.data) {
    return null;
  }

  const width = 600;
  const height = 600;
  const cropInfo = buildCropPercent(width, height, ratio);
  const left = Math.max(0, Math.round(cropInfo.x1 * width));
  const top = Math.max(0, Math.round(cropInfo.y1 * height));
  const cropWidth = Math.max(1, Math.round((cropInfo.x2 - cropInfo.x1) * width));
  const cropHeight = Math.max(1, Math.round((cropInfo.y2 - cropInfo.y1) * height));
  const buffer = imageData.data;
  const uploadResult = await uploadWeixinImageResponse(
    cookie,
    buffer,
    ticketId,
    ticket,
    userToken,
    imageData.ext ?? 'jpeg',
    imageData.fileName ?? 'crop-image.jpeg',
  );

  if (!uploadResult?.cdn_url) {
    return null;
  }

  return {
    url: uploadResult.cdn_url,
    id: uploadResult.content,
    width: cropWidth,
    height: cropHeight,
  };
};

export const getDynamicContentText = (content: string): string => {
  if (!content) {
    return '';
  }
  if (!content.includes('<')) {
    return content;
  }
  const html = new HtmlAgilityPack.HtmlDocument();
  html.LoadHtml(content);
  const pList = html.DocumentNode.SelectNodes('//p');
  if (pList?.length) {
    return htmlDecode(
      pList
        .map((item) => item.textContent ?? '')
        .join('\n')
        .trim(),
    );
  }
  return htmlDecode((html.DocumentNode.InnerText() ?? content).trim());
};

const buildCropPercent = (width: number, height: number, ratio: string) => {
  const targetRatio = getDynamicCropRatio(ratio);
  if (!width || !height || !targetRatio) {
    return { x1: 0, y1: 0, x2: 1, y2: 1 };
  }

  const sourceRatio = width / height;
  if (Math.abs(sourceRatio - targetRatio) < 0.000001) {
    return { x1: 0, y1: 0, x2: 1, y2: 1 };
  }

  if (sourceRatio > targetRatio) {
    const cropWidth = height * targetRatio;
    const margin = (width - cropWidth) / (2 * width);
    return { x1: margin, y1: 0, x2: 1 - margin, y2: 1 };
  }

  const cropHeight = width / targetRatio;
  const margin = (height - cropHeight) / (2 * height);
  return { x1: 0, y1: margin, x2: 1, y2: 1 - margin };
};

const getDynamicCropRatio = (ratio: string): number => {
  switch (ratio) {
    case '16_9':
      return 16 / 9;
    case '1_1':
      return 1;
    case '3_4':
    case 'image_share_3_4_edit':
      return 3 / 4;
    default:
      return 1;
  }
};

const normalizeShareCoverUrl = (url: string) => url.replace(/^https:\/\//, 'http://').replace(/&from=appmsg$/, '');

const getDynamicThemeColor = async (imageUrlOrPath: string): Promise<string> => {
  try {
    const imageData = await readImageData(imageUrlOrPath, 'jpeg');
    if (!imageData?.data) {
      return 'rgb(0,0,0)';
    }

    return `rgb(${Math.round(106)},${Math.round(106)},${Math.round(106)})`;
  } catch {
    return 'rgb(0,0,0)';
  }
};

const getDynamicAlbumId = (): string => {
  const now = getNowTimeStamp(10).toString();
  const random = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0');
  return `${now}${random}`;
};

interface WeixinDynamicUploadImageInfo {
  url: string;
  fileId: number;
  width: number;
  height: number;
  ratio?: string;
  themeColor?: string;
}

export interface WeixinDynamicTaskInput {
  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 发布类型
   * 0 存草稿
   * 1 发布
   */
  pubType: number;

  /**
   * 0:全部
   * 1:男
   * 2:女
   */
  sex: 0 | 1 | 2;

  /**
   * 群发分组id
   */
  groupId?: string;

  /**
   * 是否群发消息
   * 0:不群发
   * 1:群发
   */
  notifySubscribers: 0 | 1;

  /**
   * 群发地区-国家名称
   */
  country?: string;

  /**
   * 群发地区-省份名称
   */
  province?: string;

  /**
   * 群发地区-城市名称
   */
  city?: string;

  /**
   * 草稿id
   */
  draftId?: string;

  /**
   * 定时发布时间
   */
  publishTime?: number;

  /**
   * 图集标题
   */
  title: string;

  /**
   * 图集描述
   */
  desc?: string;

  /**
   * 图片列表
   */
  images: Array<ImageInfo>;

  /**
   * 是否开启留言
   * 0:关闭 1:关注用户 2:关注7天以上用户 3:所有
   */
  needOpenComment: 0 | 1 | 2 | 3;

  /**
   * 自动精选留言
   */
  autoSelectComment: 0 | 1;

  /**
   * 创作来源
   * 0:无需申明
   * 1:内容有AI生产
   * 2:素材来源官方媒体/网络新闻
   * 3:内容剧情演绎，仅供娱乐
   * 4:个人观点，仅供参考
   * 5:健康医疗分享，仅供参考
   * 6:投资观点，仅供参考
   */
  contentSource?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * 不允许平台推荐
   */
  disableRecommend: 0 | 1;

  cancelToken?: CancelToken;

  proxy?: KuaiDaiLiProxy;
}
