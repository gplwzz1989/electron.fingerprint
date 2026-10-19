import { describe, expect, test } from 'vitest';
import { Bilibili, BilibiliVideoTaskInput } from '../../../src/media-platform/bilibili';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { convertCookieStr } from '../../../src/utils';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe.runIf(true)('【获取B站作者信息】', () => {
  test('获取B站作者信息', async () => {
    const cookie = getCookie();
    const result = await Bilibili.getBilibiliUserInfo(cookie);
    console.log('获取B站作者信息：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【获取B站作者高权益】', () => {
  test('获取B站作者高权益', async () => {
    const cookie = getCookie();
    const result = await Bilibili.getBilibiliPrivilege(cookie);
    console.log('获取B站作者高权益：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取B站作者会员信息】', () => {
  test('获取B站作者高权益', async () => {
    const cookie = getCookie();
    const result = await Bilibili.getBilibiliMemberInfo(cookie);
    console.log('获取B站作者高权益：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取B站分类列表】', () => {
  test('获取B站分类列表', async () => {
    const cookie = getCookie();
    const result = await Bilibili.getBilibiliVideoCategory(cookie);
    console.log('获取B站分类列表：', JSON.stringify(result.data?.type_list, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【获取B站话题/活动】', () => {
  test('获取B站话题', async () => {
    const cookie = getCookie();
    const result = await Bilibili.getBilibiliVideoTopic(cookie, 21, '星之卡比');
    console.log('获取B站话题：', JSON.stringify(result.data?.topics, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【B站视频发布】', () => {
  test('B站视频发布', async () => {
    const cookie = getCookie();

    const taskData: BilibiliVideoTaskInput = {
      pubType: 0,
      taskId: '1717809227264909312',
      cover: {
        height: 0,
        pathOrUrl: 'I:\\download\\20250407-093917.jpg',
        size: 0,
        width: 0,
      },
      video: {
        duration: 0,
        height: 0,
        localPath: 'I:\\download\\xiaomi2.mp4',
        size: 14572391,
        width: 0,
      },
      // proxy: {
      //   serverAdd: 'd393.kdltpspro.com',
      //   serverPort: 15818,
      //   type: 'kuaidaili',
      //   userName: 't13552986932913',
      //   password: '2mbl9d6n',
      //   area: '',
      //   province: '11',
      // },
      // 标题
      title: '上海的房子还是吃香的',
      collection: {
        yixiaoerId: '7225954',
        yixiaoerName: '合集3',
      },
      // 描述
      desc: '<p>我就是你的好友<friend raw="{&quot;face&quot;:&quot;https://i1.hdslb.com/bfs/face/a14988da97891799a6a43f416ecfabc47ff5f300.jpg&quot;,&quot;fans&quot;:2288,&quot;name&quot;:&quot;贝肯熊的搞笑日记&quot;,&quot;official_verify_type&quot;:1,&quot;uid&quot;:&quot;2117385451&quot;}"></friend></p>',
      // desc:'我就是一个不错的视频',
      // 活动/话题
      // topic: {
      //   topic_id: 3887,
      //   topic_name: '一起做手工吧！',
      //   description: '',
      //   mission_id: 1699296,
      //   activity_text: '',
      //   activity_description: '',
      // },

      // topic: {
      //   id: 1179608,
      //   name: '星之卡比32周年',
      //   uname: '',
      //   state: 0,
      //   description: '粉色恶魔32岁啦！今天是《星之卡比》系列诞生32周年，官方公开了周年纪念贺图。 ​​​',
      //   mission_id: 0,
      //   activity_sign: '',
      //   act_protocol: '',
      //   topic_id: 1179608,
      //   topic_name: '星之卡比32周年',
      // },

      // 分类id，
      tid: 138,

      // category: {
      //   id: 138,
      //   name: '搞笑',
      // },

      //标签
      // tags: ['创业'],

      //允许投稿字幕
      subtitle_open: 0,

      //字幕语言
      subtitle_lan: '',

      //是否关闭弹幕
      up_close_danmu: false,

      //是否开启精彩评论
      up_selection_reply: false,

      //是否关闭评论
      up_close_reply: false,

      //粉丝动态
      dynamic: '',

      //创作类型 1自制 2转载
      copyright: 1,

      //转载来源，当创作类型为转载时需要来源url
      source: '',

      //是否禁止转载 1时 0否
      no_reprint: 1,

      //是否启用充电板,当创作类型为自制时才能使用
      open_elec: 0,

      //是否杜比视界视频 1时 0否
      dolby: 0,

      //定时发布时间戳 10位
      dtime: 0,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Bilibili.publishVideo(cookie, taskData, eventCall);
    console.log('B站视频发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取B站视频审核状态】', () => {
  test('获取B站视频审核状态', async () => {
    //const cookie = getCookie();
    const cookie=convertCookieStr('[{"name":"buvid3","value":"68260D24-CDA8-ED8E-4672-FFE57EFAF11F74410infoc","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1799983472.989933,"sameSite":"unspecified"},{"name":"b_nut","value":"1765423474","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796959472.989994,"sameSite":"unspecified"},{"name":"buvid4","value":"C72567BF-CD35-A4AD-B16A-434AA1CEC4B075925-025121111-dEH7sKWkJl5wF5VlRpqtVw%3D%3D","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1810967447.18343,"sameSite":"unspecified"},{"name":"buvid_fp","value":"02dd1bab600ffd977729217e72264931","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796959475,"sameSite":"unspecified"},{"name":"SESSDATA","value":"d5d974a0%2C1780975648%2C9a7fb%2Ac2CjDeuuc-I8nLc1rLDNQd7TjoNl3DsHUVEUB5uVK962szFILNMEK16M2FkHytSyHYKBASVmlyUE0zb1hnXzVCbUxrNW5Vak0tbFpocDROVHNMd0gtLUNuMHRubnl2cnh1NUpFU0tDVWVpOGxiU3BVQmZMdS1ObXQ5bWdkbVF2YWFZelZEWnF2SVRBIIEC","domain":".bilibili.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1780975646.933629,"sameSite":"no_restriction"},{"name":"bili_jct","value":"28794fada9a1ba58fbfd1e92c81da817","domain":".bilibili.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975646.933696,"sameSite":"no_restriction"},{"name":"DedeUserID","value":"487774574","domain":".bilibili.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975646.93372,"sameSite":"no_restriction"},{"name":"DedeUserID__ckMd5","value":"c78099626f24ade1","domain":".bilibili.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975646.933738,"sameSite":"no_restriction"},{"name":"sid","value":"h4ct5za1","domain":".bilibili.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975646.933757,"sameSite":"no_restriction"},{"name":"_uuid","value":"9E464C61-88B3-742A-E619-3A592F763ED548696infoc","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796959648,"sameSite":"unspecified"},{"name":"SESSDATA","value":"d5d974a0%2C1780975648%2C9a7fb%2Ac2CjDeuuc-I8nLc1rLDNQd7TjoNl3DsHUVEUB5uVK962szFILNMEK16M2FkHytSyHYKBASVmlyUE0zb1hnXzVCbUxrNW5Vak0tbFpocDROVHNMd0gtLUNuMHRubnl2cnh1NUpFU0tDVWVpOGxiU3BVQmZMdS1ObXQ5bWdkbVF2YWFZelZEWnF2SVRBIIEC","domain":".biligame.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1780975647.291889,"sameSite":"no_restriction"},{"name":"bili_jct","value":"28794fada9a1ba58fbfd1e92c81da817","domain":".biligame.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975647.291958,"sameSite":"no_restriction"},{"name":"DedeUserID","value":"487774574","domain":".biligame.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975647.291981,"sameSite":"no_restriction"},{"name":"DedeUserID__ckMd5","value":"c78099626f24ade1","domain":".biligame.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975647.292,"sameSite":"no_restriction"},{"name":"sid","value":"h93c3qi7","domain":".biligame.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975647.292018,"sameSite":"no_restriction"},{"name":"SESSDATA","value":"d5d974a0%2C1780975648%2C9a7fb%2Ac2CjDeuuc-I8nLc1rLDNQd7TjoNl3DsHUVEUB5uVK962szFILNMEK16M2FkHytSyHYKBASVmlyUE0zb1hnXzVCbUxrNW5Vak0tbFpocDROVHNMd0gtLUNuMHRubnl2cnh1NUpFU0tDVWVpOGxiU3BVQmZMdS1ObXQ5bWdkbVF2YWFZelZEWnF2SVRBIIEC","domain":".bilibili.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1780975646.700509,"sameSite":"no_restriction"},{"name":"bili_jct","value":"28794fada9a1ba58fbfd1e92c81da817","domain":".bilibili.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975646.700569,"sameSite":"no_restriction"},{"name":"DedeUserID","value":"487774574","domain":".bilibili.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975646.700593,"sameSite":"no_restriction"},{"name":"DedeUserID__ckMd5","value":"c78099626f24ade1","domain":".bilibili.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975646.700611,"sameSite":"no_restriction"},{"name":"sid","value":"megct93t","domain":".bilibili.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975646.700629,"sameSite":"no_restriction"},{"name":"SESSDATA","value":"d5d974a0%2C1780975648%2C9a7fb%2Ac2CjDeuuc-I8nLc1rLDNQd7TjoNl3DsHUVEUB5uVK962szFILNMEK16M2FkHytSyHYKBASVmlyUE0zb1hnXzVCbUxrNW5Vak0tbFpocDROVHNMd0gtLUNuMHRubnl2cnh1NUpFU0tDVWVpOGxiU3BVQmZMdS1ObXQ5bWdkbVF2YWFZelZEWnF2SVRBIIEC","domain":".huasheng.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1780975647.1513,"sameSite":"no_restriction"},{"name":"bili_jct","value":"28794fada9a1ba58fbfd1e92c81da817","domain":".huasheng.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975647.151362,"sameSite":"no_restriction"},{"name":"DedeUserID","value":"487774574","domain":".huasheng.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975647.151387,"sameSite":"no_restriction"},{"name":"DedeUserID__ckMd5","value":"c78099626f24ade1","domain":".huasheng.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975647.151405,"sameSite":"no_restriction"},{"name":"sid","value":"gpshdrga","domain":".huasheng.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780975647.151423,"sameSite":"no_restriction"},{"name":"home_feed_column","value":"5","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796959651,"sameSite":"unspecified"},{"name":"browser_resolution","value":"1920-960","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796959651,"sameSite":"unspecified"},{"name":"bmg_af_switch","value":"1","domain":"www.bilibili.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"bmg_src_def_domain","value":"i1.hdslb.com","domain":"www.bilibili.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"theme-tip-show","value":"SHOWED","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1807943446,"sameSite":"unspecified"},{"name":"captcha_v4_user","value":"4200a04e3fdb4dc3be3b03ecd8a7b20e","domain":"gcaptcha4.geetest.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1800424738.840743,"sameSite":"no_restriction"},{"name":"b_lsid","value":"C8A050B5_19D9A228657","domain":".bilibili.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"}]');
    const result = await Bilibili.getBilibiliVideoStatus(cookie, '116599168176541');
    console.log('B站视频发布状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【获取B站用户列表】', () => {
  test('获取B站用户列表', async () => {
    const cookie = getCookie();
    const result = await Bilibili.getBilibiliFriend(cookie, '搞笑');
    console.log('获取B站用户列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取B站用户列表】', () => {
  test('获取B站合集权益', async () => {
    const cookie = getCookie();
    const result = await Bilibili.checkBilibiliCollectionEquity(cookie);
    console.log('获取B站用户合集权益：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
//407966934
//获取作品审核状态
