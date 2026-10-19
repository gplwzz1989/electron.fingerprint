import { describe, expect, test } from 'vitest';
import { Wangyihao } from '../../../src';
import { EventEmitter } from 'events';
import { WangyihaoArticleTaskInput } from '../../../src/media-platform/wangyihao/wangyihao-article';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    '_antanalysis_s_id=1778572000631; NTES_YD_SESS=_frqr1ovLalUHe9SPYfXSgHqyFNtUH1JFGu9k3nDsu3ifD7CfFQYXmASnNJ8rR6k_67mrjZ3KaGI4x4CDY6w7dVp9HaMnTZWDHHfUAr068SJpqKSVQWt97NoKHnSLgZnassQmrdPr3F2Vklgz53zTWoPHtzBuXOTqkmQtFzht7szsO41g69ZU.02VDM4wdnAy_KwDkvhsPBslFUa_BDo4160wH2m5XFW9JoPvPJ5v6i2E; S_INFO=1778572039|0|0&60##|17515400924; P_INFO=17515400924|1778572039|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|17515400924; _ntes_origin_from=; gdxidpyhxdE=dEeiAO4%5CZUPruaZkb%5CU3Rff2Rh8ZU4XwmHY6cyYOJ6ThaXn9%2FTS2ps35G%2F445AoVEo6pUGdS7zPaPtiJM24NNukKlEMi8%2BHQ7zHSHUI5RwOQR%2BT%5CTIwRpjq%5Cm7XLPoz%5CVxc3b%2BBe2aPyhTWbWTJ%2BdZbHPmrU%2B72BpIyrRQ9bUeA5fZIy%3A1778572940631; _ntes_nuid=9f15fc3dbef8632b93322a89ccc5fe54; ntes_utid=tid._.KWx2NpYXzM9BB0VEEAKX6Yl3WKhPDe7P._.0; NTESwebSI=1BD59333BB13247CEBA6DDE9387B1937';
  test('网易号图文发布', async () => {
    const taskData: WangyihaoArticleTaskInput = {
      taskId: '',
      pubType: 1,
      title: '黑龙江哈尔滨遭遇强对流天气，同时伴随雷电和弱降雨',
      covers: [
        {
          width: 800,
          height: 769,
          size: 59674,
          pathOrUrl: 'https://oss-v2.yixiaoer.cn/ml/test/t-6821ac8d50bc5fd636fa9801/1780308154317.jpg',
        },
      ],

      content:
        '<p></p><div data-testid="article" xmlns="http://www.w3.org/1999/xhtml"><div><!--s-frag--><p data-mce-style="max-width: 100%;">5月31日，黑龙江哈尔滨遭遇强对流天气，同时伴随雷电和弱降雨，大风引发了短暂的扬沙。</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">有网友发帖称“哈尔滨著名景点索菲亚教堂棚顶掀飞”，6月1日，哈尔滨市道里区文化和旅游局工作人员向潇湘晨报记者表示，未收到索菲亚教堂受损报告。</p><!--/s-frag--></div><div><img src="https://oss-v2.yixiaoer.cn/ml/test/t-6821ac8d50bc5fd636fa9801/1780308154317.jpg" width="1169"></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">△来自小红书截图</p><!--/s-frag--></div><div><img src="https://oss-v2.yixiaoer.cn/ml/test/t-6821ac8d50bc5fd636fa9801/1780308154321.jpg" width="1170"></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">△5月31日下午6时的索菲亚教堂，图片来源@冰城小编</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">该工作人员称，当地文旅部门统计了各景区的损毁情况，“但索菲亚教堂没给我们上报”。工作人员还告诉记者，目前哈尔滨松花江观光索道都已经关闭，后续营业时间要看天气。</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">附近居民王先生@冰城小编 在社交平台发布了6月1日早上的教堂视频，他表示现场一切正常，有很多游客，但是今天的风还是很大。</p><!--/s-frag--></div><div><img src="https://oss-v2.yixiaoer.cn/ml/test/t-6821ac8d50bc5fd636fa9801/1780308155007.jpg" width="1170"></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">△6月1日早上8时的索菲亚教堂，图片来源@冰城小编</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">位于索菲亚教堂景区内的商家“哈小雪·冻梨酥”告诉记者，今天店铺仍正常营业。</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">据哈尔滨市气象台消息，2026年6月1日1时30分继续发布大风黄色预警信号：未来15小时，全市平均风力4~6级，阵风8~9级，局地10级，大风同时多发分散性阵雨或雷阵雨，局地可能有冰雹，请注意防范。<span data-mce-style="max-width: 100%; text-transform: none;"></span></p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">潇湘晨报·晨视频记者 罗海碧</p><!--/s-frag--></div><div><div><span data-testid="report-btn">举报/反馈</span></div></div></div><p></p>',

      publishTime:0,
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Wangyihao.publishArticle(cookie, taskData, eventCall);
    // assets
    console.log('网易号文章发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取网易号图文状态查询', async () => {
    const result = await Wangyihao.getWangyihaoMediaStatus(cookie, 'JIVTGUB10552ZF94', 'article');
    console.debug(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);
});
