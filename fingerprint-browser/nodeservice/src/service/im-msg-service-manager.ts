import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { Platforms } from '@/service/datasync-service-manager';

export class ImMsgServiceManager {
  private static socket: Socket | null = null;
  public static token: string = '';

  public static start(wss_url: string, wss_url_path: string, api_url: string, tokenIn: string) {
    if (!tokenIn || !wss_url) {
      throw new Error('websocket链接token不能为空');
    }
    if (ImMsgServiceManager.socket && tokenIn === ImMsgServiceManager.token) {
      return;
    }

    if (tokenIn != ImMsgServiceManager.token && ImMsgServiceManager.socket && ImMsgServiceManager.socket.connected) {
      //已存在的websocket先进行销毁
      try {
        ImMsgServiceManager.socket.disconnect();
        ImMsgServiceManager.socket = null;
      } catch (error) {
        console.error('websocket断开销毁异常', error);
      }
    }

    ImMsgServiceManager.socket = io(wss_url, {
      transports: ['websocket'],
      path: wss_url_path,
      query: { authorization: tokenIn },
    });
    ImMsgServiceManager.token = tokenIn;

    ImMsgServiceManager.socket.on('connect', () => {
      console.error('websocket链接成功', new Date());
    });
    ImMsgServiceManager.socket.on('disconnect', () => {
      console.error('websocket链接已断开', new Date());
    });
    ImMsgServiceManager.socket.on('error', (error) => {
      console.error('websocket异常', new Date(), error);
    });
    ImMsgServiceManager.socket.on('imessage', (data: IMessage) => {
      console.log(data);
    });

    ImMsgServiceManager.socket.connect();
  }
  private static async messageHandler(msg: IMessage) {
    if (!msg) {
      return;
    }
    //数据同步任务
    if (msg.command.startsWith('get')) {
    }
    //实时处理任务
    else {
      if (msg.platform === Platforms.KuaiShou) {
        //私信
        if (msg.command === IMessageCommandType.addMessage) {
        }
        //评论
        else {
        }
      } else if (msg.platform === Platforms.XiaoHongShu) {
      }
    }
  }
}

export interface IMessage {
  /**
   * 消息针对的平台
   */
  platform: Platforms;
  /**
   * 消息类型，发送，响应
   */
  type: 'send' | 'response';
  /**
   * 消息要执行的命令，目前支持评论和私信
   */
  command: IMessageCommandType;
  /**
   * 消息唯一guid，作为备用，跟踪消息
   */
  msgId: string;
  /**
   * 消息体
   */
  payload: object;
}

export enum IMessageCommandType {
  /**
   * 添加评论
   */
  addComment = 'addComment',
  /**
   * 发送/回复私信
   */
  addMessage = 'addMessage',
  /**
   * 置顶评论
   */
  setTopComment = 'setTopComment',
  /**
   * 取消置顶评论
   */
  cancelTopComment = 'cancelTopComment',
  /**
   * 删除评论
   */
  delComment = 'delComment',

  /**
   * 抓取评论
   */
  getComments = 'getComments',

  /**
   * 抓取私信
   */
  getMessages = 'getMessages',
}
