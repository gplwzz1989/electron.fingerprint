import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class DongCheHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://mp.dcdapp.com/login';
  entryUrl = 'https://mp.dcdapp.com/profile_v2/home';
}
