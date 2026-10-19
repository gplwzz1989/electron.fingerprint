import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class MeiYouAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://mp.meiyou.com/page/sso/login';
  entryUrl = 'https://mp.meiyou.com/home';
}
