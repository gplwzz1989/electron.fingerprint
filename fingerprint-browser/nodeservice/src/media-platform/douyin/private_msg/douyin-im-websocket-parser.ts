import Long from 'long';
import { gunzipSync } from 'node:zlib';
import * as protobuf from 'protobufjs/light';
import { Reader } from 'protobufjs/light';

// 独立解析器需要自行启用 Long，避免 int64 精度丢失。
protobuf.util.Long = Long;
protobuf.configure();

export enum DouyinImCommand {
  SendMessage = 100,
  MessagesPerUser = 200,
  MessagesPerUserInitV2 = 203,
  MessagesInConversation = 301,
  HasNewMessageNotify = 500,
  GetStrangerConversationList = 1000,
}

export interface DouyinImFrameHeader {
  key: string;
  value: string;
}

export interface DouyinImPushFrame {
  seqId?: string;
  logId?: string;
  service?: number;
  method?: number;
  headers?: DouyinImFrameHeader[];
  payloadEncoding?: string;
  payloadType?: string;
  payload?: Buffer;
  logIdNew?: string;
  serverTiming?: string;
  msgId?: string;
  frameType?: number;
}

export type DouyinImWebSocketRawData = string | Uint8Array | ArrayBuffer | ArrayBufferView | readonly Uint8Array[];

export type DouyinImWebSocketFrame =
  | {
      kind: 'heartbeat';
      rawText: string;
    }
  | {
      kind: 'text';
      rawText: string;
    }
  | {
      kind: 'push-text';
      raw: Buffer;
      pushFrame: DouyinImPushFrame;
      payload: Buffer;
      textPayload: string;
      jsonPayload: unknown;
    }
  | {
      kind: 'protobuf';
      raw: Buffer;
      pushFrame?: DouyinImPushFrame;
      responsePayload: Buffer;
      response: DouyinImResponse;
    }
  | {
      kind: 'protobuf-unknown';
      raw: Buffer;
      pushFrame?: DouyinImPushFrame;
      payload?: Buffer;
      error: string;
      fieldScan: DouyinProtoFieldScanItem[];
    };

export interface DouyinImResponse {
  cmd?: number;
  sequenceId?: string;
  statusCode?: number;
  errorDescription?: string;
  inboxType?: number;
  body?: DouyinImResponseBody;
  logId?: string;
  headers?: Record<string, string>;
  startTimeStamp?: string;
  requestArrivedTime?: string;
  serverExecutionEndTime?: string;
  pdesKey?: string;
}

export interface DouyinProtoFieldScanItem {
  fieldNumber: number;
  wireType: number;
  offset: number;
  valuePreview?: string;
  decodeError?: string;
}

export interface DouyinImResponseBody {
  sendMessage?: DouyinSendMessageResponseBody;
  messagesPerUser?: DouyinMessagesPerUserResponseBody;
  messagesPerUserInitV2?: DouyinMessagesPerUserInitV2ResponseBody;
  messagesInConversation?: DouyinMessagesInConversationResponseBody;
  hasNewMessageNotify?: DouyinNewMessageNotify;
  strangerConversations?: DouyinGetStrangerConversationListResponseBody;
}

export interface DouyinSendMessageResponseBody {
  serverMessageId?: string;
  extraInfo?: string;
  status?: number;
  clientMessageId?: string;
  checkCode?: string;
  checkMessage?: string;
}

export interface DouyinMessagesPerUserResponseBody {
  messages?: DouyinMessageBody[];
  nextCursor?: string;
  hasMore?: boolean;
  nextInterval?: string;
  nextConversationVersion?: string;
  conversationBadgeCount?: Record<string, unknown>[];
  nextCmdIndex?: string;
  hasMoreMessageConversationList?: string[];
}

export interface DouyinMessageBody {
  conversationId?: string;
  conversationType?: number;
  serverMessageId?: string;
  indexInConversation?: string;
  conversationShortId?: string;
  messageType?: number;
  sender?: string;
  content?: string;
  ext?: Record<string, string>;
  createTime?: string;
  version?: string;
  status?: number;
  orderInConversation?: string;
  secSender?: string;
  propertyList?: Record<string, DouyinPropertyItemList>;
  referenceInfo?: DouyinReferenceInfo;
}

export interface DouyinParticipantsPage {
  participants?: DouyinParticipant[];
  hasMore?: boolean;
  cursor?: string;
}

export interface DouyinParticipant {
  userId?: string;
  sortOrder?: string;
  role?: number;
  alias?: string;
  secUid?: string;
  blocked?: number;
  leftBlockTime?: string;
}

export interface DouyinConversationCoreInfo {
  conversationId?: string;
  conversationShortId?: string;
  conversationType?: number;
  infoVersion?: string;
  name?: string;
  description?: string;
  icon?: string;
  inboxType?: number;
  notice?: string;
  ext?: Record<string, string>;
  owner?: string;
  secOwner?: string;
}

export interface DouyinConversationSettingInfo {
  conversationId?: string;
  conversationShortId?: string;
  conversationType?: number;
  minIndex?: string;
  readIndex?: string;
  mute?: number;
  stickOnTop?: number;
  inboxType?: number;
  ext?: Record<string, string>;
  settingVersion?: string;
  favorite?: number;
  setTopTime?: string;
  setFavoriteTime?: string;
  pushStatus?: number;
}

export interface DouyinConversationInfoV2 {
  conversationId?: string;
  conversationShortId?: string;
  conversationType?: number;
  ticket?: string;
  firstPageParticipants?: DouyinParticipantsPage;
  participantsCount?: number;
  isParticipant?: boolean;
  inboxType?: number;
  userInfo?: DouyinParticipant;
  conversationCoreInfo?: DouyinConversationCoreInfo;
  conversationSettingInfo?: DouyinConversationSettingInfo;
}

export interface DouyinMessagesPerUserInitV2ResponseBody {
  messages?: DouyinMessageBody[];
  conversations?: DouyinConversationInfoV2[];
  perUserCursor?: string;
  nextCursor?: string;
  hasMore?: boolean;
}

export interface DouyinReferenceInfo {
  referencedMessageId?: string;
  hint?: string;
  refMessageType?: string;
  referencedMessageStatus?: number;
  rootMessageId?: string;
  rootMessageConversationIndex?: string;
}

export interface DouyinNewMessageNotify {
  conversationId?: string;
  conversationType?: number;
  notifyType?: number;
  message?: DouyinMessageBody;
  previousCursor?: string;
  nextCursor?: string;
  indexInConversation?: string;
  indexInConversationV2?: string;
  conversationVersion?: string;
  previousConversationVersion?: string;
  cmdMessageIndex?: string;
  badgeCount?: number;
  referenceInfo?: DouyinReferenceInfo;
  previousMessageIndexInConversation?: string;
  readConversationVersion?: string;
  previousReadConversationVersion?: string;
}

export interface DouyinStrangerConversation {
  conversationShortId?: string;
  unread?: number;
  lastMessage?: DouyinMessageBody;
  conversationId?: string;
  participants?: DouyinParticipant[];
  ext?: Record<string, string>;
}

export interface DouyinGetStrangerConversationListResponseBody {
  nextCursor?: string;
  hasMore?: boolean;
  totalUnread?: number;
  conversationList?: DouyinStrangerConversation[];
}

export interface DouyinPropertyItem {
  uid?: string;
  secUid?: string;
  createTime?: string;
  idempotentId?: string;
  value?: string;
}

export interface DouyinPropertyItemList {
  items?: DouyinPropertyItem[];
}

export interface DouyinMessagesInConversationResponseBody {
  messages?: DouyinMessageBody[];
  nextCursor?: string;
  hasMore?: boolean;
}

export interface DouyinNormalizedMessage {
  conversationId?: string;
  conversationShortId?: string;
  conversationType?: number;
  serverMessageId?: string;
  senderUserId?: string;
  senderSecUserId?: string;
  messageType?: number;
  createTime?: string;
  contentText?: string;
  contentObject?: unknown;
}

export function normalizeDouyinImWebSocketData(input: DouyinImWebSocketRawData): string | Buffer {
  if (typeof input === 'string') {
    return input;
  }

  if (Array.isArray(input)) {
    return Buffer.concat(input.map((item) => Buffer.from(item)));
  }

  if (input instanceof ArrayBuffer) {
    return Buffer.from(input);
  }

  if (ArrayBuffer.isView(input)) {
    return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  }

  throw new TypeError('不支持的抖音 IM WebSocket 数据类型');
}

export function parseDouyinImWebSocketFrame(input: DouyinImWebSocketRawData): DouyinImWebSocketFrame {
  const normalized = normalizeDouyinImWebSocketData(input);

  if (typeof normalized === 'string') {
    const trimmedText = normalized.trim();
    if (trimmedText === 'hi') {
      return {
        kind: 'heartbeat',
        rawText: normalized,
      };
    }

    return {
      kind: 'text',
      rawText: normalized,
    };
  }

  const bufferText = normalized.toString('utf8').trim();
  if (bufferText === 'hi') {
    return {
      kind: 'heartbeat',
      rawText: bufferText,
    };
  }

  let pushFrame: DouyinImPushFrame;
  try {
    pushFrame = decodeDouyinImPushFrame(normalized);
  } catch (pushFrameError) {
    try {
      return {
        kind: 'protobuf',
        raw: normalized,
        responsePayload: normalized,
        response: decodeDouyinImResponse(normalized),
      };
    } catch (responseError) {
      return {
        kind: 'protobuf-unknown',
        raw: normalized,
        error: buildDouyinFrameFallbackError(pushFrameError, responseError),
        fieldScan: scanDouyinProtoFields(normalized),
      };
    }
  }

  const payload = extractDouyinImPayload(pushFrame);
  const textPayload = tryDecodeDouyinImTextPayload(pushFrame, payload);
  if (textPayload !== undefined) {
    return {
      kind: 'push-text',
      raw: normalized,
      pushFrame,
      payload,
      textPayload,
      jsonPayload: parseDouyinMessageContent(textPayload),
    };
  }

  try {
    return {
      kind: 'protobuf',
      raw: normalized,
      pushFrame,
      responsePayload: payload,
      response: decodeDouyinImResponse(payload),
    };
  } catch (responseError) {
    return {
      kind: 'protobuf-unknown',
      raw: normalized,
      pushFrame,
      payload,
      error: buildDouyinPayloadDecodeError(pushFrame, responseError),
      fieldScan: scanDouyinProtoFields(payload),
    };
  }
}

export function decodeDouyinImPushFrame(buffer: Uint8Array): DouyinImPushFrame {
  const reader = Reader.create(buffer);
  const frame: DouyinImPushFrame = {
    headers: [],
  };

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        frame.seqId = readUint64String(reader);
        break;
      case 2:
        frame.logId = readUint64String(reader);
        break;
      case 3:
        frame.service = reader.int32();
        break;
      case 4:
        frame.method = reader.int32();
        break;
      case 5:
        frame.headers!.push(readEmbeddedMessage(reader, decodeStringMapEntry));
        break;
      case 6:
        frame.payloadEncoding = reader.string();
        break;
      case 7:
        frame.payloadType = reader.string();
        break;
      case 8:
        frame.payload = Buffer.from(reader.bytes());
        break;
      case 9:
        frame.logIdNew = reader.string();
        break;
      case 10:
        frame.serverTiming = reader.string();
        break;
      case 11:
        frame.msgId = reader.string();
        break;
      case 12:
        frame.frameType = reader.int32();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  if (!frame.seqId) {
    throw new Error('PushFrame 缺少 seqId');
  }
  if (!frame.logId) {
    throw new Error('PushFrame 缺少 logId');
  }
  if (frame.service === undefined) {
    throw new Error('PushFrame 缺少 service');
  }
  if (frame.method === undefined) {
    throw new Error('PushFrame 缺少 method');
  }
  if (!frame.payload || frame.payload.byteLength === 0) {
    throw new Error('PushFrame 缺少有效 payload');
  }

  return frame;
}

export function extractDouyinImPayload(frame: DouyinImPushFrame): Buffer {
  if (!frame.payload || frame.payload.byteLength === 0) {
    throw new Error('PushFrame payload 为空');
  }

  const payload = Buffer.from(frame.payload);
  const isGzipPayload = frame.headers?.some((header) => header.key === 'compress_type' && header.value === 'gzip');
  if (!isGzipPayload) {
    return payload;
  }

  return gunzipSync(payload);
}

export function extractDouyinImResponsePayload(frame: DouyinImPushFrame): Buffer {
  return extractDouyinImPayload(frame);
}

export function decodeDouyinImResponse(buffer: Uint8Array): DouyinImResponse {
  const reader = Reader.create(buffer);
  const response: DouyinImResponse = {
    headers: {},
  };

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        response.cmd = reader.int32();
        break;
      case 2:
        response.sequenceId = readInt64String(reader);
        break;
      case 3:
        response.statusCode = reader.int32();
        break;
      case 4:
        response.errorDescription = reader.string();
        break;
      case 5:
        response.inboxType = reader.int32();
        break;
      case 6:
        response.body = readEmbeddedMessage(reader, decodeDouyinImResponseBody);
        break;
      case 7:
        response.logId = reader.string();
        break;
      case 8: {
        const entry = readEmbeddedMessage(reader, decodeStringMapEntry);
        if (entry.key) {
          response.headers![entry.key] = entry.value;
        }
        break;
      }
      case 9:
        response.startTimeStamp = readInt64String(reader);
        break;
      case 10:
        response.requestArrivedTime = readInt64String(reader);
        break;
      case 11:
        response.serverExecutionEndTime = readInt64String(reader);
        break;
      case 110:
        response.pdesKey = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return response;
}

export function decodeDouyinImResponseBody(buffer: Uint8Array): DouyinImResponseBody {
  const reader = Reader.create(buffer);
  const body: DouyinImResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case DouyinImCommand.SendMessage:
        body.sendMessage = readEmbeddedMessage(reader, decodeSendMessageResponseBody);
        break;
      case DouyinImCommand.MessagesPerUser:
        body.messagesPerUser = readEmbeddedMessage(reader, decodeMessagesPerUserResponseBody);
        break;
      case DouyinImCommand.MessagesPerUserInitV2:
        body.messagesPerUserInitV2 = readEmbeddedMessage(reader, decodeMessagesPerUserInitV2ResponseBody);
        break;
      case DouyinImCommand.MessagesInConversation:
        body.messagesInConversation = readEmbeddedMessage(reader, decodeMessagesInConversationResponseBody);
        break;
      case DouyinImCommand.HasNewMessageNotify:
        body.hasNewMessageNotify = readEmbeddedMessage(reader, decodeNewMessageNotify);
        break;
      case DouyinImCommand.GetStrangerConversationList:
        body.strangerConversations = readEmbeddedMessage(reader, decodeGetStrangerConversationListResponseBody);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

export function parseDouyinMessageContent(content: unknown): unknown {
  if (typeof content !== 'string') {
    return content;
  }

  const normalizedText = content.trim();
  if (!normalizedText) {
    return normalizedText;
  }

  if (!normalizedText.startsWith('{') && !normalizedText.startsWith('[')) {
    return normalizedText;
  }

  try {
    return JSON.parse(normalizedText);
  } catch (error) {
    return normalizedText;
  }
}

export function normalizeDouyinNewMessageNotify(
  notify: DouyinNewMessageNotify | undefined,
): DouyinNormalizedMessage | undefined {
  if (!notify?.message) {
    return undefined;
  }

  const contentObject = parseDouyinMessageContent(notify.message.content);
  return {
    conversationId: notify.conversationId ?? notify.message.conversationId,
    conversationShortId: notify.message.conversationShortId,
    conversationType: notify.conversationType ?? notify.message.conversationType,
    serverMessageId: notify.message.serverMessageId,
    senderUserId: notify.message.sender,
    senderSecUserId: notify.message.secSender,
    messageType: notify.message.messageType,
    createTime: notify.message.createTime,
    contentText: extractContentText(contentObject, notify.message.content),
    contentObject,
  };
}

function decodeSendMessageResponseBody(buffer: Uint8Array): DouyinSendMessageResponseBody {
  const reader = Reader.create(buffer);
  const body: DouyinSendMessageResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        body.serverMessageId = readInt64String(reader);
        break;
      case 2:
        body.extraInfo = reader.string();
        break;
      case 3:
        body.status = reader.int32();
        break;
      case 4:
        body.clientMessageId = reader.string();
        break;
      case 5:
        body.checkCode = readInt64String(reader);
        break;
      case 6:
        body.checkMessage = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

function decodeMessagesPerUserResponseBody(buffer: Uint8Array): DouyinMessagesPerUserResponseBody {
  const reader = Reader.create(buffer);
  const body: DouyinMessagesPerUserResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        body.messages ??= [];
        body.messages.push(readEmbeddedMessage(reader, decodeMessageBody));
        break;
      case 2:
        body.nextCursor = readInt64String(reader);
        break;
      case 3:
        body.hasMore = reader.bool();
        break;
      case 4:
        body.nextInterval = readInt64String(reader);
        break;
      case 5:
        body.nextConversationVersion = readInt64String(reader);
        break;
      case 6:
        body.conversationBadgeCount ??= [];
        body.conversationBadgeCount.push(readEmbeddedMessage(reader, decodeUnknownObject));
        break;
      case 7:
        body.nextCmdIndex = readInt64String(reader);
        break;
      case 8:
        body.hasMoreMessageConversationList ??= [];
        if ((tag & 7) === 2) {
          const end = reader.uint32() + reader.pos;
          while (reader.pos < end) {
            body.hasMoreMessageConversationList.push(readInt64String(reader));
          }
        } else {
          body.hasMoreMessageConversationList.push(readInt64String(reader));
        }
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

function decodeMessageBody(buffer: Uint8Array): DouyinMessageBody {
  const reader = Reader.create(buffer);
  const message: DouyinMessageBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        message.conversationId = reader.string();
        break;
      case 2:
        message.conversationType = reader.int32();
        break;
      case 3:
        message.serverMessageId = readInt64String(reader);
        break;
      case 4:
        message.indexInConversation = readInt64String(reader);
        break;
      case 5:
        message.conversationShortId = readInt64String(reader);
        break;
      case 6:
        message.messageType = reader.int32();
        break;
      case 7:
        message.sender = readInt64String(reader);
        break;
      case 8:
        message.content = reader.string();
        break;
      case 9: {
        const entry = readEmbeddedMessage(reader, decodeStringMapEntry);
        message.ext ??= {};
        message.ext[entry.key] = entry.value;
        break;
      }
      case 10:
        message.createTime = readInt64String(reader);
        break;
      case 11:
        message.version = readInt64String(reader);
        break;
      case 12:
        message.status = reader.int32();
        break;
      case 13:
        message.orderInConversation = readInt64String(reader);
        break;
      case 14:
        message.secSender = reader.string();
        break;
      case 15: {
        const entry = readEmbeddedMessage(reader, decodePropertyItemListMapEntry);
        message.propertyList ??= {};
        message.propertyList[entry.key] = entry.value;
        break;
      }
      case 18:
        message.referenceInfo = readEmbeddedMessage(reader, decodeReferenceInfo);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return message;
}

function decodeParticipantsPage(buffer: Uint8Array): DouyinParticipantsPage {
  const reader = Reader.create(buffer);
  const page: DouyinParticipantsPage = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        page.participants ??= [];
        page.participants.push(readEmbeddedMessage(reader, decodeParticipant));
        break;
      case 2:
        page.hasMore = reader.bool();
        break;
      case 3:
        page.cursor = readInt64String(reader);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return page;
}

function decodeParticipant(buffer: Uint8Array): DouyinParticipant {
  const reader = Reader.create(buffer);
  const participant: DouyinParticipant = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        participant.userId = readInt64String(reader);
        break;
      case 2:
        participant.sortOrder = readInt64String(reader);
        break;
      case 3:
        participant.role = reader.int32();
        break;
      case 4:
        participant.alias = reader.string();
        break;
      case 5:
        participant.secUid = reader.string();
        break;
      case 6:
        participant.blocked = reader.int32();
        break;
      case 7:
        participant.leftBlockTime = readInt64String(reader);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return participant;
}

function decodeConversationCoreInfo(buffer: Uint8Array): DouyinConversationCoreInfo {
  const reader = Reader.create(buffer);
  const info: DouyinConversationCoreInfo = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        info.conversationId = reader.string();
        break;
      case 2:
        info.conversationShortId = readInt64String(reader);
        break;
      case 3:
        info.conversationType = reader.int32();
        break;
      case 4:
        info.infoVersion = readInt64String(reader);
        break;
      case 5:
        info.name = reader.string();
        break;
      case 6:
        info.description = reader.string();
        break;
      case 7:
        info.icon = reader.string();
        break;
      case 8:
        info.inboxType = reader.int32();
        break;
      case 9:
        info.notice = reader.string();
        break;
      case 11: {
        const entry = readEmbeddedMessage(reader, decodeStringMapEntry);
        info.ext ??= {};
        info.ext[entry.key] = entry.value;
        break;
      }
      case 12:
        info.owner = readInt64String(reader);
        break;
      case 13:
        info.secOwner = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return info;
}

function decodeConversationSettingInfo(buffer: Uint8Array): DouyinConversationSettingInfo {
  const reader = Reader.create(buffer);
  const info: DouyinConversationSettingInfo = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        info.conversationId = reader.string();
        break;
      case 2:
        info.conversationShortId = readInt64String(reader);
        break;
      case 3:
        info.conversationType = reader.int32();
        break;
      case 4:
        info.minIndex = readInt64String(reader);
        break;
      case 5:
        info.readIndex = readInt64String(reader);
        break;
      case 6:
        info.mute = reader.int32();
        break;
      case 7:
        info.stickOnTop = reader.int32();
        break;
      case 8:
        info.inboxType = reader.int32();
        break;
      case 9: {
        const entry = readEmbeddedMessage(reader, decodeStringMapEntry);
        info.ext ??= {};
        info.ext[entry.key] = entry.value;
        break;
      }
      case 10:
        info.settingVersion = readInt64String(reader);
        break;
      case 11:
        info.favorite = reader.int32();
        break;
      case 12:
        info.setTopTime = readInt64String(reader);
        break;
      case 13:
        info.setFavoriteTime = readInt64String(reader);
        break;
      case 30:
        info.pushStatus = reader.int32();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return info;
}

function decodeConversationInfoV2(buffer: Uint8Array): DouyinConversationInfoV2 {
  const reader = Reader.create(buffer);
  const info: DouyinConversationInfoV2 = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        info.conversationId = reader.string();
        break;
      case 2:
        info.conversationShortId = readInt64String(reader);
        break;
      case 3:
        info.conversationType = reader.int32();
        break;
      case 4:
        info.ticket = reader.string();
        break;
      case 6:
        info.firstPageParticipants = readEmbeddedMessage(reader, decodeParticipantsPage);
        break;
      case 7:
        info.participantsCount = reader.int32();
        break;
      case 8:
        info.isParticipant = reader.bool();
        break;
      case 9:
        info.inboxType = reader.int32();
        break;
      case 20:
        info.userInfo = readEmbeddedMessage(reader, decodeParticipant);
        break;
      case 50:
        info.conversationCoreInfo = readEmbeddedMessage(reader, decodeConversationCoreInfo);
        break;
      case 51:
        info.conversationSettingInfo = readEmbeddedMessage(reader, decodeConversationSettingInfo);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return info;
}

function decodeMessagesPerUserInitV2ResponseBody(buffer: Uint8Array): DouyinMessagesPerUserInitV2ResponseBody {
  const reader = Reader.create(buffer);
  const body: DouyinMessagesPerUserInitV2ResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        body.messages ??= [];
        body.messages.push(readEmbeddedMessage(reader, decodeMessageBody));
        break;
      case 2:
        body.conversations ??= [];
        body.conversations.push(readEmbeddedMessage(reader, decodeConversationInfoV2));
        break;
      case 3:
        body.perUserCursor = readInt64String(reader);
        break;
      case 4:
        body.nextCursor = readInt64String(reader);
        break;
      case 5:
        body.hasMore = reader.bool();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

function decodeReferenceInfo(buffer: Uint8Array): DouyinReferenceInfo {
  const reader = Reader.create(buffer);
  const info: DouyinReferenceInfo = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        info.referencedMessageId = readInt64String(reader);
        break;
      case 2:
        info.hint = reader.string();
        break;
      case 3:
        info.refMessageType = readInt64String(reader);
        break;
      case 4:
        info.referencedMessageStatus = reader.int32();
        break;
      case 5:
        info.rootMessageId = readInt64String(reader);
        break;
      case 6:
        info.rootMessageConversationIndex = readInt64String(reader);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return info;
}

function decodeNewMessageNotify(buffer: Uint8Array): DouyinNewMessageNotify {
  const reader = Reader.create(buffer);
  const notify: DouyinNewMessageNotify = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 2:
        notify.conversationId = reader.string();
        break;
      case 3:
        notify.conversationType = reader.int32();
        break;
      case 4:
        notify.notifyType = reader.int32();
        break;
      case 5:
        notify.message = readEmbeddedMessage(reader, decodeMessageBody);
        break;
      case 6:
        notify.previousCursor = readInt64String(reader);
        break;
      case 7:
        notify.nextCursor = readInt64String(reader);
        break;
      case 8:
        notify.indexInConversation = readInt64String(reader);
        break;
      case 9:
        notify.indexInConversationV2 = readInt64String(reader);
        break;
      case 10:
        notify.conversationVersion = readInt64String(reader);
        break;
      case 11:
        notify.previousConversationVersion = readInt64String(reader);
        break;
      case 12:
        notify.cmdMessageIndex = readInt64String(reader);
        break;
      case 13:
        notify.badgeCount = reader.int32();
        break;
      case 15:
        notify.referenceInfo = readEmbeddedMessage(reader, decodeReferenceInfo);
        break;
      case 16:
        notify.previousMessageIndexInConversation = readInt64String(reader);
        break;
      case 17:
        notify.readConversationVersion = readInt64String(reader);
        break;
      case 18:
        notify.previousReadConversationVersion = readInt64String(reader);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return notify;
}

function decodeStrangerConversation(buffer: Uint8Array): DouyinStrangerConversation {
  const reader = Reader.create(buffer);
  const conversation: DouyinStrangerConversation = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        conversation.conversationShortId = readInt64String(reader);
        break;
      case 2:
        conversation.unread = reader.int32();
        break;
      case 3:
        conversation.lastMessage = readEmbeddedMessage(reader, decodeMessageBody);
        break;
      case 4:
        conversation.conversationId = reader.string();
        break;
      case 5:
        conversation.participants ??= [];
        conversation.participants.push(readEmbeddedMessage(reader, decodeParticipant));
        break;
      case 7: {
        const entry = readEmbeddedMessage(reader, decodeStringMapEntry);
        conversation.ext ??= {};
        conversation.ext[entry.key] = entry.value;
        break;
      }
      default:
        reader.skipType(tag & 7);
    }
  }

  return conversation;
}

function decodeGetStrangerConversationListResponseBody(
  buffer: Uint8Array,
): DouyinGetStrangerConversationListResponseBody {
  const reader = Reader.create(buffer);
  const body: DouyinGetStrangerConversationListResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        body.nextCursor = readInt64String(reader);
        break;
      case 2:
        body.hasMore = reader.bool();
        break;
      case 3:
        body.totalUnread = reader.int32();
        break;
      case 4:
        body.conversationList ??= [];
        body.conversationList.push(readEmbeddedMessage(reader, decodeStrangerConversation));
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

function decodePropertyItem(buffer: Uint8Array): DouyinPropertyItem {
  const reader = Reader.create(buffer);
  const item: DouyinPropertyItem = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        item.uid = readInt64String(reader);
        break;
      case 2:
        item.secUid = reader.string();
        break;
      case 3:
        item.createTime = readInt64String(reader);
        break;
      case 4:
        item.idempotentId = reader.string();
        break;
      case 5:
        item.value = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return item;
}

function decodePropertyItemList(buffer: Uint8Array): DouyinPropertyItemList {
  const reader = Reader.create(buffer);
  const list: DouyinPropertyItemList = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        list.items ??= [];
        list.items.push(readEmbeddedMessage(reader, decodePropertyItem));
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return list;
}

function decodeMessagesInConversationResponseBody(buffer: Uint8Array): DouyinMessagesInConversationResponseBody {
  const reader = Reader.create(buffer);
  const body: DouyinMessagesInConversationResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        body.messages ??= [];
        body.messages.push(readEmbeddedMessage(reader, decodeMessageBody));
        break;
      case 2:
        body.nextCursor = readInt64String(reader);
        break;
      case 3:
        body.hasMore = reader.bool();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

function readEmbeddedMessage<T>(reader: Reader, decoder: (buffer: Uint8Array) => T): T {
  const length = reader.uint32();
  const start = reader.pos;
  const end = start + length;
  const value = decoder(reader.buf.subarray(start, end));
  reader.pos = end;
  return value;
}

function readInt64String(reader: Reader): string {
  const value = reader.int64() as Long | number | string;
  return typeof value === 'string' ? value : value.toString();
}

function readUint64String(reader: Reader): string {
  const value = reader.uint64() as Long | number | string;
  return typeof value === 'string' ? value : value.toString();
}

function decodeStringMapEntry(buffer: Uint8Array): { key: string; value: string } {
  const reader = Reader.create(buffer);
  let key = '';
  let value = '';

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        key = reader.string();
        break;
      case 2:
        value = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return { key, value };
}

function decodePropertyItemListMapEntry(buffer: Uint8Array): {
  key: string;
  value: DouyinPropertyItemList;
} {
  const reader = Reader.create(buffer);
  let key = '';
  let value: DouyinPropertyItemList = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        key = reader.string();
        break;
      case 2:
        value = readEmbeddedMessage(reader, decodePropertyItemList);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return { key, value };
}

function decodeUnknownObject(buffer: Uint8Array): Record<string, unknown> {
  return {
    raw: Buffer.from(buffer).toString('base64'),
  };
}

function extractContentText(contentObject: unknown, fallbackContent?: string): string | undefined {
  if (typeof contentObject === 'string') {
    return contentObject;
  }

  if (contentObject && typeof contentObject === 'object') {
    const objectContent = contentObject as Record<string, unknown>;
    for (const candidateKey of ['text', 'tips', 'description']) {
      const candidateValue = objectContent[candidateKey];
      if (typeof candidateValue === 'string' && candidateValue.trim()) {
        return candidateValue.trim();
      }
    }
  }

  return typeof fallbackContent === 'string' ? fallbackContent : undefined;
}

function tryDecodeDouyinImTextPayload(frame: DouyinImPushFrame, payload: Buffer): string | undefined {
  const payloadType = frame.payloadType?.trim().toLowerCase() ?? '';
  const payloadEncoding = frame.payloadEncoding?.trim().toLowerCase() ?? '';
  const isTextPayloadType = payloadType.includes('json') || payloadType.startsWith('text/') || payloadType === 'string';
  const canTransformTextPayload = !payloadEncoding || payloadEncoding === 'none_none' || payloadEncoding === 'binary';

  if (!isTextPayloadType || !canTransformTextPayload) {
    return undefined;
  }

  return payload.toString('utf8');
}

function buildDouyinFrameFallbackError(pushFrameError: unknown, responseError: unknown): string {
  const pushFrameMessage = pushFrameError instanceof Error ? pushFrameError.message : String(pushFrameError);
  const responseMessage = responseError instanceof Error ? responseError.message : String(responseError);
  return `PushFrame 解析失败: ${pushFrameMessage}; Response 解析失败: ${responseMessage}`;
}

function buildDouyinPayloadDecodeError(frame: DouyinImPushFrame, responseError: unknown): string {
  const responseMessage = responseError instanceof Error ? responseError.message : String(responseError);
  return `PushFrame 已解析，payloadType=${frame.payloadType ?? ''}，payloadEncoding=${
    frame.payloadEncoding ?? ''
  }，Response 解析失败: ${responseMessage}`;
}

export function previewDouyinImBuffer(buffer: Uint8Array, maxBytes = 96): string {
  return Buffer.from(buffer).subarray(0, Math.max(0, maxBytes)).toString('hex');
}

export function scanDouyinProtoFields(buffer: Uint8Array, maxFields = 32): DouyinProtoFieldScanItem[] {
  const reader = Reader.create(buffer);
  const fields: DouyinProtoFieldScanItem[] = [];

  while (reader.pos < reader.len && fields.length < maxFields) {
    const offset = reader.pos;

    try {
      const tag = reader.uint32();
      const fieldNumber = tag >>> 3;
      const wireType = tag & 7;
      const item: DouyinProtoFieldScanItem = {
        fieldNumber,
        wireType,
        offset,
      };

      switch (wireType) {
        case 0:
          item.valuePreview = readInt64String(reader);
          break;
        case 1:
          item.valuePreview = previewDouyinImBuffer(reader.buf.subarray(reader.pos, reader.pos + 8), 8);
          reader.pos += 8;
          break;
        case 2: {
          const length = reader.uint32();
          const start = reader.pos;
          const end = start + length;
          if (end > reader.len) {
            throw new RangeError(`length-delimited out of range: ${start} + ${length} > ${reader.len}`);
          }
          item.valuePreview = previewDouyinImBuffer(reader.buf.subarray(start, end), 48);
          reader.pos = end;
          break;
        }
        case 5:
          item.valuePreview = previewDouyinImBuffer(reader.buf.subarray(reader.pos, reader.pos + 4), 4);
          reader.pos += 4;
          break;
        default:
          throw new Error(`unsupported wire type: ${wireType}`);
      }

      fields.push(item);
    } catch (error) {
      fields.push({
        fieldNumber: -1,
        wireType: -1,
        offset,
        decodeError: error instanceof Error ? error.message : String(error),
      });
      break;
    }
  }

  return fields;
}
