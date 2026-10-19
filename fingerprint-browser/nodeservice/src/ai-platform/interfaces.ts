import { Observable } from 'rxjs';
import { BaseResult } from '../media-platform/baseResult'; // 导入 BaseResult

/**
 * AI 平台统一接口定义
 */

export interface UserInfo {
  id: string;
  name: string;
  avatar: string;
}

export interface Conversation {
  id: string;
  title: string;
  createTime: number;
  updateTime: number;
  pinned?: boolean;
  extra?: any;
}

export interface Attachment {
  id: string; // Uploaded file ID or identifier
  url: string; // Download URL or URI
  name: string;
  size: number;
  type: string; // e.g., 'doc', 'pdf'
  // Additional fields for attachment card display
  title?: string;
  downloadUrl?: string; // Direct download URL, if different from 'url'
  thumbnailUrl?: string;
  createTime?: number;
  redirect?:boolean;
}

export interface SendAttachment {
  filePath: string; // Local file path or URL
  name?: string; // Optional: original file name, if different from path.basename
  size?: number; // Optional: file size in bytes
  type?: string; // Optional: file extension without dot, e.g., 'docx', 'pdf', 'txt'
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createTime: number;
  parentId?: string;
  childrenIds?: string[];
  status?: 'sending' | 'success' | 'error';
  extra?: any;
  attachments?: Attachment[];
}

/**
 * 统一的思考模式类型
 * 支持豆包和 DeepSeek 的所有模式
 *
 * 豆包模式:
 * - 'fast': 快速模式（默认）
 * - 'think': 深度思考模式
 * - 'expert': 专家模式
 *
 * DeepSeek 模式:
 * - 'normal': 普通模式 (thinking_enabled=false, search_enabled=false)
 * - 'think': 深度思考模式 (thinking_enabled=true, search_enabled=false)
 * - 'search': 联网搜索模式 (thinking_enabled=false, search_enabled=true)
 * - 'think_search': 深度思考+联网搜索 (thinking_enabled=true, search_enabled=true)
 */
export type ThinkMode =
  // 豆包模式
  | 'fast'
  | 'think'
  | 'expert'
  // DeepSeek 模式
  | 'normal'
  | 'think'
  | 'search'
  | 'think_search';

/**
 * 豆包思考模式（向后兼容）
 */
export type DoubaoThinkMode = 'fast' | 'think' | 'expert';

/**
 * DeepSeek 思考模式
 */
export type DeepSeekThinkMode = 'normal' | 'think' | 'search' | 'think_search';

export interface SendMessageOptions {
  conversationId?: string; // If empty, create new conversation
  parentMessageId?: string; // For DeepSeek context
  stream?: boolean;
  model?: string; // For selecting specific models if available
  botId?: string; // For Doubao
  attachments?: SendAttachment[]; // Array of local file paths to be uploaded

  /**
   * 思考模式
   *
   * 豆包支持: 'fast' (默认), 'think', 'expert'
   * DeepSeek支持: 'normal', 'think', 'search' (默认), 'think_search'
   *
   * 每个平台会自动识别并使用自己支持的模式
   */
  thinkMode?: ThinkMode;

  includeThinkingProcess?: boolean; // For Doubao: whether to include thinking process in content (default: false, not include)
  skill?: {
    type?: number; // 0 (default), 1 (writing mode), 2 (image generation), 3 (video generation)
    ratio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'; // Aspect ratio for image/video generation (default: '1:1')
    [key: string]: any; // Allow extension for other properties
  };
  unsign?: boolean;
}

export interface ImageInfo {
  url: string; // Image URL (from image_ori_raw)
  width: number;
  height: number;
  key?: string; // Image key/identifier
  thumbnailUrl?: string; // Thumbnail URL (from image_thumb)
  previewUrl?: string; // Preview URL (from image_preview)
}

export interface VideoInfo {
  vid: string; // Video ID
  url: string; // Video download URL
  coverUrl: string; // Video cover image URL
  width: number;
  height: number;
  duration: number; // Duration in seconds
  videoType?: string; // e.g., 'mp4'
}

export interface StreamEvent {
  type: 'start' | 'text' | 'end' | 'error' | 'attachment' | 'thinking' | 'image' | 'video';
  data?: string; // For 'text' event, this is the delta content
  fullContent?: string; // Accumulated content
  messageId?: string;
  conversationId?: string; // The conversation ID (especially important for new chats)
  createTime?: number; // Message creation time
  error?: any;
  attachment?: Attachment;
  thinkingText?: string; // For 'thinking' event, this is the thinking process text
  images?: ImageInfo[]; // For 'image' event, array of generated images
  videos?: VideoInfo[]; // For 'video' event, array of generated videos
}

export interface ChatService {
  /**
   * 获取会话列表
   * @param cursor 分页游标
   * @param limit 每页数量
   */
  getConversations(
    cursor?: string,
    limit?: number,
  ): Promise<{ code?: number; msg?: string; items: Conversation[]; nextCursor?: string; hasMore: boolean }>;

  /**
   * 获取指定会话的历史消息
   * @param conversationId 会话ID
   * @param cursor 分页游标
   * @param limit 每页数量
   */
  getMessages(
    conversationId: string,
    cursor?: string,
    limit?: number,
  ): Promise<{ code?: number; msg?: string; items: Message[]; nextCursor?: string; hasMore: boolean }>;

  /**
   * 发送消息
   * @param content 消息内容
   * @param options 发送选项
   */
  sendMessage(content: string, options?: SendMessageOptions): Observable<StreamEvent>;

  /**
   * 删除会话
   * @param conversationId
   */
  deleteConversation?(conversationId: string): Promise<void>;
}

/**
 * AI对话会话列表响应
 */
export interface AIChatConversationListResponse extends BaseResult {
  items?: Conversation[];
  nextCursor?: string;
  hasMore?: boolean;
}

/**
 * AI对话消息列表响应
 */
export interface AIChatMessageListResponse extends BaseResult {
  items?: Message[];
  nextCursor?: string;
  hasMore?: boolean;
}

/**
 * AI对话附件解析响应
 */
export interface AIChatAttachmentParseResponse extends BaseResult {
  attachment?: Attachment;
}
