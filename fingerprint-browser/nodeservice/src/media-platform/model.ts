import { ListMusicInfoResponse } from '@/media-platform/baseModel';

/**
 * 标准化音乐信息
 */
export interface PlatformMusicInfo {
  /**
   * 音乐id
   */
  id: string;
  /**
   * 音乐名称
   */
  name: string;
  /**
   * 作者昵称
   */
  authorName: string;
  /**
   * 音乐时长
   */
  duration: number;

  /**
   * 音乐图片
   */
  image: string;

  /**
   * 音乐播放url地址
   */
  url: string;

  /**
   * 原始信息
   */
  raw: object;
}

/**
 * 标准化音乐接口返回
 */
export interface PlatformMusicInfoOutput extends ListMusicInfoResponse {
  /**
   * 状态码 0:正常，非0异常
   */
  code: number;
  /**
   * 异常信息
   */
  msg: string;
  /**
   * 音乐列表
   */
  data?: Array<PlatformMusicInfo>;

  /**
   * 总数
   */
  total?: number;
  /**
   * 下一页参数，部分平台翻页使用瀑布流，不使用数字,没有下一页参数时表示已经时最后一页
   */
  nextPage?: string;
}
