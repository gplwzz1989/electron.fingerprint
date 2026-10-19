/**
 * 内容/发布类型
 */
export enum PubContentEnum {
  /**
   * 视频
   */
  video = 'video',
  /**
   * 动态/短图文（图文分离）
   */
  dynamic = 'dynamic',
  /**
   * 文章/长文（图文混编）
   */
  article = 'article',

  /**
   * 兼容客户端图文类型值，等于dynamic
   */
  ImageText = 'imageText',

  /**
   * 音频
   */
  audio = 'audio',
}

/**
 * 创作类型
 */
export enum ContentCreateTypeEnum {
  /**
   * 翻译
   */
  translate = 4,
  /**
   * 首发
   */
  first = 3,
  /**
   * 转载/转发
   */
  forward = 2,
  /**
   * 原创
   */
  original = 1,
  /**
   * 无
   */
  none = 0,
}

/**
 * 可见类型
 */
export enum VisibleTypeEnum {
  /**
   * 公开
   */
  public = 0,
  /**
   * 非公开，包含下面所有不可公开访问的情况，按平台支持情况依顺序类推
   */
  unPublic = -1,
  /**
   * 私密/尽自己可见
   */
  private = 1,
  /**
   * 仅粉丝可见
   */
  fan = 2,
  /**
   * 好友/互关可见
   */
  friend = 3,
  /**
   * 草稿
   */
  draft = 4,
}

/**
 * 回传任务进度状态
 */
export enum BackStagesEnum {
  /**
   * 上传
   */
  upload = 'upload',
  /**
   * 推送
   */
  push = 'push',
  /**
   *转码
   */
  transcoding = 'transcoding',
  /**
   * 审核
   */
  review = 'review',
  /**
   * 定时
   */
  scheduled = 'scheduled',
  /**
   * 未找到作品
   */
  notfound = 'notfound',
  /**
   * 成功
   */
  success = 'success',

  /**
   * 下架
   */
  withdrawn = 'withdrawn',

  /**
   * 发布验证
   */
  verify = 'verify',
}

/**
 * 回传任务结果
 */
export enum BackStageStatusEnum {
  doing = 'doing',
  success = 'success',
  fail = 'fail',
}

/**
 * 回传事件类型
 */
export enum CallBackDataEvent {
  /**
   * 发布进度
   */
  publishProcess = 'publishProcess',
  /**
   * 发布结果
   */
  publishResult = 'publishResult',

  /**
   * 发布需要用户验证
   */
  publishVerifyRequired = 'publishVerifyRequired',
  /**
   * 审核状态
   */
  auditStatus = 'auditStatus',
  /**
   * 账号概览数据
   */
  accountOverview = 'accountOverview',
  /**
   * 账号内容列表
   */
  contentList = 'contentList',

  /**
   * 内容列表同步任务结束事件
   */
  contentListEnd = 'contentListEnd',

  /**
   *  微信发布扫码相关
   */
  wxQrCode = 'wxQrCode',

  /**
   * 评论作品
   */
  commentContent = 'commentContent',

  /**
   * 评论列表
   */
  commentList = 'commentList',

  /**
   * 评论列表结束
   */
  commentListEnd = 'commentListEnd',

  /**
   * 私信
   */
  privateMsg = 'privateMsg',

  /**
   * 私信
   */
  privateMsgNotify = 'privateMsgNotify',

  /**
   *
   */
  privateMsgEnd = 'privateMsgEnd',

  /**
   * 登录失效
   */
  loginExpire = 'loginExpire',
}
