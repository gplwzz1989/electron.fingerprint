import {
  DataSyncTaskItem,
  MessageBackItem,
  MessageMediaInfo,
  MessageType,
  MessageUserBackItem,
  Platforms,
  SendMessageResultOutPut,
  SessionType,
  SyncEventName,
} from '../../service/datasync-service-manager';
import { EventEmitter } from 'events';
import {
  getShipinhaoMessageListResponse,
  getShipinhaoNewMsg,
  getShipinhaoMessageSessionDetailResponse,
  sendShipinhaoMessageResponse,
  uploadShipinhaoMessageImageResponse,
} from './shipinhao-message.service';
import { Guid, readImageData, Task } from '@/utils';
import { $http } from '@/http';
import { getShipinhaoUserInfo } from './shipinhao-common';
import {
  ImageInfo,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
} from '../../media-platform/baseModel';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../../media-platform/webproxy';
import { AxiosError } from 'axios';
import { errorCode } from '../../media-platform/errorCode';
import { BaseResult } from '@/media-platform/baseResult';

const buildShipinhaoMessageMediaInfo = (mediaType: number, mediaParams?: Record<string, any>): MessageMediaInfo => ({
  mediaType: mediaType == 3 ? 'image' : 'text',
  needParse: mediaType !== 1,
  mediaParams,
});

/**
 * 获取视频号 获取历史消息和对话列表
 * @param task
 * @param finderUserName
 * @param dataBackEvent
 */
export const getShipinhaoMessage = async (
  task: DataSyncTaskItem,
  finderUserName: string,
  dataBackEvent: EventEmitter,
  //taskProgressEvent?: EventEmitter,
): Promise<void> => {
  try {
    //const now = new Date();
    //const maxPage = task.maxPage ? task.maxPage : 5;
    //const minDate = task.minDateTime ? task.minDateTime : new Date(new Date().setDate(now.getDate() - 7));
    //const minDateTimeStamp = minDate.getTime();
    const messageSeesionIdList = new Set<string>();

    //获取作者信息
    if (!finderUserName) {
      const userInfo = await getShipinhaoUserInfo(task.accountCookieStr, task.proxy);
      if (userInfo?.data?.finderUser?.finderUsername) {
        finderUserName = userInfo.data.finderUser.finderUsername;
      }
    }

    //获取历史消息列表,对话列表需要消息列表.........
    let webProxy;
    if (task.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(task.proxy);
    }
    const userMessageHistoryList = await getShipinhaoMessageListResponse(
      task.accountCookieStr,
      finderUserName,
      '',
      webProxy,
    );
    if (userMessageHistoryList?.data?.msg?.length > 0) {
      const backMessageList: Array<MessageBackItem> = [];
      for (const msgObj of userMessageHistoryList?.data?.msg) {
        const newItem = {
          platform: Platforms.ShiPinHao,
          accountId: task.accountId,
          messageId: msgObj.svrMsgId,
          content: msgObj.msgType === 3 ? '' : msgObj.textMsg?.content ?? '',
          timestamp: msgObj.ts * 1000,
          messageUserId: msgObj.fromUsername,
          messageOwnerUserId: finderUserName,
          isAuthor: !msgObj.fromUsername.includes(msgObj.sessionId),
          messageType: msgObj.msgType === 3 ? MessageType.image : MessageType.text,
          mediaInfo: buildShipinhaoMessageMediaInfo(
            msgObj.msgType,
            msgObj.msgType === 3
              ? {
                  _log_finder_id: finderUserName,
                  imgMsg: msgObj.imgMsg,
                  rawContent: '', // msgObj.rawContent,
                  timestamp: msgObj.ts,
                }
              : undefined,
          ),
          //raw: msgObj,
        };
        backMessageList.push(newItem);

        messageSeesionIdList.add(msgObj.sessionId);
      }

      //这里暂不上传数据，避免新的会话，服务端还没有会话/用户数据
      //dataBackEvent.emit(SyncEventName.msg_data_back, backMessageList);

      //拿到会话列表，请求详细的会话数据
      const sessionList = await getShipinhaoMessageSessionDetailResponse(
        task.accountCookieStr,
        finderUserName,
        [...messageSeesionIdList],
        webProxy,
      );
      if (sessionList?.data?.sessionInfo?.length) {
        const backList: Array<MessageUserBackItem> = [];
        for (const item of sessionList?.data?.sessionInfo) {
          const newItem = {
            platform: Platforms.ShiPinHao,
            accountId: task.accountId,
            messageUserId: item.username,
            messageUserName: item.nickname,
            messageUserAvatar: item.headImgUrl,
            messageOwnerId: finderUserName,
            sessionId: item.sessionId,
            raw: item,
          };
          backList.push(newItem);
          // if (item.sixin_chat.last_msg_ts < minDateTimeStamp) {
          //   isEnd = true;
          //   break;
          // }
        }
        dataBackEvent.emit(SyncEventName.msgUser_data_back, backList);
        await Task.Delay(1500);
        dataBackEvent.emit(SyncEventName.msg_data_back, backMessageList);
      }
    } else {
      console.log(finderUserName);
    }
  } catch (e) {
    console.error('获取私信数据异常', e);
  }
};

export const getShiPinHaoMessageConversationList = async (
  cookie: string,
  nextPage?: string,
  finderUserName?: string,
  accountId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageConversationListInfoResponse> => {
  const result: MessageConversationListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];

  try {
    if (!finderUserName) {
      const userInfo = await getShipinhaoUserInfo(cookie, proxy);
      if (userInfo?.data?.finderUser?.finderUsername) {
        finderUserName = userInfo.data.finderUser.finderUsername;
      } else {
        result.code = userInfo?.code ?? -1;
        result.msg = userInfo?.msg;
        return result;
      }
    }
    // let webProxy;
    // if (proxy?.serverAdd) {
    //   webProxy = createKuaiProxyAgent(proxy);
    // }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const msgRe = await getShipinhaoMessageListResponse(cookie, finderUserName, '', webProxy);

    result.code = msgRe?.errCode ?? -1;
    result.msg = msgRe?.errMsg ?? '';
    result.nextPage = msgRe?.data?.cookie;
    if (!msgRe?.data?.msg?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取消息对话失败:${msgRe?.errMsg ?? ''}` : '';
    } else {
      const sessionMap: Array<string> = [];
      for (const item of msgRe?.data?.msg) {
        if (sessionMap.includes(item.sessionId)) {
          continue;
        }
        const cov = {
          platform: Platforms.ShiPinHao,
          accountId: accountId ?? '',
          messageUserId: '',
          messageOwnerId: '',
          messageUserName: '',
          messageUserAvatar: '',
          sessionId: item.sessionId?.toString() ?? '',
          secSessionId: '',
          sessionType: item.sessionType === 3 ? SessionType.friend : SessionType.stranger,
        };
        sessionMap.push(cov.sessionId ?? '');
        result.dataList.push(cov);
      }
      let userInfoList = await getShipinhaoMessageSessionDetailResponse(cookie, finderUserName, sessionMap, webProxy);
      if (sessionMap?.length > 0 && !userInfoList?.data?.sessionInfo?.length) {
        userInfoList = await getShipinhaoMessageSessionDetailResponse(cookie, finderUserName, sessionMap, webProxy);
      }
      if (userInfoList?.data?.sessionInfo?.length) {
        for (const user of userInfoList?.data?.sessionInfo) {
          const tmpUser = result.dataList.find((x) => x.sessionId === user.sessionId);
          if (tmpUser) {
            tmpUser.messageUserAvatar = user.headImgUrl;
            tmpUser.messageUserName = user.nickname;
            tmpUser.messageUserId = user.username;
            tmpUser.secSessionId = tmpUser.messageUserId;
          }
        }
        result.code = userInfoList?.errCode ?? -1;
        result.msg = userInfoList?.errMsg;
        if (result.code !== 0) {
          result.dataList = [];
        }
      } else {
        result.code = userInfoList?.errCode ?? -1;
        result.msg = userInfoList?.errMsg ?? '';
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export const getShiPinHaoMessageConversationInfo = async (
  cookie: string,
  sessionId: string,
  sessionShortId: string,
  messageUserId: string,
  finderUserName?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };

  try {
    if (!finderUserName) {
      const userInfo = await getShipinhaoUserInfo(cookie, proxy);
      if (userInfo?.data?.finderUser?.finderUsername) {
        finderUserName = userInfo.data.finderUser.finderUsername;
      } else {
        result.code = userInfo?.code ?? -1;
        result.msg = userInfo?.msg;
        return result;
      }
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoList = await getShipinhaoMessageSessionDetailResponse(cookie, finderUserName, [sessionId], webProxy);

    result.code = userInfoList?.errCode ?? -1;
    if (result.code != 0) {
      result.msg = userInfoList?.errMsg ?? '获取对话用户信息失败';
      return result;
    }
    if (userInfoList?.data?.sessionInfo?.length) {
      const user = userInfoList?.data?.sessionInfo?.find((x) => x.sessionId === sessionId);
      if (user) {
        result.data = {
          platform: Platforms.ShiPinHao,
          accountId: '',
          messageUserId: user.username,
          messageUserName: user.nickname,
          messageUserAvatar: user.headImgUrl,
          messageOwnerId: '',
          sessionId: sessionId,
          secSessionId: user.username,
          sessionType: SessionType.stranger,
        };
        result.code = 0;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};
export const getShiPinHaoNewMessageList = async (
  cookie: string,
  nextPage?: string,
  finderUserName?: string,
  accountId?: string,
  sessionId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageListInfoResponse> => {
  const result: MessageListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  if (!nextPage) {
    //nextPage = Date.now().toString() + '000';
  }
  try {
    if (!finderUserName) {
      const userInfo = await getShipinhaoUserInfo(cookie, proxy);
      if (userInfo?.data?.finderUser?.finderUsername) {
        finderUserName = userInfo.data.finderUser.finderUsername;
      } else {
        result.code = userInfo?.code ?? -1;
        result.msg = userInfo?.msg;
        return result;
      }
    }
    // let webProxy;
    // if (proxy?.serverAdd) {
    //   webProxy = createKuaiProxyAgent(proxy);
    // }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const msgRe = await getShipinhaoMessageListResponse(cookie, finderUserName, nextPage, webProxy);

    result.code = msgRe?.errCode ?? -1;
    result.msg = msgRe?.errMsg ?? '';
    result.nextPage = msgRe?.data?.cookie;
    if (!msgRe?.data?.msg?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取新消息失败:${msgRe?.errMsg ?? ''}` : '';
    } else {
      for (const item of msgRe?.data?.msg) {
        if (sessionId && item.sessionId !== sessionId) {
          continue;
        }
        //暂时过滤image类型
        const cov: MessageBackItem = {
          platform: Platforms.ShiPinHao,
          accountId: accountId ?? '',
          messageId: item.svrMsgId?.toString() ?? '',
          content: '',
          sessionId: item?.sessionId?.toString(),
          secSessionId: '',
          timestamp: Number(item.ts) * 1000,
          messageUserId: item.fromUsername,
          messageOwnerUserId: finderUserName,
          isAuthor: item.fromUsername === finderUserName,
          mediaInfo: buildShipinhaoMessageMediaInfo(
            item.msgType,
            item.msgType === 3
              ? {
                  _log_finder_id: finderUserName,
                  imgMsg: item.imgMsg,
                  rawContent: '', //item.rawContent,
                  timestamp: item.ts,
                }
              : undefined,
          ),
          fromUserId: item.fromUsername,
          toUserId: item.toUsername,
        };
        // if (cov?.isAuthor) {
        //   cov.messageUserId = '';
        // }
        if (item.sessionType == 3) {
          cov.sessionType = SessionType.friend;
        } else {
          cov.sessionType = SessionType.stranger;
        }
        if (item.msgType === 1) {
          cov.messageType = MessageType.text;
          cov.content = item.textMsg?.content ?? '';
        } else if (item.msgType === 3) {
          cov.messageType = MessageType.image;
          //item.rawContent
          //加密数据，需要解密
        }
        result.dataList.push(cov);
      }
      result.code = 0;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 * 获取单条新消息(用于WebSocket通知后)
 * @param cookie HTTP Cookie
 * @param cursorCookie 游标cookie(从上次调用返回的nextPage)
 * @param finderUserName 用户名
 * @param accountId 账号ID
 */
export const getShiPinHaoNewMsg = async (
  cookie: string,
  cursorCookie: string,
  finderUserName?: string,
  accountId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageListInfoResponse> => {
  const result: MessageListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];

  try {
    if (!finderUserName) {
      const userInfo = await getShipinhaoUserInfo(cookie, proxy);
      if (userInfo?.data?.finderUser?.finderUsername) {
        finderUserName = userInfo.data.finderUser.finderUsername;
      } else {
        result.code = userInfo?.code ?? -1;
        result.msg = userInfo?.msg;
        return result;
      }
    }

    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const msgRe = await getShipinhaoNewMsg(cookie, finderUserName, cursorCookie, webProxy);

    result.code = msgRe?.errCode ?? -1;
    result.msg = msgRe?.errMsg ?? '';
    result.nextPage = msgRe?.data?.cookie; // 返回新的cookie用于下次调用

    if (!msgRe?.data?.msg?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取新消息失败:${msgRe?.errMsg ?? ''}` : '';
    } else {
      for (const item of msgRe?.data?.msg) {
        const cov: MessageBackItem = {
          platform: Platforms.ShiPinHao,
          accountId: accountId ?? '',
          messageId: item.svrMsgId?.toString() ?? '',
          content: '',
          sessionId: item?.sessionId?.toString(),
          secSessionId: '',
          timestamp: Number(item.ts) * 1000,
          messageUserId: item.fromUsername,
          messageOwnerUserId: finderUserName,
          isAuthor: item.fromUsername === finderUserName,
          mediaInfo: buildShipinhaoMessageMediaInfo(
            item.msgType,
            item.msgType === 3
              ? {
                  _log_finder_id: finderUserName,
                  imgMsg: item.imgMsg,
                  rawContent: '', //item.rawContent,
                  timestamp: item.ts,
                }
              : undefined,
          ),
          fromUserId: item.fromUsername,
          toUserId: item.toUsername,
        };
        // if (cov?.isAuthor) {
        //   cov.messageUserId = '';
        // }
        if (item.sessionType == 3) {
          cov.sessionType = SessionType.friend;
        } else {
          cov.sessionType = SessionType.stranger;
        }
        if (item.msgType === 1) {
          cov.messageType = MessageType.text;
          cov.content = item.textMsg?.content ?? '';
        } else if (item.msgType === 3) {
          cov.messageType = MessageType.image;
          //item.rawContent
          //加密数据，需要解密
        }
        result.dataList.push(cov);
      }
      result.code = 0;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface ShipinhaoParseMediaMessageRequest {
  mediaType?: number;
  mediaParams?: Record<string, any>;
  imgMsg?: {
    aeskey: string;
    url: string;
    [key: string]: any;
  };
  rawContent?: string;
  timestamp?: string | number;
  outputType?: 'url' | 'base64';
}

export interface ShipinhaoParseMediaMessageData {
  mediaType: 'image' | 'text' | 'video';
  outputType: 'url' | 'base64';
  url?: string;
  base64?: string;
  ext?: string;
  contentType?: string;
  fileName?: string;
}

export interface ShipinhaoParseMediaMessageResponse extends BaseResult {
  data?: ShipinhaoParseMediaMessageData;
}

const getShipinhaoMediaContentType = (ext?: string): string | undefined => {
  if (!ext) {
    return undefined;
  }

  const lowerExt = ext.toLowerCase();
  if (lowerExt === 'jpg' || lowerExt === 'jpeg') {
    return 'image/jpeg';
  }
  if (lowerExt === 'png') {
    return 'image/png';
  }
  if (lowerExt === 'gif') {
    return 'image/gif';
  }
  if (lowerExt === 'webp') {
    return 'image/webp';
  }
  if (lowerExt === 'bmp') {
    return 'image/bmp';
  }
  if (lowerExt === 'mp4') {
    return 'video/mp4';
  }
  if (lowerExt === 'pdf') {
    return 'application/pdf';
  }

  return undefined;
};

const getShipinhaoParseMediaParams = (mediaInfo: ShipinhaoParseMediaMessageRequest): Record<string, any> => {
  if (mediaInfo.mediaParams && typeof mediaInfo.mediaParams === 'object') {
    return mediaInfo.mediaParams;
  }

  return {
    ...(mediaInfo.imgMsg ?? {}),
    rawContent: '', //mediaInfo.rawContent,
    timestamp: mediaInfo.timestamp,
  };
};

const getShipinhaoParseMediaOutputType = (
  outputType: 'url' | 'base64' | undefined,
  urlValue: string,
  base64Value: string,
): 'url' | 'base64' => {
  if (outputType === 'url') {
    return urlValue ? 'url' : 'base64';
  }

  if (outputType === 'base64') {
    return base64Value ? 'base64' : 'url';
  }

  return urlValue ? 'url' : 'base64';
};

export const parseShipinhaoMessageMediaResponse = async (
  cookie: string,
  finderName: string,
  mediaInfo: ShipinhaoParseMediaMessageRequest,
  proxy?: KuaiDaiLiProxy,
): Promise<ShipinhaoParseMediaMessageResponse> => {
  const mediaParams = getShipinhaoParseMediaParams(mediaInfo);
  const mediaType = Number(mediaInfo.mediaType ?? (mediaParams.mediaType === 'image' ? 3 : 1));

  const result: ShipinhaoParseMediaMessageResponse = {
    code: 0,
    msg: '',
    data: {
      mediaType: 'image',
      outputType: 'base64',
    },
  };

  try {
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const url = `https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/private-msg/get-media-info?_aid=${Guid.NewGuid().toString()}&_rid=${Guid.NewGuid().toString()}&_pageUrl=https:%2F%2Fchannels.weixin.qq.com%2Fmicro%2Finteraction%2Fprivate_msg`;
    const header = {
      referer: 'https://channels.weixin.qq.com/micro/interaction/private_msg',
      cookie: cookie,
      Origin: 'https://channels.weixin.qq.com',
    };

    const postData = {
      mediaType,
      imgMsg: mediaParams.imgMsg ?? mediaParams,
      rawContent: (typeof mediaParams.rawContent === 'string' ? mediaParams.rawContent : mediaInfo.rawContent) ?? '',
      timestamp: (mediaParams.timestamp ?? mediaInfo.timestamp ?? Date.now()).toString(),
      _log_finder_uin: null,
      _log_finder_id: mediaParams?._log_finder_id ?? finderName,
      rawKeyBuff: null,
      pluginSessionId: null,
      scene: 7,
      reqScene: 7,
    };

    const response = await $http.post(url, postData, {
      headers: header,
      httpAgent: webProxy,
      httpsAgent: webProxy,
    });
    const responseData = response.data as {
      errCode?: number;
      errMsg?: string;
      data?: {
        baseResp?: { errcode?: number };
        imgContent?: string;
        ext?: string;
        [key: string]: any;
      };
    };

    result.code = responseData?.errCode ?? -1;
    result.msg = responseData?.errCode === 0 ? '' : responseData?.errMsg ?? '解析媒体内容失败';

    const mediaData = responseData?.data ?? {};

    result.data = {
      mediaType: 'image',
      outputType: 'base64',
      base64: `data:image/${mediaData.ext};base64,${mediaData.imgContent}`,
      ext: mediaData.ext ?? '',
      contentType: mediaData.ext,
    };

    if (!result.data.url && !result.data.base64) {
      result.code = -1;
      result.msg = result.msg || '未获取到可解析的媒体内容';
    }
  } catch (e) {
    result.code = -1;
    result.msg = '解析媒体内容失败，请稍后重试';
  }

  return result;
};

export const parseShipinhaoMessageImageResponse = async (
  cookie: string,
  finderName: string,
  mediaParams: Record<string, any>,
  outputType?: 'url' | 'base64',
  proxy?: KuaiDaiLiProxy,
): Promise<ShipinhaoParseMediaMessageResponse> => {
  return await parseShipinhaoMessageMediaResponse(
    cookie,
    finderName,
    {
      mediaType: 3,
      mediaParams,
      outputType,
    },
    proxy,
  );
};

/**
 *
 * @param cookie
 * @param finderUserName 当前用户信息中finderUserName
 * @param receiverUserId 消息会话的对方用户id，类似finderUserName
 * @param sessionId 接受消息的会话id
 * @param typeStr 类型 TEXT:文字或者表情，表情需要转为字符串；IMAGE:图片
 * @param msgContent 文字消息内容
 * @param image 当发送图片消息时，图片数据
 * @param proxy 代理配置
 */
export const sendShipinhaoMessage = async (
  cookie: string,
  finderUserName: string,
  receiverUserId: string,
  sessionId: string,
  typeStr: 'TEXT' | 'IMAGE',
  msgContent: string,
  image?: ImageInfo,
  proxy?: KuaiDaiLiProxy,
): Promise<SendMessageResultOutPut> => {
  const result: SendMessageResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    if (!finderUserName) {
      const userInfo = await getShipinhaoUserInfo(cookie, proxy);
      if (!userInfo?.data?.finderUser?.finderUsername) {
        result.code = userInfo.code ?? -1;
        result.msg = userInfo.msg ?? '获取用户信息失败';
        return result;
      }
      finderUserName = userInfo.data.finderUser.finderUsername;
    }
    let contentStr = msgContent;
    if (typeStr === 'IMAGE') {
      contentStr = '';
      if (!image?.pathOrUrl) {
        result.msg = '没有图片信息';
        result.code = -1;
        return result;
      }
      const imageData = await readImageData(image.pathOrUrl, 'jpeg');
      if (!imageData.data) {
        result.msg = `读取图片失败:${image.pathOrUrl}`;
        result.code = -1;
        return result;
      }
      const uploadRe = await uploadShipinhaoMessageImageResponse(
        cookie,
        finderUserName,
        receiverUserId,
        imageData?.data,
        webProxy,
      );
      if (!uploadRe?.data?.imgMsg) {
        result.code = -1;
        result.msg = `图片上传失败 ${uploadRe?.errMsg}`;
        return result;
      }
      contentStr = JSON.stringify(uploadRe.data.imgMsg);
      //上传图片处理图片信息
    } else {
      contentStr = JSON.stringify({ content: contentStr });
    }
    const sendMsgStatusResult = await sendShipinhaoMessageResponse(
      cookie,
      receiverUserId,
      finderUserName,
      sessionId,
      typeStr === 'TEXT' ? 1 : 3,
      JSON.parse(contentStr),
      webProxy,
    );

    result.code = sendMsgStatusResult?.errCode ?? -1;
    result.msg = sendMsgStatusResult?.errMsg ?? '';
    if (!sendMsgStatusResult?.data?.svrMsgId) {
      result.code = -1;
      result.msg = `发送失败:${sendMsgStatusResult.errMsg ?? ''}`;
    } else {
      result.messageId = sendMsgStatusResult.data.svrMsgId;
      result.raw = sendMsgStatusResult.data;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};
