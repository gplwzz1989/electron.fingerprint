import WebSocket from 'ws';
import { logger } from '@/utils';
import { EventEmitter } from 'events';

/**
 * WebSocket服务基类
 * 提供通用的WebSocket连接管理、重连、心跳等功能
 * 各平台继承此类实现自己的消息处理逻辑
 */
export abstract class BaseWebSocketService extends EventEmitter {
  protected ws?: WebSocket;
  protected reconnectTimer?: NodeJS.Timeout;
  protected heartbeatTimer?: NodeJS.Timeout;
  protected isConnecting: boolean = false;
  protected isClosed: boolean = false;
  protected reconnectAttempts: number = 0;
  protected maxReconnectAttempts: number = 10;
  protected removeListenersOnClosed: boolean = false;
  protected reconnectDelay: number = 5000; // 5秒
  protected heartbeatInterval: number = 30000; // 30秒

  /**
   * 获取WebSocket URL
   * 子类必须实现
   */
  protected abstract getWebSocketUrl(): string;

  /**
   * 获取WebSocket连接headers
   * 子类必须实现
   */
  protected abstract getWebSocketHeaders(): Record<string, string>;

  /**
   * 鑾峰彇WebSocket杩炴帴閰嶇疆
   * 瀛愮被鍙寜闇€瑕佽鍐?
   */
  protected getWebSocketOptions(): WebSocket.ClientOptions {
    return {};
  }

  /**
   * 获取WebSocket子协议
   * 子类可按需重写
   */
  protected getWebSocketProtocols(): string | string[] | undefined {
    return undefined;
  }

  /**
   * 处理WebSocket消息
   * 子类必须实现
   */
  protected abstract handleMessage(data: WebSocket.Data): void;

  /**
   * 获取平台名称(用于日志)
   * 子类必须实现
   */
  protected abstract getPlatformName(): string;

  protected isProdEnv(): boolean {
    return process.env.ENV === 'prod';
  }

  protected logNonProd(message: string): void {
    if (process.env.ENV === 'test') {
      logger.info(message);
    }
  }

  protected getJitteredDelay(baseMs: number, ratio: number = 0.2): number {
    if (baseMs <= 0) {
      return 0;
    }

    const delta = Math.floor(baseMs * ratio);
    const min = Math.max(0, baseMs - delta);
    const max = baseMs + delta;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 连接WebSocket
   */
  public connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      this.logNonProd(`${this.getPlatformName()} WebSocket已连接或正在连接中`);
      return;
    }

    this.isConnecting = true;
    this.isClosed = false;

    try {
      const wsUrl = this.getWebSocketUrl();
      const headers = this.getWebSocketHeaders();

      const protocols = this.getWebSocketProtocols();
      if (protocols) {
        this.ws = new WebSocket(wsUrl, protocols, {
          headers: headers,
          ...this.getWebSocketOptions(),
        });
      } else {
        this.ws = new WebSocket(wsUrl, {
          headers: headers,
          ...this.getWebSocketOptions(),
        });
      }

      this.ws.on('open', () => {
        this.onConnected();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          this.handleMessage(data);
        } catch (error) {
          logger.error(`${this.getPlatformName()} 处理WebSocket消息失败:${error}`);
        }
      });

      this.ws.on('error', (error: Error) => {
        this.onError(error);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        this.onClosed(code, reason);
      });
    } catch (error) {
      this.isConnecting = false;
      logger.error(`${this.getPlatformName()} 创建WebSocket连接失败:${error}`);
      this.emit('error', error);

      if (!this.isClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else if (!this.isClosed) {
        this.onReconnectFailed(error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * 连接成功回调
   */
  protected onConnected(): void {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.logNonProd(`${this.getPlatformName()} WebSocket连接成功`);
    this.emit('connected');
    this.startHeartbeat();
  }

  /**
   * 错误回调
   */
  protected onError(error: Error): void {
    logger.error(`${this.getPlatformName()} WebSocket错误:${error.message}`);
    this.emit('error', error);
  }

  /**
   * 连接关闭回调
   */
  protected onClosed(code: number, reason: Buffer): void {
    this.isConnecting = false;
    this.stopHeartbeat();

    if (this.isClosed) {
      this.logNonProd(`${this.getPlatformName()} WebSocket连接关闭:code=${code},reason=${reason.toString()}`);
    } else {
      logger.error(`${this.getPlatformName()} WebSocket连接关闭:code=${code},reason=${reason.toString()}`);
    }
    this.emit('closed', code, reason.toString());
    if (this.removeListenersOnClosed) {
      this.removeListenersOnClosed = false;
      this.removeAllListeners();
    }

    // 如果不是主动关闭，则尝试重连
    if (!this.isClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else if (!this.isClosed) {
      this.onReconnectFailed(`code=${code},reason=${reason.toString()}`);
    }
  }

  protected onReconnectFailed(reason: string): void {
    this.isClosed = true;
    this.isConnecting = false;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    logger.error(`${this.getPlatformName()} WebSocket重连已达到最大次数，停止重连:${reason}`);
    this.emit('reconnectFailed', reason);
  }

  /**
   * 启动心跳
   * 子类可以重写此方法实现自定义心跳逻辑
   */
  protected startHeartbeat(): void {
    this.stopHeartbeat();

    const scheduleNextHeartbeat = () => {
      this.heartbeatTimer = setTimeout(
        () => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              this.sendHeartbeat();
            } catch (error) {
              logger.error(`${this.getPlatformName()} 发送心跳失败:${error}`);
            }

            if (!this.isClosed && this.ws.readyState === WebSocket.OPEN) {
              scheduleNextHeartbeat();
            }
          }
        },
        this.getJitteredDelay(this.heartbeatInterval, 0.1),
      );
    };

    scheduleNextHeartbeat();
  }

  /**
   * 发送心跳
   * 子类可以重写此方法实现自定义心跳消息
   */
  protected sendHeartbeat(): void {
    // 默认发送ping帧
    this.ws?.ping();
    this.logNonProd(`${this.getPlatformName()} 发送WebSocket心跳`);
  }

  /**
   * 停止心跳
   */
  protected stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * 安排重连
   */
  protected scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const baseDelay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5); // 最多延迟25秒
    const delay = this.getJitteredDelay(baseDelay);

    this.logNonProd(`${this.getPlatformName()} 将在${delay}ms后尝试第${this.reconnectAttempts}次重连`);

    this.reconnectTimer = setTimeout(() => {
      this.logNonProd(`${this.getPlatformName()} 开始第${this.reconnectAttempts}次重连`);
      this.connect();
    }, delay);
  }

  /**
   * 关闭连接
   */
  public close(): void {
    this.isClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.stopHeartbeat();

    const hasWs = !!this.ws;

    if (hasWs) {
      try {
        this.removeListenersOnClosed = true;
        this.ws.close();
      } catch (error) {
        logger.error(`${this.getPlatformName()} 关闭WebSocket失败:${error}`);
      }
      this.ws = undefined;
    }

    if (!hasWs) {
      this.removeAllListeners();
    }
    this.logNonProd(`${this.getPlatformName()} WebSocket已关闭`);
  }

  /**
   * 获取连接状态
   */
  public isConnected(): boolean {
    return this.ws !== undefined && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 发送消息
   */
  protected send(data: string | Buffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      logger.error(`${this.getPlatformName()} WebSocket未连接，无法发送消息`);
    }
  }
}
