import { describe, expect, test } from 'vitest';
import { Kuaishou } from '../../../src';
import { getCookie } from './kuaishou-video-publish.test';

test('快手评论作品', async () => {
  const cookie = getCookie();
  const result = await Kuaishou.getKuaiShouCommentContent(cookie, '');
  console.log('快手评论作品：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('快手评论', async () => {
  const cookie = getCookie();
  const result = await Kuaishou.getKuaiShouCommentByContent(cookie, '3x9v5mez2h35ayg', '', '1075300820628');
  console.log('快手评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('快手评论二级', async () => {
  const cookie = getCookie();
  const result = await Kuaishou.getKuaiShouCommentByContent(
    cookie,
    '3x9v5mez2h35ayg',
    '1068736807076',
    '1075300820628',
  );
  console.log('快手评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('快手添加评论作品', async () => {
  const cookie = getCookie();
  const result = await Kuaishou.addKuaishouComment(cookie, '看看', '3x9v5mez2h35ayg');
  console.log('快手评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('快手回复一级评论', async () => {
  const cookie = getCookie();
  const result = await Kuaishou.addKuaishouComment(cookie, '看看', '3xhfui9z943k9rm', "1075596533936", "1695906108");
  console.log('快手评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('快手回复二级评论', async () => {
  const cookie = getCookie();
  const result = await Kuaishou.addKuaishouComment(cookie, '看看2', '3x9v5mez2h35ayg', '1075334297223', '2082921911');
  console.log('快手评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('快手点赞评论', async () => {
  const cookie = getCookie();
  const result = await Kuaishou.digKuaishouComment(cookie,  '3x9v5mez2h35ayg', '1075334297223','like');
  console.log('快手评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('快手删除评论', async () => {
  const cookie = getCookie();
  const result = await Kuaishou.delKuaishouComment(cookie,  '3x9v5mez2h35ayg', '1075334297223');
  console.log('快手评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);
