import type { ScheduledTaskBase } from './task';
// import { logger } from '../../../utils';

export class TaskProcessor {
  public runningIdentity: string | null;
  private endSignal: boolean = false;
  public task: ScheduledTaskBase | null = null;
  public timeOutMs: number = 1000 * 60 * 10;

  constructor(
    private getTask: () => Promise<ScheduledTaskBase>,
    taskTimeoutMs: number = 1000 * 60 * 10,
  ) {
    this.timeOutMs = taskTimeoutMs > 0 ? taskTimeoutMs : this.timeOutMs;
    this.runningIdentity = null;
    void this.process();
  }

  public end() {
    this.endSignal = true;
    this.task?.cancel?.();
  }

  private async process() {
    while (!this.endSignal) {
      this.task = await this.getTask();
      this.runningIdentity = this.task.runMutexId;

      try {
        // 使用Promise.race实现超时控制
        await Promise.race([
          this.task.run(this.task.setCancelCallback),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`任务执行超时 ${this.timeOutMs}ms`));
            }, this.timeOutMs);
          }),
        ]);
      } catch (e) {
        if (e instanceof Error && e.message?.includes('执行超时')) {
          // logger.error(`${e.message}:${this.task.taskId}:${this.task.runMutexId}-释放processor`);
          console.error(`${e.message}:${this.task.taskId}:${this.task.runMutexId}-释放processor`);
          this.task.cancel?.();
        } else {
          console.error('任务执行异常', this.task.taskId, e);
        }
      } finally {
        this.runningIdentity = null;
        this.task = null;
      }
    }
  }
}
