import { BasePlatForm } from './BasePlatForm';
import { AgentType, HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';

export class GongZhongHao extends BasePlatForm {
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
      let result = await http.GetAsync(url);
      if (result) {
        const html = new HtmlAgilityPack.HtmlDocument();
        result = result
          .replace(/<iframe([^>]*)><\/iframe>/g, '<iframe$1> </iframe>')
          .replace(/<iframe([^>]*)\/>/g, '<iframe$1> </iframe>');
        html.LoadHtml(result);
        const contentNode = html.DocumentNode.GetElementbyId('js_content');

        if (!contentNode) {
          return null;
        }
        const titleNode =
          html.DocumentNode.SelectSingleNode("//meta[@property='og:title']") ??
          html.DocumentNode.SelectSingleNode("//h1[@class='rich_media_title']") ??
          html.DocumentNode.GetElementbyId('activity-name') ??
          html.DocumentNode.doc.getElementsByTagName('title')[0];
        const links = html.DocumentNode.SelectNodes('//a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i].parentNode?.removeChild(links[i]);
          }
        }

        const imgs = contentNode.getElementsByTagName('img');
        if (imgs?.length > 0) {
          for (let i = 0; i < imgs.length; i++) {
            let imgUrl = imgs[i].getAttribute('src') ?? '';
            if (!imgUrl) {
              imgUrl = imgs[i].getAttribute('data-src') ?? '';
            }
            if (imgUrl.startsWith('//')) {
              imgUrl = `https:${imgUrl}`;
            }
            imgs[i].setAttribute('src', imgUrl);
          }
        }

        const content = new Content();
        content.content = `<p>${contentNode?.toString()}</p>`;
        content.title = titleNode?.getAttribute('content') ?? titleNode?.textContent?.replace('\\\ng', '')?.trim();
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
      let result = await http.GetAsync(contentUrl);
      if (result) {
        result = result
          .replace(/<iframe([^>]*)><\/iframe>/g, '<iframe$1> </iframe>')
          .replace(/<iframe([^>]*)\/>/g, '<iframe$1> </iframe>');
        const document = new HtmlAgilityPack.HtmlDocument();
        document.LoadHtml(result);
        const contentNode = document.DocumentNode.GetElementbyId('js_content');

        if (!contentNode) return null;
        const links = document.DocumentNode.SelectNodes('//a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i].parentNode?.removeChild(links[i]);
          }
        }

        const titleNode =
          document.DocumentNode.SelectSingleNode("//meta[@property='og:title']") ??
          document.DocumentNode.SelectSingleNode("//h1[@class='rich_media_title']") ??
          document.DocumentNode.GetElementbyId('activity-name') ??
          document.DocumentNode.doc.getElementsByTagName('title')[0] ??
          document.DocumentNode.GetElementbyId('activity-name');
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
        const contentNode = document.DocumentNode.GetElementbyId('js_content');

        if (!contentNode) return null;
        const links = contentNode.getElementsByTagName('a');
        if (links?.length > 0) {
          for (let i = 0; i < links.length; i++) {
            links[i].parentNode?.removeChild(links[i]);
          }
        }

        const titleNode = document.DocumentNode.GetElementbyId('activity-name');
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
    http.Referer = 'http://weixin.qq.com';
    return http;
  }
}
