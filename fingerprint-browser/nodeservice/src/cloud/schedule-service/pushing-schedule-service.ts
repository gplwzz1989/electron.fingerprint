import type { PushingScheduledTask } from './schedule/pushing/pushing';
import { PushingTaskScheduler } from './schedule/pushing/pushing';

export class PushingScheduleService {
  private scheduler = new PushingTaskScheduler(3);

  constructor(threadNum: number = 3, taskProcTimeOutMs: number = 1000 * 60 * 30) {
    this.scheduler = new PushingTaskScheduler(threadNum, taskProcTimeOutMs);
  }

  public push(task: PushingScheduledTask) {
    return this.scheduler.push(task);
  }

  public remove(taskId: string) {
    return this.scheduler.remove(taskId);
  }

  getAllTasks() {
    return this.scheduler.getAllTasks();
  }
}
