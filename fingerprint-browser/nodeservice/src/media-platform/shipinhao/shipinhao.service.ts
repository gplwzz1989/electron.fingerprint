import { Cookie, logger } from '../../utils';
import WebSocket from 'ws';
import { createHttpInstance } from '../../http';
import { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { MessageBackItem, MessageUserBackItem, Platforms, SyncEventName } from '../../service/datasync-service-manager';
import { Shipinhao, ShipinhaoUserInfoResultOutput } from './shipinhao';
import { getShipinhaoMessageListResponse, getShipinhaoMessageSessionDetailResponse } from './shipinhao-message.service';

export class ShiPinHaoService {
  /**
   * 账号本地存储
   * @private
   */
  private localStorage: Map<string, string>;
  /**
   * 账号cookie池
   * @private
   */
  private cookies: Array<Cookie>;

  /**
   * websocket客户端
   * @private
   */
  private socket: WebSocket;

  /**
   * 当前实例的业务系统内媒体账号id
   * @private
   */
  private accountId: string;

  /**
   * 最后一个成功获取到消息的时间戳，13位
   * @private
   */
  private lastTime: number;

  /**
   * 当前用户信息
   * @private
   */
  private userInfo: ShipinhaoUserInfoResultOutput | undefined;

  //websocket连接地址
  private wsUrl = 'https://channels.weixin.qq.com/';

  // 心跳
  private heartbeatInterval;

  // 请求计数
  private reqNum = 0;

  /**
   *http客户端
   * @private
   */
  private http: AxiosInstance | undefined;

  /**
   * 对话列表，以此来确定是否有新的对话列表，有的话需要获取对话的详细信息，并先给出会话数据出去
   * @private
   */
  private sessionsList: Set<string> = new Set<string>();

  public readonly DataEvent: EventEmitter;

  constructor(accountId: string, lastMsgTimmStamp, cookies: Array<Cookie>, localStorage: Map<string, string>) {
    this.DataEvent = new EventEmitter();
    this.localStorage = localStorage;
    this.cookies = cookies;
    this.accountId = accountId;
    this.http = createHttpInstance();
    this.lastTime = lastMsgTimmStamp;
    this.init();
  }
  private async init() {
    const user = await this.InitUserInfo();
    if (user) {
      throw new Error(user);
    }
    await this.InitSocket();
  }

  private async InitUserInfo(): Promise<string> {
    try {
      const result = await Shipinhao.getShipinhaoUserInfo(this.GetCookieStr());
      if (result?.data?.finderUser?.finderUsername) {
        this.userInfo = result;
        return '';
      } else {
        this.DataEvent.emit(SyncEventName.error, result);
        return result?.msg ?? '';
      }
    } catch (e) {
      console.log('初始化用户信息失败', e);
      return `初始化用户信息失败${e}`;
    }
  }

  private GetCookieStr(): string {
    return this.cookies.map((obj) => `${obj.name}=${obj.value}`).join(';');
  }

  /**
   * 初始化websocket
   * @constructor
   * @private
   */
  private InitSocket(): void {
    const headers = {
      cookie: this.GetCookieStr(),
      referer: 'https://channels.weixin.qq.com',
      origin: 'https://channels.weixin.qq.com',
    };
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const agent = undefined; // new HttpsProxyAgent('http://127.0.0.1:8888');
    this.socket = new WebSocket(this.wsUrl, { headers, agent });

    this.socket.on('open', () => {
      console.log(`websocket连接成功:${this.wsUrl}`);
      //this.reqNum = 0;
      //心跳
      // this.heartbeatInterval = setInterval(() => {
      //   console.log('心跳');
      //   this.socket.send(
      //     JSON.stringify({ createdAt: new Date().getTime(), type: XiaohongshuSiXinSocketType.cHeartMsg }),
      //   );
      // }, 30000);

      //认证信息
      const data = {
        cmd: 0,
        product: 5601,
        seq: this.reqNum,
        http: {
          method: 'POST',
          path: '/cgi-bin/mmfinderassistant-bin/auth/auth_socket_init',
          header: {
            HOST: 'channels.weixin.qq.com',
            cookie: this.GetCookieStr(),
          },
        },
        content: '',
      };

      this.socket.send(JSON.stringify(data));
      this.reqNum++;
    });

    this.socket.on('close', () => {
      console.log('websocket连接断开:', this.wsUrl);
      setTimeout(() => {
        this.InitSocket();
      }, 10000);
    });

    this.socket.on('error', (error) => {
      console.log('websocket连接错误', error);
      setTimeout(() => {
        this.InitSocket();
      }, 10000);
    });

    this.socket.on('message', (msgin) => {
      const msg = msgin.toString('utf-8');
      this.MessageHandler(msg);

      //console.log('收到消息', msgin.toString('utf-8'));
    });
  }

  private async MessageHandler(msgStr: string): Promise<void> {
    if (msgStr?.startsWith('{')) {
      const msgJo = JSON.parse(msgStr);

      //收到用户消息
      if (msgJo.cmd === 1 && msgJo?.scene === 'notify') {
        const sixin = Buffer.from(msgJo.content, 'base64').toString('utf-8');

        if (sixin?.startsWith('{')) {
          const msgCnt = JSON.parse(sixin);
          //新消息
          if (msgCnt?.name === 'NewMsgNotify') {
            try {
              const msgList = await getShipinhaoMessageListResponse(
                this.GetCookieStr(),
                this.userInfo?.data?.finderUser?.finderUsername ?? '',
              );
              if (msgList?.data?.msg?.length > 0) {
                const backMessageList: Array<MessageBackItem> = [];
                const tmpSessions: Set<string> = new Set<string>();
                for (const msgObj of msgList?.data?.msg) {
                  const newItem = {
                    platform: Platforms.ShiPinHao,
                    accountId: this.accountId,
                    messageId: msgObj.svrMsgId,
                    content: msgObj.imgMsg ? JSON.stringify(msgObj.imgMsg) : msgObj.textMsg?.content ?? '',
                    timestamp: msgObj.ts * 1000,
                    messageUserId: msgObj.fromUsername.includes(msgObj.sessionId)
                      ? msgObj.fromUsername
                      : msgObj.toUsername,
                    messageOwnerUserId: this.userInfo?.data?.finderUser?.finderUsername ?? '',
                    raw: msgObj,
                  };
                  backMessageList.push(newItem);
                  if (!this.sessionsList.has(msgObj.sessionId)) {
                    tmpSessions.add(msgObj.sessionId);
                  }
                  if (this.lastTime >= newItem.timestamp) {
                    break;
                  }
                }
                if (tmpSessions.size > 0) {
                  let sessionDetails = await getShipinhaoMessageSessionDetailResponse(
                    this.GetCookieStr(),
                    this.userInfo?.data?.finderUser?.finderUsername ?? '',
                    [...tmpSessions],
                  );

                  if (!(sessionDetails?.data?.sessionInfo?.length > 0)) {
                    sessionDetails = await getShipinhaoMessageSessionDetailResponse(
                      this.GetCookieStr(),
                      this.userInfo?.data?.finderUser?.finderUsername ?? '',
                      [...tmpSessions],
                    );
                  }

                  if (sessionDetails?.data?.sessionInfo?.length > 0) {
                    const backList: Array<MessageUserBackItem> = [];
                    for (const item of sessionDetails?.data?.sessionInfo) {
                      const newItem = {
                        platform: Platforms.ShiPinHao,
                        accountId: this.accountId,
                        messageUserId: item.username,
                        messageUserName: item.nickname,
                        messageUserAvatar: item.headImgUrl,
                        messageOwnerId: this.userInfo?.data?.finderUser?.finderUsername ?? '',
                        sessionId: item.sessionId,
                        raw: item,
                      };
                      backList.push(newItem);
                    }
                    this.DataEvent.emit(SyncEventName.msgUser_data_back, backList);
                    tmpSessions.forEach((x) => this.sessionsList.add(x));
                  } else {
                    return;
                  }
                }
                this.DataEvent.emit(SyncEventName.msg_data_back, backMessageList);
                this.lastTime = msgList.data.msg[0].ts * 1000;
              }
            } catch (e) {
              console.log('获取视频号最新私信失败', e);
            }
          }
        }

        this.reqNum++;
      }
    }
  }
}
