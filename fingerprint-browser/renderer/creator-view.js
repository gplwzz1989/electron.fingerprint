'use strict'

// 创作中心状态
const creatorState = {
  currentTab: 'video', // 'video' | 'article' | 'post' | 'assets'
  video: {
    topic: '2026年爆火的3个AI副业，普通人如何弯道超车？',
    duration: 15,
    generating: false,
    rendering: false,
    storyboard: null,
    renderedResult: null
  },
  article: {
    topic: '30天读完20本书的高效深度阅读法',
    platform: 'xiaohongshu',
    style: '种草',
    keywords: '阅读方法, 习惯养成, 效率工具',
    generating: false,
    checking: false,
    candidateTitles: [],
    selectedTitle: '',
    content: '',
    tags: [],
    complianceResult: null
  },
  post: {
    template: 'quote', // 'quote' | 'meme' | 'carousel'
    text: '不要因为走得太远，而忘记为什么出发。',
    subText: '—— 晨间灵感 · 栖界',
    bgTheme: 'dark', // 'dark' | 'gradient' | 'minimal' | 'warm'
    saving: false,
    lastSavedPath: null
  },
  assets: {
    filterType: 'all',
    list: [],
    loading: false,
    hasLoaded: false
  }
}

// 模版配色预设
const THEME_COLORS = {
  dark: { bg: '#0f172a', text: '#f8fafc', sub: '#94a3b8', accent: '#38bdf8' },
  gradient: { bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)', text: '#ffffff', sub: '#e0e7ff', accent: '#fbbf24' },
  minimal: { bg: '#ffffff', text: '#1e293b', sub: '#64748b', accent: '#2563eb' },
  warm: { bg: '#fef3c7', text: '#78350f', sub: '#b45309', accent: '#d97706' }
}

/**
 * 创作中心主视图渲染入口
 */
function creatorPage () {
  return `
    <div class="creator-hub-container">
      <div class="creator-header">
        <div class="creator-header-left">
          <h2>🎨 AI 内容创作中心</h2>
          <p class="section-desc">一站式自动化生产视频、爆款文章与动态贴图，打通指纹环境实现矩阵化发布。</p>
        </div>
        <div class="creator-tabs-nav" role="tablist">
          <button class="creator-tab-btn ${creatorState.currentTab === 'video' ? 'active' : ''}" data-creator-tab="video">🎬 视频创作</button>
          <button class="creator-tab-btn ${creatorState.currentTab === 'article' ? 'active' : ''}" data-creator-tab="article">📝 文章创作</button>
          <button class="creator-tab-btn ${creatorState.currentTab === 'post' ? 'active' : ''}" data-creator-tab="post">🎨 动态/贴图</button>
          <button class="creator-tab-btn ${creatorState.currentTab === 'assets' ? 'active' : ''}" data-creator-tab="assets">📦 作品与待发库</button>
        </div>
      </div>

      <div class="creator-body">
        ${renderCurrentCreatorTab()}
      </div>
    </div>
  `
}

function renderCurrentCreatorTab () {
  switch (creatorState.currentTab) {
    case 'video': return renderVideoStudio()
    case 'article': return renderArticleStudio()
    case 'post': return renderPostStudio()
    case 'assets': return renderAssetsStudio()
    default: return renderVideoStudio()
  }
}

/* ===================== 1. 视频创作模块 ===================== */
function renderVideoStudio () {
  const v = creatorState.video
  const sb = v.storyboard

  return `
    <div class="creator-studio-grid">
      <div class="card creator-form-card">
        <div class="card-header">
          <h3>1. 配置视频创意主题</h3>
          <span class="badge blue">FFmpeg 极速渲染</span>
        </div>
        <div class="form-group">
          <label>视频主题 / 关键词</label>
          <input id="creator-video-topic" class="input" value="${escapeHTML(v.topic)}" placeholder="输入想做的短视频主题...">
        </div>
        <div class="form-group">
          <label>期望时长</label>
          <div class="radio-pills">
            <label><input type="radio" name="video-duration" value="15" ${v.duration === 15 ? 'checked' : ''}> 15秒 (黄金短爆款)</label>
            <label><input type="radio" name="video-duration" value="30" ${v.duration === 30 ? 'checked' : ''}> 30秒 (干货小贴士)</label>
            <label><input type="radio" name="video-duration" value="60" ${v.duration === 60 ? 'checked' : ''}> 60秒 (深度知识)</label>
          </div>
        </div>
        <div class="form-actions">
          <button class="button primary" id="btn-generate-storyboard" ${v.generating ? 'disabled' : ''}>
            ${v.generating ? '正在智能拆解分镜...' : '✨ 一键生成分镜脚本'}
          </button>
        </div>
      </div>

      <div class="card creator-preview-card">
        <div class="card-header">
          <h3>2. 分镜脚本与合成视窗</h3>
          ${sb ? `<span class="badge green">已拆解 ${sb.scenes.length} 个镜头</span>` : ''}
        </div>
        
        ${!sb ? `
          <div class="creator-empty-box">
            <span class="empty-icon">🎬</span>
            <p>在左侧输入主题，点击“一键生成分镜脚本”开始创作</p>
          </div>
        ` : `
          <div class="storyboard-list">
            ${sb.scenes.map((s, idx) => `
              <div class="storyboard-item">
                <div class="storyboard-item-header">
                  <span class="scene-badge">镜头 ${s.index}</span>
                  <span class="scene-title">${escapeHTML(s.title)}</span>
                  <span class="scene-dur">${s.durationSec}s</span>
                </div>
                <div class="storyboard-voiceover">
                  <label>旁白/字幕：</label>
                  <textarea class="input scene-text-input" data-scene-idx="${idx}">${escapeHTML(s.voiceover)}</textarea>
                </div>
                <div class="storyboard-prompt">💡 视觉呈现：${escapeHTML(s.visualPrompt)}</div>
              </div>
            `).join('')}
          </div>

          <div class="render-bar">
            <button class="button primary" id="btn-render-video" ${v.rendering ? 'disabled' : ''}>
              ${v.rendering ? '正在调度 FFmpeg 渲染 MP4...' : '🚀 一键渲染合成高清 MP4 视频'}
            </button>
          </div>

          ${v.renderedResult ? `
            <div class="rendered-success-box">
              <div class="rendered-info">
                <h4>✅ 视频渲染完成！</h4>
                <p>文件路径：<code>${escapeHTML(v.renderedResult.outputPath)}</code></p>
                <p>时长：${v.renderedResult.duration}秒 · 大小：${(v.renderedResult.fileSize / 1024 / 1024).toFixed(2)} MB · 规格：${v.renderedResult.width}×${v.renderedResult.height}</p>
              </div>
              <div class="rendered-actions">
                <button class="button" data-action="open-video-file" data-path="${escapeHTML(v.renderedResult.outputPath)}">📂 打开所在文件夹</button>
                <button class="button primary" id="btn-save-video-asset">💾 存入待发布作品库</button>
              </div>
            </div>
          ` : ''}
        `}
      </div>
    </div>
  `
}

/* ===================== 2. 文章创作模块 ===================== */
function renderArticleStudio () {
  const a = creatorState.article
  const comp = a.complianceResult

  return `
    <div class="creator-studio-grid">
      <div class="card creator-form-card">
        <div class="card-header">
          <h3>1. 选题与平台预设</h3>
          <span class="badge blue">爆款大纲生成</span>
        </div>
        <div class="form-group">
          <label>目标发布平台</label>
          <select id="creator-article-platform" class="input">
            <option value="xiaohongshu" ${a.platform === 'xiaohongshu' ? 'selected' : ''}>小红书 (种草图文/吸睛排版)</option>
            <option value="zhihu" ${a.platform === 'zhihu' ? 'selected' : ''}>知乎 (专业问答/深度思考)</option>
            <option value="wechat" ${a.platform === 'wechat' ? 'selected' : ''}>微信公众号 (深度长文/金句)</option>
            <option value="weibo" ${a.platform === 'weibo' ? 'selected' : ''}>微博 / 动态 (热点观点)</option>
          </select>
        </div>
        <div class="form-group">
          <label>文章主题</label>
          <input id="creator-article-topic" class="input" value="${escapeHTML(a.topic)}" placeholder="如：30天掌握自媒体运营底层逻辑...">
        </div>
        <div class="form-group">
          <label>核心关键词</label>
          <input id="creator-article-keywords" class="input" value="${escapeHTML(a.keywords)}" placeholder="以逗号分隔，如：效率, 认知, 工具...">
        </div>
        <div class="form-actions">
          <button class="button primary" id="btn-generate-article" ${a.generating ? 'disabled' : ''}>
            ${a.generating ? '正在生成爆款大纲...' : '✨ 一键生成爆款内容与排版'}
          </button>
        </div>

        ${comp ? `
          <div class="compliance-panel ${comp.ok ? 'safe' : 'warn'}">
            <div class="comp-header">
              <span>🛡️ 平台风控合规评分：<b>${comp.score} 分</b></span>
              <span class="badge ${comp.ok ? 'green' : 'amber'}">${comp.ok ? '未发现违禁词' : `命中 ${comp.hits.length} 处违规词`}</span>
            </div>
            ${comp.hits.length > 0 ? `
              <ul class="comp-list">
                ${comp.hits.map(h => `
                  <li>
                    <span class="comp-word">${escapeHTML(h.word)}</span>: ${escapeHTML(h.reason)}
                    <button class="comp-fix-btn" data-action="fix-sensitive" data-word="${escapeHTML(h.word)}" data-replace="${escapeHTML(h.replace)}">替换为“${escapeHTML(h.replace)}”</button>
                  </li>
                `).join('')}
              </ul>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <div class="card creator-preview-card">
        <div class="card-header">
          <h3>2. 正文排版与候选标题</h3>
          <div class="header-btns">
            <button class="button small" id="btn-audit-compliance">🛡️ 重新自检风控</button>
            <button class="button small primary" id="btn-copy-article">📋 一键复制格式</button>
            <button class="button small" id="btn-save-article-asset">💾 存入作品库</button>
          </div>
        </div>

        ${a.candidateTitles && a.candidateTitles.length > 0 ? `
          <div class="candidate-titles-box">
            <label>🎯 点击选取最佳标题：</label>
            <div class="title-pills">
              ${a.candidateTitles.map(t => `
                <div class="title-pill ${t === a.selectedTitle ? 'selected' : ''}" data-action="pick-title" data-title="${escapeHTML(t)}">
                  ${escapeHTML(t)}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="article-editor-wrap">
          <textarea id="creator-article-editor" class="input article-editor" placeholder="点击左侧生成，或在此自由编辑正文...">${escapeHTML(a.content)}</textarea>
        </div>
      </div>
    </div>
  `
}

/* ===================== 3. 动态/贴图创作模块 ===================== */
function renderPostStudio () {
  const p = creatorState.post

  return `
    <div class="creator-studio-grid">
      <div class="card creator-form-card">
        <div class="card-header">
          <h3>1. 动态与贴图模版配置</h3>
          <span class="badge blue">Canvas 离线直出</span>
        </div>
        <div class="form-group">
          <label>贴图类型</label>
          <div class="radio-pills">
            <label><input type="radio" name="post-tpl" value="quote" ${p.template === 'quote' ? 'checked' : ''}> ✨ 高级金句卡</label>
            <label><input type="radio" name="post-tpl" value="meme" ${p.template === 'meme' ? 'checked' : ''}> 🎭 经典表情包/Meme</label>
            <label><input type="radio" name="post-tpl" value="carousel" ${p.template === 'carousel' ? 'checked' : ''}> 📑 小红书九宫格图</label>
          </div>
        </div>
        <div class="form-group">
          <label>视觉主题色调</label>
          <div class="radio-pills">
            <label><input type="radio" name="post-theme" value="dark" ${p.bgTheme === 'dark' ? 'checked' : ''}> 极光暗夜</label>
            <label><input type="radio" name="post-theme" value="gradient" ${p.bgTheme === 'gradient' ? 'checked' : ''}> 炫彩渐变</label>
            <label><input type="radio" name="post-theme" value="minimal" ${p.bgTheme === 'minimal' ? 'checked' : ''}> 纯白极简</label>
            <label><input type="radio" name="post-theme" value="warm" ${p.bgTheme === 'warm' ? 'checked' : ''}> 温暖杏黄</label>
          </div>
        </div>
        <div class="form-group">
          <label>核心文案 / 观点内容</label>
          <textarea id="creator-post-text" class="input" style="height:90px;" placeholder="输入要表达的文案或多点观点...">${escapeHTML(p.text)}</textarea>
        </div>
        <div class="form-group">
          <label>署名 / 话题副标题</label>
          <input id="creator-post-subtext" class="input" value="${escapeHTML(p.subText)}" placeholder="—— 灵感作者 / 话题名称">
        </div>
        <div class="form-actions">
          <button class="button primary" id="btn-refresh-canvas">🎨 刷新实时预览</button>
          <button class="button" id="btn-export-post-image">📥 导出超清 PNG 并入库</button>
        </div>
      </div>

      <div class="card creator-preview-card">
        <div class="card-header">
          <h3>2. 实时高清贴图画布 (Canvas)</h3>
          <span class="badge green">3:4 黄金社交比例</span>
        </div>
        <div class="canvas-preview-wrap">
          <canvas id="creator-canvas" width="600" height="800" class="creator-canvas-elem"></canvas>
        </div>
      </div>
    </div>
  `
}

/* ===================== 4. 作品与待发库模块 ===================== */
function renderAssetsStudio () {
  const list = creatorState.assets.list || []
  const loading = creatorState.assets.loading

  return `
    <div class="assets-studio-container">
      <div class="assets-toolbar">
        <div class="filter-pills">
          <button class="pill ${creatorState.assets.filterType === 'all' ? 'active' : ''}" data-asset-filter="all">全部 (${list.length})</button>
          <button class="pill ${creatorState.assets.filterType === 'video' ? 'active' : ''}" data-asset-filter="video">🎬 视频 (${list.filter(i => i.type === 'video').length})</button>
          <button class="pill ${creatorState.assets.filterType === 'article' ? 'active' : ''}" data-asset-filter="article">📝 文章 (${list.filter(i => i.type === 'article').length})</button>
          <button class="pill ${creatorState.assets.filterType === 'post' ? 'active' : ''}" data-asset-filter="post">🎨 动态/贴图 (${list.filter(i => i.type === 'post').length})</button>
        </div>
        <button class="button primary small" id="btn-refresh-assets" ${loading ? 'disabled' : ''}>
          ${loading ? '⏳ 正在加载...' : '🔄 刷新作品列表'}
        </button>
      </div>

      ${loading ? `
        <div class="creator-empty-box">
          <span class="empty-icon">⏳</span>
          <p>正在读取作品库，请稍候...</p>
        </div>
      ` : list.length === 0 ? `
        <div class="creator-empty-box">
          <span class="empty-icon">📦</span>
          <p>暂无已保存的作品，快通过上方标签页创作第一个视频、文章或动态吧！</p>
        </div>
      ` : `
        <div class="assets-cards-grid">
          ${list.map(item => `
            <div class="card asset-item-card">
              <div class="asset-card-top">
                <span class="badge ${item.type === 'video' ? 'blue' : item.type === 'article' ? 'green' : 'purple'}">
                  ${item.type === 'video' ? '🎬 视频' : item.type === 'article' ? '📝 文章' : '🎨 贴图'}
                </span>
                <span class="asset-time">${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '刚刚'}</span>
              </div>
              <h4 class="asset-title" title="${escapeHTML(item.title || '无标题草稿')}">${escapeHTML(item.title || '无标题草稿')}</h4>
              <p class="asset-content-preview">${escapeHTML((item.content || '').slice(0, 90))}...</p>
              
              <div class="asset-meta-tags">
                ${(item.tags || []).slice(0, 3).map(t => `<span class="tag-pill">${escapeHTML(t)}</span>`).join('')}
              </div>

              <div class="asset-card-footer">
                ${item.mediaFiles && item.mediaFiles[0] ? `
                  <button class="button small" data-action="open-asset-media" data-path="${escapeHTML(item.mediaFiles[0])}">📂 打开文件</button>
                ` : ''}
                <button class="button small primary" data-action="publish-asset" data-id="${item.id}">🌐 准备发布</button>
                <button class="button small danger" data-action="delete-asset" data-id="${item.id}">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `
}

/* ===================== Canvas 贴图离线绘制逻辑 ===================== */
function drawCreatorCanvas () {
  const canvas = document.getElementById('creator-canvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const p = creatorState.post
  const w = canvas.width
  const h = canvas.height

  // 1. 绘制背景
  if (p.bgTheme === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#4f46e5')
    grad.addColorStop(0.5, '#7c3aed')
    grad.addColorStop(1, '#db2777')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  } else if (p.bgTheme === 'dark') {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)
    // 装饰圆晕
    ctx.beginPath()
    ctx.arc(w * 0.8, h * 0.2, 180, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'
    ctx.fill()
  } else if (p.bgTheme === 'warm') {
    ctx.fillStyle = '#fef3c7'
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }

  // 2. 边框装饰
  ctx.strokeStyle = p.bgTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, w - 60, h - 60)

  // 3. 模版分支绘制
  const theme = THEME_COLORS[p.bgTheme] || THEME_COLORS.dark

  if (p.template === 'quote') {
    // 引号装饰
    ctx.font = 'bold 90px "Georgia", serif'
    ctx.fillStyle = theme.accent
    ctx.fillText('“', 60, 140)

    // 主文字排版自动换行
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = theme.text
    wrapText(ctx, p.text, 60, 220, w - 120, 52)

    // 署名副标题
    ctx.font = '20px sans-serif'
    ctx.fillStyle = theme.sub
    ctx.fillText(p.subText || '', 60, h - 100)

    // 栖界水印
    ctx.font = '14px sans-serif'
    ctx.fillStyle = 'rgba(150,150,150,0.6)'
    ctx.fillText('Qijie Fingerprint Studio', w - 230, h - 60)
  } else if (p.template === 'meme') {
    // 经典表情包：顶部文字 + 中间趣味插图区域 + 底部文字
    ctx.font = 'bold 36px Impact, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 5
    ctx.textAlign = 'center'

    ctx.strokeText(p.text.slice(0, 16), w / 2, 100)
    ctx.fillText(p.text.slice(0, 16), w / 2, 100)

    // 表情插图占位
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(80, 150, w - 160, h - 350)
    ctx.font = '80px sans-serif'
    ctx.fillText('🎭', w / 2, h / 2 - 20)

    if (p.subText) {
      ctx.strokeText(p.subText.slice(0, 18), w / 2, h - 100)
      ctx.fillText(p.subText.slice(0, 18), w / 2, h - 100)
    }
    ctx.textAlign = 'start'
  } else {
    // 九宫格连续知识卡
    ctx.fillStyle = theme.accent
    ctx.fillRect(60, 60, 10, 36)

    ctx.font = 'bold 28px sans-serif'
    ctx.fillStyle = theme.text
    ctx.fillText('知识卡片 · 重点提炼', 85, 90)

    ctx.font = '24px sans-serif'
    ctx.fillStyle = theme.text
    wrapText(ctx, p.text, 60, 180, w - 120, 44)

    ctx.font = '18px sans-serif'
    ctx.fillStyle = theme.sub
    ctx.fillText(p.subText || '第 1 / 3 页', 60, h - 90)
  }
}

function wrapText (ctx, text, x, y, maxWidth, lineHeight) {
  const chars = String(text).split('')
  let line = ''
  let currentY = y

  for (let n = 0; n < chars.length; n++) {
    const testLine = line + chars[n]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = chars[n]
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
}

let loadingAssets = false

/* ===================== 全局事件与 API 联动 ===================== */
function attachCreatorEvents () {
  if (creatorState.currentTab === 'post') {
    setTimeout(drawCreatorCanvas, 50)
  }
  if (creatorState.currentTab === 'assets' && !creatorState.assets.hasLoaded && !loadingAssets) {
    void loadAssetsList()
  }

  // 1. 选项卡切换
  document.querySelectorAll('[data-creator-tab]').forEach(btn => {
    btn.onclick = () => {
      const nextTab = btn.dataset.creatorTab
      if (creatorState.currentTab === nextTab) return
      creatorState.currentTab = nextTab
      if (creatorState.currentTab === 'assets' && !creatorState.assets.hasLoaded) {
        void loadAssetsList()
      }
      render()
      if (creatorState.currentTab === 'post') {
        setTimeout(drawCreatorCanvas, 50)
      }
    }
  })

  // 2. 视频生成脚本
  const btnGenSB = document.getElementById('btn-generate-storyboard')
  if (btnGenSB) {
    btnGenSB.onclick = async () => {
      const topic = document.getElementById('creator-video-topic')?.value || ''
      creatorState.video.topic = topic
      creatorState.video.generating = true
      render()
      try {
        const sb = await window.creatorApi.generateStoryboard({
          topic,
          targetDuration: creatorState.video.duration
        })
        creatorState.video.storyboard = sb
        creatorState.video.renderedResult = null
      } catch (err) {
        toast(`生成分镜脚本失败: ${err.message}`)
      } finally {
        creatorState.video.generating = false
        render()
      }
    }
  }

  // 3. 渲染视频
  const btnRenderVid = document.getElementById('btn-render-video')
  if (btnRenderVid) {
    btnRenderVid.onclick = async () => {
      creatorState.video.rendering = true
      render()
      try {
        const res = await window.creatorApi.renderVideo({
          title: creatorState.video.topic,
          scenes: creatorState.video.storyboard?.scenes || []
        })
        creatorState.video.renderedResult = res
        toast('🎉 高清 MP4 视频合成成功！已存入本地。')
      } catch (err) {
        toast(`视频合成失败: ${err.message}`)
      } finally {
        creatorState.video.rendering = false
        render()
      }
    }
  }

  // 存入视频资产
  const btnSaveVidAsset = document.getElementById('btn-save-video-asset')
  if (btnSaveVidAsset) {
    btnSaveVidAsset.onclick = async () => {
      const r = creatorState.video.renderedResult
      if (!r) return
      try {
        await window.creatorApi.saveAsset({
          type: 'video',
          title: creatorState.video.topic,
          content: `分镜数: ${creatorState.video.storyboard?.scenes?.length || 0} · 时长: ${r.duration}秒`,
          mediaFiles: [r.outputPath],
          tags: ['#短视频创作', '#AI合成'],
          targetPlatform: 'douyin'
        })
        creatorState.assets.hasLoaded = false
        toast('视频已存入待发布作品库！')
      } catch (err) {
        toast(`存入资产库失败: ${err.message}`)
      }
    }
  }

  // 4. 生成文章
  const btnGenArt = document.getElementById('btn-generate-article')
  if (btnGenArt) {
    btnGenArt.onclick = async () => {
      const topic = document.getElementById('creator-article-topic')?.value || ''
      const keywords = document.getElementById('creator-article-keywords')?.value || ''
      const platform = document.getElementById('creator-article-platform')?.value || 'xiaohongshu'

      creatorState.article.topic = topic
      creatorState.article.keywords = keywords
      creatorState.article.platform = platform
      creatorState.article.generating = true
      render()

      try {
        const res = await window.creatorApi.generateArticle({ topic, keywords, platform })
        creatorState.article.candidateTitles = res.candidateTitles
        creatorState.article.selectedTitle = res.selectedTitle
        creatorState.article.content = res.content
        creatorState.article.tags = res.tags
        // 自动进行合规检测
        creatorState.article.complianceResult = await window.creatorApi.checkCompliance(res.content)
      } catch (err) {
        toast(`生成文章大纲失败: ${err.message}`)
      } finally {
        creatorState.article.generating = false
        render()
      }
    }
  }

  // 风控自检
  const btnAudit = document.getElementById('btn-audit-compliance')
  if (btnAudit) {
    btnAudit.onclick = async () => {
      const content = document.getElementById('creator-article-editor')?.value || ''
      creatorState.article.content = content
      const comp = await window.creatorApi.checkCompliance(content)
      creatorState.article.complianceResult = comp
      render()
      toast(`自检完成，合规得分：${comp.score} 分`)
    }
  }

  // 复制文章
  const btnCopy = document.getElementById('btn-copy-article')
  if (btnCopy) {
    btnCopy.onclick = async () => {
      const content = document.getElementById('creator-article-editor')?.value || ''
      await navigator.clipboard.writeText(content)
      toast('文章排版内容已复制到剪贴板！')
    }
  }

  // 保存文章资产
  const btnSaveArtAsset = document.getElementById('btn-save-article-asset')
  if (btnSaveArtAsset) {
    btnSaveArtAsset.onclick = async () => {
      const content = document.getElementById('creator-article-editor')?.value || ''
      try {
        await window.creatorApi.saveAsset({
          type: 'article',
          title: creatorState.article.selectedTitle || creatorState.article.topic,
          content,
          tags: creatorState.article.tags,
          targetPlatform: creatorState.article.platform
        })
        creatorState.assets.hasLoaded = false
        toast('文章已存入待发布作品库！')
      } catch (err) {
        toast(`存入资产失败: ${err.message}`)
      }
    }
  }

  // 5. 动态贴图画布刷新与保存
  const btnRefreshCanvas = document.getElementById('btn-refresh-canvas')
  if (btnRefreshCanvas) {
    btnRefreshCanvas.onclick = () => {
      creatorState.post.text = document.getElementById('creator-post-text')?.value || ''
      creatorState.post.subText = document.getElementById('creator-post-subtext')?.value || ''
      drawCreatorCanvas()
      toast('画布已更新')
    }
  }

  const btnExportPost = document.getElementById('btn-export-post-image')
  if (btnExportPost) {
    btnExportPost.onclick = async () => {
      const canvas = document.getElementById('creator-canvas')
      if (!canvas) return
      const base64 = canvas.toDataURL('image/png')
      try {
        const { filePath } = await window.creatorApi.savePostImage({ base64Data: base64, prefix: 'post-card' })
        // 同时存为资产
        await window.creatorApi.saveAsset({
          type: 'post',
          title: (creatorState.post.text || '金句贴图').slice(0, 30),
          content: creatorState.post.text,
          coverPath: filePath,
          mediaFiles: [filePath],
          tags: ['#每日金句', '#小红书卡片'],
          targetPlatform: 'xiaohongshu'
        })
        creatorState.assets.hasLoaded = false
        toast(`贴图已成功导出并存入作品库: ${filePath}`)
      } catch (err) {
        toast(`导出贴图失败: ${err.message}`)
      }
    }
  }

  // 贴图单选切换
  document.querySelectorAll('input[name="post-tpl"]').forEach(r => {
    r.onchange = () => {
      creatorState.post.template = r.value
      drawCreatorCanvas()
    }
  })
  document.querySelectorAll('input[name="post-theme"]').forEach(r => {
    r.onchange = () => {
      creatorState.post.bgTheme = r.value
      drawCreatorCanvas()
    }
  })

  // 6. 作品库相关操作
  const btnRefreshAssets = document.getElementById('btn-refresh-assets')
  if (btnRefreshAssets) {
    btnRefreshAssets.onclick = () => void loadAssetsList(true)
  }

  document.querySelectorAll('[data-asset-filter]').forEach(b => {
    b.onclick = () => {
      const f = b.dataset.assetFilter
      if (creatorState.assets.filterType === f) return
      creatorState.assets.filterType = f
      void loadAssetsList(true)
    }
  })
}

async function loadAssetsList (force = false) {
  if (loadingAssets) return
  if (!force && creatorState.assets.hasLoaded) return
  loadingAssets = true
  creatorState.assets.loading = true
  if (creatorState.currentTab === 'assets') {
    render()
  }

  try {
    const list = await window.creatorApi.listAssets({
      type: creatorState.assets.filterType
    })
    creatorState.assets.list = Array.isArray(list) ? list : []
    creatorState.assets.hasLoaded = true
  } catch (err) {
    toast(`加载作品库失败: ${err.message}`)
  } finally {
    loadingAssets = false
    creatorState.assets.loading = false
    if (creatorState.currentTab === 'assets') {
      render()
    }
  }
}

// 供页面点击代理调用
window.handleCreatorAction = async function (action, target) {
  if (action === 'open-video-file' || action === 'open-asset-media') {
    const p = target.dataset.path
    if (p) await window.creatorApi.openFile(p)
  } else if (action === 'delete-asset') {
    const id = target.dataset.id
    if (id && confirm('确定要删除该作品吗？')) {
      await window.creatorApi.deleteAsset(id)
      await loadAssetsList(true)
      toast('作品已删除')
    }
  } else if (action === 'publish-asset') {
    const id = target.dataset.id
    const asset = (creatorState.assets.list || []).find(i => i.id === id)
    if (!asset) return
    showPublishDialog(asset)
  } else if (action === 'pick-title') {
    creatorState.article.selectedTitle = target.dataset.title
    render()
  } else if (action === 'fix-sensitive') {
    const word = target.dataset.word
    const rep = target.dataset.replace
    const editor = document.getElementById('creator-article-editor')
    if (editor && word && rep) {
      editor.value = editor.value.replaceAll(word, rep)
      creatorState.article.content = editor.value
      creatorState.article.complianceResult = await window.creatorApi.checkCompliance(editor.value)
      render()
      toast(`已将“${word}”自动优化替换为“${rep}”`)
    }
  }
}

function showPublishDialog (asset) {
  const envList = environments || []
  const dialogHtml = `
    <div class="publish-dialog-content">
      <p style="margin-bottom:12px; color:var(--muted);">即将把作品 <b>【${escapeHTML(asset.title)}】</b> 推送到指纹浏览器的独立隔离环境中发布：</p>
      
      <div class="form-group">
        <label>选择绑定的指纹浏览器环境：</label>
        <select id="publish-env-select" class="input">
          ${envList.map(e => `
            <option value="${e.id}">${escapeHTML(e.name)} (${e.state || '已保存'})</option>
          `).join('')}
        </select>
      </div>

      <div class="publish-summary-card">
        <div><b>目标平台：</b> ${asset.targetPlatform || '小红书'}</div>
        <div><b>作品类型：</b> ${asset.type === 'video' ? '视频' : asset.type === 'article' ? '图文文章' : '动态贴图'}</div>
        <div><b>附件文件数：</b> ${asset.mediaFiles?.length || 0} 个媒体文件</div>
      </div>
    </div>
  `

  dialog(
    '一键推送到环境发布',
    dialogHtml,
    `
      <button class="button" data-action="close-overlay">取消</button>
      <button class="button primary" id="btn-confirm-publish">🚀 打开环境创作者后台</button>
    `
  )

  setTimeout(() => {
    const confirmBtn = document.getElementById('btn-confirm-publish')
    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        const envId = document.getElementById('publish-env-select')?.value
        if (!envId) return toast('请先选择一个环境')
        closeOverlay()
        toast('正在独立环境中调起创作者中心...')
        try {
          const res = await window.creatorApi.preparePublish({ environmentId: envId, asset })
          toast(`已在环境标签中打开创作者后台: ${res.creatorUrl}`)
          navigate('environments')
        } catch (err) {
          toast(`调起发布失败: ${err.message}`)
        }
      }
    }
  }, 50)
}
