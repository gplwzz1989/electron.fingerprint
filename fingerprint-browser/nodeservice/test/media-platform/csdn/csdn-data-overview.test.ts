import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getDataOverviewAsync, getDataOverviewCoreDataAsync } from '@/media-platform/csdn/csdn-data-overview.service';

describe('【Mock】', () => {
  describe('获取csdn数据分析报表', () => {
    const server = setupServer(
      rest.get('https://bizapi.csdn.net*/blog/phoenix/console/v1/data/all-article', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 200,
              message: 'success',
              traceId: 'e5ff9321-842b-4f3c-b9da-1c9fb7105c8a',
              data: {
                dateList: [
                  '2023-11-02',
                  '2023-11-03',
                  '2023-11-04',
                  '2023-11-05',
                  '2023-11-06',
                  '2023-11-07',
                  '2023-11-08',
                ],
                chartData: {
                  view: ['31', '30', '8', '18', '23', '22', '16'],
                  comment: ['0', '0', '0', '0', '0', '0', '0'],
                  collect: ['0', '0', '0', '0', '0', '0', '0'],
                  fans: ['0', '0', '0', '0', '0', '0', '0'],
                },
                list: [
                  {
                    viewCount: 16,
                    commentCount: 0,
                    favoriteCount: 0,
                    fanCount: 0,
                    pdate: '2023-11-08',
                  },
                  {
                    viewCount: 22,
                    commentCount: 0,
                    favoriteCount: 0,
                    fanCount: 0,
                    pdate: '2023-11-07',
                  },
                  {
                    viewCount: 23,
                    commentCount: 0,
                    favoriteCount: 0,
                    fanCount: 0,
                    pdate: '2023-11-06',
                  },
                  {
                    viewCount: 18,
                    commentCount: 0,
                    favoriteCount: 0,
                    fanCount: 0,
                    pdate: '2023-11-05',
                  },
                  {
                    viewCount: 8,
                    commentCount: 0,
                    favoriteCount: 0,
                    fanCount: 0,
                    pdate: '2023-11-04',
                  },
                  {
                    viewCount: 30,
                    commentCount: 0,
                    favoriteCount: 0,
                    fanCount: 0,
                    pdate: '2023-11-03',
                  },
                  {
                    viewCount: 31,
                    commentCount: 0,
                    favoriteCount: 0,
                    fanCount: 0,
                    pdate: '2023-11-02',
                  },
                ],
                total: 7,
                page: 1,
                size: 20,
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewAsync('success', 1, 20, 1698891399, 1699409799);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(200);
      });
    });
  });

  describe('获取csdn数据分析核心数据', () => {
    const server = setupServer(
      rest.get('https://bizapi.csdn.net*/blog-console-api/v1/data/blog_statistics', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 200,
              msg: 'success',
              data: [
                {
                  name: '文章总数',
                  num: 30,
                },
                {
                  name: '粉丝数',
                  num: 30,
                },
                {
                  name: '点赞数',
                  num: 24,
                },
                {
                  name: '评论数',
                  num: 2,
                },
                {
                  name: '阅读量',
                  num: 47332,
                },
                {
                  name: '积分',
                  num: 385,
                },
                {
                  name: '总排名',
                  num: 50963,
                },
                {
                  name: '收藏数',
                  num: 201,
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
        const result = await getDataOverviewCoreDataAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(200);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取csdn数据分析报表', async () => {
    const cookie =
      'uuid_tt_dd=10_37042844840-1678458090027-383148; __bid_n=186cbe63540efd61bc4207; FPTOKEN=WqPVYZh87q44IMxXsj/ggNAcabCqWYHCRFcGEIPGeKqnqwrBbXsG+t6xnXxHI8xYCFzzl2dovBSBPxfctqtmOZnkQrCbeuirObL6Ty8Um3b3teRVeZEXgSC+dQlGI4c3T3NRGIYPR2v04IGbx5Qsv44fcAak3u0N+rvkJL+li5yt8Vj8r8mbFapXSM8Wa1rKJOXO6GyAWbzx4zugpik+iKjPRG8HGSXE5jvyq9jovpPPkzWopvWqI+twTBiOFqJ2p4Vp9KZsc5saTQloFQ8WDEQH6wLCRt7pE7H1kc6stDfgbIrOYm0R1D7itODspDARcLMoGR/86Mn5Mkad69UaYyvWTrP38k+xDZPBPIB5ug2f75bbDI95Lp8OTk4yHIQn+HtYX1BCQDURDUVP+V0vNw==|kfHhsZ7oX8+vfNprjOMer2Uu0VZEXRYUSGE3oPy9IrA=|10|94f4d5841a9a255a5d2a9a4df969c0ad; _ga=GA1.1.393484099.1692837541; _ga_7W1N0GEY1P=GS1.1.1697184988.19.1.1697185469.60.0.0; __gads=ID=a19deea1cc908946-2270298d0be30039:T=1690548379:RT=1698915218:S=ALNI_MapKuR47gNeEoIbae5gn6_FJJ8hCw; __gpi=UID=00000d26c5f0d7fe:T=1690548379:RT=1698915218:S=ALNI_MYlgkHVPqi-zHOWpMVGq-1YkX5FAw; ssxmod_itna=QqGxRDyDgDB7fhDl4iqYKEP7wbrjDc7AE=DtY=ipx0HAeGzDAxn40iDtorT2QPODexKY7oeaAx872iqPHvF+Gir4jIGx0aDbqGkqQmoQGG0xBYDQxAYDGDDPDocPD1D3qDkD7h6CMy1qGWDm4kDWPDYxDrjOKDRxi7DDvQkx07DQ5kpi0keDDzee3xqAI4DYehoUawcagCqmAPF0KD91oDsxR6CKoUSb0zo4Lj4R+ODl92DC91c2HHa4GdXc5z43hxNp6eV0GeGBRDF0G4WQfTO00PqYUxKGRqYQD4GnhPYmxygTDDi2U/FiDD==; ssxmod_itna2=QqGxRDyDgDB7fhDl4iqYKEP7wbrjDc7AE=DtY=ixn98Y4Dsq3GDLiOFV4TOqn+pxS/iD9+8/KEu4QK3iKrHQiNx8r3QfYEATTTKYPUxIx0/euGQh8L5wD8HOj2z61Qqu5qQXo7ouq+sX1KF/DxbGCpP27B8/D47d3BN+WBokZIzuDp=bImwkevaYOh+QbEAB6vvFAfPCOGvfeIE/aDWrSpN8G7hf3FQGFwxKByaLtG2mfqdDQFrDjKD+rGDD; loginbox_strategy=%7B%22taskId%22%3A308%2C%22abCheckTime%22%3A1699495834769%2C%22version%22%3A%22exp1%22%2C%22blog-auto-tip%22%3A1696660333260%2C%22blog-threeH-default%22%3A1699151712314%7D; UserName=weixin_44188796; UserInfo=3ced0e4d9ec64160b4d70c00d6983e31; UserToken=3ced0e4d9ec64160b4d70c00d6983e31; UserNick=%E6%A9%98%E5%AD%90%E5%91%B3%E7%9A%84%E6%A9%99%E6%B1%81%E5%84%BF; AU=820; UN=weixin_44188796; BT=1699495862860; p_uid=U010000; Hm_up_6bcd52f51e9b3dce32bec4a3997715ac=%7B%22islogin%22%3A%7B%22value%22%3A%221%22%2C%22scope%22%3A1%7D%2C%22isonline%22%3A%7B%22value%22%3A%221%22%2C%22scope%22%3A1%7D%2C%22isvip%22%3A%7B%22value%22%3A%220%22%2C%22scope%22%3A1%7D%2C%22uid_%22%3A%7B%22value%22%3A%22weixin_44188796%22%2C%22scope%22%3A1%7D%7D; weixin_44188796comment_new=1676387011650; c_pref=default; c_ref=default; dc_session_id=11_1701832770322.046770; c_first_ref=default; c_first_page=https%3A//mp.csdn.net/; c_dsid=11_1701832770323.500131; c_segment=12; c_page_id=default; Hm_lvt_6bcd52f51e9b3dce32bec4a3997715ac=1701140396,1701332117,1701745668,1701832771; Hm_lpvt_6bcd52f51e9b3dce32bec4a3997715ac=1701832771; creativeSetApiNew=%7B%22toolbarImg%22%3A%22https%3A//img-home.csdnimg.cn/images/20230921102607.png%22%2C%22publishSuccessImg%22%3A%22https%3A//img-home.csdnimg.cn/images/20230920034826.png%22%2C%22articleNum%22%3A21%2C%22type%22%3A2%2C%22oldUser%22%3Atrue%2C%22useSeven%22%3Afalse%2C%22oldFullVersion%22%3Atrue%2C%22userName%22%3A%22weixin_44188796%22%7D; creative_btn_mp=3; dc_sid=df18edf015193fc45750e04b3b57b393; log_Id_view=1564; log_Id_pv=180; dc_tos=s586kv; log_Id_click=111';

    const result = await getDataOverviewAsync(cookie, 1, 20, 1701228615, 1701747015);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);

  test('获取csdn数据分析核心数据', async () => {
    const cookie =
      'uuid_tt_dd=10_37042844840-1678458090027-383148; __bid_n=186cbe63540efd61bc4207; FPTOKEN=WqPVYZh87q44IMxXsj/ggNAcabCqWYHCRFcGEIPGeKqnqwrBbXsG+t6xnXxHI8xYCFzzl2dovBSBPxfctqtmOZnkQrCbeuirObL6Ty8Um3b3teRVeZEXgSC+dQlGI4c3T3NRGIYPR2v04IGbx5Qsv44fcAak3u0N+rvkJL+li5yt8Vj8r8mbFapXSM8Wa1rKJOXO6GyAWbzx4zugpik+iKjPRG8HGSXE5jvyq9jovpPPkzWopvWqI+twTBiOFqJ2p4Vp9KZsc5saTQloFQ8WDEQH6wLCRt7pE7H1kc6stDfgbIrOYm0R1D7itODspDARcLMoGR/86Mn5Mkad69UaYyvWTrP38k+xDZPBPIB5ug2f75bbDI95Lp8OTk4yHIQn+HtYX1BCQDURDUVP+V0vNw==|kfHhsZ7oX8+vfNprjOMer2Uu0VZEXRYUSGE3oPy9IrA=|10|94f4d5841a9a255a5d2a9a4df969c0ad; _ga=GA1.1.393484099.1692837541; _ga_7W1N0GEY1P=GS1.1.1697184988.19.1.1697185469.60.0.0; __gads=ID=a19deea1cc908946-2270298d0be30039:T=1690548379:RT=1698915218:S=ALNI_MapKuR47gNeEoIbae5gn6_FJJ8hCw; __gpi=UID=00000d26c5f0d7fe:T=1690548379:RT=1698915218:S=ALNI_MYlgkHVPqi-zHOWpMVGq-1YkX5FAw; ssxmod_itna=QqGxRDyDgDB7fhDl4iqYKEP7wbrjDc7AE=DtY=ipx0HAeGzDAxn40iDtorT2QPODexKY7oeaAx872iqPHvF+Gir4jIGx0aDbqGkqQmoQGG0xBYDQxAYDGDDPDocPD1D3qDkD7h6CMy1qGWDm4kDWPDYxDrjOKDRxi7DDvQkx07DQ5kpi0keDDzee3xqAI4DYehoUawcagCqmAPF0KD91oDsxR6CKoUSb0zo4Lj4R+ODl92DC91c2HHa4GdXc5z43hxNp6eV0GeGBRDF0G4WQfTO00PqYUxKGRqYQD4GnhPYmxygTDDi2U/FiDD==; ssxmod_itna2=QqGxRDyDgDB7fhDl4iqYKEP7wbrjDc7AE=DtY=ixn98Y4Dsq3GDLiOFV4TOqn+pxS/iD9+8/KEu4QK3iKrHQiNx8r3QfYEATTTKYPUxIx0/euGQh8L5wD8HOj2z61Qqu5qQXo7ouq+sX1KF/DxbGCpP27B8/D47d3BN+WBokZIzuDp=bImwkevaYOh+QbEAB6vvFAfPCOGvfeIE/aDWrSpN8G7hf3FQGFwxKByaLtG2mfqdDQFrDjKD+rGDD; loginbox_strategy=%7B%22taskId%22%3A308%2C%22abCheckTime%22%3A1699495834769%2C%22version%22%3A%22exp1%22%2C%22blog-auto-tip%22%3A1696660333260%2C%22blog-threeH-default%22%3A1699151712314%7D; UserName=weixin_44188796; UserInfo=3ced0e4d9ec64160b4d70c00d6983e31; UserToken=3ced0e4d9ec64160b4d70c00d6983e31; UserNick=%E6%A9%98%E5%AD%90%E5%91%B3%E7%9A%84%E6%A9%99%E6%B1%81%E5%84%BF; AU=820; UN=weixin_44188796; BT=1699495862860; p_uid=U010000; Hm_up_6bcd52f51e9b3dce32bec4a3997715ac=%7B%22islogin%22%3A%7B%22value%22%3A%221%22%2C%22scope%22%3A1%7D%2C%22isonline%22%3A%7B%22value%22%3A%221%22%2C%22scope%22%3A1%7D%2C%22isvip%22%3A%7B%22value%22%3A%220%22%2C%22scope%22%3A1%7D%2C%22uid_%22%3A%7B%22value%22%3A%22weixin_44188796%22%2C%22scope%22%3A1%7D%7D; weixin_44188796comment_new=1676387011650; c_pref=default; c_ref=default; dc_session_id=11_1701832770322.046770; c_first_ref=default; c_first_page=https%3A//mp.csdn.net/; c_dsid=11_1701832770323.500131; c_segment=12; c_page_id=default; Hm_lvt_6bcd52f51e9b3dce32bec4a3997715ac=1701140396,1701332117,1701745668,1701832771; Hm_lpvt_6bcd52f51e9b3dce32bec4a3997715ac=1701832771; creativeSetApiNew=%7B%22toolbarImg%22%3A%22https%3A//img-home.csdnimg.cn/images/20230921102607.png%22%2C%22publishSuccessImg%22%3A%22https%3A//img-home.csdnimg.cn/images/20230920034826.png%22%2C%22articleNum%22%3A21%2C%22type%22%3A2%2C%22oldUser%22%3Atrue%2C%22useSeven%22%3Afalse%2C%22oldFullVersion%22%3Atrue%2C%22userName%22%3A%22weixin_44188796%22%7D; creative_btn_mp=3; dc_sid=df18edf015193fc45750e04b3b57b393; log_Id_view=1564; log_Id_pv=180; dc_tos=s586kv; log_Id_click=111';

    const result = await getDataOverviewCoreDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);
});
