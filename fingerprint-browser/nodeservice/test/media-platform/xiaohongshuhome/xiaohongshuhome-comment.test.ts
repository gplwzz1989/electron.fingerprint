import { describe, expect, test } from 'vitest';
import { XiaoHongShuHomeWorker } from '../../../src/cloud/task/platform/xiaohongshuhomeworker';
import { Xiaohongshuhome } from '../../../src';

describe.runIf(true)('【小红书主页评论真实测试】', () => {
  test('获取小红书主页作品列表', async () => {
    const cookie =
      'abRequestId=2cc9c33a-d668-50c7-b816-7e4b1b1f2dc7; ets=1786371461272; webBuild=6.37.3; xsecappid=xhs-pc-web; a1=19fec09515aytc2mz887ziwi1cibm46b0vgg1a8ih50000243228; webId=24a637e2307d4c4ce7f96451fa333878; gid=yjidS8jK0J8qyjidS8j2yh0Y20v9SJ6uYYWuk3x3E3yS3k28D64KDy888J4qJJY8iKyiJjjd; web_session=0400697b5fc526e683dffb954c384b765f0e6f; id_token=VjEAAPtXz8eQmoFTYtJhplpAtKh2SYbvsqa30FDqtsKnveI0XF62PjhaValYuKbWX2jXkz6C4JnTWAvp+lLX372qMbegnemwdb4wa29QP1vSAYjbJG98WMVqhS6B0lBcXs1Xm9f5; x-rednote-datactry=CN; x-rednote-holderctry=CN; b1=I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSfMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdnoeSfqYHqwl2qt5B0DoIx+PGDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwrPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhEK+9DUIvzy4I8OIic7ZPwUIviC4o/sDLds6PwVIC7eSd7s69ImIh6s3zrdQut5IEos3j5exLJsVPwcr9gsSPtxICMPLgoefuw5zn5sWVwrI3S2I3z1oPwNaPw8BaZgyLOsD0OexutmIkJeYa/sx/QBIvOe6e5eWlRrIvNsDqwHIkHiwPwLNVt6I3OeiutdIEAedPtsI3ge3PwrzVtv2Pt8IkS7IhbEmmTaroOsSqwbI3YuIC0sxVt3KgDLc/JsDBYxIiHL2utKputiIxKs3uwMQpdeipJsTLzLIhvs6BOs1qtsBVwtIv7efVwIIkgs6nbKI3JsDfAs1uwyI3Oe6qtdQjRrIkF+IC6sxIoeVfAedrOsYPtzIiP1IvmhZqtoICljIhgsVL4lNj/sfqttIhp2Bqt1HI0sSL5e0uwpeut2IiFrIvEaQPtb+PwUIkesxYvexVwo2qtGICkRQutfIiIeHlYoIE6sT7ve09de6VwFBqtZIiLBIkvs6utWIEJeDM4DIE+GsIR3IvpsIvKeiutEBqwPqqw9IiHCIEvsTs5eiqwaLruMIhLdqut8rPthIxqRI3boIkSiIhOe0LAsibmPPPwKICGibqtHcPtlIi6ednW6IiFinMKedVt6eutaocLwP7FMIxb1aVwQIkNsDWzyIi+4oPwUIi8WsPtWoPt/ICPjICYDIEYtBPwPI3umICvsSqwXZm+eIErnIvesYges6Pw+IhzEICLH/zIhIhlVgmr9Ihesdp/eYPwoICeskPtpIEqPIE0siuwHIhQRmPwlIv3sdmGOgVtiePtrIC3ejPtPIEvsWF4XIE5sxDesTVtzwWNs3qwoQgNsiqtzI37sfm6eTVtPIEqTIilvruwctYYeIx6eSuwOZz6eDc+ptqtsI3ZwIiOeWmYbI3KefqwpIv4zIios0bH0IEIrIkrMgLMaIE0eDlZRIv8lIxGfIvKs0abA+PtPLPt4oAKeWresjutEIvKeV90exVwYwutbI3b9pqtlgPwvQVtXJqw1wVtubsgs1ZKe6doe3zNe6uwBIiWsIiHFIvpCIvesxaJeT0lkquwtIiVznqwOGddsTqw2ICOsYYdeDgbZIxOsdqwG+cq3IvAsYqwAIv0e1qtX+qwJI3/sDAkw2qtsnoAsfMm3IE/sjVwqbqtugUvs6Pw1cPtnLVwQIvisIhRAopAeWb7sTqt1IC/e3Pt+Lqw/tjKeVIYdL7m5JbrYgVwKaVwaIvkAIClPI3u0qYvsxaprIvzgI3QtputaICTEOVtaIkAeTWuxBVthIhuaaVttI3Js6mlOIhcxI3geYPtJnutQZMr=; acw_tc=0a00d72617864166882795564e551c9fde9a411a4a88099ed704de967defc6; loadts=1786416687342; unread={%22ub%22:%226a7983d00000000028000ad2%22%2C%22ue%22:%226a6c40e7000000003301f39f%22%2C%22uc%22:28}; websectiga=9730ffafd96f2d09dc024760e253af6ab1feb0002827740b95a255ddf6847fc8; sec_poison_id=d5f339d1-07ea-4b80-9cbc-57d6754f0cb0';

    const contentResult = await Xiaohongshuhome.getXiaohongshuhomeCommentContent(cookie);
    console.log(JSON.stringify(contentResult, null, 2));

    expect(contentResult).not.toBeUndefined();
  }, 10000000);
  test('获取小红书主页指定作品评论列表', async () => {
    const cookie =
      'abRequestId=2cc9c33a-d668-50c7-b816-7e4b1b1f2dc7; ets=1786371461272; webBuild=6.37.3; xsecappid=xhs-pc-web; a1=19fec09515aytc2mz887ziwi1cibm46b0vgg1a8ih50000243228; webId=24a637e2307d4c4ce7f96451fa333878; gid=yjidS8jK0J8qyjidS8j2yh0Y20v9SJ6uYYWuk3x3E3yS3k28D64KDy888J4qJJY8iKyiJjjd; web_session=0400697b5fc526e683dffb954c384b765f0e6f; id_token=VjEAAPtXz8eQmoFTYtJhplpAtKh2SYbvsqa30FDqtsKnveI0XF62PjhaValYuKbWX2jXkz6C4JnTWAvp+lLX372qMbegnemwdb4wa29QP1vSAYjbJG98WMVqhS6B0lBcXs1Xm9f5; x-rednote-datactry=CN; x-rednote-holderctry=CN; b1=I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSfMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdnoeSfqYHqwl2qt5B0DoIx+PGDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwrPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhEK+9DUIvzy4I8OIic7ZPwUIviC4o/sDLds6PwVIC7eSd7s69ImIh6s3zrdQut5IEos3j5exLJsVPwcr9gsSPtxICMPLgoefuw5zn5sWVwrI3S2I3z1oPwNaPw8BaZgyLOsD0OexutmIkJeYa/sx/QBIvOe6e5eWlRrIvNsDqwHIkHiwPwLNVt6I3OeiutdIEAedPtsI3ge3PwrzVtv2Pt8IkS7IhbEmmTaroOsSqwbI3YuIC0sxVt3KgDLc/JsDBYxIiHL2utKputiIxKs3uwMQpdeipJsTLzLIhvs6BOs1qtsBVwtIv7efVwIIkgs6nbKI3JsDfAs1uwyI3Oe6qtdQjRrIkF+IC6sxIoeVfAedrOsYPtzIiP1IvmhZqtoICljIhgsVL4lNj/sfqttIhp2Bqt1HI0sSL5e0uwpeut2IiFrIvEaQPtb+PwUIkesxYvexVwo2qtGICkRQutfIiIeHlYoIE6sT7ve09de6VwFBqtZIiLBIkvs6utWIEJeDM4DIE+GsIR3IvpsIvKeiutEBqwPqqw9IiHCIEvsTs5eiqwaLruMIhLdqut8rPthIxqRI3boIkSiIhOe0LAsibmPPPwKICGibqtHcPtlIi6ednW6IiFinMKedVt6eutaocLwP7FMIxb1aVwQIkNsDWzyIi+4oPwUIi8WsPtWoPt/ICPjICYDIEYtBPwPI3umICvsSqwXZm+eIErnIvesYges6Pw+IhzEICLH/zIhIhlVgmr9Ihesdp/eYPwoICeskPtpIEqPIE0siuwHIhQRmPwlIv3sdmGOgVtiePtrIC3ejPtPIEvsWF4XIE5sxDesTVtzwWNs3qwoQgNsiqtzI37sfm6eTVtPIEqTIilvruwctYYeIx6eSuwOZz6eDc+ptqtsI3ZwIiOeWmYbI3KefqwpIv4zIios0bH0IEIrIkrMgLMaIE0eDlZRIv8lIxGfIvKs0abA+PtPLPt4oAKeWresjutEIvKeV90exVwYwutbI3b9pqtlgPwvQVtXJqw1wVtubsgs1ZKe6doe3zNe6uwBIiWsIiHFIvpCIvesxaJeT0lkquwtIiVznqwOGddsTqw2ICOsYYdeDgbZIxOsdqwG+cq3IvAsYqwAIv0e1qtX+qwJI3/sDAkw2qtsnoAsfMm3IE/sjVwqbqtugUvs6Pw1cPtnLVwQIvisIhRAopAeWb7sTqt1IC/e3Pt+Lqw/tjKeVIYdL7m5JbrYgVwKaVwaIvkAIClPI3u0qYvsxaprIvzgI3QtputaICTEOVtaIkAeTWuxBVthIhuaaVttI3Js6mlOIhcxI3geYPtJnutQZMr=; unread={%22ub%22:%226a789a8e000000000e03b400%22%2C%22ue%22:%226a75e960000000003400eb54%22%2C%22uc%22:25}; loadts=1786439990816; websectiga=cf46039d1971c7b9a650d87269f31ac8fe3bf71d61ebf9d9a0a87efb414b816c; sec_poison_id=439bc871-2358-4d84-973d-cc75ffb3582d';

    //"contentId": "6a69d2f0000000000f01fbc9",
    //       "documentId": "6a69d2f0000000000f01fbc9",
    //       "xsecToken": "YBwXRIEFXn3nTy8tZigXdz3BfUFjjbEAkSWlQCjHjhtCI=",
    const contentResult = await Xiaohongshuhome.getXiaohongshuhomeCommentByContent(
      cookie,
      '6a69d2f0000000000f01fbc9',
      '',
      '',
      '',
      '',
      '',
    );
    console.log(JSON.stringify(contentResult, null, 2));

    expect(contentResult).not.toBeUndefined();
  }, 10000000);

  test('获取全局评论通知', async () => {
    const cookie =
      'abRequestId=2cc9c33a-d668-50c7-b816-7e4b1b1f2dc7; ets=1786371461272; webBuild=6.37.3; xsecappid=xhs-pc-web; a1=19fec09515aytc2mz887ziwi1cibm46b0vgg1a8ih50000243228; webId=24a637e2307d4c4ce7f96451fa333878; gid=yjidS8jK0J8qyjidS8j2yh0Y20v9SJ6uYYWuk3x3E3yS3k28D64KDy888J4qJJY8iKyiJjjd; web_session=0400697b5fc526e683dffb954c384b765f0e6f; id_token=VjEAAPtXz8eQmoFTYtJhplpAtKh2SYbvsqa30FDqtsKnveI0XF62PjhaValYuKbWX2jXkz6C4JnTWAvp+lLX372qMbegnemwdb4wa29QP1vSAYjbJG98WMVqhS6B0lBcXs1Xm9f5; x-rednote-datactry=CN; x-rednote-holderctry=CN; b1=I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSfMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdnoeSfqYHqwl2qt5B0DoIx+PGDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwrPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhEK+9DUIvzy4I8OIic7ZPwUIviC4o/sDLds6PwVIC7eSd7s69ImIh6s3zrdQut5IEos3j5exLJsVPwcr9gsSPtxICMPLgoefuw5zn5sWVwrI3S2I3z1oPwNaPw8BaZgyLOsD0OexutmIkJeYa/sx/QBIvOe6e5eWlRrIvNsDqwHIkHiwPwLNVt6I3OeiutdIEAedPtsI3ge3PwrzVtv2Pt8IkS7IhbEmmTaroOsSqwbI3YuIC0sxVt3KgDLc/JsDBYxIiHL2utKputiIxKs3uwMQpdeipJsTLzLIhvs6BOs1qtsBVwtIv7efVwIIkgs6nbKI3JsDfAs1uwyI3Oe6qtdQjRrIkF+IC6sxIoeVfAedrOsYPtzIiP1IvmhZqtoICljIhgsVL4lNj/sfqttIhp2Bqt1HI0sSL5e0uwpeut2IiFrIvEaQPtb+PwUIkesxYvexVwo2qtGICkRQutfIiIeHlYoIE6sT7ve09de6VwFBqtZIiLBIkvs6utWIEJeDM4DIE+GsIR3IvpsIvKeiutEBqwPqqw9IiHCIEvsTs5eiqwaLruMIhLdqut8rPthIxqRI3boIkSiIhOe0LAsibmPPPwKICGibqtHcPtlIi6ednW6IiFinMKedVt6eutaocLwP7FMIxb1aVwQIkNsDWzyIi+4oPwUIi8WsPtWoPt/ICPjICYDIEYtBPwPI3umICvsSqwXZm+eIErnIvesYges6Pw+IhzEICLH/zIhIhlVgmr9Ihesdp/eYPwoICeskPtpIEqPIE0siuwHIhQRmPwlIv3sdmGOgVtiePtrIC3ejPtPIEvsWF4XIE5sxDesTVtzwWNs3qwoQgNsiqtzI37sfm6eTVtPIEqTIilvruwctYYeIx6eSuwOZz6eDc+ptqtsI3ZwIiOeWmYbI3KefqwpIv4zIios0bH0IEIrIkrMgLMaIE0eDlZRIv8lIxGfIvKs0abA+PtPLPt4oAKeWresjutEIvKeV90exVwYwutbI3b9pqtlgPwvQVtXJqw1wVtubsgs1ZKe6doe3zNe6uwBIiWsIiHFIvpCIvesxaJeT0lkquwtIiVznqwOGddsTqw2ICOsYYdeDgbZIxOsdqwG+cq3IvAsYqwAIv0e1qtX+qwJI3/sDAkw2qtsnoAsfMm3IE/sjVwqbqtugUvs6Pw1cPtnLVwQIvisIhRAopAeWb7sTqt1IC/e3Pt+Lqw/tjKeVIYdL7m5JbrYgVwKaVwaIvkAIClPI3u0qYvsxaprIvzgI3QtputaICTEOVtaIkAeTWuxBVthIhuaaVttI3Js6mlOIhcxI3geYPtJnutQZMr=; acw_tc=0a00d2b617864309937793721e46fde009cca2a2700ef9f960487baff72165; loadts=1786430992852; unread={%22ub%22:%226a789a8e000000000e03b400%22%2C%22ue%22:%226a75e960000000003400eb54%22%2C%22uc%22:25}; websectiga=82e85efc5500b609ac1166aaf086ff8aa4261153a448ef0be5b17417e4512f28; sec_poison_id=df8d2133-3522-4cde-9d0e-b32305a2d7da';

    const contentResult = await Xiaohongshuhome.getXiaohongshuhomeLatestCommentNoticeList(
      cookie
    );
    console.log(JSON.stringify(contentResult, null, 2));

    expect(contentResult).not.toBeUndefined();
  }, 10000000);
  test('添加小红书作品评论', async () => {
    const cookie =
      'abRequestId=2cc9c33a-d668-50c7-b816-7e4b1b1f2dc7; ets=1786371461272; webBuild=6.37.3; xsecappid=xhs-pc-web; a1=19fec09515aytc2mz887ziwi1cibm46b0vgg1a8ih50000243228; webId=24a637e2307d4c4ce7f96451fa333878; gid=yjidS8jK0J8qyjidS8j2yh0Y20v9SJ6uYYWuk3x3E3yS3k28D64KDy888J4qJJY8iKyiJjjd; web_session=0400697b5fc526e683dffb954c384b765f0e6f; id_token=VjEAAPtXz8eQmoFTYtJhplpAtKh2SYbvsqa30FDqtsKnveI0XF62PjhaValYuKbWX2jXkz6C4JnTWAvp+lLX372qMbegnemwdb4wa29QP1vSAYjbJG98WMVqhS6B0lBcXs1Xm9f5; x-rednote-datactry=CN; x-rednote-holderctry=CN; b1=I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSfMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdnoeSfqYHqwl2qt5B0DoIx+PGDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwrPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhEK+9DUIvzy4I8OIic7ZPwUIviC4o/sDLds6PwVIC7eSd7s69ImIh6s3zrdQut5IEos3j5exLJsVPwcr9gsSPtxICMPLgoefuw5zn5sWVwrI3S2I3z1oPwNaPw8BaZgyLOsD0OexutmIkJeYa/sx/QBIvOe6e5eWlRrIvNsDqwHIkHiwPwLNVt6I3OeiutdIEAedPtsI3ge3PwrzVtv2Pt8IkS7IhbEmmTaroOsSqwbI3YuIC0sxVt3KgDLc/JsDBYxIiHL2utKputiIxKs3uwMQpdeipJsTLzLIhvs6BOs1qtsBVwtIv7efVwIIkgs6nbKI3JsDfAs1uwyI3Oe6qtdQjRrIkF+IC6sxIoeVfAedrOsYPtzIiP1IvmhZqtoICljIhgsVL4lNj/sfqttIhp2Bqt1HI0sSL5e0uwpeut2IiFrIvEaQPtb+PwUIkesxYvexVwo2qtGICkRQutfIiIeHlYoIE6sT7ve09de6VwFBqtZIiLBIkvs6utWIEJeDM4DIE+GsIR3IvpsIvKeiutEBqwPqqw9IiHCIEvsTs5eiqwaLruMIhLdqut8rPthIxqRI3boIkSiIhOe0LAsibmPPPwKICGibqtHcPtlIi6ednW6IiFinMKedVt6eutaocLwP7FMIxb1aVwQIkNsDWzyIi+4oPwUIi8WsPtWoPt/ICPjICYDIEYtBPwPI3umICvsSqwXZm+eIErnIvesYges6Pw+IhzEICLH/zIhIhlVgmr9Ihesdp/eYPwoICeskPtpIEqPIE0siuwHIhQRmPwlIv3sdmGOgVtiePtrIC3ejPtPIEvsWF4XIE5sxDesTVtzwWNs3qwoQgNsiqtzI37sfm6eTVtPIEqTIilvruwctYYeIx6eSuwOZz6eDc+ptqtsI3ZwIiOeWmYbI3KefqwpIv4zIios0bH0IEIrIkrMgLMaIE0eDlZRIv8lIxGfIvKs0abA+PtPLPt4oAKeWresjutEIvKeV90exVwYwutbI3b9pqtlgPwvQVtXJqw1wVtubsgs1ZKe6doe3zNe6uwBIiWsIiHFIvpCIvesxaJeT0lkquwtIiVznqwOGddsTqw2ICOsYYdeDgbZIxOsdqwG+cq3IvAsYqwAIv0e1qtX+qwJI3/sDAkw2qtsnoAsfMm3IE/sjVwqbqtugUvs6Pw1cPtnLVwQIvisIhRAopAeWb7sTqt1IC/e3Pt+Lqw/tjKeVIYdL7m5JbrYgVwKaVwaIvkAIClPI3u0qYvsxaprIvzgI3QtputaICTEOVtaIkAeTWuxBVthIhuaaVttI3Js6mlOIhcxI3geYPtJnutQZMr=; acw_tc=0a00d72617864166882795564e551c9fde9a411a4a88099ed704de967defc6; loadts=1786416687342; unread={%22ub%22:%226a7983d00000000028000ad2%22%2C%22ue%22:%226a6c40e7000000003301f39f%22%2C%22uc%22:28}; websectiga=9730ffafd96f2d09dc024760e253af6ab1feb0002827740b95a255ddf6847fc8; sec_poison_id=d5f339d1-07ea-4b80-9cbc-57d6754f0cb0';

    const worker = new XiaoHongShuHomeWorker(cookie);
    const result = await worker.addComment({
      text: '哈哈123',
      contentId: '6a69d2f0000000000f01fbc9',
    });
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('回复小红书作品评论', async () => {
    const cookie =
      'ets=1784538776218; a1=19f7eccc34e5g6oyeqrv9oe9u0unslq688zno84tn50000407087; webId=ba5b94d6fc6afd074d8f0b2f35a8e75d; gid=yjiWdSSSdDYJyjiWdSSSqYY44d2kKlvdAFhju9Ildj787I28IM1AKl88848W8YW8qYSWfyd4; abRequestId=ba5b94d6fc6afd074d8f0b2f35a8e75d; web_session=0400697b5fc526e683df47c643384b89ba2d2f; id_token=VjEAAHSvjtxap3D8XxRW7SmUWb//Y0sLxXrJ4Neffavc/X7oOyZ80nLp45jOr5g6piy+06XNuZlJhSJkMVPEX4oQ6L3CqwVC0XApsvG/gRuTdpTn9y2V1BoxM3bZ7jvhGwom4sft; x-rednote-datactry=CN; x-rednote-holderctry=CN; customer-sso-sid=68c517671597471051825158spuacnbotfxzix5o; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=224361373516627; access-token-creator.xiaohongshu.com=customer.creator.AT-68c5176715974710518251596sgcjuzcihlodtew; galaxy_creator_session_id=EPAlTDA2FbUv7tkNkwWotn37pnXIvHi9ZzAJ; galaxy.creator.beaker.session.id=1786182977967090325415; webBuild=6.37.3; acw_tc=0a4a870a17862458477571841e5b577c2b3b3a80c1176814818bb3f474970a; websectiga=9730ffafd96f2d09dc024760e253af6ab1feb0002827740b95a255ddf6847fc8; sec_poison_id=a6ce146b-6854-47d8-8b27-ca64e252bc44; unread={%22ub%22:%226a6b6cd60000000008010983%22%2C%22ue%22:%226a6fe393000000002c007dd4%22%2C%22uc%22:19}; xsecappid=ranchi; loadts=1786245858451';

    const worker = new XiaoHongShuHomeWorker(cookie);
    const result = await worker.addComment({
      text: 'hhh',
      contentId: '6a69d2f0000000000f01fbc9_ABoyXZm-DnHIqeuP63ye1YSyfGrGBALG3-WO9UBaKkGF0=',
      commentId: '6a6ac6d4000000002902c546',
    });
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('点赞小红书作品评论', async () => {
    const cookie =
      'ets=1784538776218; a1=19f7eccc34e5g6oyeqrv9oe9u0unslq688zno84tn50000407087; webId=ba5b94d6fc6afd074d8f0b2f35a8e75d; gid=yjiWdSSSdDYJyjiWdSSSqYY44d2kKlvdAFhju9Ildj787I28IM1AKl88848W8YW8qYSWfyd4; abRequestId=ba5b94d6fc6afd074d8f0b2f35a8e75d; web_session=0400697b5fc526e683df47c643384b89ba2d2f; id_token=VjEAAHSvjtxap3D8XxRW7SmUWb//Y0sLxXrJ4Neffavc/X7oOyZ80nLp45jOr5g6piy+06XNuZlJhSJkMVPEX4oQ6L3CqwVC0XApsvG/gRuTdpTn9y2V1BoxM3bZ7jvhGwom4sft; x-rednote-datactry=CN; x-rednote-holderctry=CN; customer-sso-sid=68c517671597471051825158spuacnbotfxzix5o; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=224361373516627; access-token-creator.xiaohongshu.com=customer.creator.AT-68c5176715974710518251596sgcjuzcihlodtew; galaxy_creator_session_id=EPAlTDA2FbUv7tkNkwWotn37pnXIvHi9ZzAJ; galaxy.creator.beaker.session.id=1786182977967090325415; webBuild=6.37.3; acw_tc=0a4a870a17862458477571841e5b577c2b3b3a80c1176814818bb3f474970a; websectiga=9730ffafd96f2d09dc024760e253af6ab1feb0002827740b95a255ddf6847fc8; sec_poison_id=a6ce146b-6854-47d8-8b27-ca64e252bc44; unread={%22ub%22:%226a6b6cd60000000008010983%22%2C%22ue%22:%226a6fe393000000002c007dd4%22%2C%22uc%22:19}; xsecappid=ranchi; loadts=1786245858451';

    const contentId = '6a69d2f0000000000f01fbc9_ABoyXZm-DnHIqeuP63ye1YS5U2dQ02iZtad_18nSIrxuI=';
    const commentId = '6a7992ba000000002300e4bd';
    const result = await Xiaohongshuhome.digXiaohongshuhomeComment(cookie, contentId, commentId);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('删除小红书主页评论', async () => {
    const cookie =
      'ets=1784538776218; a1=19f7eccc34e5g6oyeqrv9oe9u0unslq688zno84tn50000407087; webId=ba5b94d6fc6afd074d8f0b2f35a8e75d; gid=yjiWdSSSdDYJyjiWdSSSqYY44d2kKlvdAFhju9Ildj787I28IM1AKl88848W8YW8qYSWfyd4; abRequestId=ba5b94d6fc6afd074d8f0b2f35a8e75d; web_session=0400697b5fc526e683df47c643384b89ba2d2f; id_token=VjEAAHSvjtxap3D8XxRW7SmUWb//Y0sLxXrJ4Neffavc/X7oOyZ80nLp45jOr5g6piy+06XNuZlJhSJkMVPEX4oQ6L3CqwVC0XApsvG/gRuTdpTn9y2V1BoxM3bZ7jvhGwom4sft; x-rednote-datactry=CN; x-rednote-holderctry=CN; customer-sso-sid=68c517671597471051825158spuacnbotfxzix5o; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=224361373516627; access-token-creator.xiaohongshu.com=customer.creator.AT-68c5176715974710518251596sgcjuzcihlodtew; galaxy_creator_session_id=EPAlTDA2FbUv7tkNkwWotn37pnXIvHi9ZzAJ; galaxy.creator.beaker.session.id=1786182977967090325415; webBuild=6.37.3; unread={%22ub%22:%226a77d3d80000000026034f46%22%2C%22ue%22:%226a72fbed00000000080136e2%22%2C%22uc%22:24}; xsecappid=xhs-pc-web; acw_tc=0a4a075c17862583055031241e205782ed4d8c3c076f534d7a432f552dacd2; websectiga=a9bdcaed0af874f3a1431e94fbea410e8f738542fbb02df1e8e30c29ef3d91ac; sec_poison_id=7412742c-0394-4629-b5eb-52af13fb5a59; loadts=1786259782396';

    const worker = new XiaoHongShuHomeWorker(cookie);
    const result = await worker.delComment({
      contentId: '6a69d2f0000000000f01fbc9_ABoyXZm-DnHIqeuP63ye1YSyfGrGBALG3-WO9UBaKkGF0=',
      commentId: '6a782852000000002203ef07',
    });
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
