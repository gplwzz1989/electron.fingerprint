import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class DouBanAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://accounts.douban.com/passport/login?redir=https://www.douban.com/';
  entryUrl = 'https://www.douban.com/';
}
