import { DouyinTopicInfo } from './douyin-topic.service';
import { DouyinUserInfo, getMediaUserInfo, getUserPositionPrivilegeNew } from './douyin-user.service';
import { DouyinMiniAppInfo } from './douyin-miniapp.service';
import { checkGoodsIsInvalid, DouyinGoodsInfo } from './douyin-shop.service';
import { EventEmitter } from 'events';
import { DouyinPublishResult } from './douyin-video';
import { HttpConfig } from '../../http';
import {
  htmlDecode,
  isJson,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '../../utils';
import {
  AuthDataOutput,
  getAuthKey,
  getSdkToken,
  ImagePartInfo,
  uploadCover,
  uploadedImageInfo,
} from './douyin-base.service';
import { AxiosError } from 'axios';
import { $http } from '../../http';
import { DouyinMusicInfo } from './douyin-music.service';
import { ImageInfo, ListItemInfo } from '../baseModel';
import { errorCode } from '../errorCode';
import { DouyinActivityInfo } from './douyin-activity.service';
import { HtmlDocument } from '../../htmlAgilityPack';
import { checkByPassword, clientSign } from './douyin-video.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getDouyinTopics } from '@/media-platform/douyin/douyin-common';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { DouYinCpsSpuItem } from '@/media-platform/douyin/douyin-location.service';
import { getPublishVerifyMethods } from './douyin-publish-risk';

/**
 * 抖音图文发布
 * @param cookie 账号有效登录cookie字符串key=v;key2=v2
 * @param taskData 抖音图文发布任务参数结构
 * @param eventCallback 事件回调
 * @param userId 用户uid
 * @param retryTimes 失败最大重试次数
 */
export const publishDynamic = async (
  cookie: string,
  taskData: DouyinDynamicTaskInput,
  eventCallback: EventEmitter,
  userId: string,
  retryTimes: number = 3,
): Promise<DouyinPublishResult> => {
  logger.info(`抖音图文发布 ${taskData.taskId}`);

  const pubResult: DouyinPublishResult = {
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
    if (taskData.localStorage && taskData.localStorage['security-sdk/s_sdk_sign_data_key/web_protect']) {
      cookie = cookie.replace(/security-sdk\/s_sdk_sign_data_key\/web_protect=/g, 'droppedCookie=');
      cookie = cookie.replace(/security-sdk\/s_sdk_crypt_sdk/g, 'droppedCookie=');
    }
    if (
      !cookie.includes('security-sdk/s_sdk_crypt_sdk') ||
      !cookie.includes('security-sdk/s_sdk_sign_data_key/web_protect') ||
      !cookie.includes('bd_ticket_guard_client_data') ||
      !cookie.includes('sid_tt')
    ) {
      if (
        !taskData.localStorage ||
        !taskData?.localStorage['security-sdk/s_sdk_crypt_sdk'] ||
        !taskData?.localStorage['security-sdk/s_sdk_sign_data_key/web_protect']
      ) {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '账号信息缺失，请重新授权此账号再试';
        logger.error(`环境信息缺失 ${taskData.taskId} ${JSON.stringify(taskData.localStorage)}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else if (!cookie.includes('bd_ticket_guard_client_data') || !cookie.includes('sid_tt')) {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '账号信息缺失，请重新授权此账号再试';
        logger.error(`环境信息缺失 ${taskData.taskId} ${cookie}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      cookie = `${cookie};security-sdk/s_sdk_crypt_sdk=${encodeURIComponent(
        taskData?.localStorage['security-sdk/s_sdk_crypt_sdk'],
      )};security-sdk/s_sdk_sign_data_key/web_protect=${encodeURIComponent(
        taskData.localStorage['security-sdk/s_sdk_sign_data_key/web_protect'],
      )}`;
    }
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!(taskData.images?.length > 0)) {
      pubResult.code = 2;
      pubResult.msg = '最少需要一张图片';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //最多只支持35张图片
    taskData.images = taskData.images.slice(0, 35);

    // region 准备发布上传前置数据

    // 获取sdkToken
    let sdkToken = await getSdkToken(cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      sdkToken = await getSdkToken(cookie);
      if (sdkToken) {
        break;
      }
    }

    //判断是否有地址带货权限
    if (taskData.location?.isCommerceIntention === true) {
      const locPri = await getUserPositionPrivilegeNew(cookie);
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (locPri?.status_code === 0) {
        if (locPri?.has_promote_auth !== true) {
          taskData.location.isCommerceIntention = false;
          taskData.location.cpsInfo = undefined;
        }
      } else {
        pubResult.code = locPri?.status_code ?? -1;
        pubResult.msg = `鉴别店铺推广权限失败:${pubResult.msg ?? ''}`;
      }
    }

    // 获取用户信息
    if (!userId) {
      let userInfo = await getMediaUserInfo(cookie);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        userId = userInfo?.user?.uid;
        if (!userId) {
          if (i < retryTimes - 1 && userInfo?.status_code != 8) {
            userInfo = await getMediaUserInfo(cookie);
            continue;
          }
          pubResult.code = userInfo.status_code;
          pubResult.msg = userInfo.status_msg;
          logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult?.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        } else {
          break;
        }
      }
    }

    let shopDraftId = '';
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 商品挂车
    if (taskData.goodsInfoList && taskData.goodsInfoList?.length > 0) {
      let pushGoodsResult = await checkGoodsIsInvalid(cookie, sdkToken, taskData.goodsInfoList);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!pushGoodsResult?.shop_draft_id) {
          // console.debug('抖音挂载商品失败', taskData.taskId, taskData.goodsInfoList, pushGoodsResult);
          if (i < retryTimes - 1 && pushGoodsResult?.status_code != 8) {
            pushGoodsResult = await checkGoodsIsInvalid(cookie, sdkToken, taskData.goodsInfoList);
            continue;
          }
          pubResult.code = pushGoodsResult.status_code;
          pubResult.msg = '挂载商品失败:' + (pushGoodsResult.status_msg ?? '');
          logger.error(`挂在商品失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pushGoodsResult)}`);
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult?.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        } else {
          break;
        }
      }

      shopDraftId = pushGoodsResult.shop_draft_id;
    }

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    // 获取上传认证参数
    const authData: AuthDataOutput = await getAuthKey(cookie);
    // endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 上传图片
    const imgInfoList: Array<ImagePartInfo> = [];
    let processCount = 0;
    for (const img of taskData.images) {
      SetProgressEvent(eventCallback, (80 / taskData.images.length) * processCount + 5, '图片上传中', taskData.taskId);
      processCount++;
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const imgInfo = await uploadCover(userId, img.pathOrUrl, authData, taskData.taskId, pubResult);
        //成功
        if (imgInfo != null && imgInfo?.Result?.PluginResult?.length > 0) {
          imgInfoList.push(imgInfo?.Result?.PluginResult[0]);
          break;
        }
        //失败
        else {
          if (i < retryTimes - 1) {
            await Task.Delay(3000);
            continue;
          }
          pubResult.code = pubResult.code > 0 ? pubResult.code : -1;
          pubResult.msg = pubResult.msg ? pubResult.msg : `图片上传失败${img.pathOrUrl}`;
          logger.error(
            `图片上传失败 ${taskData.taskId} ${cookie} ${img.pathOrUrl} ${JSON.stringify(imgInfo)} ${JSON.stringify(
              pubResult,
            )}`,
          );
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult?.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
      }
    }
    // endregion

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    let uploadedCoverInfo: uploadedImageInfo | null = await uploadCover(
      userId,
      taskData.cover.pathOrUrl,
      authData,
      taskData.taskId,
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (uploadedCoverInfo == null || !(uploadedCoverInfo?.Result?.Results?.length > 0)) {
        if (i < retryTimes - 1) {
          uploadedCoverInfo = await uploadCover(userId, taskData.cover.pathOrUrl, authData, taskData.taskId, pubResult);
          continue;
        }

        pubResult.code = -1;
        pubResult.msg = pubResult.msg
          ? pubResult.msg
          : `封面上传失败:${uploadedCoverInfo?.ResponseMetadata?.Error?.Message ?? ''}`;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${uploadedCoverInfo} ${JSON.stringify(
            pubResult,
          )}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      break;
    }
    if (uploadedCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${uploadedCoverInfo} ${JSON.stringify(
          pubResult,
        )}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    // endregion

    // region 组装并推送数据
    // 组装发布数据
    const postData = await buildDynamicPostData_v2(taskData, uploadedCoverInfo, imgInfoList, shopDraftId, cookie);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不允许取消了
    taskData.cancelToken?.disable(privateKey);

    const publishResult = await publishDynamicResponse(
      cookie,
      sdkToken,
      postData,
      taskData.taskId,
      webProxy,
      taskData.password,
    );

    pubResult.code = publishResult.status_code;
    pubResult.msg = publishResult.status_msg ?? '';
    pubResult.publishId = publishResult?.item_id ?? publishResult?.aweme?.aweme_id?.toString();
    pubResult.checkStr = publishResult.checkStr;
    pubResult.postData = publishResult.postData;
    pubResult.verifyMethods = publishResult.checkStr
      ? getPublishVerifyMethods(publishResult.checkStr)
      : publishResult.verifyMethods;

    if (pubResult.msg == '服务异常') {
      pubResult.msg = '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。';
      pubResult.code = -110;
    }

    // console.debug('抖音图文发布完成', taskData.taskId, taskData, uploadedCoverInfo, pubResult);

    if (pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult?.msg : '推送失败',
        taskData.taskId,
      );
      if (pubResult.code === errorCode.risk_verify) {
        logger.info(
          `抖音图文发布等待验证 ${taskData.taskId}，postData长度:${postData.length}，checkStr长度:${pubResult.checkStr?.length ?? 0}`,
        );
      } else {
        logger.error(`抖音图文发布失败 ${taskData.taskId} ${cookie} ${postData}  ${JSON.stringify(publishResult)}`);
      }
      pubResult.code = pubResult.code == 0 ? -1 : pubResult.code ?? -1;
      // console.debug('抖音发布失败:', publishResult, taskData, cookie);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);

    // 统一异常失败处理
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
      pubResult?.msg ? pubResult?.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`抖音图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

/**
 * 抖音图文发布入参
 */
export interface DouyinDynamicTaskInput {
  /**
   * 取消任务发布
   */
  cancelToken?: CancelToken;
  /**
   * 任务唯一标志id
   */
  taskId: string;
  /**
   * 封面信息
   */
  cover: ImageInfo;
  /**
   * 图片信息列表
   */
  images: Array<ImageInfo>;
  /**
   * 话题列表
   */
  challenges?: Array<DouyinTopicInfo>;
  /**
   * at好友/用户列表
   */
  mentions?: Array<DouyinUserInfo>;

  /**
   * 标题
   */
  title?: string;

  /**
   * 描述信息
   */
  text?: string;
  /**
   * 可见类型
   *  - 0: 公开
   *  - 1:私密
   *  - 2: 好友可见
   */
  visibility_type: number;

  /**
   * 是否允许下载
   *  - 0: 否
   *  - 1: 是
   */
  download: number;

  /**
   * 合集Id
   */
  mix_id?: string;

  /**
   * 合集下集数编号,0表示第一集，1表示第二集，以此类推
   */
  mix_order?: number;

  /**
   * 定时发布时间戳，10位
   */
  timing?: number;

  /**
   * 地理位置id
   */
  poi_id?: string;

  /**
   *地理位置名称
   */
  poi_name?: string;
  /**
   * 新版位置参数
   */
  location?: {
    /**
     * 地理位置id
     */
    poiId?: string;

    /**
     *地理位置名称
     */
    poiName?: string;

    /**
     * 是否智能推广
     */
    recommendPoiGroup: boolean;

    /**
     * 是否推广门店，关闭后相当于打卡模式
     */
    isCommerceIntention: boolean;

    /**
     * 带货商品范围
     */
    cpsInfo?: {
      /**
       * 0:勾选"选择带货商品范围-全部"，勾选时cps_choose_source_list和cps_choose_mini_app_list为空数组
       * 1::取消勾选
       */
      cps_choose_scence: 0 | 1;
      /**
       * 取消勾选后勾选的商家platform-source列表
       */
      cps_choose_source_list: Array<number>;
      /**
       * 取消勾选后，选择的商家的小程序id（mini-app-id）列表
       */
      cps_choose_mini_app_list: Array<string>;
    };
  };
  /**
   * 热点名称
   */
  hot_sentence?: string;

  /**
   * 挂载的小程序信息
   */
  miniAppInfo?: DouyinMiniAppInfo;

  /**
   *  挂载的商品信息列表
   */
  goodsInfoList?: Array<DouyinGoodsInfo>;

  /**
   * 挂载团购
   */
  location_shopping?: {
    /**
     * 1:推荐其他品牌商品
     * 2：只推荐相同品牌商品
     */
    brand_switch_value: 0 | 1 | 2;
    /**
     * 推广标题
     */
    sale_title?: string;
    /**
     * 团购信息
     */
    data: DouYinCpsSpuItem;
  };

  /**
   * 添加的音乐信息
   */
  musicInfo?: DouyinMusicInfo;

  /**
   *活动列表
   */
  activity?: Array<DouyinActivityInfo>;

  /**
   * 加入挑战
   */
  flashMobInfo?: ListItemInfo;

  /**
   * 账号web中的localStorage
   */
  localStorage?: object;

  /**
   * 代理
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 媒体号密码，用于发布时自动验证
   */
  password?: string;

  /**
   * 创作申明
   */
  declareInfo?: {
    /**
     * 什么类型
     * self_shoot 自行拍摄
     * from_net_v3 内容取材于网络
     * aigc 内容由AI生成
     * maybe_unsuitable可能引人不适
     * only_fun_new 虚构演绎，仅供娱乐
     * dangerous_behavior 危险行为，请勿模仿
     */
    choose_value:
      | 'self_shoot'
      | 'from_net_v3'
      | 'aigc'
      | 'maybe_unsuitable'
      | 'only_fun_new'
      | 'dangerous_behavior'
      | 'personal_opinion'
      | 'marketing';
    /**
     * 自行拍摄地点，如 '湖南 长沙','北京','上海','西班牙','德国'
     * 拼接方式为国内省级区域+空格+城市，国外为国家.具体以拍摄地点接口数据为准
     */
    user_declare_place?: string;

    /**
     * 申明拍摄地点的id
     */
    user_declare_place_geoname_id?: number;

    /**
     * 什么拍摄的日期 格式:'yyyy-MM-dd','2024-05-01'
     */
    user_declare_time?: string;

    /**
     * 申明取材于网络时的来源
     * 站外:取材站外
     * 抖音作品:取材站内
     */
    source?: '站外' | '抖音作品';
    /**
     * 取材站内时， 抖音作品id，来源于观看历史接口
     */
    from_item_id?: string;
  };
}

export const buildDynamicPostData_v2 = async (
  taskData: DouyinDynamicTaskInput,
  coverInfo: uploadedImageInfo,
  imageInfoList: Array<ImagePartInfo>,
  shopDraftId: string,
  cookie: string,
): Promise<string> => {
  //图片
  const imgs: Array<{ uri: string; width: number; height: number }> = [];
  for (const img of imageInfoList) {
    imgs.push({
      uri: img?.ImageUri ?? img?.SourceUri,
      width: img.ImageWidth ?? 1080,
      height: img.ImageHeight ?? 1920,
    });
  }

  const postData = {
    item: {
      common: {
        text: '',
        activity: '[]',
        text_extra: '',
        challenges: '',
        mentions: '[]',
        hashtag_source: '',
        hot_sentence: '',
        visibility_type: taskData.visibility_type ?? 0,
        download: taskData.download ?? 1,
        timing: taskData.timing ?? -1,
        creation_id: `jdhajhsh${Date.now()}`,
        media_type: 2,
        music_source: 0,
        music_id: taskData.musicInfo?.music_id ?? taskData.musicInfo?.id_str,
        music_end_time: (taskData.musicInfo?.duration ?? 1) * 1000,
        images: imgs,
      },
      cover: {
        poster: coverInfo.Result.Results[0].Uri,
      },
      anchor: {},
      assistant: {
        is_preview: 0,
        is_post_assistant: 1,
      },
      declare: {
        user_declare_info: '{}',
      },
    },
  };

  //合集
  if (taskData.mix_id) {
    postData.item['mix'] = {
      mix_id: taskData.mix_id,
      mix_order: taskData.mix_order ?? 0,
    };
  }

  let text = '';

  const topicNames: Array<object> = [];
  const topicIds: Array<number> = [];
  const mentions: Array<string> = [];

  text = taskData.text ?? '';

  let titleLength = 0;

  //标题
  if (taskData.title) {
    titleLength = taskData.title.length + 1;
    const titleStart = {};
    titleStart['start'] = 0;
    titleStart['type'] = 7;
    titleStart['hashtag_id'] = 0;
    titleStart['end'] = taskData.title.length;
    titleStart['hashtag_name'] = '';
    topicNames.push(titleStart);
    const splitStart = { ...titleStart };
    splitStart['start'] = taskData.title.length;
    splitStart['end'] = taskData.title.length + 1;
    splitStart['type'] = 8;
    topicNames.push(splitStart);
  }

  //兼容话题好友活动中间插入
  if (taskData.text?.includes('<p') && taskData.text?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.text);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      ////替换缓存
      const tmpDataMap = new Map<string, string>();

      let iCount = 0;
      let topicNum = 0;
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          if (topicNum >= 5) {
            item.parentNode?.removeChild(item);
            continue;
          }
          let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            const topicsTmp = await getDouyinTopics(cookie, htmlDecode(text ?? ''));
            if (topicsTmp?.dataList?.length) {
              topicStr = JSON.stringify(topicsTmp.dataList[0]);
            } else {
              item.innerHTML = '';
              continue;
            }
          }
          iCount++;
          topicNum++;
          const key = `{tmp_t${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, topicStr);
        }
      }

      //活动
      const activities = html.DocumentNode.SelectNodes('//activity');
      if (activities?.length > 0) {
        for (const item of activities) {
          if (topicNum >= 5) {
            item.parentNode?.removeChild(item);
            continue;
          }

          const activityStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!activityStr?.startsWith('{')) {
            continue;
          }
          iCount++;
          topicNum++;
          const key = `{tmp_a${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, activityStr);
        }
      }

      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          iCount++;
          const friendStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!friendStr?.startsWith('{')) {
            continue;
          }
          const key = `{tmp_f${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, friendStr);
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      //缓存替换
      const regex = /\{tmp_[^}]+\}/g;

      const matches: string[] = [];

      let match;
      while ((match = regex.exec(newText)) !== null) {
        matches.push(match[0]);
      }
      const activityIds: Array<number> = [];
      for (const tmpKey of matches) {
        const jo = JSON.parse(tmpDataMap.get(tmpKey) ?? '{}')?.raw;
        const indexNum = newText.indexOf(tmpKey);
        if (tmpKey.includes('tmp_t')) {
          const topicOriName = jo.cha_name.trimStart();
          if (!topicOriName) {
            throw new Error('存在不支持的话题');
          }
          const replaceName = `#${topicOriName} `;
          newText = newText.replace(tmpKey, replaceName);
          const topic = {};
          topic['start'] = titleLength + indexNum;
          topic['type'] = 1;
          topic['user_id'] = '';
          topic['hashtag_id'] = jo.cid ? parseInt(jo.cid) : 0;
          topic['end'] = titleLength + indexNum + replaceName.length - 1;
          topic['hashtag_name'] = topicOriName;
          topic['caption_start'] = indexNum;
          topic['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(topic);
          if (jo?.cid) {
            topicIds.push(parseInt(jo?.cid));
          }
        } else if (tmpKey.includes('tmp_a')) {
          const activityOriName = (jo.challenge[0] ?? jo.activity_name).trimStart();

          const replaceName = `#${activityOriName} `;
          newText = newText.replace(tmpKey, replaceName);

          const activity = {};
          activity['start'] = titleLength + indexNum;
          activity['type'] = 1;
          activity['user_id'] = '';
          activity['hashtag_id'] = jo.challenge_ids[0];
          activity['end'] = titleLength + indexNum + replaceName.length - 1;
          activity['hashtag_name'] = activityOriName;
          activity['caption_start'] = indexNum;
          activity['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(activity);
          if (jo.challenge_ids[0]) {
            topicIds.push(jo.challenge_ids[0]);
            activityIds.push(jo.challenge_ids[0]);
          }
        } else if (tmpKey.includes('tmp_f')) {
          const friendOriName = jo?.nickname.trimStart();

          const replaceName = `@${friendOriName} `;
          newText = newText.replace(tmpKey, replaceName);

          const friend = {};
          friend['start'] = titleLength + indexNum;
          friend['type'] = 0;
          friend['user_id'] = jo?.uid?.toString();
          friend['end'] = titleLength + indexNum + replaceName.length - 1;
          friend['hashtag_name'] = '';
          friend['caption_start'] = indexNum;
          friend['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(friend);
          mentions.push(jo?.uid?.toString());
        }
      }

      //argsList.push(`activity=${encodeURIComponent(JSON.stringify(activityIds))}`);
      postData.item.common.activity = JSON.stringify(activityIds ?? []);
      text = htmlDecode(newText);
    } else {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          const itemHtmlStr = item.toString();
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            const topicsTmp = await getDouyinTopics(cookie, text ?? '');
            if (topicsTmp?.dataList?.length) {
              topicStr = JSON.stringify(topicsTmp.dataList[0]);
            }
          }
          const topicItem = topicStr?.startsWith('{') ? JSON.parse(topicStr)?.raw : null;
          if (!topicItem) {
            continue;
          }
          const topicIndex = text.indexOf(itemHtmlStr);
          if (topicIndex < 0) {
            continue;
          }

          const topicShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, topicShowName);

          const topicOriName = topicItem.cha_name.trimStart();
          const topic = {};
          topic['start'] = titleLength + topicIndex;
          topic['type'] = 1;
          topic['user_id'] = '';
          topic['hashtag_id'] = topicItem.cid ? parseInt(topicItem.cid) : 0;
          topic['end'] = titleLength + topicIndex + topicShowName.length;
          topic['hashtag_name'] = topicOriName;
          topic['caption_start'] = topicIndex;
          topic['caption_end'] = topicIndex + topicShowName.length;
          topicNames.push(topic);
          if (topicItem?.cid) {
            topicIds.push(parseInt(topicItem?.cid));
          }
        }
      }

      //活动
      const activitys = html.DocumentNode.SelectNodes('//activity');
      if (activitys?.length > 0) {
        const activityIds: Array<number> = [];
        for (const item of activitys) {
          const itemHtmlStr = item.toString();
          const activityStr = htmlDecode(item.getAttribute('raw') ?? '');
          const activityItem = activityStr?.startsWith('{') ? JSON.parse(activityStr)?.raw : null;
          if (!activityItem) {
            continue;
          }
          const activityIndex = text.indexOf(itemHtmlStr);
          if (activityIndex < 0) {
            continue;
          }

          const activityShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, activityShowName);

          const activityOriName = activityItem.cha_name.trimStart();
          const activity = {};
          activity['start'] = titleLength + activityIndex;
          activity['type'] = 1;
          activity['user_id'] = '';
          activity['hashtag_id'] = activityItem.challenge_ids[0];
          activity['end'] = titleLength + activityIndex + activityShowName.length;
          activity['hashtag_name'] = activityOriName;
          activity['caption_start'] = activityIndex;
          activity['caption_end'] = activityIndex + activityShowName.length;
          topicNames.push(activity);
          if (activityItem.challenge_ids[0]) {
            topicIds.push(activityItem.challenge_ids[0]);
            activityIds.push(activityItem.challenge_ids[0]);
          }
        }
        postData.item.common.activity = JSON.stringify(activityIds ?? []);
      }

      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          const itemHtmlStr = item.toString();
          const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
          const friendItem = friendStr?.startsWith('{') ? JSON.parse(friendStr)?.raw : null;
          if (!friendItem) {
            continue;
          }
          const friendIndex = text.indexOf(itemHtmlStr);
          if (friendIndex < 0) {
            continue;
          }

          const friendShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, friendShowName);
          const friend = {};
          friend['start'] = titleLength + friendIndex;
          friend['type'] = 0;
          friend['user_id'] = friendItem?.uid?.toString();
          friend['end'] = titleLength + friendIndex + friendShowName.length;
          friend['hashtag_name'] = '';
          friend['caption_start'] = friendIndex;
          friend['caption_end'] = friendIndex + friendShowName.length;
          topicNames.push(friend);
          mentions.push(friendItem?.uid?.toString());
        }
      }
    }
  } else {
    let titleIndex = text.length;

    //话题
    if (taskData.challenges && taskData.challenges?.length > 0) {
      for (const item of taskData.challenges) {
        const name = item.cha_name?.replace(/#/g, '');
        text = text + '#' + name + ' ';

        const topic = {};
        topic['start'] = titleLength + titleIndex;
        topic['type'] = 1;
        topic['user_id'] = '';
        topic['hashtag_id'] = item.cid ? parseInt(item.cid) : 0;
        topic['end'] = titleLength + titleIndex + name.length + 1;
        topic['hashtag_name'] = name;
        topic['caption_start'] = titleIndex;
        topic['caption_end'] = titleIndex + name.length + 1;
        topicNames.push(topic);
        if (item?.cid) {
          topicIds.push(parseInt(item?.cid));
        }
        titleIndex = text.length;
      }
    }

    //活动
    if (taskData.activity && taskData.activity?.length > 0) {
      postData.item.common.activity = JSON.stringify(taskData.activity.map((x) => x.challenge_ids[0]));
      for (const item of taskData.activity) {
        const name = item.challenge[0] ?? item.activity_name?.replace(/#/g, '').split(' ')[0];
        text = text + '#' + name + ' ';

        const topic = {};
        topic['start'] = titleLength + titleIndex;
        topic['type'] = 1;
        topic['user_id'] = '';
        topic['hashtag_id'] = item.challenge_ids[0];
        topic['end'] = titleLength + titleIndex + name.length + 1;
        topic['hashtag_name'] = name;
        topic['caption_start'] = titleIndex;
        topic['caption_end'] = titleIndex + name.length + 1;
        topicNames.push(topic);
        if (item?.challenge_ids[0]) {
          topicIds.push(item?.challenge_ids[0]);
        }
        titleIndex = text.length;
      }
    }

    //好友;
    if (taskData.mentions && taskData.mentions?.length > 0) {
      for (const item of taskData.mentions) {
        const name = item?.nickname?.toString();
        text = text + '@' + name + ' ';

        const user = {};
        user['start'] = titleLength + titleIndex;
        user['type'] = 0;
        user['user_id'] = item?.uid?.toString();
        user['end'] = titleLength + titleIndex + name?.length + 2;
        user['hashtag_name'] = '';
        user['caption_start'] = titleIndex;
        user['caption_end'] = titleIndex + name?.length + 2;
        topicNames.push(user);
        mentions.push(item?.uid?.toString());
        titleIndex = text.length;
      }
    }
  }

  //好友
  postData.item.common.mentions = JSON.stringify(mentions ?? []);

  if (topicIds?.length > 0) {
    postData.item.common.challenges = JSON.stringify(topicIds);
    const hashtag_source: Array<string> = [];
    for (let i = 0; i < topicIds.length; i++) {
      hashtag_source.push('search'); //话题来源，默认都是搜索而来
    }
    postData.item.common.hashtag_source = hashtag_source.join('/');
  } else {
    postData.item.common.challenges = '[]';
    postData.item.common.hashtag_source = '';
  }

  //话题
  if (topicNames?.length > 0) {
    postData.item.common.text_extra = JSON.stringify(topicNames);
  } else {
    postData.item.common.text_extra = '[]';
  }

  //地点-推广
  if (taskData.location?.poiId || taskData.poi_id) {
    postData.item.anchor = {
      poi_id: taskData?.location?.poiId ?? taskData?.poi_id ?? undefined,
      poi_name: taskData?.location?.poiName ?? taskData.poi_name ?? undefined,
      anchor_content: '{"is_commerce_intention":false}',
    };
    if (taskData.location?.isCommerceIntention) {
      //    primary_recommend_product_type: 1;
      const anchor_content = {};
      if (!taskData.location?.cpsInfo) {
        anchor_content['primary_recommend_product_type'] = 1;
      } else {
        if (taskData.location?.cpsInfo.cps_choose_scence === 0) {
          taskData.location.cpsInfo.cps_choose_source_list = [];
          taskData.location.cpsInfo.cps_choose_mini_app_list = [];
        }
        const cpsInfo = {
          cps_choose_scence: taskData.location.cpsInfo.cps_choose_scence,
          cps_choose_source_list: taskData.location.cpsInfo.cps_choose_source_list,
          cps_choose_mini_app_list: taskData.location.cpsInfo.cps_choose_mini_app_list,
        };
        anchor_content['cps_info'] = JSON.stringify(cpsInfo);
      }
      anchor_content['recommend_poi_group'] = taskData.location?.recommendPoiGroup ?? false;
      anchor_content['is_commerce_intention'] = true;
      postData.item.anchor['anchor_content'] = JSON.stringify(anchor_content);
    }
  } else if (taskData.location_shopping?.data) {
    //挂载团购
    const anchor = {
      id: taskData.location_shopping.data.spu_id,
      type: 13010,
      content: {
        content: {
          spu_id: taskData.location_shopping.data.spu_id,
          anchor_title: taskData.location_shopping.sale_title,
          forbid_edit_anchor: 0,
          is_movie: 0,
          user_type: 'life_daren',
          show_type: taskData.location_shopping.data.show_type,
          post_source: 0,
          poi_indirect: {
            biz_type: 1,
            biz_id: taskData.location_shopping.data.spu_id,
            biz_ext: '{}',
            ss_poi_id: taskData.location_shopping.data.poi.poi_id,
          },
          life_task_order_title: '',
          life_task_name: '',
          life_product_id: taskData.location_shopping.data.spu_id,
          life_anchor_secret_audit: '',
          security_audit: 0,
          spu_intranetpage: !!taskData.location_shopping.brand_switch_value,
          brand_switch: { value: taskData.location_shopping.brand_switch_value },
          intranet_page_type: 0,
        },
      },
      source: 1,
    };
    const anchor_content = {
      content: {
        spu_id: taskData.location_shopping.data.spu_id,
        anchor_title: taskData.location_shopping.sale_title,
        forbid_edit_anchor: 0,
        is_movie: 0,
        user_type: 'life_daren',
        show_type: taskData.location_shopping.data.show_type,
        post_source: 0,
        poi_indirect: {
          biz_type: 1,
          biz_id: taskData.location_shopping.data.spu_id,
          biz_ext: '{}',
          ss_poi_id: taskData.location_shopping.data.poi.poi_id,
        },
        life_task_order_title: '',
        life_task_name: '',
        life_product_id: taskData.location_shopping.data.spu_id,
        life_anchor_secret_audit: '',
        security_audit: 0,
        spu_intranetpage: !!taskData.location_shopping.brand_switch_value,
        brand_switch: { value: taskData.location_shopping.brand_switch_value },
        intranet_page_type: 0,
      },
    };
    postData.item.anchor = {
      anchor: JSON.stringify(anchor),
      anchor_business_type: 13010,
      anchor_content: JSON.stringify(anchor_content),
    };
  } else if (taskData.miniAppInfo && taskData.miniAppInfo.id) {
    //小程序
    const anchor = {
      content: taskData.miniAppInfo.extra,
      type: taskData.miniAppInfo.type,
      id: taskData.miniAppInfo.id,
    };
    postData.item.anchor['anchor'] = JSON.stringify(anchor);
  } else if (shopDraftId) {
    //挂车
    postData.item.anchor['shop_draft_id'] = shopDraftId;
  }

  //描述
  let finalText = text;
  if (taskData.title) {
    finalText = `${taskData.title}。${text}`;
  }
  postData.item.common.text = finalText;

  //创作申明

  if (taskData.declareInfo?.choose_value) {
    if (taskData.declareInfo?.user_declare_place) {
      taskData.declareInfo.user_declare_place = taskData.declareInfo.user_declare_place.replace('中国', '')?.trim();
      const seps = taskData.declareInfo.user_declare_place?.split(' ');
      if (seps.length == 2 && seps[0] == seps[1]) {
        taskData.declareInfo.user_declare_place = seps[0];
      }
    }
    postData.item.declare.user_declare_info = JSON.stringify(taskData.declareInfo);
  }

  //关联热点
  if (taskData.hot_sentence && taskData.hot_sentence?.length > 0) {
    postData.item.common.hot_sentence = taskData.hot_sentence ?? '';
  }

  //挑战
  if (taskData.flashMobInfo?.yixiaoerId) {
    const flashInfo = [
      {
        type: 24,
        index: 0,
        track_info: '[{"scale":0.8,"x":0.31,"y":0.22,"r":0,"s":0.8}]',
        text_info: taskData.flashMobInfo.yixiaoerName,
        image_index: 0,
        flash_mob_info: { id: taskData.flashMobInfo.yixiaoerId, text: taskData.flashMobInfo.yixiaoerName },
      },
    ];
    postData.item.common['interaction_stickers'] = JSON.stringify(flashInfo);
  }

  return JSON.stringify(postData);
};

export const publishDynamicResponse = async (
  cookie: string,
  sdkToken: string,
  postData: string,
  taskId: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
  password?: string,
  apiParams?: boolean,
): Promise<{
  status_code: number;
  status_msg?: string;
  aweme?: {
    aweme_id: string;
  };
  item_id?: string;
  checkStr?: string;
  postData?: string;
  verifyMethods?: Array<'password' | 'smscode'>;
}> => {
  let pubKey = '';
  if (cookie?.includes('bd_ticket_guard_client_data=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['bd-ticket-guard-ree-public-key'];
  } else if (cookie?.includes('bd_ticket_guard_client_data_v2=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data_v2=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['ree_public_key'];
  }

  const signValue = clientSign(cookie);
  const signObj = JSON.parse(
    JSON.parse(
      decodeURIComponent(cookie.split('security-sdk/s_sdk_sign_data_key/web_protect=')[1]?.split(';')[0]?.trim()),
    ).data,
  );
  const webVer = signObj.ticket?.startsWith('hash') ? '2' : '1';
  const headers = {
    cookie: cookie,
    'User-Agent': HttpConfig.userAgent,
    'Content-Type': 'application/json;charset=UTF-8',
    'x-secsdk-csrf-request': '1',
    'x-secsdk-csrf-token': sdkToken,
    'bd-ticket-guard-web-version': webVer,
    'bd-ticket-guard-version': '2',
    'bd-ticket-guard-iteration-version': '1',
    'bd-ticket-guard-web-sign-type': '0',
    'bd-ticket-guard-ree-public-key': pubKey,
    'bd-ticket-guard-client-data': signValue,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
  };

  const msToken = cookie.split('msToken=')[1]?.split(';')[0] ?? `a12man123masb${Date.now()}`;

  const url = `https://creator.douyin.com/web/api/media/aweme/create_v2/?read_aid=2906&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F140.0.0.0+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=${msToken}&a_bogus=`;
  // console.debug('抖音推送数据', taskId, cookie, postData);
  let publishResult = await $http.post(url, postData, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  // console.debug('抖音推送返回数据', taskId, publishResult.data);
  if (publishResult.headers['x-tt-verify-passport-decision']) {
    if (password) {
      const checkRe = await checkByPassword(
        cookie,
        sdkToken,
        password,
        publishResult.headers['x-tt-verify-passport-decision'],
        proxyAgent,
      );
      if (checkRe) {
        logger.info(`自动验证失败:${checkRe}`);
        return {
          status_code: errorCode.risk_verify,
          status_msg: `发布验证失败:${checkRe}`,
          checkStr: publishResult.headers['x-tt-verify-passport-decision'],
          postData,
          verifyMethods: getPublishVerifyMethods(publishResult.headers['x-tt-verify-passport-decision']),
        };
      } else {
        publishResult = await $http.post(url, postData?.trim(), {
          headers: headers,
          httpAgent: proxyAgent,
          httpsAgent: proxyAgent,
        });
      }
    } else {
      return {
        status_code: errorCode.risk_verify,
        status_msg: '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。',
        checkStr: publishResult.headers['x-tt-verify-passport-decision'],
        postData,
        verifyMethods: getPublishVerifyMethods(publishResult.headers['x-tt-verify-passport-decision']),
      };
    }
  }
  if (isJson(publishResult.data)) {
    return publishResult.data;
  } else {
    return {
      status_code: publishResult.status ?? errorCode.data_error,
      status_msg: '服务异常',
    };
  }
};
