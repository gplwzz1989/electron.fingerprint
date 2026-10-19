import { Reader } from 'protobufjs/light';

// 定义 Response 类型的 TS 接口（可根据需要补充更多字段类型）
interface Response {
  cmd?: number;
  sequence_id?: string | number;
  status_code?: number;
  error_desc?: string;
  inbox_type?: number;
  body?: any; // ResponseBody
  log_id?: string;
  headers?: Record<string, string>;
  start_time_stamp?: string | number;
  request_arrived_time?: string | number;
  server_execution_end_time?: string | number;
}

// 定义 ResponseBody 接口
export interface ResponseBody {
  send_message_body?: any; // SendMessageResponseBody
  messages_per_user_body?: any;
  messages_per_user_init_v2_body?: any;
  messages_in_conversation_body?: any;
  has_new_message_notify?: any;
  get_message_by_id_body?: any;
  get_stranger_conversation_body?: any;
  // 其他字段先留空
}

// 定义 SendMessageResponseBody 接口
export interface SendMessageResponseBody {
  server_message_id?: string | number;
  extra_info?: string;
  status?: number;
  client_message_id?: string;
  check_code?: string | number;
  check_message?: string;
}

export function decodeResponse(buffer: Uint8Array): Response {
  const reader = Reader.create(buffer);
  const res: Response = { headers: {} };

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        res.cmd = reader.int32();
        break;
      case 2:
        res.sequence_id = reader.int64().toString();
        break;
      case 3:
        res.status_code = reader.int32();
        break;
      case 4:
        res.error_desc = reader.string();
        break;
      case 5:
        res.inbox_type = reader.int32();
        break;
      case 6:
        const len = reader.uint32();
        const start = reader.pos;
        // 这里递归解析 ResponseBody
        try {
          res.body = decodeResponseBody(reader.buf.slice(start, start + len));
        } catch (e) {
          console.error('解析响应出错', e);
        }

        reader.pos = start + len;
        break;
      case 7:
        res.log_id = reader.string();
        break;
      case 8:
        const mapLen = reader.uint32() + reader.pos;
        while (reader.pos < mapLen) {
          let key = '';
          let value = '';
          const entryTag = reader.uint32();
          switch (entryTag >>> 3) {
            case 1:
              key = reader.string();
              break;
            case 2:
              value = reader.string();
              break;
            default:
              reader.skipType(entryTag & 7);
          }
          if (key) res.headers![key] = value;
        }
        break;
      case 9:
        res.start_time_stamp = reader.int64().toString();
        break;
      case 10:
        res.request_arrived_time = reader.int64().toString();
        break;
      case 11:
        res.server_execution_end_time = reader.int64().toString();
        break;
      default:
        try {
          reader.skipType(tag & 7);
        } catch (e) {
          //console.error('解析响应出错cmd-', res, e);
        }
    }
  }

  return res;
}

function decodeResponseBody(buffer: Uint8Array): ResponseBody {
  const reader = Reader.create(buffer);
  const body: ResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 100:
        const len = reader.uint32();
        const start = reader.pos;
        // SendMessageResponseBody
        body.send_message_body = decodeSendMessageResponseBody(reader.buf.slice(start, start + len));
        reader.pos = start + len;
        break;
      case 200:
        const lenMPU = reader.uint32();
        const startMPU = reader.pos;
        body.messages_per_user_body = decodeMessagesPerUserResponseBody(reader.buf.slice(startMPU, startMPU + lenMPU));
        reader.pos = startMPU + lenMPU;
        break;
      case 203:
        const lenInit = reader.uint32();
        const startInit = reader.pos;
        body.messages_per_user_init_v2_body = decodeMessagesPerUserInitV2ResponseBody(
          reader.buf.slice(startInit, startInit + lenInit),
        );
        reader.pos = startInit + lenInit;
        break;
      case 301:
        const lenInit1 = reader.uint32();
        const startInit1 = reader.pos;
        body.messages_in_conversation_body = decodeMessagesInConversationResponseBody(
          reader.buf.slice(startInit1, startInit1 + lenInit1),
        );
        reader.pos = startInit1 + lenInit1;
        break;
      case 500:
        const lenInit3 = reader.uint32();
        const startInit3 = reader.pos;
        body.has_new_message_notify = decodeNewMessageNotify(reader.buf.slice(startInit3, startInit3 + lenInit3));
        reader.pos = startInit3 + lenInit3;
        break;

      case 1000:
        const lenInit2 = reader.uint32();
        const startInit2 = reader.pos;
        body.get_stranger_conversation_body = decodeGetStrangerConversationListResponseBody(
          reader.buf.slice(startInit2, startInit2 + lenInit2),
        );
        reader.pos = startInit2 + lenInit2;
        break;

      // 其他 case 先留空
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

function decodeSendMessageResponseBody(buffer: Uint8Array): SendMessageResponseBody {
  const reader = Reader.create(buffer);
  const msg: SendMessageResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        msg.server_message_id = reader.int64().toString();
        break;
      case 2:
        msg.extra_info = reader.string();
        break;
      case 3:
        msg.status = reader.int32();
        break;
      case 4:
        msg.client_message_id = reader.string();
        break;
      case 5:
        msg.check_code = reader.int64().toString();
        break;
      case 6:
        msg.check_message = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return msg;
}

export interface MessagesPerUserResponseBody {
  messages?: Array<MessageBody>; // MessageBody
  next_cursor?: string | number;
  has_more?: boolean;
  next_interval?: string | number;
  next_conversation_version?: string | number;
  conversation_badge_count?: any[]; // ConversationBadgeCountInfo
  next_cmd_index?: string | number;
  hasmore_message_conv_list?: (string | number)[];
}

function decodeMessagesPerUserResponseBody(buffer: Uint8Array): MessagesPerUserResponseBody {
  const reader = Reader.create(buffer);
  const body: MessagesPerUserResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        if (!body.messages) body.messages = [];
        const len1 = reader.uint32();
        const start1 = reader.pos;
        body.messages.push(decodeMessageBody(reader.buf.slice(reader.pos, reader.pos + len1)));
        reader.pos = start1 + len1;
        break;
      case 2:
        body.next_cursor = reader.int64().toString();
        break;
      case 3:
        body.has_more = reader.bool();
        break;
      case 4:
        body.next_interval = reader.int64().toString();
        break;
      case 5:
        body.next_conversation_version = reader.int64().toString();
        break;
      case 6:
        if (!body.conversation_badge_count) body.conversation_badge_count = [];
        const len2 = reader.uint32();
        const start2 = reader.pos;
        // 占位，后续可替换成 decodeConversationBadgeCountInfo
        body.conversation_badge_count.push({
          /* TODO: decode ConversationBadgeCountInfo */
        });
        reader.pos = start2 + len2;
        break;
      case 7:
        body.next_cmd_index = reader.int64().toString();
        break;
      case 8:
        if (!body.hasmore_message_conv_list) body.hasmore_message_conv_list = [];
        if ((7 & tag) === 2) {
          const limit = reader.uint32() + reader.pos;
          while (reader.pos < limit) {
            body.hasmore_message_conv_list.push(reader.int64().toString());
          }
        } else {
          body.hasmore_message_conv_list.push(reader.int64().toString());
        }
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

// ---------- TS 接口 ----------
export interface MessageBody {
  conversation_id?: string;
  conversation_type?: number;
  server_message_id?: string | number;
  index_in_conversation?: string | number;
  conversation_short_id?: string | number;
  message_type?: number;
  sender?: string | number;
  content?: string;
  ext?: Record<string, string>;
  create_time?: string | number;
  version?: string | number;
  status?: number;
  order_in_conversation?: string | number;
  sec_sender?: string;
  property_list?: Record<string, any>; // PropertyItemList 占位
  reference_info?: any; // ReferenceInfo 占位
}

export interface ParticipantsPage {
  participants?: any[]; // Participant 占位
  has_more?: boolean;
  cursor?: string | number;
}

export interface Participant {
  user_id?: string | number;
  sort_order?: string | number;
  role?: number;
  alias?: string;
  sec_uid?: string;
  blocked?: number;
  left_block_time?: string | number;
}

export interface ConversationCoreInfo {
  conversation_id?: string;
  conversation_short_id?: string | number;
  conversation_type?: number;
  info_version?: string | number;
  name?: string;
  desc?: string;
  icon?: string;
  inbox_type?: number;
  notice?: string;
  ext?: Record<string, string>;
  owner?: string | number;
  sec_owner?: string;
}

export interface ConversationSettingInfo {
  conversation_id?: string;
  conversation_short_id?: string | number;
  conversation_type?: number;
  min_index?: string | number;
  read_index?: string | number;
  mute?: number;
  stick_on_top?: number;
  inbox_type?: number;
  ext?: Record<string, string>;
  setting_version?: string | number;
  favorite?: number;
  set_top_time?: string | number;
  set_favorite_time?: string | number;
  push_status?: number;
}

export interface ConversationInfoV2 {
  conversation_id?: string;
  conversation_short_id?: string;
  conversation_type?: number;
  ticket?: string;
  first_page_participants?: any; // ParticipantsPage 占位
  participants_count?: number;
  is_participant?: boolean;
  inbox_type?: number;
  user_info?: Participant; // Participant 占位
  conversation_core_info?: any; // ConversationCoreInfo 占位
  conversation_setting_info?: any; // ConversationSettingInfo 占位
}

export interface ConversationInfoStranger {
  conversation_id?: string;
  conversation_short_id?: string;

  participants?: Array<Participant>; // ParticipantsPage 占位
  last_message?: MessageBody;
}

export interface MessagesPerUserInitV2ResponseBody {
  messages?: any[]; // MessageBody
  conversations?: Array<ConversationInfoV2>; // ConversationInfoV2
  conversation_list?: Array<ConversationInfoStranger>;
  per_user_cursor?: string | number;
  next_cursor?: string | number;
  has_more?: boolean;
}

// ---------- 解码函数 ----------

export function decodeConversationInfoV2(buffer: Uint8Array): ConversationInfoV2 {
  const reader = Reader.create(buffer);
  const info: ConversationInfoV2 = {};
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        info.conversation_id = reader.string();
        break;
      case 2:
        info.conversation_short_id = reader.int64().toString();
        break;
      case 3:
        info.conversation_type = reader.int32();
        break;
      case 4:
        info.ticket = reader.string();
        break;
      case 6:
        const lenP = reader.uint32();
        info.first_page_participants = decodeParticipantsPage(reader.buf.slice(reader.pos, reader.pos + lenP));
        reader.pos += lenP;
        break;
      case 7:
        info.participants_count = reader.int32();
        break;
      case 8:
        info.is_participant = reader.bool();
        break;
      case 9:
        info.inbox_type = reader.int32();
        break;
      case 20:
        const lenUser = reader.uint32();
        info.user_info = decodeParticipant(reader.buf.slice(reader.pos, reader.pos + lenUser));
        reader.pos += lenUser;
        break;
      case 50:
        const lenCore = reader.uint32();
        info.conversation_core_info = decodeConversationCoreInfo(reader.buf.slice(reader.pos, reader.pos + lenCore));
        reader.pos += lenCore;
        break;
      case 51:
        const lenSetting = reader.uint32();
        info.conversation_setting_info = decodeConversationSettingInfo(
          reader.buf.slice(reader.pos, reader.pos + lenSetting),
        );
        reader.pos += lenSetting;
        break;
      default:
        reader.skipType(tag & 7);
    }
  }
  return info;
}

export function decodeMessagesPerUserInitV2ResponseBody(buffer: Uint8Array): MessagesPerUserInitV2ResponseBody {
  const reader = Reader.create(buffer);
  const body: MessagesPerUserInitV2ResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        if (!body.messages) body.messages = [];
        const lenM = reader.uint32();
        body.messages.push(decodeMessageBody(reader.buf.slice(reader.pos, reader.pos + lenM)));
        reader.pos += lenM;
        break;
      case 2:
        if (!body.conversations) body.conversations = [];
        const lenC = reader.uint32();
        body.conversations.push(decodeConversationInfoV2(reader.buf.slice(reader.pos, reader.pos + lenC)));
        reader.pos += lenC;
        break;
      case 3:
        body.per_user_cursor = reader.int64().toString();
        break;
      case 4:
        body.next_cursor = reader.int64().toString();
        break;
      case 5:
        body.has_more = reader.bool();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

function decodeMessageBody(buffer: Uint8Array): MessageBody {
  const reader = Reader.create(buffer);
  const msg: MessageBody = {};
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        msg.conversation_id = reader.string();
        break;
      case 2:
        msg.conversation_type = reader.int32();
        break;
      case 3:
        msg.server_message_id = reader.int64().toString();
        break;
      case 4:
        msg.index_in_conversation = reader.int64().toString();
        break;
      case 5:
        msg.conversation_short_id = reader.int64().toString();
        break;
      case 6:
        msg.message_type = reader.int32();
        break;
      case 7:
        msg.sender = reader.int64().toString();
        break;
      case 8:
        msg.content = reader.string();
        break;
      case 9:
        msg.ext = {};
        const endExt = reader.uint32() + reader.pos;
        while (reader.pos < endExt) {
          const keyTag = reader.uint32();
          let key = '',
            value = '';
          switch (keyTag >>> 3) {
            case 1:
              key = reader.string();
              break;
            case 2:
              value = reader.string();
              break;
            default:
              reader.skipType(keyTag & 7);
          }
          msg.ext[key] = value;
        }
        break;
      case 10:
        msg.create_time = reader.int64().toString();
        break;
      case 11:
        msg.version = reader.int64().toString();
        break;
      case 12:
        msg.status = reader.int32();
        break;
      case 13:
        msg.order_in_conversation = reader.int64().toString();
        break;
      case 14:
        msg.sec_sender = reader.string();
        break;
      case 15:
        msg.property_list = {};
        const endProp = reader.uint32() + reader.pos;
        while (reader.pos < endProp) {
          const keyTag = reader.uint32();
          let key = '',
            value: any = null;
          switch (keyTag >>> 3) {
            case 1:
              key = reader.string();
              break;
            case 2:
              const lenValue = reader.uint32();
              value = decodePropertyItemList(reader.buf.slice(reader.pos, reader.pos + lenValue));
              reader.pos += lenValue;
              break;
            default:
              reader.skipType(keyTag & 7);
          }
          msg.property_list[key] = value;
        }
        break;
      case 18:
        msg.reference_info = {};
        /* TODO: ReferenceInfo 解码，可改成具体实现 */ reader.skipType(2);
        break;
      default:
        reader.skipType(tag & 7);
    }
  }
  return msg;
}

function decodeParticipant(buffer: Uint8Array): Participant {
  const reader = Reader.create(buffer);
  const p: Participant = {};
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        p.user_id = reader.int64().toString();
        break;
      case 2:
        p.sort_order = reader.int64().toString();
        break;
      case 3:
        p.role = reader.int32();
        break;
      case 4:
        p.alias = reader.string();
        break;
      case 5:
        p.sec_uid = reader.string();
        break;
      case 6:
        p.blocked = reader.int32();
        break;
      case 7:
        p.left_block_time = reader.int64().toString();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }
  return p;
}

function decodeParticipantsPage(buffer: Uint8Array): ParticipantsPage {
  const reader = Reader.create(buffer);
  const page: ParticipantsPage = {};
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        if (!page.participants) page.participants = [];
        const lenP = reader.uint32();
        page.participants.push(decodeParticipant(reader.buf.slice(reader.pos, reader.pos + lenP)));
        reader.pos += lenP;
        break;
      case 2:
        page.has_more = reader.bool();
        break;
      case 3:
        page.cursor = reader.int64().toString();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }
  return page;
}

function decodeConversationCoreInfo(buffer: Uint8Array): ConversationCoreInfo {
  const reader = Reader.create(buffer);
  const info: ConversationCoreInfo = {};
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        info.conversation_id = reader.string();
        break;
      case 2:
        info.conversation_short_id = reader.int64().toString();
        break;
      case 3:
        info.conversation_type = reader.int32();
        break;
      case 4:
        info.info_version = reader.int64().toString();
        break;
      case 5:
        info.name = reader.string();
        break;
      case 6:
        info.desc = reader.string();
        break;
      case 7:
        info.icon = reader.string();
        break;
      case 8:
        info.inbox_type = reader.int32();
        break;
      case 9:
        info.notice = reader.string();
        break;
      case 11:
        info.ext = {};
        const endExt = reader.uint32() + reader.pos;
        while (reader.pos < endExt) {
          const keyTag = reader.uint32();
          let key = '',
            value = '';
          switch (keyTag >>> 3) {
            case 1:
              key = reader.string();
              break;
            case 2:
              value = reader.string();
              break;
            default:
              reader.skipType(keyTag & 7);
          }
          info.ext[key] = value;
        }
        break;
      case 12:
        info.owner = reader.int64().toString();
        break;
      case 13:
        info.sec_owner = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }
  return info;
}

function decodeConversationSettingInfo(buffer: Uint8Array): ConversationSettingInfo {
  const reader = Reader.create(buffer);
  const info: ConversationSettingInfo = {};
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        info.conversation_id = reader.string();
        break;
      case 2:
        info.conversation_short_id = reader.int64().toString();
        break;
      case 3:
        info.conversation_type = reader.int32();
        break;
      case 4:
        info.min_index = reader.int64().toString();
        break;
      case 5:
        info.read_index = reader.int64().toString();
        break;
      case 6:
        info.mute = reader.int32();
        break;
      case 7:
        info.stick_on_top = reader.int32();
        break;
      case 8:
        info.inbox_type = reader.int32();
        break;
      case 9:
        info.ext = {};
        const endExt = reader.uint32() + reader.pos;
        while (reader.pos < endExt) {
          const keyTag = reader.uint32();
          let key = '',
            value = '';
          switch (keyTag >>> 3) {
            case 1:
              key = reader.string();
              break;
            case 2:
              value = reader.string();
              break;
            default:
              reader.skipType(keyTag & 7);
          }
          info.ext[key] = value;
        }
        break;
      case 10:
        info.setting_version = reader.int64().toString();
        break;
      case 11:
        info.favorite = reader.int32();
        break;
      case 12:
        info.set_top_time = reader.int64().toString();
        break;
      case 13:
        info.set_favorite_time = reader.int64().toString();
        break;
      case 30:
        info.push_status = reader.int32();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }
  return info;
}

// ---------- ReferenceInfo ----------
export interface ReferenceInfo {
  referenced_message_id: string | number;
  hint: string;
  ref_message_type: string | number;
  referenced_message_status: number;
  root_message_id?: string | number;
  root_message_conv_index?: string | number;
}

function decodeReferenceInfo(buffer: Uint8Array): ReferenceInfo {
  const reader = Reader.create(buffer);
  const ref: ReferenceInfo = {} as ReferenceInfo;

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        ref.referenced_message_id = reader.int64().toString();
        break;
      case 2:
        ref.hint = reader.string();
        break;
      case 3:
        ref.ref_message_type = reader.int64().toString();
        break;
      case 4:
        ref.referenced_message_status = reader.int32();
        break;
      case 5:
        ref.root_message_id = reader.int64().toString();
        break;
      case 6:
        ref.root_message_conv_index = reader.int64().toString();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  // 验证必填字段
  if (!ref.hasOwnProperty('referenced_message_id')) throw new Error("missing required 'referenced_message_id'");
  if (!ref.hasOwnProperty('hint')) throw new Error("missing required 'hint'");
  if (!ref.hasOwnProperty('ref_message_type')) throw new Error("missing required 'ref_message_type'");
  if (!ref.hasOwnProperty('referenced_message_status')) throw new Error("missing required 'referenced_message_status'");

  return ref;
}

// ---------- NewMessageNotify ----------
interface NewMessageNotify {
  conversation_id?: string;
  conversation_type?: number;
  notify_type?: number;
  message?: MessageBody;
  previous_cursor?: string | number;
  next_cursor?: string | number;
  index_in_conversation?: string | number;
  ref_msg_info?: ReferenceInfo;
}

function decodeNewMessageNotify(buffer: Uint8Array): NewMessageNotify {
  const reader = Reader.create(buffer);
  const notify: NewMessageNotify = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 2:
        notify.conversation_id = reader.string();
        break;
      case 3:
        notify.conversation_type = reader.int32();
        break;
      case 4:
        notify.notify_type = reader.int32();
        break;
      case 5:
        const lenMsg = reader.uint32();
        notify.message = decodeMessageBody(reader.buf.slice(reader.pos, reader.pos + lenMsg));
        reader.pos += lenMsg;
        break;
      case 6:
        notify.previous_cursor = reader.int64().toString();
        break;
      case 7:
        notify.next_cursor = reader.int64().toString();
        break;
      case 8:
        notify.index_in_conversation = reader.int64().toString();
        break;
      case 15:
        const lenRef = reader.uint32();
        notify.ref_msg_info = decodeReferenceInfo(reader.buf.slice(reader.pos, reader.pos + lenRef));
        reader.pos += lenRef;
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return notify;
}

// ---------- StrangerConversation ----------
export interface StrangerConversation {
  conversation_short_id?: string | number;
  unread?: number;
  last_message?: MessageBody;
  conversation_id?: string;
  participants?: Participant[];
  ext?: Record<string, string>;
}

function decodeStrangerConversation(buffer: Uint8Array): StrangerConversation {
  const reader = Reader.create(buffer);
  const conv: StrangerConversation = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        conv.conversation_short_id = reader.int64().toString();
        break;
      case 2:
        conv.unread = reader.int32();
        break;
      case 3:
        const lenMsg = reader.uint32();
        conv.last_message = decodeMessageBody(reader.buf.slice(reader.pos, reader.pos + lenMsg));
        reader.pos += lenMsg;
        break;
      case 4:
        conv.conversation_id = reader.string();
        break;
      case 5:
        if (!conv.participants) conv.participants = [];
        const lenPart = reader.uint32();
        conv.participants.push(decodeParticipant(reader.buf.slice(reader.pos, reader.pos + lenPart)));
        reader.pos += lenPart;
        break;
      case 7:
        if (!conv.ext) conv.ext = {};
        const end = reader.uint32() + reader.pos;
        let key = '',
          value = '';
        while (reader.pos < end) {
          const innerTag = reader.uint32();
          switch (innerTag >>> 3) {
            case 1:
              key = reader.string();
              break;
            case 2:
              value = reader.string();
              break;
            default:
              reader.skipType(innerTag & 7);
          }
        }
        conv.ext[key] = value;
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return conv;
}

// ---------- GetStrangerConversationListResponseBody ----------
interface GetStrangerConversationListResponseBody {
  next_cursor?: string | number;
  has_more?: boolean;
  total_unread?: number;
  conversation_list?: StrangerConversation[];
}

function decodeGetStrangerConversationListResponseBody(buffer: Uint8Array): GetStrangerConversationListResponseBody {
  const reader = Reader.create(buffer);
  const body: GetStrangerConversationListResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        body.next_cursor = reader.int64().toString();
        break;
      case 2:
        body.has_more = reader.bool();
        break;
      case 3:
        body.total_unread = reader.int32();
        break;
      case 4:
        if (!body.conversation_list) body.conversation_list = [];
        const lenConv = reader.uint32();
        body.conversation_list.push(decodeStrangerConversation(reader.buf.slice(reader.pos, reader.pos + lenConv)));
        reader.pos += lenConv;
        break;
      default:
        reader.skipType(tag & 7);
    }
  }

  return body;
}

// ---------- PropertyItem ----------
export interface PropertyItem {
  uid?: string | number;
  sec_uid?: string;
  create_time?: string | number;
  idempotent_id?: string;
  value?: string;
}

function decodePropertyItem(buffer: Uint8Array): PropertyItem {
  const reader = Reader.create(buffer);
  const item: PropertyItem = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        item.uid = reader.int64().toString();
        break;
      case 2:
        item.sec_uid = reader.string();
        break;
      case 3:
        item.create_time = reader.int64().toString();
        break;
      case 4:
        item.idempotent_id = reader.string();
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

// ---------- PropertyItemList ----------
export interface PropertyItemList {
  Items?: PropertyItem[];
}

function decodePropertyItemList(buffer: Uint8Array): PropertyItemList {
  const reader = Reader.create(buffer);
  const list: PropertyItemList = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    if (tag >>> 3 === 1) {
      if (!list.Items) list.Items = [];
      const lenItem = reader.uint32();
      list.Items.push(decodePropertyItem(reader.buf.slice(reader.pos, reader.pos + lenItem)));
      reader.pos += lenItem;
    } else {
      reader.skipType(tag & 7);
    }
  }

  return list;
}

export interface MessagesInConversationResponseBody {
  messages?: any[];
  next_cursor?: string;
  has_more?: boolean;
}

function decodeMessagesInConversationResponseBody(buffer: Uint8Array): MessagesInConversationResponseBody {
  const reader = Reader.create(buffer);
  const result: MessagesInConversationResponseBody = {};

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      // messages repeated MessageBody
      case 1: {
        if (!result.messages) result.messages = [];
        const len = reader.uint32();
        result.messages.push(decodeMessageBody(reader.buf.slice(reader.pos, reader.pos + len)));
        reader.pos += len;
        break;
      }

      // next_cursor int64
      case 2:
        result.next_cursor = reader.int64().toString();
        break;

      // has_more bool
      case 3:
        result.has_more = reader.bool();
        break;

      default:
        reader.skipType(tag & 7);
    }
  }

  return result;
}
