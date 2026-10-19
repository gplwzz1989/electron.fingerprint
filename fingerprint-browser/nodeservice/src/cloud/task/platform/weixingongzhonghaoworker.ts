import { BaseSinglePublishTask, BaseSinglePublishTaskDynamic } from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import {
  Weixingongzhonghao,
  WeixingongzhonghaoUserInfoOutput,
  WeixinDynamicTaskInput,
  WeixinMsgTaskInput,
  WeiXinGongZhongHaoVideoTaskInput,
  WeiXinGongZhongHaoVideoContentItem,
} from '@/media-platform';
import { BaseSinglePublishTaskVideo } from '@/cloud/model/BaseTaskFormModel';
import {
  WeiXinGongZhongHaoDynamicStatement,
  WeiXinGongZhongHaoMessagePlatformBody,
} from '@/platform-body/video/weixingongzhonghao';
import { Platforms } from '@/service/datasync-service-manager';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class WeiXinGongZhongHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    const re = await Weixingongzhonghao.getWeixingongzhonghaoUserInfo(this.cookies, proxy);
    if (re.yixiaoerId) {
      const user = re as WeixingongzhonghaoUserInfoOutput;
      re['publishCheck'] = await Weixingongzhonghao.checkQrcodeOpen(this.cookies, user.data?.token?.toString() ?? '');
    }
    return this.checkResult(re);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code == 200003 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      const contentList = (task.contentList as Array<WeiXinGongZhongHaoVideoContentItem>)?.length
        ? (task.contentList as Array<WeiXinGongZhongHaoVideoContentItem>)
        : undefined;
      if (!contentList?.length) {
        return { code: 400, msg: '参数错误:内容列表不能为空', taskId: taskDataIn.taskId };
      }
      for (const content of contentList) {
        content.isOriginal = content['createType'] ?? 0;
        const claim = content['statement'] as WeiXinGongZhongHaoDynamicStatement;
        if (claim?.type) {
          content.contentSource = claim.type;
        }
      }
      const taskData: WeiXinGongZhongHaoVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        notifySubscribers: (task.notifySubscribers ?? 0) as never,
        sex: task.sex ?? 0,
        groupId: task.groupId,
        country: task.country ?? '',
        province: task.province ?? '',
        city: task.city ?? '',
        draftId: task['draftId'],
        publishTime: task.prePubTime ? parseInt((task.prePubTime / 1000).toFixed(0)) : undefined,
        contentList: contentList,
        cancelToken: taskDataIn.cancelToken,
        proxy: taskDataIn.proxy,
        needParts: task.needParts,
      };
      const userInfo = await this.getUserInfo();
      const weiXinUser = userInfo as WeixingongzhonghaoUserInfoOutput;
      if (weiXinUser?.code != 0) {
        return {
          code: weiXinUser.code,
          msg: weiXinUser?.code === 200003 ? '登录失效' : weiXinUser?.msg ?? '获取用户信息失败',
          taskId: taskDataIn.taskId,
        };
      }
      return this.checkResult(
        await Weixingongzhonghao.publishVideo(
          this.cookies,
          taskData,
          weiXinUser.data?.ticketId ?? '',
          weiXinUser.data?.ticket ?? '',
          weiXinUser.data?.token ?? 0,
          weiXinUser.yixiaoerId ?? '',
          this.event,
        ),
      ) as PublishResult;
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task: WeiXinGongZhongHaoMessagePlatformBody = { ...taskDataIn } as WeiXinGongZhongHaoMessagePlatformBody;
      const taskData: WeixinMsgTaskInput = {
        cancelToken: taskDataIn.cancelToken,
        /**
         * 任务ID
         */
        taskId: taskDataIn.taskId,

        /**
         * 发布类型
         * 0 存草稿 平台支持才有效，否则默认为发布
         * 1 发布
         */
        pubType: task.pubType ?? 1,

        sex: task?.sex ?? 0,
        country: task?.country ?? '',
        province: task?.province ?? '',
        city: task?.city ?? '',
        notifySubscribers: task?.notifySubscribers ?? 0,

        draftId: undefined,

        publishTime: task.prePubTime,

        proxy: taskDataIn.proxy,

        contentList: [],
      };

      //定时
      if (task.prePubTime) {
        taskData.publishTime = parseInt((task.prePubTime / 1000).toFixed(0));
      }
      if (task.contentList?.length > 0) {
        taskData.contentList = task.contentList.map((x) => ({
          ...x,
          needOpenComment: 0,
          needOpenReply: 5,
          disableRecommend: 0,
          desc: x.desc ?? '',
          isOriginal: x.createType,
        }));
      } else {
        return { code: 400, msg: '参数错误:内容列表不能为空', taskId: taskDataIn.taskId };
      }

      const userInfo = await this.getUserInfo();
      const weiXinUser = userInfo as WeixingongzhonghaoUserInfoOutput;
      if (weiXinUser?.code != 0) {
        return {
          code: weiXinUser.code,
          msg: weiXinUser?.code === 200003 ? '登录失效' : weiXinUser?.msg ?? '获取用户信息失败',
          taskId: taskDataIn.taskId,
        };
      }
      return this.checkResult(
        await Weixingongzhonghao.publishArticle(
          this.cookies,
          taskData,
          weiXinUser.data?.ticketId ?? '',
          weiXinUser.data?.ticket ?? '',
          weiXinUser.data?.token ?? 0,
          weiXinUser.yixiaoerId ?? '',
          this.event,
        ),
      ) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      const taskData: WeixinDynamicTaskInput = {
        cancelToken: taskDataIn.cancelToken,
        taskId: taskDataIn.taskId,
        pubType: task.pubType ?? 1,
        sex: 0,
        country: '',
        province: '',
        city: '',
        notifySubscribers: task.notifySubscribers == 1 ? 1 : 0,
        draftId: undefined,
        publishTime: task.prePubTime ? parseInt((task.prePubTime / 1000).toFixed(0)) : undefined,
        proxy: taskDataIn.proxy,
        title: task.title,
        desc: task.desc ?? '',
        images: task.images,
        needOpenComment: task['needOpenComment'] ?? 0,
        disableRecommend: task['disableRecommend'] ?? 0,
        autoSelectComment: 0,
        contentSource: task.statement?.type ?? 0,
      };

      const userInfo = await this.getUserInfo();
      const weiXinUser = userInfo as WeixingongzhonghaoUserInfoOutput;
      if (weiXinUser?.code != 0) {
        return {
          code: weiXinUser.code,
          msg: weiXinUser?.code === 200003 ? '登录失效' : weiXinUser?.msg ?? '获取用户信息失败',
          taskId: taskDataIn.taskId,
        };
      }
      return this.checkResult(
        await Weixingongzhonghao.publishDynamic(
          this.cookies,
          taskData,
          weiXinUser.data?.ticketId ?? '',
          weiXinUser.data?.ticket ?? '',
          weiXinUser.data?.token ?? 0,
          weiXinUser.yixiaoerId ?? '',
          this.event,
        ),
      ) as PublishResult;
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(
      await Weixingongzhonghao.getGongZhongHaoArticleStatus(this.cookies, publishId),
    ) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索当前平台用户列表
   * @param keyWord
   */
  public async searchUserInfoList(keyWord: string): Promise<BaseResult> {
    return this.checkResult(await Weixingongzhonghao.searchWeiXinGongZhongHaoUserList(this.cookies, keyWord));
  }

  /**
   * 搜索其他平台用户列表
   * @param keyWord
   * @param platform 平台代码
   */
  public async searchOtherUserInfoList(keyWord: string, platform?: Platforms): Promise<BaseResult> {
    return this.checkResult(await Weixingongzhonghao.searchWeiXinShipinhaoUserList(this.cookies, keyWord));
  }

  /**
   * 搜索内容列表
   * @param yixiaoerId
   * @param keyWord
   * @param platform
   * @param nextPage
   */
  public async searchContentList(
    yixiaoerId: string,
    keyWord?: string,
    platform?: Platforms,
    nextPage?: string,
  ): Promise<BaseResult> {
    return this.checkResult(
      await Weixingongzhonghao.getWeiXinShipinhaoUserContentList(
        this.cookies,
        yixiaoerId,
        nextPage,
        undefined,
        keyWord,
      ),
    );
  }

  /**
   * 搜索内容列表
   * @param keyWord
   */
  public async searchVoteList(keyWord?: string): Promise<BaseResult> {
    return this.checkResult(await Weixingongzhonghao.getWeiXinGongZhongHaoVoteList(this.cookies));
  }

  /**
   * 搜索投票详情
   * @param voteId
   */
  public async getVoteDetail(voteId: string): Promise<BaseResult> {
    return this.checkResult(await Weixingongzhonghao.getWeiXinGongZhongHaoVoteDetail(this.cookies, voteId));
  }

  public async getMiniAppList(keyWord?: string): Promise<BaseResult> {
    return this.checkResult(await Weixingongzhonghao.getWeiXinGongZhongHaoMiniApp(this.cookies, keyWord ?? ''));
  }
}
