import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { publishSouhuhaoVideo, SouhuhaoVideoTaskInput } from '../../../src/media-platform/souhuhao/souhuhao-video';
import {
  getSouhuhaoUserInfo,
  getSouhuhaoVideoCategory,
  getSouhuhaoVideoStatus,
} from '../../../src/media-platform/souhuhao/souhuhao-common';
import { Souhuhao } from '../../../src/media-platform/souhuhao/souhuhao';
import {
  getSouhuhaoSubVideoCategoryAsync,
  getSouhuVideoCategoryAsync,
} from '../../../src/media-platform/souhuhao/souhuhao-category.service';
import { getSouhuhaoTopicAsync } from '../../../src/media-platform/souhuhao/souhuhao-topic.service';

describe.runIf(true)('【真实测试发布】', () => {
  const cookie =
    'SUV=1782380485279tvg9na; clt=1782380485; cld=20260625174125; reqtype=pc; gidinf=x099980109ee1cba66b5e2c28000e0bbb7e5da82adf0; _dfp=0b7u2LB4nbtG0XDmaikzqcdhgLEhQZng5BwklEV9kUo=; jv=dbbd0336494617fc4cdf1c17d7844082-NUcM3YwH1782380529635; ppinf=2|1782380529|1783590129|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNi0wNi0yNXxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Mzpwd2R8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVuaXFuYW1lOjA6fA; pprdig=gd5MvH0tc_frZeOPpiYkQEQTlT8SZpMdaVPAGxstwp6u4jCfcVev06E3ICj2fq1JhHBQi17zC-qeIwpN6vgR3WXLoM6WJaa_Gq1BkEM5p72jTzpMd5BMXE_p6Mfb2dv-Y1cOCy-Y1KdxxUj5l07G6HHnjNz1SVfxRCunnVMFdRM; ppmdig=1782380530000000fc148c7b07cfe3eb2ba57f1deebaaa03; mp-cv=100-1782380531013-2917fd3fbd56449889943d6cd8839a42; t=1782380555953';
  test('搜狐号视频发布', async () => {
    //const authData = await getAuthKey(cookie);
    const params: SouhuhaoVideoTaskInput = {
      taskId: '1728003741082443776',
      pubType: 0,
      cover: {
        height: 0,
        pathOrUrl: 'https://oss.hokkj.cn/hok_admin/img/8d5627b6a9d7404fb6500170354e88b5.png',
        size: 0,
        width: 0,
      },
      video: {
        duration: 0,
        height: 0,
        localPath: 'I:\\download\\#海绵宝宝 #童年动画 #动画 #日更.mp4',
        size: 0,
        width: 0,
      },
      title: '可爱的小猫咪',
      desc: '可爱的小猫咪',
      category: { id: 41, name: '动漫', cmsChannelId: 201, cmsPName: '动漫栏目', status: 1, level: 41 },
      subCategory: {
        id: 55,
        name: '卡通短剧',
        channelId: 41,
        status: 1,
      },
      infoResource: 0,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await publishSouhuhaoVideo(cookie, 121349544, params, eventCall);
    console.log('企鹅号发布视频：', result);
  }, 10000000);

  test('搜狐号视频发布状态查询', async () => {
    const userInfo = await getSouhuhaoUserInfo(cookie);
    const result = await getSouhuhaoVideoStatus(cookie, userInfo.data.data[0].accountInfos[0].id, '964444131');
    console.log('企鹅号发布视频：', result);
  }, 10000000);

  test('获取搜狐号视频一级分类', async () => {
    const result = await getSouhuVideoCategoryAsync(cookie, 121349544);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取搜狐号视频二级分类', async () => {
    const result = await getSouhuhaoSubVideoCategoryAsync(cookie, 121349544);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);

  test('获取搜狐号视频拼装二级分类', async () => {
    const userInfo = await getSouhuhaoUserInfo(cookie);
    const result = await getSouhuhaoVideoCategory(cookie, userInfo.data.data[0].accountInfos[0].id);
    console.debug(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取搜狐号视频话题列表', async () => {
    const userInfo = await Souhuhao.getSouhuhaoUserInfo(cookie);
    const result = await getSouhuhaoTopicAsync(cookie, userInfo.data.data[0].accountInfos[0].id, '短句');
    console.debug(result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);

  test('获取搜狐号账号信息', async () => {
    const result = await Souhuhao.getSouhuhaoUserInfo(cookie);
    console.debug(result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);
});
