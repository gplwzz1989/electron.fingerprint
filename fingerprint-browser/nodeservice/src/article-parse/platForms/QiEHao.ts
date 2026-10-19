import { BasePlatForm } from './BasePlatForm';
import { Regex } from '../common/Common';
import { AgentType, HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
export class QiEHao extends BasePlatForm {
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
    const checkUrl = url.split('=')[0].split('?')[0].toLowerCase();
    if (checkUrl.includes('mp.qq.com') || checkUrl.includes('om.qq.com')) {
      return await this.GetPCWebKanDian(url);
    } else {
      const result =
        (await this.GetPCWebContent(url)) ??
        (await this.GetContentAndriodOnPCWeb(url)) ??
        (await this.GetContentIOSOnPCWeb(url));
      if (result) {
        return result;
      }
    }

    return null;
  }

  private async GetPCWebKanDian(url: string): Promise<Content | null> {
    try {
      const http = this.CreateHttp();
      const result = await http.GetAsync(url);
      if (result) {
        const document = new HtmlAgilityPack.HtmlDocument();
        document.LoadHtml(result);
        const contentNode =
          document.DocumentNode.doc.getElementsByClassName('rich_media_content')[0] ??
          document.DocumentNode.doc.getElementsByClassName('article')[0];

        if (!contentNode) return null;
        const titleNode =
          document.DocumentNode.doc.getElementsByClassName('rich_media_title')[0] ??
          document.DocumentNode.doc.getElementsByTagName('title')[0];
        const content = new Content();
        content.content = `<p>${contentNode?.toString()}</p>`;
        content.title = titleNode?.textContent?.replace('_腾讯内容开放平台', '');
        return content;
      }
      return null;
    } catch (er) {
      return null;
    }
  }

  private async GetPCWebContent(url: string): Promise<Content | null> {
    try {
      const http = this.CreateHttp();
      let result = await http.GetAsync(url);
      if (result) {
        if (result?.toString()?.includes('window.initData')) {
          result = Regex.split(result, 'window\\.initData[\\s]{0,}=')[1];
          result = Regex.split(result, ';</script>')[0];
          const jo = JSON.parse(result);
          return this.ParsePcMobileContent(jo);
        } else {
          const document = new HtmlAgilityPack.HtmlDocument();
          document.LoadHtml(result);
          const contentNode =
            document.DocumentNode.doc.getElementsByClassName('rich_media_content')[0] ??
            document.DocumentNode.doc.getElementsByClassName('article')[0];

          if (!contentNode) return null;
          const titleNode =
            document.DocumentNode.doc.getElementsByClassName('rich_media_title')[0] ??
            document.DocumentNode.doc.getElementsByTagName('title')[0];
          const content = new Content();
          content.content = `<p>${contentNode?.toString()}</p>`;
          content.title = titleNode?.textContent?.replace('_腾讯内容开放平台', '');
          return content;
        }
      }
      return null;
    } catch (er) {
      return null;
    }
  }

  private async GetContentAndriodOnPCWeb(contentUrl: string): Promise<Content | null | undefined> {
    try {
      if (!contentUrl) {
        return null;
      }
      const http = this.CreateHttp();
      http.SetAgent(AgentType.Andriod);
      let result = await http.GetAsync(contentUrl);
      if (result) {
        result = Regex.split(result, 'window\\.initData[\\s]{0,}=')[1];
        result = Regex.split(result, ';</script>')[0];
        const jo = JSON.parse(result);
        return this.ParsePcMobileContent(jo);
      }
    } catch (er) {
      return null;
    }
  }
  private async GetContentIOSOnPCWeb(contentUrl: string): Promise<Content | null | undefined> {
    try {
      if (!contentUrl) return null;
      const http = this.CreateHttp();
      http.SetAgent(AgentType.IOS);
      let result = await http.GetAsync(contentUrl);
      if (result) {
        result = Regex.split(result, 'window\\.initData[\\s]{0,}=')[1];
        result = Regex.split(result, ';</script>')[0];
        const jo = JSON.parse(result);
        return this.ParsePcMobileContent(jo);
      }
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
    http.Referer = 'http://www.qq.com';
    return http;
  }
}
