import { assert, test, vi } from 'vitest';
import { PushingScheduledTask, PushingTaskScheduler } from './pushing';

import { Platforms } from '@/service/datasync-service-manager';

import { Task } from '@/utils';
import { Cloud, CloudPublishTaskVideoFromLite } from '@/cloud';
import { PubConfig } from '@/Config';
//
// test(
//   '推送任务集新',
//   async () => {
//     PubConfig.API_URL = 'https://www-test.yixiaoer.cn/api';
//     PubConfig.xClient = 'desktop';
//     PubConfig.API_Token='axX6MUz4bFKUdJVvqiemu';
//     // @ts-ignore
//     const taskSet: CloudPublishTaskVideoFromLite ={"publishType":"video","formData":{"accounts":[{"accountId":"684642807cdb1672ae144580","cover":{"key":"yfb/test/t-66fa6b65f7867d1b4448a0c5/8d18b501-d258-4826-a06f-ee4d58320178","width":388,"height":218,"size":17751},"video":{"key":"yfb/test/t-66fa6b65f7867d1b4448a0c5/fb1213c9-0dbf-4b27-b2c0-ec1adb572473","duration":7.299,"width":388,"height":218,"size":376425}},{"accountId":"68413a449e0d16d1e46dbee4","cover":{"key":"yfb/test/t-66fa6b65f7867d1b4448a0c5/a93f4c8b-6fcc-493c-bd7d-9986a1e438f0","width":388,"height":218,"size":17751},"video":{"key":"yfb/test/t-66fa6b65f7867d1b4448a0c5/5a347971-53b4-4404-9ef2-fd525ce14fec","duration":7.299,"width":388,"height":218,"size":376425}},{"accountId":"683fc3029e0d16d1e46d9f61","cover":{"key":"yfb/test/t-66fa6b65f7867d1b4448a0c5/d6cc8fc7-2df1-45d5-b0b0-64ca455cc253","width":388,"height":218,"size":17751},"video":{"key":"yfb/test/t-66fa6b65f7867d1b4448a0c5/dd4bd336-0491-4d6d-916a-bed4995038e6","duration":7.299,"width":388,"height":218,"size":376425}}],"aPlatform":{"title":"扮演(6)","description":""},"bPlatform":{"title":"扮演(6)","description":"","tags":[]},"isOriginal":false,"categories":{"知乎":[],"企鹅号":[],"爱奇艺":[],"网易号":[],"一点号":[],"哔哩哔哩":[],"搜狐号":[]},"isDraft":false},"authToken":"axX6MUz4bFKUdJVvqiemu","data":[{"taskId":"684954c81e6e29b3831405cf","platform":"抖音","wxkey":null,"videoPath":"yfb/test/t-66fa6b65f7867d1b4448a0c5/fb1213c9-0dbf-4b27-b2c0-ec1adb572473","cover":"yfb/test/t-66fa6b65f7867d1b4448a0c5/8d18b501-d258-4826-a06f-ee4d58320178","proxy":{"serverAdd":"10.0.0.6","serverPort":"4843","type":"kuaidaili","userName":null,"password":null,"area":null,"province":null,"city":null,"sid":null},"platformAccount":{"platformAccountId":"684642807cdb1672ae144580","platformAuthorId":"3671963038133054","platformAccountName":"瓜子","parentId":null}},{"taskId":"684954c81e6e29b3831405d4","platform":"抖音","wxkey":null,"videoPath":"yfb/test/t-66fa6b65f7867d1b4448a0c5/5a347971-53b4-4404-9ef2-fd525ce14fec","cover":"yfb/test/t-66fa6b65f7867d1b4448a0c5/a93f4c8b-6fcc-493c-bd7d-9986a1e438f0","proxy":{"serverAdd":"10.0.0.6","serverPort":"48431","type":"kuaidaili","userName":null,"password":null,"area":null,"province":null,"city":null,"sid":null},"platformAccount":{"platformAccountId":"68413a449e0d16d1e46dbee4","platformAuthorId":"89562221693","platformAccountName":"Ccc","platformAccountSpaceId":"68413a449e0d16d1e46dbee2","parentId":null}},{"taskId":"684954c81e6e29b3831405d9","platform":"抖音","wxkey":null,"videoPath":"yfb/test/t-66fa6b65f7867d1b4448a0c5/dd4bd336-0491-4d6d-916a-bed4995038e6","cover":"yfb/test/t-66fa6b65f7867d1b4448a0c5/d6cc8fc7-2df1-45d5-b0b0-64ca455cc253","proxy":{"serverAdd":"10.0.0.6","serverPort":"4843","type":"kuaidaili","userName":null,"password":null,"area":null,"province":null,"city":null,"sid":null},"platformAccount":{"platformAccountId":"683fc3029e0d16d1e46d9f61","platformAuthorId":"77354322772","platformAccountName":"(˵¯͒〰¯͒˵)(*´I`*)","platformAccountSpaceId":"683fc3029e0d16d1e46d9f5f","parentId":null}}]};
//
//     Cloud.pushPublishLiteClientTask(taskSet as CloudPublishTaskVideoFromLite);
//     await Task.Delay(26*1000);
//
//     await Cloud.pushPublishLiteClientTask(taskSet as CloudPublishTaskVideoFromLite);
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );

test(
  '查询音乐',
  async () => {
    PubConfig.API_URL = 'https://www-test.yixiaoer.cn/api';
    const result = await new Cloud.QueryWorker(
      '66fa6b65f7867d1b4448a0c5:673ac4d2543415359ed6cb28',
      Platforms.ShiPinHao,
      {
        platformAccountSpaceId: '680f7e35e3161434d026bf9f',
        parentId: '680e2a9dc28713ce447ca98e',
        wxkey: 'ROWApSirxxzgN4nFmmWR1',
        platformAccountId: '680f7e35e3161434d026bfa1',
        cookie: '',
        platformAccountName: '',
        platformAuthorId: '',
      },
    ).searchMusic('爱你', '');
    console.log(result);
    await Task.Delay(40 * 60 * 1000);
  },
  40 * 60 * 1000,
);
test(
  '检测有效性',
  async () => {
    PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
    const result = await new Cloud.QueryWorker('66fa6b65f7867d1b4448a0c5:673ac4d2543415359ed6cb28', Platforms.DouYin, {
      platformAccountSpaceId: '6821e1be74478a5f26bced66',
      parentId: '',
      wxkey: 'ROWApSirxxzgN4nFmmWR1',
      platformAccountId: '680f7e35e3161434d026bfa1',
      cookie: '',
      platformAccountName: '',
      platformAuthorId: '',
    }).checkAccountAlive();
    console.log(result);
    await Task.Delay(40 * 60 * 1000);
  },
  40 * 60 * 1000,
);
test('在3个并发限制下，应该按照入队顺序和锁标识互斥的原则顺序执行', async () => {
  const scheduler = new PushingTaskScheduler(3);

  function push_task(lockIdentity: string, content: number) {
    return scheduler.push(
      new PushingScheduledTask(content.toString(), lockIdentity, async () => {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            console.log(`${new Date().toISOString()} task ${content} done`);
            resolve();
          }, 500);
        });
      }),
    );
  }

  // Mock timers
  vi.useFakeTimers();

  push_task('group1', 11);
  push_task('group1', 12);
  push_task('group1', 13);

  push_task('group2', 21);
  push_task('group2', 22);
  push_task('group2', 23);

  push_task('group3', 31);
  push_task('group3', 32);
  push_task('group3', 33);

  push_task('group4', 41);
  push_task('group4', 42);
  push_task('group4', 43);

  // Advance timers to ensure all tasks complete
  vi.advanceTimersByTime(5000);

  // Restore real timers
  vi.useRealTimers();
});

test('应该截停任务', async () => {
  const scheduler = new PushingTaskScheduler(3);

  const result: string[] = [];

  function push_task(lockIdentity: string, content: number) {
    return scheduler.push(
      new PushingScheduledTask(
        content.toString(),
        lockIdentity,
        async (setCancelCallback: (cancel: () => void) => void) => {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.log(`${new Date().toISOString()} task ${content} done`);
              result.push(`${new Date().toISOString()} task ${content} done`);
              resolve();
            }, 100);
            console.log(`${new Date().toISOString()} task ${content} started`);
            setCancelCallback(() => {
              console.log(`${new Date().toISOString()} task ${content} canceled`);
              clearTimeout(timeout);
              resolve();
            });
          });
        },
      ),
    );
  }

  // Mock timers
  vi.useFakeTimers();

  push_task('group1', 11);
  push_task('group1', 12);
  push_task('group1', 13);

  push_task('group2', 21);
  push_task('group2', 22);
  push_task('group2', 23);

  push_task('group3', 31);
  push_task('group3', 32);
  push_task('group3', 33);

  push_task('group4', 41);
  push_task('group4', 42);
  push_task('group4', 43);

  setTimeout(() => {
    scheduler.stop();
  }, 150);

  // Advance timers to ensure all tasks complete
  vi.advanceTimersByTime(500);

  // Restore real timers
  vi.useRealTimers();

  console.log(result);
  assert.isTrue(result.length < 12);
  assert.isTrue(result.length === 0);
});
