import { describe, expect, it } from 'vitest';
import {
  normalizeXiaohongshuhomeMessage,
  parseXiaohongshuhomeMessageContent,
} from '../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-message.service';
import { MessageType } from '../../../src/service/datasync-service-manager';

describe('小红书主页私信消息解析', () => {
  it('应将 WebSocket 顶层图片媒体识别为图片消息', () => {
    const imageUrl = 'https://fe-video-qc.xhscdn.com/fe-platform/test.png';
    const result = normalizeXiaohongshuhomeMessage(
      {
        id: 'message-id',
        content: '',
        content_type: 'text',
        sender_id: 'user-id',
        receiver_id: 'account-id',
        websocket_payload: {
          messageType: 'text',
          imgUrl: imageUrl,
          mediaInfo: { mediaType: 'image', url: imageUrl },
        },
      },
      'account-id',
      'user-id',
      'user-id',
    );

    expect(result.messageType).toBe(MessageType.image);
    expect(result.imgUrl).toBe(imageUrl);
    expect(result.mediaInfo).toEqual({ mediaType: 'image', url: imageUrl });
  });

  it('应兼容 HTTP 历史消息 content 中的图片字段', () => {
    const imageUrl = 'https://fe-video-qc.xhscdn.com/fe-platform/history.png';
    const result = normalizeXiaohongshuhomeMessage(
      {
        id: 'history-message-id',
        content: JSON.stringify({ image: imageUrl }),
        message_type: 'IMAGE',
        sender_id: 'user-id',
        receiver_id: 'account-id',
      },
      'account-id',
      'user-id',
      'user-id',
    );

    expect(result.messageType).toBe(MessageType.image);
    expect(result.imgUrl).toBe(imageUrl);
  });

  it('应解析 mediaInfo.url 作为图片地址', () => {
    const imageUrl = 'https://fe-video-qc.xhscdn.com/fe-platform/media-info.png';

    expect(parseXiaohongshuhomeMessageContent({
      messageType: 'text',
      mediaInfo: { mediaType: 'image', url: imageUrl },
    })).toEqual({
      text: '',
      imageUrl,
      contentType: 'text',
    });
  });
});
