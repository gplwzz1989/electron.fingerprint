import { convertCookieStr, Cookie, logger } from '@/utils';
//import { platformNamesRe, Platforms } from '../service/datasync-service-manager';
import { normalizePlatformCode, Platforms } from '../service/datasync-service-manager';
import { PlatformAuthorInfo } from '../media-platform/baseModel';
import {
  Aiqiyi,
  Azhan,
  Baijiahao,
  Bilibili,
  Csdn,
  Dayuhao,
  Duoduoshipin,
  Kuaishou,
  Pipixia,
  Qiehao,
  Souhuhao,
  Tengxunshipin,
  Tengxunweishi,
  Toutiaohao,
  Wangyihao,
  Weixingongzhonghao,
  Xiaohongshu,
  Xiguashipin,
  Xinlangweibo,
  Xueqiuhao,
  Yidianhao,
  Zhihu,
  TaoBaoGuangHe,
} from '../media-platform';
import { Douyin } from '../media-platform/douyin';
import { Shipinhao } from '../media-platform/shipinhao';
import { errorCode } from '@/media-platform/errorCode';
import { SouHuShiPin } from '../media-platform/souhushipin';
import { MeiPai } from '../media-platform/meipai';
import { KuaiChuanHao } from '../media-platform/kuaichuanhao/kuaichuanhao';
import { getXueQiuUserInfoResponse } from '../media-platform/xueqiuhao/xueqiuhao-user.service';
import { Xiaohongshushop } from '@/media-platform/xiaohongshushop';
import { Xiaohongshuhome } from '@/media-platform/xiaohongshuhome';
import { MeiYou } from '@/media-platform/meiyou/meiyou';
import { CheJiaHao } from '@/media-platform/chejiahao';
import { YiCheHao } from '@/media-platform/yichehao';
import { DongCheHao } from '@/media-platform/dongchehao';
import { FengWang } from '@/media-platform/fengwang';
import { DouBan } from '@/media-platform/douban/douban';
import { DeWu } from '@/media-platform/dewu';
import { JianShu } from '@/media-platform/jianshu';
import { WiFi } from '@/media-platform/wifiwanneng';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { checkKuaiShouLogin } from '@/media-platform/kuaishou/kuaishou-common';
import { AIDouBao } from '@/ai-platform/doubao';
import { AIDeepSeek } from '@/ai-platform/deepseek';
import { getRedNoteUserInfoResponse, isRedNoteLoginExpired, isValidRedNoteUserInfo } from '@/media-platform/rednote';

/**
 * 一个账号实例，目标是模拟一个浏览器会话，
 * 初始化后先先用checkAccountAlive检测传入的cookie是否有效，再调其他接口
 */
export class AccountService {
  /**
   * 缓存账号cookie
   * @private
   */
  private cookies: Array<Cookie>;
  /**
   * 平台
   * @private
   */
  private platform: Platforms;

  /**
   * 用户信息
   */
  public userInfo: PlatformAuthorInfo | undefined;

  /**
   * 初始化一个账号
   * @param cookiesIn
   * @param platformIn 平台枚举（兼容客户端的中文字符串）
   */
  constructor(cookiesIn: string, platformIn: Platforms | string) {
    this.cookies = new Array<Cookie>();
    if (!cookiesIn?.length || cookiesIn.length < 3) {
      throw new Error(`Cookie错误:${cookiesIn}`);
    }
    if (!platformIn) {
      throw new Error('平台不能为空');
    }
    //this.platform = platformNamesRe[platformIn] ?? platformIn;
    this.platform = normalizePlatformCode(platformIn) as Platforms;
    if (!this.platform) {
      throw new Error(`不支持的平台:${platformIn}`);
    }
    this.parseCookie(cookiesIn);
  }

  private parseCookie(cookieStr: string) {
    if (cookieStr?.trim()?.startsWith('[')) {
      this.cookies = JSON.parse(cookieStr) as Array<Cookie>;
      if (!this.cookies?.length) {
        throw new Error('Cookie错误');
      }
      for (const cookie of this.cookies) {
        if (!cookie?.name) {
          cookie.name='emptcookie';
          continue;
        }
        if (/[\u4e00-\u9fa5]/.test(cookie.name) || /[\u4e00-\u9fa5]/.test(cookie.value)) {
          cookie.name = 'invalidNameCookie';
          cookie.value = '';
        }
      }
    } else {
      const tmpCookie = cookieStr.split(';');
      if (!tmpCookie?.length) {
        throw new Error('Cookie错误');
      }
      for (const cookie of tmpCookie) {
        const splitCookie = cookie.split('=');
        if (!splitCookie[0] || /[\u4e00-\u9fa5]/.test(cookie)) {
          continue;
        }
        this.cookies.push({ name: splitCookie[0], value: cookie.substring(splitCookie[0].length + 1) });
      }
    }
  }

  private getCookieStr(domain?: string): string {
    if (domain) {
      return this.cookies
        .filter((m) => m.domain === domain)
        ?.map((x) => `${x.name}=${x.value}`)
        .join(';');
    }
    return this.cookies?.map((x) => `${x.name}=${x.value}`).join(';');
  }
  /**
   * 检测当前账号登录是否有效
   * return 0:失效 1:有效 -1:无法判断
   */
  public async checkAccountAlive(proxy?: IWebProxy): Promise<number> {
    let re = 0;
    try {
      let cookieStr = this.getCookieStr();
      //抖音
      switch (this.platform) {
        case Platforms.DouYin: {
          const result = await Douyin.checkDouYinLogin(cookieStr, proxy);
          if (result.code === errorCode.exception || result?.code === -1) {
            return -1;
          }
          if (result?.code === 8 || result?.msg?.includes('未登录')) {
            return 0;
          } else {
            if (result?.code === 0) {
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }
        case Platforms.KuaiShou: {
          const result = await Kuaishou.checkKuaiShouLogin(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 100110000 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result?.data && result?.data['userId']) {
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.XiaoHongShu: {
          const result = await Xiaohongshu.getXiaohongshuLiveDataOverview(cookieStr, proxy);
          if (result?.code === errorCode.exception) {
            logger.error(`小红书有效检测异常:${JSON.stringify(result)}-${cookieStr}`);
            return -1;
          }
          if (result?.code === -100 || result?.code === 906 || result?.msg?.includes('登录')) {
            return 0;
          } else if (result?.code === 0 && result?.success) {
            return 1;
          } else {
            logger.error(`小红书有效检测异常:${JSON.stringify(result)}-${cookieStr}`);
            this.userInfo = undefined;
            return -1;
          }
        }

        case Platforms.RedNote: {
          const result = await getRedNoteUserInfoResponse(cookieStr, proxy);
          if (isValidRedNoteUserInfo(result)) {
            this.userInfo = {
              code: 0,
              yixiaoerId: result.data.userId.toString(),
              yixiaoerName: result.data.userName?.toString() ?? '',
              yixiaoerImageUrl: result.data.userAvatar,
              verify: result.data.realNameVerified,
              raw: result.data,
            };
            return 1;
          }
          if (isRedNoteLoginExpired(result)) {
            return 0;
          }
          this.userInfo = undefined;
          return -1;
        }

        case Platforms.XiaoHongShuHome: {
          const result = await Xiaohongshuhome.getXiaohongshuhomeUserInfo(cookieStr, proxy);
          if (result?.code === errorCode.exception) {
            logger.error(`小红书首页有效检测异常:${JSON.stringify(result)}-${cookieStr}`);
            return -1;
          }
          if (result?.code === -100 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result?.yixiaoerId?.toString()) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.yixiaoerId.toString(),
                yixiaoerName: result?.yixiaoerName?.toString() ?? '',
                yixiaoerImageUrl: result?.yixiaoerImageUrl,
                raw: result.raw,
              };
              return 1;
            } else {
              logger.error(`小红书首页有效检测异常:${JSON.stringify(result)}-${cookieStr}`);
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.ShiPinHao: {
          const result = await Shipinhao.getShipinhaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 300333 || result?.code === 300334 || result?.code === 300342) {
            return 0;
          } else {
            if (result?.data?.finderUser?.finderUsername) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.finderUser?.uniqId?.toString(),
                yixiaoerName: result?.data?.finderUser?.nickname ?? '',
                yixiaoerImageUrl: result?.data?.finderUser?.headImgUrl,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.BiLiBiLi: {
          const result = await Bilibili.getBilibiliUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === -101 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result?.data?.mid) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.mid.toString(),
                yixiaoerName: result?.data?.uname?.toString() ?? '',
                yixiaoerImageUrl: result?.data?.face,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.XinLangWeiBo: {
          const cookiesWeiBo = this.cookies
            .filter((m) => m.domain?.endsWith('.weibo.com'))
            ?.map((m) => m.name + '=' + m.value)
            .join(';');
          const result = await Xinlangweibo.checkLogin(cookiesWeiBo ? cookiesWeiBo : cookieStr, proxy);
          if (result.code === errorCode.exception) {
            re = -1;
            return re;
          }
          if (result?.code === 302 || result?.msg?.startsWith('Redirecting to')) {
            re = 0;
            return re;
          } else {
            if (result?.msg?.includes('screen_name')) {
              re = 1;
              return re;
            } else {
              this.userInfo = undefined;
              re = -1;
              return re;
            }
          }
        }

        case Platforms.TouTiaoHao: {
          const result = await Toutiaohao.getToutiaohaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 100004 || result?.msg?.includes('login')) {
            return 0;
          } else {
            if (result?.data?.user?.id) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.user?.id.toString(),
                yixiaoerName: result?.data?.user.screen_name?.toString() ?? '',
                yixiaoerImageUrl: result?.data?.user?.https_avatar_url,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.BaiJiaHao: {
          const cookiesBaijia = this.cookies
            .filter((m) => m.domain?.includes('baijiahao.baidu.com') || m.domain?.startsWith('.baidu.com'))
            ?.map((m) => m.name + '=' + m.value)
            .join(';');
          let webProxy: object | undefined = undefined;
          if (proxy?.serverAdd) {
            webProxy = createKuaiProxyAgent(proxy);
          }
          const result = await Baijiahao.getBaijiahaoBaseToken(cookiesBaijia ? cookiesBaijia : cookieStr, webProxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.token?.length > 5) {
            return 1;
          } else {
            this.userInfo = undefined;
            return 0;
          }
        }

        case Platforms.AiQiYi: {
          const result = await Aiqiyi.getAiqiyiUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 401 || result?.msg?.startsWith('Invalid')) {
            return 0;
          } else {
            if (result?.data?.uid) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data.uid.toString(),
                yixiaoerName: result?.data?.nickname?.toString() ?? '',
                yixiaoerImageUrl: result?.data?.icon,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.QiEHao: {
          const result = await Qiehao.getQiehaoUserInfo(cookieStr, proxy); //code=-10403 login
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === -10403 || result?.msg?.includes('login')) {
            return 0;
          } else {
            if (result?.data?.cpInfo.mediaid) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.cpInfo.mediaid.toString(),
                yixiaoerName: result?.data?.cpInfo.medianame?.toString() ?? '',
                yixiaoerImageUrl: result?.data?.cpInfo?.header,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.ZhiHu: {
          const result = await Zhihu.getZhihuUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 100 || result?.msg?.includes('TICKET_NOT_EXIST')) {
            return 0;
          } else {
            if (result?.data?.uid || result.code === errorCode.accountUnVerify) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.uid.toString(),
                yixiaoerName: result?.data?.name?.toString() ?? '',
                yixiaoerImageUrl: result?.data?.avatar_url,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.TengXunWeiShi: {
          const accToken = await Tengxunweishi.getPersonalAccessTokenAsync(cookieStr);
          const pre = await Tengxunweishi.checkLogin(accToken ? accToken : cookieStr, proxy);

          if (pre?.code === 302 || pre?.msg?.includes('h5.weishi.qq.com/weishi/account/login')) {
            return 0;
          } else {
            if (pre?.msg?.includes('<title>腾讯微视·视频上传</title>\n')) {
              return 1;
            } else {
              return -1;
            }
          }
        }

        case Platforms.XiGuaShiPin: {
          const result = await Xiguashipin.getXiguashipinUserInfo(cookieStr);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.data?.userId) {
            this.userInfo = {
              code: 0,
              yixiaoerId: result.data?.userId.toString(),
              yixiaoerName: result?.data?.userName?.toString() ?? '',
              yixiaoerImageUrl: result?.data?.userImage,
              raw: result.data,
            };
            return 1;
          } else {
            this.userInfo = undefined;
            return 0;
          }
        }

        case Platforms.DaYuHao: {
          const result = await Dayuhao.getDayuhaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 401) {
            return 0;
          } else {
            if (result?.data?.uid) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.uid?.toString(),
                yixiaoerName: result?.data?.nickname.toString() ?? '',
                yixiaoerImageUrl: result?.data?.avatar,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.SouHuHao: {
          const result = await Souhuhao.getSouhuhaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code == 1211 || result.msg?.includes('登录')) {
            return 0;
          } else {
            if (result?.yixiaoerId) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.yixiaoerId,
                yixiaoerName: result.yixiaoerName ?? '',
                yixiaoerImageUrl: result.yixiaoerImageUrl,
                raw: result.raw,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.WangYiHao: {
          const result = await Wangyihao.getWangyihaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 100021 || result?.msg?.includes('未登录')) {
            return 0;
          } else {
            if (result?.data?.userId) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.userId.toString(),
                yixiaoerName: result?.data?.tname ?? '',
                yixiaoerImageUrl: result?.data?.icon,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.YiDianHao: {
          const result = await Yidianhao.getYidianhaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 401) {
            return 0;
          } else {
            if (result?.data?.uid) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.uid?.toString(),
                yixiaoerName: result?.data?.media_name ?? '',
                yixiaoerImageUrl: result?.data?.media_pic,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.WeiXinGongZhongHao: {
          const result = await Weixingongzhonghao.getWeixingongzhonghaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }
          if (result?.code === 200003) {
            return 0;
          } else {
            if (result?.data?.author_id) {
              this.userInfo = {
                code: 0,
                yixiaoerId: result.data?.author_id?.toString(),
                yixiaoerName: result?.data?.nick_name ?? '',
                yixiaoerImageUrl: result?.data?.head_img,
                raw: result.data,
              };
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.SouHuShiPin: {
          const cookieTmp = convertCookieStr(JSON.stringify(this.cookies));
          let webProxy: object | undefined = undefined;
          if (proxy?.serverAdd) {
            webProxy = createKuaiProxyAgent(proxy);
          }
          const result = await SouHuShiPin.getUserHomeResponse(cookieTmp ? cookieTmp : cookieStr, webProxy);

          if (result === 302) {
            return 0;
          } else {
            if (result === 200) {
              return 1;
            } else {
              this.userInfo = undefined;
              return -1;
            }
          }
        }

        case Platforms.PiPiXia: {
          const cookieTmp = convertCookieStr(
            typeof this.cookies !== 'string' ? JSON.stringify(this.cookies) : this.cookies,
            'pipix.com',
          );
          const result = await Pipixia.getPiPiXiaUserInfo(cookieTmp, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.msg?.includes('login')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }

        case Platforms.TengXunShiPin: {
          let webProxy: object | undefined = undefined;
          if (proxy?.serverAdd) {
            webProxy = createKuaiProxyAgent(proxy);
          }
          const result = await Tengxunshipin.getPersonalAccessTokenAsync(cookieStr, webProxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code != 0) {
            return 0;
          } else {
            return 1;
          }
        }

        case Platforms.DuoDuoShiPin: {
          //const cookieTmp = convertCookieStr(JSON.stringify(this.cookies), 'pipix.com');
          const result = await Duoduoshipin.getDuoduoshipinUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 40032 || result?.code === 40001) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }

        case Platforms.AcFun: {
          //const cookieTmp = convertCookieStr(JSON.stringify(this.cookies), 'pipix.com');
          const result = await Azhan.getAzhanUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 401) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }

        case Platforms.MeiPai: {
          //const cookieTmp = convertCookieStr(JSON.stringify(this.cookies), 'pipix.com');
          const result = await MeiPai.getMeiPaiUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 10001) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }

        case Platforms.KuaiChuanHao: {
          //const cookieTmp = convertCookieStr(JSON.stringify(this.cookies), 'pipix.com');
          const result = await KuaiChuanHao.getKuaiChuanUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 12) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }

        //getXueQiuUserInfoResponse
        case Platforms.XueQiuHao: {
          //const cookieTmp = convertCookieStr(JSON.stringify(this.cookies), 'pipix.com');
          const result = await Xueqiuhao.getXueqiuhaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }

        case Platforms.XiaoHongShuShangJiaHao: {
          //const cookieTmp = convertCookieStr(JSON.stringify(this.cookies), 'pipix.com');

          const result = await Xiaohongshushop.getXiaohongshushopUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === -100 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.MeiYou: {
          let webProxy: object | undefined = undefined;
          if (proxy?.serverAdd) {
            webProxy = createKuaiProxyAgent(proxy);
          }
          cookieStr = cookieStr.replace('expireTime=', 'expireTimeOld=');
          cookieStr = `${cookieStr};expireTime=${new Date('2200-10-10').getTime()}`;
          const result = await MeiYou.getMeiYouUserLoginResponse(cookieStr, webProxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.data?.login === false || result?.data?.url == 'https://sso.meiyou.com/sso/login') {
            return 0;
          } else {
            return 1;
          }
        }
        case Platforms.CheJiaHao: {
          const result = await CheJiaHao.getCheJiaHaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 401 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.YiCheHao: {
          const result = await YiCheHao.getYiCheHaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 401 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.DongCheHao: {
          const result = await DongCheHao.getDongCheHaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 401 || result?.code === errorCode.loginExpire || result?.msg?.includes('登录')) {
            return 0;
          }
          if (result.yixiaoerId) {
            this.userInfo = result;
            return 1;
          }
          return -1;
        }
        case Platforms.FengWang: {
          const result = await FengWang.getFengWangUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 403 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId || result.code == errorCode.accountUnVerify) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.DouBan: {
          const result = await DouBan.getDouBanUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 301 || result?.code === 302 || result?.msg?.includes('login')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.CSDN: {
          const result = await Csdn.getCSDNUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 401 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.DeWu: {
          const result = await DeWu.getDeWuUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 401 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.JianShu: {
          const result = await JianShu.getJianShuUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 301 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.WiFiWanNengYaoShi: {
          const result = await WiFi.getWiFiUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 9000001 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.AI_DouBao: {
          const result = await AIDouBao.getDoubaoUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 13 || result?.msg?.includes('登录')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.AI_DeepSeek: {
          const result = await AIDeepSeek.getDeepseekUserInfo(cookieStr, proxy);
          if (result.code === errorCode.exception) {
            return -1;
          }

          if (result?.code === 40003 || result?.msg?.includes('uthorization')) {
            return 0;
          } else {
            if (result.yixiaoerId) {
              this.userInfo = result;
              return 1;
            } else {
              return -1;
            }
          }
        }
        case Platforms.TaoBaoGuangHe: {
          const result = await TaoBaoGuangHe.getTaoBaoGuangHeUserInfo(cookieStr, proxy);
          const responseCode = Number(result?.code);
          const responseMessage = [result?.msg, result?.message]
            .filter((message): message is string => typeof message === 'string')
            .join(' ');

          if (responseCode === errorCode.exception) {
            return -1;
          }

          if (
            [401, 403, errorCode.notLogin, errorCode.loginExpire].includes(responseCode) ||
            /未登录|登录失效|请先登录|login\s*expired/i.test(responseMessage)
          ) {
            this.userInfo = undefined;
            return 0;
          }

          const accountData =
            result?.data && typeof result.data === 'object'
              ? (result.data as Record<string, unknown>)
              : undefined;

          // queryPerson 未返回账号对象时，按登录态失效处理，与参考实现保持一致。
          if (!accountData) {
            this.userInfo = undefined;
            return 0;
          }

          const accountId = accountData?.id ?? accountData?.userId ?? accountData?.uid;

          if (accountId !== undefined && accountId !== null && String(accountId).length > 0) {
            const accountName = accountData?.userNick ?? accountData?.nickname ?? accountData?.nickName;
            const accountAvatar = accountData?.avatar ?? accountData?.avatarUrl;
            this.userInfo = {
              code: errorCode.ok,
              yixiaoerId: String(accountId),
              yixiaoerName: accountName == null ? '' : String(accountName),
              yixiaoerImageUrl: accountAvatar == null ? undefined : String(accountAvatar),
              raw: result.data ?? undefined,
            };
            return 1;
          }

          this.userInfo = undefined;
          return -1;
        }
        default:
          return 404;
      }
    } catch (error) {
      logger.error(`检测账号异常:${this.platform}:${error?.toString()}`);
      return -1;
    } finally {
      if (this.platform === Platforms.XinLangWeiBo && re === 0) {
        logger.error(`新浪微博检测到失效:${JSON.stringify(this.cookies)}`);
      }
    }
  }

  /**
   * 获取账号信息
   */
  public async getAccountInfo(): Promise<PlatformAuthorInfo> {
    throw new Error('未实现');
  }
}
