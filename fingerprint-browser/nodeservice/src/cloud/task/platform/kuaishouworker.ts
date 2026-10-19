import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import {
  CommentContentListInfoResponse,
  CommentListInfoResponse,
  Douyin,
  GeoLocation,
  GoodsItemInfo,
  Kuaishou,
  KuaishouDynamicTaskInput,
  KuaishouGoodsInfo,
  KuaishouLocationInfo,
  KuaishouMusicInfo,
  KuaishouVideoTaskInput,
  ListInfoResponse,
  ListItemInfo,
  ListMusicInfoResponse,
  PlatformAuthorInfo,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { KuaiShouPrivilege, KuaiShouStatementType } from '@/platform-body/video';
import { LocationType } from '@/platform-body/common';
import { LocationTypePrivilege, MiniAppPrivilege, ShoppingPrivilege } from '@/cloud/model/SearchDataModel';
import { KuaiShouTokenResponse } from '@/media-platform/kuaishou/kuaishou-base.service';
import { KuaiShouMiniAppInfo } from '@/media-platform/kuaishou/kuaishou-miniapp.service';

export class KuaiShouWorker extends BaseWorker {
  private async freshCookiesFromPlatform(proxy?: IWebProxy): Promise<void> {
    if (!this.cookies?.includes('passToken') || !this.cookies?.includes('userId')) {
      return;
    }
    const re = await Kuaishou.checkKuaiShouLogin(this.cookies, proxy);
    if (re?.code === 0) {
      const token = re.data as KuaiShouTokenResponse;
      if (token?.['kuaishou.web.cp.api_st']) {
        this.cookies = this.cookies.replace('kuaishou.web.cp.api_st=', 'dropcookie=');
        this.cookies = `${this.cookies};kuaishou.web.cp.api_st=${token?.['kuaishou.web.cp.api_st']}`;
      }
    }
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re.code === 109 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    return this.checkResult(await Kuaishou.getKuaishouUserInfo(this.cookies, proxy));
  }

  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    await this.freshCookiesFromPlatform(taskDataIn.proxy);
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: KuaishouVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        cover: task.covers[0],
        desc: task.desc,
        visibilityType: 1,
        downloadType: 2,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        pkCover: task['pk_cover'],
        needParts: task.needParts,
      };
      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibilityType = 2;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibilityType = 4;
            break;
          default:
            taskData.visibilityType = 1;
            break;
        }
      }
      if (task.location) {
        //地点
        taskData.location = task.location.raw as KuaishouLocationInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.publishTime = task.prePubTime;
      }
      if (task.category) {
        //分类
        taskData.domain = task.category.yixiaoerName;
        taskData.secondDomain = task.subCategory?.yixiaoerName;
      }

      //申明
      if (task.statement?.type) {
        taskData.declareInfo = {
          source: task.statement.type as KuaiShouStatementType,
        };
      }

      //关联商品
      if (task.shopping_cart) {
        const goodsInfo = (task.shopping_cart as GoodsItemInfo)?.raw as KuaishouGoodsInfo;
        if (goodsInfo?.associateTaskId) {
          taskData.goods = goodsInfo;
        }
      }
      //小程序
      else if (task.mini_app?.yixiaoerId) {
        taskData.miniAppInfo = (task.mini_app?.raw as KuaiShouMiniAppInfo) ?? {
          associateTaskId: { bindId: task.mini_app.yixiaoerId },
        };
      }
      //合集
      if ((task.collection as ListItemInfo)?.yixiaoerId) {
        taskData.collectionId = parseInt((task.collection as ListItemInfo).yixiaoerId ?? '0');
      }
      //是否同城展示
      if (task.nearby_show === false) {
        taskData.disableNearbyShow = true;
      } else if (task.nearby_show === true) {
        taskData.disableNearbyShow = false;
      }
      //允许下载
      if (task['allow_download'] === true) {
        taskData.downloadType = 1;
      }

      //允许同框
      if (task['allow_same_frame'] === true) {
        taskData.allowSameFrame === true;
      } else if (task['allow_same_frame'] === false) {
        taskData.allowSameFrame = false;
      }
      const re = await Kuaishou.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: KuaishouDynamicTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        cover: task.covers[0],
        desc: task.desc,
        visibilityType: 1,
        proxy: task.proxy,
        images: task.images,
        cancelToken: task.cancelToken,
      };

      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibilityType = 2;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibilityType = 4;
            break;
          default:
            taskData.visibilityType = 1;
            break;
        }
      }
      if (task.location) {
        //地点
        taskData.location = task.location.raw as KuaishouLocationInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.publishTime = task.prePubTime;
      }
      if (task.music) {
        //音乐
        taskData.music = task.music?.raw as KuaishouMusicInfo;
      }
      //申明
      if (task.statement?.type) {
        taskData.declareInfo = {
          source: task.statement.type as never as KuaiShouStatementType,
        };
      }
      //关联商品
      if (task.shopping_cart) {
        const goodsInfo = (task.shopping_cart as GoodsItemInfo)?.raw as KuaishouGoodsInfo;
        if (goodsInfo?.associateTaskId) {
          taskData.goods = goodsInfo;
        }
      }
      //小程序
      else if (task.mini_app?.yixiaoerId) {
        taskData.miniAppInfo = (task.mini_app?.raw as KuaiShouMiniAppInfo) ?? {
          associateTaskId: { bindId: task.mini_app.yixiaoerId },
        };
      }

      //合集
      if ((task.collection as ListItemInfo)?.yixiaoerId) {
        taskData.collectionId = parseInt((task.collection as ListItemInfo).yixiaoerId ?? '0');
      }

      const re = await Kuaishou.publishDynamic(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else {
      return {
        code: errorCode.data_error,
        msg: `不支持的内容类型:${taskDataIn.publishType}`,
        taskId: taskDataIn.taskId,
      };
    }
  }

  public async checkAuditStatus(
    publishId: string,
    publishType?: PubContentEnum,
    desc?: string,
  ): Promise<AuditResult | undefined> {
    await this.freshCookiesFromPlatform();
    return this.checkResult(await Kuaishou.getKuaishouMediaStatus(this.cookies, publishId, 10, desc)) as AuditResult;
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Kuaishou.getKuaishouLocation(this.cookies, keyWord, proxy, coords));
  }

  public async searchMusic(keyWord: string, nextPage: string): Promise<ListMusicInfoResponse | undefined> {
    return this.checkResult(await Kuaishou.getKuaishouMusicList(this.cookies, keyWord, nextPage));
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await Kuaishou.deleteKuaishouContent(this.cookies, docId));
  }

  /**
   * 搜索话题
   * @param keyWord
   * @param contentType
   */
  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Kuaishou.getKuaishouTopic(this.cookies, keyWord));
  }

  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<BaseResult> {
    return this.checkResult(await Kuaishou.getKuaishouGoods(this.cookies, keyWord ?? '', nextPage));
  }

  public async getCollectionList(contentType?: PubContentEnum): Promise<BaseResult> {
    return this.checkResult(await Kuaishou.getKuaishouCollection(this.cookies));
  }

  public async searchUserInfoList(keyWord: string): Promise<BaseResult> {
    return this.checkResult(await Kuaishou.getKuaishouFriend(this.cookies, keyWord));
  }

  /**
   * 获取挂车权限
   */
  public async getShoppingPrivilege(): Promise<ShoppingPrivilege | undefined> {
    await this.freshCookiesFromPlatform();
    const re = await Kuaishou.getKuaishouShopPrivilege(this.cookies);
    return this.checkResult({
      code: re?.code ?? -1,
      msg: re?.msg,
      shopping_cart: re?.hasShopCart,
    } as never);
  }

  public async addComment(taskParams: {
    contentId: string;
    text: string;
    commentId?: string;
    commentParentId?: string;
    commentUserId?: string;
  }): Promise<BaseResult> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    const result = await Kuaishou.addKuaishouComment(
      this.cookies,
      taskParams.text,
      taskParams.contentId,
      taskParams.commentId,
      taskParams.commentUserId,
    );

    return this.checkResult({
      code: result?.code ?? -1,
      msg: result?.msg,
      data: { commentId: result?.commentId ?? '' },
    } as never);
  }

  public async delComment(delTaskPrams: { contentId: string; commentId: string }): Promise<BaseResult> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    const re = await Kuaishou.delKuaishouComment(this.cookies, delTaskPrams.contentId, delTaskPrams.commentId);
    return this.checkResult({ code: re?.code ?? -1, msg: re?.msg });
  }

  public async digComment(digTaskPrams: { contentId: string; commentId: string }): Promise<BaseResult> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    const re = await Kuaishou.digKuaishouComment(this.cookies, digTaskPrams.contentId, digTaskPrams.commentId, 'like');
    return this.checkResult({ code: re?.code ?? -1, msg: re?.msg });
  }

  public async getContentComment(taskParams: {
    contentId: string;
    commentId: string;
    nextPage: string;
    platformAuthorId: string;
  }): Promise<CommentListInfoResponse> {
    return this.checkResult(
      await Kuaishou.getKuaiShouCommentByContent(
        this.cookies,
        taskParams.contentId,
        taskParams.commentId,
        taskParams.nextPage ?? '',
        taskParams.platformAuthorId,
      ),
    );
  }

  public async getCommentContent(taskParams: {
    nextPage: string;
    contentType: PubContentEnum;
    platformAuthorId: string;
  }): Promise<CommentContentListInfoResponse> {
    return this.checkResult(
      await Kuaishou.getKuaiShouCommentContent(this.cookies, taskParams.nextPage, taskParams.platformAuthorId),
    );
  }

  /**
   * 获取活动分类列表
   * @param contentType
   */
  public async getActivityCategory(contentType?: PubContentEnum): Promise<BaseResult> {
    const re = await Kuaishou.getKuaiShouActivityCategory(this.cookies);
    return this.checkResult(re);
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
    const re = await Kuaishou.getKuaiShouActivityListInfo(this.cookies, categoryId);
    return this.checkResult(re);
  }

  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    const data: KuaiShouPrivilege = {
      has_app_permission: false,
      shopping_cart: false,
    };
    const re = await Kuaishou.getKuaishouShopPrivilege(this.cookies);
    const dataRe = re.data as any;
    if (re.code === 0 && dataRe.items?.length) {
      const ar = dataRe.items as Array<{ type: number }>;
      for (const a of ar) {
        if (a.type === 1) {
          data.shopping_cart = true;
        }
        if (a.type === 9) {
          data.has_app_permission = true;
        }
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
      const re = await Kuaishou.getKuaishouMiniAppPrivilege(this.cookies);
      return this.checkResult(re as never);
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  public async getMiniAppList(keyWord?: string): Promise<BaseResult> {
    return this.checkResult(await Kuaishou.getKuaiShouMiniApp(this.cookies, keyWord ?? ''));
  }
}
