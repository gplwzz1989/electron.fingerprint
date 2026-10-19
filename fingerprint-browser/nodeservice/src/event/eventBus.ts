/* eslint-disable @typescript-eslint/no-explicit-any -- 因为只是参数传递，用unknown或者never似乎都会存在类型检查问题*/
import { EventEmitter } from 'events';

class EventBus {
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  emit(eventName: string, ...args: any[]) {
    this.eventEmitter.emit(eventName, ...args);
  }

  on(eventName: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(eventName, listener);
    return () => {
      this.eventEmitter.off(eventName, listener);
    };
  }

  off(eventName: string, listener: (...args: any[]) => void) {
    this.eventEmitter.off(eventName, listener);
  }
}

export const eventBus = new EventBus();
