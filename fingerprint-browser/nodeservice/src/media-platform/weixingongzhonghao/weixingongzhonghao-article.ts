import {
  checkOpenQrCode,
  createWeixinArticleMsgResponse,
  getAllowSign,
  getImageInfoFromUrlResponse,
  getQrCodeTicket,
  getQrCodeUUID,
  getSendMassSendAfterSign,
  getSendMassSendPage,
  prePub,
  pushMsgResponse,
  uploadWeixinImageResponse,
  WaitQrCodeScanResponse,
  waitQrCodeScanResult,
  weixinMassCheckAd,
  weixinMassCheckCopyRight,
  weixinMassCheckMusic,
  weixinMassCheckSame,
  weixinMassSendForCheck,
} from '../weixingongzhonghao/weixingongzhonghao-article.service';
import {
  Guid,
  htmlDecode,
  htmlEncode,
  logger,
  publishStatusEnum,
  Random,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '../../utils';
import { ImageInfo, ListItemInfo, PublishResult } from '../baseModel';
import { DOMParser as Dom } from 'xmldom';
import { EventEmitter } from 'events';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { getNowTimeStamp } from '../../utils/use-date';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {
  ShipinhaoContentItem,
  WeiXinGongZhongHaoUpdateVoteDetailInfo,
  WeixingongzhonghaoUserItem,
} from '@/media-platform/weixingongzhonghao/weixingongzhonghao-model';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import { checkQrcodeOpen } from '@/media-platform/weixingongzhonghao/weixingongzhonghao-user.service';
import { Regex } from '@/article-parse/common/Common';
import { WeiXingGongZhongHaoMiniAppInfo } from '@/media-platform/weixingongzhonghao/weixingongzhonghao-miniapp.service';
import { generateRandomString } from '@/media-platform/xinlangweibo/xinlangweibo-common';

export const publishGongZhongHaoArticle = async (
  cookie: string,
  taskData: WeixinMsgTaskInput,
  ticketId: string,
  ticket: string,
  userToken: number,
  userId: string,
  eventCallback: EventEmitter,
): Promise<WeixinPublishResultOutput> => {
  logger.info(`微信公众号图文发布 ${taskData.taskId}`);
  const pubResult: WeixinPublishResultOutput = {
    code: 0,
    msg: 'ok',
    taskId: taskData.taskId,
  };

  try {
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (await checkQrcodeOpen(cookie, userToken.toString())) {
      pubResult.code = -1;
      pubResult.msg =
        '发布失败，账号开启了群发保护；需前往微信公众平台-设置与开发-安全中心-风险操作保护-关闭<群发消息>保护后再试。';
      return pubResult;
    }
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    // 删除更换封面和正文图片，并组装为推送数据
    const postDraftData = await buildArticles(
      cookie,
      taskData.contentList,
      ticketId,
      ticket,
      userToken,
      pubResult,
      taskData.taskId,
      eventCallback,
    );
    if (!postDraftData) {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : ' 创建文章失败',
        taskData.taskId,
      );
      return pubResult;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 80, '图片上传完成', taskData.taskId);

    const draftResult = await createWeixinArticleMsgResponse(cookie, postDraftData, userToken);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (draftResult.ret === '64714') {
      pubResult.code = draftResult?.base_resp?.ret ?? -1;
      pubResult.msg = '文章保存失败:请检查文章原创性';
      return pubResult;
    }
    if (!draftResult?.appMsgId) {
      pubResult.code = draftResult?.base_resp?.ret ?? -1;
      pubResult.msg = `文章保存失败:${draftResult.base_resp?.err_msg ?? draftResult.msg ?? ''}`;
      return pubResult;
    }

    //保存草稿成功
    if (taskData.pubType == 0) {
      pubResult.code = 0;
      pubResult.publishId = `${draftResult.appMsgId}_${userId}`;
      return pubResult;
    }

    let pubReq = '';
    const pubCode = '';
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //非群发消息
    if (taskData.notifySubscribers == 0) {
      const publicResult = await createPublicMsg(cookie, draftResult?.appMsgId, userToken);
      if (publicResult) {
        pubResult.code = -1;
        pubResult.msg = publicResult;
        return pubResult;
      }
    } else {
      //群发消息
      const sendResult = await createSendMsg(cookie, draftResult.appMsgId, userToken);
      if (sendResult && !sendResult?.startsWith('req_')) {
        pubResult.code = -1;
        pubResult.msg = sendResult;
        return pubResult;
      }
      pubReq = sendResult?.substring(4);
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 85, '消息创建完成', taskData.taskId);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    const isAdmin = '';
    //二维码
    // if (await checkOpenQrCode(cookie, userToken)) {
    //   pubResult.code = -1;
    //   pubResult.msg =
    //     '发布失败，账号开启了群发保护；需前往微信公众平台-设置与开发-安全中心-风险操作保护-关闭<群发消息>保护后再试。';
    //   return pubResult;
    //   //暂不支持开了发布需要扫码验证的情况
    //   // const qrCode = await CreateQrCode(cookie, draftResult.appMsgId, userToken, taskData.notifySubscribers);
    //   // //取消任务执行
    //   // taskData.cancelToken?.throwIfCancelled(privateKey);
    //   // if (qrCode?.qrCodeUrl) {
    //   //   //事件抛出二维码链接
    //   //   const qrData: WeiXinQrCode = {
    //   //     taskId: taskData.taskId,
    //   //   };
    //   //   qrData.authorName = userName;
    //   //   qrData.qrCodeUrl = qrCode.qrCodeUrl;
    //   //   qrData.type = 'scan';
    //   //   logger.info(`微信二维码 ${JSON.stringify(qrData)}`);
    //   //   eventCallback.emit('qrCode', qrData);
    //   //   await Task.Delay(2000);
    //   //   //等待扫码
    //   //   const waitScanResult = await waitScan(
    //   //     cookie,
    //   //     draftResult.appMsgId,
    //   //     userToken,
    //   //     qrCode.pubUUID,
    //   //     eventCallback,
    //   //     pubResult,
    //   //     200,
    //   //     3000,
    //   //     taskData,
    //   //   );
    //   //   //取消任务执行
    //   //   taskData.cancelToken?.throwIfCancelled(privateKey);
    //   //
    //   //   if (!waitScanResult) {
    //   //     return pubResult;
    //   //   }
    //   //
    //   //   //预发布
    //   //   const pre = await prePub(cookie, draftResult.appMsgId, userToken, qrCode.pubUUID);
    //   //   //取消任务执行
    //   //   taskData.cancelToken?.throwIfCancelled(privateKey);
    //   //   pubReq = qrCode.operation_seq;
    //   //   pubCode = waitScanResult.code;
    //   //   isAdmin = pre.isadmin.toString();
    //   // } else {
    //   //   pubResult.code = -1;
    //   //   pubResult.msg = '获取二维码失败';
    //   //   return pubResult;
    //   // }
    // }

    // if (isAdmin == '0') {
    //   //事件抛出已扫码，需要管理账号确认
    //   const qrData = {};
    //   qrData['authorName'] = userName;
    //   qrData['taskId'] = taskData.taskId;
    //   qrData['type'] = 'need_check';
    //   eventCallback.emit('qrCode', qrData);
    //   SetProgressEvent(eventCallback, 95, '扫码完成，请在管理员微信号确认发布', taskData.taskId);
    // }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    const postData = buildPushData(
      taskData,
      draftResult.appMsgId,
      userToken,
      pubReq,
      pubCode,
      taskData.notifySubscribers == 0,
    );
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    console.debug('微信公众号推送数据', taskData.taskId, cookie, postData);
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
    console.debug('微信公众号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.base_resp?.ret ?? errorCode.request_error;
    pubResult.msg = publishResult?.base_resp?.err_msg ?? '';
    pubResult.publishId = `${draftResult.appMsgId}_${userId}`;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`微信公众号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`微信公众号发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    console.groupEnd();
  }

  return pubResult;
};

export const uploadImage = async (
  cookie: string,
  imageUrlOrPath: string,
  ticketId: string,
  ticket: string,
  userToken: number,
): Promise<WeixinUploadedImageInfo | null | undefined> => {
  try {
    const result: WeixinUploadedImageInfo = {
      src: imageUrlOrPath,
      url: '',
      format: '',
      id: '',
    };

    //在线获取
    if (imageUrlOrPath.toUpperCase().startsWith('http')) {
      const urlImageInfo = await getImageInfoFromUrlResponse(cookie, imageUrlOrPath, userToken);
      if (urlImageInfo?.url) {
        result.url = urlImageInfo.url;
        result.format = urlImageInfo.img_format;
        result.id = urlImageInfo.file_id.toString();
        return result;
      }
    }
    //失败后进行下载上传
    const imageData = await readImageData(imageUrlOrPath, 'jpeg');
    if (!imageData.data) {
      console.debug(`图片读取失败:${imageUrlOrPath}-${imageData.status}`);
      return null;
    }
    const imageInfo = await uploadWeixinImageResponse(
      cookie,
      imageData.data,
      ticketId,
      ticket,
      userToken,
      imageData.ext,
      imageData.fileName,
    );
    if (imageInfo?.cdn_url) {
      result.url = imageInfo.cdn_url;
      result.id = imageInfo.content;
      result.format = imageInfo.type;
      return result;
    } else {
      console.debug(`图片上传失败:${imageUrlOrPath}-${imageInfo?.base_resp?.err_msg ?? '网络异常'}`);
      return null;
    }
  } catch (e) {
    console.debug(`图片上传异常:${imageUrlOrPath}-${e?.toString()}`);
    return null;
  }
};

/**
 * 创建文章推送草稿数据
 * @param cookie
 * @param articleDataList
 * @param ticketId
 * @param ticket
 * @param userToken
 * @param pubResult
 * @param taskId
 * @param eventCallBack
 */
export const buildArticles = async (
  cookie: string,
  articleDataList: Array<WeixinArticle>,
  ticketId: string,
  ticket: string,
  userToken: number,
  pubResult: WeixinPublishResultOutput,
  taskId: string,
  eventCallBack: EventEmitter,
): Promise<string> => {
  const articles: Array<string> = [];
  let i = 0;
  for (const article of articleDataList) {
    const postArticleData = {};
    postArticleData['applyori'] = 0;
    postArticleData['ad_video_transition'] = '';
    postArticleData['can_reward'] = 0;
    postArticleData['pay_gifts_count'] = 0;
    postArticleData['reward_reply_id'] = '';
    postArticleData['related_video'] = '';
    postArticleData['is_video_recommend'] = -1;
    postArticleData['title'] = article.title;

    //作者 选了原创的话，这里就是原创作者字段
    postArticleData['author'] = article.authorName ?? '';
    postArticleData['allow_fast_reprint'] = article.allowFastReprint ?? 0;
    postArticleData['writerid'] = 0;
    postArticleData['fileid'] = 0;
    postArticleData['digest'] = article.desc?.toString() ?? '';
    postArticleData['auto_gen_digest'] = 1;

    //原文链接
    postArticleData['sourceurl'] = article.contentSourceUrl ?? '';

    //开启留言/回复留言  -->和快捷私信不能同时存在
    const commentType = article.needOpenComment ?? 0;
    postArticleData['need_open_comment'] = 0;
    postArticleData['only_fans_can_comment'] = 0;
    postArticleData['only_fans_days_can_comment'] = 0;
    if (commentType > 0) {
      //留言类型 <=0:关闭 1:关注用户 2:关注7天以上用户 3:所有
      if (commentType == 1) {
        postArticleData['need_open_comment'] = 1;
        postArticleData['only_fans_can_comment'] = 1;
      } else if (commentType == 2) {
        postArticleData['need_open_comment'] = 1;
        postArticleData['only_fans_days_can_comment'] = 1;
      } else if (commentType == 3) {
        postArticleData['need_open_comment'] = 1;
        postArticleData['only_fans_can_comment'] = 0;
        postArticleData['only_fans_days_can_comment'] = 0;
      }

      //允许回复类型 5:所有用户，精选后展示，2:所有用户,3:已关注的用户,4:已关注7天以上用户
      postArticleData['reply_flag'] = article.needOpenReply ?? 2;
    } else {
      postArticleData['reply_flag'] = 0;
    }

    //创作来源
    //claim_source_type 4:个人观点 ,3:内容剧情演绎,2:素材来源于官方媒体，1:内容由AI生成 0:不声明
    if (article?.contentSource) {
      postArticleData['claim_source_type'] = article.contentSource;
    } else {
      postArticleData['claim_source_type'] = 0;
    }

    //快捷私信 1:是,0:否 -->和开启留言不能同时存在
    if (article?.openFansMsg) {
      postArticleData['open_fansmsg'] = 1;
    }

    //不允许被平台推荐 1:是 0:否
    if (article.disableRecommend > 0) {
      postArticleData['disable_recommend'] = 1;
    }

    //上传封面图
    let coverUrl = article.cover?.pathOrUrl;
    if (coverUrl) {
      if (coverUrl.startsWith('//')) {
        coverUrl = 'http:' + coverUrl;
      }
      const resultJson = await uploadImage(cookie, coverUrl, ticketId, ticket, userToken);

      if (!resultJson?.url) {
        pubResult.code = -1;
        pubResult.msg = `封面上传失败:${coverUrl}`;
        return '';
      }

      postArticleData['cdn_url'] = resultJson?.url;
      //封面地址，本还有裁切一部的，先省了，后续有问题再加

      postArticleData['cdn_235_1_url'] = resultJson?.url;
      postArticleData['cdn_16_9_url'] = resultJson?.url;
      postArticleData['cdn_1_1_url'] = resultJson?.url;
      postArticleData['cdn_url_back'] = resultJson?.url;
      //上面三个值是有的，测试不影响创建消息，就省了。
    } else {
      postArticleData['cdn_url'] = '';
      postArticleData['cdn_235_1_url'] = '';
      postArticleData['cdn_16_9_url'] = '';
      postArticleData['cdn_1_1_url'] = '';
      postArticleData['cdn_url_back'] = '';
    }
    SetProgressEvent(eventCallBack, 20 + 50 * ((i + 1) / articleDataList.length), '图片上传中', taskId);
    postArticleData['crop_list'] = '{}';
    postArticleData['music_id'] = '';
    postArticleData['video_id'] = '';
    postArticleData['voteid'] = '';
    postArticleData['voteismlt'] = '';
    postArticleData['supervoteid'] = '';
    postArticleData['cardid'] = '';
    postArticleData['cardquantity'] = '';
    postArticleData['cardlimit'] = '';
    postArticleData['vid_type'] = '';
    postArticleData['show_cover_pic'] = 0;
    postArticleData['shortvideofileid'] = '';
    postArticleData['copyright_type'] = article.isOriginal ?? 0;
    postArticleData['is_cartoon_copyright'] = 0;
    postArticleData['copyright_img_list'] = 0; //图片列表字段
    postArticleData['releasefirst'] = '';
    postArticleData['platform'] = '';

    postArticleData['reprint_permit_type'] = '';
    postArticleData['allow_reprint'] = '';
    postArticleData['allow_reprint_modify'] = '';
    //申明原创时的分类
    postArticleData['original_article_type'] =
      article.categoryName && article.subCategoryName ? `${article.categoryName}_${article.subCategoryName}` : '';

    //白名单
    //{"white_list":[{"nickname":"十同","title":"可修改文章","openid":"ovE0iwKetSVxPX9jnSrzNbX_RjoU","wx_name":"","username":"gh_fcc24fafaa5d","avatar":"","can_modify":"1","can_hide_source":"0","can_reward":"0"},{"nickname":"易撰","title":"可修改文章","openid":"ovE0iwGrZpBAMAqCwZvrF31QF-Rc","wx_name":"yizhuanw","username":"gh_fb92a38877b1","avatar":"http://wx.qlogo.cn/mmhead/Q3auHgzwzM4tAowPJYxakiaJT1D1EVctlpZUXkcueJibMuQXPRichwaKg/0","can_modify":"1","can_hide_source":"0","can_reward":"0"}]}
    postArticleData['ori_white_list'] = '';
    postArticleData['video_ori_status'] = '';
    postArticleData['hit_nickname'] = '';
    postArticleData['free_content'] = '';
    postArticleData['fee'] = 0;
    postArticleData['ad_id'] = '';
    postArticleData['guide_words'] = '';
    postArticleData['is_share_copyright'] = 0;
    postArticleData['share_copyright_url'] = '';
    postArticleData['source_article_type'] = '';
    postArticleData['reprint_recommend_title'] = '';
    postArticleData['reprint_recommend_content'] = '';
    postArticleData['share_page_type'] = 0;
    postArticleData['share_imageinfo'] = '{"list":[]}';
    postArticleData['share_video_id'] = '';
    postArticleData['dot'] = '{}';
    postArticleData['share_voice_id'] = '';
    postArticleData['insert_ad_mode'] = '';
    postArticleData['categories_list'] = '[]';
    postArticleData['is_pay_subscribe'] = 0;
    postArticleData['pay_fee'] = '';
    postArticleData['pay_preview_percent'] = '';
    postArticleData['pay_desc'] = '';

    postArticleData['appmsg_album_info'] = '{"appmsg_album_infos":[]}';
    postArticleData['can_insert_ad'] = 1;
    postArticleData['audio_info'] = '{"audio_infos":[]}';
    postArticleData['danmu_pub_type'] = 0;

    postArticleData['content'] = await replaceImgInHtml(
      cookie,
      article.content,
      ticketId,
      ticket,
      userToken,
      pubResult,
    );
    if (pubResult.code != 0) {
      return '';
    }
    postArticleData['compose_info'] = '';

    for (const item in postArticleData) {
      articles.push(`${item}${i}=` + encodeURIComponent(postArticleData[item]));
    }
    i++;
  }
  return `token=${userToken}&lang=zh_CN&f=json&ajax=1&random=0.1617291${getNowTimeStamp(
    10,
  )}&AppMsgId=&count=${i}&articlenum=${i}&data_seq=0&operate_from=Chrome&isnew=0&remind_flag=null${articles.join('&')}`;
};

/**
 * 处理正文中的图片
 * @param cookie
 * @param content
 * @param ticketId
 * @param ticket
 * @param userToken
 * @param pubResult
 * @constructor
 */
export const replaceImgInHtml = async (
  cookie: string,
  content: string,
  ticketId: string,
  ticket: string,
  userToken: number,
  pubResult: WeixinPublishResultOutput,
): Promise<string> => {
  content = '<div>' + content + '</div>';
  const html = new HtmlAgilityPack.HtmlDocument();
  html.LoadHtml(content);

  //视频号内容，前端处理好，这里不需要处理
  // <section class="channels_iframe_wrp wxw_wechannel_card_not_horizontal"><mpvideosnap contenteditable="false" class="js_uneditable custom_select_card channels_iframe videosnap_video_iframe" data-pluginname="videosnap" data-id="export/UzFfAgtgekIEAQAAAAAA6XQanNOUkAAAAAstQy6ubaLX4KHWvLEZgBPEmYIQXRsGV9eBzNPgMIuuN_G9c5yuBCK5bRklPjJI" data-url="https://findermp.video.qq.com/251/20304/stodownload?encfilekey=rjD5jyTuFrIpZ2ibE8T7YmwgiahniaXswqzjHGsvLcnGhbnEtYFPXN7wLBPKD0SUW8DBXy3HKO4GEpc6152qGq6531nu2L38RAtNpVWLnd99S7224zecya2xA&amp;adaptivelytrans=0&amp;bizid=1023&amp;dotrans=0&amp;hy=SH&amp;idx=1&amp;m=&amp;scene=0&amp;token=x5Y29zUxcibDMh8IJB3s7Ot1bEmGicjyLtJ8GIC0gbmXljZ8ZeicmZZdKQMrt9oHbXs0lxglqnJr44" data-headimgurl="http://wx.qlogo.cn/finderhead/SQd7RF5caa2RvibarR22txN4M17Gadibat4BEPy7dh2Ew7TPIb0YVmtQ/0" data-username="v2_060000231003b20faec8c7e28811c5d7cd0ceb37b077e698b01ae3d5cde01c8aca34747957b3@finder" data-nickname="谈资" data-desc="第一次见这样的#饮水机 ，看完觉得好神经但是莫名想要个同款哈哈哈哈哈！#搞笑 #娱乐评论大赏 #天打雷劈饮水机" data-nonceid="16124873876491305152" data-type="video" data-authiconurl="https://dldir1v6.qq.com/weixin/checkresupdate/icons_filled_channels_authentication_enterprise_a2658032368245639e666fb11533a600.png" data-width="1080" data-height="1920"></mpvideosnap></section>
  const videoCards = html.DocumentNode.SelectNodes('//video-card');
  if (videoCards.length > 0) {
    for (let i = 0; i < videoCards.length; i++) {
      const videoDataNode = videoCards[i];
      const newCard = html.DocumentNode.doc.createElement('section');
      const dataStr = decodeURIComponent(videoDataNode.getAttribute('data') ?? '');
      const videoData = JSON.parse(dataStr) as ShipinhaoContentItem;

      newCard.setAttribute('class', 'channels_iframe_wrp wxw_wechannel_card_not_horizontal');
      const mp = html.DocumentNode.doc.createElement('mpvideosnap');
      newCard.appendChild(mp);

      mp.setAttribute('contenteditable', 'false');
      mp.setAttribute('data-pluginname', 'videosnap');
      mp.setAttribute('data-id', videoData.yixiaoerId || '');
      mp.setAttribute('data-url', htmlEncode(videoData.yixiaoerImageUrl ?? ''));
      mp.setAttribute('data-headimgurl', videoData.authorLogo || '');
      mp.setAttribute('data-username', videoData.authorId || '');
      mp.setAttribute('data-nickname', videoData.authorName || '');
      mp.setAttribute('data-desc', videoData.yixiaoerDesc || '');
      mp.setAttribute('data-nonceid', videoData.nonceId || '');
      mp.setAttribute('data-type', 'video');
      mp.setAttribute('data-authiconurl', videoData.authorLogo || '');
      mp.setAttribute('data-width', String(videoData.videoWidth || ''));
      mp.setAttribute('data-height', String(videoData.videoHeight || ''));

      videoDataNode.parentNode?.insertBefore(newCard, videoDataNode);
      videoDataNode.parentNode?.removeChild(videoDataNode);
    }
  }

  //公众号卡片
  //<section class="mp_profile_iframe_wrp" nodeleaf=""><mp-common-profile class="js_uneditable custom_select_card mp_profile_iframe" data-pluginname="mpprofile" data-nickname="yixiaoerName" data-alias="alias" data-from="0" data-headimg="yixiaoerImageUrl" data-signature="yixiaoerDesc" data-id="yixiaoerId" data-is_biz_ban="0" data-service_type="serviceType" data-verify_status="verifyStatus"></mp-common-profile></section>
  const wxCards = html.DocumentNode.SelectNodes('//account-card');
  if (wxCards.length > 0) {
    for (let i = 0; i < wxCards.length; i++) {
      const cardDataNode = wxCards[i];
      const newCard = html.DocumentNode.doc.createElement('section');
      const dataStr = decodeURIComponent(cardDataNode.getAttribute('data') ?? '');
      const cardData = JSON.parse(dataStr) as WeixingongzhonghaoUserItem;

      newCard.setAttribute('class', 'mp_profile_iframe_wrp');
      newCard.setAttribute('nodeleaf', '');
      const mp = html.DocumentNode.doc.createElement('mp-common-profile');
      newCard.appendChild(mp);

      mp.setAttribute('class', 'js_uneditable custom_select_card mp_profile_iframe');
      mp.setAttribute('data-pluginname', 'mpprofile');

      // 设置其他 data-* 属性
      mp.setAttribute('data-nickname', cardData.yixiaoerName || '');
      mp.setAttribute('data-alias', cardData.alias || '');
      mp.setAttribute('data-from', '0');
      mp.setAttribute('data-headimg', cardData.yixiaoerImageUrl || '');
      mp.setAttribute('data-signature', cardData.yixiaoerDesc || '');
      mp.setAttribute('data-id', cardData.yixiaoerId || '');
      mp.setAttribute('data-is_biz_ban', '0');
      mp.setAttribute('data-service_type', String(cardData.serviceType || 0));
      mp.setAttribute('data-verify_status', String(cardData.verifyStatus || 0));
      cardDataNode.parentNode?.insertBefore(newCard, cardDataNode);
      cardDataNode.parentNode?.removeChild(cardDataNode);
    }
  }

  //投票
  //<section class="mp_vote_iframe_wrp" nodeleaf=""><mp-common-vote class="js_editor_vote_card js_uneditable custom_select_card mp_vote_iframe" data-pluginname="mpvote" data-supervoteid="489224598" data-expiretime="1764597734" data-votesubject="[{&quot;type&quot;:1,&quot;title&quot;:&quot;为什么会不过期-单选&quot;,&quot;options&quot;:[{&quot;name&quot;:&quot;因为这是带了图片的&quot;,&quot;url&quot;:&quot;https://mmbiz.qpic.cn/sz_mmbiz_jpg/QTMqVTVBGv4QstiaKUCQZ5eMBs0tHWxI7XgezkBV2BicyicogpWevEx4P6QogrZTeQqTIy7k7Gbkw6eq4BBuibTARA/0?wx_fmt=jpeg&amp;from=appmsg&quot;,&quot;cnt&quot;:0},{&quot;name&quot;:&quot;因为这是第一个没带图片&quot;,&quot;url&quot;:&quot;&quot;,&quot;cnt&quot;:0},{&quot;name&quot;:&quot;因为这是第二个没带图片&quot;,&quot;url&quot;:&quot;&quot;,&quot;cnt&quot;:0}],&quot;total_cnt&quot;:0},{&quot;type&quot;:2,&quot;title&quot;:&quot;为什么不会过期-多选&quot;,&quot;options&quot;:[{&quot;name&quot;:&quot;多选选项1-无图&quot;,&quot;url&quot;:&quot;&quot;,&quot;cnt&quot;:0},{&quot;name&quot;:&quot;多选选项2-无图&quot;,&quot;url&quot;:&quot;&quot;,&quot;cnt&quot;:0},{&quot;name&quot;:&quot;多选选项3-无图&quot;,&quot;url&quot;:&quot;&quot;,&quot;cnt&quot;:0}],&quot;total_cnt&quot;:0}]" data-delflag="0" data-fail="0"></mp-common-vote></section>
  const wxVotes = html.DocumentNode.SelectNodes('//vote-card');
  if (wxVotes.length > 0) {
    for (let i = 0; i < wxVotes.length; i++) {
      const voteDataNode = wxVotes[i];
      const newCard = html.DocumentNode.doc.createElement('section');
      const dataStr = decodeURIComponent(voteDataNode.getAttribute('data') ?? '');
      const voteData = JSON.parse(dataStr) as WeiXinGongZhongHaoUpdateVoteDetailInfo;

      newCard.setAttribute('class', 'mp_vote_iframe_wrp');
      newCard.setAttribute('nodeleaf', '');

      const mp = html.DocumentNode.doc.createElement('mp-common-vote');
      newCard.appendChild(mp);

      mp.setAttribute('class', 'js_editor_vote_card js_uneditable custom_select_card mp_vote_iframe');
      mp.setAttribute('data-pluginname', 'mpvote');
      mp.setAttribute('data-supervoteid', voteData.id);
      mp.setAttribute('data-expiretime', voteData.expire_time.toString());
      mp.setAttribute('data-votesubject', htmlEncode(JSON.stringify(voteData.vote_subject || '')));
      mp.setAttribute('data-delflag', '0');
      mp.setAttribute('data-fail', '0');

      voteDataNode.parentNode?.insertBefore(newCard, voteDataNode);
      voteDataNode.parentNode?.removeChild(voteDataNode);
      break;
    }
  }

  //小程序  data存小程序完整数据，data-text存自定义文本，data-image存设置的图片
  //卡片央视 <section nodeleaf=""><mp-common-miniprogram class="js_uneditable custom_select_card mp_miniprogram_iframe" data-pluginname="insertminiprogram" data-miniprogram-path="pages/main/main" data-miniprogram-nickname="王者荣耀" data-miniprogram-avatar="http://mmbiz.qpic.cn/mmbiz_png/icibUfDTLMDDOibwSLRmicpq5oj4UibP0HYueLONjX5iaf3tvsk51SGdpsVImZtDtqfNszdbknrfE4bVTlvvDWSYbyZA/640?wx_fmt=png&amp;wxfrom=200" data-miniprogram-title="这就是王者啊" data-miniprogram-imageurl="http://mmbiz.qpic.cn/sz_mmbiz_jpg/szICvVTeNlobYjVvmNXQBnbn8OrRdIyfcB6hhBcwMjlSytHbeicnO1vJkZSLd4bjLuR0aicGWLwiaNnrmFyU4HmRA/0?wx_fmt=jpeg" data-miniprogram-type="card" data-miniprogram-servicetype="0" data-miniprogram-appid="wx4a0a73ec028e47d7" data-miniprogram-imageurlback="http%3A%2F%2Fmmbiz.qpic.cn%2Fsz_mmbiz_jpg%2FszICvVTeNlobYjVvmNXQBnbn8OrRdIyf4M2Srxr1ibxXPC5Mv5JIeicldGP1jBzeHhP53AQOTjS54HtEmXGIRvjA%2F0%3Fwx_fmt%3Djpeg" data-miniprogram-cropperinfo="%7B%22c%22%3A%7B%22x%22%3A0%2C%22y%22%3A8%2C%22x2%22%3A80%2C%22y2%22%3A72%2C%22w%22%3A80%2C%22h%22%3A64%7D%7D"></mp-common-miniprogram></section><p style="text-align: left;"><span leaf=""><br></span></p><p style="display: none;"><mp-style-type data-value="10000"></mp-style-type></p>
  //图片 <section><span leaf=""><br></span><a class="weapp_image_link js_weapp_entry" data-miniprogram-type="image" style="" data-miniprogram-appid="wx4a0a73ec028e47d7" data-miniprogram-path="pages/main/main" data-miniprogram-nickname="王者荣耀" data-miniprogram-servicetype="0" data-miniprogram-applink="" data-miniprogram-imageurl="http://mmbiz.qpic.cn/sz_mmbiz_jpg/szICvVTeNlobYjVvmNXQBnbn8OrRdIyf4M2Srxr1ibxXPC5Mv5JIeicldGP1jBzeHhP53AQOTjS54HtEmXGIRvjA/0?wx_fmt=jpeg"><img class="rich_pages wxw-img" data-ratio="1" data-w="80" data-src="http://mmbiz.qpic.cn/sz_mmbiz_jpg/szICvVTeNlobYjVvmNXQBnbn8OrRdIyf4M2Srxr1ibxXPC5Mv5JIeicldGP1jBzeHhP53AQOTjS54HtEmXGIRvjA/0?wx_fmt=jpeg"></a></section><p style="display: none;"><mp-style-type data-value="10000"></mp-style-type></p>
  //文字 <section><span leaf=""><a class="weapp_text_link js_weapp_entry" style="" data-unique-id="mhn5ufx8-1qn0ru" data-miniprogram-type="text" data-miniprogram-appid="wx4a0a73ec028e47d7" data-miniprogram-path="pages/main/main" data-miniprogram-nickname="王者荣耀" data-miniprogram-servicetype="0" data-miniprogram-applink="">我是文字样式</a></span></section><p style="display: none;"><mp-style-type data-value="10000"></mp-style-type></p>
  const appCards = html.DocumentNode.SelectNodes('//app-card');
  if (appCards.length > 0) {
    for (let i = 0; i < appCards.length; i++) {
      const cardDataNode = appCards[i];
      const newCard = html.DocumentNode.doc.createElement('section');
      const dataStr = decodeURIComponent(cardDataNode.getAttribute('data') ?? '');
      const dataType = cardDataNode.getAttribute('data-type'); // text image card
      const text = cardDataNode.getAttribute('data-text') ?? '';
      let image = cardDataNode.getAttribute('data-image');
      const appData = (JSON.parse(dataStr) as ListItemInfo)?.raw as WeiXingGongZhongHaoMiniAppInfo;
      if (!appData.appid) {
        continue;
      }

      if (dataType === 'text') {
        const span = html.DocumentNode.doc.createElement('span');
        span.setAttribute('leaf', '');
        const a = html.DocumentNode.doc.createElement('a');
        a.setAttribute('class', 'weapp_text_link js_weapp_entry');
        a.setAttribute('style', '');
        a.setAttribute('data-unique-id', generateRandomString());
        a.setAttribute('data-miniprogram-type', 'text');
        a.setAttribute('data-miniprogram-appid', appData.appid);
        a.setAttribute('data-miniprogram-path', appData.main_page);
        a.setAttribute('data-miniprogram-nickname', appData.nickname);
        a.setAttribute('data-miniprogram-servicetype', '0');
        a.setAttribute('data-miniprogram-applink', '');
        a.textContent = decodeURIComponent(text ?? '');
        span.appendChild(a);
        //newCard.appendChild(span);
        cardDataNode.parentNode?.insertBefore(span, cardDataNode);
        cardDataNode.parentNode?.removeChild(cardDataNode);
      } else if (dataType === 'image' && image) {
        if (image?.startsWith('//')) {
          image = 'https:' + image;
        }
        let imageRe = await uploadImage(cookie, image, ticketId, ticket, userToken);
        if (!imageRe?.url) {
          imageRe = await uploadImage(cookie, image, ticketId, ticket, userToken);
        }
        if (!imageRe?.url) {
          pubResult.code = -1;
          pubResult.msg = `正文图片上传失败:${image}`;
          return '';
        }
        const span = html.DocumentNode.doc.createElement('span');
        span.setAttribute('leaf', '');
        newCard.appendChild(span);
        const a = html.DocumentNode.doc.createElement('a');
        a.setAttribute('class', 'weapp_image_link js_weapp_entry');
        a.setAttribute('style', '');
        a.setAttribute('data-unique-id', generateRandomString());
        a.setAttribute('data-miniprogram-type', 'image');
        a.setAttribute('data-miniprogram-appid', appData.appid);
        a.setAttribute('data-miniprogram-path', appData.main_page);
        a.setAttribute('data-miniprogram-nickname', appData.nickname);
        a.setAttribute('data-miniprogram-servicetype', '0');
        a.setAttribute('data-miniprogram-applink', '');
        a.setAttribute('data-miniprogram-imageurl', imageRe?.url);
        const img = html.DocumentNode.doc.createElement('img');
        img.setAttribute('class', 'rich_pages wxw-img');
        img.setAttribute('data-ratio', '1');
        img.setAttribute('data-w', '80');
        img.setAttribute('data-src', imageRe?.url);
        a.appendChild(img);
        newCard.appendChild(a);
        cardDataNode.parentNode?.insertBefore(newCard, cardDataNode);
        cardDataNode.parentNode?.removeChild(cardDataNode);
      } else if (image) {
        newCard.setAttribute('nodeleaf', '');
        if (image?.startsWith('//')) {
          image = 'https:' + image;
        }
        let imageRe = await uploadImage(cookie, image, ticketId, ticket, userToken);
        if (!imageRe?.url) {
          imageRe = await uploadImage(cookie, image, ticketId, ticket, userToken);
        }
        if (!imageRe?.url) {
          pubResult.code = -1;
          pubResult.msg = `正文图片上传失败:${image}`;
          return '';
        }

        const ap = html.DocumentNode.doc.createElement('mp-common-miniprogram');
        ap.setAttribute('class', 'js_uneditable custom_select_card mp_miniprogram_iframe');
        ap.setAttribute('data-pluginname', 'insertminiprogram');
        ap.setAttribute('data-miniprogram-path', appData.main_page);
        ap.setAttribute('data-miniprogram-nickname', appData.nickname);
        ap.setAttribute('data-miniprogram-avatar', appData.headimg_url);
        ap.setAttribute('data-miniprogram-title', decodeURIComponent(text));
        ap.setAttribute('data-miniprogram-imageurl', imageRe?.url);
        ap.setAttribute('data-miniprogram-type', 'card');
        ap.setAttribute('data-miniprogram-servicetype', '0');
        ap.setAttribute('data-miniprogram-appid', appData.appid);
        ap.setAttribute('data-miniprogram-imageurlback', encodeURIComponent(imageRe?.url));
        ap.setAttribute(
          'data-miniprogram-cropperinfo',
          '%7B%22c%22%3A%7B%22x%22%3A0%2C%22y%22%3A8%2C%22x2%22%3A80%2C%22y2%22%3A72%2C%22w%22%3A80%2C%22h%22%3A64%7D%7D',
        );
        newCard.appendChild(ap);
        cardDataNode.parentNode?.insertBefore(newCard, cardDataNode);
        cardDataNode.parentNode?.removeChild(cardDataNode);
      }


    }
  }

  const imgNodes = html.DocumentNode.SelectNodes('//img');
  if (imgNodes?.length > 0) {
    for (let i = 0; i < imgNodes.length; i++) {
      const img = imgNodes[i];
      let imgUrl = img.getAttribute('src') ?? img.getAttribute('data-src');
      if (!imgUrl) {
        continue;
      }
      if (imgUrl.startsWith('//')) {
        imgUrl = 'http:' + imgUrl;
      }
      const resultJson = await uploadImage(cookie, imgUrl, ticketId, ticket, userToken);
      if (!resultJson?.url) {
        pubResult.code = -1;
        pubResult.msg = `正文图片上传失败:${imgUrl}`;
        return '';
      } else {
        img.setAttribute('src', '');
        img.setAttribute('data-src', resultJson.url);
        img.setAttribute('class', 'rich_pages js_insertlocalimg');
      }
    }
    return htmlDecode(html?.DocumentNode.OuterHtml());
  } else {
    return htmlDecode(html?.DocumentNode?.OuterHtml());
  }
};

interface WeixinUploadedImageInfo {
  /**
   * 图片源地址
   */
  src: string;
  /**
   * 图片地址
   */
  url: string;
  /**
   * 图片格式
   */
  format: string;
  /**
   * 图片id
   */
  id: string;
}

export interface WeixinMsgTaskInput {
  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 发布类型
   * 0 存草稿 平台支持才有效，否则默认为发布
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
   * 群发分组id，貌似已经没有了
   */
  groupId?: string;
  /**
   * 是否群发消息，群发有次数限制，非群发没有次数限制
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
   * 草稿id，需要对草稿进行更新时使用
   */
  draftId?: string;

  /**
   * 定时发布时间，貌似已经没有了
   */
  publishTime?: number;

  /**
   * 文章列表
   */
  contentList: Array<WeixinArticle>;

  cancelToken?: CancelToken;

  proxy?: KuaiDaiLiProxy;
}

export interface WeixinArticle {
  /**
   * 文章标题
   */
  title: string;
  /**
   * 文章摘要
   */
  desc: string;
  /**
   * 是否申明原创  已经有两种类型，目前只支持一种
   * 0:不申明
   * 1:申明
   */
  isOriginal?: 0 | 1;

  /**
   * 申明原创 时一级分类
   */
  categoryName?: string;

  /**
   * 申明原创 时二级分类
   */
  subCategoryName?: string;
  /**
   * 申明原创时 作者昵称 最多8个字
   */
  authorName?: string;
  /**
   * 申明原创时，是否开启快捷转自啊
   */
  allowFastReprint?: 0 | 1;

  /**
   * 是否开启打赏
   */
  canReward?: 0 | 1;

  /**
   * 原文链接
   */
  contentSourceUrl?: string;

  /**
   * 是否开启留言,和快捷私信互斥
   * 0:关闭 1:关注用户 2:关注7天以上用户 3:所有
   */
  needOpenComment: 0 | 1 | 2 | 3;
  /**
   * 允许回复留言的类型
   * 5:所有用户，精选后展示，2:所有用户,3:已关注的用户,4:已关注7天以上用户
   */
  needOpenReply: 2 | 3 | 4 | 5;

  /**
   *  封面
   */
  cover: ImageInfo;

  /**
   * 内容得html字符串
   */
  content: string;

  /**
   * 创作来源
   * claim_source_type 4:个人观点 ,3:内容剧情演绎,2:素材来源于官方媒体，1:内容由AI生成 0:不声明
   */
  contentSource?: 0 | 1 | 2 | 3 | 4;

  /**
   * 快捷私信，与开启留言互斥，申明原创后可开启
   */
  openFansMsg?: 0 | 1;

  /**
   * 不允许平台推荐
   * 0：允许
   * 1：不允许
   */
  disableRecommend: 0 | 1;
}

export interface WeixinPublishResultOutput extends PublishResult {
  /**
   * 状态码
   * -0成功，非0失败
   */
  code: number;

  /**
   *提示消息
   */
  msg: string;

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
}

/**
 * 创建非群发消息
 * @param cookie
 * @param appMsgId
 * @param userToken
 * @constructor
 */
export const createPublicMsg = async (cookie: string, appMsgId: number, userToken: number): Promise<string> => {
  try {
    const crResult = await weixinMassSendForCheck(cookie, appMsgId, userToken);
    if (crResult?.base_resp?.ret != 0) {
      return `创建公开消息失败:${crResult?.base_resp?.err_msg}`;
    }

    const sameResult = await weixinMassCheckSame(cookie, appMsgId, userToken);
    if (sameResult?.base_resp?.ret != 0) {
      return `创建公开消息失败:${sameResult?.base_resp?.err_msg}`;
    }

    const copyResult = await weixinMassCheckCopyRight(cookie, appMsgId, userToken);
    if (copyResult?.base_resp?.err_msg != 'default') {
      if (copyResult?.base_resp?.err_msg?.includes('found reprint from other article')) {
        const jo = JSON.parse(copyResult['list'] ?? '{}') as { list: [{ source_url: string }] };
        return `文章未通过原创校验逻辑，与如下文章冲突:${jo?.list?.length ? jo.list[0]?.source_url : ''}`;
      }
      return `创建公开消息失败:${copyResult?.base_resp?.err_msg}`;
    }

    const adResult = await weixinMassCheckAd(cookie, appMsgId, userToken);
    if (adResult?.base_resp?.ret != 0) {
      return `创建公开消息失败:${adResult?.base_resp?.err_msg}`;
    }

    const musicResult = await weixinMassCheckMusic(cookie, appMsgId, userToken);
    if (musicResult?.base_resp?.ret != 0) {
      return `创建公开消息失败:${musicResult?.base_resp?.err_msg}`;
    }
    return '';
  } catch (e) {
    console.debug('创建微信公众号公开消息失败', e?.toString());
    return '创建公开消息异常';
  }
};

export const createSendMsg = async (cookie: string, appMsgId: number, userToken: number): Promise<string> => {
  try {
    const crResult = await getSendMassSendPage(cookie, appMsgId, userToken);
    if (crResult?.includes('腾讯提醒你') && crResult?.includes('同意以上声明')) {
      await getAllowSign(cookie, appMsgId, userToken);
      await getSendMassSendAfterSign(cookie, appMsgId, userToken);
    }
    let pubReq = Regex.Match(crResult, 'operation_seq:[\\s]{0,}".*"').Value();
    if (pubReq) {
      pubReq = pubReq?.split('"')[1];
    }

    //原创检测

    const oriResult = await weixinMassCheckCopyRight(cookie, appMsgId, userToken);
    if (oriResult?.base_resp?.err_msg?.includes('TEXT_NUM_TOO_SMALL') && oriResult.base_resp.ret == 64715) {
      return '申明原创,正文字数不少于300字';
    }

    const adResult = await weixinMassCheckAd(cookie, appMsgId, userToken);
    if (adResult?.base_resp?.ret != 0) {
      return `创建公开消息失败:${adResult?.base_resp?.err_msg}`;
    }

    const musicResult = await weixinMassCheckMusic(cookie, appMsgId, userToken);
    if (musicResult?.base_resp?.ret != 0) {
      return `创建公开消息失败:${musicResult?.base_resp?.err_msg}`;
    }
    return `req_${pubReq}`;
  } catch (e) {
    console.debug('创建微信公众号群发消息失败', e?.toString());
    return '创建群发消息异常';
  }
};

export const buildPushData = (
  taskData: WeixinMsgTaskInput,
  appMsgId: number,
  userToken: number,
  pubReq: string = '',
  pubCode: string = '',
  isNoti: boolean,
): string => {
  const argList: Array<string> = [];
  argList.push(`token=${userToken}`);
  argList.push(`lang=zh_CN&f=json&ajax=1&random=${Math.random()}`);
  argList.push('type=10');
  argList.push('ack=');
  argList.push('reprint_info=');
  argList.push('reprint_confirm=0');

  argList.push('list=');
  argList.push(`appmsgid=${appMsgId}`);
  argList.push('share_page=1');
  argList.push(`sex=${taskData.sex ?? 0}`);
  argList.push(`groupid=${taskData.groupId ?? ''}`);
  argList.push(`isMulti=${taskData.contentList?.length > 1 ? '1' : '0'}`);
  argList.push('synctxweibo=0');
  argList.push('sync_version=1');

  argList.push(`isFreePublish=${isNoti}`);

  argList.push(`fingerprint=${Guid.NewGuid().toString()}`);

  //是否群发 1是 0否
  if (taskData.notifySubscribers == 0) {
    argList.push('isFreePublish=true');
  }

  let country = taskData.country?.toString();
  if (country == '0' || country == '全部') {
    country = '';
  }
  argList.push(`country=${encodeURIComponent(country ?? '')}`);
  argList.push(`province=${encodeURIComponent(taskData.province?.toString() ?? '')}`);
  argList.push(`city=${encodeURIComponent(taskData.city?.toString() ?? '')}`);

  argList.push(`operation_seq=${pubReq}`);
  argList.push(`req_id=${getReqId(32)}`);
  argList.push(`req_time=${getNowTimeStamp(13)}`);
  const prePubTime = taskData.publishTime;
  if (prePubTime) {
    //定时发布，需要加上定时时间
    argList.push('direct_send=1');
    argList.push(`send_time=${taskData.publishTime}`);
  } else {
    argList.push('send_time=0');
  }
  argList.push(`code=${pubCode ?? ''}`);

  return argList.join('&');
};

const getReqId = (i: number): string => {
  let t = '';
  for (let e = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', a = 0; a < i; a++)
    t += e.charAt(Math.floor(Math.random() * e.length));
  return t;
};

/**
 * 创建二维码
 * @param cookie
 * @param appMsgId
 * @param userToken
 * @param notify
 * @constructor
 */
export const CreateQrCode = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
  notify: number,
): Promise<QrCodeInfo | null> => {
  try {
    const qrTicketResult = await getQrCodeTicket(cookie, appMsgId, userToken);
    if (!qrTicketResult.ticket) {
      return null;
    }

    const uuidResult = await getQrCodeUUID(cookie, appMsgId, userToken, qrTicketResult.ticket);
    if (!uuidResult.uuid) {
      return null;
    }

    const url = `https://mp.weixin.qq.com/safe/safeqrcode?ticket=${qrTicketResult.ticket}&uuid=${
      uuidResult.uuid
    }&action=check&type=msgs&msgid=${qrTicketResult.operation_seq}${notify == 0 ? '&publish_type=1' : ''}`;

    return {
      pubTicket: qrTicketResult.ticket,
      pubUUID: uuidResult.uuid,
      qrCodeUrl: url,
      operation_seq: qrTicketResult.operation_seq,
    };
  } catch (e) {
    console.debug(`获取微信二维码失败:${e?.toString()}`);
    return null;
  }
};

export interface QrCodeInfo {
  pubTicket: string;
  pubUUID: string;
  qrCodeUrl: string;
  operation_seq: string;
}

export const waitScan = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
  qrUUID: string,
  eventCallBack: EventEmitter,
  pubResult: WeixinPublishResultOutput,
  waitTimes = 200,
  waiTimeLen = 3000,
  taskData: WeixinMsgTaskInput,
): Promise<WaitQrCodeScanResponse | null> => {
  try {
    let i = 0;
    while (i < waitTimes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      const qrData: WeiXinQrCode = {
        taskId: taskData.taskId,
      };
      i++;
      const result = await waitQrCodeScanResult(cookie, appMsgId, userToken, qrUUID);
      if (result?.errcode == undefined) {
        if (i > waitTimes - 2) {
          pubResult.code = -1;
          pubResult.msg = '等待扫码超时';
          return null;
        } else {
          await Task.Delay(waiTimeLen);
          continue;
        }
      }

      if (result.errcode == 403) {
        eventCallBack.emit('publishing', 90, '管理员取消发布');
        qrData.type = 'cancel';
        qrData.msg = '管理员取消发布';
        eventCallBack.emit('qrCode', qrData);
        pubResult.code = -2;
        pubResult.msg = '管理员取消发布';
        return null;
      } else if (result.errcode == 401) {
        eventCallBack.emit('publishing', 90, '等待管理员扫码');
        //等待扫码
        if (i < waitTimes - 2) {
          await Task.Delay(waiTimeLen);
          continue;
        }
        qrData.type = 'timeout';
        qrData.msg = '等待管理员扫码超时';
        eventCallBack.emit('qrCode', qrData);
        pubResult.code = -2;
        pubResult.msg = '等待管理员扫码超时';
        return null;
      } else if (result.errcode == 404) {
        qrData.type = 'scanned';
        qrData.msg = '已扫码，等待管理员确认';
        eventCallBack.emit('qrCode', qrData);
        eventCallBack.emit('publishing', 90, '已扫码，等待确认');
        if (i < waitTimes - 2) {
          await Task.Delay(waiTimeLen);
          continue;
        }
        qrData.type = 'confirm_timeout';
        qrData.msg = '等待管理员确认超时';
        eventCallBack.emit('qrCode', qrData);
        pubResult.code = -2;
        pubResult.msg = '等待管理员确认超时';
        eventCallBack.emit('publishing', 90, '等待管理员确认超时');
        return null;
        //已扫码未确认或取消
      }

      qrData.type = 'success';
      qrData.msg = '';
      eventCallBack.emit('qrCode', qrData);
      return result;
    }

    const qrData: WeiXinQrCode = {
      taskId: taskData.taskId,
    };
    qrData.type = 'timeout';
    qrData.msg = '等待管理员扫码超时';
    eventCallBack.emit('qrCode', qrData);
    pubResult.code = -2;
    pubResult.msg = '等待管理员扫码超时';
    eventCallBack.emit('publishing', 90, '等待管理员扫码超时');
    return null;
  } catch (e) {
    pubResult.code = -2;
    pubResult.msg = '等待扫码异常';
    console.debug('等待扫码异常', e?.toString());
    return null;
  }
};

export interface WeiXinQrCode {
  authorName?: string;
  qrCodeUrl?: string;
  taskId: string;
  type?: 'scan' | 'cancel' | 'timeout' | 'confirm_timeout' | 'success' | 'scanned';
  msg?: string;
}
