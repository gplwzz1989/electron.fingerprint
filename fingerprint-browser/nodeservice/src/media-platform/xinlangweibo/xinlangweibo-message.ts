import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { ImageInfo, MessageConversationListInfoResponse, MessageListInfoResponse } from '@/media-platform';

import {
  MessageBackItem,
  MessageType,
  Platforms,
  SendMessageResultOutPut,
  SessionType,
} from '@/service/datasync-service-manager';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import {
  getWeiboConversationInfoResponse,
  getWeiboConversationListResponse,
  getWeiboNewMsgResponse,
  sendWeiboMessageResponse,
} from '@/media-platform/xinlangweibo/xinlangweibo-message.service';
import { BaseResult } from '@/media-platform/baseResult';
import { uploadImage } from '@/media-platform/xinlangweibo/xinlangweibo-base.service';

export const getWeiBoMessageConversationList = async (
  cookie: string,
  accountId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageConversationListInfoResponse> => {
  const result: MessageConversationListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];

  try {
    // let webProxy;
    // if (proxy?.serverAdd) {
    //   webProxy = createKuaiProxyAgent(proxy);
    // }
    const msgRe = await getWeiboConversationListResponse(cookie);

    result.code = msgRe?.error_code ?? 0;
    result.msg = msgRe?.error ?? '';
    if (!msgRe?.contacts?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取消息对话失败:${msgRe?.error ?? ''}` : '';
    } else {
      const sessionMap: Array<string> = [];
      for (const item of msgRe?.contacts) {
        const sid = item.user.idStr ?? item.message?.sender_id?.toString() ?? item.message.sender?.idstr;
        if (sessionMap.includes(sid) || !sid || item.user.type === 12) {
          continue;
        }
        const cov = {
          platform: Platforms.XinLangWeiBo,
          accountId: accountId ?? '',
          messageUserId: sid,
          messageOwnerId: '',
          messageUserName: item.user?.name ?? item.message?.sender_screen_name ?? item.message?.sender?.screen_name,
          messageUserAvatar: item.user?.avatar_large ?? item.message?.sender?.profile_image_url,
          sessionId: sid,
          secSessionId: '',
          sessionType: !item?.message?.sender ? SessionType.friend : SessionType.stranger,
        };
        sessionMap.push(cov.sessionId ?? '');
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

export const getWeiBOMessageConversationInfo = async (
  cookie: string,
  sessionId: string,
  accountId: string,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };

  try {
    const userInfoList = await getWeiboConversationInfoResponse(cookie, sessionId, '0', 1);

    result.code = userInfoList?.error_code ?? 0;
    if (result.code != 0) {
      result.msg = userInfoList.error ?? '获取对话用户信息失败';
      return result;
    }
    if (userInfoList?.direct_messages?.length) {
      const user = userInfoList.direct_messages[0];
      if (user) {
        result.data = {
          platform: Platforms.XinLangWeiBo,
          accountId: accountId,
          messageUserId: user.sender_id?.toString() ?? user.sender.idstr,
          messageUserName: user.sender_screen_name ?? user.sender.screen_name ?? user.sender?.name,
          messageUserAvatar: user.sender?.avatar_large,
          messageOwnerId: '',
          sessionId: sessionId,
          secSessionId: '',
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

export const getWeiBoMessageListByConversation = async (
  cookie: string,
  sessionId: string,
  messageUserId: string,
  nextPage?: string,
  accountId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageListInfoResponse> => {
  const result: MessageListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  let cursor = nextPage;
  if (!cursor) {
    cursor = '0';
  }
  try {
    // let webProxy;
    // if (proxy?.serverAdd) {
    //   webProxy = createKuaiProxyAgent(proxy);
    // }

    const decodeRe = await getWeiboConversationInfoResponse(cookie, sessionId, cursor, 15);
    result.code = decodeRe?.error_code ?? 0;
    result.msg = decodeRe?.error ?? '';
    const body = decodeRe;
    if (!body?.direct_messages?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取对话消息失败:${decodeRe?.error ?? ''}` : '';
    } else {
      if (body.direct_messages?.length > 14) {
        result.nextPage = (body?.direct_messages[body.direct_messages.length - 1].id - 1).toString();
      }

      for (const item of body?.direct_messages) {
        const cov: MessageBackItem = {
          platform: Platforms.XinLangWeiBo,
          accountId: accountId ?? '',
          messageId: item.idstr ?? item.id?.toString() ?? '',
          content: item.text,
          sessionId: sessionId,
          timestamp: new Date(item.created_at).getTime(),
          messageUserId: item.recipient.idstr,
          sessionType: SessionType.friend,
          messageType: MessageType.text,
          messageOwnerUserId: item.sender.idstr,
        };
        if (!item.att_ids?.length) {
          cov.messageType = MessageType.text;
        } else {
          cov.messageType = MessageType.image;
          cov.imgUrl = `https://upload.api.weibo.com/2/mss/msget_thumbnail?fid=${item.att_ids[0]}&high=240&width=240&size=&source=209678993&imageType=origin`;
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

export const getWeiBoNewMessageList = async (
  cookie: string,
  id: string,
  clientId: string,
  accountId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageListInfoResponse> => {
  const result: MessageListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  if (!id) {
    id = '1';
  }
  try {
    // let webProxy;
    // if (proxy?.serverAdd) {
    //   webProxy = createKuaiProxyAgent(proxy);
    // }
    const msgRe = await getWeiboNewMsgResponse(cookie, id, clientId);

    result.code = msgRe?.length > 1 ? 0 : -1;

    if (!msgRe?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取新消息失败` : '';
    } else {
      for (const item of msgRe) {
        const cov: MessageBackItem = {
          platform: Platforms.XinLangWeiBo,
          accountId: accountId ?? '',
          messageId: item.data?.info?.dmid?.toString() ?? '',
          content: item.data?.info?.content ?? '',
          sessionId: item?.data?.info?.fromuid?.toString(),
          secSessionId: '',
          timestamp: item.data.info.time,
          messageUserId: item?.data?.info?.fromuid?.toString(),
          messageOwnerUserId: '',
        };
        if (item.data?.ext?.is_first_send == 0) {
          cov.sessionType = SessionType.friend;
        } else {
          cov.sessionType = SessionType.stranger;
        }
        if (item.data.info.media_type === 0) {
          cov.messageType = MessageType.text;
        } else if (item.data.info.media_type === 1) {
          cov.messageType = MessageType.image;
          cov.imgUrl = `https://upload.api.weibo.com/2/mss/msget_thumbnail?fid=${item.data.info?.att_ids?.split(
            ',',
          )[0]}&high=240&width=240&size=&source=209678993&imageType=origin`;
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

export const sendWeiBoMessage = async (
  cookie: string,
  sessionId: string,
  typeStr: 'TEXT' | 'IMAGE',
  msgContent: string,
  clientId: string,
  accoundId: string,
  image?: ImageInfo,
  proxy?: KuaiDaiLiProxy,
): Promise<SendMessageResultOutPut> => {
  const result: SendMessageResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    let contentStr = msgContent;
    let imgId='';
    if (typeStr === 'IMAGE') {
      contentStr = '';
      if (!image?.pathOrUrl) {
        result.msg = '没有图片信息';
        result.code = -1;
        return result;
      }

      const uploadRe = await uploadImage(cookie, Number(accoundId), 1, '', image.pathOrUrl);
      if (!uploadRe?.pic?.pid) {
        result.code = -1;
        result.msg = `图片上传失败 ${uploadRe?.error_msg}`;
        return result;
      }
      imgId = uploadRe.pic.pid;
      //上传图片处理图片信息
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const sendMsgStatusResult = await sendWeiboMessageResponse(
      cookie,
      sessionId,
      contentStr,
      imgId,
      webProxy,
      clientId,
    );

    result.code = sendMsgStatusResult?.error_code ?? 0;
    result.msg = sendMsgStatusResult?.error ?? '';
    if (!sendMsgStatusResult?.idstr) {
      result.code = result?.code ?? -1;
      result.msg = `发送失败:${sendMsgStatusResult.error ?? ''}`;
    } else {
      result.messageId = sendMsgStatusResult.idstr;
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
