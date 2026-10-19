export enum errorCode {
  ok = 0,
  request_error = 172001,
  data_error = 2,
  unknown_error = 3,
  io_error = 172002,
  exception = 112,
  /**
   * 媒体号未入住
   */
  accountUnVerify = 172003,

  /**
   * 未登录
   */
  notLogin = 172401,
  /**
   * 登录失效
   */
  loginExpire = 172403,

  /**
   * 平台权限相关问题
   */
  privilege_error = 172400,

  /**
   * 需要风控验证
   */
  risk_verify = 172110,
}
