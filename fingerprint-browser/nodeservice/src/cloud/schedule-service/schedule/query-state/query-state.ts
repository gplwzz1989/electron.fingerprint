import { ScheduledTaskBase } from '../task';
import { TaskScheduler } from '../scheduler';

export class QueryStateScheduledTask extends ScheduledTaskBase {
  scheduleDatetime: Date;

  constructor(
    scheduleDatetime: Date,
    taskId: string,
    runMutexId: string,
    run: (setCancelCallback: (cancel: () => void | Promise<void>) => void) => Promise<void>,
    cancel?: () => void | Promise<void>,
  ) {
    super(taskId, runMutexId, run, cancel);
    this.scheduleDatetime = scheduleDatetime;
  }
}

export class QueryStateTaskScheduler extends TaskScheduler<QueryStateScheduledTask> {
  push(task: QueryStateScheduledTask): void {
    // 任务已存在则替换
    if (this.queue.find((t) => t.taskId === task.taskId)) {
      this.queue = this.queue.filter((t) => t.taskId !== task.taskId);
    }
    //根据任务执行时间排序插入
    const index = this.queue.findIndex((t) => t.scheduleDatetime > task.scheduleDatetime);
    if (index === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(index, 0, task);
    }
  }

  protected tryGetTaskFromQueue() {
    const task = this.queue.find((t) => !this.isTaskRunning(t.runMutexId) && t.scheduleDatetime <= new Date());
    if (task) {
      this.queue = this.queue.filter((t) => t.taskId !== task.taskId);
      return task;
    }
    return null;
  }
}
