(() => {
  'use strict'

  const elements = {
    button: document.querySelector('#unified-x-grok'),
    countdown: document.querySelector('#unified-x-grok-countdown')
  }

  let currentTab = null

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

  function requireApiSuccess (result, fallbackMessage) {
    if (!result || result.ok === false) {
      throw new Error(result?.error || fallbackMessage)
    }
    return result
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
        const res = requireApiSuccess(
          await window.xGrokApi.getStatus(activeTab.environmentId),
          '获取 X 发帖状态失败。'
        )
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

  }

  async function togglePanel () {
    if (!currentTab || !window.xGrokApi) {
      alert('请先打开 X 页面后再使用 Grok 发帖。')
      return
    }

    try {
      requireApiSuccess(
        await window.xGrokApi.togglePanel(currentTab.environmentId),
        '无法打开 Grok 发帖面板。'
      )
    } catch (err) {
      alert(err.message || '无法打开 Grok 发帖面板。')
    }
  }

  function closePanel () {
    if (window.xGrokApi) {
      void window.xGrokApi.closePanel()
        .then(result => requireApiSuccess(result, '关闭 Grok 发帖面板失败。'))
        .catch(error => console.warn('[X-Grok View] 关闭面板失败:', error.message || error))
    }
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
