import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class TengXunWeiShiAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://h5.weishi.qq.com/weishi/account/login?r_url=http%3A%2F%2Fmedia.weishi.qq.com%2F';
  entryUrl = 'https://media.weishi.qq.com/';
}
