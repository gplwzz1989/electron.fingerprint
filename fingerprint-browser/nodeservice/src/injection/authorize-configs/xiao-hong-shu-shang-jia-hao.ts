import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class XiaoHongShuShangJiaHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://customer.xiaohongshu.com/login?service=https://ark.xiaohongshu.com/app-system/home';
  entryUrl = 'https://ark.xiaohongshu.com/app-system/home';
}
