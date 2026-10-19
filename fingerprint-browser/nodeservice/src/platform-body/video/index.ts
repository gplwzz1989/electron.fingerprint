import { AiQiYiArticlePlatformBody, AiQiYiVideoPlatformBody } from './aiqiyi';
import { BaiJiaHaoArticlePlatformBody, BaiJiaHaoDynamicPlatformBody, BaiJiaHaoVideoPlatformBody } from './baijiahao';
import { BilibiliArticlePlatformBody, BilibiliVideoPlatformBody } from './bilibili';
import { DouYinArticlePlatformBody, DouYinDynamicPlatformBody, DouYinVideoPlatformBody } from './douyin';
import { KuaiShouDynamicPlatformBody, KuaiShouVideoPlatformBody } from './kuaishou';
import { QiEHaoArticlePlatformBody, QiEHaoVideoPlatformBody } from './qiehao';
import { SouHuHaoArticlePlatformBody, SouHuHaoVideoPlatformBody } from './souhuhao';
import { TengXunWeiShiVideoPlatformBody } from './tengxunweishi';
import { TouTiaoDynamicPlatformBody, TouTiaoHaoArticlePlatformBody, TouTiaoHaoVideoPlatformBody } from './toutiaohao';
import { WangYiHaoArticlePlatformBody, WangYiHaoVideoPlatformBody } from './wangyihao';
import { WeiXinShiPinHaoDynamicPlatformBody, WeiXinShiPinHaoVideoPlatformBody } from './weixinshipinhao';
import { XiaoHongShuDynamicPlatformBody, XiaoHongShuVideoPlatformBody } from './xiaohongshu';
import { RedNoteDynamicPlatformBody, RedNoteVideoPlatformBody } from './rednote';
import {
  XinLangWeiBoArticlePlatformBody,
  XinLangWeiBoDynamicPlatformBody,
  XinLangWeiBoVideoPlatformBody,
} from './xinlangweibo';
import { YiDianHaoArticlePlatformBody, YiDianHaoVideoPlatformBody } from './yidianhao';
import { ZhiHuArticlePlatformBody, ZhiHuDynamicPlatformBody, ZhiHuVideoPlatformBody } from './zhihu';
import { DaYuHaoArticlePlatformBody, DaYuHaoVideoPlatformBody } from './dayuhao';
import { SouHuShiPinVideoPlatformBody } from './sohushipin';
import { PiPiXiaVideoPlatformBody } from './pipixia';
import { TengXunShiPinVideoPlatformBody } from '@/platform-body/video/tengxunshipin';
import { DuoDuoVideoPlatformBody } from '@/platform-body/video/duoduoshipin';
import { MeiPaiVideoPlatformBody } from '@/platform-body/video/meipai';
import { ACFunVideoPlatformBody, ACFunArticlePlatformBody } from '@/platform-body/video/acfun';
import { KuaiChuanHaoArticlePlatformBody } from '@/platform-body/video/kuaichuanhao';
import { XueQiuHaoArticlePlatformBody } from '@/platform-body/video/xueqiuhao';
import {
  XiaoHongShuShopDynamicPlatformBody,
  XiaoHongShuShopVideoPlatformBody,
} from '@/platform-body/video/XiaoHongShuShangJiaHao';
import { CheJiaHaoArticlePlatformBody, CheJiaHaoVideoPlatformBody } from '@/platform-body/video/chejiahao';
import {
  DongCheHaoArticlePlatformBody,
  DongCheHaoDynamicPlatformBody,
  DongCheHaoVideoPlatformBody,
} from '@/platform-body/video/dongchehao';
import {
  WeiXinGongZhongHaoDynamicPlatformBody,
  WeiXinGongZhongHaoMessagePlatformBody,
  WeiXinGongZhongHaoVideoMessagePlatformBody,
} from '@/platform-body/video/weixingongzhonghao';
import { YiCheHaoHaoArticlePlatformBody, YiCheHaoVideoPlatformBody } from '@/platform-body/video/yichehao';
import { FengWangVideoPlatformBody } from '@/platform-body/video/fengwang';
import { DouBanArticlePlatformBody } from '@/platform-body/video/douban';
import { CSDNArticlePlatformBody } from '@/platform-body/video/csdn';
import { DeWuVideoPlatformBody } from '@/platform-body/video/dewu';
import { JianShuArticlePlatformBody } from '@/platform-body/video/jianshu';
import { WifiWanNengArticlePlatformBody } from '@/platform-body/video/wifiwanneng';
import { MeiYouVideoPlatformBody } from '@/platform-body/video/meiyou';
import {
  TaoBaoGuangHeDynamicPlatformBody,
  TaoBaoGuangHeVideoPlatformBody,
} from '@/platform-body/video/taobaoguanghe';

export * from './douyin';
export * from './kuaishou';
export * from './xiaohongshu';
export * from './rednote';
export * from './XiaoHongShuShangJiaHao';
export * from './weixinshipinhao';
export * from './xinlangweibo';
export * from './tengxunweishi';
export * from './zhihu';
export * from './qiehao';
export * from './souhuhao';
export * from './yidianhao';
export * from './wangyihao';
export * from './aiqiyi';
export * from './bilibili';
export * from './baijiahao';
export * from './toutiaohao';
export * from './taobaoguanghe';
export * from './dongchehao';

/** 喜马拉雅音频发布数据。签名字段暂由调用方传入，后续将改为浏览器签名服务自动生成。 */
export interface XimalayaAudioPlatformBody {
  audio: {
    localPath?: string;
    url?: string;
    duration?: number;
    size?: number;
  };
  /** 待上传的封面文件。 */
  cover?: { pathOrUrl: string; format?: string };
  title: string;
  desc?: string;
  /** 富文本节目简介；未传时使用 desc。 */
  soundRichIntro?: string;
  /** 外部选择的完整专辑项；raw 中必须保留 categoryId 与 albumStatusInfo。 */
  album?: {
    yixiaoerId: string;
    yixiaoerName: string;
    raw: object;
  };
  categoryId?: number | string;
  /** 已上传封面，由喜马拉雅上传接口返回。 */
  soundCoverPath?: { fileId: number; fileUrl?: string };
  /** 外部统一标签输入；适配层转换为喜马拉雅 soundTags。 */
  tags?: string[];
  /** 外部统一话题输入；每项必须含平台话题 ID 与名称。 */
  topics?: Array<{ yixiaoerId: string; yixiaoerName: string }>;
  /** 定时发布时间（毫秒时间戳）；未传为立即发布。 */
  prePubTime?: number;
  /** 可见范围；抓包中的公开值为 2。 */
  visibleCrowdType?: number;
  /** 统一可见范围：公开 0、私密 1、仅好友 3；适配层会转换为平台值 2、1、3。 */
  visibleType?: 0 | 1 | 3;
  isFree?: boolean;
  isTrailer?: boolean;
  trackVipFirst?: boolean;
  /** 统一创作声明：0 不声明、1 AI创作声明、2 图片/视频由 AI 生成。 */
  statement?: { type: 0 | 1 | 2 };
  /** 底层覆盖值；通常由 statement 自动换算。 */
  isAiTrack?: boolean;
  /** 字幕文件 URL。 */
  lrcPath?: string;
  anchorActivity?: { isSynActivity?: boolean; shareContent?: string };
  communityWidget?: object;
  activityId?: string;
  xmSign?: string;
}

export type PlatformBody = VideoPlatformBody | DynamicPlatformBody | ArticlePlatformBody | XimalayaAudioPlatformBody;

/**
 * 视频表单
 */
export type VideoPlatformBody =
  | DouYinVideoPlatformBody
  | KuaiShouVideoPlatformBody
  | XiaoHongShuVideoPlatformBody
  | RedNoteVideoPlatformBody
  | WeiXinShiPinHaoVideoPlatformBody
  | XinLangWeiBoVideoPlatformBody
  | TengXunWeiShiVideoPlatformBody
  | ZhiHuVideoPlatformBody
  | QiEHaoVideoPlatformBody
  | SouHuHaoVideoPlatformBody
  | YiDianHaoVideoPlatformBody
  | WangYiHaoVideoPlatformBody
  | AiQiYiVideoPlatformBody
  | BilibiliVideoPlatformBody
  | BaiJiaHaoVideoPlatformBody
  | TouTiaoHaoVideoPlatformBody
  | DaYuHaoVideoPlatformBody
  | SouHuShiPinVideoPlatformBody
  | PiPiXiaVideoPlatformBody
  | TengXunShiPinVideoPlatformBody
  | DuoDuoVideoPlatformBody
  | MeiPaiVideoPlatformBody
  | ACFunVideoPlatformBody
  | XiaoHongShuShopVideoPlatformBody
  | CheJiaHaoVideoPlatformBody
  | DongCheHaoVideoPlatformBody
  | YiCheHaoVideoPlatformBody
  | FengWangVideoPlatformBody
  | DeWuVideoPlatformBody
  | MeiYouVideoPlatformBody
  | WeiXinGongZhongHaoVideoMessagePlatformBody
  | TaoBaoGuangHeVideoPlatformBody;

/**
 * 图文表单
 */
export type DynamicPlatformBody =
  | DouYinDynamicPlatformBody
  | KuaiShouDynamicPlatformBody
  | XinLangWeiBoDynamicPlatformBody
  | XiaoHongShuDynamicPlatformBody
  | XiaoHongShuShopDynamicPlatformBody
  | RedNoteDynamicPlatformBody
  | WeiXinShiPinHaoDynamicPlatformBody
  | BaiJiaHaoDynamicPlatformBody
  | ZhiHuDynamicPlatformBody
  | TouTiaoDynamicPlatformBody
  | WeiXinGongZhongHaoDynamicPlatformBody
  | DongCheHaoDynamicPlatformBody
  | TaoBaoGuangHeDynamicPlatformBody;

/**
 * 文章表单
 */
export type ArticlePlatformBody =
  | AiQiYiArticlePlatformBody
  | BaiJiaHaoArticlePlatformBody
  | TouTiaoHaoArticlePlatformBody
  | XinLangWeiBoArticlePlatformBody
  | ZhiHuArticlePlatformBody
  | QiEHaoArticlePlatformBody
  | SouHuHaoArticlePlatformBody
  | YiDianHaoArticlePlatformBody
  | WangYiHaoArticlePlatformBody
  | DaYuHaoArticlePlatformBody
  | KuaiChuanHaoArticlePlatformBody
  | XueQiuHaoArticlePlatformBody
  | BilibiliArticlePlatformBody
  | WeiXinGongZhongHaoMessagePlatformBody
  | DouBanArticlePlatformBody
  | CSDNArticlePlatformBody
  | ACFunArticlePlatformBody
  | JianShuArticlePlatformBody
  | WifiWanNengArticlePlatformBody
  | CheJiaHaoArticlePlatformBody
  | YiCheHaoHaoArticlePlatformBody
  | DongCheHaoArticlePlatformBody
  | DouYinArticlePlatformBody;
