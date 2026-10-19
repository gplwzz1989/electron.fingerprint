import { DeepSeekChatService } from './deepseek-chat.service';
import { SendMessageOptions } from '../interfaces';

export class DeepSeekChat {
  private service: DeepSeekChatService;

  constructor(cookie: string) {
    this.service = new DeepSeekChatService(cookie);
  }

  /**
   * 获取会话列表
   */
  async getConversations(cursor?: string, limit?: number) {
    return this.service.getConversations(cursor, limit);
  }

  /**
   * 获取指定会话的消息列表
   */
  async getMessages(conversationId: string, cursor?: string, limit?: number) {
    return this.service.getMessages(conversationId, cursor, limit);
  }

  /**
   * 发送消息 (支持流式)
   * @param content 文本消息内容
   * @param options 发送选项
   * @param options.thinkMode DeepSeek思考模式:
   *   - 'normal': 普通模式 (thinking_enabled=false, search_enabled=false)
   *   - 'think': 深度思考模式 (thinking_enabled=true, search_enabled=false)
   *   - 'search': 联网搜索模式 (thinking_enabled=false, search_enabled=true, 默认)
   *   - 'think_search': 深度思考+联网搜索 (thinking_enabled=true, search_enabled=true)
   */
  sendMessage(content: string, options?: SendMessageOptions) {
    return this.service.sendMessage(content, options);
  }
}
