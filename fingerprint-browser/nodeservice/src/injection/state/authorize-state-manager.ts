export class AuthorizeStateManager {
  /**
   * @description  false代表未授权，undefined代表未知，true代表已授权。
   * @private
   */
  private authorizeState: Record<string, boolean | undefined> = {};
  private extraDataSet: Record<string, never> = {};

  setAuthorized(contextId: string) {
    this.authorizeState[contextId] = true;
  }

  reset(contextId: string) {
    this.authorizeState[contextId] = undefined;
  }

  setUnAuthorized(contextId: string) {
    this.authorizeState[contextId] = false;
  }

  isAuthorized(contextId: string) {
    return this.authorizeState[contextId] === true;
  }

  isUnAuthorized(contextId: string) {
    return this.authorizeState[contextId] === false;
  }

  setExtraData<T>(contextId: string, extraData: T) {
    this.extraDataSet[contextId] = extraData as never;
  }

  getExtraData<T>(contextId: string) {
    return this.extraDataSet[contextId] as T;
  }
}
