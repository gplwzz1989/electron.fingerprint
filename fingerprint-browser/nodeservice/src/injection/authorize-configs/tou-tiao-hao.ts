import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class TouTiaoHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://mp.toutiao.com/auth/page/login';
  entryUrl = 'https://mp.toutiao.com/profile_v4';
}
