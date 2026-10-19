import { TaskProcessor } from './processor';
import type { ScheduledTaskBase } from './task';

export abstract class TaskScheduler<TTask extends ScheduledTaskBase> {
  constructor(concurrency: number, taskProcessTimeOut: number = 1000 * 60 * 10) {
    this.processors = Array.from(
      { length: concurrency },
      () => new TaskProcessor(() => this.getTask()),
      taskProcessTimeOut,
    );
  }

  protected processors: Array<TaskProcessor>;
  queue: Array<TTask> = [];

  abstract push(task: TTask): void;

  stop() {
    this.queue = [];
    this.processors.forEach((p) => p.end());
  }

  /**
   * 从队列中获取任务。
   * @returns {Promise<TTask>} 当有任务可用时该 Promise 会被 resolve。
   * 通过调用 tryGetTaskFromQueue 方法反复检查队列中是否有可用任务。
   * 如果没有可用任务，等待 100 毫秒后再次检查。
   */
  protected getTask(): Promise<TTask> {
    return new Promise<TTask>((resolve) => {
      const checkTaskAvailability = () => {
        const task = this.tryGetTaskFromQueue();
        if (!task) {
          const timer = setTimeout(checkTaskAvailability, 100);
          if (timer && typeof timer.unref === 'function') {
            timer.unref();
          }
        } else {
          resolve(task);
        }
      };
      checkTaskAvailability();
    });
  }

  protected abstract tryGetTaskFromQueue(): TTask | null;

  protected isTaskRunning(runMutexId: string) {
    return this.processors.some((p) => p.runningIdentity === runMutexId);
  }

  getAllTasks(): string[] {
    return [
      ...this.queue.map((t) => t.taskId),
      ...this.processors.map((p) => p.task?.taskId ?? null).filter((taskId) => taskId !== null),
    ] as string[];
  }
}
