import { PlatformAuthorizeConfig } from '../platform-authorize-config';
export class AZhanAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://www.acfun.cn/login/?returnUrl=http://member.acfun.cn%2F';
  entryUrl = 'https://member.acfun.cn/';
}
