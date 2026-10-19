import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getPayContentAsync } from '../../../src/media-platform/wangyihao/wangyihao-paycontent.service';

describe('【Mock】', () => {
  describe('获取网易号视频付费内容列表', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/dist/getPayContent', (req, res, context) => {
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
                  contentId: 'IO6H2T490553RHO9',
                  contentType: 'doc',
                  title: '占星神童阿南德：预言巴以冲突，称2024美国有动乱，日本大地震！',
                  cover: 'bigimg||http://dingyue.ws.126.net/2024/0111/075ae5b6j00s73c5i000yd000u700f3p.jpg',
                  price: 500,
                  purchaseCount: 1551,
                  commission: 150.0,
                  finishStatus: null,
                  name: '洞鉴历史',
                  avatar: 'http://cms-bucket.ws.126.net/2022/0815/bb5aa0adj00rgn69g000yc000dm00dmc.jpg',
                  freeLink: 'https://www.163.com/dy/article/IO6H2T490553RHO9.html',
                },
                {
                  contentId: 'IKSSHLT005565VJ7',
                  contentType: 'doc',
                  title: '得知被打死者身份，公安局长怒杀女婿后自尽，此案引发一重大运动',
                  cover: 'http://dingyue.ws.126.net/2023/1201/60f464a2j00s4zbqg0020c000m000dwm.jpg',
                  price: 500,
                  purchaseCount: 1434,
                  commission: 150.0,
                  finishStatus: null,
                  name: '阿胡',
                  avatar: 'http://dingyue.ws.126.net/2023/1013/f6582f70j00s2gl3n000ad000780078p.jpg',
                  freeLink: 'https://www.163.com/dy/article/IKSSHLT005565VJ7.html',
                },
                {
                  contentId: 'IICRMH4C0543G49U',
                  contentType: 'doc',
                  title: '揭秘缅北战事的起因：一个富二代被绑架并失踪，四大家族迎来痛击',
                  cover:
                    'http://dingyue.ws.126.net/2023/1031/f0590baej00s3dryq00exd000hs00cjp.jpg||http://dingyue.ws.126.net/2023/1031/20cbde33j00s3drwl00bsd000hs00d7p.jpg||http://dingyue.ws.126.net/2023/1031/d8a76950j00s3dsje0020d000gz00bop.jpg',
                  price: 500,
                  purchaseCount: 1241,
                  commission: 150.0,
                  finishStatus: null,
                  name: '吴学华看天下',
                  avatar: 'http://dingyue.ws.126.net/2020/0420/d01d15a7j00q92tod0026c000hs00hsm.jpg',
                  freeLink: 'https://www.163.com/dy/article/IICRMH4C0543G49U.html',
                },
                {
                  contentId: 'IN488SQH0521RRF8',
                  contentType: 'doc',
                  title: '最强预言家盲眼龙婆，预言2024年七大事件，全球或将面临灭顶之灾',
                  cover:
                    'http://dingyue.ws.126.net/2023/1229/5e90ff79j00s6enjn00asd000fe00a7p.jpg||http://dingyue.ws.126.net/2023/1229/d3f6a2f3j00s6enlm00btd000fe00a1p.jpg||http://dingyue.ws.126.net/2023/1229/f9dbabd2j00s6enk7009sd000fe009sp.jpg',
                  price: 500,
                  purchaseCount: 1078,
                  commission: 150.0,
                  finishStatus: null,
                  name: '神秘历史故事',
                  avatar: 'http://dingyue.ws.126.net/5EE2eIiZZn6uUgZng8PuuxUCHAYwDwtk8zaddntQsHqGy1513669282456.jpeg',
                  freeLink: 'https://www.163.com/dy/article/IN488SQH0521RRF8.html',
                },
                {
                  contentId: 'IIKT5E0J05564SZG',
                  contentType: 'doc',
                  title: '恒安集团创始人被灭门，公安悬赏百万征集线索，真凶身份意想不到',
                  cover: 'bigimg||http://dingyue.ws.126.net/2023/1103/f6d9e8f0j00s3jka000hzd000m800etp.jpg',
                  price: 300,
                  purchaseCount: 965,
                  commission: 90.0,
                  finishStatus: null,
                  name: '老黄有话',
                  avatar: 'http://dingyue.ws.126.net/2023/0807/5860451fj00rz057n0008d0005t005tp.jpg',
                  freeLink: 'https://www.163.com/dy/article/IIKT5E0J05564SZG.html',
                },
                {
                  contentId: 'IDQ05S2H0543SOPQ',
                  contentType: 'doc',
                  title: '敛财74亿，包养9个情妇，其中4个火辣警花，但9个私生子仅3个亲生',
                  cover: 'http://dingyue.ws.126.net/2023/0904/d1439196j00s0g674008zd000hs00ccp.jpg',
                  price: 500,
                  purchaseCount: 867,
                  commission: 150.0,
                  finishStatus: null,
                  name: '古今档案',
                  avatar: 'http://dingyue.ws.126.net/2023/0606/7c3fe107j00rvt93u000ad0006d006dp.jpg',
                  freeLink: 'https://www.163.com/dy/article/IDQ05S2H0543SOPQ.html',
                },
                {
                  contentId: 'IKQFK9G20553IVVI',
                  contentType: 'doc',
                  title: '陕西高二女生操场生子，调查后发现，孩子父亲身份令人傻眼',
                  cover: 'http://dingyue.ws.126.net/2023/1130/6aa8858fj00s4xlhp008ad000dw008cp.jpg',
                  price: 500,
                  purchaseCount: 850,
                  commission: 150.0,
                  finishStatus: null,
                  name: '青丝人生',
                  avatar: 'http://dingyue.ws.126.net/2023/0818/f7d36bbdj00rzke4u000bd000770077p.jpg',
                  freeLink: 'https://www.163.com/dy/article/IKQFK9G20553IVVI.html',
                },
                {
                  contentId: 'I51MEGJK0523T1D6',
                  contentType: 'doc',
                  title: '1998年，绑匪用18张纸条将警方耍得团团转！直到9年后悬案破解！',
                  cover:
                    'http://dingyue.ws.126.net/2023/0518/7e840da7j00ruuk6m007ec000k000otm.jpg||http://dingyue.ws.126.net/2023/0518/3bd67e7cj00ruuk6l005hc000k000ncm.jpg||http://dingyue.ws.126.net/2023/0518/1322cf12j00ruuk6m00cmc000xw00k0m.jpg',
                  price: 400,
                  purchaseCount: 828,
                  commission: 120.0,
                  finishStatus: null,
                  name: '温读',
                  avatar: 'http://dingyue.ws.126.net/2020/1020/6eb1de2fp00qii4p60006c0004g004gc.png',
                  freeLink: 'https://www.163.com/dy/article/I51MEGJK0523T1D6.html',
                },
                {
                  contentId: 'IEHOPL0T054391C8',
                  contentType: 'doc',
                  title: '文强二审时的一句话，差点轰塌半个娱乐圈，金喜善重庆失身成谜',
                  cover:
                    'http://dingyue.ws.126.net/2023/0913/c905adb9j00s0x96h00dqd000ij00dwp.jpg||http://dingyue.ws.126.net/2023/0913/455b2e7dj00s0x9bd009yd000dw00dxp.jpg||http://dingyue.ws.126.net/2023/0913/8a7ced40j00s0x9g500ozd000sg00iip.jpg',
                  price: 500,
                  purchaseCount: 746,
                  commission: 150.0,
                  finishStatus: null,
                  name: '史论纵横',
                  avatar: 'http://dingyue.ws.126.net/j8e6spiE=2bOACr9CYVBVqXL=0UIIrKQACWGVfTa9teH71558447676166.jpeg',
                  freeLink: 'https://www.163.com/dy/article/IEHOPL0T054391C8.html',
                },
                {
                  contentId: 'IK3SKT6705564PA0',
                  contentType: 'doc',
                  title: '浙江夫妻梦到亡女托梦求救，不顾反对挖坟开棺，有了惊人发现',
                  cover:
                    'http://dingyue.ws.126.net/2023/1121/9d3010c2j00s4hck00047c000zk00l8m.jpg||http://dingyue.ws.126.net/2023/1121/316d051aj00s4hck0001xc000vu00jym.jpg||http://dingyue.ws.126.net/2023/1121/dd244570j00s4hck0005rc000zk00oqm.jpg',
                  price: 500,
                  purchaseCount: 735,
                  commission: 150.0,
                  finishStatus: null,
                  name: '纸鸢奇谭',
                  avatar: 'http://dingyue.ws.126.net/2023/0728/f4f17804j00ryie2f000cd0006o006op.jpg',
                  freeLink: 'https://www.163.com/dy/article/IK3SKT6705564PA0.html',
                },
                {
                  contentId: 'I209DL02054316O9',
                  contentType: 'doc',
                  title: '公海杀人不犯法？33名船员自相残杀，三次清洗后，仅11人活着回来',
                  cover:
                    'http://dingyue.ws.126.net/2023/0410/71abffa3j00rswiiu009wd000jg00b6p.jpg||http://dingyue.ws.126.net/2023/0410/e4f3d4b9j00rswijp008nd000jg00c3p.jpg||http://dingyue.ws.126.net/2023/0410/411d2b07j00rswik60079d000gs00ccp.jpg',
                  price: 400,
                  purchaseCount: 721,
                  commission: 120.0,
                  finishStatus: null,
                  name: '镜中楼',
                  avatar: 'http://dingyue.ws.126.net/Gp3lMrqFxmqEw4njlG0DK9fOHgqw9eN6vzNopOGdtzDB41532781203459.jpeg',
                  freeLink: 'https://www.163.com/dy/article/I209DL02054316O9.html',
                },
                {
                  contentId: 'IKNJONO80543G49U',
                  contentType: 'doc',
                  title: '天涯神帖：据说这才是马航出事的真相，事关大国之间的尖端科技',
                  cover: 'bigimg||http://dingyue.ws.126.net/2023/1129/8f2eadd3j00s4vjap01ltd001hc00u0p.jpg',
                  price: 500,
                  purchaseCount: 716,
                  commission: 150.0,
                  finishStatus: null,
                  name: '吴学华看天下',
                  avatar: 'http://dingyue.ws.126.net/2020/0420/d01d15a7j00q92tod0026c000hs00hsm.jpg',
                  freeLink: 'https://www.163.com/dy/article/IKNJONO80543G49U.html',
                },
                {
                  contentId: 'I4Q44RGA05488QSH',
                  contentType: 'doc',
                  title: '杀妻喂鱼案，史上第一人',
                  cover: 'bigimg||http://cms-bucket.ws.126.net/2023/0608/c8b7f8fbp00rvxosd0059c000ic00boc.png',
                  price: 500,
                  purchaseCount: 711,
                  commission: 150.0,
                  finishStatus: null,
                  name: '苍山有雪',
                  avatar: 'http://mobilepics.ws.126.net/2023/0515/3c54f8a6j00ruojjd000y000u900qz.jpg',
                  freeLink: 'https://www.163.com/dy/article/I4Q44RGA05488QSH.html',
                },
                {
                  contentId: 'IA41MDL005561G2S',
                  contentType: 'doc',
                  title: '辽宁省省长刚上任便惨遭毒打，施暴者竟然是自己辖区内片警',
                  cover:
                    'http://dingyue.ws.126.net/2023/0720/e9714a3dj00ry3bjk008dd000g100a2p.jpg||http://dingyue.ws.126.net/2023/0720/c7ed6d22j00ry3bl200a0c000ld00aqm.jpg||http://dingyue.ws.126.net/2023/0720/0f30eb8dj00ry3bho00bwd000j100ezp.jpg',
                  price: 500,
                  purchaseCount: 705,
                  commission: 150.0,
                  finishStatus: null,
                  name: '故事家说历史',
                  avatar: 'http://cms-bucket.ws.126.net/2023/0105/89b4ffeej00ro02mr001jc000op00dwc.jpg',
                  freeLink: 'https://www.163.com/dy/article/IA41MDL005561G2S.html',
                },
                {
                  contentId: 'IMG1OLEH05564LXV',
                  contentType: 'doc',
                  title: '市委书记夫人被黑警暴打后囚禁，儿子一句话致300警察下岗',
                  cover:
                    'http://dingyue.ws.126.net/2023/1221/4d560013j00s6050e006cd000dw008ip.jpg||http://dingyue.ws.126.net/2023/1221/dc9033eaj00s604z800sjd000rf00hqp.jpg||http://dingyue.ws.126.net/2023/1221/d6cb893ej00s604ol0058d000go00b4p.jpg',
                  price: 500,
                  purchaseCount: 615,
                  commission: 150.0,
                  finishStatus: null,
                  name: '七月故事会',
                  avatar: 'http://dingyue.ws.126.net/2023/0720/55459a05j00ry30uv000cd0008w008wp.jpg',
                  freeLink: 'https://www.163.com/dy/article/IMG1OLEH05564LXV.html',
                },
                {
                  contentId: 'IJOQ5C8S05533EUN',
                  contentType: 'doc',
                  title: '部队首长调动迷彩服怒砸“金伯帆”秦军长：警察回去!天王老子来了也没用',
                  cover:
                    'http://dingyue.ws.126.net/2023/1117/19676ca6j00s49e5b01hcd000u0010np.jpg||http://dingyue.ws.126.net/2023/1117/e74a8561j00s49eb3007kd000go009dp.jpg||http://dingyue.ws.126.net/2023/1117/a62e5a48j00s49e2200j3d000v900jjp.jpg',
                  price: 500,
                  purchaseCount: 609,
                  commission: 150.0,
                  finishStatus: null,
                  name: '野史留根',
                  avatar: 'http://dingyue.ws.126.net/2023/0721/a1101890j00ry5hpc000bd000au00aup.jpg',
                  freeLink: 'https://www.163.com/dy/article/IJOQ5C8S05533EUN.html',
                },
                {
                  contentId: 'HQBCN9EE05560Q32',
                  contentType: 'doc',
                  title: '一个死了三天的人，是怎么半夜爬上女孩的床，实施犯罪的？',
                  cover: 'http://dingyue.ws.126.net/2023/0105/6d8bbf64j00ro0dox00bwd000jc00byp.jpg',
                  price: 400,
                  purchaseCount: 608,
                  commission: 120.0,
                  finishStatus: null,
                  name: '奇趣故事汇',
                  avatar: 'http://dingyue.ws.126.net/2022/1107/6cf603c3j00rkyyhs000gd000780078p.jpg',
                  freeLink: 'https://www.163.com/dy/article/HQBCN9EE05560Q32.html',
                },
                {
                  contentId: 'ICR5L3NN0543BCJM',
                  contentType: 'doc',
                  title: '台湾顶级灵媒现场通灵，道破白冰冰女儿绑架案：命中注定惨死',
                  cover:
                    'http://dingyue.ws.126.net/2023/0823/98272a15j00rztz98000vc000ic00d6m.jpg||http://dingyue.ws.126.net/2023/0823/999480f6j00rztz98000rc000ic00dlm.jpg||http://dingyue.ws.126.net/2023/0823/1963b43cj00rztz9k001cc000ic00icm.jpg',
                  price: 500,
                  purchaseCount: 606,
                  commission: 150.0,
                  finishStatus: null,
                  name: '百晓生谈历史',
                  avatar: 'http://dingyue.ws.126.net/2021/0124/b586ec76j00qnfn1b0005c0004g004gc.jpg',
                  freeLink: 'https://www.163.com/dy/article/ICR5L3NN0543BCJM.html',
                },
                {
                  contentId: 'IJP593SH0543IWI5',
                  contentType: 'doc',
                  title: '缅北“明家”：活埋中国警察，屠杀中国公民，它的覆灭，只是开始',
                  cover:
                    'http://dingyue.ws.126.net/2023/1117/0ec3f7eaj00s49n5500ckd000hs00cbp.jpg||http://dingyue.ws.126.net/2023/1117/59c8a5bbj00s49nmc00bbd000dw009bp.jpg||http://dingyue.ws.126.net/2023/1117/b9dad975j00s49mxr00n0d000k000qzp.jpg',
                  price: 500,
                  purchaseCount: 600,
                  commission: 150.0,
                  finishStatus: null,
                  name: '一更历史',
                  avatar: 'http://dingyue.ws.126.net/2020/0531/26065628j00qb77bj002lc000rs00rsm.jpg',
                  freeLink: 'https://www.163.com/dy/article/IJP593SH0543IWI5.html',
                },
                {
                  contentId: 'IMFICD7S05439YO6',
                  contentType: 'doc',
                  title: '全球伟大的预言家盲眼神婆，预测2024年8大事件，每件都影响巨大',
                  cover:
                    'http://dingyue.ws.126.net/2023/1221/2466c1caj00s5zs2o00xad000rr00glp.jpg||http://dingyue.ws.126.net/2023/1221/67fc17c8j00s5zsb700hkd000hs00ctp.jpg||http://dingyue.ws.126.net/2023/1221/3d91ae14j00s5zsby013ed000v900l2p.jpg',
                  price: 500,
                  purchaseCount: 554,
                  commission: 150.0,
                  finishStatus: null,
                  name: '郁郁乎文',
                  avatar: 'http://dingyue.ws.126.net/WFBKAMy4kLLmH4QG4FHDVgdPsOzYai7hzTivlJlKteALX1565359448263.jpeg',
                  freeLink: 'https://www.163.com/dy/article/IMFICD7S05439YO6.html',
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
        const result = await getPayContentAsync('success', '', '', '', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(2000000);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取网易号视频付费内容列表', async () => {
    const cookie =
      'gdxidpyhxdE=lOLAA4G1rTMOryVVQstwEVELZXL93aJcfypVAnQfMu%5CPEnOs9ehVlLgsOgp%2BD8Rf30BLYwIXvQAzw%2Fhie2oDB4mnt1C5z7BL6vGMt0XJdUQIhI2OxzIVdW%2BOnqXxGy3DEoEr%2BVbRmG5CmxLpmoeLgvXnXpeYg798mbMQqsqKYkOOInTk%3A1706166065368; _ntes_origin_from=; _ntes_nuid=86dfb93cdcd2de2ceddd75c137244961; _antanalysis_s_id=1706666551681; NTES_YD_SESS=3l6T4DT06EKUnYFPrmR4256dotPxIoZ3ZNUgr59KrGQWCIEACNjlM8FSQKRvTz_s4LlbdUTWn3a96fxxO4tegiJM3sCHUkw_lOE_oK19swbaMgDyO.HtJTIhDkP10licNzF5zaPMJWBE4TmLd8hvh9.mJtr50QSj1kq2xU.C9.sEwnOLBYNZoF6rehU2oyugNzlU0QLQqIWhwwzpkVW.gi6_jNV_8s.KXVUYIKgsEkfu_; S_INFO=1706666580|0|0&60##|18874070066; P_INFO=18874070066|1706666580|1|subscribe|00&99|null&null&null#hun&430100#10#0|&0|null|18874070066; NTESwebSI=C5780A608B8B56A35F76FF208DD3D81D';

    const result = await getPayContentAsync(
      cookie,
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
      '',
      '社会,民生,公共安全',
      '',
      '',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);
});
