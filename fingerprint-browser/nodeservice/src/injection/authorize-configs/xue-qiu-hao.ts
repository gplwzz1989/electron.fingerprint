import { PlatformAuthorizeConfig } from '@/injection/platform-authorize-config';

export class XueQiuHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://xueqiu.com/account/login?url=https://mp.xueqiu.com';
  entryUrl = 'https://mp.xueqiu.com/';
}
