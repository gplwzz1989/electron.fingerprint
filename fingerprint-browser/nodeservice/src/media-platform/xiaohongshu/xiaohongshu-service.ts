import { Cookie, logger } from '../../utils';
import WebSocket from 'ws';
import crypto from 'crypto';
import { createHttpInstance } from '../../http';
import { PlatformAuthorInfo } from '../baseModel';
import { AxiosInstance } from 'axios';
//import { HttpsProxyAgent } from 'https-proxy-agent';
import { EventEmitter } from 'events';
import {
  MessageBackItem,
  MessageType,
  Platforms,
  SessionType,
  SyncEventName,
} from '@/service/datasync-service-manager';
import { Xiaohongshu } from './xiaohongshu';
export class XiaHongShuProService {
  /**
   * 账号本地存储
   * @private
   */
  public localStorage: Map<string, string>;

  public localSessionCache: Map<string, object>;
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
   * 当前用户信息
   * @private
   */
  private userInfo: XiaohongshuProUserInfo | undefined;

  //websocket连接地址
  private wsUrl = 'https://zelda.xiaohongshu.com/websocketV2';

  // 心跳
  private heartbeatInterval;

  // 请求计数
  private reqNum = 1;

  /**
   *http客户端
   * @private
   */
  private http: AxiosInstance | undefined;

  public readonly DataEvent: EventEmitter;

  constructor(accountId: string, cookies: Array<Cookie>, localStorage: Map<string, string>, event?: EventEmitter) {
    this.DataEvent = event ?? new EventEmitter();
    this.localStorage = localStorage;
    this.localSessionCache = new Map<
      string,
      {
        user_id: string;
        nickname: string;
        last_msg_store_id: number;
        avatar: string;
        last_msg_ts: number;
      }
    >();
    this.cookies = cookies;
    this.accountId = accountId;
    this.http = createHttpInstance();
    //this.init();
  }
  public async init() {
    const user = await this.InitUserInfo();
    if (user) {
      throw new Error(user);
    }
    await this.GetWebSocketToken();
    await this.InitSocket();
  }
  public async stop() {
    if (this.socket) {
      this.socket.removeAllListeners();
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, '客户端主动断开');
      }
      this.socket = null;
    }
  }
  public updateCookie(cookie: any) {
    this.cookies = cookie;
  }
  private async GetWebSocketToken(): Promise<void> {
    try {
      const url =
        'https://fe-static.xhscdn.com/formula-static/walle-ad/public/js/main.12094cf.js?fetch_microapp_resource';

      const headers = {
        referer: 'https://pro.xiaohongshu.com',
        origin: 'https://pro.xiaohongshu.com',
      };

      const result = await this.http?.get(url, { headers: headers, responseType: 'text' });
      const preStr = result?.data?.toString()?.split('appId:"')[1];
      const wsAppId = preStr?.split('"')[0];
      const wsToken = preStr?.split('token:"')[1]?.split('"')[0];
      if (this.userInfo) {
        this.userInfo['wsToken'] = wsToken;
        this.userInfo['wsAppId'] = wsAppId;
      }
    } catch (e) {
      console.log('获取websoket信息失败', e);
    }
  }

  private async InitUserInfo(): Promise<string> {
    try {
      const result = await Xiaohongshu.Pro.getXiaohongshuProUserInfo(this.GetCookieStr());
      if (result?.yixiaoerId) {
        this.userInfo = {
          code: result.code,
          yixiaoerId: result.yixiaoerId,
          yixiaoerName: result.yixiaoerName,
          yixiaoerImageUrl: result.yixiaoerImageUrl,
          raw: result.raw,
          cUserId: (result.raw as any)?.c_user_id?.toString() ?? '',
          bUserId: (result.raw as any)?.b_user_id?.toString() ?? '',
        };

        if (this.userInfo.code != 0) {
          return `获取用户信息失败:${result?.msg}`;
        }
      }
      if (this.userInfo?.yixiaoerId) {
        // const sellUrl = 'https://pro.xiaohongshu.com/api/eros/user/info';
        // const sellRe = await this.http?.get(sellUrl, { headers: headers });
        // if (sellRe?.data) {
        //   this.userInfo['sellerId'] = sellRe.data?.data?.vSellerId;
        // }
        // const authUrl = 'https://pro.xiaohongshu.com/api/edith/eros/im/auth';
        // headers['Content-Type'] = 'application/json';
        // const authRe = await this.http?.post(authUrl, '{}', { headers: headers });
        // if (authRe?.data) {
        //   this.userInfo['userId1'] = authRe.data?.data?.userId;
        // }
        return '';
      } else {
        return '登陆失效';
      }
    } catch (e) {
      console.log('初始化用户信息失败', e);
      return `初始化用户信息失败${e}`;
    }
  }

  private GetCookieStr(): string {
    if (this.cookies.length && typeof this.cookies == 'object') {
      return this.cookies.map((obj) => `${obj.name}=${obj.value}`).join(';');
    } else {
      if (!this.cookies?.toString()?.startsWith('[') && this.cookies?.toString()?.includes('=')) {
        return this.cookies?.toString();
      }
      const re = JSON.parse(this.cookies?.toString());
      return re.map((obj) => `${obj.name}=${obj.value}`).join(';');
    }
  }

  /**
   * 初始化websocket
   * @constructor
   * @private
   */
  private InitSocket(): void {
    const headers = {
      cookie: this.GetCookieStr(),
      referer: 'https://pro.xiaohongshu.com',
      origin: 'https://pro.xiaohongshu.com',
    };
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const agent = undefined; // new HttpsProxyAgent('http://127.0.0.1:8888');
    this.socket = new WebSocket(this.wsUrl, { headers, agent });
    this.socket.on('open', () => {
      console.log(`websocket连接成功:${this.wsUrl}`);
      this.reqNum = 1;
      //心跳
      this.heartbeatInterval = setInterval(() => {
        //console.log('心跳');
        this.socket.send(
          JSON.stringify({ createdAt: new Date().getTime(), type: XiaohongshuSiXinSocketType.cHeartMsg }),
        );
      }, 30000);

      //认证信息
      this.reqNum++;
      this.socket.send(
        JSON.stringify({
          type: XiaohongshuSiXinSocketType.cInitMsg,
          token: this.userInfo ? this.userInfo['wsToken'] : '',
          appId: this.userInfo ? this.userInfo['wsAppId'] : '',
        }),
      );
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
    try {
      if (msgStr?.startsWith('{')) {
        const msgJo = JSON.parse(msgStr);

        //第一次校验消息，通过后就能收发消息了
        if (msgJo.type === XiaohongshuSiXinSocketType.sUserAuthMsg && msgJo?.seq === 2 && msgJo?.secureKey) {
          const signTopic = this.AESECBEncrypt(msgJo.secureKey, this.userInfo?.bUserId ?? '');
          this.socket.send(
            JSON.stringify({
              type: XiaohongshuSiXinSocketType.cUserAuthMsg,
              seq: this.reqNum,
              topic: signTopic,
              encrypt: true,
            }),
          );
          this.reqNum++;
        }

        //收到用户消息的时候需要做ack回应
        if (msgJo.type === XiaohongshuSiXinSocketType.sUserMsg) {
          const sixin = msgJo.data?.payload?.sixin_message as XiaohongshuSiXinObj;

          this.socket.send(
            JSON.stringify({ type: XiaohongshuSiXinSocketType.cUserMsgAck, ack: msgJo.seq, seq: this.reqNum }),
          );
          if (!sixin?.sender_id) {
            return;
          }
          const backMessageList: Array<MessageBackItem> = [];
          const isMe = sixin?.sender_id === this.userInfo?.cUserId;

          const sessionId = isMe ? sixin.receiver_id : sixin.sender_id;
          const msg = {
            platform: Platforms.XiaoHongShu,
            accountId: this.accountId,
            messageId: sixin.id,
            content: sixin.content,
            timestamp: sixin.created_at,
            messageUserId: isMe ? sixin.receiver_id : sixin.sender_id,
            messageOwnerUserId: this.userInfo?.bUserId ?? '',
            sessionId: sessionId,
            secSessionId: '',
            sessionType: SessionType.stranger,
            messageType: MessageType.text,
            //raw: sixin,
          };

          if (msgJo?.data?.payload?.first_unreply_time) {
            msg.sessionType = SessionType.friend;
          }
          if (sixin?.content?.includes('用户进入会话')) {
            this.localSessionCache.set(sessionId, msgJo.data?.payload?.sixin_chat);
          }
          if (sixin.message_type === 'IMAGE') {
            msg.messageType = MessageType.image;
          } else if (sixin.message_type === 'CARD') {
            msg.messageType = MessageType.card;
          }

          backMessageList.push(msg);
          this.DataEvent.emit(SyncEventName.msg_data_back, backMessageList);

          this.reqNum++;
        }
      }
    } catch (e) {
      logger.error(`处理小红书私信消息异常${(e as Error)?.message ?? JSON.stringify(e)}`);
    }
  }
  /**
   * topic计算
   * @param key
   * @param text
   * @constructor
   */
  public AESECBEncrypt(key: string, text: string): string {
    const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }
}

enum XiaohongshuSiXinSocketType {
  cInitMsg = 1,
  sUserMsg = 2,
  cUserAuthMsg = 10,
  sUserAuthMsg = 129,
  cUserMsgAck = 130,
  cHeartMsg = 132,
}

interface XiaohongshuProUserInfo extends PlatformAuthorInfo {
  /**
   * 普通用户huid
   */
  cUserId: string;
  /**
   * 专业号id
   */
  bUserId: string;
}

interface XiaohongshuSiXinObj {
  store_id: 70;
  set_message_type: true;
  set_content: true;
  set_receiver_id: true;
  receiver_id: '61b8073f000000001000c5c2';
  set_grantor_user_id: false;
  created_at: 1737518234799;
  message_type: 'TEXT' | 'IMAGE' | 'CARD';
  content: '我特容易';
  sender_id: '5b7b6eb42352610001dcd389';
  set_created_at: true;
  set_sender_id: true;
  set_store_id: true;
  set_id: true;
  id: '5b7b6eb42352610001dcd389.61b8073f000000001000c5c2.1e7906c9a1baadf';
}
