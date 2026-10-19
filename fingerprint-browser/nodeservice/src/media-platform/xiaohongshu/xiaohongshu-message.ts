import {
  ImageInfo,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
  PlatformAuthorInfo,
} from '../baseModel';
import {
  getXiaohongshuMessageListResponse,
  getXiaohongshuMessageUserListResponse,
  getXiaohongshuProMsgImageArgResponse,
  getXiaohongshuProUserInfoResponse,
  sendXiaohongshuProMessageResponse,
  uploadXiaohongshuProMsgImageResponse,
  XiaohongshuMessageUserInfo,
} from './xiaohongshu-message.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  DataSyncTaskItem,
  MessageBackItem,
  MessageType,
  MessageUserBackItem,
  Platforms,
  SendMessageResultOutPut,
  SessionType,
  SyncEventName,
} from '../../service/datasync-service-manager';
import { EventEmitter } from 'events';
import { readImageData, Task } from '@/utils';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../../media-platform/webproxy';

/**
 * 获取小红书专业号创作者信息
 * @param cookie
 * @return yixiaoerId是账号的普通账号id，和小红书个人主页id一样，如果需要专业号id，需使用raw.b_user_id
 */
export const getXiaohongshuProUserInfo = async (cookie: string): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: 'ok',
  };

  try {
    const userInfoResult = await getXiaohongshuProUserInfoResponse(cookie);

    result.code = userInfoResult?.code ?? -1;
    result.msg = userInfoResult?.msg ?? '获取用户信息失败';
    result.raw = userInfoResult?.data;
    result.yixiaoerId = userInfoResult?.data?.b_user_id; //普通账号id，b_user_id是专业号id，私信需要
    result.yixiaoerName = userInfoResult?.data?.name;
    result.yixiaoerImageUrl = userInfoResult?.data?.avatar_url;
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
 * 发送私信
 * @param cookie
 * @param receiverUserId 接受消息的用户id
 * @param image  发送类型为IMAGE图片消息时，图片信息
 * @param porch_user_id 当前用户的userId（b_user_id），注意不是yixiaoerId(c_user_id)
 * @param typeStr 消息类型 'TEXT'：纯文本消息（表情也是文本） | 'IMAGE':图片消息，图片消息的content是json字符串 | 'note':作品消息  ，还有商品和获客工具暂未
 * @param msgContent 当类型为TEXT时，文本消息内容为纯文本（包含文本消息和表情消息）；当为note时，文本消息为作品id；
 * @param proxy 发送消息使用的代理，只有发送才会使用，其他步骤不使用
 */
export const sendXiaohongshuProMessage = async (
  cookie: string,
  receiverUserId: string,
  typeStr: 'TEXT' | 'IMAGE' | 'note',
  msgContent: string,
  image?: ImageInfo,
  porch_user_id: string = '',
  proxy?: KuaiDaiLiProxy,
): Promise<SendMessageResultOutPut> => {
  const result: SendMessageResultOutPut = {
    code: 0,
    msg: 'ok',
  };

  try {
    let contentStr = msgContent;
    if (typeStr === 'IMAGE') {
      contentStr = '';
      const upArgs = await getXiaohongshuProMsgImageArgResponse(cookie);
      if (upArgs?.data?.upload_temp_permits?.length > 0) {
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
        const uploadRe = await uploadXiaohongshuProMsgImageResponse(
          imageData?.data,
          upArgs.data.upload_temp_permits[0],
        );
        if (!uploadRe) {
          result.code = -1;
          result.msg = '图片上传失败';
          return result;
        }
        contentStr = JSON.stringify({
          link: {
            cloudType: upArgs.data.upload_temp_permits[0].cloud_type,
            bizName: 'cs',
            scene: 'feeva_img',
            fileId: upArgs.data.upload_temp_permits[0].file_ids[0],
            preViewUrl: uploadRe,
          },
          size: { width: image.width ?? 300, height: image.height ?? 300 },
        });
      } else {
        result.code = upArgs?.code ?? -1;
        result.msg = upArgs?.msg;
        return result;
      }
      //上传图片处理图片信息
    }
    if (!porch_user_id) {
      const userInfo = await getXiaohongshuProUserInfoResponse(cookie);
      if (!userInfo?.data?.b_user_id) {
        result.code = userInfo?.code ?? -1;
        result.msg = userInfo?.msg ?? '';
        return result;
      }
      porch_user_id = userInfo.data.b_user_id;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userStatusResult = await sendXiaohongshuProMessageResponse(
      cookie,
      porch_user_id,
      receiverUserId,
      typeStr,
      contentStr,
      webProxy,
    );

    result.code = userStatusResult?.code ?? -1;
    result.msg = userStatusResult.msg ?? '';
    if (!userStatusResult?.data?.message_id) {
      result.code = -1;
      result.msg = `发送失败:${userStatusResult.msg ?? ''}`;
    } else {
      result.messageId = userStatusResult.data.message_id;
      result.raw = userStatusResult.data;
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
 * 获取评论
 * @param task
 * @param dataBackEvent
 * @param taskProgressEvent
 * @param porch_user_id 用户专业号id
 * @param userId
 */
export const getXiaohongshuProMessage = async (
  task: DataSyncTaskItem,
  dataBackEvent: EventEmitter,
  taskProgressEvent: EventEmitter,
  porch_user_id: string = '',
  userId: string = '',
): Promise<void> => {
  try {
    const now = new Date();
    const maxPage = task.maxPage ? task.maxPage : 5;
    const minDate = task.textMinDateTime ? task.textMinDateTime : new Date(new Date().setDate(now.getDate() - 7));
    const minDateTimeStamp = minDate.getTime();
    const messageUserList: Array<XiaohongshuMessageUserInfo> = [];

    //获取用户信息
    if (!porch_user_id || !userId) {
      const userInfo = await getXiaohongshuProUserInfoResponse(task.accountCookieStr);
      porch_user_id = userInfo?.data?.b_user_id;
      userId = userInfo?.data?.c_user_id;
      if (!porch_user_id || !userId) {
        return;
      }
    }
    //获取对话列表，确定要抓取评论的内容范围
    const userLimit = 80; //对话单页数量，后续考虑作为入参
    for (let i = 0; i < maxPage; i++) {
      const tmpMessageUserList = await getXiaohongshuMessageUserListResponse(
        task.accountCookieStr,
        porch_user_id,
        userLimit,
      );
      if (tmpMessageUserList?.data?.chat_list?.length) {
        let isEnd = false;

        const backList: Array<MessageUserBackItem> = [];
        for (const item of tmpMessageUserList.data.chat_list) {
          messageUserList.push(item);
          const newItem = {
            platform: Platforms.XiaoHongShu,
            accountId: task.accountId,
            messageUserId: item.sixin_chat.user_id,
            messageUserName: item.sixin_chat.nickname,
            messageUserAvatar: item.sixin_chat.avatar,
            messageOwnerId: userId,
            sessionId: item.session?.session_id?.toString(),
            raw: item,
          };
          backList.push(newItem);
          if (item.sixin_chat.last_msg_ts < minDateTimeStamp) {
            isEnd = true;
            break;
          }
        }
        //每一页上报一次内容数据
        dataBackEvent.emit(SyncEventName.msgUser_data_back, backList);
        if (isEnd || tmpMessageUserList.data.chat_list.length < userLimit) {
          break;
        }
      } else {
        break;
      }
    }
    if (messageUserList.length <= 0) {
      return;
    }

    taskProgressEvent.emit(SyncEventName.msgUser_progress, `0/${messageUserList.length}`);
    //开始遍历获取对话下的私信
    let n = 0;
    for (const item of messageUserList) {
      n++;
      //对话处理进度
      taskProgressEvent.emit(SyncEventName.msgUser_progress, `${n}/${messageUserList.length}`);

      //私信
      const msgLimit = 20; //单页数量，后续考虑作为入参
      let lastSoreId = 0;
      for (let i = 0; i < task.maxPage; i++) {
        const tmpMessage = await getXiaohongshuMessageListResponse(
          task.accountCookieStr,
          porch_user_id,
          item.sixin_chat.user_id,
          lastSoreId,
          msgLimit,
        );
        await Task.Delay(1000);
        let isCmtEnd = false;
        if (tmpMessage?.data?.messages?.length > 0) {
          lastSoreId = tmpMessage.data.messages[tmpMessage.data.messages.length - 1].sixin_message.store_id;
          const backMessageList: Array<MessageBackItem> = [];
          for (const msgObj of tmpMessage.data.messages) {
            backMessageList.push({
              platform: Platforms.XiaoHongShu,
              accountId: task.accountId,
              messageId: msgObj.sixin_message.id,
              content: msgObj.sixin_message.content,
              timestamp: msgObj.sixin_message.created_at,
              messageUserId: item.sixin_chat.user_id,
              messageOwnerUserId: userId,
              raw: msgObj,
            });
            if (msgObj.sixin_message.created_at < minDateTimeStamp) {
              isCmtEnd = true;
              break;
            }
          }

          //每一页私信上报一次
          dataBackEvent.emit(SyncEventName.msg_data_back, backMessageList);
          if (isCmtEnd || tmpMessage.data.messages.length < msgLimit || backMessageList.length == 0) {
            break;
          }
        } else {
          break;
        }
      }
    }
  } catch (e) {
    console.error('获取私信数据异常', e);
  }
};

export const getXiaoHongShuProMessageConversationList = async (
  cookie: string,
  nextPage?: string,
  accountId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageConversationListInfoResponse> => {
  const result: MessageConversationListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];

  try {
    if (!accountId) {
      const userInfo = await getXiaohongshuProUserInfoResponse(cookie);
      if (userInfo?.data?.b_user_id) {
        accountId = userInfo?.data?.b_user_id;
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
    const msgRe = await getXiaohongshuMessageUserListResponse(cookie, accountId, 80, nextPage);

    result.code = msgRe?.code ?? -1;
    result.msg = msgRe?.msg ?? '';
    if (!msgRe?.data?.chat_list?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取消息对话失败:${msgRe?.msg ?? ''}` : '';
    } else {
      if (msgRe.data.chat_list.length > 79) {
        result.nextPage = msgRe.data.chat_list[msgRe.data.chat_list.length - 1].sixin_chat.last_msg_ts.toString();
      }

      for (const item of msgRe?.data?.chat_list) {
        const cov = {
          platform: Platforms.XiaoHongShu,
          accountId: accountId ?? '',
          messageUserId: item.sixin_chat?.user_id?.toString(),
          messageOwnerId: '',
          messageUserName: item.sixin_chat.nickname,
          messageUserAvatar: item?.sixin_chat.avatar,
          sessionId: item.sixin_chat?.user_id?.toString() ?? '',
          secSessionId: accountId,
          sessionType: item?.session?.is_replied ? SessionType.friend : SessionType.stranger,
        };

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

export const getXiaoHongShuProMessageListByConversation = async (
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
  let cursor = Number(nextPage);
  if (!cursor) {
    cursor = 0;
  }
  try {
    // let webProxy;
    // if (proxy?.serverAdd) {
    //   webProxy = createKuaiProxyAgent(proxy);
    // }

    const decodeRe = await getXiaohongshuMessageListResponse(cookie, accountId ?? '', messageUserId, cursor, 20);
    result.code = decodeRe?.code ?? -1;
    result.msg = decodeRe?.msg ?? '';
    const body = decodeRe;
    if (!body?.data?.messages?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取对话消息失败:${decodeRe?.msg ?? ''}` : '';
    } else {
      if (body.data?.messages?.length > 19) {
        result.nextPage = body?.data.messages[body.data.messages.length - 1].sixin_message?.store_id?.toString();
      }

      for (const item of body?.data.messages) {
        const cov: MessageBackItem = {
          platform: Platforms.XiaoHongShu,
          accountId: accountId ?? '',
          messageId: item.sixin_message.id ?? '',
          content: item.sixin_message.content,
          sessionId: sessionId,
          timestamp: Number(item.sixin_message.created_at) ?? Date.now(),
          messageUserId: messageUserId ?? '',
          sessionType: item.message_extension.sender_type === 1 ? SessionType.friend : SessionType.group,
          messageType: MessageType.text,
          messageOwnerUserId: '',
        };
        switch (item.sixin_message.message_type) {
          case 'TEXT':
            cov.messageType = MessageType.text;
            break;
          case 'IMAGE':
            cov.messageType = MessageType.image;
            break;
          case 'CARD':
            cov.messageType = MessageType.card;
            break;
          case 'EMOTION':
            cov.messageType = MessageType.emotion;
            break;
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
