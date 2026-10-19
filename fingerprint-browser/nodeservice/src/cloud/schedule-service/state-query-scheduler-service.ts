import type { QueryStateScheduledTask } from './schedule/query-state/query-state';
import { QueryStateTaskScheduler } from './schedule/query-state/query-state';

export class StateQueryScheduleService {
  private scheduler;

  constructor(thread: number = 3, taskProcTimeOutMs: number = 1000 * 60 * 3) {
    this.scheduler = new QueryStateTaskScheduler(thread, taskProcTimeOutMs);
  }
  public push(task: QueryStateScheduledTask) {
    return this.scheduler.push(task);
  }
}
