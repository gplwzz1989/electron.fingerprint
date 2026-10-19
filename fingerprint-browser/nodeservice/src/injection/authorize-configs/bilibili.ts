import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class BilibiliAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://passport.bilibili.com/login';
  entryUrl = 'https://member.bilibili.com/platform';
}
