import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { PiPiXiaVideoTaskInput } from '../../../src/media-platform/pipixia/pipixia-video';
import { Pipixia } from '../../../src';
import { convertCookieStr } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  const cookie = convertCookieStr(
    's_v_web_id=mq9b5ei0_71mlHrZf_hfXk_4ftx_AHZa_CxPaj0g7Asnx; csrf_session_id=5e8da6732c4b3f44ef086dd165727e26; passport_csrf_token=21d4376cac68b087441c67bad6f51357; passport_csrf_token_default=21d4376cac68b087441c67bad6f51357; sso_uid_tt=4c0117bc86627eadfcdebe7571d6c0f4; sso_uid_tt_ss=4c0117bc86627eadfcdebe7571d6c0f4; toutiao_sso_user=b47d047d1cc29f7c168b0372e631e3eb; toutiao_sso_user_ss=b47d047d1cc29f7c168b0372e631e3eb; sid_ucp_sso_v1=1.0.0-KDM0YmRmYWUwOTZiODcwMGNmOWVjYTMzMjBkYWJkMGZhNjNlNjNiNjMKFgirsJDBqqy1BxDMharRBhiPCzgIQAsaAmxmIiBiNDdkMDQ3ZDFjYzI5ZjdjMTY4YjAzNzJlNjMxZTNlYg; ssid_ucp_sso_v1=1.0.0-KDM0YmRmYWUwOTZiODcwMGNmOWVjYTMzMjBkYWJkMGZhNjNlNjNiNjMKFgirsJDBqqy1BxDMharRBhiPCzgIQAsaAmxmIiBiNDdkMDQ3ZDFjYzI5ZjdjMTY4YjAzNzJlNjMxZTNlYg; uid_tt=2901f78525d5e7dd45e1a9de3c540155; uid_tt_ss=2901f78525d5e7dd45e1a9de3c540155; sid_tt=5dc3fbae1708b145f1fae99c2d6c81a5; sessionid=5dc3fbae1708b145f1fae99c2d6c81a5; sessionid_ss=5dc3fbae1708b145f1fae99c2d6c81a5; is_staff_user=false; has_biz_token=false; gfkadpd=1423,35094; sid_guard=5dc3fbae1708b145f1fae99c2d6c81a5%7C1783669371%7C5184000%7CTue%2C+08-Sep-2026+07%3A42%3A51+GMT; session_tlb_tag=sttt%7C1%7CXcP7rhcIsUXx-umcLWyBpf_________kC6bHmU8tShDKYkecc7wbdjFJVilxaJtkI2o6PzcCL20%3D; sid_ucp_v1=1.0.0-KGFmYmQ1ZDhkOGY0M2I4NTRhN2M1ZWY4MWY2MjRiNmY1NTM5ZWM4NDIKFgirsJDBqqy1BxD7xMLSBhinCjgIQAsaAmxxIiA1ZGMzZmJhZTE3MDhiMTQ1ZjFmYWU5OWMyZDZjODFhNQ; ssid_ucp_v1=1.0.0-KGFmYmQ1ZDhkOGY0M2I4NTRhN2M1ZWY4MWY2MjRiNmY1NTM5ZWM4NDIKFgirsJDBqqy1BxD7xMLSBhinCjgIQAsaAmxxIiA1ZGMzZmJhZTE3MDhiMTQ1ZjFmYWU5OWMyZDZjODFhNQ',
  );
  test('皮皮虾视视频发布', async () => {
    const taskData: PiPiXiaVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\20251205-112844.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      },
      desc: '我是视频描述',
      topic: {
        yixiaoerId: '155642',
        yixiaoerName: '这些皮友真有趣',
        yixiaoerImageUrl:
          'https://p9-ppx-sign.byteimg.com/tos-cn-v-0000/a056827c2c2f4324a7b81c3832bde253~tplv-f3gpralwbh-noop-v4:200:200:q60.jpeg?lk3s=1e780327&x-expires=1815217312&x-signature=Bb3RfQVyD81PzrY98PDtCMzCj7I%3D',
        viewNum: 1241401252,
      },
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Pipixia.publishVideo(cookie, taskData, eventCall);

    console.log('皮皮虾视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('皮皮虾视频状态', async () => {
    const result = await Pipixia.getPiPiXiaVideoStatus(cookie, '7513839164354205964');

    console.log('皮皮虾视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('皮皮虾获取话题', async () => {
    const result = await Pipixia.getPipixiaTopics(cookie,'皮友');

    console.log('皮皮虾话题：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
