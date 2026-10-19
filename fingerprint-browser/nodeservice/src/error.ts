// 未知异常处理
export class UnknownException extends Error {
  constructor() {
    super('未知异常');
  }
}

/**
 * 错误请求异常
 * 如：参数错误、参数缺失等
 */
export class BadRequestException extends Error {
  /**
   * 原始结构
   * @type {unknown}
   */
  raw?: unknown;

  code?: string;

  constructor(message?: string, code?: string | number, raw?: unknown) {
    super(message ?? '错误请求');
    this.code = code?.toString();
    this.raw = raw;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * 接口返回输出项
 */
export interface ResultOutput<T> {
  /**
   * 状态码
   */
  statusCode: number;
  /**
   * 消息
   */
  message?: string;
  /**
   * 数据
   */
  data?: T | never;
}
