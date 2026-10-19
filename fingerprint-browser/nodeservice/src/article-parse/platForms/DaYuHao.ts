import { BasePlatForm } from './BasePlatForm';
import { Regex } from '../common/Common';
import { AgentType, HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
export class DaYuHao extends BasePlatForm {
  static ttwid: string;

  public constructor() {
    super();
  }

  public override async GetArticleContent(url: string): Promise<Content | null> {
    if (!url) {
      return null;
    }
    if (url.startsWith('https')) {
      url = 'http' + url.substring(5);
    }
    let contentId = Regex.Match(url, 'wm_id=[0-9a-z]{30,}').Value();

    if (contentId) {
      contentId = contentId.split('=')[1];
      const result =
        (await this.GetPCWebContent(contentId)) ??
        (await this.GetContentAndriodOnPCWeb(contentId)) ??
        (await this.GetContentIOSOnPCWeb(contentId));
      if (result) return result;
    }
    return null;
  }
  private async GetPCWebContent(contentId: string): Promise<Content | null> {
    try {
      const http = this.CreateHttp();
      const url = 'https://ff.dayu.com/contents/origin/' + contentId + '?biz_id=1002&_fetch_author=1&_incr_fields=';
      const result = await http.GetAsync(url);
      if (result && typeof result == 'object' && result?.data?.body) {
        return this.ParsePcMobileContent(result);
      }
      return null;
    } catch (er) {
      return null;
    }
  }

  private async GetContentAndriodOnPCWeb(contentId: string): Promise<Content | null> {
    try {
      if (!contentId) {
        return null;
      }
      const http = this.CreateHttp();
      http.SetAgent(AgentType.Andriod);
      const url = 'https://ff.dayu.com/contents/origin/' + contentId + '?biz_id=1002&_fetch_author=1&_incr_fields=';
      const result = await http.GetAsync(url);
      if (result && typeof result == 'object' && result?.data?.body) {
        return this.ParsePcMobileContent(result);
      }
      return null;
    } catch (er) {
      return null;
    }
  }
  private async GetContentIOSOnPCWeb(contentId: string): Promise<Content | null> {
    try {
      if (!contentId) {
        return null;
      }
      const http = this.CreateHttp();
      http.SetAgent(AgentType.IOS);
      const url = 'https://ff.dayu.com/contents/origin/' + contentId + '?biz_id=1002&_fetch_author=1&_incr_fields=';
      const result = await http.GetAsync(url);
      if (result && typeof result == 'object' && result?.data?.body) {
        return this.ParsePcMobileContent(result);
      }
      return null;
    } catch (er) {
      return null;
    }
  }

  private ParsePcMobileContent(jo: any) {
    let contentStr = jo.data.body.text.toString();
    if (!contentStr) return null;
    let i = 0;
    for (const img of jo.data.body.inner_imgs) {
      const imgHtml =
        '<img src="' +
        img.url +
        '" data-width="' +
        img.width +
        '" data-height="' +
        img.height +
        '" data-format="' +
        img.format +
        '" data-size="' +
        img.size +
        '"></img>';
      contentStr = contentStr.replace('<!--{img:' + i + '}-->', imgHtml);
      i++;
    }
    const content = new Content();
    content.content = contentStr;
    content.title = jo.data.title;
    return content;
  }

  protected override CreateHttp() {
    const http = new HttpHelp();
    http.CookieContainer = this.cookieContainer;
    http.Referer = 'http://a.mp.uc.cn/';
    http.Headers['Origin'] = http.Referer;
    http.ContentType = 'text/plain';
    return http;
  }
}
