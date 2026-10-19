import { describe, expect, test } from 'vitest';
import {
  getDataOverviewAsync,
  getSingleDataOverviewAsync,
} from '@/media-platform/kuaishou/kuaishou-data-overview.service';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { Kuaishou } from '../../../src';
import { DataSyncTaskItem } from '../../../src/service/datasync-service-manager';
import { EventEmitter } from 'events';
import { convertCookieStr } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  test('获取快手数据概览列表', async () => {
    const cookie =
      convertCookieStr('[{"name":"did","value":"web_76cb5d66592d27e187a5ba6bafe5eba4834b","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1821257899.333757,"sameSite":"no_restriction"},{"name":"bUserId","value":"1000014263814","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1787993943.951122,"sameSite":"no_restriction"},{"name":"userId","value":"47445000","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1787993943.951094,"sameSite":"no_restriction"},{"name":"kuaishou.web.cp.api_st","value":"ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABZh42rnRc0vi40lKF99SEa9wH06nXmKF7L3DSQ-4ePe-JUJNdIfSuCENHPVExC8tIhmWhUeuahD9n33ZuqrRqs_fE56q8DfOIl6RO55cDv0WseAonnDY5X21NtuvkB31cfIU2D-abQKo0c4iGbRQrqG9r7ZiQwZErhd-RVh6Yz4bHQbknxjl5TvtiVrjT8OgfTMkQVcAblKVwHm1GIq_5pjd0JDWe2dWS2SL-vRDwfLIaEp8Sk2LkGUVizOftibzVab_iqyIgarm6un6vDZ_hV8N41M_ePywyyYS8yGQR33wSIq-x8yQoBTAB","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787993943.951135,"sameSite":"no_restriction"},{"name":"kuaishou.web.cp.api_ph","value":"85f9d3ac11dea3089a61b2f13afc625d3293","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1787993943.951147,"sameSite":"unspecified"}]');

    const result = await Kuaishou.getKuaishouDataOverview(cookie, 2);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取快手单篇数据', async () => {
    const cookie =
      'did=web_53bef0bafe5bc1e05761708bbd3bcdb4; soft_did=1619580708547; userId=1184063221; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0EqABro1yBm9jLjOZ8g9UHavMwBG2jUhwl_AtqYYnRGTMMIr3xg4Klbv_Gs_GD2GGOWf6T_jcihREci_pbljHJHdeV7unan1DL1UNZ6shVB1VbwSu-eF_vDeIi2GfLm8z3aSrBj9v41oLXiGqvJG7Bu3bFhwqpDXOc8wOpm5N1u01Es6oJNjt-FywB1b5X6BhRgd5a0wTmSuGJ4CJBbQvq6R9jRoSnxKTYuQZRWLM5-2JvNVpv-KrIiCxcukyJfBU_3PnetkX5Ngmj9ImpO60GKe3AmuiiUpWgCgFMAE; kuaishou.web.cp.api_ph=5a5fc0d664f00d0a090f45b9096ef4d1cc72';

    const result = await getSingleDataOverviewAsync(cookie, '3xkunw6yxczsdwm', 1);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.result).toBe(1);
  }, 10000000);

  test('获取快手评论数据', async () => {
    const cookie =
      '_did=web_9040166978446A1C; userId=47445000; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABpB643jqZzNiNmCIjDVUosfh8H36mdOGP2gxYXn0LxcDAfnIdbFxYAnaNUAGo2Lr5CFLN_eHjEybVA85WHBHZotaiqRppIl-z-SZcfitFg8BKXXcSlz7a464KEP7VMsZP0f7ayOUzSAXMFXYkmVye7gP0A-bQEQxe1nTUY6EEK1LJ334VlHVIKvaY-NDuCApfVuQv0DNeRE9Vk6uOXvAlXGnjnHu5al6SXkVPDYhsJC0aEmyq_OYDEGWlx5BhBFmCK8sWsSIg9rAPDpf6P2UKbMrh8yY3a0lfLolQUqnJpXSuOsiavkUoBTAB; kuaishou.web.cp.api_ph=46322cfce58460ff957c309123f3eedf234a; did=web_1d9469af7db2a2083bfd0c7069dd5e8cb310';

    const task: DataSyncTaskItem = {
      accountCookieStr: cookie,
      maxPage: 6,
      textMinDateTime: new Date('2024-11-01'),
    };
    const dataEvent = new EventEmitter();
    dataEvent.on('data_back_content', (data) => {
      console.debug('内容', data);
    });
    dataEvent.on('data_back_comment', (data) => {
      console.debug('评论', data);
    });
    const proEvent = new EventEmitter();
    const result = await Kuaishou.getKuaiShouComment(task, dataEvent, proEvent);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('快手添加评论', async () => {
    const cookie =
      '_did=web_9040166978446A1C; userId=47445000; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABpB643jqZzNiNmCIjDVUosfh8H36mdOGP2gxYXn0LxcDAfnIdbFxYAnaNUAGo2Lr5CFLN_eHjEybVA85WHBHZotaiqRppIl-z-SZcfitFg8BKXXcSlz7a464KEP7VMsZP0f7ayOUzSAXMFXYkmVye7gP0A-bQEQxe1nTUY6EEK1LJ334VlHVIKvaY-NDuCApfVuQv0DNeRE9Vk6uOXvAlXGnjnHu5al6SXkVPDYhsJC0aEmyq_OYDEGWlx5BhBFmCK8sWsSIg9rAPDpf6P2UKbMrh8yY3a0lfLolQUqnJpXSuOsiavkUoBTAB; kuaishou.web.cp.api_ph=46322cfce58460ff957c309123f3eedf234a; did=web_1d9469af7db2a2083bfd0c7069dd5e8cb310';

    const result = await Kuaishou.addKuaishouComment(cookie, '我来看下看', '3xnnrk5y2km7bdm');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('快手删除评论', async () => {
    const cookie =
      '_did=web_9040166978446A1C; userId=47445000; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABpB643jqZzNiNmCIjDVUosfh8H36mdOGP2gxYXn0LxcDAfnIdbFxYAnaNUAGo2Lr5CFLN_eHjEybVA85WHBHZotaiqRppIl-z-SZcfitFg8BKXXcSlz7a464KEP7VMsZP0f7ayOUzSAXMFXYkmVye7gP0A-bQEQxe1nTUY6EEK1LJ334VlHVIKvaY-NDuCApfVuQv0DNeRE9Vk6uOXvAlXGnjnHu5al6SXkVPDYhsJC0aEmyq_OYDEGWlx5BhBFmCK8sWsSIg9rAPDpf6P2UKbMrh8yY3a0lfLolQUqnJpXSuOsiavkUoBTAB; kuaishou.web.cp.api_ph=46322cfce58460ff957c309123f3eedf234a; did=web_1d9469af7db2a2083bfd0c7069dd5e8cb310';

    const result = await Kuaishou.delKuaishouComment(cookie, '3xnnrk5y2km7bdm', 921924843022);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  //commentId=921925159364
  test('快手置顶评论', async () => {
    const cookie =
      '_did=web_9040166978446A1C; userId=47445000; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABpB643jqZzNiNmCIjDVUosfh8H36mdOGP2gxYXn0LxcDAfnIdbFxYAnaNUAGo2Lr5CFLN_eHjEybVA85WHBHZotaiqRppIl-z-SZcfitFg8BKXXcSlz7a464KEP7VMsZP0f7ayOUzSAXMFXYkmVye7gP0A-bQEQxe1nTUY6EEK1LJ334VlHVIKvaY-NDuCApfVuQv0DNeRE9Vk6uOXvAlXGnjnHu5al6SXkVPDYhsJC0aEmyq_OYDEGWlx5BhBFmCK8sWsSIg9rAPDpf6P2UKbMrh8yY3a0lfLolQUqnJpXSuOsiavkUoBTAB; kuaishou.web.cp.api_ph=46322cfce58460ff957c309123f3eedf234a; did=web_1d9469af7db2a2083bfd0c7069dd5e8cb310';

    const result = await Kuaishou.setKuaishouCommentTop(cookie, '3xnnrk5y2km7bdm', 921925159364);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('快手取消评论置顶', async () => {
    const cookie =
      '_did=web_9040166978446A1C; userId=47445000; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABpB643jqZzNiNmCIjDVUosfh8H36mdOGP2gxYXn0LxcDAfnIdbFxYAnaNUAGo2Lr5CFLN_eHjEybVA85WHBHZotaiqRppIl-z-SZcfitFg8BKXXcSlz7a464KEP7VMsZP0f7ayOUzSAXMFXYkmVye7gP0A-bQEQxe1nTUY6EEK1LJ334VlHVIKvaY-NDuCApfVuQv0DNeRE9Vk6uOXvAlXGnjnHu5al6SXkVPDYhsJC0aEmyq_OYDEGWlx5BhBFmCK8sWsSIg9rAPDpf6P2UKbMrh8yY3a0lfLolQUqnJpXSuOsiavkUoBTAB; kuaishou.web.cp.api_ph=46322cfce58460ff957c309123f3eedf234a; did=web_1d9469af7db2a2083bfd0c7069dd5e8cb310';

    const result = await Kuaishou.cancelKuaishouCommentTop(cookie, '3xnnrk5y2km7bdm', 921925159364);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
