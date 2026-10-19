import { describe, expect, test } from 'vitest';
import { CancelToken } from '../../../src';
import { EventEmitter } from 'events';
import { Xiguashipin } from '../../../src/media-platform/xiguashipin/xiguashipin';
import { XiguaVideoTaskInput } from '../../../types/media-platform/xiguashipin/xiguashipin-video';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '../../mock/mock';
import $axios from 'axios';
import { douyinVideoService } from '../../../src/media-platform/douyin/douyin-video.service';

describe('【Mock】', () => {
  describe('获取抖音封面上传参数', () => {
    const server = setupServer(
      rest.get('https://imagex.bytedanceapi.com*', (req, res, context) => {
        const userId = req.url.searchParams.get('user_id');

        // InvalidAccessKey
        if (userId === 'InvalidAccessKey') {
          return res(
            context.status(200),
            context.json({
              ResponseMetadata: {
                RequestId: '20230915094458613F71EC39FB023C7077',
                Action: 'ApplyImageUpload',
                Version: '2018-08-01',
                Service: 'imagex',
                Region: 'cn-north-1',
                Error: {
                  CodeN: 100009,
                  Code: 'InvalidAccessKey',
                  Message: 'The security token[%s] included in the request is invalid.',
                },
              },
            }),
          );
        }

        // InvalidCredential
        if (userId === 'InvalidCredential') {
          return res(
            context.status(400),
            context.json({
              ResponseMetadata: {
                RequestId: '20230914141403B86CCE5A506F2F039427',
                Action: 'ApplyImageUpload',
                Version: '2018-08-01',
                Service: 'imagex',
                Region: 'cn-north-1',
                Error: {
                  CodeN: 100025,
                  Code: 'InvalidCredential',
                  // eslint-disable-next-line quotes
                  Message: "Invalid credential in 'Authorization', Pls check your authorization header.",
                },
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('错误的凭证信息，应该请求失败', async () => {
      const $http = $axios.create({});

      expect(async () => {
        await douyinVideoService.getCoverUploadArgs($http, 'InvalidCredential');
      }).rejects.toThrowError(/Invalid credential/);
    });

    test('无效的AccessKey，应该请求失败', () => {
      const $http = $axios.create({});
      expect(async () => {
        await douyinVideoService.getCoverUploadArgs($http, 'InvalidAccessKey');
      }).rejects.toThrowError(/invalid/);
    });
  });
});

describe.runIf(false)('【真实测试发布】', () => {
  test('西瓜视频发布', async () => {
    const cookie =
      'csrf_session_id=f53d843dd8f9388e8dbd4e22072c64b3; MONITOR_WEB_ID=27a850fb-2a3d-4588-944c-378d01ee06ad; s_v_web_id=verify_lxvkoz29_JqDfnq5j_16GE_4Py5_8wiB_yTFZSa87tJkj; passport_csrf_token=df9c13be68551d172007420e40bfc914; passport_csrf_token_default=df9c13be68551d172007420e40bfc914; sid_guard=0d43367a922beadc8f523cae1c7acca6%7C1719390493%7C5184002%7CSun%2C+25-Aug-2024+08%3A28%3A15+GMT; uid_tt=621c9604ffaa20db32a1c2845204028d; uid_tt_ss=621c9604ffaa20db32a1c2845204028d; sid_tt=0d43367a922beadc8f523cae1c7acca6; sessionid=0d43367a922beadc8f523cae1c7acca6; sessionid_ss=0d43367a922beadc8f523cae1c7acca6; sid_ucp_v1=1.0.0-KDBlODZlMDE5NDk4MWQ1OTU0YjkyNDlhMWFhZGFmMTQ2YzgzMDVhOTIKFQiglYODhgMQnaLvswYY9hc4AkDxBxoCbHEiIDBkNDMzNjdhOTIyYmVhZGM4ZjUyM2NhZTFjN2FjY2E2; ssid_ucp_v1=1.0.0-KDBlODZlMDE5NDk4MWQ1OTU0YjkyNDlhMWFhZGFmMTQ2YzgzMDVhOTIKFQiglYODhgMQnaLvswYY9hc4AkDxBxoCbHEiIDBkNDMzNjdhOTIyYmVhZGM4ZjUyM2NhZTFjN2FjY2E2; studio_web_id=7384725849957008908; x-web-secsdk-uid=f1e6df18-0dbb-4df7-b790-19b4a352c412; ttwid=1%7CWNFv3MRogd2pcDQgjToaAEXgmTeBcjgpEAd7tJMIo-s%7C1724210186%7Ce57d2d8db2c5217101a742d507bfdb95288d4564671f19429cef7fc8ed0d4e5b';
    //const authData = await getAuthKey(cookie);
    const userInfo = await await Xiguashipin.getXiguashipinUserInfo(cookie);
    const cancelToken = new CancelToken();
    const params: XiguaVideoTaskInput = {
      pubType: 1,
      cancelToken: cancelToken,
      video: {
        localPath: 'Z:\\系统默认下载位置\\20240820-205743.mp4',
        size: 17876417,
        duration: 86,
      },
      cover: {
        pathOrUrl: 'https://yixiaoer-image-oss.yixiaoer.cn/20240805/c2079951-f3ee-4e6c-afb8-2ac2f3eeacf8.jpg',
        width: 960,
        height: 720,
      },
      title: '我是标题啊',
      topics: [],
      mentions: [],
      desc: '我就是这样啊啊',
      visibility_type: 1,
      download: 1,
      isOriginal: 0,
      should_sync: 0,
      activity: [],

      taskId: '3a1466c6-4541-cd61-34e2-51ee5553b40d',
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    setTimeout(() => {
      //params.cancelToken.cancel();
      // try {
      //   params.cancelToken.throwIfCancelled('');
      // } catch (e) {
      //   console.log(e);
      // }
    }, 8000);
    const result = await Xiguashipin.publishVideo(cookie, params, eventCall, userInfo.data.userId);
    console.log('西瓜视频上传结果：', result);
  }, 10000000);
});

describe.runIf(false)('【获取话题】', () => {
  test('西瓜话题', async () => {
    const cookie =
      'csrf_session_id=f53d843dd8f9388e8dbd4e22072c64b3; MONITOR_WEB_ID=27a850fb-2a3d-4588-944c-378d01ee06ad; s_v_web_id=verify_lxvkoz29_JqDfnq5j_16GE_4Py5_8wiB_yTFZSa87tJkj; passport_csrf_token=df9c13be68551d172007420e40bfc914; passport_csrf_token_default=df9c13be68551d172007420e40bfc914; sid_guard=0d43367a922beadc8f523cae1c7acca6%7C1719390493%7C5184002%7CSun%2C+25-Aug-2024+08%3A28%3A15+GMT; uid_tt=621c9604ffaa20db32a1c2845204028d; uid_tt_ss=621c9604ffaa20db32a1c2845204028d; sid_tt=0d43367a922beadc8f523cae1c7acca6; sessionid=0d43367a922beadc8f523cae1c7acca6; sessionid_ss=0d43367a922beadc8f523cae1c7acca6; sid_ucp_v1=1.0.0-KDBlODZlMDE5NDk4MWQ1OTU0YjkyNDlhMWFhZGFmMTQ2YzgzMDVhOTIKFQiglYODhgMQnaLvswYY9hc4AkDxBxoCbHEiIDBkNDMzNjdhOTIyYmVhZGM4ZjUyM2NhZTFjN2FjY2E2; ssid_ucp_v1=1.0.0-KDBlODZlMDE5NDk4MWQ1OTU0YjkyNDlhMWFhZGFmMTQ2YzgzMDVhOTIKFQiglYODhgMQnaLvswYY9hc4AkDxBxoCbHEiIDBkNDMzNjdhOTIyYmVhZGM4ZjUyM2NhZTFjN2FjY2E2; studio_web_id=7384725849957008908; x-web-secsdk-uid=f1e6df18-0dbb-4df7-b790-19b4a352c412; ttwid=1%7CWNFv3MRogd2pcDQgjToaAEXgmTeBcjgpEAd7tJMIo-s%7C1724210186%7Ce57d2d8db2c5217101a742d507bfdb95288d4564671f19429cef7fc8ed0d4e5b';
    //const authData = await getAuthKey(cookie);
    const userInfo = await await Xiguashipin.getXiguashipinTopicList(cookie, '悟空');

    console.log('西瓜视频上传结果：', userInfo);
  }, 10000000);
});

describe.runIf(false)('【获取好友】', () => {
  test('西瓜好友', async () => {
    const cookie =
      'csrf_session_id=f53d843dd8f9388e8dbd4e22072c64b3; MONITOR_WEB_ID=27a850fb-2a3d-4588-944c-378d01ee06ad; s_v_web_id=verify_lxvkoz29_JqDfnq5j_16GE_4Py5_8wiB_yTFZSa87tJkj; passport_csrf_token=df9c13be68551d172007420e40bfc914; passport_csrf_token_default=df9c13be68551d172007420e40bfc914; sid_guard=0d43367a922beadc8f523cae1c7acca6%7C1719390493%7C5184002%7CSun%2C+25-Aug-2024+08%3A28%3A15+GMT; uid_tt=621c9604ffaa20db32a1c2845204028d; uid_tt_ss=621c9604ffaa20db32a1c2845204028d; sid_tt=0d43367a922beadc8f523cae1c7acca6; sessionid=0d43367a922beadc8f523cae1c7acca6; sessionid_ss=0d43367a922beadc8f523cae1c7acca6; sid_ucp_v1=1.0.0-KDBlODZlMDE5NDk4MWQ1OTU0YjkyNDlhMWFhZGFmMTQ2YzgzMDVhOTIKFQiglYODhgMQnaLvswYY9hc4AkDxBxoCbHEiIDBkNDMzNjdhOTIyYmVhZGM4ZjUyM2NhZTFjN2FjY2E2; ssid_ucp_v1=1.0.0-KDBlODZlMDE5NDk4MWQ1OTU0YjkyNDlhMWFhZGFmMTQ2YzgzMDVhOTIKFQiglYODhgMQnaLvswYY9hc4AkDxBxoCbHEiIDBkNDMzNjdhOTIyYmVhZGM4ZjUyM2NhZTFjN2FjY2E2; studio_web_id=7384725849957008908; x-web-secsdk-uid=f1e6df18-0dbb-4df7-b790-19b4a352c412; ttwid=1%7CWNFv3MRogd2pcDQgjToaAEXgmTeBcjgpEAd7tJMIo-s%7C1724210186%7Ce57d2d8db2c5217101a742d507bfdb95288d4564671f19429cef7fc8ed0d4e5b';
    //const authData = await getAuthKey(cookie);
    const userInfo = await await Xiguashipin.getXiguashipinFriendList(cookie, '悟空');

    console.log('西瓜视频上传结果：', userInfo);
  }, 10000000);
});

describe.runIf(false)('【获取好友】', () => {
  test('西瓜好友', async () => {
    const cookie =
      'csrf_session_id=f53d843dd8f9388e8dbd4e22072c64b3; MONITOR_WEB_ID=27a850fb-2a3d-4588-944c-378d01ee06ad; s_v_web_id=verify_lxvkoz29_JqDfnq5j_16GE_4Py5_8wiB_yTFZSa87tJkj; passport_csrf_token=df9c13be68551d172007420e40bfc914; passport_csrf_token_default=df9c13be68551d172007420e40bfc914; sid_guard=0d43367a922beadc8f523cae1c7acca6%7C1719390493%7C5184002%7CSun%2C+25-Aug-2024+08%3A28%3A15+GMT; uid_tt=621c9604ffaa20db32a1c2845204028d; uid_tt_ss=621c9604ffaa20db32a1c2845204028d; sid_tt=0d43367a922beadc8f523cae1c7acca6; sessionid=0d43367a922beadc8f523cae1c7acca6; sessionid_ss=0d43367a922beadc8f523cae1c7acca6; sid_ucp_v1=1.0.0-KDBlODZlMDE5NDk4MWQ1OTU0YjkyNDlhMWFhZGFmMTQ2YzgzMDVhOTIKFQiglYODhgMQnaLvswYY9hc4AkDxBxoCbHEiIDBkNDMzNjdhOTIyYmVhZGM4ZjUyM2NhZTFjN2FjY2E2; ssid_ucp_v1=1.0.0-KDBlODZlMDE5NDk4MWQ1OTU0YjkyNDlhMWFhZGFmMTQ2YzgzMDVhOTIKFQiglYODhgMQnaLvswYY9hc4AkDxBxoCbHEiIDBkNDMzNjdhOTIyYmVhZGM4ZjUyM2NhZTFjN2FjY2E2; studio_web_id=7384725849957008908; x-web-secsdk-uid=f1e6df18-0dbb-4df7-b790-19b4a352c412; ttwid=1%7CWNFv3MRogd2pcDQgjToaAEXgmTeBcjgpEAd7tJMIo-s%7C1724210186%7Ce57d2d8db2c5217101a742d507bfdb95288d4564671f19429cef7fc8ed0d4e5b';
    //const authData = await getAuthKey(cookie);
    const userInfo = await await Xiguashipin.getXiguaVideoStatus(cookie, '7374699560951611919');

    console.log('西瓜视频上传结果：', userInfo);
  }, 10000000);
});

//ItemId=7374699560951611919
