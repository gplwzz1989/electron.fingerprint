import { Platforms } from '@/service/datasync-service-manager';

export interface TeamIdentifier {
  userid: string;
  teamId: string;
}

export interface BrowserContextIdentifier extends TeamIdentifier {
  contextId: string;
}

export interface AccountInfoStructure {
  type: 'spiderAccount' | 'wechatSubAccount';
  platformName: string;
  accountId: string;
  displayName: string;
  avatar: string;
  sessionState: '正常' | '已失效';
  identityVerified: boolean;
}

export const platformNames = Platforms;
