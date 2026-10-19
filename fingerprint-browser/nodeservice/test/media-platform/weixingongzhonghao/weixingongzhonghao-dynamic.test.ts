import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { Weixingongzhonghao, WeixinDynamicTaskInput } from '../../../src/media-platform/weixingongzhonghao';

const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

let publishId = '';

describe.runIf(true)('【真实测试】', () => {
  test('微信公众号动态发布', async () => {
    const cookie = getCookie();
    const tokenResult = await Weixingongzhonghao.getWeixingongzhonghaoUserInfo(cookie);

    const taskData: WeixinDynamicTaskInput = {
      taskId: '1717809227264909320',
      pubType: 0,
      sex: 0,
      notifySubscribers: 1,
      title: '微信公众号动态测试123123',
      desc: '<p>微信公众号动态测试内容</p>',
      images: [
        {
          width: 1280,
          height: 1707,
          size: 322827,
          pathOrUrl: 'I:\\download\\20251217-164426.jpg',
        },
        {
          width: 616,
          height: 803,
          size: 165798,
          pathOrUrl: 'I:\\download\\20251217-164436.png',
        },
        {
          width: 807,
          height: 807,
          size: 227763,
          pathOrUrl: 'I:\\download\\1-1.jpg',
        },
      ],
      needOpenComment: 0,
      autoSelectComment:0,
      contentSource: 0,
      openFansMsg: 0,
      disableRecommend: 0,
      isOriginal: 0,
      allowFastReprint: 0,
      authorName: '',
      categoryName: '',
      subCategoryName: '',
      contentSourceUrl: '',
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Weixingongzhonghao.publishDynamic(
      cookie,
      taskData,
      tokenResult.data?.ticketId ?? '',
      tokenResult.data?.ticket ?? '',
      tokenResult.data?.token ?? 0,
      tokenResult.yixiaoerId ?? '',
      eventCall,
    );

    publishId = result.publishId ?? '';
    console.log('微信公众号动态发布结果', JSON.stringify(result, null, 2));
    expect(result.code, '微信公众号动态发布失败').toBe(0);
    expect(result.publishId, '微信公众号动态发布后未返回作品ID').not.toBe('');
  }, 10000000);

  test('获取微信公众号动态作品状态', async () => {
    const cookie = getCookie();
    expect(publishId, '需要先成功执行微信公众号动态发布测试').not.toBe('');

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 5000);
    });

    const result = await Weixingongzhonghao.getGongZhongHaoArticleStatus(cookie, publishId);
    console.log('微信公众号动态作品状态', JSON.stringify(result, null, 2));
    expect(result, '微信公众号动态作品状态查询失败').not.toBeUndefined();
    expect(result, '微信公众号动态作品状态查询失败').not.toBeNull();
    expect(result.code, '微信公众号动态作品状态查询失败').toBe(0);
  }, 10000000);
});
