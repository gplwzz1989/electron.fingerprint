import { describe, expect, test } from 'vitest';
import { getUserHomeDataAsync } from '@/media-platform/wangyihao/wangyihao-user.service';
import { AccountService, Platforms, Wangyihao } from '../../../src';
import { QueryWorker } from '../../../src/cloud/task/taskService';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';

describe.runIf(true)('【真实测试】', () => {
  test('获取网易号用户信息', async () => {
    const cookie =
      '_antanalysis_s_id=1762147753465; NTES_YD_SESS=cUZV4nNSECp7radu3rfQgYdNg6qQQm3_xaXS1c.TplqY9dUy9SsiI2LD.RveablOFTbfyfaBTUEV16hqGVfPtzoVgqOxbVwYK4kVTJgj1J2j_9GxUZEOv1rKdgKv5Esb.YXquW2YnuEEN1re8.MtFIcs2Xr5K7PrdVAGWI6QWknTOc1kUbiEdtDCpJmyfxSO59wC6aCkQJ3EgpcoF3DcSflnqLkppDJJFQQ3rfX.cV95v; S_INFO=1762147777|0|0&60##|15105307128; P_INFO=15105307128|1762147777|1|subscribe|00&99|null&null&null#hun&430100#10#0|&0||15105307128; _ntes_origin_from=; NTESwebSI=C33E62D90185789C95B5BBE09D240008; _ntes_nuid=d16fde15198fc8a91577fce831be321c';

    const worker = new QueryWorker('', Platforms.WangYiHao, { cookie: cookie });
    const result = await worker.checkUserCanPublish();
    const re = await worker.checkUserCanPublishNum('article' as PubContentEnum, undefined);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取网易号首页数据', async () => {
    const cookie =
      'hb_MA-9F44-2FC2BD04228F_source=yunxin.163.com; _ga=GA1.1.1472123012.1696830052; hb_MA-975A-DBD9471124CE_source=yunxin.163.com; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1698894760887; NTES_YD_SESS=2yK6AP.GFf4iAFxmIm4x.8lZmSN8QIj50irWPzo6LrzS.6Js.4TFkUG719b3CaBKiyFhZ_CnL2cA0tRRoiQuvwmk2K.p_5NBFoJBY9fAKNhUMsweLlvT1g2fZya.jZrFPA89RBIArce03HForh9vmgGOU.S61hK0AhaDjU0077zLkClYvXhExoloDAtT_Re6aMfvxIYQlMJkZIti5QwHiyrlamztZ0Z7YRa7mknFVFXXB; S_INFO=1698894795|0|0&60##|18874070066; P_INFO=18874070066|1698894795|1|subscribe|00&99|null&null&null#hun&null#10#0#0|&0|null|18874070066; UserProvince=%u5168%u56FD; cm_newmsg=user%3D188*****066%26new%3D-1%26total%3D-1; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; NTESwebSI=04E0727927A9E9AC1A3716B1B72CA42A';

    const result = await getUserHomeDataAsync(cookie, 'yd.692a357e4c1a4b5f8%40163.com', 'W2905703798683225716');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      '_ntes_origin_from=; _ntes_nuid=b32f306d2f83fec12fe3ee8e1971e9f8; _antanalysis_s_id=1739157221760; NTES_YD_SESS=bbsiq_P5cs_Z3Zg9iP9634wRnhAje0uXAgp_h8PxII7miAPuiaN2.HgkF7oR4QdScE2Yyp4mrb1esqOOUclDxXI.bSinpjzd2UPd_7GeSzYx0dRQlUldK0x6bEAVo8kvAbNuTJ0LI.T1krKC.KEzsz2RlzBrERexa2LjdQoUVnYF2TmcYAcSEjfw2KKWi3xn7D63UKSE8svoZ_jZj3WBnJqz5nYQ.3OagTA3R6DTtGSfd; S_INFO=1739157789|0|0&60##|18874070066; P_INFO=18874070066|1739157789|1|subscribe|00&99|null&null&null#hun&430100#10#0|&0|null|18874070066; ntes_utid=tid._.Xe5Oi8hiFW5FQ1EVUQLHN0QJhQe6Ao2K._.0; NTESwebSI=03C650951130530496E05CBB62049AE5; NTESwebSI=03C650951130530496E05CBB62049AE5';
    const result = await new AccountService(cookie, Platforms.WangYiHao).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
