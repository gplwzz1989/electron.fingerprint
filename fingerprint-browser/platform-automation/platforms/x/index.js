'use strict'

/**
 * X (Twitter) 平台自动化引擎
 * 负责通过 X 官方内置 Grok AI 自动创作推文，并自动发布到 X 平台
 */

const { BasePlatformAutomation } = require('../../base-automation')
const { SELECTORS, cleanGeneratedText, isXPlatformUrl } = require('./selectors')

const DEFAULT_PROMPT = '请写一条关于最新科技、AI或数字化生活的精简推文（X post）。语言幽默有趣或富有洞察力，字数在120字以内。直接输出推文正文，严禁输出任何引号、前缀说明或解释。'
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000 // 默认 10 分钟

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

class XPlatformAutomation extends BasePlatformAutomation {
  constructor (options = {}) {
    super({
      platformId: 'x',
      platformName: 'X (Twitter)',
      tabBrowser: options.tabBrowser || null,
      defaultIntervalMs: options.defaultIntervalMs || DEFAULT_INTERVAL_MS,
      defaultPrompt: options.defaultPrompt || DEFAULT_PROMPT
    })
  }

  /**
   * 判断环境/网页是否属于 X 平台
   * 严格基于实际网页 URL 判定，若指定了 targetUrl 则优先以 targetUrl 为准；
   * 杜绝按环境名称匹配，保证在百度等非 X 网站时绝不触发匹配
   */
  match (environment, targetUrl) {
    if (targetUrl) {
      return isXPlatformUrl(targetUrl)
    }
    const url = String(environment?.creationUrl || environment?.lastUrl || '').trim()
    return isXPlatformUrl(url)
  }

  /**
   * 手动切换开关校验：非 X 网页禁止启动发帖
   */
  toggleTask (environmentId, enabled) {
    if (enabled) {
      const tab = this.getTabForEnvironment(environmentId)
      if (tab && tab.view && !tab.view.webContents.isDestroyed()) {
        const currentUrl = tab.view.webContents.getURL()
        if (!isXPlatformUrl(currentUrl)) {
          throw new Error(`当前标签正在浏览非 X 网页 (${currentUrl})，请先进入 X (Twitter) 网页后再开启自动发帖。`)
        }
      }
    }
    return super.toggleTask(environmentId, enabled)
  }

  /**
   * 手动立即触发校验：非 X 网页禁止执行
   */
  async triggerNow (environmentId) {
    const tab = this.getTabForEnvironment(environmentId)
    if (!tab || !tab.view || tab.view.webContents.isDestroyed()) {
      throw new Error('未找到该环境打开的标签页，请先打开环境。')
    }
    const currentUrl = tab.view.webContents.getURL()
    if (!isXPlatformUrl(currentUrl)) {
      throw new Error(`当前标签正在浏览非 X 网页 (${currentUrl})，请先进入 X (Twitter) 网页后再触发发帖。`)
    }
    return super.triggerNow(environmentId)
  }

  /**
   * 核心发帖业务循环
   */
  async runCycle (task) {
    if (task.state === 'generating' || task.state === 'posting') return
    const tab = this.getTabForEnvironment(task.environmentId)
    if (!tab || !tab.view || tab.view.webContents.isDestroyed()) {
      this.addLog(task, 'error', '环境标签页未找到或已关闭，跳过本轮执行。')
      this.scheduleNextRun(task, task.intervalMs)
      return
    }

    const contents = tab.view.webContents
    const currentUrl = contents.getURL()

    // 核心安全防线：若用户当前正浏览百度等其他网站，绝不强制跳转或干扰正常浏览
    if (!isXPlatformUrl(currentUrl)) {
      this.addLog(task, 'warn', `当前环境页面不是 X (Twitter) 网站 (${currentUrl})，为避免干扰用户浏览，已跳过本次自动发帖。`)
      this.scheduleNextRun(task, task.intervalMs)
      return
    }

    task.lastRunAt = Date.now()

    try {
      // ----------------------------------------------------
      // 阶段 1：使用 X 内置 Grok AI 创作推文
      // ----------------------------------------------------
      task.state = 'generating'
      task.statusText = '正在通过 Grok AI 创作推文内容...'
      this.addLog(task, 'info', '【阶段1】正在打开 X 内置 Grok 页面...')

      const generatedText = await this.generateWithGrok(contents, task)
      if (!generatedText) {
        throw new Error('Grok 未能成功生成推文内容。')
      }

      task.lastGeneratedText = generatedText
      this.addLog(task, 'info', `【阶段1完成】Grok 回复提取成功：\n"${generatedText}"`)

      // 拟人化间隔停顿，给页面与网络充足缓冲
      await sleep(2500)

      // ----------------------------------------------------
      // 阶段 2：发布推文至 X (Twitter)
      // ----------------------------------------------------
      task.state = 'posting'
      task.statusText = '正在前往发帖页面发布推文...'
      this.addLog(task, 'info', '【阶段2】正在前往发帖框并填入推文内容...')

      await this.publishTweet(contents, generatedText, task)

      task.state = 'success'
      task.statusText = '推文已成功发布！'
      task.runCount += 1
      this.addLog(task, 'info', `【发帖成功】已成功发布到 X 平台！（累计发帖 ${task.runCount} 次）`)

    } catch (err) {
      task.state = 'error'
      task.statusText = `发帖异常: ${err.message}`
      this.addLog(task, 'error', `执行异常: ${err.message}`)
    } finally {
      // 计划下一次调度
      if (task.enabled) {
        task.statusText = `等待下次调度（${Math.round(task.intervalMs / 60000)}分钟后）`
        this.scheduleNextRun(task, task.intervalMs)
      } else {
        task.state = 'idle'
        task.statusText = '任务已就绪（已暂停）'
        this.notifyStatus(task)
      }
    }
  }

  /**
   * 使用 Grok 生成推文
   */
  async generateWithGrok (contents, task) {
    const currentUrl = contents.getURL()
    if (!currentUrl.includes('/i/grok')) {
      await contents.loadURL('https://x.com/i/grok')
      await sleep(3500)
    }

    // 1. 登录态校验
    const loginStatus = await contents.executeJavaScript(`(() => {
      const hasLoginBtn = Boolean(document.querySelector('a[href="/login"], [data-testid="loginButton"]'));
      const hasAccount = Boolean(document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"], [data-testid="AppTabBar_Profile_Link"], a[href="/home"]'));
      return { isLoggedOut: hasLoginBtn && !hasAccount };
    })()`)

    if (loginStatus.isLoggedOut) {
      throw new Error('检测到尚未登录 X 账号，请在当前环境页面中登录 X 账号后再试。')
    }

    // 2. 定位 Grok 输入框
    let foundInput = false
    for (let i = 0; i < 20; i++) {
      foundInput = await contents.executeJavaScript(`((selector) => {
        return Boolean(document.querySelector(selector));
      })(${JSON.stringify(SELECTORS.GROK_INPUT)})`)
      if (foundInput) break
      await sleep(1000)
    }

    if (!foundInput) {
      throw new Error('未能定位到 Grok 输入框，可能是页面正在加载中。')
    }

    this.addLog(task, 'info', '已定位到 Grok 输入框，正在记录历史消息快照...')

    // 3. 记录发送前的基准消息数，彻底避免误读历史消息
    const baseline = await contents.executeJavaScript(`((blockSel, stopSel) => {
      const blocks = Array.from(document.querySelectorAll(blockSel));
      const isGenerating = Boolean(document.querySelector(stopSel));
      return {
        initialBlocksCount: blocks.length,
        isGenerating
      };
    })(${JSON.stringify(SELECTORS.GROK_MESSAGE_BLOCK)}, ${JSON.stringify(SELECTORS.GROK_STOP_BUTTON)})`)

    this.addLog(task, 'info', `当前会话已有消息数: ${baseline.initialBlocksCount}，正在输入提示词...`)

    // 4. 使用 Selection + Range 精准向 contenteditable 填入文本
    const insertRes = await contents.executeJavaScript(`((inputSel, promptText) => {
      const input = document.querySelector(inputSel);
      if (!input) return { ok: false, error: '输入框未找到' };

      input.focus();
      if (input.tagName.toLowerCase() === 'textarea') {
        const proto = window.HTMLTextAreaElement.prototype;
        const setVal = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setVal) setVal.call(input, promptText);
        else input.value = promptText;
      } else {
        const sel = window.getSelection();
        sel.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false);
        sel.addRange(range);

        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, promptText);
      }

      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: promptText }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      return { ok: true, currentLength: (input.innerText || input.value || '').trim().length };
    })(${JSON.stringify(SELECTORS.GROK_INPUT)}, ${JSON.stringify(task.prompt)})`)

    if (!insertRes.ok || insertRes.currentLength === 0) {
      throw new Error('向 Grok 输入框注入提示词失败，请检查输入焦点。')
    }

    // 5. 等待 800ms 让 React 状态生效并激活发送按钮
    await sleep(800)

    const sendRes = await contents.executeJavaScript(`((sendSel, inputSel) => {
      const sendBtn = document.querySelector(sendSel);
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
        return { ok: true, method: 'button' };
      }

      const input = document.querySelector(inputSel);
      if (input) {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        return { ok: true, method: 'enter' };
      }
      return { ok: false, error: '未能触发发送' };
    })(${JSON.stringify(SELECTORS.GROK_SEND_BUTTON)}, ${JSON.stringify(SELECTORS.GROK_INPUT)})`)

    if (!sendRes.ok) {
      throw new Error('向 Grok 发送 Prompt 失败。')
    }

    this.addLog(task, 'info', `Prompt 已发送 (${sendRes.method})，等待 Grok 思考与输出...`)

    // 6. 等待并提取 Grok 生成的新回复（严格等待新消息块生成完毕）
    let generatedContent = ''
    let prevText = ''
    let stableCount = 0

    // 最多轮询 60 秒（覆盖思维链 Thought 耗时）
    for (let i = 0; i < 40; i++) {
      await sleep(1500)

      const pollRes = await contents.executeJavaScript(`((blockSel, stopSel, holderSel, initialCount) => {
        const isGenerating = Boolean(document.querySelector(stopSel));
        const blocks = Array.from(document.querySelectorAll(blockSel));

        // 关键防线：如果新消息块尚未挂载，说明思考中或网络请求中，坚决不取旧消息
        if (blocks.length <= initialCount) {
          return {
            hasNewMessage: false,
            isGenerating,
            text: '',
            blocksCount: blocks.length
          };
        }

        // 取最新生成的这条回复
        const latestBlock = blocks[blocks.length - 1];

        // 提取正文：优先提取正文容器，排除思维链 Thought 按钮
        const contentEl = latestBlock.querySelector(holderSel);
        let text = '';
        if (contentEl) {
          text = contentEl.innerText.trim();
        } else {
          // 深度过滤：克隆节点并移除所有思考按钮与 SVG
          const clone = latestBlock.cloneNode(true);
          const buttons = clone.querySelectorAll('button, svg');
          buttons.forEach(b => b.remove());
          text = clone.innerText.trim();
        }

        return {
          hasNewMessage: true,
          isGenerating,
          text,
          blocksCount: blocks.length
        };
      })(${JSON.stringify(SELECTORS.GROK_MESSAGE_BLOCK)}, ${JSON.stringify(SELECTORS.GROK_STOP_BUTTON)}, ${JSON.stringify(SELECTORS.GROK_CONTENT_HOLDER)}, ${baseline.initialBlocksCount})`)

      if (pollRes.hasNewMessage && pollRes.text && pollRes.text.length > 5) {
        if (pollRes.text === prevText) {
          stableCount += 1
          // 内容连续 3 次无变化且停止按钮已消失，确认生成完成
          if (stableCount >= 3 && !pollRes.isGenerating) {
            generatedContent = pollRes.text
            break
          }
        } else {
          prevText = pollRes.text
          stableCount = 0
        }
      }
    }

    if (!generatedContent && prevText) {
      generatedContent = prevText
    }

    if (!generatedContent) {
      throw new Error('未能从 Grok 提取到有效回复正文，可能生成超时。')
    }

    return cleanGeneratedText(generatedContent)
  }

  /**
   * 发布推文到 X 平台
   */
  async publishTweet (contents, tweetText, task) {
    // 导航到主页
    await contents.loadURL('https://x.com/home')
    await sleep(3500)

    // 检查发帖输入框（支持直接存在或通过点击发帖按钮呼出）
    let foundBox = false
    for (let i = 0; i < 15; i++) {
      foundBox = await contents.executeJavaScript(`((tweetAreaSel, navBtnSel) => {
        let box = document.querySelector(tweetAreaSel);
        if (box) return true;

        // 若未直接展示，派发完整鼠标点击序列激活左侧发帖大按钮
        const navBtn = document.querySelector(navBtnSel);
        if (navBtn) {
          const opts = { bubbles: true, cancelable: true, view: window };
          navBtn.dispatchEvent(new MouseEvent('mousedown', opts));
          navBtn.dispatchEvent(new MouseEvent('mouseup', opts));
          navBtn.dispatchEvent(new MouseEvent('click', opts));
        }
        return false;
      })(${JSON.stringify(SELECTORS.TWEET_TEXTAREA)}, ${JSON.stringify(SELECTORS.POST_TRIGGER_NAV)})`)

      if (foundBox) break
      await sleep(1500)
    }

    if (!foundBox) {
      foundBox = await contents.executeJavaScript(`((tweetAreaSel) => {
        return Boolean(document.querySelector(tweetAreaSel));
      })(${JSON.stringify(SELECTORS.TWEET_TEXTAREA)})`)
    }

    if (!foundBox) {
      throw new Error('未能在页面找到发帖输入框，请确认网络连接与登录状态。')
    }

    this.addLog(task, 'info', '发帖输入框已就绪，正在填入文字并点击发布...')

    // 注入推文正文并点击发布
    const publishResult = await contents.executeJavaScript(`(async (tweetAreaSel, tweetBtnSel, content) => {
      const box = document.querySelector(tweetAreaSel);
      if (!box) return { ok: false, error: '发帖输入框丢失' };

      box.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(box);
      range.collapse(false);
      sel.addRange(range);

      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, content);

      box.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: content }));
      box.dispatchEvent(new Event('change', { bubbles: true }));

      // 等待发布按钮激活
      await new Promise(r => setTimeout(r, 1500));

      const tweetBtn = document.querySelector(tweetBtnSel);
      if (!tweetBtn) return { ok: false, error: '未找到发帖发布按钮' };
      if (tweetBtn.disabled) return { ok: false, error: '发帖按钮处于禁用状态' };

      tweetBtn.click();
      return { ok: true };
    })(${JSON.stringify(SELECTORS.TWEET_TEXTAREA)}, ${JSON.stringify(SELECTORS.TWEET_BUTTON)}, ${JSON.stringify(tweetText)})`)

    if (!publishResult.ok) {
      throw new Error(publishResult.error || '点击发帖按钮失败')
    }

    // 等待发布完成
    await sleep(3000)
    task.lastPostUrl = 'https://x.com/home'
  }
}

module.exports = {
  XPlatformAutomation,
  DEFAULT_PROMPT,
  DEFAULT_INTERVAL_MS
}
