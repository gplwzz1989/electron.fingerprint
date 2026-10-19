import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '../../mock/mock';
import $axios from 'axios';
import { douyinVideoService } from '../../../src/media-platform/douyin/douyin-video.service';
import { CancelToken, Cloud, Platforms, Zhihu, ZhiHuVideoTaskInput } from '../../../src';

import { EventEmitter } from 'events';
import { Task } from '../../../src/utils';


describe.runIf(true)('【真实测试发布】', () => {
  test('知乎视频发布', async () => {
    const cookie =
      '_zap=54217fd6-ddd8-4a89-9490-8aa4350d251f; _xsrf=87b918fa-5336-4690-a459-be8a9d9a11ef; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1785143767; HMACCOUNT=3CD5948BCA4A51FC; d_c0=c_aXC7fKqByPTtoQg7GEuLFVToSZhpX0Uxs=|1785143766; captcha_session_v2=2|1:0|10:1785143768|18:captcha_session_v2|88:Zm8xV1dQUHR5Y3NWZzJ0MTJiNk9ld0dOc3h3bGJISUpzWFJjdGFDQ01XT0NFSHRnWHVBMENkSDF1dXRQYUJFdQ==|4c6cbe32f2e69c463d7a5492ad6ab00b8a10ae6db27a81a042de509eec557976; DATE=1785143772567; __snaker__id=wkk8goModB7ALkfP; cmci9xde=U2FsdGVkX1/S0LnVo1gIL4d8b0kghGu50C6AOgw/weBloNmHyd2B8b1xkA87NGTZGlKVDZMOhOvpVeJ4Id2g/A==; pmck9xge=U2FsdGVkX1+q2DUqxAprfbCCgcHRok0VktF7Q+p6ch8=; crystal=U2FsdGVkX19fqvjRS3rt8DR34ymKmf7yWSywXppJ02E8OyexPadPpm3ZkKb1GpSoiBIeNu0Gyz0ND3RP6r4WRfJwCm2K+9YrzXps/W4y/xJFy7Auil6n6P98P3dc//qVexSHvRFZgb/HGuFndr12sseJ8BMA0COWsOnaSA92vRpqIsF6iTV5lACrnQ9JWoBJRqrcZ6ho5y4t4YaITnNFBTQ4ERyGCjApfPfJ0KnRlmQW0bQhnuoQryoMjMAT6D7C; assva6=U2FsdGVkX1+3cTxY0rIBnkyzmqgF8vQtTg2EA/DJFcs=; assva5=U2FsdGVkX1+p8qgRSaQUEfwuwrT+t/DxSb54mhDa1w3bINuDsHrnY0be7pJ8jYP7ZgRNNMWctLutllmDKGXMeg==; gdxidpyhxdE=0%5CmrS8lHvTWygxK8NGofTA%2FaS80s1w1N%2F8MekXKNoQgGS5zuRz75bTvceuB83Og3PsQ%2FHsIgrIS%5CNvmjwsyVy6%2BuZwuzatmtSa0GbVM2LW%2FIdsXaR0puuaEKmX6SPDhxQjB3fUA4ekzZAkzdxnUajSkgWEKqfGdqziOj5nDtQVqQPeEn%3A1785144673688; vmce9xdq=U2FsdGVkX19f5UQQN3hcGnjbt+fQlCz+hRs0Wkm9pOLmcTXuNnn4AOMxUO7gyUDHDG0aKJkix1Awnilt5ytHP5P+2cbe5iKUlJOtHaJ+0w2BchJSlmXX7JEN9XMNQ2UIxzrBXpHL2vNBDtgZfDB24eIdtmjV9OFBInvzOzscERE=; captcha_ticket_v2=2|1:0|10:1785143784|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfSjRJc25KLjFSSk5oZWxNYWN3cnczTmU0LkJZNEVZaFQ4cU9wVDJTeXNpVVBfaFNjQS5TUVRKYkhianNzVWVTTXVXWkNtSWQxbDZBWlkzM0lucCpfVUs5SEJZcTFmaFcyR3lhZGtjd2dxc1JVcnZVZUFpYypBT3ROTm9EaW4wMWVzNU0ya0JmbndZcCpRd2xXUW5EUEZCdnNjSnBSX3FrVnozVXV2YkZhdGEwcUdOdkdmTTBCcWJ6SVpoRm1QOV8yQzR0bTgwNjNCX3dDMDF6YTgzZmV3RU82Rk90TUg2ME92MzA2aTBNaE1qYUU5TXJodllqVnprNURGMjZjVjI0T3ptdlplcmZRaTJBWHNjMlE2YWszNVh4S296d0NKZ0d1Q0VtbnM4QVVPQ0hDWFFiX0tkTmNwdnAzenFIVEtTTFdrWVE2UXFEQ0tYZTVHcjM4aV9OX2NXNk8yOWJQbGI2dVJmTVhIektEXzVNeHdvSU5DUm5rS2pRMzRmVDlvTTk2SXBOQU80aGZTaEVfYzVsbXdDMG5KcGpQWVFSczUuYTBReVJlZlFtU0xxLkdTTjhzRTM0UFMxZEpROHBWR20qTlBmdll2clpOVUp3VmRKR3RHRVNGNlh6QnV0UEhheGVKd0dSaGxZMWFjV3l6KlpRKldNTWNweGw0UXVBZ3BKT3Y4RS5rbVg3N192X2lfMSJ9|b3a31fa0de61a8def01023c407be3c9b0f8e7a3e85972afae03763ce550cf002; SUBMIT_0=21930115-4c82-46b0-bb6c-73389c73ac24; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1786102984; BEC=9de1a923fbc880d97a5571e917aeb532; z_c0=2|1:0|10:1786102985|4:z_c0|92:Mi4xUE1IZlhBQUFBQUJ6OXBjTHQ4cW9IQ1lBQUFCZ0FsVk5fRzlVYXdEbVd4d29rZ3RvbVYtNzhyUjMyVHRmVUVtcFFR|cc0f6afbcfaa5d920a6c83aa9e7abb32009917fd2ea7fa1d7a2eb10a37e5a694; SESSIONID=gc4X4xBLWnWuOKlsgwnkaTFdMDaQDCEtzfjMgkjsiAk; JOID=U18VBU2rUJjPdl82EoNHgTbLkp8PyjSql0Uhc1j7OMi8ORNcZmaV66J3XjcUmRqnXZEzvp4tVcV-6pP9eiiaM0Q=; osd=Vl8XAUyuUJrLd1o2EIdGhDbJlp4KyjaulkAhcVz6Pci-PRJZZmSR6qd3XDMVnBqlWZA2vpwpVMB-6Jf8fyiYN0U=';
    //const authData = await getAuthKey(cookie);
    const cancelToken = new CancelToken();
    const params: ZhiHuVideoTaskInput = {
      pubType: 1,
      cancelToken: cancelToken,
      video: {
        localPath: 'I:\\download\\20250331-160650.mp4',
        size: 17876417,
        duration: 86,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250430-094815.jpg',
        width: 960,
        height: 720,
      },
      title: '我是标题啊2',
      desc: '<p>前方高能！令人百看不厌的的名场面！<topic text="动漫推荐">#动漫推荐</topic><topic text="名场面">#名场面</topic><topic text="动漫混剪">#动漫混剪</topic></p>',

      isOriginal: 0,
      activity: null,
      // topics: [
      //   {
      //     introduction: '',
      //     avatar_url: 'https://picx.zhimg.com/80/v2-40e779d5c5e6bcebda41e92d50594618_l.jpg?source=4e949a73',
      //     name: '悟空',
      //     url: 'https://www.zhihu.com/topic/20180996',
      //     type: 'topic',
      //     excerpt: '',
      //     id: '20180996',
      //   },
      // ],
      firstLevel: {
        id: 1000021,
        name: '动漫',
      },

      //postTime: new Date('2024-12-19').getTime() / 1000,
      taskId: '3a1466c6-4541-cd61-34e2-51ee5553b40d',
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    setTimeout(() => {
      //params.cancelToken.cancel();
      // try {
      //   params.cancelToken.throwIfCancelled('');
      // } catch (e) {
      //   console.log(e);
      // }
    }, 8000);
    const result = await Zhihu.publishVideo(cookie, params, eventCall);
    console.log('知乎视频上传结果：', result);
  }, 10000000);
});

describe.runIf(true)('【获取话题】', () => {
  test('知乎话题', async () => {
    const cookie =
      '_zap=317562d6-3186-418b-9006-4d951552400b; d_c0=AFDTGq4VvRePTlfhO6cJJGVPgcqHcyzfvYU=|1700606249; YD00517437729195%3AWM_NI=%2BV0MKrPe%2BG3VGqyWI0JNiv4fM97QXC7%2BWnA5pfFbnP9WGoIlSD3aH6km%2B4Uf8KFhoQDss5VsufGONOa1JfarisTmlXsoGyidoi6cVFDTdEldNQRphx7FsyC4OTG9R4y%2Fa3I%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6ee93ec3d938997a3c944919a8fa2d44e979a9e83d562edb000b7cd5e919baea6bb2af0fea7c3b92ae98a00aeca7a94bbe5a8b25e85afb7b8cc3c8a92a797b76e8fe7f9b2db49f5f5998fc43fb4ba8a83ed5cfb898990cc68919cfd82cb3ea9b3e5d5d86efc958a89ee5b88adbdd6d579b7ba89b0cd45a3ef8687e47aabad9c8eef54b1b1899aec70adb7fa84d54e888caca6ef708e8f9e91eb74f59abd9ac2408d8c89dad140bbf1afd4cc37e2a3; YD00517437729195%3AWM_TID=2jL%2B668UaidFFFEUAUeQj%2F4wAJVXRPRp; q_c1=4a223583bcf14918944ea6a7aaf701b2|1706164457000|1706164457000; _xsrf=358b2019-197f-4dd4-939b-e8487a1e6c41; KLBRSID=53650870f91603bc3193342a80cf198c|1707120097|1707120097; HMACCOUNT=9878FBFA85951A65; SESSIONID=khcF7aVTXoivY8PIveCbXnwWMtmeyTJ9OJgTSXRKSHk; JOID=UlgUA0jkHgPr12htI-UtkQh7fdM1rnx4u51bXmSVSXigpDFaQEPq1o3UaW0hvAGIqsWbwDg8ZLrsQfrMMQ_lnl0=; osd=VVsXCkjjHQDi129uIOwtlgt4dNMyrX9xu5pYXW2VTnujrTFdQ0Dj1orXamQhuwKLo8Wcwzs1ZL3vQvPMNgzml10=; SUBMIT_0=7bda4fcc-e204-4035-924b-9981960083d3; BEC=e9bdbc10d489caddf435785a710b7029; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1733295308; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1733295308; z_c0=2|1:0|10:1733295309|4:z_c0|80:MS4xbHlfNEFnQUFBQUFtQUFBQVlBSlZUY3hLUFdpZnFGVllyWjEtanN2TUQtZTRRcHdsUVdLNnZnPT0=|9290cdb7f011c828cbfd4e15e57be7b5ebf169c47e0ee2cfe56efbf55c489feb';
    //const authData = await getAuthKey(cookie);
    const userInfo = await Zhihu.getZhihuTopicList(cookie, '');

    console.log('知乎话题：', userInfo);
  }, 10000000);
});

describe.runIf(true)('【获取分类】', () => {
  test('知乎分类', async () => {
    const cookie =
      '_zap=54217fd6-ddd8-4a89-9490-8aa4350d251f; _xsrf=87b918fa-5336-4690-a459-be8a9d9a11ef; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1785143767; HMACCOUNT=3CD5948BCA4A51FC; d_c0=c_aXC7fKqByPTtoQg7GEuLFVToSZhpX0Uxs=|1785143766; captcha_session_v2=2|1:0|10:1785143768|18:captcha_session_v2|88:Zm8xV1dQUHR5Y3NWZzJ0MTJiNk9ld0dOc3h3bGJISUpzWFJjdGFDQ01XT0NFSHRnWHVBMENkSDF1dXRQYUJFdQ==|4c6cbe32f2e69c463d7a5492ad6ab00b8a10ae6db27a81a042de509eec557976; captcha_ticket_v2=2|1:0|10:1785143784|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfSjRJc25KLjFSSk5oZWxNYWN3cnczTmU0LkJZNEVZaFQ4cU9wVDJTeXNpVVBfaFNjQS5TUVRKYkhianNzVWVTTXVXWkNtSWQxbDZBWlkzM0lucCpfVUs5SEJZcTFmaFcyR3lhZGtjd2dxc1JVcnZVZUFpYypBT3ROTm9EaW4wMWVzNU0ya0JmbndZcCpRd2xXUW5EUEZCdnNjSnBSX3FrVnozVXV2YkZhdGEwcUdOdkdmTTBCcWJ6SVpoRm1QOV8yQzR0bTgwNjNCX3dDMDF6YTgzZmV3RU82Rk90TUg2ME92MzA2aTBNaE1qYUU5TXJodllqVnprNURGMjZjVjI0T3ptdlplcmZRaTJBWHNjMlE2YWszNVh4S296d0NKZ0d1Q0VtbnM4QVVPQ0hDWFFiX0tkTmNwdnAzenFIVEtTTFdrWVE2UXFEQ0tYZTVHcjM4aV9OX2NXNk8yOWJQbGI2dVJmTVhIektEXzVNeHdvSU5DUm5rS2pRMzRmVDlvTTk2SXBOQU80aGZTaEVfYzVsbXdDMG5KcGpQWVFSczUuYTBReVJlZlFtU0xxLkdTTjhzRTM0UFMxZEpROHBWR20qTlBmdll2clpOVUp3VmRKR3RHRVNGNlh6QnV0UEhheGVKd0dSaGxZMWFjV3l6KlpRKldNTWNweGw0UXVBZ3BKT3Y4RS5rbVg3N192X2lfMSJ9|b3a31fa0de61a8def01023c407be3c9b0f8e7a3e85972afae03763ce550cf002; BEC=46faae78ffea44ab7c29d705bdab5c18; z_c0=2|1:0|10:1786096896|4:z_c0|92:Mi4xUE1IZlhBQUFBQUJ6OXBjTHQ4cW9IQ1lBQUFCZ0FsVk5fRzlVYXdEbVd4d29rZ3RvbVYtNzhyUjMyVHRmVUVtcFFR|d90e4c77705f962a2ad85c52b195ac8e839a6e4e0cf87631c7e57e2ec49e10f9; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1786096902';
    //const authData = await getAuthKey(cookie);
    const userInfo = await Zhihu.getZhihuCategoryList(cookie);

    console.log('知乎话题：', JSON.stringify(userInfo, null, 2));
  }, 10000000);
});

describe.runIf(true)('【获取视频审核状态】', () => {
  test('知乎视频审核状态', async () => {
    const cookie =
      '_zap=9a7d4a02-b53a-42e3-b81e-4125c527c28c; _xsrf=83eb309e-1718-4a74-b39d-926dac2ab3c2; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1769507912; HMACCOUNT=8E13E0827040FCA4; d_c0=rkRUoqfMvxuPTqr7ywh43xW1GJjo15xjiOg=|1769507910; captcha_session_v2=2|1:0|10:1769507910|18:captcha_session_v2|88:Q0dWcU5CRFRNN1Fvb0RjNXR5c2tGQXFKTzFpbkZlZEpSK044QmZqN3hIOFdIbG9mQTVqclZ4SW8xdTlEWWYzdg==|685c34a0f6a0e685650a488a10f1617e87009e9f347d5377d23d57b41ba7b301; SESSIONID=rSSG9JTd16cvtnleMkIQ9AYWp89At20B7AjLBg9tycH; DATE=1769507912625; cmci9xde=U2FsdGVkX1+/v0V6NYo6A+xPdpCYPQva3b03z0/rxyF2zlBZJHd1sCfXWP9fQWpJHgtKzEV88Yc4k+K2LJezkQ==; pmck9xge=U2FsdGVkX1+00jeFbD/Y3WwlrSaq+pPaZZkh3TdvbFE=; JOID=VFgdCkjz88NMEBi2Tv12GWuz2wpbh6iRASxU6ivHw6g7bnPcI7t2sCoTFr9FyGGuyBJec2CqN1jnMU-wOnxx13Q=; osd=UFkWC0P38shNGxy3Rfx9HWq42gFfhqOQCihV4SrMx6kwb3jYIrB3uy4SHb5OzGClyRlacmurPFzmOk67Pn161n8=; assva6=U2FsdGVkX187HnRWX5tNgoW18NQJoLepFuWgGNR5ssY=; assva5=U2FsdGVkX1+lYNY7ZSK7wmzzsKrZfydQBei0zh/hIDlWiIycH6eeeWWs+3uYTbKhJ5ayVsCP7/gVchZGlU/eZQ==; crystal=U2FsdGVkX19m/iN5j8TavPfiJF3KqVPuHqLFv1nBLq0Jo3JhlH53aSyaXGrrT1tXMshJqcNh9Cl4HE8iE5ZWPe5e0BfBQEpG4T4jMFH6XRTKB5sRnIyooJ0kL65MazzYPI33YUFu4+Z2y1vTAFzghmnsMFj+qFLcZiOn9sgD847LosWGkxWRfGWEv/b12d50na2s8Lr7W1RTmSuGJAYLeewJiAj4Ni6ap1MhCOWQScAPOHnFOwsiZmrZKdJIWPkg; __snaker__id=VqSiEmjFSf7fqSRs; vmce9xdq=U2FsdGVkX19Gh/NdS+uOvN69+wsoCTMg6flNABxpjfOMPDRtI8S3UNvN2POOR2sFWGdUrjJ0ZtedyI+2RAmpE4gbVtGos8XxqxCBmzlTIt6jBSMBjclY+HaLoE5g8bveEajQ29yAT+7Nq0no/xCeyNrN4jhOCnWpy4k/3kOfL74=; gdxidpyhxdE=CkDQdbzuIkXzlQ6eiTaSmBU8YZlczIt48%2B4kq%2B6Q0A5mwNxA90hZMaqbQ%2Fdflg6euSOfpb%2FW0GLZOGHSKrwE6eQxGEErIL%2FMMbiIeO0cCv3oosXn6vZSIGDTS78Qck1V2hp3EWyiZerSSP2vOaQ6nTBi3pQB3T6k%2B8VSBQ4sEac%2BcQcT%3A1769508814932; captcha_ticket_v2=2|1:0|10:1769507926|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfVzR0SjIqdXNiT1F1QnRUSHp2T29aNHdjRFhkSlV6bXhZYmoybk9ZKllBU0ltQzhvWCpyZmthejFnNGpVMFNDeUFWQ0dnd1gwKk41SFF2WHFrUHdRV0hFTUxoXzVPNUVJelpzUjJIVDVDS01hNHVLUUwuMkpRVm5yb2YuTGxBeWQyU182KlRTbWxCMFpBQ1R3NklyMDVtenZUdnZsMUp1WDVROERPb3lRKlNGbUpmSWowUENYR2hqUHJrQWgwUU9XNldmUlZFRFJjZE5kUkRYNUJqOWY1VktESjBqLnpuS0R1Q0VVUUpscHJ2TVIwVG5UMjIzUk5oVVpBZE00ODhZTE9kbGNFcGhzNTRPU2l3TFZ1X21BWFdOQjVOQ09ZRTF5dGhrNlVRWE15NldRNVFXV0ZWNXFULnBxTFdwSFl6ZHVmbUtDYV9NQVUqTU5XcmIzWEIqTFFXV3FSOExkTEpodU9NVGNjb256MmFmQXlxa2R1ZzVmek9vQW1KZzFNdTNRZkZ0UXdwcDVNQWs1NERlUVEwR25nUHZkTVVlSHQyc0haUU5LZ2pZay5LcUsxMzVnOHVycDJncmYzUlY4RmcyYWdwUUp2Lk9XS1IqYmdRdXdTdzNDa1JjbEkuaEdEKjNuQ2dRcVFTT2dVUmhRRnA2S2hUWE9sZlVQKkRxOG80c251RTNOeGc3N192X2lfMSJ9|389cf07f03ec5cbb2f00a96a7627c2230d06268746609d6b5f4d8f6363364acf; z_c0=2|1:0|10:1769507954|4:z_c0|92:Mi4xUE1IZlhBQUFBQUN1UkZTaXA4eV9HeVlBQUFCZ0FsVk5jdHBsYWdEMDVhamhXVS1IeE5NVHdFcmctRHhBVHVfbl93|216a8784ba3f2f84d5deafe5c239bb7896d2a17de77aa4424220ff748c5200d0; SUBMIT_0=f239c56b-e475-4784-a301-fc38059b5f8e; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1769513327; BEC=684e706569bf16169217bb2a788786f3';

    const userInfo = await Zhihu.getZhihuVideoStatus(cookie, '1999568527082947997');

    console.log('知乎视频审核状态：', JSON.stringify(userInfo, null, 2));
  }, 10000000);
});

describe.runIf(true)('【新版发布流程】', () => {
  test(
    '新视频发布',
    async () => {
      const result = Cloud.pushOpenPlatformPublishTask(
        {
          callBackData: { teamId: '66fa6b65f7867d1b4448a0c5', userId: '66fa6b65f7867d1b4448a0c7' },
          publishType: 'video',
          tasks: [
            {
              taskId: '6911ad9b79b5c3fc78619247',
              publishData: {
                video: {
                  duration: 184.042,
                  width: 1920,
                  height: 1080,
                  size: 62753409,
                  url: 'https://oss-v2.yixiaoer.cn/yfb/test/t-66fa6b65f7867d1b4448a0c5/zekzrkhw9ag1xdo_yz6qr',
                  localPath: '',
                },
                covers: [
                  {
                    width: 1920,
                    height: 1080,
                    size: 110414,
                    pathOrUrl: 'https://oss-v2.yixiaoer.cn/yfb/test/t-66fa6b65f7867d1b4448a0c5/b6cfvw6undngvaf-znkld',
                    format: '',
                  },
                ],
                title: '高原环境孕育出了独特的美食',
                desc: '<p>尼泊尔：高原环境孕育出了独特的美食 #美食 #地方特色美食 #尼泊尔 #街头美食 </p>',
                topics: [
                  {
                    yixiaoerId: '19551137',
                    yixiaoerName: '美食',
                    raw: {
                      introduction: '',
                      avatar_url: 'https://picx.zhimg.com/80/975baaf73fd76f48ce6f05e19b176878_l.jpg?source=4e949a73',
                      name: '美食',
                      url: 'https://www.zhihu.com/topic/19551137',
                      type: 'topic',
                      excerpt: '',
                      id: '19551137',
                    },
                  },
                  {
                    yixiaoerId: '19615290',
                    yixiaoerName: '美食社交',
                    raw: {
                      introduction: '',
                      avatar_url: 'https://picx.zhimg.com/80/v2-40e779d5c5e6bcebda41e92d50594618_l.jpg?source=4e949a73',
                      name: '美食社交',
                      url: 'https://www.zhihu.com/topic/19615290',
                      type: 'topic',
                      excerpt: '',
                      id: '19615290',
                    },
                  },
                ],
                category: {
                  yixiaoerId: '3014000',
                  yixiaoerName: '生活',
                  child: [
                    {
                      yixiaoerId: '3014001',
                      yixiaoerName: '美食',
                      raw: { data: { id: 3014001, name: '美食', description: '美食制作、评测种草、探店分享等内容' } },
                    },
                    {
                      yixiaoerId: '3014002',
                      yixiaoerName: '家居',
                      raw: { data: { id: 3014002, name: '家居', description: '家居生活、装修装饰、手工制作等内容' } },
                    },
                    {
                      yixiaoerId: '3014003',
                      yixiaoerName: '动物宠物',
                      raw: {
                        data: {
                          id: 3014003,
                          name: '动物宠物',
                          description: '各类动物宠物饲养日常、搞笑动物宠物、野生动物等',
                        },
                      },
                    },
                    {
                      yixiaoerId: '3014004',
                      yixiaoerName: '旅行',
                      raw: { data: { id: 3014004, name: '旅行', description: '旅行体验、旅行目的地攻略等内容' } },
                    },
                    {
                      yixiaoerId: '3014005',
                      yixiaoerName: '校园',
                      raw: { data: { id: 3014005, name: '校园', description: '校园日常生活、学习、社交等内容' } },
                    },
                    {
                      yixiaoerId: '3014006',
                      yixiaoerName: '日常',
                      raw: { data: { id: 3014006, name: '日常', description: '与生活相关的日常类内容' } },
                    },
                    {
                      yixiaoerId: '3014007',
                      yixiaoerName: '兴趣',
                      raw: { data: { id: 3014007, name: '兴趣', description: '绘画、手工、书法' } },
                    },
                  ],
                  raw: { data: { id: 3014000, name: '生活' }, children: [] },
                },
                subCategory: {
                  yixiaoerId: '3014001',
                  yixiaoerName: '美食',
                  raw: { data: { id: 3014001, name: '美食', description: '美食制作、评测种草、探店分享等内容' } },
                },
                prePubTime: 0,
                createType: 1,
                visibleType: 0,
                pubType: 1,
              },
              authorInfo: {
                platformName: '知乎',
                id: 'cmdfotcig002rf30izah1k4zd',

              },
            },
          ],
          publishChannel: 'cloud',
          platform: [
            {
              id: 'cmdfotcig002rf30izah1k4zd',
              platformCode: 'ZhiHu',
              platformUserId: 'a8be00be8f32497c7a13fb23a0501cc6',
              platformUserName: '瓜子',
              platformCookie:
                '[{"name":"Hm_lvt_55ffe4b16dededb7fc296d525e1a68f3","value":"1750314024,1752804854","domain":".www.zhihu.com","hostOnly":false,"path":"/creator/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784340853,"sameSite":"unspecified"},{"name":"Hm_lpvt_55ffe4b16dededb7fc296d525e1a68f3","value":"1752804854","domain":".www.zhihu.com","hostOnly":false,"path":"/creator/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"_zap","value":"6b4eff64-2200-4409-84cb-0c7e61edffc4","domain":".zhihu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784874010.252997,"sameSite":"unspecified"},{"name":"_xsrf","value":"dc676eb9-fa98-4392-902b-7aa928358dcf","domain":".zhihu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"AC60BD3A1A555DE0","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1784874010.527111,"sameSite":"no_restriction"},{"name":"HMACCOUNT","value":"AC60BD3A1A555DE0","domain":".zhihu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"d_c0","value":"pgSU8r3JoRqPTj43nOZ2K2aNb_g_RPMuEw0=|1750314011","domain":".zhihu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784874010.851857,"sameSite":"unspecified"},{"name":"__snaker__id","value":"pED8QL4B2W5t3nOs","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1781850011,"sameSite":"unspecified"},{"name":"Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49","value":"1750314011,1752804654","domain":".zhihu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1784340850,"sameSite":"unspecified"},{"name":"captcha_session_v2","value":"2|1:0|10:1752804654|18:captcha_session_v2|88:V2FzbjlkT0xGdkR1NU9TR0lGVE1vaThHKy85c3VyMnpmQm00Wjh4RmdOUzJ3MFZBaThwOStGQnpUV3lDbzBmbg==|196f870324dea9d2864221f6ea6f7f11d366dba6d8ee7a423297063dec24ae76","domain":".zhihu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1755396654.217184,"sameSite":"unspecified"},{"name":"SESSIONID","value":"DwxaPgRei0mzG2nHMeGyroqoX15fEY1V7mBtxohjN4l","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"JOID","value":"Wl4cAkNgcHLY57uIBv-d4FlYeycdKggCsLfS1WsJThCqqYnoQVDaCrnpuo8H4W1cyY_t6TV6dMUEWC_Cf40ZhZ4=","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"osd","value":"WlsTBE9gdX3e67uNCfmR4FxXfSsdLwcEvLfX2m0FThWlr4XoRF_cBrnstYkL4WhTz4Pt7Dp8eMUBVynOf4gWg5I=","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"gdxidpyhxdE","value":"Y%2BCSk1Ip1uLhVjGKkiEehZSzkeB9f3lm%5CiyaDr9yy2EfD%2BzLC15uinZxx6WEBaHxTUE0064s786PqVHCcOePC9sxUf%2BVsTQ8s7X8Wq2GicSCUC2GRzj7lfMlrn7hHZy3uE98G66NXrAtayjKhQJmupIRMf7OraR3UaiR3Wr5k01Gql%2Bo%3A1752805563948","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1755397563,"sameSite":"unspecified"},{"name":"DATE","value":"1752804824390","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"cmci9xde","value":"U2FsdGVkX1/GB9s1aWWzDM/R8j01zEEov/vkdSHh6ZWRf/ZzMIgh8JvOd89pNLPGpFTkMaU4q5dP9VX8zw1lmw==","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"pmck9xge","value":"U2FsdGVkX19hsrUwQ/gHLwqdbAERvLQb+3Plzgj+e8s=","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"assva6","value":"U2FsdGVkX19FbflgyELRzzktR8POF38cQOj8/RU4QEw=","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"assva5","value":"U2FsdGVkX19Jh2xDo6HyN42Fun3Fh6MG7ryx3DiaIQJpt32dJemAOlRXW7XB5xENK0U6vBW1Und9fbSCzugtQQ==","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"crystal","value":"U2FsdGVkX1++uWqrZ9IQg7UqYRvb1QEINd9IvYR08K73AGc3WoFdumz1XyKeF+MoylgxCALizzulwtkhAsIHuhVAvvqT1mxA5ihT9x7xVo+s2yKFuV2TRvFA85z5mTWgmD/roYQvFCE97J/+xL/HWRtP9TgDva19evb0pnlfhCOwdMvbekGpZjNQY2Cxwn+PCZZgyD0ONjXsExVi9sxGdA8l6VF3rhMUwXbFSts4jefx2Lc4pD9PD8qhChSxp0kN","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"vmce9xdq","value":"U2FsdGVkX186tYlBmSTtYISSybPJFAY45K7P6g9u+FPC7fPvZWtjfKl4LYDfkuH3n6Z+eKBB6M/SSbvcDO4gDU2GVtKuAQXbESkCEbJBvZmG1ee2xMy2Bj96Ei1rbmUr3DA8bCVm9OpMi7j4Hswf4QCSoEll8Bg3KStT2zrclac=","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"captcha_ticket_v2","value":"2|1:0|10:1752804837|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfTHZZWE1KczBtaEdzX2d6eUtCcm5zLlBTdWdocHdreVNIaGtsRnVVTmQycWptYkdsQkFSQW9IVEVBLlhLQ2pERjZDeHlmRjJreHh4RkdKcXZtelFYWWZsTGhjNm8zcDRGV05Wd2lTOWlwSWhhekV6azRUakl5YXBBY0xQZE9Hdy5QVzFjQTFTLjZxTnkuaURlbHBLKm1ELlNsMGhOdWNXNWdURlUwMUFqamJ5bmNTV2JrSGlBMUFycW9rRnVEb0U2U3kucnhsdTlsV0FPajJaUlJYWHB0ZktWS1JOLms0bVF1NERpQ3RHR0MxdkRYc0lDRHd2WkZ4cmRTVWlmM0FFSFBXOHJIMzloVkQqZElma3pybW9MREdWbjkyZzN6SFBpbHZBbWFCcUcxX3VRVzhmdSpJbDFWcUZwUFQxdjBFdUIwT25Ca1pXQnRNX3BSNGpSaDRWQUxEOFR1YmpWRjNSSG5GOWwxOUdfRUpVd0VJNUlramwqX3hhaW1KRDNKTG5pNGdtQTN2ZU9LU2ljblMxZkVXR0dTM1N6VWdYQ2dtZDFsQXd0bW1mMWhndHQ0XzR3d0Vpd0o0WG9WNERhcEx5dCp5dnRUMy42b2tMcWU1dkI4d2VQOVl5ZkI5QWp4ektDZnA5bHZiTW5XYzRVY3p4bmFieFJmOEZ5NEpJMFdJUlpjOEpqaVg3N192X2lfMSJ9|46ed5aa56bd3bf229c88206aa6b3605051eb5462148edb6cfb1942dac16eb1f5","domain":".zhihu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1755396837.433908,"sameSite":"unspecified"},{"name":"z_c0","value":"2|1:0|10:1752804847|4:z_c0|92:Mi4xUE1IZlhBQUFBQUNtQkpUeXZjbWhHaVlBQUFCZ0FsVk43X3RtYVFDY181dUVHS2syWW1lZjUzRWc4RjBIalVkZ2tB|0ed0bd8d7aefb6736f340e26254b2d6463f87bea97fdd73976b5c0c6d72ce801","domain":".zhihu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1768356847.786201,"sameSite":"unspecified"},{"name":"SUBMIT_0","value":"026fe24f-c301-4da8-9336-617c86ba0bcd","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1752806649.273896,"sameSite":"unspecified"},{"name":"Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49","value":"1752804850","domain":".zhihu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"BEC","value":"69a31c4b51f80d1feefe6d6caeac6056","domain":"www.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1752808450.618925,"sameSite":"unspecified"},{"name":"BEC","value":"e9bdbc10d489caddf435785a710b7029","domain":"api.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1752808451.891141,"sameSite":"unspecified"},{"name":"BEC","value":"cb95f4cef2a104c988a6ef7edd0de14b","domain":"mqtt-web.zhihu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1752808452.991191,"sameSite":"unspecified"}]',
              platformLocalStorage: null,
            },
          ],
          authorization: 'sess_e99482bab75c9ad43f013e3a57c732529b3506b1152dc0e75fbdff467a321e2a',
        },
        '123',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});
