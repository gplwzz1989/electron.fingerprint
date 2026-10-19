export abstract class ScheduledTaskBase {
  constructor(
    public taskId: string,
    public runMutexId: string,
    public run: (setCancelCallback: (cancel: () => void | Promise<void>) => void) => Promise<void>,
    public cancel?: () => void | Promise<void>,
  ) {}

  setCancelCallback = (cancel: () => void | Promise<void>) => {
    this.cancel = cancel;
  };
}
