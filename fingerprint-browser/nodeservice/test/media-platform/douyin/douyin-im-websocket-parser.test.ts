import { Writer } from 'protobufjs/light';
import { describe, expect, test } from 'vitest';
import WebSocket from 'ws';

import {
  decodeDouyinImResponse,
  decodeDouyinImPushFrame,
  DouyinImCommand,
  extractDouyinImResponsePayload,
  normalizeDouyinImWebSocketData,
  normalizeDouyinNewMessageNotify,
  parseDouyinImWebSocketFrame,
  previewDouyinImBuffer,
} from '../../../src/media-platform/douyin/private_msg/douyin-im-websocket-parser';

const DOUYIN_FRONTIER_IM_WS_URL =
  'wss://frontier-im.douyin.com/ws/v2?device_platform=web&version_code=fws_1.0.0&access_key=a8e9bfd979016dc42b302717be9ae98a&fpid=9&aid=6383&device_id=77354322772&xsack=0&xaack=0&xsqos=0&qos_sdk_version=2';
const DOUYIN_FRONTIER_IM_COOKIE = `enter_pc_once=1; UIFID_TEMP=e8af8eec168e6006bb749042c72c8d2abad7941d853b8500624783ee98d61da678a247a12ce7f15f7271ab6aab258f2730f44a47eb638e6f464ed9b2e893fbc4439eb3d31d902d06c80a214642890349; s_v_web_id=verify_mpq8mghc_VLeOoGRI_mWCF_4hp8_A3GV_AitmL2xzktxj; is_support_rtm_web_ts=1; dy_swidth=1477; dy_sheight=831; hevc_supported=true; fpk1=U2FsdGVkX1+ixjesbvKQcT1tZ6HpBaDomillbGRkES+t5xuRNU1jDvsNqV3C53W4ap2tDTtBtJJTrogypD2LXg==; fpk2=90daa551604269dbcdcf237b5cc700f3; strategyABtestKey=%221780017779.75%22; passport_csrf_token=312b77e11f98ba58a0b1b9b2b38f924f; passport_csrf_token_default=312b77e11f98ba58a0b1b9b2b38f924f; ttwid=1%7CrNVUdY8aI6bq0rfNOIhwGUoX6XvN2bKqWR90h4Bo9Pg%7C1780017782%7C074a769486d973aebf414d4b04eca6f1679771d09d68dc5646981f40ccfcd77c; bd_ticket_guard_client_web_domain=2; passport_mfa_token=CjUqm72wuMq%2FkJEyiulMa7M1Ci86cTn7Yl8WtfmZPERUxylDBjGpQQR7VBDYCrIvqlo9q9m63BpKCjwAAAAAAAAAAAAAUHlj4f6BEiXnGJKYH9SssHsZiy5oDxdc%2BAziFhmcLncifPnzwUYm%2FmjWQtJZyC7%2FNEwQ0dqSDhj2sdFsIAIiAQMYI2%2Bg; d_ticket=2c2caffdd5266850a72eb181cf3e59fef96b8; passport_assist_user=Cjwg5HItN5BOjFdP7apiL7tqveHX3kBq3eqpZHY5qU7Ul-va7kgbyO_FL0YCBmcm7KptzfP470eSt_o-h-YaSgo8AAAAAAAAAAAAAFB5WmewrcBDCxdS6iv-u6Itn-h2b9VqdIpRN9lnlVUGmzoeekx0RgPYsZ5K9JIPJKRRENnakg4Yia_WVCABIgEDUJO1xA%3D%3D; n_mh=byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4; sid_guard=47aac26950ff412f3af9001d38efd737%7C1780017818%7C5184000%7CTue%2C+28-Jul-2026+01%3A23%3A38+GMT; uid_tt=082906c1ab0deaec6e1ae70504dbb8ca; uid_tt_ss=082906c1ab0deaec6e1ae70504dbb8ca; sid_tt=47aac26950ff412f3af9001d38efd737; sessionid=47aac26950ff412f3af9001d38efd737; sessionid_ss=47aac26950ff412f3af9001d38efd737; session_tlb_tag=sttt%7C12%7CR6rCaVD_QS86-QAdOO_XN_________-1tUEHOD_SPF1ARs9RPup7mDXb9dzu-Pyflxr5gZr_64g%3D; is_staff_user=false; has_biz_token=false; sid_ucp_v1=1.0.0-KDRhOGU2ZjBiYzVkNmZkMzg5NDc5MjIxODkwZDQzNzg1Y2I5ZTI1ZWMKHwjUlrWVoAIQmtXj0AYY7zEgDDCJ4uPQBTgHQPQHSAQaAmhsIiA0N2FhYzI2OTUwZmY0MTJmM2FmOTAwMWQzOGVmZDczNw; ssid_ucp_v1=1.0.0-KDRhOGU2ZjBiYzVkNmZkMzg5NDc5MjIxODkwZDQzNzg1Y2I5ZTI1ZWMKHwjUlrWVoAIQmtXj0AYY7zEgDDCJ4uPQBTgHQPQHSAQaAmhsIiA0N2FhYzI2OTUwZmY0MTJmM2FmOTAwMWQzOGVmZDczNw; _bd_ticket_crypt_cookie=ca6234ba431f9c9b6ca4336a1515f09d; __security_mc_1_s_sdk_sign_data_key_web_protect=e1d31d0f-4868-bdca; __security_mc_1_s_sdk_cert_key=ecb26db0-410e-8b70; __security_mc_1_s_sdk_crypt_sdk=bee45cc4-427e-8a3f; __security_server_data_status=1; login_time=1780017817699; is_dash_user=1; UIFID=e8af8eec168e6006bb749042c72c8d2abad7941d853b8500624783ee98d61da6d81d0c648896a48e420ae39b59bf24b9a43619ba91285ed510041b04130d23a34fb9bc9a602db487ba3c707f3affc0268117a1b9f3fc3312d2cb802f2e19cf32793ea15635a0099810c132aa1bad93d013f0bd794415b0799e23f7a515d9740989f33c7f577adf6455da9a8001bbe7440e614d54400f121e1033bab039be9fc8; stream_recommend_feed_params=%22%7B%5C%22cookie_enabled%5C%22%3Atrue%2C%5C%22screen_width%5C%22%3A1477%2C%5C%22screen_height%5C%22%3A831%2C%5C%22browser_online%5C%22%3Atrue%2C%5C%22cpu_core_num%5C%22%3A6%2C%5C%22device_memory%5C%22%3A32%2C%5C%22downlink%5C%22%3A5.85%2C%5C%22effective_type%5C%22%3A%5C%224g%5C%22%2C%5C%22round_trip_time%5C%22%3A100%7D%22; SelfTabRedDotControl=%5B%7B%22id%22%3A%227574432070844287027%22%2C%22u%22%3A21%2C%22c%22%3A0%7D%2C%7B%22id%22%3A%227484258221582977034%22%2C%22u%22%3A26%2C%22c%22%3A0%7D%5D; FOLLOW_LIVE_POINT_INFO=%22MS4wLjABAAAAD6xhDbsKTwKbFSKbE5GjZ60IKR_n4HD9QzZ3hhlgdpo%2F1780070400000%2F0%2F1780017821492%2F0%22; home_can_add_dy_2_desktop=%221%22; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCTk1rcnZsRW9lL2ZDTnNFMFUrV1hGUEIvbTNKVWt1bFB4UUtRZ2V6bGptY3ZDWFpHUEFIOXFMTWxuZlExaTZtQWIwQUpUdUZCTWFJL0RoTExYZ1ROb0E9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; biz_trace_id=66974fbb; odin_tt=0e467e7bcc65c3df4ba5b7d4ce737ce21e54c23783b7db3217d5d15eedf768858a2cfc0a2486b5f64834ff11e78c3ae5; publish_badge_show_info=%221%2C0%2C0%2C1780017823607%22; sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e582729277672715a646971273f2763646976602729277f6b5a666475273f2763646976602729276d6a6e5a6b6a716c273f2763646976602729276c6b6f5a7f6367273f27636469766027292771273f27303732323635353735353d3234272927676c715a75776a716a666a69273f2763646976602778; bit_env=toeURe_ggcKCkyNsc8phMPgeMmk5wk0QQV1J4ZXKx-199LP3mlEQpfW2vS9EFnzfXuPGsWMTl_QK8-zvxcRJAPtAaobkmBTUgSoKLbjoFPY6xxPAXokNtUpcc63ZJ_GxUOyHVNWeG6qd5ir56YVtITcMtVjSPgqBKCVH2mwbU0gipt_w2pBKvjEO9zpZpuozdfnlsXixACJJb5D11CE9yEeBFo2idqbtF16cVA8TkEsUP2peZ3RbsyxOxJmphEIM8dpq2haweSpu6EkuNxOZR8B_MJJXxd5uZUs1osKmTTIWoCjCNjz2_Wp7nEeuhuyy_LAEdX_hm6HH6k19oxFRDlK4fKwqo8cgbrbryX_YTOGR8bHP8xnqMH-Fwn-nzA-BL5amItRuZ1-vn6_h0qnKs7gQfIUrj45MA_W-wy-kuoV92h9tMRRkIChcP1pZw2JSK-ses9YTtZ7Z4CgSLdTLxf9CP3TOd87EPHb0-5BqmVCwtKgxQ9SQNfPdycqfYiqA; gulu_source_res=eyJwX2luIjoiYzI2YmJhYzE0ZTUwZDg3M2I0OGE2ZmEwMGJiODE4NzA5MzQ3N2ZhODY1MmFkYmNjODJkZDcyOWQxOTJhZjhlNCJ9; passport_auth_mix_state=rail0qrpkqx7nxr5kj0yfmg0owkkx0um; bd_ticket_guard_client_data_v2=eyJyZWVfcHVibGljX2tleSI6IkJOTWtydmxFb2UvZkNOc0UwVStXWEZQQi9tM0pVa3VsUHhRS1FnZXpsam1jdkNYWkdQQUg5cUxNbG5mUTFpNm1BYjBBSlR1RkJNYUkvRGhMTFhnVE5vQT0iLCJ0c19zaWduIjoidHMuMi5hZTFhZDcyMDQ0MjBlMjE2MThkNDdmZGVlNjY1MGU4Yzc3ZWVkM2Q3YjE5YTlmMjdiY2NlMDk0YThlNmRmYTM5YzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiI0M3Z6QVdIaXlnQldNbzVNcUljZW1yZ1pWbXkxYXdld1A2aXJja0RmSERVPSIsInNlY190cyI6IiMxZjkzZFRMT2xneUJRWVlSbDRRUXFkblo4Nmk3LzY0KytPTTlmSjMrbXVuZXB0Wm9OYWdqN1F4ZUc2c3cifQ%3D%3D; IsDouyinActive=false; __ac_nonce=06a18f37300f4fd531c1e; __ac_signature=_02B4Z6wo00f01807wHQAAIDCmbzgMKykU9PNG8TAAJlf1c`;
const DOUYIN_FRONTIER_IM_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';

function writeInt64(writer: Writer, fieldNumber: number, value: string | number) {
  writer.uint32((fieldNumber << 3) | 0).int64(value);
}

function writeInt32(writer: Writer, fieldNumber: number, value: number) {
  writer.uint32((fieldNumber << 3) | 0).int32(value);
}

function writeBool(writer: Writer, fieldNumber: number, value: boolean) {
  writer.uint32((fieldNumber << 3) | 0).bool(value);
}

function writeString(writer: Writer, fieldNumber: number, value: string) {
  writer.uint32((fieldNumber << 3) | 2).string(value);
}

function writeBytes(writer: Writer, fieldNumber: number, value: Uint8Array) {
  writer.uint32((fieldNumber << 3) | 2).bytes(value);
}

function encodeStringMapEntry(key: string, value: string): Uint8Array {
  const writer = Writer.create();
  writeString(writer, 1, key);
  writeString(writer, 2, value);
  return writer.finish();
}

function encodePropertyItemListValue(value: string): Uint8Array {
  const writer = Writer.create();
  writer.uint32((1 << 3) | 2).fork();
  writeInt64(writer, 1, '10001');
  writeString(writer, 2, 'MS4wLjABAAAA-demo');
  writeInt64(writer, 3, '1717000000');
  writeString(writer, 4, 'idempotent-demo');
  writeString(writer, 5, value);
  writer.ldelim();
  return writer.finish();
}

function encodePropertyItemListEntry(key: string, value: string): Uint8Array {
  const writer = Writer.create();
  writeString(writer, 1, key);
  writeBytes(writer, 2, encodePropertyItemListValue(value));
  return writer.finish();
}

function encodeReferenceInfo(): Uint8Array {
  const writer = Writer.create();
  writeInt64(writer, 1, '9876543210');
  writeString(writer, 2, '引用消息');
  writeInt64(writer, 3, '7');
  writeInt32(writer, 4, 1);
  writeInt64(writer, 5, '1234567890');
  writeInt64(writer, 6, '654321');
  return writer.finish();
}

function encodeMessageBody(): Uint8Array {
  const writer = Writer.create();
  writeString(writer, 1, '0:1:77354322772:4068652235364903');
  writeInt32(writer, 2, 1);
  writeInt64(writer, 3, '7654321987654321');
  writeInt64(writer, 4, '128');
  writeInt64(writer, 5, '7574694434030371374');
  writeInt32(writer, 6, 7);
  writeInt64(writer, 7, '77354322772');
  writeString(
    writer,
    8,
    JSON.stringify({
      text: '你好，抖音',
      aweType: 700,
    }),
  );
  writeBytes(writer, 9, encodeStringMapEntry('s:client_message_id', 'client-message-id'));
  writeInt64(writer, 10, '1717040000123');
  writeInt64(writer, 11, '9');
  writeInt32(writer, 12, 0);
  writeInt64(writer, 13, '128');
  writeString(writer, 14, 'MS4wLjABAAAA-demo');
  writeBytes(writer, 15, encodePropertyItemListEntry('s:property_test', 'property-value'));
  writeBytes(writer, 18, encodeReferenceInfo());
  return writer.finish();
}

function encodeNewMessageNotify(): Uint8Array {
  const writer = Writer.create();
  writeString(writer, 2, '0:1:77354322772:4068652235364903');
  writeInt32(writer, 3, 1);
  writeInt32(writer, 4, 2);
  writeBytes(writer, 5, encodeMessageBody());
  writeInt64(writer, 6, '1717039999999');
  writeInt64(writer, 7, '1717040000123');
  writeInt64(writer, 8, '128');
  writeBytes(writer, 15, encodeReferenceInfo());
  return writer.finish();
}

function encodeMessagesInConversation(): Uint8Array {
  const writer = Writer.create();
  writeBytes(writer, 1, encodeMessageBody());
  writeInt64(writer, 2, '1717040000123');
  writeBool(writer, 3, true);
  return writer.finish();
}

function encodeParticipantsPage(): Uint8Array {
  const writer = Writer.create();
  writer.uint32((1 << 3) | 2).fork();
  writeInt64(writer, 1, '77354322772');
  writeInt64(writer, 2, '1');
  writeInt32(writer, 3, 1);
  writeString(writer, 4, '测试用户');
  writeString(writer, 5, 'MS4wLjABAAAA-user');
  writer.ldelim();
  writeBool(writer, 2, false);
  writeInt64(writer, 3, '0');
  return writer.finish();
}

function encodeConversationCoreInfo(): Uint8Array {
  const writer = Writer.create();
  writeString(writer, 1, '0:1:77354322772:4068652235364903');
  writeInt64(writer, 2, '7574694434030371374');
  writeInt32(writer, 3, 1);
  writeInt64(writer, 4, '11');
  writeString(writer, 5, '测试会话');
  writeString(writer, 6, '会话描述');
  writeString(writer, 7, 'https://example.com/avatar.png');
  writeInt32(writer, 8, 1);
  writeString(writer, 9, '公告');
  writeBytes(writer, 11, encodeStringMapEntry('ext_key', 'ext_value'));
  writeInt64(writer, 12, '77354322772');
  writeString(writer, 13, 'MS4wLjABAAAA-owner');
  return writer.finish();
}

function encodeConversationSettingInfo(): Uint8Array {
  const writer = Writer.create();
  writeString(writer, 1, '0:1:77354322772:4068652235364903');
  writeInt64(writer, 2, '7574694434030371374');
  writeInt32(writer, 3, 1);
  writeInt64(writer, 4, '1');
  writeInt64(writer, 5, '128');
  writeInt32(writer, 6, 0);
  writeInt32(writer, 7, 0);
  writeInt32(writer, 8, 1);
  writeBytes(writer, 9, encodeStringMapEntry('setting_key', 'setting_value'));
  writeInt64(writer, 10, '18');
  writeInt32(writer, 11, 0);
  writeInt64(writer, 12, '1717040000000');
  writeInt64(writer, 13, '1717040000001');
  writeInt32(writer, 30, 1);
  return writer.finish();
}

function encodeConversationInfoV2(): Uint8Array {
  const writer = Writer.create();
  writeString(writer, 1, '0:1:77354322772:4068652235364903');
  writeInt64(writer, 2, '7574694434030371374');
  writeInt32(writer, 3, 1);
  writeString(writer, 4, 'ticket-demo');
  writeBytes(writer, 6, encodeParticipantsPage());
  writeInt32(writer, 7, 1);
  writeBool(writer, 8, true);
  writeInt32(writer, 9, 1);
  writer.uint32((20 << 3) | 2).fork();
  writeInt64(writer, 1, '77354322772');
  writeInt64(writer, 2, '1');
  writeInt32(writer, 3, 1);
  writeString(writer, 4, '测试用户');
  writeString(writer, 5, 'MS4wLjABAAAA-user');
  writer.ldelim();
  writeBytes(writer, 50, encodeConversationCoreInfo());
  writeBytes(writer, 51, encodeConversationSettingInfo());
  return writer.finish();
}

function encodeMessagesPerUserInitV2(): Uint8Array {
  const writer = Writer.create();
  writeBytes(writer, 1, encodeMessageBody());
  writeBytes(writer, 2, encodeConversationInfoV2());
  writeInt64(writer, 3, '100');
  writeInt64(writer, 4, '200');
  writeBool(writer, 5, true);
  return writer.finish();
}

function encodeStrangerConversation(): Uint8Array {
  const writer = Writer.create();
  writeInt64(writer, 1, '8888888888');
  writeInt32(writer, 2, 3);
  writeBytes(writer, 3, encodeMessageBody());
  writeString(writer, 4, '0:1:77354322772:99999999');
  writer.uint32((5 << 3) | 2).fork();
  writeInt64(writer, 1, '90001');
  writeInt64(writer, 2, '1');
  writeInt32(writer, 3, 1);
  writeString(writer, 4, '陌生人');
  writeString(writer, 5, 'MS4wLjABAAAA-stranger');
  writer.ldelim();
  writeBytes(writer, 7, encodeStringMapEntry('stranger_key', 'stranger_value'));
  return writer.finish();
}

function encodeStrangerConversations(): Uint8Array {
  const writer = Writer.create();
  writeInt64(writer, 1, '300');
  writeBool(writer, 2, true);
  writeInt32(writer, 3, 6);
  writeBytes(writer, 4, encodeStrangerConversation());
  return writer.finish();
}

function encodeResponseBody(fieldNumber: number, payload: Uint8Array): Uint8Array {
  const writer = Writer.create();
  writeBytes(writer, fieldNumber, payload);
  return writer.finish();
}

function encodeResponse(fieldNumber: number, payload: Uint8Array, cmd = fieldNumber): Uint8Array {
  const writer = Writer.create();
  writeInt32(writer, 1, cmd);
  writeInt64(writer, 2, '10001');
  writeInt32(writer, 3, 0);
  writeString(writer, 4, '');
  writeInt32(writer, 5, 1);
  writeBytes(writer, 6, encodeResponseBody(fieldNumber, payload));
  writeString(writer, 7, 'log-001');
  writeBytes(writer, 8, encodeStringMapEntry('trace-id', 'trace-demo'));
  writeInt64(writer, 9, '1717040000000');
  writeInt64(writer, 10, '1717040000001');
  writeInt64(writer, 11, '1717040000002');
  return writer.finish();
}

function encodePushFrame(payload: Uint8Array, headers?: Array<{ key: string; value: string }>): Uint8Array {
  const writer = Writer.create();
  writeInt64(writer, 1, '10001');
  writeInt64(writer, 2, '20002');
  writeInt32(writer, 3, 5);
  writeInt32(writer, 4, 1);
  for (const header of headers ?? []) {
    writeBytes(writer, 5, encodeStringMapEntry(header.key, header.value));
  }
  writeString(writer, 6, 'pb');
  writeString(writer, 7, 'Response');
  writeBytes(writer, 8, payload);
  return writer.finish();
}

function safePrint(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(title);
    return;
  }

  try {
    console.log(title, JSON.stringify(payload, null, 2));
  } catch (error) {
    console.log(title, payload);
  }
}

describe('抖音 IM WebSocket 独立解析器', () => {
  test('可以识别心跳文本帧', () => {
    const frame = parseDouyinImWebSocketFrame('hi');
    expect(frame.kind).toBe('heartbeat');
  });

  test('可以解析 cmd=500 的新消息通知', () => {
    const response = decodeDouyinImResponse(
      encodeResponse(DouyinImCommand.HasNewMessageNotify, encodeNewMessageNotify()),
    );

    expect(response.cmd).toBe(DouyinImCommand.HasNewMessageNotify);
    expect(response.body?.hasNewMessageNotify?.conversationId).toBe('0:1:77354322772:4068652235364903');
    expect(response.body?.hasNewMessageNotify?.message?.serverMessageId).toBe('7654321987654321');
    expect(response.body?.hasNewMessageNotify?.message?.propertyList?.['s:property_test']?.items?.[0]?.value).toBe(
      'property-value',
    );

    const normalizedMessage = normalizeDouyinNewMessageNotify(response.body?.hasNewMessageNotify);
    expect(normalizedMessage?.contentText).toBe('你好，抖音');
    expect(normalizedMessage?.senderSecUserId).toBe('MS4wLjABAAAA-demo');
  });

  test('可以解析 cmd=301 的会话历史消息', () => {
    const response = decodeDouyinImResponse(
      encodeResponse(DouyinImCommand.MessagesInConversation, encodeMessagesInConversation()),
    );

    expect(response.body?.messagesInConversation?.hasMore).toBe(true);
    expect(response.body?.messagesInConversation?.nextCursor).toBe('1717040000123');
    expect(response.body?.messagesInConversation?.messages?.[0]?.content).toContain('你好，抖音');
  });

  test('可以解析 cmd=203 的会话初始化数据', () => {
    const response = decodeDouyinImResponse(
      encodeResponse(DouyinImCommand.MessagesPerUserInitV2, encodeMessagesPerUserInitV2()),
    );

    const conversation = response.body?.messagesPerUserInitV2?.conversations?.[0];
    expect(response.body?.messagesPerUserInitV2?.hasMore).toBe(true);
    expect(conversation?.conversationCoreInfo?.name).toBe('测试会话');
    expect(conversation?.conversationSettingInfo?.pushStatus).toBe(1);
    expect(conversation?.firstPageParticipants?.participants?.[0]?.secUid).toBe('MS4wLjABAAAA-user');
  });

  test('可以解析 cmd=1000 的陌生人会话列表', () => {
    const response = decodeDouyinImResponse(
      encodeResponse(DouyinImCommand.GetStrangerConversationList, encodeStrangerConversations()),
    );

    const conversation = response.body?.strangerConversations?.conversationList?.[0];
    expect(response.body?.strangerConversations?.totalUnread).toBe(6);
    expect(conversation?.participants?.[0]?.alias).toBe('陌生人');
    expect(conversation?.ext?.stranger_key).toBe('stranger_value');
  });

  test('可以兼容多种二进制输入形态', () => {
    const protobufPayload = encodeResponse(DouyinImCommand.MessagesInConversation, encodeMessagesInConversation());
    const arrayBuffer = protobufPayload.buffer.slice(
      protobufPayload.byteOffset,
      protobufPayload.byteOffset + protobufPayload.byteLength,
    );

    const normalizedBuffer = normalizeDouyinImWebSocketData(arrayBuffer);
    expect(Buffer.isBuffer(normalizedBuffer)).toBe(true);

    const frame = parseDouyinImWebSocketFrame(new Uint8Array(protobufPayload));
    expect(frame.kind).toBe('protobuf');
    if (frame.kind === 'protobuf') {
      expect(frame.response.body?.messagesInConversation?.messages?.[0]?.serverMessageId).toBe('7654321987654321');
    }
  });

  test('可以先解析 PushFrame 再解析 Response', () => {
    const responsePayload = encodeResponse(DouyinImCommand.HasNewMessageNotify, encodeNewMessageNotify());
    const pushFramePayload = encodePushFrame(responsePayload, [{ key: 'im-internal_ext', value: 'demo-ext' }]);

    const pushFrame = decodeDouyinImPushFrame(pushFramePayload);
    expect(pushFrame.payloadType).toBe('Response');
    expect(pushFrame.headers?.[0]?.key).toBe('im-internal_ext');

    const extractedPayload = extractDouyinImResponsePayload(pushFrame);
    expect(Buffer.compare(Buffer.from(extractedPayload), Buffer.from(responsePayload))).toBe(0);

    const frame = parseDouyinImWebSocketFrame(pushFramePayload);
    expect(frame.kind).toBe('protobuf');
    if (frame.kind === 'protobuf') {
      expect(frame.pushFrame?.seqId).toBe('10001');
      expect(frame.response.cmd).toBe(DouyinImCommand.HasNewMessageNotify);
    }
  });

  test('可以解析 payload_type=text/json 的 PushFrame', () => {
    const jsonPayload = Buffer.from(
      JSON.stringify({
        count: 1,
        msg_id: 2029555660,
        path: '/aweme/v1/web/push/im/receive/',
      }),
      'utf8',
    );
    const pushFramePayload = encodePushFrame(jsonPayload, [{ key: 'x_frontier_traceid', value: 'trace-demo' }]);
    const frameReader = Writer.create();
    writeInt64(frameReader, 1, '10001');
    writeInt64(frameReader, 2, '20002');
    writeInt32(frameReader, 3, 31);
    writeInt32(frameReader, 4, 1);
    writeBytes(frameReader, 5, encodeStringMapEntry('x_frontier_traceid', 'trace-demo'));
    writeString(frameReader, 6, '');
    writeString(frameReader, 7, 'text/json');
    writeBytes(frameReader, 8, jsonPayload);
    const textFramePayload = frameReader.finish();

    const frame = parseDouyinImWebSocketFrame(textFramePayload);
    expect(frame.kind).toBe('push-text');
    if (frame.kind === 'push-text') {
      expect(frame.pushFrame.payloadType).toBe('text/json');
      expect((frame.jsonPayload as { count: number }).count).toBe(1);
    }
    expect(pushFramePayload).toBeDefined();
  });
});

// 将环境变量 RUN_DOUYIN_FRONTIER_IM_WS 设为 1 后，可直接连接真实的抖音 IM WebSocket，
// 并使用最新解析函数打印收到的消息内容。
test.runIf(true)(
  '连接真实的抖音 frontier-im WebSocket 并打印解析结果',
  async () => {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(DOUYIN_FRONTIER_IM_WS_URL, {
        headers: {
          Cookie: DOUYIN_FRONTIER_IM_COOKIE,
          Origin: 'https://www.douyin.com',
          Referer: 'https://www.douyin.com/',
          'User-Agent': DOUYIN_FRONTIER_IM_USER_AGENT,
        },
      });
      let messageCount = 0;
      let finished = false;
      let heartbeatTimer: NodeJS.Timeout | undefined;

      const sendHeartbeat = () => {
        if (ws.readyState !== WebSocket.OPEN) {
          return;
        }
        ws.send('hi');
        safePrint('[frontier-im] send heartbeat', {
          sentAt: new Date().toISOString(),
        });
      };

      const finish = (error?: Error) => {
        if (finished) {
          return;
        }
        finished = true;
        clearTimeout(timeoutTimer);
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = undefined;
        }
        try {
          ws.close();
        } catch (closeError) {}

        if (error) {
          reject(error);
          return;
        }

        resolve();
      };

      const timeoutTimer = setTimeout(() => {
        safePrint('[frontier-im] 调试结束', {
          receivedMessageCount: messageCount,
        });
        finish();
      }, 30000);

      ws.on('open', () => {
        safePrint('[frontier-im] WebSocket 已连接', {
          url: DOUYIN_FRONTIER_IM_WS_URL,
        });
        sendHeartbeat();
        heartbeatTimer = setInterval(() => {
          sendHeartbeat();
        }, 50000);
      });

      ws.on('message', rawData => {
        messageCount += 1;

        try {
          const frame = parseDouyinImWebSocketFrame(rawData);
          if (frame.kind === 'heartbeat') {
            safePrint('[frontier-im] 收到心跳', {
              index: messageCount,
              rawText: frame.rawText,
            });
            return;
          }

          if (frame.kind === 'text') {
            safePrint('[frontier-im] 收到文本帧', {
              index: messageCount,
              rawText: frame.rawText,
            });
            return;
          }

          if (frame.kind === 'push-text') {
            safePrint('[frontier-im] 收到文本推送帧', {
              index: messageCount,
              pushFrame: frame.pushFrame,
              textPayload: frame.textPayload,
              jsonPayload: frame.jsonPayload,
            });
            return;
          }

          if (frame.kind === 'protobuf-unknown') {
            const unknownFrameError = new Error(frame.error);
            safePrint('[frontier-im] 未识别的二进制帧', {
              index: messageCount,
              error: frame.error,
              pushFrame: frame.pushFrame,
              payloadHexPreview: frame.payload ? previewDouyinImBuffer(frame.payload) : undefined,
              rawHexPreview: previewDouyinImBuffer(frame.raw),
              fieldScan: frame.fieldScan,
            });
            finish(unknownFrameError);
            return;
          }

          const normalizedMessage = normalizeDouyinNewMessageNotify(frame.response.body?.hasNewMessageNotify);
          safePrint('[frontier-im] 收到 protobuf 帧', {
            index: messageCount,
            pushFrame: frame.pushFrame,
            command: frame.response.cmd,
            response: frame.response,
            responsePayloadHexPreview: previewDouyinImBuffer(frame.responsePayload),
            normalizedMessage,
          });
        } catch (error) {
          safePrint('[frontier-im] 解析消息失败', {
            index: messageCount,
            error: error instanceof Error ? error.message : String(error),
            rawHexPreview: previewDouyinImBuffer(normalizeDouyinImWebSocketData(rawData) as Buffer),
          });
          finish(error instanceof Error ? error : new Error(String(error)));
        }
      });

      ws.on('error', error => {
        safePrint('[frontier-im] WebSocket 异常', {
          message: error.message,
        });
        finish(error);
      });

      ws.on('close', (code, reason) => {
        safePrint('[frontier-im] WebSocket 已关闭', {
          code,
          reason: reason.toString(),
          receivedMessageCount: messageCount,
        });
        finish();
      });
    });
  },
  4000000000,
);
