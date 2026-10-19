import { describe, expect, test } from 'vitest';
import { Duoduoshipin, Tengxunshipin } from '../../../src';
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
    'aliyungf_tc=87ee72d18ec7f1fd824486754379f5ea3c4be5cc18a9e84d169699391bc8e773; sk=9U8pQx1UyniD5x0NzNyyk9UwTSnxRBIUtXa2cHOAM8PetrFqz6a4iplpTyzK5Ok94t40gBc2I9fOyTZyrkXcoZo1zh20; dwsm=2026081908505863c70e03a79047b2f72f95340e5a5d2f91c0a7c22938d7fd; sajssdk_2015_cross_new_user=1; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%221a0177ff995211-078409d52862538-68346760-1227387-1a0177ff996beb%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMWEwMTc3ZmY5OTUyMTEtMDc4NDA5ZDUyODYyNTM4LTY4MzQ2NzYwLTEyMjczODctMWEwMTc3ZmY5OTZiZWIifQ%3D%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%22%2C%22value%22%3A%22%22%7D%2C%22%24device_id%22%3A%221a0177ff995211-078409d52862538-68346760-1227387-1a0177ff996beb%22%7D; dewu_creator_x-auth-token=Bearer%20eyJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3ODcxMDA2NzgsImV4cCI6MTgxODYzNjY3OCwidXNlcklkIjoyNjUxNDg2MTEzLCJpc0d1ZXN0IjpmYWxzZSwiU0siOiIifQ.N_DXHKJQRsRd6CI6tSxkbidFfS8RctvqtS2NAxiLBdqJ8asm_YG0v6y_1ApttTVWj2piw63IyAsINPyyemSY5Ny3h875DVEKYiljDM4RY4LSC2gg2QX612Vx-_bDHqIJdBx1QdaWFMwrqD_Gxvo8wFybA7E9u8NBWVn6UtCqRDM_jCdoY1BKzcxYmRWKoUTeSckH-oAiAXVynteXiO7qah87mE_6BvvKhocM5VNinRRoxIE7adGLyF9HXT_qzEqwv4BZx54Zanz607qc9LXHt1tCkJ1i1pQokmoky_Ygi9W1yiB8yEAHdMRX2O-WLQ2kji_YV4ZEg3gKfUFK0HraqQ; dewu_creator_duToken=4e822f3eb28489f03700ba79edae6bb1fd70ca259bf17d6922cea40526ff4a4ceb09aa824a4094de924f650449d3a47c|2651486113|1787100678|6118fe773da67e96234cf83ef02f1d144bba2b9b|2-0; dewu_creator_userInfo={%22userId%22:2651486113%2C%22userName%22:%22%E5%BE%97%E7%89%A9er-X8E4W8F7%22%2C%22icon%22:%22https://qiniu.dewucdn.com/FopKJAJnH2BCZ5M2MId0OmBVkvdp%22%2C%22sex%22:0%2C%22idiograph%22:%22%22%2C%22formatTime%22:%222025.08.27%22%2C%22banned%22:0%2C%22vip%22:0%2C%22amount%22:0%2C%22amountSign%22:%22b37e38060e294be96da74a3e6889f02e%22%2C%22isOlder%22:1%2C%22isQuestionExpert%22:0%2C%22isAdmin%22:0%2C%22isBindMobile%22:1%2C%22isComplete%22:1%2C%22joinDays%22:357%2C%22isReadProtocol%22:0%2C%22isCertify%22:0%2C%22mobile%22:%22138****3847%22%2C%22addTime%22:1756279105%2C%22mobileMd5%22:%220dd24acf81e02659a665cc55ff426228%22%2C%22account%22:%22%22%2C%22accountType%22:0}; dewu_creator_xdwMark=2651486113';
  test('得物视视频发布', async () => {
    const taskData: DeWuVideoTaskInput = {
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
      visibleType: 1,
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
    const result = await DeWu.publishVideo(cookie, taskData, eventCall);

    console.log('得物视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('得物视频视频删除', async () => {
    const result = await DeWu.deleteDeWuContent(cookie, '519577278');

    console.log('得物视频视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('得物视频状态', async () => {
    const result = await DeWu.getDeWuMediaStatus(cookie, '519577278');

    console.log('得物视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('得物视频地点', async () => {
    const result = await DeWu.getDeWuLocation(cookie, '天府广场');

    console.log('得物视频地点：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('得物视频话题', async () => {
    const result = await DeWu.getDeWuTopics(cookie, '搞笑');

    console.log('得物视频话题：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
