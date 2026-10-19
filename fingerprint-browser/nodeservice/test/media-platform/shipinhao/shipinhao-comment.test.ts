import { describe, expect, test } from 'vitest';
import { Platforms, Shipinhao } from '../../../src';
import { DataSyncTaskItem, SyncEventName } from '../../../src/service/datasync-service-manager';
import { EventEmitter } from 'events';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'qq_domain_video_guid_verify=18c1f9591ade489b; _qimei_uuid42=1981d12002c10041c1f1e18d1de62ccaf4461d23c2; _qimei_i_3=5fea4d819d5b57d9c1c5f6310f8c75b6f3edf7a2400850d1b0882e5f739a2169686b35943989e2bbb082; RK=W6c80Ydbab; ptcz=44037b88a68371d74a6db0c9aa64e6e03f92ec6f975add7fa43e64f8d60add87; vdevice_h38=8f95bee2c1f1e18d1de62cca02000009e1981d; vdevice_h42=1981d12002c10041c1f1e18d1de62ccaf4461d23c2; vqq_next_refresh_time=7200; qq_nick=%E7%8E%8B%E8%80%85%E4%BD%93%E9%AA%8C%E6%9C%8D; qq_head=https%3A%2F%2Ftvpic.gtimg.cn%2Fhead%2F13ac287746010364e3279f71daa8a54cda39a3ee5e6b4b0d3255bfef95601890afd80709%2F344; vcuid=9015271708; vqq_login_time_init=1756461692; _vcuid_debug="2025-08-29 18:01:33.199719272 +0800 CST m=+788932.949479715"; yyb_muid=18679C03B2BD687B08258981B3FE69E5; pgv_pvid=207251925; omgid=0_Xy9H2CEpHj3zY; pac_uid=0_Tf0E8zEQNSRGk; _qimei_q32=3e562e31ed79f64ab6a994f4f200a294; _qimei_q36=00298d65e53eef81a1937da330001581911c; _qimei_fingerprint=7ac54314555b80d3430d979145736ea0; _qimei_h38=fdedb0465d5d2f6bb61342450200000911951d; _qimei_i_2=67f16f82955859d39591fb655e8726b5a1e6a5a013520085e0de2b5b2693206d646b369c3988b19dd4fd; _qimei_i_1=67cc2cd4c10f0489c193f8350f8127e2a1e8f6a3145a0086b68b2d582493206c61633e943980e7dd82b7a0db; sessionid=BgAA5GUXKR2zwXvGHf1XDYHLCMG2aDqq1oxon7MVZX9fazb9jIHTSc8Fdea4zt9YfWr9SfoSqpojTHa9T4Bi6HoF2hR6jflsU099mu08sRcS; wxuin=2051703235';

  test('获取视频号评论列表', async () => {
    const taskIte: DataSyncTaskItem = {
      platformName: Platforms.ShiPinHao,
      accountId: '123123123',
      accountCookieStr: cookie,
      syncType: 'Comment',
      taskId: '123',
      textMinDateTime: new Date('2025-1-2'),
      maxPage: 10,
    };

    const dataCallBack = new EventEmitter();
    const taskCallBack = new EventEmitter();

    dataCallBack.on(SyncEventName.comment_data_back, (data) => {
      console.log('评论', JSON.stringify(data, null, 2));
    });

    dataCallBack.on(SyncEventName.content_data_back, (data) => {
      console.log('作品', JSON.stringify(data, null, 2));
    });

    await Shipinhao.getShipinhaoComment(taskIte, dataCallBack, taskCallBack);
    // assets
    expect(1).not.toBeUndefined();
  }, 10000000);

  test('获取视频号评论作品', async () => {
    const result = await Shipinhao.getShiPinHaoCommentContent(cookie, '3', '123', '', PubContentEnum.video);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取视频号作品评论', async () => {
    const result = await Shipinhao.getShiPinHaoCommentByContent(cookie, 'export/UzFfAgtgekIEAQAAAAAAHNMsWylzNgAAAAstQy6ubaLX4KHWvLEZgBPExIEoZFA5MsaGzNPgMJol8TjEwdrJPkrOtNKMSgD_', '14215861825857788171', '', '');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('添加视频号作品评论', async () => {
    const result = await Shipinhao.addShipinhaoComment(
      cookie,
      '',
      '我来啦',
      'export/UzFfAgtgekIEAQAAAAAAhaMyI_xnHwAAAAstQy6ubaLX4KHWvLEZgBPEu4N4PxElDf6JzNPgMJoQyJ4bUQhNk0W4G-kbHfY8',
      '',
    );
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  //commentId=14586408031510927814

  test('回复视频号一级评论', async () => {
    const result = await Shipinhao.addShipinhaoComment(
      cookie,
      '',
      '我来啦回复',
      'export/UzFfAgtgekIEAQAAAAAAhaMyI_xnHwAAAAstQy6ubaLX4KHWvLEZgBPEu4N4PxElDf6JzNPgMJoQyJ4bUQhNk0W4G-kbHfY8',
      '14586408031510927814',
    );
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  //14586408918245120486
  test('回复视频号二级评论', async () => {
    const result = await Shipinhao.addShipinhaoComment(
      cookie,
      '',
      '我来啦回复2',
      'export/UzFfAgtgekIEAQAAAAAAhaMyI_xnHwAAAAstQy6ubaLX4KHWvLEZgBPEu4N4PxElDf6JzNPgMJoQyJ4bUQhNk0W4G-kbHfY8',
      '14586408918245120486',
      '14586408031510927814',
    );
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('删除视频号评论', async () => {
    const result = await Shipinhao.delShipinhaoComment(
      cookie,
      '',
      'export/UzFfAgtgekIEAQAAAAAAhaMyI_xnHwAAAAstQy6ubaLX4KHWvLEZgBPEu4N4PxElDf6JzNPgMJoQyJ4bUQhNk0W4G-kbHfY8',
      '14586413898780318173',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('置顶视频号评论', async () => {
    const result = await Shipinhao.setTopShipinhaoCommentTop(
      cookie,
      '',
      'export/UzFfAgtgekIEAQAAAAAAhaMyI_xnHwAAAAstQy6ubaLX4KHWvLEZgBPEu4N4PxElDf6JzNPgMJoQyJ4bUQhNk0W4G-kbHfY8',
      '14586408031510927814',
    );
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
