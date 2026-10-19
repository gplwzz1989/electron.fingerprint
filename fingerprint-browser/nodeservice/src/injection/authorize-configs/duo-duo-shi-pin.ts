import { PlatformAuthorizeConfig } from "../platform-authorize-config";
export class DuoDuoShiPinAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://live.pinduoduo.com/login/anchor';
  entryUrl = 'https://live.pinduoduo.com/n-creator/live/home';
}
