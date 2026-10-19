import { describe, expect, test } from 'vitest';
import { Baijiahao, BaijiahaoVideoTaskInput } from '../../../src/media-platform';
import { EventEmitter } from 'events';
import { BaijiahaoMiniVideoTaskInput } from '../../../src/media-platform/baijiahao/baijiahao-mini-video';
import { QueryWorker } from '../../../src/cloud/task/taskService';
import { Cloud, Platforms } from '../../../src';
import { convertCookieStr, Task } from '../../../src/utils';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';

describe.runIf(false)('【真实测试】', () => {
  test('百家号用户', async () => {
    const cookie = '';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    const result = await Baijiahao.getBaijiahaoUserInfo(cookie);
    // assets
    console.log('百家号用户：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('百家号视频合集', async () => {
    const cookie =
      'RECENT_LOGIN=0; XFT=zzR1+k24FH6J1CmlQ/09XkaDVjeS9L0ZCeJQm6xz9Xs=; XFI=112b6a40-0634-11f1-895c-6f096aa7059a; XFCS=116101876C6AFE2D01947E5C8068BF63CF97BEFF65C7A7CE783352568F855BA7; PHPSESSID=slu0dgi3q5c385nvnig8v5bl42; theme=bjh; BAIDUID=3DE14BB6E0773482F60D3D43C96F04CC:FG=1; BAIDUID_BFESS=3DE14BB6E0773482F60D3D43C96F04CC:FG=1; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW+ioTSKU4nQaaWWJj1AnjrL+sma/I9in8l5AhdP95hxKdnTNS/pLMWceus0e757/UP9wfDgkA/VfIUQpG5Qx8UEAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; BDUSS=hFcEhMbVk4Q1ZaTmxNMmg3ZklQajE5cno1NjA2dU01ME9aQUVCV3lmVG41Nk5wRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOdafGnnWnxpc3; BDUSS_BFESS=hFcEhMbVk4Q1ZaTmxNMmg3ZklQajE5cno1NjA2dU01ME9aQUVCV3lmVG41Nk5wRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOdafGnnWnxpc3; RECENT_LOGIN=1; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1769757418; HMACCOUNT=19151292D61C76A7; __bid_n=19c0dc325430144842e5dd; devStoken=897679ae7ed0752072068a0ddf4ea6c5d4acb5d62882bd87e0dbc2182f3c290f; bjhStoken=178481db7eb248d7054dcabdfa77d39dd4acb5d62882bd87e0dbc2182f3c290f; RT=\\"z=1&dm=baidu.com&si=0d0cc64e-1d14-46d8-b6a0-1fed8ad431b6&ss=ml5zz3vl&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf\\"; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1770695756';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    const result = await Baijiahao.getBaijiahaoCollection(cookie);
    // assets
    console.log('百家号合集：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});


describe.runIf(true)('【真实测试】', () => {
  test('百家号话题', async () => {
    const cookie =
      'HMACCOUNT=29EC4928DB854067; PHPSESSID=3ccnp1632gk9pe2md14s7fjrs0; theme=bjh; BAIDUID=D3A7F04E176E2DD51754EF8E481F367A:FG=1; BAIDUID_BFESS=D3A7F04E176E2DD51754EF8E481F367A:FG=1; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW8zx/dTuDRscIVpH2fjlwVbIzQ0EMGc2V76+HMIyS32dNnTNS/pLMWceus0e757/UN4TgYygGbW8O5KoEwDuFmXAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; BDUSS=zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN; BDUSS_BFESS=zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN; RECENT_LOGIN=1; __bid_n=19d29ab268974565dd302d; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1776076276; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1776933922; devStoken=156b03b08c5ba216007ffffe7d3d3f1cb4640eb63b0448146bffab5962b18cb3; bjhStoken=d85b0de93a90bb9f89a30b33a052ac36b4640eb63b0448146bffab5962b18cb3; ab_sr=1.0.1_MGE4NTM5YWM3NDVmZTE1MTZlZGY2M2Q0MmU2NDA3MTc0NjMxMjEyNmM5ZTVlMzhmMzdmZDgzYjFmYTM1ZDUwOTNkYzM0NmI5NjZlZTUzN2U2M2UyYTExZWNkYzk0NzkyZmQ4NTcwMDE0YmJmOTczYjlhZDBjMWY1NWNkYTk0ZTJkNDhhNDY0ZjU2YWViNDVhYzdiZTU4YTJiNWY2YWM5MDAwMTA3ODcxODE2YmViYjdlMGFjZjk1ZjdiMTVhZGU5; RT="z=1&dm=baidu.com&si=6a05d8f7-d934-47b9-911e-0be97bf2e974&ss=mob8kqsd&sl=9&tt=czx&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=1oms"';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    const result = await Baijiahao.getBaijiahaoTopicList(cookie, '搞笑', '');
    // assets
    console.log('百家号话题：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
describe.runIf(true)('【真实测试发布】', () => {
  test('百家号横版视频发布', async () => {
    const cookie =
      convertCookieStr('RECENT_LOGIN=0; XFI=b8e1fc10-6546-11f1-9161-e986cda388c2; XFCS=520A4007C55904C63B6BE5D8A10380CA5FAC796276CB19665E473B2AA2CB40FE; XFT=m7s6OJsLd58wQn0i+a16S9NTTtEmzJgRH5q17/xqClQ=; HMACCOUNT=29EC4928DB854067; PHPSESSID=3ccnp1632gk9pe2md14s7fjrs0; theme=bjh; BAIDUID=D3A7F04E176E2DD51754EF8E481F367A:FG=1; BAIDUID_BFESS=D3A7F04E176E2DD51754EF8E481F367A:FG=1; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW8zx/dTuDRscIVpH2fjlwVbIzQ0EMGc2V76+HMIyS32dNnTNS/pLMWceus0e757/UN4TgYygGbW8O5KoEwDuFmXAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; BDUSS=zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN; BDUSS_BFESS=zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN; RECENT_LOGIN=1; __bid_n=19d29ab268974565dd302d; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1778673028; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1781148981; devStoken=156b03b08c5ba216007ffffe7d3d3f1ce73d72b4c26fe409a344c99670d841b7; bjhStoken=d85b0de93a90bb9f89a30b33a052ac36e73d72b4c26fe409a344c99670d841b7; RT="z=1&dm=baidu.com&si=643faf9b-2702-439b-9f5e-ff4677decb7e&ss=mq8y45bq&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=de&ul=5dij2"');

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    //const publishTokenResult = await getBaijiahaoPublishArticleToken(cookie, tokenResult.token);

    const taskData: BaijiahaoVideoTaskInput = {
      pubType: 0,
      taskId: '1717809227264909312',
      //publishTime:new Date('2026-6-1').getTime(),
      cover: {
        pathOrUrl: 'I:\\download\\heng.jpg',
        width: 4096,
        height: 1888,
      },

      verticalCover: {
        pathOrUrl: 'I:\\download\\shu.jpg',
        width: 4096,
        height: 1888,
      },
      statementType:1,
      statementSubType:1,
      //话题
      // topic: {
      //   category: '3',
      //   guide: '',
      //   id: '693',
      //   link: {
      //     scheme:
      //       'baiduboxapp://v1/browser/open?url=https%3A%2F%2Fm.baidu.com%2Fs%3Fword%3D%2523%25E6%2590%259E%25E7%25AC%2591%2523%26topic_id%3D693%26sfrom%3D1023524a%26sa%3Dtheme_list&append=1&newwindow=0&upgrade=1',
      //     url: 'https://m.baidu.com/s?word=%23%E6%90%9E%E7%AC%91%23&topic_id=693&sfrom=1023524a&sa=theme_list&append=1&newwindow=0&upgrade=1',
      //   },
      //   sv_small_images: {
      //     height: '180',
      //     https: 'https://b.bdstatic.com/2b68affd6b5fe453a9db4cc8202096c3.png@w_180',
      //     wide: '180',
      //   },
      //   title: '搞笑',
      // },
      // 标题
      title: '',

      //描述
      desc: '<p>春天的美景<topic text="黑暗收割啊四大皆空啊手动"></topic>小丁丁真好！，来吧</p>',

      video: {
        localPath: 'I:\\download\\询问图片内容.mp4',
        duration: 100,
        width: 1080,
        height: 720,
      },
      //绑定爱奇艺

      //ai申明
      isAigc: false,

      //一级分类
      // categoryName: '旅游',
      // //二级分类
      // subCategoryName: '旅拍体验',
      // proxy: {
      //   serverAdd: 'd393.kdltpspro.com',
      //   serverPort: 15818,
      //   type: 'kuaidaili',
      //   userName: 't13552986932913',
      //   password: '2mbl9d6n',
      //   area: '',
      //   province: '11',
      // },
      //打赏
      // reward: true,
      //活动
      // activityId: '1596550',
      //地点
      // location: {
      //   addr: '四川省成都市锦江区人民南路一段86号',
      //   area: 631,
      //   area_name: '成都市青羊区',
      //   biz_type: 0,
      //
      //   catalogID: 975,
      //   city_id: 75,
      //   city_name: '成都市',
      //   cla: [],
      //   class_similar_score: 0,
      //   click_flag: 0,
      //   detail: 1,
      //   diPointX: 1158541545,
      //   diPointY: 356713388,
      //   di_tag: '休闲娱乐 休闲广场',
      //   dis: -1,
      //   dist2route: 0,
      //   dist2start: 0,
      //   ernie_score: 0,
      //
      //   ext_type: 4,
      //   f_flag: 1041,
      //   father_son: 0,
      //   flag_type: '64',
      //   geo: '.=pDfDFBsOwQVA;',
      //   geo_type: 0,
      //   history_address: '成都市',
      //   hit_tag_press: 0,
      //   is_top_nat: 0,
      //
      //   name: '天府广场',
      //   navi_update_time: 1705905758,
      //   navi_x: '11585251.2597',
      //   navi_y: '3567128.4994',
      //   new_catalog_id: '090000',
      //
      //   poiType: 0,
      //   poi_click_num: 0,
      //   poi_profile: 1,
      //   primary_uid: '17670589517058277375',
      //   query_guide:
      //     '[{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/service\\/search\\/default\\/meishi5.png","text":"美食","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/jiudian.png","text":"酒店","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/jingdian.png","text":"景点","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/tingchechang.png","text":"停车场","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/xiuxianyule.png","text":"休闲娱乐","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/service\\/search\\/default\\/gouwu5.png","text":"购物","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/jiayou.png","text":"加油站","type":1}]',
      //   route_flag: 0,
      //
      //   status: 1,
      //   std_tag: '休闲娱乐;休闲广场',
      //   std_tag_id: '1611',
      //   storage_src: 'api',
      //   street_id: '8fde79cc5e5af9c295ca0773',
      //   tag: '',
      //
      //   ty: 0,
      //   uid: '8fde79cc5e5af9c295ca0773',
      //   view_type: 0,
      //   x: 1158541545,
      //   y: 356713388,
      // },
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Baijiahao.publishVideo(cookie, taskData, eventCall, 0, '');
    // assets
    console.log('百家号横版发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试123】', () => {
  test('百家号竖版视频发布123', async () => {
    const cookie =
      'BAIDUID=9427726D4E9EFD3472B50495FAC3E67E:FG=1; BAIDUID_BFESS=9427726D4E9EFD3472B50495FAC3E67E:FG=1; theme=bjh; BDUSS=JJZUZxOEdUS2N6cXZJZ1VvVE02MjlvQ3VEZjZGcFVWeFBsRW4xc0xFbkIyd3huSVFBQUFBJCQAAAAAAQAAAAEAAABjqC6QYmFpbG05MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMFO5WbBTuVmeT; BDUSS_BFESS=JJZUZxOEdUS2N6cXZJZ1VvVE02MjlvQ3VEZjZGcFVWeFBsRW4xc0xFbkIyd3huSVFBQUFBJCQAAAAAAQAAAAEAAABjqC6QYmFpbG05MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMFO5WbBTuVmeT; gray=1; canary=0; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1726304774; __bid_n=191efc8af611376aa2dead; gray=1; canary=0; Hm_lvt_192fa266ff34772c28e4ddb36b8f4472=1726646716; PHPSESSID=rgvac6sh00rib11p9calrn5p92; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2GrfqL8c87KLF2qFER3obJGnRPnrAdRzWz2cXL9q+Icxy62NM9rQl32fbT+RbwRjup+ti94/aebzvoussIeRnUjtzIjHOnOGa8i/l/a9lVobUgBeDYo8KLDU0xizGJwTxUyfwtni0mdUwRRGfgzdOTP3SD3rH8JOudPxJORNS7SCt6rEeCerZiOC2HS/q3kWYbpA5RdGpipmODqHTwPvOqFLOQHvyhUQrrHDS6OPGdMUX5FnJNp5c2Cvgs1aHt7uhfUHv1DxZiH330Apc6oKkZo0Y6IJXad8xN1gQMZ1tOmckSecr9yhMSRLVoFktEC1isCFVEb2vLTz1FUxxmfkDHVYFMb7+JFWxNGoA0JNiv6hCb0gkXpkEpISi6tVHh+hsQifjACGGz0MbLI9AAutvQNmLovQE8DrrUkOPSWZkiBwIUvxonSGS2lgiNZBxgK/Nad6P3sfvyvYhyXNwxm6SzH+Oja1l6cy9uoP7y446ILa1CLEOaV1jDkGoksNhRtn7B81CemkusdgER6aaUV34R4eGWiTUlCqdbf8oGHYcombWYX5RweDqStPwMzdS8AT76ygViv7lnF4xrYkhgSKNlMQwPkP86GfIbGCquGAObJfCou294/nZR7mpfc0ZPaB61buGGK/Nqbydyy5VRMY9E3z0CFai2ttXKypq/Loo0JrnLa7elPNSWU9pSPwamQJULfVlddlyjf2DSNdFaksc04YpQi9Awgg8unrypyhixqbwVqksZ1okMqQxKIZFYz8tMzZDiNeQT9xKCyi5pIFMa30nZL4/01GYZeql7Qjzv5qan7KSdu/hwDrm5vVP9Uw6tEtNjDznQmW+r3/wA4+ylTnWEx+WDzOjUGRWIcQYNHqw3oxcimP1vQ6HC8rDNEx2ov8eWtxPkJGqOFtWjIVteQYMsH/AaSJonqw+WLiZvGjYfm9p0alEyujapoTy77HzDcUoU1wUSXa5xS/Z6hXEr2OnLi0LdPVcGjz8lpLcdVeSfm9p0alEyujapoTy77HzDWf5PERRSTFqLd9BTUHLyY4Ji3EQLGQPaM1aeHxG1bJZH0s1Si/KwzTaTYzu6ziQiqwcr2kaYUiH+fMOxn69/BhNJVMhpQkhprc1KZuJRvXjppq0gKweencPxgS/jd0rjw==; HMACCOUNT=28ADE2CA61760143; RECENT_LOGIN=0; SECKEY_ABVK=wMcPPUiQRM3xB7+/dxpcsE9B7g6vJZ/V0WtI2kLfcGs%3D; BMAP_SECKEY=wMcPPUiQRM3xB7-_dxpcsOy82SIvmoBlTZTDQ-5toQMc8WvT6_-ogFQrT3nBHZhUzTnpFu-3PJw5DC6g6_nn8KaymUC0_J4aFdzT8oowRe5A864cZr8-EnelDVRTolKrLstBJ5NOJWaUA5O205ra77GLQDqPOdvnsnnDr1apjTk034Tto7sDi9-o73UDXABa; XFI=09a94d20-7592-11ef-b4e0-ad9210d3a823; openTabIndex=tab_hot_quest; XFCS=FE595F12A6EBDAF024B5B9215A00AA1D8CAEAF6A5A9AC17F7F947445A58C54EF; XFT=ghH9RRPwWuavKa4OwSSxsNtU3QXsGUfOk8KiI6G6/FU=; Hm_lpvt_192fa266ff34772c28e4ddb36b8f4472=1726653628; XFI=0ef51af0-7620-11ef-b052-e326cad3fc00; XFCS=430D790CF06B882DF635C2FF5A310E80289C153D2AC31D70402B5909419EB502; XFT=C5scJcbL1tfmvVaHEzmWy8pJRXVjwdz4l6FKL/yqPXw=; SECKEY_ABVK=wMcPPUiQRM3xB7+/dxpcsEnhNjwZtVUnjP/mrtrZWY8%3D; BMAP_SECKEY=wMcPPUiQRM3xB7-_dxpcsI0HnDEE7lmVgOQFBO-sGS9IQvlSltXW0_cQiAV_QP9a_iCaM57wrkhiI2kTO7qtFFU97rgbeqSJY6JYX-y6-9ffH4xpvRATcYzdrQqEriFI-FlljjQFU0xrWXXv25qzZ-lT8mGuKTIdW21oI81XH9HhfcGVxvzyrBR1w2uJ6t8_; openTabIndex=tab_hot_quest; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1726708861; RT="z=1&dm=baidu.com&si=2bb08276-7281-4647-917f-3efa9c7948bb&ss=m17k6jxn&sl=5d&tt=7re4&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf"; devStoken=4bcf85b1eb8e8b069d3d1c14f219fd104cc6c909ddbb576f5839bc8b9495d7f2; bjhStoken=87759c340b23f12d9669f27fc4adc6ce4cc6c909ddbb576f5839bc8b9495d7f2; ab_sr=1.0.1_NTc3MTJhOTRhZjU2OThmYjFkZWE2N2IyY2Q5ZDNmYTkzMDJiZmMzZjY1MzdhZmI2YzkyNjU1NjQ1ZjU3MTQ0Mzk3M2QyZTRjN2MyY2MxZTYzNDM3NzA0NDBjODJjYThmNDU3ODI4MTA5ZTkwNDRjMjlhNjE2MzRhYzA5NDIwZDQxNzljOTJmYzJmMzcyNzFmMzJmOTlmMmQzOWFhODYzNmU3NDE5MTcxMGE3MDRiMDg4ZTZhMTQ0YzhkMmU1MWI5';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    //const publishTokenResult = await getBaijiahaoPublishArticleToken(cookie, tokenResult.token);

    const taskData: BaijiahaoMiniVideoTaskInput = {
      pubType: 1,
      taskId: '',
      video: {
        duration: 20.287,
        width: 1080,
        height: 1920,
        size: 14593252,
        localPath: 'Z:\\系统默认下载位置\\20240716-164059.mp4',
      },
      cover: {
        width: 1080,
        height: 1920,
        size: 214776,
        pathOrUrl:
          'C:\\Users\\Administrator\\AppData\\Local\\Temp\\yixiaoer\\image\\fc0ea101-3399-44fa-9a34-b1076d9d942b.jpg',
      },
      verticalCover: {
        width: 1080,
        height: 1920,
        size: 214776,
        pathOrUrl:
          'C:\\Users\\Administrator\\AppData\\Local\\Temp\\yixiaoer\\image\\fc0ea101-3399-44fa-9a34-b1076d9d942b.jpg',
      },
      title: '天气看起来很好',
      tags: [],
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    //1788852745561383383 publishId
    const result = await Baijiahao.publishMiniVideo(cookie, taskData, eventCall, 0, '');
    // assets
    console.log('百家号竖版发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
describe.runIf(false)('【真实测试地点】', () => {
  test('百家号地点', async () => {
    const cookie =
      'BAIDUID=F215B7264D2B1226A45DBAB09D3DF4C5:FG=1; BAIDUID_BFESS=F215B7264D2B1226A45DBAB09D3DF4C5:FG=1; theme=bjh; BDUSS=ZpeEU0WWx1NUFFSH42S08tOEg5RU9JRnFGcEFCWXBlZDZMNzRZfk1WWmVZN0psSVFBQUFBJCQAAAAAAAAAAAEAAAAl-JdDcGl0YXlhOTIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF7WimVe1oplME; BDUSS_BFESS=ZpeEU0WWx1NUFFSH42S08tOEg5RU9JRnFGcEFCWXBlZDZMNzRZfk1WWmVZN0psSVFBQUFBJCQAAAAAAAAAAAEAAAAl-JdDcGl0YXlhOTIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF7WimVe1oplME; gray=1; canary=0; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1703597665; gray=1; canary=0; __bid_n=18cc8eaf69e74567371231; SECKEY_ABVK=+2QQrjHWvJ7mr67TQouqVMi+0TeYNA0VbFxWFCzyeHE%3D; BMAP_SECKEY=-2QQrjHWvJ7mr67TQouqVATRe3HJvcliBF9XEpQs2jMbt4R_xN--s331eofzDV6-PYxD2MxE9imhkQr3R9bs8tix3xdltPl-lsvCsC38Cx3waVaWvBEVvOpyL-FbyfRofWg69wKXt0ihKBwdE7JO2VqebQ1Un2jg2czBuPkhxiXWRunBDGDIYGn-I0-iE1H5; PHPSESSID=06rh7vqo73ssebpjkrk8qo66n0; RECENT_LOGIN=0; XFT=RZfhll3EigyWV6EMxRJdJ7rqFpN1eIoQzDyUhPXlT4I=; openTabIndex=tab_hot_quest; SECKEY_ABVK=+2QQrjHWvJ7mr67TQouqVMi+0TeYNA0VbFxWFCzyeHE%3D; BMAP_SECKEY=-2QQrjHWvJ7mr67TQouqVATRe3HJvcliBF9XEpQs2jMbt4R_xN--s331eofzDV6-PYxD2MxE9imhkQr3R9bs8tix3xdltPl-lsvCsC38Cx3waVaWvBEVvOpyL-FbyfRofWg69wKXt0ihKBwdE7JO2VqebQ1Un2jg2czBuPkhxiXWRunBDGDIYGn-I0-iE1H5; XFI=86cfd200-b464-11ee-8485-415e6cc233e6; XFCS=4D3E2E7A33631EE42D12C40734A0DA550D94D70E15668033D22C1B56C8D93F38; XFI=97058b70-b8d2-11ee-992a-5d7b2db4ed07; XFCS=E07B542165188C61CA5005C06E349550BE5973A269C1B9D8766D747C4514260D; XFT=22dLuvXNGFRRLZuoyUaTUoYVvHJQNaUqHfkrlcgKvrk=; openTabIndex=tab_top1; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1705892712; devStoken=2a4f78091377321a452266f8701d8350d06a3e89622c0879e1b37a7b30727951; bjhStoken=69b586798e67f99e53420d507a033a83d06a3e89622c0879e1b37a7b30727951; RT=\\"z=1&dm=baidu.com&si=f54c9bec-319f-484f-8e9a-a9d7f8a13b2f&ss=lroi2t7i&sl=6&tt=lth&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=107p\\"';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    const result = await Baijiahao.getBaijiahaoLocationList(cookie, '天府广场', 0);
    // assets
    console.log('百家号地点：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试分类】', () => {
  test('百家号分类', async () => {
    const cookie =
      'RECENT_LOGIN=0; XFT=zzR1+k24FH6J1CmlQ/09XkaDVjeS9L0ZCeJQm6xz9Xs=; XFI=112b6a40-0634-11f1-895c-6f096aa7059a; XFCS=116101876C6AFE2D01947E5C8068BF63CF97BEFF65C7A7CE783352568F855BA7; PHPSESSID=slu0dgi3q5c385nvnig8v5bl42; theme=bjh; BAIDUID=3DE14BB6E0773482F60D3D43C96F04CC:FG=1; BAIDUID_BFESS=3DE14BB6E0773482F60D3D43C96F04CC:FG=1; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW+ioTSKU4nQaaWWJj1AnjrL+sma/I9in8l5AhdP95hxKdnTNS/pLMWceus0e757/UP9wfDgkA/VfIUQpG5Qx8UEAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; BDUSS=hFcEhMbVk4Q1ZaTmxNMmg3ZklQajE5cno1NjA2dU01ME9aQUVCV3lmVG41Nk5wRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOdafGnnWnxpc3; BDUSS_BFESS=hFcEhMbVk4Q1ZaTmxNMmg3ZklQajE5cno1NjA2dU01ME9aQUVCV3lmVG41Nk5wRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOdafGnnWnxpc3; RECENT_LOGIN=1; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1769757418; HMACCOUNT=19151292D61C76A7; __bid_n=19c0dc325430144842e5dd; devStoken=897679ae7ed0752072068a0ddf4ea6c5d4acb5d62882bd87e0dbc2182f3c290f; bjhStoken=178481db7eb248d7054dcabdfa77d39dd4acb5d62882bd87e0dbc2182f3c290f; RT=\\"z=1&dm=baidu.com&si=0d0cc64e-1d14-46d8-b6a0-1fed8ad431b6&ss=ml5zz3vl&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf\\"; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1770695756';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);
    const re1 = await new QueryWorker('', Platforms.BaiJiaHao, { cookie: cookie }).getPublishCatergory(
      PubContentEnum.article,
    );
    const result = await Baijiahao.getBaijiahaoCategoryList(cookie, 'videoV2');
    // assets
    console.log('百家号分类：', JSON.stringify(re1, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试活动】', () => {
  test('百家号活动', async () => {
    const cookie =
      'BAIDUID=F215B7264D2B1226A45DBAB09D3DF4C5:FG=1; BAIDUID_BFESS=F215B7264D2B1226A45DBAB09D3DF4C5:FG=1; theme=bjh; BDUSS=ZpeEU0WWx1NUFFSH42S08tOEg5RU9JRnFGcEFCWXBlZDZMNzRZfk1WWmVZN0psSVFBQUFBJCQAAAAAAAAAAAEAAAAl-JdDcGl0YXlhOTIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF7WimVe1oplME; BDUSS_BFESS=ZpeEU0WWx1NUFFSH42S08tOEg5RU9JRnFGcEFCWXBlZDZMNzRZfk1WWmVZN0psSVFBQUFBJCQAAAAAAAAAAAEAAAAl-JdDcGl0YXlhOTIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF7WimVe1oplME; gray=1; canary=0; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1703597665; gray=1; canary=0; __bid_n=18cc8eaf69e74567371231; SECKEY_ABVK=+2QQrjHWvJ7mr67TQouqVMi+0TeYNA0VbFxWFCzyeHE%3D; BMAP_SECKEY=-2QQrjHWvJ7mr67TQouqVATRe3HJvcliBF9XEpQs2jMbt4R_xN--s331eofzDV6-PYxD2MxE9imhkQr3R9bs8tix3xdltPl-lsvCsC38Cx3waVaWvBEVvOpyL-FbyfRofWg69wKXt0ihKBwdE7JO2VqebQ1Un2jg2czBuPkhxiXWRunBDGDIYGn-I0-iE1H5; PHPSESSID=06rh7vqo73ssebpjkrk8qo66n0; RECENT_LOGIN=0; XFT=RZfhll3EigyWV6EMxRJdJ7rqFpN1eIoQzDyUhPXlT4I=; openTabIndex=tab_hot_quest; SECKEY_ABVK=+2QQrjHWvJ7mr67TQouqVMi+0TeYNA0VbFxWFCzyeHE%3D; BMAP_SECKEY=-2QQrjHWvJ7mr67TQouqVATRe3HJvcliBF9XEpQs2jMbt4R_xN--s331eofzDV6-PYxD2MxE9imhkQr3R9bs8tix3xdltPl-lsvCsC38Cx3waVaWvBEVvOpyL-FbyfRofWg69wKXt0ihKBwdE7JO2VqebQ1Un2jg2czBuPkhxiXWRunBDGDIYGn-I0-iE1H5; XFI=86cfd200-b464-11ee-8485-415e6cc233e6; XFCS=4D3E2E7A33631EE42D12C40734A0DA550D94D70E15668033D22C1B56C8D93F38; XFI=97058b70-b8d2-11ee-992a-5d7b2db4ed07; XFCS=E07B542165188C61CA5005C06E349550BE5973A269C1B9D8766D747C4514260D; XFT=22dLuvXNGFRRLZuoyUaTUoYVvHJQNaUqHfkrlcgKvrk=; openTabIndex=tab_top1; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1705892712; devStoken=2a4f78091377321a452266f8701d8350d06a3e89622c0879e1b37a7b30727951; bjhStoken=69b586798e67f99e53420d507a033a83d06a3e89622c0879e1b37a7b30727951; RT=\\"z=1&dm=baidu.com&si=f54c9bec-319f-484f-8e9a-a9d7f8a13b2f&ss=lroi2t7i&sl=6&tt=lth&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=107p\\"';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    const result = await Baijiahao.getBaijiahaoActivityList(cookie, 'video');
    // assets
    console.log('百家号活动：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
//article_id=1788247234369972362
describe.runIf(true)('【真实测试横版状态】', () => {
  test('百家号横版状态', async () => {
    const cookie =
      convertCookieStr('[{"name":"XFI","value":"4d415390-1de1-11f1-a37d-67bb29365080","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"3579753DDC90708EA5C0B9249EE82072421B44C29037C876642E08E1B2977888","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"zhmxcNwgCGyUZ2p1MFnlJuj+4x0XMRT1UguPaCmI+SQ=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"RECENT_LOGIN","value":"0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFI","value":"696ea060-4b84-11f1-b9f2-a79701719dab","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"oLxGttJuGphJwUK1vMPQWVYXWNzAdbsRUqSKZD3qsXA=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"DBBF0315E4262D35E7BF2721F4345A64C81CB2072717521A6E302C551F87D2CA","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"29EC4928DB854067","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"PHPSESSID","value":"3ccnp1632gk9pe2md14s7fjrs0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"theme","value":"bjh","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1804834890,"sameSite":"unspecified"},{"name":"BAIDUID","value":"D3A7F04E176E2DD51754EF8E481F367A:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1804834890.399723,"sameSite":"unspecified"},{"name":"BAIDUID_BFESS","value":"D3A7F04E176E2DD51754EF8E481F367A:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1804834890.399802,"sameSite":"no_restriction"},{"name":"ppfuid","value":"FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW8zx/dTuDRscIVpH2fjlwVbIzQ0EMGc2V76+HMIyS32dNnTNS/pLMWceus0e757/UN4TgYygGbW8O5KoEwDuFmXAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HOSUPPORT","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858892.432768,"sameSite":"unspecified"},{"name":"HOSUPPORT_BFESS","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858892.432869,"sameSite":"no_restriction"},{"name":"XFS","value":"IPTrzfa0q%2BOFYxsZRK8Z0N0IA1%2BSc0vD6elu3dszO9Y%3D","domain":"xlab.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"UBI","value":"fi_PncwhpxZ%7ETaJc58Ok2WQB-pKGbagbZP1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858912.291754,"sameSite":"unspecified"},{"name":"STOKEN","value":"ad512ef5c93e573b783b9ebc1645c3255a30eeca0752af103767bb721ec7564e","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291794,"sameSite":"unspecified"},{"name":"BDUSS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858912.291817,"sameSite":"unspecified"},{"name":"PTOKEN","value":"3765e98ba460da4cba9f398cb6761bac","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291843,"sameSite":"unspecified"},{"name":"BDUSS_BFESS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291863,"sameSite":"no_restriction"},{"name":"STOKEN_BFESS","value":"ad512ef5c93e573b783b9ebc1645c3255a30eeca0752af103767bb721ec7564e","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291888,"sameSite":"no_restriction"},{"name":"PTOKEN_BFESS","value":"3765e98ba460da4cba9f398cb6761bac","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291909,"sameSite":"no_restriction"},{"name":"UBI_BFESS","value":"fi_PncwhpxZ%7ETaJc58Ok2WQB-pKGbagbZP1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291927,"sameSite":"no_restriction"},{"name":"BDUSS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".yoojia.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1804834912.473673,"sameSite":"no_restriction"},{"name":"RECENT_LOGIN","value":"1","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"29EC4928DB854067","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1807858914.073129,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"29EC4928DB854067","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1807858914.073195,"sameSite":"no_restriction"},{"name":"__bid_n","value":"19d29ab268974565dd302d","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1812876750.285539,"sameSite":"unspecified"},{"name":"ab_jid","value":"31443412aec52b009ab83201dd676b2e01cc","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239054,"sameSite":"no_restriction"},{"name":"ab_jid_BFESS","value":"31443412aec52b009ab83201dd676b2e01cc","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239211,"sameSite":"no_restriction"},{"name":"Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1776076276","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1809852750,"sameSite":"unspecified"},{"name":"Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1778316750","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ab_bid","value":"3201dd676b2e01ccfe1100df7b91f7cd6784","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239174,"sameSite":"no_restriction"},{"name":"ab_sr","value":"1.0.1_MWY2OWU5MGZjZDg1YTcxODE0N2ZjMTJjNzQ5MDkxOWEzY2NmZDQxYzhlMWY1NDBiNzJhZmNlNzJlNTY1NmE2NGJlNGQyYmM1MjBlZjljNzcxOTc4OTk5NzM1M2FhMWYwYWRjYWUyY2VkZGVlOTA3NzU1ZDg4YjEwOWQ0MmNhMmM5MmQ0NjM1MTg5NTcwYWJhMTAxYmFiY2M3N2I3NTIyMzUzNzI4Y2UxODUxMjBiNjI2NzkwN2NlZGQzZjJjYzZh","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1778323950.239193,"sameSite":"no_restriction"},{"name":"devStoken","value":"156b03b08c5ba216007ffffe7d3d3f1c56e85094e47919d9c79865d7da006b08","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1783500751.40618,"sameSite":"unspecified"},{"name":"bjhStoken","value":"d85b0de93a90bb9f89a30b33a052ac3656e85094e47919d9c79865d7da006b08","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1783500751.406208,"sameSite":"unspecified"},{"name":"RT","value":"\\"z=1&dm=baidu.com&si=112c9043-97f2-4c25-852c-355e3fa4a36f&ss=mots2cvg&sl=1&tt=2pa&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=4btcfk\\"","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1778921554,"sameSite":"lax"}]');

    const result = await Baijiahao.getBaijiahaoVideoStatus(cookie, '1866143897577047224');
    // assets
    console.log('百家号横版状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
//vid=5104448721030017716
describe.runIf(true)('【真实测试竖版状态】', () => {
  test('百家号竖版状态', async () => {
    const cookie =
      convertCookieStr('[{"name":"XFI","value":"4d415390-1de1-11f1-a37d-67bb29365080","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"3579753DDC90708EA5C0B9249EE82072421B44C29037C876642E08E1B2977888","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"zhmxcNwgCGyUZ2p1MFnlJuj+4x0XMRT1UguPaCmI+SQ=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"RECENT_LOGIN","value":"0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFI","value":"696ea060-4b84-11f1-b9f2-a79701719dab","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"oLxGttJuGphJwUK1vMPQWVYXWNzAdbsRUqSKZD3qsXA=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"DBBF0315E4262D35E7BF2721F4345A64C81CB2072717521A6E302C551F87D2CA","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"29EC4928DB854067","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"PHPSESSID","value":"3ccnp1632gk9pe2md14s7fjrs0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"theme","value":"bjh","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1804834890,"sameSite":"unspecified"},{"name":"BAIDUID","value":"D3A7F04E176E2DD51754EF8E481F367A:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1804834890.399723,"sameSite":"unspecified"},{"name":"BAIDUID_BFESS","value":"D3A7F04E176E2DD51754EF8E481F367A:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1804834890.399802,"sameSite":"no_restriction"},{"name":"ppfuid","value":"FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW8zx/dTuDRscIVpH2fjlwVbIzQ0EMGc2V76+HMIyS32dNnTNS/pLMWceus0e757/UN4TgYygGbW8O5KoEwDuFmXAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HOSUPPORT","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858892.432768,"sameSite":"unspecified"},{"name":"HOSUPPORT_BFESS","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858892.432869,"sameSite":"no_restriction"},{"name":"XFS","value":"IPTrzfa0q%2BOFYxsZRK8Z0N0IA1%2BSc0vD6elu3dszO9Y%3D","domain":"xlab.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"UBI","value":"fi_PncwhpxZ%7ETaJc58Ok2WQB-pKGbagbZP1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858912.291754,"sameSite":"unspecified"},{"name":"STOKEN","value":"ad512ef5c93e573b783b9ebc1645c3255a30eeca0752af103767bb721ec7564e","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291794,"sameSite":"unspecified"},{"name":"BDUSS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858912.291817,"sameSite":"unspecified"},{"name":"PTOKEN","value":"3765e98ba460da4cba9f398cb6761bac","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291843,"sameSite":"unspecified"},{"name":"BDUSS_BFESS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291863,"sameSite":"no_restriction"},{"name":"STOKEN_BFESS","value":"ad512ef5c93e573b783b9ebc1645c3255a30eeca0752af103767bb721ec7564e","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291888,"sameSite":"no_restriction"},{"name":"PTOKEN_BFESS","value":"3765e98ba460da4cba9f398cb6761bac","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291909,"sameSite":"no_restriction"},{"name":"UBI_BFESS","value":"fi_PncwhpxZ%7ETaJc58Ok2WQB-pKGbagbZP1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291927,"sameSite":"no_restriction"},{"name":"BDUSS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".yoojia.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1804834912.473673,"sameSite":"no_restriction"},{"name":"RECENT_LOGIN","value":"1","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"29EC4928DB854067","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1807858914.073129,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"29EC4928DB854067","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1807858914.073195,"sameSite":"no_restriction"},{"name":"__bid_n","value":"19d29ab268974565dd302d","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1812876750.285539,"sameSite":"unspecified"},{"name":"ab_jid","value":"31443412aec52b009ab83201dd676b2e01cc","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239054,"sameSite":"no_restriction"},{"name":"ab_jid_BFESS","value":"31443412aec52b009ab83201dd676b2e01cc","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239211,"sameSite":"no_restriction"},{"name":"Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1776076276","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1809852750,"sameSite":"unspecified"},{"name":"Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1778316750","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ab_bid","value":"3201dd676b2e01ccfe1100df7b91f7cd6784","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239174,"sameSite":"no_restriction"},{"name":"ab_sr","value":"1.0.1_MWY2OWU5MGZjZDg1YTcxODE0N2ZjMTJjNzQ5MDkxOWEzY2NmZDQxYzhlMWY1NDBiNzJhZmNlNzJlNTY1NmE2NGJlNGQyYmM1MjBlZjljNzcxOTc4OTk5NzM1M2FhMWYwYWRjYWUyY2VkZGVlOTA3NzU1ZDg4YjEwOWQ0MmNhMmM5MmQ0NjM1MTg5NTcwYWJhMTAxYmFiY2M3N2I3NTIyMzUzNzI4Y2UxODUxMjBiNjI2NzkwN2NlZGQzZjJjYzZh","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1778323950.239193,"sameSite":"no_restriction"},{"name":"devStoken","value":"156b03b08c5ba216007ffffe7d3d3f1c56e85094e47919d9c79865d7da006b08","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1783500751.40618,"sameSite":"unspecified"},{"name":"bjhStoken","value":"d85b0de93a90bb9f89a30b33a052ac3656e85094e47919d9c79865d7da006b08","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1783500751.406208,"sameSite":"unspecified"},{"name":"RT","value":"\\"z=1&dm=baidu.com&si=112c9043-97f2-4c25-852c-355e3fa4a36f&ss=mots2cvg&sl=1&tt=2pa&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=4btcfk\\"","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1778921554,"sameSite":"lax"}]');

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    const result = await Baijiahao.getBaijiahaoMiniVideoStatus(cookie, '4154947372722717039');
    // assets
    console.log('百家号竖版状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});


describe.runIf(true)('【真实测试】', () => {
  test('百家号活动', async () => {
    const cookie =
      'theme=bjh; BAIDUID=4E0FC962692A2159EEB70823C5F85F64:FG=1; BAIDUID_BFESS=4E0FC962692A2159EEB70823C5F85F64:FG=1; BDUSS=AtV2syUVQxQkUwYXhDbzY4dXM4NC1UbGVVNUJmQTdzQzFZZEVBbVlRSm9LS1ZvSVFBQUFBJCQAAAAAAAAAAAEAAACYj7PqxMLT42RheQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGibfWhom31od3; BDUSS_BFESS=AtV2syUVQxQkUwYXhDbzY4dXM4NC1UbGVVNUJmQTdzQzFZZEVBbVlRSm9LS1ZvSVFBQUFBJCQAAAAAAAAAAAEAAACYj7PqxMLT42RheQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGibfWhom31od3; __bid_n=1982b3259f3929627ecd9d; PHPSESSID=78n30f0cnfk6ftjit14sbqopq5; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2GrfqL8c87KLF2qFER3obJGnRPnrAdRzWz2cXL9q+Icxy62NM9rQl32fbT+RbwRjup+ti94/aebzvoussIeRnUjvXnHbhleo7Y9TqpkEyFV4CpKpNgGABXiP+0W+EqshNO4dWP+6GLLCgGWCAVHMIFRvSD3rH8JOudPxJORNS7SCt6rEeCerZiOC2HS/q3kWYbpA5RdGpipmODqHTwPvOqFLOQHvyhUQrrHDS6OPGdMUX5FnJNp5c2Cvgs1aHt7uhfUHv1DxZiH330Apc6oKkZo0Y6IJXad8xN1gQMZ1tOmckSecr9yhMSRLVoFktEC1isIoEUuh2L0ZKEXbxZOgmKXcFMb7+JFWxNGoA0JNiv6hCb0gkXpkEpISi6tVHh+hsQifjACGGz0MbLI9AAutvQNmLovQE8DrrUkOPSWZkiBwIUvxonSGS2lgiNZBxgK/Nad6P3sfvyvYhyXNwxm6SzH+Oja1l6cy9uoP7y446ILa1CLEOaV1jDkGoksNhRtn7B81CemkusdgER6aaUV34R4eGWiTUlCqdbf8oGHYcombWYX5RweDqStPwMzdS8AT76ygViv7lnF4xrYkhgSKNlMQwPkP86GfIbGCquGAObJfCou294/nZR7mpfc0ZPaB61buGGK/Nqbydyy5VRMY9E3z0CFai2ttXKypq/Loo0JrnLa7elPNSWU9pSPwamQJULfVlddlyjf2DSNdFaksc04YpQi9Awgg8unrypyhixqbwVqksZ1okMqQxKIZFYz8tMzZDiNeQT9xKCyi5pIFMa30nZL4/01GYZeql7Qjzv5qan7KSdu/hwDrm5vVP9Uw6tEtNjDznQmW+r3/wA4+ylTnWEx+WDzOjUGRWIcQYNHqw3oxcimP1vQ6HC8rDNEx2ov8eWtxPkJGqOFtWjIVteQYMsH/AaSJonqw+WLiZvGjYfm9p0alEyujapoTy77HzDcUoU1wUSXa5xS/Z6hXEr2OnLi0LdPVcGjz8lpLcdVeSfm9p0alEyujapoTy77HzDWf5PERRSTFqLd9BTUHLyY4Ji3EQLGQPaM1aeHxG1bJZH0s1Si/KwzTaTYzu6ziQiqwcr2kaYUiH+fMOxn69/BhNJVMhpQkhprc1KZuJRvXjppq0gKweencPxgS/jd0rjw==; HMACCOUNT=79FAA68A43063093; RECENT_LOGIN=0; XFI=bcb39670-65fe-11f0-98c3-e3f286fdeb45; XFCS=EC798419F4F3B16BCAF5992D45A581E240B7B1A723D671222A7A2D28F51EAF1E; XFT=UHbntaalt0Izh0HB6RVjDtv1/lzpub1p30HAMKcHFyA=; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1758075297; XFI=1dfb87e0-936c-11f0-ad17-5b6e8669a11b; XFT=joXE4p700ZWrX9Hz6JbVmoxl6cElA68AA4WI0O2Hl6M=; XFCS=7FBED5A4517B0FE94B1EA0E11F90D009CC964C6E18E38C1704AAF518FB76D83E; devStoken=b177f3ab92c0d2d71d02ab677e49036eba426a1dbcb62d20d94adf85807f1f42; bjhStoken=fdcab1807eaf2af4a6f64ecc105c804dba426a1dbcb62d20d94adf85807f1f42; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1758094651; RT="z=1&dm=baidu.com&si=4f119af5-7337-4d6d-bdf6-2e3a3092676e&ss=mfnfjtj5&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf"';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    const result = await Baijiahao.getBaijiahaoActivityList(cookie, 'video');
    // assets
    console.log('百家号活动：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
describe.runIf(true)('【真实测试】', () => {
  test('百家号横版视频发布2', async () => {
    const cookie =
      convertCookieStr('[{"name":"XFI","value":"4d415390-1de1-11f1-a37d-67bb29365080","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"3579753DDC90708EA5C0B9249EE82072421B44C29037C876642E08E1B2977888","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"zhmxcNwgCGyUZ2p1MFnlJuj+4x0XMRT1UguPaCmI+SQ=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"RECENT_LOGIN","value":"0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFI","value":"696ea060-4b84-11f1-b9f2-a79701719dab","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"oLxGttJuGphJwUK1vMPQWVYXWNzAdbsRUqSKZD3qsXA=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"DBBF0315E4262D35E7BF2721F4345A64C81CB2072717521A6E302C551F87D2CA","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"29EC4928DB854067","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"PHPSESSID","value":"3ccnp1632gk9pe2md14s7fjrs0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"theme","value":"bjh","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1804834890,"sameSite":"unspecified"},{"name":"BAIDUID","value":"D3A7F04E176E2DD51754EF8E481F367A:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1804834890.399723,"sameSite":"unspecified"},{"name":"BAIDUID_BFESS","value":"D3A7F04E176E2DD51754EF8E481F367A:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1804834890.399802,"sameSite":"no_restriction"},{"name":"ppfuid","value":"FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW8zx/dTuDRscIVpH2fjlwVbIzQ0EMGc2V76+HMIyS32dNnTNS/pLMWceus0e757/UN4TgYygGbW8O5KoEwDuFmXAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HOSUPPORT","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858892.432768,"sameSite":"unspecified"},{"name":"HOSUPPORT_BFESS","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858892.432869,"sameSite":"no_restriction"},{"name":"XFS","value":"IPTrzfa0q%2BOFYxsZRK8Z0N0IA1%2BSc0vD6elu3dszO9Y%3D","domain":"xlab.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"UBI","value":"fi_PncwhpxZ%7ETaJc58Ok2WQB-pKGbagbZP1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858912.291754,"sameSite":"unspecified"},{"name":"STOKEN","value":"ad512ef5c93e573b783b9ebc1645c3255a30eeca0752af103767bb721ec7564e","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291794,"sameSite":"unspecified"},{"name":"BDUSS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858912.291817,"sameSite":"unspecified"},{"name":"PTOKEN","value":"3765e98ba460da4cba9f398cb6761bac","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291843,"sameSite":"unspecified"},{"name":"BDUSS_BFESS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291863,"sameSite":"no_restriction"},{"name":"STOKEN_BFESS","value":"ad512ef5c93e573b783b9ebc1645c3255a30eeca0752af103767bb721ec7564e","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291888,"sameSite":"no_restriction"},{"name":"PTOKEN_BFESS","value":"3765e98ba460da4cba9f398cb6761bac","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291909,"sameSite":"no_restriction"},{"name":"UBI_BFESS","value":"fi_PncwhpxZ%7ETaJc58Ok2WQB-pKGbagbZP1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291927,"sameSite":"no_restriction"},{"name":"BDUSS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".yoojia.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1804834912.473673,"sameSite":"no_restriction"},{"name":"RECENT_LOGIN","value":"1","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"29EC4928DB854067","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1807858914.073129,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"29EC4928DB854067","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1807858914.073195,"sameSite":"no_restriction"},{"name":"__bid_n","value":"19d29ab268974565dd302d","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1812876750.285539,"sameSite":"unspecified"},{"name":"ab_jid","value":"31443412aec52b009ab83201dd676b2e01cc","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239054,"sameSite":"no_restriction"},{"name":"ab_jid_BFESS","value":"31443412aec52b009ab83201dd676b2e01cc","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239211,"sameSite":"no_restriction"},{"name":"Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1776076276","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1809852750,"sameSite":"unspecified"},{"name":"Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1778316750","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ab_bid","value":"3201dd676b2e01ccfe1100df7b91f7cd6784","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239174,"sameSite":"no_restriction"},{"name":"ab_sr","value":"1.0.1_MWY2OWU5MGZjZDg1YTcxODE0N2ZjMTJjNzQ5MDkxOWEzY2NmZDQxYzhlMWY1NDBiNzJhZmNlNzJlNTY1NmE2NGJlNGQyYmM1MjBlZjljNzcxOTc4OTk5NzM1M2FhMWYwYWRjYWUyY2VkZGVlOTA3NzU1ZDg4YjEwOWQ0MmNhMmM5MmQ0NjM1MTg5NTcwYWJhMTAxYmFiY2M3N2I3NTIyMzUzNzI4Y2UxODUxMjBiNjI2NzkwN2NlZGQzZjJjYzZh","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1778323950.239193,"sameSite":"no_restriction"},{"name":"devStoken","value":"156b03b08c5ba216007ffffe7d3d3f1c56e85094e47919d9c79865d7da006b08","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1783500751.40618,"sameSite":"unspecified"},{"name":"bjhStoken","value":"d85b0de93a90bb9f89a30b33a052ac3656e85094e47919d9c79865d7da006b08","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1783500751.406208,"sameSite":"unspecified"},{"name":"RT","value":"\\"z=1&dm=baidu.com&si=112c9043-97f2-4c25-852c-355e3fa4a36f&ss=mots2cvg&sl=1&tt=2pa&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=4btcfk\\"","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1778921554,"sameSite":"lax"}]');

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    //const publishTokenResult = await getBaijiahaoPublishArticleToken(cookie, tokenResult.token);

    const taskData: BaijiahaoVideoTaskInput = {
      pubType: 0,
      taskId: '1717809227264909312',
      cover: {
        pathOrUrl: 'I:\\download\\heng.jpg',
        width: 4096,
        height: 1888,
      },

      verticalCover: {
        pathOrUrl: 'I:\\download\\shu.jpg',
        width: 4096,
        height: 1888,
      },
      //话题
      // topic: {
      //   category: '3',
      //   guide: '',
      //   id: '693',
      //   link: {
      //     scheme:
      //       'baiduboxapp://v1/browser/open?url=https%3A%2F%2Fm.baidu.com%2Fs%3Fword%3D%2523%25E6%2590%259E%25E7%25AC%2591%2523%26topic_id%3D693%26sfrom%3D1023524a%26sa%3Dtheme_list&append=1&newwindow=0&upgrade=1',
      //     url: 'https://m.baidu.com/s?word=%23%E6%90%9E%E7%AC%91%23&topic_id=693&sfrom=1023524a&sa=theme_list&append=1&newwindow=0&upgrade=1',
      //   },
      //   sv_small_images: {
      //     height: '180',
      //     https: 'https://b.bdstatic.com/2b68affd6b5fe453a9db4cc8202096c3.png@w_180',
      //     wide: '180',
      //   },
      //   title: '搞笑',
      // },
      // 标题
      title: '',

      //描述
      desc:  '<p>分享下游戏乐事<topic text="美食话题">#美食话题</topic><topic text="美食节目">#美食节目</topic></p>',

      video: {
        localPath: 'I:\\download\\询问图片内容.mp4',
        duration: 100,
        width: 1080,
        height: 720,
      },
      //绑定爱奇艺


      //标签

      //ai申明
      isAigc: false,

      //一级分类

      //二级分类

      // proxy: {
      //   serverAdd: 'd393.kdltpspro.com',
      //   serverPort: 15818,
      //   type: 'kuaidaili',
      //   userName: 't13552986932913',
      //   password: '2mbl9d6n',
      //   area: '',
      //   province: '11',
      // },
      //打赏
      // reward: true,
      //活动
      // activityId: '1596550',
      //地点
      // location: {
      //   addr: '四川省成都市锦江区人民南路一段86号',
      //   area: 631,
      //   area_name: '成都市青羊区',
      //   biz_type: 0,
      //
      //   catalogID: 975,
      //   city_id: 75,
      //   city_name: '成都市',
      //   cla: [],
      //   class_similar_score: 0,
      //   click_flag: 0,
      //   detail: 1,
      //   diPointX: 1158541545,
      //   diPointY: 356713388,
      //   di_tag: '休闲娱乐 休闲广场',
      //   dis: -1,
      //   dist2route: 0,
      //   dist2start: 0,
      //   ernie_score: 0,
      //
      //   ext_type: 4,
      //   f_flag: 1041,
      //   father_son: 0,
      //   flag_type: '64',
      //   geo: '.=pDfDFBsOwQVA;',
      //   geo_type: 0,
      //   history_address: '成都市',
      //   hit_tag_press: 0,
      //   is_top_nat: 0,
      //
      //   name: '天府广场',
      //   navi_update_time: 1705905758,
      //   navi_x: '11585251.2597',
      //   navi_y: '3567128.4994',
      //   new_catalog_id: '090000',
      //
      //   poiType: 0,
      //   poi_click_num: 0,
      //   poi_profile: 1,
      //   primary_uid: '17670589517058277375',
      //   query_guide:
      //     '[{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/service\\/search\\/default\\/meishi5.png","text":"美食","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/jiudian.png","text":"酒店","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/jingdian.png","text":"景点","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/tingchechang.png","text":"停车场","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/xiuxianyule.png","text":"休闲娱乐","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/service\\/search\\/default\\/gouwu5.png","text":"购物","type":1},{"icon":"https:\\/\\/map-mobile-resource.cdn.bcebos.com\\/icon\\/rec\\/search\\/default\\/jiayou.png","text":"加油站","type":1}]',
      //   route_flag: 0,
      //
      //   status: 1,
      //   std_tag: '休闲娱乐;休闲广场',
      //   std_tag_id: '1611',
      //   storage_src: 'api',
      //   street_id: '8fde79cc5e5af9c295ca0773',
      //   tag: '',
      //
      //   ty: 0,
      //   uid: '8fde79cc5e5af9c295ca0773',
      //   view_type: 0,
      //   x: 1158541545,
      //   y: 356713388,
      // },
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Baijiahao.publishVideo(cookie, taskData, eventCall, 0, '');
    // assets
    console.log('百家号横版发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【新版发布流程】', () => {
  test(
    '新视频发布',
    async () => {
      const result = Cloud.pushOpenPlatformPublishTask(
        {
          callBackData: { teamId: '6821ac8d50bc5fd636fa9801', userId: '6842b9707731899191a8ada5' },
          publishType: 'video',
          tasks: [
            {
              taskId: '69fefbddade5761209e91569',
              publishData: {
                video: {
                  duration: 326.92,
                  width: 1374,
                  height: 576,
                  size: 68631623,
                  url: 'https://oss-v2.yixiaoer.cn/yfb/test/t-6821ac8d50bc5fd636fa9801/zqblxfxbpecnz-wtk88tx',
                  localPath: '',
                },
                covers: [
                  {
                    width: 1374,
                    height: 576,
                    size: 41094,
                    pathOrUrl: 'https://oss-v2.yixiaoer.cn/yfb/test/t-6821ac8d50bc5fd636fa9801/ahofaujm1aatc-3byw2pd',
                    format: '',
                  },
                ],
                title: '',
                desc: '<p>分享下游戏乐事<topic text="美食话题">#美食话题</topic><topic text="美食节目">#美食节目</topic><topic text="美食探店">#美食探店</topic></p>',
                tags: [],
                statement: { type: 1 },
                // location: {
                //   yixiaoerId: '0f68e75cdbb6c796095cb3e8',
                //   yixiaoerName: '肯德基(长沙新黄兴中路店)',
                //   yixiaoerDesc: '湖南省长沙市天心区黄兴中路27号王府井百货F1',
                // },
                prePubTime: 0,
                pubType: 0,
                collection: { yixiaoerId: '9729987485539269708', yixiaoerName: '瓜子多多' },
              },
              authorInfo: {
                platformName: '百家号',
                id: 'cmmn4e2z40015g22vnqarqqvw',

              },
            },
          ],
          publishChannel: 'cloud',
          clientId: 'cloud',
          need_parts_back: true,
          platform: [
            {
              id: 'cmmn4e2z40015g22vnqarqqvw',
              platformCode: 'BaiJiaHao',
              platformUserId: '1825269673477008',
              platformUserName: '什么味道的瓜子',
              platformCookie:
                '[{"name":"XFI","value":"4d415390-1de1-11f1-a37d-67bb29365080","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"3579753DDC90708EA5C0B9249EE82072421B44C29037C876642E08E1B2977888","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"zhmxcNwgCGyUZ2p1MFnlJuj+4x0XMRT1UguPaCmI+SQ=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"RECENT_LOGIN","value":"0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFI","value":"696ea060-4b84-11f1-b9f2-a79701719dab","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"oLxGttJuGphJwUK1vMPQWVYXWNzAdbsRUqSKZD3qsXA=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"DBBF0315E4262D35E7BF2721F4345A64C81CB2072717521A6E302C551F87D2CA","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"29EC4928DB854067","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"PHPSESSID","value":"3ccnp1632gk9pe2md14s7fjrs0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"theme","value":"bjh","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1804834890,"sameSite":"unspecified"},{"name":"BAIDUID","value":"D3A7F04E176E2DD51754EF8E481F367A:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1804834890.399723,"sameSite":"unspecified"},{"name":"BAIDUID_BFESS","value":"D3A7F04E176E2DD51754EF8E481F367A:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1804834890.399802,"sameSite":"no_restriction"},{"name":"ppfuid","value":"FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW8zx/dTuDRscIVpH2fjlwVbIzQ0EMGc2V76+HMIyS32dNnTNS/pLMWceus0e757/UN4TgYygGbW8O5KoEwDuFmXAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HOSUPPORT","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858892.432768,"sameSite":"unspecified"},{"name":"HOSUPPORT_BFESS","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858892.432869,"sameSite":"no_restriction"},{"name":"XFS","value":"IPTrzfa0q%2BOFYxsZRK8Z0N0IA1%2BSc0vD6elu3dszO9Y%3D","domain":"xlab.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"UBI","value":"fi_PncwhpxZ%7ETaJc58Ok2WQB-pKGbagbZP1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858912.291754,"sameSite":"unspecified"},{"name":"STOKEN","value":"ad512ef5c93e573b783b9ebc1645c3255a30eeca0752af103767bb721ec7564e","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291794,"sameSite":"unspecified"},{"name":"BDUSS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1807858912.291817,"sameSite":"unspecified"},{"name":"PTOKEN","value":"3765e98ba460da4cba9f398cb6761bac","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291843,"sameSite":"unspecified"},{"name":"BDUSS_BFESS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291863,"sameSite":"no_restriction"},{"name":"STOKEN_BFESS","value":"ad512ef5c93e573b783b9ebc1645c3255a30eeca0752af103767bb721ec7564e","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291888,"sameSite":"no_restriction"},{"name":"PTOKEN_BFESS","value":"3765e98ba460da4cba9f398cb6761bac","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291909,"sameSite":"no_restriction"},{"name":"UBI_BFESS","value":"fi_PncwhpxZ%7ETaJc58Ok2WQB-pKGbagbZP1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1807858912.291927,"sameSite":"no_restriction"},{"name":"BDUSS","value":"zdPMGR1dmNFOUZvbUR2dEx-Q1JOQ3lLSkFvT1RpdGowalZDNkJ6bWlndmc4ZGxwRVFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBksmngZLJpN","domain":".yoojia.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1804834912.473673,"sameSite":"no_restriction"},{"name":"RECENT_LOGIN","value":"1","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"29EC4928DB854067","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1807858914.073129,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"29EC4928DB854067","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1807858914.073195,"sameSite":"no_restriction"},{"name":"__bid_n","value":"19d29ab268974565dd302d","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1812876750.285539,"sameSite":"unspecified"},{"name":"ab_jid","value":"31443412aec52b009ab83201dd676b2e01cc","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239054,"sameSite":"no_restriction"},{"name":"ab_jid_BFESS","value":"31443412aec52b009ab83201dd676b2e01cc","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239211,"sameSite":"no_restriction"},{"name":"Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1776076276","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1809852750,"sameSite":"unspecified"},{"name":"Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1778316750","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ab_bid","value":"3201dd676b2e01ccfe1100df7b91f7cd6784","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1812876750.239174,"sameSite":"no_restriction"},{"name":"ab_sr","value":"1.0.1_MWY2OWU5MGZjZDg1YTcxODE0N2ZjMTJjNzQ5MDkxOWEzY2NmZDQxYzhlMWY1NDBiNzJhZmNlNzJlNTY1NmE2NGJlNGQyYmM1MjBlZjljNzcxOTc4OTk5NzM1M2FhMWYwYWRjYWUyY2VkZGVlOTA3NzU1ZDg4YjEwOWQ0MmNhMmM5MmQ0NjM1MTg5NTcwYWJhMTAxYmFiY2M3N2I3NTIyMzUzNzI4Y2UxODUxMjBiNjI2NzkwN2NlZGQzZjJjYzZh","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1778323950.239193,"sameSite":"no_restriction"},{"name":"devStoken","value":"156b03b08c5ba216007ffffe7d3d3f1c56e85094e47919d9c79865d7da006b08","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1783500751.40618,"sameSite":"unspecified"},{"name":"bjhStoken","value":"d85b0de93a90bb9f89a30b33a052ac3656e85094e47919d9c79865d7da006b08","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1783500751.406208,"sameSite":"unspecified"},{"name":"RT","value":"\\"z=1&dm=baidu.com&si=112c9043-97f2-4c25-852c-355e3fa4a36f&ss=mots2cvg&sl=1&tt=2pa&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=4btcfk\\"","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1778921554,"sameSite":"lax"}]',
              platformLocalStorage: '{"__url__":"https://baijiahao.baidu.com/builder/rc/home"}',
            },
          ],
          authorization: 'sess_5fc3947a371c624881f55d6f52be4d71e52c2c2d51420b13a110948022727da5',
        },
        'sess_5fc3947a371c624881f55d6f52be4d71e52c2c2d51420b13a110948022727da5',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});

