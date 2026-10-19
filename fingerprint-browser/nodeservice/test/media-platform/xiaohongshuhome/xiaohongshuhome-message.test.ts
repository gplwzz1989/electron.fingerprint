import { describe, test } from 'vitest';
import { XiaohongshuhomeMsgWorker } from '../../../src/cloud/task/xiaohongshuhome-msg-worker';
import { XiaoHongShuHomeWorker } from '../../../src/cloud/task/platform/xiaohongshuhomeworker';
import { Xiaohongshuhome } from '../../../src';

describe.runIf(true)('【小红书主页真实测试】', () => {
  test('获取小红书主页用户信息', async () => {
    const cookie =
      'ets=1784538776218; a1=19f7eccc34e5g6oyeqrv9oe9u0unslq688zno84tn50000407087; webId=ba5b94d6fc6afd074d8f0b2f35a8e75d; gid=yjiWdSSSdDYJyjiWdSSSqYY44d2kKlvdAFhju9Ildj787I28IM1AKl88848W8YW8qYSWfyd4; abRequestId=ba5b94d6fc6afd074d8f0b2f35a8e75d; web_session=0400697b5fc526e683df47c643384b89ba2d2f; id_token=VjEAAHSvjtxap3D8XxRW7SmUWb//Y0sLxXrJ4Neffavc/X7oOyZ80nLp45jOr5g6piy+06XNuZlJhSJkMVPEX4oQ6L3CqwVC0XApsvG/gRuTdpTn9y2V1BoxM3bZ7jvhGwom4sft; x-rednote-datactry=CN; x-rednote-holderctry=CN; customer-sso-sid=68c517671597471051825158spuacnbotfxzix5o; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=224361373516627; access-token-creator.xiaohongshu.com=customer.creator.AT-68c5176715974710518251596sgcjuzcihlodtew; galaxy_creator_session_id=EPAlTDA2FbUv7tkNkwWotn37pnXIvHi9ZzAJ; galaxy.creator.beaker.session.id=1786182977967090325415; webBuild=6.37.3; acw_tc=0a4a870a17862458477571841e5b577c2b3b3a80c1176814818bb3f474970a; websectiga=9730ffafd96f2d09dc024760e253af6ab1feb0002827740b95a255ddf6847fc8; sec_poison_id=a6ce146b-6854-47d8-8b27-ca64e252bc44; unread={%22ub%22:%226a6b6cd60000000008010983%22%2C%22ue%22:%226a6fe393000000002c007dd4%22%2C%22uc%22:19}; xsecappid=ranchi; loadts=1786245858451';

    const worker = new XiaoHongShuHomeWorker(cookie);
    const result = await worker.getUserInfo();
    console.log(JSON.stringify(result, null, 2));
  }, 10000000);

  test('获取小红书主页对话列表', async () => {
    const cookie =
      'abRequestId=2cc9c33a-d668-50c7-b816-7e4b1b1f2dc7; ets=1786371461272; webBuild=6.37.3; xsecappid=xhs-pc-web; a1=19fec09515aytc2mz887ziwi1cibm46b0vgg1a8ih50000243228; webId=24a637e2307d4c4ce7f96451fa333878; gid=yjidS8jK0J8qyjidS8j2yh0Y20v9SJ6uYYWuk3x3E3yS3k28D64KDy888J4qJJY8iKyiJjjd; web_session=0400697b5fc526e683dffb954c384b765f0e6f; id_token=VjEAAPtXz8eQmoFTYtJhplpAtKh2SYbvsqa30FDqtsKnveI0XF62PjhaValYuKbWX2jXkz6C4JnTWAvp+lLX372qMbegnemwdb4wa29QP1vSAYjbJG98WMVqhS6B0lBcXs1Xm9f5; x-rednote-datactry=CN; x-rednote-holderctry=CN; b1=I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSfMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdnoeSfqYHqwl2qt5B0DoIx+PGDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwrPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhEK+9DUIvzy4I8OIic7ZPwUIviC4o/sDLds6PwVIC7eSd7s69ImIh6s3zrdQut5IEos3j5exLJsVPwcr9gsSPtxICMPLgoefuw5zn5sWVwrI3S2I3z1oPwNaPw8BaZgyLOsD0OexutmIkJeYa/sx/QBIvOe6e5eWlRrIvNsDqwHIkHiwPwLNVt6I3OeiutdIEAedPtsI3ge3PwrzVtv2Pt8IkS7IhbEmmTaroOsSqwbI3YuIC0sxVt3KgDLc/JsDBYxIiHL2utKputiIxKs3uwMQpdeipJsTLzLIhvs6BOs1qtsBVwtIv7efVwIIkgs6nbKI3JsDfAs1uwyI3Oe6qtdQjRrIkF+IC6sxIoeVfAedrOsYPtzIiP1IvmhZqtoICljIhgsVL4lNj/sfqttIhp2Bqt1HI0sSL5e0uwpeut2IiFrIvEaQPtb+PwUIkesxYvexVwo2qtGICkRQutfIiIeHlYoIE6sT7ve09de6VwFBqtZIiLBIkvs6utWIEJeDM4DIE+GsIR3IvpsIvKeiutEBqwPqqw9IiHCIEvsTs5eiqwaLruMIhLdqut8rPthIxqRI3boIkSiIhOe0LAsibmPPPwKICGibqtHcPtlIi6ednW6IiFinMKedVt6eutaocLwP7FMIxb1aVwQIkNsDWzyIi+4oPwUIi8WsPtWoPt/ICPjICYDIEYtBPwPI3umICvsSqwXZm+eIErnIvesYges6Pw+IhzEICLH/zIhIhlVgmr9Ihesdp/eYPwoICeskPtpIEqPIE0siuwHIhQRmPwlIv3sdmGOgVtiePtrIC3ejPtPIEvsWF4XIE5sxDesTVtzwWNs3qwoQgNsiqtzI37sfm6eTVtPIEqTIilvruwctYYeIx6eSuwOZz6eDc+ptqtsI3ZwIiOeWmYbI3KefqwpIv4zIios0bH0IEIrIkrMgLMaIE0eDlZRIv8lIxGfIvKs0abA+PtPLPt4oAKeWresjutEIvKeV90exVwYwutbI3b9pqtlgPwvQVtXJqw1wVtubsgs1ZKe6doe3zNe6uwBIiWsIiHFIvpCIvesxaJeT0lkquwtIiVznqwOGddsTqw2ICOsYYdeDgbZIxOsdqwG+cq3IvAsYqwAIv0e1qtX+qwJI3/sDAkw2qtsnoAsfMm3IE/sjVwqbqtugUvs6Pw1cPtnLVwQIvisIhRAopAeWb7sTqt1IC/e3Pt+Lqw/tjKeVIYdL7m5JbrYgVwKaVwaIvkAIClPI3u0qYvsxaprIvzgI3QtputaICTEOVtaIkAeTWuxBVthIhuaaVttI3Js6mlOIhcxI3geYPtJnutQZMr=; unread={%22ub%22:%226a789a8e000000000e03b400%22%2C%22ue%22:%226a75e960000000003400eb54%22%2C%22uc%22:25}; loadts=1786439990816; websectiga=cf46039d1971c7b9a650d87269f31ac8fe3bf71d61ebf9d9a0a87efb414b816c; sec_poison_id=439bc871-2358-4d84-973d-cc75ffb3582d';

    const worker = new XiaoHongShuHomeWorker(cookie);
    const userInfo = await worker.getUserInfo();
    const accountId = userInfo?.yixiaoerId ?? '';
    const conversationResult = await worker.getConversationList({ nextPage: '', platformAuthorId: accountId });
    console.log(JSON.stringify(conversationResult, null, 2));

    const conversation = conversationResult.dataList?.[0];
    if (!conversation?.sessionId || !conversation.messageUserId) {
      return;
    }

    const messageResult = await worker.getMessageListByConversation({
      sessionId: conversation.sessionId,
      messageUserId: conversation.messageUserId,
      platformAuthorId: accountId,
    });
    console.log(JSON.stringify(messageResult, null, 2));
  }, 10000000);

  test('获取小红书主页指定对话的详情', async () => {
    const cookie =
      'abRequestId=2cc9c33a-d668-50c7-b816-7e4b1b1f2dc7; ets=1786371461272; webBuild=6.37.3; xsecappid=xhs-pc-web; a1=19fec09515aytc2mz887ziwi1cibm46b0vgg1a8ih50000243228; webId=24a637e2307d4c4ce7f96451fa333878; gid=yjidS8jK0J8qyjidS8j2yh0Y20v9SJ6uYYWuk3x3E3yS3k28D64KDy888J4qJJY8iKyiJjjd; web_session=0400697b5fc526e683dffb954c384b765f0e6f; id_token=VjEAAPtXz8eQmoFTYtJhplpAtKh2SYbvsqa30FDqtsKnveI0XF62PjhaValYuKbWX2jXkz6C4JnTWAvp+lLX372qMbegnemwdb4wa29QP1vSAYjbJG98WMVqhS6B0lBcXs1Xm9f5; x-rednote-datactry=CN; x-rednote-holderctry=CN; b1=I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSfMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdnoeSfqYHqwl2qt5B0DoIx+PGDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwrPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhEK+9DUIvzy4I8OIic7ZPwUIviC4o/sDLds6PwVIC7eSd7s69ImIh6s3zrdQut5IEos3j5exLJsVPwcr9gsSPtxICMPLgoefuw5zn5sWVwrI3S2I3z1oPwNaPw8BaZgyLOsD0OexutmIkJeYa/sx/QBIvOe6e5eWlRrIvNsDqwHIkHiwPwLNVt6I3OeiutdIEAedPtsI3ge3PwrzVtv2Pt8IkS7IhbEmmTaroOsSqwbI3YuIC0sxVt3KgDLc/JsDBYxIiHL2utKputiIxKs3uwMQpdeipJsTLzLIhvs6BOs1qtsBVwtIv7efVwIIkgs6nbKI3JsDfAs1uwyI3Oe6qtdQjRrIkF+IC6sxIoeVfAedrOsYPtzIiP1IvmhZqtoICljIhgsVL4lNj/sfqttIhp2Bqt1HI0sSL5e0uwpeut2IiFrIvEaQPtb+PwUIkesxYvexVwo2qtGICkRQutfIiIeHlYoIE6sT7ve09de6VwFBqtZIiLBIkvs6utWIEJeDM4DIE+GsIR3IvpsIvKeiutEBqwPqqw9IiHCIEvsTs5eiqwaLruMIhLdqut8rPthIxqRI3boIkSiIhOe0LAsibmPPPwKICGibqtHcPtlIi6ednW6IiFinMKedVt6eutaocLwP7FMIxb1aVwQIkNsDWzyIi+4oPwUIi8WsPtWoPt/ICPjICYDIEYtBPwPI3umICvsSqwXZm+eIErnIvesYges6Pw+IhzEICLH/zIhIhlVgmr9Ihesdp/eYPwoICeskPtpIEqPIE0siuwHIhQRmPwlIv3sdmGOgVtiePtrIC3ejPtPIEvsWF4XIE5sxDesTVtzwWNs3qwoQgNsiqtzI37sfm6eTVtPIEqTIilvruwctYYeIx6eSuwOZz6eDc+ptqtsI3ZwIiOeWmYbI3KefqwpIv4zIios0bH0IEIrIkrMgLMaIE0eDlZRIv8lIxGfIvKs0abA+PtPLPt4oAKeWresjutEIvKeV90exVwYwutbI3b9pqtlgPwvQVtXJqw1wVtubsgs1ZKe6doe3zNe6uwBIiWsIiHFIvpCIvesxaJeT0lkquwtIiVznqwOGddsTqw2ICOsYYdeDgbZIxOsdqwG+cq3IvAsYqwAIv0e1qtX+qwJI3/sDAkw2qtsnoAsfMm3IE/sjVwqbqtugUvs6Pw1cPtnLVwQIvisIhRAopAeWb7sTqt1IC/e3Pt+Lqw/tjKeVIYdL7m5JbrYgVwKaVwaIvkAIClPI3u0qYvsxaprIvzgI3QtputaICTEOVtaIkAeTWuxBVthIhuaaVttI3Js6mlOIhcxI3geYPtJnutQZMr=; unread={%22ub%22:%226a789a8e000000000e03b400%22%2C%22ue%22:%226a75e960000000003400eb54%22%2C%22uc%22:25}; loadts=1786439990816; websectiga=cf46039d1971c7b9a650d87269f31ac8fe3bf71d61ebf9d9a0a87efb414b816c; sec_poison_id=439bc871-2358-4d84-973d-cc75ffb3582d';

    const messageResult = await Xiaohongshuhome.getXiaohongshuhomeMessageConversationInfo(
      cookie,
      '6a1ae07c000000000103e400',
      '',
    );
    console.log(JSON.stringify(messageResult, null, 2));
  }, 10000000);

  test('获取小红书主页指定对话的历史私信', async () => {
    const cookie =
      'abRequestId=2cc9c33a-d668-50c7-b816-7e4b1b1f2dc7; ets=1786371461272; webBuild=6.37.3; xsecappid=xhs-pc-web; a1=19fec09515aytc2mz887ziwi1cibm46b0vgg1a8ih50000243228; webId=24a637e2307d4c4ce7f96451fa333878; gid=yjidS8jK0J8qyjidS8j2yh0Y20v9SJ6uYYWuk3x3E3yS3k28D64KDy888J4qJJY8iKyiJjjd; web_session=0400697b5fc526e683dffb954c384b765f0e6f; id_token=VjEAAPtXz8eQmoFTYtJhplpAtKh2SYbvsqa30FDqtsKnveI0XF62PjhaValYuKbWX2jXkz6C4JnTWAvp+lLX372qMbegnemwdb4wa29QP1vSAYjbJG98WMVqhS6B0lBcXs1Xm9f5; x-rednote-datactry=CN; x-rednote-holderctry=CN; b1=I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSfMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdnoeSfqYHqwl2qt5B0DoIx+PGDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwrPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhEK+9DUIvzy4I8OIic7ZPwUIviC4o/sDLds6PwVIC7eSd7s69ImIh6s3zrdQut5IEos3j5exLJsVPwcr9gsSPtxICMPLgoefuw5zn5sWVwrI3S2I3z1oPwNaPw8BaZgyLOsD0OexutmIkJeYa/sx/QBIvOe6e5eWlRrIvNsDqwHIkHiwPwLNVt6I3OeiutdIEAedPtsI3ge3PwrzVtv2Pt8IkS7IhbEmmTaroOsSqwbI3YuIC0sxVt3KgDLc/JsDBYxIiHL2utKputiIxKs3uwMQpdeipJsTLzLIhvs6BOs1qtsBVwtIv7efVwIIkgs6nbKI3JsDfAs1uwyI3Oe6qtdQjRrIkF+IC6sxIoeVfAedrOsYPtzIiP1IvmhZqtoICljIhgsVL4lNj/sfqttIhp2Bqt1HI0sSL5e0uwpeut2IiFrIvEaQPtb+PwUIkesxYvexVwo2qtGICkRQutfIiIeHlYoIE6sT7ve09de6VwFBqtZIiLBIkvs6utWIEJeDM4DIE+GsIR3IvpsIvKeiutEBqwPqqw9IiHCIEvsTs5eiqwaLruMIhLdqut8rPthIxqRI3boIkSiIhOe0LAsibmPPPwKICGibqtHcPtlIi6ednW6IiFinMKedVt6eutaocLwP7FMIxb1aVwQIkNsDWzyIi+4oPwUIi8WsPtWoPt/ICPjICYDIEYtBPwPI3umICvsSqwXZm+eIErnIvesYges6Pw+IhzEICLH/zIhIhlVgmr9Ihesdp/eYPwoICeskPtpIEqPIE0siuwHIhQRmPwlIv3sdmGOgVtiePtrIC3ejPtPIEvsWF4XIE5sxDesTVtzwWNs3qwoQgNsiqtzI37sfm6eTVtPIEqTIilvruwctYYeIx6eSuwOZz6eDc+ptqtsI3ZwIiOeWmYbI3KefqwpIv4zIios0bH0IEIrIkrMgLMaIE0eDlZRIv8lIxGfIvKs0abA+PtPLPt4oAKeWresjutEIvKeV90exVwYwutbI3b9pqtlgPwvQVtXJqw1wVtubsgs1ZKe6doe3zNe6uwBIiWsIiHFIvpCIvesxaJeT0lkquwtIiVznqwOGddsTqw2ICOsYYdeDgbZIxOsdqwG+cq3IvAsYqwAIv0e1qtX+qwJI3/sDAkw2qtsnoAsfMm3IE/sjVwqbqtugUvs6Pw1cPtnLVwQIvisIhRAopAeWb7sTqt1IC/e3Pt+Lqw/tjKeVIYdL7m5JbrYgVwKaVwaIvkAIClPI3u0qYvsxaprIvzgI3QtputaICTEOVtaIkAeTWuxBVthIhuaaVttI3Js6mlOIhcxI3geYPtJnutQZMr=; unread={%22ub%22:%226a789a8e000000000e03b400%22%2C%22ue%22:%226a75e960000000003400eb54%22%2C%22uc%22:25}; loadts=1786439990816; websectiga=cf46039d1971c7b9a650d87269f31ac8fe3bf71d61ebf9d9a0a87efb414b816c; sec_poison_id=439bc871-2358-4d84-973d-cc75ffb3582d';

    const messageResult = await Xiaohongshuhome.getXiaohongshuhomeMessageListByConversation(
      cookie,
      '6a1ae07c000000000103e400',
      '',
    );
    console.log(JSON.stringify(messageResult, null, 2));
  }, 10000000);

  test('发送小红书主页文本私信', async () => {
    const cookie =
      'ets=1784538776218; a1=19f7eccc34e5g6oyeqrv9oe9u0unslq688zno84tn50000407087; webId=ba5b94d6fc6afd074d8f0b2f35a8e75d; gid=yjiWdSSSdDYJyjiWdSSSqYY44d2kKlvdAFhju9Ildj787I28IM1AKl88848W8YW8qYSWfyd4; abRequestId=ba5b94d6fc6afd074d8f0b2f35a8e75d; web_session=0400697b5fc526e683df47c643384b89ba2d2f; id_token=VjEAAHSvjtxap3D8XxRW7SmUWb//Y0sLxXrJ4Neffavc/X7oOyZ80nLp45jOr5g6piy+06XNuZlJhSJkMVPEX4oQ6L3CqwVC0XApsvG/gRuTdpTn9y2V1BoxM3bZ7jvhGwom4sft; x-rednote-datactry=CN; x-rednote-holderctry=CN; customer-sso-sid=68c517671597471051825158spuacnbotfxzix5o; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=224361373516627; access-token-creator.xiaohongshu.com=customer.creator.AT-68c5176715974710518251596sgcjuzcihlodtew; galaxy_creator_session_id=EPAlTDA2FbUv7tkNkwWotn37pnXIvHi9ZzAJ; galaxy.creator.beaker.session.id=1786182977967090325415; webBuild=6.37.3; acw_tc=0a4a870a17862458477571841e5b577c2b3b3a80c1176814818bb3f474970a; websectiga=9730ffafd96f2d09dc024760e253af6ab1feb0002827740b95a255ddf6847fc8; sec_poison_id=a6ce146b-6854-47d8-8b27-ca64e252bc44; unread={%22ub%22:%226a6b6cd60000000008010983%22%2C%22ue%22:%226a6fe393000000002c007dd4%22%2C%22uc%22:19}; xsecappid=ranchi; loadts=1786245858451';
    const receiverId = '6a1ae07c000000000103e400';
    // "messageOwnerId": "6a1ae07c000000000103e400",
    //   "sessionId": "6a1ae07c000000000103e400",
    //   "secSessionId": "5b7b6eb42352610001dcd389",
    const worker = new XiaoHongShuHomeWorker(cookie);
    const userInfo = await worker.getUserInfo();
    const senderId = userInfo?.yixiaoerId ?? '';
    if (!senderId) {
      console.warn('获取小红书主页发送方id失败，跳过文本私信测试');
      return;
    }

    const result = await worker.SendMessage({
      sessionId: receiverId,
      platformAuthorId: senderId,
      text: '小红书主页文本私信测试',
    });
    console.log(JSON.stringify(result, null, 2));
  }, 10000000);

  test('发送小红书主页带表情文本私信', async () => {
    const cookie =
      'a1=1993ceace54dfu3npu5atbgxpy6cqxnelzud853z950000285482; webId=3b37b5e5a1032e9aec95aa0be72b7d53; x-user-id-ark.xiaohongshu.com=605418e20000000001008a3e; customerClientId=746042430884954; gid=yjjqSdfyK21fyjjqSd0Sdu2q24fi7qIU72097ujDkCUvKf28SACIdY888JY24YJ8W4YS8D2i; abRequestId=3b37b5e5a1032e9aec95aa0be72b7d53; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517576825843684933640hd8t99snmnv9dnku; galaxy_creator_session_id=kRTovaSTxkDzqMs4RNb2zBfvRJo2nZaQhWq4; galaxy.creator.beaker.session.id=1764117238904081879065; web_session=0400697b5fc526e683df70d1033b4b0713763f; acw_tc=0a4269db17652652325601842e031db7fd03b96401ee38db0678470f8f80a2; customer-sso-sid=68c517581756577809743873yuqu32vuawh8cblk; x-user-id-pro.xiaohongshu.com=61b8073f000000001000c5c2; access-token-pro.xiaohongshu.com=customer.ares.AT-68c517581756577809711108cftxrze6pixve6gc; access-token-pro.beta.xiaohongshu.com=customer.ares.AT-68c517581756577809711108cftxrze6pixve6gc; loadts=1765265446764; xsecappid=pro-enterprise-next; websectiga=3633fe24d49c7dd0eb923edc8205740f10fdb18b25d424d2a2322c6196d2a4ad; sec_poison_id=eb1ad76b-7338-4ca2-a956-6f4527d6b965';
    const receiverId = '6a1ae07c000000000103e400';

    const worker = new XiaoHongShuHomeWorker(cookie);
    const userInfo = await worker.getUserInfo();
    const senderId = userInfo?.yixiaoerId ?? '';
    if (!senderId) {
      console.warn('获取小红书主页发送方id失败，跳过带表情文本私信测试');
      return;
    }

    const result = await worker.SendMessage({
      sessionId: receiverId,
      platformAuthorId: senderId,
      text: '小红书主页带表情文本私信测试，[哭惹R]',
    });
    console.log(JSON.stringify(result, null, 2));
  }, 10000000);

  test('小红书主页实时接收私信（WebSocket）', async () => {
    const cookie =
      'ets=1784538776218; a1=19f7eccc34e5g6oyeqrv9oe9u0unslq688zno84tn50000407087; webId=ba5b94d6fc6afd074d8f0b2f35a8e75d; gid=yjiWdSSSdDYJyjiWdSSSqYY44d2kKlvdAFhju9Ildj787I28IM1AKl88848W8YW8qYSWfyd4; abRequestId=ba5b94d6fc6afd074d8f0b2f35a8e75d; web_session=0400697b5fc526e683df47c643384b89ba2d2f; id_token=VjEAAHSvjtxap3D8XxRW7SmUWb//Y0sLxXrJ4Neffavc/X7oOyZ80nLp45jOr5g6piy+06XNuZlJhSJkMVPEX4oQ6L3CqwVC0XApsvG/gRuTdpTn9y2V1BoxM3bZ7jvhGwom4sft; x-rednote-datactry=CN; x-rednote-holderctry=CN; customer-sso-sid=68c517671597471051825158spuacnbotfxzix5o; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=224361373516627; access-token-creator.xiaohongshu.com=customer.creator.AT-68c5176715974710518251596sgcjuzcihlodtew; galaxy_creator_session_id=EPAlTDA2FbUv7tkNkwWotn37pnXIvHi9ZzAJ; galaxy.creator.beaker.session.id=1786182977967090325415; webBuild=6.37.3; acw_tc=0a4a870a17862458477571841e5b577c2b3b3a80c1176814818bb3f474970a; websectiga=9730ffafd96f2d09dc024760e253af6ab1feb0002827740b95a255ddf6847fc8; sec_poison_id=a6ce146b-6854-47d8-8b27-ca64e252bc44; unread={%22ub%22:%226a6b6cd60000000008010983%22%2C%22ue%22:%226a6fe393000000002c007dd4%22%2C%22uc%22:19}; xsecappid=ranchi; loadts=1786245858451';
    // WebSocket登录参数由主页接口动态获取
    const platformWorker = new XiaoHongShuHomeWorker(cookie);
    const userInfo = await platformWorker.getUserInfo();
    const userId = userInfo?.yixiaoerId ?? '';
    if (!userId) {
      console.warn('获取小红书主页用户id失败，跳过实时私信测试');
      return;
    }

    const worker = new XiaohongshuhomeMsgWorker(cookie, undefined, {
      platformAuthorId: userId,
    });
    const wsService = await worker.createWebSocketService();
    if (!wsService) {
      console.warn('小红书主页WebSocket凭证无效，跳过实时私信测试');
      await worker.dropMsgService();
      return;
    }

    wsService.on('authenticated', () => {
      console.log('小红书主页WebSocket认证成功，等待私信');
    });
    wsService.on('newMessage', (notifyData) => {
      console.log(`收到小红书主页WebSocket私信:${JSON.stringify(notifyData, null, 2)}`);
    });
    wsService.on('authFailed', (reason) => {
      console.warn(`小红书主页WebSocket认证失败:${reason}`);
    });

    wsService.connect();
    const waitMilliseconds = 3000000;
    await new Promise<void>((resolve) => setTimeout(resolve, Math.max(waitMilliseconds, 1000)));
    wsService.close();
    await worker.dropMsgService();
  }, 100000000);
});
