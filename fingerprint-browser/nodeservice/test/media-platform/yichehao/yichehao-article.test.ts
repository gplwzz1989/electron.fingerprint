import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { YiCheHaoArticleData } from '../../../src/media-platform/yichehao/yichehao-article';
import { YiCheHao } from '../../../src/media-platform/yichehao';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';
import { searchYichehaoTopic } from '../../../src/media-platform/yichehao/yichehao-topic.service';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'CIGUID=92b1eea5-7a54-49ea-9ad6-d399712b438c; auto_id=c72a717c44b438d9a2347164625c9df6; HMACCOUNT=E4EB07134388DAAE; Hm_lvt_610fee5a506c80c9e1a46aa9a2de2e44=1773824192; Hm_lpvt_610fee5a506c80c9e1a46aa9a2de2e44=1773824192; .ASPXAUTH=EDEDFF3F5E71F41B1476EA43D2DF504AF368E122509438294D7DE2F96BF2FB9F2FC6007A6C3F2B71C3731A2BF5CFA51C08005E5C7DD4B86379F6DED99E5EBE960BF6F2ABB62819C0D526BF605DED0BEE1081500DB183CA3EC09436B15332BFA5F0EE09833BBA2720B47CC83BB579395659F2E9409CAFBF8C229FA9E9C88535B96D8071207C834F34E665EC3AB5D5427B9FB6EFA4AAFFF6A16EF5BEA050A20C182527BDE034ED837FC16CEB1EBBDDFC680D6AB192; userid=269295647; username=%E4%BC%98%E7%A7%80%E7%9A%84%E8%8A%B1%E6%A4%92%E6%A0%911312; UserGuid=bcdb3954-d478-4e88-a1dd-86044f37c525';
  test('易车图文发布', async () => {
    const taskData: YiCheHaoArticleData = {
      taskId: '13123123',
      pubType: 1,
      content:
        'content=<p style="text-align: left">近日，玩家在《战地6》开放测试版中反映，游戏中的击杀时间（TTD）异常快速，导致很多玩家在敌人瞄准的瞬间即被击倒。对此，首席游戏设计师Florian Le Bihan作出回应，表示将积极修复相关问题。</p><p style="text-align: left"></p><div style=""></div><p></p><p style="text-align: left"><span style="color: rgb(36, 36, 36)">不是错觉？《战地6》开发者回应玩家死太快：正在查</span></p><p style="text-align: left"></p><p style="text-align: left">Le Bihan在推特上发布了一段视频，展示了自己在前往EA Dice办公室查看测试版反馈的过程，并配文称自己正在处理“超级子弹”或“异常快速击倒时间”的问题。他还邀请玩家们提供相关的视频片段，帮助团队进一步确认和修复问题。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1Klk19.img?w=585&amp;h=658&amp;m=6" alt="不是错觉？《战地6》开发者回应玩家死太快：正在查" title="不是错觉？《战地6》开发者回应玩家死太快：正在查"></div><p></p><p style="text-align: left"><span style="color: rgb(36, 36, 36)">不是错觉？《战地6》开发者回应玩家死太快：正在查</span></p><p style="text-align: left"></p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1KlyPd.img?w=593&amp;h=397&amp;m=6" alt="不是错觉？《战地6》开发者回应玩家死太快：正在查" title="不是错觉？《战地6》开发者回应玩家死太快：正在查"></div><p></p><p style="text-align: left"><span style="color: rgb(36, 36, 36)">不是错觉？《战地6》开发者回应玩家死太快：正在查</span></p><p style="text-align: left"></p><p style="text-align: left">多个玩家对游戏中的问题进行了反馈。一名Twitch合作伙伴表示，尽管游戏提示自己被多次击中，但他们实际上只看到自己倒下的动画，未能看到击中的视觉效果。还有玩家认为游戏中伤害信息存在延迟，表示自己在与敌人交火时，伤害并未及时显示，导致无法反应就被击倒。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1Klwu8.img?w=600&amp;h=649&amp;m=6" alt="不是错觉？《战地6》开发者回应玩家死太快：正在查" title="不是错觉？《战地6》开发者回应玩家死太快：正在查"></div><p></p>',
      covers: [
        {
          pathOrUrl: 'I:\\download\\20250213-111807.jpg',
          width: 1920,
          height: 1080,
        },
      ],
      title: '来自MSN的正常Url图片',
      prePubTime: 0,
      statementType: 1,
      verticalCover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      },
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await YiCheHao.publishArticle(taskData, cookie, eventCall);

    console.log('易车号文章发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('易车号删除', async () => {
    const result = await YiCheHao.deleteYiCheHaoContent(cookie, '482525', PubContentEnum.article);

    console.log('易车号删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('易车号文章状态', async () => {
    const result = await YiCheHao.getYiCheHaoArticleStatus(cookie, '482525');

    console.log('易车号文章状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
  //

  test('易车号话题', async () => {
    const result = await searchYichehaoTopic(cookie, '小');

    console.log('易车号话题：', JSON.stringify(result, null, 2));
    expect(result.status).toBe('1');
  }, 10000000);
});
