import { Platforms } from '../service/datasync-service-manager';
import { DataColumn, PlatformContentItem, PlatformContentItemNum } from './baseModel';
import { convertCookie, convertCookieStr, Task } from '@/utils';
import { getDouYinAnalyzeContentListView, getDouYinOverViewDashboard } from './douyin/douyin-common';
import { getKuaiShouOverViewDashboard } from './kuaishou/kuaishou-common';
import { getShipinhaoOverViewDashboard } from './shipinhao/shipinhao-common';
import { getXiaoHongShuOverViewDashboard } from './xiaohongshu/xiaohongshu-common';
import { getBiliBiliOverViewDashboard } from './bilibili/bilibili-common';
import { getBaijiahaoOverViewDashboard } from './baijiahao/baijiahao-common';
import { getToutiaohaoOverViewDashboard } from './toutiaohao/toutiaohao-common';
import { getXinlangweiboOverViewDashboard } from './xinlangweibo/xinlangweibo-common';
import { Douyin } from './douyin';
import { Kuaishou } from './kuaishou';
import { Shipinhao } from './shipinhao';
import { Bilibili } from './bilibili';
import { Xiaohongshu } from './xiaohongshu';
import { Baijiahao } from './baijiahao';
import { Toutiaohao } from './toutiaohao';
import { Xinlangweibo } from './xinlangweibo';
import { MediaAccount } from '../service/model/media-account';
import { EventEmitter } from 'events';
import dayjs from 'dayjs';
import { KuaiDaiLiProxy } from '../media-platform/webproxy';
import { getZhihuOverViewDashboard } from './zhihu/zhihu-common';
import { Zhihu } from './zhihu';
import { getQieHaoOverViewDashboard } from './qiehao/qiehao-common';
import { Qiehao } from './qiehao';
import { getSouhuhaoOverViewDashboard } from './souhuhao/souhuhao-common';
import { Souhuhao } from './souhuhao';
import { getYidianhaoOverViewDashboard } from './yidianhao/yidianhao-common';
import { Yidianhao } from './yidianhao';
import { getDayuhaoOverViewDashboard } from './dayuhao/dayuhao-common';
import { Dayuhao } from './dayuhao';
import { geWangyihaoOverViewDashboard } from './wangyihao/wangyihao-common';
import { Wangyihao } from './wangyihao';
import { getAiqiyiOverViewDashboard } from './aiqiyi/aiqiyi-common';
import { Aiqiyi } from './aiqiyi';
import { getWeishiOverViewDashboard } from './tengxunweishi/tengxunweishi-common';
import { Tengxunweishi } from './tengxunweishi';
import { errorCode } from '@/media-platform/errorCode';
import { getWeiXinGongZhongHaoOverViewDashboard } from '@/media-platform/weixingongzhonghao/weixingongzhonghao-common';
import { Weixingongzhonghao } from '@/media-platform/weixingongzhonghao';
import { getRedNoteContentListView } from '@/media-platform/rednote';

/**
 * 内容通过的最大页数
 */
export const syncContentMaxPage = 36500;
/**
 * 获取账号概览数据
 * @param platform 平台
 * @param cookie
 * @param type 'all':所有 |'video':横版视频 |'miniVideo':竖版视频|'dynamic':动态（图文分离，lite中的图文，新浪微博的博文）|'article:图文（图文混编，lite中的文章）'
 */
const getAccountOverViewReportData = async (
  platform: Platforms,
  cookie: string,
  type: 'all' | 'video' | 'miniVideo' | 'dynamic' | 'article' = 'all',
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
  };
  try {
    if (!cookie) {
      result.code = -1;
      result.msg = 'cookie无效';
      return result;
    }
    //处理cookie
    if (cookie.startsWith('[')) {
      cookie = convertCookie(JSON.parse(cookie));
    }

    if (platform === Platforms.DouYin) {
      return getDouYinOverViewDashboard(cookie);
    } else if (platform === Platforms.KuaiShou) {
      return getKuaiShouOverViewDashboard(cookie);
    } else if (platform === Platforms.ShiPinHao) {
      return getShipinhaoOverViewDashboard(cookie, 2, type === 'dynamic' ? 'dynamic' : 'video');
    } else if (platform === Platforms.XiaoHongShu) {
      return getXiaoHongShuOverViewDashboard(cookie);
    } else if (platform === Platforms.BiLiBiLi) {
      return getBiliBiliOverViewDashboard(cookie);
    } else if (platform === Platforms.BaiJiaHao) {
      return getBaijiahaoOverViewDashboard(cookie);
    } else if (platform === Platforms.TouTiaoHao) {
      return getToutiaohaoOverViewDashboard(cookie);
    } else if (platform === Platforms.XinLangWeiBo) {
      return getXinlangweiboOverViewDashboard(cookie, 2, type === 'dynamic' ? 'dynamic' : 'video');
    } else if (platform === Platforms.ZhiHu) {
      return getZhihuOverViewDashboard(cookie);
    } else if (platform === Platforms.QiEHao) {
      return getQieHaoOverViewDashboard(cookie, 2, type === 'video' ? 'video' : 'article');
    } else if (platform === Platforms.SouHuHao) {
      return getSouhuhaoOverViewDashboard(cookie);
    } else if (platform === Platforms.YiDianHao) {
      return getYidianhaoOverViewDashboard(cookie);
    } else if (platform === Platforms.DaYuHao) {
      return getDayuhaoOverViewDashboard(cookie);
    } else if (platform === Platforms.WangYiHao) {
      return geWangyihaoOverViewDashboard(cookie, 2, type === 'video' ? 'video' : 'article');
    } else if (platform === Platforms.AiQiYi) {
      return getAiqiyiOverViewDashboard(cookie, 2);
    } else if (platform === Platforms.TengXunWeiShi) {
      return getWeishiOverViewDashboard(cookie);
    } else {
      result.code = -1;
      result.msg = '不支持的平台';
    }
  } catch (e) {
    result.code = -2;
    result.msg = e?.toString() ?? '';
  }

  return result;
};

export interface AccountReportDataOutPut {
  /**
   * 状态嘛，0:正常, 非0:异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 数据列
   */
  data?: Array<DataColumn>;

  /**
   * 数值版本结构
   */
  dataObj?: {
    all?: never;
    video?: never;
    article?: never;
    dynamic?: never;
  };
}

export const syncContentEventName = 'content_back';
/**
 * 获取7天内最新20条作品数据    注:微博封面有防盗链
 * @param platform
 * @param isHeader 是否只需要列头数据
 * @param cookie 只获取列头时不需要
 * @param type 'all':'不区分类型'，'video':'视频（在要区分横竖的平台时，代表横版视频）','miniVideo':'竖版视频（小视频）' ,'dynamic':'动态（图文分离）' , 'article':'文章(图文混编)'
 * @param eventCallBack
 * @param maxDays 获取作品的日期距离当前日期最大天数
 * @param maxCount 获取作品的做大数量
 */
const getAccountContentListView = async (
  platform: Platforms,
  isHeader: boolean,
  cookie?: string,
  type: 'all' | 'video' | 'miniVideo' | 'dynamic' | 'article' = 'all',
  eventCallBack?: EventEmitter,
  maxDays: number = 7,
  maxCount: number = 1000,
): Promise<AccountContentListViewOutPut> => {
  const result: AccountContentListViewOutPut = {
    code: 0,
    msg: '',
  };
  try {
    if (!cookie) {
      result.code = -1;
      result.msg = 'cookie无效';
      return result;
    }
    //处理cookie
    if (cookie.startsWith('[')) {
      cookie = convertCookieStr(cookie, platform === Platforms.XinLangWeiBo ? '.weibo.com' : undefined);
    }

    if (platform === Platforms.DouYin) {
      return Douyin.getDouYinContentListView(cookie, eventCallBack, maxDays, maxCount, isHeader);
    } else if (platform === Platforms.KuaiShou) {
      return Kuaishou.getKuaishouContentListView(cookie, eventCallBack, maxDays, maxCount, isHeader);
    } else if (platform === Platforms.ShiPinHao) {
      return Shipinhao.getShipinhaoContentListView(
        cookie,
        type === 'dynamic' ? 'dynamic' : 'video',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.BiLiBiLi) {
      return Bilibili.getBilibiliContentListView(
        cookie,
        type === 'article' ? 'article' : 'video',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.BaiJiaHao) {
      return Baijiahao.getBaijiaContentListView(
        cookie,
        type === 'article' ? 'article' : type === 'video' ? 'video' : 'miniVideo',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.TouTiaoHao) {
      return Toutiaohao.getToutiaoContentListView(
        cookie,
        type === 'article' ? 'article' : type === 'video' ? 'video' : 'miniVideo',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.XinLangWeiBo) {
      return Xinlangweibo.gettXinlangweiboContentListView(
        cookie,
        type === 'article' ? 'article' : 'video',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.ZhiHu) {
      return Zhihu.getZhihuContentListView(
        cookie,
        type === 'article' ? 'article' : 'video',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.XiaoHongShu) {
      return Xiaohongshu.getXiaohongshuContentListView(cookie, eventCallBack, maxDays, maxCount, isHeader);
    } else if (platform === Platforms.RedNote) {
      return getRedNoteContentListView(cookie, eventCallBack, maxDays, maxCount, isHeader);
    } else if (platform === Platforms.QiEHao) {
      return Qiehao.getQieHaoContentListView(
        cookie,
        type === 'video' ? 'video' : 'article',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.SouHuHao) {
      return Souhuhao.getSouhuhaoContentListView(
        cookie,
        type === 'video' ? 'video' : type === 'article' ? 'article' : 'all',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.YiDianHao) {
      return Yidianhao.getYidianhaoContentListView(
        cookie,
        type === 'video' ? 'video' : type === 'article' ? 'article' : 'all',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.DaYuHao) {
      return Dayuhao.getDayuhaoContentListView(
        cookie,
        type === 'video' ? 'video' : type === 'article' ? 'article' : 'all',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.WangYiHao) {
      return Wangyihao.getWangyihaoContentListView(
        cookie,
        type === 'video' ? 'video' : type === 'article' ? 'article' : 'all',
        eventCallBack,
        maxDays,
        maxCount,
        isHeader,
      );
    } else if (platform === Platforms.AiQiYi) {
      return Aiqiyi.getAiqiyiContentListView(cookie, 'video', eventCallBack, maxDays, maxCount, isHeader);
    } else if (platform === Platforms.TengXunWeiShi) {
      return Tengxunweishi.getWeishiContentListView(cookie, eventCallBack, maxDays, maxCount, isHeader);
    } else {
      result.code = -1;
      result.msg = '不支持的平台';
    }
  } catch (e) {
    result.code = -2;
    result.msg = e?.toString() ?? '';
  }

  return result;
};

export interface AccountContentListViewOutPut {
  /**
   * 状态嘛，0:正常, 非0:异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;

  /**
   * 列头信息
   */
  headers?: Array<{
    /**
     * 列头显示名称
     */
    name: string;
    /**
     * 列值对应key名称
     */
    key: string;
  }>;

  /**
   * 作品数据列表，key名来自headers中的key
   */
  data?: Array<PlatformContentItem>;

  /**
   * 作品数据列表，数字字段
   */
  dataList?: Array<PlatformContentItemNum>;
}

/**
 * 业务数据同步
 */
class DataServiceWorker {
  public static readonly eventNames = { accountData: 'accountData', contentData: 'contentData' };
  /**
   * 缓存账号列表
   * @private
   */
  private static accounts: Map<string, MediaAccount>;

  /**
   * 是否在运行中
   * @private
   */
  private static running: boolean = false;

  /**
   * 是否需要停止执行
   * @private
   */
  private static stop: boolean = false;

  /**
   * 数据回调事件对象
   * @private
   */
  public static readonly eventCallBack: EventEmitter = new EventEmitter();

  /**
   * 下一次运行时间
   * @private
   */
  private static nextRunTime: number = 0;
  constructor() {}

  /**
   * 开始新的同步
   * @param platformAccounts 需要同步数据的账号列表
   * @param loopTime 多少小时跑一轮
   * @param maxThread 并发任务数
   */
  public static async start(
    platformAccounts: Array<MediaAccount>,
    loopTime: number = 24,
    maxThread: number = 1,
  ): Promise<void> {
    if (!platformAccounts?.length) {
      throw new Error('账号列表不能为空');
    }
    this.accounts = new Map<string, MediaAccount>();
    this.nextRunTime = 0;
    platformAccounts.forEach((x) => this.accounts.set(x.id, x));
    await this.stopWork();
    this.runwork(loopTime, maxThread);
  }

  private static async runwork(loopTime: number = 24, maxThread: number = 1): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    this.stop = false;
    if (maxThread <= 0) {
      maxThread = 1;
    }

    while (!this.stop) {
      try {
        if (Date.now() < this.nextRunTime) {
          await Task.Delay(1000);
          continue;
        }
        this.nextRunTime = dayjs().add(loopTime, 'hours').toDate().getTime();
        for (const key of this.accounts.keys()) {
          const account = this.accounts.get(key);
          const platform = account?.platformName; // platformNamesRe[account?.platformName ?? 'undefined'];
          if (!platform) {
            continue;
          }
          //先获取账号数据
          const accountData = await this.getAccountData(
            platform as Platforms,
            account?.cookie ?? '',
            account?.id ?? '',
          );
          //抛出账号数据
          this.eventCallBack.emit(this.eventNames.accountData, accountData);

          //再获取作品数据
          const contentData = await this.getAccountContentData(
            platform as Platforms,
            account?.cookie ?? '',
            account?.id ?? '',
          );
          //抛出作品数据
          this.eventCallBack.emit(this.eventNames.contentData, contentData);
        }
      } catch (e) {
        console.error('数据同步过程异常', e);
      } finally {
      }
    }
    this.running = false;
  }

  private static async stopWork(): Promise<boolean> {
    this.stop = true;
    while (this.running) {
      await Task.Delay(1000);
    }
    return this.running;
  }

  /**
   *
   * @param platform
   * @param cookie
   * @param accountId
   * @param proxy
   */
  public static async getAccountData(
    platform: Platforms,
    cookie: string,
    accountId: string,
    proxy?: KuaiDaiLiProxy,
  ): Promise<{
    code: number;
    platformAccountId: string;
    overviewData: string | undefined;
    overView?: { all: object; video: object; article: object; dynamic: object };
  }> {
    const re: {
      code: number;
      platformAccountId: string;
      overviewData: string | undefined;
      overView?: { all: object; video: object; article: object; dynamic: object };
    } = {
      platformAccountId: accountId,
      overviewData: '',
      code: -1,
      overView: undefined,
    };
    try {
      cookie = convertCookieStr(cookie);

      if (platform === Platforms.DouYin) {
        const tmpData = await getDouYinOverViewDashboard(cookie, 30, proxy);
        if (tmpData?.data?.length) {
          re.overviewData = tmpData?.data?.length
            ? JSON.stringify({ updateTime: Date.now(), value: { dynamic: [], video: tmpData?.data ?? [] } })
            : undefined;
        }
        re.overView = tmpData.dataObj as never;
        re.code = tmpData.code ?? -1;
        if (re.code === 8 || tmpData?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.KuaiShou) {
        const tmpData = await getKuaiShouOverViewDashboard(cookie, 2, proxy);
        if (tmpData?.data?.length) {
          re.overviewData = tmpData?.data?.length
            ? JSON.stringify({ updateTime: Date.now(), value: { dynamic: [], video: tmpData?.data ?? [] } })
            : undefined;
        }
        re.overView = tmpData.dataObj as never;
        re.code = tmpData.code ?? -1;
        if (re.code === 109 || tmpData?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.ShiPinHao) {
        const tmpDataV = await getShipinhaoOverViewDashboard(cookie, 2, 'video', proxy);
        const tmpDataA = await getShipinhaoOverViewDashboard(cookie, 2, 'dynamic', proxy);
        if (tmpDataV?.data?.length || tmpDataA?.data?.length) {
          re.overviewData =
            tmpDataV?.data?.length || tmpDataA?.data?.length
              ? JSON.stringify({
                  updateTime: Date.now(),
                  value: { dynamic: tmpDataA?.data ?? [], video: tmpDataV?.data ?? [] },
                })
              : undefined;
        }
        re.code = tmpDataA.code ?? tmpDataV.code ?? -1;
        re.overView = {
          all: tmpDataA?.dataObj?.all ?? tmpDataV?.dataObj?.all ?? {},
          video: tmpDataV?.dataObj?.video ?? {},
          dynamic: tmpDataA?.dataObj?.dynamic ?? {},
          article: {},
        };
        if (re.code === 300333 || re.code === 300334 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.XiaoHongShu) {
        const tmpData = await getXiaoHongShuOverViewDashboard(cookie, 2, proxy);
        if (tmpData?.data?.length) {
          re.overviewData = tmpData?.data?.length
            ? JSON.stringify({ updateTime: Date.now(), value: { dynamic: [], video: tmpData?.data ?? [] } })
            : undefined;
        }
        re.code = tmpData.code ?? -1;
        re.overView = tmpData.dataObj as never;
        if (re.code === -100 || tmpData?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.BiLiBiLi) {
        const tmpData = await getBiliBiliOverViewDashboard(cookie, 2, proxy);
        if (tmpData?.data?.length) {
          re.overviewData = tmpData?.data?.length
            ? JSON.stringify({ updateTime: Date.now(), value: { dynamic: [], video: tmpData?.data ?? [] } })
            : undefined;
        }
        re.code = tmpData.code ?? -1;
        re.overView = tmpData.dataObj as never;
        if (re.code === -101 || tmpData?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.BaiJiaHao) {
        const tmpData = await getBaijiahaoOverViewDashboard(cookie, 2, proxy);
        if (tmpData?.data?.length) {
          re.overviewData = tmpData?.data?.length
            ? JSON.stringify({ updateTime: Date.now(), value: { dynamic: [], video: tmpData?.data ?? [] } })
            : undefined;
        }
        re.code = tmpData.code ?? -1;
        re.overView = tmpData.dataObj as never;
        if (re.code === 10001401 || tmpData?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.TouTiaoHao) {
        const tmpData = await getToutiaohaoOverViewDashboard(cookie, 2, proxy);
        if (tmpData?.data?.length) {
          re.overviewData = tmpData?.data?.length
            ? JSON.stringify({ updateTime: Date.now(), value: { dynamic: [], video: tmpData?.data ?? [] } })
            : undefined;
        }
        re.code = tmpData.code ?? -1;
        re.overView = tmpData.dataObj as never;
        if (re.code === 100004 || tmpData?.msg?.includes('login')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.XinLangWeiBo) {
        const tmpDataV = await getXinlangweiboOverViewDashboard(cookie, 2, 'video', proxy);
        const tmpDataA = await getXinlangweiboOverViewDashboard(cookie, 2, 'dynamic', proxy);
        if (tmpDataV?.data?.length || tmpDataA?.data?.length) {
          re.overviewData =
            tmpDataV?.data?.length || tmpDataA?.data?.length
              ? JSON.stringify({
                  updateTime: Date.now(),
                  value: { dynamic: tmpDataA?.data ?? [], video: tmpDataV?.data ?? [] },
                })
              : undefined;
        }
        re.code = tmpDataA.code ?? tmpDataV.code ?? -1;
        re.overView = {
          all: tmpDataA?.dataObj?.all ?? tmpDataV?.dataObj?.all ?? {},
          video: tmpDataV?.dataObj?.video ?? {},
          dynamic: tmpDataA?.dataObj?.dynamic ?? {},
          article: {},
        };
        if (re.code === -100 || tmpDataV?.msg?.includes('login')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.ZhiHu) {
        const tmpData = await getZhihuOverViewDashboard(cookie, 2, 'all', proxy);
        if (tmpData?.data?.length) {
          re.overviewData = tmpData?.data?.length
            ? JSON.stringify({ updateTime: Date.now(), value: { dynamic: [], video: tmpData?.data ?? [] } })
            : undefined;
        }
        re.code = tmpData.code ?? -1;
        re.overView = tmpData.dataObj as never;
        if (re.code === 100 || tmpData?.msg?.includes('TICKET_NOT_EXIST')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.QiEHao) {
        const tmpDataV = await getQieHaoOverViewDashboard(cookie, 2, 'video', proxy);
        const tmpDataA = await getQieHaoOverViewDashboard(cookie, 2, 'article', proxy);
        if (tmpDataV?.data?.length || tmpDataA?.data?.length) {
          re.overviewData =
            tmpDataV?.data?.length || tmpDataA?.data?.length
              ? JSON.stringify({
                  updateTime: Date.now(),
                  value: { dynamic: [], video: tmpDataV?.data ?? [], article: tmpDataA?.data ?? [] },
                })
              : undefined;
        }
        re.code = tmpDataA.code ?? tmpDataV.code ?? -1;
        re.overView = {
          all: tmpDataA?.dataObj?.all ?? tmpDataV?.dataObj?.all ?? {},
          video: tmpDataV?.dataObj?.video ?? {},
          dynamic: {},
          article: tmpDataA?.dataObj?.article ?? {},
        };
        if (re?.code === -10403 || tmpDataA?.msg?.includes('login')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.SouHuHao) {
        const tmpDataV = await getSouhuhaoOverViewDashboard(cookie, 2, 'all', proxy);
        if (tmpDataV?.data?.length) {
          re.overviewData = tmpDataV?.data?.length
            ? JSON.stringify({
                updateTime: Date.now(),
                value: { dynamic: [], video: tmpDataV?.data ?? [] },
              })
            : undefined;
        }
        re.code = tmpDataV.code ?? -1;
        if (re?.code == 1211 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        re.overView = tmpDataV.dataObj as never;
      } else if (platform === Platforms.YiDianHao) {
        const tmpDataV = await getYidianhaoOverViewDashboard(cookie, 2, proxy);
        if (tmpDataV?.data?.length) {
          re.overviewData = tmpDataV?.data?.length
            ? JSON.stringify({
                updateTime: Date.now(),
                value: { dynamic: [], video: tmpDataV?.data ?? [] },
              })
            : undefined;
        }
        re.code = tmpDataV.code ?? -1;
        if (re?.code === 401) {
          re.code = errorCode.loginExpire;
        }
        re.overView = tmpDataV.dataObj as never;
      } else if (platform === Platforms.DaYuHao) {
        const tmpDataV = await getDayuhaoOverViewDashboard(cookie, 2, proxy);
        if (tmpDataV?.data?.length) {
          re.overviewData = tmpDataV?.data?.length
            ? JSON.stringify({
                updateTime: Date.now(),
                value: { dynamic: [], video: tmpDataV?.data ?? [] },
              })
            : undefined;
        }
        re.code = tmpDataV.code ?? -1;
        if (re?.code === 401 || tmpDataV?.msg?.includes('登录') || tmpDataV?.msg?.includes('login')) {
          re.code = errorCode.loginExpire;
        }
        re.overView = tmpDataV.dataObj as never;
      } else if (platform === Platforms.WangYiHao) {
        const tmpDataV = await geWangyihaoOverViewDashboard(cookie, 2, 'video', proxy);
        const tmpDataA = await geWangyihaoOverViewDashboard(cookie, 2, 'article', proxy);
        if (tmpDataV?.data?.length) {
          re.overviewData = tmpDataV?.data?.length
            ? JSON.stringify({
                updateTime: Date.now(),
                value: { dynamic: [], video: tmpDataV?.data ?? [], article: tmpDataA?.data ?? [] },
              })
            : undefined;
        }
        re.code = tmpDataV.code ?? -1;
        if (re?.code === 100021 || tmpDataV?.msg?.includes('未登录')) {
          re.code = errorCode.loginExpire;
        }
        re.overView = {
          all: tmpDataA?.dataObj?.all ?? tmpDataV?.dataObj?.all ?? {},
          video: tmpDataV?.dataObj?.video ?? {},
          dynamic: {},
          article: tmpDataA?.dataObj?.article ?? {},
        };
      } else if (platform === Platforms.AiQiYi) {
        const tmpDataV = await getAiqiyiOverViewDashboard(cookie, 2, proxy);
        if (tmpDataV?.data?.length) {
          re.overviewData = tmpDataV?.data?.length
            ? JSON.stringify({
                updateTime: Date.now(),
                value: { dynamic: [], video: tmpDataV?.data ?? [] },
              })
            : undefined;
        }
        re.code = tmpDataV.code ?? -1;
        if (re?.code === 401 || tmpDataV?.msg?.startsWith('Invalid')) {
          re.code = errorCode.loginExpire;
        }
        re.overView = tmpDataV.dataObj as never;
      } else if (platform === Platforms.TengXunWeiShi) {
        const tmpDataV = await getWeishiOverViewDashboard(cookie, proxy);
        if (tmpDataV?.data?.length) {
          re.overviewData = tmpDataV?.data?.length
            ? JSON.stringify({
                updateTime: Date.now(),
                value: { dynamic: [], video: tmpDataV?.data ?? [] },
              })
            : undefined;
        }
        re.code = tmpDataV.code ?? -1;
        if (re?.code === 302 || re?.code === 401 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        re.overView = tmpDataV.dataObj as never;
      }
      else if (platform === Platforms.WeiXinGongZhongHao) {
        const tmpDataV = await getWeiXinGongZhongHaoOverViewDashboard(cookie, proxy);
        if (tmpDataV?.data?.length) {
          re.overviewData = tmpDataV?.data?.length
            ? JSON.stringify({
                updateTime: Date.now(),
                value: { dynamic: [], video: tmpDataV?.data ?? [] },
              })
            : undefined;
        }
        re.code = tmpDataV.code ?? -1;
        if (re?.code === 302 || re?.code === 401 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        re.overView = tmpDataV.dataObj as never;
      }
    } catch (e) {
      console.debug('获取账号数据异常', e);
    }
    return re;
  }

  /**
   *
   * @param platform
   * @param cookie
   * @param accountId
   * @param eventCallBack
   * @param maxDays
   * @param maxCount
   * @param proxy
   * @param exArgs
   */
  public static async getAccountContentData(
    platform: Platforms,
    cookie: string,
    accountId: string,
    eventCallBack?: EventEmitter,
    maxDays: number = 7,
    maxCount: number = 2000,
    proxy?: KuaiDaiLiProxy,
    exArgs?: { tab: 'manage' | 'analyze' },
  ): Promise<{
    code: number;
    platformAccountId: string;
    contentStatisticsData: Array<PlatformContentItem> | undefined;
  }> {
    const re: {
      code: number;
      platformAccountId: string;
      contentStatisticsData: Array<PlatformContentItem> | undefined;
    } = {
      platformAccountId: accountId,
      contentStatisticsData: [],
      code: 0,
    };
    try {
      cookie = convertCookieStr(cookie);

      if (platform === Platforms.DouYin) {
        const tmpData =
          exArgs?.tab === 'analyze'
            ? await Douyin.getDouYinAnalyzeContentListView(cookie, eventCallBack, maxDays, maxCount, proxy)
            : await Douyin.getDouYinContentListView(cookie, eventCallBack, maxDays, maxCount, false, proxy);
        re.contentStatisticsData = tmpData?.data?.length ? tmpData?.data : (tmpData.dataList as never) ?? [];
        re.code = tmpData?.code ?? -1;
        if (re.code === 8 || tmpData?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.KuaiShou) {
        const tmpData = await Kuaishou.getKuaishouContentListView(
          cookie,
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        re.contentStatisticsData = tmpData.data ?? [];
        re.code = tmpData?.code ?? -1;
        if (re.code === 109 || tmpData?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.ShiPinHao) {
        const tmpDataV = await Shipinhao.getShipinhaoContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Shipinhao.getShipinhaoContentListView(
                cookie,
                'dynamic',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        re.code = tmpDataV?.code ?? -1;
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
        if (re.code === 300333 || re.code === 300334 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.BiLiBiLi) {
        const tmpDataV = await Bilibili.getBilibiliContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Bilibili.getBilibiliContentListView(
                cookie,
                'article',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        re.code = tmpDataV?.code ?? -1;
        if (re.code === -101 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
      } else if (platform === Platforms.BaiJiaHao) {
        const tmpDataV = await Baijiahao.getBaijiaContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Baijiahao.getBaijiaContentListView(
                cookie,
                'article',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        const tmpDataM =
          tmpDataV?.code === 0
            ? await Baijiahao.getBaijiaContentListView(
                cookie,
                'miniVideo',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        re.code = tmpDataV?.code ?? -1;
        if (re.code === 10001401 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataM?.data ?? []));
      } else if (platform === Platforms.TouTiaoHao) {
        const tmpDataV = await Toutiaohao.getToutiaoContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Toutiaohao.getToutiaoContentListView(
                cookie,
                'article',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        const tmpDataM =
          tmpDataV?.code === 0
            ? await Toutiaohao.getToutiaoContentListView(
                cookie,
                'miniVideo',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        re.code = tmpDataV?.code ?? -1;
        if (re.code === 100004 || tmpDataV?.msg?.includes('login')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataM?.data ?? []));
      } else if (platform === Platforms.XinLangWeiBo) {
        const tmpDataV = await Xinlangweibo.gettXinlangweiboContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Xinlangweibo.gettXinlangweiboContentListView(
                cookie,
                'article',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        re.code = tmpDataV?.code ?? -1;
        if (re.code === -100 || tmpDataV?.msg?.includes('login')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
      } else if (platform === Platforms.XiaoHongShu) {
        const tmpData =
          exArgs?.tab === 'analyze'
            ? await Xiaohongshu.getXiaohongshuAnalyzeContentListView(
                cookie,
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : await Xiaohongshu.getXiaohongshuContentListView(cookie, eventCallBack, maxDays, maxCount, false, proxy);
        re.contentStatisticsData = tmpData.data ?? [];
        re.code = tmpData?.code ?? -1;
        if (re.code === -100 || tmpData?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.RedNote) {
        const tmpData = await getRedNoteContentListView(cookie, eventCallBack, maxDays, maxCount, false, proxy);
        re.contentStatisticsData = tmpData.data?.length ? tmpData.data : (tmpData.dataList as never) ?? [];
        re.code = tmpData.code ?? -1;
        if (re.code === -100 || re.code === 401 || /登录|login/i.test(tmpData.msg ?? '')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.ZhiHu) {
        const tmpDataV = await Zhihu.getZhihuContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Zhihu.getZhihuContentListView(cookie, 'article', eventCallBack, maxDays, maxCount, false, proxy)
            : undefined;
        re.code = tmpDataV?.code;
        if (re.code === 100 || tmpDataV?.msg?.includes('TICKET_NOT_EXIST')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
      } else if (platform === Platforms.QiEHao) {
        const tmpDataV = await Qiehao.getQieHaoContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Qiehao.getQieHaoContentListView(cookie, 'article', eventCallBack, maxDays, maxCount, false, proxy)
            : undefined;
        re.code = tmpDataV?.code ?? -1;
        if (re?.code === -10403 || tmpDataV?.msg?.includes('login')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
      } else if (platform === Platforms.SouHuHao) {
        const tmpDataV = await Souhuhao.getSouhuhaoContentListView(
          cookie,
          'all',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        re.code = tmpDataV?.code ?? -1;
        if (re?.code == 1211 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
      } else if (platform === Platforms.YiDianHao) {
        const tmpDataV = await Yidianhao.getYidianhaoContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Yidianhao.getYidianhaoContentListView(
                cookie,
                'article',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        re.code = tmpDataV?.code ?? -1;
        if (re?.code === 401 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
      } else if (platform === Platforms.DaYuHao) {
        const tmpDataV = await Dayuhao.getDayuhaoContentListView(
          cookie,
          'all',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.code = tmpDataV?.code ?? -1;
        if (re?.code === 401 || tmpDataV?.msg?.includes('登录') || tmpDataV?.msg?.includes('login')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.WangYiHao) {
        const tmpDataV = await Wangyihao.getWangyihaoContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        const tmpDataA =
          tmpDataV?.code === 0
            ? await Wangyihao.getWangyihaoContentListView(
                cookie,
                'article',
                eventCallBack,
                maxDays,
                maxCount,
                false,
                proxy,
              )
            : undefined;
        re.code = tmpDataV?.code ?? -1;
        if (re?.code === 100021 || tmpDataV?.msg?.includes('未登录')) {
          re.code = errorCode.loginExpire;
        }
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.contentStatisticsData?.push(...(tmpDataA?.data ?? []));
      } else if (platform === Platforms.AiQiYi) {
        const tmpDataV = await Aiqiyi.getAiqiyiContentListView(
          cookie,
          'video',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.code = tmpDataV?.code ?? -1;
        if (re?.code === 401 || tmpDataV?.msg?.startsWith('Invalid')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.TengXunWeiShi) {
        const tmpDataV = await Tengxunweishi.getWeishiContentListView(
          cookie,
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.code = tmpDataV?.code ?? -1;
        if (re?.code === 302 || re?.code === 401 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      } else if (platform === Platforms.WeiXinGongZhongHao) {
        const tmpDataV = await Weixingongzhonghao.getWeixingongzhonghaoContentListView(
          cookie,
          '',
          eventCallBack,
          maxDays,
          maxCount,
          false,
          proxy,
        );
        re.contentStatisticsData?.push(...(tmpDataV?.data ?? []));
        re.code = tmpDataV?.code ?? -1;
        if (re?.code === 302 || re?.code === 401 || tmpDataV?.msg?.includes('登录')) {
          re.code = errorCode.loginExpire;
        }
      }
    } catch (e) {
      console.debug('获取账号数据异常', e);
    }
    return re;
  }
  /**
   *  添加新的账号进入同步，并停止当前任务重新开始
   * @param platformAccounts
   */
  public static async updateAccounts(platformAccounts: Array<MediaAccount>): Promise<void> {
    if (!this.accounts?.size || !this.eventCallBack) {
      throw new Error('服务尚未开始');
    }
    if (!platformAccounts?.length) {
      return;
    }
    platformAccounts.forEach((x) => this.accounts.set(x.id, x));
    await this.stopWork();
    this.runwork();
  }
}

export const DataService = {
  /**
   * 获取账号概览数据
   * @param platform 平台
   * @param cookie
   * @param type 'all':所有 |'video':横版视频 |'miniVideo':竖版视频|'dynamic':动态（图文分离，lite中的图文，新浪微博的博文）|'article:图文（图文混编，lite中的文章）'
   */
  getAccountReport: getAccountOverViewReportData,
  /**
   * 获取7天内最新20条作品数据    注:微博封面有防盗链
   * @param platform
   * @param isHeader 是否只需要列头数据
   * @param cookie 只获取列头时不需要
   * @param type 'all':'不区分类型'，'video':'视频（在要区分横竖的平台时，代表横版视频）','miniVideo':'竖版视频（小视频）' ,'dynamic':'动态（图文分离）' , 'article':'文章(图文混编)'
   * @param maxDays 获取作品的日期距离当前日期最大天数
   * @param maxCount 获取作品的做大数量
   */
  getAccountContentList: getAccountContentListView,

  SyncDataService: DataServiceWorker,
};
