import { describe, expect, test } from 'vitest';
import { Bilibili } from '../../../src/media-platform/bilibili';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { BilibiliArticleTaskInput } from '../../../src/media-platform/bilibili/bilibili-article';
import { AccountService, Cloud, Platforms } from '../../../src';
import { Task } from '../../../src/utils';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe.runIf(false)('【获取B站分类列表】', () => {
  test('获取B站分类列表', async () => {
    const cookie = getCookie();
    const result = await Bilibili.getBilibiliArticleCategory(cookie);
    console.log('获取B站分类列表：', JSON.stringify(result.data?.categories, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【B站图文发布】', () => {
  test('B站图文发布', async () => {
    const cookie = getCookie();

    const taskData: BilibiliArticleTaskInput = {
      pubType: 1,
      taskId: '1717809227264909312',
      covers: [
        {
          pathOrUrl: 'https://yixiaoer-image-oss.yixiaoer.cn/20250702/32be9be4-b443-451f-bd45-f4dda4dcfa15.jpg',
        },
        {
          pathOrUrl: 'https://yixiaoer-image-oss.yixiaoer.cn/20250702/0dd572d2-004a-42d1-bfdc-9ce4b7716027.jpg',
        },
        {
          pathOrUrl: 'https://yixiaoer-image-oss.yixiaoer.cn/20250702/8d34d4e7-7488-47dd-879e-37bc158fd05e.jpg',
        },
      ],

      // 标题
      title: '带着三岁孩子的宝妈，一年做了1.3个小目标',

      // 描述

      firstCategoryId: 0,
      // 分类id，
      secondCategoryId: 18,

      //标签
      tags: ['创业'],

      //内容
      content:
        '<p><img src="https://yixiaoer-image-oss.yixiaoer.cn/20250702/8d34d4e7-7488-47dd-879e-37bc158fd05e.jpg" img-data="{&quot;format&quot;:&quot;jpeg&quot;,&quot;size&quot;:50846,&quot;width&quot;:1200,&quot;height&quot;:675,&quot;space&quot;:&quot;srgb&quot;,&quot;channels&quot;:3,&quot;depth&quot;:&quot;uchar&quot;,&quot;density&quot;:72,&quot;chromaSubsampling&quot;:&quot;4:2:0&quot;,&quot;isProgressive&quot;:false,&quot;hasProfile&quot;:false,&quot;hasAlpha&quot;:false}"><br></p><p style="text-indent:2em">索尼似乎痴迷于如何将PlayStation 5体验扩展到电视之外。今年早些时候，我回顾了PlayStation VR 2，这是一款可以玩PS5游戏的沉浸式系留耳机。PlayStation Portal本周售价200美元，是一个不那么激进、更实惠的提议。把你的PS5带到家里的另一个房间，但以手持流媒体的形式。<br><img src="https://yixiaoer-image-oss.yixiaoer.cn/20250702/0dd572d2-004a-42d1-bfdc-9ce4b7716027.jpg" img-data="{&quot;format&quot;:&quot;jpeg&quot;,&quot;size&quot;:66672,&quot;width&quot;:1200,&quot;height&quot;:675,&quot;space&quot;:&quot;srgb&quot;,&quot;channels&quot;:3,&quot;depth&quot;:&quot;uchar&quot;,&quot;density&quot;:72,&quot;chromaSubsampling&quot;:&quot;4:2:0&quot;,&quot;isProgressive&quot;:false,&quot;hasProfile&quot;:false,&quot;hasAlpha&quot;:false}">在过去的几天里，我有机会玩门户网站，虽然这还不足以让我进行全面的回顾，但这足以让我报告说，控制非常出色，但流媒体质量受到了影响。我也可以告诉你，这件事非常奇怪。索尼是一家游戏公司，曾经制造过像Vita这样的手持游戏机，现在有了一个看起来像独立手持设备的东西，但不是。门户网站不能自己玩游戏。相反，它从你的PS5流式传输游戏。把它想象成一个PS5控制器，在中间冒出一个屏幕。</p><p>第一次把它从盒子里拿出来，我觉得它看起来很傻。干净，但很傻。平板状显示屏夹在完整游戏控制器的两半之间，有些俯冲的轮廓线是老式索尼的。USB-C充电端口藏在下面，就像它藏起来了一样。它看起来不是特别便携。它的形状笨拙，没有附带的外壳。</p><p style="text-indent:2em">由于把手突出，它有点像索尼蝙蝠。话说回来，它不应该离开你的家。<br><img src="https://yixiaoer-image-oss.yixiaoer.cn/20250702/32be9be4-b443-451f-bd45-f4dda4dcfa15.jpg"></p>',

      //定时发布
      publishTime: 0,

      //原创申明
      original: 1,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Bilibili.publishArticle(cookie, taskData, eventCall);
    console.log('B站图文发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      '[{"name":"buvid3","value":"91D8043E-053A-6409-DBC3-0851E68191C887863infoc","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1775287487.833422,"sameSite":"unspecified"},{"name":"b_nut","value":"1740727487","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1772263487.833475,"sameSite":"unspecified"},{"name":"buvid4","value":"BE1B8DE4-AAF9-3C11-9088-11181F9EC23888080-025022807-2Ml1BhMyzE%2BtzzfpMXfdBg%3D%3D","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1775287488.086243,"sameSite":"unspecified"},{"name":"bili_ticket","value":"eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDA5ODY2ODgsImlhdCI6MTc0MDcyNzQyOCwicGx0IjotMX0.8SxhtvJGzpyjXbc4ikGFJnq8S9dsE3WWWGf7mfQPm5k","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1740986688,"sameSite":"unspecified"},{"name":"bili_ticket_expires","value":"1740986628","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1740986688,"sameSite":"unspecified"},{"name":"SESSDATA","value":"4b6e6e3c%2C1756279508%2Cb87d0%2A21CjDFeJpfyWNqSSxTpuwvrqSSsv39TW2P1e9uVMbFPmaByYzGBDkEjeExyg8Pcd9QXycSVmtyajJMRXl0MUkzbzB1U09PTlB2RjZITWoxakJnUkFuczJiVEZYNVF6dzM5cFdDQWNDMVAyaG8xOHUyWTZSTF9QMk03RlRGREl6Z1Z2dmlvYXV1MGR3IIEC","domain":".bilibili.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1756279508.617087,"sameSite":"unspecified"},{"name":"bili_jct","value":"bf27635fa54a2be4d2d32594e1719908","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1756279508.617239,"sameSite":"unspecified"},{"name":"DedeUserID","value":"3546751629790134","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1756279508.617305,"sameSite":"unspecified"},{"name":"DedeUserID__ckMd5","value":"f17e486626a25074","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1756279508.617363,"sameSite":"unspecified"},{"name":"sid","value":"83a9ltho","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1756279508.617416,"sameSite":"unspecified"},{"name":"b_lsid","value":"CFAA74A9_1954B71DF96","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"_uuid","value":"E3E10DEFF-EBAA-BA5E-5933-DCC953EA521308893infoc","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1772263508,"sameSite":"unspecified"}]';
    const result = await new AccountService(cookie, Platforms.BiLiBiLi).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});

describe.runIf(true)('【B站图文状态查询】', () => {
  test('B站图文状态查询', async () => {
    const cookie = getCookie();

    const result = await Bilibili.getBilibiliArticleStatus(cookie, '42191338');
    console.log('B站图文状态查询：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      '[{"name":"buvid3","value":"91D8043E-053A-6409-DBC3-0851E68191C887863infoc","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1775287487.833422,"sameSite":"unspecified"},{"name":"b_nut","value":"1740727487","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1772263487.833475,"sameSite":"unspecified"},{"name":"buvid4","value":"BE1B8DE4-AAF9-3C11-9088-11181F9EC23888080-025022807-2Ml1BhMyzE%2BtzzfpMXfdBg%3D%3D","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1775287488.086243,"sameSite":"unspecified"},{"name":"bili_ticket","value":"eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDA5ODY2ODgsImlhdCI6MTc0MDcyNzQyOCwicGx0IjotMX0.8SxhtvJGzpyjXbc4ikGFJnq8S9dsE3WWWGf7mfQPm5k","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1740986688,"sameSite":"unspecified"},{"name":"bili_ticket_expires","value":"1740986628","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1740986688,"sameSite":"unspecified"},{"name":"SESSDATA","value":"4b6e6e3c%2C1756279508%2Cb87d0%2A21CjDFeJpfyWNqSSxTpuwvrqSSsv39TW2P1e9uVMbFPmaByYzGBDkEjeExyg8Pcd9QXycSVmtyajJMRXl0MUkzbzB1U09PTlB2RjZITWoxakJnUkFuczJiVEZYNVF6dzM5cFdDQWNDMVAyaG8xOHUyWTZSTF9QMk03RlRGREl6Z1Z2dmlvYXV1MGR3IIEC","domain":".bilibili.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1756279508.617087,"sameSite":"unspecified"},{"name":"bili_jct","value":"bf27635fa54a2be4d2d32594e1719908","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1756279508.617239,"sameSite":"unspecified"},{"name":"DedeUserID","value":"3546751629790134","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1756279508.617305,"sameSite":"unspecified"},{"name":"DedeUserID__ckMd5","value":"f17e486626a25074","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1756279508.617363,"sameSite":"unspecified"},{"name":"sid","value":"83a9ltho","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1756279508.617416,"sameSite":"unspecified"},{"name":"b_lsid","value":"CFAA74A9_1954B71DF96","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"_uuid","value":"E3E10DEFF-EBAA-BA5E-5933-DCC953EA521308893infoc","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1772263508,"sameSite":"unspecified"}]';
    const result = await new AccountService(cookie, Platforms.BiLiBiLi).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
//content=<p style="text-align: left"><strong>【本文由小黑盒作者@一只鱼于10月19日发布，转载请标明出处！】</strong></p><p style="text-align: left">Hello everyone！这里是<strong>一只鱼</strong></p><p style="text-align: left">本期给大家盘点一下近期精品游戏合集</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1OKWZj.img?w=768&amp;h=480&amp;m=6&amp;x=512&amp;y=273&amp;s=265&amp;d=265" alt="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！" title="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！</span></p><h4 style="text-align: left"><strong>双击美女有惊喜嗷~</strong></h4><p style="text-align: left">今日壁纸：李擎洲：夏至[4K]</p><p style="text-align: left">1.《霍格沃茨之遗》</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1OKWZm.img?w=768&amp;h=372&amp;m=6" alt="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！" title="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！</span></p><p style="text-align: left">2.《战锤40K：星际战士2》</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1OLjnb.img?w=768&amp;h=383&amp;m=6" alt="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！" title="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！</span></p><p style="text-align: left">3.《逃离鸭科夫》</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1OLbNo.img?w=768&amp;h=358&amp;m=6" alt="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！" title="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！</span></p><p style="text-align: left">4.《底特律：化身为人》</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1OLv6o.img?w=768&amp;h=383&amp;m=6" alt="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！" title="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！</span></p><p style="text-align: left">5.《超阈限空间》</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1OKZBA.img?w=768&amp;h=378&amp;m=6" alt="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！" title="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！</span></p><p style="text-align: left">6.《审判之逝：湮灭的记忆》</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1OLsA5.img?w=768&amp;h=360&amp;m=6" alt="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！" title="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！</span></p><p style="text-align: left">7.《无主之地4》</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1OLh1G.img?w=768&amp;h=368&amp;m=6" alt="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！" title="仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！"></div><p></p><p style="text-align: left"><span style="color: rgb(255, 255, 255)">仅剩一天！多款史低+新史低游戏即将结束折扣！最低仅需4元！</span></p><p style="text-align: left">8.《王国：两位君主》</p><p style="text-align: left">9.《龙珠2》</p><p style="text-align: left">10.《合金天使：盾入伊甸》</p><p style="text-align: left">11.《细胞分裂6：黑名单》</p><p style="text-align: left">12.《炼金之道》</p><p style="text-align: left">13.《奇怪的RPG》</p><p style="text-align: left">14.《荒野大镖客：救赎2》</p><p style="text-align: left">15.《gogh: 虚拟形象与专注》</p><p style="text-align: left">16.《戴森球计划》</p><p style="text-align: left">17.《深入》</p><p style="text-align: left">18.《狙击精英5》</p><p style="text-align: left">19.《部落幸存者》</p><p style="text-align: left">20.《我们永远在这里》</p><p style="text-align: left">21.《影子诡局：被诅咒的海盗》</p><p style="text-align: left">22.《异形工厂2》</p><p style="text-align: left">23.《地狱边境》</p><p style="text-align: left">24.《怪物圣所》</p><p style="text-align: left">25.《风暴之城》</p><p style="text-align: left">26.《超级鸡马》</p><p style="text-align: left">27.《雪地狂奔》</p><p style="text-align: left">28.《编程农场》</p><p style="text-align: left">29.《模拟美景摄影》</p><p style="text-align: left">30.《细胞分裂：断罪 豪华版》</p><p style="text-align: left">31.《铁匠大师》</p><p style="text-align: left">32.《黄老饼梦游惊奇》</p><p style="text-align: left">33.《毁灭工具》</p><p style="text-align: left">34.《阿瑞亚之旅》</p><p style="text-align: left">35.《九王》</p>

describe.runIf(true)('【新版发布流程】', () => {
  test(
    'B站文章',
    async () => {
      const result = Cloud.pushOpenPlatformPublishTask(
        {
          callBackData: { teamId: '6821ac8d50bc5fd636fa9801', userId: '66fa6b65f7867d1b4448a0c7' },
          publishType: 'article',
          tasks: [
            {
              taskId: '6901d453e7ac63a40a9f40b2',
              publishData: {
                covers: [
                  {
                    width: 768,
                    height: 418,
                    size: 1,
                    pathOrUrl: 'https://oss-v2.yixiaoer.cn/yfb/test/t-6821ac8d50bc5fd636fa9801/dlgroye31q6e8ihyzt3dt',
                    format: '',
                  },
                ],
                title: 'HLE不抵GENG！',
                content:
                  '<p style="text-align: left"><strong>本文由小黑盒作者@毒舌说电竞于10月28日发布，转载请标明出处！】</strong></p><p style="margin: 0px 0px 16px; color: rgb(36, 36, 36); font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Midlevel&quot;, sans-serif; font-size: 17px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: left; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(247, 247, 247); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">HLE 1-3 不敌GEN，止步八强无缘前四。这也是Zeus选手职业生涯第一次打不进世界赛的前二，当然今年的Zues是HLE.Zeus。只能说Zeus离开T1之后是两败俱伤，如果Zeus不走的话，感觉T1是能跟现在的GNEG碰一碰的。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1PlQO4.img?w=768&amp;h=418&amp;m=6&amp;x=183&amp;y=55&amp;s=386&amp;d=137" alt="HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！" title="HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！"></div><p></p><p style="text-align: left"><span style="color: rgb(36, 36, 36); font-weight: normal">HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！</span></p><p style="margin: 0px 0px 16px; color: rgb(36, 36, 36); font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Midlevel&quot;, sans-serif; font-size: 17px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: left; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(247, 247, 247); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">以ZOFGK这五个人的默契程度，我甚至会觉得T1的胜算更多一点大家怎么评价Zeus加盟HLE的这一年？是算成功还是失败？</p><p style="margin: 0px 0px 16px; color: rgb(36, 36, 36); font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Midlevel&quot;, sans-serif; font-size: 17px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: left; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(247, 247, 247); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">然后有网友说：lck的队伍，没有说太过于英雄主义的选手，纪律性给他们带来的团队意识，导致磨合成型的队伍黏性够强，lck的这些冠军队伍，MVP应该给到每一个人，大家都是从绿叶开始，只是在那一年的决赛Zeus开花了，实际上那一年skt承受的压力最多的不是上路，反而帮助最多的是上路，离开skt，需要自己挑大梁了，才发现自己好像不太具备当绝对大哥的潜质。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1PlVAp.img?w=768&amp;h=419&amp;m=6" alt="HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！" title="HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！"></div><p></p><p style="text-align: left"><span style="color: rgb(36, 36, 36); font-weight: normal">HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！</span></p><p style="margin: 0px 0px 16px; color: rgb(36, 36, 36); font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Midlevel&quot;, sans-serif; font-size: 17px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: left; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(247, 247, 247); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">还有网友说：Zeus不走也打不过现在的三星，就今天这个状态来看，Ruler打Faker特来劲，Chovy抓Faker特有感觉，今天Chovry的表现无解，Guma和小k出也打不过Ruler，viper还是带着拖油瓶辅助爆c都赢不了，要是互换一下位置不敢想Guma会被杀成什么样，三叔不发病刷刷野就能赢，HLE有Viper还能挣扎一下，T1全靠Faker带飞，而且现在Faker打Chovy已经力不从心。</p><p style="text-align: left"></p><div style=""><img src="https://img-s.msn.cn/tenant/amp/entityid/AA1PlQO9.img?w=768&amp;h=368&amp;m=6" alt="HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！" title="HLE 1-3 不敌GEN！Zeus离开T1，标准的双输结局！"></div><p></p>',
                tags: [],
                category: {
                  yixiaoerId: '3',
                  yixiaoerName: '生活',
                  child: [
                    {
                      yixiaoerId: '13',
                      yixiaoerName: '美食',
                      raw: { id: 13, parent_id: 3, name: '美食', children: [] },
                    },
                    {
                      yixiaoerId: '21',
                      yixiaoerName: '萌宠',
                      raw: { id: 21, parent_id: 3, name: '萌宠', children: [] },
                    },
                    {
                      yixiaoerId: '14',
                      yixiaoerName: '时尚',
                      raw: { id: 14, parent_id: 3, name: '时尚', children: [] },
                    },
                    {
                      yixiaoerId: '22',
                      yixiaoerName: '运动',
                      raw: { id: 22, parent_id: 3, name: '运动', children: [] },
                    },
                    {
                      yixiaoerId: '15',
                      yixiaoerName: '日常',
                      raw: { id: 15, parent_id: 3, name: '日常', children: [] },
                    },
                  ],
                  raw: { id: 3, parent_id: 0, name: '生活', children: [] },
                },
                subCategory: {
                  yixiaoerId: '13',
                  yixiaoerName: '美食',
                  raw: { id: 13, parent_id: 3, name: '美食', children: [] },
                },
                createType: 0,
                prePubTime: 0,
                pubType: 1,
              },
              authorInfo: {
                platformName: '哔哩哔哩',
                id: 'cmfxdfoli0005iu0jmh96ktey',
                proxy: { serverAdd: '10.0.0.6', serverPort: '48431' },
              },
            },
          ],
          publishChannel: 'cloud',
          platform: [
            {
              id: 'cmfxdfoli0005iu0jmh96ktey',
              platformCode: 'BiLiBiLi',
              platformUserId: '381372793',
              platformUserName: '从从从从从从从从从从',
              platformCookie:
                'buvid3=29BDDC39-14E5-E1D7-5B6D-53D687103DC974491infoc; b_nut=1761037774; buvid4=86AFC3BF-B549-A4ED-D3BF-74D73E1074C774887-025102117-H8fWdOH4wT9Fe9F4xhplTg%3D%3D; buvid_fp=c28e07ebb1622bf70f5a1ad028eeaad6; _uuid=AC11A677-F2A7-8DCA-4104C-498A1B7310107D10538infoc; enable_web_push=DISABLE; home_feed_column=5; theme-tip-show=SHOWED; SESSDATA=53cfe29d%2C1777706328%2C53e59%2Ab1CjCib9IGIlXDoDE89-9t7y2JLFc0APudjcoFagSBCM8xWYgZkOsBFlCik84hlzbreDQSVlR3Sm9MUHQ2UjA5MnFUTWN6Y19RTzlYSElvOE41ZWUzV2dBTjhvQzd2M0pBbDBvUEVPc1p6RWNXS1FKYnRWVGVpNThVR0FMN2g1MHhZa3BSZFl0MnpRIIEC; bili_jct=29a8c158181f999b7f622b353878a85f; DedeUserID=487774574; DedeUserID__ckMd5=c78099626f24ade1; sid=5kzdm7j3; browser_resolution=2048-1024; b_lsid=E4E2C1DA_19A489528C4',
              platformLocalStorage: '{"__url__":"https://www.bilibili.com/"}',
            },
          ],
          authorization: 'sess_2f76619053ace48ad564d022b249be6768f6cfc28d21c7de193d9df67cd7d38e',
        },
        '123',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});
