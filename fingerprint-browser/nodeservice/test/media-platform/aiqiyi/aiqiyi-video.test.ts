import { describe, expect, test } from 'vitest';
import { AiqiyiVideoTaskInput, Aiqiyi, $http } from '../../../src';
import { EventEmitter } from 'events';
import { Task } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'QC008=ENaa48J5ubHyyTCi; QC006=ji10ofk9mqkwzbyeanqthcj1; QC005=05a15d46f8258eb4c7dc78f568e5e0a2; __uuid=7dd40d51-7bdf-6966-3f91-d39311a0ae9c; P00004=.1781666297.ff6fcac8d7; QC234=9324e8536eec4b22feae61049779ff6d; QC235=7e6eae1c57004d3886ff3a11fd2b7f78; P00001=47QISMrm2m2BOotat76DDpZu9zPm185kTnCJyiFNhRIh9qWMxvsnm3tVU6riPeBHUikt0T8f; P00007=47QISMrm2m2BOotat76DDpZu9zPm185kTnCJyiFNhRIh9qWMxvsnm3tVU6riPeBHUikt0T8f; P00003=2530798256; P00010=2530798256; P01010=1781712000; P00PRU=2530798256; P00002=%7B%22uid%22%3A%222530798256%22%2C%22pru%22%3A2530798256%2C%22user_name%22%3A%22183****9050%22%2C%22nickname%22%3A%22%5Cu6bdb%5Cu6bdb%5Cu6bdbm%5Cu2006m%22%2C%22pnickname%22%3A%22%5Cu6bdb%5Cu6bdb%5Cu6bdbm%5Cu2006m%22%2C%22type%22%3A29%2C%22email%22%3Anull%7D; __dfp=a0b55328e7e476400095ea71a96db40e82eec0c67faa2a3c5095f1df585f62b7a7@1782962297424@1781666298424';
  test('爱奇艺视频发布', async () => {
    const taskData: AiqiyiVideoTaskInput = {
      taskId: '13123123',
      pubType: 1,
      video: {
        localPath: 'I:\\download\\5f096d833e6ef64252e5b4be03f0528d.mp4',
        width: 1280,
        height: 980,
        duration: 9,
      },
      cover: {
        pathOrUrl: 'I:\\download\\分析并格式化 DT16-9.png',
        width: 1920,
        height: 1080,
      },
      verticalCover: {
        pathOrUrl: 'I:\\download\\分析并格式化 DT3-4.png',
        width: 960,
        height: 1280,
      },

      title: '国足夺冠世界杯，沸腾起来',
      desc: '我是视频描述',
      uploadStatement: 1,
      //publishTime: new Date('2026-7-1').getTime(),
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    //PubConfig.setLogPath('I:\\download');
    await Task.Delay(1000);

    const result = await Aiqiyi.publishVideo(cookie, taskData, eventCall);
    await Task.Delay(1000);
    console.log('爱奇艺视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('爱奇艺视频状态', async () => {

    const result=await $http.get('https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=0.000001&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=0&end=20500101&lmt=80',{headers:{cookie:'nid18=05149a4663a588e8da7a768fc865fdeb'}});
    console.log(result);
    return;
    while (true) {
      const result = await Aiqiyi.getAiqiyiVideoStatus(cookie, '4477388952137900');

      console.log('爱奇艺视频状态：', JSON.stringify(result, null, 2));

      await Task.Delay(10000);
    }
  }, 1000000000);
});
