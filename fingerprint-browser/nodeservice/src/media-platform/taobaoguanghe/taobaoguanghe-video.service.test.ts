import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  buildTaoBaoGuangHeGoodsItems,
  buildTaoBaoGuangHeGoodsListRequest,
  buildTaoBaoGuangHeGoodsTabsRequest,
  buildTaoBaoGuangHeDeleteRequest,
  buildTaoBaoGuangHeContentListRequest,
  deleteTaoBaoGuangHeContent,
  getTaoBaoGuangHeGoodsList,
  getTaoBaoGuangHeGoodsTabs,
  getTaoBaoGuangHeMediaStatus,
  buildGuangHeDescription,
  buildTaoBaoGuangHeImageTextPublishRequest,
  buildTaoBaoGuangHePublishRequest,
  extractTaoBaoGuangHePublishSession,
  isTaoBaoGuangHeMtopTokenInvalid,
  publishTaoBaoGuangHeImageText,
  mapTaoBaoGuangHeAuditStatus,
} from './taobaoguanghe-video.service';
import { auditStatusEnum } from '@/utils';
import { errorCode } from '@/media-platform/errorCode';

describe('TaoBaoGuangHe MTop token refresh', () => {
  it('retries when Taobao issues the initial token with a token-empty response', () => {
    expect(
      isTaoBaoGuangHeMtopTokenInvalid({
        ret: ['FAIL_SYS_TOKEN_EMPTY::令牌为空'],
      }),
    ).toBe(true);
  });
});

const deleteServer = setupServer(
  rest.get('https://h5api.m.taobao.com/h5/mtop.taobao.gcm.content.admin.list/1.0/', (req, res, context) => {
    expect(req.url.searchParams.get('jsv')).toBe('2.6.1');
    expect(req.url.searchParams.get('api')).toBe('mtop.taobao.gcm.content.admin.list');
    expect(req.url.searchParams.get('type')).toBe('originaljsonp');
    expect(req.url.searchParams.get('dataType')).toBe('originaljsonp');
    expect(req.url.searchParams.get('callback')).toBe('mtopjsonp31');
    expect(req.headers.get('origin')).toBe('https://creator.guanghe.taobao.com');
    expect(req.headers.get('referer')).toBe('https://creator.guanghe.taobao.com/page/workspace/tb');
    expect(JSON.parse(req.url.searchParams.get('data') ?? '')).toEqual(buildTaoBaoGuangHeContentListRequest());
    return res(
      context.status(200),
      context.text(
        `mtopjsonp31(${JSON.stringify({
          api: 'mtop.taobao.gcm.content.admin.list',
          data: {
            fail: false,
            model: {
              data: [
                {
                  auditInfo: { status: 1 },
                  baseInfo: {
                    id: '3992545756931752',
                    online: false,
                    onlineTime: 4102444800000,
                    publishTime: 4102444700000,
                  },
                },
              ],
              hasNext: false,
            },
          },
          ret: ['SUCCESS::调用成功'],
          v: '1.0',
        })})`,
      ),
    );
  }),
  rest.get('https://h5api.m.taobao.com/h5/mtop.taobao.gcm.content.admin.delete/1.0/', (req, res, context) => {
    expect(req.url.searchParams.get('jsv')).toBe('2.6.1');
    expect(req.url.searchParams.get('api')).toBe('mtop.taobao.gcm.content.admin.delete');
    expect(req.url.searchParams.get('v')).toBe('1.0');
    expect(req.url.searchParams.get('type')).toBe('originaljsonp');
    expect(req.url.searchParams.get('dataType')).toBe('originaljsonp');
    expect(req.url.searchParams.get('callback')).toBe('mtopjsonp32');
    expect(req.headers.get('origin')).toBe('https://creator.guanghe.taobao.com');
    expect(req.headers.get('referer')).toBe('https://creator.guanghe.taobao.com/page/workspace/tb');
    expect(JSON.parse(req.url.searchParams.get('data') ?? '')).toEqual({
      id: 2161672207112615,
      source: 'guanghe',
      mode: 0,
      agentType: '',
    });
    return res(
      context.status(200),
      context.text(
        'mtopjsonp32({"api":"mtop.taobao.gcm.content.admin.delete","data":{"fail":false,"model":true},"ret":["SUCCESS::\u8c03\u7528\u6210\u529f"],"v":"1.0"})',
      ),
    );
  }),
);

const goodsServerHandlers = [
  rest.post('https://h5api.m.taobao.com/h5/mtop.taobao.media.guang.session.generate/1.0/', (req, res, context) => {
    expect(req.url.searchParams.get('api')).toBe('mtop.taobao.media.guang.session.generate');
    expect(req.url.searchParams.get('type')).toBe('originaljson');
    expect(req.url.searchParams.get('dataType')).toBe('jsonp');
    expect(req.url.searchParams.get('withCredentials')).toBe('true');
    expect(req.url.searchParams.get('timeout')).toBe('5000');
    const requestCookie = req.headers.get('cookie') ?? '';
    const requestData = JSON.parse(new URLSearchParams(String(req.body ?? '')).get('data') ?? '');
    expect(requestData).toEqual({ request: JSON.stringify({ ugcScene: 'pc_newcreator_video' }) });
    if (requestCookie.includes('session-expired-test=1')) {
      return res(
        context.status(200),
        context.json({
          api: 'mtop.taobao.media.guang.session.generate',
          data: {},
          ret: ['FAIL_SYS_SESSION_EXPIRED::Session过期'],
          v: '1.0',
        }),
      );
    }
    if (requestCookie.includes('proactive-refresh-test=1') && !requestCookie.includes('refreshed-token')) {
      expect(requestCookie).not.toContain('_m_h5_tk=expired-token_946684800000');
      return res(
        context.status(200),
        context.cookie('_m_h5_tk', 'refreshed-token_4102444800000', { path: '/' }),
        context.cookie('_m_h5_tk_enc', 'refreshed-encoded-token', { path: '/' }),
        context.json({
          api: 'mtop.taobao.media.guang.session.generate',
          data: {},
          ret: ['FAIL_SYS_TOKEN_EMPTY::令牌为空'],
          v: '1.0',
        }),
      );
    }
    if (requestCookie.includes('session-refresh-test=1') && !requestCookie.includes('refreshed-token')) {
      return res(
        context.status(200),
        context.cookie('_m_h5_tk', 'refreshed-token_4102444800000', { path: '/' }),
        context.cookie('_m_h5_tk_enc', 'refreshed-encoded-token', { path: '/' }),
        context.json({
          api: 'mtop.taobao.media.guang.session.generate',
          data: {},
          ret: ['FAIL_SYS_SESSION_EXPIRED::Session过期'],
          v: '1.0',
        }),
      );
    }
    if (requestCookie.includes('cookie-filter-test=1')) {
      expect(Buffer.byteLength(requestCookie, 'utf8')).toBeLessThanOrEqual(4096);
      expect(requestCookie).toContain('_m_h5_tk=token_4102444800000');
      expect(requestCookie).toContain('_m_h5_tk_enc=encoded-token');
      expect(requestCookie).not.toContain('ultraCookieBase=');
      expect(requestCookie).not.toContain('tfstk=');
    }
    return res(
      context.status(200),
      context.json({
        api: 'mtop.taobao.media.guang.session.generate',
        data: {
          publishSession: 'publish-session',
        },
        ret: ['SUCCESS::调用成功'],
        v: '1.0',
      }),
    );
  }),
  rest.post('https://h5api.m.taobao.com/h5/mtop.taobao.media.guang.item.listTabs/1.0/', (req, res, context) => {
    expect(req.url.searchParams.get('jsv')).toBe('2.6.1');
    expect(req.url.searchParams.get('api')).toBe('mtop.taobao.media.guang.item.listTabs');
    expect(req.url.searchParams.get('type')).toBe('originaljson');
    expect(req.url.searchParams.get('dataType')).toBe('jsonp');
    const requestData = JSON.parse(new URLSearchParams(String(req.body ?? '')).get('data') ?? '');
    if (
      req.headers.get('cookie')?.includes('publish-session-refresh-test=1') &&
      requestData.publishSession === 'stale-publish-session'
    ) {
      return res(
        context.status(200),
        context.json({
          api: 'mtop.taobao.media.guang.item.listTabs',
          data: {},
          ret: ['FAIL_SYS_SESSION_EXPIRED::Session过期'],
          v: '1.0',
        }),
      );
    }
    expect(requestData).toEqual(buildTaoBaoGuangHeGoodsTabsRequest({ publishSession: 'publish-session' }));
    return res(
      context.status(200),
      context.json({
        api: 'mtop.taobao.media.guang.item.listTabs',
        data: {
          result: [
            {
              hasPerm: true,
              tabName: '已购商品',
              filters: [{ filterName: '全部', filterValue: '-1', selected: true }],
              secondLevelFilters: [{ filterName: '家居', filterValue: '家居', selected: false }],
            },
          ],
        },
        ret: ['SUCCESS::调用成功'],
        v: '1.0',
      }),
    );
  }),
  rest.post('https://h5api.m.taobao.com/h5/mtop.taobao.media.guang.item.listItems/1.0/', (req, res, context) => {
    expect(req.url.searchParams.get('jsv')).toBe('2.6.1');
    expect(req.url.searchParams.get('api')).toBe('mtop.taobao.media.guang.item.listItems');
    expect(req.url.searchParams.get('type')).toBe('originaljson');
    expect(req.url.searchParams.get('dataType')).toBe('jsonp');
    const requestData = JSON.parse(new URLSearchParams(String(req.body ?? '')).get('data') ?? '');
    if (
      req.headers.get('cookie')?.includes('publish-session-refresh-test=1') &&
      requestData.publishSession === 'stale-publish-session'
    ) {
      return res(
        context.status(200),
        context.json({
          api: 'mtop.taobao.media.guang.item.listItems',
          data: {},
          ret: ['FAIL_SYS_SESSION_EXPIRED::Session过期'],
          v: '1.0',
        }),
      );
    }
    const requestCookie = req.headers.get('cookie') ?? '';
    let expectedRequest;
    if (requestCookie.includes('source-order-test=1')) {
      expectedRequest = buildTaoBaoGuangHeGoodsListRequest('', '', {
        publishSession: 'publish-session',
        source: 'order',
      });
    } else if (requestCookie.includes('source-self-shop-test=1')) {
      expectedRequest = buildTaoBaoGuangHeGoodsListRequest('', '', {
        publishSession: 'publish-session',
        source: 'selfShop',
      });
    } else {
      expectedRequest = buildTaoBaoGuangHeGoodsListRequest('', '', {
        publishSession: 'publish-session',
        filterValue: '50020649',
        secondLevelFilterValue: '家居',
      });
    }
    expect(requestData).toEqual(expectedRequest);
    return res(
      context.status(200),
      context.json({
        api: 'mtop.taobao.media.guang.item.listItems',
        data: {
          cursor: '2',
          data: [
            {
              aiContentValid: false,
              blackCategory: false,
              categoryId: 50020649,
              categoryName: '沥水篮',
              isUpShelf: true,
              itemId: 1026731553684,
              itemUrl: 'https://item.taobao.com/item.htm?id=1026731553684',
              labelIcons: [],
              mainCategoryId: 27,
              newItem: false,
              picUrl: 'https://gw2.alicdn.com/item-cover.jpg',
              price: '3.90',
              recentSellFuzzyCount: '7000+',
              searchHighRecommend: false,
              searchSuperRecommend: false,
              shopTitle: '理想生活家居百货特卖',
              source: requestData.source,
              tagIcons: [],
              title: '可挂式水槽沥水篮家用厨房水槽分离食物残渣过滤篮水果清洗沥水篮',
              userType: 0,
            },
          ],
        },
        ret: ['SUCCESS::调用成功'],
        v: '1.0',
      }),
    );
  }),
];

deleteServer.use(...goodsServerHandlers);

beforeAll(() => {
  deleteServer.listen({ onUnhandledRequest: 'bypass' });
});
afterAll(() => {
  deleteServer.close();
});

describe('TaoBaoGuangHe video publish payload', () => {
  it('maps GuangHe works to scheduled and published states without guessing success', () => {
    expect(
      mapTaoBaoGuangHeAuditStatus(
        { auditInfo: { status: 1 }, baseInfo: { online: false, onlineTime: 1_800_000_000_000 } },
        1_700_000_000_000,
      ),
    ).toBe(auditStatusEnum.prePublish);
    expect(mapTaoBaoGuangHeAuditStatus({ auditInfo: { status: 1 }, baseInfo: { online: true } })).toBe(
      auditStatusEnum.published,
    );
    expect(mapTaoBaoGuangHeAuditStatus({ auditInfo: { status: 0 }, baseInfo: { online: true } })).toBe(
      auditStatusEnum.inAudit,
    );
    expect(
      mapTaoBaoGuangHeAuditStatus(
        { auditInfo: { status: -1 }, baseInfo: { online: false, onlineTime: 1_800_000_000_000 } },
        1_700_000_000_000,
      ),
    ).toBe(auditStatusEnum.deny);
  });

  it('queries the GuangHe work list and maps a scheduled work', async () => {
    await expect(
      getTaoBaoGuangHeMediaStatus('_m_h5_tk=token_1787134339114; _m_h5_tk_enc=enc', '3992545756931752'),
    ).resolves.toMatchObject({
      code: 0,
      publishId: '3992545756931752',
      docId: '3992545756931752',
      auditStatus: auditStatusEnum.prePublish,
      msg: '定时发布中',
    });
  });

  it('normalizes the Lingjing delete task payload', () => {
    expect(
      buildTaoBaoGuangHeDeleteRequest({
        platformCode: 'TaoBaoGuangHe',
        docId: '1977956844060849',
        contentType: 'video',
        isDraft: false,
      }),
    ).toEqual({
      id: 1977956844060849,
      source: 'guanghe',
      mode: 0,
      agentType: '',
    });
  });

  it('deletes a GuangHe work with the official MTop request', async () => {
    await expect(
      deleteTaoBaoGuangHeContent('_m_h5_tk=token_1787134339114; _m_h5_tk_enc=enc', '2161672207112615'),
    ).resolves.toMatchObject({ code: 0, msg: '删除成功' });
    await expect(deleteTaoBaoGuangHeContent('cookie', '错误 ID')).resolves.toMatchObject({
      code: 2,
      msg: '作品 ID 格式错误',
    });
  });

  it('extracts publishSession from nested pc.config data before upload', () => {
    expect(
      extractTaoBaoGuangHePublishSession({
        data: {
          model: JSON.stringify({
            pageConfig: JSON.stringify({
              publishParams: JSON.stringify({ publishSession: 'publish-session-before-upload' }),
            }),
          }),
        },
      }),
    ).toBe('publish-session-before-upload');
  });

  it('loads GuangHe product tabs and maps the official item list response', async () => {
    await expect(getTaoBaoGuangHeGoodsTabs('cookie', { publishSession: 'publish-session' })).resolves.toMatchObject({
      code: 0,
      publishSession: 'publish-session',
      dataList: [
        {
          tabName: '已购商品',
          filters: [{ filterName: '全部', filterValue: '-1', selected: true }],
        },
      ],
    });

    const result = await getTaoBaoGuangHeGoodsList('cookie', '', '', {
      publishSession: 'publish-session',
      filterValue: '50020649',
      secondLevelFilterValue: '家居',
    });
    expect(result).toMatchObject({ code: 0, nextPage: '2', publishSession: 'publish-session' });
    expect(result.dataList).toEqual([
      expect.objectContaining({
        yixiaoerId: '1026731553684',
        yixiaoerName: '可挂式水槽沥水篮家用厨房水槽分离食物残渣过滤篮水果清洗沥水篮',
        yixiaoerImageUrl: 'https://gw2.alicdn.com/item-cover.jpg',
        images: ['https://gw2.alicdn.com/item-cover.jpg'],
        yixiaoerDesc: '理想生活家居百货特卖',
        price: 3.9,
        raw: expect.objectContaining({ itemId: 1026731553684, categoryName: '沥水篮' }),
      }),
    ]);
  });

  it('uses the frontend source to query purchased products', async () => {
    const request = buildTaoBaoGuangHeGoodsListRequest('', '', { source: 'order' });
    expect(request.source).toBe('order');
    expect(request).not.toHaveProperty('filterValue');
    expect(request).not.toHaveProperty('secondLevelFilterValue');

    const result = await getTaoBaoGuangHeGoodsList('source-order-test=1', '', '', {
      publishSession: 'publish-session',
      source: 'order',
    });

    expect(result.dataList).toEqual([
      expect.objectContaining({
        raw: expect.objectContaining({ source: 'order' }),
      }),
    ]);
  });

  it('uses selfShop and the official filter shape to query store products', async () => {
    const request = buildTaoBaoGuangHeGoodsListRequest('', '', { source: 'selfShop' });
    expect(request.source).toBe('selfShop');
    expect(request).not.toHaveProperty('filterValue');
    expect(request.secondLevelFilterValue).toBe('-1');

    const result = await getTaoBaoGuangHeGoodsList('source-self-shop-test=1', '', '', {
      publishSession: 'publish-session',
      source: 'selfShop',
    });

    expect(result.dataList).toEqual([
      expect.objectContaining({
        raw: expect.objectContaining({ source: 'selfShop' }),
      }),
    ]);
  });

  it('loads the publish session before requesting tabs when no session is provided', async () => {
    await expect(getTaoBaoGuangHeGoodsTabs('cookie')).resolves.toMatchObject({
      code: 0,
      publishSession: 'publish-session',
      dataList: [{ tabName: '已购商品' }],
    });
  });

  it('refreshes publishSession before retrying tabs after a session error', async () => {
    await expect(
      getTaoBaoGuangHeGoodsTabs('publish-session-refresh-test=1', {
        publishSession: 'stale-publish-session',
      }),
    ).resolves.toMatchObject({
      code: 0,
      publishSession: 'publish-session',
      dataList: [{ tabName: '已购商品' }],
    });
  });

  it('refreshes publishSession before retrying the item list after a session error', async () => {
    await expect(
      getTaoBaoGuangHeGoodsList('publish-session-refresh-test=1', '', '', {
        publishSession: 'stale-publish-session',
        filterValue: '50020649',
        secondLevelFilterValue: '家居',
      }),
    ).resolves.toMatchObject({
      code: 0,
      publishSession: 'publish-session',
      nextPage: '2',
    });
  });

  it('keeps MTop auth cookies while removing oversized browser tracking cookies', async () => {
    const cookie = [
      '_m_h5_tk=token_4102444800000',
      '_m_h5_tk_enc=encoded-token',
      'cookie2=core-cookie',
      '_tb_token_=csrf-token',
      'unb=account-id',
      'cookie17=account-cookie',
      'cookie-filter-test=1',
      `ultraCookieBase=${'u'.repeat(5000)}`,
      `tfstk=${'f'.repeat(5000)}`,
    ].join('; ');

    await expect(getTaoBaoGuangHeGoodsTabs(cookie)).resolves.toMatchObject({
      code: 0,
      publishSession: 'publish-session',
    });
  });

  it('does not classify a generic MTop session expiry as account login expiry', async () => {
    await expect(
      getTaoBaoGuangHeGoodsTabs('_m_h5_tk=token_946684800000; session-expired-test=1'),
    ).resolves.toMatchObject({ code: errorCode.data_error, msg: expect.stringContaining('Session过期') });
  });

  it('retries a session-expired MTop response after accepting refreshed cookies', async () => {
    await expect(
      getTaoBaoGuangHeGoodsTabs('_m_h5_tk=expired-token_946684800000; _m_h5_tk_enc=expired; session-refresh-test=1'),
    ).resolves.toMatchObject({ code: 0, publishSession: 'publish-session' });
  });

  it('bootstraps a fresh MTop token when the stored token timestamp has expired', async () => {
    await expect(
      getTaoBaoGuangHeGoodsTabs('_m_h5_tk=expired-token_946684800000; _m_h5_tk_enc=expired; proactive-refresh-test=1'),
    ).resolves.toMatchObject({ code: 0, publishSession: 'publish-session' });
  });

  it('converts selected products back to official publish items and limits the cart', () => {
    const officialItem = {
      itemId: 1026731553684,
      itemUrl: 'https://item.taobao.com/item.htm?id=1026731553684',
      picUrl: 'https://gw2.alicdn.com/item-cover.jpg',
      price: '3.90',
      title: '沥水篮',
      source: 'coreitem',
    };
    expect(
      buildTaoBaoGuangHeGoodsItems([{ yixiaoerId: '1026731553684', yixiaoerName: '沥水篮', raw: officialItem }]),
    ).toEqual([officialItem]);
    expect(
      buildTaoBaoGuangHeGoodsItems({
        yixiaoerId: '1026731553684',
        yixiaoerName: '沥水篮',
        yixiaoerImageUrl: officialItem.picUrl,
      }),
    ).toEqual([
      {
        source: 'coreitem',
        itemId: '1026731553684',
        title: '沥水篮',
        picUrl: officialItem.picUrl,
      },
    ]);
    expect(() => buildTaoBaoGuangHeGoodsItems(Array.from({ length: 7 }, () => ({ itemId: 'item' })))).toThrow(
      '淘宝光合最多关联6个商品',
    );
  });

  it('uses selected products in both video and image-text publish payloads', () => {
    const officialItem = {
      itemId: 1026731553684,
      itemUrl: 'https://item.taobao.com/item.htm?id=1026731553684',
      picUrl: 'https://gw2.alicdn.com/item-cover.jpg',
      price: '3.90',
      title: '沥水篮',
      source: 'coreitem',
    };
    const shoppingCart = [{ yixiaoerId: '1026731553684', yixiaoerName: '沥水篮', raw: officialItem }];
    const config = {
      bizCode: 'pc_video_daren_publish',
      publishExtra: {},
      dataSession: 'data-session',
      sessionId: 'session-id',
    };
    const videoRequest = buildTaoBaoGuangHePublishRequest(
      {
        title: '标题',
        desc: '正文内容',
        shopping_cart: shoppingCart,
        platformAccount: { platformAccountId: 'account-001' },
        covers: [],
        video: {},
      } as never,
      config,
      'account-001',
      { fileId: 'file-001' },
      { url: 'https://img.alicdn.com/cover.jpg' },
    );
    const imageTextRequest = buildTaoBaoGuangHeImageTextPublishRequest(
      {
        title: '标题',
        desc: '正文内容',
        shopping_cart: shoppingCart,
        images: [],
        platformAccount: { platformAccountId: 'account-001' },
      } as never,
      { ...config, bizCode: 'pc_photo_daren_publish', publishExtra: { media_type: 'photo' } },
      'account-001',
      [],
    );

    expect(videoRequest.items).toEqual([officialItem]);
    expect(imageTextRequest.items).toEqual([officialItem]);
  });

  it('converts HTML topic nodes to GuangHe placeholders instead of sending markup', () => {
    const description = buildGuangHeDescription(
      '<p>AI短剧分享 <topic text="日常">#日常</topic><topic text="剪辑">#剪辑</topic><topic text="AI">#AI</topic></p> # 日常 # 剪辑 # AI',
      ['日常', '剪辑', 'AI'],
    );

    expect(description.title).toBe('AI短剧分享 #日常#剪辑#AI');
    expect(description.titleRaw).toBe('AI短剧分享 {##[Topic]##}{##[Topic]##}{##[Topic]##}');
    expect(description.titleElements).toEqual([
      { id: '', name: '日常', subType: 'hashtag_customize', type: 'Topic' },
      { id: '', name: '剪辑', subType: 'hashtag_customize', type: 'Topic' },
      { id: '', name: 'AI', subType: 'hashtag_customize', type: 'Topic' },
    ]);
  });

  it('sends scheduled publish time in both fields used by the official page', () => {
    const request = buildTaoBaoGuangHePublishRequest(
      {
        title: 'AI短剧分享',
        desc: '正文内容',
        prePubTime: 1787241600000,
        platformAccount: { platformAccountId: 'account-001' },
        covers: [],
        video: {},
      } as never,
      {
        bizCode: 'pc_video_daren_publish',
        publishExtra: {},
        dataSession: 'data-session',
        sessionId: 'session-id',
      },
      'account-001',
      { fileId: 'file-001' },
      { url: 'https://img.alicdn.com/cover.jpg' },
    );

    expect(request.onlineTime).toBe(1787241600000);
    expect(request.publishExtra.online_time).toBe(1787241600000);
  });

  it('does not use title as description when desc is omitted', () => {
    const videoRequest = buildTaoBaoGuangHePublishRequest(
      {
        title: '仅标题',
        platformAccount: { platformAccountId: 'account-001' },
        covers: [],
        video: {},
      } as never,
      {
        bizCode: 'pc_video_daren_publish',
        publishExtra: {},
        dataSession: 'data-session',
        sessionId: 'session-id',
      },
      'account-001',
      { fileId: 'file-001' },
      { url: 'https://img.alicdn.com/cover.jpg' },
    );
    const imageTextRequest = buildTaoBaoGuangHeImageTextPublishRequest(
      {
        title: '仅标题',
        images: [],
        platformAccount: { platformAccountId: 'account-001' },
      } as never,
      {
        bizCode: 'pc_photo_daren_publish',
        publishExtra: { media_type: 'photo' },
        dataSession: 'data-session',
        sessionId: 'session-id',
      },
      'account-001',
      [],
    );

    expect(videoRequest.title).toBe('');
    expect(videoRequest.titleRaw).toBe('');
    expect(imageTextRequest.title).toBe('');
    expect(imageTextRequest.titleRaw).toBe('');
    expect(videoRequest.shortTitle).toBe('%E4%BB%85%E6%A0%87%E9%A2%98');
    expect(imageTextRequest.shortTitle).toBe('%E4%BB%85%E6%A0%87%E9%A2%98');
  });

  it('does not use description as short title when title is omitted', () => {
    const request = buildTaoBaoGuangHePublishRequest(
      {
        title: '',
        desc: '仅描述',
        platformAccount: { platformAccountId: 'account-001' },
        covers: [],
        video: {},
      } as never,
      {
        bizCode: 'pc_video_daren_publish',
        publishExtra: {},
        dataSession: 'data-session',
        sessionId: 'session-id',
      },
      'account-001',
      { fileId: 'file-001' },
      { url: 'https://img.alicdn.com/cover.jpg' },
    );

    expect(request.title).toBe('%E4%BB%85%E6%8F%8F%E8%BF%B0');
    expect(request.shortTitle).toBe('');
  });

  it('requires a title or description for image-text publishing', async () => {
    await expect(
      publishTaoBaoGuangHeImageText('cookie', {
        title: '',
        desc: '',
        images: [{}],
      } as never),
    ).rejects.toMatchObject({
      message: '光合图文标题和描述至少填写一个',
      phase: 'upload',
      code: 2,
    });
  });

  it('builds the official image-text payload with top-level pics and inline topics', () => {
    const request = buildTaoBaoGuangHeImageTextPublishRequest(
      {
        title: '通用标题',
        short_title: '顶部标题',
        desc: '<p>正文内容 <topic text="日常">#日常</topic></p>',
        tags: ['穿搭'],
        topics: [
          {
            yixiaoerId: '游戏',
            yixiaoerName: '游戏',
            raw: { name: '游戏', popularity: 23749991, type: 'Topic' },
          },
        ],
        prePubTime: 1787241600000,
        images: [],
        platformAccount: { platformAccountId: 'account-001' },
      } as never,
      {
        bizCode: 'pc_photo_daren_publish',
        publishExtra: { media_type: 'photo' },
        dataSession: 'data-session',
        sessionId: 'session-id',
        publishSession: 'publish-session',
        abParams: [{ paramKey: 'use_new_publish_pre_check', paramValue: '0' }],
      },
      '1977795714',
      [
        {
          id: '1787018076680137',
          fileId: '157140881698405732',
          url: 'https://img.alicdn.com/photo-1.jpg',
          width: 2752,
          height: 1536,
        },
      ],
    );

    expect(request).toMatchObject({
      bizCode: 'pc_photo_daren_publish',
      requestId: 'session-id',
      contentType: 'article',
      ugcScene: 'pc_newcreator_pic',
      items: [],
      downloadEnable: '0',
      publishSession: 'publish-session',
    });
    expect(request.onlineTime).toBe(1787241600000);
    expect(request.publishExtra.online_time).toBe(1787241600000);
    expect(request.pics).toEqual([
      {
        id: '1787018076680137',
        fileId: '157140881698405732',
        url: 'https://img.alicdn.com/photo-1.jpg',
        width: 2752,
        height: 1536,
      },
    ]);
    expect(request.titleElements).toEqual([
      { id: '', name: '日常', subType: 'hashtag_customize', type: 'Topic' },
      { id: '', name: '穿搭', subType: 'hashtag_customize', type: 'Topic' },
      { id: '', name: '游戏', subType: 'hashtag_customize', type: 'Topic' },
    ]);
    expect(request.title).toBe(
      '%E6%AD%A3%E6%96%87%E5%86%85%E5%AE%B9%20%23%E6%97%A5%E5%B8%B8%20%23%E7%A9%BF%E6%90%AD%20%23%E6%B8%B8%E6%88%8F',
    );
    expect(request.topics).toEqual([]);
    expect(request.shortTitle).toBe('%E9%A1%B6%E9%83%A8%E6%A0%87%E9%A2%98');
  });
});
