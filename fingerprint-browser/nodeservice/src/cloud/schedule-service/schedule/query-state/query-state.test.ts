import { expect, test, vi } from 'vitest';
import { QueryStateScheduledTask, QueryStateTaskScheduler } from './query-state';

test('在3个并发限制下，应该按照预约时间顺序及插入顺序入队', async () => {
  const scheduler = new QueryStateTaskScheduler(3);

  function push_task(lockIdentity: string, content: number, scheduleDatetime: Date) {
    return scheduler.push(
      new QueryStateScheduledTask(
        scheduleDatetime,
        content.toString(),
        lockIdentity,
        async (setCancelCallback: (cancel: () => void) => void) => {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.log(`${scheduleDatetime.toISOString()} task ${content} done`);
              resolve();
            }, 500);

            setCancelCallback(() => {
              clearTimeout(timeout);
            });
          });
        },
      ),
    );
  }

  // Mock timers
  vi.useFakeTimers();

  // 第二组先插入
  push_task('group2', 21, new Date(Date.now() + 4));
  push_task('group2', 22, new Date(Date.now() + 5));
  push_task('group2', 23, new Date(Date.now() + 6));

  push_task('group1', 11, new Date(Date.now() + 1));
  push_task('group1', 12, new Date(Date.now() + 2));
  push_task('group1', 13, new Date(Date.now() + 3));

  push_task('group3', 31, new Date(Date.now() + 7));
  push_task('group3', 32, new Date(Date.now() + 8));
  push_task('group3', 33, new Date(Date.now() + 9));

  push_task('group4', 41, new Date(Date.now() + 10));
  push_task('group4', 42, new Date(Date.now() + 1100000)); // 不到时间的不应该执行
  push_task('group4', 43, new Date(Date.now() + 12));

  expect(scheduler.queue.map((x) => x.runMutexId)).toStrictEqual([
    'group1',
    'group1',
    'group1',
    'group2',
    'group2',
    'group2',
    'group3',
    'group3',
    'group3',
    'group4',
    'group4',
    'group4',
  ]);

  // Advance timers to ensure all tasks complete
  vi.advanceTimersByTime(5000);

  // Restore real timers
  vi.useRealTimers();
});
