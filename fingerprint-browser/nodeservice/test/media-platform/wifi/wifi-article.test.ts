import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';
import { WiFiHaoArticleTaskInput } from '../../../src/media-platform/wifiwanneng/wifi-article';
import { WiFi } from '../../../src/media-platform/wifiwanneng';

describe.runIf(true)('【真实测试】', () => {
  const cookie = 'JSESSIONID=nodeMedia1nijli3tbwlar2y3nw6m2jsvv.nodeMedia;';
  test('wifi图文发布', async () => {
    const taskData: WiFiHaoArticleTaskInput = {
      taskId: '13123123',
      pubType: 0,
      covers: [
        {
          pathOrUrl: 'I:\\download\\20250213-111807.jpg',
          width: 1920,
          height: 1080,
        },
      ],
      content:
        '<p>彭州，位于成都市西北部，素有“蜀山秀水之地、风景如画之区”的美誉，拥有着众多令人心驰神往的景点和风景。今天，就让我们一起来探索彭州的九大必去景点，感受这片土地的独特魅力。</p><p><img src="https://yixiaoer-image-oss.yixiaoer.cn/20250519/cb6cbf21-6aa9-4ac3-aab9-dea8873c33d0.jpg" img-data="{&quot;format&quot;:&quot;jpeg&quot;,&quot;size&quot;:50123,&quot;width&quot;:640,&quot;height&quot;:397,&quot;space&quot;:&quot;srgb&quot;,&quot;channels&quot;:3,&quot;depth&quot;:&quot;uchar&quot;,&quot;density&quot;:72,&quot;chromaSubsampling&quot;:&quot;4:2:0&quot;,&quot;isProgressive&quot;:false,&quot;hasProfile&quot;:false,&quot;hasAlpha&quot;:false}" contenteditable="false"></p><p>白鹿小镇是一处中法风情的小镇，仿佛置身于欧洲街头。五颜六色的城堡依山而建，法式风情街、中世纪城堡、中法桥……这里的每一处都散发着浓郁的异国风情。游客们可以在这里感受到别样的度假氛围，尽情享受异国风情带来的愉悦。</p><p><img src="https://yixiaoer-image-oss.yixiaoer.cn/20250514/da592d6e-b474-4bd1-8393-e72c5ff1a5a0.jpg" img-data="{&quot;format&quot;:&quot;jpeg&quot;,&quot;size&quot;:47115,&quot;width&quot;:640,&quot;height&quot;:370,&quot;space&quot;:&quot;srgb&quot;,&quot;channels&quot;:3,&quot;depth&quot;:&quot;uchar&quot;,&quot;density&quot;:72,&quot;chromaSubsampling&quot;:&quot;4:2:0&quot;,&quot;isProgressive&quot;:false,&quot;hasProfile&quot;:false,&quot;hasAlpha&quot;:false}" contenteditable="false"></p><p>彭州龙兴寺是一座历史悠久、文化底蕴深厚的佛教寺庙。寺内有亚洲第一高的真身舍利佛塔，高达70米，气势雄伟。游客们可以在这里感受佛教文化的庄严肃穆，领略古刹的神秘与宁静。</p><p><img src="https://yixiaoer-image-oss.yixiaoer.cn/20250512/daac5db2-bc69-4f79-8eb4-060c4834a123.jpg" img-data="{&quot;format&quot;:&quot;jpeg&quot;,&quot;size&quot;:64941,&quot;width&quot;:640,&quot;height&quot;:382,&quot;space&quot;:&quot;srgb&quot;,&quot;channels&quot;:3,&quot;depth&quot;:&quot;uchar&quot;,&quot;density&quot;:72,&quot;chromaSubsampling&quot;:&quot;4:2:0&quot;,&quot;isProgressive&quot;:false,&quot;hasProfile&quot;:false,&quot;hasAlpha&quot;:false}" contenteditable="false"></p><p>鱼凫湿地公园是一处自然生态景观的天堂。草坪、银杏、梧桐、红枫……各种植被交织在一起，构成了一幅绚丽多彩的画卷。在这里，游客们可以尽情欣赏山水之美，划船游湖，享受大自然的清新与宁静。</p>',

      title: '素有“蜀山秀水之地、风景如画之区”的美誉',
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await WiFi.publishArticle(cookie, taskData, eventCall);

    console.log('wifi文章发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('wifi文章删除', async () => {
    const result = await WiFi.deleteWiFiArticleContent(cookie, '6472411894824960');

    console.log('wifi文章删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('wifi文章状态', async () => {
    const result = await WiFi.getWiFiArticleStatus(cookie, '6472411894824960');

    console.log('wifi文章状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('wifi文章分类', async () => {
    const result = await WiFi.getWifiMediaCategory(cookie, PubContentEnum.article);

    console.log('wifi文章分类：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
