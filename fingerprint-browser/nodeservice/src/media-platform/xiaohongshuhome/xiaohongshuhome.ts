import { getXiaohongshuhomeAlt, getXiaohongshuhomeUserInfo } from './xiaohongshuhome-user';
import { getXiaohongshuhomeUnreadCount } from './xiaohongshuhome-common';
import {
  addXiaohongshuhomeComment,
  delXiaohongshuhomeComment,
  digXiaohongshuhomeComment,
  getXiaohongshuhomeCommentByContent,
  getXiaohongshuhomeCommentContent,
  getXiaohongshuhomeLatestCommentNoticeList,
} from './xiaohongshuhome-comment';
import {
  getXiaohongshuhomeMessageConversationList,
  getXiaohongshuhomeMessageConversationInfo,
  getXiaohongshuhomeMessageListByConversation,
  sendXiaohongshuhomeMessage,
} from './xiaohongshuhome-message.service';

export const Xiaohongshuhome = {
  getXiaohongshuhomeUserInfo,
  getXiaohongshuhomeAlt,
  getXiaohongshuhomeUnreadCount,
  getXiaohongshuhomeMessageConversationList,
  getXiaohongshuhomeMessageConversationInfo,
  getXiaohongshuhomeMessageListByConversation,
  sendXiaohongshuhomeMessage,
  getXiaohongshuhomeCommentContent,
  getXiaohongshuhomeCommentByContent,
  getXiaohongshuhomeLatestCommentNoticeList,
  addXiaohongshuhomeComment,
  delXiaohongshuhomeComment,
  digXiaohongshuhomeComment,
};

export type { XiaohongshuhomeAltResult, XiaohongshuhomeUserInfoResultOutput } from './xiaohongshuhome-user';
export type {
  XiaohongshuhomeChatInfo,
  XiaohongshuhomeRawMessage,
} from './xiaohongshuhome-message.service';
export type {
  XiaohongshuhomeComment,
  XiaohongshuhomeCommentNotice,
  XiaohongshuhomeNote,
} from './xiaohongshuhome-comment.service';
export type {
  XiaohongshuhomeUnreadCountData,
  XiaohongshuhomeUnreadCountResponse,
} from './xiaohongshuhome-common';
export { getXiaohongshuhomeUnreadCount } from './xiaohongshuhome-common';
