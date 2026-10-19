import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';
import { CheJiaHaoArticleTaskInput } from '../../../src/media-platform/chejiahao/chejiahao-article';
import { CheJiaHao } from '../../../src/media-platform/chejiahao';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'fvlid=1758539303005b9xOTSr0rE; sessionid=648B7903-A992-4C15-8E25-B6F3128135D1%7C%7C2025-09-22+19%3A08%3A23.916%7C%7C0; autoid=9e4fc93851ee8777963de02788f47af6; sessionuid=648B7903-A992-4C15-8E25-B6F3128135D1%7C%7C2025-09-22+19%3A08%3A23.916%7C%7C0; __utma=1.229693888.1758539303.1758539303.1758539303.1; __utmc=1; __utmz=1.1758539303.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); pcpopclub=a73c022ab1cc47c2975edde86bd8bfd711ba6639; clubUserShow=297428537|0|2|%e8%8f%8f%e6%b3%bd%e8%bd%a6%e5%8f%8b8156680|0|0|0|/g30/M05/0C/14/120X120_0_q87_autohomecar__CjIFU2T-zjSAT0j4AADhlxjmRi0808.png|2025-09-22 19:08:51|0; sessionlogin=a73c022ab1cc47c2975edde86bd8bfd711ba6639; autouserid=297428537; __ah_uuid_ng=u_297428537; _ac=PDy51i6fprF99WcAROdUzTJcdDRlDr52qPNasqFrnng42yoXYcS6; sessionip=171.88.65.225; area=510116; tfstk=gwssjUcU8fc6HMyTMfyEdN_Fa4-baJrPBx9AEtnZHhK9MmBfUNkNHPmvH6C9_FyGHI1fTBSwuhpVc6_VvVjDkdQBctBxgs60IKdAMsOV7yrPIOxDD77b4uWipA2ZDGtxg9KM358djtEPIODKCjePJurbe0fvMICvWvHpeBhxWsdtvJ9v3fdv6sBLdBvDBIptXvEpQKJvDnCApJ9D9IKvWsBLdKApMbZoFKa6sOwxfz4q94_PBBixDMED5Q6tumnAAdT1DOdC5NsBCFOylrtRPGCFHGSM-y3Bm975GZC8TVROPL1BzNNSf_1MHt9A1uDW9G6fAFbEU06BlC_dXeMxD9WpMU7f15gM6N5BrpLKhuvFaBBGXwwm9OCy1hpp8ue5pEQFjUja9ctRrO-Nk_FE7CQWHg5I4Q9TeqMBrmpBaJwIoq2_s-4ngFOK8FpHCeyQdfQDWpvBaJwIoqY9Kd9zdJGOo; sessionvid=2BE5656E-3FE3-4544-A52A-BF38773771BE; cookieCityId=510100; ahpvno=16; v_no=13; visit_info_ad=648B7903-A992-4C15-8E25-B6F3128135D1||2BE5656E-3FE3-4544-A52A-BF38773771BE||-1||-1||13; ref=0%7C0%7C0%7C0%7C2026-03-20+13%3A52%3A10.688%7C2025-09-22+19%3A08%3A23.916';
  test('车家号文章发布', async () => {
    const taskData: CheJiaHaoArticleTaskInput = {
      taskId: '13123123',
      pubType: 1,
      content:
        '<p style="text-align: left">外媒PC Gamer发布了《如龙：极3》和《如龙3外传》的试玩报告，简单介绍如下。</p><p style="text-align: left">《如龙：极3》延续前两作《如龙：极》和《如龙：极2》的传统：精心打磨原有框架，加入精彩的支线与小游戏，即使是玩过2009年原版的玩家也能有焕然一新的体验。合集中的《如龙3外传》则以峰义孝为主角，带来他的全新剧情故事。</p><p style="text-align: left"></p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1NgAbB.img?w=550&amp;h=234&amp;m=6&amp;x=70&amp;y=63&amp;s=419&amp;d=103" alt="游民星空" title="游民星空"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">游民星空</span></p><p style="text-align: left">桐生拥有两种战斗风格。其一是熟悉的"堂岛之龙"，以刚猛拳脚将混混们打成渣渣，配合各种血腥必杀技，显然在动作设计上玩得尽兴。其二新增"琉球风格"，攻防一体如持剑盾，灵感源自真实冲绳武术，比默认风格更侧重防守与连击，面对群殴时尤为爽快，总能在敌人出手前完成精准刺击。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1Ngy7A.img?w=550&amp;h=310&amp;m=6" alt="游民星空" title="游民星空"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">游民星空</span></p><p style="text-align: left">《如龙3外传》中的峰义孝仅有一种战斗风格（至少在25分钟试玩中是这样），但他的攻势比桐生任何一种风格都要猛，核心机制是通过击打积累"束缚之心"。攒满心槽后触发暗觉醒状态，心槽越多效果越强。此时攻击会变得野兽般癫狂，BGM也会切换成狂野摇滚。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1NgF4w.img?w=550&amp;h=306&amp;m=6" alt="游民星空" title="游民星空"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">游民星空</span></p><p style="text-align: left">新的支线故事同样精彩：有桐生劝解两位跳桥者（互相不认同，恰好选了同样的桥）后替天行道的故事，荒诞又暖心；也有父亲委托劝阻女儿去东京的改编任务，以桐生的经典走心告白收场。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1NgReQ.img?w=550&amp;h=309&amp;m=6&amp;x=329&amp;y=104&amp;s=109&amp;d=109" alt="游民星空" title="游民星空"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">游民星空</span></p><p style="text-align: left">至于《如龙3外传》，峰义孝虽然也能体验卡拉OK等常规内容，但在神室町未触发任何支线，不过也可能是试玩时间太短而没能体验。不过他在东京的互动似乎确实少于桐生。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1NgvE6.img?w=550&amp;h=309&amp;m=6" alt="游民星空" title="游民星空"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">游民星空</span></p>',
      isOriginal: 1,
      title: '素有“蜀山秀水之地、风景如画之区”的美誉2',
      covers:[{pathOrUrl:'I:\\download\\cb6cbf21-6aa9-4ac3-aab9-dea8873c33d0.jpg',width:1080,height:1251}],
      verticalCover:{pathOrUrl:'I:\\download\\cb6cbf21-6aa9-4ac3-aab9-dea8873c33d0.jpg',width:1080,height:1251},
      //publishTime: new Date('2026-3-16').getTime(),
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await CheJiaHao.publishArticle(cookie, taskData, eventCall);

    console.log('车家号文章发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('车家号文章删除', async () => {
    const result = await CheJiaHao.deleteCheJiaHaoContent(cookie, '11711880', PubContentEnum.article);

    console.log('车家号文章删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('车家号文章状态', async () => {
    const result = await CheJiaHao.getCheJiaHaoMediaStatus(cookie, '11711880');

    console.log('车家号文章状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
