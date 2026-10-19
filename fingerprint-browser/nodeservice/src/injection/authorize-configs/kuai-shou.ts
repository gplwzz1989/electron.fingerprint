import { PlatformAuthorizeConfig } from '../platform-authorize-config';

export class KuaiShouAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl: string =
    'https://passport.kuaishou.com/pc/account/login/?sid=kuaishou.web.cp.api&callback=https%3A%2F%2Fcp.kuaishou.com%2Frest%2Finfra%2Fsts%3FfollowUrl%3Dhttps%253A%252F%252Fcp.kuaishou.com%252Fprofile%26setRootDomain%3Dtrue';
  entryUrl = 'https://cp.kuaishou.com/profile';
}
