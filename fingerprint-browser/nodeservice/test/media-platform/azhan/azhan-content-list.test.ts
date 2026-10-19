import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/azhan/azhan-content-list.service';
import { Azhan } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('获取A站视频列表', async () => {
    const cookie =
      '_did=web_38651825917FF3AA; Hm_lvt_2af69bc2b378fb58ae04ed2a04257ed1=1748929484; ac_username=XxXxXxXxCc; ac_userimg=https%3A%2F%2Fimgs.aixifan.com%2Fstyle%2Fimage%2F201907%2FdytOs5icCUsbhzxD2rhaf9JwAYWuXCVl.jpg; acPostHint=2edfbe5462f1b38e989ef1f7fa857affdce9; acPasstoken=ChVpbmZyYS5hY2Z1bi5wYXNzdG9rZW4SYKt6n-Y8_lk2smzwq90pYX8T-OtYvbgwejkHbQ1H1Euo6LB_T-ypU52RsaCwTbpo6rbZP5o2ud_Sx-nt6vJnGN6p_P0XZ9xRCRyQtS2PPQNOsJMEXe7DNoFyBOia6EPCNhoSAxpUclERLkvrvWRT1WxekAG-IiBviRFVo1NWee9cZOx47wXryg21KslM_MrsuTwk95oQcigFMAE; auth_key=1369776; Hm_lpvt_2af69bc2b378fb58ae04ed2a04257ed1=1748929484; HMACCOUNT=3867B335D1F50DEF; cur_req_id=239092038AF2D96E_self_609936b5b31645b19d3c9dc8848382c5; cur_group_id=239092038AF2D96E_self_609936b5b31645b19d3c9dc8848382c5_0; cur_req_id=10210532588E8E94_self_609936b5b31645b19d3c9dc8848382c5; cur_group_id=10210532588E8E94_self_609936b5b31645b19d3c9dc8848382c5_0';

    const userInfo = await Azhan.getAzhanUserInfo(cookie);
    const result = await getContentListAsync(cookie, 0, parseInt(userInfo.yixiaoerId ?? '0'));
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.result).toBe(0);
  }, 10000000);
});
