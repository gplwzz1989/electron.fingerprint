import { describe, expect, test } from 'vitest';

import { EventEmitter } from 'events';
import { Souhuhao, SouhuhaoArticleTaskInput } from '../../../src';
import { getSouhuhaoTopicAsync } from '../../../src/media-platform/souhuhao/souhuhao-topic.service';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'SUV=17887659006264l4udw; clt=1788765900; cld=20260907152500; reqtype=pc; gidinf=x099980109ee1d198d22f1c360007b8aeb19cb832f48; _dfp=0pHVUM7tXXZyR+Hssteb7q2s5g7gDvP40R8KhQaCgHA=; jv=abafbe8ea8f6972a437423c50ee241e7-t2TzEq2U1788766026785; ppinf=2|1788766027|1789975627|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTYyMjc4MDQ1NjAyMzk0OTMxMkBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNi0wOS0wN3xlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Njptb2JpbGV8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzNzYxOTZjMjFjYjgwNzFjfHVpZDoxNjpzNzYxOTZjMjFjYjgwNzFjfHVuaXFuYW1lOjA6fA; pprdig=4nV3yNUnwXSIzQEm5r-Wm4UVWPaOkj_vQUHYF8sWQGPY37F1tXMx4ggz4HEmvRd8g5ihNOrp5leJ6CsP5nCBBx6RAUdyLDEk1qwZEr0vnW0gjsCvxNLoRMhz4jPl_iC9TRz3kQIRH9Pnloy39DJy3Fo5EgqTVO3Cqr_RlkEOWVA; ppmdig=1788766027000000bb4f123b7f80ef1e5260689a4145e2d4; mp-cv=100-1788766026971-db1c7f6432514ab3868e7663f7f28a42; mpCreatorId=%7B%22id%22%3A122928210%2C%22status%22%3A1%7D; tgw_l7_route=a614ee340c42f0cf510d055c19dc2294; t=1788767891903';
  test('搜狐号图文发布', async () => {
    const taskData: SouhuhaoArticleTaskInput = {
      taskId: '',
      pubType: 0,
      title: '天气越来越冷怎么办',
      covers: [
        {
          width: 800,
          height: 769,
          size: 59674,
          pathOrUrl: 'I:\\download\\ChatGPT Image 2026年8月16日 16_19_46.png',
        },
      ],

      content:
        '<p><strong>本文由小黑盒作者@毒舌说电竞于10月28日发布，转载请标明出处！】</strong></p><p>HLE 1-3 不敌GEN，止步八强无缘前四。这也是Zeus选手职业生涯第一次打不进世界赛的前二，当然今年的Zues是HLE.Zeus。只能说Zeus离开T1之后是两败俱伤，如果Zeus不走的话，感觉T1是能跟现在的GNEG碰一碰的。</p><p><br/></p><p><br/></p><p><img src="I:\\download\\ChatGPT Image 2026年8月16日 16_19_46.png" img-data="{&quot;format&quot;:&quot;jpeg&quot;,&quot;size&quot;:41018,&quot;width&quot;:768,&quot;height&quot;:418,&quot;space&quot;:&quot;srgb&quot;,&quot;channels&quot;:3,&quot;depth&quot;:&quot;uchar&quot;,&quot;density&quot;:72,&quot;chromaSubsampling&quot;:&quot;4:2:0&quot;,&quot;isProgressive&quot;:false,&quot;hasProfile&quot;:false,&quot;hasAlpha&quot;:false}" contenteditable="false"/></p><p><br/></p><p><br/></p><p>HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！</p><p>以ZOFGK这五个人的默契程度，我甚至会觉得T1的胜算更多一点大家怎么评价Zeus加盟HLE的这一年？是算成功还是失败？</p><p>然后有网友说：lck的队伍，没有说太过于英雄主义的选手，纪律性给他们带来的团队意识，导致磨合成型的队伍黏性够强，lck的这些冠军队伍，MVP应该给到每一个人，大家都是从绿叶开始，只是在那一年的决赛Zeus开花了，实际上那一年skt承受的压力最多的不是上路，反而帮助最多的是上路，离开skt，需要自己挑大梁了，才发现自己好像不太具备当绝对大哥的潜质。</p><p><br/></p><p><br/></p><p><img src="I:\\download\\ChatGPT Image 2026年8月16日 16_19_46.png" img-data="{&quot;format&quot;:&quot;jpeg&quot;,&quot;size&quot;:30178,&quot;width&quot;:768,&quot;height&quot;:419,&quot;space&quot;:&quot;srgb&quot;,&quot;channels&quot;:3,&quot;depth&quot;:&quot;uchar&quot;,&quot;density&quot;:72,&quot;chromaSubsampling&quot;:&quot;4:2:0&quot;,&quot;isProgressive&quot;:false,&quot;hasProfile&quot;:false,&quot;hasAlpha&quot;:false}" contenteditable="false"/></p><p><br/></p><p><br/></p><p>HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！</p><p>还有网友说：Zeus不走也打不过现在的三星，就今天这个状态来看，Ruler打Faker特来劲，Chovy抓Faker特有感觉，今天Chovry的表现无解，Guma和小k出也打不过Ruler，viper还是带着拖油瓶辅助爆c都赢不了，要是互换一下位置不敢想Guma会被杀成什么样，三叔不发病刷刷野就能赢，HLE有Viper还能挣扎一下，T1全靠Faker带飞，而且现在Faker打Chovy已经力不从心。</p><p><br/></p><p><br/></p><p><img src="I:\\download\\ChatGPT Image 2026年8月16日 16_19_46.png" img-data="{&quot;format&quot;:&quot;jpeg&quot;,&quot;size&quot;:35702,&quot;width&quot;:768,&quot;height&quot;:368,&quot;space&quot;:&quot;srgb&quot;,&quot;channels&quot;:3,&quot;depth&quot;:&quot;uchar&quot;,&quot;density&quot;:72,&quot;chromaSubsampling&quot;:&quot;4:2:0&quot;,&quot;isProgressive&quot;:false,&quot;hasProfile&quot;:false,&quot;hasAlpha&quot;:false}" contenteditable="false"/></p><p><br/></p><p><br/></p>',
      desc: '我是文章摘要啊',

      publishTime: 0,
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Souhuhao.publishArticle(cookie, taskData, eventCall);
    // assets
    console.log('搜狐号文章发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取搜狐号视频话题列表', async () => {
    const result = await getSouhuhaoTopicAsync(cookie, 121349544, '短句');
    console.debug(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);

  test('获取搜狐号图文状态查询', async () => {
    const userinfo = await Souhuhao.getSouhuhaoUserInfo(cookie);
    const result = await Souhuhao.getSouhuhaoArticleStatus(
      cookie,
      userinfo.data.data[0].accountInfos[0].id,
      '833929661',
    );
    console.debug(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);
});
