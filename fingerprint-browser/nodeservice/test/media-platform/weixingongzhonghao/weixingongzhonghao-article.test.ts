import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { Weixingongzhonghao, WeixinMsgTaskInput } from '../../../src/media-platform/weixingongzhonghao';
import { Cloud, Platforms } from '../../../src';
import { convertCookieStr } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  test('公众号图文发布', async () => {
    const cookie =
      'ua_id=v4LqiGZparSHU5y9AAAAALvPMjR6hgaJVsmF1sHtD0U=; _clck=r55g5b|1|g10|0; uuid=c399b51fca7752faa203dab3772d4985; wxuin=63114759961685; rand_info=CAESID8O4yQ0SKuuma0FgBkkAvSZKWL8PdXHtxeTpJg3awzo; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=PeHJwBM0stGmBJQMusDfJ12OvzmDv3jKdJfxaObM+s5WWGwq47idMn9xeJ/lx9WZ; slave_sid=c256dWZ4dGpWazhsMzFlNndEVXlJMGZOdWNLd2JfZFZ3b0hVd1VMNlpsS29ldTNmdldTYzlPVjdOZThxRThCSWdUTDhrcFZHMzRjdE5vVFdnNDd0c3dTcjBHblE2YVNpX1dNQXlMZ2ZFa2NSZ0tfMGdpR0VNdXFZMVNXU0x1VW01MlJSbGQxY3hmQ2d4bzdq; slave_user=gh_7271ce0a8a0f; xid=d83c18a51c52f3d9c6d3d4ed8bae3104; mm_lang=zh_CN; _clsk=1u0bg4r|1763114801011|3|1|mp.weixin.qq.com/weheat-agent/payload/record';

    const tokenResult = await Weixingongzhonghao.getWeixingongzhonghaoUserInfo(cookie);

    const taskData: WeixinMsgTaskInput = {
      pubType: 1,
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
          desc: '文章的摘要是一篇文章的灵魂，至少需要15个字才能满足要求，才能把摘要说清楚',
          /**
           * 是否申明原创  已经有两种类型，目前只支持一种
           * 0:不申明
           * 1:申明
           */
          isOriginal: 0,

          /**
           * 申明原创 时一级分类
           */
          categoryName: '',

          /**
           * 申明原创 时二级分类
           */
          subCategoryName: '',
          /**
           * 申明原创时 作者昵称 最多8个字
           */
          authorName: '',

          /**
           * 是否开启打赏
           */
          canReward: 0,

          /**
           * 原文链接
           */
          contentSourceUrl: '',

          /**
           * 是否开启留言,和快捷私信互斥
           * 0:关闭 1:关注用户 2:关注7天以上用户 3:所有
           */
          needOpenComment: 0,
          /**
           * 允许回复留言的类型
           * 5:所有用户，精选后展示，2:所有用户,3:已关注的用户,4:已关注7天以上用户
           */
          needOpenReply: 4,

          /**
           *  封面
           */
          cover: {
            pathOrUrl:
              'I:\\download\\picproxy.jpg',
          },

          /**
           * 内容得html字符串
           */
          content:
            '<p style="text-align: left"><span style="-webkit-tap-highlight-color: transparent; margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible">你爱不爱吃肯德基？<app-card data="%7B%22yixiaoerId%22%3A%22wx08ee7f7d36a2eff8%22%2C%22yixiaoerName%22%3A%22%E8%82%AF%E5%BE%B7%E5%9F%BA%2B%22%2C%22raw%22%3A%7B%22appid%22%3A%22wx08ee7f7d36a2eff8%22%2C%22main_page%22%3A%22index%2FkfcUcenterHomepage%2Findex%2Findex%3F%2524taroTimestamp%3D1763024477950%22%2C%22nickname%22%3A%22%E8%82%AF%E5%BE%B7%E5%9F%BA%2B%22%7D%7D" data-type="text" data-text="肯德基+" data-image=""></app-card></span></p><p style="text-align: left"><span style="-webkit-tap-highlight-color: transparent; margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible">我爱吃肯德基</span><app-card data="%7B%22yixiaoerId%22%3A%22wx08ee7f7d36a2eff8%22%2C%22yixiaoerName%22%3A%22%E8%82%AF%E5%BE%B7%E5%9F%BA%2B%22%2C%22raw%22%3A%7B%22appid%22%3A%22wx08ee7f7d36a2eff8%22%2C%22main_page%22%3A%22index%2FkfcUcenterHomepage%2Findex%2Findex%3F%2524taroTimestamp%3D1763024477950%22%2C%22nickname%22%3A%22%E8%82%AF%E5%BE%B7%E5%9F%BA%2B%22%2C%22headimg_url%22%3A%22https%3A%2F%2Fmmbiz.qpic.cn%2Fsz_mmbiz_png%2FszICvVTeNloW7uBuahAQ51ibiby5yicNIYnBgicGakHzXn2cTd1lNrRuwMMW4FJ6TP0Df9wqww98vDaL6DU3jj0Bcg%2F0%3Fwx_fmt%3Dpng%26from%3Dappmsg%22%7D%7D" data-type="image" data-text="" data-image="https://mmbiz.qpic.cn/sz_mmbiz_png/szICvVTeNloW7uBuahAQ51ibiby5yicNIYnBgicGakHzXn2cTd1lNrRuwMMW4FJ6TP0Df9wqww98vDaL6DU3jj0Bcg/0?wx_fmt=png&amp;from=appmsg"></app-card></p><p style="text-align: left"><span style="-webkit-tap-highlight-color: transparent; margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible"><br></span></p><p style="text-align: left"><span style="-webkit-tap-highlight-color: transparent; margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible">你爱不爱吃肯德基</span></p><p style="text-align: left"><app-card data="%7B%22yixiaoerId%22%3A%22wx08ee7f7d36a2eff8%22%2C%22yixiaoerName%22%3A%22%E8%82%AF%E5%BE%B7%E5%9F%BA%2B%22%2C%22raw%22%3A%7B%22appid%22%3A%22wx08ee7f7d36a2eff8%22%2C%22main_page%22%3A%22index%2FkfcUcenterHomepage%2Findex%2Findex%3F%2524taroTimestamp%3D1763024477950%22%2C%22nickname%22%3A%22%E8%82%AF%E5%BE%B7%E5%9F%BA%2B%22%2C%22headimg_url%22%3A%22http%3A%2F%2Fmmbiz.qpic.cn%2Fsz_mmbiz_jpg%2FszICvVTeNlpAbNM0Z6LF7OuhjF4x3aF3N62e6ySLqs0zfBN0zYDicE4ialrHMzZ3pvW6GhIAOwTc8voIvpDTLXLw%2F0%3Fwx_fmt%3Djpeg%22%2C%22avatar%22%3A%22http%3A%2F%2Fmmbiz.qpic.cn%2Fmmbiz_png%2Fqib5oUglsFY9IVBCbh5pibrSbHYXcPiaIkex7VibNNYoyjTgR5505UFialBBmAMmQ6tFicT3KEho4y8uibyLKwwmA8Xzg%2F640%3Fwx_fmt%3Dpng%26amp%3Bwxfrom%3D200%22%2C%22title%22%3A%22%E8%82%AF%E5%BE%B7%E5%9F%BA%2B%22%2C%22activityCode%22%3A%22%22%7D%7D" data-type="card" data-text="" data-image="http://mmbiz.qpic.cn/sz_mmbiz_jpg/szICvVTeNlpAbNM0Z6LF7OuhjF4x3aF3N62e6ySLqs0zfBN0zYDicE4ialrHMzZ3pvW6GhIAOwTc8voIvpDTLXLw/0?wx_fmt=jpeg"></app-card></p><p style="text-align: left"><span style="-webkit-tap-highlight-color: transparent; margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important">非常好吃的肯德基！</span></p>',

          /**
           * 创作来源
           * claim_source_type 4:个人观点 ,3:内容剧情演绎,2:素材来源于官方媒体，1:内容由AI生成 0:不声明
           */
          contentSource: 0,

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

          allowFastReprint: 0,
        },
      ],
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Weixingongzhonghao.publishArticle(
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
    const cookie =convertCookieStr( 'ua_id=Ny4LDBZrddBfYvdvAAAAAO2MrFNv17EOyKzMJyhbVdQ=; _clck=t0tzkl|1|g4l|0; wxuin=74264573918107; uuid=9259bb3e2561e7a855584482d7a2d1fb; rand_info=CAESIFSESaatoUVrl/JrP5vcrOVBmf3i0Vlp7oV+5ejS33EE; slave_bizuin=3927238210; data_bizuin=3927238210; bizuin=3927238210; data_ticket=coaZ1lA0O7QXOxOKK323MIO8goKgPeMqp9uzk4R7ODQli6PIoBfes9I9F4NaKW59; slave_sid=OXZ1STlQbndocGZkR2RHb2g0RkRFSTlxT29tcmlTbUFUQ0ljX3V1clVUdktfZVM1akFtRjZSdzBPODdUNkthZ2g2WXpRa3JEYmxnY3YxWDJZY2x5MjN0bHRzQWVtN0tNSnRkWmdYZ2FlZU9GMWU5ZkhhWEo5S1JaeVVOWUZUdDBRMHlMTGFVcGNYMXdHQzRl; slave_user=gh_c6e61f562741; xid=3f1450ec1cbb9118067dccf75c8e3e00; mm_lang=zh_CN; _clsk=13ih6ns|1774270099329|3|1|mp.weixin.qq.com/weheat-agent/payload/record');
    const result = await Weixingongzhonghao.getGongZhongHaoArticleStatus(cookie, '100013770_3623085645');
    const ser=new Cloud.QueryWorker('',Platforms.WeiXinGongZhongHao, {
      platformAccountId:'12312ASD',
      platformAuthorId: 'SDFSDFAD',
      cookie: cookie,
      authorization: '',
      callBackData: {},
    });
    const re2=await ser.checkAuditStatus('123123','100000188_3623085645');
    console.log('获取微信用户信息', result,re2);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
