import { EventEmitter } from 'events';
import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import {
  CommentContentListInfoResponse,
  CommentListInfoResponse,
  Douyin,
  DouyinCollectionInfo,
  DouyinGoodsInfo,
  DouyinHotEventInfo,
  DouyinLocationInfo,
  DouyinMiniAppInfo,
  DouyinPublishResult,
  DouyinVideoTaskInput,
  GeoLocation,
  ImageInfo,
  ListInfoResponse,
  ListItemInfo,
  ListMusicInfoResponse,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
  PlatformAuthorInfo,
} from '../../../media-platform';
import { BaseWorker } from '@/cloud/task/platform/baseworker';
import { AuditResult, PublishResult } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { DouyinDynamicTaskInput } from '@/media-platform/douyin/douyin-dynamic';
import { DouyinMusicInfo } from '@/media-platform/douyin/douyin-music.service';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { LocationType } from '@/platform-body/common';
import { MessageType, SessionType } from '@/service/datasync-service-manager';
import {
  CheckGoodsParams,
  LocationTypePrivilege,
  MiniAppPrivilege,
  ShoppingPrivilege,
} from '@/cloud/model/SearchDataModel';
import {
  DouYinCoCreationInfo,
  DouYinGroupShopping,
  DouYinPrivilege,
  DouYinShoppingCart,
  DouYinStatementType,
} from '@/platform-body/video';
import { DouYinCpsSpuItem } from '@/media-platform/douyin/douyin-location.service';
import { DataSyncTaskItem, MessageBackItem } from '@/service/datasync-service-manager';
import { auditStatusEnum, convertCookieStr, Task } from '@/utils';
import { DouyinArticleTaskInput } from '@/media-platform/douyin/douyin-article';
import { publishVerifiedPostData } from '@/media-platform/douyin/douyin-verrify';
import { prepareDouyinPublishCookie } from '@/media-platform/douyin/douyin-publish-risk';

export class DouYinWorker extends BaseWorker {
  public sdkToken: string;

  constructor(cookie?: string, localStorage?: object, eventCallBack?: EventEmitter, domain?: string) {
    super(cookie, localStorage, eventCallBack, domain);
    this.sdkToken = '';
  }
  public refreshCookie(cookie: string, localStorage?: object) {
    this.cookies = convertCookieStr(cookie, this.domain);
    this.localStorage = localStorage ? localStorage : localStorage;
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re.code === 8 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Douyin.getDouyinUserInfo(this.cookies, proxy);
    if (this.userInfo?.code === 8) {
      this.userInfo.code = errorCode.loginExpire;
    }
    return this.userInfo;
  }

  public async publish(taskDataIn: BaseSinglePublishTask): Promise<DouyinPublishResult | undefined> {
    if (taskDataIn.localStorage) {
      this.refreshCookie(this.cookies, taskDataIn.localStorage);
    }
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: DouyinVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        cover: task.covers[0],
        title: task.title,
        text: task.desc,
        visibility_type: 0,
        download: task['allow_save'] ?? 0,
        should_sync: task['sync_xigua'] ?? 0,
        localStorage: this.localStorage,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        password: task['password'],
        horizontalCover: task.horizontalCover,
        needParts: task.needParts,
      } as never;
      if (task.pubType == 0) {
        taskData.visibility_type = 1;
      }
      //共创
      if (task['cooperation_info']) {
        const coInfo = task['cooperation_info'] as Array<DouYinCoCreationInfo>;
        if (coInfo?.length > 0 && coInfo[0]?.user_list?.length) {
          taskData.cooperation_info = [];
          for (const co of coInfo) {
            taskData.cooperation_info.push({
              typeId: co.co_type.yixiaoerId,
              userIds: co?.user_list?.map((x) => x.yixiaoerId),
            });
          }
        }
      }
      //音乐
      if (task['music']) {
        //音乐
        taskData.musicInfo = task['music'].raw as DouyinMusicInfo;
      }
      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibility_type = 1;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibility_type = 2;
            break;
          default:
            taskData.visibility_type = 0;
            break;
        }
      }
      //同时发布到
      if (task['sync_apps']) {
        const apps = task['sync_apps'] as Array<ListItemInfo>;
        taskData.sync_apps = apps;
      }
      if (task.location) {
        const location = task.location as object as { data: ListItemInfo; isScp: boolean };
        //地点
        taskData.poi_id = task.location.yixiaoerId ?? location?.data?.yixiaoerId;
        taskData.poi_name = task.location.yixiaoerName ?? location?.data?.yixiaoerName;

        //新版地点
        if (task.location?.raw || location?.data?.raw) {
          const raw = (task.location?.raw ?? location?.data?.raw) as object;
          let commLoc = raw['raw'] as DouyinLocationInfo;
          if (!commLoc?.poi_id) {
            commLoc = raw as DouyinLocationInfo;
          }
          //带货地址
          if (raw['isScp'] === true || task.location['isScp'] === true) {
            taskData.location = {
              poiName: commLoc?.poi_name,
              poiId: commLoc?.poi_id,
              recommendPoiGroup: true,
              isCommerceIntention: true,
            };
          } else {
            taskData.location = {
              poiName: commLoc?.poi_name,
              poiId: commLoc?.poi_id,
              recommendPoiGroup: false,
              isCommerceIntention: false,
            };
          }
        }
      } else if (task.group_shopping) {
        //挂在团购
        const group = task.group_shopping as DouYinGroupShopping;
        taskData.location_shopping = {
          sale_title: group.sale_title,
          brand_switch_value: parseInt(group.brand_switch_value?.toString()) as never,
          data: group.data.raw as DouYinCpsSpuItem,
        };
      } else if ((task.shopping_cart as Array<DouYinShoppingCart>)?.length) {
        //购物车
        const shopping_cart = task.shopping_cart as Array<DouYinShoppingCart>;
        if (shopping_cart?.length && shopping_cart[0].data) {
          taskData.goodsInfoList = [];
          for (const obj of shopping_cart) {
            if (obj?.images?.length) {
              //图片排序
              const goodInfo = obj.data.raw as DouyinGoodsInfo;
              const goods_img = [];
              for (const img of obj.images) {
                const newImg = goodInfo.goods_imgs.find((x) => x.elastic_img.url_list[0] === img);
                if (newImg) {
                  goods_img.push(newImg as never);
                } else {
                  //考虑中断使用默认图片顺序
                }
              }
              if (goods_img?.length) {
                goodInfo.goods_imgs = goods_img;
              }
              taskData.goodsInfoList.push({
                ...goodInfo,
                elastic_title: obj.sale_title,
              });
            } else {
              taskData.goodsInfoList.push({
                ...(obj.data.raw as DouyinGoodsInfo),
                elastic_title: obj.sale_title,
              });
            }
          }
          // taskData.goodsInfoList = shopping_cart.map((obj) => ({
          //   ...(obj.data.raw as DouyinGoodsInfo),
          //   elastic_title: obj.sale_title,
          // }));
        }
      } else if (task.mini_app?.yixiaoerId) {
        taskData.miniAppInfo = (task.mini_app?.raw as DouyinMiniAppInfo) ?? {
          id: task.mini_app.yixiaoerId,
          name: task.mini_app?.yixiaoerName,
        };
      } else if ((task['game'] as ListItemInfo)?.yixiaoerId) {
        taskData.game = task['game'] as ListItemInfo;
      } else if ((task['film'] as ListItemInfo)?.yixiaoerId) {
        taskData.film = task['film'] as ListItemInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.timing = parseInt((task.prePubTime / 1000).toFixed(0));
      }
      if (task.category) {
        //分类
      }

      //申明
      if (task.statement?.type) {
        const clare = task.statement.type as DouYinStatementType;
        if (clare > 2) {
          taskData.declareInfo = {
            choose_value: clare == DouYinStatementType.内容由AI生成 ? 'aigc' : 'only_fun_new',
          };
          switch (clare) {
            case DouYinStatementType.可能引人不适:
              taskData.declareInfo.choose_value = 'maybe_unsuitable';
              break;
            case DouYinStatementType.危险行为请勿模仿:
              taskData.declareInfo.choose_value = 'dangerous_behavior';
              break;
            case DouYinStatementType.虚构演绎仅供娱乐:
              taskData.declareInfo.choose_value = 'only_fun_new';
              break;
            case DouYinStatementType.内容为个人观点或见解:
              taskData.declareInfo.choose_value = 'personal_opinion';
              break;
            case DouYinStatementType.内容含营销推广信息:
              taskData.declareInfo.choose_value = 'marketing';
              break;
          }
        }
      }

      //合集
      const collection = task.collection as ListItemInfo;
      if (collection?.yixiaoerId) {
        const douYinColl = (task.collection as ListItemInfo).raw as DouyinCollectionInfo;
        taskData.mix_id = douYinColl?.mix_id ?? collection.yixiaoerId;
        const order = task.sub_collection?.yixiaoerId ? parseInt(task.sub_collection?.yixiaoerId) : 0;
        if (order > 0) {
          taskData.mix_order = order;
        } else {
          const cl = await Douyin.getDouyinCollection(this.cookies);
          const douYinColNew = cl.dataList?.find((x) => x.yixiaoerId === collection.yixiaoerId);
          taskData.mix_order =
            (douYinColNew?.raw as DouyinCollectionInfo)?.statis?.updated_to_episode ??
            douYinColl?.statis?.updated_to_episode ??
            0;
        }
      }

      //热点
      if (task.hot_event) {
        const douyinHot = (task.hot_event as ListItemInfo)?.raw as DouyinHotEventInfo;
        taskData.hot_sentence = douyinHot?.word ?? task.hot_event.yixiaoerName;
      }

      //挑战
      if (task.challenge) {
        taskData.flashMobInfo = task.challenge;
      }
      const re = await Douyin.publishVideo(
        this.cookies,
        taskData,
        this.event,
        taskDataIn.platformAccount.platformAuthorId ?? '',
      );
      if (re?.code === 8) {
        re.code = errorCode.loginExpire;
      }
      return re;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: DouyinDynamicTaskInput = {
        taskId: task.taskId,
        cover: task.covers[0],
        title: task.title,
        text: task.desc,
        visibility_type: 0,
        download: 0,
        localStorage: this.localStorage,
        proxy: task.proxy,
        images: task.images,
        cancelToken: task.cancelToken,
        password: task['password'],
      };
      if (task.pubType == 0) {
        taskData.visibility_type = 1;
      }
      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibility_type = 1;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibility_type = 2;
            break;
          default:
            taskData.visibility_type = 0;
            break;
        }
      }
      if (task.location) {
        const location = task.location as object as { data: ListItemInfo; isScp: boolean };
        //地点
        taskData.poi_id = task.location.yixiaoerId ?? location?.data?.yixiaoerId;
        taskData.poi_name = task.location.yixiaoerName ?? location?.data?.yixiaoerName;

        //新版地点
        if (task.location?.raw || location?.data?.raw) {
          const raw = (task.location?.raw ?? location?.data?.raw) as object;
          let commLoc = raw['raw'] as DouyinLocationInfo;
          if (!commLoc?.poi_id) {
            commLoc = raw as DouyinLocationInfo;
          }
          //带货地址
          if (raw['isScp'] === true || task.location['isScp'] === true) {
            taskData.location = {
              poiName: commLoc?.poi_name,
              poiId: commLoc?.poi_id,
              recommendPoiGroup: true,
              isCommerceIntention: true,
            };
          } else {
            taskData.location = {
              poiName: commLoc?.poi_name,
              poiId: commLoc?.poi_id,
              recommendPoiGroup: false,
              isCommerceIntention: false,
            };
          }
        }
      } else if (task.group_shopping) {
        //挂在团购
        const group = task.group_shopping as DouYinGroupShopping;
        taskData.location_shopping = {
          sale_title: group.sale_title,
          brand_switch_value: parseInt(group.brand_switch_value?.toString()) as never,
          data: group.data.raw as DouYinCpsSpuItem,
        };
      } else if ((task.shopping_cart as Array<DouYinShoppingCart>)?.length) {
        //购物车
        const shopping_cart = task.shopping_cart as Array<DouYinShoppingCart>;
        if (shopping_cart?.length && shopping_cart[0].data) {
          if (shopping_cart?.length && shopping_cart[0].data) {
            taskData.goodsInfoList = [];
            for (const obj of shopping_cart) {
              if (obj?.images?.length) {
                //图片排序
                const goodInfo = obj.data.raw as DouyinGoodsInfo;
                const goods_img = [];
                for (const img of obj.images) {
                  const newImg = goodInfo.goods_imgs.find((x) => x.elastic_img.url_list[0] === img);
                  if (newImg) {
                    goods_img.push(newImg as never);
                  } else {
                    //考虑中断使用默认图片顺序
                  }
                }
                if (goods_img?.length) {
                  goodInfo.goods_imgs = goods_img;
                }
                taskData.goodsInfoList.push({
                  ...goodInfo,
                  elastic_title: obj.sale_title,
                });
              } else {
                taskData.goodsInfoList.push({
                  ...(obj.data.raw as DouyinGoodsInfo),
                  elastic_title: obj.sale_title,
                });
              }
            }
            // taskData.goodsInfoList = shopping_cart.map((obj) => ({
            //   ...(obj.data.raw as DouyinGoodsInfo),
            //   elastic_title: obj.sale_title,
            // }));
          }
        }
      } else if (task.mini_app?.yixiaoerId) {
        taskData.miniAppInfo = (task.mini_app?.raw as DouyinMiniAppInfo) ?? {
          id: task.mini_app.yixiaoerId,
          name: task.mini_app?.yixiaoerName,
        };
      }
      if (task.prePubTime) {
        //定时发布
        taskData.timing = parseInt((task.prePubTime / 1000).toFixed(0));
      }
      if (task.music) {
        //音乐
        taskData.musicInfo = task.music.raw as DouyinMusicInfo;
      }
      //申明
      if (task.statement?.type) {
        const clare = task.statement.type as never as DouYinStatementType;
        if (clare > 2) {
          taskData.declareInfo = {
            choose_value: clare == DouYinStatementType.内容由AI生成 ? 'aigc' : 'only_fun_new',
          };
          switch (clare) {
            case DouYinStatementType.可能引人不适:
              taskData.declareInfo.choose_value = 'maybe_unsuitable';
              break;
            case DouYinStatementType.危险行为请勿模仿:
              taskData.declareInfo.choose_value = 'dangerous_behavior';
              break;
            case DouYinStatementType.虚构演绎仅供娱乐:
              taskData.declareInfo.choose_value = 'only_fun_new';
              break;
            case DouYinStatementType.内容为个人观点或见解:
              taskData.declareInfo.choose_value = 'personal_opinion';
              break;
            case DouYinStatementType.内容含营销推广信息:
              taskData.declareInfo.choose_value = 'marketing';
              break;
          }
        }
      }
      //合集
      const collection = task.collection as ListItemInfo;
      if (collection?.yixiaoerId) {
        const douYinColl = (task.collection as ListItemInfo).raw as DouyinCollectionInfo;
        taskData.mix_id = douYinColl?.mix_id ?? collection.yixiaoerId;
        const order = task.sub_collection?.yixiaoerId ? parseInt(task.sub_collection?.yixiaoerId) : 0;
        if (order > 0) {
          taskData.mix_order = order;
        } else {
          const cl = await Douyin.getDouyinCollection(this.cookies);
          const douYinColNew = cl.dataList?.find((x) => x.yixiaoerId === collection.yixiaoerId);
          taskData.mix_order =
            (douYinColNew?.raw as DouyinCollectionInfo)?.statis?.updated_to_episode ??
            douYinColl?.statis?.updated_to_episode ??
            0;
        }
      }

      //热点
      if (task.hot_event) {
        const douyinHot = (task.hot_event as ListItemInfo)?.raw as DouyinHotEventInfo;
        taskData.hot_sentence = douyinHot?.word ?? task.hot_event.yixiaoerName;
      }

      //挑战
      if (task.challenge) {
        taskData.flashMobInfo = task.challenge;
      }
      const re = await Douyin.publishDynamic(
        this.cookies,
        taskData,
        this.event,
        taskDataIn.platformAccount.platformAuthorId ?? '',
      );
      if (re?.code === 8) {
        re.code = errorCode.loginExpire;
      }
      return re;
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: DouyinArticleTaskInput = {
        taskId: task.taskId,
        cover: task.covers[0],
        title: task.title,
        text: task.desc,
        content: task.content,
        visibility_type: 0,
        headImage: task['headImage'],
        localStorage: this.localStorage,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        password: task['password'],
        challenges: task.topics,
      };
      if (task.pubType == 0) {
        taskData.visibility_type = 1;
      }
      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibility_type = 1;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibility_type = 2;
            break;
          default:
            taskData.visibility_type = 0;
            break;
        }
      }

      if (task.prePubTime) {
        //定时发布
        taskData.timing = parseInt((task.prePubTime / 1000).toFixed(0));
      }
      if (task['music']) {
        //音乐
        taskData.musicInfo = task['music'].raw as DouyinMusicInfo;
      }

      const re = await Douyin.publishArticle(
        this.cookies,
        taskData,
        this.event,
        taskDataIn.platformAccount.platformAuthorId ?? '',
      );
      if (re?.code === 8) {
        re.code = errorCode.loginExpire;
      }
      return re;
    } else {
      return {
        code: errorCode.data_error,
        msg: `不支持的内容类型:${taskDataIn.publishType}`,
        taskId: taskDataIn.taskId,
      };
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    let re = await Douyin.getDouyinVideoStatus(this.cookies, publishId);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }

    for (let i = 0; i < 3; i++) {
      if (re.code !== errorCode.loginExpire && re.auditStatus === auditStatusEnum.deny) {
        await Task.Delay(5000);
        re = await Douyin.getDouyinVideoStatus(this.cookies, publishId);
        continue;
      }
      break;
    }

    return re;
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
    city?: ListItemInfo,
    locationMode?: number,
  ): Promise<ListInfoResponse | undefined> {
    const re = await Douyin.getDouyinLocation(
      this.cookies,
      keyWord,
      locationType == LocationType.default || locationType == LocationType.local ? 0 : locationType,
      parseInt(nextPage) ? parseInt(nextPage) : 1,
      proxy,
      coords,
      city,
      locationMode,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async searchMusic(keyWord: string, nextPage: string): Promise<ListMusicInfoResponse | undefined> {
    const re = await Douyin.searchDouyinMusicList(this.cookies, keyWord, parseInt(nextPage) ? parseInt(nextPage) : 0);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async getMusicByCategory(
    categoryId: string,
    categoryName: string,
    nextPage: string,
  ): Promise<ListMusicInfoResponse | undefined> {
    const re = await Douyin.getDouyinCategoryMusicList(
      this.cookies,
      categoryId,
      parseInt(nextPage) ? parseInt(nextPage) : 0,
      this.sdkToken,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    const re = await Douyin.deleteDouyinContent(this.cookies, docId);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    const data: DouYinPrivilege = {
      locationType: 0,
      locationSalesPermission: false,
      has_app_permission: false,
      shopping_cart: false,
      group_shopping: false,
      game_permission: false,
      film_permission: false,
      //sync_app_list: [],
    };
    const re = await Douyin.getDouyinLocationType(this.cookies);
    data.locationType = re?.locationType.includes(3) ? 3 : re.locationType?.includes(2) ? 2 : 0;
    data.locationSalesPermission = re.hasPromoteAuth ?? false;
    if (re?.code != undefined && re?.code != 8) {
      // const syncApp = await Douyin.getDouyinSyncAppList(this.cookies);
      // data.sync_app_list = syncApp.dataList ?? [];
      const anchorRe = await Douyin.getDouyinPublishAnchorPrivilege(this.cookies);
      const achors = anchorRe?.data as Array<number>;
      if (achors?.includes(3)) {
        data.shopping_cart = true;
      }
      if (achors?.includes(4)) {
        data.has_app_permission = true;
      }
      if (achors?.includes(11)) {
        data.film_permission = true;
      }
      if (achors?.includes(13010)) {
        data.group_shopping = true;
      }
      if (achors?.includes(13017)) {
        data.game_permission = true;
      }
    }
    return this.checkResult({
      code: re.code ?? -1,
      msg: re?.msg,
      ...data,
    });
  }
  public async getMiniAppPrivilege(): Promise<MiniAppPrivilege | undefined> {
    try {
      const re = await Douyin.getDouyinUserMiniAppPrivilege(this.cookies);
      return this.checkResult({ code: re.code, msg: re.msg, has_app_permission: re.isEnableAnchor4 } as never);
    } catch (e) {
      return undefined;
    } finally {
    }
  }
  /**
   * 搜索商品/团队列表
   * @param keyWord
   * @param nextPage
   * @param proxy
   * @param locationType
   * @param coords
   */
  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<BaseResult> {
    if (!nextPage) {
      nextPage = '1';
    }
    const re = await Douyin.getDouyinLocationGoodsList(
      this.cookies,
      keyWord ?? '',
      locationType,
      parseInt(nextPage ?? '1') ?? 1,
      proxy,
      coords,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  /**
   * 搜索商品/团队列表
   * @param keyWord
   */
  public async parseGoodsDetail(keyWord?: string): Promise<BaseResult> {
    if (!keyWord) {
      return { code: 400, msg: '需要解析的链接不能为空' };
    }
    const re = await Douyin.getDouyinGoods(this.cookies, keyWord, '');
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  /**
   * 搜索话题
   * @param keyWord
   * @param contentType
   */
  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    const re = await Douyin.getDouyinTopics(this.cookies, keyWord);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async getCollectionList(contentType?: PubContentEnum): Promise<BaseResult> {
    const re = await Douyin.getDouyinCollection(this.cookies);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async searchUserInfoList(keyWord: string): Promise<BaseResult> {
    const re = await Douyin.getDouyinFriend(this.cookies, keyWord);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  /**
   * 获取活动分类列表
   * @param contentType
   */
  public async getActivityCategory(contentType?: PubContentEnum): Promise<BaseResult> {
    const re = await Douyin.getDouyinActivityCategory(this.cookies);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  /**
   * 获取活动列表
   * @param contentType
   * @param categoryId
   * @param keyWord
   */
  public async getActivityList(
    contentType?: PubContentEnum,
    categoryId?: string,
    keyWord?: string,
  ): Promise<BaseResult> {
    const re = await Douyin.getDouyinActivityListInfo(this.cookies, categoryId);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  /**
   * 获取热点列表
   * @param contentType
   */
  public async getHotEventList(contentType?: PubContentEnum, keyWord?: string): Promise<BaseResult> {
    const re = await Douyin.getDouyinHotEvents(this.cookies, keyWord ?? '');
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  /**
   * 获取挑战列表
   * @param keyWord
   */
  public async getTiaoZhanList(keyWord?: string): Promise<BaseResult> {
    const re = await Douyin.getDouyinTiaozhanList(this.cookies, keyWord ?? '');
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  /**
   * 获取挂车权限
   */
  public async getShoppingPrivilege(): Promise<ShoppingPrivilege | undefined> {
    const re = await Douyin.getDouyinPublishAnchorPrivilege(this.cookies);
    const anchors = re?.data as Array<number>;
    const reNew = {
      code: re.code ?? -1,
      msg: re.msg,
      shopping_cart: anchors?.includes(3),
      group_shopping: anchors?.includes(13010),
    };
    if (reNew?.code === 8) {
      reNew.code = errorCode.loginExpire;
    }
    return reNew;
  }

  public async getLocationCity(proxy?: KuaiDaiLiProxy): Promise<ListInfoResponse | undefined> {
    const re = await Douyin.getDouyinCity(this.cookies, proxy);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async checkPublishGoods(goods: CheckGoodsParams): Promise<BaseResult> {
    if (!goods?.shopping_cart) {
      return { code: 4000, msg: '参数不能为空' };
    }
    //购物车
    const goodsInfoList: Array<DouyinGoodsInfo> = [];
    const shopping_cart = goods.shopping_cart as Array<DouYinShoppingCart>;
    if (shopping_cart?.length && shopping_cart[0].data) {
      if (shopping_cart?.length && shopping_cart[0].data) {
        for (const obj of shopping_cart) {
          if (obj?.images?.length) {
            //图片排序
            const goodInfo = obj.data.raw as DouyinGoodsInfo;
            const goods_img = [];
            for (const img of obj.images) {
              const newImg = goodInfo.goods_imgs.find((x) => x.elastic_img.url_list[0] === img);
              if (newImg) {
                goods_img.push(newImg as never);
              } else {
                //考虑中断使用默认图片顺序
              }
            }
            if (goods_img?.length) {
              goodInfo.goods_imgs = goods_img;
            }
            goodsInfoList.push({
              ...goodInfo,
              elastic_title: obj.sale_title,
            } as DouyinGoodsInfo);
          } else {
            goodsInfoList.push({
              ...(obj.data.raw as DouyinGoodsInfo),
              elastic_title: obj.sale_title,
            });
          }
        }
      } else {
        return { code: 400, msg: '商品信息不能为空' };
      }
    }
    const re = await Douyin.checkDouyinGoodsCanPublish(this.cookies, '', goodsInfoList);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return { code: re?.code ?? -1, msg: re?.msg ?? '' };
  }

  public async getCommentList(taskParams: DataSyncTaskItem, eventCall: EventEmitter): Promise<BaseResult> {
    const re = await Douyin.getDouYinComment(taskParams, eventCall, undefined);
    if (re.code == 8) {
      this.sdkToken = '';
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async addComment(taskParams: {
    contentId: string;
    documentId: string;
    text: string;
    commentId?: string;
    proxy?: KuaiDaiLiProxy;
    platform?: [{ platformLocalStorage: object }];
  }): Promise<BaseResult> {
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies);
      this.sdkToken = re.token ?? '';
    }
    //console.log('评论参数', taskParams);
    const result = await Douyin.addDouYinComment(
      this.cookies,
      this.sdkToken,
      taskParams.text,
      taskParams.contentId,
      taskParams.commentId,
      taskParams.proxy,
      taskParams?.platform ? taskParams?.platform[0]?.platformLocalStorage : undefined,
      taskParams.documentId,
    );
    if (result.code == 8) {
      this.sdkToken = '';
    }
    const re = { code: result?.code ?? -1, msg: result?.msg, data: { commentId: result?.commentId ?? '' } };
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async delComment(delTaskPrams: {
    contentId: string;
    documentId: string;
    commentId: string;
    platform?: [{ platformLocalStorage: object }];
  }): Promise<BaseResult> {
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies);
      this.sdkToken = re.token ?? '';
    }
    const re = await Douyin.delDouYinComment(
      this.cookies,
      this.sdkToken,
      delTaskPrams.commentId,
      delTaskPrams?.platform ? delTaskPrams?.platform[0]?.platformLocalStorage : undefined,
    );
    if (re.code == 8) {
      this.sdkToken = '';
      re.code = errorCode.loginExpire;
    }
    return { code: re?.code ?? -1, msg: re?.msg };
  }

  public async digComment(digTaskPrams: {
    contentId: string;
    documentId: string;
    commentId: string;
    platform?: [{ platformLocalStorage: object }];
  }): Promise<BaseResult> {
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies);
      this.sdkToken = re.token ?? '';
    }
    const re = await Douyin.digDouYinComment(
      this.cookies,
      this.sdkToken,
      digTaskPrams.commentId,
      1,
      digTaskPrams?.platform ? digTaskPrams?.platform[0]?.platformLocalStorage : undefined,
    );
    if (re.code == 8) {
      this.sdkToken = '';
      re.code = errorCode.loginExpire;
    }
    return { code: re?.code ?? -1, msg: re?.msg };
  }

  public async getContentComment(taskParams: {
    contentId: string;
    documentId: string;
    commentId: string;
    nextPage: string;
  }): Promise<CommentListInfoResponse> {
    const re = await Douyin.getDouYinCommentByContent(
      this.cookies,
      taskParams.contentId,
      taskParams.commentId,
      taskParams.nextPage,
      undefined,
      taskParams.documentId,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async getCommentContent(taskParams: { nextPage: string }): Promise<CommentContentListInfoResponse> {
    const re = await Douyin.getDouYinCommentContent(this.cookies, taskParams.nextPage);
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  //获取会话列表
  public async getConversationList(taskParams: {
    nextPage: string;
    platformAuthorId: string;
    proxy?: IWebProxy;
  }): Promise<MessageConversationListInfoResponse> {
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies, taskParams.proxy);
      this.sdkToken = re.token ?? '';
    }
    const re = await Douyin.getDouYinMessageConversationList(
      this.cookies,
      this.localStorage ?? {},
      taskParams.nextPage,
      taskParams.platformAuthorId,
      this.sdkToken,
      taskParams.proxy,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  //获取指定会话的详情，名称头像等
  public async getConversationInfo(taskParams: {
    sessionId: string;
    secSessionId: string;
    messageUserId: string;
    proxy?: IWebProxy;
  }): Promise<MessageConversationListInfoResponse> {
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies, taskParams.proxy);
      this.sdkToken = re.token ?? '';
    }
    const re = await Douyin.getDouYinMessageConversationInfo(
      this.cookies,
      taskParams.sessionId,
      taskParams.secSessionId,
      taskParams.messageUserId,
      this.sdkToken,
      taskParams.proxy,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  //获取陌生人新增会话
  public async getNewConversationList(taskParams: {
    nextPage: string;
    platformAuthorId: string;
    proxy?: IWebProxy;
  }): Promise<MessageListInfoResponse> {
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies, taskParams.proxy);
      this.sdkToken = re.token ?? '';
    }
    const re = await Douyin.getDouYinMessageStrangerMessageList(
      this.cookies,
      this.localStorage ?? {},
      taskParams.nextPage,
      taskParams.platformAuthorId,
      Date.now() * 1000,
      taskParams.proxy,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  //获取指定会话的消息，默认第一页
  public async getMessageListByConversation(taskParams: {
    sessionId: string;
    secSessionId?: string;
    conversationType?: string;
    nextPage?: string;
    platformAuthorId: string;
    proxy?: IWebProxy;
  }): Promise<MessageListInfoResponse> {
    let accId = taskParams?.platformAuthorId;
    // 确保userInfo已初始化
    if (!accId) {
      await this.getUserInfo();
      accId = this.userInfo?.yixiaoerId ?? '';
      taskParams.platformAuthorId = accId;
    }
    if (!accId) {
      return { code: 400, msg: '获取用户信息失败' };
    }
    const re = await Douyin.getDouYinMessageListByConversation(
      this.cookies,
      this.localStorage ?? {},
      taskParams.sessionId,
      taskParams.secSessionId ?? '',
      Number(taskParams.conversationType ?? 1),
      taskParams.nextPage,
      taskParams.platformAuthorId,
      taskParams.proxy,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async getNewMessageList(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
    proxy?: IWebProxy;
  }): Promise<MessageListInfoResponse> {
    let accId = taskParams?.platformAuthorId;
    // 确保userInfo已初始化
    if (!accId) {
      await this.getUserInfo();
      accId = this.userInfo?.yixiaoerId;
      taskParams.platformAuthorId = accId;
    }
    if (!accId) {
      return { code: 400, msg: '获取用户信息失败' };
    }
    let timeSep = Number(taskParams.nextPage ? taskParams.nextPage : 0);
    if (!timeSep) {
      timeSep = Date.now() * 1000;
    }
    const msgList: Array<MessageBackItem> = [];
    let newRe = await Douyin.getDouYinMessageStrangerMessageList(
      this.cookies,
      this.localStorage ?? {},
      '',
      taskParams.platformAuthorId,
      timeSep,
      taskParams.proxy,
    );
    while (newRe?.dataList?.length) {
      newRe.dataList.forEach((item) => {
        msgList.push(item);
      });
      if (!newRe.nextPage) {
        break;
      }
      newRe = await Douyin.getDouYinMessageStrangerMessageList(
        this.cookies,
        this.localStorage ?? {},
        newRe.nextPage,
        taskParams.platformAuthorId,
        timeSep,
        taskParams.proxy,
      );
    }
    const re = await Douyin.getDouYinNewMessageList(
      this.cookies,
      this.localStorage ?? {},
      taskParams.nextPage,
      taskParams.platformAuthorId,
      taskParams.proxy,
    );
    if (re?.dataList?.length) {
      re.dataList?.forEach((item) => {
        msgList.push(item);
      });
    }

    re.dataList = msgList; //?.sort((a, b) => a.timestamp - b.timestamp);
    if (re.dataList?.length) {
      const maxTime = Math.max(...re.dataList.map((item) => item.timestamp));
      const endTime = maxTime * 1000 + 1;
      const nextTime = Number(re.nextPage ?? endTime);
      if (endTime > nextTime) {
        re.nextPage = endTime.toString();
      }
    }
    if (!re.nextPage) {
      re.nextPage = timeSep.toString();
    }

    return re;
  }

  /**
   * 获取新消息(实现BaseWorker的可选方法)
   * 抖音特定逻辑:只支持轮询模式,不支持WebSocket
   * @param notifyData WebSocket通知数据(抖音不使用)
   */
  public async fetchNewMessages(taskParams?: any): Promise<MessageListInfoResponse> {
    try {
      let accId = taskParams?.platformAuthorId;
      // 确保userInfo已初始化
      if (!accId) {
        await this.getUserInfo();
        accId = this.userInfo?.yixiaoerId;
        taskParams.platformAuthorId = accId;
      }
      if (!accId) {
        return { code: 400, msg: '获取用户信息失败' };
      }

      // 抖音只支持轮询,直接调用getNewMessageList
      const result = await this.getNewMessageList({
        nextPage: this.lastMsgTimestamp,
        platformAuthorId: taskParams.platformAuthorId ?? '',
      });

      // 更新最后消息时间戳
      if (result.code === 0 && result.nextPage) {
        this.lastMsgTimestamp = result.nextPage;
      }
      if (result?.code > 0) {
        console.log(result.msg);
      }

      return result;
    } catch (error) {
      return {
        code: -1,
        msg: `获取新消息失败:${error}`,
        dataList: [],
      };
    }
  }

  /**
   * 最后消息时间戳(用于轮询)
   */
  private lastMsgTimestamp?: string;

  /**
   * 创建私信服务(用于轮询模式)
   * 抖音通过事件方式推送消息
   * @param task 任务参数
   * @param event 事件发射器
   */
  public async createMsgService(
    task: { platformAuthorId: string },
    event: EventEmitter,
  ): Promise<{ code: number; msg: string }> {
    try {
      // 获取新消息
      const result = await this.fetchNewMessages();

      if (result.code === 0 && result.dataList && result.dataList.length > 0) {
        // 通过事件发射消息数据
        event.emit('msg_data_back', result.dataList);
      }

      return { code: 0, msg: '' };
    } catch (error) {
      return { code: -1, msg: `获取消息失败:${error}` };
    }
  }

  /**
   * 停止私信服务
   */
  public async dropMsgService(): Promise<{ code: number; msg: string }> {
    // 抖音轮询模式不需要特殊清理
    return { code: 0, msg: '' };
  }

  public async SendMessage(taskParams: {
    sessionId: string;
    secSessionId: string;
    text: string;
    imageInfo?: ImageInfo;
    sessionType?: SessionType;
    messageType: MessageType;
    proxy?: IWebProxy;
    platformAuthorId?: string;
  }): Promise<{ code: number; msg: string; messageId?: string }> {
    const re = await Douyin.sendDouYinMessage(
      this.cookies,
      this.localStorage ?? {},
      taskParams.sessionId,
      taskParams.secSessionId,
      taskParams.text,
      taskParams.sessionType,
      taskParams.proxy,
      taskParams.imageInfo,
      taskParams.messageType,
      taskParams.platformAuthorId,
    );
    if (re?.code === 8) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  public async getMiniAppList(keyWord?: string): Promise<BaseResult> {
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies);
      this.sdkToken = re.token ?? '';
    }
    return this.checkResult(await Douyin.getDouyinMiniApp(this.cookies, keyWord ?? '', this.sdkToken));
  }

  public async getCoCreation(): Promise<ListInfoResponse> {
    return this.checkResult(await Douyin.getDouyinCoCreation(this.cookies));
  }

  public async getFilmList(args?: { keyWord: string }): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Douyin.getDouyinFilmList(this.cookies, args?.keyWord));
  }

  /**
   * 获取游戏列表
   * @param args
   */
  public async getGameList(args?: { keyWord: string }): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Douyin.getDouyinGameList(this.cookies, args?.keyWord ?? ''));
  }

  /**
   * 获取可同步的app列表
   * @param args
   */
  public async getSyncAppList(args?: object): Promise<ListInfoResponse> {
    return this.checkResult(await Douyin.getDouyinSyncAppList(this.cookies));
  }

  public async checkPublishRiskStatus(task: {
    images: [ImageInfo];
    proxy: KuaiDaiLiProxy;
    localStorage: object;
  }): Promise<BaseResult> {
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies);
      this.sdkToken = re.token ?? '';
    }
    return this.checkResult(
      await Douyin.verify.getPublishCheckStr(
        this.cookies,
        task.localStorage ?? this.localStorage ?? '',
        task.images,
        this.sdkToken,
        task.proxy,
      ),
    );
  }
  public async sendPublishCheckSmsCode(task: { checkStr: string; proxy: KuaiDaiLiProxy }): Promise<BaseResult> {
    const prepared = this.preparePublishCookie();
    if (prepared.code !== 0) {
      return prepared;
    }
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies);
      this.sdkToken = re.token ?? '';
    }
    return this.checkResult(
      await Douyin.verify.sendVerifySmsCode(this.cookies, task.checkStr, this.sdkToken, task.proxy),
    );
  }
  public async verifyPublishRisk(task: {
    type: string;
    code_number: string;
    password: string;
    checkStr: string;
    proxy: KuaiDaiLiProxy;
  }): Promise<BaseResult> {
    const prepared = this.preparePublishCookie();
    if (prepared.code !== 0) {
      return prepared;
    }
    if (!this.sdkToken) {
      const re = await Douyin.getDouyinUserSdkToken(this.cookies);
      this.sdkToken = re.token ?? '';
    }
    return this.checkResult(
      await Douyin.verify.verifyPublish(
        this.cookies,
        task.type as never,
        task.code_number,
        task.password,
        task.checkStr,
        this.sdkToken,
        task.proxy,
      ),
    );
  }

  /**
   * 使用已经组装完成的发布数据恢复发布
   */
  public async publishPostData(
    publishType: 'video' | 'dynamic',
    postData: string,
    taskId: string,
    proxy?: KuaiDaiLiProxy,
  ): Promise<PublishResult> {
    const prepared = this.preparePublishCookie();
    if (prepared.code !== 0) {
      return { code: prepared.code, msg: prepared.msg ?? '账号信息缺失，请重新授权此账号再试', taskId };
    }
    return publishVerifiedPostData(this.cookies, publishType, postData, taskId, proxy);
  }

  private preparePublishCookie(): BaseResult {
    const prepared = prepareDouyinPublishCookie(this.cookies, this.localStorage);
    if (prepared.code === 0) {
      this.cookies = prepared.cookie;
      if (prepared.localStorage) {
        this.localStorage = prepared.localStorage;
      }
    }
    return prepared;
  }
}
