import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '../../mock/mock';
import { getContentListAsync } from '../../../src/media-platform/kuaishou/kuaishou-content-list.service';
import { getUserHomeDataAsync } from '../../../src/media-platform/kuaishou/kuaishou-base.service';

describe('【Mock】', () => {
  describe('获取快手作品列表', () => {
    const server = setupServer(
      rest.get('https://cp.kuaishou.com*/rest/cp/works/v2/video/pc/photo/list', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              result: 1,
              currentTime: 1697687449614,
              'host-name': 'public-bjxy-c19-kce-node131.idchb1az2.hb1.kwaidc.com',
              data: {
                list: [
                  {
                    publishId: 0,
                    workId: '3x2c84zywfhbt9e',
                    title: '王者是一个锻炼心态的游戏，今日分享如何在连跪时还能保持微笑',
                    publishCoverUrl:
                      'https://p2.a.yximgs.com/upic/2023/10/17/16/BMjAyMzEwMTcxNjE2MThfMTE4NDA2MzIyMV8xMTUxODM1MzA4NTZfMF8z_Bca049d00ff691cc8b7c8a808d3c77a8f.jpg?tag=1-1697687449-nil-0-1mwgejkg8p-1c9088b6b7ad84f5&clientCacheKey=3x2c84zywfhbt9e.jpg&di=dccae09a&bp=10000',
                    unPublishCoverKey: null,
                    userId: 1184063221,
                    userIdStr: '3x8wzatbud853ri',
                    userName: 'John5971',
                    userHead:
                      'https://p5-pro.a.yximgs.com/uhead/AB/2019/01/02/20/BMjAxOTAxMDIyMDE4MjRfMTE4NDA2MzIyMV8xX2hkNzM5XzMyNg==_s.jpg',
                    playCount: 9079,
                    likeCount: 9,
                    commentCount: 1,
                    uploadTime: 1697538600000,
                    durationSecond: 24,
                    judgementTitle: '',
                    judgementStatus: 1,
                    tags: {
                      sphericalVideo360: false,
                      hdrVideo: false,
                    },
                    publishStatus: 4,
                    operations: ['photoTop', 'analysis', 'edit', 'delete'],
                    publishType: 0,
                    photoStatus: 0,
                    photoTop: false,
                    collectionTitle: '',
                    collectionId: 0,
                    awdId: 0,
                    hotspotActivity: null,
                    hotspot: null,
                  },
                ],
                nextCursor: '1692771462173',
                total: 17,
              },
              message: '成功',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getContentListAsync('success', '0', 0, 0, 0, '0');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.result).toBe(1);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取内容列表', async () => {
    const cookie =
      '_did=web_578147551F2426EE; did=web_44955f3183a8e587aaa821f3748089e62648; userId=1184063221; userId=1184063221; passToken=ChNwYXNzcG9ydC5wYXNzLXRva2VuEsABy3ppYGzQGvMszbzp8Bc--Xgr-ab9kfKFtulJJl57I6RefF07pzNMCoO4V9eNFIGnntP4F5FiV11ojm9hlmVu6Amm6ZUV29uk-x2-Tg_yXlZwvdx-fAVOORpVepYzq3BrUnqXMccN32qPkFrrzXlbZjCK5hgW0HV2acFFRr0xvyECnfm75xMycePnAk_xBX7CLqvOK0CoR8Z-p09br21nsp9_Nj_eKv3-6zPXkegALbQDkJ0pNC5NSUF9DyYUcl0TGhKgKyzmNjRDxLfpDU5SPFhJmG0iIF9o1X3v2hl3LIX8oNBIDDOnZH3NAdAQGP5hu1SdFBXqKAUwAQ; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABpQ0oXo3FBQg_p6onzHe4GWM1m8XNbsBmLSFQxgxGlDLhi2mJ_LpSY0AGL28WZMjJE_425W8dBbyyM_bamz9jIHCSqyRzdhJYoPMqVvMkxKcrrAAf9c4n91Asc5nPhNAi4Sj4IKu6qw2eJ9aAo9Q2eWdJxy7p5veNLZhDWKlhbBMVz8xRTmeVjQ54MdR9EbqJVGJcMJloL-ZhGU9gok9vfAEzkbMekDw2AehF5xegMF8aEqJBif2xsoaQSxixvlVTQuhgiiIgjwNPN56XTiV_hI-gAadCnIfVMXAaEUV6sUe5sdefosUoBTAB; kuaishou.web.cp.api_ph=8ded5e609524295bd8e40b9c33a2998dd05e';

    const result = await getContentListAsync(cookie, '9007199254740991', 1689955200000, 9007199254740991, 30, '0');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.result).toBe(1);
  }, 10000000);

  test('获取内容列表', async () => {
    const cookie =
      '_did=web_578147551F2426EE; did=web_44955f3183a8e587aaa821f3748089e62648; userId=1184063221; userId=1184063221; passToken=ChNwYXNzcG9ydC5wYXNzLXRva2VuEsABy3ppYGzQGvMszbzp8Bc--Xgr-ab9kfKFtulJJl57I6RefF07pzNMCoO4V9eNFIGnntP4F5FiV11ojm9hlmVu6Amm6ZUV29uk-x2-Tg_yXlZwvdx-fAVOORpVepYzq3BrUnqXMccN32qPkFrrzXlbZjCK5hgW0HV2acFFRr0xvyECnfm75xMycePnAk_xBX7CLqvOK0CoR8Z-p09br21nsp9_Nj_eKv3-6zPXkegALbQDkJ0pNC5NSUF9DyYUcl0TGhKgKyzmNjRDxLfpDU5SPFhJmG0iIF9o1X3v2hl3LIX8oNBIDDOnZH3NAdAQGP5hu1SdFBXqKAUwAQ; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABpQ0oXo3FBQg_p6onzHe4GWM1m8XNbsBmLSFQxgxGlDLhi2mJ_LpSY0AGL28WZMjJE_425W8dBbyyM_bamz9jIHCSqyRzdhJYoPMqVvMkxKcrrAAf9c4n91Asc5nPhNAi4Sj4IKu6qw2eJ9aAo9Q2eWdJxy7p5veNLZhDWKlhbBMVz8xRTmeVjQ54MdR9EbqJVGJcMJloL-ZhGU9gok9vfAEzkbMekDw2AehF5xegMF8aEqJBif2xsoaQSxixvlVTQuhgiiIgjwNPN56XTiV_hI-gAadCnIfVMXAaEUV6sUe5sdefosUoBTAB; kuaishou.web.cp.api_ph=8ded5e609524295bd8e40b9c33a2998dd05e';

    const result = await getUserHomeDataAsync(cookie);
    //
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.result).toBe(1);
  }, 10000000);
});
