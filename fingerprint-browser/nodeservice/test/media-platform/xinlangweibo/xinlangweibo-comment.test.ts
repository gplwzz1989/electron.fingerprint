import { describe, expect, test } from 'vitest';
import { Kuaishou, Xinlangweibo } from '../../../src';
import fs from 'fs';
import path from 'path';
export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

test('微博评论作品', async () => {
  const cookie = getCookie();
  const result = await Xinlangweibo.getXinlangweiboCommentContent(cookie, '2');
  console.log('微博评论作品：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('微博评论', async () => {
  const cookie = getCookie();
  const result = await Xinlangweibo.getXinlangweiboCommentByContent(cookie, '5244793854886629');
  console.log('微博评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('微博评论二级', async () => {
  const cookie = getCookie();
  const result = await Xinlangweibo.getXinlangweiboCommentByContent(
    cookie,
    '5244793854886629',
    '5244879949269335',
    '1075300820628',
  );
  console.log('微博评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('微博添加评论作品', async () => {
  const cookie = getCookie();
  const result = await Xinlangweibo.addXinlangweiboComment(cookie, '看看', '5244793854886629');
  console.log('微博评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('微博回复一级评论', async () => {
  const cookie = getCookie();
  const result = await Xinlangweibo.addXinlangweiboComment(
    cookie,
    '看看2',
    '5244793854886629',
    '5245139392924086',
    '1695906108',
  );
  console.log('微博评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('微博点赞评论', async () => {
  const cookie = getCookie();
  const result = await Xinlangweibo.digXinlangweiboComment(cookie, '3x9v5mez2h35ayg', '5245139549159846', 'updateLike');
  console.log('微博评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);

test('微博删除评论', async () => {
  const cookie = getCookie();
  const result = await Xinlangweibo.delXinlangweiboComment(cookie, '3x9v5mez2h35ayg', '5245139549159846');
  console.log('微博评论：', JSON.stringify(result, null, 2));
  expect(result.code).toBe(0);
}, 10000000);
