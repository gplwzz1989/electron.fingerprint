import { describe, expect, test } from 'vitest';
import { MessageWorkerService } from '../../../src/cloud/task/message_worker_service';
import { Platforms } from '../../../src/service/datasync-service-manager';
import { Task } from '../../../src/utils';

describe.runIf(true)('视频号msgworker评论刷新测试', () => {
  // cookie 留空，使用时补充完整视频号 cookie
  const cookie =
    'sessionid=BgAAMChNJs1PG5pSGXsh2oXTt6u1r0nV96t740u0VtEM0B25A%2B33DlbHcTux%2FSRAM%2F6Qaf6BTMLAeQ74Yhl4sGJe3DBrhzA%2FFyxOkl4JTf5E; wxuin=1233825766';

  test.runIf(Boolean(cookie))(
    '触发视频号近期评论抓取',
    async () => {
      const worker = new MessageWorkerService(Platforms.ShiPinHao, {
        cookie,
        platformAccountId: 'shipinhao-msg-worker-test-account',
        platformAuthorId: '',
      });

      for (let i = 0; i < 10; i++) {
        try {
          const result = await worker.fetchRecentComments({ days: 7 });
          console.log(JSON.stringify(result, null, 2));
        } finally {
          //worker.stop();
          await Task.Delay(1000 * 60);
        }
      }
    },
    10000000,
  );
});
