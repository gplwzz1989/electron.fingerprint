import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class YiCheHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://i.yiche.com/authenservice/login.html?returnurl=https://mp.yiche.com/';
  entryUrl = 'https://mp.yiche.com/';
}
