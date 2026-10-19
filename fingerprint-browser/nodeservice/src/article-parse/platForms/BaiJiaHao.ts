import { BasePlatForm } from './BasePlatForm';
import { AgentType, HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
import { HtmlAgilityPack } from '../common/HtmlAgilityPack';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';

export class BaiJiaHao extends BasePlatForm {
  static ttwid: string;

  public constructor() {
    super();
  }

  public override async GetArticleContent(url: string, proxy?: KuaiDaiLiProxy): Promise<Content | null> {
    if (!url) return null;

    if (url.startsWith('https')) url = 'http' + url.substring(5);
    let re = await this.GetPCWebContent(url);
    if (re != null) return re;
    re = await this.GetContentAndriodOnPCWeb(url);
    if (re != null) return re;
    re = await this.GetContentIOSOnPCWeb(url);
    return re;
  }
  private async GetPCWebContent(url: string): Promise<Content | null> {
    try {
      const http = this.CreateHttp();
      const result = await http?.GetReqAsync(url, this.proxyAgent);
      if (result) {
        const document = new HtmlAgilityPack.HtmlDocument();
        document.LoadHtml(result);
        const contentNode =
          document.DocumentNode.doc.getElementsByClassName('_2OVtLCRVVVa5RwDyfhipoy')[0] ??
          document.DocumentNode.doc.getElementsByClassName('_18p7x')[0];

        if (!contentNode) {
          return null;
        }
        let titleNode =
          document.DocumentNode.doc.getElementsByClassName('_2akiyyCcJt3GTUofn31jvy')[0] ??
          document.DocumentNode.doc.getElementsByTagName('title')[0] ??
          document.DocumentNode.doc.getElementsByClassName('sKHSJ')[0];
        if (!titleNode?.textContent) {
          titleNode = document.DocumentNode.doc.getElementsByTagName('title')[0];
        }
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

  private async GetContentAndriodOnPCWeb(url: string): Promise<Content | null> {
    try {
      if (!url) {
        return null;
      }
      const http = this.CreateHttp();
      if (!http) {
        return null;
      }
      http.SetAgent(AgentType.Andriod);
      const result = await http.GetAsync(url, this.proxyAgent);
      if (result) {
        const htmlDoc = new HtmlAgilityPack.HtmlDocument();
        htmlDoc.LoadHtml(result);
        const contentNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@class='mainContent']");
        if (!contentNode) return null;
        let titleNode = htmlDoc.DocumentNode.SelectSingleNode("//h1[@class='titleSize']");
        if (!titleNode?.textContent) {
          titleNode = htmlDoc.DocumentNode.SelectSingleNode('//title');
        }
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
  private async GetContentIOSOnPCWeb(url: string): Promise<Content | null> {
    try {
      if (!url) {
        return null;
      }
      const http = this.CreateHttp();
      if (!http) {
        return null;
      }
      http.SetAgent(AgentType.IOS);
      const result = await http.GetAsync(url, this.proxyAgent);
      if (result) {
        const htmlDoc = new HtmlAgilityPack.HtmlDocument();
        htmlDoc.LoadHtml(result);
        const contentNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@class='mainContent']");
        if (!contentNode) return null;
        let titleNode = htmlDoc.DocumentNode.SelectSingleNode("//h1[@class='titleSize']");
        if (!titleNode?.textContent) {
          titleNode = htmlDoc.DocumentNode.SelectSingleNode('//title');
        }
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

  protected override CreateHttp(): HttpHelp | undefined {
    try {
      const http = new HttpHelp();
      http.CookieContainer = this.cookieContainer;
      http.CookieContainer.AddCookie(
        'BAIDUID=FA25C75D0897CA8EE5D6D4E0A701E876:FG=1; BAIDUID_BFESS=FA25C75D0897CA8EE5D6D4E0A701E876:FG=1; __bid_n=19d18d7e1a268647e7a7c4; MBDFEEDSG=7af5cac7fd83e4d2b0e4d7f3897e2b88_1774238613; ab_sr=1.0.1_OWYzNDQ4NzM1MzM4MjdmOGYyZTRkMTc3MjRkM2RkYWY4OTI5YWM5Yzk5NzlhM2I0MDc0NDFlOTdmYWYxMGRiMzE1MDk0MGYyYjdhYWYyZmIyMDMzZGU0ZDBjMGRjYjM4NDZiNmE4YzQxYzZlYjg5MWU3MDY3ZGEyM2Q2NWM4OGVkYzhkNjI3NDhlNDY3NzQ0NTNhYjc3NjVkZjQ3ODExYQ=='
      );
      http.Referer = 'http://www.baidu.com';
      return http;
    } catch (e) {
      console.error(e);
    }
  }
}
