import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import {
  Weixingongzhonghao,
  WeiXinGongZhongHaoVideoTaskInput,
  WeixinMsgTaskInput,
} from '../../../src/media-platform/weixingongzhonghao';
import { Cloud, Platforms } from '../../../src';
import { convertCookieStr } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  test('公众视频发布', async () => {
    const cookie =
      'ua_id=aEhFN5rsFWFyvVGuAAAAAFHxWWuVBxCDGuGb1yMzm8I=; _clck=kqrgpt|1|g6c|0; wxuin=79700970593116; uuid=9220a5287687d05b1419206843acb622; rand_info=CAESINPCeg0OIdXe9Z9DskL+9vZCBqy97qe1mMBHLJdYNUEp; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=dn/IR6uzaJ6CXut5PHQgGWl7XzV7AOEyve2HjaoJarR9eh5v8EAyANOvyDTPeFya; slave_sid=SDJzUm1HZ1FYMHFBb3ZJdjgyREJWY2JIQ0FIUko4NXNfeE90bGlMc1g3Y3dtXzdac1lsTHJudEw2UGRWVm5Cc1ZxekVQMjNsVTFPZWZsQWhXclNRNWdCMmx2UXV3c2ozcUdrdndpWkNIckJ6dnBEc3c0T21VeE1pckdjSzNXZWhWMWRoRloxUFVTOEVKaVlX; slave_user=gh_7271ce0a8a0f; xid=bd285804e2848f2d69eb7a581f8e40c8; mm_lang=zh_CN; _clsk=18qqq26|1779701060818|4|1|mp.weixin.qq.com/weheat-agent/payload/record';

    const tokenResult = await Weixingongzhonghao.getWeixingongzhonghaoUserInfo(cookie);

    const taskData: WeiXinGongZhongHaoVideoTaskInput = {
      pubType: 0,
      taskId: '1717809227264909312',
      sex: 0,
      notifySubscribers: 0,
      contentList: [
        {
          /**
           * 文章标题
           */
          title: '今天的天气非常的美丽',
          /**
           * 文章摘要
           */
          desc: '<p>文章的摘要是一篇文章的灵魂，至少需要15个字才能满足要求，才能把摘要说清楚</p>',
          /**
           * 是否申明原创  已经有两种类型，目前只支持一种
           * 0:不申明
           * 1:申明
           */
          isOriginal:1,

          /**
           * 是否开启留言,和快捷私信互斥
           * 0:关闭 1:关注用户 2:关注7天以上用户 3:所有
           */
          needOpenComment: 0,
          /**
           * 允许回复留言的类型
           * 5:所有用户，精选后展示，2:所有用户,3:已关注的用户,4:已关注7天以上用户
           */

          /**
           *  封面
           */
          cover: {
            pathOrUrl: 'I:\\download\\20260414-143916.jpg',
            height: 768,
            width: 1024,
          },
          video: {
            localPath: 'I:\\download\\询问图片内容.mp4',
            duration: 10,
          },
          /**
           * 创作来源
           * claim_source_type 4:个人观点 ,3:内容剧情演绎,2:素材来源于官方媒体，1:内容由AI生成 0:不声明
           */
          contentSource: 1,

          /**
           * 快捷私信，与开启留言互斥，申明原创后可开启
           */
          openFansMsg: 0,

          /**
           * 不允许平台推荐
           * 0：允许
           * 1：不允许
           */
          disableRecommend: 1,

          syncToFinder: 0,
        },
        {
          /**
           * 文章标题
           */
          title: '今天的天气非常的美丽2',
          /**
           * 文章摘要
           */
          desc: '文章的摘要是一篇文章的灵魂，至少需要15个字才能满足要求，才能把摘要说清楚',
          /**
           * 是否申明原创  已经有两种类型，目前只支持一种
           * 0:不申明
           * 1:申明
           */
          isOriginal:0,

          /**
           * 是否开启留言,和快捷私信互斥
           * 0:关闭 1:关注用户 2:关注7天以上用户 3:所有
           */
          needOpenComment: 2,
          /**
           * 允许回复留言的类型
           * 5:所有用户，精选后展示，2:所有用户,3:已关注的用户,4:已关注7天以上用户
           */

          /**
           *  封面
           */
          cover: {
            pathOrUrl: 'I:\\download\\20260414-143916.jpg',
            height: 768,
            width: 1024,
          },
          video: {
            localPath: 'I:\\download\\询问图片内容.mp4',
            duration: 10,
          },
          /**
           * 创作来源
           * claim_source_type 4:个人观点 ,3:内容剧情演绎,2:素材来源于官方媒体，1:内容由AI生成 0:不声明
           */
          contentSource: 3,

          /**
           * 快捷私信，与开启留言互斥，申明原创后可开启
           */
          openFansMsg: 0,

          /**
           * 不允许平台推荐
           * 0：允许
           * 1：不允许
           */
          disableRecommend: 0,

          syncToFinder: 0,
        }
      ],
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Weixingongzhonghao.publishVideo(
      cookie,
      taskData,
      tokenResult.data?.ticketId ?? '',
      tokenResult.data?.ticket ?? '',
      tokenResult.data?.token ?? 0,
      tokenResult.yixiaoerId ?? '',
      eventCall,
    );
    // assets
    console.log('公众号号图文发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('获取微信公众号作品状态', async () => {
    const cookie = convertCookieStr(
      'ua_id=Ny4LDBZrddBfYvdvAAAAAO2MrFNv17EOyKzMJyhbVdQ=; _clck=t0tzkl|1|g4l|0; wxuin=74264573918107; uuid=9259bb3e2561e7a855584482d7a2d1fb; rand_info=CAESIFSESaatoUVrl/JrP5vcrOVBmf3i0Vlp7oV+5ejS33EE; slave_bizuin=3927238210; data_bizuin=3927238210; bizuin=3927238210; data_ticket=coaZ1lA0O7QXOxOKK323MIO8goKgPeMqp9uzk4R7ODQli6PIoBfes9I9F4NaKW59; slave_sid=OXZ1STlQbndocGZkR2RHb2g0RkRFSTlxT29tcmlTbUFUQ0ljX3V1clVUdktfZVM1akFtRjZSdzBPODdUNkthZ2g2WXpRa3JEYmxnY3YxWDJZY2x5MjN0bHRzQWVtN0tNSnRkWmdYZ2FlZU9GMWU5ZkhhWEo5S1JaeVVOWUZUdDBRMHlMTGFVcGNYMXdHQzRl; slave_user=gh_c6e61f562741; xid=3f1450ec1cbb9118067dccf75c8e3e00; mm_lang=zh_CN; _clsk=13ih6ns|1774270099329|3|1|mp.weixin.qq.com/weheat-agent/payload/record',
    );
    const result = await Weixingongzhonghao.getGongZhongHaoArticleStatus(cookie, '100013770_3623085645');
    const ser = new Cloud.QueryWorker('', Platforms.WeiXinGongZhongHao, {
      platformAccountId: '12312ASD',
      platformAuthorId: 'SDFSDFAD',
      cookie: cookie,
      authorization: '',
      callBackData: {},
    });
    const re2 = await ser.checkAuditStatus('123123', '100000188_3623085645');
    console.log('获取微信用户信息', result, re2);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
