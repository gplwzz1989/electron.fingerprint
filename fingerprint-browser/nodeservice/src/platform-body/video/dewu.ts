import { VideoFormItem } from '@/platform-body/common';
import { GoodsItemInfo, ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 得物可见类型
 */
export enum DeWuVisibleType {
  /**
   * 公开
   */
  public = 0,
  /**
   * 私密/尽自己可见
   */
  private = 1,
}
/**
 * 得物平台视频表单
 * @description 得物视频发布表单的数据结构
 * @interface DeWuVideoPlatformBody
 */
export interface DeWuVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小8GB，最大时长30分钟
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小5MB
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 最大长度500个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc: string;

  /**
   * 创作内容声明
   * @type {DeWuContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   */
  statement?: DeWuContentStatement;

  /**
   * 发布位置
   * @type {ListItemInfo}
   * @description 视频发布的地理位置信息，可选字段，来源于地址搜索接口
   *
   */
  location?: ListItemInfo;

  /**
   * 可见类型
   * @type {DeWuVisibleType}
   * 0:公开
   * 1:私密
   *
   */
  visibleType: DeWuVisibleType;

  /**
   * 关联好物（商品）
   * @type{GoodsItemInfo[]}
   * @description 视频时长低于3秒，不可关联好物。且每3秒只能关联一个好物
   */
  shopping_cart?: Array<GoodsItemInfo>;
}

/**
 * 申明来源
 * 0:不不添加自主声明
 * 1：内容由AI生成
 * 2：内容不含营销推广属性
 * 3：内容涉及专业运动
 * 4：剧情演绎，仅供娱乐
 */
export enum DeWuStatementType {
  NONE = 0,
  AIGC = 1,
  NoSaleInfo = 2,
  ProSports = 3,
  Funny = 4,
}

/**
 * 得物申明
 */
export interface DeWuContentStatement {
  /**
   * 申明来源
   * 0:不不添加自主声明
   * 1：内容由AI生成
   * 2：内容不含营销推广属性
   * 3：内容涉及专业运动
   * 4：剧情演绎，仅供娱乐
   */
  type: DeWuStatementType;
}
