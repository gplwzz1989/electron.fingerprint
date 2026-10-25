(() => {
  'use strict'

  const panelEl = document.querySelector('#x-grok-panel-root')
  const DEFAULT_PROMPT = '请写一条关于最新科技、AI或数字化生活的精简推文（X post）。语言幽默有趣或富有洞察力，字数在120字以内。直接输出推文正文，严禁输出任何引号、前缀说明或解释。'
  let environmentId = null
  let currentTaskStatus = null

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

  async function refreshStatus () {
    if (!environmentId || !window.xGrokApi) return
    try {
      const result = requireApiSuccess(
        await window.xGrokApi.getStatus(environmentId),
        '获取 X 发帖状态失败。'
      )
      applyStatus(result.status || null)
    } catch (error) {
      currentTaskStatus = {
        enabled: false,
        intervalMs: 600000,
        remainingSeconds: 600,
        state: 'error',
        statusText: error.message || '获取 X 发帖状态失败。',
        runCount: 0,
        prompt: DEFAULT_PROMPT,
        logs: []
      }
      renderPanelContent()
    }
  }

  function renderPanelContent () {
    if (!panelEl) return

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
    const logsHtml = task.logs?.length
      ? task.logs.map(log => {
        const level = ['error', 'info', 'warn'].includes(log.level) ? log.level : 'info'
        return `<div class="x-grok-log-item ${level}">[${escapeHtml(log.time)}] ${escapeHtml(log.message)}</div>`
      }).join('')
      : '<div style="color:#64748b">暂无发帖日志，点击按钮手动启动发帖。</div>'
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
              <div style="font-size:11px;color:#64748b">${escapeHtml(task.statusText || '待命状态，点击按钮启动')}</div>
            </div>
            <div style="font-family:monospace;font-size:18px;font-weight:700;color:${isRunning ? '#10b981' : '#94a3b8'}">
              ${isBusy ? '处理中...' : (isRunning ? formatTime(task.remainingSeconds) : '--:--')}
            </div>
          </div>

          <div class="x-grok-stat-row">
            <div>
              <div style="font-weight:600;color:#1e293b">周期设置与已发布统计</div>
              <div style="font-size:11px;color:#64748b">已自动发布 ${task.runCount || 0} 条推文</div>
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
            <div style="display:flex;justify-content:flex-end;margin-top:4px">
              <button type="button" class="button text small" id="x-grok-save-prompt" style="font-size:10px">保存提示词</button>
            </div>
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
        alert(error.message || '关闭 Grok 发帖面板失败。')
      }
    })

    panelEl.querySelector('#x-grok-trigger-now')?.addEventListener('click', async () => {
      const button = panelEl.querySelector('#x-grok-trigger-now')
      if (button) {
        button.disabled = true
        button.textContent = '正在执行中...'
      }
      try {
        const result = requireApiSuccess(
          await window.xGrokApi.triggerNow(environmentId),
          '触发 X 发帖失败。'
        )
        if (!result.status) throw new Error('未收到 X 发帖任务状态。')
        applyStatus(result.status)
      } catch (error) {
        alert(error.message || '触发 X 发帖失败。')
        await refreshStatus()
      }
    })

    panelEl.querySelector('#x-grok-toggle-btn')?.addEventListener('click', async () => {
      try {
        const result = requireApiSuccess(
          await window.xGrokApi.toggle({ environmentId, enabled: !isRunning }),
          '切换 X 发帖状态失败。'
        )
        if (result.status) applyStatus(result.status)
      } catch (error) {
        alert(error.message || '切换 X 发帖状态失败。')
      }
    })

    panelEl.querySelector('#x-grok-interval-select')?.addEventListener('change', async event => {
      try {
        const result = requireApiSuccess(
          await window.xGrokApi.updateConfig({
            environmentId,
            intervalMs: Number(event.target.value)
          }),
          '更新发帖间隔失败。'
        )
        if (result.status) applyStatus(result.status)
      } catch (error) {
        alert(error.message || '更新发帖间隔失败。')
      }
    })

    panelEl.querySelector('#x-grok-save-prompt')?.addEventListener('click', async () => {
      const prompt = panelEl.querySelector('#x-grok-prompt-input')?.value || ''
      try {
        const result = requireApiSuccess(
          await window.xGrokApi.updateConfig({ environmentId, prompt }),
          '保存 Grok 提示词失败。'
        )
        if (result.status) applyStatus(result.status)
        const button = panelEl.querySelector('#x-grok-save-prompt')
        if (button) {
          button.textContent = '已保存 ✓'
          setTimeout(() => { if (button.isConnected) button.textContent = '保存提示词' }, 1500)
        }
      } catch (error) {
        alert(error.message || '保存 Grok 提示词失败。')
      }
    })
  }

  async function setEnvironment (nextEnvironmentId) {
    if (!nextEnvironmentId) return
    environmentId = nextEnvironmentId
    currentTaskStatus = null
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
