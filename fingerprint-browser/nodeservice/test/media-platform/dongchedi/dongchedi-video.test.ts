import { describe, expect, test } from 'vitest';
import {
  DongCheHao,
  DongCheHaoDynamicTaskInput,
  DongCheHaoVideoTaskInput,
  Duoduoshipin,
  Tengxunshipin,
} from '../../../src';
import { EventEmitter } from 'events';
import { TengXunShiPinVideoTaskInput } from '../../../src/media-platform/tengxunshipin/tengxunshipin-video';
import { DuoDuoVideoTaskInput } from '../../../src/media-platform/duoduoshipin/duoduoshipin-video';
import { MeiPai } from '../../../src/media-platform/meipai';
import { MeiPaiVideoTaskInput } from '../../../src/media-platform/meipai/meipai-video';
import { CheJiaHaoVideoTaskInput } from '../../../src/media-platform/chejiahao/chejiahao-video';
import { CheJiaHao } from '../../../src/media-platform/chejiahao';
import { YiCheHaoVideoTaskInput } from '../../../src/media-platform/yichehao/yichehao-video';
import { YiCheHao } from '../../../src/media-platform/yichehao';
import { FengWang } from '../../../src/media-platform/fengwang';
import { FengWangVideoTaskInput } from '../../../src/media-platform/fengwang/fengwang-video';
import { DeWuVideoTaskInput } from '../../../src/media-platform/dewu/dewu-video';
import { DeWu } from '../../../src/media-platform/dewu';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    's_v_web_id=verify_mtjjr8h4_vFZMo39N_ZcuA_4z5n_Bb8h_MLH8dYxAa5fu; passport_csrf_token=41d90a91533b325c521a86ccccefeb22; passport_csrf_token_default=41d90a91533b325c521a86ccccefeb22; passport_auth_status=3f2fa4015e0950550c5e432684b59c65%2C; passport_auth_status_ss=3f2fa4015e0950550c5e432684b59c65%2C; sid_guard=11d2bddb970414c38c8a3325ebe19cf0%7C1788320362%7C5184001%7CSun%2C+01-Nov-2026+03%3A39%3A23+GMT; uid_tt=a320f15b231b56813f36e91ff96e7cf8; uid_tt_ss=a320f15b231b56813f36e91ff96e7cf8; sid_tt=11d2bddb970414c38c8a3325ebe19cf0; sessionid=11d2bddb970414c38c8a3325ebe19cf0; sessionid_ss=11d2bddb970414c38c8a3325ebe19cf0; session_tlb_tag=sttt%7C10%7CEdK925cEFMOMijMl6-Gc8P________-_ldWdnQ9DrhZ0F9fJexnozfua1zkg2UQlTDl9nqajXE0%3D; is_staff_user=false; has_biz_token=false; sid_ucp_v1=1.0.0-KDVjNzI2YTQzOTc2ZjE4N2YzMzViMmQ4NmY0NDAyM2IxMWRlMzNhZWQKFQiCva_l-wEQ6rTe1AYYrw44AkDxBxoCbHEiIDExZDJiZGRiOTcwNDE0YzM4YzhhMzMyNWViZTE5Y2Yw; ssid_ucp_v1=1.0.0-KDVjNzI2YTQzOTc2ZjE4N2YzMzViMmQ4NmY0NDAyM2IxMWRlMzNhZWQKFQiCva_l-wEQ6rTe1AYYrw44AkDxBxoCbHEiIDExZDJiZGRiOTcwNDE0YzM4YzhhMzMyNWViZTE5Y2Yw';
  test('懂车视视频发布', async () => {
    const taskData:  DongCheHaoVideoTaskInput = {
      pubType:0,
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\ofyaojgonk4iutdivrbqo.mp4',
        width: 1080,
        height: 1920,
        duration: 12,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      },
      title: '开车的时候，要懂得欣赏风景',
      desc: '<p>风景好了开车也好了</p><p><topic text="搞笑">搞笑</topic></p>',

      // goodsList: [
      //   {
      //     "yixiaoerId": "22588114",
      //     "yixiaoerName": "卫龙 香辣味魔芋爽 180g*1/2/3/4/5/6/7/8/9/24份 散称 休闲小吃 香辣味魔芋爽180g",
      //     "yixiaoerImageUrl": "https://cdn.poizon.com/pro-img/origin-img/20250423/3d79f76821034139a98003cd3eb21aa2.jpeg",
      //     "raw": {
      //       "productId": 22588114,
      //       "propertyId": 692302748,
      //       "title": "卫龙 香辣味魔芋爽 180g*1/2/3/4/5/6/7/8/9/24份 散称 休闲小吃 香辣味魔芋爽180g",
      //       "logoUrl": "https://cdn.poizon.com/pro-img/origin-img/20250423/3d79f76821034139a98003cd3eb21aa2.jpeg"
      //     }
      //   },
      //   {
      //     "yixiaoerId": "7542304",
      //     "yixiaoerName": "麻辣王子 微麻微辣/很麻很辣 网红辣条散装 多规格 湖南特产小零食儿时怀旧休闲食品 很麻很辣360g（18g*20袋）",
      //     "yixiaoerImageUrl": "https://cdn.poizon.com/pro-img/origin-img/20250701/83971dd790aa41d2aee6f7a14b2824a9.png",
      //     "raw": {
      //       "productId": 7542304,
      //       "propertyId": 583914206,
      //       "title": "麻辣王子 微麻微辣/很麻很辣 网红辣条散装 多规格 湖南特产小零食儿时怀旧休闲食品 很麻很辣360g（18g*20袋）",
      //       "logoUrl": "https://cdn.poizon.com/pro-img/origin-img/20250701/83971dd790aa41d2aee6f7a14b2824a9.png"
      //     }
      //   },
      //   {
      //     "yixiaoerId": "32211722",
      //     "yixiaoerName": "比比赞 辣条零食大礼包 288g/包惊喜表白儿童情侣网红追剧手办礼 【10款35包】辣条零食大礼包288g",
      //     "yixiaoerImageUrl": "https://cdn.poizon.com/pro-img/origin-img/20251126/e6a5747962a14aa29d2b8eb8a4f867f2.jpg",
      //     "raw": {
      //       "productId": 32211722,
      //       "propertyId": 932514510,
      //       "title": "比比赞 辣条零食大礼包 288g/包惊喜表白儿童情侣网红追剧手办礼 【10款35包】辣条零食大礼包288g",
      //       "logoUrl": "https://cdn.poizon.com/pro-img/origin-img/20251126/e6a5747962a14aa29d2b8eb8a4f867f2.jpg"
      //     }
      //   },
      //   {
      //     "yixiaoerId": "23074188",
      //     "yixiaoerName": "劲丰食品——健康美味相伴 博士牛筋 50袋/盒 童年怀旧经典甜辣味辣条 50袋（有塑盒）",
      //     "yixiaoerImageUrl": "https://cdn.poizon.com/pro-img/origin-img/20250507/ba046deac8ba4ada92358c41f009eff6.jpg",
      //     "raw": {
      //       "productId": 23074188,
      //       "propertyId": 706218887,
      //       "title": "劲丰食品——健康美味相伴 博士牛筋 50袋/盒 童年怀旧经典甜辣味辣条 50袋（有塑盒）",
      //       "logoUrl": "https://cdn.poizon.com/pro-img/origin-img/20250507/ba046deac8ba4ada92358c41f009eff6.jpg"
      //     }
      //   }
      // ],
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await DongCheHao.publishVideo(cookie, taskData, eventCall);

    console.log('懂车视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);


  test('懂车视图文发布', async () => {
    const taskData:  DongCheHaoDynamicTaskInput = {

      taskId: '13123123',

      images: [{
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      }],

      desc: '风景好了开车也好了',

      // goodsList: [
      //   {
      //     "yixiaoerId": "22588114",
      //     "yixiaoerName": "卫龙 香辣味魔芋爽 180g*1/2/3/4/5/6/7/8/9/24份 散称 休闲小吃 香辣味魔芋爽180g",
      //     "yixiaoerImageUrl": "https://cdn.poizon.com/pro-img/origin-img/20250423/3d79f76821034139a98003cd3eb21aa2.jpeg",
      //     "raw": {
      //       "productId": 22588114,
      //       "propertyId": 692302748,
      //       "title": "卫龙 香辣味魔芋爽 180g*1/2/3/4/5/6/7/8/9/24份 散称 休闲小吃 香辣味魔芋爽180g",
      //       "logoUrl": "https://cdn.poizon.com/pro-img/origin-img/20250423/3d79f76821034139a98003cd3eb21aa2.jpeg"
      //     }
      //   },
      //   {
      //     "yixiaoerId": "7542304",
      //     "yixiaoerName": "麻辣王子 微麻微辣/很麻很辣 网红辣条散装 多规格 湖南特产小零食儿时怀旧休闲食品 很麻很辣360g（18g*20袋）",
      //     "yixiaoerImageUrl": "https://cdn.poizon.com/pro-img/origin-img/20250701/83971dd790aa41d2aee6f7a14b2824a9.png",
      //     "raw": {
      //       "productId": 7542304,
      //       "propertyId": 583914206,
      //       "title": "麻辣王子 微麻微辣/很麻很辣 网红辣条散装 多规格 湖南特产小零食儿时怀旧休闲食品 很麻很辣360g（18g*20袋）",
      //       "logoUrl": "https://cdn.poizon.com/pro-img/origin-img/20250701/83971dd790aa41d2aee6f7a14b2824a9.png"
      //     }
      //   },
      //   {
      //     "yixiaoerId": "32211722",
      //     "yixiaoerName": "比比赞 辣条零食大礼包 288g/包惊喜表白儿童情侣网红追剧手办礼 【10款35包】辣条零食大礼包288g",
      //     "yixiaoerImageUrl": "https://cdn.poizon.com/pro-img/origin-img/20251126/e6a5747962a14aa29d2b8eb8a4f867f2.jpg",
      //     "raw": {
      //       "productId": 32211722,
      //       "propertyId": 932514510,
      //       "title": "比比赞 辣条零食大礼包 288g/包惊喜表白儿童情侣网红追剧手办礼 【10款35包】辣条零食大礼包288g",
      //       "logoUrl": "https://cdn.poizon.com/pro-img/origin-img/20251126/e6a5747962a14aa29d2b8eb8a4f867f2.jpg"
      //     }
      //   },
      //   {
      //     "yixiaoerId": "23074188",
      //     "yixiaoerName": "劲丰食品——健康美味相伴 博士牛筋 50袋/盒 童年怀旧经典甜辣味辣条 50袋（有塑盒）",
      //     "yixiaoerImageUrl": "https://cdn.poizon.com/pro-img/origin-img/20250507/ba046deac8ba4ada92358c41f009eff6.jpg",
      //     "raw": {
      //       "productId": 23074188,
      //       "propertyId": 706218887,
      //       "title": "劲丰食品——健康美味相伴 博士牛筋 50袋/盒 童年怀旧经典甜辣味辣条 50袋（有塑盒）",
      //       "logoUrl": "https://cdn.poizon.com/pro-img/origin-img/20250507/ba046deac8ba4ada92358c41f009eff6.jpg"
      //     }
      //   }
      // ],
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await DongCheHao.publishDynamic(cookie, taskData, eventCall);

    console.log('懂车视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);


});
