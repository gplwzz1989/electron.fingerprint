import { describe, expect, test } from 'vitest';
import { Cloud, Platforms } from '../../../src';
import { EventEmitter } from 'events';
import { YiCheHaoVideoTaskInput } from '../../../src/media-platform/yichehao/yichehao-video';
import { YiCheHao } from '../../../src/media-platform/yichehao';
import { Task } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'CIGUID=92b1eea5-7a54-49ea-9ad6-d399712b438c; auto_id=c72a717c44b438d9a2347164625c9df6; HMACCOUNT=E4EB07134388DAAE; suid=k53b7oazn9qopbaelh2tkxcfajscwksx; Hm_lvt_610fee5a506c80c9e1a46aa9a2de2e44=1781143581; Hm_lpvt_610fee5a506c80c9e1a46aa9a2de2e44=1781143581; .ASPXAUTH=FBFCDC520AB1CDF9BB76BBA68F7EC3FD804C680FA09E891C352A76E24C08CE47E7DC8EE2A0801FE091B8A511664513DACBFC07FAFBE3793F58BA0161C074D7D14ECD68CCDD65D2CF7A293488F97E6F3360A252C36F9EBEE2E48E0D8029F721520B83F19B7728AF9DB4FA2A9109AAF8A4C90902AD41D29448913F357EF737B27221905315C4B26709B9F5298D6AF4C794A61CE42D1EFB4BF46BD480367B83C01D8537BBEF4970627D020FE795647AA7E0183E3DDB; userid=269295647; username=%E4%BC%98%E7%A7%80%E7%9A%84%E8%8A%B1%E6%A4%92%E6%A0%911312; UserGuid=b0a14501-6a79-4d6f-ad77-d79e7a9f3b97';
  test('易车号视频视视频发布', async () => {
    const taskData: YiCheHaoVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\1742382013268喜不喜欢？短短十秒的视频冒雨下水用两个小时拍摄.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      },
      verticalCover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1080,
        height: 1920,
      },
      title: '开车的时候，要懂得欣赏风景',
      desc: '<p>风景好了开车也好了</p><p><topic>#搞笑</topic></p>',
      isOriginal:0,
      //publishTime: new Date('2025-8-28').getTime(),
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await YiCheHao.publishVideo(cookie, taskData, eventCall);

    console.log('易车号号视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('易车号视频视频删除', async () => {
    const result = await YiCheHao.deleteYiCheHaoContent(cookie, '113516623');

    console.log('易车号视频视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('易车号视频视频状态', async () => {
    const result = await YiCheHao.getYiCheHaoMediaStatus(cookie, '11622900');

    console.log('易车号视频状态：', JSON.stringify(result, null, 2));
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
              taskId: '68d535b1c99a12ba50559ba4',
              publishData: {
                video: {
                  duration: 233.593,
                  width: 1280,
                  height: 720,
                  size: 36131101,
                  url: 'https://oss.yixiaoer.cn/2d452b626f893e529f7df5a056a908a4/68d68731/yfb/test/t-6821ac8d50bc5fd636fa9801/ctxtaop2kig0jzc3stayt',
                  localPath: '',
                },
                covers: [
                  {
                    width: 1280,
                    height: 720,
                    size: 68132,
                    pathOrUrl:
                      'https://oss.yixiaoer.cn/d511a334d0e9696b3676b2d94c38fe12/68d68731/yfb/test/t-6821ac8d50bc5fd636fa9801/9spuucafnwfhzdv87f3tp',
                    format: '',
                  },
                ],
                title: '瓜子的，大就哈阿萨德',
                desc: '<p>阿萨德阿萨德，描述不少于10个字？</p>',
                prePubTime: 0,
              },
              authorInfo: {
                id: 'cmfv0y2us001fj00jm90iihe2',
                platform: '',
                cookie: '',
                authorId: '',
              },
            },
          ],
          publishChannel: 'cloud',
          platform: [
            {
              id: 'cmfv0y2us001fj00jm90iihe2',
              platformCode: Platforms.YiCheHao,
              platformAvatar: '',
              platformUserId: '269295647',
              platformUserName: '优秀的花椒树1312',
              platformCookie:
                '[{"name":"CIGDCID","value":"WsWMHyPNYAKwki6kNdxkYnCRJ8BAnzXR","domain":".yiche.com","hostOnly":false,"path":"/issue/smallvideo","secure":false,"httpOnly":false,"session":false,"expirationDate":1766477582,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"E4EB07134388DAAE","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1793099338.562199,"sameSite":"no_restriction"},{"name":".ASPXAUTH","value":"B0B58FB56B2A83FCF0A8C19CEECCF9737A2C5776DCF85A35E4E7D8D1A94F2976096832F87EE24FEF891583C73932D3257AA0C0B4452394F48EFF3B93718A13506D83B8CDBA5FA347CBC1E64E83231DD7D83227E47F2D71A690788C76F0DD12A26C03572F3DE51244FFF6C7656B5CBA40DDBC38F9DAC3C69EF734A9698CE9A2B87357350AFCA8501AEC0F1C2C6A22BDFAAD5CE87F0CA6F4FBA14343EF02EA93E8A9A3661F379C49AAD65DF17D4025BB435CBF527F","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1761131379.404024,"sameSite":"lax"},{"name":"userid","value":"269295647","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1761131379.40409,"sameSite":"unspecified"},{"name":"username","value":"%E4%BC%98%E7%A7%80%E7%9A%84%E8%8A%B1%E6%A4%92%E6%A0%911312","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761131379.404112,"sameSite":"unspecified"},{"name":"UserGuid","value":"92b1eea5-7a54-49ea-9ad6-d399712b438c","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761131379.404131,"sameSite":"unspecified"},{"name":"CIGUID","value":"92b1eea5-7a54-49ea-9ad6-d399712b438c","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1793099379.406186,"sameSite":"unspecified"},{"name":"isWebP","value":"true","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1758817674,"sameSite":"unspecified"},{"name":"locatecity","value":"510100","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1758846475.110784,"sameSite":"unspecified"},{"name":"bitauto_ipregion","value":"171.212.122.241%3A%E5%9B%9B%E5%B7%9D%E7%9C%81%E6%88%90%E9%83%BD%E5%B8%82%3B2501%2C%E6%88%90%E9%83%BD%E5%B8%82%2Cchengdu","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1758846474.765804,"sameSite":"unspecified"},{"name":"report-cookie-id","value":"837103252_1758803274913","domain":"baa.yiche.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"auto_id","value":"c72a717c44b438d9a2347164625c9df6","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1793363274.914385,"sameSite":"unspecified"},{"name":"Hm_lvt_610fee5a506c80c9e1a46aa9a2de2e44","value":"1758803275","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1790339275,"sameSite":"unspecified"},{"name":"Hm_lpvt_610fee5a506c80c9e1a46aa9a2de2e44","value":"1758803275","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"E4EB07134388DAAE","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"}]',
            },
          ],
          authorization: 'sess_13d4ac562d5fb429bc0606253e87d66dbd39e0c7cf2c269db27e7fa73825bded',
          clientId: '',
        },
        '123',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});
