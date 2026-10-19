import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { AiqiyiContentListInput, getVideoContentListAsync } from '@/media-platform/aiqiyi/aiqiyi-content-list.service';

describe('【Mock】', () => {
  describe('获取爱奇艺作品列表', () => {
    const server = setupServer(
      rest.get('https://mp-api.iqiyi.com*/video/api/1.0/upgc/mp/selfmedia/videos', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              httpStatus: 200,
              code: 0,
              msg: 'success',
              data: {
                order: 'desc',
                orderBy: 'createTimeLong',
                pageNo: 1,
                pageSize: 1,
                totalCount: 82,
                totalPages: 82,
                result: [
                  {
                    albumQipuId: 0,
                    auditResultCode: 0,
                    securityResultReason: '',
                    auditStatus: 1,
                    channelId: 17,
                    channelName: '体育',
                    chargeStatus: 0,
                    contentType: 0,
                    coverImage: 'http://u8.iqiyipic.com/image/20230926/08/9e/pv_4479795449103800_d_601.jpg',
                    createTime: '2023-09-26 21:32:45',
                    displayName: '单日再添19金！中国队断层领先亚运奖牌榜',
                    duration: 17,
                    episodeType: 'RUGC',
                    fileId: '6f01f074e1a5462685a0e406d67212e3',
                    formatMaxResolution: '1080P',
                    pageUrl: 'https://sports.iqiyi.com/resource/pcw/play/17anfy82ndg',
                    panoramaFlag: 0,
                    publicLevel: 0,
                    privatePolicy: 1,
                    publishStatus: 1,
                    publishTime: '2023-09-26 21:35:40',
                    qipuId: 4479795449103800,
                    releaseStatus: 2,
                    source: 'pgc_selfmedia_iqiyihao',
                    threeDType: 0,
                    uid: 1671129325,
                    vvNum: 0,
                    pgcType: 0,
                    unPassPart: 0,
                    uploadActionType: 'REPRINT',
                    canUpdate: true,
                    forceOffline: '0',
                    isRepresent: false,
                    videoPlayField: {
                      verticalVideo: true,
                      featureFilm: true,
                      ppc: false,
                      belongAlbum: false,
                      isUploadVideoTypeVlog: false,
                      isTagSummaryVlog: false,
                      sharpnessHas1080: true,
                      screenSize: '1080x1920',
                      screenSize600: '504x896',
                      hasQualityCheckInfo: false,
                    },
                    isAiCutInfoVideo: false,
                    upCount: 0,
                    commentCount: 0,
                    videoStatusCode: 'PUBLISHED',
                    videoStatus: '已发布',
                    isVlog: false,
                    isShowUpdate: true,
                    controlInfo: {
                      canModify: true,
                      modifyControl: {
                        enabled: true,
                        disableReason: '',
                      },
                      canShare: true,
                      shareControl: {
                        enabled: true,
                      },
                      canClickData: true,
                      clickDataControl: {
                        enabled: true,
                        disableReason: '',
                      },
                      canPreview: true,
                      previewControl: {
                        enabled: true,
                        disableReason: '',
                      },
                      canSetPresent: true,
                      setPresentControl: {
                        enabled: true,
                        disableReason: '',
                      },
                      canModifyTimer: false,
                      modifyTimerControl: {
                        enabled: false,
                        disableReason: '',
                      },
                      canDelete: true,
                      deleteControl: {
                        enabled: true,
                        disableReason: '',
                        hidden: false,
                      },
                      canOnlineOffline: false,
                      onlineOfflineControl: {
                        enabled: false,
                        disableReason: '',
                      },
                      produceVerticalVideoControl: {
                        disableReason: '',
                      },
                      canPrviewVerticalVideo: false,
                      canSegment: false,
                      segmentControl: {
                        enabled: false,
                        disableReason: '',
                      },
                      canIntoAlbum: false,
                      intoAlbumControl: {
                        enabled: false,
                        disableReason: '',
                      },
                      canComplain: false,
                      complainControl: {
                        enabled: false,
                        disableReason: '',
                      },
                      canIntoFansVipPack: false,
                      intoFansVipPackControl: {
                        enabled: false,
                        disableReason: '',
                      },
                      canQuickAudit: false,
                      quickAuditControl: {
                        enabled: false,
                        disableReason: '',
                      },
                      liuliangbaoControl: {
                        canUseLiuliangbao: true,
                        enabled: true,
                        disableReason: '',
                        deliverStatus: 'NOT_DELIVER',
                      },
                      previewVerticalVideoControl: {
                        enabled: false,
                        disableReason: '',
                      },
                    },
                    auditOperateType: 6,
                    imageStatus: 1,
                    hasQualityCheckResult: false,
                    securityAuditStatus: 1,
                    videoSize600: {
                      width: 504,
                      height: 896,
                      widthHeightRatio: 0.5625,
                    },
                    payVipTypes: [],
                    zhuibaWhite: false,
                    isOven: false,
                    businessType: 0,
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
        const params: AiqiyiContentListInput = {
          pageNo: 1,
          pageSize: 11,
          order: 'desc',
          orderBy: 'createTime',
        };
        const result = await getVideoContentListAsync('success', params);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取爱奇艺作品列表', async () => {
    const cookie =
      'QC006=eatla7qhi23w2boszthh4yc3; P00004=.1698219769.a707f2081f; QC005=67659a9c2553af085693142e93dbf993; P00001=c4NaNjZIJA3LENHPSS8dJl6CfL566AI5tlEuJMw10tklshFKIzrkzAvUsUe5xKKm1T0bb; P00003=1671129325; P00010=1671129325; P01010=1698249600; P00007=c4NaNjZIJA3LENHPSS8dJl6CfL566AI5tlEuJMw10tklshFKIzrkzAvUsUe5xKKm1T0bb; P00PRU=1671129325; P00002=%7B%22uid%22%3A%221671129325%22%2C%22pru%22%3A1671129325%2C%22user_name%22%3A%22188****0066%22%2C%22nickname%22%3A%22%5Cu806a%5Cu660e%5Cu7684%5Cu5c0f%5Cu5947%5Cu827aSIA%22%2C%22pnickname%22%3A%22%5Cu806a%5Cu660e%5Cu7684%5Cu5c0f%5Cu5947%5Cu827aSIA%22%2C%22type%22%3A11%2C%22email%22%3Anull%7D; QC160=%7B%22type%22%3A3%2C%22conformLoginType%22%3A0%7D; __dfp=a01c3a4164cadc42d1b553692c9870ec0d8a563dad31652110640e647b58085047@1699515766013@1698219767013';

    const params: AiqiyiContentListInput = {
      pageNo: 1,
      pageSize: 11,
      order: 'desc',
      orderBy: 'createTime',
    };

    const result = await getVideoContentListAsync(cookie, params);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
