import { BasePlatForm } from './BasePlatForm';
import { AgentType, HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
export class JianShu extends BasePlatForm {
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
        const contentNode = document.DocumentNode.doc.getElementsByClassName('_2rhmJa')[0];

        if (!contentNode) {
          return null;
        }
        const links = document.DocumentNode.SelectNodes('//a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i]?.parentNode?.removeChild(links[i]);
          }
        }

        const iamges = document.DocumentNode.SelectNodes('//img');
        if (iamges?.length > 0) {
          for (let i = 0; i < iamges.length; i++) {
            const url =
              iamges[i].getAttribute('data-original-src') ??
              iamges[i].getAttribute('data-src') ??
              iamges[i].getAttribute('src');

            iamges[i].setAttribute('src', url?.startsWith('http') ? url : 'https:' + url);
          }
        }

        const titleNode = document.DocumentNode.doc.getElementsByClassName('_1RuRku')[0];
        const content = new Content();
        content.content = `<p>${contentNode?.toString()}</p>`;
        content.title = titleNode?.textContent?.replace('\\\ng', '')?.trim();
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
        const contentNode = document.DocumentNode.doc.getElementsByClassName('note-content')[0];

        if (!contentNode) return null;
        const links = document.DocumentNode.SelectNodes('//a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i].parentNode?.removeChild(links[i]);
          }
        }

        const titleNode = document.DocumentNode.doc.getElementsByClassName('title')[0];
        const content = new Content();
        content.content = `<p>${contentNode?.toString()}</p>`;
        content.title = titleNode?.textContent?.replace('\\\ng', '')?.trim();
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
        const contentNode = document.DocumentNode.doc.getElementsByClassName('note-content')[0];

        if (!contentNode) return null;
        const links = document.DocumentNode.SelectNodes('//a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i]?.parentNode?.removeChild(links[i]);
          }
        }

        const titleNode = document.DocumentNode.doc.getElementsByClassName('title')[0];
        const content = new Content();
        content.content = `<p>${contentNode?.toString()}</p>`;
        content.title = titleNode?.textContent?.replace('\\\ng', '')?.trim();
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
    http.Referer = 'http://www.jianshu.com';
    return http;
  }
}
