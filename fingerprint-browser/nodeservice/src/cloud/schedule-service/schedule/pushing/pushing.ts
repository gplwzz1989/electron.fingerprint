import { TaskScheduler } from '../scheduler';
import { ScheduledTaskBase } from '../task';

export class PushingScheduledTask extends ScheduledTaskBase {}

export class PushingTaskScheduler extends TaskScheduler<PushingScheduledTask> {
  push(task: PushingScheduledTask): boolean {
    if (this.queue.find((t) => t.taskId === task.taskId)) {
      return false;
    }
    this.queue.push(task);
    return true;
  }
  remove(taskId: string): boolean {
    const index = this.queue.findIndex((t) => t.taskId === taskId);
    if (index < 0) {
      return false;
    }
    this.queue.splice(index, 1);
    return true;
  }

  protected tryGetTaskFromQueue() {
    const task = this.queue.find((t) => !this.isTaskRunning(t.runMutexId));
    if (task) {
      this.queue = this.queue.filter((t) => t.taskId !== task.taskId);
      return task;
    }
    return null;
  }
}
