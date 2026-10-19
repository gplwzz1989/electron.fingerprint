import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { MessageWorkerService } from '../src/cloud/task/message_worker_service';
import { BaseWebSocketService } from '../src/cloud/task/base-websocket.service';
import { PlatformAccountInfo } from '../src/cloud/model/BaseTaskFormModel';
import { QueryWorker } from '../src/cloud/task/taskService';
import { MessageBackItem, Platforms, SyncEventName } from '../src/service/datasync-service-manager';
import { logger } from '../src/utils';

type WorkerMode = 'legacy' | 'light';
type StorageMode = 'empty' | 'heavy';

interface MemorySnapshot {
  rssMB: number;
  heapTotalMB: number;
  heapUsedMB: number;
  externalMB: number;
  arrayBuffersMB: number;
}

interface ScenarioResult {
  mode: WorkerMode;
  storageMode: StorageMode;
  workerCount: number;
  storageBytesPerWorker: number;
  before: MemorySnapshot;
  afterStart: MemorySnapshot;
  afterStop: MemorySnapshot;
  deltaStart: MemorySnapshot;
  deltaStop: MemorySnapshot;
}

const SAMPLE_COOKIE =
  'sessionid=BgAAGrlaDRUlh7HGaGxe1ZvRYVbvIG53Gt4dg1kQQqTACUadQ95T3O5Vap2BGSEji%2B9ztC%2BwaP7pB9c5WzQ2A7fgaidsNdvh%2BeOutMFe7IOG; wxuin=2549593460';
const rawStdoutWrite = process.stdout.write.bind(process.stdout);

console.log = () => undefined;
console.info = () => undefined;
console.warn = () => undefined;
console.error = () => undefined;
logger.info = () => undefined;
logger.warn = () => undefined;
logger.error = () => undefined;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toMB(value: number): number {
  return Number((value / 1024 / 1024).toFixed(3));
}

function getMemorySnapshot(): MemorySnapshot {
  const usage = process.memoryUsage();
  return {
    rssMB: toMB(usage.rss),
    heapTotalMB: toMB(usage.heapTotal),
    heapUsedMB: toMB(usage.heapUsed),
    externalMB: toMB(usage.external),
    arrayBuffersMB: toMB(usage.arrayBuffers),
  };
}

function diffMemory(after: MemorySnapshot, before: MemorySnapshot): MemorySnapshot {
  return {
    rssMB: Number((after.rssMB - before.rssMB).toFixed(3)),
    heapTotalMB: Number((after.heapTotalMB - before.heapTotalMB).toFixed(3)),
    heapUsedMB: Number((after.heapUsedMB - before.heapUsedMB).toFixed(3)),
    externalMB: Number((after.externalMB - before.externalMB).toFixed(3)),
    arrayBuffersMB: Number((after.arrayBuffersMB - before.arrayBuffersMB).toFixed(3)),
  };
}

async function forceGC(rounds: number = 3): Promise<void> {
  if (typeof global.gc !== 'function') {
    await delay(200);
    return;
  }

  for (let index = 0; index < rounds; index += 1) {
    global.gc();
    await delay(200);
  }
}

function createSyntheticLocalStorage(bytes: number): Record<string, string> {
  if (bytes <= 0) {
    return {};
  }

  const chunkSize = 16 * 1024;
  const count = Math.ceil(bytes / chunkSize);
  const localStorage: Record<string, string> = {};

  for (let index = 0; index < count; index += 1) {
    const key = `shipinhao_cache_${index.toString().padStart(4, '0')}`;
    const prefix = `${index.toString().padStart(4, '0')}:`;
    const payload = randomBytes(Math.ceil(Math.max(chunkSize - prefix.length, 0) / 2)).toString('hex');
    localStorage[key] = `${prefix}${payload}`.slice(0, chunkSize);
  }

  return localStorage;
}

class LegacyVideoMessageWorkerService extends QueryWorker {
  protected gettingMsg: boolean = true;
  protected drop: boolean = false;
  protected lastMsgTimestamp: string = '';
  protected heartbeatTimer?: NodeJS.Timeout;
  protected wsService?: BaseWebSocketService;

  constructor(account: PlatformAccountInfo) {
    super('', Platforms.ShiPinHao, account);
    this.startHeartbeat();
  }

  public async startGetMessage(loopSecond: number = 30, lastMsgTimestamp?: string): Promise<void> {
    if (lastMsgTimestamp) {
      this.lastMsgTimestamp = lastMsgTimestamp;
    }

    const wsService = await this.tryGetWebSocketService();
    if (wsService) {
      await this.startWebSocketMode(wsService);
      return;
    }

    await this.startPollingMode(loopSecond);
  }

  public stop(): boolean {
    this.drop = true;
    this.gettingMsg = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    if (this.wsService) {
      this.wsService.close();
      this.wsService = undefined;
    }

    this.eventCall?.removeAllListeners();
    this.eventCall = undefined;

    const platformWorker = this.worker as any;
    if (typeof platformWorker.dropMsgService === 'function') {
      void platformWorker.dropMsgService();
    }

    return true;
  }

  private async tryGetWebSocketService(): Promise<BaseWebSocketService | null> {
    try {
      const platformWorker = this.worker as any;
      if (typeof platformWorker.createWebSocketService !== 'function') {
        return null;
      }

      const wsService = await platformWorker.createWebSocketService();
      return wsService ?? null;
    } catch {
      return null;
    }
  }

  private async startWebSocketMode(wsService: BaseWebSocketService): Promise<void> {
    this.wsService = wsService;

    const platformWorker = this.worker as any;
    if (typeof platformWorker.initMsgCursorCookie === 'function') {
      await platformWorker.initMsgCursorCookie();
    }

    this.bindWebSocketEventListeners();
    this.wsService.connect();
  }

  private bindWebSocketEventListeners(): void {
    if (!this.wsService) {
      return;
    }

    const platformWorker = this.worker as any;

    this.wsService.on('connected', () => {
      if (typeof platformWorker.initMsgCursorCookie === 'function') {
        void platformWorker.initMsgCursorCookie();
      }
    });

    this.wsService.on('authFailed', async () => {
      this.wsService = undefined;
      await this.startPollingMode(30);
    });

    this.wsService.on('newMessage', async (notifyData) => {
      await this.fetchAndPushNewMessages(notifyData);
    });
  }

  private async fetchAndPushNewMessages(notifyData?: any): Promise<void> {
    if (notifyData?.messages && Array.isArray(notifyData.messages) && notifyData.messages.length > 0) {
      const lastMessage = notifyData.messages[notifyData.messages.length - 1] as MessageBackItem | undefined;
      if (lastMessage?.timestamp) {
        this.lastMsgTimestamp = String(lastMessage.timestamp);
      }
      return;
    }

    const platformWorker = this.worker as any;
    const result =
      typeof platformWorker.fetchNewMessages === 'function'
        ? await platformWorker.fetchNewMessages(notifyData)
        : await platformWorker.getNewMessageList({
            platformAuthorId: this.account.platformAuthorId ?? '',
          });

    const dataList = result?.dataList as MessageBackItem[] | undefined;
    if (result?.code === 0 && dataList?.length) {
      const lastMessage = dataList[dataList.length - 1];
      if (lastMessage?.timestamp) {
        this.lastMsgTimestamp = String(lastMessage.timestamp);
      }
    }
  }

  private async startPollingMode(loopSecond: number): Promise<void> {
    const loopTime = loopSecond * 1000;
    let hasNewMessage = false;
    let platformSupportsWebSocket = false;

    try {
      const platformWorker = this.worker as any;
      if (typeof platformWorker.createWebSocketService === 'function') {
        const testWs = await platformWorker.createWebSocketService();
        platformSupportsWebSocket = testWs !== null;
        if (testWs) {
          testWs.close();
        }
      }
    } catch {
      platformSupportsWebSocket = false;
    }

    const msgDataBackHandler = (data: MessageBackItem[]) => {
      if (data?.length) {
        hasNewMessage = true;
      }
    };
    const msgDataNotifyHandler = () => {
      hasNewMessage = true;
    };

    this.eventCall?.on(SyncEventName.msg_data_back, msgDataBackHandler);
    this.eventCall?.on(SyncEventName.msg_data_notify, msgDataNotifyHandler);

    try {
      while (!this.drop) {
        if (!this.gettingMsg) {
          await delay(1000);
          continue;
        }

        const platformWorker = this.worker as any;
        await platformWorker.createMsgService(
          { platformAuthorId: this.account.platformAuthorId ?? '' },
          this.eventCall ?? new EventEmitter(),
        );

        if (hasNewMessage && !this.wsService && platformSupportsWebSocket) {
          hasNewMessage = false;
          const wsService = await this.tryGetWebSocketService();
          if (wsService) {
            await this.startWebSocketMode(wsService);
            return;
          }
        } else {
          hasNewMessage = false;
        }

        await delay(loopTime);
      }
    } finally {
      this.eventCall?.off(SyncEventName.msg_data_back, msgDataBackHandler);
      this.eventCall?.off(SyncEventName.msg_data_notify, msgDataNotifyHandler);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.eventCall?.emit('heartbeat', {
        action: 'heartbeat',
        platformAccountId: this.account.platformAccountId ?? 'none',
        code: 0,
        msg: '',
        timestamp: Date.now(),
      });
    }, 59 * 1000);
  }
}

function createAccount(index: number, storageMode: StorageMode, storageBytesPerWorker: number): PlatformAccountInfo {
  return {
    cookie: SAMPLE_COOKIE,
    platformAccountId: `shipinhao-memory-${storageMode}-${index}`,
    platformAuthorId: '',
    authorization: 'memory-benchmark',
    localStorage: storageMode === 'heavy' ? createSyntheticLocalStorage(storageBytesPerWorker) : {},
  };
}

async function runScenario(
  mode: WorkerMode,
  storageMode: StorageMode,
  workerCount: number,
  storageBytesPerWorker: number,
): Promise<ScenarioResult> {
  await forceGC();
  const before = getMemorySnapshot();
  const workers: Array<{ start: () => Promise<void>; stop: () => boolean }> = [];

  for (let index = 0; index < workerCount; index += 1) {
    const account = createAccount(index, storageMode, storageBytesPerWorker);
    const worker =
      mode === 'legacy'
        ? new LegacyVideoMessageWorkerService(account)
        : new MessageWorkerService(Platforms.ShiPinHao, account);

    workers.push({
      start: () => worker.startGetMessage(30).catch(() => undefined),
      stop: () => worker.stop(),
    });
  }

  for (const worker of workers) {
    void worker.start();
  }

  await delay(8000);
  await forceGC();
  const afterStart = getMemorySnapshot();

  for (const worker of workers) {
    worker.stop();
  }

  await delay(3000);
  await forceGC();
  const afterStop = getMemorySnapshot();

  return {
    mode,
    storageMode,
    workerCount,
    storageBytesPerWorker: storageMode === 'heavy' ? storageBytesPerWorker : 0,
    before,
    afterStart,
    afterStop,
    deltaStart: diffMemory(afterStart, before),
    deltaStop: diffMemory(afterStop, before),
  };
}

async function main(): Promise<void> {
  const mode = (process.argv[2] as WorkerMode | undefined) ?? 'legacy';
  const storageMode = (process.argv[3] as StorageMode | undefined) ?? 'empty';
  const workerCountArg = Number(process.argv[4] ?? '10');
  const workerCount = Number.isFinite(workerCountArg) && workerCountArg > 0 ? workerCountArg : 10;
  const storageMBArg = Number(process.argv[5] ?? '3');
  const storageBytesPerWorker =
    storageMode === 'heavy' && Number.isFinite(storageMBArg) && storageMBArg > 0
      ? Math.floor(storageMBArg * 1024 * 1024)
      : 0;

  const result = await runScenario(mode, storageMode, workerCount, storageBytesPerWorker);
  rawStdoutWrite(`__RESULT_START__\n${JSON.stringify(result, null, 2)}\n__RESULT_END__\n`);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await delay(300);
    process.exit();
  });
