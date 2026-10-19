import { describe, expect, test } from 'vitest';

import { MessageType, SessionType } from '../../../src/service/datasync-service-manager';
import {
  buildDouyinMessageBackItemFromImNotify,
  DouyinFrontierImWebSocketService,
} from '../../../src/media-platform/douyin/private_msg/standalone_notice_pc/douyin-frontier-im-websocket.service';

function createNotify(commandType: number, strangers?: string, extDataKey?: string, contentExt?: object) {
  return {
    conversationId: '0:1:624128155717166:1751983311557994',
    conversationType: 1,
    notifyType: 1,
    message: {
      conversationId: '0:1:624128155717166:1751983311557994',
      conversationType: 1,
      serverMessageId: '7680112675054176817',
      conversationShortId: '7680112641989329445',
      messageType: 50001,
      sender: '1751983311557994',
      content: JSON.stringify({
        command_type: commandType,
        stranger: '624128155717166',
        ext: contentExt ? JSON.stringify(contentExt) : undefined,
        ext_data: extDataKey ? [{ key: extDataKey }] : undefined,
      }),
      ext: {
        's:command_type': String(commandType),
        ...(strangers ? { 's:strangers': strangers } : {}),
      },
      createTime: '1788165582858',
      secSender: 'MS4wLjABAAAAM3C093-UO12HmopwuWNaMd2mv4Cfi5bIoBmatwJIRxoE0EgfT94OkqpGfAh1Rd5t',
    },
  };
}

describe('抖音 frontier-im user_enter 消息适配', () => {
  test('可以将 command_type=6 且包含陌生人列表的消息解析为 user_enter', () => {
    const item = buildDouyinMessageBackItemFromImNotify(
      createNotify(6, '[624128155717166]', 'a:hit_unfollowed_familiar_msg_test'),
    );

    expect(item?.messageType).toBe(MessageType.user_enter);
    expect(item?.content).toBe('');
    expect(item?.sessionType).toBe(SessionType.stranger);
  });

  test('command_type=6 缺少陌生人列表时不会误判为 user_enter', () => {
    const item = buildDouyinMessageBackItemFromImNotify(
      createNotify(6, undefined, 'a:hit_unfollowed_familiar_msg_test'),
    );

    expect(item).toBeUndefined();
  });

  test('command_type=6 的 freq_scene 状态消息不会误判为 user_enter', () => {
    const item = buildDouyinMessageBackItemFromImNotify(createNotify(6, '[624128155717166]', 'a:freq_scene'));

    expect(item).toBeUndefined();
  });

  test('仅内部 ext 带进入标记但缺少 ext_data 时不会误判为 user_enter', () => {
    const item = buildDouyinMessageBackItemFromImNotify(
      createNotify(6, '[624128155717166]', undefined, {
        'a:hit_unfollowed_familiar_msg_test': '1',
      }),
    );

    expect(item).toBeUndefined();
  });

  test('ext_data 为 freq_scene 但内部 ext 保留进入标记时可以解析为 user_enter', () => {
    const item = buildDouyinMessageBackItemFromImNotify(
      createNotify(6, '[624128155717166]', 'a:freq_scene', {
        'a:freq_scene': '{"scene":"c2c","c2c_meta":{"status":0,"userId":0,"serOpCnt":0}}',
        'a:hit_unfollowed_familiar_msg_test': '1',
      }),
    );

    expect(item?.messageType).toBe(MessageType.user_enter);
  });

  test('freq_scene 已处理状态消息不会误判为 user_enter', () => {
    const item = buildDouyinMessageBackItemFromImNotify(
      createNotify(6, '[624128155717166]', 'a:freq_scene', {
        'a:freq_scene': '{"scene":"c2c","c2c_meta":{"status":1,"userId":1751983311557994,"serOpCnt":1}}',
        'a:hit_unfollowed_familiar_msg_test': '1',
      }),
    );

    expect(item).toBeUndefined();
  });

  test('保留 command_type=8 的 user_enter 兼容逻辑', () => {
    const item = buildDouyinMessageBackItemFromImNotify(createNotify(8));

    expect(item?.messageType).toBe(MessageType.user_enter);
  });

  test('同一个 sessionId 的 user_enter 只允许回调一次', () => {
    const service = new DouyinFrontierImWebSocketService({
      cookie: '',
      userId: '624128155717166',
      enableCommentPolling: false,
    });
    const rememberUserEnterSession = (service as any).rememberUserEnterSession.bind(service);
    const createUserEnterMessage = (sessionId: string, isAuthor: boolean) => ({
      messageType: MessageType.user_enter,
      sessionId,
      isAuthor,
    });

    expect(rememberUserEnterSession(createUserEnterMessage('session-1', true))).toBe(true);
    expect(rememberUserEnterSession(createUserEnterMessage('session-1', false))).toBe(true);
    expect(rememberUserEnterSession(createUserEnterMessage('session-1', false))).toBe(false);
    expect(rememberUserEnterSession(createUserEnterMessage('session-2', false))).toBe(true);
  });
});
