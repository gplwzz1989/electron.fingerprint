import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class ZhiHuAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://www.zhihu.com/signin?next=%2Fcreator';
  entryUrl = 'https://www.zhihu.com/creator';
}
