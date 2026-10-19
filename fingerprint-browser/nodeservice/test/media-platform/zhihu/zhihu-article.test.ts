import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { publishZhihuArticle, ZhihuArticleTaskInput } from '../../../src/media-platform/zhihu/zhihu-article';
import { Zhihu } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('知乎图文发布', async () => {
    const cookie =
      '_xsrf=C8BgKZRwq2JkqBa62RQgTGZwDAa560PT; _zap=e605ed55-b6f6-4e37-a1d1-4800c283a52a; d_c0=AVDS6QAK_RmPTsg_m4MtI2fwf1HENNKLk70=|1739257894; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1760363118,1762478820; HMACCOUNT=67D5C53B67395D08; __zse_ck=004_6c8JiDtH1rnuuOCq91iQamoqMVOCLFPKWL5ZLWFQKYZNr3t7/S5jvFPYaeNAE2HHos1AzzuNzz29l6x44DAWkG2dfsxOhae09S5ewHkxqSAZcRNds=299btpbgEirZ2t-OvLE4bUUtRNyEU9UDpXZ8qj8Fs8D+ktHnKJx/NPBZ8DaA9x7mmv03N+t8D7BVoTtqcSPGbThcrWQ0o3ycaCLuwfHpsPIogYEzJ+Xgb89KW6jBoPxS0X5wMTf+SUGS8IK; captcha_session_v2=2|1:0|10:1762479024|18:captcha_session_v2|88:bHVxMSs2anNYZjZ5UTExblNLSUllcHZURGwwV0lMWDJ5eVg1eDJXenp0QkNjb3NyeUN5MHNzb0V6bnhYVlJlMg==|ad3ac36ecb5b11f8800c32f31f1978de39ce28091d4f09fef877279f22a7527e; captcha_ticket_v2=2|1:0|10:1762479041|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfazJsZG1ZSTRyNGRPb0x0bnhWWThDSTZJdk80OEFNZXRiUHhqS3lDcHVxQmdmZVkxVFZHT3lkZVZlQzRBWWxSUnVHU3NTdm5ScVE4cXNlSVRPLlRlSHVBdVhBLlZ6OTFNUGZsX3YyME5Cd0hUS0Y5Z2hVM3dnVFlMOUwzeGJHYzUyWnJleF9Za2RnbWhrV2hmcTNrX2NaV1JDclBMeGV4YXdaeEpJcWZvcWUzQ0pfMWduOUFDYmZMUjQ2dlJPZGZ4X2UuUkl3VWlyb3g4YSpmMlpsRGd5eCpIaWRlZSpSZVMqWGIqUHVVUEh4dlF4SFN1TXVUZVdVRUh1VCphUnlnY3pyVW40dFk0bEpub09qeFoqYTN4R0FIVk9uT2ptcUtiZkUxVlN5Qng0ZGVmbVlGTDJvU2lDZjByZXZqUWNnNXRxLlgxTWRyZWxLSXJuRHNndVVRS0xKTVc2cXRWNWsxb3pNUXFlSmpLcXdiRV8wNWpOUGVSZkxVd1ZYb2xMTE5LdkpVVHoqOFMuLnhOb3Z1aHlya281YXBYTnUwbjJjbjRHUWRvR0tXRWtqRFp4UmZmbGt6MWtYU3lqa0dPMmY4cUhiZWNaSTV2eXRTSU1wa2lPTFRWdENoVzB6eUt0RWY4MGdnbk91Z2N3b012amhKcTFkR2dhNlZWM2doZEhGX25kcWRRQWc3N192X2lfMSJ9|eb9ec82ddb702b5128a3758f16b73d54edf3f90f5d424dfa8eaf215c26994c46; z_c0=2|1:0|10:1762479042|4:z_c0|92:Mi4xbHlfNEFnQUFBQUFCVU5McEFBcjlHU1lBQUFCZ0FsVk53cG42YVFEaE5aR0VMVGVHY1JjaWlaVEh1enp0NkZfSzBR|3bbc80e0af3cd58f3ffc9f3ed9d37a99856f3667692b9757a0c9e409a2d0297d; SESSIONID=qBPxpRJTj2WYuShwFkJvXNiS4ev9ysY2tpXMdm4mSpe; JOID=UFoWB0ldeRDKp771T1urQmzKx8tUbAliiu7knBwIQViGzsq8BY00HKWnv_NOVM0v0gyWF5dMrJOZTxP3BVCVefE=; osd=VFkWAUlZehDMp7r2T12rRm_KwctQbwlkiurnnBoIRVuGyMq4Bo0yHKGkv_VOUM4v1AySFJdKrJeaTxX3AVOVf_E=; Hm_lvt_bff3d83079cef1ed8fc5e3f4579ec3b3=1762479057; BEC=81e7d03b02f619e1531cb798b916e00c; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1762479120; Hm_lpvt_bff3d83079cef1ed8fc5e3f4579ec3b3=1762479121';

    const taskData: ZhihuArticleTaskInput = {
      pubType: 1,
      taskId: '1717809227264909312',
      covers: [
        // {
        //   pathOrUrl: 'I:\\download\\20251030-153423.jpg',
        // },
      ],

      // 标题
      title: '带着三岁孩子的宝妈，一年做了1.3个小目标',

      //内容
      content:
        '<p>瓜子的生活纪录片，记录每一天</p>',

      topics: [
        {
          avatar_url: 'https://pic1.zhimg.com/80/v2-40e779d5c5e6bcebda41e92d50594618_l.jpg?source=4e949a73',
          excerpt: '',
          id: '23503650',
          introduction: '',
          name: '宝妈赚钱',
          type: 'topic',
          url: 'https://www.zhihu.com/topic/23503650',
        },
      ],

      creationStatement:{
        disclaimer_status:'open',
        disclaimer_type:'spoiler'
      }
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await publishZhihuArticle(cookie, taskData, eventCall);
    // assets
    console.log('知乎图文发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('知乎图文审核状态', async () => {
    const cookie =
      '_zap=317562d6-3186-418b-9006-4d951552400b; d_c0=AFDTGq4VvRePTlfhO6cJJGVPgcqHcyzfvYU=|1700606249; YD00517437729195%3AWM_NI=%2BV0MKrPe%2BG3VGqyWI0JNiv4fM97QXC7%2BWnA5pfFbnP9WGoIlSD3aH6km%2B4Uf8KFhoQDss5VsufGONOa1JfarisTmlXsoGyidoi6cVFDTdEldNQRphx7FsyC4OTG9R4y%2Fa3I%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6ee93ec3d938997a3c944919a8fa2d44e979a9e83d562edb000b7cd5e919baea6bb2af0fea7c3b92ae98a00aeca7a94bbe5a8b25e85afb7b8cc3c8a92a797b76e8fe7f9b2db49f5f5998fc43fb4ba8a83ed5cfb898990cc68919cfd82cb3ea9b3e5d5d86efc958a89ee5b88adbdd6d579b7ba89b0cd45a3ef8687e47aabad9c8eef54b1b1899aec70adb7fa84d54e888caca6ef708e8f9e91eb74f59abd9ac2408d8c89dad140bbf1afd4cc37e2a3; YD00517437729195%3AWM_TID=2jL%2B668UaidFFFEUAUeQj%2F4wAJVXRPRp; q_c1=4a223583bcf14918944ea6a7aaf701b2|1706164457000|1706164457000; _xsrf=358b2019-197f-4dd4-939b-e8487a1e6c41; KLBRSID=53650870f91603bc3193342a80cf198c|1707120097|1707120097; HMACCOUNT=9878FBFA85951A65; SESSIONID=khcF7aVTXoivY8PIveCbXnwWMtmeyTJ9OJgTSXRKSHk; JOID=UlgUA0jkHgPr12htI-UtkQh7fdM1rnx4u51bXmSVSXigpDFaQEPq1o3UaW0hvAGIqsWbwDg8ZLrsQfrMMQ_lnl0=; osd=VVsXCkjjHQDi129uIOwtlgt4dNMyrX9xu5pYXW2VTnujrTFdQ0Dj1orXamQhuwKLo8Wcwzs1ZL3vQvPMNgzml10=; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1733295308; __snaker__id=Ker11EzL2OVfalDv; gdxidpyhxdE=Cbh5kJqyDu%5CztEwKiw8dhiUEQ%2FrcKzbWifcaDBkzvxhmMLx89ahVzGYm%2F26vy4Mz4n5P%2FYTsJKYnKZGv4E5TVi4pQhWrOuxc1LbzkKWqaQ%5C3JBa%2F6XE6Zq%2B7TcxECEL9cBAp%5C2gYCNB45jIJQAt7R9f8laQHY47PKNgH39AX9OwPrqCL%3A1733298134352; captcha_session_v2=2|1:0|10:1733297238|18:captcha_session_v2|88:aDcvYzFNTHB6a2NHUTd5QnU5RjBmNjFocEFUa2d2aTQrMkhhaGREQ3VLUHo5Q1cxZWdWcEVnclp5a2ZKUWpyaw==|1a41ec3bb835d8e0d9351c82e9035fc604f5c0074c3d0b7eb4d8a2359dfe0887; SESSIONID=MBdSGyQeVm1XkX0n2dOaU8fGbbnuclU51maE1hF4wv2; JOID=W1AXCkPxJlXBvdxVJPAWzSMZyeg4m0Q9hou8CXuoSDa85eUEZ60jD6a911QuqTMqw1g2tR0q5okWWKrjgAIemoY=; osd=W10RAErxK1PLtNxYIvofzS4fw-E4lkI3j4uxD3GhSDu67-wEaqspBqaw0V4nqT4syVE2uBsg74kbXqDqgA8YkI8=; captcha_ticket_v2=2|1:0|10:1733297246|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfMkFyb2NxQ3Q2Y2Y0T0FUOFg5a1VjZzF6bWJoX2VSLjNvRjJRbjBQNTVHNCo0NHgwYXpyc3A0ajRvdFVYa3I4bGJSUVhGekE0Y0twTVVnbm9nd21OVFVCbXJuQW1yWDJ5YmxnalRCb1UzcGxMZ2x1YS5iVXZnc2NXRnZFcXZ2MFRmZFpIMll3dXhwM295QWZ1TF80Wm1GLlM0Sl91akxycGZjNTZPUy5Uajk0UWtYOXNvLl91UENpUHZPTjhPa3FfNm9zeG1WTnl1c0xnZlViWDYxcFJBNmpOZnZrcm9aSXZYNHVuUklqQW9YZFFtbTI4b3BaRVlVeHZSbU5oVGJvMWx0bGVnVE0wc0NTMnpEbmF1Lnd5TXJaWmcuc094M0xSdGFOZ0tJWVlORlJvQVZPdXE0Uk1XQUZISG5kZmNVSm9kUDgwUlZQdUZaX2pWSHQyaTJzcWdHamZHemkwRTROakpKVG1kNUhvV21TQ3VwalZ2ZlFNdnM2eEdPYXRyR1J2SVRta01nMlBZQVRXM2l6bUFfZFdaUjgzRS4wZThYMXRkYldIeWEzZzFiU3k4VmFUaVFDcFhSbzNPSFdFdHV2YWZ1WjE0bU9SaGtLVkJ5ck5KdW9Gbl80TlAqX1JyUTJzSDhMRUwqKlZUdlhrcW9SZip4enkwS1hxa3JIbTFTR09qTm95Tlk3N192X2lfMSJ9|831767c5262180639048e2dff1a80cbce9df35d7d4642efece9374e9ad973461; __zse_ck=003_bZQooL2IuHQjcKwd6HnQFhEe7WtAr8Ap1Cc0ckY=BtIoR4IObDuGikgug8toOOkAQwlMPtdQe2nhGz=clT5OZu3TIwPBkexlgVVXmqebedtC; z_c0=2|1:0|10:1733297272|4:z_c0|92:Mi4xbHlfNEFnQUFBQUFBVU5NYXJoVzlGeVlBQUFCZ0FsVk5YMUk5YUFCRU5kaWJoR2l5TUZaZzZucjhEOHVYbTRQSWh3|bc258fab154b403c74af0d6b04a33a559a5faec8f10408924069fe20c8f7fb40; SUBMIT_0=0c3c90cb-2a59-4e8b-a2f7-3b06b23e2f0c; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1733300814; BEC=d892da65acb7e34c89a3073e8fa2254f';
    //const authData = await getAuthKey(cookie);
    const userInfo = await Zhihu.getZhihuArticleStatus(cookie, '636826193');

    console.log('知乎图文审核状态：', JSON.stringify(userInfo, null, 2));
  }, 10000000);
});
