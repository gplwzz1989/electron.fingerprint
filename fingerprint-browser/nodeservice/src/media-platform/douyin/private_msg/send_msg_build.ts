import * as light from 'protobufjs/light';

// send_message_body encode
function encodeSendMessageBody(e: any, t?: light.Writer): light.Writer {
  t = t || light.Writer.create();
  if (e.conversation_id != null) t.uint32(10).string(e.conversation_id);
  if (e.conversation_type != null) t.uint32(16).int32(e.conversation_type);
  if (e.conversation_short_id != null) t.uint32(24).int64(e.conversation_short_id);
  if (e.content != null) t.uint32(34).string(e.content);
  if (e.ext != null) {
    for (const key of Object.keys(e.ext)) {
      t.uint32(42).fork().uint32(10).string(key).uint32(18).string(e.ext[key]).ldelim();
    }
  }
  if (e.message_type != null) t.uint32(48).int32(e.message_type);
  if (e.ticket != null) t.uint32(58).string(e.ticket);
  if (e.client_message_id != null) t.uint32(66).string(e.client_message_id);
  if (e.mentioned_users?.length) {
    for (const user of e.mentioned_users) t.uint32(72).int64(user);
  }
  if (e.ref_msg_info != null) {
    // 这里字段未知，临时用0占位
    t.uint32(90).fork().uint32(0).ldelim();
  }
  return t;
}

function encodeMessagesPerUserBody(e: any, t: light.Writer) {
  const w = t || light.Writer.create();
  if (e.cursor != null) w.uint32(8).int64(e.cursor);

  if (e.limit != null) w.uint32(16).int32(e.limit);

  return w;
}

function encodeMessagesPerUserInitV2Body(e: any, t?: light.Writer): protobuf.Writer {
  const w = t || light.Writer.create();

  if (e.cursor != null) w.uint32(8).int64(e.cursor); // field 1

  if (e.new_user != null) w.uint32(16).int32(e.new_user); // field 2

  if (e.init_sub_type != null) w.uint32(24).int32(e.init_sub_type); // field 3

  if (e.conv_limit != null) w.uint32(32).int32(e.conv_limit); // field 4

  if (e.msg_limit != null) w.uint32(40).int32(e.msg_limit); // field 5

  return w;
}

function encodeGetMessageByIdBody(e: any, t?: protobuf.Writer): protobuf.Writer {
  const w = t || light.Writer.create();

  if (e.conversation_id != null) w.uint32(10).string(e.conversation_id); // field 1 (1 << 3 | 2)

  if (e.conversation_type != null) w.uint32(16).int32(e.conversation_type); // field 2 (2 << 3 | 0)

  if (e.conversation_short_id != null) w.uint32(24).int64(e.conversation_short_id); // field 3 (3 << 3 | 0)

  if (e.server_message_id != null) w.uint32(32).int64(e.server_message_id); // field 4 (4 << 3 | 0)

  return w;
}

function encodeGetStrangerConversationBody(e: any, t?: light.Writer): light.Writer {
  if (!t) {
    t = light.Writer.create();
  }
  if (e.cursor != null && Object.hasOwnProperty.call(e, 'cursor')) {
    t.uint32(8).int64(e.cursor);
  }

  if (e.count != null && Object.hasOwnProperty.call(e, 'count')) {
    t.uint32(16).int64(e.count);
  }

  if (e.show_total_unread != null && Object.hasOwnProperty.call(e, 'show_total_unread')) {
    t.uint32(24).bool(e.show_total_unread);
  }

  return t;
}

function encodeGetStrangerMessagesBody(e: any, t?: light.Writer): light.Writer {
  if (!t) {
    t = light.Writer.create();
  }
  if (e.conversation_short_id != null && Object.hasOwnProperty.call(e, 'conversation_short_id')) {
    t.uint32(8).int64(e.conversation_short_id);
  }

  if (e.reset_unread_count != null && Object.hasOwnProperty.call(e, 'reset_unread_count')) {
    t.uint32(16).bool(e.reset_unread_count);
  }

  return t;
}

function encodeMessagesInConversationBody(e: any, t?: light.Writer): light.Writer {
  if (!t) {
    t = light.Writer.create();
  }

  if (e.conversation_id != null && Object.hasOwnProperty.call(e, 'conversation_id')) {
    t.uint32(10).string(e.conversation_id);
  }

  if (e.conversation_type != null && Object.hasOwnProperty.call(e, 'conversation_type')) {
    t.uint32(16).int32(e.conversation_type);
  }

  if (e.conversation_short_id != null && Object.hasOwnProperty.call(e, 'conversation_short_id')) {
    t.uint32(24).int64(e.conversation_short_id);
  }

  if (e.direction != null && Object.hasOwnProperty.call(e, 'direction')) {
    t.uint32(32).int32(e.direction);
  }

  if (e.anchor_index != null && Object.hasOwnProperty.call(e, 'anchor_index')) {
    t.uint32(40).int64(e.anchor_index);
  }

  if (e.limit != null && Object.hasOwnProperty.call(e, 'limit')) {
    t.uint32(48).int32(e.limit);
  }

  return t;
}

// body encode
function encodeRequestBody(e: RequestBody, t?: light.Writer): light.Writer {
  t = t || light.Writer.create();
  //发送消息
  if (e.send_message_body != null) {
    t.uint32(802).fork();
    encodeSendMessageBody(e.send_message_body, t);
    t.ldelim();
  }
  //获取新消息
  if (e.messages_per_user_body != null) {
    t.uint32(1602).fork();
    encodeMessagesPerUserBody(e.messages_per_user_body, t);
    t.ldelim();
  }
  //初始化对话列表
  if (e.messages_per_user_init_v2_body != null) {
    t.uint32(1626).fork();
    encodeMessagesPerUserInitV2Body(e.messages_per_user_init_v2_body, t);
    t.ldelim();
  }

  //根据id获取消息
  if (e.get_message_by_id_body != null) {
    t.uint32(1690).fork();
    encodeGetMessageByIdBody(e.get_message_by_id_body, t);
    t.ldelim();
  }

  //获取新的会话列表
  if (e.get_stranger_conversation_body != null) {
    t.uint32(8002).fork();
    encodeGetStrangerConversationBody(e.get_stranger_conversation_body, t);
    t.ldelim();
  }

  //获取新会话消息
  if (e.get_stranger_messages_body != null) {
    t.uint32(8010).fork();
    encodeGetStrangerMessagesBody(e.get_stranger_messages_body, t);
    t.ldelim();
  }

  //历史消息
  if (e.messages_in_conversation_body != null) {
    t.uint32(2410).fork();
    encodeMessagesInConversationBody(e.messages_in_conversation_body, t);
    t.ldelim();
  }

  //

  return t;
}

function encodeRequestHeaders(e: any, t: light.Writer) {
  for (const key of Object.keys(e.headers)) {
    t.uint32(122).fork().uint32(10).string(key).uint32(18).string(e.headers[key].toString()).ldelim();
  }
}

// request encode
export function encodeRequest(e: any, t?: light.Writer): light.Writer {
  t = t || light.Writer.create();
  if (e.cmd != null) t.uint32(8).int32(e.cmd);
  if (e.sequence_id != null) t.uint32(16).int64(e.sequence_id);
  if (e.sdk_version != null) t.uint32(26).string(e.sdk_version);
  if (e.token != null) t.uint32(34).string(e.token);
  if (e.refer != null) t.uint32(40).int32(e.refer);
  if (e.inbox_type != null) t.uint32(48).int32(e.inbox_type);
  if (e.build_number != null) t.uint32(58).string(e.build_number);
  if (e.body != null) {
    t.uint32(66).fork();
    encodeRequestBody(e.body, t);
    t.ldelim();
  }
  if (e.device_id != null) t.uint32(74).string(e.device_id?.toString() ?? '0');
  if (e.device_platform != null) t.uint32(90).string(e.device_platform);
  if (e.version_code != null) t.uint32(114).string(e.version_code?.toString() ?? '');
  if (e.headers != null && e.headers_before_auth) {
    encodeRequestHeaders(e, t);
  }
  if (e.auth_type != null) t.uint32(144).int32(e.auth_type);
  if (e.biz != null) t.uint32(170).string(e.biz);
  if (e.access != null) t.uint32(178).string(e.access);
  if (e.ts_sign != null) t.uint32(186).string(e.ts_sign);
  if (e.sdk_cert != null) t.uint32(194).string(e.sdk_cert);
  if (e.reuqest_sign != null) t.uint32(202).string(e.reuqest_sign);

  // headers处理
  if (e.headers != null && !e.headers_before_auth) {
    encodeRequestHeaders(e, t);
  }

  return t;
}

export interface RequestBody {
  send_message_body?: any;
  messages_per_user_body?: any;
  messages_per_user_init_v2_body?: any;
  get_message_by_id_body?: any;
  messages_in_conversation_body?: any;
  get_messages_checkinfo_in_conversation_body?: any;
  send_user_action_body?: any;
  send_input_status_body?: any;
  delete_conversation_body?: any;
  mark_conversation_read_body?: any;
  conversation_participants_body?: any;
  create_conversation_v2_body?: any;
  get_conversation_info_list_v2_body?: any;
  get_conversation_info_list_by_favorite_v2_body?: any;
  get_conversation_info_list_by_top_v2_body?: any;
  dissolve_conversation_body?: any;
  conversation_add_participants_body?: any;
  conversation_remove_participants_body?: any;
  leave_conversation_body?: any;
  mget_conversation_participants_body?: any;
  update_conversation_participant_body?: any;
  delete_message_body?: any;
  recall_message_body?: any;
  modify_message_property_body?: any;
  get_conversation_core_info_body?: any;
  set_conversation_core_info_body?: any;
  upsert_conversation_core_ext_info_body?: any;
  set_conversation_setting_info_body?: any;
  upsert_conversation_setting_ext_info_body?: any;
  get_stranger_conversation_body?: any;
  get_stranger_messages_body?: any;
  delete_stranger_message_body?: any;
  delete_stranger_conversation_body?: any;
  delete_stranger_all_conversation_body?: any;
  mark_stranger_conversation_read_body?: any;
  mark_stranger_all_conversation_read_body?: any;
  participants_read_index_body?: any;
  participants_min_index_body?: any;
  get_upload_token_body?: any;
  get_media_urls_body?: any;
  get_ticket_body?: any;
  get_conversation_list_body?: any;
  broadcast_send_message_body?: any;
  broadcast_recv_message_body?: any;
  broadcast_user_counter_body?: any;
  client_ack_body?: any;
  create_voip_body?: any;
  call_voip_body?: any;
  update_voip_body?: any;
  channel_heartbeat_body?: any;
  profile_get_info?: any;
  report_client_metrics_body?: any;
  get_configs_body?: any;
  unread_count_report_body?: any;
  block_members_body?: any;
  block_conversation_body?: any;
  modify_message_ext_body?: any;
  get_unread_count_body?: any;
  send_message_p2p_body?: any;
  get_blocklist_body?: any;
  set_blocklist_body?: any;
  check_in_blocklist_body?: any;
  mark_message_body?: any;
  pull_mark_message_body?: any;
  batch_get_conversation_participants_readindex?: any;
  message_by_init?: any;
  mark_msg_unread_count_report?: any;
  mark_msg_get_unread_count?: any;
  batch_unmark_message?: any;
  client_batch_ack_body?: any;
  audio_recognition_body?: any;
}
