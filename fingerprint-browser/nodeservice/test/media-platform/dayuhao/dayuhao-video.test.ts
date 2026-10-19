import { Dayuhao, DayuhaoMiniVideoTaskInput, DayuhaoVideoTaskInput } from '../../../src/media-platform/dayuhao/index';
import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { convertCookieStr } from '../../../src/utils';
export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe.runIf(true)('【真实测试】', () => {
  const cookie = convertCookieStr(
    'cna=yj4HIXeJqSYCAXb6ZsfI/bsj; _UP_A4A_11_=wb9cb10a202f401b8c131d4c3b866d2c; _UP_335_2B_=1; _UP_D_=pc; _UP_30C_6A_=st9cc620131qwj0aa9a2138bqw6psf5f; _UP_TS_=sg116168cae13f1c5bcd6179090652fe2f7; _UP_E37_B7_=sg116168cae13f1c5bcd6179090652fe2f7; _UP_TG_=st9cc620131qwj0aa9a2138bqw6psf5f; USER_TMP=9SlRH3OJBYzdBOkhEL22QA.2oX6Je5yEbu94NT6Kwfx0TYBkRY-Eau-BaeL7OOGnf1vj5b_tW4wKSVQ63R6m8NZ2Yu54Q-A5jISx3KCla1TeJbaYb2OaI8JUclQ8XkUpKXS32dRxBToeB27499zFNWIe-DPJZkdbDfxratRiUefMtthMp81FarkI2xJgH9rjvj2befdUmK1ir8fklE6fFt2FhXKjmb2P2ovpCV0kL7S5ipEp8kjz_In-4s8A_Ugnt5GFtbJAkfNzHrrAdru-I_h1gsbH3O7JNammLUzYs8gb6UI5mPp1WbxQJArS2PkZy4IQUH8duO4-TRgijlHaAYz_T4phYH3DIT1Njdc5bFJTm4irwR-UGYiEXsqsRGPR9ycCchhnE9jp37GLETXU1I3jkDiO6LKeqWR0Pw0RTuztsokpIpwM2LsfPPDuVDqXZYAMz1jLXB8MM-Zz1GtTtButDLhO5Tv2i0EUltjP3_4wRi0Yh06bS9Xw2HyDJPQNGtt_o6QesfO-AThGZwGT9G8rc-g-sWVdNXawzSXmipyOEy0kItZItetXGAPk0cEg9uPAPZo5b72yXWNLKk9pfOd9i_QPxno4JgrY874ojAAcltQHelEXouWj_Qrai-HCRljD82jgJO-X76Sgb491E04Bd4WcVKO4Z67-BOUZ1xI_nCqpczUCJcEQYbe1dGYChYrsTDPNLRjTKdkZXDiGp3Itp-N8fLRIjQUEvIwoNm6i9MA1ZoxPXXKYq6mqdzjO8kGRLCgVAhDou5u9yrPmmjk2nLF8BlaL9Y0D5lXuEXy7Er8LZH_Emh41iDd4hLyF2xp1A9TxcLDvjcIp7AdvmeEPHoCHCVZ9n52Wm5PjAQJgN0miaCWXHWSN8y3-9_3kBgHrUaulHLit6dudeIxIKs9uw2ehfzuVRUkby_k4iWjnHbb6ChwG4U0PQ2-dkp7bDe3ikWqyDv9-2fq13IFVBDr3u3dO-g1mInkbKaRjguv701scmr8EWtMVvnS5U7n4XOOG3J6d0DF5raaukBz6A2e7A34f_7KPFKzfeZZ_NdZ-Y1O_A9S2j2eA-KOyag_svwXVN_NLMpfGBrm84tSryuf4Z8TUYiTeJ8K9txlmuM_WWhXrq-4qZLDSCNOcDhOcGtELPVThsFJ_vPosrT2wOshvc8Xct7gVnycBlcO6NRHRnI8WTY77ocDXR6EmNhtu8ZlJjswa0ec0_e3A7u1nPZpOODjTFtpMdgEOPBXzdniEw.1754907612130.604800000.N4hJFe5jxs2KqscPBn5VTFHt8AeYOingLZLWgwpLpvA; tfstk=gJMqHVjh4KpV0L_Wh4eN8w-rliwYIR8InAa_jcmgcr4mcRGzbViVG5YYhAurJVWj5CebQ50LymN6WnIGDYuFCtTvMcXaCRYBRp9IDseTIe1rGYdbklnuS3N0BF9CZRYBRLMpqLfQIVsyrzwoqzEajsXiS7fuxzqgSO0gr7q3AZ2gIVxPrlqajl2GI7quyl2gSV2M4048bR4iSRxrqbwomcXzASxlSKYvXtq7gym0z9o-UoqAMm4PIODraSznCzWGIYrxbe4cR9R_-XUbOy0kFtyZqluzOj8F3VoivfVrQZxj-4cZSuhJ71zEsmGKF7sGi0kauWD0aGKIx-EiS5lJ89Z4hbPE3jKOrm0QuX2xfM8j4Wlz9uVlbs2jODMTtxvVJzNLb4PIgeWq-gWGWucSDAhVS1P02uzB43PwrD1hxYldU1CTZJEzRnZf61Fq5uzBYb5O6SF84ytqw; isg=BMHBOPQ2TYkM4aGkww2F4vxG0A3b7jXg4Sm3HyMWn0gnCuHcazrCsO-I6H5MAs0Y',
  );
  test('大鱼号横板视频发布', async () => {
    const userinfo = await Dayuhao.getDayuhaoUserInfo(cookie);
    const taskData: DayuhaoVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\xiaomi2.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'C:\\Users\\Administrator\\AppData\\Roaming\\yixiaoer\\uploads\\50861_1754970782405_cover.jpg',
        width: 1920,
        height: 1080,
      },
      title: '分享一套熊猫GIF表情套装',
      desc: '搞笑视频',
      topics: [],
      pubType: 1,
      categoryName: '其他',
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Dayuhao.publishVideo(
      cookie,
      taskData,
      eventCall,
      userinfo.data?.uid ?? '',
      userinfo.data?.utoken ?? '',
      userinfo.data?.requestId ?? '',
      userinfo.data?.imageUpSign ?? '',
      userinfo.data?.imageCutSign ?? '',
    );

    console.log('大鱼横板视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('大鱼号竖版视频发布', async () => {
    const cookie = getCookie();

    const userinfo = await Dayuhao.getDayuhaoUserInfo(cookie);
    const taskData: DayuhaoMiniVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'K:\\bwork\\bybrowser5\\IceFamily\\MultiMedia\\Lib\\xiazai3.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'Z:\\系统默认下载位置\\img\\17-41-13.png',
        width: 1080,
        height: 1920,
      },
      verticalCover: {
        pathOrUrl: 'Z:\\系统默认下载位置\\img\\17-41-21.png',
        width: 1920,
        height: 1080,
      },
      title: 'cover声声慢来了',
      topics: [],
      pubType: 1,
      categoryName: '其他',
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Dayuhao.publishMiniVideo(
      cookie,
      taskData,
      eventCall,
      userinfo.data?.uid ?? '',
      userinfo.data?.utoken ?? '',
      userinfo.data?.requestId ?? '',
      userinfo.data?.imageUpSign ?? '',
      userinfo.data?.imageCutSign ?? '',
    );

    console.log('大鱼竖版视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取大鱼号用户信息', async () => {
    const result = await Dayuhao.getDayuhaoUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取大鱼号横版视频分类', async () => {
    const result = await Dayuhao.getDayuhaoVideoCategoryList(cookie);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取大鱼号竖版视频分类', async () => {
    const result = await Dayuhao.getDayuhaoMiniVideoCategoryList(cookie);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取大鱼号内容审核状态', async () => {
    const result = await Dayuhao.getDayuhaoMediaStatus(cookie, '28af3f8c55de4690afc905910bb23f5c');//661c33dea216496fbafdbb1e7f3f9a71
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

//endregion
