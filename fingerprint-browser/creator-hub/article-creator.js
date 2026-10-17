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
   * 生成爆款大纲与多套候选标题
   * @param {Object} options
   * @param {string} options.topic - 主题
   * @param {string} [options.platform] - 平台: xiaohongshu | zhihu | wechat | douyin | weibo
   * @param {string} [options.style] - 风格:种草/干货/故事/幽默/悬念
   * @param {string} [options.keywords] - 关键词
   */
  static generateArticleDraft ({ topic, platform = 'xiaohongshu', style = '种草', keywords = '' }) {
    const safeTopic = (topic || '无标题灵感').trim()
    const kwList = keywords.split(/[,，、 ]+/).filter(Boolean)
    const kwStr = kwList.length ? `（核心关注：${kwList.join('、')}）` : ''

    // 1. 生成 3 组不同心理学模型的爆款标题
    const candidateTitles = [
      `🔥 终于有人把【${safeTopic}】讲明白了！建议先赞后看`,
      `😱 亲测避坑！关于${safeTopic}，很多人第一步就做错了`,
      `建议收藏！3分钟搞定${safeTopic}全流程硬核指南`
    ]

    let content = ''
    let tags = []

    if (platform === 'xiaohongshu') {
      tags = [`#${safeTopic}`, '#宝藏分享', '#干货分享', '#日常碎片', '#实用小技巧']
      content = `✨ 宝子们好呀！今天来跟大家认真聊聊【${safeTopic}】这件超有意义的事！${kwStr}
很多朋友一直在后台私信问我，到底怎么入门？怎样才能少走弯路？今天把我的私藏经验一次性毫无保留全盘托出～

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
      // 默认公众号/长文
      tags = [`#${safeTopic}`, '#趋势洞察', '#深度好文']
      content = `在信息爆炸的今天，关于【${safeTopic}】的讨论层出不穷。${kwStr}

真正拉开人与人之间差距的，往往不是获取信息的多少，而是深度思考与执行落地能力。

#### 01 为什么当下这个时点尤为关键？
时代的齿轮从来不会为犹豫者停下脚步，看准趋势才能顺势而为。

#### 02 解决核心难题的三个支点
- **支点一**：重塑认知边界；
- **支点二**：构建自动化流程；
- **支点三**：打造差异化壁垒。

#### 03 结语
道阻且长，行则将至；行而不辍，未来可期。`
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
}

module.exports = {
  ArticleCreator,
  SENSITIVE_WORDS_MAP
}
