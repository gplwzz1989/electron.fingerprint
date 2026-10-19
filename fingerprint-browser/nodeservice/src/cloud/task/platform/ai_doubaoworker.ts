import { PlatformAuthorInfo } from '../../../media-platform';
import { Readable } from 'stream';
import { BaseWorker } from './baseworker';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';
import { AIDouBao } from '@/ai-platform/doubao';
import {
  SendMessageOptions,
  AIChatConversationListResponse,
  AIChatMessageListResponse,
  AIChatAttachmentParseResponse,
} from '@/ai-platform/interfaces';

export class AIDouBaoWorker extends BaseWorker {
  private chatService: any;

  private getChatService() {
    if (!this.chatService) {
      this.chatService = new AIDouBao.DoubaoChat(this.cookies);
    }
    return this.chatService;
  }

  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await AIDouBao.getDoubaoUserInfo(this.cookies, proxy);
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
      // 直接返回DoubaoChatService的items，因为AIChatConversationListResponse已经适配
      return {
        code: typeof result.code === 'number' ? result.code : 0,
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
      // 直接返回DoubaoChatService的items，因为AIChatMessageListResponse已经适配
      return {
        code: typeof result.code === 'number' ? result.code : 0,
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
    streamResponse?: boolean; // 新增参数，控制是否流式返回
  }): Promise<{ code: number; msg: string; messageId?: string; conversationId?: string; aiResponseContent?: string }> {
    const { content, options, streamResponse = true } = taskParams; // 默认流式返回

    return new Promise((resolve) => {
      // Promise always resolves
      let fullContent = '';
      let finalMessageId: string | undefined;
      let finalConversationId: string | undefined;
      let resolved = false; // 标记 Promise 是否已解决
      let hasRetried = false; // 标记是否已重试

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

      const attemptSend = (retryOptions?: SendMessageOptions) => {
        try {
          const stream = this.getChatService().sendMessage(content, retryOptions || options);

          stream.subscribe({
            next: (event: any) => {
              if (event.type === 'start') {
                finalMessageId = event.messageId;
                finalConversationId = event.conversationId;

                if (streamResponse) {
                  // 流式模式：发送start事件
                  this.event.emit('ai-chat-stream', event);
                }
              } else if (event.type === 'text') {
                // 始终累加内容（无论是否流式）
                fullContent += event.data;

                if (streamResponse) {
                  // 流式模式：发送text事件（不带fullContent）
                  this.event.emit('ai-chat-stream', event);
                }
              } else if (event.type === 'thinking') {
                if (streamResponse) {
                  // 流式模式：发送thinking事件
                  this.event.emit('ai-chat-stream', event);
                }
              } else if (event.type === 'attachment') {
                if (streamResponse) {
                  // 流式模式：发送attachment事件
                  this.event.emit('ai-chat-stream', event);
                }
              } else if (event.type === 'image') {
                if (streamResponse) {
                  // 流式模式：发送image事件
                  this.event.emit('ai-chat-stream', event);
                }
              } else if (event.type === 'error') {
                if (!hasRetried) {
                  hasRetried = true;
                  const retryOptions = { ...options, unsign: true };
                  attemptSend(retryOptions);
                  return;
                }

                const errorInfo = {
                  code:
                    event.error && typeof event.error === 'object' && 'code' in event.error
                      ? (event.error as any).code || -1
                      : -1,
                  message:
                    event.error && typeof event.error === 'object' && 'message' in event.error
                      ? (event.error as any).message || '未知错误'
                      : typeof event.error === 'string'
                      ? event.error
                      : '未知错误',
                };

                this.event.emit('ai-chat-stream-error', errorInfo);
                resolveWithError(errorInfo, errorInfo.message);
              } else if (event.type === 'end') {
                if (!resolved) {
                  resolved = true;

                  if (streamResponse) {
                    // 流式模式：发送end事件（不带fullContent）
                    this.event.emit('ai-chat-stream', event);
                  }

                  // 返回完整结果（包含累加的内容）
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
              // 如果还没有重试过，则进行重试
              if (!hasRetried) {
                hasRetried = true;
                // 设置 unsign 为 true 并重试
                const retryOptions = { ...options, unsign: true };
                attemptSend(retryOptions);
                return;
              }

              // 直接使用原始错误信息，不做转换
              const errorInfo = {
                code: err.code || -1,
                message: err.message || '未知错误',
              };

              // 只发送 ai-chat-stream-error 事件，不发送 ai-chat-stream
              // 避免在 controller 中重复输出错误
              this.event.emit('ai-chat-stream-error', errorInfo);
              resolveWithError(errorInfo, errorInfo.message);
            },
            complete: () => {
              // 如果流在没有 'end' 事件的情况下完成 (例如，某些错误导致流提前关闭)
              // 并且 Promise 尚未解决
              if (!resolved) {
                if (fullContent) {
                  // 如果收到了部分内容，但没有明确的 'end' 事件
                  resolved = true;
                  resolve({
                    code: 0,
                    msg: 'success (partial content)',
                    messageId: finalMessageId,
                    conversationId: finalConversationId,
                    aiResponseContent: fullContent,
                  });
                } else {
                  // 没有收到内容，也没有 'end' 事件，视为异常
                  resolveWithError({ code: -1, message: 'AI回复流异常结束，未收到完整消息。' }, 'AI回复流异常结束');
                }
              }
            },
          });
        } catch (e: any) {
          // 如果还没有重试过，则进行重试
          if (!hasRetried) {
            hasRetried = true;
            // 设置 unsign 为 true 并重试
            const retryOptions = { ...options, unsign: true };
            attemptSend(retryOptions);
            return;
          }

          this.event.emit('ai-chat-stream-error', e); // 捕获同步错误
          resolveWithError(e, '发送AI消息失败');
        }
      };

      // 开始第一次尝试
      attemptSend();
    });
  }

  /**
   * 解析豆包附件信息
   * @param taskParams.attachmentId 附件ID或resourceId (document类型) 或 视频ID (video类型)
   * @param taskParams.exportType 导出类型（仅用于document类型）：'1'=DOCX, '2'=PDF, '3'=Markdown
   * @param taskParams.attachmentType 附件类型：'document' (文档附件, 默认) 或 'video' (视频附件)
   */
  public async parseAIChatAttachment(taskParams: {
    attachmentId: string;
    exportType?: string;
    attachmentType?: 'document' | 'video';
  }): Promise<AIChatAttachmentParseResponse> {
    try {
      const attachment = await this.getChatService().getAttachmentInfo(
        taskParams.attachmentId,
        taskParams.exportType || '1',
        taskParams.attachmentType || 'document',
      );

      if (attachment) {
        return {
          code: 0,
          msg: 'success',
          attachment: attachment,
        };
      } else {
        return {
          code: -1,
          msg: '附件解析失败或附件不存在',
        };
      }
    } catch (e: any) {
      return {
        code: e.code || -1,
        msg: e.message || '解析附件异常',
      };
    }
  }

  public async getDownloadRequest(taskParams: {
    url?: string;
    id: string;
    exportType?: string;
    attachmentType?: 'document' | 'video';
  }): Promise<BaseResult> {
    try {
      const request = await this.getChatService().getAttachmentDownloadRequest(
        taskParams.id,
        taskParams.exportType || '1',
        taskParams.attachmentType || 'document',
      );
      return { code: 0, msg: 'success', data: request };
    } catch (e: any) {
      return {
        code: e.code || -1,
        msg: e.message || '获取下载信息异常',
      };
    }
  }

  public async downloadFile(taskParams: {
    url?: string;
    id: string;
    exportType?: string;
    attachmentType?: 'document' | 'video';
  }): Promise<Readable | BaseResult> {
    try {
      return await this.getChatService().downloadAttachment(
        taskParams.id,
        taskParams.exportType || '1',
        taskParams.attachmentType || 'document',
      );
    } catch (e: any) {
      return {
        code: e.code || -1,
        msg: e.message || '下载附件异常',
      };
    }
  }

  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 103 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
}
