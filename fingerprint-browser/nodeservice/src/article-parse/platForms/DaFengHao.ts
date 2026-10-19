import { BasePlatForm } from './BasePlatForm';
import { AgentType, HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
export class DaFengHao extends BasePlatForm {
  static ttwid: string;

  public constructor() {
    super();
  }

  public override async GetArticleContent(url: string): Promise<Content | null> {
    if (!url) {
      return null;
    }
    if (url.startsWith('https')) url = 'http' + url.substring(5);
    const result =
      (await this.GetPCWebContent(url)) ??
      (await this.GetContentAndriodOnPCWeb(url)) ??
      (await this.GetContentIOSOnPCWeb(url));
    if (result) {
      return result;
    }
    return null;
  }

  private async GetPCWebContent(url: string): Promise<Content | null> {
    try {
      const http = this.CreateHttp();
      const result = await http.GetAsync(url);
      if (result) {
        const document = new HtmlAgilityPack.HtmlDocument();
        document.LoadHtml(result);
        const contentNode = document.DocumentNode.doc.getElementsByClassName('detailBox-2ms7ofXz')[0];

        if (!contentNode) {
          return null;
        }
        const links = document.DocumentNode.SelectNodes('//a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i]?.parentNode?.removeChild(links[i]);
          }
        }

        const titleNode = document.DocumentNode.doc.getElementsByClassName('title-14yWv8ay')[0];
        const content = new Content();
        content.content = `<p>${contentNode?.toString()}</p>`;
        content.title = titleNode?.textContent ?? '';
        return content;
      }
      return null;
    } catch (er) {
      return null;
    }
  }

  private async RegisterCookie(): Promise<void> {
    try {
      const http = this.CreateHttp();
      http.Referer = 'https://www.toutiao.com';
      http.ContentType = 'application/json';
      const result = await http.PostAsync(
        'https://ttwid.bytedance.com/ttwid/union/register/',
        '{"aid":24,"service":"www.toutiao.com","region":"cn","union":true,"needFid":false}',
      );
      if (result?.includes('register success')) {
        DaFengHao.ttwid = http.CookieContainer.map.get('ttwid') ?? '';
      }
    } catch (er) {}
  }

  private async GetContentAndriodOnPCWeb(contentUrl: string): Promise<Content | null> {
    try {
      if (!contentUrl) {
        return null;
      }
      const http = this.CreateHttp();
      http.SetAgent(AgentType.Andriod);
      const result = await http.GetAsync(contentUrl);
      if (result) {
        const document = new HtmlAgilityPack.HtmlDocument();
        document.LoadHtml(result);
        const contentNode = document.DocumentNode.doc.getElementsByClassName('detailBox-2ms7ofXz')[0];

        if (!contentNode) return null;
        const links = document.DocumentNode.SelectNodes('//a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i]?.parentNode?.removeChild(links[i]);
          }
        }

        const titleNode = document.DocumentNode.doc.getElementsByClassName('title-14yWv8ay')[0];
        const content = new Content();
        content.content = `<p>${contentNode?.toString()}</p>`;
        content.title = titleNode?.textContent ?? '';
        return content;
      }
      return null;
    } catch (er) {
      return null;
    }
  }
  private async GetContentIOSOnPCWeb(contentUrl: string): Promise<Content | null> {
    try {
      if (!contentUrl) {
        return null;
      }
      const http = this.CreateHttp();
      http.SetAgent(AgentType.IOS);
      const result = await http.GetAsync(contentUrl);
      if (result) {
        const document = new HtmlAgilityPack.HtmlDocument();
        document.LoadHtml(result);
        const contentNode = document.DocumentNode.doc.getElementsByClassName('detailBox-2ms7ofXz')[0];

        if (!contentNode) return null;
        const links = document.DocumentNode.SelectNodes('//a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i].parentNode?.removeChild(links[i]);
          }
        }

        const titleNode = document.DocumentNode.doc.getElementsByClassName('title-14yWv8ay')[0];
        const content = new Content();
        content.content = `<p>${contentNode?.toString()}</p>`;
        content.title = titleNode?.textContent ?? '';
        return content;
      }
      return null;
    } catch (er) {
      return null;
    }
  }

  private ParsePcMobileContent(jo: any) {
    let contentStr = jo.content.cnt_html.toString();
    if (!contentStr) return null;
    let i = 0;
    for (const img of Object.keys(jo.content.cnt_attr)) {
      const imgHtml = '<img src="' + jo.content.cnt_attr[img]?.img?.imgurl0?.imgurl + '"></img>';
      contentStr = contentStr.replace('<!--IMG_' + i + '-->', imgHtml);
      i++;
    }
    const content = new Content();
    content.content = contentStr;
    content.title = jo.content.title;
    return content;
  }

  protected override CreateHttp() {
    const http = new HttpHelp();
    http.CookieContainer = this.cookieContainer;
    http.Referer = 'http://www.ifeng.com';
    return http;
  }
}
