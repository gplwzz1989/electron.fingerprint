import { describe, expect, test } from 'vitest';
import { Cloud, Platforms } from '../../../src';
import { EventEmitter } from 'events';
import { CheJiaHaoVideoTaskInput } from '../../../src/media-platform/chejiahao/chejiahao-video';
import { CheJiaHao } from '../../../src/media-platform/chejiahao';
import { Task } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'fvlid=1758539303005b9xOTSr0rE; sessionid=648B7903-A992-4C15-8E25-B6F3128135D1%7C%7C2025-09-22+19%3A08%3A23.916%7C%7C0; autoid=9e4fc93851ee8777963de02788f47af6; sessionuid=648B7903-A992-4C15-8E25-B6F3128135D1%7C%7C2025-09-22+19%3A08%3A23.916%7C%7C0; __utmc=1; __ah_uuid_ng=u_297428537; _ac=bXynnTyapIUG6k0Gbd0CpSVETwMxeoj8csxJRwWe2wN5TIQNE8hZ; sessionip=171.217.4.75; area=510116; __utma=1.229693888.1758539303.1758539303.1781143593.2; __utmz=1.1781143593.2.1.utmcsr=creator.autohome.com.cn|utmccn=(referral)|utmcmd=referral|utmcct=/; pcpopclub=037069e9a485493481552a2bbba2f05611ba6639; clubUserShow=297428537|0|2|%e8%bd%a6%e5%ae%b6%e5%8f%b7%e7%93%9c%e5%ad%90|0|0|0|/g34/M08/0E/1A/120x120_0_q87_autohomecar__ChxpV2lfYwCASR3sAAOJRMGRRBo981.jpg|2026-06-11 10:09:35|0; sessionlogin=037069e9a485493481552a2bbba2f05611ba6639; autouserid=297428537; tfstk=gB1Zjhgo85FwcVElzaA4Ubvsi8O9GIrWIstXoZbD5hxMfF9mng_wnPL6ciuVxMW6nld1g9ScAhDf5CAQJT1koAb0BnbcWCvACnt60I7A4yZ7N7_OWId7VuN5IyqvXIK0GI2Bt8rCMKq7N7_gIFdf-u6fnVtMkEADSjcmxy89zIcisixHKUYmsIAcmy-H5U8mmjxixBYJxnADiib38EKHSIAcmw4ekbT1JNPMld4st90Mc0CpQ3bMYb7dTFvrBNxEtXfFLd-lgHlmi68OkBsmObyXqTK6F3j3OfRV-ESeFOrr_i7cytvFgc41qMXVmeBL0x-PnN6ROpgmIw52bLfMLqU5rCLcmKWL4bTw19JP_OUxxNjWbTAOl4r18LWeeevnuAA1Fa1vE1VZ2H9JuMJ5QulNqgkSDe4gfsBZmxvMJe-78y7f28N58e6U4xHvBIYeVPbEHxpMoe-78XDxHdp983aNd; ahpvno=5; v_no=1; visit_info_ad=648B7903-A992-4C15-8E25-B6F3128135D1||D6FEE50D-8EE4-45BE-88D9-0B8172B3E6A8||-1||-1||1; ref=0%7C0%7C0%7C0%7C2026-06-11+14%3A30%3A10.669%7C2025-09-22+19%3A08%3A23.916; sessionvid=D6FEE50D-8EE4-45BE-88D9-0B8172B3E6A8';
  test('车家号视频视视频发布', async () => {
    const taskData: CheJiaHaoVideoTaskInput = {
      taskId: '13123123',

      video: {
        localPath: 'I:\\download\\20251205-112844.mp4',
        width: 1280,
        height: 980,
        duration: 9,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20251224-183415.jpg',
        width: 1920,
        height: 1080,
      },
      verticalCover: {
        pathOrUrl: 'I:\\download\\image-1781094904962.png',
        width: 960,
        height: 1280,
      },
      title: '如果不行就先这样吧,真实的',
      desc: '难道是描述阿德好贱啊金黄色的',
      publishTime: new Date('2026-6-12').getTime(),
      isFirst: 0,
      isOriginal: 0,
      pubType: 1,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await CheJiaHao.publishVideo(cookie, taskData, eventCall);

    console.log('车家号视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('车家号视频视频删除', async () => {
    const result = await CheJiaHao.deleteCheJiaHaoContent(cookie, '5179631');

    console.log('车家号视频视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('车家号视频视频状态', async () => {
    const result = await CheJiaHao.getCheJiaHaoMediaStatus(cookie, '12452892');

    console.log('车家号视频状态：', JSON.stringify(result, null, 2));
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
              taskId: '68d512b207096fa43979b0c1',
              publishData: {
                video: {
                  duration: 233.593,
                  width: 1280,
                  height: 720,
                  size: 36131101,
                  url: 'https://oss.yixiaoer.cn/1c424a9c24d0cb022123a7ecfdb204fb/68d66433/yfb/test/t-6821ac8d50bc5fd636fa9801/56f2vmvgu8dj348lts6zc',
                  localPath: '',
                },
                covers: [
                  {
                    width: 1280,
                    height: 720,
                    size: 68132,
                    pathOrUrl: 'I:\\download\\20250915-102132.jpg',
                    format: '',
                  },
                ],
                title: '盖子说，瓜子说哦',
                desc: '<p>狗尾巴草</p>',
                prePubTime: 0,
                pubType: 1,
              },
              authorInfo: {
                id: 'cmfxvtfgi0011j90j5dh4dast',
                platform: '',
                authorId: '',
                cookie: '',
                // proxy: {
                //   serverAdd: '106.15.138.47',
                //   serverPort: '44012',
                //   userName: 'kmayhgjq',
                //   password: '3kTXC4Jr35Dk8OiVKzKimTG4',
                // },
              },
            },
          ],
          publishChannel: 'cloud',
          platform: [
            {
              id: 'cmfxvtfgi0011j90j5dh4dast',
              platformCode: Platforms.CheJiaHao,
              platformUserId: '263292588',
              platformUserName: '陈锦5979',
              platformAvatar: '',
              platformCookie:
                'fvlid=17288738673752QZWLuqwEq; __utma=1.1491185447.1728873868.1728873868.1728873868.1; sessionid=A7CFF251-C571-41E2-9100-667D824E65D3%7C%7C2024-10-14+10%3A44%3A25.261%7C%7C0; autoid=c159f0d7bb71f346d4fed868ba77c9c5; sessionuid=A7CFF251-C571-41E2-9100-667D824E65D3%7C%7C2024-10-14+10%3A44%3A25.261%7C%7C0; pcpopclub=e97a8f3201684098b8a1630723fb65440d782187; clubUserShow=225976711|0|0|%e6%88%91%e7%9a%84MG%e5%a4%a9%e4%b8%8b%e6%97%a0%e6%95%8c|0|0|0|/g31/M03/87/11/120x120_0_q87_autohomecar__ChxoHWYFcdCALNCGAABcoJ030GY548.jpg|2024-10-14 10:44:43|0; sessionlogin=e97a8f3201684098b8a1630723fb65440d782187; autouserid=225976711; __ah_uuid_ng=u_225976711; __utmc=1; area=510116; _ac=PmLM-kzDmbENkXcNQtc_jGpeeCAqXJQC58wRyVN00pXWNEFtGixV; sessionip=171.212.122.241; tfstk=ghsKj76EU5VHx7lEp_4gqT7KvE2gmPXUB6WjqQAnP1COFtporJuhW3BchBfkx9mRW_1w-UNFE135sC7nK6-ySNClUQcl2ToJFT1zLQ2US9We43N0i-qcL95Z4z0zs3w5C3v-LfxZi9We4AkiNrb1LY3D_0JBV_tsCKv2VpTWPRd6KCiBFDtW1Rpy139BFLZ61KJ-VQ9CNOw9UCOWV31WfRpy1QtWVvRzwCMBZ0QIX_uSxmZPRwS9pedfBroS2HiDJI9960NfXpdWG9OtV0Ax1htFB9VK0OxFCspctlidMOXcYFS8MkLFftIwJgk-7OY29hOF-Wnwp6XRDFsQExACbTs2WnUriCSPCZY2cXgBHHdplM1iF-tBPLtBTwVKbpCheiL1A80DQa1N2Hxb0XOlStIJegPzXsBGnM8N2SE14GIcDSaniIpoJRetz48BQ-evqdVvDZNvBI2L24uy7RJ9iRHEz48Ibdd0Ip0rzFUN.; ahpvno=7; v_no=1; visit_info_ad=A7CFF251-C571-41E2-9100-667D824E65D3||DA575A25-FDF2-4E79-8C60-5F2ECA83DBB4||-1||-1||1; ref=0%7C0%7C0%7C0%7C2025-09-25+20%3A02%3A29.177%7C2025-04-28+10%3A16%3A26.974; sessionvid=DA575A25-FDF2-4E79-8C60-5F2ECA83DBB4',
            },
          ],
          authorization: 'sess_3e9d8dd16b76777dcbb42cf911ed469bfd9f5d75728d62b1410237fd561229f0',
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
