import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class DeWuAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://creator.dewu.com/login';
  entryUrl = 'https://creator.dewu.com/release';
}
