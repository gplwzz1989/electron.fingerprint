export interface BaseResult {
  /**
   * 状态码
   * -0正常 非0 异常  -110:账号风控需要到页面验证
   */
  code: number;
  /**
   * 提示消息
   */
  msg?: string;

  data?: object;
}
