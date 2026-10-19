import { Observable, Subscriber } from 'rxjs';
import {
  Attachment,
  ChatService,
  Conversation,
  Message,
  SendAttachment,
  SendMessageOptions,
  StreamEvent,
} from '../interfaces';
import { downloadFile, getFileExtension } from '../file-utils';
import { $http } from '../../http';
import { AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { buildPowResponseBase64 } from './deepseek-pow';
import { isNewDocumentId } from '@/ai-platform/doubao/doc-id-classifier';

type DeepSeekPowChallenge = {
  algorithm: string;
  challenge: string;
  salt: string;
  signature: string;
  difficulty: number;
  expire_at: number;
  expire_after: number;
  target_path: string;
};

type DeepSeekFileInfo = {
  id: string;
  status: string;
  file_name: string;
  previewable: boolean;
  file_size: number;
  token_usage: number | null;
  error_code: string | null;
  inserted_at: number;
  updated_at: number;
};

export class DeepSeekChatService implements ChatService {
  private baseUrl = 'https://chat.deepseek.com/api/v0';
  private token: string;
  private cookie?: string;

  constructor(cookieOrToken: string) {
    this.token = this.extractToken(cookieOrToken);
    if (cookieOrToken.includes('=')) {
      this.cookie = cookieOrToken;
    }
  }

  /**
   * 浠巆ookie涓彁鍙杢oken锛屾垨鐩存帴杩斿洖token
   * 浼樺厛鏌ユ壘 accToken 瀛楁
   */
  private extractToken(cookieOrToken: string): string {
    if (!cookieOrToken.includes('=')) {
      return cookieOrToken;
    }

    const accTokenMatch = cookieOrToken.match(/accToken=([^;]+)/);
    if (accTokenMatch) {
      return accTokenMatch[1];
    }

    const tokenMatch = cookieOrToken.match(/authorization[=:]\s*Bearer\s+([^;,\s]+)/i);
    if (tokenMatch) {
      return tokenMatch[1];
    }

    const directTokenMatch = cookieOrToken.match(/token=([^;]+)/);
    if (directTokenMatch) {
      return directTokenMatch[1];
    }

    return cookieOrToken;
  }

  private generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getRequestConfig(): AxiosRequestConfig {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0',
      'Content-Type': 'application/json',
      'x-client-locale': 'zh_CN',
      'x-client-timezone-offset': '28800',
      'x-app-version': '20241129.1',
      'x-client-version': '1.7.0',
      'x-client-platform': 'web',
      Origin: 'https://chat.deepseek.com',
      Referer: 'https://chat.deepseek.com/',
    };

    if (this.cookie) {
      headers.Cookie = this.cookie;
    }

    return { headers };
  }

  private resolveThinkMode(options?: SendMessageOptions): { thinkingEnabled: boolean; searchEnabled: boolean } {
    const mode = options?.thinkMode;

    if (mode === 'normal') {
      return { thinkingEnabled: false, searchEnabled: false };
    }

    if (mode === 'think' || mode === ('thinking' as any)) {
      return { thinkingEnabled: true, searchEnabled: false };
    }

    if (mode === 'search') {
      return { thinkingEnabled: false, searchEnabled: true };
    }

    if (mode === 'think_search' || mode === ('thinking_search' as any)) {
      return { thinkingEnabled: true, searchEnabled: true };
    }

    return { thinkingEnabled: false, searchEnabled: true };
  }

  /**
   * 鑾峰彇 PoW (Proof of Work) 鎸戞垬鍙傛暟
   * @param targetPath 鐩爣璺緞锛屽 '/api/v0/chat/completion' 鎴?'/api/v0/file/upload_file'
   * @returns 鎸戞垬鍙傛暟瀵硅薄
   */
  async getPowChallenge(targetPath: string): Promise<DeepSeekPowChallenge> {
    const response = await $http.post(
      `${this.baseUrl}/chat/create_pow_challenge`,
      { target_path: targetPath },
      this.getRequestConfig(),
    );

    const challengeData = response.data?.data?.biz_data?.challenge;
    if (!challengeData) {
      throw new Error('获取 PoW 挑战参数失败');
    }

    return challengeData;
  }

  private async buildPowHeader(targetPath: string): Promise<string> {
    const challenge = await this.getPowChallenge(targetPath);
    return buildPowResponseBase64({
      algorithm: challenge.algorithm,
      challenge: challenge.challenge,
      salt: challenge.salt,
      signature: challenge.signature,
      target_path: challenge.target_path,
      difficulty: challenge.difficulty,
      expire_at: challenge.expire_at,
    });
  }

  private async buildPowRequestHeaders(
    targetPath: string,
    extraHeaders?: Record<string, string>,
  ): Promise<Record<string, string>> {
    return {
      ...(this.getRequestConfig().headers as Record<string, string>),
      'x-ds-pow-response': await this.buildPowHeader(targetPath),
      ...(extraHeaders ?? {}),
    };
  }

  private getMimeType(fileExtension: string): string {
    const normalized = fileExtension.toLowerCase();
    const mimeMap: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      csv: 'text/csv',
      json: 'application/json',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return mimeMap[normalized] || 'application/octet-stream';
  }

  private async fetchFiles(fileIds: string[]): Promise<DeepSeekFileInfo[]> {
    if (fileIds.length === 0) {
      return [];
    }

    const response = await $http.get(
      `${this.baseUrl}/file/fetch_files?file_ids=${encodeURIComponent(fileIds.join(','))}`,
      this.getRequestConfig(),
    );

    return response.data?.data?.biz_data?.files || [];
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitForAttachmentReady(fileId: string): Promise<DeepSeekFileInfo> {
    const pendingStatuses = new Set(['PENDING', 'PARSING']);
    const successStatuses = new Set(['SUCCESS']);

    for (let attempt = 0; attempt < 20; attempt++) {
      const files = await this.fetchFiles([fileId]);
      const file = files[0];

      if (!file) {
        await this.sleep(1000);
        continue;
      }

      if (successStatuses.has(file.status)) {
        return file;
      }

      if (file.status === 'CONTENT_EMPTY') {
        throw new Error('未识别到文字内容');
      }

      if (!pendingStatuses.has(file.status)) {
        throw new Error(file.status);
      }

      await this.sleep(1500);
    }

    throw new Error(`附件解析超时：${fileId}`);
  }

  private mapAttachmentResult(file: DeepSeekFileInfo, fallbackExtension?: string): Attachment {
    return {
      id: file.id,
      url: '',
      name: file.file_name,
      size: file.file_size,
      type: fallbackExtension || getFileExtension(file.file_name) || 'bin',
      title: file.file_name,
      createTime: file.inserted_at ? Math.trunc(file.inserted_at * 1000) : undefined,
      redirect: isNewDocumentId(file.id),
    };
  }

  private async uploadAttachment(sendAttachment: SendAttachment, thinkingEnabled: boolean): Promise<Attachment> {
    const { buffer, fileName, fileExtension, fileSize } = await downloadFile(
      sendAttachment.filePath,
      sendAttachment.name,
      sendAttachment.type,
    );

    const formData = new FormData();
    formData.append('file', buffer, {
      filename: fileName,
      contentType: this.getMimeType(fileExtension),
      knownLength: fileSize,
    });

    const headers = await this.buildPowRequestHeaders('/api/v0/file/upload_file', {
      ...formData.getHeaders(),
      'x-file-size': String(fileSize),
      'x-thinking-enabled': thinkingEnabled ? '1' : '0',
    });

    const uploadResponse = await $http.post(`${this.baseUrl}/file/upload_file`, formData, {
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const uploadedFile = uploadResponse.data?.data?.biz_data as DeepSeekFileInfo | undefined;
    if (!uploadedFile?.id) {
      throw new Error('附件上传失败：缺少文件ID');
    }

    const readyFile = await this.waitForAttachmentReady(uploadedFile.id);
    return this.mapAttachmentResult(readyFile, fileExtension);
  }

  async getConversations(
    cursor?: string,
    limit: number = 20,
  ): Promise<{ code?: number; msg?: string; items: Conversation[]; nextCursor?: string; hasMore: boolean }> {
    const response = await $http.get(
      `${this.baseUrl}/chat_session/fetch_page?lte_cursor.pinned=false`,
      this.getRequestConfig(),
    );
    const responseCode = response.data?.code;
    const responseMsg = response.data?.msg;
    const sessions = response.data?.data?.biz_data?.chat_sessions || [];

    const items: Conversation[] = sessions.map((s: any) => {
      const updateTime = s.updated_at ? s.updated_at * 1000 : 0;
      const createTime = s.inserted_at ? s.inserted_at * 1000 : 0;

      return {
        id: s.id,
        title: s.title,
        createTime,
        updateTime,
        pinned: s.pinned,
      };
    });

    return {
      code: typeof responseCode === 'number' ? responseCode : undefined,
      msg: typeof responseMsg === 'string' ? responseMsg : undefined,
      items,
      hasMore: false,
    };
  }

  async getMessages(
    conversationId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<{ code?: number; msg?: string; items: Message[]; nextCursor?: string; hasMore: boolean }> {
    const response = await $http.get(
      `${this.baseUrl}/chat/history_messages?chat_session_id=${conversationId}`,
      this.getRequestConfig(),
    );
    const responseCode = response.data?.code;
    const responseMsg = response.data?.msg;
    const messages = response.data?.data?.biz_data?.chat_messages || [];

    const items: Message[] = messages.map((msg: any) => {
      let content = '';
      if (msg.fragments) {
        content = msg.fragments.map((f: any) => f.content).join('');
      }

      return {
        id: msg.message_id.toString(),
        conversationId: conversationId,
        role: msg.role === 'USER' ? 'user' : 'assistant',
        content: content,
        createTime: msg.inserted_at ? msg.inserted_at * 1000 : 0,
        parentId: msg.parent_id ? msg.parent_id.toString() : undefined,
      };
    });

    return {
      code: typeof responseCode === 'number' ? responseCode : undefined,
      msg: typeof responseMsg === 'string' ? responseMsg : undefined,
      items,
      hasMore: false,
    };
  }

  private hasValidConversationId(conversationId?: string): conversationId is string {
    return typeof conversationId === 'string' && conversationId.trim().length > 0;
  }

  private async createConversation(): Promise<string> {
    const response = await $http.post(`${this.baseUrl}/chat_session/create`, {}, this.getRequestConfig());
    const conversationId = response.data?.data?.biz_data?.id;

    if (!conversationId) {
      throw new Error('创建会话失败：缺少 chat_session.id');
    }

    return conversationId;
  }

  sendMessage(content: string, options?: SendMessageOptions): Observable<StreamEvent> {
    return new Observable((subscriber: Subscriber<StreamEvent>) => {
      (async () => {
        const emitErrorEvent = (error: unknown) => {
          if (subscriber.closed) {
            return;
          }

          subscriber.next({
            type: 'error',
            error: error instanceof Error ? error.message : error,
            conversationId: this.hasValidConversationId(options?.conversationId)
              ? options!.conversationId.trim()
              : undefined,
          });
          subscriber.complete();
        };

        const conversationId = this.hasValidConversationId(options?.conversationId)
          ? options!.conversationId.trim()
          : await this.createConversation().catch((error) => {
              emitErrorEvent(error);
              return '';
            });

        if (!conversationId || subscriber.closed) {
          return;
        }
        const { thinkingEnabled, searchEnabled } = this.resolveThinkMode(options);

        let uploadedAttachments: Attachment[] = [];
        if (options?.attachments && options.attachments.length > 0) {
          try {
            uploadedAttachments = await Promise.all(
              options.attachments.map((attachment) => this.uploadAttachment(attachment, thinkingEnabled)),
            );
          } catch (error) {
            emitErrorEvent(error);
            return;
          }
        }

        const payload = {
          chat_session_id: conversationId,
          parent_message_id: options?.parentMessageId ? parseInt(options.parentMessageId) : null,
          prompt: content,
          ref_file_ids: uploadedAttachments.map((attachment) => attachment.id),
          thinking_enabled: thinkingEnabled,
          search_enabled: searchEnabled,
          preempt: false,
        };

        const headers = await this.buildPowRequestHeaders('/api/v0/chat/completion');

        const response = await $http.post(`${this.baseUrl}/chat/completion`, payload, {
          headers,
          responseType: 'stream',
        });

        const stream = response.data;
        let buffer = '';
        let currentMessageId = '';
        const currentConversationId = conversationId;
        let currentEvent = '';
        const createTime = Date.now();
        let hasEmittedStart = false;
        let hasEmittedEnd = false;
        let currentFragmentType: 'THINK' | 'RESPONSE' | null = null;

        const emitEnd = () => {
          if (hasEmittedEnd || subscriber.closed) {
            return;
          }

          subscriber.next({
            type: 'end',
            messageId: currentMessageId,
            conversationId: currentConversationId,
            createTime: createTime,
          });
          hasEmittedEnd = true;
        };

        stream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('event:')) {
              currentEvent = trimmedLine.slice(6).trim();
            } else if (trimmedLine.startsWith('data:')) {
              const dataStr = trimmedLine.slice(5).trim();
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);

                if (currentEvent === 'ready') {
                  currentMessageId = data.response_message_id?.toString?.() || data.response_message_id || '';
                  if (!hasEmittedStart) {
                    subscriber.next({
                      type: 'start',
                      messageId: currentMessageId,
                      conversationId: currentConversationId,
                      createTime: createTime,
                    });
                    hasEmittedStart = true;
                  }
                } else if (currentEvent === 'close') {
                  emitEnd();
                  subscriber.complete();
                } else {
                  let delta = '';
                  let fragmentType: 'THINK' | 'RESPONSE' | null = null;

                  // 1. 检查完整的 fragments 数据（初始化或完整更新）
                  if (data.v?.response?.fragments) {
                    const fragments = data.v.response.fragments;
                    const lastFragment = fragments[fragments.length - 1];
                    if (lastFragment) {
                      fragmentType = lastFragment.type;
                      currentFragmentType = fragmentType;
                      delta = lastFragment.content || '';
                    }
                  }
                  // 2. 检查新增的 fragment（APPEND 操作）
                  else if (data.p === 'response/fragments' && data.o === 'APPEND' && data.v) {
                    const newFragments = Array.isArray(data.v) ? data.v : [data.v];
                    const lastFragment = newFragments[newFragments.length - 1];
                    if (lastFragment) {
                      fragmentType = lastFragment.type;
                      currentFragmentType = fragmentType;
                      delta = lastFragment.content || '';
                    }
                  }
                  // 3. 检查增量内容更新（APPEND 到当前 fragment）
                  else if (data.p === 'response/fragments/-1/content' && data.o === 'APPEND') {
                    delta = data.v || '';
                    fragmentType = currentFragmentType;
                  }
                  // 4. 兼容旧格式：直接的字符串值
                  else if (data.v && typeof data.v === 'string') {
                    delta = data.v;
                    fragmentType = currentFragmentType;
                  }

                  if (delta) {
                    if (!hasEmittedStart) {
                      subscriber.next({
                        type: 'start',
                        messageId: currentMessageId,
                        conversationId: currentConversationId,
                        createTime: createTime,
                      });
                      hasEmittedStart = true;
                    }

                    if (fragmentType === 'THINK') {
                      subscriber.next({
                        type: 'thinking',
                        data: delta,
                      });
                    } else {
                      // RESPONSE 类型或未知类型都作为普通文本处理
                      subscriber.next({
                        type: 'text',
                        data: delta,
                      });
                    }
                  }
                }
              } catch (error) {
                // ignore parse errors
              }
            }
          }
        });

        stream.on('end', () => {
          if (!subscriber.closed) {
            emitEnd();
            subscriber.complete();
          }
        });

        stream.on('error', (err: Error) => {
          if (!subscriber.closed) {
            emitErrorEvent(err);
          }
        });
      })().catch((error) => {
        if (!subscriber.closed) {
          subscriber.next({
            type: 'error',
            error: error instanceof Error ? error.message : error,
          });
          subscriber.complete();
        }
      });
    });
  }
}
