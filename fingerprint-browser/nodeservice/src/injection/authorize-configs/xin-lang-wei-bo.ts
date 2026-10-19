import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class XinLangWeiBoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://passport.weibo.com/sso/signin';
  entryUrl = 'https://me.weibo.com/';
}
