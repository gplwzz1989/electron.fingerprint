import { describe, test } from 'vitest';
import { EventEmitter } from 'events';
import { publishQiehaoVideo, QiehaoVideoTaskInput } from '../../../src/media-platform/qiehao/qiehao-video';
import { Qiehao } from '../../../src';
import { convertCookieStr } from '../../../src/utils';

describe.runIf(true)('【真实测试发布】', () => {
  const cookie =
    convertCookieStr('pgv_info=ssid=s8377541136; ts_last=om.qq.com/userAuth/index; pgv_pvid=8293480650; ts_uid=1866786580; csrfToken=csrf-1770801007864; RK=PUYHN8cFV5; ptcz=51485e75ac6cdf1cc06e9f693e8f374d320424aeaff1dcf2e7375a55e945ec4a; userid=22832273; omaccesstoken=00bf27bee90f37e4a14d2a1f2bfaaf70d6c6a2889b6fb37da00c50e933a64ceda1888c3c0f221319dc5a2ca9ad3b41a5fe44e6498b865e0f53ccb8f1ecded11ca6tg; omtoken=00bf27bee90f37e4a14d2a1f2bfaaf70d6c6a2889b6fb37da00c50e933a64ceda1888c3c0f221319dc5a2ca9ad3b41a5fe44e6498b865e0f53ccb8f1ecded11ca6tg; logintype=3; srcopenid=52DFE3C0B4B508807F9BA78F5C903A17; srcaccessToken=33C382889CF3025026302B4F946D2155');
  test('企鹅号视频发布', async () => {
    //const authData = await getAuthKey(cookie);
    // const params: QiehaoVideoTaskInput = {
    //   taskId: '1728003741082443776',
    //   pubType: 0,
    //   cover: {
    //     height: 0,
    //     pathOrUrl: 'https://oss.hokkj.cn/hok_admin/img/8d5627b6a9d7404fb6500170354e88b5.png',
    //     size: 0,
    //     width: 0,
    //   },
    //   video: {
    //     duration: 0,
    //     height: 0,
    //     localPath: 'C:\\Users\\Yixiaoer\\Downloads\\WeChat_20241203141711.mp4',
    //     size: 0,
    //     width: 0,
    //   },
    //   title: '我的女朋友被神秘人给抓走了',
    //   desc: '我的女朋友被神秘人给抓走了',
    //   category: '搞笑',
    //   subCategory: '爆笑恶搞',
    //   tags: ['搞笑', '恶搞', '神秘人'],
    // };
    const params: QiehaoVideoTaskInput = {
      taskId: '1728003741082443776',
      pubType: 1,
      cover: {
        height: 0,
        pathOrUrl: 'https://oss.hokkj.cn/hok_admin/img/8d5627b6a9d7404fb6500170354e88b5.png',
        size: 0,
        width: 0,
      },
      video: {
        duration: 0,
        height: 0,
        localPath: 'I:\\download\\ofyaojgonk4iutdivrbqo.mp4',
        size: 0,
        width: 0,
      },
      title: '球球的生活日常记录',
      desc: '<p>球球的生活日常记录</p>',
      category: '搞笑',
      subCategory: '爆笑恶搞',
      tags: ['球球', '生活', '记录'],
      publishTime:1755576000
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await publishQiehaoVideo(cookie, params, eventCall);
    console.log('企鹅号发布视频：', result);
  }, 10000000);

  test('企鹅视频审核状态', async () => {
    //const authData = await getAuthKey(cookie);
    const userInfo = await Qiehao.getQiehaoVideoStatus(cookie, '20250818V04QD0');

    console.log('企鹅视频审核状态：', JSON.stringify(userInfo, null, 2));
  }, 10000000);

  test('企鹅视频分类', async () => {
    //const authData = await getAuthKey(cookie);
    const userInfo = await Qiehao.getQiehaoVideoCategory(cookie);

    console.log('企鹅视频分类：', JSON.stringify(userInfo, null, 2));
  }, 10000000);
});
