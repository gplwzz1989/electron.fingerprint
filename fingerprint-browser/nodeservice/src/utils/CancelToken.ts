/**
 *  任务取消类
 */
export class CancelToken {
  public cancelTimeOut: number = 1000 * 60 * 60 * 60;

  public static cancelMsg: string = '已撤销发布';

  public innerCancelMsg: string = '';
  /**
   * 是否需要取消任务
   * @private
   */
  private cancelled: boolean;
  /**
   * 是否可取消
   * @private
   */
  private enable: boolean;
  constructor() {
    this.cancelled = false;
    this.enable = true;
    // setTimeout(() => {
    //   this.innerCancelMsg = `执行超时${(this.cancelTimeOut / 1000).toFixed(0)}秒`;
    //   this.cancelled = true;
    // }, this.cancelTimeOut);
  }

  get cancelledValue(): boolean {
    return this.cancelled;
  }

  /**
   * 取消任务
   */
  public cancel(): boolean {
    this.cancelled = true;
    return this.enable;
  }

  /**
   * 请勿在外部调用
   * @param checkKey
   */
  public throwIfCancelled(checkKey: string) {
    if (checkKey != privateKey) {
      throw new Error('不可访问该方法');
    }
    if (this.cancelled) {
      throw new Error(this.innerCancelMsg ? this.innerCancelMsg : '已撤销发布');
    }
  }
  /**
   * 请勿在外部调用
   * @param checkKey
   */
  public disable(checkKey: string) {
    if (checkKey != privateKey) {
      throw new Error('不可访问该方法');
    }
    this.enable = false;
  }
}

export const privateKey = new Date().getTime().toString();
