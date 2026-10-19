import { generateToken, QueryWorker } from '@/cloud/task/taskService';
import {
  CommentBackItem,
  ContentBackItem,
  DataSyncTaskItem,
  MessageBackItem,
  Platforms,
  SyncEventName,
} from '@/service/datasync-service-manager';
import { PlatformAccountInfo } from '@/cloud/model/BaseTaskFormModel';
import { isJson, logger, Task } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import { PubConfig } from '@/Config';
import { CallBackDataEvent, PubContentEnum } from '@/cloud/model/TypeEnum';
import { AxiosError } from 'axios';
import { $http } from '@/http';
import {
  Douyin,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
  PlatformAuthorInfo,
} from '@/media-platform';
import { IWebProxy } from '@/media-platform/webproxy';

export class CommentMessageService extends QueryWorker {
  protected gettingComment: boolean = true;
  protected gettingMsg: boolean = true;
  protected drop: boolean = false;
  protected commentTaskParams?: DataSyncTaskItem;

  /**
   * 监控作品的最大天数
   *
   */
  protected commentContentMaxDays: number = 7;
  protected lastCommentTimestamp: number = 0;
  protected lastMsgTimestamp = '';

  /**
   *记录n天作品下的评论数
   *
   */
  protected daysContentList: {
    [key: string]: { contentId: string; xsecToken?: string; commentCount: number; timestamp: number };
  } = {};
  protected workerInfo: WorkerInfo;
  constructor(platform: Platforms, account: PlatformAccountInfo) {
    super('', platform, account);
    if (
      platform === Platforms.DouYin ||
      platform === Platforms.ShiPinHao ||
      platform === Platforms.XiaoHongShuHome
    ) {
      this.workerInfo = account as object as WorkerInfo;
    } else {
      this.eventCall?.on(SyncEventName.content_data_back, this.postBackCommentContent.bind(this));
      this.eventCall?.on(SyncEventName.comment_data_back, this.postBackComment.bind(this));
      setInterval(() => {
        const heartData: PlatformWorkerActionEvent = {
          action: WorkerActionType.heartbeat,
          platformAccountId: this.account.platformAccountId ?? 'none',
          code: 0,
          msg: '',
        };
        this.heartBeat(heartData);
      }, 59 * 1000);
      this.workerInfo = account as object as WorkerInfo;
      if (this.workerInfo?.contentList?.startsWith('[')) {
        const contentList = JSON.parse(this.workerInfo.contentList);
        if (contentList.length > 0) {
          contentList.forEach((item) => {
            this.daysContentList[item.contentId] = {
              contentId: item.contentId,
              xsecToken: item.xsecToken,
              commentCount: item.commentCount,
              timestamp: item.timestamp,
            };
          });
        }
      }
    }
  }

  private logNonProd(message: string): void {
    if (process.env.ENV === 'test') {
      logger.info(message);
    }
  }

  public stop(): boolean {
    this.drop = true;
    this.gettingComment = false;
    this.gettingMsg = false;
    this.eventCall?.removeAllListeners();
    this.eventCall = undefined;
    this.worker.dropMsgService();
    return true;
  }

  public updateCookie(cookie: string, localstorage?: object): string {
    if (!cookie || cookie?.length < 10 || (!cookie?.includes('=') && !cookie?.trim()?.startsWith('['))) {
      return 'cookie格式异常';
    }
    this.account.cookie = cookie;
    this.worker.refreshCookie(cookie, localstorage);
    this.gettingComment = true;
    this.gettingMsg = true;
    return '';
  }

  private heartBeat(data: PlatformWorkerActionEvent): void {
    this.eventCall?.emit('heartbeat', data);
  }

  //评论
  public async startGetComment(
    once: boolean,
    loopMinute: number,
    textMaxDays: number,
    contentMaxDays: number,
  ): Promise<void> {
    let task: DataSyncTaskItem = {
      platformName: this.platform,
      maxPage: 100000,
      accountId: this.account.platformAuthorId ?? 'none',
      accountCookieStr: this.worker.cookies,
      syncType: 'Comment',
      taskId: '',
      textMinDateTime: new Date(Date.now() - textMaxDays * 24 * 60 * 60 * 1000),
      contentMinDateTime: new Date(Date.now() - contentMaxDays * 24 * 60 * 60 * 1000),
      contentList: this.daysContentList,
    };
    if (once) {
      this.worker
        .getCommentList(task, this.eventCall)
        .then((re) => {
          this.postBackComment([], re ?? {});
        })
        .finally();
      return;
    }
    if (!loopMinute) {
      loopMinute = 5;
    }
    if (this.account['lastCommentTimestamp']) {
      this.lastCommentTimestamp =
        Number(this.account['lastCommentTimestamp']) ?? Date.now() - textMaxDays * 24 * 60 * 60 * 1000;
    } else {
      this.lastCommentTimestamp = Date.now() - textMaxDays * 24 * 60 * 60 * 1000;
    }

    this.commentContentMaxDays = contentMaxDays ?? 7;
    const loopTime = loopMinute * 60 * 1000;
    while (true) {
      try {
        if (this.drop) {
          return;
        }
        if (!this.gettingComment) {
          await Task.Delay(60000);
          continue;
        }
        task = {
          platformName: this.platform,
          maxPage: 100000,
          accountId: this.account.platformAuthorId ?? 'none',
          accountCookieStr: this.worker.cookies,
          syncType: 'Comment',
          taskId: '',
          textMinDateTime: new Date(this.lastCommentTimestamp),
          contentMinDateTime: new Date(Date.now() - contentMaxDays * 24 * 60 * 60 * 1000),
          contentList: this.daysContentList,
        };
        const re = await this.worker.getCommentList(task, this.eventCall);
        this.postBackComment([], re ?? {});
        const heartData: PlatformWorkerActionEvent = {
          action: WorkerActionType.comment,
          platformAccountId: this.account.platformAccountId ?? 'none',
          code: re?.code ?? -1,
          msg: re?.msg ?? '',
        };
        this.heartBeat(heartData);
        await Task.Delay(loopTime);
      } catch (e) {
        logger.error(`循环评论异常:${this.account.platformAccountId}:${(e as Error)?.message ?? e?.toString()}`);
      } finally {
      }
    }
  }

  protected async postBackCommentContent(data: ContentBackItem[], re?: BaseResult): Promise<void> {
    try {
      if (data?.length > 0) {
        data?.forEach((item) => {
          this.daysContentList[item.contentId] = {
            contentId: item.contentId ?? '',
            xsecToken: item.xsecToken,
            commentCount: item.commentCount ?? 0,
            timestamp: item.timestamp,
          };
        });
        this.throwContentList();
      }

      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;
      const postData = {
        event: CallBackDataEvent.commentContent,
        accountId: this.account.platformAccountId,
        data: data,
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $http.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
      });
      if (result?.data?.statusCode === 0) {
        this.logNonProd(`推送账号评论作品数据成功:${this.account.platformAccountId}:数量:${data?.length ?? 0}`);
        return;
      } else {
        logger.error(`推送账号评论作品数据失败:${this.account.platformAccountId}:${JSON.stringify(result?.data)}`);
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发布失败，${e?.toString() ?? ''}`;
      }
      logger.error(
        `推送账号评论作品数据失败:账号id:${this.account.platformAccountId} 作品结果:${JSON.stringify(data)}${errMsg}`,
      );
    }
  }
  protected async postBackComment(data: CommentBackItem[], re: BaseResult): Promise<void> {
    try {
      if (data?.length) {
        const lastTime = Math.max(...data.map((item) => item?.timestamp));
        if (this.lastCommentTimestamp < lastTime) {
          this.lastCommentTimestamp = lastTime;
          const heartData: PlatformWorkerActionEvent = {
            action: WorkerActionType.comment,
            platformAccountId: this.account.platformAccountId ?? 'none',
            code: 0,
            msg: '',
            data: this.lastCommentTimestamp.toString(),
          };
          this.heartBeat(heartData);
        }
      }
      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;
      const postData = {
        event: re ? CallBackDataEvent.commentListEnd : CallBackDataEvent.commentList,
        accountId: this.account.platformAccountId,
        data: data,
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $http.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
      });
      if (result?.data?.statusCode === 0) {
        this.logNonProd(`推送账号评论数据成功:${this.account.platformAccountId}:数量:${data?.length ?? 0}`);
        return;
      } else {
        logger.error(`推送账号评论数据失败:${this.account.platformAccountId}:${JSON.stringify(result?.data)}`);
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发布失败，${e?.toString() ?? ''}`;
      }
      logger.error(
        `推送账号评论数据失败:账号id:${this.account.platformAccountId} 作品结果:${JSON.stringify(data)}${errMsg}`,
      );
    }
  }
  protected throwContentList() {
    const contentListKeys = Object.keys(this.daysContentList ?? {});
    if (contentListKeys.length > 0) {
      const contentList = [];
      const time = Date.now() - this.commentContentMaxDays * 24 * 60 * 60 * 1000;
      for (const key of contentListKeys) {
        const item = this.daysContentList[key];
        if (item.timestamp < time) {
          //过期
          continue;
        }
        contentList.push(this.daysContentList[key] as never);
      }
      const heartData: PlatformWorkerActionEvent = {
        action: WorkerActionType.commentContent,
        platformAccountId: this.account.platformAccountId ?? 'none',
        code: 0,
        msg: '',
        data: JSON.stringify(contentList),
      };
      this.heartBeat(heartData);
    }
  }

  /**
   * 获取可品论的作品列表
   * @param params
   */
  public async getCommentContent(params: { nextPage: string; contentType: PubContentEnum }) {
    try {
      return await this.worker.getCommentContent(params);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取可评论作品列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取可评论作品列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }
  /**
   * 根据作品按页获取评论
   * @param params
   */
  public async getContentComment(params: {
    contentId: string;
    xsecToken?: string;
    documentId: string;
    commentId: string;
    nextPage: string;
  }) {
    try {
      return await this.worker.getContentComment(params);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取评论列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取评论列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }
  public async addComment(taskParams: object): Promise<BaseResult> {
    try {
      return await this.worker.addComment(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `添加评论失败，${e?.toString() ?? ''}`;
      }
      logger.error(`添加评论失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }

  public async delComment(delTaskPrams: object): Promise<BaseResult> {
    try {
      return await this.worker.delComment(delTaskPrams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `删除评论失败，${e?.toString() ?? ''}`;
      }
      logger.error(`删除评论失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }

  public async digComment(digTaskPrams: object): Promise<BaseResult> {
    try {
      return await this.worker.digComment(digTaskPrams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `点赞评论失败，${e?.toString() ?? ''}`;
      }
      logger.error(`点赞评论失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }

  /**
   * 私信
   * @param loopSecond 循环监控秒数，默认30秒
   * @param lastMsgTimestamp
   */
  public async startGetMessage(loopSecond: number, lastMsgTimestamp?: string): Promise<void> {
    if (!loopSecond) {
      loopSecond = 30;
    }

    const loopTime = loopSecond * 1000;
    while (true) {
      try {
        if (this.drop) {
          return;
        }
        const re = await this.worker.createMsgService(
          { platformAuthorId: this.account.platformAuthorId ?? '' },
          this.eventCall,
        );
        if (re.code === 0) {
          this.eventCall?.on(SyncEventName.msg_data_back, (data: MessageBackItem[]) => {
            this.postBackPrivateMsg(data, { code: 0 });
          });
          this.eventCall?.on(SyncEventName.msg_data_notify, (data) => {
            this.postBackPrivateMsgNotify();
          });
        }
        await Task.Delay(loopTime);
      } catch (e) {
        logger.error(`循环评论异常:${this.account.platformAccountId}:${(e as Error)?.message ?? e?.toString()}`);
      } finally {
      }
    }
  }
  protected async postBackPrivateMsg(data: MessageBackItem[], re: BaseResult): Promise<void> {
    try {
      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;
      const postData = {
        event: CallBackDataEvent.privateMsg,
        accountId: this.account.platformAccountId,
        data: data,
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $http.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
      });
      if (result?.data?.statusCode === 0) {
        this.logNonProd(`推送账号私信数据成功:${this.account.platformAccountId}:数量:${data?.length ?? 0}`);
        return;
      } else {
        logger.error(`推送账号私信数据失败:${this.account.platformAccountId}:${JSON.stringify(result?.data)}`);
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发布失败，${e?.toString() ?? ''}`;
      }
      logger.error(
        `推送账号私信数据失败:账号id:${this.account.platformAccountId} 作品结果:${JSON.stringify(data)}${errMsg}`,
      );
    }
  }

  protected async postBackPrivateMsgNotify(): Promise<void> {
    try {
      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;
      const postData = {
        event: CallBackDataEvent.privateMsgNotify,
        accountId: this.account.platformAccountId,
        data: {},
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $http.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
      });
      if (result?.data?.statusCode === 0) {
        this.logNonProd(`推送账号私信通知:${this.account.platformAccountId}`);
        return;
      } else {
        logger.error(`推送账号私信通知失败:${this.account.platformAccountId}:${JSON.stringify(result?.data)}`);
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发布失败，${e?.toString() ?? ''}`;
      }
      logger.error(`推送账号私信通知失败:账号id:${this.account.platformAccountId} ${errMsg}`);
    }
  }

  //获取会话列表
  public async getConversationList(taskParams: object): Promise<MessageConversationListInfoResponse> {
    try {
      return await this.worker.getConversationList(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取对话列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取对话列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }

  //获取指定会话的详情，名称头像等
  public async getConversationInfo(taskParams: object): Promise<BaseResult> {
    try {
      return await this.worker.getConversationInfo(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取对话详情失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取对话详情失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }
  //获取陌生人/新增会话
  public async getNewConversationList(taskParams: object): Promise<MessageListInfoResponse> {
    try {
      return await this.worker.getNewConversationList(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取新对话列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取新对话列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }

  //获取指定会话的消息，默认第一页
  public async getMessageListByConversation(taskParams: object): Promise<MessageListInfoResponse> {
    try {
      return await this.worker.getMessageListByConversation(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取对话历史消息列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取对历史话消息列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }

  public async getNewMessageList(taskParams: object): Promise<MessageListInfoResponse> {
    try {
      return await this.worker.getNewMessageList(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取新消息列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取新消息列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }
  public async SendMessage(taskParams: object): Promise<{ code: number; msg: string; messageId?: string }> {
    try {
      return await this.worker.SendMessage(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发送消息失败，${e?.toString() ?? ''}`;
      }
      logger.error(`发送消息失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }
  public async parseMessageMedia(taskParams: object): Promise<BaseResult> {
    try {
      return await this.worker.parseMessageMedia(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = '网络异常';
      } else if (e instanceof Error) {
        errMsg = '媒体解析失败';
      } else {
        errMsg = '媒体解析失败';
      }
      logger.error(`媒体解析失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }
}

export interface PlatformWorkerActionEvent {
  action: WorkerActionType;
  platformAccountId: string;
  code: number;
  msg: string;
  data?: string;
}

export enum WorkerActionType {
  comment = 'comment',
  commentContent = 'commentContent',
  privateMsg = 'privateMsg',
  heartbeat = 'heartbeat',
}

export interface WorkerInfo {
  lastUpdated: number;
  heartBeatTime: number;
  textMaxDays: number;
  /**
   * 获取几天内的数据
   */
  contentMaxDays: number;
  /**
   * 最后一条评论时间戳
   */
  commentLastTimeStamp: number;
  /**
   * 最后一条私信时间戳
   */
  msgLastTimeStamp: number;

  /**
   * 内容列表数据，记录最新的评论数
   */
  contentList: string;
}
