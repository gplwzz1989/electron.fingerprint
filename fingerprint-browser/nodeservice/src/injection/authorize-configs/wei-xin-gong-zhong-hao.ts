import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class WeiXinGongZhongHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://mp.weixin.qq.com/cgi-bin/loginpage?url=%2Fcgi-bin%2Fhome';
  entryUrl = 'https://mp.weixin.qq.com/cgi-bin/home';
}
