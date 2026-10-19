import { test } from 'vitest';
import { Platforms } from '../../../src/service/datasync-service-manager';
import { AccountService, Xiaohongshuhome } from '../../../src';

const cookie =
  'abRequestId=8e20d83c-e562-5886-a04e-dde4efcca95a; ets=1784597405699; a1=19f824b6036g5miw6laz1acm010fc6gyjdac17qr750000352814; webId=06dd7bbe777552a4cc8f8bfc84663dc8; gid=yjiYJ4DWJdVKyjiYJ4DK8fWAqKk263EK10uy0FW0S68y8S28iSKkvy888q2JYy48KdKyi2dq; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=161519213062271; customer-sso-sid=68c5176703452175021506565afhll8v8uq11ecm; access-token-creator.xiaohongshu.com=customer.creator.AT-68c5176703452175021178896s2pvlnkhlqqxipj; galaxy_creator_session_id=u7qs2Yly0YOHFcdpHHRg85iIcZ97g0bLiJOU; galaxy.creator.beaker.session.id=1785891414032080495442; xsecappid=xhs-pc-web; webBuild=6.37.3; web_session=0400697b5fc526e683dfda0e40384b3d4978e3; id_token=VjEAAMw4iMRLViEkjJ3I649YFenbT4EZB5GJG9+DFSbVLsTp+fovPINcXEngowMtVR7SGIC9btGLMIPZ8taqLmuPobl0mAk6DJogX0mqDPr2GWAnM6xePXbY1d/DxytIVGeAb6Ru; x-rednote-datactry=CN; x-rednote-holderctry=CN; acw_tc=0a00d77517860811214681592ebc55ca24c2555572d57a676678ca5907687b; loadts=1786081124381; websectiga=6169c1e84f393779a5f7de7303038f3b47a78e47be716e7bec57ccce17d45f99; sec_poison_id=f402b7e7-ef25-437f-9044-b299fd18e0d8; unread={%22ub%22:%226a623fdb000000001101b6a1%22%2C%22ue%22:%226a7099f2000000003302d3d5%22%2C%22uc%22:29}';

test('小红书首页用户信息', async () => {
  const r = await Xiaohongshuhome.getXiaohongshuhomeUserInfo(cookie);
  console.log(JSON.stringify(r, null, 2));
}, 10000000);

test('小红书首页有效检测', async () => {
  const server = new AccountService(cookie, Platforms.XiaoHongShuHome);
  console.log('是否有效', await server.checkAccountAlive());
}, 10000000);
