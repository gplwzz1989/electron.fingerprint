'use strict'

// 平台敏感违禁词雷达词库与替换建议
const SENSITIVE_WORDS_MAP = {
  // 极限词 / 绝对化用语（严重影响广告与算法推荐）
  '最': { level: 'warning', replace: '很/十分', reason: '广告法禁用极限词，容易引起平台限流' },
  '第一': { level: 'danger', replace: '领先/前列', reason: '绝对化排名用语，触发算法审核' },
  '最好': { level: 'danger', replace: '优质/值得推荐', reason: '绝对化比较词' },
  '最强': { level: 'danger', replace: '出众/实力过硬', reason: '绝对化评价词' },
  '顶级': { level: 'warning', replace: '高品质/专业级', reason: '夸大宣传极限词' },
  '绝对': { level: 'warning', replace: '大多/基本', reason: '绝对化表述，建议客观留有余地' },
  '万能': { level: 'warning', replace: '实用/通用', reason: '夸大宣传用语' },
  '100%': { level: 'warning', replace: '大概率/高标准', reason: '数据绝对化' },
  '首选': { level: 'warning', replace: '推荐/参考', reason: '绝对化导向' },
  // 涉嫌虚假承诺 / 诱导
  '稳赚': { level: 'danger', replace: '具备潜力/长期价值', reason: '金融收益绝对化承诺，平台严打' },
  '暴富': { level: 'danger', replace: '实现增长/提升收益', reason: '违规造富诱导词' },
  '躺赚': { level: 'danger', replace: '自动化增效', reason: '涉嫌诱导宣传' },
  '包过': { level: 'danger', replace: '提升通过率', reason: '虚假应试承诺' },
  // 违规导流词
  '加v': { level: 'danger', replace: '关注主页/评论区交流', reason: '站外导流违规' },
  '微信': { level: 'warning', replace: '主页简介/私信交流', reason: '敏感平台引流' },
  'vx': { level: 'danger', replace: '关注主页', reason: '敏感变体引流' }
}

/**
 * 微信公众号经典排版模版组件库
 * 采用全内联样式（Inline CSS），确保无缝直接粘贴至微信公众平台后台富文本编辑器
 */
const WECHAT_TEMPLATES = [
  {
    id: 'h2-bar',
    name: '竖条加粗主标题',
    category: 'title',
    preview: '01 / 行业深度洞察',
    html: `<section style="margin: 28px 0 16px; display: flex; align-items: center;">
  <span style="display: inline-block; width: 4px; height: 18px; background-color: #07c160; border-radius: 2px; margin-right: 8px;"></span>
  <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937; letter-spacing: 0.5px;">01 / 行业核心认知重塑</h2>
</section>`
  },
  {
    id: 'h2-badge',
    name: '圆形徽章数字标题',
    category: 'title',
    preview: '① 拆解关键实操路径',
    html: `<section style="margin: 26px 0 14px; display: flex; align-items: center;">
  <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #07c160; color: #ffffff; font-size: 13px; font-weight: bold; margin-right: 8px;">1</span>
  <h2 style="margin: 0; font-size: 17px; font-weight: 600; color: #111827;">从0到1拆解高阶执行法则</h2>
</section>`
  },
  {
    id: 'quote-card',
    name: '左侧引用金句卡片',
    category: 'quote',
    preview: '“行动是打败焦虑的唯一良药...”',
    html: `<blockquote style="margin: 20px 0; padding: 14px 18px; background-color: #f7f9fa; border-left: 4px solid #07c160; border-radius: 0 8px 8px 0; color: #4b5563; font-size: 15px; line-height: 1.75; font-style: normal;">
  <span style="color: #07c160; font-size: 18px; font-weight: bold; line-height: 1; margin-right: 4px;">“</span>真正拉开差距的，不是获取信息的多少，而是深度思考与持续落地能力。<span style="color: #07c160; font-size: 18px; font-weight: bold; line-height: 1; margin-left: 4px;">”</span>
</blockquote>`
  },
  {
    id: 'tip-card',
    name: '划重点 / 提示卡片',
    category: 'card',
    preview: '💡 重点提示：切忌盲目跟风...',
    html: `<section style="margin: 20px 0; padding: 16px 20px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; color: #065f46; font-size: 15px; line-height: 1.8;">
  <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px; display: flex; align-items: center;">
    <span style="margin-right: 6px;">💡</span> 划重点 · 关键实操指南
  </div>
  <p style="margin: 0; color: #047857; font-size: 14px;">在前期切勿分散精力，聚焦单一业务闭环，先跑通正向反馈，再复制放大规模。</p>
</section>`
  },
  {
    id: 'img-wrap-left',
    name: '图文混排 · 左侧环绕图',
    category: 'layout',
    preview: '[左图] + 右侧文字环绕流动',
    html: `<section style="margin: 20px 0; overflow: hidden; line-height: 1.8; color: #374151; font-size: 15px;">
  <figure style="float: left; margin: 4px 18px 12px 0; max-width: 42%; text-align: center;">
    <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block;" alt="图文插图" />
    <figcaption style="font-size: 12px; color: #9ca3af; margin-top: 6px;">图：系统化流程协作图</figcaption>
  </figure>
  <p style="margin: 0; text-align: justify;">通过将核心知识点与插图深度融合，文字在图片右侧自然环绕流动，可以有效降低读者的视觉疲劳度，大幅提升公众号长文的停留时长与阅读完成率。这种版式是深度知识专栏与商业案例报道的标配排版。</p>
</section>`
  },
  {
    id: 'img-wrap-right',
    name: '图文混排 · 右侧环绕图',
    category: 'layout',
    preview: '左侧文字环绕流动 + [右图]',
    html: `<section style="margin: 20px 0; overflow: hidden; line-height: 1.8; color: #374151; font-size: 15px;">
  <figure style="float: right; margin: 4px 0 12px 18px; max-width: 42%; text-align: center;">
    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block;" alt="图文插图" />
    <figcaption style="font-size: 12px; color: #9ca3af; margin-top: 6px;">图：数据增长曲线</figcaption>
  </figure>
  <p style="margin: 0; text-align: justify;">右侧浮动插图能够与左侧论点形成有力呼应。结合清晰的数据图表与实操案例，不仅让文章更具说服力，也使整体版面错落有致，彰显专业媒体排版质感。</p>
</section>`
  },
  {
    id: 'follow-footer',
    name: '文末引导关注卡片',
    category: 'footer',
    preview: '点赞·在看·不错过精彩推送',
    html: `<section style="margin: 36px 0 16px; padding: 22px; background-color: #fafafa; border: 1px dashed #d1d5db; border-radius: 12px; text-align: center;">
  <div style="font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 8px;">🌟 关注我们 · 持续收获深度干货</div>
  <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 14px;">如果本文对你有所启发，欢迎点击右上角【分享】给身边的朋友，顺手点个【在看】支持一下！</p>
  <div style="display: inline-flex; gap: 16px; font-size: 13px; color: #07c160; font-weight: 500;">
    <span>👍 点赞</span>
    <span>⭐️ 收藏</span>
    <span>👀 在看</span>
  </div>
</section>`
  }
]

class ArticleCreator {
  /**
   * 敏感词合规检测
   * @param {string} text
   */
  static checkCompliance (text = '') {
    const hits = []
    if (!text || typeof text !== 'string') {
      return { ok: true, hits: [], score: 100 }
    }

    const lower = text.toLowerCase()
    for (const [word, rule] of Object.entries(SENSITIVE_WORDS_MAP)) {
      let startIndex = 0
      while (startIndex < lower.length) {
        const idx = lower.indexOf(word.toLowerCase(), startIndex)
        if (idx === -1) break
        hits.push({
          word,
          index: idx,
          level: rule.level,
          replace: rule.replace,
          reason: rule.reason
        })
        startIndex = idx + word.length
      }
    }

    const score = Math.max(0, 100 - hits.length * 15)
    return {
      ok: hits.length === 0,
      score,
      hits
    }
  }

  /**
   * 获取微信公众号全套排版模版
   */
  static getWechatTemplates () {
    return WECHAT_TEMPLATES
  }

  /**
   * 生成爆款大纲与多套候选标题
   * @param {Object} options
   * @param {string} options.topic - 主题
   * @param {string} [options.platform] - 平台: xiaohongshu | zhihu | wechat | douyin | weibo
   * @param {string} [options.style] - 风格:种草/干货/故事/幽默/悬念
   * @param {string} [options.keywords] - 关键词
   */
  static generateArticleDraft ({ topic, platform = 'wechat', style = '干货', keywords = '' }) {
    const safeTopic = (topic || '自媒体高效运营指南').trim()
    const kwList = keywords.split(/[,，、 ]+/).filter(Boolean)
    const kwStr = kwList.length ? `（核心关注：${kwList.join('、')}）` : ''

    // 1. 生成 3 组不同心理学模型的爆款标题
    const candidateTitles = [
      `🔥 终于有人把【${safeTopic}】讲明白了！建议深度阅读`,
      `😱 亲测避坑！关于${safeTopic}，90%的人第一步就走错了`,
      `建议收藏！3步打通${safeTopic}全流程实操指南`
    ]

    let content = ''
    let tags = []

    if (platform === 'xiaohongshu') {
      tags = [`#${safeTopic}`, '#宝藏分享', '#干货分享', '#效率工具', '#实用技巧']
      content = `✨ 宝子们好呀！今天来跟大家认真聊聊【${safeTopic}】这件超有意义的事！${kwStr}
很多朋友一直在后台私信问我，到底怎么入门？怎样才能少走弯路？今天把我的私操笔记毫无保留全盘托出～

📌 【核心要点 1：找准关键痛点】
很多人一开始方向就偏了，不要盲目跟风，先把基础底子打牢。

💡 【核心要点 2：拆解高阶执行法则】
- 第一阶段：聚焦单点突破，把最关键的问题解决掉；
- 第二阶段：建立持续正反馈，形成标准化习惯；
- 第三阶段：复盘优化，让效果翻倍放大！

🎁 【总结与避坑锦囊】
坚持就是胜利，慢慢来反而比较快！大家觉得哪一点最受用呢？欢迎在评论区告诉我，一起交流进步呀！

${tags.join(' ')}`
    } else if (platform === 'zhihu') {
      tags = [`#${safeTopic}`, '#认知思维', '#深度剖析', '#方法论']
      candidateTitles[0] = `如何看待「${safeTopic}」？有哪些普通人不知道的内幕或方法？`
      content = `谢邀。针对「${safeTopic}」这个话题，市面上的泛泛之谈很多，但往往缺少底层逻辑的拆解。${kwStr}

从本质上来看，我们可以把它拆解为三个认知维度：

### 一、底层规律与核心机理
任何事物的演进都遵循客观规律。在面对${safeTopic}时，最忌讳的是“用战术上的勤奋掩盖战略上的懒惰”。

### 二、行之有效的三步落地路径
1. **建立全局视角**：理清输入与输出的关系；
2. **制定行动闭环**：设置清晰的止损点与里程碑；
3. **长期主义沉淀**：建立个人或团队的复利护城河。

### 三、写在最后
认知的高度决定行动的深度。希望以上思考能对正在探索该方向的朋友有所启发。`
    } else {
      // 默认公众号深度长文（提供富文本兼容排版内容）
      tags = [`#${safeTopic}`, '#深度思考', '#实操复盘']
      content = `<section style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #2d3748; letter-spacing: 0.5px;">
  <p style="margin: 0 0 16px;">在信息高度密集的当下，关于【<strong>${safeTopic}</strong>】的讨论层出不穷。${kwStr}</p>
  <p style="margin: 0 0 16px;">真正拉开人与人之间差距的，往往不是获取了多少碎片信息，而是能否穿透表象，抓住底层机理并持续付诸实践。</p>

  <section style="margin: 28px 0 16px; display: flex; align-items: center;">
    <span style="display: inline-block; width: 4px; height: 18px; background-color: #07c160; border-radius: 2px; margin-right: 8px;"></span>
    <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">01 / 认知边界：为什么旧模式正在失效？</h2>
  </section>

  <blockquote style="margin: 18px 0; padding: 14px 18px; background-color: #f7f9fa; border-left: 4px solid #07c160; border-radius: 0 8px 8px 0; color: #4b5563; font-size: 15px; line-height: 1.75;">
    时代的齿轮从不为犹豫者停留，看准趋势的人早已在暗中构建自己的专属壁垒。
  </blockquote>

  <p style="margin: 0 0 16px;">很多创作者往往陷入“机械式重复”的误区：每天忙忙碌碌，看似投入巨大，却因为缺少系统化流程，始终无法形成正向复利。</p>

  <section style="margin: 28px 0 16px; display: flex; align-items: center;">
    <span style="display: inline-block; width: 4px; height: 18px; background-color: #07c160; border-radius: 2px; margin-right: 8px;"></span>
    <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">02 / 落地打法：三步建立自动化正反馈</h2>
  </section>

  <section style="margin: 18px 0; padding: 16px 20px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; color: #065f46; font-size: 15px; line-height: 1.8;">
    <div style="font-weight: 600; margin-bottom: 6px;">💡 核心实操法则</div>
    <p style="margin: 0 0 8px;">1. <strong>精准锚定痛点</strong>：单点深挖，拒绝泛化；</p>
    <p style="margin: 0 0 8px;">2. <strong>工具赋能流程</strong>：用自动化工具代替手工搬砖；</p>
    <p style="margin: 0;">3. <strong>建立资产沉淀</strong>：让每一次创作都沉淀为数字资产。</p>
  </section>

  <section style="margin: 32px 0 16px; padding: 20px; background-color: #fafafa; border: 1px dashed #d1d5db; border-radius: 12px; text-align: center;">
    <div style="font-size: 15px; font-weight: bold; color: #111827; margin-bottom: 6px;">🌟 结语与讨论</div>
    <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0;">道阻且长，行则将至。你对【${safeTopic}】有什么独特的见解或疑问？欢迎在评论区留言交流！</p>
  </section>
</section>`
    }

    return {
      topic: safeTopic,
      platform,
      style,
      candidateTitles,
      selectedTitle: candidateTitles[0],
      content,
      tags
    }
  }

  static generateOutline (options) { return this.generateArticleDraft(options) }
  static auditCompliance (text) { return this.checkCompliance(text) }

  generateArticleDraft (options) { return ArticleCreator.generateArticleDraft(options) }
  generateOutline (options) { return ArticleCreator.generateArticleDraft(options) }
  checkCompliance (text) { return ArticleCreator.checkCompliance(text) }
  auditCompliance (text) { return ArticleCreator.checkCompliance(text) }
  getWechatTemplates () { return ArticleCreator.getWechatTemplates() }
}

module.exports = {
  ArticleCreator,
  SENSITIVE_WORDS_MAP,
  WECHAT_TEMPLATES
}
