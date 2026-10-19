import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class WeiXinShiPinHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://channels.weixin.qq.com/login.html';
  entryUrl = 'https://channels.weixin.qq.com/platform';
}

export class WeiXinShiPinHaoStoreAuthorizeConfig extends WeiXinShiPinHaoAuthorizeConfig {
  authorizeUrl = 'https://store.weixin.qq.com/talent/?redirect_url=%2Fchannel%2Ffinder';
  entryUrl = 'https://store.weixin.qq.com/talent/channel/finder';
}
