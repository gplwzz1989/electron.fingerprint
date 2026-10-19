import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class XiaoHongShuAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://creator.xiaohongshu.com/login';
  entryUrl = 'https://creator.xiaohongshu.com/new/home';
}

export class XiaoHongShuShouYeAuthorizeConfig extends XiaoHongShuAuthorizeConfig {
  authorizeUrl = 'https://www.xiaohongshu.com/login';
  entryUrl = 'https://www.xiaohongshu.com/explore';
}
