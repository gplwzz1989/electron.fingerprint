import { describe, expect, test } from 'vitest';
import { Toutiaohao } from '../../../src/media-platform/toutiaohao/toutiaohao';
import { EventEmitter } from 'events';
import { ToutiaohaoMiniVideoTaskInput } from '../../../src/media-platform/toutiaohao/toutiaohao-mini-video';

describe.runIf(true)('【真实测试】', () => {
  test('头条号竖版视频发布测试', async () => {
    const cookie =
      'gfgarrcache_9fcfcf4a=1; gfgarrcache_9fcfcf4a=1; ttwid=1%7CE6rgN_yR7TrIz_EzCqVGL1U5cFcbisMVgoPxoU5-Ges%7C1749437064%7Ccd88b02cd580fab34e980b063fc8378682b20866039f645b9c94c74be93168d2; s_v_web_id=verify_mbohnqmo_jozPlEEP_kcfP_4o1r_A8jo_eC7M8xj0gepY; passport_csrf_token=f196930e564331b1c28e6749144d48ac; passport_csrf_token_default=f196930e564331b1c28e6749144d48ac; n_mh=NiapHmvsv_kDNVSiFvIHBvsbNE4_RRoW3EqcWkBYrBU; sso_uid_tt=ea032ab57ca0aff40c5eca90e3093c52; sso_uid_tt_ss=ea032ab57ca0aff40c5eca90e3093c52; toutiao_sso_user=98dc08d35bb1418938cac31e8be16552; toutiao_sso_user_ss=98dc08d35bb1418938cac31e8be16552; sid_ucp_sso_v1=1.0.0-KGEzYmZjYmI3MDRkNjgyMWVmZjQ0MzliOTE5ZDIwMDRjMTA3NTIwYzgKHQiCva_l-wEQu5WZwgYYzwkgDDCK-pLNBTgGQPQHGgJobCIgOThkYzA4ZDM1YmIxNDE4OTM4Y2FjMzFlOGJlMTY1NTI; ssid_ucp_sso_v1=1.0.0-KGEzYmZjYmI3MDRkNjgyMWVmZjQ0MzliOTE5ZDIwMDRjMTA3NTIwYzgKHQiCva_l-wEQu5WZwgYYzwkgDDCK-pLNBTgGQPQHGgJobCIgOThkYzA4ZDM1YmIxNDE4OTM4Y2FjMzFlOGJlMTY1NTI; odin_tt=5fa77e9e21bcd9e94016ce797f9d8b67f67adeef2ee69b7bfd23fe03fdfad79e17fe3a2cbe74abf844fd3790d248b938; passport_auth_status=353ca3b8be075176188865bd35b2f5d0%2C; passport_auth_status_ss=353ca3b8be075176188865bd35b2f5d0%2C; sid_guard=2943c69b72d60bf50222a5eec0e09eef%7C1749437116%7C5184001%7CFri%2C+08-Aug-2025+02%3A45%3A17+GMT; uid_tt=d383fb0045932b99cecf5c38fce2018f; uid_tt_ss=d383fb0045932b99cecf5c38fce2018f; sid_tt=2943c69b72d60bf50222a5eec0e09eef; sessionid=2943c69b72d60bf50222a5eec0e09eef; sessionid_ss=2943c69b72d60bf50222a5eec0e09eef; is_staff_user=false; sid_ucp_v1=1.0.0-KDRjMjUyYTg5MmUyMWM0MjE5MGQwMjg5YTY4MjljMWY3MTcxNWJlOGUKFwiCva_l-wEQvJWZwgYYzwkgDDgGQPQHGgJsZiIgMjk0M2M2OWI3MmQ2MGJmNTAyMjJhNWVlYzBlMDllZWY; ssid_ucp_v1=1.0.0-KDRjMjUyYTg5MmUyMWM0MjE5MGQwMjg5YTY4MjljMWY3MTcxNWJlOGUKFwiCva_l-wEQvJWZwgYYzwkgDDgGQPQHGgJsZiIgMjk0M2M2OWI3MmQ2MGJmNTAyMjJhNWVlYzBlMDllZWY; gfkadpd=1231,25897; csrf_session_id=36fd210ad78701d15e0a9145b1160f5e; csrf_session_id=36fd210ad78701d15e0a9145b1160f5e';

    const taskData: ToutiaohaoMiniVideoTaskInput = {
      taskId: '1717809227264909312',
      cover: {
        pathOrUrl: 'https://i0.hdslb.com/bfs/article/060f9d1f63d78c4f09501b8bfc134d30413715923.jpg',
      },

      // 标题
      title: '随拍听鸟语，枝繁不知处',

      video: {
        localPath:
          'I:\\download\\1742382013268喜不喜欢？短短十秒的视频冒雨下水用两个小时拍摄，就为缓解你内心的不安和焦虑#简单拍一夏 #荷塘美景 #麒麟水乡.mp4',
      },
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Toutiaohao.publishMiniVideo(cookie, taskData, eventCall, '');
    // assets
    console.log('头条竖版视频发布：', JSON.stringify(result, null, 2));
    expect(result.publishId.length).greaterThan(0);
  }, 10000000);
});
