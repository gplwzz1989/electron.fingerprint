import { VideoFormItem } from '@/platform-body/common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 皮皮虾平台表单
 * @description 皮皮虾视频发布表单的数据结构
 * @interface PiPiXiaVideoPlatformBody
 */
export interface PiPiXiaVideoPlatformBody {
  /**
   * 视频文件信息
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小300MB，最大时长3分钟，编码格式限制：AVC
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最小像素尺寸300x400
   */
  covers: ImageInfo[];

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 最大长度2000个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   *
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 话题
   * @type {ListItemInfo}
   * @description 话题搜索结果列表中的选项，发布时使用 yixiaoerId 作为 hashtag_id
   */
  topic?: ListItemInfo;
}
