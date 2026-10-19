import { CookieContainer } from './CookieContainer';
import { Random } from './Common';
import { $http } from '@/http';
export class HttpHelp {
  //请求
  public Headers: any = {};

  //public Cookies:Array<any>|String=[];
  public CookieContainer: CookieContainer = new CookieContainer();

  private IOSAgents: Array<string> = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
  ];
  private AndriodAgents: Array<string> = [
    'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36',
  ];

  private PCAgents: Array<string> = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 Edg/92.0.902.67',
  ];

  public UserAgent: string =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 Edg/92.0.902.67';

  public Accept: string = 'text/plain, */*; q=0.01';

  public Accept_Encoding: string = 'gzip, deflate';

  public Accept_Language: string = 'zh-CN,zh;q=0.9';

  public Referer?: string | null = null;

  public AllownRedirect: boolean = true;

  public ContentType = 'application/x-www-form-urlencoded';

  public TimeOut: number = 1000 * 10;

  public AllowRedirect: boolean = true;

  public Proxy: any = null; //对象

  public constructor() {
    //this.Proxy = 'http://127.0.0.1:8888';
  }

  public KeepAlive: boolean = true;

  //响应
  public StatusCode?: number = -1;

  public ErrorMsg?: string | null = null;

  public ResponseHeader: any = null;

  public RedirectUrl: string | null = null;

  public InitHeader(ptotocl: string = 'https'): void {
    if (process.env.DEBUG === '1') {
      this.Proxy = {
        protocol: ptotocl,
        host: '127.0.0.1',
        port: 8888,
      };
    }
    if (this.UserAgent) this.Headers['User-Agent'] = this.UserAgent;
    if (this.Accept) this.Headers['Accept'] = this.Accept;
    if (this.Accept_Language) this.Headers['Accept-Language'] = this.Accept_Language;
    if (this.Accept_Encoding) this.Headers['Accept-Encoding'] = this.Accept_Encoding;
    if (this.Referer) this.Headers['Referer'] = this.Referer;
    if (this.CookieContainer && this.CookieContainer.map.size > 0)
      this.Headers['Cookie'] = this.CookieContainer.toString();
  }

  public SetAgent(type: AgentType, defalt: boolean = true) {
    if (type == AgentType.Andriod) {
      this.UserAgent = defalt
        ? this.AndriodAgents[0]
        : this.AndriodAgents[new Random().Next(0, this.AndriodAgents.length) % this.AndriodAgents.length];
    } else if (type == AgentType.IOS) {
      this.UserAgent = defalt
        ? this.IOSAgents[0]
        : this.IOSAgents[new Random().Next(0, this.IOSAgents.length) % this.IOSAgents.length];
    } else {
      this.UserAgent = this.PCAgents[0];
    }
  }

  public async GetAsync(url: string, proxyAgent?: object | undefined): Promise<any> {
    try {
      this.InitHeader();

      const result = await $http.get(url, { headers: this.Headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });
      this.StatusCode = result.status;
      if (!result.status) {
        this.ErrorMsg = this.ErrorMsg = '网络异常';
      }
      this.ResponseHeader = result.headers;
      const cookies: Array<string> = result.headers['set-cookie'] ?? [];
      if (cookies) {
        if (this.CookieContainer) this.CookieContainer.AddByHeaders(cookies);
      }
      return result.data;
    } catch (e) {
      this.ErrorMsg = e?.toString();
      return null;
    }
  }
  public async GetReqAsync(url: string, proxyAgent?: object | undefined): Promise<any> {
    try {
      this.InitHeader();

      const result = await $http.get(url, { headers: this.Headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });
      this.StatusCode = result.status;
      if (!result.status) {
        this.ErrorMsg = this.ErrorMsg = '网络异常';
      }
      this.ResponseHeader = result.headers;
      const cookies: Array<string> = result.headers['set-cookie'] ?? [];
      if (cookies) {
        if (this.CookieContainer) this.CookieContainer.AddByHeaders(cookies);
      }
      return result.data;
    } catch (e) {
      this.ErrorMsg = e?.toString();
      return null;
    }
  }

  public async PostAsync(url: string, data: string | NonNullable<unknown>): Promise<any> {
    try {
      this.InitHeader();
      if (typeof data == 'string') this.Headers['Content-Type'] = this.ContentType;
      if (typeof data == 'object') this.Headers['Content-Type'] = 'application/json';
      const result = await $http.post(url, data, { headers: this.Headers });
      this.StatusCode = result.status;
      if (!result.status) {
        this.ErrorMsg = this.ErrorMsg = '网络异常';
      }
      this.ResponseHeader = result.headers;
      const cookies: Array<string> = result.headers['set-cookie'] ?? [];
      if (cookies) {
        if (this.CookieContainer) this.CookieContainer.AddByHeaders(cookies);
      }
      return result.data;
    } catch (e) {
      this.ErrorMsg = e?.toString();
      return null;
    }
  }
}
export enum AgentType {
  Andriod,
  IOS,
  PC,
}
