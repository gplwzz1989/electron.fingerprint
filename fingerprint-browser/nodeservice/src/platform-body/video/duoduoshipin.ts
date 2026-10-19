import { VideoFormItem } from '@/platform-body/common';
import { GoodsItemInfo, ImageInfo } from '@/media-platform';
import { WangYiHaoContentStatement } from '@/platform-body/video/wangyihao';

/**
 * 多多视频平台表单
 * @description 多多视频发布表单的数据结构
 * @interface DuoDuoVideoPlatformBody
 */
export interface DuoDuoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小20GB，最大时长30分钟
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * -最大 10M
   * - 最小像素尺寸360*360
   */
  covers: ImageInfo[];

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
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 创作内容声明
   * @type {DuoDuoShiPinContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: DuoDuoShiPinContentStatement;
  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：30天
   */
  prePubTime?: number;

  /**
   * 添加商品,只能一个
   * @type{GoodsItemInfo}
   */
  shopping_cart?: GoodsItemInfo;
}

/**
 *内容申明
 * 1：内容由AI生成
 * 3：内容为转载
 * 5：虚构演绎，仅供娱乐
 * 7：内容含营销信息
 * 8：个人观点，仅供参考
 */
export enum DuoDuoShiPinStatementType {
  '内容由AI生成' = 1,
  '内容为转载' = 3,
  '虚构演绎，仅供娱乐' = 5,
  '内容含营销信息' = 7,
  '个人观点，仅供参考' = 8,
}

/**
 * 多多视频申明,默认留空
 */
export interface DuoDuoShiPinContentStatement {
  /**
   *内容申明
   * 1：内容由AI生成
   * 3：内容为转载
   * 5：虚构演绎，仅供娱乐
   * 7：内容含营销信息
   * 8：个人观点，仅供参考
   */
  type: DuoDuoShiPinStatementType;
}
