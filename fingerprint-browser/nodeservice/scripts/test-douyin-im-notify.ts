import {
  buildDouyinMessageBackItemFromImNotify,
  shouldKeepDouyinFrontierImMessage,
} from '../src/media-platform/douyin/private_msg/standalone_notice_pc/douyin-frontier-im-websocket.service';
import type { DouyinNewMessageNotify } from '../src/media-platform/douyin/private_msg/douyin-im-websocket-parser';

let notify: DouyinNewMessageNotify | undefined;
notify =
  {
    "conversationId": "0:1:624128155717166:3671963038133054",
    "conversationType": 1,
    "notifyType": 4,
    "message": {
      "conversationId": "0:1:624128155717166:3671963038133054",
      "conversationType": 1,
      "serverMessageId": "7680124050829706789",
      "indexInConversation": "1672502400020000",
      "conversationShortId": "7680094516224803365",
      "messageType": 7,
      "sender": "3671963038133054",
      "content": "{\"ai_ext\":\"{}\",\"aweType\":0,\"mention_users\":[],\"related_share_video\":{},\"richTextInfos\":[],\"scene\":\"\",\"stranger_index\":1,\"text\":\"1233211234567\"}",
      "ext": {
        "a:smp_query_conversation": "0.5650520324707031",
        "a:smp_create_msg_new": "0.07009506225585938",
        "source_aid": "1128",
        "a:sync2dx": "1",
        "a:last_msg_id": "",
        "a:smp_ies_create_message_duration": "0.041961669921875",
        "s:sync_2_newdx": "1",
        "s:saas_sdk": "false",
        "im_callback_status_code": "0",
        "a:plv": "1",
        "a:im_client_send_msg_time": "1788168229473.868",
        "a:smp_pre_db_operation": "0.3259181976318359",
        "s:s_aid": "1128",
        "s:chat_tag": "stranger",
        "a:group_number_style": "contain",
        "a:msg_scene": "1",
        "s:vcd_shark_detail": "",
        "a:ntp_ready": "2",
        "old_client_message_id": "1788168229280",
        "a:relation_type": "0:0",
        "s:biz_aid": "1128",
        "a:smp_switch_thread": "0.09298324584960938",
        "s:is_stranger": "false",
        "s:is_stranger_message": "624128155717166",
        "a:smp_validate_json": "0.01883506774902344",
        "a:group_link_style": "",
        "a:smp_con_create_msg_duration": "0.02598762512207031",
        "a:access": "douyin_main",
        "a:biz": "douyin",
        "s:server_message_create_time": "1788168229864",
        "s:vcd_shark_decision": "PASS",
        "a:smp_client_process_duration": "2.14306640625",
        "a:smp_token_fetch": "0.4739761352539062",
        "im_sdk_client_send_msg_time": "1788168229476.03",
        "a:enter_method": "click_message",
        "s:mode": "2",
        "chat_scene": "normal",
        "s:client_message_id": "59F649B3-6502-4020-8250-675F8DF1595C"
      },
      "createTime": "1788168229523",
      "version": "0",
      "status": 0,
      "orderInConversation": "1672502400020000000",
      "secSender": "MS4wLjABAAAAErEcUDzaWai7CpRcFqUwsqH7yUK5kB85p96YlLF8lWROGbIZmT1RHI90Oh5LI06P"
    },
    "previousCursor": "0",
    "nextCursor": "0",
    "indexInConversation": "1672502400020000",
    "indexInConversationV2": "2",
    "badgeCount": 1
  }

; // 在这里粘贴并赋值实际的 notify 数据

const currentUserId = ''; // 在这里填写当前账号的用户 ID

const shouldKeep = shouldKeepDouyinFrontierImMessage(notify, currentUserId);
const message = buildDouyinMessageBackItemFromImNotify(notify, currentUserId);

console.log('shouldKeep 返回结果:', shouldKeep);
console.log('解析返回结果:', JSON.stringify(message, null, 2));
