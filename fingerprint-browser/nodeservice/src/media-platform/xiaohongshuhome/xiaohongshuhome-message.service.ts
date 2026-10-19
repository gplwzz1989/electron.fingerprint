import { MessageConversationListInfoResponse, MessageListInfoResponse } from '@/media-platform';
import { IWebProxy } from '@/media-platform/webproxy';
import {
  MessageBackItem,
  MessageType,
  Platforms,
  SendMessageResultOutPut,
  SessionType,
} from '@/service/datasync-service-manager';
import { requestXiaohongshuhome } from './xiaohongshuhome-http.service';
import { buildXiaohongshuhomeSendMessageBody } from './xiaohongshuhome-message-rrmp';
import { BaseResult } from '@/media-platform/baseResult';

export interface XiaohongshuhomeChatInfo {
  chat_user_id?: string;
  user_id?: string;
  info?: {
    nickname?: string;
    nick_name?: string;
    avatar?: string;
  };
  max_store_id?: number | string;
  last_msg_content?: string;
  last_msg?: string;
  last_msg_time?: number | string;
  unread_count?: number;
  is_replied?: boolean;
  [key: string]: any;
}

export interface XiaohongshuhomeRawMessage {
  id?: string;
  message_id?: string;
  store_id?: number | string;
  sender_id?: string;
  receiver_id?: string;
  content?: string | Record<string, any>;
  created_at?: number | string;
  timestamp?: number | string;
  ts?: number | string;
  message_type?: string | number;
  content_type?: string | number;
  messageType?: string | number;
  contentType?: string | number;
  imgUrl?: string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  url?: string;
  mediaInfo?: Record<string, any>;
  media_info?: Record<string, any>;
  revoked?: boolean;
  [key: string]: any;
}

interface XiaohongshuhomeConversationResponseData {
  chats?: XiaohongshuhomeChatInfo[];
  chat_user_id2_info?: Record<string, XiaohongshuhomeChatUserInfo>;
  total?: number;
  page?: number;
  has_more?: boolean;
  [key: string]: any;
}

interface XiaohongshuhomeChatUserInfo {
  id?: string;
  nickname?: string;
  user_name?: string;
  avatar?: string;
  [key: string]: any;
}

interface XiaohongshuhomeHistoryResponseData {
  out_message_list?: XiaohongshuhomeRawMessage[];
  [key: string]: any;
}

const toNumber = (value: unknown, defaultValue: number = 0): number => {
  const result = Number(value);
  return Number.isFinite(result) ? result : defaultValue;
};

export const normalizeXiaohongshuhomeTimestamp = (value: unknown): number => {
  const timestamp = toNumber(value, Date.now());
  return timestamp > 0 && timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
};

const parseJsonObject = (value: unknown): Record<string, any> | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'object') {
    return value as Record<string, any>;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export const parseXiaohongshuhomeMessageContent = (
  content: unknown,
): { text: string; imageUrl?: string; contentType?: string | number } => {
  const outer = parseJsonObject(content);
  if (!outer) {
    return { text: content?.toString() ?? '' };
  }

  let source = outer;
  const nested = parseJsonObject(outer.content);
  if (nested) {
    source = { ...outer, ...nested };
  }

  const mediaInfo = parseJsonObject(source.mediaInfo ?? source.media_info);
  const imageUrl = [
    source.image,
    source.imageUrl,
    source.image_url,
    source.imgUrl,
    source.img_url,
    source.url,
    mediaInfo?.url,
    mediaInfo?.image,
    mediaInfo?.imageUrl,
    mediaInfo?.image_url,
    mediaInfo?.imgUrl,
  ].find((value) => typeof value === 'string' && value);

  return {
    text: String(source.content ?? source.front_chain ?? source.text ?? ''),
    imageUrl: imageUrl as string | undefined,
    contentType:
      source.content_type ??
      source.contentType ??
      source.message_type ??
      source.messageType ??
      mediaInfo?.mediaType ??
      mediaInfo?.media_type,
  };
};

const resolveMessageType = (
  message: XiaohongshuhomeRawMessage,
  parsed: { imageUrl?: string; contentType?: string | number },
): MessageType => {
  const type = String(
    message.message_type ??
      message.content_type ??
      message.messageType ??
      message.contentType ??
      parsed.contentType ??
      'TEXT',
  ).toUpperCase();
  if (type.includes('IMAGE') || type === '2' || (parsed.imageUrl && ['TEXT', '1', '0'].includes(type))) {
    return MessageType.image;
  }
  if (type.includes('CARD')) {
    return MessageType.card;
  }
  if (type.includes('EMOTION')) {
    return MessageType.emotion;
  }
  return MessageType.text;
};

/**
 * 将小红书主页原始私信转换为统一消息结构。
 */
export const normalizeXiaohongshuhomeMessage = (
  message: XiaohongshuhomeRawMessage,
  accountId: string,
  sessionId?: string,
  messageUserId?: string,
): MessageBackItem => {
  const parsedContent = parseXiaohongshuhomeMessageContent(message.content);
  const parsedPayload = parseXiaohongshuhomeMessageContent(message.websocket_payload);
  const parsedMessage = parseXiaohongshuhomeMessageContent(message);
  const parsed = {
    text: parsedContent.text || parsedPayload.text || parsedMessage.text,
    imageUrl: parsedContent.imageUrl ?? parsedPayload.imageUrl ?? parsedMessage.imageUrl,
    contentType:
      message.message_type ??
      message.content_type ??
      message.messageType ??
      message.contentType ??
      parsedContent.contentType ??
      parsedPayload.contentType ??
      parsedMessage.contentType,
  };
  const messageType = resolveMessageType(message, parsed);
  const senderId = String(message.sender_id ?? '');
  const receiverId = String(message.receiver_id ?? '');
  const resolvedMessageUserId =
    messageUserId || (senderId && senderId !== accountId ? senderId : receiverId) || senderId || receiverId;
  const rawContent = typeof message.content === 'string' ? message.content : JSON.stringify(message.content ?? '');

  return {
    platform: Platforms.XiaoHongShuHome,
    accountId,
    messageId: String(message.id ?? message.message_id ?? message.store_id ?? ''),
    content: messageType === MessageType.text ? parsed.text : rawContent,
    imgUrl: parsed.imageUrl,
    mediaInfo: parsed.imageUrl ? { mediaType: 'image', url: parsed.imageUrl } : undefined,
    messageType,
    timestamp: normalizeXiaohongshuhomeTimestamp(message.created_at ?? message.timestamp ?? message.ts),
    messageUserId: resolvedMessageUserId,
    sessionId: sessionId ?? resolvedMessageUserId,
    secSessionId: accountId,
    sessionType: SessionType.friend,
    messageOwnerUserId: accountId,
    index: toNumber(message.store_id, 0) || undefined,
    //raw: message,
    isAuthor: senderId === accountId,
    fromUserId: senderId,
    toUserId: receiverId,
  };
};

/**
 * 获取小红书主页私信会话列表。
 */
export const getXiaohongshuhomeMessageConversationList = async (
  cookie: string,
  nextPage?: string,
  accountId?: string,
  proxy?: IWebProxy,
): Promise<MessageConversationListInfoResponse> => {
  const result: MessageConversationListInfoResponse = { code: 0, msg: '', dataList: [] };
  const page = Math.max(0, toNumber(nextPage, 0));
  const limit = 100;

  try {
    const response = await requestXiaohongshuhome<XiaohongshuhomeConversationResponseData>(
      cookie,
      `/api/im/web/v3/chats?limit=${limit}&complete=true&page=${page}&source=pc`,
      'GET',
      undefined,
      proxy,
    );
    result.code = response.code ?? -1;
    result.msg = response.msg ?? '';
    const chats = response.data?.chats ?? [];
    const ownerId = accountId || chats.find((item) => item.user_id)?.user_id || '';

    for (const chat of chats) {
      const messageUserId = String(chat.chat_user_id ?? '');
      if (!messageUserId) {
        continue;
      }
      result.dataList?.push({
        platform: Platforms.XiaoHongShuHome,
        accountId: ownerId,
        messageUserId,
        messageUserName: chat.info?.nickname ?? chat.info?.nick_name ?? '',
        messageUserAvatar: chat.info?.avatar ?? '',
        messageOwnerId: String(chat.user_id ?? ownerId),
        sessionId: messageUserId,
        secSessionId: ownerId,
        //raw: chat,
      });
    }

    const total = toNumber(response.data?.total, 0);
    if (response.data?.has_more || (total > 0 && (page + 1) * limit < total)) {
      result.nextPage = String(page + 1);
    }
  } catch {
    result.code = -1;
    result.msg = '获取小红书主页私信会话失败，请稍后重试';
  }

  return result;
};

/**
 * 获取小红书主页指定会话的用户详情。
 */
export const getXiaohongshuhomeMessageConversationInfo = async (
  cookie: string,
  sessionId: string,
  secSessionId?: string,
  messageUserId?: string,
  accountId?: string,
  proxy?: IWebProxy,
): Promise<BaseResult> => {
  const result: BaseResult = { code: 0, msg: '', data: {} };
  const targetUserId = sessionId || messageUserId;

  if (!targetUserId) {
    return {
      code: 400,
      msg: '获取小红书主页会话信息缺少用户id',
    };
  }

  try {
    const response = await requestXiaohongshuhome<XiaohongshuhomeConversationResponseData>(
      cookie,
      `/api/im/web/v3/chats/info?chat_user_ids=${encodeURIComponent(targetUserId)}`,
      'GET',
      undefined,
      proxy,
    );
    result.code = response.code ?? -1;
    result.msg = response.msg ?? '';
    if (result.code !== 0) {
      return result;
    }

    const userInfo = response.data?.chat_user_id2_info?.[targetUserId];
    if (!userInfo) {
      result.msg = '未找到小红书会话用户信息';
      return result;
    }

    const resolvedUserId = String(userInfo.id ?? targetUserId);
    result.data = {
      platform: Platforms.XiaoHongShuHome,
      accountId: accountId ?? '',
      messageUserId: resolvedUserId,
      messageUserName: userInfo.nickname ?? userInfo.user_name ?? '',
      messageUserAvatar: userInfo.avatar ?? '',
      messageOwnerId: accountId ?? '',
      sessionId: sessionId,
      secSessionId: secSessionId,
      //raw: userInfo,
    };
  } catch {
    result.code = -1;
    result.msg = '获取小红书主页会话信息失败，请稍后重试';
  }

  return result;
};

/**
 * 获取小红书主页指定会话的历史消息。
 */
export const getXiaohongshuhomeMessageListByConversation = async (
  cookie: string,
  sessionId: string,
  messageUserId: string,
  nextPage?: string,
  accountId?: string,
  proxy?: IWebProxy,
): Promise<MessageListInfoResponse> => {
  const result: MessageListInfoResponse = { code: 0, msg: '', dataList: [] };
  const limit = 30;
  const userId = messageUserId || sessionId;

  try {
    const lastId = Math.max(0, toNumber(nextPage, 0));
    const path =
      `/api/im/web/messages/history?chat_user_id=${encodeURIComponent(userId)}` +
      `&last_id=${lastId}&start_id=0&limit=${limit}`;
    const response = await requestXiaohongshuhome<XiaohongshuhomeHistoryResponseData>(
      cookie,
      path,
      'GET',
      undefined,
      proxy,
    );
    result.code = response.code ?? -1;
    result.msg = response.msg ?? '';
    const messages = response.data?.out_message_list ?? [];
    const ownerId = accountId ?? '';
    result.dataList = messages.map((message) => normalizeXiaohongshuhomeMessage(message, ownerId, sessionId, userId));

    if (messages.length >= limit) {
      const storeIds = messages.map((message) => toNumber(message.store_id, 0)).filter((storeId) => storeId > 0);
      if (storeIds.length > 0) {
        result.nextPage = String(Math.min(...storeIds));
      }
    }
  } catch {
    result.code = -1;
    result.msg = '获取小红书主页历史私信失败，请稍后重试';
  }

  return result;
};

/**
 * 发送小红书主页文本私信。
 */
export const sendXiaohongshuhomeMessage = async (
  cookie: string,
  senderId: string,
  receiverId: string,
  text: string,
  proxy?: IWebProxy,
): Promise<SendMessageResultOutPut> => {
  const result: SendMessageResultOutPut = { code: 0, msg: '' };

  try {
    const body = buildXiaohongshuhomeSendMessageBody({
      sender: senderId,
      receiver: receiverId,
      content: text,
      contentType: 1,
      triggerSource: 1,
    });
    const response = await requestXiaohongshuhome<{ message_id?: string }>(
      cookie,
      '/api/im/web/short_link/send_message',
      'POST',
      body,
      proxy,
    );
    result.code = response.code ?? -1;
    result.msg = response.msg ?? '';
    result.messageId = response.data?.message_id;
    result.raw = response.data;
    if (result.code === 0 && !result.messageId) {
      result.code = -1;
      result.msg = '小红书主页私信发送结果缺少消息id';
    }
  } catch {
    result.code = -1;
    result.msg = '发送小红书主页私信失败，请稍后重试';
  }

  return result;
};
