(() => {
  'use strict'

  const panelEl = document.querySelector('#x-grok-panel-root')
  const DEFAULT_PROMPT = '请写一条关于最新科技、AI或数字化生活的精简推文（X post）。语言幽默有趣或富有洞察力，字数在120字以内。直接输出推文正文，严禁输出任何引号、前缀说明或解释。'
  let environmentId = null
  let currentTaskStatus = null
  const drafts = new Map()
  let draftDirty = false
  let draftRevision = 0
  let restoreFields = false
  let saving = false
  let actionPending = false
  let feedbackMessage = ''
  let feedbackError = false

  function requireApiSuccess (result, fallbackMessage) {
    if (!result || result.ok === false) {
      throw new Error(result?.error || fallbackMessage)
    }
    return result
  }

  function escapeHtml (value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character])
  }

  function formatTime (totalSeconds) {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) return '00:00'
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  function applyStatus (task) {
    currentTaskStatus = task
    renderPanelContent()
  }

  function configFromStatus (task) {
    return {
      prompt: task?.prompt || DEFAULT_PROMPT,
      intervalMs: task?.intervalMs || 600000,
      mentions: (task?.mentions || ['grok']).map(handle => '@' + handle).join(' '),
      roamingEnabled: task?.roamingEnabled === true,
      commentSentences: (task?.commentSentences || []).join('\n'),
      commentIntervalMs: task?.commentIntervalMs || 120000
    }
  }

  function readConfig () {
    return {
      prompt: panelEl.querySelector('#x-grok-prompt-input')?.value || '',
      intervalMs: Number(panelEl.querySelector('#x-grok-interval-select')?.value || 600000),
      mentions: panelEl.querySelector('#x-grok-mentions-input')?.value || '',
      roamingEnabled: panelEl.querySelector('#x-grok-roaming-enabled')?.checked === true,
      commentSentences: panelEl.querySelector('#x-grok-comment-sentences')?.value || '',
      commentIntervalMs: Number(panelEl.querySelector('#x-grok-comment-interval')?.value || 120000)
    }
  }

  function renderLogs (task) {
    return task?.logs?.length
      ? task.logs.map(log => {
        const level = ['error', 'info', 'warn'].includes(log.level) ? log.level : 'info'
        return `<div class="x-grok-log-item ${level}">[${escapeHtml(log.time)}] ${escapeHtml(log.message)}</div>`
      }).join('')
      : '<div style="color:#64748b">暂无发帖日志，点击按钮手动启动发帖。</div>'
  }

  function updatePanelContent () {
    if (!panelEl?.firstElementChild) return
    const task = currentTaskStatus
    const isRunning = Boolean(task?.enabled)
    const isBusy = task?.state === 'generating' || task?.state === 'posting'
    const config = draftDirty ? drafts.get(environmentId) : configFromStatus(task)
    // 心跳只更新状态节点，保留输入框和正在进行的中文输入法会话。
    if ((!draftDirty || restoreFields) && config) {
      for (const [selector, value] of [
        ['#x-grok-prompt-input', config.prompt],
        ['#x-grok-interval-select', String(config.intervalMs)],
        ['#x-grok-mentions-input', config.mentions],
        ['#x-grok-comment-sentences', config.commentSentences],
        ['#x-grok-comment-interval', String(config.commentIntervalMs)]
      ]) {
        const field = panelEl.querySelector(selector)
        if (field && field.value !== value) field.value = value
      }
      panelEl.querySelector('#x-grok-roaming-enabled').checked = config.roamingEnabled
      restoreFields = false
    }
    const status = panelEl.querySelector('#x-grok-status-text')
    status.textContent = task?.statusText || (environmentId ? '正在读取任务状态...' : '正在连接当前 X 标签...')
    status.style.color = task?.state === 'error' ? '#dc2626' : '#64748b'
    const countdown = panelEl.querySelector('#x-grok-time-remaining')
    countdown.textContent = isBusy ? '处理中...' : isRunning ? formatTime(task.remainingSeconds) : '--:--'
    countdown.style.color = isRunning ? '#10b981' : '#94a3b8'
    panelEl.querySelector('#x-grok-run-count').textContent = `已发帖 ${task?.runCount || 0} 条，漫游评论 ${task?.commentCount || 0} 条`
    const intervalMins = Math.round((config?.intervalMs || 600000) / 60000)
    const toggleButton = panelEl.querySelector('#x-grok-toggle-btn')
    toggleButton.textContent = isRunning ? '暂停自动发帖' : `▶ 启动定时发帖 (${intervalMins}分钟/次)`
    toggleButton.disabled = !environmentId || saving || actionPending || (!isRunning && isBusy)
    const triggerButton = panelEl.querySelector('#x-grok-trigger-now')
    triggerButton.textContent = isBusy ? '正在执行中...' : '⚡ 立即发帖一次'
    triggerButton.disabled = !environmentId || saving || actionPending || isBusy
    const saveButton = panelEl.querySelector('#x-grok-save-prompt')
    saveButton.disabled = !environmentId || saving || actionPending
    saveButton.textContent = saving ? '正在保存...' : '保存配置'
    for (const selector of ['#x-grok-prompt-input', '#x-grok-mentions-input', '#x-grok-interval-select',
      '#x-grok-roaming-enabled', '#x-grok-comment-sentences', '#x-grok-comment-interval']) {
      panelEl.querySelector(selector).disabled = saving
    }
    const feedback = panelEl.querySelector('#x-grok-config-feedback')
    feedback.textContent = feedbackMessage
    feedback.style.color = feedbackError ? '#dc2626' : '#64748b'
    const logs = panelEl.querySelector('#x-grok-logs')
    const logsHtml = renderLogs(task)
    if (logs.innerHTML !== logsHtml) logs.innerHTML = logsHtml
  }

  function showFeedback (message, isError = false) {
    feedbackMessage = message
    feedbackError = isError
    updatePanelContent()
  }

  function showFailure (error, fallbackMessage) {
    const message = typeof error?.message === 'string' && /[\u3400-\u9fff]/.test(error.message)
      ? error.message : fallbackMessage
    showFeedback(message, true)
  }

  function rememberDraft () {
    if (!environmentId) return
    draftDirty = true
    draftRevision += 1
    drafts.set(environmentId, readConfig())
    showFeedback('配置尚未保存；启动发帖前会自动保存。')
  }

  async function saveCurrentConfig () {
    if (!environmentId || saving) throw new Error('配置正在保存，请稍后重试。')
    const targetId = environmentId
    const revision = draftRevision
    const config = readConfig()
    if (!config.prompt.trim()) throw new Error('请填写 Grok 创作提示词。')
    saving = true
    showFeedback('正在保存配置...')
    try {
      const result = requireApiSuccess(
        await window.xGrokApi.updateConfig({ environmentId: targetId, ...config }),
        '保存 X 发帖配置失败。'
      )
      if (!result.status) throw new Error('未收到已保存的 X 发帖配置。')
      if (environmentId === targetId) {
        if (draftRevision === revision) {
          draftDirty = false
          drafts.delete(targetId)
        }
        applyStatus(result.status)
        showFeedback('配置已保存；运行中修改的配置将在下一轮发帖时使用。')
      }
      return result
    } finally {
      saving = false
      updatePanelContent()
    }
  }

  async function refreshStatus () {
    if (!environmentId || !window.xGrokApi) return
    const targetId = environmentId
    try {
      const result = requireApiSuccess(
        await window.xGrokApi.getStatus(targetId),
        '获取 X 发帖状态失败。'
      )
      if (targetId !== environmentId) return
      applyStatus(result.status || null)
    } catch (error) {
      if (targetId !== environmentId) return
      currentTaskStatus = {
        enabled: false,
        intervalMs: 600000,
        remainingSeconds: 600,
        state: 'error',
        statusText: '获取 X 发帖状态失败，请稍后重试。',
        runCount: 0,
        prompt: DEFAULT_PROMPT,
        logs: []
      }
      renderPanelContent()
    }
  }

  function renderPanelContent () {
    if (!panelEl) return
    if (panelEl.firstElementChild) {
      updatePanelContent()
      return
    }

    const task = currentTaskStatus || {
      enabled: false,
      intervalMs: 600000,
      remainingSeconds: 600,
      state: 'idle',
      statusText: environmentId ? '正在读取任务状态...' : '正在连接当前 X 标签...',
      runCount: 0,
      prompt: DEFAULT_PROMPT,
      logs: []
    }
    const isRunning = Boolean(task.enabled)
    const isBusy = task.state === 'generating' || task.state === 'posting'
    const isUnavailable = !environmentId || isBusy
    const intervalMins = Math.round((task.intervalMs || 600000) / 60000)
    const logsHtml = renderLogs(task)
    const actionButtons = isRunning
      ? `
        <button type="button" class="button primary" id="x-grok-trigger-now" ${isUnavailable ? 'disabled' : ''} style="font-size:11px;padding:6px 10px">⚡ 立即发帖一次</button>
        <button type="button" class="button small soft" id="x-grok-toggle-btn" style="font-size:11px;padding:6px 10px">暂停自动发帖</button>
      `
      : `
        <button type="button" class="button primary" id="x-grok-toggle-btn" style="font-size:11px;padding:6px 10px">▶ 启动定时发帖 (${intervalMins}分钟/次)</button>
        <button type="button" class="button small soft" id="x-grok-trigger-now" ${isUnavailable ? 'disabled' : ''} style="font-size:11px;padding:6px 10px">⚡ 立即发帖一次</button>
      `

    panelEl.innerHTML = `
      <div class="x-grok-panel-window">
        <div class="x-grok-panel-header">
          <h4>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            X Grok 发帖控制
          </h4>
          <button type="button" class="icon-button" id="x-grok-close-btn" style="padding:2px 6px;font-size:14px" aria-label="关闭">✕</button>
        </div>
        <div class="x-grok-panel-body">
          <div class="x-grok-stat-row">
            <div>
              <div style="font-weight:600;color:#1e293b">发帖状态与倒计时</div>
              <div id="x-grok-status-text" style="font-size:11px;color:#64748b">${escapeHtml(task.statusText || '待命状态，点击按钮启动')}</div>
            </div>
            <div id="x-grok-time-remaining" style="font-family:monospace;font-size:18px;font-weight:700;color:${isRunning ? '#10b981' : '#94a3b8'}">
              ${isBusy ? '处理中...' : (isRunning ? formatTime(task.remainingSeconds) : '--:--')}
            </div>
          </div>

          <div class="x-grok-stat-row">
            <div>
              <div style="font-weight:600;color:#1e293b">周期设置与已发布统计</div>
              <div id="x-grok-run-count" style="font-size:11px;color:#64748b">已自动发布 ${task.runCount || 0} 条推文</div>
            </div>
            <select id="x-grok-interval-select" style="padding:3px 6px;border-radius:4px;border:1px solid #cbd5e1;font-size:11px">
              <option value="300000" ${intervalMins === 5 ? 'selected' : ''}>5 分钟一次</option>
              <option value="600000" ${intervalMins === 10 ? 'selected' : ''}>10 分钟一次 (默认)</option>
              <option value="900000" ${intervalMins === 15 ? 'selected' : ''}>15 分钟一次</option>
              <option value="1800000" ${intervalMins === 30 ? 'selected' : ''}>30 分钟一次</option>
            </select>
          </div>

          <div class="x-grok-actions-row">${actionButtons}</div>

          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#334155;font-size:11px" for="x-grok-prompt-input">Grok 创作提示词</label>
            <textarea id="x-grok-prompt-input" rows="3" style="width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;font-size:11px;box-sizing:border-box;resize:vertical">${escapeHtml(task.prompt || DEFAULT_PROMPT)}</textarea>
            <label style="display:block;font-weight:600;margin:8px 0 4px;color:#334155;font-size:11px" for="x-grok-mentions-input">发帖时提及账号</label>
            <input id="x-grok-mentions-input" type="text" value="@grok" placeholder="例如：@grok @其他用户名" style="width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;font-size:11px;box-sizing:border-box">
            <div style="font-size:11px;color:#64748b;margin-top:4px">账号会追加在正文末尾。多个账号用空格或逗号分隔，留空则不提及。</div>
            <div style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:10px">
              <label style="display:flex;align-items:center;gap:6px;font-weight:600;color:#334155;font-size:11px" for="x-grok-roaming-enabled">
                <input id="x-grok-roaming-enabled" type="checkbox">发帖后漫游并随机评论
              </label>
              <label for="x-grok-comment-sentences" style="display:block;margin:8px 0 4px;font-size:11px;color:#334155">随机评论句子（每行一句）</label>
              <textarea id="x-grok-comment-sentences" rows="3" placeholder="每行填写一句评论，发帖后会随机选取" style="width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;font-size:11px;box-sizing:border-box;resize:vertical"></textarea>
              <label for="x-grok-comment-interval" style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;font-size:11px;color:#334155">评论间隔
                <select id="x-grok-comment-interval" style="padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:11px">
                  <option value="60000">约 1 分钟</option><option value="120000" selected>约 2 分钟</option>
                  <option value="180000">约 3 分钟</option><option value="300000">约 5 分钟</option>
                </select>
              </label>
              <div style="font-size:11px;color:#64748b;margin-top:6px">发帖成功后漫游并随机评论；到下次发帖时间先停止漫游。暂停任务会同时停止两项操作，本次运行不重复评论同一帖子。</div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:4px">
              <button type="button" class="button text small" id="x-grok-save-prompt" style="font-size:10px">保存配置</button>
            </div>
            <div id="x-grok-config-feedback" role="status" aria-live="polite" style="font-size:11px;min-height:16px;color:#64748b"></div>
          </div>

          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#334155;font-size:11px">执行日志</label>
            <div class="x-grok-logs-wrap" id="x-grok-logs">${logsHtml}</div>
          </div>
        </div>
      </div>
    `

    // 绑定面板事件
    panelEl.querySelector('#x-grok-close-btn')?.addEventListener('click', async () => {
      try {
        requireApiSuccess(await window.xGrokApi.closePanel(), '关闭 Grok 发帖面板失败。')
      } catch (error) {
        showFailure(error, '关闭 Grok 发帖面板失败。')
      }
    })

    panelEl.querySelector('#x-grok-trigger-now')?.addEventListener('click', async () => {
      actionPending = true
      updatePanelContent()
      try {
        await saveCurrentConfig()
        const result = requireApiSuccess(
          await window.xGrokApi.triggerNow(environmentId),
          '触发 X 发帖失败。'
        )
        if (!result.status) throw new Error('未收到 X 发帖任务状态。')
        applyStatus(result.status)
      } catch (error) {
        showFailure(error, '触发 X 发帖失败。')
      } finally {
        actionPending = false
        updatePanelContent()
      }
    })

    panelEl.querySelector('#x-grok-toggle-btn')?.addEventListener('click', async () => {
      const enabled = !currentTaskStatus?.enabled
      actionPending = true
      updatePanelContent()
      try {
        if (enabled) await saveCurrentConfig()
        const result = requireApiSuccess(
          await window.xGrokApi.toggle({ environmentId, enabled }),
          '切换 X 发帖状态失败。'
        )
        if (result.status) applyStatus(result.status)
      } catch (error) {
        showFailure(error, '切换 X 发帖状态失败。')
      } finally {
        actionPending = false
        updatePanelContent()
      }
    })

    panelEl.querySelector('#x-grok-interval-select')?.addEventListener('change', rememberDraft)
    panelEl.querySelector('#x-grok-prompt-input')?.addEventListener('input', rememberDraft)
    panelEl.querySelector('#x-grok-mentions-input')?.addEventListener('input', rememberDraft)
    panelEl.querySelector('#x-grok-roaming-enabled')?.addEventListener('change', rememberDraft)
    panelEl.querySelector('#x-grok-comment-sentences')?.addEventListener('input', rememberDraft)
    panelEl.querySelector('#x-grok-comment-interval')?.addEventListener('change', rememberDraft)

    panelEl.querySelector('#x-grok-save-prompt')?.addEventListener('click', async () => {
      try {
        await saveCurrentConfig()
      } catch (error) {
        showFailure(error, '保存 X 发帖配置失败。')
      }
    })
    updatePanelContent()
  }

  async function setEnvironment (nextEnvironmentId) {
    if (!nextEnvironmentId) return
    if (nextEnvironmentId === environmentId) {
      await refreshStatus()
      return
    }
    environmentId = nextEnvironmentId
    currentTaskStatus = null
    draftDirty = drafts.has(nextEnvironmentId)
    draftRevision += 1
    restoreFields = true
    feedbackMessage = draftDirty ? '配置尚未保存；启动发帖前会自动保存。' : ''
    feedbackError = false
    renderPanelContent()
    await refreshStatus()
  }

  if (window.xGrokApi) {
    window.xGrokApi.onStatusChanged(task => {
      if (environmentId && task.environmentId === environmentId) applyStatus(task)
    })
    window.xGrokApi.onPanelEnvironmentChanged(nextEnvironmentId => {
      void setEnvironment(nextEnvironmentId)
    })
  }

  renderPanelContent()
})()
