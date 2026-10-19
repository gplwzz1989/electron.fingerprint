import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/xueqiuhao/xueqiuhao-content-list.service';

describe('【Mock】', () => {
  describe('获取雪球号内容列表', () => {
    const server = setupServer(
      rest.get('https://mp.xueqiu.com*/xq/query/v1/search/long', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              count: 27,
              list: [
                {
                  category_name: '',
                  cover_pic: 'https://xqimg.imedao.com/18b6ab4621faaee63fc50a28.jpeg',
                  created_at: 1698302290000,
                  description:
                    '谢尔盖·普罗科菲耶夫（Sergei Prokofiev）的新作品《彼得与狼》灵感来自U2乐队Bono的插图。《彼得与狼》是苏联作曲家谢尔盖·普罗科菲耶夫（Sergei Prokofiev）为儿童写的一部交响童话，完成于1936年春，同年5月2日在莫斯科的一次儿童音乐会上首次演出。该作品是普罗柯菲耶夫的代表作品之一。<br/...',
                  fav_count: 0,
                  first_img: 'https://xqimg.imedao.com/18b6ab27839d67163fe667dd.jpg',
                  id: 264596467,
                  is_private: false,
                  legal_user_visible: false,
                  like_count: 0,
                  mark: 0,
                  reply_count: 0,
                  retweet_count: 0,
                  status_tag: '[]',
                  text: '<p><img src="https://xqimg.imedao.com/18b6ab27839d67163fe667dd.jpg" class="ke_img" /></p><p>谢尔盖·普罗科菲耶夫（Sergei Prokofiev）的新作品《彼得与狼》灵感来自U2乐队Bono的插图。《彼得与狼》是苏联作曲家谢尔盖·普罗科菲耶夫（Sergei Prokofiev）为儿童写的一部交响童话，完成于1936年春，同年5月2日在莫斯科的一次儿童音乐会上首次演出。该作品是普罗柯菲耶夫的代表作品之一。</p><p><img src="https://xqimg.imedao.com/18b6ab2805faaecd3fdc7aa0.jpg" class="ke_img" /></p><p>那么《彼得与狼》将在什么时候上映呢？《彼得与狼》将会在10月19日星期四在美国的Max影院上首播。如果你想在世界任意地方都能欣赏《彼得与狼》这部电影的话，你可以使用VPN，或虚拟专用网络。VPN可以改变你手机、平板电脑或笔记本电脑上的位置来观看电影。</p><p><img src="https://xqimg.imedao.com/18b6ab2879e757d63fe79825.jpg" class="ke_img" /></p><p>这部由谢尔盖·普罗科菲耶夫（Sergei Prokofiev）创作的备受喜爱的交响曲的新版本，以爱尔兰摇滚乐队主唱Bono的原创插图为基础，由80年代乐队《The Virgin Prunes》的主唱Gavin Friday担任音乐和旁白。</p><p><img src="https://xqimg.imedao.com/18b6ab290a1757d73fd1990c.jpg" class="ke_img" /></p><p>《彼得与狼》这部短片关于一个小男孩抓住一只狼的故事重新想象成一部关于失落和悲伤的作品，而《彼得与狼》则大致取材于波诺在20世纪70年代都柏林朋克舞台上的年轻岁月。20年前，这个项目最初是作为爱尔兰临终关怀基金会的一本书开始的，现在这个项目以动画的形式被赋予了生命。</p><p><img src="https://xqimg.imedao.com/18b6ab2b596757d83fd06985.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab2bdae9e6273fd24df0.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab2c8489e6283fd548f1.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab2cf5c757da3fe7b64c.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab2d7abd671a3fe24ea0.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab2e0da79d843fd9f033.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab304d09e62b3fe356d6.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab3291d79d853fe3862f.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab330d0757de3fec410d.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab35355d671c3fd13a05.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab35a1179d873f8a062b.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab360ac8fa163fea76a5.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab3671aaaedd3fe5a54a.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab36d59aaede3fc6202f.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab373aa757e43fe6b69e.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab37a5ad671e3fd6f9ef.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab380e49e6303febedb3.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab3a567aaee13fd4f707.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab3ad0b79d893fdc4f62.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab3b44a8fa183fe46b35.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab3bbf88fa193fd83c7a.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab3fd21757e73fda55e8.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab404ab757e83fe46aef.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab40c82aaee43feac1f0.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab44d4079d8a3fe98d44.jpg" class="ke_img" /><img src="https://xqimg.imedao.com/18b6ab453ac8fa1d3fec1235.jpg" class="ke_img" /></p><p><img src="https://xqimg.imedao.com/18b6ab45aaf9e6363fd3c397.jpg" class="ke_img" /></p>',
                  title: '流动在世界各地的新媒体动画电影-彼得与狼',
                  type: 'success',
                  user_id: 1494913091,
                  view_count: 1664,
                },
              ],
              maxPage: 27,
              page: 1,
              query_id: 1722427814986579968,
              recommend_cards: [],
              size: 1,
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getContentListAsync('success', 1, 10, '', 0, 0);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取雪球号内容列表', async () => {
    const cookie =
      'device_id=657672e32e5496b7c85150f7877f492c; cookiesu=851699425356647; s=aj19skjk8k; u=1494913091; remember=1; xq_a_token=357e6c99afc523727e54f0d6f1baf7ed5e6108cb; xqat=357e6c99afc523727e54f0d6f1baf7ed5e6108cb; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjE0OTQ5MTMwOTEsImlzcyI6InVjIiwiZXhwIjoxNzAxMzM4MjkwLCJjdG0iOjE2OTk0OTMwNTUyMDUsImNpZCI6ImQ5ZDBuNEFadXAifQ.e53tUnoEh3LrROm0x9Qk8lCRzst2gOtcMTP5fBTVXrqKi2B0eQ-0AqWCRc__ldlA7G35FT93HIpLmrqG4FEoorG4OwZAb1L-cRQ7vmRKtY4WbYUdOokUMImOi3MlpK8Sp0GoZ0S3wg0qViHisZREEIv1_36jz8JePymvFJEzAQJujayP__cZRH1dD-nhRoMIzrHqVDDIkxvyvKcBNI_0grMTHyB152GcR_saGvilGg6G_18kxGn2t0QA5yCJA7DyfrSmab9BKreh5KXRYuezZnDCCwq8h2tL4QpmR-vFLPaadopKqD1-IjBh2aKM1HQyPfLuq5jvcbdLViMRnKJ1jg; xq_r_token=8295e83a981bf45083ca5803ee33ec477e858ea1; xq_is_login=1; u=1494913091; aliyungf_tc=a70eff0562c50dc2fed26e8f74f8303147223d84b80cc43b7a1501937decbeb8; acw_tc=ac11000116994930669193802ec1f34204f90dcdd40bb8e321345899802296';

    const result = await getContentListAsync(cookie, 1, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.list).length(10);
  }, 10000000);
});
