import { BasePlatForm } from './BasePlatForm';
import { AgentType, HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';

export class YiDianHao extends BasePlatForm {
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
    if (result) return result;
    return null;
  }

  private async GetPCWebContent(url: string): Promise<Content | null> {
    try {
      const http = this.CreateHttp();
      const result = await http.GetAsync(url);
      if (result) {
        const document = new HtmlAgilityPack.HtmlDocument();
        document.LoadHtml(result);
        const contentNode = document.DocumentNode.doc.getElementById('imedia-article');

        if (!contentNode) {
          return null;
        }
        const titleNode = document.DocumentNode.doc.getElementById('pc-article-title');
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
        const contentNode = document.DocumentNode.doc.getElementById('imedia-article');

        if (!contentNode) return null;
        const titleNode = document.DocumentNode.doc.getElementsByClassName('a-title')[0];
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
        const contentNode = document.DocumentNode.doc.getElementById('imedia-article');

        if (!contentNode) return null;
        const titleNode = document.DocumentNode.doc.getElementsByClassName('a-title')[0];
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

  protected override CreateHttp() {
    const http = new HttpHelp();
    http.CookieContainer = this.cookieContainer;
    http.Referer = 'http://www.yidianhao.com';
    return http;
  }
}
