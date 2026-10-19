import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import {
  Xiaohongshu,
  ListInfoResponse,
  ListMusicInfoResponse,
  PlatformAuthorInfo,
  GeoLocation,
  GoodsItemInfo,
  ListItemInfo,
  UserCanPublishInfo,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { errorCode } from '../../../media-platform/errorCode';
import { BaseResult } from '../../../media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import {
  Xiaohongshushop,
  XiaohongshushopArticleTaskInput,
  XiaohongshushopLocationInfo,
  XiaohongshushopPubGoodsInfo,
  XiaohongshushopVideoTaskInput,
} from '@/media-platform/xiaohongshushop';
import {
  XiaoHongShuShopPhotoInfo,
  XiaoHongShuShopStatementType,
} from '@/platform-body/video';
import { LocationType } from '@/platform-body/common';
import dayjs from 'dayjs';


export class XiaoHongShuShopWorker extends BaseWorker {
  private appendLocalStorageB1ToCookie(cookie: string): string {
    const b1 = (this.localStorage as Record<string, unknown> | undefined)?.b1;
    if (typeof b1 !== 'string' || !b1) {
      return cookie;
    }

    const cookieWithoutB1 = cookie
      .replace(/(^|;\s*)b1=[^;]*;?/g, '$1')
      .replace(/;\s*;/g, ';')
      .replace(/^;\s*/, '')
      .trim();
    const separator = cookieWithoutB1 && !cookieWithoutB1.endsWith(';') ? ';' : '';
    return `${cookieWithoutB1}${separator}b1=${b1};`;
  }

  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Xiaohongshushop.getXiaohongshushopUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === -100 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.localStorage) {
      this.refreshCookie(this.cookies, taskDataIn.localStorage);
    }
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: XiaohongshushopVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType,
        video: task.video,
        cover: task.covers[0],
        title: task.title,
        desc: task.desc,
        visibilityType: 0,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };
      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibilityType = 1;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibilityType = 4;
            break;
          default:
            taskData.visibilityType = 0;
            break;
        }
      }
      if (task.location) {
        //地点
        taskData.location = task.location.raw as XiaohongshushopLocationInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.postTime = task.prePubTime;
      }
      if (task.category) {
        //分类
      }
      //原创
      if (task.createType === ContentCreateTypeEnum.original) {
        if (task.video.duration > 10) {
          taskData.isOriginal = 1;
        }
      }
      //商品
      if (task.shopping_cart) {
        const goodsInfos = task.shopping_cart as Array<GoodsItemInfo>;
        if (goodsInfos.length) {
          taskData.goods = goodsInfos.map((obj) => obj.raw as XiaohongshushopPubGoodsInfo);
        }
      }

      const publishCookie = this.appendLocalStorageB1ToCookie(this.cookies);
      const re = await Xiaohongshushop.publishVideo(publishCookie, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: XiaohongshushopArticleTaskInput = {
        taskId: task.taskId,
        desc: task.desc,
        title: task.title,
        visibilityType: 0,
        proxy: task.proxy,
        images: task.images,
        cancelToken: task.cancelToken,
      };

      //群聊
      if (task['group']) {
        taskData.group = task['group'] as ListItemInfo;
      }

      //直播预告
      if (task['bind_live_info']) {
        taskData.bind_live_info = task['bind_live_info'];
      }

      //合集
      if (task?.collection) {
        taskData.collectionId = (task.collection as ListItemInfo)?.yixiaoerId;
      }

      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibilityType = 1;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibilityType = 4;
            break;
          default:
            taskData.visibilityType = 0;
            break;
        }
      }
      if (task.location) {
        //地点
        taskData.location = task.location.raw as XiaohongshushopLocationInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.postTime = task.prePubTime;
      }

      //申明
      if (task.statement?.type) {
        taskData.userDeclarationBind = {
          origin: task.statement.type as never as XiaoHongShuShopStatementType,
        };
        if (taskData.userDeclarationBind?.origin === XiaoHongShuShopStatementType.FORWARD) {
          taskData.userDeclarationBind.repostInfo = { source: task.statement['forward_source'] };
        } else if (taskData.userDeclarationBind?.origin === XiaoHongShuShopStatementType.OWN) {
          const photoInfo = task.statement['photoInfo'] as XiaoHongShuShopPhotoInfo;
          if (photoInfo?.address?.yixiaoerId && photoInfo?.time) {
            taskData.userDeclarationBind.photoInfo = {
              photoPlace: {
                subname: photoInfo?.address?.yixiaoerDesc ?? '',
                poiType: 12,
                poiId: photoInfo.address?.yixiaoerId,
                name: photoInfo.address?.yixiaoerName,
              },
              photoTime: dayjs(photoInfo.time).format('YYYY-MM-DD'),
            };
          }
        }
      }

      //原创
      if (task.createType === ContentCreateTypeEnum.original) {
        taskData.isOriginal = 1;
      }

      //商品，商家号图文发布接口当前使用单个商品的二级信息
      if (task.shopping_cart) {
        const goodsInfos = task.shopping_cart as Array<GoodsItemInfo>;
        if (goodsInfos.length) {
          taskData.goods = goodsInfos[0].raw as XiaohongshushopPubGoodsInfo;
        }
      }

      const publishCookie = this.appendLocalStorageB1ToCookie(this.cookies);
      const re = await Xiaohongshushop.publishArticle(publishCookie, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else {
      return {
        code: errorCode.data_error,
        msg: `不支持的内容类型:${taskDataIn.publishType}`,
        taskId: taskDataIn.taskId,
      };
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(
      await Xiaohongshushop.getXiaohongshushopMediaStatus(this.cookies, publishId),
    ) as AuditResult;
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
  ): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Xiaohongshushop.getXiaohongshushopLocationList(this.cookies, keyWord, 1, proxy));
  }

  public async searchMusic(keyWord: string, nextPage: string): Promise<ListMusicInfoResponse | undefined> {
    //todo 小红书音乐
    return { code: 444, msg: '不支持的平台' };
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await Xiaohongshu.deleteXiaohongshuContent(this.cookies, docId));
  }

  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<BaseResult> {
    let page = parseInt(nextPage ?? '1');
    if (!page) {
      page = 1;
    }
    return this.checkResult(await Xiaohongshushop.getXiaohongshushopFirstGoods(this.cookies, keyWord ?? '', page));
  }

  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    return this.checkResult(await Xiaohongshu.getXiaoHongShuUserCanPubInfo(this.cookies, proxy)) as never;
  }
}
