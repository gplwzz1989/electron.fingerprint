import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { KuaiChuanHaoArticleTaskInput } from '../../../src/media-platform/kuaichuanhao/kuaichuanhao-article';
import { KuaiChuanHao } from '../../../src/media-platform/kuaichuanhao/kuaichuanhao';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    '__guid=66415028.4308015022387083000.1761189209892.347; PHPSESSID=134cg6uu5ok9vvfckqj1e8ooq3; __quc_silent__=1; Q=u%3D360H3337809944%26n%3D%25ON%25R7%25O2%25PN%25OP%25RP%25O2%25R2_633%26le%3D%26m%3DZGx5WGWOWGWOWGWOWGWOWGWOZQxk%26qid%3D3337809944%26im%3D1_t0186fb85ff8a58f18b%26src%3Dpcw_so%26t%3D1; __NS_Q=u%3D360H3337809944%26n%3D%25ON%25R7%25O2%25PN%25OP%25RP%25O2%25R2_633%26le%3D%26m%3DZGx5WGWOWGWOWGWOWGWOWGWOZQxk%26qid%3D3337809944%26im%3D1_t0186fb85ff8a58f18b%26src%3Dpcw_so%26t%3D1; T=s%3D55f4f1e20e9d3d934c03f3f8d52e4e6b%26t%3D1761189258%26lm%3D0-1%26lf%3D2%26sk%3D972411d555d6a97c88b1b2bdcfef81b5%26mt%3D1761189258%26rc%3D%26v%3D2.0%26a%3D1; __NS_T=s%3D55f4f1e20e9d3d934c03f3f8d52e4e6b%26t%3D1761189258%26lm%3D0-1%26lf%3D2%26sk%3D972411d555d6a97c88b1b2bdcfef81b5%26mt%3D1761189258%26rc%3D%26v%3D2.0%26a%3D1; test_cookie_enable=null; __DC_monitor_count=2; __DC_gid=66415028.63936342.1761189211073.1761189377646.12';
  test('快传图文发布', async () => {
    const taskData: KuaiChuanHaoArticleTaskInput = {
      taskId: '13123123',
      pubType: 0,
      content:
        '<p>我是内容啊</p><img src="I:\\download\\dd1075f8-e061-41d3-a4fe-fc55a1f02d13 (1).png"></img><p>我是结尾</p>',
      covers: [
        {
          pathOrUrl: 'I:\\download\\dd1075f8-e061-41d3-a4fe-fc55a1f02d13 (1).png',
          width: 1920,
          height: 1080,
        },
      ],
      title: '我是标题哦',
      publishTime: 0, //new Date('2025-7-2').getTime(),
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await KuaiChuanHao.publishArticle(cookie, taskData, eventCall);

    console.log('快传号视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('快传号删除', async () => {
    const result = await KuaiChuanHao.deleteKuaiChuanArticleContent(cookie, '5227261');

    console.log('快传号删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('快传号状态', async () => {
    const result = await KuaiChuanHao.getKuaiChuanArticleStatus(cookie, '5203043');

    console.log('快传号状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
