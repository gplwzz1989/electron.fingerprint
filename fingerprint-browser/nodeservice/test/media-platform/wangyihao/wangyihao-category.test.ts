import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getCategoryAsync } from '@/media-platform/wangyihao/wangyihao-category.service';

describe('【Mock】', () => {
  describe('获取网易号视频分类列表', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/video/categoryV6/getTree.do', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: [
                {
                  categoryName: '综艺',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '综艺吐槽',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '综艺盘点',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '综艺片段',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '职场',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '职场攻略',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '行业分享',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '职业技能',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '职场动态',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '职场Vlog',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '娱乐',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '八卦',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '明星八卦',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '体育明星八卦',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '其他八卦',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '娱乐故事',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '娱乐混剪',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '花絮',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '音乐',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '音乐混剪',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '乐评盘点',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '音乐知识',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '音乐现场',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '翻唱改编',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '原创音乐',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '乐器',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '音乐资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '艺术',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '摄影',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '绘画',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '书法',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '建筑',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '心理',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '心理学测试',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '心理学知识',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '要闻',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '国内',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '地方政务',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '反腐倡廉',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '国际',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '星座',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '星座知识',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '占卜',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '舞蹈',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '现代舞',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '中国舞',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '街舞',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '芭蕾舞',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '国标舞',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '广场舞',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '体育',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '篮球',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: 'NBA',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '中国篮球',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '冰雪运动',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '高尔夫',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '足球',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '国际足球',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '中国足球',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '搏击',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '排球',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '乒乓球',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '赛车',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '台球',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '田径',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '跳水',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '网球',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '武术',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '游泳',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '羽毛球',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '运动会',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '极限运动',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '其他体育',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '数码',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '手机平板',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '安卓',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '苹果',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '电脑装机',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '配件',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '摄影摄像',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '智能硬件',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '数码资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '时尚',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '时尚资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '美容美体',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '彩妆',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '护肤',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '美发',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '时尚服饰',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '明星风尚',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '时尚鞋履',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '时尚箱包',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '时尚配饰',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '时尚街拍',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '生活',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '生活vlog',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '校园生活',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '生活常识技巧',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '安全技巧',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '手工制作',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '魔术',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '花草栽培',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '模玩',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '社会',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '天气',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '自然灾害',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '民生',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '市政基建',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '公益环保',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '公共安全',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '交通出行',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '社会福利',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '百态',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '国际',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '新闻合集',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '公众人物',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '三农',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '农村生活',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '农货',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '农家故事',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '农业知识',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '渔业',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '助农政策',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '人文',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '风水命理',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '古代文学',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '近现代文学',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '故事',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '灵异故事',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '民间故事',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '佛学',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '哲学',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '民风民俗',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '收藏',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '社科',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '情感',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '情感技巧',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '情感故事',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '情感短剧',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '两性',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '人生感悟',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '美食',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '食谱',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '吃播',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '美食vlog',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '美食测评',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '美食探店',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '美酒',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '品酒',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '美食知识',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '旅游',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '旅游资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '旅游攻略',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '旅行故事',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '旅行知识',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '美景分享',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '历史',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '中国史',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '古代史',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '近现代史',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '世界史',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '考古',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '军事',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '装备',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '军情',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '中国军情',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '邻邦军情',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '国际军情',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '军人',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '教育',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '中小学教育',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '考研',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '外语',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '高考',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '留学',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '成人教育',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '公务员考试',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '高校教育',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '益智',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '家庭教育',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '健身',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '瑜伽',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '减脂',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '增肌塑形',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '户外',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '健康',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '医疗科普',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '养生',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '两性',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '女性健康',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '男性健康',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '医美整形',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '疾病防治问诊',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '心理疾病',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '搞笑',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '整蛊恶搞',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '街访趣谈',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '配音解说',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '脱口秀',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '迷惑行为',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '搞笑漫画',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '鬼畜内容',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '段子剧',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '乡村短剧',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '生活搞笑',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '对口型',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '法律',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '普法知识',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '法律故事',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '法律案件解读',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '二次元',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '宅舞',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '动漫',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '国漫',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '欧美动漫',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '日本动漫',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '特摄片',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '动漫资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: 'COSPLAY',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '虚拟主播',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '财经',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '保险',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '股票',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '美股',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: 'A股',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '港股',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '炒股指南',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '贵金属',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '宏观经济',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '国内宏观',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '国际宏观',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '基金',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '理财',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '期货',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '商业观察',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '创业',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '人物',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '实体经济',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '税收',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '外汇',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '银行',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '债券',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '彩票',
                  level: 1,
                  subCategoryList: null,
                },
                {
                  categoryName: '美女',
                  level: 1,
                  subCategoryList: null,
                },
                {
                  categoryName: '帅哥',
                  level: 1,
                  subCategoryList: null,
                },
                {
                  categoryName: '科普',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '学术知识',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '冷知识',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '宇宙探索',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '自然探索',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '综合文化',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '汽车',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '二手车',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '驾考',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '试驾测评',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '新车',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '用车',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电动车',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '摩托车',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '新能源汽车',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '行业',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '房产',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '购房',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '二手房',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '新盘',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '商铺',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '行情',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '海外房产',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '物业',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '政策',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '租房',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '土地',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '房企',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '互联网',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '电子商务',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '互联网金融',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '人工智能',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '育儿',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '孕产',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '备孕',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '孕期',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '产后护理',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '儿童健康',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '婴幼儿护理',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '亲子成长',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '幼儿园',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '萌宝风采',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '游戏',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '手机游戏',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '端游',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '网游',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '单机游戏',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '游戏赛事',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '桌游',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '游戏资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '游戏主播',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '网页游戏',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: 'vr游戏',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '主机游戏',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '家居',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '装修设计',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '装修技巧',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '家用电器',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '家居用品',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '曲艺',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '戏曲',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '戏剧',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '杂技',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '相声',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '小品',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '奇闻趣事',
                  level: 1,
                  subCategoryList: null,
                },
                {
                  categoryName: '动物',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '萌宠',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '宠物狗',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '宠物猫',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '水族',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '观赏鸟',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '爬宠圈',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '异宠圈',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '野生动物',
                      level: 2,
                      subCategoryList: [
                        {
                          categoryName: '水生动物',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '昆虫',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '鸟类',
                          level: 3,
                          subCategoryList: null,
                        },
                        {
                          categoryName: '猛兽',
                          level: 3,
                          subCategoryList: null,
                        },
                      ],
                    },
                    {
                      categoryName: '宠物趣闻',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '电影',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '电影解说',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电影盘点',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电影剪辑',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电影片段',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电影资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电影短片',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '电视剧',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '电视剧解说',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电视剧盘点',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电视剧剪辑',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电视剧片段',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '电视剧资讯',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '短剧',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '科技',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '计算机技术',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '科研',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '生物科技',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '通信',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '科技趣闻',
                      level: 2,
                      subCategoryList: null,
                    },
                    {
                      categoryName: '航空航天',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '工业',
                  level: 1,
                  subCategoryList: [
                    {
                      categoryName: '重型机械',
                      level: 2,
                      subCategoryList: null,
                    },
                  ],
                },
                {
                  categoryName: '其他',
                  level: 1,
                  subCategoryList: null,
                },
              ],
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getCategoryAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(2000000);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取网易号视频分类列表', async () => {
    const cookie =
      'gdxidpyhxdE=lOLAA4G1rTMOryVVQstwEVELZXL93aJcfypVAnQfMu%5CPEnOs9ehVlLgsOgp%2BD8Rf30BLYwIXvQAzw%2Fhie2oDB4mnt1C5z7BL6vGMt0XJdUQIhI2OxzIVdW%2BOnqXxGy3DEoEr%2BVbRmG5CmxLpmoeLgvXnXpeYg798mbMQqsqKYkOOInTk%3A1706166065368; _ntes_origin_from=; _ntes_nuid=86dfb93cdcd2de2ceddd75c137244961; _antanalysis_s_id=1706666551681; NTES_YD_SESS=3l6T4DT06EKUnYFPrmR4256dotPxIoZ3ZNUgr59KrGQWCIEACNjlM8FSQKRvTz_s4LlbdUTWn3a96fxxO4tegiJM3sCHUkw_lOE_oK19swbaMgDyO.HtJTIhDkP10licNzF5zaPMJWBE4TmLd8hvh9.mJtr50QSj1kq2xU.C9.sEwnOLBYNZoF6rehU2oyugNzlU0QLQqIWhwwzpkVW.gi6_jNV_8s.KXVUYIKgsEkfu_; S_INFO=1706666580|0|0&60##|18874070066; P_INFO=18874070066|1706666580|1|subscribe|00&99|null&null&null#hun&430100#10#0|&0|null|18874070066; NTESwebSI=C5780A608B8B56A35F76FF208DD3D81D';

    const result = await getCategoryAsync(cookie, 'yd.692a357e4c1a4b5f8%40163.com', 'W2905703798683225716');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);
});
