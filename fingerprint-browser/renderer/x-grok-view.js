(() => {
  'use strict'

  const elements = {
    button: document.querySelector('#unified-x-grok'),
    countdown: document.querySelector('#unified-x-grok-countdown')
  }

  let currentTab = null
  let currentTaskStatus = null
  let panelVisible = false
  let panelEl = null

  function formatTime (totalSeconds) {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) return '00:00'
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  /**
   * 严格判断 URL 是否属于 X (Twitter) 官方域名
   * 必须仅凭当前活跃标签正在浏览的真实 URL 判定，坚决杜绝根据环境名称判断而在百度等非 X 页面误显
   */
  function isXPlatformUrl (url) {
    if (!url || typeof url !== 'string') return false
    try {
      const parsed = new URL(url.trim())
      const host = parsed.hostname.toLowerCase()
      return host === 'x.com' ||
        host.endsWith('.x.com') ||
        host === 'twitter.com' ||
        host.endsWith('.twitter.com')
    } catch {
      const lower = String(url).toLowerCase()
      return lower.includes('x.com') || lower.includes('twitter.com')
    }
  }

  async function updateActiveStatus (activeTab) {
    currentTab = activeTab
    if (!elements.button) return

    // 需求 1: x 的自动发布按钮只有在打开 x 的时候出现
    // 进入百度等非 X 页面必须严格隐藏按钮，并关闭面板
    if (!activeTab || !isXPlatformUrl(activeTab.url)) {
      elements.button.style.display = 'none'
      elements.button.classList.remove('active', 'posting')
      if (elements.countdown) elements.countdown.style.display = 'none'
      closePanel()
      return
    }

    // 仅在当前活跃标签打开 X 平台网页时显式展示按钮
    elements.button.style.display = 'inline-flex'
    elements.button.disabled = false

    if (window.xGrokApi) {
      try {
        const res = await window.xGrokApi.getStatus(activeTab.environmentId)
        if (res && res.status) {
          applyStatus(res.status)
        } else {
          elements.button.classList.remove('active', 'posting')
          if (elements.countdown) elements.countdown.style.display = 'none'
        }
      } catch (err) {
        console.warn('[X-Grok View] 获取状态失败:', err)
      }
    }
  }

  function applyStatus (task) {
    currentTaskStatus = task
    if (!elements.button) return

    if (!task || !task.enabled) {
      elements.button.classList.remove('active', 'posting')
      if (elements.countdown) elements.countdown.style.display = 'none'
    } else {
      elements.button.classList.add('active')
      if (task.state === 'generating' || task.state === 'posting') {
        elements.button.classList.add('posting')
      } else {
        elements.button.classList.remove('posting')
      }

      if (elements.countdown) {
        elements.countdown.style.display = 'inline-block'
        if (task.state === 'generating') {
          elements.countdown.textContent = '生成中'
        } else if (task.state === 'posting') {
          elements.countdown.textContent = '发帖中'
        } else {
          elements.countdown.textContent = formatTime(task.remainingSeconds)
        }
      }
    }

    if (panelVisible && panelEl) {
      renderPanelContent()
    }
  }

  function togglePanel () {
    if (panelVisible) {
      closePanel()
    } else {
      openPanel()
    }
  }

  function closePanel () {
    if (panelEl) {
      panelEl.remove()
      panelEl = null
    }
    panelVisible = false
  }

  function openPanel () {
    if (!currentTab) return
    if (panelEl) panelEl.remove()

    panelEl = document.createElement('div')
    panelEl.className = 'x-grok-panel-overlay'
    document.body.appendChild(panelEl)
    panelVisible = true
    renderPanelContent()
  }

  function renderPanelContent () {
    if (!panelEl || !currentTab) return

    const task = currentTaskStatus || {
      enabled: false,
      intervalMs: 600000,
      remainingSeconds: 600,
      state: 'idle',
      statusText: '未启动，等待手动开启',
      runCount: 0,
      prompt: '请写一条关于最新科技、AI或数字化生活的精简推文（X post）。语言幽默有趣或富有洞察力，字数在120字以内。直接输出推文正文，严禁输出任何引号、前缀说明或解释。',
      logs: []
    }

    const isRunning = Boolean(task.enabled)
    const intervalMins = Math.round((task.intervalMs || 600000) / 60000)
    const isBusy = task.state === 'generating' || task.state === 'posting'

    panelEl.innerHTML = `
      <div class="x-grok-panel-header">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          X (Twitter) Grok 发帖控制
        </h4>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="badge ${isRunning ? (isBusy ? 'blue' : 'green') : 'gray'}" style="padding:2px 6px;border-radius:4px;font-size:10px">
            ${isRunning ? (isBusy ? (task.state === 'generating' ? 'Grok生成中' : '推特发布中') : '自动运行中') : '未启动 (待命)'}
          </span>
          <button type="button" class="icon-button" id="x-grok-close-btn" style="padding:2px 6px;font-size:14px">✕</button>
        </div>
      </div>
      <div class="x-grok-panel-body">
        <div class="x-grok-stat-row">
          <div>
            <div style="font-weight:600;color:#1e293b">发帖状态与倒计时</div>
            <div style="font-size:11px;color:#64748b">${task.statusText || '待命状态，点击按钮启动'}</div>
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
          <div style="display:flex;align-items:center;gap:6px">
            <select id="x-grok-interval-select" style="padding:3px 6px;border-radius:4px;border:1px solid #cbd5e1;font-size:11px">
              <option value="300000" ${intervalMins === 5 ? 'selected' : ''}>5 分钟一次</option>
              <option value="600000" ${intervalMins === 10 ? 'selected' : ''}>10 分钟一次 (默认)</option>
              <option value="900000" ${intervalMins === 15 ? 'selected' : ''}>15 分钟一次</option>
              <option value="1800000" ${intervalMins === 30 ? 'selected' : ''}>30 分钟一次</option>
            </select>
          </div>
        </div>

        <!-- 需求 2: 启动发布必须手动点击，提供清晰的手动控制选项 -->
        <div class="x-grok-actions-row">
          ${isRunning
            ? `
              <button type="button" class="button primary" id="x-grok-trigger-now" ${isBusy ? 'disabled' : ''} style="font-size:11px;padding:6px 10px">
                ⚡ 立即发帖一次
              </button>
              <button type="button" class="button small soft" id="x-grok-toggle-btn" style="font-size:11px;padding:6px 10px">
                暂停自动发帖
              </button>
            `
            : `
              <button type="button" class="button primary" id="x-grok-toggle-btn" style="font-size:11px;padding:6px 10px">
                ▶ 启动定时发帖 (${intervalMins}分钟/次)
              </button>
              <button type="button" class="button small soft" id="x-grok-trigger-now" ${isBusy ? 'disabled' : ''} style="font-size:11px;padding:6px 10px">
                ⚡ 立即发帖一次
              </button>
            `
          }
        </div>

        <div>
          <label style="display:block;font-weight:600;margin-bottom:4px;color:#334155;font-size:11px">Grok 创作提示词 (Prompt)</label>
          <textarea id="x-grok-prompt-input" rows="3" style="width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;font-size:11px;box-sizing:border-box;resize:vertical">${task.prompt || ''}</textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:4px">
            <button type="button" class="button text small" id="x-grok-save-prompt" style="font-size:10px">保存 Prompt</button>
          </div>
        </div>

        <div>
          <label style="display:block;font-weight:600;margin-bottom:4px;color:#334155;font-size:11px">执行日志</label>
          <div class="x-grok-logs-wrap" id="x-grok-logs">
            ${(task.logs && task.logs.length > 0)
              ? task.logs.map(log => `<div class="x-grok-log-item ${log.level}">[${log.time}] ${log.message}</div>`).join('')
              : '<div style="color:#64748b">暂无发帖日志，点击按钮手动启动发帖。</div>'
            }
          </div>
        </div>
      </div>
    `

    // 绑定面板事件
    panelEl.querySelector('#x-grok-close-btn')?.addEventListener('click', closePanel)

    panelEl.querySelector('#x-grok-trigger-now')?.addEventListener('click', async () => {
      try {
        const btn = panelEl.querySelector('#x-grok-trigger-now')
        if (btn) {
          btn.disabled = true
          btn.textContent = '正在执行中...'
        }
        await window.xGrokApi.triggerNow(currentTab.environmentId)
      } catch (err) {
        alert(err.message || '触发失败')
      }
    })

    panelEl.querySelector('#x-grok-toggle-btn')?.addEventListener('click', async () => {
      try {
        await window.xGrokApi.toggle({
          environmentId: currentTab.environmentId,
          enabled: !isRunning
        })
      } catch (err) {
        alert(err.message || '操作失败')
      }
    })

    panelEl.querySelector('#x-grok-interval-select')?.addEventListener('change', async (e) => {
      const ms = Number(e.target.value)
      try {
        await window.xGrokApi.updateConfig({
          environmentId: currentTab.environmentId,
          intervalMs: ms
        })
      } catch (err) {
        alert(err.message || '设置间隔失败')
      }
    })

    panelEl.querySelector('#x-grok-save-prompt')?.addEventListener('click', async () => {
      const promptVal = panelEl.querySelector('#x-grok-prompt-input')?.value
      try {
        await window.xGrokApi.updateConfig({
          environmentId: currentTab.environmentId,
          prompt: promptVal
        })
        const btn = panelEl.querySelector('#x-grok-save-prompt')
        if (btn) btn.textContent = '已保存 ✓'
        setTimeout(() => { if (btn) btn.textContent = '保存 Prompt' }, 1500)
      } catch (err) {
        alert(err.message || '保存失败')
      }
    })
  }

  // 初始化绑定
  async function init () {
    // 初始必须隐藏，只有打开 X 时才在 updateActiveStatus 中显式出现
    if (elements.button) {
      elements.button.style.display = 'none'
      elements.button.addEventListener('click', togglePanel)
    }

    if (window.xGrokApi) {
      window.xGrokApi.onStatusChanged(task => {
        if (currentTab && task.environmentId === currentTab.environmentId) {
          applyStatus(task)
        }
      })
    }

    if (window.browserApi) {
      window.browserApi.onTabsChanged(snapshot => {
        const active = snapshot.tabs?.find(t => t.id === snapshot.activeId)
        void updateActiveStatus(active)
      })

      // 初次加载时主动查询当前激活标签状态，避免错过初次渲染
      try {
        const snapshot = await window.browserApi.listTabs()
        if (snapshot && Array.isArray(snapshot.tabs)) {
          const active = snapshot.tabs.find(t => t.id === snapshot.activeId)
          void updateActiveStatus(active)
        }
      } catch (err) {
        // 静默
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
