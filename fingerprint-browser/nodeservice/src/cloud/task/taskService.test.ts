import { beforeAll, describe, test } from 'vitest';
import { Cloud, CloudPublishTaskVideoFromLite } from '..';
import { PubContentEnum } from '../model/TypeEnum';
import { ArticleTaskSetForm } from '../model/UIFormModel';
import { PubConfig } from '@/Config';
import { eventBus } from '@/event/eventBus';
import os from 'os';
import { Platforms } from '@/service/datasync-service-manager';
import { Task } from '@/utils';

// describe('云发布文章任务', () => {
//   beforeAll(() => {
//     PubConfig.API_Token = 'Bm4LOHxy60mvIE7FOJ9xY';
//     PubConfig.xClient = 'desktop';
//     PubConfig.setUserDataPath(os.tmpdir());
//   });
//
//   test(
//     Platforms.BaiJiaHao,
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '67d3a26f6b954ff47db18b9d',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           verticalCover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {
//             ['百家号']: [
//               {
//                 id: '生活',
//                 text: '生活',
//                 raw: '生活',
//                 children: [],
//               },
//               {
//                 id: '生活vlog',
//                 text: '生活vlog',
//                 raw: '生活vlog',
//                 children: [],
//               },
//             ],
//           },
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: undefined,
//           isDraft: true,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.BaiJiaHao,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '67d3a26f6b954ff47db18b9d',
//               platformAuthorId: '1756246349170726',
//               platformAccountName: 'zhaoyan42',
//               platformAccountSpaceId: '67d3a26f6b954ff47db18b9b',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
//
//   test(
//     '头条号',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '681c21bf671136f2be3fc7fe',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {},
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: undefined,
//           isDraft: false,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.TouTiaoHao,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '681c21bf671136f2be3fc7fe',
//               platformAuthorId: '2722860873291772',
//               platformAccountName: '赵晏龙test',
//               platformAccountSpaceId: '681c21bf671136f2be3fc7fc',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
//
//   test(
//     '新浪微博',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '681c51a0671136f2be3fd175',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {},
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: undefined,
//           isDraft: true,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.XinLangWeiBo,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '681c51a0671136f2be3fd175',
//               platformAuthorId: '7820686643',
//               platformAccountName: '赵晏龙Test',
//               platformAccountSpaceId: '681c51a0671136f2be3fd173',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
//
//   test(
//     '知乎',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '681c63000cef8ddd171b339d',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {},
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: {
//             ['知乎']: [
//               {
//                 id: '19876200',
//                 text: '历史上的今天',
//                 raw: {
//                   introduction: '',
//                   avatar_url: 'https://pic1.zhimg.com/80/v2-40e779d5c5e6bcebda41e92d50594618_l.jpg?source=4e949a73',
//                   name: '历史上的今天',
//                   url: 'https://www.zhihu.com/topic/19876200',
//                   type: 'topic',
//                   excerpt: '',
//                   id: '19876200',
//                 },
//               },
//               {
//                 id: '21261857',
//                 text: '今天你学习了吗',
//                 raw: {
//                   introduction: '',
//                   avatar_url: 'https://picx.zhimg.com/80/v2-69f6bc30a1257df26296b4b71307d65b_l.jpg?source=4e949a73',
//                   name: '今天你学习了吗',
//                   url: 'https://www.zhihu.com/topic/21261857',
//                   type: 'topic',
//                   excerpt: '',
//                   id: '21261857',
//                 },
//               },
//               {
//                 id: '20171580',
//                 text: '爱今天',
//                 raw: {
//                   introduction: '',
//                   avatar_url: 'https://picx.zhimg.com/80/v2-40e779d5c5e6bcebda41e92d50594618_l.jpg?source=4e949a73',
//                   name: '爱今天',
//                   url: 'https://www.zhihu.com/topic/20171580',
//                   type: 'topic',
//                   excerpt: '',
//                   id: '20171580',
//                 },
//               },
//             ],
//           },
//           isDraft: true,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.ZhiHu,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '681c63000cef8ddd171b339d',
//               platformAuthorId: 'caaf3764d18173466fb4c256c3a156fc',
//               platformAccountName: '赵晏龙Test',
//               platformAccountSpaceId: '681c63000cef8ddd171b339b',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
//
//   test(
//     '企鹅号',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '681c6b460cef8ddd171b3722',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {},
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: undefined,
//           isDraft: true,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.QiEHao,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '681c6b460cef8ddd171b3722',
//               platformAuthorId: '24183621',
//               platformAccountName: '赵晏龙Test',
//               platformAccountSpaceId: '681c6b460cef8ddd171b3720',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
//
//   test(
//     '搜狐号',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '681c7a1b0cef8ddd171b3fbb',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {},
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: undefined,
//           isDraft: true,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.SouHuHao,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '681c7a1b0cef8ddd171b3fbb',
//               platformAuthorId: '121766811',
//               platformAccountName: '赵晏龙Test',
//               platformAccountSpaceId: '681c7a1b0cef8ddd171b3fb9',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
//
//   test(
//     '一点号',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '681c80aa2c9f9eaa0492f0c7',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {},
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: undefined,
//           isDraft: true,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.YiDianHao,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '681c80aa2c9f9eaa0492f0c7',
//               platformAuthorId: '4095649',
//               platformAccountName: '赵晏龙Test',
//               platformAccountSpaceId: '681c80aa2c9f9eaa0492f0c5',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
//
//   test(
//     '网易号',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '681d5b797ed044944a726d3d',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {},
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: undefined,
//           isDraft: true,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.WangYiHao,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '681d5b797ed044944a726d3d',
//               platformAuthorId: '13107214914',
//               platformAccountName: '赵晏龙Test',
//               platformAccountSpaceId: '681d5b797ed044944a726d3b',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
//
//   test(
//     '爱奇艺',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '681d60672a9056d736f417f7',
//             },
//           ],
//           cover: {
//             key: 'dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd',
//             width: 1920,
//             height: 1080,
//             size: 56548,
//           },
//           isFirst: false,
//           categories: {},
//           locationKeyword: '长沙',
//           title: '愉快的周末！！！',
//           content:
//             '<p style="text-align: left">这是一个愉快的周末</p><div style=""><img filekey="dev/t-67d11d6d5fc090468a960d6f/yfb/f08ba5fe-45da-45c7-ab16-ac6c536a55bd" src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\9cae4da3-fc7e-459c-a62a-04e0a6a3df5b.jpg"></div><p style="text-align: left"></p>',
//           timing: 0,
//           topic: undefined,
//           isDraft: true,
//         } as ArticleTaskSetForm,
//         data: [
//           {
//             taskId: '681b1428671136f2be3fb5b0',
//             platform: Platforms.AiQiYi,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '681d60672a9056d736f417f7',
//               platformAuthorId: '5542149131186176',
//               platformAccountName: '赵晏龙Test',
//               platformAccountSpaceId: '681d60672a9056d736f417f5',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681b1428671136f2be3fb5b0') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
// });

// describe('本地发布文章任务', () => {
//   test(
//     Platforms.BaiJiaHao,
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'article' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           topic: {
//             知乎: [],
//           },
//           locationKeyword: '',
//           accounts: [
//             {
//               accountId: '67d3a26f6b954ff47db18b9d',
//             },
//           ],
//           cover: {
//             path: 'C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\130f021d-b879-46c2-a29b-ccc9f65b5837.jpg',
//             width: 1280,
//             height: 720,
//             size: 84142,
//           },
//           verticalCover: {
//             path: 'C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\130f021d-b879-46c2-a29b-ccc9f65b5837.jpg',
//             width: 1280,
//             height: 720,
//             size: 84142,
//           },
//           categories: {
//             百家号: [],
//           },
//           isFirst: false,
//           title: '周末啦哈哈哈哈哈',
//           content:
//             '<p style="text-align: left">周末啦哈哈哈周末啦哈哈哈</p><div style=""><img src="yi-file://C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\130f021d-b879-46c2-a29b-ccc9f65b5837.jpg"></div><p style="text-align: left"></p>',
//           isDraft: true,
//         },
//         data: [
//           {
//             taskId: '681dd3e3bbdc58c5a35e7152',
//             platform: Platforms.BaiJiaHao,
//             wxkey: null,
//             platformAccount: {
//               platformAccountId: '67d3a26f6b954ff47db18b9d',
//               platformAuthorId: '1756246349170726',
//               platformAccountName: 'zhaoyan42',
//               platformAccountSpaceId: '67d3a26f6b954ff47db18b9b',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681dd3e3bbdc58c5a35e7152') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
// });
//
// describe('本地发布视频任务', () => {
//   test(
//     '抖音',
//     async () => {
//       const taskSet: CloudPublishTaskVideoFromLite = {
//         publishType: 'video' as PubContentEnum,
//         authToken: '67d11d6d5fc090468a960d6f:67d001c10661c32c6eec9836',
//         formData: {
//           accounts: [
//             {
//               accountId: '67d1264f2424ed4db3afed25',
//               cover: {
//                 path: 'C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\2d5240a2-1b20-4c4c-890d-35e5453cb14a.jpg',
//                 width: 1280,
//                 height: 720,
//                 size: 34553,
//               },
//               video: {
//                 path: 'C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\video\\c944376e-4bdc-4ecf-bcab-cd78b19205fc.mp4',
//                 duration: 81.015,
//                 width: 1280,
//                 height: 720,
//                 size: 30110908,
//               },
//             },
//           ],
//           aPlatform: {
//             title: '123123',
//             description: '',
//           },
//           bPlatform: {
//             title: '123123',
//             description: '',
//             tags: [],
//           },
//           isOriginal: false,
//           categories: {
//             知乎: [],
//             企鹅号: [],
//             爱奇艺: [],
//             网易号: [],
//             一点号: [],
//             哔哩哔哩: [],
//             搜狐号: [],
//           },
//           isDraft: true,
//         },
//         data: [
//           {
//             taskId: '681dbb56b961da8eef87e29e',
//             platform: Platforms.DouYin,
//             wxkey: null,
//             videoPath:
//               'C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\video\\c944376e-4bdc-4ecf-bcab-cd78b19205fc.mp4',
//             cover:
//               'C:\\Users\\yixiaoer\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\2d5240a2-1b20-4c4c-890d-35e5453cb14a.jpg',
//             platformAccount: {
//               platformAccountId: '67d1264f2424ed4db3afed25',
//               platformAuthorId: '66440788447979',
//               platformAccountName: '赵晏龙Test',
//               platformAccountSpaceId: '67d1264f2424ed4db3afed23',
//               parentId: null,
//             },
//           },
//         ],
//       };
//
//       console.debug('开始测试');
//
//       const finishPromise = new Promise<void>((resolve) => {
//         eventBus.on('publishFinished', (taskId: string) => {
//           if (taskId === '681dbb56b961da8eef87e29e') {
//             resolve();
//           }
//         });
//       });
//
//       await pushPublishLiteClientTask(taskSet);
//
//       await finishPromise;
//
//       console.debug('测试完成');
//     },
//     60 * 1000,
//   );
// });

// test(
//   '删除作品',
//   async () => {
//     const result = Cloud.pushOpenPlatformPublishTask(
//       {
//         publishType: 'video',
//         authorization: '1231231',
//         platform: [
//           {
//             id: '81231231237',
//             platformCode: Platforms.DouYin,
//             platformCookie:
//               'gfkadpd=2906,33638; _tea_utm_cache_2906=undefined; passport_csrf_token=c65afe8002e8996c7648de01ed4e40a4; passport_csrf_token_default=c65afe8002e8996c7648de01ed4e40a4; bd_ticket_guard_client_web_domain=2; passport_assist_user=CkEdzT9qsKP1a_fokhwbkYUR_PCvGpY5p9cqZAdi8mK36d4rlPbhWI8SHbNxFWH8UDt4Pk4QKIGujtSeg-ihpInPdRpKCjwAAAAAAAAAAAAAT3asyOkmaPZsMVBHXpl9WYGIaM91ZfkDX5qq7D_DAM_gDZZDAzE_pRt5a9jd21AZQaYQvPP7DRiJr9ZUIAEiAQMsL4_e; n_mh=9-mIeuD4wZnlYrrOvfzG3MuT6aQmCUtmr8FxV8Kl8xY; sid_guard=d41213ff5da03550475aeddf23b5d11b%7C1757580095%7C5184000%7CMon%2C+10-Nov-2025+08%3A41%3A35+GMT; uid_tt=c145d0014d968e537d266ab8a32697c4; uid_tt_ss=c145d0014d968e537d266ab8a32697c4; sid_tt=d41213ff5da03550475aeddf23b5d11b; sessionid=d41213ff5da03550475aeddf23b5d11b; sessionid_ss=d41213ff5da03550475aeddf23b5d11b; is_staff_user=true; sid_ucp_v1=1.0.0-KGFiNGNmMWYxMDY2M2Q0Nzg5MTE4NzBhMDY3OGJhYjkwNTViNDVkZWEKIQiMk5DRxs3rBBC_lorGBhjaFiAMMIjFmr4GOAdA9AdIBBoCbGYiIGQ0MTIxM2ZmNWRhMDM1NTA0NzVhZWRkZjIzYjVkMTFi; ssid_ucp_v1=1.0.0-KGFiNGNmMWYxMDY2M2Q0Nzg5MTE4NzBhMDY3OGJhYjkwNTViNDVkZWEKIQiMk5DRxs3rBBC_lorGBhjaFiAMMIjFmr4GOAdA9AdIBBoCbGYiIGQ0MTIxM2ZmNWRhMDM1NTA0NzVhZWRkZjIzYjVkMTFi; _bd_ticket_crypt_doamin=2; _bd_ticket_crypt_cookie=9b41fab212c5ea9a9a310fce3c1a5b72; __security_mc_1_s_sdk_sign_data_key_web_protect=70722a5d-46c8-ad53; __security_mc_1_s_sdk_cert_key=6cb07c59-4c87-94ac; __security_server_data_status=1; _tea_utm_cache_1128=undefined; x-web-secsdk-uid=731d6986-24d4-4ccd-9aae-9926ef13e41c; csrf_session_id=cb48d664d8f8d4aa1bab8e3f790f2738; biz_trace_id=bd4c5d3e; odin_tt=ff4a59e85e4d7f14d7344c9b0f00763275df06f25bb527b42df09969d49713b916118621a70ce1cb93aba8ced23b0716f1f6e8ab890af3ec4c7e54652af23c97; __security_mc_1_s_sdk_crypt_sdk=d4bfb773-4a38-9d2b; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCTlQyM0RYMSs1MytVdFh1V3Y0UzBuVGt4U1ROd1lQVDYyU3g2bjZ3bXpMVWwzUW1MdEtOeWxJWVBuc1FqWnpGdWhRQWhDT3lWM3h1ZjkyMTd1K0RtV2c9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; passport_fe_beating_status=true; session_tlb_tag=sttt%7C9%7C1BIT_12gNVBHWu3fI7XRG__________zSWyA1j4uo7yqvObuqdjWYtdpxitbGp3Fr3dZ3cHNiMc%3D; bd_ticket_guard_client_data_v2=eyJyZWVfcHVibGljX2tleSI6IkJOVDIzRFgxKzUzK1V0WHVXdjRTMG5Ua3hTVE53WVBUNjJTeDZuNndtekxVbDNRbUx0S055bElZUG5zUWpaekZ1aFFBaENPeVYzeHVmOTIxN3UrRG1XZz0iLCJ0c19zaWduIjoidHMuMi42M2NkOWNmMjhmMTU4OTRkY2Q5Nzc5NmE5YmUyYTc0MzNiNGY5NGNhZGFkOWZjOWRmNTc1ZGJlYTA0M2IwOTExYzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJzQlVSZEFVT204TnVQNERtaFJEVUVkRk1Bc1lHZEhkYkRaTmtMMS9uWG9FPSIsInNlY190cyI6IiNtUDdHbWNaa2xaRGJEYngyeFRHZlBERTk0bmliNnJoeU51UmhoTkR1Z0dXOWg1SVlzRXhHSnRKamhzYXkifQ%3D%3D; gd_random=eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC4xMzY0Mzg2MDMzOTE4Mjc0NX0=.RTsbOyViUMnc/VHR19vzdQ1tishZ2GM6i81OpGbcP60=; ttwid=1%7CdWOd_N3v8f5nFu9L47kCSzPdroIsnAfaSSZH9pM8vWU%7C1757640953%7Cc4670ebd221ece635936ef755bbb2bbf3710c9a969f9460a678ef38434a2b036',
//           },
//         ],
//         tasks: [
//           {
//             taskId: '7',
//             authorInfo: {
//               platform: Platforms.DouYin,
//               id: '81231231237',
//             },
//             publishData: {
//               video: {
//                 localPath: 'I:\\download\\bc19ad1b-c014-475a-8b59-01ad8855e774123.mp4',
//                 url: '',
//                 width: 1024,
//                 height: 768,
//                 duration: 120,
//                 size: 123,
//               },
//               covers: [
//                 {
//                   pathOrUrl: 'I:\\download\\20250707-171022.jpg',
//                   url: '',
//                   width: 1024,
//                   height: 768,
//                   size: 123,
//                 },
//               ],
//               title: '我是标题啊',
//               desc: '<p>我是<topic text="辣条">#ahsh#</topic>描述啊</p ><p><friend raw=\'{"yixiaoerId":"2510911478709149","yixiaoerName":"王者荣耀桑杰","yixiaoerImage":"https://p11.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","raw":{"avatar_larger":{"uri":"1080x1080/aweme-avatar/mosaic-legacy_310490000be14d67b1221","url_list":["https://p11.douyinpic.com/aweme/1080x1080/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p26.douyinpic.com/aweme/1080x1080/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p3.douyinpic.com/aweme/1080x1080/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662"]},"avatar_medium":{"uri":"720x720/aweme-avatar/mosaic-legacy_310490000be14d67b1221","url_list":["https://p11.douyinpic.com/aweme/720x720/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p26.douyinpic.com/aweme/720x720/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p3.douyinpic.com/aweme/720x720/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662"]},"avatar_thumb":{"uri":"100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221","url_list":["https://p11.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p26.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p3.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662"]},"aweme_count":2344,"card_entries":null,"custom_verify":"","enterprise_verify_reason":"","favoriting_count":911,"follow_status":0,"follower_count":6231916,"follower_status":0,"followers_detail":null,"following_count":189,"geofencing":null,"has_orders":false,"is_ad_fake":false,"is_enterprise_vip":true,"is_gov_media_vip":false,"mix_info":null,"nickname":"王者荣耀桑杰","original_musician":{"music_count":0,"music_used_count":0},"platform_sync_info":null,"policy_version":null,"rate":1,"region":"CN","sec_uid":"MS4wLjABAAAAH0Muz9yuNuxbK94G2D0qnBbG68a4sUszfiji49ym19TjR8bhXwpAqORdzmW2fr6G","secret":0,"short_id":"2834154573","signature":"百段国服主播陪🥣V：2934352 （9.9体验）\\\\n88 3小时国服车队🚗V：4629810\\\\n自家工作室🛰️: timi3088\\\\n处理工作室订单问题🛰️: 5317745\\\\n国服最帅元歌","status":1,"story_open":false,"total_favorited":"316619066","type_label":[188,6916890329354340000,6972482242996079000,6990279189752449000,7381313570765556000],"uid":"2510911478709149","unique_id":"hrj011221","user_canceled":false,"verification_type":1,"video_icon":{"uri":"","url_list":[]},"with_commerce_entry":false,"with_fusion_shop_entry":true,"with_shop_entry":false}}\'></friend>你好啊</p>',
//               visibleType: 1,
//               // group_shopping:{
//               //   sale_title:'推荐这个哦',
//               //   brand_switch_value:2,
//               //   data:{
//               //     "yixiaoerId": "1809693503342601",
//               //     "yixiaoerName": "星巴克经典咖啡大杯单杯团购券 z",
//               //     "yixiaoerDesc": "星巴克咖啡(北京苑景路店)",
//               //     "yixiaoerImageUrl": "https://p3-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=nIXYU4m9KK3AC%2Fy7CarfdX7aB7Y%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//               //     "price": 3600,
//               //     "earnPrice": 0,
//               //     "images": [
//               //       "https://p3-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=nIXYU4m9KK3AC%2Fy7CarfdX7aB7Y%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//               //       "https://p26-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=Cveey4%2F0%2Bbmb3U20RjevIAXj4dg%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//               //       "https://p9-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=8FMOYZ39D83DAH%2BqLVJqVUC%2BAB0%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89"
//               //     ],
//               //     "raw": {
//               //       "actual_price": 3600,
//               //       "alliance_task_detail_list": [],
//               //       "blur_sale_count": "月售 14",
//               //       "blur_sale_count_l30": "14",
//               //       "common_anchor_content": "{}",
//               //       "discount": "",
//               //       "display_cps": {
//               //         "earn_price": 0,
//               //         "take_rate": 0,
//               //         "take_rate_range": []
//               //       },
//               //       "earn_price": 0,
//               //       "image_url": {
//               //         "uri": "tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0",
//               //         "url_list": [
//               //           "https://p3-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=nIXYU4m9KK3AC%2Fy7CarfdX7aB7Y%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//               //           "https://p26-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=Cveey4%2F0%2Bbmb3U20RjevIAXj4dg%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//               //           "https://p9-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=8FMOYZ39D83DAH%2BqLVJqVUC%2BAB0%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89"
//               //         ]
//               //       },
//               //       "is_clue": false,
//               //       "is_member_exclusive_product": true,
//               //       "poi": {
//               //         "Staturated_tags": null,
//               //         "channel_exclusive": null,
//               //         "cps_commission_rate_range": null,
//               //         "cps_commission_value_range": null,
//               //         "effect_ids": null,
//               //         "fulfill_task_list": null,
//               //         "icon_service_type_list": null,
//               //         "poi_detail_tags": null,
//               //         "poi_frontend_type": null,
//               //         "poi_id": "7267823187692357669",
//               //         "poi_name": "星巴克咖啡(北京苑景路店)",
//               //         "poi_ranks": null,
//               //         "poi_search_tags": null,
//               //         "poi_search_tags_v2": null,
//               //         "service_type_list": null,
//               //         "voucher_release_areas": null
//               //       },
//               //       "poi_count": 200,
//               //       "product_biz_line": 1,
//               //       "product_type": 1,
//               //       "promote_spu_user_cnt": 124,
//               //       "sale_price": 3600,
//               //       "show_type": 1,
//               //       "sold": 4108,
//               //       "sold_l30": 14,
//               //       "spu_entry": {
//               //         "schema_type": 3,
//               //         "url": "aweme://webview/?url=https%3A%2F%2Faweme.snssdk.com%2Finsights%2Frn%2Fgroupon_detail%3Fhide_nav_bar%3D1%26enter_from%3Dpoi%26groupon_channel%3Dlink%26activity_id%3D1809693503342601&rn_schema=aweme%3A%2F%2Freactnative%2F%3Fchannel%3Dmp_lynx_groupon_detail%26bundle%3Dindex.js%26module_name%3Dpage_groupon_detail%26enter_from%3Dpoi%26groupon_channel%3Dlink%26activity_id%3D1809693503342601%26hide_nav_bar%3D1"
//               //       },
//               //       "spu_id": "1809693503342601",
//               //       "spu_marketing": {
//               //         "coupon_types": null,
//               //         "spu_marketing_tags": null
//               //       },
//               //       "spu_name": "星巴克经典咖啡大杯单杯团购券 z",
//               //       "spu_tags": {
//               //         "source": {
//               //           "name": "官方",
//               //           "style": "official",
//               //           "type": 1
//               //         }
//               //       },
//               //       "spu_tags_list": null,
//               //       "stock": 498883,
//               //       "tag": {
//               //         "name": "官方",
//               //         "style": "official",
//               //         "type": 1
//               //       },
//               //       "take_rate": 0,
//               //       "track_params": "{\"product_sub_type\":0,\"product_type\":1}"
//               //     }
//               //   }
//               // },
//               // shopping_cart: [
//               //   {
//               //     sale_title: '好吃的辣条',
//               //     data: {
//               //       yixiaoerId: '3737435203463938262',
//               //       yixiaoerName: '【爆款牙线】一次性牙线棒50支一盒超细高弹力护理便携顺滑家用牙线',
//               //       yixiaoerDesc: '',
//               //       yixiaoerImageUrl:
//               //         'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908',
//               //       price: 100,
//               //       earnPrice: 21,
//               //       images: [
//               //         'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908',
//               //         'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=ctJxqnEnv5Nc8yxLt%2BV7x6vQ8ow%3D&from=3604061908',
//               //         'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=R6S9e%2FbLm1Y1mkYtVO2l2%2FnRkas%3D&from=3604061908',
//               //         'https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=GoUzfgySpIHgNO0edg%2FWtZi366w%3D&from=3604061908',
//               //         'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=PrexYDRB%2FalNPi0GQ%2BMC0eKOXu0%3D&from=3604061908',
//               //       ],
//               //       raw: {
//               //         brand_icon: {
//               //           uri: 'https://lf26-cm.ecombdstatic.com/obj/temai/ab_c4aef1247a86892270679b66a6a1cdd8',
//               //           url_list: [
//               //             'https://lf26-cm.ecombdstatic.com/obj/temai/ab_c4aef1247a86892270679b66a6a1cdd8',
//               //             'https://lf26-cm.ecombdstatic.com/obj/temai/ab_c4aef1247a86892270679b66a6a1cdd8',
//               //             'https://lf26-cm.ecombdstatic.com/obj/temai/ab_c4aef1247a86892270679b66a6a1cdd8',
//               //           ],
//               //         },
//               //         cos_fee: 21,
//               //         cos_radio: 21,
//               //         elastic_img: null,
//               //         elastic_title: '',
//               //         extra: '',
//               //         gid: '3737059161872138533',
//               //         goods_imgs: [
//               //           {
//               //             elastic_img: {
//               //               uri: 'ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080',
//               //               url_list: [
//               //                 'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908',
//               //                 'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=5tnee0C6jD3s58GXf9sSpj7%2BZuU%3D&from=3604061908',
//               //                 'https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=f2T8Z8ESuMqVNx%2B6LGauSnUFkw0%3D&from=3604061908',
//               //               ],
//               //             },
//               //           },
//               //           {
//               //             elastic_img: {
//               //               uri: 'ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080',
//               //               url_list: [
//               //                 'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=5tnee0C6jD3s58GXf9sSpj7%2BZuU%3D&from=3604061908',
//               //                 'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908',
//               //                 'https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=sHqr4K2bdoHhpNlERgzqc%2FQ3b84%3D&from=3604061908',
//               //               ],
//               //             },
//               //           },
//               //           {
//               //             elastic_img: {
//               //               uri: 'ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800',
//               //               url_list: [
//               //                 'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=ctJxqnEnv5Nc8yxLt%2BV7x6vQ8ow%3D&from=3604061908',
//               //                 'https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=QHJ8XeGf7HFVNha2Q4ptr4FMncQ%3D&from=3604061908',
//               //                 'https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=Ev%2BcZDotx0FDPu3is%2FwUx2dNDms%3D&from=3604061908',
//               //               ],
//               //             },
//               //           },
//               //           {
//               //             elastic_img: {
//               //               uri: 'ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800',
//               //               url_list: [
//               //                 'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=R6S9e%2FbLm1Y1mkYtVO2l2%2FnRkas%3D&from=3604061908',
//               //                 'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=hkwtCJuCGWIRsKRs%2BkyQMtEDTGU%3D&from=3604061908',
//               //                 'https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=plkKWsqzvhb3TbcdXYTjYNe25Lg%3D&from=3604061908',
//               //               ],
//               //             },
//               //           },
//               //           {
//               //             elastic_img: {
//               //               uri: 'ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800',
//               //               url_list: [
//               //                 'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=i8TpzHSJt9Ipr7MqOFgKG6zlldQ%3D&from=3604061908',
//               //                 'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=Rm40d6kTr0c%2BmGWcOHnRCELS5TM%3D&from=3604061908',
//               //                 'https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=GoUzfgySpIHgNO0edg%2FWtZi366w%3D&from=3604061908',
//               //               ],
//               //             },
//               //           },
//               //           {
//               //             elastic_img: {
//               //               uri: 'ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800',
//               //               url_list: [
//               //                 'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=FmNbEEPidI9IyAbw3Ci8TNrgJo4%3D&from=3604061908',
//               //                 'https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=3hY3CjQGiREV2lziekGnxekcSgc%3D&from=3604061908',
//               //                 'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=PrexYDRB%2FalNPi0GQ%2BMC0eKOXu0%3D&from=3604061908',
//               //               ],
//               //             },
//               //           },
//               //         ],
//               //         imgs: [
//               //           {
//               //             uri: 'ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080',
//               //             url_list: [
//               //               'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908',
//               //               'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=5tnee0C6jD3s58GXf9sSpj7%2BZuU%3D&from=3604061908',
//               //               'https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=f2T8Z8ESuMqVNx%2B6LGauSnUFkw0%3D&from=3604061908',
//               //             ],
//               //           },
//               //           {
//               //             uri: 'ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800',
//               //             url_list: [
//               //               'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=ctJxqnEnv5Nc8yxLt%2BV7x6vQ8ow%3D&from=3604061908',
//               //               'https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=Ev%2BcZDotx0FDPu3is%2FwUx2dNDms%3D&from=3604061908',
//               //               'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=8aC1V6oN3jpROnR0NDgKIadTWpI%3D&from=3604061908',
//               //             ],
//               //           },
//               //           {
//               //             uri: 'ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800',
//               //             url_list: [
//               //               'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=R6S9e%2FbLm1Y1mkYtVO2l2%2FnRkas%3D&from=3604061908',
//               //               'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=hkwtCJuCGWIRsKRs%2BkyQMtEDTGU%3D&from=3604061908',
//               //               'https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=4nj%2F7jvYRjEJ5%2F1L1ggX%2F5zuPB4%3D&from=3604061908',
//               //             ],
//               //           },
//               //           {
//               //             uri: 'ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800',
//               //             url_list: [
//               //               'https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=GoUzfgySpIHgNO0edg%2FWtZi366w%3D&from=3604061908',
//               //               'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=Rm40d6kTr0c%2BmGWcOHnRCELS5TM%3D&from=3604061908',
//               //               'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=i8TpzHSJt9Ipr7MqOFgKG6zlldQ%3D&from=3604061908',
//               //             ],
//               //           },
//               //           {
//               //             uri: 'ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800',
//               //             url_list: [
//               //               'https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=PrexYDRB%2FalNPi0GQ%2BMC0eKOXu0%3D&from=3604061908',
//               //               'https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=3hY3CjQGiREV2lziekGnxekcSgc%3D&from=3604061908',
//               //               'https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=FmNbEEPidI9IyAbw3Ci8TNrgJo4%3D&from=3604061908',
//               //             ],
//               //           },
//               //         ],
//               //         item_type: 4,
//               //         label: null,
//               //         market_price: 1300,
//               //         price: 100,
//               //         promotion_id: '3737435203463938262',
//               //         promotion_source: 4,
//               //         sales: 9261,
//               //         title: '【爆款牙线】一次性牙线棒50支一盒超细高弹力护理便携顺滑家用牙线',
//               //         url: 'https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html?id=3737059161872138533&origin_type=2631',
//               //       },
//               //     },
//               //   },
//               // ],
//             },
//           },
//         ],
//         callBackData: {},
//       },
//       '123',
//     );
//     console.log(JSON.stringify(result, null, 2));
//     await Task.Delay(40 * 60 * 1000);
// );
//
// test(
//   '概览数据',
//   async () => {
//     PubConfig.xClient = 'desktop';
//     PubConfig.API_URL = 'https://lj-dev.yixiaoer.cn';
//     PubConfig.API_Token = '2lvxHbE4Y-6kfDARdgNjN';
//     const result = Cloud.pushDataSyncTask(Platforms.XiaoHongShu, 'accountOverView', {
//       platformAccountSpaceId: '672448914f1be59dcb6a56d9',
//       parentId: '',
//       wxkey: '',
//       platformAccountId: '605418e20000000001008a3e',
//       cookie:
//         '[{"name":"acw_tc","value":"0a0d0d6817531517744866547e4dbe8305afbb94a2327daec263a61bdcb5c5","domain":"creator.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753153574.880367,"sameSite":"unspecified"},{"name":"xsecappid","value":"ugc","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784687800,"sameSite":"unspecified"},{"name":"a1","value":"1982ffd24df1n7zgx9tk2e6a1fp4zw70ruz1k6mj750000363294","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784687775,"sameSite":"unspecified"},{"name":"webId","value":"46e13b06c774ce94f6841f69898f1230","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784687775,"sameSite":"unspecified"},{"name":"acw_tc","value":"0a00dadb17531517758262396e76bf94d240e5fd557a60fcc517f745c01391","domain":"www.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753153576.222605,"sameSite":"unspecified"},{"name":"acw_tc","value":"0ad5952b17531517758434484e59e3d979a0c6a1bfe43b3a03548d8fa9fc06","domain":"edith.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753153576.248736,"sameSite":"unspecified"},{"name":"websectiga","value":"7750c37de43b7be9de8ed9ff8ea0e576519e8cd2157322eb972ecb429a7735d4","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1753410976,"sameSite":"unspecified"},{"name":"sec_poison_id","value":"114c90f8-22fe-48be-9612-00bbacb4f876","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1753152381,"sameSite":"unspecified"},{"name":"acw_tc","value":"0a0d0fba17531517759927299e1a142b02b9859f13123dc7d72dc694ed12a0","domain":"customer.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753153576.399962,"sameSite":"unspecified"},{"name":"gid","value":"yjYJiifqY2FdyjYJiifJ47K6fiyIWukCj9TJuVWdK0yiUy284uEW8T888qKqJj480DKJD8Ky","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1787711781.364385,"sameSite":"unspecified"},{"name":"customer-sso-sid","value":"68c517529729641957840940lp4dpnl7tfm4zskk","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753756598.660568,"sameSite":"unspecified"},{"name":"x-user-id-creator.xiaohongshu.com","value":"605418e20000000001008a3e","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1787711799.660637,"sameSite":"unspecified"},{"name":"customerClientId","value":"061074762840371","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1787711799.660663,"sameSite":"unspecified"},{"name":"access-token-creator.xiaohongshu.com","value":"customer.creator.AT-68c517529729641957840941ojyrnwassjx5btzb","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1755743798.660685,"sameSite":"unspecified"},{"name":"galaxy_creator_session_id","value":"2efEoNpoSEURMI28FHOuFTcO8iRIdGwh89fR","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1755743799.660706,"sameSite":"unspecified"},{"name":"galaxy.creator.beaker.session.id","value":"1753151799197065374268","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1755743799.660727,"sameSite":"unspecified"}]',
//       platformAccountName: '',
//       platformAuthorId: '',
//     });
//     console.log('有效性检测', result);
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// test(
//   '作品数据',
//   async () => {
//     PubConfig.xClient = 'desktop';
//     PubConfig.API_URL = 'https://lj-dev.yixiaoer.cn';
//     PubConfig.API_Token = '2lvxHbE4Y-6kfDARdgNjN';
//     const result = Cloud.pushDataSyncTask(Platforms.XiaoHongShu, 'contentList', {
//       platformAccountSpaceId: '672448914f1be59dcb6a56d9',
//       parentId: '',
//       wxkey: '',
//       platformAccountId: '605418e20000000001008a3e',
//       cookie:
//         '[{"name":"acw_tc","value":"0a0d0d6817531517744866547e4dbe8305afbb94a2327daec263a61bdcb5c5","domain":"creator.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753153574.880367,"sameSite":"unspecified"},{"name":"xsecappid","value":"ugc","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784687800,"sameSite":"unspecified"},{"name":"a1","value":"1982ffd24df1n7zgx9tk2e6a1fp4zw70ruz1k6mj750000363294","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784687775,"sameSite":"unspecified"},{"name":"webId","value":"46e13b06c774ce94f6841f69898f1230","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784687775,"sameSite":"unspecified"},{"name":"acw_tc","value":"0a00dadb17531517758262396e76bf94d240e5fd557a60fcc517f745c01391","domain":"www.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753153576.222605,"sameSite":"unspecified"},{"name":"acw_tc","value":"0ad5952b17531517758434484e59e3d979a0c6a1bfe43b3a03548d8fa9fc06","domain":"edith.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753153576.248736,"sameSite":"unspecified"},{"name":"websectiga","value":"7750c37de43b7be9de8ed9ff8ea0e576519e8cd2157322eb972ecb429a7735d4","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1753410976,"sameSite":"unspecified"},{"name":"sec_poison_id","value":"114c90f8-22fe-48be-9612-00bbacb4f876","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1753152381,"sameSite":"unspecified"},{"name":"acw_tc","value":"0a0d0fba17531517759927299e1a142b02b9859f13123dc7d72dc694ed12a0","domain":"customer.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753153576.399962,"sameSite":"unspecified"},{"name":"gid","value":"yjYJiifqY2FdyjYJiifJ47K6fiyIWukCj9TJuVWdK0yiUy284uEW8T888qKqJj480DKJD8Ky","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1787711781.364385,"sameSite":"unspecified"},{"name":"customer-sso-sid","value":"68c517529729641957840940lp4dpnl7tfm4zskk","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1753756598.660568,"sameSite":"unspecified"},{"name":"x-user-id-creator.xiaohongshu.com","value":"605418e20000000001008a3e","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1787711799.660637,"sameSite":"unspecified"},{"name":"customerClientId","value":"061074762840371","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1787711799.660663,"sameSite":"unspecified"},{"name":"access-token-creator.xiaohongshu.com","value":"customer.creator.AT-68c517529729641957840941ojyrnwassjx5btzb","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1755743798.660685,"sameSite":"unspecified"},{"name":"galaxy_creator_session_id","value":"2efEoNpoSEURMI28FHOuFTcO8iRIdGwh89fR","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1755743799.660706,"sameSite":"unspecified"},{"name":"galaxy.creator.beaker.session.id","value":"1753151799197065374268","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1755743799.660727,"sameSite":"unspecified"}]',
//       platformAccountName: '',
//       platformAuthorId: '',
//       authorization: '123132123',
//     });
//     console.log('有效性检测', result);
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// test(
//   '有效性检测',
//   async () => {
//     PubConfig.xClient = 'desktop';
//     PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
//     PubConfig.API_Token = '2lvxHbE4Y-6kfDARdgNjN';
//     const result = await new Cloud.QueryWorker('2lvxHbE4Y-6kfDARdgNjN', Platforms.DouYin, {
//       platformAccountSpaceId: '672448914f1be59dcb6a56d9',
//       parentId: '',
//       wxkey: '',
//       platformAccountId: '672448914f1be59dcb6a56db',
//       cookie: '',
//       platformAccountName: '',
//       platformAuthorId: '',
//     }).checkAccountAlive();
//     console.log('有效性检测', result);
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// test(
//   '获取地址',
//   async () => {
//     PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
//     const result = await new Cloud.QueryWorker(
//       '66fa6b65f7867d1b4448a0c5:673ac4d2543415359ed6cb28',
//       Platforms.ShiPinHao,
//       {
//         platformAccountSpaceId: '6821e6b374478a5f26bcf8af',
//         parentId: '',
//         wxkey: '',
//         platformAccountId: '68520e319b85583ec6df702c',
//         cookie: '',
//         platformAccountName: '',
//         platformAuthorId: '',
//       },
//     ).searchLocation({ keyWord: '天府广场' });
//     console.log(result);
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// test(
//   '数据同步',
//   async () => {
//     PubConfig.API_URL = 'https://www-test.yixiaoer.cn/api';
//     const result = await new Cloud.QueryWorker(
//       '66fa6b65f7867d1b4448a0c5:673ac4d2543415359ed6cb28',
//       Platforms.ShiPinHao,
//       {
//         platformAccountSpaceId: '',
//         parentId: '',
//         wxkey: '',
//         platformAccountId: '683fc3029e0d16d1e46d9f61',
//         cookie:
//           'passport_csrf_token=9c623f4b392315bc18ca004c661a6b4c; passport_csrf_token_default=9c623f4b392315bc18ca004c661a6b4c; bd_ticket_guard_client_web_domain=2; passport_mfa_token=CjUbSdFIr43rWuuDRy0fr880JqufAh2k2hgBik%2BcZNUxTWNHsZUp0KXbrqYHPSfw1I2c%2BSrGOxpKCjwAAAAAAAAAAAAATxPEykZgkfU%2BN27TetqGpc7OTBmLWg3FHNso13K56m8qjB0u5YfSOywQnEaLI3F4M7kQ0pbzDRj2sdFsIAIiAQPqLd8p; d_ticket=54504312ef1f5cdb433da5cdcfc3ffbed40bf; n_mh=byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4; is_staff_user=false; x-web-secsdk-uid=9a6d70f3-0241-4b5c-a2df-943e9bc3b5af; csrf_session_id=fc267ff5c9b5a3f96c05d136b706fbba; _bd_ticket_crypt_doamin=2; __security_server_data_status=1; uuid_for_login=1750055585551_3g1ws6mzzak; passport_fe_beating_status=true; biz_trace_id=cbcf341d; odin_tt=5a67a5cfac437f95d8b0faca1d4a582d1928f0b712b4fbb07042d3dd2e0e98df5448d3aff78b7b4f3c73bd099764f62d; passport_assist_user=CjzE1Yubwjd0eLuBPlhbNBJ1fFnkONSMLnjbTn884wt0LoIjdYn4I6SoJ3WrB0z3yF50894HRV57XCAoHoMaSgo8AAAAAAAAAAAAAE8fg6pX6n-PtaripGEQ-g35ggiPwF2W36Lj_JaF4eLHd-Heh6RejjGmhqT9Oy3N3AjwEN2f9A0Yia_WVCABIgEDGIIilQ%3D%3D; sid_guard=f985ef121407032c79a1857092504672%7C1750055856%7C5184000%7CFri%2C+15-Aug-2025+06%3A37%3A36+GMT; uid_tt=99864404e9c2bbc22caa60b65af7d52c; uid_tt_ss=99864404e9c2bbc22caa60b65af7d52c; sid_tt=f985ef121407032c79a1857092504672; sessionid=f985ef121407032c79a1857092504672; sessionid_ss=f985ef121407032c79a1857092504672; sid_ucp_v1=1.0.0-KGMxZjgzMTAwZmE4NWE3YTQ0Mzc4M2QyMWU5NTEzZTQ5NDc1NzYzYjIKHwjUlrWVoAIQsPe-wgYY2hYgDDCJ4uPQBTgHQPQHSAQaAmxmIiBmOTg1ZWYxMjE0MDcwMzJjNzlhMTg1NzA5MjUwNDY3Mg; ssid_ucp_v1=1.0.0-KGMxZjgzMTAwZmE4NWE3YTQ0Mzc4M2QyMWU5NTEzZTQ5NDc1NzYzYjIKHwjUlrWVoAIQsPe-wgYY2hYgDDCJ4uPQBTgHQPQHSAQaAmxmIiBmOTg1ZWYxMjE0MDcwMzJjNzlhMTg1NzA5MjUwNDY3Mg; _bd_ticket_crypt_cookie=effa1552b210236c747580e757fdfd11; __security_mc_1_s_sdk_crypt_sdk=88f3c1c7-4a20-a551; __security_mc_1_s_sdk_sign_data_key_web_protect=a6d5a85c-4ffa-9904; __security_mc_1_s_sdk_cert_key=8428370a-4fae-835f; ttwid=1%7CTHZcu1mPHhKavvkB3mT-hZkie43fARZywcPCuEEjLuI%7C1750290459%7Cba26bea823867fcae5fa4993d62f4c7d528d2391d5c4fa253bbd09c7c4a56b95; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCQzlaMEdZR05aaVJib2lCOW1FS1Q1bFZzMkdTanF4SDYzQ29kTjVVRWdLYXRQQXFkNzYxeGpEcmRyV3M1eExOOWwvOXd2TnZqaldsT3Nwa2xncTBONTg9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D',
//         platformAccountName: '',
//         platformAuthorId: '',
//       },
//     ).getAccountOverViewReportData();
//     console.log(result);
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// describe('内容列表数据', () => {
//   test(
//     '数据同步',
//     async () => {
//       PubConfig.API_URL = 'https://www-test.yixiaoer.cn/api';
//       const result = await new Cloud.QueryWorker(
//         '66fa6b65f7867d1b4448a0c5:673ac4d2543415359ed6cb28',
//         Platforms.DouYin,
//         {
//           platformAccountSpaceId: '',
//           parentId: '',
//           wxkey: '',
//           platformAccountId: '683fc3029e0d16d1e46d9f61',
//           cookie:
//             'bd_ticket_guard_client_web_domain=2; n_mh=byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4; is_staff_user=false; store-region=cn-sc; store-region-src=uid; passport_csrf_token=0f199f22dd5b41e4d41b5c55f4c394dc; passport_csrf_token_default=0f199f22dd5b41e4d41b5c55f4c394dc; __security_mc_1_s_sdk_crypt_sdk=8518d13d-4eea-8377; x-web-secsdk-uid=e92b3402-ed02-433b-8653-06faadfefd97; csrf_session_id=60ef720ed8eb1185553420ebd650ba58; uuid_for_login=1751946177144_q1obe6ubm3s; gfkadpd=2906,33638; csrf_session_id=60ef720ed8eb1185553420ebd650ba58; _tea_utm_cache_2906=undefined; __security_mc_1_s_sdk_cert_key=dfa9fbb7-483c-a17e; biz_trace_id=a41f7e15; passport_assist_user=Cjzu_rBAF1T1U1R3JWZ1_qdBBcHcgQdHrFCcS-QLQgSI2Tg3qciM2hyFcbUDT5-iLIc_-LFJmFVA_hctWakaSgo8AAAAAAAAAAAAAE81s5tAnFFIwJWwnA0j-JGxum9ojQHiHX3PISyUc6CbY_TrOldsLBavbkrARKR-_g6rEKyU9g0Yia_WVCABIgEDc2zSfg%3D%3D; sid_guard=8c652cd5460517ba13f70003ac5fe4a0%7C1751946244%7C5184000%7CSat%2C+06-Sep-2025+03%3A44%3A04+GMT; uid_tt=aab7f183750914a50d5177812ccd84d1; uid_tt_ss=aab7f183750914a50d5177812ccd84d1; sid_tt=8c652cd5460517ba13f70003ac5fe4a0; sessionid=8c652cd5460517ba13f70003ac5fe4a0; sessionid_ss=8c652cd5460517ba13f70003ac5fe4a0; sid_ucp_v1=1.0.0-KDQ2NDE1ZWZiNjZhZWE1NDUyMzRmNjNkY2I3YmE2OGFiZmViZmZkOTcKHwjUlrWVoAIQhKiywwYY2hYgDDCJ4uPQBTgHQPQHSAQaAmxmIiA4YzY1MmNkNTQ2MDUxN2JhMTNmNzAwMDNhYzVmZTRhMA; ssid_ucp_v1=1.0.0-KDQ2NDE1ZWZiNjZhZWE1NDUyMzRmNjNkY2I3YmE2OGFiZmViZmZkOTcKHwjUlrWVoAIQhKiywwYY2hYgDDCJ4uPQBTgHQPQHSAQaAmxmIiA4YzY1MmNkNTQ2MDUxN2JhMTNmNzAwMDNhYzVmZTRhMA; _bd_ticket_crypt_doamin=2; _bd_ticket_crypt_cookie=e29fe5a82408798bf24040784b4dc7ec; __security_mc_1_s_sdk_sign_data_key_web_protect=958eb448-436d-b2c2; __security_server_data_status=1; odin_tt=b93d8c5e77d65bb87cd5f1e40641e366997567f029e70801c37e5749f79a642f283cac47ad767c625e77a37cfc89b00a; passport_fe_beating_status=false; gd_random=eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC45MjM0NzAzOTIzNjM0OTkxfQ==.B79yLy6lRWgd3Q3NCEJNMp+oDxjhKHuZZkXw6zBC1HE=; ttwid=1%7CMqWVsSrBMdQNENFG780-RCBUjJEh4QO0JJN7yoWQLB0%7C1751964599%7Cb5996e179bbcc25c80ea69d72aeedeb31b19e0d1db65fe7dfc8d41cd03b13e34; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCT2xrWnVXRHJ1eW8zbFYvZlRUUFRwa3dPdUhGeXFyemtTMzNNMHhQcUJxSlNtWGpZdjBNZUV0eEkrakx0WEFOdjNaUkFPZ0UrM2xsbnR3Smkvdzh5NlU9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D',
//           platformAccountName: '',
//           platformAuthorId: '',
//         },
//       ).getAccountContentListView();
//       console.log(result);
//       await Task.Delay(40 * 60 * 1000);
//     },
//     40 * 60 * 1000,
//   );
// });
//
// test(
//   '获取用户信息',
//   async () => {
//     PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
//     const result = await new Cloud.QueryWorker(
//       '66fa6b65f7867d1b4448a0c5:673ac4d2543415359ed6cb28',
//       Platforms.WangYiHao,
//       {
//         platformAccountSpaceId: '6821e6b374478a5f26bcf8af',
//         parentId: '',
//         wxkey: '',
//         platformAccountId: '680f7e35e3161434d026bfa1',
//         cookie:
//           '_ntes_origin_from=; _ntes_nuid=b32f306d2f83fec12fe3ee8e1971e9f8; _antanalysis_s_id=1739157221760; ntes_utid=tid._.Lf1g%252FvbOxn1BAlVVQBfDZf46vfVAHW4u._.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; NTES_P_UTID=B2HzVQePKRinUEB1TPtZKDNsTEDZHIKl|1747726916; NTES_YD_SESS=3RLxK6ehiNaXbCMqCbY_3sFqWftWKJGrU4my0XOInmXuCIEACNjlM8FSQKRvTz_s4LlbdUTWn3a96fxxO4tegiJM3sCHUkw_lOE_oK19swbaMgDyO.HtJTwUJ2OgFmoNUpM3pFiel1BTvZlOmbKgJ2FV8CuIQbs69rKNETsvmTKS.t.QaJ3e7SWQHnPpqddZqDgM3TwEUhyH9eqZdyyiiHrqzJXfd6dSoxzSJMWlYlcc_; S_INFO=1750407763|0|0&60##|18874070066; P_INFO=18874070066|1750407763|1|subscribe|00&99|hun&1749192940&subscribe#hun&430100#10#0#0|&0||18874070066; NTESwebSI=C704C154EF8B8D58F4710E42B432A4F2; NTESwebSI=C704C154EF8B8D58F4710E42B432A4F2',
//         platformAccountName: '',
//         platformAuthorId: '',
//       },
//     ).getUserInfo();
//     console.log(result);
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// test(
//   '获取发布分类',
//   async () => {
//     PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
//     const result = await new Cloud.QueryWorker(
//       '66fa6b65f7867d1b4448a0c5:673ac4d2543415359ed6cb28',
//       Platforms.WangYiHao,
//       {
//         platformAccountSpaceId: '6821e6b374478a5f26bcf8af',
//         parentId: '',
//         wxkey: '',
//         platformAccountId: '680f7e35e3161434d026bfa1',
//         cookie:
//           '_ntes_origin_from=; _ntes_nuid=b32f306d2f83fec12fe3ee8e1971e9f8; _antanalysis_s_id=1739157221760; ntes_utid=tid._.Lf1g%252FvbOxn1BAlVVQBfDZf46vfVAHW4u._.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; NTES_P_UTID=B2HzVQePKRinUEB1TPtZKDNsTEDZHIKl|1747726916; NTES_YD_SESS=3RLxK6ehiNaXbCMqCbY_3sFqWftWKJGrU4my0XOInmXuCIEACNjlM8FSQKRvTz_s4LlbdUTWn3a96fxxO4tegiJM3sCHUkw_lOE_oK19swbaMgDyO.HtJTwUJ2OgFmoNUpM3pFiel1BTvZlOmbKgJ2FV8CuIQbs69rKNETsvmTKS.t.QaJ3e7SWQHnPpqddZqDgM3TwEUhyH9eqZdyyiiHrqzJXfd6dSoxzSJMWlYlcc_; S_INFO=1750407763|0|0&60##|18874070066; P_INFO=18874070066|1750407763|1|subscribe|00&99|hun&1749192940&subscribe#hun&430100#10#0#0|&0||18874070066; NTESwebSI=C704C154EF8B8D58F4710E42B432A4F2; NTESwebSI=C704C154EF8B8D58F4710E42B432A4F2',
//         platformAccountName: '',
//         platformAuthorId: '',
//       },
//     ).getPublishCatergory(PubContentEnum.video);
//     console.log(JSON.stringify(result, null, 2));
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// test(
//   '获取发布话题',
//   async () => {
//     PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
//     const result = await new Cloud.QueryWorker('', Platforms.ZhiHu, {
//       platformAccountSpaceId: '6821e6b374478a5f26bcf8af',
//       parentId: '',
//       wxkey: '',
//       platformAccountId: '680f7e35e3161434d026bfa1',
//       cookie:
//         '_zap=ef1845d3-7ec8-440d-9928-ddb995521c29; _xsrf=862c91ff-6b81-4fac-bd71-2c18a44ce4c5; d_c0=YOVTdjDkohqPTjZCP77mcOotYU4pkJITohY=|1750388053; captcha_session_v2=2|1:0|10:1750388053|18:captcha_session_v2|88:VHFrQ2dmb2w1V1l5RC9ETkdFZ2F2QUNnb0UrY1ZYTXcxSmg4emF0TmRYdEswbnZOL0lkUERkb0xCWXAyeW9uRA==|eaca41648694fe3055002e6059838366760584eb0da1c79ee80129277410c8b1; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1752673139; HMACCOUNT=BAE323FB59814D17; z_c0=2|1:0|10:1752673402|4:z_c0|80:MS4xUWxBWE1BQUFBQUFtQUFBQVlBSlZUWFQ1Wkdtay02bGU5RTZidmt5M0piTk5XUmhlNUZLOFVnPT0=|294436c6879c1e6ad77902bada9b95d6cd0136253c70b2843343605b70bbd1cd; Hm_lvt_bff3d83079cef1ed8fc5e3f4579ec3b3=1752673403; __zse_ck=004_ENNCxsgV6qTH/A2q7pkZBMuSQJ8IuAK714Zdck9m0U462QrdkPTnkwSe57vXjVqjSAyXcaIqBWCGkAwEUiCj4przo6VVWWczn6wa5eyk1E6nxpWJiP4/2I3kyLNSHEaM-oZvMOA0Ypv7pM/Sf3ibazBVXsuJSP0ejnZoQnxWuPNGQE96FTDz07b6MBVBnjxFGEh2yhf+DHSY7F73WQuLccvjOxUrYH2xnk5Vcm90Nsw/n80EMsM/U9Xgcr339Q/Fg; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1752673478; Hm_lpvt_bff3d83079cef1ed8fc5e3f4579ec3b3=1752673479; SESSIONID=uSUOMW1HQeF7X83ZQLA6q9gv7bvwTFsZcfMQabqUiV4; JOID=UVscC0yU4Z8yghbsatDwQSm9-Up63ZraW-d3iVvWgNcG2XWgVllG5lGGHOdkiQqtqPhorEK0dt6IITrQJ1jbQHs=; osd=UFwdA0-V5p46gRfra9jzQC688Ul72pvSWOZwiFPVgdAH0XahUVhO5VCBHe9niA2soPtpq0O8dd-PIDLTJl_aSHg=; BEC=8ce9e721fafad59a55ed220f1ad7f253',
//       platformAccountName: '',
//       platformAuthorId: '',
//       authorization: '123123',
//     }).searchTopic('搞笑', PubContentEnum.video);
//     console.log(JSON.stringify(result, null, 2));
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );

// test(
//   '新视频发布',
//   async () => {
//     PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
//     const result = Cloud.pushOpenPlatformPublishTask({
//       publishType: 'video',
//       authorization: '1231231',
//       platform:[{id:'81231231237',platformCode:'DouYin',platformCookie:'[{"name":"gfkadpd","value":"2906,33638","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1757640634,"sameSite":"no_restriction"},{"name":"_tea_utm_cache_2906","value":"undefined","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757986234,"sameSite":"unspecified"},{"name":"bd_ticket_guard_client_web_domain","value":"2","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762650470.224843,"sameSite":"unspecified"},{"name":"passport_csrf_token","value":"22e14e380a2558f83278ab0235b82f83","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1762565435.917109,"sameSite":"no_restriction"},{"name":"passport_csrf_token_default","value":"22e14e380a2558f83278ab0235b82f83","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762565435.917136,"sameSite":"unspecified"},{"name":"passport_mfa_token","value":"CjYLS9vAwiF78wIC9WmBgvrb4wlBc%2Bhdx5Rj71NeoA%2BrWWDGFQdO%2FXmJy%2BEfQneDx%2Fswy4HoS%2BYaSgo8AAAAAAAAAAAAAE9zvKerE2Jch8pQG2fCwmQDuK1pzn0%2BvNE00Npb%2Boyc%2FSNcNS%2FXPcWNUhpwBCNcStLhEJTY%2Bw0Y9rHRbCACIgEDULX2mw%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762565607.244617,"sameSite":"unspecified"},{"name":"d_ticket","value":"e97a3042752befdaaceb6c288d56ed931b9c1","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1788917607.244649,"sameSite":"unspecified"},{"name":"n_mh","value":"Y4mnv0O1fs1r21s6RJ1i417fc86gMq6iIw0ek-d4nLc","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1767834467.366097,"sameSite":"unspecified"},{"name":"is_staff_user","value":"false","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.366228,"sameSite":"unspecified"},{"name":"_bd_ticket_crypt_doamin","value":"2","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762650467.39926,"sameSite":"unspecified"},{"name":"__security_server_data_status","value":"1","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762650467.463026,"sameSite":"unspecified"},{"name":"gd_random","value":"eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC42OTg4OTUwMTQwNDI4OTc3fQ==.RFdXO3adMNNDA8+g7MElK9tNT66n5ZgRBSkc2ew0fNk=","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1757986407.893386,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_crypt_sdk","value":"dbd10a0c-40ec-a89a","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762565435.825318,"sameSite":"unspecified"},{"name":"x-web-secsdk-uid","value":"ab0d844d-af9f-49d2-afdb-54680cd618bc","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"csrf_session_id","value":"2ed1369bed7bca55fd55ba13aa0bc97f","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"csrf_session_id","value":"2ed1369bed7bca55fd55ba13aa0bc97f","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"gulu_source_res","value":"eyJwX2luIjoiNThkYTc5OGM0MmRjZGQzNmQzNmFkYTA0MzhjZDNkZmZiMDM1ODdmNmEwZDg5NzkyNDFmZDcyN2QxYTViODkwYSJ9","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757466606.642011,"sameSite":"unspecified"},{"name":"passport_fe_beating_status","value":"false","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"biz_trace_id","value":"43924e85","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"sdk_source_info","value":"7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e5827292771273f273c3730333536333331323032342778","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757466606.640885,"sameSite":"unspecified"},{"name":"bit_env","value":"LUhV99rqrjbTy5NOt53OiAUVOwYug0rTOf9t91F8XAYbTByWEoiXg4vprAZPmjCZRHniVWQFDf_mx8Zavf8QXmPrObdj2TxfxSXhlgvgclk58KKaSYyHYww2gQ0lgSBeM28ITvBp3Ta5DoBfzpC4Lf-pAxcPMGrEuBup0NA7XFPcEc6W-yi8DHx19s4SzUzat8FqXdf4BObmZ3SMl4IvV78QLHWMRlyV2u4XiJhGLNquRfpmTiv5V-jkWqoum5sGkaqx1eBRkzKBOuYTj2PlWL1ixj3Ja4bn-WG5EpBIptMsxwiFv-quCNBhx6ySogs4H6sYgpgKhYp2Hsv3d7EA21JnclYyPjxX_uaGa-C89ouDckSxEhNYpgWuGSnXErXRjpRdQOrM0qI6gd36MY5huZB9c5kwJG-_Qmmk8eNESPm6NBHGwy8gTBK60JMbQnIIOOKNeDsuHX6Du1S0OBt7JdQHBEeiqmSiEnOrNAxrs9rDUFxqZV_HMLI9dlB_SsvIZQc4ghywY90MmkjyouhN8MnrsHjAs57zAK_jVJF24ZQ%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757466606.641276,"sameSite":"unspecified"},{"name":"passport_auth_mix_state","value":"804o91hbg2z6yqjymikoizc92ilrz6gadxmfsycmnknt4x43","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757466546.64241,"sameSite":"unspecified"},{"name":"odin_tt","value":"b50decb83843b762875e57703998db7521585b2ef5c1e0540a06255bd97a631020a3ae0b844976bb84c14bb9dced7a634b0f11ba9783c090816cc8a7246eeea0","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1789002467.366022,"sameSite":"unspecified"},{"name":"passport_assist_user","value":"CkBYfrA_TISUw7e5jGIFwEuO0dQ2p2GqpJOIx-iYbBSmkdQJl4LWldk6L6OxAPtiCkpjUxhd0_7kTsNX1ytpH10JGkoKPAAAAAAAAAAAAABPdWVcipj1NYAaXdbnuR403eYQnPR_VEWl7hes8D4h979mRgBxjKDnUHEqyd4QCnFBFBDB5PsNGImv1lQgASIBA7G1Wo0%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1792026467.366076,"sameSite":"unspecified"},{"name":"sid_guard","value":"a0d41e5583a89f7bdd2009627add0888%7C1757466469%7C5184000%7CSun%2C+09-Nov-2025+01%3A07%3A49+GMT","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1788570467.366115,"sameSite":"unspecified"},{"name":"uid_tt","value":"29abfb982c082a372b7ec8dac63c16a0","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.366132,"sameSite":"unspecified"},{"name":"uid_tt_ss","value":"29abfb982c082a372b7ec8dac63c16a0","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.366149,"sameSite":"no_restriction"},{"name":"sid_tt","value":"a0d41e5583a89f7bdd2009627add0888","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.366165,"sameSite":"unspecified"},{"name":"sessionid","value":"a0d41e5583a89f7bdd2009627add0888","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.36618,"sameSite":"unspecified"},{"name":"sessionid_ss","value":"a0d41e5583a89f7bdd2009627add0888","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.366195,"sameSite":"no_restriction"},{"name":"session_tlb_tag","value":"sttt%7C4%7CoNQeVYOon3vdIAliet0IiP________--CzHI_QYUe6yDDvOaDkfSKITV9YCPqzqR8zKELDxGgpY%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.366212,"sameSite":"no_restriction"},{"name":"sid_ucp_v1","value":"1.0.0-KGJjYmFjODIxZDI4YTUzMTg3MmI5OWZmNTYzNmUyNmU2NzRiYmViNDkKIAjO1KC72_UmEOWeg8YGGNoWIAww3u7t7gU4B0D0B0gEGgJsZiIgYTBkNDFlNTU4M2E4OWY3YmRkMjAwOTYyN2FkZDA4ODg","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.366242,"sameSite":"unspecified"},{"name":"ssid_ucp_v1","value":"1.0.0-KGJjYmFjODIxZDI4YTUzMTg3MmI5OWZmNTYzNmUyNmU2NzRiYmViNDkKIAjO1KC72_UmEOWeg8YGGNoWIAww3u7t7gU4B0D0B0gEGgJsZiIgYTBkNDFlNTU4M2E4OWY3YmRkMjAwOTYyN2FkZDA4ODg","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762650467.366257,"sameSite":"no_restriction"},{"name":"_bd_ticket_crypt_cookie","value":"07dd659e367db1c300dfaefb6fa271d7","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762650467.402334,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_sign_data_key_web_protect","value":"34f2967a-47cf-9785","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762650467.460409,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_cert_key","value":"c4749636-42b2-b49b","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762650467.460547,"sameSite":"unspecified"},{"name":"gd_random","value":"eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC42OTg4OTUwMTQwNDI4OTc3fQ==.RFdXO3adMNNDA8+g7MElK9tNT66n5ZgRBSkc2ew0fNk=","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1758071267.54549,"sameSite":"unspecified"},{"name":"ttwid","value":"1%7Cmn-b-2t_A7fg9ikLCumdca1rh4rHd1_zeswmIKRpGiI%7C1757466471%7C4a3459e9bea9e4fa27d00d101ad196d62e066a29916ef326db17a96077250f80","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1789002468.942144,"sameSite":"no_restriction"},{"name":"bd_ticket_guard_client_data","value":"eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCS2pWRnI3WHhiTU50UTBLcHplKzkxU2dmb2cvNmdwcFB6UENEaHlJT2RUdTcxd3lrZk9KSVhBTWFKcjFaMUJoVHBKNytyRzB6TkZkY3lSaDNrWmxGTjA9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762650470.224704,"sameSite":"unspecified"},{"name":"bd_ticket_guard_client_data_v2","value":"eyJyZWVfcHVibGljX2tleSI6IkJLalZGcjdYeGJNTnRRMEtwemUrOTFTZ2ZvZy82Z3BwUHpQQ0RoeUlPZFR1NzF3eWtmT0pJWEFNYUpyMVoxQmhUcEo3K3JHMHpORmRjeVJoM2tabEZOMD0iLCJ0c19zaWduIjoidHMuMi4yN2RiNzhiMDM3NjNkNmVhODZjNGNjZWU4MmMzZjI5YWM0NDJmNmQwNTA2MzliNDU1ZTMwYzJhNGRiY2ZjZmE5YzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJVamNyT1E0OGFPVFdSYjdFdEhXejRucmRQQ1F3QjI1anJlSlRMcllmbTNrPSIsInNlY190cyI6IiNSR3A3MGViQ3NzSFA3TDBRc3c3T1VaYVd4TDJWUXpoR05YNGc5QWU4cVBJbmtSRUFYN1NzRlRwOXB3NWEifQ%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762650470.446598,"sameSite":"unspecified"},{"name":"security-sdk/s_sdk_crypt_sdk","value":"%7B%22data%22%3A%22%7B%5C%22ec_privateKey%5C%22%3A%5C%22-----BEGIN%20PRIVATE%20KEY-----%5C%5CnMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgTgnVxkpApG2nJv9U3fpc9oWzaXfOJnfAphmzCREy64GhRANCAASo1Ra%2B18WzDbUNCqc3vvdUoH6IP%2BoKaT8zwg4ciDnU7u9cMpHziSFwDGia9WdQYU6Se%2FqxtMzRXXMkYd5GZRTd%5C%5Cn-----END%20PRIVATE%20KEY-----%5C%22%2C%5C%22ec_publicKey%5C%22%3A%5C%22-----BEGIN%20PUBLIC%20KEY-----%5C%5CnMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEqNUWvtfFsw21DQqnN773VKB%2BiD%2FqCmk%2FM8IOHIg51O7vXDKR84khcAxomvVnUGFOknv6sbTM0V1zJGHeRmUU3Q%3D%3D%5C%5Cn-----END%20PUBLIC%20KEY-----%5C%22%2C%5C%22ec_csr%5C%22%3A%5C%22%5C%22%7D%22%7D","session":false,"expirationDate":255033043504.14465},{"name":"security-sdk/s_sdk_sign_data_key/web_protect","value":"%7B%22data%22%3A%22%7B%5C%22ticket%5C%22%3A%5C%22hash.%2BBTJYrsOHP71fm46aCFcQ8p2B8xEPSZGHXxEN4u0RjY%3D%5C%22%2C%5C%22ts_sign%5C%22%3A%5C%22ts.2.27db78b03763d6ea86c4ccee82c3f29ac442f6d050639b455e30c2a4dbcfcfa9c4fbe87d2319cf05318624ceda14911ca406dedbebeddb2e30fce8d4fa02575d%5C%22%2C%5C%22client_cert%5C%22%3A%5C%22pub.BKjVFr7XxbMNtQ0Kpze%2B91Sgfog%2F6gppPzPCDhyIOdTu71wykfOJIXAMaJr1Z1BhTpJ7%2BrG0zNFdcyRh3kZlFN0%3D%5C%22%2C%5C%22log_id%5C%22%3A%5C%22202509100907499FAFB6D6A726BCCC1695%5C%22%2C%5C%22create_time%5C%22%3A1757466469%7D%22%7D","session":false,"expirationDate":255033043504.14465}]'}],
//       tasks: [
//         {
//           taskId: '7',
//           authorInfo: {
//             platform: Platforms.DouYin,
//             id: '81231231237',
//           },
//           publishData: {
//             video: {
//               localPath: 'I:\\download\\bc19ad1b-c014-475a-8b59-01ad8855e774123.mp4',
//               url: '',
//               width: 1024,
//               height: 768,
//               duration: 120,
//               size: 123,
//             },
//             covers: [
//               {
//                 pathOrUrl: 'I:\\download\\20250707-171022.jpg',
//                 url: '',
//                 width: 1024,
//                 height: 768,
//                 size: 123,
//               },
//             ],
//             title: '我是标题啊',
//             desc: '<p>我是<topic text="辣条">#ahsh#</topic>描述啊</p>',
//             visibleType: 1,
//             // group_shopping:{
//             //   sale_title:'推荐这个哦',
//             //   brand_switch_value:2,
//             //   data:{
//             //     "yixiaoerId": "1809693503342601",
//             //     "yixiaoerName": "星巴克经典咖啡大杯单杯团购券 z",
//             //     "yixiaoerDesc": "星巴克咖啡(北京苑景路店)",
//             //     "yixiaoerImageUrl": "https://p3-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=nIXYU4m9KK3AC%2Fy7CarfdX7aB7Y%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//             //     "price": 3600,
//             //     "earnPrice": 0,
//             //     "images": [
//             //       "https://p3-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=nIXYU4m9KK3AC%2Fy7CarfdX7aB7Y%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//             //       "https://p26-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=Cveey4%2F0%2Bbmb3U20RjevIAXj4dg%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//             //       "https://p9-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=8FMOYZ39D83DAH%2BqLVJqVUC%2BAB0%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89"
//             //     ],
//             //     "raw": {
//             //       "actual_price": 3600,
//             //       "alliance_task_detail_list": [],
//             //       "blur_sale_count": "月售 14",
//             //       "blur_sale_count_l30": "14",
//             //       "common_anchor_content": "{}",
//             //       "discount": "",
//             //       "display_cps": {
//             //         "earn_price": 0,
//             //         "take_rate": 0,
//             //         "take_rate_range": []
//             //       },
//             //       "earn_price": 0,
//             //       "image_url": {
//             //         "uri": "tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0",
//             //         "url_list": [
//             //           "https://p3-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=nIXYU4m9KK3AC%2Fy7CarfdX7aB7Y%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//             //           "https://p26-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=Cveey4%2F0%2Bbmb3U20RjevIAXj4dg%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89",
//             //           "https://p9-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/57c91fed7365469e8f961170f2310ff0~c5_200x200.jpeg?x-expires=1757487600&x-signature=8FMOYZ39D83DAH%2BqLVJqVUC%2BAB0%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=2025091009191084A4BD5AEEDC97C9CF89"
//             //         ]
//             //       },
//             //       "is_clue": false,
//             //       "is_member_exclusive_product": true,
//             //       "poi": {
//             //         "Staturated_tags": null,
//             //         "channel_exclusive": null,
//             //         "cps_commission_rate_range": null,
//             //         "cps_commission_value_range": null,
//             //         "effect_ids": null,
//             //         "fulfill_task_list": null,
//             //         "icon_service_type_list": null,
//             //         "poi_detail_tags": null,
//             //         "poi_frontend_type": null,
//             //         "poi_id": "7267823187692357669",
//             //         "poi_name": "星巴克咖啡(北京苑景路店)",
//             //         "poi_ranks": null,
//             //         "poi_search_tags": null,
//             //         "poi_search_tags_v2": null,
//             //         "service_type_list": null,
//             //         "voucher_release_areas": null
//             //       },
//             //       "poi_count": 200,
//             //       "product_biz_line": 1,
//             //       "product_type": 1,
//             //       "promote_spu_user_cnt": 124,
//             //       "sale_price": 3600,
//             //       "show_type": 1,
//             //       "sold": 4108,
//             //       "sold_l30": 14,
//             //       "spu_entry": {
//             //         "schema_type": 3,
//             //         "url": "aweme://webview/?url=https%3A%2F%2Faweme.snssdk.com%2Finsights%2Frn%2Fgroupon_detail%3Fhide_nav_bar%3D1%26enter_from%3Dpoi%26groupon_channel%3Dlink%26activity_id%3D1809693503342601&rn_schema=aweme%3A%2F%2Freactnative%2F%3Fchannel%3Dmp_lynx_groupon_detail%26bundle%3Dindex.js%26module_name%3Dpage_groupon_detail%26enter_from%3Dpoi%26groupon_channel%3Dlink%26activity_id%3D1809693503342601%26hide_nav_bar%3D1"
//             //       },
//             //       "spu_id": "1809693503342601",
//             //       "spu_marketing": {
//             //         "coupon_types": null,
//             //         "spu_marketing_tags": null
//             //       },
//             //       "spu_name": "星巴克经典咖啡大杯单杯团购券 z",
//             //       "spu_tags": {
//             //         "source": {
//             //           "name": "官方",
//             //           "style": "official",
//             //           "type": 1
//             //         }
//             //       },
//             //       "spu_tags_list": null,
//             //       "stock": 498883,
//             //       "tag": {
//             //         "name": "官方",
//             //         "style": "official",
//             //         "type": 1
//             //       },
//             //       "take_rate": 0,
//             //       "track_params": "{\"product_sub_type\":0,\"product_type\":1}"
//             //     }
//             //   }
//             // },
//             shopping_cart:[{
//               sale_title:'好吃的辣条',
//               data:{
//                 "yixiaoerId": "3737435203463938262",
//                 "yixiaoerName": "【爆款牙线】一次性牙线棒50支一盒超细高弹力护理便携顺滑家用牙线",
//                 "yixiaoerDesc": "",
//                 "yixiaoerImageUrl": "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908",
//                 "price": 100,
//                 "earnPrice": 21,
//                 "images": [
//                   "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908",
//                   "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=ctJxqnEnv5Nc8yxLt%2BV7x6vQ8ow%3D&from=3604061908",
//                   "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=R6S9e%2FbLm1Y1mkYtVO2l2%2FnRkas%3D&from=3604061908",
//                   "https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=GoUzfgySpIHgNO0edg%2FWtZi366w%3D&from=3604061908",
//                   "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=PrexYDRB%2FalNPi0GQ%2BMC0eKOXu0%3D&from=3604061908"
//                 ],
//                 "raw": {
//                   "brand_icon": {
//                     "uri": "https://lf26-cm.ecombdstatic.com/obj/temai/ab_c4aef1247a86892270679b66a6a1cdd8",
//                     "url_list": [
//                       "https://lf26-cm.ecombdstatic.com/obj/temai/ab_c4aef1247a86892270679b66a6a1cdd8",
//                       "https://lf26-cm.ecombdstatic.com/obj/temai/ab_c4aef1247a86892270679b66a6a1cdd8",
//                       "https://lf26-cm.ecombdstatic.com/obj/temai/ab_c4aef1247a86892270679b66a6a1cdd8"
//                     ]
//                   },
//                   "cos_fee": 21,
//                   "cos_radio": 21,
//                   "elastic_img": null,
//                   "elastic_title": "",
//                   "extra": "",
//                   "gid": "3737059161872138533",
//                   "goods_imgs": [
//                     {
//                       "elastic_img": {
//                         "uri": "ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080",
//                         "url_list": [
//                           "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908",
//                           "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=5tnee0C6jD3s58GXf9sSpj7%2BZuU%3D&from=3604061908",
//                           "https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=f2T8Z8ESuMqVNx%2B6LGauSnUFkw0%3D&from=3604061908"
//                         ]
//                       }
//                     },
//                     {
//                       "elastic_img": {
//                         "uri": "ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080",
//                         "url_list": [
//                           "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=5tnee0C6jD3s58GXf9sSpj7%2BZuU%3D&from=3604061908",
//                           "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908",
//                           "https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=sHqr4K2bdoHhpNlERgzqc%2FQ3b84%3D&from=3604061908"
//                         ]
//                       }
//                     },
//                     {
//                       "elastic_img": {
//                         "uri": "ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800",
//                         "url_list": [
//                           "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=ctJxqnEnv5Nc8yxLt%2BV7x6vQ8ow%3D&from=3604061908",
//                           "https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=QHJ8XeGf7HFVNha2Q4ptr4FMncQ%3D&from=3604061908",
//                           "https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=Ev%2BcZDotx0FDPu3is%2FwUx2dNDms%3D&from=3604061908"
//                         ]
//                       }
//                     },
//                     {
//                       "elastic_img": {
//                         "uri": "ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800",
//                         "url_list": [
//                           "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=R6S9e%2FbLm1Y1mkYtVO2l2%2FnRkas%3D&from=3604061908",
//                           "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=hkwtCJuCGWIRsKRs%2BkyQMtEDTGU%3D&from=3604061908",
//                           "https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=plkKWsqzvhb3TbcdXYTjYNe25Lg%3D&from=3604061908"
//                         ]
//                       }
//                     },
//                     {
//                       "elastic_img": {
//                         "uri": "ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800",
//                         "url_list": [
//                           "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=i8TpzHSJt9Ipr7MqOFgKG6zlldQ%3D&from=3604061908",
//                           "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=Rm40d6kTr0c%2BmGWcOHnRCELS5TM%3D&from=3604061908",
//                           "https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=GoUzfgySpIHgNO0edg%2FWtZi366w%3D&from=3604061908"
//                         ]
//                       }
//                     },
//                     {
//                       "elastic_img": {
//                         "uri": "ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800",
//                         "url_list": [
//                           "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=FmNbEEPidI9IyAbw3Ci8TNrgJo4%3D&from=3604061908",
//                           "https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=3hY3CjQGiREV2lziekGnxekcSgc%3D&from=3604061908",
//                           "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=PrexYDRB%2FalNPi0GQ%2BMC0eKOXu0%3D&from=3604061908"
//                         ]
//                       }
//                     }
//                   ],
//                   "imgs": [
//                     {
//                       "uri": "ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080",
//                       "url_list": [
//                         "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=lSnGSLp2G%2BR35sQ2SpXCWf%2BFRV4%3D&from=3604061908",
//                         "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=5tnee0C6jD3s58GXf9sSpj7%2BZuU%3D&from=3604061908",
//                         "https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_69a1d688ba95161f78301fafc9ae5ca1_sx_586967_www1080-1080?lk3s=d6d19ed4&x-expires=1757487600&x-signature=f2T8Z8ESuMqVNx%2B6LGauSnUFkw0%3D&from=3604061908"
//                       ]
//                     },
//                     {
//                       "uri": "ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800",
//                       "url_list": [
//                         "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=ctJxqnEnv5Nc8yxLt%2BV7x6vQ8ow%3D&from=3604061908",
//                         "https://p9-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=Ev%2BcZDotx0FDPu3is%2FwUx2dNDms%3D&from=3604061908",
//                         "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_a7b5a975943f9fcec961b670a697ab0b_sx_310856_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=8aC1V6oN3jpROnR0NDgKIadTWpI%3D&from=3604061908"
//                       ]
//                     },
//                     {
//                       "uri": "ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800",
//                       "url_list": [
//                         "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=R6S9e%2FbLm1Y1mkYtVO2l2%2FnRkas%3D&from=3604061908",
//                         "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=hkwtCJuCGWIRsKRs%2BkyQMtEDTGU%3D&from=3604061908",
//                         "https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_3376bacd367b0d6959563a7cd324852d_sx_241697_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=4nj%2F7jvYRjEJ5%2F1L1ggX%2F5zuPB4%3D&from=3604061908"
//                       ]
//                     },
//                     {
//                       "uri": "ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800",
//                       "url_list": [
//                         "https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=GoUzfgySpIHgNO0edg%2FWtZi366w%3D&from=3604061908",
//                         "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=Rm40d6kTr0c%2BmGWcOHnRCELS5TM%3D&from=3604061908",
//                         "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_fe77e0c9d74f5d71a636e980d3ed8b64_sx_365780_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=i8TpzHSJt9Ipr7MqOFgKG6zlldQ%3D&from=3604061908"
//                       ]
//                     },
//                     {
//                       "uri": "ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800",
//                       "url_list": [
//                         "https://p26-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=PrexYDRB%2FalNPi0GQ%2BMC0eKOXu0%3D&from=3604061908",
//                         "https://p11-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=3hY3CjQGiREV2lziekGnxekcSgc%3D&from=3604061908",
//                         "https://p3-sign.douyinpic.com/obj/ecom-shop-material/jpeg_m_bedaef92df50dc2a14f76a2772371772_sx_440542_www800-800?lk3s=d6d19ed4&x-expires=1757487600&x-signature=FmNbEEPidI9IyAbw3Ci8TNrgJo4%3D&from=3604061908"
//                       ]
//                     }
//                   ],
//                   "item_type": 4,
//                   "label": null,
//                   "market_price": 1300,
//                   "price": 100,
//                   "promotion_id": "3737435203463938262",
//                   "promotion_source": 4,
//                   "sales": 9261,
//                   "title": "【爆款牙线】一次性牙线棒50支一盒超细高弹力护理便携顺滑家用牙线",
//                   "url": "https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html?id=3737059161872138533&origin_type=2631"
//                 }
//               }
//             }]
//           },
//         },
//       ],
//       callBackData: {},
//     });
//     console.log(JSON.stringify(result, null, 2));
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );

// test(
//   '新文章发布',
//   async () => {
//     PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
//     const result = Cloud.pushOpenPlatformPublishTask({
//       publishType: 'article',
//       authorization: '',
//       tasks: [
//         {
//           taskId: '7',
//           authorInfo: {
//             platform: Platforms.BaiJiaHao,
//             cookie:
//               'BAIDUID=8F136D8616648560E443EA68C92F5C4C:FG=1; BAIDUID_BFESS=8F136D8616648560E443EA68C92F5C4C:FG=1; PHPSESSID=fav5mpnlkmbhi6bv78kthflaj4; PHPSESSID=fav5mpnlkmbhi6bv78kthflaj4; theme=bjh; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2GrfqL8c87KLF2qFER3obJGmxmYcRxjc0nkx8EFDwF2WPFQ+UXgnkKFgFie+Z8z19dOti94/aebzvoussIeRnUjsp/n9fFPmunRZkgZZX81RXqGvpYSsWB83BCHBoL4uwVZvdicvlaaj/EU2gI/DbqBbSD3rH8JOudPxJORNS7SCt6rEeCerZiOC2HS/q3kWYbpA5RdGpipmODqHTwPvOqFLOQHvyhUQrrHDS6OPGdMUX5FnJNp5c2Cvgs1aHt7uhfWP4kyNq1GSn4oCX2UcCf6pBXPbwIPaqwGt1Mt3Eb9rnSecr9yhMSRLVoFktEC1isH7iwCnXPPB0SobvU7X/A7kFMb7+JFWxNGoA0JNiv6hCb0gkXpkEpISi6tVHh+hsQifjACGGz0MbLI9AAutvQNmLovQE8DrrUkOPSWZkiBwIUvxonSGS2lgiNZBxgK/Nad6P3sfvyvYhyXNwxm6SzH+Oja1l6cy9uoP7y446ILa1CLEOaV1jDkGoksNhRtn7B81CemkusdgER6aaUV34R4eGWiTUlCqdbf8oGHYcombWYX5RweDqStPwMzdS8AT76ygViv7lnF4xrYkhgSKNlMQwPkP86GfIbGCquGAObJfCYkWzbhpEMafq8Amle/PqYL0JOuH11AVQp/mkbZQeq+PwWbdRVYUN5dsKbr5SzEyBLa7elPNSWU9pSPwamQJULfVlddlyjf2DSNdFaksc04b/VWExfB29+0/cixuio4XrC/YQPbe/eXOYkOWEDCDut2vE1x9M/4Pzds3G/ghwrJOU4yMp72LTzOOrJ6QBGMchB+HGQ6trr+1zpyaeDCUI0jzkovG4kdAIyuxdvhnpBOcuRCO3PwUSWeipr32kg7rh+26VQGmUjUFB9qdWM7cM+xhEMNzi6OXbElHkA3erw54tXrxfzO8r5i/hVAMD5lmRW7zauvTts98AVvqIMSVA8vSA4Tm4Z6OA+zAWRuAfqTZ9a1UTTUvqyXLqMyFTl0YlR/5Hpqzck8ARex050OxYQCAmf5kxWsQsjulfPwmSj1dRY67IEuLXPc4GWCjVEmM2sEVUO27UponOPHnWdM3X7FUjxzui04WbenLVj7Cu3YJ8jm/klJ3aRE1kTuzptCsDnIwjfVJ9QODEOux3qU+1RQ==; BDUSS=cxTDBiNnVsdURyUlY0OVFpd1pFV3hUdlpLcVM1d0dqeXh5dldHblVkaDNiWnhvSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHfgdGh34HRoZD; BDUSS_BFESS=cxTDBiNnVsdURyUlY0OVFpd1pFV3hUdlpLcVM1d0dqeXh5dldHblVkaDNiWnhvSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHfgdGh34HRoZD; RECENT_LOGIN=1; RECENT_LOGIN=1; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1752490105; HMACCOUNT=BACE7A6CF6ABD829; Hm_ck_1752490105366=42; __bid_n=198088cdf567456cde14c6; Hm_ck_1752490107294=42; Hm_ck_1752652371823=42; Hm_ck_1752652403649=42; devStoken=acb7fdfa211cded6b8d2f0e8115e4f16ff2bddd819771b712bc0ce105617157d; bjhStoken=36f5fa545ffba34ba11814cf9f769636dc67656ff1b6aebb34a51ac4d83cfe84; RT="z=1&dm=baidu.com&si=1312c357-a6f9-4cba-afef-e5a0a658748b&ss=md5p5pu1&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf"; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1752654369; Hm_ck_1752654369144=42',
//             authorId: '81231231237',
//           },
//           publishData: {
//             covers: [
//               {
//                 pathOrUrl: 'I:\\download\\20250707-171022.jpg',
//                 url: '',
//                 width: 1024,
//                 height: 768,
//                 size: 123,
//               },
//               {
//                 pathOrUrl: 'I:\\download\\20250707-171022.jpg',
//                 url: '',
//                 width: 1024,
//                 height: 768,
//                 size: 123,
//               },
//             ],
//             title: '我是标题啊',
//             content: '<P>保存草稿</P>',
//             category: {
//               yixiaoerId: '123',
//               yixiaoerName: '军事',
//             },
//             subCategory: {
//               yixiaoerId: '43122123',
//               yixiaoerName: '军事历史',
//             },
//             pubType: 0,
//           },
//         },
//       ],
//       callBackData: {},
//     });
//     console.log(JSON.stringify(result, null, 2));
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
// test(
//   '新图文发布',
//   async () => {
//     PubConfig.API_URL = 'https://lite-api-staging.yixiaoer.cn';
//     const result = Cloud.pushOpenPlatformPublishTask({
//       publishType: 'dynamic',
//       authorization: '2312121',
//       tasks: [
//         {
//           taskId: '7',
//           authorInfo: {
//             platform: Platforms.XinLangWeiBo,
//             cookie:
//               'passport_csrf_token=9c623f4b392315bc18ca004c661a6b4c; passport_csrf_token_default=9c623f4b392315bc18ca004c661a6b4c; bd_ticket_guard_client_web_domain=2; passport_mfa_token=CjUbSdFIr43rWuuDRy0fr880JqufAh2k2hgBik%2BcZNUxTWNHsZUp0KXbrqYHPSfw1I2c%2BSrGOxpKCjwAAAAAAAAAAAAATxPEykZgkfU%2BN27TetqGpc7OTBmLWg3FHNso13K56m8qjB0u5YfSOywQnEaLI3F4M7kQ0pbzDRj2sdFsIAIiAQPqLd8p; d_ticket=54504312ef1f5cdb433da5cdcfc3ffbed40bf; n_mh=byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4; is_staff_user=false; x-web-secsdk-uid=9a6d70f3-0241-4b5c-a2df-943e9bc3b5af; csrf_session_id=fc267ff5c9b5a3f96c05d136b706fbba; _bd_ticket_crypt_doamin=2; __security_server_data_status=1; uuid_for_login=1750055585551_3g1ws6mzzak; passport_fe_beating_status=true; __security_mc_1_s_sdk_crypt_sdk=88f3c1c7-4a20-a551; biz_trace_id=32f1542c; odin_tt=a9cf68ca04641ba14c14aa9f5f1773f8472a77bbb201d4c9cb22290754447347ccc9598ad523b54ad07f53d6e8e73c1d; passport_assist_user=CjwtKECLthKYU63PT3ooXg_zlO0D7mSugft7MinVfe1x7u7crhsLFY4fjZtCmgnaAPp7z_TjCicR2_SvYF4aSgo8AAAAAAAAAAAAAE800K7KRF_39X8en8wioaRJiG5VMRBW3FnLdohWIYC46tMS8S2fmROZcSS7H7Cesf7qEOuN9g0Yia_WVCABIgEDFEpGKQ%3D%3D; sid_guard=2a8f2b3a8207d6c2cc9c6aa1c231f77c%7C1751894728%7C5183999%7CFri%2C+05-Sep-2025+13%3A25%3A27+GMT; uid_tt=89076057b46053607460e60cd51f66c3; uid_tt_ss=89076057b46053607460e60cd51f66c3; sid_tt=2a8f2b3a8207d6c2cc9c6aa1c231f77c; sessionid=2a8f2b3a8207d6c2cc9c6aa1c231f77c; sessionid_ss=2a8f2b3a8207d6c2cc9c6aa1c231f77c; sid_ucp_v1=1.0.0-KDA3ZjU1OGE2Y2ZkNWVlMDMyZDYxZmE2YjBjZDE3MTEzNjQ0YjZmZDcKHwjUlrWVoAIQyJWvwwYY2hYgDDCJ4uPQBTgHQPQHSAQaAmxmIiAyYThmMmIzYTgyMDdkNmMyY2M5YzZhYTFjMjMxZjc3Yw; ssid_ucp_v1=1.0.0-KDA3ZjU1OGE2Y2ZkNWVlMDMyZDYxZmE2YjBjZDE3MTEzNjQ0YjZmZDcKHwjUlrWVoAIQyJWvwwYY2hYgDDCJ4uPQBTgHQPQHSAQaAmxmIiAyYThmMmIzYTgyMDdkNmMyY2M5YzZhYTFjMjMxZjc3Yw; _bd_ticket_crypt_cookie=c9914ebf24ccb383cdda2d23b0a98368; __security_mc_1_s_sdk_sign_data_key_web_protect=f9a6a080-47ec-9fdd; __security_mc_1_s_sdk_cert_key=9b65e9c3-45f4-bd4f; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCQzlaMEdZR05aaVJib2lCOW1FS1Q1bFZzMkdTanF4SDYzQ29kTjVVRWdLYXRQQXFkNzYxeGpEcmRyV3M1eExOOWwvOXd2TnZqaldsT3Nwa2xncTBONTg9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; gd_random=eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC40NDQ0NzM3NjU3NTAwOTU1Nn0=.CAszpYPbFYUtvcCiJ6/eT0W3p1Uxy2rIUz1hD13AIRs=; gfkadpd=2906,33638; _tea_utm_cache_2906=undefined; ttwid=1%7CTHZcu1mPHhKavvkB3mT-hZkie43fARZywcPCuEEjLuI%7C1752544213%7C879b5d0e045004f91e552701d8470769d12228da7d1b24023bccf5d71ccfe127',
//             authorId: '81231231237',
//             id:"123"
//           },
//           publishData: {
//             visibleType: 1,
//             images: [
//               {
//                 pathOrUrl: 'I:\\download\\20250707-171022.jpg',
//                 url: '',
//                 width: 1024,
//                 height: 768,
//                 size: 123,
//               },
//               {
//                 pathOrUrl: 'I:\\download\\20250707-171022.jpg',
//                 url: '',
//                 width: 1024,
//                 height: 768,
//                 size: 123,
//               },
//             ],
//             covers: [
//               {
//                 pathOrUrl: 'I:\\download\\20250707-171022.jpg',
//                 url: '',
//                 width: 1024,
//                 height: 768,
//                 size: 123,
//               },
//             ],
//             title: '我是标题啊',
//             desc: '我是描述啊',
//             localStorage: {
//               'security-sdk/s_sdk_crypt_sdk':
//                 '{"data":"{\\"ec_privateKey\\":\\"-----BEGIN PRIVATE KEY-----\\\\r\\\\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPrUBSFVEVwbOtEcY\\\\r\\\\nPDnnucACx/SkUbpO/lOMUGHTBiWhRANCAAQvWdBmBjWYkW6IgfZhCk+ZVbNhko6s\\\\r\\\\nR+twqHTeVBICmrTwKne+tcYw63a1rOcSzfZf/cLzb441pTrKZJYKtDef\\\\r\\\\n-----END PRIVATE KEY-----\\\\r\\\\n\\",\\"ec_publicKey\\":\\"-----BEGIN PUBLIC KEY-----\\\\r\\\\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEL1nQZgY1mJFuiIH2YQpPmVWzYZKO\\\\r\\\\nrEfrcKh03lQSApq08Cp3vrXGMOt2taznEs32X/3C82+ONaU6ymSWCrQ3nw==\\\\r\\\\n-----END PUBLIC KEY-----\\\\r\\\\n\\",\\"ec_csr\\":\\"-----BEGIN CERTIFICATE REQUEST-----\\\\r\\\\nMIIBEjCBuQIBADAnMQswCQYDVQQGEwJDTjEYMBYGA1UEAwwPYmRfdGlja2V0X2d1\\\\r\\\\nYXJkMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEL1nQZgY1mJFuiIH2YQpPmVWz\\\\r\\\\nYZKOrEfrcKh03lQSApq08Cp3vrXGMOt2taznEs32X/3C82+ONaU6ymSWCrQ3n6Aw\\\\r\\\\nMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0RBBYwFIISY3JlYXRvci5kb3V5aW4uY29t\\\\r\\\\nMAoGCCqGSM49BAMCA0gAMEUCIFgH/Hdc+LcvPWbVJln61ECDfLgCOYYivbYTHcaO\\\\r\\\\nBQ+tAiEAmYCNLMHlHCJs9KMdiYQ/2ChTFVgZHKFywa3jVfWXJ8g=\\\\r\\\\n-----END CERTIFICATE REQUEST-----\\\\r\\\\n\\"}"}',
//               'security-sdk/s_sdk_sign_data_key/web_protect':
//                 '{"data":"{\\"ticket\\":\\"hash.RxD/Qr7uOAIf2OQhYgMHkEe4bqSDKeoEfVUS9ReUDEk=\\",\\"ts_sign\\":\\"ts.2.5d169711ea58534a4b3ea09ca855e2167d4d7eeac6715a966f5e27470cfb89c8c4fbe87d2319cf05318624ceda14911ca406dedbebeddb2e30fce8d4fa02575d\\",\\"client_cert\\":\\"pub.BC9Z0GYGNZiRboiB9mEKT5lVs2GSjqxH63CodN5UEgKatPAqd761xjDrdrWs5xLN9l/9wvNvjjWlOspklgq0N58=\\",\\"log_id\\":\\"20250707212527561129D0E3A985919A5D\\",\\"create_time\\":1751894728}"}',
//             },
//           },
//         },
//       ],
//       callBackData: {},
//       platform:[
//         {
//           id:"123",
//           platformCookie:'[{"name":"abs","value":"12312","domain":"weibo.com"}]',
//           platformUserId:'',
//           platformCode:Platforms.XinLangWeiBo
//         }
//       ]
//     });
//     console.log(JSON.stringify(result, null, 2));
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );

// test(
//   '微信公众号新文章发布',
//   async () => {
//     const result = Cloud.pushOpenPlatformPublishTask({
//       callBackData: { teamId: '67f391864cd5ea0742350e03', userId: '6842b9707731899191a8ada5' },
//       publishType: 'article',
//       tasks: [
//         {
//           taskId: '68aed910c15b6a3be292611e',
//           publishData: {
//             prePubTime: 0,//new Date().setHours(23)+10000000,
//             pubType: 1,
//             notifySubscribers: 0,
//             sex: 0,
//             contentList: [
//               {
//                 title: '“互联护苗2025”主题网络活动今日启动',
//                 content:
//                   '<p style="text-align: left"><span>20日，北京市委网信办联合市委教育工委、市高级法院、市检察院、市公安局、市民政局、市科协等部门，组织东城、西城、朝阳、海淀等区级网信部门和微博、抖音、快手等30余家属地重点网站，共同推出的“互联护苗2025”主题网络活动正式启动上线。</span></p><p style="text-align: left">“互联护苗2025”主题网络活动启动</p><p style="text-align: left"><span>活动深入贯彻落实习近平总书记关于未成年人网络保护工作的重要指示精神，坚持首都站位、导向为先，强化资源统筹、协调联动，在一体推进未成年人网络素养促进和网络信息内容规范的同时，充分发挥首都网络资源和文化资源优势，弘扬爱国主义主旋律，厚植家国情怀。</span></p><p style="text-align: left"><span>自2018年以来，北京市委网信办已连续7年举办“互联护苗”品牌活动。</span></p><p style="text-align: left">历年精彩活动集锦</p><p style="text-align: left"><span>今年的“互联护苗2025”活动以“指尖筑梦 守护成长”为主题，将围绕“筑清朗网络晴空”“育智趣赛博少年”“绘璀璨文化新篇”三大重点板块，开展九项重点任务，推出30余项网络产品和活动，在数字时代为未成年人织就一张安全、温暖、向上的“云端之网”。目前，房山、昌平、平谷等区级网信部门以及北青网、知乎、豆瓣、最右、宝宝树等网站围绕未成年人反诈防骗、识谣辨谣、预防沉迷开展的首批活动已上线。</span></p><p style="text-align: left">首批已上线活动</p><p style="text-align: left"><span>同时，本次活动也将同步组织开展以未成年人保护为主题的网络专项举报行动，推动北京属地网站切实履行主体责任，健全完善专门的受理举报渠道，及时处置危害未成年人健康成长的有害信息和账号，曝光典型案例，定期公布成果，持续净化网络环境。</span></p><p style="text-align: left"><span>广大网民可以通过“北京网络举报”微信公众号“一键举报”入口以及北京属地各网站举报渠道参与专项举报，共建清朗网络空间。</span></p>',
//                 desc: '',
//                 cover: {
//                   width: null,
//                   height: null,
//                   size: null,
//                   pathOrUrl:
//                     'https://oss.yixiaoer.cn/74a9ff245fd1e9690b6650f94848d485/68b02a90/wxp/test/t-67f391864cd5ea0742350e03/1756288475366.jpg',
//                   format: '',
//                 },
//                 createType: 0,
//                 category: null,
//                 subCategory: null,
//                 contentSourceUrl: 'https://weibo.com/ttarticle/p/show?id=2309405179573687418938',
//                 openFansMsg: false,
//               },
//             ],
//           },
//           authorInfo: {
//             platformName: '微信公众号',
//             id: 'cmetqi2ni003ojg0jy6qf4wu4',
//
//           },
//         },
//       ],
//       publishChannel: 'cloud',
//       platform: [
//         {
//           id: 'cmetqi2ni003ojg0jy6qf4wu4',
//           platformCode: 'WeiXinGongZhongHao',
//           platformUserId: '3623085645',
//           platformUserName: 'GZH瓜子',
//           platformCookie:
//             'appmsglist_action_3623085645=card; ua_id=6Qxa6Q16ZVESkPU1AAAAABChSDRHDz5uz3dcDETtoQA=; wxuin=56263005788189; rand_info=CAESIHDrbFrLbh6XDGCss53HbNf5WbJ0jSb8oBnQhbKPph5E; slave_bizuin=3623085645; data_bizuin=3623085645; bizuin=3623085645; data_ticket=mnHjgh/gITXlZEKxuLuc8/G6d3BB1ckz60Gax0KcU2wqfsxhJxAWixZjacaSecU3; slave_sid=OHgzTGhvMXhYaXFxdThVZDROQk05M3pEajFLMFJyaUswVkdzMXkxZXFhSlVPNnpZMzdEQ1Bva05NeTRxZ0lGUGtzRWNYSUY1V20wcm1FdVFQWnhLaXU5SkVQTVh3OGZKWUpNY0pzQWxYcU94NXE4Y3ZOakRBVkVwbzRQMk9LVW82ZHVDdm8yMVRlRUFNdE52; slave_user=gh_72e3b4763902; xid=ef3998bb19eea08ab255d574da6733b0; mm_lang=zh_CN; slave_user=gh_72e3b4763902; slave_sid=OHgzTGhvMXhYaXFxdThVZDROQk05M3pEajFLMFJyaUswVkdzMXkxZXFhSlVPNnpZMzdEQ1Bva05NeTRxZ0lGUGtzRWNYSUY1V20wcm1FdVFQWnhLaXU5SkVQTVh3OGZKWUpNY0pzQWxYcU94NXE4Y3ZOakRBVkVwbzRQMk9LVW82ZHVDdm8yMVRlRUFNdE52; bizuin=3623085645; data_bizuin=3623085645; data_ticket=mnHjgh/gITXlZEKxuLuc8/G6d3BB1ckz60Gax0KcU2wqfsxhJxAWixZjacaSecU3; slave_bizuin=3623085645; rand_info=CAESIHDrbFrLbh6XDGCss53HbNf5WbJ0jSb8oBnQhbKPph5E; ua_id=6Qxa6Q16ZVESkPU1AAAAABChSDRHDz5uz3dcDETtoQA=; uuid=953efa671681b4c406b00ddee5867580; _clck=3623085645|1|fyu|0; _clsk=kgyy20|1756361659855|1|1|mp.weixin.qq.com/weheat-agent/payload/record',
//         },
//       ],
//       authorization: 'sess_bae8a869d21987c69eb283ae771c8bac66eda4ec6d5f2255b8fec1c6c601f666',
//     });
//     console.log(JSON.stringify(result, null, 2));
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// test(
//   '新视频发布',
//   async () => {
//     const result = Cloud.pushOpenPlatformPublishTask(
//       {
//         publishType: 'video',
//         authorization: '1231231',
//         platform: [
//           {
//             id: '81231231237',
//             platformCode: Platforms.DouYin,
//             platformCookie:
//               '[{"name":"bd_ticket_guard_client_web_domain","value":"2","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762827521.511703,"sameSite":"unspecified"},{"name":"n_mh","value":"byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1768011519.210075,"sameSite":"unspecified"},{"name":"is_staff_user","value":"false","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210202,"sameSite":"unspecified"},{"name":"store-region","value":"cn-sc","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1774335404.105402,"sameSite":"unspecified"},{"name":"store-region-src","value":"uid","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1774335404.105421,"sameSite":"unspecified"},{"name":"_bd_ticket_crypt_doamin","value":"2","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762827519.237408,"sameSite":"unspecified"},{"name":"__security_server_data_status","value":"1","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762827519.350716,"sameSite":"unspecified"},{"name":"passport_csrf_token","value":"ebb097cd84a5c2c27464020bf491062c","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1758885302.240929,"sameSite":"no_restriction"},{"name":"passport_csrf_token_default","value":"ebb097cd84a5c2c27464020bf491062c","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1758885302.240963,"sameSite":"unspecified"},{"name":"x-web-secsdk-uid","value":"b9340df5-8ede-42a1-9fad-fdfb08dcf95e","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"csrf_session_id","value":"d053301b784f408c54e59aa2321c8774","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"gfkadpd","value":"2906,33638","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1757902050,"sameSite":"no_restriction"},{"name":"csrf_session_id","value":"d053301b784f408c54e59aa2321c8774","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"_tea_utm_cache_1128","value":"undefined","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1758247938,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_crypt_sdk","value":"ca1aa4ee-4a29-a3b8","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1758885301.896617,"sameSite":"unspecified"},{"name":"_tea_utm_cache_2906","value":"undefined","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1758247964,"sameSite":"unspecified"},{"name":"sdk_source_info","value":"7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e5827292771273f27353533363c31363133323032342778","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757643793.752146,"sameSite":"unspecified"},{"name":"bit_env","value":"z5tDzlSHOOwE4d3iiXpGffw4S91XLfVNHGon93EBpCdoq92hPY66IbjeE-dzeJ7rKsqmm8Ttxpp4UVZNy51TVIaLj4_5sl7WrT-GOWpbJOxsd276WKiNe8SxiKdcBrMmk39GdEPGupyV43mjx9Pw2HMBBf00EONwYOLX3hEenqfMhGF0i2TQQKHTKTJoFepkBjBgju2j_h977z3b4b2CMppwxHxWDNehELTzRCyOyG_yKf6hGK-6n_X3tW9Qw6NYVnb0nEteZLIErQLZ7q_uQKuWLLXH34kugAu6V4emg6sj--FYcD10vPvr-y0PubEUILQ9-coT5Bwo_Ms_cztUiPANq2OouaYUhPuKTwc1BF_mrzRdxMvQm2exZb3I-T26ejlcHaEbrUD-dTdhIDBurqtFJBzFjwn4JbLOW5ucGx4UoEB9LOzYtgzlZXNfh9KFxxUH6qAYolTFOkMkIs3VKa0agQuZ7zHfz6hX9FFSjXZa4oHZT4AvGyayW2hBgzemeZZdsbOMvTHCVXeFKJZ4U7Rzj-wfyPWjODTt9tPRrjY%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757643793.752311,"sameSite":"unspecified"},{"name":"gulu_source_res","value":"eyJwX2luIjoiNThkYTc5OGM0MmRjZGQzNmQzNmFkYTA0MzhjZDNkZmZiMDM1ODdmNmEwZDg5NzkyNDFmZDcyN2QxYTViODkwYSJ9","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757643793.752401,"sameSite":"unspecified"},{"name":"passport_auth_mix_state","value":"6enb7prkn6tiaqnkjnwn6yajy1smpxfe6j0wpdqq7zrcvqgh","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1757643733.752517,"sameSite":"unspecified"},{"name":"passport_fe_beating_status","value":"false","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"biz_trace_id","value":"c82867ef","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"odin_tt","value":"14e6e61cc71743e74197c3658ec3a2fc31c6c49ef74c30e9189b77b408c6be44b077f1d6ab408d232f6e41b34a536f94","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1789179519.210014,"sameSite":"unspecified"},{"name":"passport_assist_user","value":"CjzhfIxcXx9akVt6TL63T07i9CUF-fSIZpH8s-xy0atXVMd-VXcBr3RSDJhsyb6ks4N2j-RC2pwufIFwE2AaSgo8AAAAAAAAAAAAAE92rMjpJmj2bDFQR16ZfVmBiGjPdWX5A1-aquw_wwDP4A2WQwMxP6UbeWvY3dtQGUGmEI75-w0Yia_WVCABIgEDWdGgTw%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1792203519.210059,"sameSite":"unspecified"},{"name":"sid_guard","value":"7f97618264339c9a56edbf4f1b90e679%7C1757643520%7C5184000%7CTue%2C+11-Nov-2025+02%3A18%3A40+GMT","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1788747519.21009,"sameSite":"unspecified"},{"name":"uid_tt","value":"7b5cf2f35b1fc38389dcde042e11d4be","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210105,"sameSite":"unspecified"},{"name":"uid_tt_ss","value":"7b5cf2f35b1fc38389dcde042e11d4be","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210121,"sameSite":"no_restriction"},{"name":"sid_tt","value":"7f97618264339c9a56edbf4f1b90e679","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210135,"sameSite":"unspecified"},{"name":"sessionid","value":"7f97618264339c9a56edbf4f1b90e679","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210149,"sameSite":"unspecified"},{"name":"sessionid_ss","value":"7f97618264339c9a56edbf4f1b90e679","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210163,"sameSite":"no_restriction"},{"name":"session_tlb_tag","value":"sttt%7C18%7Cf5dhgmQznJpW7b9PG5Dmef________-tfvR6UTCiuqSpuqmoW8L_ZFJUUrqD14-lqatlLX-1GFE%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210183,"sameSite":"no_restriction"},{"name":"sid_ucp_v1","value":"1.0.0-KGQ5YjZiYzNjMzFjZGNkYmU3NWFhODUyMGE2NDAwNDBkMGFiNDNjNWYKHwjUlrWVoAIQgIaOxgYY2hYgDDCJ4uPQBTgHQPQHSAQaAmxmIiA3Zjk3NjE4MjY0MzM5YzlhNTZlZGJmNGYxYjkwZTY3OQ","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210216,"sameSite":"unspecified"},{"name":"ssid_ucp_v1","value":"1.0.0-KGQ5YjZiYzNjMzFjZGNkYmU3NWFhODUyMGE2NDAwNDBkMGFiNDNjNWYKHwjUlrWVoAIQgIaOxgYY2hYgDDCJ4uPQBTgHQPQHSAQaAmxmIiA3Zjk3NjE4MjY0MzM5YzlhNTZlZGJmNGYxYjkwZTY3OQ","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1762827519.210234,"sameSite":"no_restriction"},{"name":"_bd_ticket_crypt_cookie","value":"4dbff2d04354297a9d427eb4ecb0ab68","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762827519.24029,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_sign_data_key_web_protect","value":"b0eafb5f-4cd9-bd9e","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762827519.346863,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_cert_key","value":"0b76c108-443f-a274","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762827519.347046,"sameSite":"unspecified"},{"name":"gd_random","value":"eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC4wNTg1MjA4MjUwMzkyNTcwNH0=.FgAoSriKkCAafMyfpEI/iydrc8O9KrLY+xjArotMk4I=","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1758248319.503367,"sameSite":"unspecified"},{"name":"ttwid","value":"1%7COUngAMEsv4bd2Hq0mD5k4F9t2IIrGDiSk0z_JhU-Coo%7C1757643522%7C3964c6026e248726c11f2b6fc06bfc3aaf6d57825f27cca9dd670a1049484e3b","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1789179520.879784,"sameSite":"no_restriction"},{"name":"bd_ticket_guard_client_data","value":"eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCSUlGWG5YWVFNVTNjN0pLTnRUbzF3MlV3N29WNnQvSmk4TGpWMXN0QjRVVkxpamZsN1NKM0FVaGhGZEg5bDdtZGRQQ3hOdDZJcjVvNHFoQms4MWxKTnc9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762827521.511591,"sameSite":"unspecified"},{"name":"bd_ticket_guard_client_data_v2","value":"eyJyZWVfcHVibGljX2tleSI6IkJJSUZYblhZUU1VM2M3SktOdFRvMXcyVXc3b1Y2dC9KaThMalYxc3RCNFVWTGlqZmw3U0ozQVVoaEZkSDlsN21kZFBDeE50NklyNW80cWhCazgxbEpOdz0iLCJ0c19zaWduIjoidHMuMi41NTEwZmQ1ZjM3YTY1Y2JiZGNiODY3ODViMWFjY2JmYmE4ZTE1M2ZhNjEwNGE4ZDY4NTc1OTQ1N2MzMjk3YmQyYzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJURVVyNjJrRHNLSGxyYmNzMmZNQll6ZUNyMXNMT0xTVzhTdDBETDFtMkxBPSIsInNlY190cyI6IiNsVzU3aHQrTVhucU5wN2ZPZEpDRE1NR2lTMG1qcitBRmh4OVNza1R0MStoalhkWDJsbGZPc0t6M2hHM3kifQ%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762827522.313949,"sameSite":"unspecified"},{"name":"security-sdk/s_sdk_crypt_sdk","value":"%7B%22data%22%3A%22%7B%5C%22ec_privateKey%5C%22%3A%5C%22-----BEGIN%20PRIVATE%20KEY-----%5C%5CnMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg%2B1IHi3rh%2Bh9CTI%2FDlhDfaIo6LT%2Bp9GuFFjfSzm%2B7IBKhRANCAASCBV512EDFN3OySjbU6NcNlMO6FerfyYvC41dbLQeFFS4o35e0idwFIYRXR%2FZe5nXTwsTbeiK%2BaOKoQZPNZSTc%5C%5Cn-----END%20PRIVATE%20KEY-----%5C%22%2C%5C%22ec_publicKey%5C%22%3A%5C%22-----BEGIN%20PUBLIC%20KEY-----%5C%5CnMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEggVeddhAxTdzsko21OjXDZTDuhXq38mLwuNXWy0HhRUuKN%2BXtIncBSGEV0f2XuZ108LE23oivmjiqEGTzWUk3A%3D%3D%5C%5Cn-----END%20PUBLIC%20KEY-----%5C%22%2C%5C%22ec_csr%5C%22%3A%5C%22%5C%22%7D%22%7D","session":false,"expirationDate":255033043504.14465},{"name":"security-sdk/s_sdk_sign_data_key/web_protect","value":"%7B%22data%22%3A%22%7B%5C%22ticket%5C%22%3A%5C%22hash.%2B1dwBmrSwDX0FQLPge%2B8Dw6V4%2BD7iSRkpcPiE5kNtlU%3D%5C%22%2C%5C%22ts_sign%5C%22%3A%5C%22ts.2.5510fd5f37a65cbbdcb86785b1accbfba8e153fa6104a8d685759457c3297bd2c4fbe87d2319cf05318624ceda14911ca406dedbebeddb2e30fce8d4fa02575d%5C%22%2C%5C%22client_cert%5C%22%3A%5C%22pub.BIIFXnXYQMU3c7JKNtTo1w2Uw7oV6t%2FJi8LjV1stB4UVLijfl7SJ3AUhhFdH9l7mddPCxNt6Ir5o4qhBk81lJNw%3D%5C%22%2C%5C%22log_id%5C%22%3A%5C%2220250912101840019B3F34D02BD55DA14B%5C%22%2C%5C%22create_time%5C%22%3A1757643520%7D%22%7D","session":false,"expirationDate":255033043504.14465}]',
//           },
//         ],
//         tasks: [
//           {
//             taskId: '7',
//             authorInfo: {
//               platform: Platforms.DouYin,
//               id: '81231231237',
//             },
//             publishData: {
//               video: {
//                 localPath: 'I:\\download\\bc19ad1b-c014-475a-8b59-01ad8855e774123.mp4',
//                 url: '',
//                 width: 1024,
//                 height: 768,
//                 duration: 120,
//                 size: 123,
//               },
//               covers: [
//                 {
//                   pathOrUrl: 'I:\\download\\20250707-171022.jpg',
//                   url: '',
//                   width: 1024,
//                   height: 768,
//                   size: 123,
//                 },
//               ],
//               title: '我是标题啊',
//               desc: '<p>我是<topic text="辣条">#ahsh#</topic>描述啊</p><p><friend raw=\'{"yixiaoerId":"2510911478709149","yixiaoerName":"王者荣耀桑杰","yixiaoerImage":"https://p11.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","raw":{"avatar_larger":{"uri":"1080x1080/aweme-avatar/mosaic-legacy_310490000be14d67b1221","url_list":["https://p11.douyinpic.com/aweme/1080x1080/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p26.douyinpic.com/aweme/1080x1080/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p3.douyinpic.com/aweme/1080x1080/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662"]},"avatar_medium":{"uri":"720x720/aweme-avatar/mosaic-legacy_310490000be14d67b1221","url_list":["https://p11.douyinpic.com/aweme/720x720/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p26.douyinpic.com/aweme/720x720/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p3.douyinpic.com/aweme/720x720/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662"]},"avatar_thumb":{"uri":"100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221","url_list":["https://p11.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p26.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662","https://p3.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_310490000be14d67b1221.jpeg?from=2956013662"]},"aweme_count":2344,"card_entries":null,"custom_verify":"","enterprise_verify_reason":"","favoriting_count":911,"follow_status":0,"follower_count":6231916,"follower_status":0,"followers_detail":null,"following_count":189,"geofencing":null,"has_orders":false,"is_ad_fake":false,"is_enterprise_vip":true,"is_gov_media_vip":false,"mix_info":null,"nickname":"王者荣耀桑杰","original_musician":{"music_count":0,"music_used_count":0},"platform_sync_info":null,"policy_version":null,"rate":1,"region":"CN","sec_uid":"MS4wLjABAAAAH0Muz9yuNuxbK94G2D0qnBbG68a4sUszfiji49ym19TjR8bhXwpAqORdzmW2fr6G","secret":0,"short_id":"2834154573","signature":"百段国服主播陪🥣V：2934352 （9.9体验）\\\\n88 3小时国服车队🚗V：4629810\\\\n自家工作室🛰️: timi3088\\\\n处理工作室订单问题🛰️: 5317745\\\\n国服最帅元歌","status":1,"story_open":false,"total_favorited":"316619066","type_label":[188,6916890329354340000,6972482242996079000,6990279189752449000,7381313570765556000],"uid":"2510911478709149","unique_id":"hrj011221","user_canceled":false,"verification_type":1,"video_icon":{"uri":"","url_list":[]},"with_commerce_entry":false,"with_fusion_shop_entry":true,"with_shop_entry":false}}\'></friend>你好啊</p>',
//               visibleType: 1,
//             },
//           },
//         ],
//         callBackData: {},
//       },
//       '123',
//     );
//     console.log(JSON.stringify(result, null, 2));
//     await Task.Delay(40 * 60 * 1000);
//   },
//   40 * 60 * 1000,
// );
//
// describe.runIf(true)('【新版发布流程】', () => {
//   test(
//     'B站文章',
//     async () => {
//       const result = Cloud.pushOpenPlatformPublishTask(
//         {
//           publishType: 'video',
//           callBackData: null,
//           publishChannel: 'cloud',
//           tasks: [
//             {
//               taskId: '7565895293737123855',
//               authorInfo: {
//                 id: 'cmh4mg14t01pl482hn0lke17v',
//                 proxy: {
//                   serverAdd: '106.15.138.47',
//                   serverPort: 44009,
//                   userName: 'kmayhgjq',
//                   password: '3kTXC4Jr35Dk8OiVKzKimTG4',
//                   name: '',
//                 },
//               },
//               publishData: {
//                 video: {
//                   duration: 9.042,
//                   width: 1080,
//                   height: 1936,
//                   size: 7286135,
//                   url: 'https://muse.console.volcengine.com/api/storage/objects/media/7565801937866833955_origin.mp4?x-muse-token=ChYIARABGLnr%2FccGILmOg8gGKgQ2Mjk1Em8KDQiHgIOS2NDKy2EQg1cSABoCGAIiCAoCbHESAmNuKgYI2jQQhgMyAEIUChJpY2FyY2guaWFtLmF1dGhycGNKLi9hcGkvc3RvcmFnZS9vYmplY3RzL21lZGlhLzc1NjU4MDE5Mzc4NjY4MzM5NTUa2AJGdnRTd2dESVJmTWI5b3hrRlhtUWxMSktPL3dVL1dWMTlxeUNSbGh0bFc1RWhOdmpYRXErQWkwaHdzMXpvazA1V0JJNGx2R1NZMjdiNGRGQ0VmcmVnNXFYVnBlblA0VFc1OXBCakRmUHRQWmZadzNpR1MvRHRvaCswa3FQa1N1U3pXbjVYS0V1am1ibnRWcDhSbEVkUGQ0dnFZTjlQbk4ybzB1U1BHYUdGVGRhQjZ4cW1vcEtMTnhxbjRrK0VGdFJJZzgxSnFvVlhCM05YTnRxU2QvQWFab0NLdU9QelpwWHhWZ1QvZXdEbnBUanRDbmFySFo0N0Y4Vy9RVXh4MzNna1lYMlZLY0YzUHZFK2tOZFpubHVHeTFvU2FmYzFHeDUwR3pjTlE2R0E0RzlSZnRiaGUxTTE3YmRCS3ZaZHllSzQ1VDg4cWw2M09aQzN2MXJnL1lCeUE9PQ%3D%3D&infer_mime=ext',
//                 },
//                 covers: [
//                   {
//                     width: 0,
//                     height: 0,
//                     size: 0,
//                     pathOrUrl:
//                       'https://muse.console.volcengine.com/api/storage/objects/media/7565802176770064411_origin.jpeg?x-muse-token=ChYIARABGLnr%2FccGILmOg8gGKgQ2Mjk1Em8KDQiHgIOS2NDKy2EQg1cSABoCGAIiCAoCbHESAmNuKgYI2jQQhgMyAEIUChJpY2FyY2guaWFtLmF1dGhycGNKLi9hcGkvc3RvcmFnZS9vYmplY3RzL21lZGlhLzc1NjU4MDIxNzY3NzAwNjQ0MTEa2AJzQ1VOdmNzc0RIb3Fyb2ZlUzVUdkp5Uk4zQS9hWFJ6MmZTSkZvZjU0NmdQU1JjZ0RlVHNnZTJDSEFINGkyT2NaZFRFbGl6aUdmVWluR2d6NGJSRERhWllOeGRObENPaUxvREJBVktyOVdWcmsvbDJ2TTFLZDRFUkp3YXVySDJnZGhyNndtS25XOTlZYjg1UlM5bEdJMHlxa25YaWJ2aFc5WFM4K3ZyODRxOFd0emJNbW9ZZjRBcWIzWlpFR3VHNThERW5hb0xaT3YvbnBEVmhuMGVYcEpLSm9ITzgrb3lBZUVsV0d2OHFrcnF4U29CREJoNUxGM3p0bi9HY2R3RG44Yzc3OTBuSTh3bmhvUlgyMnZWN2ZjZFV4bVJNZUJ2SEpyWHlldjZUNW1vOUhOWTFpNzUydkRvNnVXNFJzcWdaSGZMVm9pS1dHanFCeGl6QWtzUDFUR1E9PQ%3D%3D&infer_mime=ext',
//                     format: '',
//                   },
//                 ],
//                 title: 'midj_2',
//                 desc: '<p>midj_2.mp4</p>',
//                 statement: null,
//                 location: null,
//                 group_shopping: {
//                   brand_switch_value: "2",
//                   sale_title: '宝宝宴',
//                   data: {
//                     yixiaoerId: '1809339924329523',
//                     yixiaoerName: '宝宝宴',
//                     yixiaoerImageUrl: '',
//                     yixiaoerDesc: '',
//                     price: 0,
//                     earnPrice: 0,
//                     count: 0,
//                     raw: {
//                       actual_price: 68800,
//                       alliance_task_detail_list: [],
//                       blur_sale_count: '月售 0',
//                       blur_sale_count_l30: '0',
//                       common_anchor_content: '{}',
//                       discount: '4.1折',
//                       display_cps: { earn_price: 0, take_rate: 0, take_rate_range: [] },
//                       earn_price: 0,
//                       image_url: {
//                         uri: 'tos-cn-i-hf2m9xxmck/9874423f2a8d42b49d7a17e6c3d648f2',
//                         url_list: [
//                           'https://p26-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/9874423f2a8d42b49d7a17e6c3d648f2~c5_200x200.jpeg?x-expires=1761591600&x-signature=FqVAZcwsh8wIROsCPAcFOW2TzZE%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=20251027213729572BF1B0A84B2824972C',
//                           'https://p3-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/9874423f2a8d42b49d7a17e6c3d648f2~c5_200x200.jpeg?x-expires=1761591600&x-signature=y5lJOwxpqRCBIfiMAcyrzRbGJyA%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=20251027213729572BF1B0A84B2824972C',
//                           'https://p11-sign.douyinpic.com/tos-cn-i-hf2m9xxmck/9874423f2a8d42b49d7a17e6c3d648f2~c5_200x200.jpeg?x-expires=1761591600&x-signature=O3RH9owPWt6Fjptfxxoyipq7ZVQ%3D&from=218481184&se=false&biz_tag=psm_life.video.api&l=20251027213729572BF1B0A84B2824972C',
//                         ],
//                       },
//                       is_clue: false,
//                       is_member_exclusive_product: false,
//                       poi: {
//                         Staturated_tags: null,
//                         channel_exclusive: null,
//                         cps_commission_rate_range: null,
//                         cps_commission_value_range: null,
//                         effect_ids: null,
//                         fulfill_task_list: null,
//                         icon_service_type_list: null,
//                         poi_detail_tags: null,
//                         poi_frontend_type: null,
//                         poi_id: '7314913600315852827',
//                         poi_name: '告白气球•派对策划•求婚订婚•宝宝生日宴布置(长沙梅溪...',
//                         poi_ranks: null,
//                         poi_search_tags: null,
//                         poi_search_tags_v2: null,
//                         service_type_list: null,
//                         voucher_release_areas: null,
//                       },
//                       poi_count: 1,
//                       product_biz_line: 1,
//                       product_type: 1,
//                       promote_spu_user_cnt: 0,
//                       sale_price: 168000,
//                       show_type: 1,
//                       sold: 0,
//                       sold_l30: 0,
//                       spu_entry: {
//                         schema_type: 3,
//                         url: 'aweme://webview/?url=https%3A%2F%2Faweme.snssdk.com%2Finsights%2Frn%2Fgroupon_detail%3Fhide_nav_bar%3D1%26enter_from%3Dpoi%26groupon_channel%3Dlink%26activity_id%3D1809339924329523&rn_schema=aweme%3A%2F%2Freactnative%2F%3Fchannel%3Dmp_lynx_groupon_detail%26bundle%3Dindex.js%26module_name%3Dpage_groupon_detail%26enter_from%3Dpoi%26groupon_channel%3Dlink%26activity_id%3D1809339924329523%26hide_nav_bar%3D1',
//                       },
//                       spu_id: '1809339924329523',
//                       spu_marketing: { coupon_types: null, spu_marketing_tags: null },
//                       spu_name: '宝宝宴',
//                       spu_tags: { source: { name: '官方', style: 'official', type: 1 } },
//                       spu_tags_list: null,
//                       stock: 999,
//                       tag: { name: '官方', style: 'official', type: 1 },
//                       take_rate: 0,
//                       track_params: '{"product_sub_type":0,"product_type":1}',
//                     },
//                   },
//                 },
//                 shopping_cart: null,
//                 visibleType: 1,
//                 prePubTime: 0,
//               },
//             },
//           ],
//           platform: [
//             {
//               id: 'cmh4mg14t01pl482hn0lke17v',
//               platformCode: 'DouYin',
//               platformUserId: '171170408704590',
//               platformUserName: '蚁小二多账号管理工具',
//               platformCookie:
//                 '[{"name":"gd_random","value":"eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC43MDMxNzMyOTU0OTUyNzE5fQ==.IBO2GYfp33eK6/4gh6sQXfVs9rwJBrnyVxsb5RBp7kc=","domain":"creator.douyin.com","hostOnly":true,"path":"/goofy/douyin_creator_pc/creator_pc_vmok_common/vmok-manifest.json","secure":false,"httpOnly":true,"session":false,"expirationDate":1761901259.961317,"sameSite":"unspecified"},{"name":"gd_random","value":"eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC43MDMxNzMyOTU0OTUyNzE5fQ==.IBO2GYfp33eK6/4gh6sQXfVs9rwJBrnyVxsb5RBp7kc=","domain":"creator.douyin.com","hostOnly":true,"path":"/goofy/douyin_creator_pc/mono/creator_content","secure":false,"httpOnly":true,"session":false,"expirationDate":1761901269.959265,"sameSite":"unspecified"},{"name":"gd_random","value":"eyJwZXJjZW50IjowLjcwMzE3MzI5NTQ5NTI3MTksIm1hdGNoIjp0cnVlfQ==.xNtwyhwXi7uXQncDZBnLqg91ntjnLug9Ki4IV27saCU=","domain":"creator.douyin.com","hostOnly":true,"path":"/goofy/douyin_creator_pc","secure":false,"httpOnly":true,"session":false,"expirationDate":1761901269.982316,"sameSite":"unspecified"},{"name":"x-web-secsdk-uid","value":"69a6a8ee-e563-495e-a7be-c9c318aa3891","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"gfkadpd","value":"2906,33638","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1761555620,"sameSite":"no_restriction"},{"name":"_tea_utm_cache_2906","value":"undefined","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761901221,"sameSite":"unspecified"},{"name":"csrf_session_id","value":"5d1040fd65909ff4ae31951ce2925302","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"bd_ticket_guard_client_web_domain","value":"2","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480460.407617,"sameSite":"unspecified"},{"name":"passport_csrf_token","value":"75af1c4d8d36592ecfa769b4c77662e9","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1766480423.585921,"sameSite":"no_restriction"},{"name":"passport_csrf_token_default","value":"75af1c4d8d36592ecfa769b4c77662e9","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480423.58599,"sameSite":"unspecified"},{"name":"sdk_source_info","value":"7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e5827292771273f2734353c343631333c37343332342778","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761296731.938945,"sameSite":"unspecified"},{"name":"bit_env","value":"MyYTdAig4DRZ5lMwFAz-s2fVO7x0UW4dJzpyd3q4pJJ4bxTsbZpGzYYjgf1Kf9KUNmrId98ha3YKpTlN-oVQEOtjLjKOgS6SILbRAbyppSCmBGvX-njnX6JXDSqv-chSP_eGDHqdRQH8uFhUBFYgJZWoHOjQdkV2YWOZ_EJ-pq9XS-Lxv_XNdA7WPPV-m4ED-rnqTrSWrAON8tsRNteDhbmX_nKURrT25utxxQK3ZOf_06iHRb3RXEBPV3-aW_-3j8jKtBXcvswILq_R2MQi93fLUvleuRTqxS7xOfR8bdFHRSYuI9N4TGPP3DeY0zIg1InNuzza4STQ2j3nfKYvYWqlDADt1_EIMhMyKH7IAySKOVPHkrh8rfOppkwbJyx29iCuLD5wWyuFOzTZpqrY72tSc-40esWWCOhi2jz6aQUpzrfL3n1nw-3yBu824pXgmkKE0VoaQydU1XvVo_5mkBC0_-ZUL1r60tHVNLKFD5ngxN321X8akWiYxeMoNEWKuzcGjqoTeZTj8xv8cgWLODkkBYr5v8sHKTNJvKBlIdcJRgQB0UUbDp57CIW2q7FW","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761296731.939084,"sameSite":"unspecified"},{"name":"gulu_source_res","value":"eyJwX2luIjoiMjA3MmI0MDNmZTBmZWNiZGJhZmI3YWIxM2ZkZDMzOTA4M2Q0MTIxOTk2ZGM1OTY1NGI0YTFjZmQ0ZTY4YjdlNCJ9","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761296731.939127,"sameSite":"unspecified"},{"name":"passport_auth_mix_state","value":"8da6pj37zvn980sx58ia41jca87dh0l3xr9uw6rsrx01fb6e","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761296671.939251,"sameSite":"unspecified"},{"name":"biz_trace_id","value":"251e82b5","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"passport_mfa_token","value":"Cjaqaxb80Dpt%2B9tN%2BwDlzzBlN76CnPzLg2B63QRZniuIRAp9Y1B0x1U5TLEh%2FJxZ0w8huZPT2F8aSgo8AAAAAAAAAAAAAE%2Bhep%2Fbia7BbmgT5IitRbvyqccN2QwGXV1tKqdrogdGg%2Bvnyg%2BaOkufybve2HKD8PImENLW%2Fw0Y9rHRbCACIgEDfxcKkA%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480458.752876,"sameSite":"unspecified"},{"name":"d_ticket","value":"f14f268c5ec7ec31073484acb44214d3b5261","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1792832458.752956,"sameSite":"unspecified"},{"name":"odin_tt","value":"3a46c10044b2ed2a7ad8d074a74c6a0882d993d32be45926b78a54760d4bd712962bde618a3589c6f23fcc1e61a52d9c255ffa89c1468ff25432eda23f9c8513","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1792832459.271803,"sameSite":"unspecified"},{"name":"passport_assist_user","value":"CkARoD-G6tmJJUicMpQ_JE2cgg4WulfY67IMUsMsHB4j0xt7CuLjJurvmPy5Yr9yC6zLT1irlvsd1w0nfhjX5DiLGkoKPAAAAAAAAAAAAABPoRVLcnSODmHzgjPBL9NyY2LJqyAIUhgJTZ8cx9Vlh--tTwnLfp_s8u-yyP_gffAIpBD_1v8NGImv1lQgASIBAyIW6yM%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1795856459.2719,"sameSite":"unspecified"},{"name":"n_mh","value":"Y4mnv0O1fs1r21s6RJ1i417fc86gMq6iIw0ek-d4nLc","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1771664459.271939,"sameSite":"unspecified"},{"name":"sid_guard","value":"278cb5cb5946384eb2bc40681377d0a2%7C1761296459%7C5184000%7CTue%2C+23-Dec-2025+09%3A00%3A59+GMT","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1792400459.271954,"sameSite":"unspecified"},{"name":"uid_tt","value":"d35bf794c43115572d76bbe2be09adbf","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.271967,"sameSite":"unspecified"},{"name":"uid_tt_ss","value":"d35bf794c43115572d76bbe2be09adbf","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.271978,"sameSite":"no_restriction"},{"name":"sid_tt","value":"278cb5cb5946384eb2bc40681377d0a2","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.271992,"sameSite":"unspecified"},{"name":"sessionid","value":"278cb5cb5946384eb2bc40681377d0a2","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.272004,"sameSite":"unspecified"},{"name":"sessionid_ss","value":"278cb5cb5946384eb2bc40681377d0a2","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.272016,"sameSite":"no_restriction"},{"name":"session_tlb_tag","value":"sttt%7C14%7CJ4y1y1lGOE6yvEBoE3fQov_________R6q1fCyGmJ8Ey4Ap5pC0YX6j7oyjM-qDGaSOQ2VONlIM%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.272027,"sameSite":"no_restriction"},{"name":"is_staff_user","value":"false","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.272038,"sameSite":"unspecified"},{"name":"sid_ucp_v1","value":"1.0.0-KGZhMThhYWRhZWE0MDE3MDk1N2Q3MDg1YzU1ZGEwOTkwMmJjMGUzMGUKIAjO1KC72_UmEMuA7ccGGNoWIAww3u7t7gU4B0D0B0gEGgJobCIgMjc4Y2I1Y2I1OTQ2Mzg0ZWIyYmM0MDY4MTM3N2QwYTI","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.272047,"sameSite":"unspecified"},{"name":"ssid_ucp_v1","value":"1.0.0-KGZhMThhYWRhZWE0MDE3MDk1N2Q3MDg1YzU1ZGEwOTkwMmJjMGUzMGUKIAjO1KC72_UmEMuA7ccGGNoWIAww3u7t7gU4B0D0B0gEGgJobCIgMjc4Y2I1Y2I1OTQ2Mzg0ZWIyYmM0MDY4MTM3N2QwYTI","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1766480459.272059,"sameSite":"no_restriction"},{"name":"_bd_ticket_crypt_doamin","value":"2","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480459.275692,"sameSite":"unspecified"},{"name":"_bd_ticket_crypt_cookie","value":"5008ef4c42c3a3a0687bbde5a270a9cb","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480459.277192,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_sign_data_key_web_protect","value":"a8baf362-4f66-9072","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480459.277968,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_cert_key","value":"69ca12d8-41f8-9b72","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480459.278061,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_crypt_sdk","value":"76bb4d69-4dff-b9ed","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480459.27825,"sameSite":"unspecified"},{"name":"__security_server_data_status","value":"1","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480459.283501,"sameSite":"unspecified"},{"name":"gd_random","value":"eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC43MDMxNzMyOTU0OTUyNzE5fQ==.IBO2GYfp33eK6/4gh6sQXfVs9rwJBrnyVxsb5RBp7kc=","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1761901259.412068,"sameSite":"unspecified"},{"name":"ttwid","value":"1%7CJroOQl1msc1ndPU59bzqhjI1pv1E_rkMpRZd_LvhZ4U%7C1761296460%7C05dfa14c7fda24f109212b50a116c9c901207f55b3670782ea5b1550b1ab27e7","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1792832459.984611,"sameSite":"unspecified"},{"name":"bd_ticket_guard_client_data","value":"eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCRTVtUUtjZXM3WnZKR0RYZzIvUS9NY2ozNTRuYTdDQ0NHQTFhOWlCN3dETTBpUFJzaUk4aENWTU5YRU9nNERkN2V1M2FHMUtGV2dENUY0aDAzaDVwMDA9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480460.407566,"sameSite":"unspecified"},{"name":"fg_uid","value":"RID2025102417010281BDAEEF84D4102378CE","domain":"api.feelgood.cn","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1792832462.19357,"sameSite":"no_restriction"},{"name":"csrf_session_id","value":"5d1040fd65909ff4ae31951ce2925302","domain":"summon.bytedance.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"passport_fe_beating_status","value":"true","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"bd_ticket_guard_client_data_v2","value":"eyJyZWVfcHVibGljX2tleSI6IkJFNW1RS2NlczdadkpHRFhnMi9RL01jajM1NG5hN0NDQ0dBMWE5aUI3d0RNMGlQUnNpSThoQ1ZNTlhFT2c0RGQ3ZXUzYUcxS0ZXZ0Q1RjRoMDNoNXAwMD0iLCJ0c19zaWduIjoidHMuMi5iYzdhM2JkMzlmZDk5Zjc4YWExYmMzOTQxOTZmNTI5OGNhOGNiMTRkNzUzZGFmMTQxYTk0YTU5YjAwZDQyZmQxYzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJSNFcrYk1Mci8zdDRBR2F5RmRJRGptRHJnSHlnZ1dzbWNlNkhBVi8xSUw0PSIsInNlY190cyI6IiNPaUdkSndQSnNqa0dlUG1QNlpTbWp6eHJPZDRwOVR6TVJXcTNvZFI2V05ZSVc1UURNRTZ1Umh2K3BualUifQ%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1766480470.583653,"sameSite":"unspecified"}]',
//               platformLocalStorage:
//                 '{"https://creator.douyin.com-operation":"true","__tea_cache_first_5231":"1","__tea_cache_first_1661":"1","__tea_cache_tokens_408314":"{\\"web_id\\":\\"7564710681972033064\\",\\"user_unique_id\\":\\"7564710681972033064\\",\\"timestamp\\":1761296464464,\\"_type_\\":\\"default\\"}","SLARDARdouyin_creator":"JTdCJTIydXNlcklkJTIyOiUyMjE3MTE3MDQwODcwNDU5MCUyMiwlMjJkZXZpY2VJZCUyMjolMjI3NjIyZDdlYS0yZTJkLTQwOTEtOTkyNS0xOGY3NzEyM2Y4ZGUlMjIsJTIyZXhwaXJlcyUyMjoxNzY5MDcyNDU5NzcyJTdE","__tea_sdk_ab_version_2906":"{\\"ab_version\\":[\\"90613695\\",\\"90112463\\",\\"90111556\\"],\\"ab_ext_version\\":[],\\"ab_version_multilink\\":[],\\"data\\":{\\"assistantImage\\":{\\"val\\":1,\\"vid\\":\\"90116780\\"},\\"chapter_recommend_after_publish\\":{\\"val\\":0,\\"vid\\":\\"14187473\\"},\\"chapter_sync_reach\\":{\\"val\\":1,\\"vid\\":\\"91050166\\"},\\"chapter_video_status\\":{\\"val\\":2,\\"vid\\":\\"90953361\\"},\\"co_create_new_role\\":{\\"val\\":true,\\"vid\\":\\"90611581\\"},\\"collection_enable_set_secret_status\\":{\\"val\\":1,\\"vid\\":\\"90124858\\"},\\"cover_editor_interaction_opti\\":{\\"val\\":2,\\"vid\\":\\"90599399\\"},\\"cover_h265_ffmpeg_capture\\":{\\"val\\":true,\\"vid\\":\\"90166065\\"},\\"creatorDynamicConfigV3\\":{\\"val\\":{\\"dynamicSliceRule\\":{\\"highSize\\":10485760,\\"lowNormalThreshold\\":200,\\"lowSize\\":3145728,\\"normalHighThreshold\\":400,\\"normalSize\\":5242880},\\"enableDynamicSlice\\":true,\\"enableDynamicSliceMinFileSize\\":52428800,\\"enableRouteSelect\\":false},\\"vid\\":\\"91210179\\"},\\"creator_comment_manage\\":{\\"val\\":1,\\"vid\\":\\"90613695\\"},\\"creator_danmaku_manage\\":{\\"val\\":{\\"menus_show\\":1},\\"vid\\":\\"90118007\\"},\\"creator_data_bullet_analysis\\":{\\"val\\":{\\"bullet_analysis_tab_show\\":2},\\"vid\\":\\"90128271\\"},\\"creator_data_new\\":{\\"val\\":true,\\"vid\\":\\"90081040\\"},\\"creator_data_progress_analysis\\":{\\"val\\":{\\"fans_analysis_tab_show\\":1},\\"vid\\":\\"90128191\\"},\\"creator_pc\\":{\\"val\\":{\\"tab_ab_show_new_home\\":1},\\"vid\\":\\"90109488\\"},\\"creator_pc_1_3_intell_chapter\\":{\\"val\\":1,\\"vid\\":\\"90122502\\"},\\"creator_pc_clip\\":{\\"val\\":{\\"capcut\\":1},\\"vid\\":\\"90119963\\"},\\"creator_pc_cover_min_size\\":{\\"val\\":2,\\"vid\\":\\"90126311\\"},\\"creator_pc_data_center\\":{\\"val\\":{\\"is_new_live_content\\":1},\\"vid\\":\\"90111860\\"},\\"creator_pc_data_center_new_list\\":{\\"val\\":1,\\"vid\\":\\"90625082\\"},\\"creator_pc_game_mounted_anchor_reedit\\":{\\"val\\":1,\\"vid\\":\\"90122407\\"},\\"creator_pc_game_mounted_anchor_revision_v2\\":{\\"val\\":2,\\"vid\\":\\"90125303\\"},\\"creator_pc_game_mounted_game_activity_profit\\":{\\"val\\":3,\\"vid\\":\\"90127201\\"},\\"creator_pc_home\\":{\\"val\\":{\\"interactive_show_type\\":2},\\"vid\\":\\"90111556\\"},\\"creator_pc_image_music_optimization\\":{\\"val\\":1,\\"vid\\":\\"90962255\\"},\\"creator_pc_mission\\":{\\"val\\":{\\"visible\\":1},\\"vid\\":\\"90112463\\"},\\"creator_pc_modify_item_entrance\\":{\\"val\\":1,\\"vid\\":\\"90128660\\"},\\"creator_pc_new_cover_text\\":{\\"val\\":true,\\"vid\\":\\"90125008\\"},\\"creator_pc_org\\":{\\"val\\":{\\"new_org\\":1},\\"vid\\":\\"90123271\\"},\\"creator_pc_org_home\\":{\\"val\\":{\\"new_home\\":1},\\"vid\\":\\"90112354\\"},\\"creator_pc_recommend_cover_opt\\":{\\"val\\":true,\\"vid\\":\\"90127437\\"},\\"creator_pc_tab_ab\\":{\\"val\\":{\\"account_show\\":2},\\"vid\\":\\"90092974\\"},\\"creator_pc_upload_cancel_btn\\":{\\"val\\":0,\\"vid\\":\\"90173282\\"},\\"creator_pc_upload_progress_detail\\":{\\"val\\":1,\\"vid\\":\\"90173281\\"},\\"creator_pc_video_music_optimization\\":{\\"val\\":1,\\"vid\\":\\"90945842\\"},\\"creator_pc_video_quality_intro\\":{\\"val\\":2,\\"vid\\":\\"91037348\\"},\\"creator_pc_work_detail_version\\":{\\"val\\":1,\\"vid\\":\\"90356254\\"},\\"creator_publish_cover_check\\":{\\"val\\":1,\\"vid\\":\\"90122334\\"},\\"creator_school_nav\\":{\\"val\\":{\\"nav_type\\":1},\\"vid\\":\\"90081895\\"},\\"creator_upload_async\\":{\\"val\\":1,\\"vid\\":\\"90324260\\"},\\"creator_upload_cancel\\":{\\"val\\":1,\\"vid\\":\\"90124601\\"},\\"creator_uploader_tos_direct\\":{\\"val\\":1,\\"vid\\":\\"90126365\\"},\\"data_cover_rate\\":{\\"val\\":{\\"is_show_cover_rate\\":true},\\"vid\\":\\"90121311\\"},\\"dict\\":{\\"val\\":{\\"canShowUserDeclaration\\":true},\\"vid\\":\\"90114001\\"},\\"douyin_cover_imagelayer_editable\\":{\\"val\\":true,\\"vid\\":\\"90111484\\"},\\"douyin_outer_progress_enbale\\":{\\"val\\":1,\\"vid\\":\\"90118893\\"},\\"douyin_pc_creator_image_text\\":{\\"val\\":true,\\"vid\\":\\"90093311\\"},\\"download_frame_limit\\":{\\"val\\":3,\\"vid\\":\\"91217036\\"},\\"editor_filter\\":{\\"val\\":true,\\"vid\\":\\"90122909\\"},\\"enableChapterSelfMade\\":{\\"val\\":1,\\"vid\\":\\"90940916\\"},\\"enhance_cover_check_dual\\":{\\"val\\":1,\\"vid\\":\\"90906860\\"},\\"is_new_loki\\":{\\"val\\":1,\\"vid\\":\\"90975626\\"},\\"is_show_pc_content_analysis\\":{\\"val\\":{\\"enabled\\":1},\\"vid\\":\\"90118423\\"},\\"is_show_tagged_page\\":{\\"val\\":true,\\"vid\\":\\"90992719\\"},\\"limit_recommend_cover_local\\":{\\"val\\":true,\\"vid\\":\\"91283345\\"},\\"maxReadConcurrent\\":{\\"val\\":5,\\"vid\\":\\"91210181\\"},\\"openReadConcurrent\\":{\\"val\\":true,\\"vid\\":\\"91210180\\"},\\"publish_layout\\":{\\"val\\":2,\\"vid\\":\\"91020340\\"},\\"quick_fill\\":{\\"val\\":true,\\"vid\\":\\"90997687\\"},\\"recommend_chapter_async_link\\":{\\"val\\":1,\\"vid\\":\\"90129292\\"},\\"refine_cover_tool\\":{\\"val\\":2,\\"vid\\":\\"90120266\\"},\\"show_activity_tag\\":{\\"val\\":true,\\"vid\\":\\"90102355\\"},\\"show_info\\":{\\"val\\":1,\\"vid\\":\\"90126292\\"},\\"show_intellect_chapter_entry\\":{\\"val\\":1,\\"vid\\":\\"90094899\\"},\\"slardar_filter\\":{\\"val\\":true,\\"vid\\":\\"90122697\\"},\\"table_tab\\":{\\"val\\":\\"contribute\\",\\"vid\\":\\"90094565\\"},\\"test\\":{\\"val\\":true,\\"vid\\":\\"90082519\\"},\\"title_permission_new\\":{\\"val\\":1,\\"vid\\":\\"90111481\\"},\\"use_new_player\\":{\\"val\\":true,\\"vid\\":\\"91048272\\"},\\"vertical_video_double_cover\\":{\\"val\\":1,\\"vid\\":\\"91234029\\"}},\\"timestamp\\":1761296461476,\\"uuid\\":\\"171170408704590\\"}","security-sdk/s_sdk_pri_key":"{\\"key\\":\\"security-sdk/s_sdk_pri_key\\",\\"data\\":\\"-----BEGIN PRIVATE KEY-----\\\\r\\\\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg3G+fV2UaQ/yZj6Mq\\\\r\\\\njzJ+nXu5NImvn8Vz9z9luzRVWRShRANCAAR95Z9T+qv+iAu6K5ihtz8L/4fFXZhi\\\\r\\\\nkCaZq9UHY1Ckr4Fb+zWcEbfLIt18HLYMsckCknSmxH4xNWASX/Lc78Ib\\\\r\\\\n-----END PRIVATE KEY-----\\\\r\\\\n\\",\\"createTime\\":1761296465124,\\"expireTime\\":4102444799000}","security-sdk/s_sdk_cert_key":"{\\"key\\":\\"security-sdk/s_sdk_cert_key\\",\\"data\\":\\"-----BEGIN CERTIFICATE-----\\\\nMIICGTCCAb+gAwIBAgIVAJvc8wWjhr6S7jPHtxhxYc3E/8uBMAoGCCqGSM49BAMC\\\\nMDExCzAJBgNVBAYTAkNOMSIwIAYDVQQDDBl0aWNrZXRfZ3VhcmRfY2FfZWNkc2Ff\\\\nMjU2MB4XDTI1MTAyNDA5MDEwNVoXDTM1MTAyNDE3MDEwNVowJzELMAkGA1UEBhMC\\\\nQ04xGDAWBgNVBAMMD2JkX3RpY2tldF9ndWFyZDBZMBMGByqGSM49AgEGCCqGSM49\\\\nAwEHA0IABH3ln1P6q/6IC7ormKG3Pwv/h8VdmGKQJpmr1QdjUKSvgVv7NZwRt8si\\\\n3XwctgyxyQKSdKbEfjE1YBJf8tzvwhujgb0wgbowDgYDVR0PAQH/BAQDAgWgMDEG\\\\nA1UdJQQqMCgGCCsGAQUFBwMBBggrBgEFBQcDAgYIKwYBBQUHAwMGCCsGAQUFBwME\\\\nMCkGA1UdDgQiBCAVEma3d4EgJ917ywcpL+LiTjlEaGgSWDa+hxN3dQPFFDArBgNV\\\\nHSMEJDAigCAypWfqjmRIEo3MTk1Ae3MUm0dtU3qk0YDXeZSXeyJHgzAdBgNVHREE\\\\nFjAUghJjcmVhdG9yLmRvdXlpbi5jb20wCgYIKoZIzj0EAwIDSAAwRQIhAKyxbeLS\\\\nQIGMFPR29aW15ajYNMWPLRAty26GximKNpYhAiANG7Dq5vItdhlMq58MgnT7jO3Z\\\\nYXdzAMH4sBX9QxAZRg==\\\\n-----END CERTIFICATE-----\\\\n\\",\\"createTime\\":1761296465340,\\"expireTime\\":4102444799000}","xmst":"aUAF8SEZ0haf6NbRoBScb_wE7CHi5vb5APRcUwZafZqLw5mZdsaRAhpuUfD2UPBJpRdI91oWTJw1FUm81NSI-jhTw8yExzymwZ7CdIY-ceu3LZ-o-fvma_LUunrLpadCh5YzEKgL8A7_22KVU-8Mfln2n7JWkzfdcrOVFQzUoHSvmHMmEmbz3w==","login_type_from_login":"\\"\\"","web_secsdk_runtime_cache":"{\\"userAgentCheckReport\\":[\\"userAgentCheckReportcompute\\"]}","__tea_cache_first_408314":"1","__msuuid__":"415c1d0e-a868-4eea-b23f-cecb1df2f2b3","security-sdk/s_sdk_sign_data_key/web_protect":"{\\"data\\":\\"{\\\\\\"ticket\\\\\\":\\\\\\"hash.5Hi9IJwCpOqxU5PYb3HzePyD1PcgS5mMqFIYaaKwc3U=\\\\\\",\\\\\\"ts_sign\\\\\\":\\\\\\"ts.2.bc7a3bd39fd99f78aa1bc394196f5298ca8cb14d753daf141a94a59b00d42fd1c4fbe87d2319cf05318624ceda14911ca406dedbebeddb2e30fce8d4fa02575d\\\\\\",\\\\\\"client_cert\\\\\\":\\\\\\"pub.BE5mQKces7ZvJGDXg2/Q/Mcj354na7CCCGA1a9iB7wDM0iPRsiI8hCVMNXEOg4Dd7eu3aG1KFWgD5F4h03h5p00=\\\\\\",\\\\\\"log_id\\\\\\":\\\\\\"20251024170059031871F73F446A575072\\\\\\",\\\\\\"create_time\\\\\\":1761296459}\\"}","LOGIN_STATUS":"{\\"logintype\\":\\"user\\",\\"loginapp\\":\\"douyin\\"}","SLARDARmfa_web":"JTdCJTIydXNlcklkJTIyOiUyMjgxNGM5NWMzLWI0MGUtNDk4Zi04NGM1LThkZWU0MzA3NDBjMCUyMiwlMjJkZXZpY2VJZCUyMjolMjJiYjljNDE3My03YjVkLTRkMGUtODk4OS03NmY5ZGFmOWMyMWElMjIsJTIyZXhwaXJlcyUyMjoxNzY5MDcyNDQxODQzJTdE","__tea_cache_tokens_5231":"{\\"web_id\\":\\"7564710681762219560\\",\\"user_unique_id\\":\\"7564710681762219560\\",\\"timestamp\\":1761296464527,\\"_type_\\":\\"default\\"}","CREATOR_LAYOUT_CONFIG":"{\\"headerLogo\\":{\\"douyin\\":{\\"src\\":\\"//lf3-static.bytednsdoc.com/obj/eden-cn/lm-yvahlyj-upfbvk/ljhwZthlaukjlkulzlp/pc/icons/logo.png\\"},\\"huoshan\\":{\\"src\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_header_logo_h.png~tplv-obj.image\\"}},\\"hotsoonHelpShow\\":false,\\"footerLink\\":[{\\"children\\":\\"账号授权协议\\",\\"href\\":\\"//lf3-beecdn.bytetos.com/obj/ies-fe-bee/bee_prod/biz_181/bee_prod_181_bee_publish_1095.html\\"},{\\"children\\":\\"用户服务协议\\",\\"href\\":\\" //www.douyin.com/agreement/\\"},{\\"children\\":\\"隐私政策\\",\\"href\\":\\" //www.douyin.com/privacy/\\"},{\\"children\\":\\"账号找回\\",\\"href\\":\\" //www.douyin.com/recovery_account/\\"},{\\"children\\":\\"联系我们\\",\\"href\\":\\" //www.douyin.com/aboutus/\\"}],\\"footerText\\":[[\\"2025 © 抖音\\",\\"[京ICP备16016397号-3](https://beian.miit.gov.cn/)\\",\\"[北京抖音科技有限公司](https://lf3-static.bytednsdoc.com/obj/eden-cn/lm-yvahlyj-upfbvk/ljhwZthlaukjlkulzlp/营业执照.jpg)\\",\\"[京B2-20170846](https://lf3-static.bytednsdoc.com/obj/eden-cn/lm-yvahlyj-upfbvk/ljhwZthlaukjlkulzlp/增值电信业务经营许可证.jpg)\\"],[\\"[中国互联网举报中心](http://www.12377.cn/)\\",\\"[网络文化经营许可证-京网文〔2025〕0181-061号](https://lf3-static.bytednsdoc.com/obj/eden-cn/lm-yvahlyj-upfbvk/ljhwZthlaukjlkulzlp/网络经营许可证.jpg)\\",\\"违法和不良信息举报：400-140-2108\\",\\"举报邮箱：feedback@douyin.com\\"],[\\"![pic](//p3.douyinpic.com/aweme-server-static-resource/gongan_d0289dc.png~tplv-obj.image)\\",\\"[京公网安备11000002002046号](http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11000002002046)\\",\\"地址：北京市海淀区北三环西路甲18号院4号楼2层2022\\"]],\\"permissionKeys\\":[{\\"itemKey\\":\\"/authority\\",\\"text\\":\\"授权管理\\",\\"show\\":true,\\"permission\\":\\"CreatorConferManage\\"},{\\"itemKey\\":\\"/content/\\",\\"text\\":\\"内容管理\\",\\"path\\":[\\"/live/media/create\\",\\"/live/media/room\\",\\"/live/media/list\\"],\\"show\\":true,\\"permission\\":\\"CreatorContentManage\\"},{\\"itemKey\\":\\"/following\\",\\"text\\":\\"互动管理\\",\\"show\\":true,\\"permission\\":\\"CreatorInterManage\\"},{\\"itemKey\\":\\"/data\\",\\"text\\":\\"数据管理\\",\\"path\\":[\\"/live/media/data\\"],\\"show\\":true,\\"permission\\":\\"CreatorDataManage\\"},{\\"itemKey\\":\\"/musician\\",\\"text\\":\\"音乐管理\\",\\"show\\":true,\\"restrictHotsoon\\":true,\\"permission\\":\\"CreatorMusicManage\\"},{\\"itemKey\\":\\"/publicity/topic\\",\\"text\\":\\"宣发管理\\",\\"show\\":false,\\"restrictHotsoon\\":true,\\"permission\\":\\"CreatorContentManage.Challenge\\"}],\\"headerIcons\\":[{\\"src\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_header_notification_icon.svg~tplv-obj.image\\",\\"link\\":\\"https://creator.douyin.com/message\\",\\"visible\\":{\\"has_unread_message\\":false,\\"is_login_hotsoon\\":false}},{\\"src\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_header_notification.png~tplv-obj.image\\",\\"link\\":\\"https://creator.douyin.com/message\\",\\"style\\":{\\"width\\":\\"24px\\",\\"height\\":\\"24px\\"},\\"badge\\":{\\"count\\":\\"unread_message_count\\"},\\"visible\\":{\\"has_unread_message\\":true,\\"is_login_hotsoon\\":false}}],\\"sidebarFollowerTip\\":\\"仅展示抖音粉丝\\",\\"sidebarData\\":{\\"data\\":[{\\"name\\":\\"视频数据\\",\\"keyName\\":\\"CreatorDataManage\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_vedio.svg~tplv-obj.image\\",\\"auth\\":true,\\"children\\":[{\\"path\\":\\"/data/stats/overview\\",\\"name\\":\\"数据总览\\",\\"keyName\\":\\"CreatorDataManage.UserOverview\\",\\"visible\\":{\\"is_login_hotsoon\\":false}},{\\"path\\":\\"/data/stats/video\\",\\"name\\":\\"作品数据\\",\\"keyName\\":\\"CreatorDataManage.ItemL2\\",\\"visible\\":{\\"is_login_hotsoon\\":false}},{\\"path\\":\\"/data/stats/follower/portrait\\",\\"name\\":\\"粉丝画像\\",\\"keyName\\":\\"CreatorDataManage.Portrait\\",\\"visible\\":{\\"is_login_hotsoon\\":false}},{\\"path\\":\\"/data/stats/hotsoon-overview\\",\\"name\\":\\"数据总览\\",\\"keyName\\":\\"CreatorDataManage.UserOverview\\",\\"visible\\":{\\"is_login_hotsoon\\":true}},{\\"path\\":\\"/data/stats/hotsoon-item\\",\\"name\\":\\"作品数据\\",\\"keyName\\":\\"CreatorDataManage.ItemL2\\",\\"visible\\":{\\"is_login_hotsoon\\":true}},{\\"path\\":\\"/weekly\\",\\"name\\":\\"创作周报\\",\\"keyName\\":\\"CreatorDataManage.WeekReport\\",\\"visible\\":{\\"is_login_hotsoon\\":false}}]},{\\"name\\":\\"直播数据\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_data_icon.svg~tplv-obj.image\\",\\"auth\\":true,\\"children\\":[{\\"path\\":\\"/data/live/overview\\",\\"name\\":\\"数据总览\\",\\"key\\":\\"CreatorDataManage.Live\\"},{\\"path\\":\\"/live/media/data\\",\\"name\\":\\"数据总览\\",\\"key\\":\\"CreatorLiveManage.Data\\"},{\\"path\\":\\"/data/live/video\\",\\"name\\":\\"单场数据\\",\\"key\\":\\"CreatorDataManage.Live\\"}]},{\\"name\\":\\"重点关注\\",\\"keyName\\":\\"CreatorDataManage\\",\\"auth\\":true,\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_inportant.svg~tplv-obj.image\\",\\"visible\\":[{\\"status_code\\":8,\\"window.location.host\\":\\"creator.douyin.com\\"},{\\"status_code\\":15384,\\"window.location.host\\":\\"creator.douyin.com\\"},{\\"is_login_hotsoon\\":false}],\\"children\\":[{\\"path\\":\\"/data/important/following\\",\\"name\\":\\"我关心的\\",\\"keyName\\":\\"CreatorDataManage.TraceOthers\\"},{\\"path\\":\\"/data/important/keyword\\",\\"name\\":\\"与我相关\\",\\"keyName\\":\\"CreatorDataManage.SearchSelf\\"}]}],\\"interaction\\":[{\\"name\\":\\"互动管理\\",\\"keyName\\":\\"CreatorInterManage\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_following.svg~tplv-obj.image\\",\\"auth\\":true,\\"children\\":[{\\"path\\":\\"/following/following\\",\\"name\\":\\"关注管理\\"},{\\"path\\":\\"/following/follower\\",\\"name\\":\\"粉丝管理\\"},{\\"path\\":\\"/following/comment\\",\\"name\\":\\"评论管理\\",\\"visible\\":{\\"is_login_hotsoon\\":false}},{\\"path\\":\\"/following/chat\\",\\"name\\":\\"私信管理\\",\\"key\\":\\"CreatorInterManage.im\\",\\"keyName\\":\\"CreatorInterManage.im\\",\\"visible\\":{\\"is_login_hotsoon\\":false,\\"douyin_user_verify_info.teen_model\\":false}}]}],\\"publicity\\":[{\\"name\\":\\"宣发管理\\",\\"key\\":\\"CreatorContentManage.Challenge\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_publicity.svg~tplv-obj.image\\",\\"children\\":[{\\"path\\":\\"/publicity/topic\\",\\"name\\":\\"话题管理\\"}]}],\\"music\\":[{\\"name\\":\\"音乐管理\\",\\"key\\":\\"CreatorMusicManage\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_music.svg~tplv-obj.image\\",\\"children\\":[{\\"path\\":\\"/musician\\",\\"name\\":\\"概览\\"},{\\"path\\":\\"/musician/songs\\",\\"name\\":\\"音乐管理\\"},{\\"path\\":\\"/musician/statistics\\",\\"name\\":\\"数据管理\\"}]}],\\"live\\":[{\\"name\\":\\"直播管理\\",\\"key\\":\\"CreatorLiveManage\\",\\"children\\":[{\\"path\\":\\"/live/media/create\\",\\"name\\":\\"创建直播\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livecreate.svg~tplv-obj.image\\",\\"key\\":\\"CreatorLiveManage.Create\\"},{\\"path\\":\\"/live/media/list\\",\\"name\\":\\"直播列表\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livelist.svg~tplv-obj.image\\",\\"key\\":\\"CreatorLiveManage.List\\"},{\\"path\\":\\"/live/media/replay\\",\\"name\\":\\"直播回放\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livereplay.svg~tplv-obj.image\\",\\"key\\":\\"CreatorLiveManage.Replay\\"}]},{\\"name\\":\\"数据管理\\",\\"key\\":\\"CreatorLiveManage.Data\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livedata.svg~tplv-obj.image\\",\\"children\\":[{\\"path\\":\\"/live/media/data\\",\\"name\\":\\"直播数据\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livedata.svg~tplv-obj.image\\",\\"key\\":\\"CreatorLiveManage.Data\\"}]}],\\"media\\":[{\\"name\\":\\"发布视频\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_upload_v2.svg~tplv-obj.image\\",\\"path\\":[\\"/content/upload\\",\\"/content/publish\\"]},{\\"name\\":\\"内容管理\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_manage_v2.svg~tplv-obj.image\\",\\"children\\":[{\\"path\\":\\"/content/manage\\",\\"name\\":\\"视频管理\\",\\"icon\\":\\"\\"},{\\"path\\":[\\"/content/collection/manage\\",\\"/content/collection/detail\\",\\"/content/collection/create\\"],\\"name\\":\\"合集管理\\",\\"icon\\":\\"\\",\\"visContextKey\\":\\"userInfo.mix_permission\\",\\"visContextValue\\":true},{\\"path\\":\\"/content/safeguard\\",\\"name\\":\\"维权管理\\",\\"icon\\":\\"\\",\\"visContextKey\\":\\"userInfo.permission.user_sign\\",\\"visContextValue\\":true}]},{\\"name\\":\\"直播管理\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_livecreate_v2.svg~tplv-obj.image\\",\\"visContextKey\\":\\"creatorMenu.live_manage\\",\\"visContextValue\\":true,\\"children\\":[{\\"path\\":\\"/live/media/create\\",\\"name\\":\\"创建直播\\",\\"icon\\":\\"\\",\\"key\\":\\"CreatorLiveManage.Create\\",\\"visContextKey\\":\\"creatorMenu.media_auth\\",\\"visContextValue\\":true},{\\"path\\":\\"/live/media/list\\",\\"name\\":\\"直播列表\\",\\"icon\\":\\"\\",\\"key\\":\\"CreatorLiveManage.List\\",\\"visContextKey\\":\\"creatorMenu.media_auth\\",\\"visContextValue\\":true},{\\"path\\":\\"/content/live/replay\\",\\"name\\":\\"直播回放\\",\\"icon\\":\\"\\",\\"key\\":\\"CreatorLiveManage.Replay\\",\\"visContextKey\\":\\"creatorMenu.replay_auth\\",\\"visContextValue\\":true},{\\"path\\":\\"/content/live/replay\\",\\"name\\":\\"直播回放\\",\\"key\\":\\"CreatorCommonManage.Replay\\"}]}]}}","__tea_cache_tokens_2906":"{\\"user_unique_id\\":\\"171170408704590\\",\\"web_id\\":\\"7564710501532534287\\",\\"timestamp\\":1761296461241,\\"_type_\\":\\"default\\"}","__tea_cache_tokens_1661":"{\\"web_id\\":\\"4123151466101091154\\",\\"user_unique_id\\":\\"171170408704590\\",\\"timestamp\\":1761296460286,\\"_type_\\":\\"default\\"}","security-sdk/s_sdk_pub_key":"{\\"key\\":\\"security-sdk/s_sdk_pub_key\\",\\"data\\":\\"-----BEGIN PUBLIC KEY-----\\\\r\\\\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfeWfU/qr/ogLuiuYobc/C/+HxV2Y\\\\r\\\\nYpAmmavVB2NQpK+BW/s1nBG3yyLdfBy2DLHJApJ0psR+MTVgEl/y3O/CGw==\\\\r\\\\n-----END PUBLIC KEY-----\\\\r\\\\n\\",\\"createTime\\":1761296465123,\\"expireTime\\":4102444799000}","SLARDARuc_secure_sdk":"JTdCJTIydXNlcklkJTIyOiUyMjViYTc2M2JkLTY4MGEtNGVmZS1iNmRiLWY0Zjg3NWQwZTQzYyUyMiwlMjJkZXZpY2VJZCUyMjolMjJlZWE3MGYzMy04MzUwLTRiNGUtYTIzNC0xOTBjZmZhMjlhM2QlMjIsJTIyZXhwaXJlcyUyMjoxNzY5MDcyNDYwMjgwJTdE","security-sdk/s_sdk_sign_data_key/token":"{\\"key\\":\\"security-sdk/s_sdk_sign_data_key/token\\",\\"data\\":\\"{\\\\\\"ts_sign\\\\\\":\\\\\\"#8rdJQDJdOf59sXDacKdV2yP2D/tDBLZvGC37mLvljh9LUpo1Ge9fxvyhfUWMqRiS9KSwvbfkj8AuUT3x122x25rHilAR1zJVrkVrtmqbOE5rNyBwMJM63RMldBTe7bnrXAUYFqhkYVU+0+RTmQy7V/pdTXvRDsc/bKTDTRVvCtdzQntg5PzfWSiik5v+XfXMNMdFVeJRi2eBZIVlmUxsufAoEj04i1q/Y0s3QSkN9VmcMOWUEudXro/3zsAxGCVEkvaCT1UGuWcUU6484svusk8spN+l+2NwqxTv5xgYuG2Wo2le0Ai0973vn+kMdDdDs3vUPtSiIklpHcedaUbj6fLy6GWc9YEUVSin4mVjmhj+L6rg9XqjNCaU2GcSAN56D4zhRPHsFT2U9QK2X+rfwzIsqruZ0aJ+TtWUAvfQHaopbZfbaR2JTp+g3M/4qG5xSO6kgJ/U8ZYKquE6GvSDZebw7RXYh3DeBYvZUUb6avgMD2JlfRnFXAejwapm9n+fHRs2jw1kRgKYwH59O2QzKgFHW+qPLDREb0GwQK0Ekp0/uWJ+OG3S299hPKbAcK5YTDsmN7QmOOrTzcYzZoPi+NDIUTae9v/VOmeVeUCcNy9JTBsHgjopjonyA0/qpc/TMhEW2VeE6AeXaMso/Spbs6L/4PNHFYLbP72Fc9QHK/8S2KqEFUPfZckxh5XCQfpt5OfEl3j90UfwcrGOPSaKZR0eM5ZKkiiFZyYwSKK+hfQusEhxHETS7dldMsCmAu5vACwmjLj69gBKARQvdP1EHBAqN6MYJX4nF3atS96W/H1U9J10t7ksROx7h5cebX0Xuf9KTbfAFOPbFsveiAuI8ppsblVgr3H8YTM5J5GltnrRUl1P0mye6SRi0UNC9IBJ6huWYCbZXzK6XwDzXI6dmct/iw25qtD9jJTikOjPXdQYfq1X7VigiI+gLK2zC9nJPJrXuESw8oXd2pPT5y9Q1o3Z3+2EpFEKnmnOi7PsxHrUJAUvlGjogWX1GiFhWSCSeMNnph99ZS0qUad5Wy6MPi0RM5TyxkNWLtx+AOscAk7ufzz8SiJmx9SkwqspwkmcH6drPxVzSlmswbGhgNQdGUJhZRED0TjViuuVzZIicKrUw4ZgYY9T9AA9pqYlRvIdPi3bbkpVJKXdGwC/mrMB2dXrNxhET2t/9B2ubwfO27jbsWZLu6lZYKZ7Psb/f8UBzxkBrrlj+9gD3ijISDr8GMf7JzPBxSJVDdEICuAGYX2rRSVlpgdFwNuAQ87fOQE570k=\\\\\\",\\\\\\"ticket\\\\\\":\\\\\\"YSHGAwEBBwECBOlfnZkBZwFZ1wO/CVBCQQa6lFUrUQ7LpCsCQkPAk2IFM4lsF/nPOIBNKklQqK+Ua4Tix/gXuTf5hy5sjB6Q5YY5qDJbgbo6sKP2Voi1owPCO+HAFGlbaBF17wRSqK4cuCI=\\\\\\",\\\\\\"client_cert\\\\\\":\\\\\\"-----BEGIN CERTIFICATE-----\\\\\\\\nMIICGTCCAb+gAwIBAgIVAJvc8wWjhr6S7jPHtxhxYc3E/8uBMAoGCCqGSM49BAMC\\\\\\\\nMDExCzAJBgNVBAYTAkNOMSIwIAYDVQQDDBl0aWNrZXRfZ3VhcmRfY2FfZWNkc2Ff\\\\\\\\nMjU2MB4XDTI1MTAyNDA5MDEwNVoXDTM1MTAyNDE3MDEwNVowJzELMAkGA1UEBhMC\\\\\\\\nQ04xGDAWBgNVBAMMD2JkX3RpY2tldF9ndWFyZDBZMBMGByqGSM49AgEGCCqGSM49\\\\\\\\nAwEHA0IABH3ln1P6q/6IC7ormKG3Pwv/h8VdmGKQJpmr1QdjUKSvgVv7NZwRt8si\\\\\\\\n3XwctgyxyQKSdKbEfjE1YBJf8tzvwhujgb0wgbowDgYDVR0PAQH/BAQDAgWgMDEG\\\\\\\\nA1UdJQQqMCgGCCsGAQUFBwMBBggrBgEFBQcDAgYIKwYBBQUHAwMGCCsGAQUFBwME\\\\\\\\nMCkGA1UdDgQiBCAVEma3d4EgJ917ywcpL+LiTjlEaGgSWDa+hxN3dQPFFDArBgNV\\\\\\\\nHSMEJDAigCAypWfqjmRIEo3MTk1Ae3MUm0dtU3qk0YDXeZSXeyJHgzAdBgNVHREE\\\\\\\\nFjAUghJjcmVhdG9yLmRvdXlpbi5jb20wCgYIKoZIzj0EAwIDSAAwRQIhAKyxbeLS\\\\\\\\nQIGMFPR29aW15ajYNMWPLRAty26GximKNpYhAiANG7Dq5vItdhlMq58MgnT7jO3Z\\\\\\\\nYXdzAMH4sBX9QxAZRg==\\\\\\\\n-----END CERTIFICATE-----\\\\\\\\n\\\\\\"}\\",\\"createTime\\":1761296465340,\\"expireTime\\":4102444799000}","article_review_status_171170408704590":"{\\"data\\":[{\\"data\\":{\\"application_status\\":\\"\\",\\"reason\\":\\"[int32Default] 0 abErr key not found\\",\\"review_status\\":\\"no_hit_ab\\"},\\"extra\\":{\\"logid\\":\\"202510241701019FB0FC064F264F625EBF\\",\\"now\\":1761296462000},\\"status_code\\":0,\\"status_message\\":\\"\\",\\"x-tt-logid\\":\\"202510241701019FB0FC064F264F625EBF\\"},null],\\"timestamp\\":1761296461673,\\"uid\\":\\"171170408704590\\"}","security-sdk/s_sdk_server_cert_key":"{\\"cert\\":\\"-----BEGIN CERTIFICATE-----\\\\nMIIEfTCCBCKgAwIBAgIUXWdS2tzmSoewCWfKFyiWMrJqs/0wCgYIKoZIzj0EAwIw\\\\nMTELMAkGA1UEBhMCQ04xIjAgBgNVBAMMGXRpY2tldF9ndWFyZF9jYV9lY2RzYV8y\\\\nNTYwIBcNMjIxMTE4MDUyMDA2WhgPMjA2OTEyMzExNjAwMDBaMCQxCzAJBgNVBAYT\\\\nAkNOMRUwEwYDVQQDEwxlY2llcy1zZXJ2ZXIwWTATBgcqhkjOPQIBBggqhkjOPQMB\\\\nBwNCAASE2llDPlfc8Rq+5J5HXhg4edFjPnCF3Ua7JBoiE/foP9m7L5ELIcvxCgEx\\\\naRCHbQ8kCCK/ArZ4FX/qCobZAkToo4IDITCCAx0wDgYDVR0PAQH/BAQDAgWgMDEG\\\\nA1UdJQQqMCgGCCsGAQUFBwMBBggrBgEFBQcDAgYIKwYBBQUHAwMGCCsGAQUFBwME\\\\nMCkGA1UdDgQiBCABydxqGrVEHhtkCWTb/vicGpDZPFPDxv82wiuywUlkBDArBgNV\\\\nHSMEJDAigCAypWfqjmRIEo3MTk1Ae3MUm0dtU3qk0YDXeZSXeyJHgzCCAZQGCCsG\\\\nAQUFBwEBBIIBhjCCAYIwRgYIKwYBBQUHMAGGOmh0dHA6Ly9uZXh1cy1wcm9kdWN0\\\\naW9uLmJ5dGVkYW5jZS5jb20vYXBpL2NlcnRpZmljYXRlL29jc3AwRgYIKwYBBQUH\\\\nMAGGOmh0dHA6Ly9uZXh1cy1wcm9kdWN0aW9uLmJ5dGVkYW5jZS5uZXQvYXBpL2Nl\\\\ncnRpZmljYXRlL29jc3AwdwYIKwYBBQUHMAKGa2h0dHA6Ly9uZXh1cy1wcm9kdWN0\\\\naW9uLmJ5dGVkYW5jZS5jb20vYXBpL2NlcnRpZmljYXRlL2Rvd25sb2FkLzQ4RjlD\\\\nMEU3QjBDNUE3MDVCOTgyQkU1NTE3MDVGNjQ1QzhDODc4QTguY3J0MHcGCCsGAQUF\\\\nBzAChmtodHRwOi8vbmV4dXMtcHJvZHVjdGlvbi5ieXRlZGFuY2UubmV0L2FwaS9j\\\\nZXJ0aWZpY2F0ZS9kb3dubG9hZC80OEY5QzBFN0IwQzVBNzA1Qjk4MkJFNTUxNzA1\\\\nRjY0NUM4Qzg3OEE4LmNydDCB5wYDVR0fBIHfMIHcMGygaqBohmZodHRwOi8vbmV4\\\\ndXMtcHJvZHVjdGlvbi5ieXRlZGFuY2UuY29tL2FwaS9jZXJ0aWZpY2F0ZS9jcmwv\\\\nNDhGOUMwRTdCMEM1QTcwNUI5ODJCRTU1MTcwNUY2NDVDOEM4NzhBOC5jcmwwbKBq\\\\noGiGZmh0dHA6Ly9uZXh1cy1wcm9kdWN0aW9uLmJ5dGVkYW5jZS5uZXQvYXBpL2Nl\\\\ncnRpZmljYXRlL2NybC80OEY5QzBFN0IwQzVBNzA1Qjk4MkJFNTUxNzA1RjY0NUM4\\\\nQzg3OEE4LmNybDAKBggqhkjOPQQDAgNJADBGAiEAqMjT5ADMdGMeaImoJK4J9jzE\\\\nLqZ573rNjsT3k14pK50CIQCLpWHVKWi71qqqrMjiSDvUhpyO1DpTPRHlavPRuaNm\\\\nww==\\\\n-----END CERTIFICATE-----\\",\\"sn\\":\\"533240336124694022040808462028007165443034493949\\",\\"createdTime\\":1761296423775}","SLARDARpassport_token_beat":"JTdCJTIydXNlcklkJTIyOiUyMnlpeGlhb2VyanolMjIsJTIyZGV2aWNlSWQlMjI6JTIyY2M5MjM0MGMtYThkNS00ZjYwLThlNjQtYTg0Yjk4NTEzYmU3JTIyLCUyMmV4cGlyZXMlMjI6MTc2OTA3MjQ3MDYwNiU3RA==","douyin_creator_master_performance_level":"{}","security-sdk/s_sdk_crypt_sdk":"{\\"data\\":\\"{\\\\\\"ec_privateKey\\\\\\":\\\\\\"-----BEGIN PRIVATE KEY-----\\\\\\\\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg5DyRCzaG0GR+LacAbe97W3TnYziS2mqgrmleksu3S1qhRANCAAROZkCnHrO2byRg14Nv0PzHI9+eJ2uwgghgNWvYge8AzNIj0bIiPIQlTDVxDoOA3e3rt2htShVoA+ReIdN4eadN\\\\\\\\n-----END PRIVATE KEY-----\\\\\\",\\\\\\"ec_publicKey\\\\\\":\\\\\\"-----BEGIN PUBLIC KEY-----\\\\\\\\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAETmZApx6ztm8kYNeDb9D8xyPfnidrsIIIYDVr2IHvAMzSI9GyIjyEJUw1cQ6DgN3t67dobUoVaAPkXiHTeHmnTQ==\\\\\\\\n-----END PUBLIC KEY-----\\\\\\",\\\\\\"ec_csr\\\\\\":\\\\\\"\\\\\\"}\\"}","ztsdk_tcc_config":"{\\"value\\":{\\"ztsdk_config\\":{\\"2906\\":[{\\"aid\\":2906,\\"scene\\":\\"web_protect\\",\\"certType\\":\\"cookie\\",\\"providerPathList\\":[],\\"consumerPathList\\":[\\"/aweme/v1/creator/relation/create/\\",\\"/web/api/v2/creator/activity/collect/\\",\\"/live/api/room/create_media_room/\\",\\"/aweme/janus/creator/comment/aweme/v1/web/comment/multi_publish/\\",\\"/aweme/v1/web/comment/multi_publish/\\",\\"/aweme/janus/creator/comment/aweme/v1/comment/publish/\\",\\"/aweme/v1/web/comment/publish/\\",\\"/aweme/janus/creator/comment/aweme/v1/web/comment/digg/\\",\\"/aweme/v1/web/comment/digg/\\",\\"/aweme/janus/creator/comment/aweme/v1/web/comment/multi_delete/\\",\\"/aweme/v1/web/comment/multi_delete/\\",\\"/aweme/v1/creator/comment/reply/\\",\\"/aweme/v1/creator/comment/action/\\"],\\"signVersion\\":2}],\\"6383\\":[{\\"aid\\":6383,\\"scene\\":\\"web_protect\\",\\"certType\\":\\"cookie\\",\\"consumerPathList\\":[\\"/aweme/v1/web/comment/list/reply/\\",\\"/aweme/v1/web/comment/list/\\",\\"/aweme/v2/web/comment/list/reply/\\"],\\"signVersion\\":2}]}},\\"expire\\":1761318022706}","=^_^=athena_web_id":"5618e8e8-457e-441b-ba2e-a948654f6cd6","__tea_cache_first_2906":"1","__url__":"https://creator.douyin.com/"}',
//             },
//           ],
//           authorization: 'sess_129bfabcc63f75c801f00bd19bd141bbdce94a5b18951a4e790b3a36b5907d0b',
//         },
//         '123',
//       );
//       console.log(JSON.stringify(result, null, 2));
//       await Task.Delay(40 * 60 * 1000);
//     },
//     40 * 60 * 1000,
//   );
// });

// describe.runIf(true)('【新版发布流程】', () => {
//   test(
//     '新视频发布',
//     async () => {
//       const result = Cloud.pushOpenPlatformPublishTask(
//         {
//           callBackData: { teamId: '6821ac8d50bc5fd636fa9801', userId: '6842b9707731899191a8ada5' },
//           publishType: 'video',
//           tasks: [
//             {
//               taskId: '692d0b5cf669a757129e261d',
//               publishData: {
//                 video: {
//                   duration: 11.167,
//                   width: 576,
//                   height: 854,
//                   size: 1334329,
//                   url: 'https://oss-v2.yixiaoer.cn/yfb/test/t-6821ac8d50bc5fd636fa9801/m_nj0x8tbuxovefgiv0vi',
//                   localPath: '',
//                 },
//                 covers: [
//                   {
//                     width: 576,
//                     height: 854,
//                     size: 10307,
//                     pathOrUrl: 'https://oss-v2.yixiaoer.cn/yfb/test/t-6821ac8d50bc5fd636fa9801/p6dpw7k0tvh389btrmaom',
//                     format: '',
//                   },
//                 ],
//                 title: '',
//                 desc: '',
//                 location: null,
//                 prePubTime: 0,
//                 visibleType: 0,
//                 statement: null,
//                 group_shopping: null,
//                 shopping_cart: [],
//                 password:'Aa123456'
//               },
//               authorInfo: {
//                 platformName: '抖音',
//                 id: 'cmimkicp50001ea2vab6gpne8',
//               },
//             },
//           ],
//           publishChannel: 'cloud',
//           platform: [
//             {
//               id: 'cmimkicp50001ea2vab6gpne8',
//               platformCode: 'DouYin',
//               platformUserId: '380904169281610',
//               platformUserName: '小二',
//               platformCookie:
//                 '[{"name":"gd_random","value":"eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC41MDQ0NjQ2NjU2MDI2NzU5fQ==.Kl3dCAb0C/I/8C19Y2zI2cx4NHdInjnhzYDA8g50ixE=","domain":"creator.douyin.com","hostOnly":true,"path":"/goofy/douyin_creator_pc/creator_pc_vmok_common/vmok-manifest.json","secure":false,"httpOnly":true,"session":false,"expirationDate":1765163195.126614,"sameSite":"unspecified"},{"name":"x-web-secsdk-uid","value":"e1a3ba99-f781-4a45-9b84-7fb17d2bf04a","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"gfkadpd","value":"2906,33638","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1764817586,"sameSite":"no_restriction"},{"name":"_tea_utm_cache_2906","value":"undefined","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1765163187,"sameSite":"unspecified"},{"name":"csrf_session_id","value":"f19d93741ae8f3f36fd92652bfecf5de","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"bd_ticket_guard_client_data","value":"eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCTkllM0FTemhYZjJMWFZWNHVzODBreTJGSTQySDR2M3l0ZmVLM0tRSEQ0eWlDYzNaMGlGMDhSL3J0c2NXNE95V0VVTVVmeE9lR2RHNExwRzN1aElCR009IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742388.253116,"sameSite":"unspecified"},{"name":"bd_ticket_guard_client_web_domain","value":"2","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742388.253323,"sameSite":"unspecified"},{"name":"passport_csrf_token","value":"cc42033aa59a6e0b86f9078568b6ca24","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1769742388.367219,"sameSite":"no_restriction"},{"name":"passport_csrf_token_default","value":"cc42033aa59a6e0b86f9078568b6ca24","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742388.367299,"sameSite":"unspecified"},{"name":"sdk_source_info","value":"7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e5827292771273f273336323c3d363d3030313332342778","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1764558689.835618,"sameSite":"unspecified"},{"name":"bit_env","value":"CiwFxBYBmkU60HOk13J-anIs8RWPZ8J22vSwTVeo6CBEqGmGC3K7hUZal0JHBSM6PhJVY3gg9Di4p8Wbf5_WAolq60Tig3yvbBx1v4JQ7M8_NJQslF7esyMAv7ajVIk7OmNy1gRK5Wv_NzsGHHaG3h7zG3OnosMgMZnrIMIxKaFi-F0xJ0MiBjhOC-BGHovPGCmQZyugnb9ENR4gZLG_WVB2PiMDMgYA7KCuRj-hxwg4QaCKUhNExg3CJM60U9okaOU8SEpnSYMxkMEdWRV5U5DI3XCx97G3NZHyX7Xdo60WuQjktzNTRLVWS1OclzY8X7SIhrHWrQJIHj0TUdM3Y-1pQzmJFVtJqVwOZFmY2gAg7FfSwVZYrs8Kp89hXWCoLZg9VsP4SjuJu1oIWVXKtadBMCQHIa43_9Vy9E6RVlblkLjyggPQ39eQB0cGjbf96WBOEJbzRIkOa1yS8EgD_IA6BO3-NJdTvNTObemRot2RmgA4SZvMk7bw50U95jbBm8Yagbs1qsFf-Ew9A_aAOUzAZqqoFeYhfU5y-EOGjvA%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1764558689.835831,"sameSite":"unspecified"},{"name":"gulu_source_res","value":"eyJwX2luIjoiNzkyYzg1NjRmYjIyMWU4Njk1NWI1ZGI4NzgyZGU4ZjQ0MTBiYjMwZTAyNDdmYWVhOTU5OTM2M2MyNzgzZmIwOCJ9","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1764558689.83595,"sameSite":"unspecified"},{"name":"passport_auth_mix_state","value":"3ehd0cickh0t35v6o9s6y3nkhorjkc2b","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1764558629.836293,"sameSite":"unspecified"},{"name":"biz_trace_id","value":"89b62e84","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"passport_fe_beating_status","value":"false","domain":".creator.douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"odin_tt","value":"b0349dff4e252a1c62f2b34a3c5e7fcb440c3151f6d28c7d8cf1a0ec5a501c4228e7f63befa5061ed5598d430a3047a3ddad3d2cf1893f314cc484284faa92af","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796094394.215451,"sameSite":"unspecified"},{"name":"passport_assist_user","value":"CkDu1w77Phjv_pAMiWwbyqDaTmHMsVE-ar-fuaAaqorzV85bdn9rtHw3pojXVyE8VyLZq9SWL07-EY3XmXO_bLFAGkoKPAAAAAAAAAAAAABPx0mav0MxYwaw-oxkod27P2s7rKiJxyX2P7wo4noltQwEPoir0WACXqz0TVwWdMTAWBDG_4IOGImv1lQgASIBA-PHoRg%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1799118394.215538,"sameSite":"unspecified"},{"name":"n_mh","value":"V8K5O6xgWJoiMqaVVnqD1veSnSEDr9Xwvjpf2lXMQFo","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1774926394.215568,"sameSite":"unspecified"},{"name":"sid_guard","value":"5e9ffc96d2a23ccde15d64959d13f3fc%7C1764558394%7C5184000%7CFri%2C+30-Jan-2026+03%3A06%3A34+GMT","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1795662394.215588,"sameSite":"unspecified"},{"name":"uid_tt","value":"cbe718c1b6da5fbacaa4d86c7f4f4952","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.21561,"sameSite":"unspecified"},{"name":"uid_tt_ss","value":"cbe718c1b6da5fbacaa4d86c7f4f4952","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215628,"sameSite":"no_restriction"},{"name":"sid_tt","value":"5e9ffc96d2a23ccde15d64959d13f3fc","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215648,"sameSite":"unspecified"},{"name":"sessionid","value":"5e9ffc96d2a23ccde15d64959d13f3fc","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215668,"sameSite":"unspecified"},{"name":"sessionid_ss","value":"5e9ffc96d2a23ccde15d64959d13f3fc","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215686,"sameSite":"no_restriction"},{"name":"session_tlb_tag","value":"sttt%7C1%7CXp_8ltKiPM3hXWSVnRPz_P_________krxkf5KzU--r_fNbKgksJ68DveN-1uxEGprz75GEz6D0%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215706,"sameSite":"no_restriction"},{"name":"session_tlb_tag_bk","value":"sttt%7C1%7CXp_8ltKiPM3hXWSVnRPz_P_________krxkf5KzU--r_fNbKgksJ68DveN-1uxEGprz75GEz6D0%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215727,"sameSite":"no_restriction"},{"name":"is_staff_user","value":"false","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215748,"sameSite":"unspecified"},{"name":"sid_ucp_v1","value":"1.0.0-KDczNTU5Njg1YWFjYTZiM2Q0NDFkNDE0ZTQ5ZWZjMTY3OWY0ZWNhMTMKIAjKsNDN4s1WELqMtMkGGNoWIAww7reKrwY4B0D0B0gEGgJobCIgNWU5ZmZjOTZkMmEyM2NjZGUxNWQ2NDk1OWQxM2YzZmM","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215783,"sameSite":"unspecified"},{"name":"ssid_ucp_v1","value":"1.0.0-KDczNTU5Njg1YWFjYTZiM2Q0NDFkNDE0ZTQ5ZWZjMTY3OWY0ZWNhMTMKIAjKsNDN4s1WELqMtMkGGNoWIAww7reKrwY4B0D0B0gEGgJobCIgNWU5ZmZjOTZkMmEyM2NjZGUxNWQ2NDk1OWQxM2YzZmM","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1769742394.215805,"sameSite":"no_restriction"},{"name":"_bd_ticket_crypt_doamin","value":"2","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742394.224374,"sameSite":"unspecified"},{"name":"_bd_ticket_crypt_cookie","value":"859325e6a8ea6be4b4054ca49e555a47","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742394.227293,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_sign_data_key_web_protect","value":"eb9340b1-489f-8f33","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742394.229223,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_cert_key","value":"75de2eb8-419a-8ea0","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742394.229449,"sameSite":"unspecified"},{"name":"__security_mc_1_s_sdk_crypt_sdk","value":"9bac8557-402a-9092","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742394.229685,"sameSite":"unspecified"},{"name":"__security_server_data_status","value":"1","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742394.236198,"sameSite":"unspecified"},{"name":"bd_ticket_guard_client_data_v2","value":"eyJyZWVfcHVibGljX2tleSI6IkJOSWUzQVN6aFhmMkxYVlY0dXM4MGt5MkZJNDJINHYzeXRmZUszS1FIRDR5aUNjM1owaUYwOFIvcnRzY1c0T3lXRVVNVWZ4T2VHZEc0THBHM3VoSUJHTT0iLCJ0c19zaWduIjoidHMuMi40MjgyYjVkYjc1YmU5MTkzNzcxNTM3ZmEyNDE3MzFlMDU5ZmZlNWY0NDA1NjExYmJiZjI3NjAwNmFjNjZhZTYxYzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJZSUgyVVcwR0VuWm1YbWhpSDZSVW1ydTI5ZHlzU2R0MldaaFF1RDVTUW0wPSIsInNlY190cyI6IiNuMitmV0RYakNlYXIxYnhMTGkyVmo4UFdlQ3VaUTIxMGJrNEtjNHVTNGpwTTdmWGkrUFYyc3lWWVFOL1UifQ%3D%3D","domain":".douyin.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1769742394.242259,"sameSite":"unspecified"},{"name":"gd_random","value":"eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC41MDQ0NjQ2NjU2MDI2NzU5fQ==.Kl3dCAb0C/I/8C19Y2zI2cx4NHdInjnhzYDA8g50ixE=","domain":"creator.douyin.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1765163194.314254,"sameSite":"unspecified"},{"name":"ttwid","value":"1%7CwTSF8FSbvt1_7ZMUZ-5mtatsdhMj2AKwo83C784BEvg%7C1764558395%7C01cc7f2e36c42f41e1a6c374cf8fa930d4918f621841ec9e0ea3a43b8622c95b","domain":".douyin.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796094395.144204,"sameSite":"unspecified"}]',
//               platformLocalStorage:
//                 '{"session":{"__msuuid__":"6b1f7313-c05a-4530-9df4-5a02ea1e0e99","__tea_session_id_1661":"{\\"sessionId\\":\\"d9bccfd2-ef48-46b0-8de5-e85d42bdc8ac\\",\\"timestamp\\":1764558395242}","__tea_session_id_2906":"{\\"sessionId\\":\\"8a2c713e-e368-4695-866b-adaa9b95585a\\",\\"timestamp\\":1764558395120}"},"__tea_cache_tokens_2906":"{\\"user_unique_id\\":\\"380904169281610\\",\\"web_id\\":\\"7578720537959876134\\",\\"timestamp\\":1764558395080}","login_type_from_login":"\\"\\"","LOGIN_STATUS":"{\\"logintype\\":\\"user\\",\\"loginapp\\":\\"douyin\\"}","__msuuid__":"6b1f7313-c05a-4530-9df4-5a02ea1e0e99","CREATOR_LAYOUT_CONFIG":"{\\"headerLogo\\":{\\"douyin\\":{\\"src\\":\\"//lf3-static.bytednsdoc.com/obj/eden-cn/lm-yvahlyj-upfbvk/ljhwZthlaukjlkulzlp/pc/icons/logo.png\\"},\\"huoshan\\":{\\"src\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_header_logo_h.png~tplv-obj.image\\"}},\\"hotsoonHelpShow\\":false,\\"footerLink\\":[{\\"children\\":\\"账号授权协议\\",\\"href\\":\\"//lf3-beecdn.bytetos.com/obj/ies-fe-bee/bee_prod/biz_181/bee_prod_181_bee_publish_1095.html\\"},{\\"children\\":\\"用户服务协议\\",\\"href\\":\\" //www.douyin.com/agreement/\\"},{\\"children\\":\\"隐私政策\\",\\"href\\":\\" //www.douyin.com/privacy/\\"},{\\"children\\":\\"账号找回\\",\\"href\\":\\" //www.douyin.com/recovery_account/\\"},{\\"children\\":\\"联系我们\\",\\"href\\":\\" //www.douyin.com/aboutus/\\"}],\\"footerText\\":[[\\"2025 © 抖音\\",\\"[京ICP备16016397号-3](https://beian.miit.gov.cn/)\\",\\"[北京抖音科技有限公司](https://lf3-static.bytednsdoc.com/obj/eden-cn/lm-yvahlyj-upfbvk/ljhwZthlaukjlkulzlp/营业执照.jpg)\\",\\"[京B2-20170846](https://lf3-static.bytednsdoc.com/obj/eden-cn/lm-yvahlyj-upfbvk/ljhwZthlaukjlkulzlp/增值电信业务经营许可证.jpg)\\"],[\\"[中国互联网举报中心](http://www.12377.cn/)\\",\\"[网络文化经营许可证-京网文〔2025〕0181-061号](https://lf3-static.bytednsdoc.com/obj/eden-cn/lm-yvahlyj-upfbvk/ljhwZthlaukjlkulzlp/网络经营许可证.jpg)\\",\\"违法和不良信息举报：400-140-2108\\",\\"举报邮箱：feedback@douyin.com\\"],[\\"![pic](//p3.douyinpic.com/aweme-server-static-resource/gongan_d0289dc.png~tplv-obj.image)\\",\\"[京公网安备11000002002046号](http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11000002002046)\\",\\"地址：北京市海淀区北三环西路甲18号院4号楼2层2022\\"]],\\"permissionKeys\\":[{\\"itemKey\\":\\"/authority\\",\\"text\\":\\"授权管理\\",\\"show\\":true,\\"permission\\":\\"CreatorConferManage\\"},{\\"itemKey\\":\\"/content/\\",\\"text\\":\\"内容管理\\",\\"path\\":[\\"/live/media/create\\",\\"/live/media/room\\",\\"/live/media/list\\"],\\"show\\":true,\\"permission\\":\\"CreatorContentManage\\"},{\\"itemKey\\":\\"/following\\",\\"text\\":\\"互动管理\\",\\"show\\":true,\\"permission\\":\\"CreatorInterManage\\"},{\\"itemKey\\":\\"/data\\",\\"text\\":\\"数据管理\\",\\"path\\":[\\"/live/media/data\\"],\\"show\\":true,\\"permission\\":\\"CreatorDataManage\\"},{\\"itemKey\\":\\"/musician\\",\\"text\\":\\"音乐管理\\",\\"show\\":true,\\"restrictHotsoon\\":true,\\"permission\\":\\"CreatorMusicManage\\"},{\\"itemKey\\":\\"/publicity/topic\\",\\"text\\":\\"宣发管理\\",\\"show\\":false,\\"restrictHotsoon\\":true,\\"permission\\":\\"CreatorContentManage.Challenge\\"}],\\"headerIcons\\":[{\\"src\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_header_notification_icon.svg~tplv-obj.image\\",\\"link\\":\\"https://creator.douyin.com/message\\",\\"visible\\":{\\"has_unread_message\\":false,\\"is_login_hotsoon\\":false}},{\\"src\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_header_notification.png~tplv-obj.image\\",\\"link\\":\\"https://creator.douyin.com/message\\",\\"style\\":{\\"width\\":\\"24px\\",\\"height\\":\\"24px\\"},\\"badge\\":{\\"count\\":\\"unread_message_count\\"},\\"visible\\":{\\"has_unread_message\\":true,\\"is_login_hotsoon\\":false}}],\\"sidebarFollowerTip\\":\\"仅展示抖音粉丝\\",\\"sidebarData\\":{\\"data\\":[{\\"name\\":\\"视频数据\\",\\"keyName\\":\\"CreatorDataManage\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_vedio.svg~tplv-obj.image\\",\\"auth\\":true,\\"children\\":[{\\"path\\":\\"/data/stats/overview\\",\\"name\\":\\"数据总览\\",\\"keyName\\":\\"CreatorDataManage.UserOverview\\",\\"visible\\":{\\"is_login_hotsoon\\":false}},{\\"path\\":\\"/data/stats/video\\",\\"name\\":\\"作品数据\\",\\"keyName\\":\\"CreatorDataManage.ItemL2\\",\\"visible\\":{\\"is_login_hotsoon\\":false}},{\\"path\\":\\"/data/stats/follower/portrait\\",\\"name\\":\\"粉丝画像\\",\\"keyName\\":\\"CreatorDataManage.Portrait\\",\\"visible\\":{\\"is_login_hotsoon\\":false}},{\\"path\\":\\"/data/stats/hotsoon-overview\\",\\"name\\":\\"数据总览\\",\\"keyName\\":\\"CreatorDataManage.UserOverview\\",\\"visible\\":{\\"is_login_hotsoon\\":true}},{\\"path\\":\\"/data/stats/hotsoon-item\\",\\"name\\":\\"作品数据\\",\\"keyName\\":\\"CreatorDataManage.ItemL2\\",\\"visible\\":{\\"is_login_hotsoon\\":true}},{\\"path\\":\\"/weekly\\",\\"name\\":\\"创作周报\\",\\"keyName\\":\\"CreatorDataManage.WeekReport\\",\\"visible\\":{\\"is_login_hotsoon\\":false}}]},{\\"name\\":\\"直播数据\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_data_icon.svg~tplv-obj.image\\",\\"auth\\":true,\\"children\\":[{\\"path\\":\\"/data/live/overview\\",\\"name\\":\\"数据总览\\",\\"key\\":\\"CreatorDataManage.Live\\"},{\\"path\\":\\"/live/media/data\\",\\"name\\":\\"数据总览\\",\\"key\\":\\"CreatorLiveManage.Data\\"},{\\"path\\":\\"/data/live/video\\",\\"name\\":\\"单场数据\\",\\"key\\":\\"CreatorDataManage.Live\\"}]},{\\"name\\":\\"重点关注\\",\\"keyName\\":\\"CreatorDataManage\\",\\"auth\\":true,\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_inportant.svg~tplv-obj.image\\",\\"visible\\":[{\\"status_code\\":8,\\"window.location.host\\":\\"creator.douyin.com\\"},{\\"status_code\\":15384,\\"window.location.host\\":\\"creator.douyin.com\\"},{\\"is_login_hotsoon\\":false}],\\"children\\":[{\\"path\\":\\"/data/important/following\\",\\"name\\":\\"我关心的\\",\\"keyName\\":\\"CreatorDataManage.TraceOthers\\"},{\\"path\\":\\"/data/important/keyword\\",\\"name\\":\\"与我相关\\",\\"keyName\\":\\"CreatorDataManage.SearchSelf\\"}]}],\\"interaction\\":[{\\"name\\":\\"互动管理\\",\\"keyName\\":\\"CreatorInterManage\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_following.svg~tplv-obj.image\\",\\"auth\\":true,\\"children\\":[{\\"path\\":\\"/following/following\\",\\"name\\":\\"关注管理\\"},{\\"path\\":\\"/following/follower\\",\\"name\\":\\"粉丝管理\\"},{\\"path\\":\\"/following/comment\\",\\"name\\":\\"评论管理\\",\\"visible\\":{\\"is_login_hotsoon\\":false}},{\\"path\\":\\"/following/chat\\",\\"name\\":\\"私信管理\\",\\"key\\":\\"CreatorInterManage.im\\",\\"keyName\\":\\"CreatorInterManage.im\\",\\"visible\\":{\\"is_login_hotsoon\\":false,\\"douyin_user_verify_info.teen_model\\":false}}]}],\\"publicity\\":[{\\"name\\":\\"宣发管理\\",\\"key\\":\\"CreatorContentManage.Challenge\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_publicity.svg~tplv-obj.image\\",\\"children\\":[{\\"path\\":\\"/publicity/topic\\",\\"name\\":\\"话题管理\\"}]}],\\"music\\":[{\\"name\\":\\"音乐管理\\",\\"key\\":\\"CreatorMusicManage\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_music.svg~tplv-obj.image\\",\\"children\\":[{\\"path\\":\\"/musician\\",\\"name\\":\\"概览\\"},{\\"path\\":\\"/musician/songs\\",\\"name\\":\\"音乐管理\\"},{\\"path\\":\\"/musician/statistics\\",\\"name\\":\\"数据管理\\"}]}],\\"live\\":[{\\"name\\":\\"直播管理\\",\\"key\\":\\"CreatorLiveManage\\",\\"children\\":[{\\"path\\":\\"/live/media/create\\",\\"name\\":\\"创建直播\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livecreate.svg~tplv-obj.image\\",\\"key\\":\\"CreatorLiveManage.Create\\"},{\\"path\\":\\"/live/media/list\\",\\"name\\":\\"直播列表\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livelist.svg~tplv-obj.image\\",\\"key\\":\\"CreatorLiveManage.List\\"},{\\"path\\":\\"/live/media/replay\\",\\"name\\":\\"直播回放\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livereplay.svg~tplv-obj.image\\",\\"key\\":\\"CreatorLiveManage.Replay\\"}]},{\\"name\\":\\"数据管理\\",\\"key\\":\\"CreatorLiveManage.Data\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livedata.svg~tplv-obj.image\\",\\"children\\":[{\\"path\\":\\"/live/media/data\\",\\"name\\":\\"直播数据\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ttfe_open_creator_sidebar_livedata.svg~tplv-obj.image\\",\\"key\\":\\"CreatorLiveManage.Data\\"}]}],\\"media\\":[{\\"name\\":\\"发布视频\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_upload_v2.svg~tplv-obj.image\\",\\"path\\":[\\"/content/upload\\",\\"/content/publish\\"]},{\\"name\\":\\"内容管理\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_manage_v2.svg~tplv-obj.image\\",\\"children\\":[{\\"path\\":\\"/content/manage\\",\\"name\\":\\"视频管理\\",\\"icon\\":\\"\\"},{\\"path\\":[\\"/content/collection/manage\\",\\"/content/collection/detail\\",\\"/content/collection/create\\"],\\"name\\":\\"合集管理\\",\\"icon\\":\\"\\",\\"visContextKey\\":\\"userInfo.mix_permission\\",\\"visContextValue\\":true},{\\"path\\":\\"/content/safeguard\\",\\"name\\":\\"维权管理\\",\\"icon\\":\\"\\",\\"visContextKey\\":\\"userInfo.permission.user_sign\\",\\"visContextValue\\":true}]},{\\"name\\":\\"直播管理\\",\\"icon\\":\\"//p3.douyinpic.com/aweme-server-static-resource/ies_douyin_opencn_tiktok_creator_sidebar_livecreate_v2.svg~tplv-obj.image\\",\\"visContextKey\\":\\"creatorMenu.live_manage\\",\\"visContextValue\\":true,\\"children\\":[{\\"path\\":\\"/live/media/create\\",\\"name\\":\\"创建直播\\",\\"icon\\":\\"\\",\\"key\\":\\"CreatorLiveManage.Create\\",\\"visContextKey\\":\\"creatorMenu.media_auth\\",\\"visContextValue\\":true},{\\"path\\":\\"/live/media/list\\",\\"name\\":\\"直播列表\\",\\"icon\\":\\"\\",\\"key\\":\\"CreatorLiveManage.List\\",\\"visContextKey\\":\\"creatorMenu.media_auth\\",\\"visContextValue\\":true},{\\"path\\":\\"/content/live/replay\\",\\"name\\":\\"直播回放\\",\\"icon\\":\\"\\",\\"key\\":\\"CreatorLiveManage.Replay\\",\\"visContextKey\\":\\"creatorMenu.replay_auth\\",\\"visContextValue\\":true},{\\"path\\":\\"/content/live/replay\\",\\"name\\":\\"直播回放\\",\\"key\\":\\"CreatorCommonManage.Replay\\"}]}]}}","__tea_cache_first_2906":"1","xmst":"6-CBJIKyYGrMqrsX_sbPe29ByVTdXg5rp3ktuQjGz5RmW2dnSP34sv0rP5VF_zzRB-QcGPIuIK2EK0TTjgONDIrMX1DgAuViNBUMJ2jVeb38J7n6tb4l0VFvvkAlEIy6xQ66KBJI5FcMU8outfnUp8Mmogw8SkaLl8BUNkhmjJu1","ztsdk_tcc_config":"{\\"value\\":{\\"ztsdk_config\\":{\\"2906\\":[{\\"aid\\":2906,\\"scene\\":\\"web_protect\\",\\"certType\\":\\"cookie\\",\\"providerPathList\\":[],\\"consumerPathList\\":[\\"/aweme/v1/creator/relation/create/\\",\\"/web/api/v2/creator/activity/collect/\\",\\"/live/api/room/create_media_room/\\",\\"/aweme/janus/creator/comment/aweme/v1/web/comment/multi_publish/\\",\\"/aweme/v1/web/comment/multi_publish/\\",\\"/aweme/janus/creator/comment/aweme/v1/comment/publish/\\",\\"/aweme/v1/web/comment/publish/\\",\\"/aweme/janus/creator/comment/aweme/v1/web/comment/digg/\\",\\"/aweme/v1/web/comment/digg/\\",\\"/aweme/janus/creator/comment/aweme/v1/web/comment/multi_delete/\\",\\"/aweme/v1/web/comment/multi_delete/\\",\\"/aweme/v1/creator/comment/reply/\\",\\"/aweme/v1/creator/comment/action/\\"],\\"signVersion\\":2}],\\"6383\\":[{\\"aid\\":6383,\\"scene\\":\\"web_protect\\",\\"certType\\":\\"cookie\\",\\"consumerPathList\\":[\\"/aweme/v1/web/comment/list/reply/\\",\\"/aweme/v1/web/comment/list/\\",\\"/aweme/v2/web/comment/list/reply/\\"],\\"signVersion\\":2}]}},\\"expire\\":1764579987964}","security-sdk/s_sdk_server_cert_key":"{\\"cert\\":\\"-----BEGIN CERTIFICATE-----\\\\nMIIEfTCCBCKgAwIBAgIUXWdS2tzmSoewCWfKFyiWMrJqs/0wCgYIKoZIzj0EAwIw\\\\nMTELMAkGA1UEBhMCQ04xIjAgBgNVBAMMGXRpY2tldF9ndWFyZF9jYV9lY2RzYV8y\\\\nNTYwIBcNMjIxMTE4MDUyMDA2WhgPMjA2OTEyMzExNjAwMDBaMCQxCzAJBgNVBAYT\\\\nAkNOMRUwEwYDVQQDEwxlY2llcy1zZXJ2ZXIwWTATBgcqhkjOPQIBBggqhkjOPQMB\\\\nBwNCAASE2llDPlfc8Rq+5J5HXhg4edFjPnCF3Ua7JBoiE/foP9m7L5ELIcvxCgEx\\\\naRCHbQ8kCCK/ArZ4FX/qCobZAkToo4IDITCCAx0wDgYDVR0PAQH/BAQDAgWgMDEG\\\\nA1UdJQQqMCgGCCsGAQUFBwMBBggrBgEFBQcDAgYIKwYBBQUHAwMGCCsGAQUFBwME\\\\nMCkGA1UdDgQiBCABydxqGrVEHhtkCWTb/vicGpDZPFPDxv82wiuywUlkBDArBgNV\\\\nHSMEJDAigCAypWfqjmRIEo3MTk1Ae3MUm0dtU3qk0YDXeZSXeyJHgzCCAZQGCCsG\\\\nAQUFBwEBBIIBhjCCAYIwRgYIKwYBBQUHMAGGOmh0dHA6Ly9uZXh1cy1wcm9kdWN0\\\\naW9uLmJ5dGVkYW5jZS5jb20vYXBpL2NlcnRpZmljYXRlL29jc3AwRgYIKwYBBQUH\\\\nMAGGOmh0dHA6Ly9uZXh1cy1wcm9kdWN0aW9uLmJ5dGVkYW5jZS5uZXQvYXBpL2Nl\\\\ncnRpZmljYXRlL29jc3AwdwYIKwYBBQUHMAKGa2h0dHA6Ly9uZXh1cy1wcm9kdWN0\\\\naW9uLmJ5dGVkYW5jZS5jb20vYXBpL2NlcnRpZmljYXRlL2Rvd25sb2FkLzQ4RjlD\\\\nMEU3QjBDNUE3MDVCOTgyQkU1NTE3MDVGNjQ1QzhDODc4QTguY3J0MHcGCCsGAQUF\\\\nBzAChmtodHRwOi8vbmV4dXMtcHJvZHVjdGlvbi5ieXRlZGFuY2UubmV0L2FwaS9j\\\\nZXJ0aWZpY2F0ZS9kb3dubG9hZC80OEY5QzBFN0IwQzVBNzA1Qjk4MkJFNTUxNzA1\\\\nRjY0NUM4Qzg3OEE4LmNydDCB5wYDVR0fBIHfMIHcMGygaqBohmZodHRwOi8vbmV4\\\\ndXMtcHJvZHVjdGlvbi5ieXRlZGFuY2UuY29tL2FwaS9jZXJ0aWZpY2F0ZS9jcmwv\\\\nNDhGOUMwRTdCMEM1QTcwNUI5ODJCRTU1MTcwNUY2NDVDOEM4NzhBOC5jcmwwbKBq\\\\noGiGZmh0dHA6Ly9uZXh1cy1wcm9kdWN0aW9uLmJ5dGVkYW5jZS5uZXQvYXBpL2Nl\\\\ncnRpZmljYXRlL2NybC80OEY5QzBFN0IwQzVBNzA1Qjk4MkJFNTUxNzA1RjY0NUM4\\\\nQzg3OEE4LmNybDAKBggqhkjOPQQDAgNJADBGAiEAqMjT5ADMdGMeaImoJK4J9jzE\\\\nLqZ573rNjsT3k14pK50CIQCLpWHVKWi71qqqrMjiSDvUhpyO1DpTPRHlavPRuaNm\\\\nww==\\\\n-----END CERTIFICATE-----\\",\\"sn\\":\\"533240336124694022040808462028007165443034493949\\",\\"createdTime\\":1764558388761}","__tea_cache_first_1661":"1","SLARDARdouyin_creator":"JTdCJTIydXNlcklkJTIyOiUyMjk4ZjA1ZTc5LWJjNjEtNGU4Zi05OTJkLTZhN2E5NmQ1YzgzZSUyMiwlMjJkZXZpY2VJZCUyMjolMjJiNjUwYjcxZi0yMzcwLTQ3MzAtYTEzNi1jMTdmNDVlYzkxNmQlMjIsJTIyZXhwaXJlcyUyMjoxNzcyMzM0Mzk0NTI5JTdE","https://creator.douyin.com-operation":"false","SLARDARuc_secure_sdk":"JTdCJTIydXNlcklkJTIyOiUyMmVhZTczMWQwLTU2ZWYtNDkzNi05Zjk1LTE1NDk5YjdkNGZiMiUyMiwlMjJkZXZpY2VJZCUyMjolMjI0MzNkOTA1YS1mNDFmLTQ0MzEtYTg1Ni0yN2YyOTM2OTA3MGElMjIsJTIyZXhwaXJlcyUyMjoxNzcyMzM0Mzk1MTk2JTdE","__tea_cache_tokens_1661":"{\\"web_id\\":\\"1012101391331491231\\",\\"user_unique_id\\":\\"380904169281610\\",\\"timestamp\\":1764558395202,\\"_type_\\":\\"default\\"}","web_runtime_security_uid":"e1a3ba99-f781-4a45-9b84-7fb17d2bf04a","security-sdk/s_sdk_crypt_sdk":"{\\"data\\":\\"{\\\\\\"ec_privateKey\\\\\\":\\\\\\"-----BEGIN PRIVATE KEY-----\\\\\\\\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgIeVmnOrW+VTfgHY+xsWE5DgdJriCOjNGKwK4MRAgti+hRANCAATSHtwEs4V39i11VeLrPNJMthSONh+L98rX3itykBw+MognN2dIhdPEf67bHFuDslhFDFH8TnhnRuC6Rt7oSARj\\\\\\\\n-----END PRIVATE KEY-----\\\\\\",\\\\\\"ec_publicKey\\\\\\":\\\\\\"-----BEGIN PUBLIC KEY-----\\\\\\\\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE0h7cBLOFd/YtdVXi6zzSTLYUjjYfi/fK194rcpAcPjKIJzdnSIXTxH+u2xxbg7JYRQxR/E54Z0bgukbe6EgEYw==\\\\\\\\n-----END PUBLIC KEY-----\\\\\\",\\\\\\"ec_csr\\\\\\":\\\\\\"\\\\\\"}\\"}","__url__":"https://creator.douyin.com/","security-sdk/s_sdk_sign_data_key/web_protect":"{\\"data\\":\\"{\\\\\\"ticket\\\\\\":\\\\\\"hash.VvTjfrM+Lgj3YpYjyKQe2eh0fkykPpIVNj+WyQ5hvXw=\\\\\\",\\\\\\"ts_sign\\\\\\":\\\\\\"ts.2.4282b5db75be9193771537fa241731e059ffe5f4405611bbbf276006ac66ae61c4fbe87d2319cf05318624ceda14911ca406dedbebeddb2e30fce8d4fa02575d\\\\\\",\\\\\\"client_cert\\\\\\":\\\\\\"pub.BNIe3ASzhXf2LXVV4us80ky2FI42H4v3ytfeK3KQHD4yiCc3Z0iF08R/rtscW4OyWEUMUfxOeGdG4LpG3uhIBGM=\\\\\\",\\\\\\"log_id\\\\\\":\\\\\\"20251201110633219AC2BCC7BA90D15D54\\\\\\",\\\\\\"create_time\\\\\\":1764558394}\\"}","security-sdk/s_sdk_cert_key":"{\\"data\\":\\"pub.BNIe3ASzhXf2LXVV4us80ky2FI42H4v3ytfeK3KQHD4yiCc3Z0iF08R/rtscW4OyWEUMUfxOeGdG4LpG3uhIBGM=\\"}"}',
//             },
//           ],
//           authorization: 'sess_85cbbb5e381b40b549ab481b1c184ec7c07e992601908d4b6f0c617ee0405ad3',
//         },
//         '123',
//       );
//       console.log(JSON.stringify(result, null, 2));
//       await Task.Delay(40 * 60 * 1000);
//     },
//     40 * 60 * 1000,
//   );
// });
