import { PlatformAuthorInfo } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';
import { AIDeepSeek } from '@/ai-platform/deepseek';
import {
  SendMessageOptions,
  AIChatConversationListResponse,
  AIChatMessageListResponse,
} from '@/ai-platform/interfaces';
import { DeepSeekChat } from '@/ai-platform/deepseek/deepseek-chat';

export class AIDeepSeekWorker extends BaseWorker {
  private chatService: DeepSeekChat | undefined = undefined;

  private getChatService() {
    if (!this.chatService) {
      // DeepSeekChatService会自动处理cookie或token
      this.chatService = new AIDeepSeek.DeepSeekChat(this.cookies);
    }
    return this.chatService;
  }

  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await AIDeepSeek.getDeepseekUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }

  /**
   * 获取AI对话会话列表
   */
  public async getAIChatConversationList(taskParams: {
    cursor?: string;
    limit?: number;
  }): Promise<AIChatConversationListResponse> {
    try {
      const result = await this.getChatService().getConversations(taskParams.cursor, taskParams.limit);
      return {
        code: typeof result.code === 'number' ? result.code : -1,
        msg: result.msg || 'success',
        items: result.items,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    } catch (e: any) {
      return { code: e.code || -1, msg: e.message, items: [], hasMore: false };
    }
  }

  /**
   * 获取指定AI对话会话的消息列表
   */
  public async getAIChatMessages(taskParams: {
    conversationId: string;
    cursor?: string;
    limit?: number;
  }): Promise<AIChatMessageListResponse> {
    try {
      const result = await this.getChatService().getMessages(
        taskParams.conversationId,
        taskParams.cursor,
        taskParams.limit,
      );
      return {
        code: typeof result.code === 'number' ? result.code : -1,
        msg: result.msg || 'success',
        items: result.items,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    } catch (e: any) {
      return { code: e.code || -1, msg: e.message, items: [], hasMore: false };
    }
  }

  /**
   * 发送AI对话消息并接收回复。
   * 可选择流式返回或一次性返回完整结果。
   * @param taskParams.content 消息内容
   * @param taskParams.options 发送消息选项
   * @param taskParams.streamResponse 是否流式返回，默认为true
   */
  public async sendAIChatMessage(taskParams: {
    content: string;
    options?: SendMessageOptions;
    streamResponse?: boolean;
  }): Promise<{ code: number; msg: string; messageId?: string; conversationId?: string; aiResponseContent?: string }> {
    const { content, options, streamResponse = true } = taskParams;

    return new Promise((resolve) => {
      let fullContent = '';
      let finalMessageId: string | undefined;
      let finalConversationId: string | undefined;
      let resolved = false;

      const resolveWithError = (err: any, defaultMsg: string) => {
        if (!resolved) {
          resolved = true;
          resolve({
            code: err.code || -1,
            msg: err.message || defaultMsg,
            messageId: undefined,
            conversationId: undefined,
            aiResponseContent: undefined,
          });
        }
      };

      try {
        const stream = this.getChatService().sendMessage(content, options);

        stream.subscribe({
          next: (event: any) => {
            if (event.type === 'start') {
              finalMessageId = event.messageId;
              finalConversationId = event.conversationId;

              if (streamResponse) {
                this.event.emit('ai-chat-stream', event);
              }
            } else if (event.type === 'text') {
              fullContent += event.data;

              if (streamResponse) {
                this.event.emit('ai-chat-stream', event);
              }
            } else if (event.type === 'thinking' && options?.includeThinkingProcess) {
              if (streamResponse) {
                this.event.emit('ai-chat-stream', event);
              }
            } else if (event.type === 'error') {
              const errorInfo = {
                code: -1,
                message:
                  event.error instanceof Error
                    ? event.error.message
                    : typeof event.error === 'string'
                    ? event.error
                    : '未知错误',
              };

              if (streamResponse) {
                this.event.emit('ai-chat-stream-error', errorInfo);
              }

              resolveWithError(errorInfo, errorInfo.message);
            } else if (event.type === 'end') {
              if (!resolved) {
                resolved = true;

                if (streamResponse) {
                  this.event.emit('ai-chat-stream', event);
                }

                resolve({
                  code: 0,
                  msg: 'success',
                  messageId: finalMessageId,
                  conversationId: finalConversationId,
                  aiResponseContent: fullContent,
                });
              }
            }
          },
          error: (err: any) => {
            const errorInfo = {
              code: err.code || -1,
              message: err.message || '未知错误',
            };

            this.event.emit('ai-chat-stream-error', errorInfo);
            resolveWithError(errorInfo, errorInfo.message);
          },
          complete: () => {
            if (!resolved) {
              if (fullContent) {
                resolved = true;
                resolve({
                  code: 0,
                  msg: 'success (partial content)',
                  messageId: finalMessageId,
                  conversationId: finalConversationId,
                  aiResponseContent: fullContent,
                });
              } else {
                resolveWithError({ code: -1, message: 'AI回复流异常结束，未收到完整消息。' }, 'AI回复流异常结束');
              }
            }
          },
        });
      } catch (e: any) {
        this.event.emit('ai-chat-stream-error', e);
        resolveWithError(e, '发送AI消息失败');
      }
    });
  }

  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 40003 || re.msg?.includes('uthorization')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
}
