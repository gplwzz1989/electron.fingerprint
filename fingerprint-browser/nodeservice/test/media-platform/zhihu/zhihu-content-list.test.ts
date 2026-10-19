import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/zhihu/zhihu-content-list.service';

describe('【Mock】', () => {
  describe('获取知乎内容列表', () => {
    const server = setupServer(
      rest.get('https://www.zhihu.com*/api/v4/creators/creations/v2/all', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              paging: {
                is_end: false,
                is_start: true,
                next: 'https://www.zhihu.com/api/v4/creators/creations/v2/all?end=0&limit=10&need_co_creation=1&offset=10&sort_type=created&start=0',
                previous:
                  'https://www.zhihu.com/api/v4/creators/creations/v2/all?end=0&limit=10&need_co_creation=1&offset=0&sort_type=created&start=0',
                totals: 165,
                totals_real: 165,
              },
              data: [
                {
                  type: 'zvideo',
                  data: {
                    id: '1702778454825607168',
                    url_token: '1702778454825607168',
                    title: '半速集合啦~上车！',
                    excerpt: '半速集合啦~上车！',
                    thumbnail: 'https://pica.zhimg.com/v2-ca8755415389c5bff63b244dc3de05ab_r.jpg?source=117bd250',
                    comment_permission: 'all',
                    duration: 11.632,
                    created_time: 1698754021,
                    updated_time: 1698755272,
                    co_creation: {
                      is_co_creation: false,
                      own: 1,
                    },
                  },
                  status: [],
                  ztags: null,
                  tags: [],
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: null,
                    like_count: 0,
                    collect_count: 0,
                    play_count: 3,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'zvideo',
                  data: {
                    id: '1702766298046586880',
                    url_token: '1702766298046586880',
                    title: '小荷才露尖尖角，夏天，你好~',
                    excerpt: '“小荷才露尖尖角,早有蜻蜓立上头。”多美的意境，表明了夏天的到来。夏秋的风景，一览无遗！',
                    thumbnail: 'https://picx.zhimg.com/v2-b1a4512ce92c920f565f4d271b4bc592_r.jpg?source=117bd250',
                    comment_permission: 'all',
                    duration: 24.055,
                    created_time: 1698751122,
                    updated_time: 1698752600,
                    co_creation: {
                      is_co_creation: false,
                      own: 1,
                    },
                  },
                  status: [],
                  ztags: null,
                  tags: [],
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: null,
                    like_count: 0,
                    collect_count: 0,
                    play_count: 2,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'article',
                  data: {
                    id: '664367922',
                    url_token: '664367922',
                    title: '空气能十大领军品牌空气源热泵助力空气能供暖系统',
                    excerpt:
                      '随着能源危机的不断加深和环保意识的逐步提高,人们对于高效、清洁的供暖方式的需求日益增加。在这种背景下,空气源热泵和空气能供暖作为先进的供暖技术逐渐受到人们的关注和青睐。本文将探讨空气源热泵与空气能供暖之间的关系,从原理、优势、应用等方面进行深入分析。 [图片] 空气源热泵的原理及工作方式 空气源热泵是一种利用空气中的热能进行供暖的技术,其工作原理类似于制冷空调。它通过蒸发-冷凝循环来实现热能的转移。具体来说,空气…',
                    thumbnail: 'https://pica.zhimg.com/v2-1a841e1cb3309c19d72b36f5dc3879e3_r.jpg?source=172ae18b',
                    comment_permission: 'all',
                    copyright_permission: 'need_review',
                    created_time: 1698747540,
                    updated_time: 1698747540,
                    allow_publish_answer: false,
                    is_published_answer: false,
                    published_answer_token: '',
                    answered_question_token: '',
                  },
                  status: [],
                  ztags: [],
                  tags: null,
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: 5,
                    like_count: 0,
                    collect_count: 0,
                    play_count: null,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'zvideo',
                  data: {
                    id: '1701258144460906496',
                    url_token: '1701258144460906496',
                    title: '花园种花（主歌）',
                    excerpt: '在小小的花园里面挖呀挖呀挖~',
                    thumbnail: 'https://pica.zhimg.com/v2-dcb1866c6db45f6c14b3ad7868f2bad0_r.jpg?source=117bd250',
                    comment_permission: 'all',
                    duration: 37.732,
                    created_time: 1698391550,
                    updated_time: 1698391832,
                    co_creation: {
                      is_co_creation: false,
                      own: 1,
                    },
                  },
                  status: [],
                  ztags: null,
                  tags: [],
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: null,
                    like_count: 0,
                    collect_count: 0,
                    play_count: 1,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'zvideo',
                  data: {
                    id: '1701189375608791040',
                    url_token: '1701189375608791040',
                    title: '魔改配音，感觉还是差了点意思，将就下算了喽~',
                    excerpt: '暴躁的小哥哥，吊打无知客户',
                    thumbnail: 'https://picx.zhimg.com/v2-5822370c499bf95bab23a2f477d4d996_r.jpg?source=117bd250',
                    comment_permission: 'all',
                    duration: 38.451,
                    created_time: 1698375154,
                    updated_time: 1698375461,
                    co_creation: {
                      is_co_creation: false,
                      own: 1,
                    },
                  },
                  status: [],
                  ztags: null,
                  tags: [],
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: null,
                    like_count: 0,
                    collect_count: 0,
                    play_count: 0,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'article',
                  data: {
                    id: '663482784',
                    url_token: '663482784',
                    title: '流动在世界各地的新媒体动画电影-彼得与狼',
                    excerpt:
                      '[图片] 谢尔盖·普罗科菲耶夫（Sergei Prokofiev）的新作品《彼得与狼》灵感来自U2乐队Bono的插图。《彼得与狼》是苏联作曲家谢尔盖·普罗科菲耶夫（Sergei Prokofiev）为儿童写的一部交响童话，完成于1936年春，同年5月2日在莫斯科的一次儿童音乐会上首次演出。该作品是普罗柯菲耶夫的代表作品之一。 [图片] 那么《彼得与狼》将在什么时候上映呢？《彼得与狼》将会在10月19日星期四在美国的Max影院上首播。如果你想在世界任意地方都能欣赏《彼…',
                    thumbnail: 'https://picx.zhimg.com/v2-d36d49d7e125457fc82cd77aca58b97f_r.jpg?source=172ae18b',
                    comment_permission: 'all',
                    copyright_permission: 'need_review',
                    created_time: 1698302185,
                    updated_time: 1698302185,
                    allow_publish_answer: true,
                    is_published_answer: false,
                    published_answer_token: '',
                    answered_question_token: '',
                  },
                  status: [],
                  ztags: [],
                  tags: null,
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: 2,
                    like_count: 0,
                    collect_count: 0,
                    play_count: null,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'article',
                  data: {
                    id: '660125164',
                    url_token: '660125164',
                    title: '我用苹果15Pro和ProMax拍了许多精美的照片，一起来欣赏吧！',
                    excerpt:
                      '苹果新款Pro手机对摄像头进行了大量升级。iPhone 15 Pro和15 Pro Max的特点在于它们的精致。这两款手机是苹果多年来最引人注目的摄像头升级之一。与之前的型号一样，15 Pro也有一个久经考验的3倍长焦相机。但15 Pro Max拥有一个新的5倍长焦摄像头，由多个棱镜和一些聪明的工程技术制成。 下面这些照片都是使用iPhone 15 Pro或iPhone 15 Pro Max拍摄的，白天黑夜下的各种场景照片，长短焦距的拍摄照片，甚至还抓拍到了慵懒的猫、…',
                    thumbnail: 'https://pica.zhimg.com/v2-a45627a34b0de8140c66b7791051f414_r.jpg?source=172ae18b',
                    comment_permission: 'all',
                    copyright_permission: 'need_review',
                    created_time: 1696754361,
                    updated_time: 1696754361,
                    allow_publish_answer: true,
                    is_published_answer: false,
                    published_answer_token: '',
                    answered_question_token: '',
                  },
                  status: [],
                  ztags: [],
                  tags: null,
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 1,
                    read_count: 609,
                    like_count: 2,
                    collect_count: 0,
                    play_count: null,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'zvideo',
                  data: {
                    id: '1690116467981402112',
                    url_token: '1690116467981402112',
                    title: '单日再添19金！中国队断层领先亚运奖牌榜',
                    excerpt: '单日再添19金！中国队断层领先亚运奖牌榜',
                    thumbnail: 'https://pic1.zhimg.com/v2-3ea3ec1515fc23664797d3891479bb89_r.jpg?source=117bd250',
                    comment_permission: 'all',
                    duration: 16.787,
                    created_time: 1695735167,
                    updated_time: 1695735312,
                    co_creation: {
                      is_co_creation: false,
                      own: 1,
                    },
                  },
                  status: [],
                  ztags: null,
                  tags: [],
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: null,
                    like_count: 0,
                    collect_count: 0,
                    play_count: 22,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'zvideo',
                  data: {
                    id: '1690113903047262208',
                    url_token: '1690113903047262208',
                    title: '猩球崛起：受尽折磨的老猩猩被凯撒救出，成了他的心腹',
                    excerpt: '猩球崛起：受尽折磨的老猩猩被凯撒救出，成了他的心腹',
                    thumbnail: 'https://pic1.zhimg.com/v2-8372a313dc7e3af9f19f1e8be6297fe8_r.jpg?source=117bd250',
                    comment_permission: 'all',
                    duration: 26.052,
                    created_time: 1695734556,
                    updated_time: 1695734843,
                    co_creation: {
                      is_co_creation: false,
                      own: 1,
                    },
                  },
                  status: [],
                  ztags: null,
                  tags: [],
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: null,
                    like_count: 0,
                    collect_count: 0,
                    play_count: 1,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
                {
                  type: 'article',
                  data: {
                    id: '658577225',
                    url_token: '658577225',
                    title: '分享：我的iPhone 15 Pro Max使用FineWoven手机壳艰难的一周',
                    excerpt:
                      '首先，我很赞赏苹果追求更环保的做法。但是FineWoven案例也有明显的缺点。这一切都始于在一次参观【黄貂鱼】展馆的时候，当时有几滴水溅到我的iPhone 15 Pro Max的FineWoven手机壳上，我像平常一样，轻描淡写的把它擦掉了，而且 我也有意识到这是一个【黄貂鱼】展览，水可能是盐水。所以我去了洗手间，用打湿的纸巾在水滴所在的小地方轻轻擦了擦。。但一个小时后，fine - woven箱子上留下了一个轻微的水印点。现在，一个星期过去…',
                    thumbnail: 'https://picx.zhimg.com/v2-b42b620779e12d549d42ff8cc769e844_r.jpg?source=172ae18b',
                    comment_permission: 'all',
                    copyright_permission: 'need_review',
                    created_time: 1695731811,
                    updated_time: 1695731811,
                    allow_publish_answer: true,
                    is_published_answer: false,
                    published_answer_token: '',
                    answered_question_token: '',
                  },
                  status: [],
                  ztags: [],
                  tags: null,
                  reaction: {
                    comment_count: 0,
                    reviewing_comment_count: 0,
                    vote_up_count: 0,
                    read_count: 496,
                    like_count: 4,
                    collect_count: 0,
                    play_count: null,
                    repin_count: null,
                    reaction_count: null,
                    view_count: null,
                    answer_count: null,
                    follow_count: null,
                  },
                },
              ],
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getContentListAsync('success', 1, 10);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.data).length(10);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取知乎内容列表', async () => {
    const cookie =
      '_zap=06dc3a78-192f-4c2a-bb46-759af275de91; d_c0=AHAWkIgiVBaPTvmafr3ufkZBSjGnrlshzYA=|1676383319; _xsrf=CCiQPKwIFK1ByYUmNluRkw8vSHJQv2Pn; __snaker__id=WGQ5txxQ5yFO1CcX; YD00517437729195%3AWM_TID=V5WbGn4nasFBAABUVAPAnONMBbXYsZdQ; q_c1=5e063e8e2b2d41379bdf6cae1074cfc0|1697590976000|1697590976000; tst=r; SESSIONID=mD1xLEEZQ2rjoyB4ho7Zm62lCU8v59fnJAeMLhDFBkv; JOID=UlAUCk1yiX6j5YhJCnoHLjw3FzMcF8RH1K_FBVglswXBhfcDNystPc_riUgNHAaLRFzikoliKGBx1a4ycwvh0kE=; osd=U1gSCkhzgXij4IlBDHoCLzQxFzYdH8JH0a7NA1ggsg3HhfICPy0tOM7jj0gIHQ6NRFnjmo9iLWF50643cgPn0kQ=; YD00517437729195%3AWM_NI=qrAr8Y1jIGw2F4CINaVr5CrzNhgRJxWvTqmNTBrqBpuWo0moWpGlqU%2FFO9%2BHJXlveVjYXHnQuVKaLtBKa0Ro5JUpyyx0k7wp01j8JXTHOvVV2wf4Ux6lLRqX8d%2BOBuyyYUQ%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eea9d4428287e1a7d64aed928ab3d54f828a8fb0c467fcbca5a4bc72ac8aa9aab32af0fea7c3b92ab3ae8f93bb53f3b687a8f63a86ec8daacd6b96aefba4f1728eb8a9b3c97495aa9c92f046989ebe92c17cb789a1d1f06595b0898df45fed9a81daaa448a88a497e85eaa8798a9ed5bb78a8582cf808295afd1d165f7969b91fc73bcf0a5d8f67cf4efa6d9c95498988197d55ef2a9aad5d874f6b484b3f454fcbce5b0c17fbba797b6d437e2a3; gdxidpyhxdE=k09rrojBJ83XnR1ZvOtx0un1CS8YrhcN0dVw5RiI2K0%5CbtSIgtr7vUT%2BqUYfAd%2F%2BUoIrEpd5tnH5fJclKDLVLfn6fMGQ5wWazWO4ERvuuDrML%5CN9LCWZzXkY2VYYbAYJ5d%5CU5MdQKxje%2BsaKCcRU8pCTJnVX%2F%2FeYb3NZzL%2FYXN7c53t1%3A1699001024235; captcha_session_v2=2|1:0|10:1699000387|18:captcha_session_v2|88:bC9jc3UzZXhwYkwvTXBFR0N0N2EvN25QQk1OUEF0Nmk0WHFTZy9uL0NZd2RvcWQyc2Vtd21sTUNaRlV3dVpYaA==|864d5d083870987ab941afd5dfa0ee6a3e0d431ad894d63b98aa8d201aeeb4ec; captcha_ticket_v2=2|1:0|10:1699000402|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfNWoxNktvRipyU05Ec3k5a2phNnVVbXNYcWd1Q1pkVVpWNDlBZE5NS0oqS3dXamtIQ1hyUkhJMXl2VGdobE5WYUpXRi5FKnEzY3doY2N4elBRZElRS3J6TTUxM3dTWUNYaXFhbGhRa19ITypmMXloRE1oQ2dNR09BWm9EM3hwUmI5RVpiQ0dlKnhaelM4MEJFQ2JsS29KelVjeVdOaWJOOCpMRTVCV1RlejVFbUVrbVdnRkczWFFFSjBMb1NJMEdXNFJLMU42U2tsNS5TNnRLYmUzYTlpVFVhOFlMOExTOGhCUUFxU0FFSGFUOTFHcHpDa0tQdEVfcmxfV3ZNVGNWT0MyNFlrUVVSQ0puSjRsNVA5M0wzcEV3V0xmRG9ianZCVEVELmpzc19DOVguRjlSVmpIX1EwZ05OcWlqQ0lkTUJuWDRlUGdWOUppZUp1TjZnMWgzYWlNVFk5VGtab2sxbzJRQnpkNkZkNU8zZ0l1T0Y1cmtWc3JPSzhCRGdyS01EMVgzV3N0VW0qYXI5enpiMjE2QURyNnFkRUZlS1lIWU5pUzROTGFCNFhFNVJHekRUSFpkUEhrLjFDVzZPSFV6VlFodnppSEVvYk9QQ2JNengwQmxfbmMuemY0QkVCSkt3YzE0S3BlbVN4eVBCSmZWc0RnR3hVOVZrcWJDd1F0T284VnNmV2c3N192X2lfMSJ9|bec81214d3337181ef6dc5a2da3fcf10310500e5ab8e20a716949a38b9ecd377; z_c0=2|1:0|10:1699000403|4:z_c0|92:Mi4xX0p2bkNnQUFBQUFBY0JhUWlDSlVGaVlBQUFCZ0FsVk5VdjR4WmdCRmhPbmo0TVYtSkZJUUp6NV9IbUVySXQ2RHpB|ba3602afa889ac2f4bd1ecbd6a78a7ae646127b3bc6bd36e8f6e11091d61b5e6; SUBMIT_0=c2bb75ee-f665-43ad-be41-d0ace77edc8e; KLBRSID=4efa8d1879cb42f8c5b48fe9f8d37c16|1699001781|1698997591';

    const result = await getContentListAsync(cookie, 0, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.data).length(10);
  }, 10000000);
});
