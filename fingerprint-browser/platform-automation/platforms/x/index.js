'use strict'

/**
 * X (Twitter) 平台自动化引擎
 * 负责通过 X 官方内置 Grok AI 自动创作推文，并自动发布到 X 平台
 */

const { BasePlatformAutomation } = require('../../base-automation')
const { SELECTORS, cleanGeneratedText, isXPlatformUrl } = require('./selectors')
const { humanoidClick, humanoidImeType } = require('../../../humanoid-actions')

const DEFAULT_PROMPT = '请写一条关于最新科技、AI或数字化生活的精简推文（X post）。语言幽默有趣或富有洞察力，字数在120字以内。直接输出推文正文，严禁输出任何引号、前缀说明或解释。'
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000 // 默认 10 分钟

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeText (text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function getXLoginStatus () {
  const hasAccount = Boolean(document.querySelector(
    '[data-testid="SideNav_AccountSwitcher_Button"], [data-testid="AppTabBar_Profile_Link"]'
  ))
  const hasLoginAction = Boolean(document.querySelector(
    'a[href="/login"], a[href^="/i/flow/login"], [data-testid="loginButton"]'
  ))
  const isLoginRoute = /^\/(?:login|i\/flow\/login)(?:\/|$)/.test(window.location.pathname)
  return { isLoggedOut: isLoginRoute || (!hasAccount && hasLoginAction) }
}

function getXPostBaseline () {
  return Array.from(document.querySelectorAll('article'))
    .map(article => article.querySelector('a[href*="/status/"]')?.getAttribute('href') || '')
    .filter(Boolean)
}

function verifyXPost (expectedText, previousLinks) {
  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim()
  const previous = new Set(previousLinks || [])
  const expected = normalize(expectedText)

  for (const textNode of document.querySelectorAll('[data-testid="tweetText"]')) {
    if (normalize(textNode.innerText) !== expected) continue
    const article = textNode.closest('article')
    const statusHref = Array.from(article?.querySelectorAll('a[href*="/status/"]') || [])
      .map(link => link.getAttribute('href'))
      .find(href => href && !previous.has(href))
    if (statusHref) {
      return { verified: true, url: new URL(statusHref, window.location.origin).href }
    }
  }

  const feedback = Array.from(document.querySelectorAll('[role="alert"], [aria-live="polite"]'))
    .map(element => element.innerText || '')
    .join(' ')
  if (/Your post was sent|Your post was published|已发送|已发布/i.test(feedback)) {
    return { verified: true, url: '' }
  }

  return { verified: false, url: '' }
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

      task.currentStage = '打开 Grok 页面'
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
      task.currentStage = '发布推文'
      task.statusText = '正在前往发帖页面发布推文...'
      this.addLog(task, 'info', '【阶段2】正在前往发帖框并填入推文内容...')

      await this.publishTweet(contents, generatedText, task)

      task.state = 'success'
      task.statusText = '推文已成功发布！'
      task.runCount += 1
      this.addLog(task, 'info', `【发帖成功】已成功发布到 X 平台！（累计发帖 ${task.runCount} 次）`)

    } catch (err) {
      task.state = 'error'
      console.error('[X/Grok 自动发文失败]', err)
      const errorMessage = err instanceof Error && /[\u3400-\u9fff]/.test(err.message)
        ? err.message
        : `X/Grok 自动发文在“${task.currentStage || '未知'}”阶段失败，请检查当前环境的登录状态、网络连接和页面提示后重试。`
      task.statusText = '发帖异常：' + errorMessage
      this.addLog(task, 'error', '执行异常：' + errorMessage)
    } finally {
      delete task.currentStage
      // 计划下一次调度
      if (task.enabled) {
        task.statusText = task.state === 'error'
          ? `本轮失败，将在${Math.round(task.intervalMs / 60000)}分钟后重试`
          : `等待下次调度（${Math.round(task.intervalMs / 60000)}分钟后）`
        this.scheduleNextRun(task, task.intervalMs)
      } else {
        if (task.state !== 'success' && task.state !== 'error') {
          task.state = 'idle'
          task.statusText = '任务已就绪（已暂停）'
        }
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
      task.currentStage = '导航到 Grok 页面'
      try {
        await contents.loadURL('https://x.com/i/grok')
      } catch (error) {
        console.error('[X/Grok 页面导航失败]', error)
        throw new Error('打开 X 内置 Grok 页面失败，请检查网络连接后重试。')
      }
    }

    // 页面导航与 X 的前端渲染有时间差，先等待主文档结束加载再读取页面状态。
    task.currentStage = '等待 Grok 页面加载'
    const loadDeadline = Date.now() + 20000
    while (contents.isLoading() && Date.now() < loadDeadline) await sleep(250)
    if (contents.isLoading()) {
      throw new Error('等待 X 的 Grok 页面加载超时，请刷新当前标签后重试。')
    }

    // 1. 登录态校验：等待账号状态和 Grok 输入框同时就绪，避免页面切换期间读取 DOM 导致整轮任务异常。
    task.currentStage = '检查登录状态和 Grok 输入框'
    this.addLog(task, 'info', 'X 页面导航已完成，正在检查登录状态并等待 Grok 输入框就绪...')
    let pageState = null
    let pageReadError = null
    for (let i = 0; i < 40; i++) {
      if (contents.isLoading()) {
        await sleep(500)
        continue
      }

      try {
        pageState = await contents.executeJavaScript(`((inputSel) => {
          const hasLoginAction = Boolean(document.querySelector('a[href="/login"], a[href^="/i/flow/login"], [data-testid="loginButton"]'));
          const hasAccount = Boolean(document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"], [data-testid="AppTabBar_Profile_Link"]'));
          const pathname = window.location.pathname;
          const isLoginRoute = pathname === '/login' || pathname.startsWith('/login/') ||
            pathname === '/i/flow/login' || pathname.startsWith('/i/flow/login/');
          const input = document.querySelector(inputSel);
          return {
            isLoggedOut: isLoginRoute || (!hasAccount && hasLoginAction),
            inputExists: Boolean(input),
            inputText: (input?.innerText || input?.value || '').trim()
          };
        })(${JSON.stringify(SELECTORS.GROK_INPUT)})`)
        pageReadError = null
      } catch (error) {
        pageReadError = error
        await sleep(500)
        continue
      }

      if (pageState.isLoggedOut) {
        throw new Error('当前应用环境尚未登录 X。Edge 的登录状态与应用环境独立，请在此环境标签中登录后再试。')
      }
      if (pageState.inputExists) break
      await sleep(500)
    }

    if (!pageState && pageReadError) {
      console.error('[X/Grok 页面状态读取失败]', pageReadError)
      throw new Error('暂时无法读取 X 页面状态，请等待页面加载完成后重试。')
    }
    // 2. 定位 Grok 输入框，页面异步渲染完成后再继续。
    if (!pageState?.inputExists) {
      throw new Error('未能加载 Grok 输入框。请确认当前应用环境已登录 X、账号可使用 Grok，且页面已加载完成。Edge 登录状态不会同步到应用环境。')
    }

    this.addLog(task, 'info', '已定位到 Grok 输入框，正在记录历史消息快照...')

    // 3. 记录发送前的基准消息数，彻底避免误读历史消息
    task.currentStage = '读取 Grok 会话状态'
    const baseline = await contents.executeJavaScript(`((blockSel, stopSel) => {
      const blocks = Array.from(document.querySelectorAll(blockSel));
      const isGenerating = Boolean(document.querySelector(stopSel));
      return {
        initialBlocksCount: blocks.length,
        isGenerating
      };
    })(${JSON.stringify(SELECTORS.GROK_MESSAGE_BLOCK)}, ${JSON.stringify(SELECTORS.GROK_STOP_BUTTON)})`)

    if (baseline.isGenerating) {
      throw new Error('Grok 当前仍在生成回复，请等待完成后再触发自动发文。')
    }

    this.addLog(task, 'info', `当前会话已有消息数: ${baseline.initialBlocksCount}，正在输入提示词...`)

    // 4. 通过框架键鼠与 IME 接口向 X 的受控编辑区输入
    const inputState = {
      exists: pageState.inputExists,
      currentText: pageState.inputText
    }

    if (!inputState.exists) {
      throw new Error('未找到 Grok 输入框，请确认当前页面已加载完成。')
    }
    if (inputState.currentText) {
      throw new Error('Grok 输入框已有未发送内容，为避免覆盖，本次已停止。')
    }

    try {
      task.currentStage = '通过框架输入 Grok 提示词'
      await humanoidClick(contents, SELECTORS.GROK_INPUT)
      await humanoidImeType(contents, task.prompt, { selector: SELECTORS.GROK_INPUT, typoRate: 0 })
    } catch {
      throw new Error('通过框架键鼠接口输入 Grok 提示词失败，请确认 X 页面处于可操作状态。')
    }

    // 5. 等待 React 状态更新，确认文本与发送按钮都已就绪
    task.currentStage = '确认 Grok 提示词输入状态'
    let insertRes = null
    for (let i = 0; i < 12; i++) {
      insertRes = await contents.executeJavaScript(`((inputSel, sendSel) => {
        const input = document.querySelector(inputSel);
        const sendButton = input?.closest('form')?.querySelector(sendSel) ||
          document.querySelector('button[aria-label="Send"], button[aria-label="发送"], button[aria-label*="Send" i]');
        return {
          currentText: (input?.innerText || input?.value || '').trim(),
          sendButtonEnabled: Boolean(sendButton && !sendButton.disabled)
        };
      })(${JSON.stringify(SELECTORS.GROK_INPUT)}, ${JSON.stringify(SELECTORS.GROK_SEND_BUTTON)})`)

      if (normalizeText(insertRes.currentText) === normalizeText(task.prompt) && insertRes.sendButtonEnabled) break
      await sleep(250)
    }

    if (normalizeText(insertRes?.currentText) !== normalizeText(task.prompt)) {
      throw new Error('Grok 输入框未接收完整提示词，本次未发送。')
    }

    let sendRes = null
    for (let i = 0; i < 20; i++) {
      sendRes = await contents.executeJavaScript(`((sendSel, inputSel) => {
        const input = document.querySelector(inputSel);
        const sendButton = input?.closest('form')?.querySelector(sendSel) ||
          document.querySelector('button[aria-label="Send"], button[aria-label="发送"], button[aria-label*="Send" i]');
        if (!sendButton || sendButton.disabled) return { ok: false };
        return { ok: true, method: 'button' };
      })(${JSON.stringify(SELECTORS.GROK_SEND_BUTTON)}, ${JSON.stringify(SELECTORS.GROK_INPUT)})`)

      if (sendRes.ok) break
      await sleep(250)
    }

    if (!sendRes?.ok) {
      throw new Error('Grok 发送按钮未启用，提示词未提交。请检查当前账号的 Grok 使用状态后重试。')
    }

    try {
      task.currentStage = '通过框架提交 Grok 提示词'
      await humanoidClick(contents, SELECTORS.GROK_SEND_BUTTON)
    } catch {
      throw new Error('无法通过框架键鼠接口点击 Grok 发送按钮，请确认 X 页面处于可操作状态。')
    }

    let submitted = false
    for (let i = 0; i < 20; i++) {
      const submitState = await contents.executeJavaScript(`((blockSel, stopSel, inputSel) => ({
        isGenerating: Boolean(document.querySelector(stopSel)),
        hasNewReply: document.querySelectorAll(blockSel).length > ${baseline.initialBlocksCount},
        inputEmpty: !((document.querySelector(inputSel)?.innerText || document.querySelector(inputSel)?.value || '').trim())
      }))(${JSON.stringify(SELECTORS.GROK_MESSAGE_BLOCK)}, ${JSON.stringify(SELECTORS.GROK_STOP_BUTTON)}, ${JSON.stringify(SELECTORS.GROK_INPUT)})`)

      if (submitState.isGenerating || submitState.hasNewReply || submitState.inputEmpty) {
        submitted = true
        break
      }
      await sleep(500)
    }

    if (!submitted) {
      throw new Error('点击 Grok 发送后未确认提示词已提交，请检查页面后重试。')
    }

    this.addLog(task, 'info', 'Grok 已接收提示词，正在生成回复...')

    // 6. 等待并提取 Grok 生成的新回复（严格等待新消息块生成完毕）
    task.currentStage = '等待并提取 Grok 回复'
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
          hasNewMessage: Boolean(text),
          isGenerating,
          text,
          blocksCount: blocks.length
        };
      })(${JSON.stringify(SELECTORS.GROK_MESSAGE_BLOCK)}, ${JSON.stringify(SELECTORS.GROK_STOP_BUTTON)}, ${JSON.stringify(SELECTORS.GROK_CONTENT_HOLDER)}, ${baseline.initialBlocksCount})`)

      if (pollRes.hasNewMessage && pollRes.text) {
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

    const loginStatus = await contents.executeJavaScript('(' + getXLoginStatus.toString() + ')()')
    if (loginStatus.isLoggedOut) {
      throw new Error('当前应用环境尚未登录 X。Edge 的登录状态与应用环境独立，请在此环境标签中登录后再试。')
    }
    const baselinePostLinks = await contents.executeJavaScript('(' + getXPostBaseline.toString() + ')()')

    // 检查发帖输入框（支持直接存在或通过点击发帖按钮呼出）
    let foundBox = await contents.executeJavaScript(
      'Boolean(document.querySelector(' + JSON.stringify(SELECTORS.TWEET_TEXTAREA) + '))'
    )
    if (!foundBox) {
      const hasPostTrigger = await contents.executeJavaScript(
        'Boolean(document.querySelector(' + JSON.stringify(SELECTORS.POST_TRIGGER_NAV) + '))'
      )
      if (hasPostTrigger) {
        try {
          await humanoidClick(contents, SELECTORS.POST_TRIGGER_NAV)
        } catch {
          throw new Error('无法通过框架键鼠接口打开 X 发帖框。')
        }
      }

      for (let i = 0; i < 15; i++) {
        foundBox = await contents.executeJavaScript(
          'Boolean(document.querySelector(' + JSON.stringify(SELECTORS.TWEET_TEXTAREA) + '))'
        )
        if (foundBox) break
        await sleep(500)
      }
    }

    if (!foundBox) {
      throw new Error('未能在页面找到发帖输入框，请确认网络连接与登录状态。')
    }

    this.addLog(task, 'info', '发帖输入框已就绪，正在填入文字并点击发布...')

    // 通过框架键鼠与 IME 接口填入受控编辑器，并确认 X 已接受正文
    const postState = await contents.executeJavaScript(`((tweetAreaSel) => {
      const box = document.querySelector(tweetAreaSel);
      return {
        exists: Boolean(box),
        currentText: (box?.innerText || box?.value || '').trim()
      };
    })(${JSON.stringify(SELECTORS.TWEET_TEXTAREA)})`)

    if (!postState.exists) {
      throw new Error('X 发帖输入框已关闭，本次未发布。')
    }
    if (postState.currentText) {
      throw new Error('发帖输入框已有未发送内容，为避免覆盖，本次已停止。')
    }

    try {
      await humanoidClick(contents, SELECTORS.TWEET_TEXTAREA)
      await humanoidImeType(contents, tweetText, { selector: SELECTORS.TWEET_TEXTAREA, typoRate: 0 })
    } catch {
      throw new Error('通过框架键鼠接口输入推文正文失败，本次未发布。')
    }

    let publishReady = null
    for (let i = 0; i < 20; i++) {
      publishReady = await contents.executeJavaScript(`((tweetAreaSel, tweetBtnSel) => {
        const box = document.querySelector(tweetAreaSel);
        const tweetButton = document.querySelector(tweetBtnSel);
        return {
          currentText: (box?.innerText || box?.value || '').trim(),
          buttonEnabled: Boolean(tweetButton && !tweetButton.disabled)
        };
      })(${JSON.stringify(SELECTORS.TWEET_TEXTAREA)}, ${JSON.stringify(SELECTORS.TWEET_BUTTON)})`)

      if (normalizeText(publishReady.currentText) === normalizeText(tweetText) && publishReady.buttonEnabled) break
      await sleep(250)
    }

    if (normalizeText(publishReady?.currentText) !== normalizeText(tweetText)) {
      throw new Error('推文正文未完整进入 X 发帖框，本次未发布。')
    }
    if (!publishReady.buttonEnabled) {
      throw new Error('X 发帖按钮未启用，请检查正文或账号状态。')
    }

    try {
      await humanoidClick(contents, SELECTORS.TWEET_BUTTON)
    } catch {
      throw new Error('无法通过框架键鼠接口点击 X 发帖按钮，本次未发布。')
    }

    // 核验时间线或成功提示，避免仅凭点击按钮就误报发布成功
    let verification = null
    for (let i = 0; i < 20; i++) {
      await sleep(1000)
      verification = await contents.executeJavaScript(
        '(' + verifyXPost.toString() + ')(' + JSON.stringify(tweetText) + ', ' + JSON.stringify(baselinePostLinks) + ')'
      )
      if (verification.verified) break
    }

    if (!verification?.verified) {
      throw new Error('已点击发布，但页面未确认新推文出现；请先检查账号时间线，避免重复发布。')
    }

    task.lastPostUrl = verification.url || 'https://x.com/home'
  }
}

module.exports = {
  XPlatformAutomation,
  DEFAULT_PROMPT,
  DEFAULT_INTERVAL_MS
}
