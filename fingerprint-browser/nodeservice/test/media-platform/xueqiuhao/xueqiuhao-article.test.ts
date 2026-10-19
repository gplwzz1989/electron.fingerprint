import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { XueQiuHaoArticleTaskInput } from '../../../src/media-platform/xueqiuhao/xueqiuhao-article';
import { Xueqiuhao } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'cookiesu=121754965317896; Hm_lvt_1db88642e346389874251b5a1eded6e3=1754965320; device_id=5e99163cc23c685ef5509673f349e340; remember=1; xq_a_token=051c15eb02683477d1dc40b9c409ffa9f647c4f9; xqat=051c15eb02683477d1dc40b9c409ffa9f647c4f9; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjY3ODE1NTA4MjYsImlzcyI6InVjIiwiZXhwIjoxNzU3MjI0MzMzLCJjdG0iOjE3NTQ5NjUzNDczNjUsImNpZCI6ImQ5ZDBuNEFadXAifQ.HlY1uw1Q04qvN_nbMvQaOqeUrfw1ZOMRgq4gp_XNpql3sCDsl1nAZZWS81Dj7d6LvSG71-2jiGvheVd8nPC7-ln2nj68pyHCJev8BTnRTIVKhzlFxq6hXKET_MKYQJoEUM04VK2GjVCinhdQMGZuQaXiSB4RnXeX969Y0jYQskA_fFJ0eeD2b6abel0tYXVOJlaLZBmJDbAuO4J8lpJxBxKEDe2_wKEGUD52jtIFkuzlctgKYd8QeE3qi4OfZqC-oZ-nmgLvzOaSq4VJts3F5GHoTo0i5HUM-nyXEuYyVSJXAWl887ZKb3bMc9nseOjRn3QwNQe1bublRvCBjtKJ5Q; xq_r_token=1b821ad171cfd4504884a36497b9cdcfb95e3002; xq_is_login=1; u=6781550826; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1754965320; HMACCOUNT=DD9697019810421A';
  test('雪球图文发布', async () => {
    const taskData: XueQiuHaoArticleTaskInput = {
      taskId: '13123123',
      pubType: 0,
      content:
        'content=<p style="text-align: left">近日，玩家在《战地6》开放测试版中反映，游戏中的击杀时间（TTD）异常快速，导致很多玩家在敌人瞄准的瞬间即被击倒。对此，首席游戏设计师Florian Le Bihan作出回应，表示将积极修复相关问题。</p><p style="text-align: left"></p><div style=""></div><p></p><p style="text-align: left"><span style="color: rgb(36, 36, 36)">不是错觉？《战地6》开发者回应玩家死太快：正在查</span></p><p style="text-align: left"></p><p style="text-align: left">Le Bihan在推特上发布了一段视频，展示了自己在前往EA Dice办公室查看测试版反馈的过程，并配文称自己正在处理“超级子弹”或“异常快速击倒时间”的问题。他还邀请玩家们提供相关的视频片段，帮助团队进一步确认和修复问题。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1Klk19.img?w=585&amp;h=658&amp;m=6" alt="不是错觉？《战地6》开发者回应玩家死太快：正在查" title="不是错觉？《战地6》开发者回应玩家死太快：正在查"></div><p></p><p style="text-align: left"><span style="color: rgb(36, 36, 36)">不是错觉？《战地6》开发者回应玩家死太快：正在查</span></p><p style="text-align: left"></p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1KlyPd.img?w=593&amp;h=397&amp;m=6" alt="不是错觉？《战地6》开发者回应玩家死太快：正在查" title="不是错觉？《战地6》开发者回应玩家死太快：正在查"></div><p></p><p style="text-align: left"><span style="color: rgb(36, 36, 36)">不是错觉？《战地6》开发者回应玩家死太快：正在查</span></p><p style="text-align: left"></p><p style="text-align: left">多个玩家对游戏中的问题进行了反馈。一名Twitch合作伙伴表示，尽管游戏提示自己被多次击中，但他们实际上只看到自己倒下的动画，未能看到击中的视觉效果。还有玩家认为游戏中伤害信息存在延迟，表示自己在与敌人交火时，伤害并未及时显示，导致无法反应就被击倒。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1Klwu8.img?w=600&amp;h=649&amp;m=6" alt="不是错觉？《战地6》开发者回应玩家死太快：正在查" title="不是错觉？《战地6》开发者回应玩家死太快：正在查"></div><p></p>',
      covers: [
        {
          pathOrUrl: 'I:\\download\\20250213-111807.jpg',
          width: 1920,
          height: 1080,
        },
      ],
      title: '我是标题哦',
      is_private: false,
      publishTime: 0, //new Date('2025-7-2').getTime(),
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Xueqiuhao.publishArticle(cookie, taskData, eventCall);

    console.log('雪球号视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('雪球号删除', async () => {
    const result = await Xueqiuhao.deleteXueQiuArticleContent(cookie, '26802027', true);

    console.log('雪球号删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('雪球号状态', async () => {
    const result = await Xueqiuhao.getXueQiuArticleStatus(cookie, '340834726');

    console.log('雪球号状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
