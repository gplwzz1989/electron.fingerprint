import WebSocket from 'ws';
import { logger } from '@/utils';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

/**
 * 视频号私信WebSocket服务
 * 用于监听视频号的实时私信通知
 */
export class ShipinhaoMessageWebSocketService extends BaseWebSocketService {
  private cookie: string;
  private wxuin: string;
  private proxy?: IWebProxy;
  private reqNum: number = 0;
  private authTimeout?: NodeJS.Timeout;
  private isAuthenticated: boolean = false;

  constructor(cookie: string, wxuin: string, proxy?: IWebProxy) {
    super();
    this.cookie = cookie;
    this.wxuin = wxuin;
    this.proxy = proxy;
  }

  /**
   * 获取WebSocket URL
   */
  protected getWebSocketUrl(): string {
    return 'wss://channels.weixin.qq.com/';
  }

  /**
   * 获取WebSocket连接headers
   */
  protected getWebSocketHeaders(): Record<string, string> {
    return {
      Connection: 'Upgrade',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.185 Safari/537.36',
      Upgrade: 'websocket',
      Origin: 'https://channels.weixin.qq.com',
      'Sec-WebSocket-Version': '13',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'zh-CN',
      Cookie: `sessionid=${encodeURIComponent(this.cookie)}; wxuin=${this.wxuin}`,
      'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
    };
  }

  protected getWebSocketOptions(): WebSocket.ClientOptions {
    if (!this.proxy?.serverAdd) {
      return {};
    }

    return {
      agent: createKuaiProxyAgent(this.proxy),
    };
  }

  /**
   * 获取平台名称
   */
  protected getPlatformName(): string {
    return '视频号';
  }

  /**
   * 连接成功回调 - 发送认证初始化消息
   */
  protected onConnected(): void {
    // 调用父类方法
    super.onConnected();

    // 重置认证状态
    this.isAuthenticated = false;

    // 发送认证初始化消息
    this.sendAuthInit();

    // 设置认证超时(10秒)
    this.authTimeout = setTimeout(() => {
      if (!this.isAuthenticated) {
        logger.error('视频号WebSocket认证超时,将断开连接');
        this.emit('authFailed', '认证超时');
        this.close();
      }
    }, 10000);
  }

  /**
   * 发送认证初始化消息
   */
  private sendAuthInit(): void {
    try {
      const authMessage = {
        cmd: 0,
        product: 5601,
        seq: this.reqNum,
        http: {
          method: 'POST',
          path: '/cgi-bin/mmfinderassistant-bin/auth/auth_socket_init',
          header: {
            HOST: 'channels.weixin.qq.com',
            cookie: `sessionid=${this.cookie}; wxuin=${this.wxuin}`,
          },
        },
        content: '',
      };

      this.send(JSON.stringify(authMessage));
      this.reqNum++;

      logger.info('视频号已发送WebSocket认证初始化消息');
    } catch (error) {
      logger.error(`视频号发送认证初始化消息失败:${error}`);
      this.emit('authFailed', `发送认证消息失败:${error}`);
    }
  }

  /**
   * 处理WebSocket消息
   */
  protected handleMessage(data: WebSocket.Data): void {
    try {
      let message: string;

      if (Buffer.isBuffer(data)) {
        message = data.toString('utf-8');
      } else if (Array.isArray(data)) {
        message = Buffer.concat(data).toString('utf-8');
      } else {
        message = data.toString();
      }

      if (!this.isProdEnv()) {
        logger.info(`视频号收到WebSocket消息(非生产环境),长度=${message.length}`);
      }

      // 尝试解析JSON
      try {
        const jsonData = JSON.parse(message);

        // 处理认证响应 (cmd=0)
        if (jsonData.cmd === 0) {
          // 清除认证超时
          if (this.authTimeout) {
            clearTimeout(this.authTimeout);
            this.authTimeout = undefined;
          }

          if (jsonData.http?.statusCode === 201) {
            // 认证成功
            this.isAuthenticated = true;

            // 解析proxyUid等信息
            if (jsonData.content) {
              try {
                const contentData = JSON.parse(jsonData.content);
                if (contentData.errCode === 0) {
                  logger.info(`视频号WebSocket认证成功,proxyUid:${contentData.data?.proxyUid}`);
                  this.emit('authenticated', contentData.data);
                } else if (contentData.errCode === 300333 || contentData.errCode === 300334) {
                  logger.error(`视频号WebSocket认证失效:errCode=${contentData.errCode}`);
                  this.emit('loginExpire', `认证失效:errCode=${contentData.errCode}`);
                  this.close();
                } else {
                  logger.error(`视频号WebSocket认证失败:errCode=${contentData.errCode}`);
                  this.emit('authFailed', `认证失败:errCode=${contentData.errCode}`);
                  this.close();
                }
              } catch (e) {
                logger.error(`视频号WebSocket认证响应解析失败:${e}`);
                this.emit('authFailed', '认证响应解析失败');
                this.close();
              }
            }
          } else {
            // 认证失败
            logger.error(`视频号WebSocket认证失败:statusCode=${jsonData.http?.statusCode}`);
            this.emit('authFailed', `认证失败:statusCode=${jsonData.http?.statusCode}`);
            this.close();
          }
          return;
        }

        // 检查是否是新消息通知 (cmd=1)
        if (jsonData.cmd === 1 && jsonData.scene === 'notify') {
          // 解码base64内容
          if (jsonData.content) {
            const decodedContent = Buffer.from(jsonData.content, 'base64').toString('utf-8');
            const contentData = JSON.parse(decodedContent);

            // 检查是否是新消息通知
            if (contentData.name === 'NewMsgNotify') {
              logger.info('视频号收到新私信通知');
              this.emit('newMessage', contentData);
            }
          }
        }
      } catch (parseError) {
        // 不是JSON格式,可能是其他类型的消息
        if (!this.isProdEnv()) {
          logger.info(`视频号非JSON消息:${message}`);
        }
      }
    } catch (error) {
      logger.error(`视频号处理消息失败:${error}`);
    }
  }

  /**
   * 更新Cookie
   */
  public updateCookie(cookie: string, wxuin?: string, proxy?: IWebProxy): void {
    this.cookie = cookie;
    if (wxuin) {
      this.wxuin = wxuin;
    }
    this.proxy = proxy;

    // 重置状态
    this.reqNum = 0;
    this.isAuthenticated = false;

    // 清除认证超时
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = undefined;
    }

    // 清理旧的重连计划，避免重复拉起连接
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    // 关闭WebSocket连接但不移除事件监听器
    // 注意: 不调用this.close()，因为它会removeAllListeners()
    this.isClosed = true;
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        logger.error(`视频号关闭WebSocket失败:${error}`);
      }
      this.ws = undefined;
    }

    this.stopHeartbeat();
    this.isConnecting = false;
    this.isClosed = false; // 允许重连

    // 重新连接以使用新的Cookie
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * 关闭连接
   */
  public close(): void {
    // 清除认证超时
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = undefined;
    }

    this.reqNum = 0;
    this.isAuthenticated = false;

    // 调用父类关闭方法
    super.close();
  }

  /**
   * 获取认证状态
   */
  public getAuthStatus(): boolean {
    return this.isAuthenticated;
  }
}

/**
 * WebSocket消息格式
 */
export interface ShipinhaoWebSocketMessage {
  cmd: number;
  seq: number;
  http: {
    statusCode: number;
    header: Record<string, any>;
  };
  encoding: string;
  scene: string;
  content: string; // base64编码的内容
}

/**
 * 新消息通知内容
 */
export interface ShipinhaoNewMessageNotify {
  name: string; // "NewMsgNotify"
}
