import { AccountService, Platforms, XiaohongshuDynamicTaskInput } from '../../../src';
import { EventEmitter } from 'events';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '../../mock/mock';
import $axios from 'axios';
import { douyinVideoService } from '../../../src/media-platform/douyin/douyin-video.service';
import { describe, expect, test } from 'vitest';
import { Xiaohongshu, XiaohongshuArticleImageGenerateInput } from '../../../src/media-platform/xiaohongshu';
import { generateXiaohongshuArticleImages } from '../../../src/media-platform/xiaohongshu/xiaohongshu-article.service';

describe.runIf(true)('【小红书图文真实测试发布】', () => {
  test('小红书图文发布', async () => {
    const cookie =
      'ets=1779960151393; xsecappid=ugc; a1=19e6de47e57lziz2lhnvdlyc26ndxmsp4mijf1c1s50000387998; webId=07820cebee4896316051cb60fa9611ae; gid=yjdKfd4YW042yjdKfd4Wd6yS2W1u3uJ1xIhf3yM1vSJKIV28fC6MUi888qYWjjY80DjyS8qi; x-user-id-creator.xiaohongshu.com=69ca308c000000003300ca25; customerClientId=851154476214055; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517644870735677521934gvgwnkuqkqk6emvq; galaxy_creator_session_id=vEjeP3gfRtYSQrkMiu3hb3eQL4P1HYCOoqna; galaxy.creator.beaker.session.id=1779960174909067616481; loadts=1781144748924; acw_tc=0a0d0e0317811483294713779e83e97d01994cd4f39d26894b2d7923a2db55; websectiga=2845367ec3848418062e761c09db7caf0e8b79d132ccdd1a4f8e64a11d0cac0d; sec_poison_id=4b48a4a7-98c2-42e0-8c1d-7675c4e4dcb2';
    const params: XiaohongshuDynamicTaskInput = {
      /**
       * 任务id
       */
      taskId: '1231123123123',
      /**
       * 标题
       */
      title: '我是标题呀定时',
      isOriginal: 1,

      /**
       * 描述
       */
      desc: '加上',

      images: [
        {
          width: 1280,
          height: 1707,
          size: 322827,
          pathOrUrl: 'I:\\download\\20251217-164426.jpg',
        },
        {
          width: 616,
          height: 803,
          size: 165798,
          pathOrUrl: 'I:\\download\\20251217-164436.png',
        },
      ],
      userDeclarationBind: {
        origin: 2,
      },
      /**
       * 话题
       */
      // topics: [
      //   {
      //     id: '6106a9cb0000000001009ed6',
      //     name: '办公室搞笑',
      //     link: 'https://www.xiaohongshu.com/page/topics/6106a9cb055881000181abf2?naviHidden=yes',
      //     view_num: 505335335,
      //     type: 'official',
      //     smart: false,
      //   },
      // ],

      /**
       * 好友
       */
      // mentionedUser: [
      //   {
      //     image_size_large:
      //       'https://sns-avatar-qc.xhscdn.com/avatar/648f285c72b29c44bd1997ef.jpg?imageView2/2/w/120/format/jpg',
      //     red_official_verified: false,
      //     red_official_verify_type: 0,
      //     show_red_official_verify_icon: false,
      //     red_id: '1855029167',
      //     user_id: '6197e2c00000000010008ec6',
      //     user_nickname: '小野搞笑配音',
      //     desc: '原创搞笑配音！\n为无趣的视频添加灵魂！',
      //     image: 'https://sns-avatar-qc.xhscdn.com/avatar/648f285c72b29c44bd1997ef.jpg?imageView2/2/w/80/format/jpg',
      //     followed: false,
      //   },
      // ],

      /**
       * 定时发布，13位时间戳
       */
      postTime: 1775318400000,

      /**
       *地理位置
       */

      /**
       * 可见类型
       * -0 公开
       * -1 私密
       */
      visibilityType: 1,
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Xiaohongshu.publishArticle(cookie, params, eventCall);
    console.log('小红书图文发布：', result);
  }, 10000000);

  test('小红书地点', async () => {
    const cookie =
      'x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; a1=1920ed3711ci7l4xdqxy8pqrhycw11m30bd0z9wvk50000367451; webId=841896570d55aa0b6bf12e6426212fc0; gid=yjJ8dfqWDy8SyjJ8dfqWyDjEyS3W14CfACvYfhTUAFxvS828Eyy6qu888qKW42y88y8yWqy4; customerClientId=552074963824658; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517428850261673775555qycief7xbmbjhfzp; galaxy_creator_session_id=uKUjFTsuNQl0DmLgegZjvcxgRMSOKlBydcCu; galaxy.creator.beaker.session.id=1729663988617024262812; xsecappid=ugc; acw_tc=0a00dbc217306323319811055e73cb1b8c0e3831cee892779d97239403feb0; websectiga=2845367ec3848418062e761c09db7caf0e8b79d132ccdd1a4f8e64a11d0cac0d; sec_poison_id=bc3739b8-04fc-4606-951f-538f32823a01';
    const result = await Xiaohongshu.getXiaohongshuLocationList(cookie, '天府广场');
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      'xsecappid=ugc; a1=1951d01798fkxas6znefudp7yv42gbzhfrjwyyxds50000112997; webId=ccddf944b8cbec4f84daf50d4be6dcd8; gid=yj2yf8yYy0i2yj2yf8yWjFvCYiTC0MKuIdi7VfMfUWvh4E28JkDuxv888yyJjjW8WYdq8yDY; customer-sso-sid=68c517473021518006637498c5a38512c2e6370d; x-user-id-creator.xiaohongshu.com=6436d3da000000000d01b667; customerClientId=723439318446495; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517473021518006637502ras8es0bjy1thzt7; galaxy_creator_session_id=xMQMaSFpg0api3zj8oKZqyr0e3ILyoiS2JR2; galaxy.creator.beaker.session.id=1739948410269049250263; acw_tc=0a00d2d717403944467965038eadcf67375eb843692ce6b33399e81cb5c2b6; websectiga=59d3ef1e60c4aa37a7df3c23467bd46d7f1da0b1918cf335ee7f2e9e52ac04cf; sec_poison_id=87248340-1fa5-4ea7-8755-cb4c19b85f86';
    const result = await new AccountService(cookie, Platforms.XiaoHongShu).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });

  test('文章转图片模版', async () => {
    const cookie =
      'abRequestId=b4c6eda2-dd0e-5c75-993b-bc0cf96b6393; ets=1781509952894; a1=19eca4495bfcir3iaue0z00whec74sjueyraadodb50000310547; webId=bd474f494a8862f0c7decc7817f33589; gid=yjdfqKjKy2dDyjdS044j2vflDiS3Fq307d8uFfD88ExdS028W4MV70888qy824W8WW0i0KWW; customerClientId=808328567297471; id_token=VjEAACu6BTTqy43nacHPuzBXVAZ7KU823O5whEVrZzjubG+aGkjH7S5PMnqnfQyfX8Jg0Q05LVlKGYVaa1yUZgso1CXzo+ZwY71wtFzRHzodCKtq3zQ5G5egF/ZtSEDp+aQXI5RA; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; x-rednote-datactry=; x-rednote-holderctry=; web_session=030037ad1cfb36545577228c402d4a8f4b4819; xsecappid=ugc; webBuild=1.16.1; customer-sso-sid=68c5176592873646370979943q0us6dvqiolw2zz; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517659287364637097995lfvvcnbtjibkrumj; galaxy_creator_session_id=rlWwSs2WVp8qQtNP5b977BFvOJINh2rgfHaq; galaxy.creator.beaker.session.id=1783316807820069931101; loadts=1783316806948; websectiga=3633fe24d49c7dd0eb923edc8205740f10fdb18b25d424d2a2322c6196d2a4ad; sec_poison_id=758f0ecd-0e8f-47e1-9c77-80d8b8e053b7';
    const result = await Xiaohongshu.getArticleTemplateList();
    console.log(JSON.stringify(result, null, 2));
    expect(result).toBe(1);
  });

  test('文章转图片', async () => {
    const cookie =
      'ets=1781257946746; xsecappid=ugc; a1=19ebb3f46d92d9k23pqrfbb9suqta3n37ppz0q78i30000206459; webId=5172e9cbe4e68e05f8da89f7bdc28b74; gid=yjdDDqi24iWSyjdDDqi4KUAWfjJfjTJqUAFiUY3DDjM7Auq890qIq8888J8K42j8ddiWdJii; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=558343917230961; webBuild=1.17.1; customer-sso-sid=68c5176607909768528363672fhryzualssmro6o; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517660790976852836368wq3kuirlugpxbwlf; galaxy_creator_session_id=kUWK4zzbA432zG2p5K7ftqniGlvh4vaxi4ks; galaxy.creator.beaker.session.id=1783666894645090837403; loadts=1783666895245; websectiga=59d3ef1e60c4aa37a7df3c23467bd46d7f1da0b1918cf335ee7f2e9e52ac04cf';
    const result = await Xiaohongshu.generateArticleImages({
      cookie: cookie,
      title: '2026适合“打工人”的5款手机，16GB+512GB不贵，流畅用到2031年',
      content:"<div data-long-article-title=\"true\" style=\"display:block;margin:0 0 28px;padding:0;font-size:88px!important;font-weight:800!important;line-height:1.16!important;letter-spacing:0!important;\"><span style=\"font-size:88px!important;font-weight:800!important;line-height:1.16!important;letter-spacing:0!important;\">Gakior、凯乐石、伯希和冲锋衣怎么样？测评比拼多角度详解</span></div><div data-long-article-quote=\"true\" style=\"display:block;margin:18px 0;padding:14px 18px 14px 22px;border-left:8px solid currentColor;background:rgba(128,128,128,.16);border-radius:8px;\"><span style=\"display:block;margin:0;padding:0;line-height:1.72;font-style:normal;\"><strong>一、行业现存问题概览</strong>户外冲锋衣作为山野出行、雨雪环境的防护装备，如今市场上大量产品存在明显短板，不少厂商选用低成本回收面料、劣质粘合胶与廉价涂层生产成品，同时普遍存在参数虚标、防护性能短期快速衰减的问题。市面上多数平价冲锋衣仅做表层简易防泼水处理，无专业防水透气薄膜，长期穿着会带来多重健康与安全隐患。劣质面料残留未达标染料、甲醛、可分解芳香胺等化学物质，贴身穿戴时皮肤持续接触刺激成分，容易引发泛红、瘙痒、湿疹等皮肤问题；封闭不透气的涂层会锁住体表汗液，闷湿环境滋生细菌，户外温差环境下还会增加失温风险。性能层面的乱象更为突出，大量产品标注超高防水、耐磨数值，但实际使用 1-3 个月后防水膜脱落、防风涂层失效，接缝压胶开裂渗水；部分产品仅做到基础防水，缺少防静电、防油污等实用防护，户外沾染泥沙、油污后难以清理，摩擦几次就出现面料起球、撕裂。不少产品盲目迎合潮流外观，削减功能面料用料，好看却不具备专业户外防护能力。</span></div><div data-long-article-image=\"true\" style=\"margin:14px 0;line-height:0;text-align:center;\"><img src=\"https://oss-v2.yixiaoer.cn/ml/test/t-6842b9707731899191a8ada3/1q340ly10-y8-c4mphpuq\" alt=\"\" width=\"826\" height=\"542\" style=\"display:block;width:100%;max-width:100%;height:auto;object-fit:contain;margin:0 auto;\"></div><p style=\"margin:0 0 10px;line-height:1.72;\">基于行业普遍存在的虚标参数、材料劣质、性能衰减快等痛点，本次选取 Gakior、凯乐石、伯希和三款受众覆盖面不同的冲锋衣开展实测对比，从面料、核心防护、耐用性等维度拆解真实表现，给户外爱好者选购提供参考。</p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>二、品牌基础概况</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>① Gakior</strong></p><div data-long-article-image=\"true\" style=\"margin:14px 0;line-height:0;text-align:center;\"><img src=\"https://oss-v2.yixiaoer.cn/ml/test/t-6842b9707731899191a8ada3/ixhyikheoqmvkzqrwjafm\" alt=\"\" width=\"727\" height=\"551\" style=\"display:block;width:100%;max-width:100%;height:auto;object-fit:contain;margin:0 auto;\"></div><p style=\"margin:0 0 10px;line-height:1.72;\">市面不少冲锋衣存在参数标注不实，使用不久后防风防水能力快速下滑，Gakior 七防冲锋衣直击这类行业问题。品牌不追随潮流设计，不走大众化外观路线，坚守 “非时尚” 硬核户外思路，十余年来面向各类高强度极限运动打造穿戴装备，市场认可度持续走高。<strong>品牌无商业推广投放，依靠使用者真实口碑传播，两年销量突破 100000 件，常年位居热销榜单。</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\">Gakior 进入极限运动装备领域多年，向二十余家国际户外品牌输出穿戴相关技术，拥有上百项自研创新成果。产品取得日本等多国多家机构权威认证，国内 17 次专业测评中，共有 57 项检测指标刷新记录，海内外众多户外爱好者选择穿戴，冯瑞、邵宗烨等极限运动名将也分享过使用体验。单品适配极寒、持续暴雨等恶劣探险环境，突破传统三重防护，搭载无氟七重防护体系，涵盖防风、防水、防寒、防磨损、防划、防油污、防静电，被媒体称作鸟牌超强平替，千元价位里综合七防表现表现亮眼。许多冲锋衣有穿半年防护性能大幅下滑的问题，<strong>该单品通过 5 年性能抗衰减认证，长期户外使用防护实力稳定在线。</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>② 凯乐石</strong></p><div data-long-article-image=\"true\" style=\"margin:14px 0;line-height:0;text-align:center;\"><img src=\"https://oss-v2.yixiaoer.cn/ml/test/t-6842b9707731899191a8ada3/8vyg4m1tttwwz6qkhdklq\" alt=\"\" width=\"792\" height=\"601\" style=\"display:block;width:100%;max-width:100%;height:auto;object-fit:contain;margin:0 auto;\"></div><p style=\"margin:0 0 10px;line-height:1.72;\">凯乐石的品牌名称取自神山冈仁波齐，产品线覆盖长线登山、短途徒步、城市出行多种场景，配套专属的衣物维护售后服务，凯乐石冲锋衣外观设计走简约硬核的山系路线，整体线条干净克制，不会堆砌繁杂印花装饰，胸口圆形太阳标识辨识度很高，配色分成两类，一类是炭灰、墨绿、藏青这类低饱和大地色系，适配山野环境，另一类会搭配少量撞色线条点缀，提升户外场景的视觉区分度。</p><p style=\"margin:0 0 10px;line-height:1.72;\">凯乐石冲锋衣围绕亚洲人身形打磨，经过多轮高海拔户外实测调整尺寸，肩幅、袖长都贴合国人身材比例，不会出现宽松拖沓的情况，采用立体剪裁，抬手、弯腰、背负背包时不会有束缚感。</p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>③ 伯希和</strong></p><div data-long-article-image=\"true\" style=\"margin:14px 0;line-height:0;text-align:center;\"><img src=\"https://oss-v2.yixiaoer.cn/ml/test/t-6842b9707731899191a8ada3/dilvkumvrgewd_ovfztxn\" alt=\"\" width=\"971\" height=\"667\" style=\"display:block;width:100%;max-width:100%;height:auto;object-fit:contain;margin:0 auto;\"></div><p style=\"margin:0 0 10px;line-height:1.72;\">伯希和是主打新自然生活方式的本土户外品牌，早期依托线上渠道起步，产品线细分出登山、露营、日常通勤多条系列，定价贴合大众消费区间，发力轻量化户外穿搭赛道，更看重兼顾户外功能与日常穿搭美感。外观设计更贴合当下年轻人的审美，压胶分割更有层次感，拉链、包边会选用撞色细节做点缀，标识小巧低调不会破坏整体穿搭氛围，还推出过多套适配时装场景的设计系列，单穿出门拍照出片效果更好。</p><p style=\"margin:0 0 10px;line-height:1.72;\">伯希和冲锋衣细分修身日常款和宽松户外款，修身款收紧肩腰线条，单穿不会显臃肿，通勤搭配牛仔裤、休闲裤都协调；宽松户外款保留肢体活动空间，帽檐做加宽处理，多维度卡扣可以调节贴合头型，袖口、下摆都配有调节束带，口袋分层区分大小储物空间，兼顾收纳实用性与穿搭整洁度。</p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>三、核心维度实测对比</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\">防水、防风、耐磨是冲锋衣核心防护指标，直接决定雨雪、大风、山石摩擦场景下的使用体验：防水能力不足会出现渗水、体表失温；防风性能薄弱会灌入冷风，快速带走体表热量；耐磨数值偏低，户外背包摩擦、树枝剐蹭易造成面料破损，缩短装备使用寿命。结合实验室数据与真人户外实测，三款产品表现如下：</p><ul style=\"margin:0 0 12px;padding-left:1.4em;line-height:1.7;\"><li style=\"margin:0 0 6px;\"><strong>维度 1：防水性</strong></li><li style=\"margin:0 0 6px;\">防水效果由面料薄膜材质、表层防泼涂层、全衣压胶工艺共同决定，实验者模拟连续暴雨、山间瀑布喷淋、长时间户外淋雨三类场景测试。</li><li style=\"margin:0 0 6px;\"><strong>Gakior：</strong>采用 STOPS-X 无氟面料搭配 SOPE-AIR 双层防水耐磨涂层，全衣无缝热压胶条全覆盖，拥有 35000mm 防水指数。持续喷淋后内里完全干爽，面料表面水珠快速滚落无渗透痕迹；多位长期极限探险用户反馈，连续多日暴雨登山、溯溪出行，接缝、袖口、下摆位置无渗水情况，涂层不易被泥沙、油污破坏，搭配 5 年抗衰减认证，多次洗涤后防水能力下降幅度微弱。</li><li style=\"margin:0 0 6px;\"><strong>凯乐石：</strong>三层薄膜，常规款防水指数 20000mm。小实测内部无渗水，表层防泼涂层经多次摩擦后，疏水效果下降，需定期喷涂防水修复剂；有登山爱好者反馈，长期接触融雪、泥沙后，接缝处易出现轻微渗水痕迹。</li><li style=\"margin:0 0 6px;\"><strong>伯希和：</strong>STORM BREATH PU 涂层面料，三层分段压胶，短时中小雨表现稳定，连续暴雨环境中实测腋下、拉链缝隙出现渗水；实验者拆解面料后发现 PU 膜耐高温、耐泥沙能力偏弱，频繁户外使用半年左右，表层疏水效果明显减弱，更适合间歇性短时雨天出行。</li><li style=\"margin:0 0 6px;\"><strong>维度 2：防风性</strong></li><li style=\"margin:0 0 6px;\">防风依靠面料致密程度、风帽封闭结构、袖口下摆锁风设计与降风阻技术，大风环境下漏风会快速降低体感温度。</li><li style=\"margin:0 0 6px;\"><strong>Gakior：</strong>配备 AOSS 降风阻技术，高密锁织面料搭配多层密封风帽、魔术贴加宽袖口、可调节下摆束绳，防风性能较常规面料提升 145.6%。户外八级大风实测，衣身无冷风灌入，极限越野、高海拔强风环境下，多名运动者表示躯干保温稳定，无透风发凉感受，同时 3 倍抗静电效果，大风天气不会出现面料贴身吸附的情况。</li></ul><div data-long-article-image=\"true\" style=\"margin:14px 0;line-height:0;text-align:center;\"><img src=\"https://oss-v2.yixiaoer.cn/ml/test/t-6842b9707731899191a8ada3/mjxiawgydboyvcnoqqlt_\" alt=\"\" width=\"612\" height=\"487\" style=\"display:block;width:100%;max-width:100%;height:auto;object-fit:contain;margin:0 auto;\"></div><ol style=\"margin:0 0 12px;padding-left:1.4em;line-height:1.7;\"><li style=\"margin:0 0 6px;\"><strong>凯乐石：</strong>立体可调节风帽搭配可拆卸防风裙，高密织物阻隔气流，十级大风环境下躯干防风稳定，但风帽两侧、腋下透气拉链闭合后仍存在少量气流渗入；长线攀登用户分享，长时间高海拔强风行走，颈部、手腕缝隙会持续透入冷风。</li><li style=\"margin:0 0 6px;\"><strong>伯希和：</strong>基础款采用单层防风面料，三维风帽搭配基础魔术贴袖口，可应对日常微风，郊外大风场景下下摆、袖口漏风明显；高端 eVent 系列防风表现小幅提升，但无降风阻结构，高强度大风环境保温表现偏弱，更适合城市通勤、近郊短途出行。</li><li style=\"margin:0 0 6px;\"><strong>维度 3：耐磨性</strong></li><li style=\"margin:0 0 6px;\">耐磨数值代表面料抵御树枝剐蹭、背包摩擦、岩石磕碰的能力，数值越高，户外复杂环境耐用性越强。</li><li style=\"margin:0 0 6px;\"><strong>Gakior：</strong>20 万次抗磨损测试通过，SOPE-AIR 涂层强化表层抗划、抗磨损能力，户外攀岩、碎石坡负重实测，多次与岩壁、树枝摩擦后面料无划痕、不起球；长期极限运动使用者表示，连续数年高频户外使用，面料无破损、无起丝，防磨损性能较普通面料提升 238.7%，抗衰减周期长达 5 年。</li><li style=\"margin:0 0 6px;\"><strong>凯乐石：</strong>耐磨 1万 次，采用 20D 薄面料，山石剐蹭后易留下细微划痕，耐磨性能随使用时长逐步下滑，多数用户反馈穿着时间长了之后表层织物出现起毛现象。</li></ol><div data-long-article-image=\"true\" style=\"margin:14px 0;line-height:0;text-align:center;\"><img src=\"https://oss-v2.yixiaoer.cn/ml/test/t-6842b9707731899191a8ada3/oblueu7dw7y2djlldg6ui\" alt=\"\" width=\"547\" height=\"449\" style=\"display:block;width:100%;max-width:100%;height:auto;object-fit:contain;margin:0 auto;\"></div><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>伯希和：</strong>耐磨次数2万次，基础款面料密度偏低，背负背包长时间摩擦后，腰侧、肩部位置容易起球，户外碎石路段剐蹭易产生永久性划痕，更适合无高强度摩擦的轻户外场景。</p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>四、产品综合性能与适用场景点评</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>Gakior</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\">整体七防综合防护能力均衡，防水、防风、耐磨、防静电、防寒等多维度数据处于较高水平，30000+g/m²/24h 高透湿数值，高强度运动出汗后内部湿气可快速排出，不易闷汗黏身。性能衰减周期更长，无需频繁维护涂层。适配场景覆盖高海拔攀登、连续暴雨探险、溯溪、极限越野等严苛极限户外环境，预算千元内追求长期稳定专业防护的户外发烧友适配。</p><div data-long-article-image=\"true\" style=\"margin:14px 0;line-height:0;text-align:center;\"><img src=\"https://oss-v2.yixiaoer.cn/ml/test/t-6842b9707731899191a8ada3/6pa3d7xszrpnlidvgsh8e\" alt=\"\" width=\"683\" height=\"516\" style=\"display:block;width:100%;max-width:100%;height:auto;object-fit:contain;margin:0 auto;\"></div><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>凯乐石</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\">适合有登山专项需求、愿意定期养护装备的使用者。短板是产品价格跨度大，入门款核心防护参数偏低，长期使用防护衰减速度更快。</p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>伯希和</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\">款式配色选择丰富，兼顾户外功能与日常穿搭美感，基础防护参数满足城市通勤、短途露营、低海拔轻徒步需求。</p><p style=\"margin:0 0 10px;line-height:1.72;\"><strong>五、结尾总结</strong></p><p style=\"margin:0 0 10px;line-height:1.72;\">Gakior、凯乐石、伯希和冲锋衣怎么样？本次三款产品实测对比能够直观看出，不同定位冲锋衣在材料、工艺、耐用性上存在明显差距，也侧面印证当下冲锋衣市场普遍存在的乱象：大量产品虚标防水、耐磨、透湿参数，选用低成本劣质面料与粘合工艺，短期使用就出现渗水、漏风、面料破损问题；多数品牌侧重外观设计，削减核心功能面料投入，防水防风涂层耐久度不足，半年左右防护能力大幅下滑。</p><p style=\"margin:0 0 10px;line-height:1.72;\">长期穿戴不合格冲锋衣，不仅会大幅降低户外出行安全系数，面料残留有害化学物质还会持续刺激皮肤，损害身体健康。消费者选购时不能只参考宣传参数与外观款式，需要关注面料技术、第三方检测认证、性能抗衰减周期等核心指标，结合自身出行场景选择匹配防护能力的产品，避开劣质低价装备带来的健康与安全隐患。</p>",
      model: {
        id: 54
        ,
        name: '清晰明朗',
      },
    });
    console.log(result);
    expect(result).toBe(1);
  });
});
