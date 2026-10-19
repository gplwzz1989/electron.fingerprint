export class TabAbortControllerManager {
  private abortControllers: Record<string, AbortController> = {};

  new(tabId: string) {
    if (this.abortControllers[tabId]) {
      this.abort(tabId);
    }
    const abortController = new AbortController();
    this.abortControllers[tabId] = abortController;
    return abortController;
  }

  abort(tabId: string) {
    const controller = this.abortControllers[tabId];
    if (controller) {
      controller.abort();
      delete this.abortControllers[tabId];
    }
  }
}
