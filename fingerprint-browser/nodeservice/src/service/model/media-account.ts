export interface MediaAccount {
  platformName: string;
  platformAvatar: string;
  platformAccountName: string;
  remark: string;
  spaceId: string;
  platformAuthorId: string;
  status: number;
  isFreeze: boolean;
  id: string;
  createdAt: number;
  isOperate: boolean;
  cookie?: string;
  cookieMd5?: string;
}
