import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class FengWangAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'http://o.fun.tv/account/login/';
  entryUrl = 'http://o.fun.tv/account/home';
}
