import { Readable } from 'node:stream';
import { isNewDocumentId } from '@/ai-platform/doubao/doc-id-classifier';

import { Attachment, SendMessageOptions } from '../interfaces';
import { DoubaoChatService } from './doubao-chat.service';
import {
  getDoubaoDownloadInfo,
  getDoubaoDownloadRequest,
  getDoubaoDownloadStream,
  type DoubaoExportFormat,
} from './doubao-feishu-url';

function mapExportType(type?: string): DoubaoExportFormat {
  switch (String(type || '1')) {
    case '2':
      return 'pdf';
    case '3':
      return 'markdown';
    case '1':
    default:
      return 'docx';
  }
}

export class DoubaoChat {
  private service: DoubaoChatService;

  constructor(cookie: string) {
    this.service = new DoubaoChatService(cookie);
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
   * 发送消息 (支持流式和附件)
   * @param content 文本消息内容
   * @param options 包含附件、思考模式等发送选项
   * @param options.thinkMode 思考模式: 'fast' (快速, 默认), 'think' (深度思考), 'expert' (专家模式)
   * @param options.includeThinkingProcess 是否在正文中包含思考过程内容 (默认: false, 不包含)
   */
  sendMessage(content: string, options?: SendMessageOptions) {
    return this.service.sendMessage(content, options);
  }

  /**
   * 获取附件的详细信息，如下载链接等
   * @param attachmentId 附件的唯一ID (document类型) 或 视频ID (video类型)
   * @param type 导出类型：'1'=DOCX, '2'=PDF, '3'=Markdown (仅用于document类型)
   * @param attachmentType 附件类型：'document' (文档附件, 默认) 或 'video' (视频附件)
   */
  async getAttachmentInfo(attachmentId: string, type?: string, attachmentType: 'document' | 'video' = 'document') {
    if (attachmentType === 'video') {
      return this.service.getVideoPlayInfo(attachmentId);
    }

    if (Number(attachmentId) > 0) {
      throw Error('不支持的类型');
    }

    if (isNewDocumentId(attachmentId)) {
      const format = mapExportType(type);
      const downloadInfo = {} as any; // await getDoubaoDownloadInfo(this.service.cookie, attachmentId, { format });
      const fileName =
        downloadInfo.fileName ||
        `${attachmentId}.${downloadInfo.fileExtension || (format === 'markdown' ? 'md' : format)}`;
      const fileType = downloadInfo.fileExtension || downloadInfo.type || format;
      const attachment: Attachment = {
        id: attachmentId,
        url: '', //downloadInfo.downloadUrl,
        name: fileName,
        size: downloadInfo.fileSize || 0,
        type: fileType,
        title: fileName,
        downloadUrl: '', //downloadInfo.downloadUrl,
        redirect: true,
      };

      // (attachment as any).extra = {
      //   sourceAttachmentId: attachmentId,
      //   exportTicket: downloadInfo.exportTicket,
      //   exportedFileToken: downloadInfo.exportedFileToken,
      //   fileName: downloadInfo.fileName,
      //   fileSize: downloadInfo.fileSize,
      //   type: downloadInfo.type,
      //   fileExtension: downloadInfo.fileExtension,
      //   jobStatus: downloadInfo.jobStatus,
      //   jobErrorMsg: downloadInfo.jobErrorMsg,
      //   ...downloadInfo.extra,
      // };

      return attachment;
    }

    return this.service.getExportedAttachmentInfo(attachmentId, Number(type) ? Number(type) : 1);
  }

  async downloadAttachment(
    attachmentId: string,
    type?: string,
    attachmentType: 'document' | 'video' = 'document',
  ): Promise<Readable> {
    if (attachmentType === 'video') {
      throw new Error('Downloading video attachments is not supported yet');
    }

    if (isNewDocumentId(attachmentId)) {
      return getDoubaoDownloadStream(this.service.cookie, attachmentId, {
        format: mapExportType(type),
      });
    } else {
      throw { code: 400, msg: '不支持的文档' };
    }
  }

  async getAttachmentDownloadRequest(
    attachmentId: string,
    type?: string,
    attachmentType: 'document' | 'video' = 'document',
  ): Promise<{ url: string; headers: Record<string, string> }> {
    if (attachmentType === 'video') {
      throw new Error('视频不支持');
    }

    if (!isNewDocumentId(attachmentId)) {
      throw new Error('当前文档不支持');
    }

    return getDoubaoDownloadRequest(this.service.cookie, attachmentId, {
      format: mapExportType(type),
    });
  }
}
