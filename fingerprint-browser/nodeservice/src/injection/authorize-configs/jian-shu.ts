import { PlatformAuthorizeConfig } from '@/injection/platform-authorize-config';

export class JianShuAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://www.jianshu.com/sign_in';
  entryUrl = 'https://www.jianshu.com/';
}
