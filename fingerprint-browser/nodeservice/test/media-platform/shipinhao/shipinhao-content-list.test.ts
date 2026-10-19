import { describe, expect, test } from 'vitest';
import { getContentListAsync } from '@/media-platform/shipinhao/shipinhao-content-list.service';
import { getUserinfo } from '@/media-platform/shipinhao/shipinhao-base.service';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';

describe('【Mock】', () => {
  describe('获取视频号作品列表', () => {
    const server = setupServer(
      rest.get('https://channels.weixin.qq.com*/cgi-bin/mmfinderassistant-bin/post/post_list', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              errCode: 0,
              errMsg: 'request successful',
              data: {
                list: [
                  {
                    commentList: [],
                    objectId:
                      'export/UzFfAgtgekIEAQAAAAAAw9kgs2-VnwAAAAstQy6ubaLX4KHWvLEZgBPEn4MQI21BbPeGzNPgMJpBwoL-8zBzqu_ysNVY8dwW',
                    createTime: 1693453574,
                    likeCount: 0,
                    commentCount: 0,
                    readCount: 8,
                    forwardCount: 0,
                    favCount: 0,
                    commentClose: 0,
                    visibleType: 1,
                    status: 1,
                    desc: {
                      media: [
                        {
                          spec: [],
                          url: 'https://finder.video.qq.com/251/20302/stodownload?encfilekey=Cvvj5Ix3eewK0tHtibORqcsqchXNh0Gf3sJcaYqC2rQAlicJzOufFopjtibUVYW5eE2quTNOYE4eD86Fj8ziaZqHnSv8BUCaaVxwwtq1k00nj3H6qUa6b876lMaibGn2f4txt&token=cztXnd9GyrEKsKLMCoo2HcUodsPkmF1X4mmFeRh9ricbicGztlh08V5ecxXDxQEfzbUoraib3yxO4CE8IWQGQsIsictMqJNTyMbO8GZ0f39Xt17hJpLB5TAgLrxeb6qQjRMP&idx=1&bizid=1023&dotrans=0&hy=SH&m=&web=1',
                          thumbUrl:
                            'https://finder.video.qq.com/251/20304/stodownload?encfilekey=Cvvj5Ix3eexKX1zo1IZZBrQomawdVfSQSzIWra3XwBra438ykWSE4XIia3RmUysFiaWD1QSYq6K6mRiaL7ia8wB1z55cKEKYyzTdHlRA2FY4RhuyUpyOeuBs3sseBicXCt0mVPCbyE88u8yMTvSTI5avSKff5On5J2xooRCXTliaKbUicI&token=Cvvj5Ix3eezqxdzOWuG5symS160pyPBGCiaueiaKsmSicZrnf9Xmt6q71xjmkLiayDqBmAs7wSN1dqxhHiappQ9U65A5kFU2KUcRTTOp9dS5YV8h7Y2aKMyOcUfiaNk3wqInoX&idx=1&bizid=1023&dotrans=0&hy=SZ&m=62be67293873f9c485c7f03b07e86363',
                          mediaType: 4,
                          videoPlayLen: 47,
                          width: 544,
                          height: 960,
                          md5sum: '757500c6579c9358656cb8be0f6fd6d0',
                          fileSize: 15649117,
                          bitrate: 2417286,
                          coverUrl: '',
                          fullThumbUrl:
                            'https://finder.video.qq.com/251/20304/stodownload?encfilekey=Cvvj5Ix3eexKX1zo1IZZBrQomawdVfSQSzIWra3XwBra438ykWSE4XIia3RmUysFiaWD1QSYq6K6mRiaL7ia8wB1z55cKEKYyzTdHlRA2FY4RhuyUpyOeuBs3sseBicXCt0mVPCbyE88u8yMTvSTI5avSKff5On5J2xooRCXTliaKbUicI&token=6xykWLEnztKxa8V933iciaialgAOoCYKkNqCtEib07kgicyGDzXqa5K9NLicCvia2hmc5oOvd68jqAYDRs1CXIj5IyjEwHZo8z83cxkyA7p558JPLMLHAiaTibrMJvCJxIyMibYZibd&idx=1&bizid=1023&dotrans=0&hy=SZ&m=62be67293873f9c485c7f03b07e86363',
                          fullUrl: '',
                          fullWidth: 0,
                          fullHeight: 0,
                          fullMd5sum: '',
                          fullFileSize: 0,
                          fullBitrate: 0,
                          halfRect: {},
                          fullCoverUrl: '',
                          cardShowStyle: 0,
                        },
                      ],
                      mentionedMusics: [],
                      shortTitle: [],
                      description: '1899年高密抗德阻路运动',
                      mediaType: 4,
                      location: {},
                      extReading: {
                        link: '',
                        title: '',
                      },
                      feedLocation: {
                        longitude: 0,
                        latitude: 0,
                      },
                      audio: {},
                    },
                    objectType: 0,
                    attachList: {
                      attachments: [],
                    },
                    flag: 0,
                    objectNonce: '15665270628168850379',
                    permissionFlag: 0,
                    canSetOriginalsoundTitle: true,
                    fullPlayRate: 0,
                    avgPlayTimeSec: 3.375,
                    disableInfo: {
                      isDisabled: false,
                    },
                    showOriginal: true,
                    exportId:
                      'export/UzFfAgtgekIEAQAAAAAAw9kgs2-VnwAAAAstQy6ubaLX4KHWvLEZgBPEn4MQI21BbPeGzNPgMJpBwoL-8zBzqu_ysNVY8dwW',
                    ringsetCount: 0,
                    snscoverCount: 0,
                    statusrefCount: 0,
                    forwardAggregationCount: 0,
                    originalInfo: {
                      auditOriginalFlag: 1,
                      isDeclared: 1,
                      isOriginalUpgrad: 0,
                    },
                    followCount: 0,
                    fastFlipRate: 0.625,
                  },
                ],
                bindInfo: [],
                totalCount: 14,
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
        const result = await getContentListAsync('success', '', 0, 0, 0);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.errCode).toBe(0);
        expect(result?.data?.totalCount).toBe(14);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取内容列表', async () => {
    const cookie =
      'sessionid=BgAAHKmEyhj58QIf17IbKdxhx5pu4a8q5erAPWcPw4ZlIi935dqjBj7lxJDcgPUOW7gMf5hcbjJ7wkVuh5kOifLDiXx08khodZ%2BI; wxuin=1549961696; _finder_fake_uin=F6Z3wNBu7VLgScI%2FLOlEeLRWALa0ZxxUZkdYpGyLfSoeFih40pBaLl2wJmWBX5ziMJDaofhUE3kjdlF4fZ4pi61Q5D94xz%2FSLOMO2l6YF0nwXxKahG3ErNoVO%2BoxFuog5XMXU%2FpB';

    const currentPage = 1;
    const pageSize = 20;

    const userInfo = await getUserinfo(cookie);

    const finderUsername = userInfo?.data?.finderUser?.finderUsername ?? 'asdfsdf';
    const wxuin = userInfo?.data?.finderUser?.uin ?? 0;

    const result = await getContentListAsync(cookie, finderUsername, wxuin, currentPage, pageSize);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.errCode).toBe(0);
  }, 10000000);
});
