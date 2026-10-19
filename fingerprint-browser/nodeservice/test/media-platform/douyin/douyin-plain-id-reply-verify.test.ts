/**
 * 【人工触发的线上验证实验】抖音回复接口是否接受明文 ID（cid / aweme_id）
 *
 * 背景：灵境的抖音评论 webhook 只带明文 documentId(aweme_id)，不带评论 ID，下游只能用
 * 「内容+昵称+时间」模糊匹配去换取 V1 创作者接口的加密 comment_id 再回复，约两成评论
 * 匹配不上、永远不会被自动回复。而通知接口手里其实有明文 cid（构造推送时被丢弃）。
 * 若回复接口接受明文 cid + aweme_id，则推送补上 cid 后整个匹配层可退役。
 *
 * 代码史查证（2026-06-29）：V2 明文列表接口曾因 V1 签名故障临时启用约 2 小时，当天修复
 * 签名后切回 V1；明文回复从未被测试过（生产库 0 样本），只能实测定论。
 *
 * 运行方式（需要一个公司测试抖音账号，会真实发出并删除一条评论回复）：
 *   DY_VERIFY=1 \
 *   DY_COOKIE='<创作者中心cookie字符串>' \
 *   DY_LOCALSTORAGE='<账号localStorage JSON（含 security-sdk 两个键）>' \
 *   DY_AWEME_ID='<明文作品id，即webhook里的documentId>' \
 *   DY_CID='<明文评论cid，从V2列表或通知接口取>' \
 *   npx vitest run test/media-platform/douyin/douyin-plain-id-reply-verify.test.ts
 *
 * 判定：
 *   - 实验A status_code=0 且返回 comment_info => 回复接口接受明文 ID，匹配层可退役（大结论）
 *   - 实验A 失败、实验B(janus publish)成功 => 有替代明文回复端点，同样可退役
 *   - 两者都失败 => 明文直连不可行，保留匹配层，转而做限流/重试窗口优化
 */
import { describe, expect, it } from 'vitest';
import {
  addDouyinContentCommentResponse,
  getDouyinSignleContentCommentListResponseV2,
} from '@/media-platform/douyin/douyin-comment.service';
import { delDouYinComment } from '@/media-platform/douyin/douyin-comment';
import { getSdkToken } from '@/media-platform/douyin/douyin-base.service';

const enabled = process.env.DY_VERIFY === '1';
const d = describe.runIf(enabled);

function requiredEnv(name: string): string {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`缺少环境变量 ${name}`);
  return value;
}

d('抖音明文 ID 回复验证（真实请求，人工触发）', () => {
  it(
    '实验A: V1 回复端点 + 明文 aweme_id/cid',
    async () => {
      const cookie = requiredEnv('DY_COOKIE');
      const localStorageStr = requiredEnv('DY_LOCALSTORAGE');
      const awemeId = requiredEnv('DY_AWEME_ID');
      const cid = requiredEnv('DY_CID');
      const text = process.env.DY_TEXT || '感谢支持[比心]';

      // 前置（只读）：V2 列表确认该 cid 真实存在于该作品下，避免拿错参数得出假阴性
      const list = await getDouyinSignleContentCommentListResponseV2(cookie, awemeId, 0, 50);
      console.log('[前置] V2列表 status_code=', list?.status_code, 'total=', list?.total);
      const target = (list?.comments || []).find((c) => String(c.cid) === cid);
      console.log('[前置] cid 是否在列表中:', !!target, target ? `text=${target.text}` : '');
      expect(list?.status_code).toBe(0);
      expect(target).toBeTruthy();

      // 拼上 security-sdk 键（与 addDouYinComment 内部逻辑一致），拿 csrf token
      const ls = JSON.parse(localStorageStr) as Record<string, string>;
      const fullCookie =
        `${cookie};security-sdk/s_sdk_sign_data_key/web_protect=` +
        `${encodeURIComponent(ls['security-sdk/s_sdk_sign_data_key/web_protect'])}` +
        `;security-sdk/s_sdk_crypt_sdk=${encodeURIComponent(ls['security-sdk/s_sdk_crypt_sdk'])}`;
      const sdkToken = await getSdkToken(cookie);
      console.log('[前置] sdkToken 获取:', sdkToken ? 'ok' : '失败');

      // 实验A：明文 item_id=aweme_id、comment_Id=cid 调 V1 回复端点
      const re = await addDouyinContentCommentResponse(fullCookie, sdkToken, text, awemeId, cid);
      console.log('[实验A] status_code=', re?.status_code, 'status_msg=', re?.status_msg);
      console.log('[实验A] comment_info=', JSON.stringify(re?.comment_info ?? null));

      // 成功则清理：删掉刚发的回复，避免测试账号留下痕迹
      const replyId = re?.comment_info?.comment_id?.toString();
      if (re?.status_code === 0 && replyId) {
        const del = await delDouYinComment(cookie, sdkToken, replyId);
        console.log('[清理] 删除回复:', del?.code === 0 ? 'ok' : `失败 ${del?.msg}`);
      }

      // 断言只做记录性校验：无论結论如何都让输出完整打印，人工读日志定论
      expect(typeof re?.status_code).toBe('number');
    },
    120_000,
  );
});
