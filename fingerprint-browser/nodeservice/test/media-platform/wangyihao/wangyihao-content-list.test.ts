import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/wangyihao/wangyihao-content-list.service';

describe('【Mock】', () => {
  describe('获取网易号内容列表', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/content/manage/list.do', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: {
                total: 121,
                list: [
                  {
                    contentType: 2,
                    contentState: 3,
                    title: '半速集合啦~上车！',
                    showTime: '2023-10-31 20:06:44',
                    updateTime: '2023-10-31 20:08:34',
                    topState: 0,
                    originalState: 0,
                    wemediaId: 'W2905703798683225716',
                    skipId: 'VKHFKORI9',
                    skipTopicId: 'VH27T0DK2',
                    articleId: 'IIDEEE0T0552ZF94',
                    commentId: 'KHFKORI9050835RB',
                    picUrl: 'https://videoimg.ws.126.net/cover/20231031/GmrB9hcog_cover.jpg',
                    publishTime: 1698754004000,
                    pvCount: 6,
                    recommendCount: 621,
                    commentCount: 0,
                    shareCount: 0,
                    scheduledState: 0,
                    scheduledTime: null,
                    commentState: null,
                    isLock: 0,
                    couldModify: 1,
                    reason: null,
                    hasAd: 0,
                    unrecomReason: '',
                    isRecommend: 1,
                    essayTitle: null,
                    activityName: null,
                    activityUrl: null,
                    activityId: null,
                    selfRecommendFlag: false,
                    selfRecommend: null,
                    createTime: '2023-10-31 20:06:44',
                    articleBody: null,
                    groupResult: null,
                    isCanGroupFlag: null,
                    sourceInfos: '220.202.224.154',
                    ncCircleInfo: null,
                    praiseCount: 0,
                    dissCount: 0,
                    recommendMoment: null,
                    inBDWhitelist: false,
                    subjectId: '8915',
                    subjectTitle: null,
                    subjectList: [
                      {
                        subjectId: '8915',
                        subjectTitle: '#“游戏机”小霸王被申请破产#',
                      },
                    ],
                    activitySubjectId: null,
                    activitySubjectTitle: null,
                    playLength: 11,
                    essayUrl: null,
                    processRate: 4219,
                    payFlag: null,
                    price: null,
                    purchaseType: null,
                    purchaseCount: null,
                    totalAmount: null,
                    vipCount: null,
                    vipPV: null,
                    columnId: null,
                    paidPreview: null,
                    paidLength: null,
                    userShareProp: null,
                    exclusiveCopyright: null,
                    referralContentId: '',
                    outAppPrice: null,
                    videoPlayType: null,
                    pageDisplay: null,
                    cnumber: null,
                  },
                ],
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getContentListAsync('success', '', '', 1, 10);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(2000000);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取网易号内容列表', async () => {
    const cookie =
      'hb_MA-9F44-2FC2BD04228F_source=yunxin.163.com; _ga=GA1.1.1472123012.1696830052; hb_MA-975A-DBD9471124CE_source=yunxin.163.com; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1698894760887; NTES_YD_SESS=2yK6AP.GFf4iAFxmIm4x.8lZmSN8QIj50irWPzo6LrzS.6Js.4TFkUG719b3CaBKiyFhZ_CnL2cA0tRRoiQuvwmk2K.p_5NBFoJBY9fAKNhUMsweLlvT1g2fZya.jZrFPA89RBIArce03HForh9vmgGOU.S61hK0AhaDjU0077zLkClYvXhExoloDAtT_Re6aMfvxIYQlMJkZIti5QwHiyrlamztZ0Z7YRa7mknFVFXXB; S_INFO=1698894795|0|0&60##|18874070066; P_INFO=18874070066|1698894795|1|subscribe|00&99|null&null&null#hun&null#10#0#0|&0|null|18874070066; UserProvince=%u5168%u56FD; cm_newmsg=user%3D188*****066%26new%3D-1%26total%3D-1; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; NTESwebSI=04E0727927A9E9AC1A3716B1B72CA42A';

    const result = await getContentListAsync(cookie, 'yd.692a357e4c1a4b5f8%40163.com', 'W2905703798683225716', 1, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);
});
