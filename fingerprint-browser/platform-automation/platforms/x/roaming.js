'use strict'

const { humanoidClick, humanoidImeType, humanoidPressKey, humanoidScroll } = require('../../../humanoid-actions')
const { SELECTORS, isXPlatformUrl } = require('./selectors')

function canRoam (task, signal, reserveMs = 0) {
  return task.enabled && task.roamingEnabled && !signal.aborted &&
    Number.isFinite(task.nextRunAt) && Date.now() + reserveMs < task.nextRunAt
}

function waitForRoaming (task, signal, milliseconds) {
  if (!canRoam(task, signal)) return Promise.resolve(false)
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve(canRoam(task, signal))
    }
    const timer = setTimeout(finish, Math.max(0, Math.min(milliseconds, task.nextRunAt - Date.now())))
    signal.addEventListener('abort', finish, { once: true })
  })
}

function inspectTimeline (excludedUrls) {
  const excluded = new Set(excludedUrls)
  const ownPath = document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href')?.toLowerCase()
  const items = []
  for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
    if (!ownPath || article.closest('[data-testid="placementTracking"]') || article.querySelector('[data-testid="promotedIndicator"]')) continue
    const link = Array.from(article.querySelectorAll('a[href*="/status/"]')).find(anchor => anchor.querySelector('time'))
    const href = link?.getAttribute('href')
    if (!href) continue
    const parts = new URL(href, location.origin).pathname.split('/')
    const author = parts[1]
    const url = new URL('/' + author + '/status/' + parts[3], location.origin).href
    if (!/^\d+$/.test(parts[3] || '') || excluded.has(url) || ('/' + author).toLowerCase() === ownPath) continue
    const text = (article.querySelector('[data-testid="tweetText"]')?.innerText || '').replace(/\s+/g, ' ').trim()
    const button = article.querySelector('[data-testid="reply"]')
    const rect = button?.getBoundingClientRect()
    if (text.length < 6 || !rect || rect.width <= 0 || rect.height <= 0 || rect.top < 0 || rect.bottom > innerHeight || rect.left < 0 || rect.right > innerWidth) continue
    items.push({ url, author, excerpt: text.slice(0, 80), point: { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) } })
  }
  return { items, hasDialog: Boolean(document.querySelector('[role="dialog"]')), path: location.pathname,
    viewport: { x: Math.round(innerWidth / 2), y: Math.round(innerHeight / 2) } }
}

function resolveReplyTarget (target) {
  if (document.querySelector('[role="dialog"]')) return { ready: false }
  const expectedPath = new URL(target.url, location.origin).pathname
  for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
    const link = Array.from(article.querySelectorAll('a[href*="/status/"]')).find(anchor => anchor.querySelector('time'))
    if (!link || new URL(link.getAttribute('href'), location.origin).pathname !== expectedPath) continue
    const button = article.querySelector('[data-testid="reply"]')
    const rect = button?.getBoundingClientRect()
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' || !rect || rect.width <= 0 || rect.height <= 0) return { ready: false }
    const point = { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
    if (point.x < 0 || point.x >= innerWidth || point.y < 0 || point.y >= innerHeight) return { ready: false }
    const hit = document.elementFromPoint(point.x, point.y)
    return { ready: Boolean(hit && button.contains(hit)), point }
  }
  return { ready: false }
}

function targetUnavailable (message) {
  const error = new Error(message)
  error.code = 'X_ROAM_TARGET_UNAVAILABLE'
  return error
}

function inspectReply (target, sentence) {
  const dialog = document.querySelector('[role="dialog"]')
  const input = dialog?.querySelector('[data-testid="tweetTextarea_0"]')
  const button = dialog?.querySelector('[data-testid="tweetButton"]')
  const original = dialog?.querySelector('[data-testid="tweet"]')
  const originalText = (original?.querySelector('[data-testid="tweetText"]')?.innerText || '').replace(/\s+/g, ' ').trim()
  const originalAvatar = original?.querySelector('[data-testid^="UserAvatar-Container-"]')
  const authorMatches = target && originalAvatar?.getAttribute('data-testid').toLowerCase() === 'useravatar-container-' + target.author.toLowerCase()
  const canonical = value => String(value || '').normalize('NFC').replace(/[\s\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
  const contentMatches = Boolean(target?.excerpt && canonical(originalText).includes(canonical(target.excerpt)))
  const text = (input?.innerText || input?.value || '').trim()
  const alerts = Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"]'))
  return {
    exists: Boolean(input), text, dialogPresent: Boolean(dialog),
    closeAvailable: Boolean(dialog?.querySelector('[data-testid="app-bar-close"]')),
    belongsToTarget: Boolean(authorMatches && contentMatches),
    authorMatches: Boolean(authorMatches), contentMatches,
    actualAuthor: originalAvatar?.getAttribute('data-testid') || '',
    ready: Boolean(input && text === sentence && button && !button.disabled),
    feedback: alerts.map(node => node.innerText).join(' '),
    feedbackUrl: alerts.flatMap(node => Array.from(node.querySelectorAll('a[href*="/status/"]'))).map(node => node.href)[0] || ''
  }
}

function readReply (contents, target = null, sentence = '') {
  return contents.executeJavaScript('(' + inspectReply.toString() + ')(' + JSON.stringify(target) + ', ' + JSON.stringify(sentence) + ')')
}

async function assertNoReplyDraft (contents) {
  const state = await readReply(contents)
  if (state.exists && state.text) throw new Error('评论框中仍有未发送内容，请先处理草稿后再发帖。')
}

async function closeOwnedReply (automation, contents, sentence) {
  if (contents.isDestroyed()) return
  automation.activateTab(contents)
  const closeDialog = async () => {
    await humanoidClick(contents, SELECTORS.REPLY_CLOSE, { recheckTarget: true })
    for (let attempt = 0; attempt < 20; attempt++) {
      if (!(await readReply(contents)).dialogPresent) return
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('评论窗口尚未关闭，已停止漫游，请先处理当前窗口。')
  }
  let state = await readReply(contents)
  if (!state.exists) {
    if (state.dialogPresent && state.closeAvailable) await closeDialog()
    else if (state.dialogPresent) throw new Error('评论窗口尚未完成加载，已停止漫游，请先关闭该窗口。')
    return
  }
  if (state.text && state.text !== sentence.trim()) throw new Error('评论草稿已被修改，已保留内容，请先处理草稿后再继续。')
  if (state.text) {
    await humanoidClick(contents, SELECTORS.REPLY_TEXTAREA)
    await humanoidPressKey(contents, 'A', { modifiers: [process.platform === 'darwin' ? 'meta' : 'control'] })
    await humanoidPressKey(contents, 'Backspace')
    for (let attempt = 0; attempt < 20; attempt++) {
      state = await readReply(contents)
      if (!state.text) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (state.text) throw new Error('评论草稿未能清空，已停止漫游，请先处理草稿。')
  }
  await closeDialog()
}

async function commentOnPost (automation, task, contents, target, sentence, signal) {
  let opened = false
  let submitted = false
  let draftText = ''
  try {
    if (!canRoam(task, signal, Math.max(15000, [...sentence].length * 600 + 5000))) return false
    automation.activateTab(contents)
    let state
    let matched = false
    const resolvePoint = async () => {
      const result = await contents.executeJavaScript('(' + resolveReplyTarget.toString() + ')(' + JSON.stringify(target) + ')')
      return result.ready ? result.point : null
    }
    automation.addLog(task, 'info', `漫游选中帖子：${target.url}`)
    for (let clickAttempt = 0; clickAttempt < 3 && canRoam(task, signal); clickAttempt++) {
      state = await readReply(contents, target, sentence)
      if (state.dialogPresent && !opened) throw new Error('页面已有评论框，请先处理当前草稿再继续漫游。')
      if (!state.dialogPresent) {
        opened = true
        try {
          await humanoidClick(contents, target.point, { recheckTarget: true, resolvePoint })
        } catch (error) {
          console.warn('[X 漫游评论入口点击未完成]', target.url, error)
        }
      }
      for (let poll = 0; poll < 30 && canRoam(task, signal); poll++) {
        state = await readReply(contents, target, sentence)
        // 输入框和原帖摘要会分批挂载，必须等待两者同时就绪。
        if (state.exists && state.belongsToTarget) { matched = true; break }
        if (state.exists && state.text) throw new Error('评论框已有未发送内容，已保留草稿并停止漫游。')
        if (!state.dialogPresent && poll >= 3) break
        if (!await waitForRoaming(task, signal, 250)) return false
      }
      if (matched || state?.dialogPresent) break
    }
    if (!canRoam(task, signal)) return false
    if (!matched) {
      console.warn('[X 漫游评论目标未就绪]', target.url, state)
      throw targetUnavailable('暂时无法确认该帖评论框的目标信息。')
    }
    if (state.text) throw new Error('评论框已有未发送内容，已保留草稿并停止漫游。')
    if (!canRoam(task, signal)) return false
    await humanoidClick(contents, SELECTORS.REPLY_TEXTAREA)
    for (const character of sentence) {
      if (!canRoam(task, signal)) return false
      await humanoidImeType(contents, character, { selector: SELECTORS.REPLY_TEXTAREA, typoRate: 0, nativeInput: true })
      draftText += character
    }
    for (let attempt = 0; attempt < 20 && canRoam(task, signal); attempt++) {
      state = await readReply(contents, target, sentence)
      if (state.ready) break
      if (!await waitForRoaming(task, signal, 250)) return false
    }
    if (!canRoam(task, signal, 1500)) return false
    if (!state?.ready || !state.belongsToTarget) throw new Error('评论内容或目标帖子未通过核验，本次未评论。')
    const previousFeedback = state.feedback
    // 发布结果不确定时也不重复点击同一帖子，避免重复评论。
    task.commentedPostUrls.add(target.url)
    submitted = true
    automation.activateTab(contents)
    await humanoidClick(contents, SELECTORS.REPLY_BUTTON, { recheckTarget: true })
    for (let attempt = 0; attempt < 15; attempt++) {
      state = await readReply(contents, target, sentence)
      if (!state.exists && state.feedback !== previousFeedback && /Your post was sent|Your post was published|Your reply was sent|已发送|已发布/i.test(state.feedback)) {
        task.commentCount += 1
        task.lastCommentAt = Date.now()
        task.lastCommentUrl = state.feedbackUrl || target.url
        task.lastCommentSentence = sentence
        automation.addLog(task, 'info', `漫游评论成功：${target.url}（累计 ${task.commentCount} 条）`)
        return true
      }
      if (!canRoam(task, signal)) break
      if (!await waitForRoaming(task, signal, 500)) break
    }
    throw new Error('已点击评论，但页面未确认发送成功；已停止漫游，请先检查，避免重复评论。')
  } finally {
    if (opened && !submitted) await closeOwnedReply(automation, contents, draftText)
  }
}

async function runRoamingLoop (automation, task, signal) {
  if (!await waitForRoaming(task, signal, 12000 + Math.random() * 8000)) return
  while (canRoam(task, signal, 15000)) {
    const contents = automation.getTabForEnvironment(task.environmentId)?.view?.webContents
    if (!contents || contents.isDestroyed() || !isXPlatformUrl(contents.getURL())) return
    automation.activateTab(contents)
    const readTimeline = () => contents.executeJavaScript('(' + inspectTimeline.toString() + ')(' +
      JSON.stringify([...task.commentedPostUrls, ...(task.skippedPostUrls || [])]) + ')')
    let timeline = await readTimeline()
    if (timeline.hasDialog || timeline.path !== '/home') return
    task.state = 'roaming'
    task.statusText = '正在漫游浏览帖子，等待下次发帖...'
    automation.notifyStatus(task)
    await humanoidScroll(contents, { ...timeline.viewport, deltaY: 400 + Math.round(Math.random() * 550) })
    if (!await waitForRoaming(task, signal, 1000 + Math.random() * 1000)) return
    timeline = await readTimeline()
    if (timeline.hasDialog || timeline.path !== '/home') return
    if (!timeline.items.length) {
      if (!await waitForRoaming(task, signal, 1500 + Math.random() * 1500)) return
      continue
    }
    const sentences = task.commentSentences.filter(sentence => sentence !== task.lastCommentSentence)
    const choices = sentences.length ? sentences : task.commentSentences
    if (!choices.length) return
    if (timeline.items.length) {
      const target = timeline.items[Math.floor(Math.random() * timeline.items.length)]
      const sentence = choices[Math.floor(Math.random() * choices.length)]
      task.state = 'commenting'
      task.statusText = '正在从配置句子中随机选择内容评论帖子...'
      automation.notifyStatus(task)
      try {
        await commentOnPost(automation, task, contents, target, sentence, signal)
      } catch (error) {
        if (error?.code !== 'X_ROAM_TARGET_UNAVAILABLE') throw error
        task.skippedPostUrls ||= new Set()
        task.skippedPostUrls.add(target.url)
        if (task.skippedPostUrls.size > 200) task.skippedPostUrls.delete(task.skippedPostUrls.values().next().value)
        automation.addLog(task, 'warn', `帖子暂不可评论，已跳过：${target.url}（${error.message}）`)
        task.state = 'roaming'
        task.statusText = '已跳过暂不可评论的帖子，继续漫游...'
        automation.notifyStatus(task)
        if (!await waitForRoaming(task, signal, 1500)) return
        continue
      }
    }
    task.state = 'roaming'
    task.statusText = '漫游中，等待下一次评论或定时发帖...'
    automation.notifyStatus(task)
    if (!await waitForRoaming(task, signal, task.commentIntervalMs * (0.8 + Math.random() * 0.4))) return
  }
}

function cancelXRoaming (task) {
  task.roamingController?.abort()
}

async function stopXRoaming (task) {
  cancelXRoaming(task)
  if (task.roamingPromise) await task.roamingPromise
}

function startXRoaming (automation, task) {
  if (!task.enabled || !task.roamingEnabled || !task.commentSentences.length || task.roamingPromise) return
  const controller = new AbortController()
  task.roamingController = controller
  task.state = 'roaming'
  task.statusText = '发帖成功，准备漫游并随机评论...'
  automation.addLog(task, 'info', '已进入发帖后的漫游评论阶段，到达下次发帖时间将优先发帖。')
  task.roamingPromise = runRoamingLoop(automation, task, controller.signal).catch(error => {
    if (!controller.signal.aborted || /草稿/.test(error?.message || '')) {
      console.error('[X 漫游评论异常]', error)
      const message = /[\u3400-\u9fff]/.test(error?.message || '') ? error.message : '漫游评论失败，已停止漫游并等待下次定时发帖。'
      task.state = 'error'
      task.statusText = message
      automation.addLog(task, 'error', message)
    }
  }).finally(() => {
    if (task.roamingController !== controller) return
    task.roamingController = null
    task.roamingPromise = null
    if (task.state === 'roaming' || task.state === 'commenting') {
      task.state = task.enabled ? 'waiting' : 'stopped'
      task.statusText = task.enabled ? '漫游已结束，等待下次定时发帖。' : '自动发帖与漫游评论已停止。'
      automation.notifyStatus(task)
    }
  })
}

module.exports = { startXRoaming, stopXRoaming, cancelXRoaming, assertNoReplyDraft, canRoam, waitForRoaming, inspectTimeline, inspectReply, resolveReplyTarget, commentOnPost }
