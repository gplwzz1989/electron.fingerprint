import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class CheJiaHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://account.autohome.com.cn/?backurl=https%3A%2F%2Fcreator.autohome.com.cn%2Fweb%2Fhome';
  entryUrl = 'https://creator.autohome.com.cn/web/home';
}
