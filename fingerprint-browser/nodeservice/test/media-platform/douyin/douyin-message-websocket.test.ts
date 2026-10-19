import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { Task } from '../../../src/utils';
import { MessageWorkerService } from '../../../src/cloud/task/message_worker_service';
import { PlatformAccountInfo } from '../../../src/cloud/model/BaseTaskFormModel';
import { DouyinMessageWebSocketService } from '../../../src/media-platform/douyin/douyin-message-websocket.service';
import { Platforms } from '../../../src/service/datasync-service-manager';

function readLocalText(fileName: string): string {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
}

function printDebug(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(title);
    return;
  }

  try {
    console.log(title, JSON.stringify(payload, null, 2));
  } catch (error) {
    console.log(title, payload);
  }
}

// 将 describe.runIf(false) 改为 describe.runIf(true) 即可开启本地真实调试。调试完成后请改回 false。
describe.runIf(true)('【抖音私信WebSocket调试】', () => {
  test(
    '调试抖音私信WebSocket服务',
    async () => {
      const cookie = "x-web-secsdk-uid=33505736-4c1a-4b08-b589-10a4d8b2d9c0; csrf_session_id=f925b3ecb2a55d1a197b59fa3e031ba7; bd_ticket_guard_client_web_domain=2; passport_csrf_token=408d20da199added9ad93092c3e565db; passport_csrf_token_default=408d20da199added9ad93092c3e565db; passport_fe_beating_status=false; biz_trace_id=79d57c4c; passport_assist_user=CkRTffQXeLwhrfZ2jaINB3lHMrXGnLIncuyfnyfRVcdeAsEBnhX-d0XFAhja7c3GfqUdjgM04ftWJQwBywH9fSx_WCX8nRpKCjwAAAAAAAAAAAAAUHA4Txrew5W2vyL5YugjtsJZQ7l0ERCB6epwYOLcxDzIOj9JoDDmusN5c5wQFK_wEN4Qve2RDhiJr9ZUIAEiAQPeRQys; n_mh=AEx-R80Ib0xkZYzbiRogjq_E4Oq-G-gwgie2uAD1U-E; sid_guard=3c8f7fcf77f742e8f26b5828700a9fa9%7C1779174319%7C5184000%7CSat%2C+18-Jul-2026+07%3A05%3A19+GMT; uid_tt=0c28b4e528d08bd1f11cf5f755cf0066d4991d74706bd2021994a19ae86dc4ed; uid_tt_ss=0c28b4e528d08bd1f11cf5f755cf0066d4991d74706bd2021994a19ae86dc4ed; sid_tt=3c8f7fcf77f742e8f26b5828700a9fa9; sessionid=3c8f7fcf77f742e8f26b5828700a9fa9; sessionid_ss=3c8f7fcf77f742e8f26b5828700a9fa9; session_tlb_tag=sttt%7C4%7CPI9_z3f3Qujya1gocAqfqf________-4l5HJnBYHDlKp6e7aANDXM7kZqb4r1N_qCminYGuUlCM%3D; is_staff_user=false; has_biz_token=false; sid_ucp_v1=1.0.0-KDFkYmQ0OTU3ODgxYTJmYmUwZTg4NzczNjNkOGI5ZDJhOTQ3NmE3OWQKIgiliIL4u-L84mkQr5ew0AYY2hYgDDCy9pfOBjgHQPQHSAQaAmxxIiAzYzhmN2ZjZjc3Zjc0MmU4ZjI2YjU4Mjg3MDBhOWZhOQ; ssid_ucp_v1=1.0.0-KDFkYmQ0OTU3ODgxYTJmYmUwZTg4NzczNjNkOGI5ZDJhOTQ3NmE3OWQKIgiliIL4u-L84mkQr5ew0AYY2hYgDDCy9pfOBjgHQPQHSAQaAmxxIiAzYzhmN2ZjZjc3Zjc0MmU4ZjI2YjU4Mjg3MDBhOWZhOQ; odin_tt=d1fece214bb78c36d571852fbaf31ee2f2119ddceb0d123ec3d7db5499826bd2e9027cba2569dcfe8287973d0bb29d23037f24937c94d6ecfd92c6a67facec8f; _bd_ticket_crypt_doamin=2; _bd_ticket_crypt_cookie=422589cc2e4a25b5b6f598bac3792e43; __security_mc_1_s_sdk_sign_data_key_web_protect=7bc92a8c-4bc2-8e79; __security_mc_1_s_sdk_cert_key=7c444520-401b-97b9; __security_mc_1_s_sdk_crypt_sdk=f56c5a42-4c0d-ba8c; __security_server_data_status=1; gfkadpd=2906,33638; _tea_utm_cache_2906=undefined; gd_random=eyJtYXRjaCI6ZmFsc2UsInBlcmNlbnQiOjAuOTc2NjczNzQ3NTkwODIxN30=.wkBfAnnK8ZC/irJsm0LUtEC7D0FeQCSvVfHV0WoFsxI=; ttwid=1%7C0PUoBhiPnr4Ss3MIUxfNwMf3quOuki_9dWQKi6VRU-U%7C1779958305%7Ce8db72877ebc1dc1a3f37df03b89e1157f6ba2e6b178a2074ddab7cada5b470f; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCR1VLU0c0T29FNndyQVI1ZWVxNUdlK1FSYXJvTEU5S3FsbzNXbTRZY00yckNyNTFyeTRVQXkvS2VTd3VMNk1Eb0VydmVhS2hEbTR4Z2Ftbkd0SGVBdzg9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D";
      expect(cookie).toBeTruthy();

      const service = new DouyinMessageWebSocketService({
        cookie,
      });

      service.on('connected', () => {
        printDebug('[抖音WebSocket] 已连接');
      });

      service.on('deviceResolved', (data) => {
        printDebug('[抖音WebSocket] 连接参数', data);
      });

      service.on('authFailed', (reason) => {
        printDebug('[抖音WebSocket] 认证失败', reason);
      });

      service.on('newMessage', (event) => {
        printDebug('[抖音WebSocket] 收到私信事件', event);
      });

      service.on('newComment', (event) => {
        printDebug('[抖音WebSocket] 收到评论事件', event);
      });

      service.on('error', (error) => {
        printDebug(
          '[抖音WebSocket] 异常',
          error instanceof Error ? { message: error.message, stack: error.stack } : error,
        );
      });

      service.on('closed', (code, reason) => {
        printDebug('[抖音WebSocket] 连接关闭', { code, reason });
      });

      try {
        await service.prepareConnection();
        const deviceInfo = service.getResolvedDeviceInfo();
        printDebug('[抖音WebSocket] 解析到的设备信息', deviceInfo);
        expect(deviceInfo?.deviceId).toBeTruthy();

        service.connect();

        // 预留足够时间用于本地挂起观察推送内容。
        await Task.Delay(10 * 600 * 1000);
      } finally {
        service.close();
      }
    },
    15 * 600 * 1000,
  );
});

// 将 describe.runIf(false) 改为 describe.runIf(true) 即可开启本地真实链路调试。调试完成后请改回 false。
describe.runIf(true)('【抖音私信服务完整链路调试】', () => {
  test(
    '调试抖音私信服务完整链路',
    async () => {
      const loopSecond = 30;
      const debugDurationMs = 10 * 60 * 1000;
      const account: PlatformAccountInfo = {
        platformAccountId: 'sahdjasjd',
        platformAuthorId: '',
        cookie: 'gfkadpd=10006,33855; s_v_web_id=verify_mpy0u784_GqOGKast_mzuI_4mRV_AE4j_p9VfLYJoc0o8; csrf_session_id=79c35b0b05c3171e9b1ff60f33a56ac0; passport_csrf_token=ec181837700629f458fd28aa72bc1a42; passport_csrf_token_default=ec181837700629f458fd28aa72bc1a42; __security_mc_1_s_sdk_crypt_sdk=19616108-42a6-aa6c; bd_ticket_guard_client_web_domain=2; is_staff_user=false; has_biz_token=false; __security_mc_1_s_sdk_cert_key=0d734b4d-4e73-9562; passport_assist_user=CjwZc0wwyORiGLCcZmGTy9E1Sgd-fCjMWN55Oa7WuJ20hfpPDoJkEw7nnjHRtm2KbA4ff0OXQDSMa4ZDOvYaSgo8AAAAAAAAAAAAAFB_24KXZ97HMHPGtGRqolOyVZp_74TTTPAgQ6C3gSENOKupCYiXJ-J5LjiaytihOk74EPGZkw4Yia_WVCABIgEDOrM5vg%3D%3D; n_mh=byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4; sid_guard=745d75ace42ad8bf24ac8d0200fe80dd%7C1780489398%7C5184000%7CSun%2C+02-Aug-2026+12%3A23%3A18+GMT; uid_tt=f6b407a43d2ace4cdc9109a08caea79c; uid_tt_ss=f6b407a43d2ace4cdc9109a08caea79c; sid_tt=745d75ace42ad8bf24ac8d0200fe80dd; sessionid=745d75ace42ad8bf24ac8d0200fe80dd; sessionid_ss=745d75ace42ad8bf24ac8d0200fe80dd; session_tlb_tag=sttt%7C6%7CdF11rOQq2L8krI0CAP6A3f________-uOWgo1pesOOjMakn5TBX2svQLc2VLGrw56LdLUisfCyU%3D; sid_ucp_v1=1.0.0-KDI4YjczZWQyMjc4ZGFiZTIzODViNzMzNTM1MWY0NmNkYTE2NmUyNWEKHwjUlrWVoAIQtrmA0QYYlk4gDDCJ4uPQBTgHQPQHSAQaAmxxIiA3NDVkNzVhY2U0MmFkOGJmMjRhYzhkMDIwMGZlODBkZA; ssid_ucp_v1=1.0.0-KDI4YjczZWQyMjc4ZGFiZTIzODViNzMzNTM1MWY0NmNkYTE2NmUyNWEKHwjUlrWVoAIQtrmA0QYYlk4gDDCJ4uPQBTgHQPQHSAQaAmxxIiA3NDVkNzVhY2U0MmFkOGJmMjRhYzhkMDIwMGZlODBkZA; __security_mc_1_s_sdk_sign_data_key_web_protect=22c45719-405c-a856; _bd_ticket_crypt_cookie=5e44fa239ef8c3b5d364341b6901cf99; biz_trace_id=942f639f; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCRTZQT0QxUEEzNXNRdGFERU94QnhVTEI1MmUvUCtkV0Z1cnBpTUUyTXFJWVNjTnFuaU1ITGltVDZPWkRlR213WDYyNEtyZ08zS2dMcjhCNFYwdFNnb3M9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; ttwid=1%7C4vc9l70PtgIe-wdcn7en6AhA2DQ-nYFhA1sg3YqykEY%7C1780489405%7Cc7d35fec21c34e9d09c79932ee154de8b057a66724b18861f9ace9d53505109b; odin_tt=3618f3cbdb98d83c639d083a065db43cec0bcd028f73850ede4160e4aee1c0dba0b29c9691d9cfc7535e7c5e82418b62e669f5f8e5adb27f8da2bddcfbc45a7d',
        authorization: '',
        localStorage: {
          'security-sdk/s_sdk_pri_key': '',
          'security-sdk/s_sdk_crypt_sdk': '',
          'security-sdk/s_sdk_sign_data_key/token': '',
          'security-sdk/s_sdk_sign_data_key/web_protect': '',
        },
        // proxy: {
        //   serverAdd: '',
        //   serverPort: 0,
        //   userName: '',
        //   password: '',
        //   type: 'http',
        // },
      };

      expect(account.cookie).toBeTruthy();
      expect(account.platformAccountId).toBeTruthy();

      const service = new MessageWorkerService(Platforms.DouYin, account);
      try {
        void service.startGetMessage(loopSecond);
        await Task.Delay(debugDurationMs);
      } finally {
        service.stop();
      }
    },
    1500 * 60 * 1000,
  );
});
