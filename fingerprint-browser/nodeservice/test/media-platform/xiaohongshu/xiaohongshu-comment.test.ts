import { describe, expect, test } from 'vitest';
import { Platforms, Xiaohongshu } from '../../../src';
import { DataSyncTaskItem, SyncEventName } from '../../../src/service/datasync-service-manager';
import { EventEmitter } from 'events';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    ' a1=1944f2ba6c3nfdv555rrfj1kax66bgkeqtqcfo0gg50000100874; webId=d960fc633b403e63b4348d93a6a2357c; gid=yjqdqJKJyKMfyjqdqJKyjdvFiqy170lYMjVU6lC7qCCVE928F2hS1S888yjjYYJ84Yyf4qqD; abRequestId=8d35b6ac2d45bb986d6a13305117cb96; customer-sso-sid=68c517457728887517072479a7e34de650e36235; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=750204832340568; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517457728891812039776bsdoggrgslzpz96h; galaxy_creator_session_id=WnrHE3rCTbAx128YnhrzYf2SANU0P0xYHF5k; galaxy.creator.beaker.session.id=1736387818075007109760; web_session=0400697b5fc526e683dfd4a3b5354bb05d1b91; webBuild=4.54.0; xsecappid=xhs-pc-web; unread={%22ub%22:%2267825424000000001a036820%22%2C%22ue%22:%22677e456a000000000b037b4a%22%2C%22uc%22:29}; websectiga=cffd9dcea65962b05ab048ac76962acee933d26157113bb213105a116241fa6c; sec_poison_id=17a7a8ab-ac59-4ded-aac9-9f8bff10e42a';

  test('获取小红书评论列表', async () => {
    const taskIte: DataSyncTaskItem = {
      platformName: Platforms.XiaoHongShu,
      accountId: '123123123',
      accountCookieStr: cookie,
      syncType: 'Comment',
      taskId: '123',
      textMinDateTime: new Date('2024-1-2'),
      maxPage: 10,
    };

    const dataCallBack = new EventEmitter();
    const taskCallBack = new EventEmitter();

    dataCallBack.on(SyncEventName.comment_data_back, (data) => {
      console.log(JSON.stringify(data, null, 2));
    });

    await Xiaohongshu.getXiaohongshuComment(taskIte, dataCallBack, taskCallBack);
    // assets
    expect(1).not.toBeUndefined();
  }, 10000000);

  test('添加小红书评论', async () => {
    const result = await Xiaohongshu.addXiaohongshuComment(cookie, '我来啦', '6729da8f000000001901583c', '');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('删除小红书评论', async () => {
    const result = await Xiaohongshu.delXiaohongshuComment(
      cookie,
      '6729da8f000000001901583c',
      '6784d89300000000180274d7',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
