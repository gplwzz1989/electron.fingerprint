;(function (root) {
  'use strict'

  function safeEscapeHTML (val) {
    if (val === null || val === undefined) return ''
    return String(val).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]))
  }
  const escapeHTML = safeEscapeHTML

// ===================== 创作者中心商业级状态机 =====================
const creatorState = {
  currentTab: 'video', // 'video' | 'article' | 'post' | 'assets'
  // 1. 视频创作状态 (围绕 FFmpeg + 下载视频素材)
  video: {
    topic: '2026年爆火的3个AI副业，普通人如何弯道超车？',
    duration: 15,
    aspectRatio: '9:16', // '9:16' | '16:9'
    enableBlurBg: true, // 高斯模糊背景画幅填充
    enableSubtitles: true, // 烙印自媒体大字字幕
    antiDuplication: true, // 去重调色微调
    generating: false,
    rendering: false,
    storyboard: null,
    renderedResult: null,
    downloadedMedia: [], // 从 Media Hub 扫描到的视频与图片素材
    selectedMaterials: [], // 当前选用于混剪的素材路径列表
    loadingMedia: false
  },
  // 2. 微信公众号文章创作状态 (Doocs/md 源码级微信 Markdown 排版引擎)
  article: {
    topic: '自媒体高效运营：如何构建自动化增长飞轮？',
    platform: 'wechat',
    style: '干货',
    keywords: '效率, 增长, 自动化',
    generating: false,
    checking: false,
    candidateTitles: [],
    selectedTitle: '',
    themeId: 'default', // 'default' | 'orange' | 'blue' | 'purple' | 'dark'
    fontSize: '16px', // '14px' | '15px' | '16px' | '17px'
    markdown: '', // 存储用户编辑的 Markdown 源码
    renderedHtml: '', // Doocs 编译出的 HTML
    tags: [],
    complianceResult: null
  },
  // 3. 图文创作状态 (标题 + 富文本 + 多张图片 + 手机模拟器)
  post: {
    title: '🔥 亲测有效！普通人做自媒体的3个破局思考',
    content: `很多宝子在后台问我，为什么每天很努力日更，却始终没有正反馈？

今天把我实操总结的 3 个关键破局点分享出来：
1️⃣ 不要盲目追求全网铺量，先在单一平台吃透一种内容形式；
2️⃣ 建立自己的可复用素材库，拒绝纯手工无效搬砖；
3️⃣ 评论区才是真正的转化黄金地带，重视每一次读者互动！

坚持做好这三点，30天后回来看效果～✨

#自媒体干货 #搞钱思路 #个人成长 #爆款笔记`,
    images: [], // 多张图片本地绝对路径或 DataURL 列表
    coverIndex: 0,
    tags: ['#自媒体干货', '#搞钱思路', '#个人成长', '#爆款笔记'],
    platform: 'xiaohongshu',
    carouselIndex: 0, // 手机端模拟器当前展示的图片索引
    saving: false
  },
  // 4. 作品库状态
  assets: {
    filterType: 'all',
    list: [],
    loading: false,
    hasLoaded: false
  }
}

let loadingAssets = false

/**
 * 创作中心主视图渲染入口
 */
function creatorPage () {
  return `
    <div class="creator-hub-container">
      <div class="creator-header">
        <div class="creator-header-left">
          <h2><span>🎨</span> AI 创作中心</h2>
          <p class="section-desc">FFmpeg 智能混剪 · Doocs/md 微信公众号排版 · 矩阵多图笔记</p>
        </div>
        <div class="creator-tabs-nav" role="tablist">
          <button class="creator-tab-btn ${creatorState.currentTab === 'video' ? 'active' : ''}" data-creator-tab="video">🎬 视频创作 (FFmpeg)</button>
          <button class="creator-tab-btn ${creatorState.currentTab === 'article' ? 'active' : ''}" data-creator-tab="article">📝 公众号排版 (微信图文)</button>
          <button class="creator-tab-btn ${creatorState.currentTab === 'post' ? 'active' : ''}" data-creator-tab="post">📱 矩阵图文 (标题+多图)</button>
          <button class="creator-tab-btn ${creatorState.currentTab === 'assets' ? 'active' : ''}" data-creator-tab="assets">📦 作品资产库</button>
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

/* ====================================================================
 * 1. 视频创作模块 (围绕 FFmpeg + 下载视频素材展开，全视口双栏无上下翻滚)
 * ==================================================================== */
function renderVideoStudio () {
  const v = creatorState.video
  const sb = v.storyboard
  const mediaList = v.downloadedMedia.filter(m => m.type === 'video')

  return `
    <div class="creator-studio-grid">
      <!-- 左栏：视频素材池与参数配置 -->
      <div class="card creator-form-card">
        <div class="card-header">
          <h3>1. 视频素材池与参数</h3>
          <span class="badge blue">FFmpeg 真实渲染</span>
        </div>

        <div class="creator-form-scrollable">
          <!-- 素材库选择区 -->
          <div class="material-selector-card">
            <div class="material-selector-header">
              <h4>📦 素材视频池 (${mediaList.length} 个)</h4>
              <div style="display:flex;gap:4px;">
                <button class="button small" id="btn-refresh-media" title="扫描下载素材">🔄 刷新</button>
                <button class="button small primary" id="btn-add-local-video" title="从电脑选择本地视频">📂 添加本地</button>
              </div>
            </div>

            ${mediaList.length === 0 ? `
              <div style="padding:10px 8px;text-align:center;font-size:11px;color:var(--muted);background:#fff;border-radius:6px;border:1px dashed #cbd5e1;">
                暂无视频素材，可从网页标签嗅探下载或添加本地视频
              </div>
            ` : `
              <div class="material-items-grid">
                ${mediaList.map(m => {
                  const isSelected = v.selectedMaterials.includes(m.filePath)
                  return `
                    <div class="material-thumb-card ${isSelected ? 'selected' : ''}" data-action="toggle-material" data-path="${escapeHTML(m.filePath)}">
                      <span class="material-check-badge">${isSelected ? '✅' : '⚪'}</span>
                      <div class="material-thumb-icon">🎬</div>
                      <div class="material-thumb-name" title="${escapeHTML(m.fileName)}">${escapeHTML(m.fileName)}</div>
                      <div class="material-thumb-meta">
                        <span>${(m.fileSize / 1024 / 1024).toFixed(1)}MB</span>
                        <span>${m.ext}</span>
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
            `}
          </div>

          <div class="form-group">
            <label>短视频核心主题 / 关键词</label>
            <input id="creator-video-topic" class="input" value="${escapeHTML(v.topic)}" placeholder="输入想做的短视频核心主题...">
          </div>

          <div class="form-group">
            <label>期望总时长</label>
            <div class="radio-pills-row">
              <label><input type="radio" name="video-duration" value="15" ${v.duration === 15 ? 'checked' : ''}> 15秒 (黄金爆款)</label>
              <label><input type="radio" name="video-duration" value="30" ${v.duration === 30 ? 'checked' : ''}> 30秒 (干货总结)</label>
              <label><input type="radio" name="video-duration" value="60" ${v.duration === 60 ? 'checked' : ''}> 60秒 (深度知识)</label>
            </div>
          </div>

          <div class="form-group">
            <label>画幅规格与渲染效果</label>
            <div style="display:flex;gap:12px;margin-bottom:4px;">
              <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="radio" name="video-aspect" value="9:16" ${v.aspectRatio === '9:16' ? 'checked' : ''}> 9:16 (抖音/小红书 1080x1920)
              </label>
              <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="radio" name="video-aspect" value="16:9" ${v.aspectRatio === '16:9' ? 'checked' : ''}> 16:9 (B站/横屏 1920x1080)
              </label>
            </div>
            <div class="compact-switches-box">
              <label>
                <input type="checkbox" id="video-blur-bg" ${v.enableBlurBg ? 'checked' : ''}> 🌟 智能高斯模糊背景填充 (横屏转竖屏不畸变)
              </label>
              <label>
                <input type="checkbox" id="video-subtitles" ${v.enableSubtitles ? 'checked' : ''}> 💬 自动烙印自媒体大字字幕 (居中安全防出界)
              </label>
              <label>
                <input type="checkbox" id="video-antidup" ${v.antiDuplication ? 'checked' : ''}> 🛡️ 原创去重调色与画质增强微调
              </label>
            </div>
          </div>
        </div>

        <!-- 固定吸底操作栏 (无需滚动，永远在手边) -->
        <div class="creator-card-footer">
          <button class="button primary" id="btn-generate-storyboard" style="width:100%;" ${v.generating ? 'disabled' : ''}>
            ${v.generating ? '正在智能拆解分镜...' : '✨ 一键生成分镜脚本与素材映射'}
          </button>
        </div>
      </div>

      <!-- 右栏：分镜时间线与成片视窗 -->
      <div class="card creator-preview-card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <h3>2. 分镜时间线与成片视窗</h3>
            ${sb ? `<span class="badge green">${sb.scenes.length} 个分镜</span>` : ''}
          </div>
          ${sb ? `
            <button class="button small primary" id="btn-render-video-head" ${v.rendering ? 'disabled' : ''} title="调度 FFmpeg 开始高清短视频合成">
              ${v.rendering ? '正在渲染成片...' : '🚀 开始 FFmpeg 剪辑渲染'}
            </button>
          ` : ''}
        </div>

        <div class="creator-preview-scrollable">
          ${v.renderedResult ? `
            <div class="rendered-video-wrap">
              <div class="rendered-success-box">
                <div class="rendered-info">
                  <h4>✅ 短视频已成功渲染导出！</h4>
                  <p>大小：${(v.renderedResult.fileSize / 1024 / 1024).toFixed(2)} MB · 时长：${v.renderedResult.duration}秒 · 分辨率：${v.renderedResult.width}×${v.renderedResult.height}</p>
                  <p>路径：<code>${escapeHTML(v.renderedResult.outputPath)}</code></p>
                </div>
              </div>
              <!-- 成片原生播放器 -->
              <video class="rendered-video-player" src="file://${v.renderedResult.outputPath.replace(/\\/g, '/')}" controls autoplay></video>
            </div>
          ` : ''}

          ${!sb ? `
            <div class="creator-empty-box">
              <span class="empty-icon">🎬</span>
              <p>在左侧选择视频素材并点击“一键生成分镜脚本”，右侧将自动展开时间线并可一键渲染</p>
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

                  <div class="scene-material-bar">
                    <label>素材：</label>
                    <select class="scene-mat-select" data-scene-idx="${idx}">
                      <option value="">-- 自动分配勾选的素材 --</option>
                      ${mediaList.map(m => `
                        <option value="${escapeHTML(m.filePath)}" ${s.materialPath === m.filePath ? 'selected' : ''}>
                          ${escapeHTML(m.fileName)} (${(m.fileSize / 1024 / 1024).toFixed(1)}MB)
                        </option>
                      `).join('')}
                    </select>
                    <label style="margin-left:4px;">起始点：</label>
                    <input type="number" class="input scene-start-time" data-scene-idx="${idx}" value="${s.startTime || 0}" style="width:55px;padding:2px 4px;font-size:11px;" min="0" step="1"> s
                  </div>

                  <div class="storyboard-voiceover">
                    <textarea class="input scene-text-input" data-scene-idx="${idx}" placeholder="旁白字幕文案...">${escapeHTML(s.voiceover)}</textarea>
                  </div>
                  <div class="storyboard-prompt">💡 视觉提示：${escapeHTML(s.visualPrompt)}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- 固定吸底操作栏 (成片保存与推送发布随时可点) -->
        ${sb || v.renderedResult ? `
          <div class="creator-card-footer">
            ${v.renderedResult ? `
              <div style="display:flex;gap:8px;">
                <button class="button small" data-action="open-video-file" data-path="${escapeHTML(v.renderedResult.outputPath)}">📂 打开文件夹</button>
                <button class="button small primary" id="btn-save-video-asset">💾 存入作品库</button>
              </div>
              <button class="button small primary" id="btn-publish-rendered-direct" title="推送到环境创作者后台一键发布">🚀 推送环境发布</button>
            ` : `
              <div style="font-size:11px;color:var(--muted);">调整完分镜旁白后，点击右上角或右下角按钮直接渲染 ➔</div>
              <button class="button primary" id="btn-render-video" ${v.rendering ? 'disabled' : ''}>
                ${v.rendering ? '正在渲染中...' : '🚀 调度 FFmpeg 渲染成片'}
              </button>
            `}
          </div>
        ` : ''}
      </div>
    </div>
  `
}

/* ====================================================================
 * 2. 文章创作模块 (Doocs/md 源码级微信 Markdown 实时排版与图文环绕)
 * ==================================================================== */
function renderArticleStudio () {
  const a = creatorState.article
  const comp = a.complianceResult
  const md = a.markdown || getDefaultDoocsMarkdown(a.topic)
  if (!a.markdown) a.markdown = md

  // 调用 DoocsParser 源码级渲染引擎编译微信富文本
  const ParserClass = typeof DoocsParser !== 'undefined'
    ? DoocsParser
    : (typeof window !== 'undefined' && window.DoocsParser ? window.DoocsParser : (typeof globalThis !== 'undefined' ? globalThis.DoocsParser : null))
  const parser = ParserClass ? new ParserClass({ themeId: a.themeId, fontSize: a.fontSize }) : null
  const renderedHtml = parser ? parser.render(md) : md
  a.renderedHtml = renderedHtml

  return `
    <div class="doocs-studio-container">
      <!-- 顶部控制条：主题切换、字号设置与一键复制 -->
      <div class="doocs-top-header">
        <div class="doocs-controls-group">
          <span style="font-size:12px;font-weight:600;color:#1e293b;display:flex;align-items:center;gap:4px;">
            <span>🎨</span> 排版主题：
          </span>
          <select id="doocs-theme-select" class="doocs-theme-select">
            <option value="default" ${a.themeId === 'default' ? 'selected' : ''}>🌿 经典微信绿 (官方推荐)</option>
            <option value="orange" ${a.themeId === 'orange' ? 'selected' : ''}>🍊 活力自媒体橙 (爆款吸睛)</option>
            <option value="blue" ${a.themeId === 'blue' ? 'selected' : ''}>🔷 极客干货蓝 (科技专业)</option>
            <option value="purple" ${a.themeId === 'purple' ? 'selected' : ''}>🔮 优雅深邃紫 (深度思考)</option>
            <option value="dark" ${a.themeId === 'dark' ? 'selected' : ''}>🖤 极简纯粹黑 (冷淡简约)</option>
          </select>

          <span style="font-size:12px;font-weight:600;color:#1e293b;margin-left:8px;">字号：</span>
          <select id="doocs-font-select" class="doocs-font-select">
            <option value="16px" ${a.fontSize === '16px' ? 'selected' : ''}>16px (经典正文)</option>
            <option value="14px" ${a.fontSize === '14px' ? 'selected' : ''}>14px (注脚小字)</option>
            <option value="15px" ${a.fontSize === '15px' ? 'selected' : ''}>15px (清新小字)</option>
            <option value="17px" ${a.fontSize === '17px' ? 'selected' : ''}>17px (长辈舒适)</option>
          </select>
        </div>

        <div style="display:flex;gap:8px;align-items:center;">
          <button class="button small" id="btn-audit-compliance">🛡️ 风控自检</button>
          <button class="button small primary" id="btn-copy-wechat-html" title="将带有完全内联样式的微信排版复制到剪贴板，去微信公众平台编辑器按 Ctrl+V 直接粘贴">
            📋 一键复制微信排版
          </button>
          <button class="button small" id="btn-save-article-asset">💾 存入作品库</button>
        </div>
      </div>

      <!-- Doocs 经典双栏工作台：左栏 Markdown 编辑 + 右栏 微信真机排版实时预览 -->
      <div class="doocs-dual-workspace">
        <!-- 左栏：Markdown 源码编辑区 -->
        <div class="doocs-pane-card">
          <div class="doocs-pane-header">
            <span>📝 Markdown 源码编辑器 (支持图文环绕语法)</span>
            <span style="font-size:11px;color:var(--muted);font-weight:normal;">输入即刻实时排版</span>
          </div>

          <!-- Markdown 快捷工具栏 -->
          <div class="doocs-md-toolbar">
            <button class="tb-btn" data-md-action="h1" title="大标题 H1"><b>H1</b></button>
            <button class="tb-btn" data-md-action="h2" title="主标题 H2"><b>H2</b></button>
            <button class="tb-btn" data-md-action="h3" title="小标题 H3"><b>H3</b></button>
            <span class="tb-divider"></span>
            <button class="tb-btn" data-md-action="bold" title="加粗"><b>B</b></button>
            <button class="tb-btn" data-md-action="italic" title="斜体"><i>I</i></button>
            <button class="tb-btn" data-md-action="quote" title="引用金句">&gt;</button>
            <button class="tb-btn" data-md-action="code" title="代码块">&lt;/&gt;</button>
            <button class="tb-btn" data-md-action="table" title="插入表格">▦</button>
            <span class="tb-divider"></span>
            <button class="tb-btn" data-md-action="img-left" title="插入左侧环绕图 (![说明](url#left))">👈 左环绕图</button>
            <button class="tb-btn" data-md-action="img-right" title="插入右侧环绕图 (![说明](url#right))">👉 右环绕图</button>
            <button class="tb-btn" data-md-action="img-center" title="插入居中大图 (![说明](url#center))">🔲 居中图</button>
            <button class="tb-btn" id="btn-insert-local-image" title="从电脑选择本地图片并插入">📂 本地选图</button>
          </div>

          <!-- Markdown 多行编辑框 -->
          <textarea id="doocs-md-editor" class="doocs-md-textarea" placeholder="在此输入 Markdown 格式正文..." spellcheck="false">${escapeHTML(md)}</textarea>

          <!-- 底部爆款大纲生成栏 -->
          <div style="padding:10px 14px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;gap:8px;align-items:center;">
            <input id="creator-article-topic" class="input" style="font-size:11px;" value="${escapeHTML(a.topic)}" placeholder="输入主题，一键生成爆款公众号大纲...">
            <button class="button small primary" id="btn-generate-article" style="white-space:nowrap;" ${a.generating ? 'disabled' : ''}>
              ${a.generating ? '生成中...' : '🤖 一键生成大纲'}
            </button>
          </div>
        </div>

        <!-- 右栏：微信公众号排版真实视窗 -->
        <div class="doocs-pane-card">
          <div class="doocs-pane-header">
            <span>📱 微信公众号排版实时视窗</span>
            <span style="font-size:11px;color:#07c160;font-weight:bold;">✅ Inline CSS 100% 微信无损兼容</span>
          </div>

          <!-- 微信富文本预览滚动区 -->
          <div class="doocs-preview-scroll">
            <div id="doocs-preview-content" class="doocs-preview-inner">
              ${renderedHtml}
            </div>
          </div>

          <!-- 底部排版统计信息 -->
          <div class="doocs-footer-stats">
            <span id="doocs-word-count">字数：0 字</span>
            <span id="doocs-read-time">预估阅读：约 1 分钟</span>
            <span id="doocs-img-count">配图：0 张</span>
          </div>
        </div>
      </div>

      <!-- 下方风控自检提示（如存在敏感词） -->
      ${comp ? `
        <div class="compliance-panel ${comp.ok ? 'safe' : 'warn'}" style="margin-top:6px;">
          <div class="comp-header">
            <span>🛡️ 微信公众号风控合规评分：<b>${comp.score} 分</b></span>
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
  `
}

function getDefaultDoocsMarkdown (topic) {
  const safeTopic = topic || '自媒体高效运营'
  return `# 01 / 认知跃迁：自媒体如何构建自动化复利飞轮？

在信息高度密集的当下，关于【**${safeTopic}**】的探讨层出不穷。很多人经常陷入“低水平勤奋”的怪圈：每天耗费大量精力写稿、找素材，却始终得不到正向的数据反馈。

其实，真正拉开差距的，是对内容结构的深度思考与排版呈现的质感。

## 关键破局点：文字与图片的混合环绕

通过在文章中巧妙利用文字环绕插图流动，可以瞬间打破长篇纯文字的枯燥沉闷，极大提升读者在微信环境中的完读率。

![高效团队协作插图](https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80#left "图：数字化协作流程")

通过左侧浮动插图，文字在右侧自然环绕展开。读者在视线移动过程中，插图天然构成了视觉停留锚点。这种排版方式是顶级商业期刊与头部公众号的标志性版式。

> 真正拉开人与人之间差距的，不是获取信息的多少，而是穿透表象的深度思考与持续落地能力。

## 实操打法：三步建立正向反馈闭环

1. **精准锚定痛点**：单点深挖，拒绝泛化；
2. **工具赋能流程**：用自动化工具代替手工搬砖；
3. **建立资产沉淀**：让每一次创作都沉淀为数字资产。

![数据增长曲线图](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80#right "图：持续正向复利曲线")

右侧浮动插图与左侧实操结论形成强有力的视觉呼应。不仅让观点更有说服力，也让版面错落有致。

\`\`\`javascript
// 自动化创作闭环示意
const flywheel = {
  input: "爆款选题与下载素材",
  process: "FFmpeg视频切片 + Doocs公众号排版",
  output: "一键无损发布至多环境矩阵"
};
\`\`\`

| 核心维度 | 传统手工搬砖 | 栖界 AI 创作中心 |
| :--- | :--- | :--- |
| **视频生产** | 剪辑 2 小时 | FFmpeg 自动切片混剪秒级出片 |
| **公众号排版** | 排版 1 小时 | Doocs 源码级主题一键复制保真 |
| **矩阵分发** | 逐个平台手动传 | 指纹浏览器隔离环境一键直达 |

---

🌟 **关注我们 · 持续收获深度干货**  
如果本文对你有所启发，欢迎点击右上角分享给身边的朋友，顺手点个【在看】支持一下！`
}

/* ====================================================================
 * 3. 图文创作模块 (标题 + 富文本 + 多张图片 + 手机真实模拟器)
 * ==================================================================== */
function renderPostStudio () {
  const p = creatorState.post
  const titleLen = p.title.length
  const contentLen = p.content.length
  const activeImage = p.images[p.carouselIndex] || p.images[0] || null

  return `
    <div class="post-studio-grid">
      <!-- 左侧：图文创作表单 (带吸底固定操作栏) -->
      <div class="card creator-form-card">
        <div class="card-header">
          <h3>1. 图文笔记配置 (小红书/抖音图文标准)</h3>
          <span class="badge blue">标题 + 富文本 + 多张图片</span>
        </div>

        <div class="creator-form-scrollable">
          <!-- 1. 吸睛大标题 -->
          <div class="form-group">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label>笔记标题 (字数推荐 15~20 字)</label>
              <span class="char-counter" style="font-size:11px;color:${titleLen > 20 ? '#ef4444' : 'var(--muted)'};font-weight:600;">
                ${titleLen}/20 字
              </span>
            </div>
            <input id="creator-post-title" class="input" style="font-size:13px;font-weight:600;" value="${escapeHTML(p.title)}" placeholder="输入能够抓住眼球的爆款标题...">
            
            <!-- 快捷 Emoji 表情条 -->
            <div class="emoji-quick-bar">
              ${['🔥', '✨', '📌', '🥑', '💡', '⚠️', '💯', '🍵', '🚀', '💰', '🎁', '👇', '🎯'].map(e => `
                <button class="emoji-btn" data-action="insert-post-emoji" data-emoji="${e}">${e}</button>
              `).join('')}
            </div>
          </div>

          <!-- 2. 多张图片管理 (横向滑动轨道，紧凑不占垂直空间) -->
          <div class="form-group multi-image-uploader">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label>图片素材列表 (${p.images.length}/18 张 · 首张为封面)</label>
              <div style="display:flex;gap:4px;">
                <button class="button small" id="btn-import-media-images">📥 从素材库导入</button>
                <button class="button small primary" id="btn-add-local-images">📂 本地多选</button>
              </div>
            </div>

            <div class="multi-image-scroll-track">
              ${p.images.map((img, idx) => `
                <div class="image-slot-card">
                  <img src="${img.startsWith('data:') || img.startsWith('http') ? img : `file://${img.replace(/\\/g, '/')}`}" alt="图 ${idx + 1}" />
                  ${idx === 0 ? `<span class="image-cover-badge">封面</span>` : ''}
                  <div class="image-slot-actions">
                    ${idx > 0 ? `<button class="image-slot-btn" data-action="move-image-left" data-idx="${idx}" title="前移">◀</button>` : ''}
                    ${idx < p.images.length - 1 ? `<button class="image-slot-btn" data-action="move-image-right" data-idx="${idx}" title="后移">▶</button>` : ''}
                    <button class="image-slot-btn" data-action="remove-post-image" data-idx="${idx}" title="删除">❌</button>
                  </div>
                </div>
              `).join('')}

              ${p.images.length < 18 ? `
                <div class="image-add-btn" id="btn-add-img-slot" title="添加新图片">
                  <span style="font-size:16px;">➕</span>
                  <span style="font-size:9px;">加图</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- 3. 正文富文本说明 -->
          <div class="form-group" style="flex:1;min-height:0;display:flex;flex-direction:column;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label>正文说明文案</label>
              <span class="char-counter" style="font-size:11px;color:var(--muted);">${contentLen}/1000 字</span>
            </div>
            <textarea id="creator-post-content" class="input" style="flex:1;min-height:100px;line-height:1.6;font-size:12px;resize:none;" placeholder="在此输入详细笔记内容...">${escapeHTML(p.content)}</textarea>
            
            <!-- 热门话题快捷栏 -->
            <div class="tag-quick-bar">
              ${['#自媒体干货', '#搞钱思路', '#个人成长', '#爆款笔记', '#效率工具', '#新手自媒体'].map(tag => `
                <button class="topic-tag-btn" data-action="insert-post-tag" data-tag="${tag}">${tag}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 固定吸底操作栏 (永远在手边) -->
        <div class="creator-card-footer">
          <div style="font-size:11px;color:var(--muted);">右侧模拟器实时同步呈现 ➔</div>
          <div style="display:flex;gap:8px;">
            <button class="button primary" id="btn-save-post-asset" ${p.saving ? 'disabled' : ''}>
              ${p.saving ? '正在保存...' : '💾 保存至作品库'}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：真实手机模拟器 (Mobile Real-Device Simulator) -->
      <div class="mobile-simulator-wrapper">
        <div class="phone-mockup">
          <div class="phone-screen">
            <!-- 手机顶部状态栏 -->
            <div class="phone-status-bar">
              <span>09:41</span>
              <div class="phone-island"></div>
              <span>📶 5G 88%</span>
            </div>

            <!-- 手机导航栏 -->
            <div class="phone-top-nav">
              <div class="phone-author-box">
                <div class="phone-avatar">栖</div>
                <div class="phone-author-name">栖界创作官</div>
                <button class="phone-follow-btn">+ 关注</button>
              </div>
              <span style="font-size:16px;color:#64748b;cursor:pointer;">↗️</span>
            </div>

            <!-- 手机滚动内容视窗 -->
            <div class="phone-content-scroll">
              <!-- 多图轮播区域 (交互式) -->
              <div class="phone-carousel-wrap">
                ${activeImage ? `
                  <img class="phone-carousel-img" src="${activeImage.startsWith('data:') || activeImage.startsWith('http') ? activeImage : `file://${activeImage.replace(/\\/g, '/')}`}" alt="轮播图" />
                  <div class="phone-carousel-page">${p.carouselIndex + 1}/${Math.max(1, p.images.length)}</div>
                  ${p.images.length > 1 ? `
                    <button class="phone-carousel-arrow prev" data-action="prev-carousel">‹</button>
                    <button class="phone-carousel-arrow next" data-action="next-carousel">›</button>
                    <div class="phone-carousel-dots">
                      ${p.images.map((_, i) => `
                        <span class="phone-dot ${i === p.carouselIndex ? 'active' : ''}"></span>
                      `).join('')}
                    </div>
                  ` : ''}
                ` : `
                  <div class="phone-carousel-empty">
                    <span style="font-size:36px;">🖼️</span>
                    <span>暂无图片，在左侧添加图片素材</span>
                    <span style="font-size:10px;color:#cbd5e1;">推荐 3:4 比例竖图</span>
                  </div>
                `}
              </div>

              <!-- 手机标题与正文 -->
              <div class="phone-body-box">
                <h4 class="phone-title">${escapeHTML(p.title || '标题在这里呈现...')}</h4>
                <p class="phone-text">${escapeHTML(p.content || '正文在这里呈现...')}</p>
                <div class="phone-time-stamp">刚刚发布 · IP 属地：上海</div>
              </div>
            </div>

            <!-- 手机底栏互动工具栏 -->
            <div class="phone-bottom-bar">
              <div class="phone-input-fake">说点什么...</div>
              <div class="phone-actions-icons">
                <span>❤️ 1.2w</span>
                <span>⭐ 8.9k</span>
                <span>💬 429</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

/* ====================================================================
 * 4. 作品与待发库模块
 * ==================================================================== */
function renderAssetsStudio () {
  const as = creatorState.assets
  const list = as.list || []

  return `
    <div class="assets-studio-container">
      <div class="assets-toolbar">
        <div class="filter-pills">
          <button class="pill ${as.filterType === 'all' ? 'active' : ''}" data-asset-filter="all">全部作品</button>
          <button class="pill ${as.filterType === 'video' ? 'active' : ''}" data-asset-filter="video">🎬 视频成片</button>
          <button class="pill ${as.filterType === 'article' ? 'active' : ''}" data-asset-filter="article">📝 公众号文章</button>
          <button class="pill ${as.filterType === 'post' ? 'active' : ''}" data-asset-filter="post">📱 图文笔记</button>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="button small" id="btn-refresh-assets">🔄 刷新列表</button>
        </div>
      </div>

      ${list.length === 0 ? `
        <div class="card" style="padding:60px 20px;text-align:center;">
          <span style="font-size:40px;">📦</span>
          <p style="color:var(--muted);margin-top:12px;">暂无创作作品，可前往视频创作、文章创作或图文创作生成作品</p>
        </div>
      ` : `
        <div class="assets-cards-grid">
          ${list.map(item => `
            <div class="card asset-item-card">
              <div class="asset-card-top">
                <span class="badge ${item.type === 'video' ? 'blue' : item.type === 'article' ? 'green' : 'purple'}">
                  ${item.type === 'video' ? '🎬 视频成片' : item.type === 'article' ? '📝 公众号图文' : '📱 图文笔记'}
                </span>
                <span class="asset-time">${new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 class="asset-title" title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</h4>
              <p class="asset-content-preview">${escapeHTML(item.content ? item.content.replace(/<[^>]+>/g, ' ').slice(0, 100) : '')}</p>
              
              <div class="asset-meta-tags">
                ${(item.tags || []).slice(0, 3).map(t => `<span class="tag-pill">${escapeHTML(t)}</span>`).join('')}
                ${item.mediaFiles?.length ? `<span class="tag-pill" style="background:#e0f2fe;color:#0369a1;">📎 ${item.mediaFiles.length} 个附件</span>` : ''}
              </div>

              <div class="asset-card-footer">
                ${item.mediaFiles?.[0] ? `
                  <button class="button small" data-action="open-asset-media" data-path="${escapeHTML(item.mediaFiles[0])}">📂 查看文件</button>
                ` : ''}
                <button class="button small primary" data-action="publish-asset" data-id="${item.id}">🚀 推送发布</button>
                <button class="button small" data-action="delete-asset" data-id="${item.id}" style="color:#dc2626;">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `
}

/* ====================================================================
 * 事件绑定与商业逻辑交互
 * ==================================================================== */
/**
 * 局部切换创作者工作台 Tab（彻底杜绝全局页面重刷与路由冲突）
 */
function switchCreatorTab (tab) {
  if (!tab) return
  creatorState.currentTab = tab

  if (typeof document === 'undefined') return

  // 1. 同步更新所有 Tab 按钮的激活状态
  document.querySelectorAll('[data-creator-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.creatorTab === tab)
  })

  // 2. 局部刷新内容容器 .creator-body
  const bodyEl = document.querySelector('.creator-body')
  if (bodyEl) {
    bodyEl.innerHTML = renderCurrentCreatorTab()
  }

  // 3. 针对当前 Tab 重新绑定专属事件
  if (tab === 'video') {
    bindVideoEvents()
    if (creatorState.video.downloadedMedia.length === 0) void loadDownloadedMedia()
  } else if (tab === 'article') {
    bindWechatEditorEvents()
  } else if (tab === 'post') {
    bindPostStudioEvents()
  } else if (tab === 'assets') {
    bindAssetsEvents()
    void loadAssetsList(true)
  }
}

if (typeof window !== 'undefined') {
  window.switchCreatorTab = switchCreatorTab
}

function attachCreatorEvents () {
  // 1. Tab 切换
  document.querySelectorAll('[data-creator-tab]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      switchCreatorTab(btn.dataset.creatorTab)
    }
  })

  // 2. 根据当前激活 Tab 初始化
  if (creatorState.currentTab === 'video') {
    bindVideoEvents()
    if (creatorState.video.downloadedMedia.length === 0) void loadDownloadedMedia()
  } else if (creatorState.currentTab === 'article') {
    bindWechatEditorEvents()
  } else if (creatorState.currentTab === 'post') {
    bindPostStudioEvents()
  } else if (creatorState.currentTab === 'assets') {
    bindAssetsEvents()
    void loadAssetsList(false)
  }
}

// 全局捕获阶段拦截，双重保障点击绝对灵敏生效
if (typeof document !== 'undefined') {
  document.addEventListener('click', event => {
    const btn = event.target.closest('[data-creator-tab]')
    if (btn) {
      event.preventDefault()
      event.stopPropagation()
      switchCreatorTab(btn.dataset.creatorTab)
    }
  }, true)
}

// 扫描下载素材库
async function loadDownloadedMedia () {
  if (!window.creatorApi || !window.creatorApi.listDownloadedMedia) return
  creatorState.video.loadingMedia = true
  try {
    const list = await window.creatorApi.listDownloadedMedia()
    creatorState.video.downloadedMedia = Array.isArray(list) ? list : []
    // 默认如果已有素材且未选过，默认全选或选前3个
    if (creatorState.video.selectedMaterials.length === 0 && creatorState.video.downloadedMedia.length > 0) {
      creatorState.video.selectedMaterials = creatorState.video.downloadedMedia.filter(m => m.type === 'video').slice(0, 4).map(m => m.filePath)
    }
    render()
  } catch (err) {
    console.warn('扫描下载素材失败:', err)
  } finally {
    creatorState.video.loadingMedia = false
  }
}

function bindVideoEvents () {
  // 刷新下载素材
  const btnRefreshMedia = document.getElementById('btn-refresh-media')
  if (btnRefreshMedia) {
    btnRefreshMedia.onclick = async () => {
      toast('正在扫描 Media Hub 下载库与系统素材...')
      await loadDownloadedMedia()
      toast(`已找到 ${creatorState.video.downloadedMedia.length} 个媒体素材`)
    }
  }

  // 本地添加视频
  const btnAddLocalVideo = document.getElementById('btn-add-local-video')
  if (btnAddLocalVideo) {
    btnAddLocalVideo.onclick = async () => {
      try {
        const res = await window.creatorApi.selectLocalFiles({ type: 'video', multi: true })
        if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
          for (const fp of res.filePaths) {
            const fileName = fp.split(/[\\/]/).pop()
            if (!creatorState.video.downloadedMedia.some(m => m.filePath === fp)) {
              creatorState.video.downloadedMedia.unshift({
                id: `local-${Date.now()}-${Math.random()}`,
                fileName,
                filePath: fp,
                type: 'video',
                fileSize: 1024 * 1024 * 10,
                mtime: Date.now(),
                ext: '.' + fileName.split('.').pop().toLowerCase()
              })
            }
            if (!creatorState.video.selectedMaterials.includes(fp)) {
              creatorState.video.selectedMaterials.push(fp)
            }
          }
          render()
          toast(`已成功导入 ${res.filePaths.length} 个本地视频素材`)
        }
      } catch (err) {
        toast(`导入视频失败: ${err.message}`)
      }
    }
  }

  // 视频主题与时长设置
  const inputTopic = document.getElementById('creator-video-topic')
  if (inputTopic) {
    inputTopic.oninput = e => { creatorState.video.topic = e.target.value }
  }

  document.querySelectorAll('input[name="video-duration"]').forEach(radio => {
    radio.onchange = e => { creatorState.video.duration = Number(e.target.value) || 15 }
  })

  document.querySelectorAll('input[name="video-aspect"]').forEach(radio => {
    radio.onchange = e => { creatorState.video.aspectRatio = e.target.value }
  })

  const chkBlurBg = document.getElementById('video-blur-bg')
  if (chkBlurBg) {
    chkBlurBg.onchange = e => { creatorState.video.enableBlurBg = e.target.checked }
  }
  const chkSubtitles = document.getElementById('video-subtitles')
  if (chkSubtitles) {
    chkSubtitles.onchange = e => { creatorState.video.enableSubtitles = e.target.checked }
  }
  const chkAntidup = document.getElementById('video-antidup')
  if (chkAntidup) {
    chkAntidup.onchange = e => { creatorState.video.antiDuplication = e.target.checked }
  }

  // 生成分镜
  const btnGenSb = document.getElementById('btn-generate-storyboard')
  if (btnGenSb) {
    btnGenSb.onclick = async () => {
      creatorState.video.generating = true
      switchCreatorTab('video')
      try {
        const sb = await window.creatorApi.generateStoryboard({
          topic: creatorState.video.topic,
          targetDuration: creatorState.video.duration
        })
        creatorState.video.storyboard = sb
        // 自动给每个分镜精准分配素材并顺延累计截取起始时间，彻底避免每个镜头重复第0秒
        const sel = creatorState.video.selectedMaterials
        if (sel.length > 0) {
          const matTimeMap = new Map()
          sb.scenes.forEach((s, idx) => {
            const mat = sel[idx % sel.length]
            s.materialPath = mat
            const currentT = matTimeMap.get(mat) || 0
            s.startTime = currentT
            matTimeMap.set(mat, currentT + (Number(s.durationSec) || 3))
          })
        }
      } catch (err) {
        toast(`生成分镜脚本失败: ${err.message}`)
      } finally {
        creatorState.video.generating = false
        switchCreatorTab('video')
      }
    }
  }

  // 分镜文字与素材修改
  document.querySelectorAll('.scene-text-input').forEach(t => {
    t.oninput = e => {
      const idx = Number(e.target.dataset.sceneIdx)
      if (creatorState.video.storyboard?.scenes?.[idx]) {
        creatorState.video.storyboard.scenes[idx].voiceover = e.target.value
      }
    }
  })

  document.querySelectorAll('.scene-mat-select').forEach(sel => {
    sel.onchange = e => {
      const idx = Number(e.target.dataset.sceneIdx)
      if (creatorState.video.storyboard?.scenes?.[idx]) {
        creatorState.video.storyboard.scenes[idx].materialPath = e.target.value
      }
    }
  })

  document.querySelectorAll('.scene-start-time').forEach(inp => {
    const updateTime = e => {
      const idx = Number(e.target.dataset.sceneIdx)
      if (creatorState.video.storyboard?.scenes?.[idx]) {
        creatorState.video.storyboard.scenes[idx].startTime = Math.max(0, Number(e.target.value) || 0)
      }
    }
    inp.oninput = updateTime
    inp.onchange = updateTime
  })

  // 渲染短视频（头部快捷按钮与底部吸底按钮统一处理）
  const handleRenderVideo = async () => {
    creatorState.video.rendering = true
    switchCreatorTab('video')
    toast('🚀 正在启动 FFmpeg 引擎执行精准切片、画幅高斯模糊与多镜头合成...')

    const isVertical = creatorState.video.aspectRatio === '9:16'
    const width = isVertical ? 1080 : 1920
    const height = isVertical ? 1920 : 1080

    try {
      // 若未提前生成分镜，自动生成并根据素材智能顺延分段
      let scenes = creatorState.video.storyboard?.scenes
      if (!scenes || scenes.length === 0) {
        const generated = await window.creatorApi.generateStoryboard({
          topic: creatorState.video.topic,
          targetDuration: creatorState.video.duration
        })
        creatorState.video.storyboard = generated
        scenes = generated.scenes
        const sel = creatorState.video.selectedMaterials
        if (sel.length > 0) {
          const matTimeMap = new Map()
          scenes.forEach((s, idx) => {
            const mat = sel[idx % sel.length]
            s.materialPath = mat
            const currentT = matTimeMap.get(mat) || 0
            s.startTime = currentT
            matTimeMap.set(mat, currentT + (Number(s.durationSec) || 3))
          })
        }
      }

      const res = await window.creatorApi.renderVideo({
        title: creatorState.video.topic,
        scenes,
        materials: creatorState.video.selectedMaterials,
        width,
        height,
        enableBlurBg: creatorState.video.enableBlurBg,
        enableSubtitles: creatorState.video.enableSubtitles,
        antiDuplication: creatorState.video.antiDuplication
      })
      creatorState.video.renderedResult = res
      toast('🎉 高清短视频渲染完成！可在页面中直接播放预览')
    } catch (err) {
      toast(`渲染失败: ${err.message}`)
    } finally {
      creatorState.video.rendering = false
      switchCreatorTab('video')
    }
  }

  const btnRenderVideo = document.getElementById('btn-render-video')
  if (btnRenderVideo) btnRenderVideo.onclick = handleRenderVideo
  const btnRenderVideoHead = document.getElementById('btn-render-video-head')
  if (btnRenderVideoHead) btnRenderVideoHead.onclick = handleRenderVideo

  // 存入作品库
  const btnSaveVideo = document.getElementById('btn-save-video-asset')
  if (btnSaveVideo) {
    btnSaveVideo.onclick = async () => {
      const res = creatorState.video.renderedResult
      if (!res) return
      try {
        await window.creatorApi.saveAsset({
          type: 'video',
          title: creatorState.video.topic,
          content: `规格：${res.width}x${res.height} · 时长：${res.duration}s`,
          mediaFiles: [res.outputPath],
          targetPlatform: 'douyin',
          tags: ['#短视频', '#AI创作', '#剪辑']
        })
        toast('✅ 视频成片已成功存入待发库！')
      } catch (err) {
        toast(`保存失败: ${err.message}`)
      }
    }
  }

  // 直接推送到环境发布
  const btnPublishRenderedDirect = document.getElementById('btn-publish-rendered-direct')
  if (btnPublishRenderedDirect) {
    btnPublishRenderedDirect.onclick = () => {
      const res = creatorState.video.renderedResult
      if (!res) return
      showPublishDialog({
        id: `temp-video-${Date.now()}`,
        type: 'video',
        title: creatorState.video.topic || 'AI 生成短视频',
        content: `规格：${res.width}x${res.height} · 时长：${res.duration}s`,
        mediaFiles: [res.outputPath],
        targetPlatform: 'douyin',
        tags: ['#短视频', '#AI创作', '#剪辑']
      })
    }
  }
}

function bindWechatEditorEvents () {
  const mdEditor = document.getElementById('doocs-md-editor')
  const previewContent = document.getElementById('doocs-preview-content')
  if (!mdEditor || !previewContent) return

  // 实时编译渲染与统计
  function updateDoocsPreview () {
    const md = mdEditor.value
    creatorState.article.markdown = md

    const ParserClass = typeof DoocsParser !== 'undefined'
      ? DoocsParser
      : (typeof window !== 'undefined' && window.DoocsParser ? window.DoocsParser : (typeof globalThis !== 'undefined' ? globalThis.DoocsParser : null))
    const parser = ParserClass
      ? new ParserClass({
        themeId: creatorState.article.themeId,
        fontSize: creatorState.article.fontSize
      })
      : null

    const html = parser ? parser.render(md) : md
    creatorState.article.renderedHtml = html
    previewContent.innerHTML = html

    // 更新字数与配图统计
    const plainText = md.replace(/[#*`~>|\-_[\]()!]/g, '').trim()
    const wordCount = plainText.length
    const imgCount = (md.match(/!\[.*?\]\(.*?\)/g) || []).length
    const readMinutes = Math.max(1, Math.ceil(wordCount / 400))

    const elWords = document.getElementById('doocs-word-count')
    const elRead = document.getElementById('doocs-read-time')
    const elImgs = document.getElementById('doocs-img-count')
    if (elWords) elWords.textContent = `字数：${wordCount} 字`
    if (elRead) elRead.textContent = `预估阅读：约 ${readMinutes} 分钟`
    if (elImgs) elImgs.textContent = `配图：${imgCount} 张`
  }

  updateDoocsPreview()

  // 监听 Markdown 输入
  mdEditor.oninput = () => updateDoocsPreview()

  // 主题切换下拉
  const selTheme = document.getElementById('doocs-theme-select')
  if (selTheme) {
    selTheme.onchange = e => {
      creatorState.article.themeId = e.target.value
      updateDoocsPreview()
      toast(`已切换为【${e.target.options[e.target.selectedIndex].text}】排版主题`)
    }
  }

  // 字号切换下拉
  const selFont = document.getElementById('doocs-font-select')
  if (selFont) {
    selFont.onchange = e => {
      creatorState.article.fontSize = e.target.value
      updateDoocsPreview()
      toast(`正文字号已设为 ${e.target.value}`)
    }
  }

  // 工具栏快捷插入助手函数
  function insertAtCursor (prefix, suffix = '', defaultText = '') {
    const start = mdEditor.selectionStart
    const end = mdEditor.selectionEnd
    const sel = mdEditor.value.substring(start, end) || defaultText
    const replacement = `${prefix}${sel}${suffix}`
    mdEditor.value = mdEditor.value.substring(0, start) + replacement + mdEditor.value.substring(end)
    mdEditor.focus()
    mdEditor.selectionStart = start + prefix.length
    mdEditor.selectionEnd = start + prefix.length + sel.length
    updateDoocsPreview()
  }

  // Markdown 工具栏动作
  document.querySelectorAll('[data-md-action]').forEach(btn => {
    btn.onclick = () => {
      const act = btn.dataset.mdAction
      if (act === 'h1') insertAtCursor('\n# ', '\n', '一级标题')
      else if (act === 'h2') insertAtCursor('\n## ', '\n', '二级标题')
      else if (act === 'h3') insertAtCursor('\n### ', '\n', '三级标题')
      else if (act === 'bold') insertAtCursor('**', '**', '加粗文本')
      else if (act === 'italic') insertAtCursor('*', '*', '斜体文本')
      else if (act === 'quote') insertAtCursor('\n> ', '\n', '引用金句卡片内容')
      else if (act === 'code') insertAtCursor('\n```javascript\n', '\n```\n', '// 在此输入代码片段')
      else if (act === 'table') insertAtCursor('\n| 列标题1 | 列标题2 | 列标题3 |\n| :--- | :--- | :--- |\n| 内容1 | 内容2 | 内容3 |\n')
      else if (act === 'img-left') insertAtCursor('\n![左侧环绕图](https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600#left "图：优雅图注说明")\n')
      else if (act === 'img-right') insertAtCursor('\n![右侧环绕图](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600#right "图：优雅图注说明")\n')
      else if (act === 'img-center') insertAtCursor('\n![居中大图](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800#center "图：居中全宽展示")\n')
    }
  })

  // 本地选图并以图文环绕格式插入
  const btnInsertLocalImg = document.getElementById('btn-insert-local-image')
  if (btnInsertLocalImg) {
    btnInsertLocalImg.onclick = async () => {
      try {
        const res = await window.creatorApi.selectLocalFiles({ type: 'image', multi: false })
        if (!res.canceled && res.filePaths?.[0]) {
          const filePath = res.filePaths[0]
          const fileName = filePath.split(/[\\/]/).pop()
          const fileUrl = `file://${filePath.replace(/\\/g, '/')}`
          insertAtCursor(`\n![${fileName}](${fileUrl}#left "图：${fileName}")\n`)
          toast('✅ 已插入本地图片并默认启用左侧文字环绕排版')
        }
      } catch (err) {
        toast(`插入图片异常: ${err.message}`)
      }
    }
  }

  // 一键复制微信公众号排版 (调用 Doocs 编译并内联样式，写入双 MIME 剪贴板)
  const btnCopyWechat = document.getElementById('btn-copy-wechat-html')
  if (btnCopyWechat) {
    btnCopyWechat.onclick = async () => {
      const html = creatorState.article.renderedHtml
      const currentMd = mdEditor ? mdEditor.value : creatorState.article.markdown
      const pureText = (currentMd || '').replace(/[#*`~>|\-_[\]()!]/g, '').trim()
      try {
        const copyFn = typeof copyWechatHtmlToClipboard === 'function' 
          ? copyWechatHtmlToClipboard 
          : (typeof window !== 'undefined' ? window.copyWechatHtmlToClipboard : null)

        if (copyFn) {
          await copyFn(html)
        } else {
          const inliner = typeof DoocsInliner !== 'undefined' ? DoocsInliner : (typeof window !== 'undefined' ? window.DoocsInliner : null)
          const inlined = inliner ? inliner.inlineHtml(html) : html
          const blob = new Blob([inlined], { type: 'text/html' })
          const textBlob = new Blob([pureText], { type: 'text/plain' })
          await navigator.clipboard.write([
            new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })
          ])
        }
        toast('🎉 已复制微信公众号富文本！直接在微信公众平台编辑器按 Ctrl+V 粘贴即可无损呈现排版')
      } catch (err) {
        toast(`复制失败: ${err.message}`)
      }
    }
  }

  // 生成爆款大纲（纯局部更新，输入框与右侧预览视窗即刻同步，绝不销毁全局页面）
  const btnGenArticle = document.getElementById('btn-generate-article')
  if (btnGenArticle) {
    btnGenArticle.onclick = async () => {
      const topicInput = document.getElementById('creator-article-topic')
      const topic = topicInput?.value || creatorState.article.topic
      creatorState.article.topic = topic
      creatorState.article.generating = true
      btnGenArticle.disabled = true
      btnGenArticle.textContent = '🤖 正在思考生成大纲...'

      try {
        const draft = await window.creatorApi.generateArticle({
          topic,
          platform: 'wechat',
          style: '干货'
        })
        creatorState.article.candidateTitles = draft.candidateTitles
        creatorState.article.selectedTitle = draft.selectedTitle
        const nextMd = `# ${draft.selectedTitle}\n\n${draft.content}\n\n---\n\n${(draft.tags || []).join(' ')}`
        creatorState.article.markdown = nextMd
        if (mdEditor) {
          mdEditor.value = nextMd
          updateDoocsPreview()
        }
        toast('✨ 已生成爆款大纲并完成图文排版！')
      } catch (err) {
        toast(`生成失败: ${err.message}`)
      } finally {
        creatorState.article.generating = false
        btnGenArticle.disabled = false
        btnGenArticle.textContent = '🤖 一键生成大纲'
      }
    }
  }

  // 风控自检
  const btnAuditComp = document.getElementById('btn-audit-compliance')
  if (btnAuditComp) {
    btnAuditComp.onclick = async () => {
      const text = mdEditor ? mdEditor.value : ''
      try {
        btnAuditComp.disabled = true
        btnAuditComp.textContent = '🛡️ 正在自检...'
        const comp = await window.creatorApi.checkCompliance(text)
        creatorState.article.complianceResult = comp
        switchCreatorTab('article')
        if (comp.ok) {
          toast('✅ 未发现平台违禁词，风控评分 100 分！')
        } else {
          toast(`⚠️ 检出 ${comp.hits.length} 处违规或敏感词，请参考建议优化`)
        }
      } catch (err) {
        toast(`检测失败: ${err.message}`)
      } finally {
        btnAuditComp.disabled = false
        btnAuditComp.textContent = '🛡️ 风控自检'
      }
    }
  }

  // 存入作品库
  const btnSaveArticle = document.getElementById('btn-save-article-asset')
  if (btnSaveArticle) {
    btnSaveArticle.onclick = async () => {
      try {
        await window.creatorApi.saveAsset({
          type: 'article',
          title: creatorState.article.selectedTitle || creatorState.article.topic,
          content: creatorState.article.markdown,
          targetPlatform: 'wechat',
          tags: ['#微信公众号', '#Doocs排版', '#干货']
        })
        toast('✅ 公众号文章已存入待发库！')
      } catch (err) {
        toast(`保存失败: ${err.message}`)
      }
    }
  }
}


function bindPostStudioEvents () {
  // 标题输入
  const inputTitle = document.getElementById('creator-post-title')
  if (inputTitle) {
    inputTitle.oninput = e => {
      creatorState.post.title = e.target.value
      // 实时更新手机模拟器
      const phoneTitle = document.querySelector('.phone-title')
      if (phoneTitle) phoneTitle.textContent = e.target.value || '标题在这里呈现...'
      const charCounter = document.querySelector('.char-counter')
      if (charCounter) {
        charCounter.textContent = `${e.target.value.length}/20 字`
        charCounter.style.color = e.target.value.length > 20 ? '#ef4444' : 'var(--muted)'
      }
    }
  }

  // 正文输入
  const inputContent = document.getElementById('creator-post-content')
  if (inputContent) {
    inputContent.oninput = e => {
      creatorState.post.content = e.target.value
      const phoneText = document.querySelector('.phone-text')
      if (phoneText) phoneText.textContent = e.target.value || '正文在这里呈现...'
    }
  }

  // 插入 Emoji
  document.querySelectorAll('[data-action="insert-post-emoji"]').forEach(b => {
    b.onclick = () => {
      const emoji = b.dataset.emoji
      if (inputTitle) {
        inputTitle.value += emoji
        inputTitle.dispatchEvent(new Event('input'))
      }
    }
  })

  // 插入话题标签
  document.querySelectorAll('[data-action="insert-post-tag"]').forEach(b => {
    b.onclick = () => {
      const tag = b.dataset.tag
      if (inputContent) {
        inputContent.value = (inputContent.value + ' ' + tag).trim()
        inputContent.dispatchEvent(new Event('input'))
      }
    }
  })

  // 本地多选图片
  const btnAddLocalImages = document.getElementById('btn-add-local-images')
  const btnAddImgSlot = document.getElementById('btn-add-img-slot')
  const handleSelectImages = async () => {
    try {
      const res = await window.creatorApi.selectLocalFiles({ type: 'image', multi: true })
      if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
        for (const fp of res.filePaths) {
          if (!creatorState.post.images.includes(fp) && creatorState.post.images.length < 18) {
            creatorState.post.images.push(fp)
          }
        }
        render()
        toast(`已添加 ${res.filePaths.length} 张图片到图文笔记画廊`)
      }
    } catch (err) {
      toast(`添加图片失败: ${err.message}`)
    }
  }

  if (btnAddLocalImages) btnAddLocalImages.onclick = handleSelectImages
  if (btnAddImgSlot) btnAddImgSlot.onclick = handleSelectImages

  // 从下载素材库导入图片
  const btnImportMediaImgs = document.getElementById('btn-import-media-images')
  if (btnImportMediaImgs) {
    btnImportMediaImgs.onclick = async () => {
      const imgs = creatorState.video.downloadedMedia.filter(m => m.type === 'image')
      if (imgs.length === 0) {
        await loadDownloadedMedia()
      }
      const refreshedImgs = creatorState.video.downloadedMedia.filter(m => m.type === 'image')
      if (refreshedImgs.length === 0) {
        return toast('当前未检测到下载库中的图片素材，可使用本地上传添加')
      }
      let added = 0
      for (const m of refreshedImgs) {
        if (!creatorState.post.images.includes(m.filePath) && creatorState.post.images.length < 18) {
          creatorState.post.images.push(m.filePath)
          added++
        }
      }
      render()
      toast(`已从下载素材库成功导入 ${added} 张图片！`)
    }
  }

  // 手机轮播图左右翻页
  const prevBtn = document.querySelector('[data-action="prev-carousel"]')
  if (prevBtn) {
    prevBtn.onclick = () => {
      const total = creatorState.post.images.length
      if (total <= 1) return
      creatorState.post.carouselIndex = (creatorState.post.carouselIndex - 1 + total) % total
      render()
    }
  }
  const nextBtn = document.querySelector('[data-action="next-carousel"]')
  if (nextBtn) {
    nextBtn.onclick = () => {
      const total = creatorState.post.images.length
      if (total <= 1) return
      creatorState.post.carouselIndex = (creatorState.post.carouselIndex + 1) % total
      render()
    }
  }

  // 存入作品库
  const btnSavePost = document.getElementById('btn-save-post-asset')
  if (btnSavePost) {
    btnSavePost.onclick = async () => {
      const p = creatorState.post
      const check = await window.creatorApi.validatePost({
        title: p.title,
        content: p.content,
        images: p.images
      })

      if (!check.ok) {
        return toast(`⚠️ 校验未通过: ${check.issues.join('; ')}`)
      }

      creatorState.post.saving = true
      render()
      try {
        await window.creatorApi.saveAsset({
          type: 'post',
          title: p.title,
          content: p.content,
          coverPath: p.images[0] || '',
          mediaFiles: p.images,
          targetPlatform: 'xiaohongshu',
          tags: p.tags
        })
        toast('🎉 图文笔记已成功存入待发库！')
      } catch (err) {
        toast(`保存失败: ${err.message}`)
      } finally {
        creatorState.post.saving = false
        render()
      }
    }
  }
}

function bindAssetsEvents () {
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
  if (creatorState.currentTab === 'assets') render()

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
    if (creatorState.currentTab === 'assets') render()
  }
}

// 供页面全局点击代理
root.handleCreatorAction = async function (action, target) {
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
  } else if (action === 'toggle-material') {
    const p = target.dataset.path
    if (!p) return
    const idx = creatorState.video.selectedMaterials.indexOf(p)
    if (idx >= 0) {
      creatorState.video.selectedMaterials.splice(idx, 1)
    } else {
      creatorState.video.selectedMaterials.push(p)
    }
    render()
  } else if (action === 'move-image-left') {
    const idx = Number(target.dataset.idx)
    if (idx > 0) {
      const temp = creatorState.post.images[idx]
      creatorState.post.images[idx] = creatorState.post.images[idx - 1]
      creatorState.post.images[idx - 1] = temp
      render()
    }
  } else if (action === 'move-image-right') {
    const idx = Number(target.dataset.idx)
    if (idx < creatorState.post.images.length - 1) {
      const temp = creatorState.post.images[idx]
      creatorState.post.images[idx] = creatorState.post.images[idx + 1]
      creatorState.post.images[idx + 1] = temp
      render()
    }
  } else if (action === 'remove-post-image') {
    const idx = Number(target.dataset.idx)
    creatorState.post.images.splice(idx, 1)
    if (creatorState.post.carouselIndex >= creatorState.post.images.length) {
      creatorState.post.carouselIndex = Math.max(0, creatorState.post.images.length - 1)
    }
    render()
  } else if (action === 'pick-title') {
    creatorState.article.selectedTitle = target.dataset.title
    render()
  } else if (action === 'fix-sensitive') {
    const word = target.dataset.word
    const rep = target.dataset.replace
    const editor = document.getElementById('wechat-editor-area')
    if (editor && word && rep) {
      editor.innerHTML = editor.innerHTML.replaceAll(word, rep)
      creatorState.article.htmlContent = editor.innerHTML
      creatorState.article.complianceResult = await window.creatorApi.checkCompliance(editor.innerText)
      render()
      toast(`已将“${word}”自动优化替换为“${rep}”`)
    }
  }
}

function showPublishDialog (asset) {
  const envList = typeof environments !== 'undefined' ? environments : []
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
        <div><b>作品类型：</b> ${asset.type === 'video' ? '视频成片' : asset.type === 'article' ? '公众号文章' : '图文笔记'}</div>
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

  root.creatorPage = creatorPage
  root.attachCreatorEvents = attachCreatorEvents
  root.switchCreatorTab = switchCreatorTab

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { creatorPage, attachCreatorEvents, switchCreatorTab }
  }
})(typeof window !== 'undefined' ? window : globalThis)

