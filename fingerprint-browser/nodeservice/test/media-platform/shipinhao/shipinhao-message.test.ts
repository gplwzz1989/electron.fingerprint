import { describe, test } from 'vitest';
import { Task } from '../../../src/utils';
import { Platforms, SyncEventName } from '../../../src/service/datasync-service-manager';
import { Shipinhao } from '../../../src';
import { ShiPinHaoService } from '../../../src/media-platform/shipinhao/shipinhao.service';
import { ShiPinHaoWorker } from '../../../src/cloud/task/platform/shipinhaoworker';
import { MessageWorkerService } from '../../../src/cloud/task/message_worker_service';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'RK=1SZWEGgB9o; ptcz=fba647bd29e0e9a6711e5e15cda1fd2254e6ef4685b5e035c21f34fc8b1e0a0a; omgid=0_Xy9H2CEpHj3zY; pac_uid=0_Aiy2xtMAZYFkw; _qimei_q32=3e562e31ed79f64ab6a994f4f200a294; _qimei_q36=00298d65e53eef81a1937da330001581911c; _qimei_fingerprint=f7a580be2e1f41081e36d3bbceb7a7e7; _qimei_uuid42=1a4080a0814100c6c7905066a5007e09b9174a7ed2; _qimei_h38=fdedb0465d5d2f6bb61342450200000911951d; sessionid=BgAAmWA%2FE6IUEaG8PqVqwQXsV%2BhMkO8YY7aFc5691z%2F6Pfh9%2FrNgfdQWEMV6KlyYG7pgRM%2BZW%2FBBh1mwgfyAdAGsZ7V74QxWSgMBErL7QPSG; wxuin=1011820098';

  test('获取视频号新消息', async () => {
    const re = await Shipinhao.getShiPinHaoNewMessageList(cookie, 'CgcIARC3BBgACgYIBRAAGAA=');
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);
  test('运行视频号私信监听', async () => {
   const woker=new MessageWorkerService(Platforms.ShiPinHao, {"platformAuthorId":"","cookie":"sessionid=BgAAevjBMnAZS%2BYogEbUeZAxeasJr3ODUl%2BvAPrffaX%2BY3zCQnXlNM%2FXsYgQJ3OOtf42o5TF3PbgcDpKIF4s0KbzU0aQL5h5XhGL4uNhdFhQ; wxuin=2456215601"})
   await woker.startGetMessage(10);
   await Task.Delay(1000000);
  }, 10000000);

  test('获取视频号对话', async () => {
    const re = await Shipinhao.getShiPinHaoMessageConversationList(cookie);
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);
  test('获取视频号历史消息', async () => {
    const re = await Shipinhao.getShiPinHaoNewMessageList(cookie);
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);
  test('获取视频消息中的图片', async () => {
    const mediaParams = {
      _log_finder_id: 'v2_060000231003b20faec8cae28e19c7dcce00ea32b0772576bf3a50931c4c14362e31bb701fd5@finder',
      imgMsg: {
        aeskey: 'ed8b53aa64fc0f918eeef822b8a448b1',
        url: '3057020100044b304902010002041db379f002032df98a02048a055f70020469e58af4042431663436636437382d663664372d343331662d396134302d316537636162366530356164020405150a020201000405004c4e6200',
      },
      rawContent:
        '<?xml version="1.0"?>\n<msg>\n\t<img aeskey="ed8b53aa64fc0f918eeef822b8a448b1" encryver="1" cdnthumbaeskey="ed8b53aa64fc0f918eeef822b8a448b1" cdnthumburl="3057020100044b304902010002041db379f002032df98a02048a055f70020469e58af4042431663436636437382d663664372d343331662d396134302d316537636162366530356164020405150a020201000405004c4e6200" cdnthumblength="11927" cdnthumbheight="210" cdnthumbwidth="118" cdnmidheight="0" cdnmidwidth="0" cdnhdheight="0" cdnhdwidth="0" cdnmidimgurl="3057020100044b304902010002041db379f002032df98a02048a055f70020469e58af4042431663436636437382d663664372d343331662d396134302d316537636162366530356164020405150a020201000405004c4e6200" length="46622" md5="5dbdc0c510ba947cecff647209de9d63" hevc_mid_size="46622" />\n\t<platform_signature></platform_signature>\n\t<imgdatahash></imgdatahash>\n</msg>\n',
      timestamp: 1776650996,
    };
    const re = await Shipinhao.parseShipinhaoMessageImageResponse(cookie, '', mediaParams);
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);

  test('获取视频消息中的图片2', async () => {
    const mediaParams = {
      "_log_finder_id": "v2_060000231003b20faec8cae28e19c7dcce00ea32b0772576bf3a50931c4c14362e31bb701fd5@finder",
      "imgMsg": {
        "aeskey": "7a627168646161676362716b6f736e68",
        "url": "3057020100044b3049020100020449bb719a02033d11fe02046fd0533b020469e98743042466313362633132372d393935652d343238612d383938662d3932653331303766326535630204052428010201000405004c57c200cb4d1df9"
      },
      "rawContent": "",
      "timestamp": 1776912196
    };
    const worker = new ShiPinHaoWorker(cookie, undefined, undefined);
    const re = await worker.parseMessageMedia({ mediaParams });
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);

  test('视频号发发送文字表情消息', async () => {
    const re = await Shipinhao.sendShipinhaoMessage(
      cookie,
      'v2_060000231003b20faec8cae28e19c7dcce00ea32b0772576bf3a50931c4c14362e31bb701fd5@finder',
      'fv1_c632eab9fe8093350888bb10192f3a6dd1fcbd3d031773274df2b35d3813aa57@findermsgstranger',
      'c632eab9fe8093350888bb10192f3a6dd1fcbd3d031773274df2b35d3813aa57@findermsg',
      'IMAGE',
      '搞笑[大笑]',
      { pathOrUrl: 'I:\\download\\20241112-144914.jpg' },
    );
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);

  test('视频号实时接受私信', async () => {
    const cookielist = [
      {
        domain: 'channels.weixin.qq.com',
        expirationDate: 1774321161.574355,
        hostOnly: true,
        httpOnly: false,
        name: 'wxuin',
        path: '/',
        sameSite: 'no_restriction',
        secure: true,
        session: false,
        storeId: null,
        value: '846567093',
      },
      {
        domain: 'channels.weixin.qq.com',
        expirationDate: 1774321161.574032,
        hostOnly: true,
        httpOnly: false,
        name: 'sessionid',
        path: '/',
        sameSite: 'no_restriction',
        secure: true,
        session: false,
        storeId: null,
        value:
          'BgAAwN94s9g0pTBedBWOwih%2FhM37htG%2BisXjVVPQijz%2FrteGiEtSF52QdY%2B0uhs%2BY%2BGMqd1edL63HvO8%2FgJdJxxRu8hMZXXEZVPcdagthz%2Fp',
      },
    ];
    const worker = new ShiPinHaoService('qweqweqweqw', 0, cookielist, new Map<string, string>());
    worker.DataEvent.on(SyncEventName.msg_data_back, (data) => {
      console.log(JSON.stringify(data, null, 2));
    });
    worker.DataEvent.on(SyncEventName.msgUser_data_back, (data) => {
      console.log(JSON.stringify(data, null, 2));
    });
    await Task.Delay(1000000000);
  }, 10000000);
});
