import { BasePlatForm } from './BasePlatForm';
import { Regex } from '../common/Common';
import { AgentType, HttpHelp } from '../common/HttpHelp';
import { Content } from '../model/Content';
import { HtmlAgilityPack } from '../common/HtmlAgilityPack';
export class TouTiaoHao extends BasePlatForm {
  static ttwid: string;

  public constructor() {
    super();
  }

  public override async GetArticleContent(url: string): Promise<Content | null> {
    if (!url) return null;
    if (url.startsWith('https')) url = 'http' + url.substring(5);
    let contentId = Regex.Match(url, '[/iaw=]{0,2}[0-9]{15,30}[/]{0,}').Value();
    if (contentId) {
      contentId = Regex.Match(contentId, '[0-9]{15,30}').Value();
      if (contentId) {
        const result = (await this.GetContentAndriodOnPCWeb(contentId)) ?? (await this.GetContentIOSOnPCWeb(contentId));
        if (result) return result;
      }
    }
    return await this.GetPCWebContent(url);
  }
  private async GetPCWebContent(url: string): Promise<Content | null> {
    try {
      if (!TouTiaoHao.ttwid) await this.RegisterCookie();
      const http = this.CreateHttp();
      const result = await http.GetAsync(url);
      if (result) {
        const htmlDoc = new HtmlAgilityPack.HtmlDocument();
        htmlDoc.LoadHtml(result);
        const contentNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@class='article-content']/article");
        if (contentNode == null) {
          return null;
        }
        const titleNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@class='article-content']/h1");
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
        TouTiaoHao.ttwid = http.CookieContainer.map.get('ttwid') ?? '';
      }
    } catch (er) {}
  }

  private async GetContentAndriodOnPCWeb(contentId: string): Promise<Content | null> {
    try {
      if (!contentId) {
        return null;
      }
      const http = this.CreateHttp();
      http.SetAgent(AgentType.Andriod);
      const url = 'https://m.toutiao.com/i' + contentId + '/info/v2/?msToken=&X-Bogus=&_signature=';
      const result = await http.GetAsync(url);
      return this.ParsePcMobileContent(result);
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
      const url = 'https://m.toutiao.com/i' + contentId + '/info/v2/?msToken=&X-Bogus=&_signature=';
      const result = await http.GetAsync(url);
      return this.ParsePcMobileContent(result);
    } catch (er) {
      return null;
    }
  }

  private ParsePcMobileContent(jo: any) {
    const content = new Content();
    content.content = jo?.data?.content;
    content.title = jo?.data?.title;
    content.contentId = jo?.data?.gid;
    if (!content?.content) {
      const urls = jo?.data?.thread?.thread_base?.large_image_list;
      const contents = jo?.data?.thread?.thread_base?.content?.split('\n');
      content.content = contents?.length > 0 ? '<p>' + contents.join('</p><p>') + '</p>' : '';
      if (urls?.length > 0) {
        for (const img of urls) {
          content.content += '<img src="' + img.url + '" />';
        }
      }
      if (!content.title && content.content) {
        content.title = contents[0];
      }
    }
    return content.content ? content : null;
  }

  protected override CreateHttp(): HttpHelp {
    const http = new HttpHelp();
    http.CookieContainer = this.cookieContainer;
    http.Referer = 'http://www.toutiao.com';
    return http;
  }
}
