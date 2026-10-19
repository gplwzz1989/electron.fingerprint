import { describe, expect, test } from 'vitest';
import { Azhan } from '../../../src';
import { EventEmitter } from 'events';
import { AZhanVideoTaskInput } from '../../../src/media-platform/azhan/azhan-video';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    '_did=web_38651825917FF3AA; Hm_lvt_2af69bc2b378fb58ae04ed2a04257ed1=1753855579; ac_username=XxXxXxXxCc; ac_userimg=https%3A%2F%2Fimgs.aixifan.com%2Fstyle%2Fimage%2F201907%2FdytOs5icCUsbhzxD2rhaf9JwAYWuXCVl.jpg; acPostHint=89923fd9f83fd4d2056205f9a52df938081e; acPasstoken=ChVpbmZyYS5hY2Z1bi5wYXNzdG9rZW4SYKddUJ5D66orNSKTd6RhbnLDxmQ54LUy2YYRBv6F1Y641Y2HGAejTIn5gFhJhzUoXzUZIEqKClTxn2FeH3gf5OlL8NqdGp7x3_v7AKOYY3r1JrqmpE8o1J_SMfT4iqYNQBoSfBwPH9akrqrKC4CE6EB5dtkPIiBd9dtaQAotjrLDucuhkJoI1Xlae-ZBsTZLuZr1d0vAHSgFMAE; auth_key=1369776; Hm_lpvt_2af69bc2b378fb58ae04ed2a04257ed1=1753855579; HMACCOUNT=3B8EF416D751215A; cur_req_id=6913837343F2BED7_self_609936b5b31645b19d3c9dc8848382c5; cur_group_id=6913837343F2BED7_self_609936b5b31645b19d3c9dc8848382c5_0; limitRequest=1; cur_req_id=445289627599324D_self_609936b5b31645b19d3c9dc8848382c5; cur_group_id=445289627599324D_self_609936b5b31645b19d3c9dc8848382c5_0';
  test('A站视频视视频发布', async () => {
    const taskData: AZhanVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\132835268627695428.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      },
      desc: '我是一个测试视频的描述',
      title: '我是一个标题',
      tags: ['搞笑', '记录'],
      publishTime: new Date('2025-6-22').getTime(),
      category: {
        channelId: '1',
        channelType: 2,
        name: '动画',
      },
      subcategory: {
        introduction: '番剧相关的二次创作相关视频',
        channelId: '212',
        channelType: 2,
        name: '番剧二创',
      },
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Azhan.publishVideo(cookie, taskData, eventCall);

    console.log('A站视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('A站视频删除', async () => {
    const result = await Azhan.deleteAZhanMediaContent(cookie, '46060096');

    console.log('A站视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('A站视频状态', async () => {
    const result = await Azhan.getAZhanMediaStatus(cookie, '47415963');

    console.log('A站状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('A站视频分类', async () => {
    const result = await Azhan.getAZhanMediaCategory(cookie, PubContentEnum.video);

    console.log('A站分类：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
