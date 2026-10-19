import { Guid, Task } from '@/utils';
import { EventEmitter } from 'events';
import { Kuaishou } from '@/media-platform';
import { IWebProxy } from '@/media-platform/webproxy';
import { $http } from '@/http';
import { ImMsgServiceManager } from '@/service/im-msg-service-manager';
import { AccountManager } from '@/service/account-manage';

export class DataSyncService {
  private dataSyncRunning: boolean = false;
  private stop: boolean = false;
  private taskList: Map<string, DataSyncTaskItem> = new Map();

  private callbackUrl: string = '';

  public readonly callback: EventEmitter;

  constructor() {
    this.callback = new EventEmitter();
  }

  public async startDataSyncServiceWorker(
    isNew: boolean = false,
    wss_url: string,
    wss_url_path: string,
    api_url: string,
    tokenIn: string,
  ) {
    let init = false;
    this.stop = false;
    if (isNew) {
    }

    if (this.dataSyncRunning) {
      return;
    }
    this.dataSyncRunning = true;
    ImMsgServiceManager.start(wss_url, wss_url_path, api_url, tokenIn);

    while (!this.stop) {
      try {
        const now = new Date();
        now.setDate(now.getDate() - 7);
        if (!init || AccountManager.accountList.size === 0) {
          init = await AccountManager.initAllPlatformAccounts(tokenIn, api_url);
          if (init && AccountManager.accountList.size > 0) {
            for (const item of AccountManager.accountList.keys()) {
              const account = AccountManager.accountList.get(item);
              if (account) {
                this.taskList.set(item, {
                  platformName: account.platformName as Platforms,
                  accountId: account.id,
                  syncType: 'Comment',
                  taskId: Guid.NewGuid(),
                  textMinDateTime: now,
                  maxPage: 10,
                  accountCookieStr: '',
                });
              }
            }
          }
        }
        if (!init) {
          await Task.Delay(2000);
          continue;
        }

        this.callback.emit(SyncEventName.account_task_progress, `0/${this.taskList.size}`);
        let i = 0;
        for (const task of this.taskList) {
          i++;
          this.callback.emit(SyncEventName.account_task_progress, `${i}/${this.taskList.size}`);

          //数据回调
          const dataBackEvent = new EventEmitter();
          dataBackEvent.on(SyncEventName.content_data_back, (data) => {
            sendCommentContentList(this.callbackUrl, data);
          });
          dataBackEvent.on(SyncEventName.comment_data_back, (data) => {
            sendCommentList(this.callbackUrl, data);
          });

          //获取cookie
          task[1].accountCookieStr = (await AccountManager.getPlatformAccountCookie(task[1].accountId)) ?? '';

          //任务执行
          if (task[1].platformName === Platforms.KuaiShou) {
            await Kuaishou.getKuaiShouComment(task[1], dataBackEvent, this.callback);
          } else if (task[1].platformName === Platforms.XiaoHongShu) {
            continue;
          }
          await Task.Delay(1000);
        }
      } catch (e) {
        console.error('数据同步错误', e);
        await Task.Delay(2000);
      }
    }
    this.dataSyncRunning = false;
  }

  public stopWork() {
    this.stop = true;
  }
}

export interface DataSyncTask {
  /**
   *任务结果回调地址
   */
  callbackUrl: string;
  /**
   * 任务列表
   */
  list: Array<DataSyncTaskItem>;
}

/**
 * 统一的评论抓取任务
 */
export interface DataSyncTaskItem {
  /**
   * 平台名称
   */
  platformName: Platforms;
  /**
   * 账号唯一id
   */
  accountId: string;
  /**
   * 账号有效cookie字符串,cookie1=123；COOKIE2=124
   */
  accountCookieStr: string;

  proxy?: IWebProxy;
  /**
   * 任务类型
   */
  syncType: 'Comment' | 'PrivateMessage';
  /**
   * 任务id
   */
  taskId: string;

  /**
   * 任务获取数据的最小日期,和最大翻页数参数一起确定获取数据的最大数量，以两个参数中较小值确定
   */
  textMinDateTime: Date;

  /**
   * 作品最小时间
   */
  contentMinDateTime?: Date;
  /**
   * 最大翻页数
   */
  maxPage: number;

  /**
   * 抓取数据的最新一条评论的时间戳
   */
  commentLastTimeStamp?: number;

  contentList?: { [key: string]: { xsecToken?: string; commentCount: number; timestamp: number } };

  /**
   * 私信最新时间戳
   */
  msgLastTimeStamp?: number;
}

/**
 * 评论数据抓取过程的事件
 */
export enum SyncEventName {
  /**
   * 账号任务处理进度
   */
  account_task_progress = 'account_task_progress',
  /**
   * 内容任务处理进度
   */
  content_progress = 'content_progress',
  /**
   * 内容数据
   */
  content_data_back = 'content_data_back',
  /**
   * 评论数据
   */
  comment_data_back = 'comment_data_back',
  /**
   * 私信对话任务处理进度
   */
  msgUser_progress = 'msgUser_progress',
  /**
   * 私信对话列表
   */
  msgUser_data_back = 'msgUser_data_back',
  /**
   * 私信消息列表
   */
  msg_data_back = 'msg_data_back',

  /**
   * 私信消息列表
   */
  msg_data_notify = 'msg_data_notify',

  /**
   * 产生错误信息
   */
  error = 'error',
}
export enum Platforms {
  /**
   * 快手
   */
  KuaiShou = 'KuaiShou',
  /**
   * 小红书
   */
  XiaoHongShu = 'XiaoHongShu',
  /**
   * RedNote（小红书海外平台）
   */
  RedNote = 'RedNote',
  /**
   * 抖音
   */
  DouYin = 'DouYin',
  /**
   * 视频号
   */
  ShiPinHao = 'ShiPinHao',
  /**
   * 哔哩哔哩
   */
  BiLiBiLi = 'BiLiBiLi',
  /**
   * 百家号
   */
  BaiJiaHao = 'BaiJiaHao',
  /**
   * 头条号
   */
  TouTiaoHao = 'TouTiaoHao',
  /**
   * 新浪微博
   */
  XinLangWeiBo = 'XinLangWeiBo',
  /**
   * 西瓜视频
   */
  XiGuaShiPin = 'XiGuaShiPin',
  /**
   * 知乎
   */
  ZhiHu = 'ZhiHu',
  /**
   * 企鹅号
   */
  QiEHao = 'QiEHao',
  /**
   * 搜狐号
   */
  SouHuHao = 'SouHuHao',
  /**
   * 一点号
   */
  YiDianHao = 'YiDianHao',
  /**
   * 大鱼号
   */
  DaYuHao = 'DaYuHao',
  /**
   * 网易号
   */
  WangYiHao = 'WangYiHao',
  /**
   * 爱奇艺
   */
  AiQiYi = 'AiQiYi',
  /**
   * 腾讯视频
   */
  TengXunWeiShi = 'TengXunWeiShi',

  /**
   * 微信公众号
   */
  WeiXinGongZhongHao = 'WeiXinGongZhongHao',

  /**
   * 搜狐视频
   */
  SouHuShiPin = 'SouHuShiPin',

  /**
   * 皮皮虾
   */
  PiPiXia = 'PiPiXia',
  /**
   * 腾讯视频
   */
  TengXunShiPin = 'TengXunShiPin',
  /**
   * 多多视频
   */
  DuoDuoShiPin = 'DuoDuoShiPin',
  /**
   * A站，ACFun
   */
  AcFun = 'AcFun',

  /**
   * 美拍
   */
  MeiPai = 'MeiPai',

  /**
   * 快传号
   */
  KuaiChuanHao = 'KuaiChuanHao',

  /**
   * 雪球号
   */
  XueQiuHao = 'XueQiuHao',

  /**
   * 小红书商家号
   */
  XiaoHongShuShangJiaHao = 'XiaoHongShuShangJiaHao',

  /**
   * 美柚
   */
  MeiYou = 'MeiYou',

  /**
   * 车家号
   */
  CheJiaHao = 'CheJiaHao',

  /**
   * 易车号
   */
  YiCheHao = 'YiCheHao',

  /**
   * 懂车号
   */
  DongCheHao = 'DongCheHao',

  /**
   * 峰网
   */
  FengWang = 'FengWang',

  /**
   * 豆瓣
   */
  DouBan = 'DouBan',

  /**
   * CSDN
   */
  CSDN = 'CSDN',

  /**
   * 得物
   */
  DeWu = 'DeWu',

  /**
   * 简书
   */
  JianShu = 'JianShu',

  /**
   * WiFi万能钥匙
   */
  WiFiWanNengYaoShi = 'WiFiWanNengYaoShi',

  /**
   * 豆包
   */
  AI_DouBao = 'AI_DouBao',

  /**
   * DeepSeek
   */
  AI_DeepSeek = 'AI_DeepSeek',

  /**
   * 元宝
   */
  AI_YuanBao = 'AI_YuanBao',

  /**
   * KiMi
   */
  AI_KiMi = 'AI_KiMi',

  /**
   * 百度
   */
  AI_BaiDu = 'AI_BaiDu',

  /**
   * 小红书首页授权
   */
  XiaoHongShuHome = 'XiaoHongShuHome',

  /**
   * 淘宝光合
   */
  TaoBaoGuangHe = 'TaoBaoGuangHe',

  /**
   * 喜马拉雅
   */
  Ximalaya = 'Ximalaya',
}

export const ShiPinHaoStorePlatformCode = 'ShiPinHaoStore';

export const XiaoHongShuShouYePlatformCode = 'XiaoHongShuShouYe';

export type PlatformCodeInput =
  | Platforms
  | string
  | { platformCode?: Platforms | string }
  | Array<{ platformCode?: Platforms | string }>;

export const normalizePlatformCode = (platform: PlatformCodeInput): Platforms | string => {
  const input = Array.isArray(platform)
    ? platform[0]?.platformCode
    : typeof platform === 'object'
    ? platform.platformCode
    : platform;

  if (!input) return '';

  if (input === ShiPinHaoStorePlatformCode) {
    return Platforms.ShiPinHao;
  }

  if (input === XiaoHongShuShouYePlatformCode) {
    return Platforms.XiaoHongShuHome;
  }

  if (input === '淘宝光合') {
    return Platforms.TaoBaoGuangHe;
  }

  if (input === '懂车号' || input === '懂车帝') {
    return Platforms.DongCheHao;
  }

  // API/存量账号可能传平台显示名或不同大小写，统一成任务 Worker 使用的枚举值。
  const normalized = input.trim().toLowerCase();
  if (
    normalized === Platforms.RedNote.toLowerCase() ||
    input === '小红书海外版' ||
    input === 'RedNote（小红书海外版）'
  ) {
    return Platforms.RedNote;
  }

  return input;
};

/**
 * A类平台
 */
export const APlatforms = [
  'KuaiShou',
  'XiaoHongShu',
  'DouYin',
  'ShiPinHao',
  'XinLangWeiBo',
  'TengXunWeiShi',
  'DuoDuoShiPin',
  'MeiPai',
];
export const platformNamesRe = {
  抖音: 'DouYin',
  快手: 'KuaiShou',
  视频号: 'ShiPinHao',
  哔哩哔哩: 'BiLiBiLi',
  小红书: 'XiaoHongShu',
  RedNote: 'RedNote',
  小红书海外版: 'RedNote',
  小红书首页: 'XiaoHongShuHome',
  百家号: 'BaiJiaHao',
  头条号: 'TouTiaoHao',
  新浪微博: 'XinLangWeiBo',
  西瓜视频: 'XiGuaShiPin',
  知乎: 'ZhiHu',
  企鹅号: 'QiEHao',
  搜狐号: 'SouHuHao',
  一点号: 'YiDianHao',
  大鱼号: 'DaYuHao',
  网易号: 'WangYiHao',
  爱奇艺: 'AiQiYi',
  腾讯微视: 'TengXunWeiShi',
  微信公众号: 'WeiXinGongZhongHao',
  搜狐视频: 'SouHuShiPin',
  皮皮虾: 'PiPiXia',
  腾讯视频: 'TengXunShiPin',
  多多视频: 'DuoDuoShiPin',
  AcFun: 'AcFun',
  AZhan: 'AcFun',
  A站: 'AcFun',
  美拍: 'MeiPai',
  快传号: 'KuaiChuanHao',
  雪球号: 'XueQiuHao',
  小红书商家号: 'XiaoHongShuShangJiaHao',
  美柚: 'MeiYou',
  车家号: 'CheJiaHao',
  易车号: 'YiCheHao',
  懂车号: 'DongCheHao',
  懂车帝: 'DongCheHao',
  淘宝光合: 'TaoBaoGuangHe',
};
export const platformNamesRePin = {
  DouYin: '抖音',
  KuaiShou: '快手',
  ShiPinHao: '视频号',
  BiLiBiLi: '哔哩哔哩',
  XiaoHongShu: '小红书',
  RedNote: 'RedNote（小红书海外版）',
  XiaoHongShuHome: '小红书首页',
  BaiJiaHao: '百家号',
  TouTiaoHao: '头条号',
  XinLangWeiBo: '新浪微博',
  XiGuaShiPin: '西瓜视频',
  ZhiHu: '知乎',
  QiEHao: '企鹅号',
  SouHuHao: '搜狐号',
  YiDianHao: '一点号',
  DaYuHao: '大鱼号',
  WangYiHao: '网易号',
  AiQiYi: '爱奇艺',
  TengXunWeiShi: '腾讯微视',
  WeiXinGongZhongHao: '微信公众号',
  SouHuShiPin: '搜狐视频',
  PiPiXia: '皮皮虾',
  TengXunShiPin: '腾讯视频',
  DuoDuoShiPin: '多多视频',
  AZhan: 'A站',
  MeiPai: '美拍',
  易车号: 'YiCheHao',
  DongCheHao: '懂车号',
  TaoBaoGuangHe: '淘宝光合',
};

/**
 * 评论所属内容对象
 */
export interface ContentBackItem {
  /**
   * 内容所属平台，来自于任务
   */
  platform: Platforms;
  /**
   * 内容所属媒体号id,来自于任务
   */
  accountId?: string;
  /**
   * 内容id,用于评论相关功能
   */
  contentId: string;

  /**
   * 作品访问所需的动态参数
   */
  xsecToken?: string;

  /**
   * 内容id，用于和发布内容列表关联
   */
  documentId?: string;
  /**
   * 内容标题
   */
  title?: string;

  /**
   * 封面url
   */
  cover?: string;

  /**
   * 内容描述（描述过长时截取前100个字符）
   */
  desc?: string;
  /**
   * 作品时间戳
   */
  timestamp: number;

  /**
   * 评论数
   */
  commentCount?: number;

  /**
   * 增加品论数
   */
  addCommentCount?: number;

  /**
   * 官方原始数据
   */
  raw?: object;
}

/**
 * 评论对象
 */
export interface CommentBackItem {
  /**
   * 平台名称
   */
  platform: Platforms;
  /**
   * 评论所属作品所属账号id
   */
  accountId: string;
  /**
   * 评论所属内容id
   */
  contentId: string;

  /**
   * 作品访问所需的动态参数
   */
  xsecToken?: string;
  /**
   * 作品第二id
   */
  documentId?: string;

  /**
   * 评论所属作品标题
   */
  docTitle?: string;
  /**
   * 评论所属作品封面
   */
  docCover?: string;
  /**
   * 评论id
   */
  commentId: string;
  /**
   * 评论内容
   */
  content: string;
  /**
   * 评论时间戳位13位
   */
  timestamp: number;

  /**
   * 二级评论数
   */
  commentCount?: number;
  /**
   * 评论人用户id
   */
  commentUserId: string;
  /**
   * 评论人用户昵称
   */
  commentUserName: string;

  /**
   * 评论人头像
   */
  commentUserAvatar: string;

  /**
   * 回复针对的评论id
   */
  replyToCommentId?: string;
  /**
   * 评论回复的目标用户id，当评论是针对作品时，可为空，一般针对某个评论进行回复时有
   */
  replyToUserId?: string;

  /**
   * 评论回复的目标用户昵称，当评论是针对作品时，可为空，一般针对某个评论进行回复时有
   */
  replyToUserName?: string;

  /**
   * 父评论id，一般子级评论有这个参数值
   */
  parentId?: string;

  hasMore?: boolean;
  /**
   * 官方原始结构
   */
  raw?: object;

  /**
   * 是否是比较新的数据，还是历史数据,如何界定新数据?距离当前时间的长短？
   */
  isNew?: boolean;

  isAuthor?: boolean;
}

export interface MessageUserBackItem {
  /**
   * 内容所属平台，来自于任务
   */
  platform: Platforms;
  /**
   * 内容所属账号id,来自于任务
   */
  accountId: string;
  /**
   * 消息对话对方用户id
   */
  messageUserId: string;
  /**
   * 消息对话对方用户昵称
   */
  messageUserName: string;

  /**
   * 消息对话对方用户头像
   */
  messageUserAvatar: string;
  /**
   * 消息对话所属用户id
   */
  messageOwnerId?: string;

  /**
   * 会话id
   */
  sessionId: string;

  /**
   * 第二会话id
   */
  secSessionId?: string;
  /**
   * 会话票据
   */
  ticket?: string;
  /**
   * 原始数据
   */
  raw?: object;
}

/**
 * 私信消息结构
 */
export interface MessageBackItem {
  /**
   * 平台名称
   */
  platform: Platforms;
  /**
   * 评论所属作品所属账号id
   */
  accountId: string;
  /**
   * 评论id
   */
  messageId: string;
  /**
   * 文本消息内容字符串，可能是json字符串等非纯文本字符串
   */
  content: string;

  /**
   * 图片消息url
   */
  imgUrl?: string;

  /**
   * 媒体信息，图片/文件等需要单独解析时使用
   */
  mediaInfo?: MessageMediaInfo;

  messageType?: MessageType;
  /**
   * 评论时间戳位13位
   */
  timestamp: number;

  /**
   * 消息对话对方用户id
   */
  messageUserId: string;

  /**
   * 对话id
   */
  sessionId?: string;

  secSessionId?: string;

  /**
   * 对话类型
   */
  sessionType?: SessionType;
  /**
   * 当前消息所属作者id
   */
  messageOwnerUserId?: string;

  /**
   * 消息在对话中的序号/游标
   */
  index?: number;
  /**
   * 官方原始结构
   */
  raw?: object;

  isAuthor?: boolean;

  fromUserId?: string;
  toUserId?: string;
}

export interface MessageMediaInfo {
  /**
   * 媒体类型
   */
  mediaType?: 'image' | 'video' | 'doc' | 'text';
  /**
   * 是否需要调用解析接口
   */
  needParse?: boolean;

  /**
   * 是否需要使用解码
   */
  needDecode?: boolean;
  /**
   * 可直接访问的url
   */
  url?: string;
  /**
   * 解析后的base64
   */
  base64?: string;
  /**
   * 文件后缀
   */
  ext?: string;
  /**
   * 文件名
   */
  fileName?: string;
  /**
   * 内容类型 如 jpeg png mp4
   */
  contentType?: string;
  /**
   * 媒体解析参数，调用解析接口时需要，使用对象以兼容不同平台的字段差异
   */
  mediaParams?: Record<string, any>;
  /**
   * 原始数据
   */
  //raw?: object;
}
export enum SessionType {
  friend = 'friend',
  group = 'group',
  stranger = 'stranger',
}
export enum MessageType {
  text = 'text',
  image = 'image',
  card = 'card',
  emotion = 'emotion',
  system = 'system',
  user_enter = 'user_enter',
}
/**
 * 添加评论返回结果对象
 */
export interface SetCommentResultOutPut {
  code: number;
  msg: string;
  commentId?: string;
  raw?: object;
}

/**
 * 发送消息返回结果对象
 */
export interface SendMessageResultOutPut {
  code: number;
  msg: string;
  messageId?: string;
  raw?: object;
}

const sendCommentContentList = async (baseUrl: string, data: object): Promise<void> => {
  await $http.post(`${baseUrl}/addcomment`, data, { headers: { 'Content-Type': 'application/json' } });
};

const sendCommentList = async (baseUrl: string, data: object): Promise<void> => {
  await $http.post(`${baseUrl}/addcontent`, data, { headers: { 'Content-Type': 'application/json' } });
};
