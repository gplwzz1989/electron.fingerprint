import { AiQiYiAuthorizeConfig } from '@/injection/authorize-configs/ai-qi-yi';
import { TengXunWeiShiAuthorizeConfig } from '@/injection/authorize-configs/teng-xun-wei-shi';
import { WangYiHaoAuthorizeConfig } from '@/injection/authorize-configs/wang-yi-hao';
import { platformNames } from '../type';
import type { PlatformAuthorizeConfig } from '../platform-authorize-config';
import { ShiPinHaoStorePlatformCode, XiaoHongShuShouYePlatformCode } from '@/service/datasync-service-manager';
import { DouYinAuthorizeConfig } from './dou-yin';
import { KuaiShouAuthorizeConfig } from './kuai-shou';
import { WeiXinShiPinHaoAuthorizeConfig, WeiXinShiPinHaoStoreAuthorizeConfig } from './wei-xin-shi-pin-hao';
import { XiaoHongShuAuthorizeConfig, XiaoHongShuShouYeAuthorizeConfig } from './xiao-hong-shu';
import { BilibiliAuthorizeConfig } from './bilibili';
import { BaiJiaHaoAuthorizeConfig } from './bai-jia-hao';
import { TouTiaoHaoAuthorizeConfig } from './tou-tiao-hao';
import { XinLangWeiBoAuthorizeConfig } from './xin-lang-wei-bo';
import { ZhiHuAuthorizeConfig } from './zhi-hu';
import { QiEHaoAuthorizeConfig } from './qi-e-hao';
import { DaYuHaoAuthorizeConfig } from './da-yu-hao';
import { SouHuHaoAuthorizeConfig } from './sou-hu-hao';
import { YiDianHaoAuthorizeConfig } from './yi-dian-hao';
import { SouHuShiPinAuthorizeConfig } from './sou-hu-shi-pin';
import { PiPiXiaAuthorizeConfig } from './pi-pi-xia';
import { TengXunShiPinAuthorizeConfig } from './teng-xun-shi-pin';
import { DuoDuoShiPinAuthorizeConfig } from './duo-duo-shi-pin';
import { MeiPaiAuthorizeConfig } from './mei-pai';
import { AZhanAuthorizeConfig } from './azhan';
import { KuaiChuanHaoAuthorizeConfig } from './kuai-chuan-hao';
import { XueQiuHaoAuthorizeConfig } from './xue-qiu-hao';
import { XiaoHongShuShangJiaHaoAuthorizeConfig } from './xiao-hong-shu-shang-jia-hao';
import { MeiYouAuthorizeConfig } from './mei-you';
import { CheJiaHaoAuthorizeConfig } from './che-jia-hao';
import { YiCheHaoAuthorizeConfig } from './yi-che-hao';
import { DongCheHaoAuthorizeConfig } from './dong-che-hao';
import { WeiXinGongZhongHaoAuthorizeConfig } from './wei-xin-gong-zhong-hao';
import { FengWangAuthorizeConfig } from './feng-wang';
import { DouBanAuthorizeConfig } from './dou-ban';
import { CSDNAuthorizeConfig } from './csdn';
import { DeWuAuthorizeConfig } from './de-wu';
import { JianShuAuthorizeConfig } from './jian-shu';
import { WifiWanNengYaoShiAuthorizeConfig } from './wifi-wan-neng-yao-shi';
import { AI_DouBaoAuthorizeConfig } from './ai-doubao';
import { AI_DeepSeekAuthorizeConfig } from '@/injection/authorize-configs/ai-deeepseek';
import { XiaoHongShuShouHomeConfig } from '@/injection/authorize-configs/xiao-hong-shu-home';
import { TaoBaoGuangHeAuthorizeConfig } from '@/injection/authorize-configs/taobao-guanghe';
import { RedNoteAuthorizeConfig } from '@/injection/authorize-configs/rednote';

export const platformConfig: Record<string, PlatformAuthorizeConfig | undefined> = {
  [platformNames.ZhiHu]: new ZhiHuAuthorizeConfig(),
  [platformNames.DouYin]: new DouYinAuthorizeConfig(),
  [platformNames.KuaiShou]: new KuaiShouAuthorizeConfig(),
  [platformNames.ShiPinHao]: new WeiXinShiPinHaoAuthorizeConfig(),
  [ShiPinHaoStorePlatformCode]: new WeiXinShiPinHaoStoreAuthorizeConfig(),
  [platformNames.XiaoHongShu]: new XiaoHongShuAuthorizeConfig(),
  [platformNames.RedNote]: new RedNoteAuthorizeConfig(),
  [XiaoHongShuShouYePlatformCode]: new XiaoHongShuShouYeAuthorizeConfig(),
  [platformNames.BiLiBiLi]: new BilibiliAuthorizeConfig(),
  [platformNames.BaiJiaHao]: new BaiJiaHaoAuthorizeConfig(),
  [platformNames.TouTiaoHao]: new TouTiaoHaoAuthorizeConfig(),
  [platformNames.XinLangWeiBo]: new XinLangWeiBoAuthorizeConfig(),
  [platformNames.QiEHao]: new QiEHaoAuthorizeConfig(),
  [platformNames.SouHuHao]: new SouHuHaoAuthorizeConfig(),
  [platformNames.YiDianHao]: new YiDianHaoAuthorizeConfig(),
  [platformNames.DaYuHao]: new DaYuHaoAuthorizeConfig(),
  [platformNames.WangYiHao]: new WangYiHaoAuthorizeConfig(),
  [platformNames.AiQiYi]: new AiQiYiAuthorizeConfig(),
  [platformNames.TengXunWeiShi]: new TengXunWeiShiAuthorizeConfig(),
  [platformNames.SouHuShiPin]: new SouHuShiPinAuthorizeConfig(),
  [platformNames.PiPiXia]: new PiPiXiaAuthorizeConfig(),
  [platformNames.TengXunShiPin]: new TengXunShiPinAuthorizeConfig(),
  [platformNames.DuoDuoShiPin]: new DuoDuoShiPinAuthorizeConfig(),
  [platformNames.MeiPai]: new MeiPaiAuthorizeConfig(),
  [platformNames.AcFun]: new AZhanAuthorizeConfig(),
  [platformNames.KuaiChuanHao]: new KuaiChuanHaoAuthorizeConfig(),
  [platformNames.XueQiuHao]: new XueQiuHaoAuthorizeConfig(),
  [platformNames.XiaoHongShuShangJiaHao]: new XiaoHongShuShangJiaHaoAuthorizeConfig(),
  [platformNames.MeiYou]: new MeiYouAuthorizeConfig(),
  [platformNames.CheJiaHao]: new CheJiaHaoAuthorizeConfig(),
  [platformNames.WeiXinGongZhongHao]: new WeiXinGongZhongHaoAuthorizeConfig(),
  [platformNames.YiCheHao]: new YiCheHaoAuthorizeConfig(),
  [platformNames.DongCheHao]: new DongCheHaoAuthorizeConfig(),
  [platformNames.FengWang]: new FengWangAuthorizeConfig(),
  [platformNames.DouBan]: new DouBanAuthorizeConfig(),
  [platformNames.CSDN]: new CSDNAuthorizeConfig(),
  [platformNames.DeWu]: new DeWuAuthorizeConfig(),
  [platformNames.JianShu]: new JianShuAuthorizeConfig(),
  [platformNames.WiFiWanNengYaoShi]: new WifiWanNengYaoShiAuthorizeConfig(),
  [platformNames.AI_DouBao]: new AI_DouBaoAuthorizeConfig(),
  [platformNames.AI_DeepSeek]: new AI_DeepSeekAuthorizeConfig(),
  [platformNames.XiaoHongShuHome]: new XiaoHongShuShouHomeConfig(),
  [platformNames.TaoBaoGuangHe]: new TaoBaoGuangHeAuthorizeConfig(),
};
