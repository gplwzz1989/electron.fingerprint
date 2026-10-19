import crypto from 'crypto';
import * as protobuf from 'protobufjs/light';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import {
  MessageBackItem,
  MessageType,
  Platforms,
  SendMessageResultOutPut,
  SessionType,
} from '@/service/datasync-service-manager';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import Long from 'long';
import { encodeRequest } from '@/media-platform/douyin/private_msg/send_msg_build';
import {
  getDouYinMessageConversationListResponse,
  getDouYinMessageHistoryListResponse,
  getDouYinMessageNewConversationListResponse,
  getDouYinMessageNewListResponse,
  getDouYinMessageUserDetailResponse,
} from '@/media-platform/douyin/douyin-private-msg.service';
import {
  decodeResponse,
  MessagesPerUserInitV2ResponseBody,
  MessagesPerUserResponseBody,
} from '@/media-platform/douyin/private_msg/re_msg_decode';
import { ImageInfo, MessageConversationListInfoResponse, MessageListInfoResponse } from '@/media-platform';
import { getSdkToken } from '@/media-platform/douyin/douyin-base.service';
import { BaseResult } from '@/media-platform/baseResult';
import { sendDouyinPrivateMessage } from '@/media-platform/douyin/private_msg/douyin-message-sender';

// 必须让 protobuf 使用 long 库
protobuf.util.Long = Long;
protobuf.configure();
export const sendMsgReqSign = (
  security_sdk_s_sdk_pri_key: string,
  security_sdk_s_sdk_sign_data_key_token: string,
  msg: string,
  conversation_id: string,
  conversation_short_id: string,
):
  | {
      ts_sign: string;
      req_content: string;
      req_sign: string;
      token: string;
      sdk_cert: string;
    }
  | undefined => {
  try {
    const re: any = {};
    if (!security_sdk_s_sdk_sign_data_key_token) {
      return undefined;
    }
    const keyToken = JSON.parse(security_sdk_s_sdk_sign_data_key_token);
    const keyTokenData = JSON.parse(keyToken.data);
    if (!security_sdk_s_sdk_pri_key && !msg) {
      re.ts_sign = keyTokenData.ts_sign;
      re.token = keyTokenData.ticket;
      re.sdk_cert = Buffer.from(keyTokenData.client_cert).toString('base64');
      return re;
    }

    const priKey = JSON.parse(security_sdk_s_sdk_pri_key);

    const priKeyData: string = priKey.data?.toString()?.trim();
    let pk = '';
    if (priKeyData?.startsWith('{')) {
      const tmpData = JSON.parse(priKeyData);
      pk = tmpData.ec_privateKey;
    } else {
      pk = priKeyData;
    }

    // 将字符串转换为 Key 对象
    const privateKey = crypto.createPrivateKey(pk);

    // 签名数据
    const data = `content={"text":"${msg}","aweType":774}&conversation_id=${conversation_id}&conversation_short_id=${conversation_short_id}`;

    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    const signature = sign.sign(privateKey, 'base64');

    // return Buffer.from(reStr).toString('base64');
    return {
      ts_sign: keyTokenData.ts_sign,
      req_content: data,
      req_sign: signature,
      token: keyTokenData.ticket,
      sdk_cert: Buffer.from(keyTokenData.client_cert).toString('base64'),
    };
  } catch (e) {
    console.log(e);
    throw new Error('账号信息缺失，请重新授权此账号再试');
  }
  return undefined;
};

/**
 * 获取消息会话列表
 * @param cookie
 * @param localstorage
 * @param nextPage
 * @param accountId
 * @param sdkToken
 * @param proxy
 */
export const getDouYinMessageConversationList = async (
  cookie: string,
  localstorage: object,
  nextPage?: string,
  accountId?: string,
  sdkToken?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageConversationListInfoResponse> => {
  const result: MessageConversationListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  let cursor = Number(nextPage ?? 0) ?? 0;
  if (!cursor) {
    cursor = 0;
  }
  try {
    const requestObj = {
      headers: {
        aid_new: '',
        app_name: 'douyin_creator',
        'is-retry': '0',
      },
      headers_before_auth: true,
      body: {
        messages_per_user_init_v2_body: {
          cursor: {
            low: cursor, //翻页，每页10
            high: 0,
            unsigned: false,
          },
        },
      },
      cmd: 203,
      sequence_id: {
        low: 10001,
        high: 0,
        unsigned: false,
      },
      refer: 3,
      token: '',
      device_id: '',
      sdk_version: '1.3.0',
      build_number: 'f1e96de:master',
      inbox_type: 1,
      device_platform: 'douyin_creator',
      auth_type: 1,
      biz: 'douyin_creator',
      access: 'web_sdk',
    };
    const writer = encodeRequest(requestObj);
    const buffer = writer.finish();
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const sendReBuffer = await getDouYinMessageConversationListResponse(cookie, buffer, webProxy);

    const decodeRe = decodeResponse(sendReBuffer);
    result.code = decodeRe?.status_code ?? -1;
    const body = decodeRe?.body as { messages_per_user_init_v2_body: MessagesPerUserInitV2ResponseBody };
    if (!body?.messages_per_user_init_v2_body?.conversations?.length) {
      result.code = result?.code ?? -1;
      result.msg = result.code != 0 ? `获取失败:${decodeRe?.error_desc ?? ''}` : '';
    } else {
      if (body.messages_per_user_init_v2_body?.has_more) {
        result.nextPage = body.messages_per_user_init_v2_body.next_cursor?.toString();
      }
      const userMap: Array<string> = [];
      for (const item of body?.messages_per_user_init_v2_body?.conversations) {
        const cov = {
          platform: Platforms.DouYin,
          accountId: accountId ?? '',
          messageUserId: '',
          messageOwnerId: '',
          messageUserName: '',
          messageUserAvatar: '',
          sessionId: item.conversation_id ?? '',
          secSessionId: item.conversation_short_id?.toString() ?? '',
          sessionType: item.conversation_type === 1 ? SessionType.friend : SessionType.group,
        };
        if (item.conversation_type === 1) {
          if (accountId && !cov.sessionId?.includes(accountId)) {
            result.dataList = [];
            result.code = 400;
            return result;
          }
          if (accountId) {
            for (const user of item.first_page_participants?.participants) {
              if (user.user_id === accountId) {
                continue;
              } else {
                cov.messageUserId = user.sec_uid;
                break;
              }
            }
          } else {
            cov.messageUserId =
              item.first_page_participants?.participants?.length > 1
                ? item.first_page_participants?.participants[1]?.sec_uid
                : item.first_page_participants?.participants[0]?.sec_uid;
          }
          // if(cov.messageUserId==='MS4wLjABAAAAD6xhDbsKTwKbFSKbE5GjZ60IKR_n4HD9QzZ3hhlgdpo')
          // {
          //   console.log(cov);
          // }
          userMap.push(cov.messageUserId ?? '');
        } else {
          cov.messageUserId = item.conversation_core_info?.sec_owner;
          cov.messageUserName = item.conversation_core_info?.name;
          cov.messageUserAvatar = item.conversation_core_info?.icon;
        }
        result.dataList.push(cov);
      }
      if (!sdkToken) {
        sdkToken = await getSdkToken(cookie, 0, webProxy);
      }
      const userInfoList = await getDouYinMessageUserDetailResponse(cookie, userMap, sdkToken ?? '', webProxy);
      if (userInfoList?.user_list?.length) {
        for (const user of userInfoList?.user_list) {
          const tmpUser = result.dataList.find((x) => x.messageUserId === user.user_id && !x.messageUserName);
          if (tmpUser) {
            tmpUser.messageUserAvatar = user.user?.avatar_thumb?.url_list[0];
            tmpUser.messageUserName = user.user?.nickname;
          }
        }
      }
      if (userInfoList?.status_code === 8) {
        result.dataList = [];
        result.nextPage = undefined;
        result.data = undefined;
      }
      result.code = userInfoList?.status_code ?? -1;
      result.msg = userInfoList?.status_message;
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
 * 获取私信对话用户信息，不支持群聊
 * @param cookie
 * @param sessionId
 * @param sessionShortId
 * @param messageUserId
 * @param sdkToken
 * @param proxy
 */
export const getDouYinMessageConversationInfo = async (
  cookie: string,
  sessionId: string,
  sessionShortId: string,
  messageUserId: string,
  sdkToken?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };

  if (sessionId == sessionShortId) {
    result.code = 400;
    result.msg = '不支持群聊';
  }
  try {
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie, 0, webProxy);
    }
    if (!messageUserId) {
      result.code = 400;
      result.msg = '对话messageId不能为空';
      return result;
    }

    const userInfoList = await getDouYinMessageUserDetailResponse(cookie, [messageUserId], sdkToken ?? '', webProxy);

    result.code = userInfoList?.status_code ?? -1;
    if (result.code != 0) {
      result.msg = userInfoList?.status_msg ?? '获取对话用户信息失败';
    }
    if (userInfoList?.user_list?.length) {
      const user = userInfoList?.user_list?.find((x) => x.user_id === messageUserId);
      if (user) {
        result.data = {
          platform: Platforms.DouYin,
          accountId: '',
          messageUserId: messageUserId,
          messageUserName: user.user.nickname,
          messageUserAvatar: user.user.avatar_thumb?.url_list[0],
          messageOwnerId: '',
          sessionId: sessionId,
          secSessionId: sessionShortId,
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

/**
 *
 * @param cookie
 * @param localstorage
 * @param sessionId
 * @param sessionShortId
 * @param msgContent 消息内容，包含表情
 * @param sessionType
 * @param proxy
 * @param imageInfo
 */
export const sendDouYinMessage = async (
  cookie: string,
  localstorage: object,
  sessionId: string,
  sessionShortId: string,
  msgContent: string,
  sessionType?: SessionType,
  proxy?: KuaiDaiLiProxy,
  imageInfo?: ImageInfo,
  messageType?: MessageType,
  userId?: string,
): Promise<SendMessageResultOutPut> => {
  const result: SendMessageResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const storage = localstorage as Record<string, string | undefined>;
    const ticket = storage?.ticket?.trim() || storage?.conversation_ticket?.trim() || '';
    let covType = 0;
    if (sessionType) {
      covType = sessionType === SessionType.group ? 2 : 1;
    } else if (sessionId === sessionShortId) {
      covType = 2;
    } else if (sessionId?.includes(':')) {
      covType = 1;
    }

    if (covType === 0) {
      return { code: 400, msg: '未知的会话类型' };
    }
    return await sendDouyinPrivateMessage({
      cookie,
      sessionId,
      sessionShortId,
      text: msgContent,
      imageInfo,
      ticket,
      localstorage: storage,
      conversationType: covType,
      proxy,
      messageType,
      userId,
    });
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
 * 获取对话历史消息
 * @param cookie
 * @param localstorage
 * @param sessionId
 * @param sessionShortId
 * @param conversation_type
 * @param nextPage
 * @param accountId
 * @param proxy
 */
export const getDouYinMessageListByConversation = async (
  cookie: string,
  localstorage: object,
  sessionId: string,
  sessionShortId: string,
  conversation_type: number,
  nextPage?: string,
  accountId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageListInfoResponse> => {
  const result: MessageListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  if (!nextPage) {
    nextPage = '0';
  }
  try {
    const requestObj = {
      headers: {
        aid_new: '',
        app_name: 'douyin_creator',
        'is-retry': '0',
      },
      headers_before_auth: true,
      body: {
        messages_in_conversation_body: {
          conversation_id: sessionId,
          conversation_short_id: Long.fromString(sessionShortId),
          conversation_type: conversation_type,
          anchor_index: Long.fromString(nextPage ?? '0'),
          limit: 20,
          direction: 1,
        },
      },
      cmd: 301,
      sequence_id: 10062,
      refer: 3,
      token: '',
      device_id: '',
      sdk_version: '1.3.0',
      build_number: 'f1e96de:master',
      inbox_type: 0,
      device_platform: 'douyin_creator',
      auth_type: 1,
      biz: 'douyin_creator',
      access: 'web_sdk',
    };
    const writer = encodeRequest(requestObj);
    const buffer = writer.finish();
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const sendReBuffer = await getDouYinMessageHistoryListResponse(cookie, buffer, webProxy);

    const decodeRe = decodeResponse(sendReBuffer);
    result.code = decodeRe?.status_code ?? -1;
    result.msg = decodeRe?.error_desc ?? '';
    const body = decodeRe?.body as { messages_in_conversation_body: MessagesPerUserResponseBody };
    if (!body?.messages_in_conversation_body?.messages?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取失败:${decodeRe?.error_desc ?? ''}` : '';
    } else {
      if (body.messages_in_conversation_body?.has_more) {
        result.nextPage = body.messages_in_conversation_body.next_cursor?.toString() ?? '';
      }

      for (const item of body?.messages_in_conversation_body?.messages) {
        if (item.message_type === 50001) {
          continue;
        }
        const toUserId = item.conversation_id?.replace(`:${item.sender}`, '').split(':')[2];
        const cov: MessageBackItem = {
          platform: Platforms.DouYin,
          accountId: accountId ?? '',
          messageId: item.server_message_id?.toString() ?? '',
          content: '',
          sessionId: item?.conversation_id?.toString(),
          timestamp: Number(item.create_time) ?? Date.now(),
          messageUserId: item.sec_sender?.toString() ?? '',
          sessionType: item.conversation_type === 1 ? SessionType.friend : SessionType.group,
          messageType: MessageType.text,
          messageOwnerUserId: '',
          fromUserId: item.sender?.toString(),
          toUserId: toUserId,
        };
        if (item.message_type === 27) {
          cov.messageType = MessageType.image;
        } else if (item.message_type === 1 || item.message_type === 1001) {
          cov.messageType = MessageType.system;
        }
        cov.isAuthor = cov.sessionId?.endsWith(item.sender?.toString() ?? '');
        // if (cov.isAuthor || cov.sessionType === SessionType.group) {
        //   cov.messageUserId = '';
        // }
        if (item.content && item.content?.startsWith('{')) {
          const content = JSON.parse(item.content);
          cov.content = content?.text?.toString() ?? content.tips?.toString() ?? content?.description ?? '';
          if (cov.messageType === MessageType.image) {
            cov.mediaInfo = {
              needParse: false,
              needDecode: true,
              base64: `data:image/png;base64,${content?.inline_pic}`,
              //url: content?.resource_url?.large_url_list?.length ? content?.resource_url?.large_url_list[0] : '',
              mediaParams: {
                url: content?.resource_url?.large_url_list?.length ? content?.resource_url?.large_url_list[0] : '',
                skey: content?.resource_url?.skey,
              },
            };
          } else if (
            item.message_type === 1 &&
            content.tips &&
            content.template?.length &&
            String(content.tips).includes('{{')
          ) {
            const templateList = Array.isArray(content.template) ? content.template : [];
            cov.content = String(content.tips).replace(/\{\{(\d+)\}\}/g, (match, key) => {
              const templateItem = templateList.find((item: any) => item?.key?.toString() === key);
              return templateItem?.name?.toString() ?? match;
            });
          } else if (item.message_type === 1001 && item.content?.length > 10) {
            const localeResource =
              content.locale_resources.find((item: any) => item?.lang?.toString() === 'zh-Hans') ??
              content.locale_resources[0];
            if (
              localeResource.text?.startsWith('{0}') &&
              content.active_users?.length &&
              content.active_users[0].uid?.toString() === accountId
            ) {
              continue;
            }
            if (localeResource?.text) {
              cov.content = localeResource.text.toString().replace(/\{(\d+)\}/g, (match, key) => {
                const userList = key === '0' ? content.active_users : key === '1' ? content.passive_users : undefined;
                const userText = Array.isArray(userList)
                  ? userList
                      //.filter((item: any) => item.uid?.toString() != accountId)
                      .map((item: any) => item?.nickname?.toString() ?? '')
                      .filter((item: string) => item)
                      .join(',')
                  : '';
                return ` ${userText || match} `;
              });
            }
          }
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
 * 根据时间戳获取消息，不区分账号
 * @param cookie
 * @param localstorage
 * @param nextPage
 * @param accountId
 * @param proxy
 */
export const getDouYinNewMessageList = async (
  cookie: string,
  localstorage: object,
  nextPage?: string,
  accountId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageListInfoResponse> => {
  const result: MessageListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  if (!nextPage) {
    nextPage = Date.now().toString() + '000';
  }
  try {
    const requestObj = {
      headers: {
        aid_new: '',
        app_name: 'douyin_creator',
        'is-retry': '0',
      },
      headers_before_auth: true,
      body: {
        messages_per_user_body: {
          cursor: Long.fromString(nextPage),
          limit: 20,
        },
      },
      cmd: 200,
      sequence_id: 10057,
      refer: 3,
      token: '',
      device_id: '',
      sdk_version: '1.3.0',
      build_number: 'f1e96de:master',
      inbox_type: 1,
      device_platform: 'douyin_creator',
      auth_type: 1,
      biz: 'douyin_creator',
      access: 'web_sdk',
    };
    const writer = encodeRequest(requestObj);
    const buffer = writer.finish();
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const sendReBuffer = await getDouYinMessageNewListResponse(cookie, buffer, webProxy);

    const decodeRe = decodeResponse(sendReBuffer);
    result.code = decodeRe?.status_code ?? -1;
    result.msg = decodeRe?.error_desc ?? '';
    const body = decodeRe?.body as { messages_per_user_body: MessagesPerUserResponseBody };
    if (body?.messages_per_user_body?.next_cursor) {
      result.nextPage = body.messages_per_user_body.next_cursor?.toString() ?? '';
    }
    if (!body?.messages_per_user_body?.messages?.length) {
      result.code = result?.code ?? -1;
      result.msg = result?.code != 0 ? `获取失败:${decodeRe?.error_desc ?? ''}` : '';
    } else {
      const lastTime = Number(nextPage.substring(0, 13));
      for (const item of body?.messages_per_user_body?.messages) {
        if (item.message_type === 50001) {
          continue;
        }
        const toUserId = item.conversation_id?.replace(`:${item.sender}`, '').split(':')[2];
        const cov: MessageBackItem = {
          platform: Platforms.DouYin,
          accountId: accountId ?? '',
          messageId: item.server_message_id?.toString() ?? '',
          content: '',
          sessionId: item?.conversation_id?.toString(),
          secSessionId: item.conversation_short_id?.toString() ?? '',
          timestamp: Number(item.create_time) ?? Date.now(),
          messageUserId: item.sec_sender?.toString() ?? '',
          messageOwnerUserId: '',
          messageType: MessageType.text,
          fromUserId: item.sender?.toString(),
          toUserId: toUserId,
        };
        cov.isAuthor = cov.fromUserId === accountId;
        // if (cov.isAuthor || cov.sessionType === SessionType.group) {
        //   cov.messageUserId = '';
        // }
        if (lastTime > cov.timestamp) {
          continue;
        }
        if (item.conversation_type === 1 && accountId && !cov.sessionId?.includes(accountId)) {
          result.dataList = [];
          result.code = 400;
          return result;
        }
        if (item.conversation_type === 1) {
          cov.sessionType = SessionType.friend;
        } else {
          cov.sessionType = SessionType.group;
        }
        if (item.message_type === 27) {
          cov.messageType = MessageType.image;
        } else if (item.message_type === 1 || item.message_type === 1001) {
          cov.messageType = MessageType.system;
        }
        if (item.content && item.content?.startsWith('{')) {
          const content = JSON.parse(item.content);
          cov.content = content?.text?.toString() ?? content.tips?.toString() ?? content?.description ?? '';
          if (cov.messageType === MessageType.image) {
            cov.mediaInfo = {
              needParse: false,
              needDecode: true,
              base64: `data:image/png;base64,${content?.inline_pic}`,
              //url: content?.resource_url?.large_url_list?.length ? content?.resource_url?.large_url_list[0] : '',
              mediaParams: {
                url: content?.resource_url?.large_url_list?.length ? content?.resource_url?.large_url_list[0] : '',
                skey: content?.resource_url?.skey,
              },
            };
          } else if (
            item.message_type === 1 &&
            content.tips &&
            content.template?.length &&
            String(content.tips).includes('{{')
          ) {
            const templateList = Array.isArray(content.template) ? content.template : [];
            cov.content = String(content.tips).replace(/\{\{(\d+)\}\}/g, (match, key) => {
              const templateItem = templateList.find((item: any) => item?.key?.toString() === key);
              return templateItem?.name?.toString() ?? match;
            });
          } else if (item.message_type === 1001 && item.content?.length > 10) {
            const localeResource =
              content.locale_resources.find((item: any) => item?.lang?.toString() === 'zh-Hans') ??
              content.locale_resources[0];
            if (
              localeResource.text?.startsWith('{0}') &&
              content.active_users?.length &&
              content.active_users[0].uid?.toString() === accountId
            ) {
              continue;
            }
            if (localeResource?.text) {
              cov.content = localeResource.text.toString().replace(/\{(\d+)\}/g, (match, key) => {
                const userList = key === '0' ? content.active_users : key === '1' ? content.passive_users : undefined;
                const userText = Array.isArray(userList)
                  ? userList
                      //.filter((item: any) => item.uid?.toString() != accountId)
                      .map((item: any) => item?.nickname?.toString() ?? '')
                      .filter((item: string) => item)
                      .join(',')
                  : '';
                return ` ${userText || match} `;
              });
            }
          }
        }
        // if (!cov.content) {
        //   //暂时过滤掉空消息，可能是图片，表情消息
        //   continue;
        // }
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
 * 获取陌生人会话列表
 * @param cookie
 * @param localstorage
 * @param nextPage
 * @param accountId
 * @param maxTime 16位
 * @param proxy
 */
export const getDouYinMessageStrangerMessageList = async (
  cookie: string,
  localstorage: object,
  nextPage?: string,
  accountId?: string,
  maxTime?: number,
  proxy?: KuaiDaiLiProxy,
): Promise<MessageListInfoResponse> => {
  const result: MessageListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  let cursor = Number(nextPage ?? 0) ?? 0;
  if (!cursor) {
    cursor = 0;
  }
  try {
    const requestObj = {
      headers: {
        aid_new: '',
        app_name: 'douyin_creator',
        'is-retry': '0',
      },
      headers_before_auth: true,
      body: {
        get_stranger_conversation_body: {
          cursor: {
            low: cursor,
            high: 0,
            unsigned: false,
          },
          count: {
            low: 1,
            high: 0,
            unsigned: false,
          },
          show_total_unread: true,
        },
      },
      cmd: 1001,
      sequence_id: {
        low: 10075,
        high: 0,
        unsigned: false,
      },
      refer: 3,
      token: '',
      device_id: '',
      sdk_version: '1.3.0',
      build_number: 'f1e96de:master',
      inbox_type: 1,
      device_platform: 'douyin_creator',
      auth_type: 1,
      biz: 'douyin_creator',
      access: 'web_sdk',
    };
    const writer = encodeRequest(requestObj);
    const buffer = writer.finish();
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const sendReBuffer = await getDouYinMessageNewConversationListResponse(cookie, buffer, webProxy);

    const decodeRe = decodeResponse(sendReBuffer);
    result.code = decodeRe?.status_code ?? -1;
    const body = decodeRe?.body as { get_stranger_conversation_body: MessagesPerUserInitV2ResponseBody };
    if (!body?.get_stranger_conversation_body?.conversation_list?.length) {
      result.code = result?.code ?? -1;
      result.msg = result.code != 0 ? `获取失败:${decodeRe?.error_desc ?? ''}` : '';
    } else {
      if (body.get_stranger_conversation_body?.has_more) {
        result.nextPage = body.get_stranger_conversation_body.next_cursor?.toString();
      }
      for (const item of body?.get_stranger_conversation_body?.conversation_list) {
        if (item.last_message?.create_time && Number(item.last_message.create_time) * 1000 < Number(maxTime ?? 0)) {
          result.nextPage = undefined;
          return result;
        }
        // const cov = {
        //   platform: Platforms.DouYin,
        //   accountId: accountId ?? '',
        //   messageUserId: '',
        //   messageOwnerId: '',
        //   messageUserName: '',
        //   messageUserAvatar: '',
        //   sessionId: item.conversation_id ?? '',
        //   secSessionId: item.conversation_short_id?.toString() ?? '',
        // };
        // cov.messageUserId = item.participants?.length ? item?.participants[0]?.sec_uid ?? '' : '';
        // userMap.push(cov.messageUserId ?? '');
        const toUserId = item.conversation_id?.replace(`:${item?.last_message?.sender}`, '').split(':')[2];
        const msg: MessageBackItem = {
          platform: Platforms.DouYin,
          accountId: '',
          messageId: item.last_message?.server_message_id?.toString() ?? '',
          content: '',
          timestamp: Number(item.last_message?.create_time ?? Date.now()),
          messageUserId: item.last_message?.sec_sender ?? '',
          sessionId: item.conversation_id ?? '',
          secSessionId: item.conversation_short_id?.toString() ?? '',
          messageType: MessageType.text,
          sessionType: SessionType.stranger,
          messageOwnerUserId: '',
          isAuthor: false,
          fromUserId: item?.last_message?.sender?.toString() ?? '',
          toUserId: toUserId,
        };
        if (accountId && !msg.sessionId?.includes(accountId)) {
          result.dataList = [];
          result.code = 400;
          return result;
        }
        if (item?.last_message?.message_type === 27) {
          msg.messageType = MessageType.image;
        } else if (item.last_message?.message_type === 1) {
          msg.messageType = MessageType.system;
        }
        if (item.last_message?.content && item.last_message?.content?.startsWith('{')) {
          const content = JSON.parse(item.last_message?.content);
          msg.content = content?.text?.toString() ?? content.tips?.toString() ?? content?.description ?? '';
          if (msg.messageType === MessageType.image) {
            msg.mediaInfo = {
              needParse: false,
              needDecode: true,
              base64: `data:image/png;base64,${content?.inline_pic}`,
              //url: content?.resource_url?.large_url_list?.length ? content?.resource_url?.large_url_list[0] : '',
              mediaParams: {
                url: content?.resource_url?.large_url_list?.length ? content?.resource_url?.large_url_list[0] : '',
                skey: content?.resource_url?.skey,
              },
            };
          } else if (
            msg.messageType === MessageType.system &&
            content.tips &&
            content.template?.length &&
            String(content.tips).includes('{{')
          ) {
            const templateList = Array.isArray(content.template) ? content.template : [];
            msg.content = String(content.tips).replace(/\{\{(\d+)\}\}/g, (match, key) => {
              const templateItem = templateList.find((item: any) => item?.key?.toString() === key);
              return templateItem?.name?.toString() ?? match;
            });
          }
        }
        // if (!msg.content) {
        //   //暂时过滤掉空消息，可能是图片，表情消息
        //   continue;
        // }
        result.dataList.push(msg);
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
