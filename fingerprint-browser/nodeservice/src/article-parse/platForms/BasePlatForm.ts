import { CookieContainer } from '../common/CookieContainer';
import { HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
export class BasePlatForm {
  public proxy?: KuaiDaiLiProxy | undefined;

  protected proxyAgent: object | undefined;
  protected cookieContainer: CookieContainer;

  public constructor() {
    this.cookieContainer = new CookieContainer();
    this.proxy = undefined;
  }

  public getProxyAgent(): void {
    if (this.proxy?.serverAdd) {
      this.proxyAgent = createKuaiProxyAgent(this.proxy);
    }
  }

  public async GetArticleContent(url: string): Promise<Content | null> {
    return null;
  }
  protected CreateHttp(): HttpHelp | undefined {
    const http = new HttpHelp();
    http.CookieContainer = this.cookieContainer;
    return http;
  }
}
