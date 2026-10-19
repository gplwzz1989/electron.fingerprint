import { describe, test } from 'vitest';
import { XiaHongShuProService } from '../../../src/media-platform/xiaohongshu/xiaohongshu-service';
import { Task } from '../../../src/utils';
import { EventEmitter } from 'events';
import { DataSyncTaskItem, Platforms, SyncEventName } from '../../../src/service/datasync-service-manager';
import { Xiaohongshu } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'a1=1993ceace54dfu3npu5atbgxpy6cqxnelzud853z950000285482; webId=3b37b5e5a1032e9aec95aa0be72b7d53; x-user-id-ark.xiaohongshu.com=605418e20000000001008a3e; customerClientId=746042430884954; gid=yjjqSdfyK21fyjjqSd0Sdu2q24fi7qIU72097ujDkCUvKf28SACIdY888JY24YJ8W4YS8D2i; abRequestId=3b37b5e5a1032e9aec95aa0be72b7d53; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517576825843684933640hd8t99snmnv9dnku; galaxy_creator_session_id=kRTovaSTxkDzqMs4RNb2zBfvRJo2nZaQhWq4; galaxy.creator.beaker.session.id=1764117238904081879065; web_session=0400697b5fc526e683df70d1033b4b0713763f; acw_tc=0a4269db17652652325601842e031db7fd03b96401ee38db0678470f8f80a2; customer-sso-sid=68c517581756577809743873yuqu32vuawh8cblk; x-user-id-pro.xiaohongshu.com=61b8073f000000001000c5c2; access-token-pro.xiaohongshu.com=customer.ares.AT-68c517581756577809711108cftxrze6pixve6gc; access-token-pro.beta.xiaohongshu.com=customer.ares.AT-68c517581756577809711108cftxrze6pixve6gc; loadts=1765265446764; xsecappid=pro-enterprise-next; websectiga=3633fe24d49c7dd0eb923edc8205740f10fdb18b25d424d2a2322c6196d2a4ad; sec_poison_id=eb1ad76b-7338-4ca2-a956-6f4527d6b965';
  test('小红书私信算法', async () => {
    const sign = new XiaHongShuProService('', [], new Map<string, string>()).AESECBEncrypt(
      'WAtUOAXrXUjMtSnQ',
      '6721f67d4e00000000000003',
    );
    console.log(sign);
  }, 10000000);

  test('获取小红书对话列表和私信列表', async () => {
    const r = await Xiaohongshu.Pro.getXiaoHongShuProMessageConversationList(cookie);
    console.log(JSON.stringify(r, null, 2));
  }, 10000000);

  test('小红书发发送文字私信', async () => {
    const re = await Xiaohongshu.Pro.sendXiaohongshuProMessage(
      cookie,
      '5b7b6eb42352610001dcd389',
      'TEXT',
      '我是文字消息啊，收到了么',
    );
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);
  test('小红书发发送文字私信带表情', async () => {
    const re = await Xiaohongshu.Pro.sendXiaohongshuProMessage(
      cookie,
      '5b7b6eb42352610001dcd389',
      'TEXT',
      '我是表情消息啊，[哭惹R]收到了么',
    );
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);

  test('小红书发发送笔记消息', async () => {
    const re = await Xiaohongshu.Pro.sendXiaohongshuProMessage(
      cookie,
      '5b7b6eb42352610001dcd389',
      'note',
      '6790b3e80000000029035b47',
    );
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);

  test('小红书发发送图片消息', async () => {
    const re = await Xiaohongshu.Pro.sendXiaohongshuProMessage(
      cookie,
      '5b7b6eb42352610001dcd389',
      'IMAGE',
      '6790b3e80000000029035b47',
      { pathOrUrl: 'G:\\download\\20241112-144914.jpg' },
    );
    console.log(JSON.stringify(re, null, 2));
  }, 10000000);

  test('小红书实时接受私信', async () => {
    const cookielist = [
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1796801446,
        hostOnly: false,
        httpOnly: false,
        name: 'loadts',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '1765265446764',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1799825263.271104,
        hostOnly: false,
        httpOnly: true,
        name: 'x-user-id-pro.xiaohongshu.com',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '61b8073f000000001000c5c2',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1793601242.145227,
        hostOnly: false,
        httpOnly: true,
        name: 'x-user-id-ark.xiaohongshu.com',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '605418e20000000001008a3e',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1796801968,
        hostOnly: false,
        httpOnly: false,
        name: 'xsecappid',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: 'pro-enterprise-next',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1798677237.567697,
        hostOnly: false,
        httpOnly: true,
        name: 'x-user-id-creator.xiaohongshu.com',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '5b7b6eb42352610001dcd389',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1765526381,
        hostOnly: false,
        httpOnly: false,
        name: 'websectiga',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '2845367ec3848418062e761c09db7caf0e8b79d132ccdd1a4f8e64a11d0cac0d',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1766709237.567803,
        hostOnly: false,
        httpOnly: true,
        name: 'galaxy_creator_session_id',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: 'kRTovaSTxkDzqMs4RNb2zBfvRJo2nZaQhWq4',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1766709237.567842,
        hostOnly: false,
        httpOnly: true,
        name: 'galaxy.creator.beaker.session.id',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '1764117238904081879065',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1765267786,
        hostOnly: false,
        httpOnly: false,
        name: 'sec_poison_id',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: 'ddce463b-c10d-4120-9f6e-94a88f7ec900',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1765870063.648221,
        hostOnly: false,
        httpOnly: true,
        name: 'access-token-pro.xiaohongshu.com',
        path: '/',
        sameSite: null,
        secure: true,
        session: false,
        storeId: null,
        value: 'customer.ares.AT-68c517581756577809711108cftxrze6pixve6gc',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1796721817.800093,
        hostOnly: false,
        httpOnly: true,
        name: 'web_session',
        path: '/',
        sameSite: null,
        secure: true,
        session: false,
        storeId: null,
        value: '0400697b5fc526e683df70d1033b4b0713763f',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1799825972.3366,
        hostOnly: false,
        httpOnly: false,
        name: 'gid',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: 'yjjqSdfyK21fyjjqSd0Sdu2q24fi7qIU72097ujDkCUvKf28SACIdY888JY24YJ8W4YS8D2i',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1789199645,
        hostOnly: false,
        httpOnly: false,
        name: 'a1',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '1993ceace54dfu3npu5atbgxpy6cqxnelzud853z950000285482',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1792582832.033091,
        hostOnly: false,
        httpOnly: false,
        name: 'abRequestId',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '3b37b5e5a1032e9aec95aa0be72b7d53',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1766709236.567764,
        hostOnly: false,
        httpOnly: true,
        name: 'access-token-creator.xiaohongshu.com',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: 'customer.creator.AT-68c517576825843684933640hd8t99snmnv9dnku',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1765870063.648316,
        hostOnly: false,
        httpOnly: true,
        name: 'access-token-pro.beta.xiaohongshu.com',
        path: '/',
        sameSite: null,
        secure: true,
        session: false,
        storeId: null,
        value: 'customer.ares.AT-68c517581756577809711108cftxrze6pixve6gc',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1765870062.271007,
        hostOnly: false,
        httpOnly: true,
        name: 'customer-sso-sid',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '68c517581756577809743873yuqu32vuawh8cblk',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1792223734.383667,
        hostOnly: false,
        httpOnly: true,
        name: 'customerClientId',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '746042430884954',
      },
      {
        domain: '.xiaohongshu.com',
        expirationDate: 1789199645,
        hostOnly: false,
        httpOnly: false,
        name: 'webId',
        path: '/',
        sameSite: null,
        secure: false,
        session: false,
        storeId: null,
        value: '3b37b5e5a1032e9aec95aa0be72b7d53',
      },
    ];
    const worker = new XiaHongShuProService('qweqweqweqw', cookielist, new Map<string, string>());
    worker.init();
    worker.DataEvent.on(SyncEventName.msg_data_back, (data) => {
      console.log(JSON.stringify(data, null, 2));
    });
    await Task.Delay(1000000000);
  }, 10000000);
});
