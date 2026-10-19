import { describe, expect, test } from 'vitest';
import { ParseHub } from '../../src';

describe.runIf(true)('【文章解析】', () => {
  test('百家解析', async () => {
    const result = await ParseHub.ParseArticleContentByUrl(
      'https://baijiahao.baidu.com/s?id=1798632234742493556&wfr=spider&for=pc',
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【文章解析】', () => {
  test('头条解析', async () => {
    const result = await ParseHub.ParseArticleContentByUrl(
      'https://www.toutiao.com/article/7495208575875301915/?log_from=ac37f8a8e9a31_1747967941600',
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【文章解析】', () => {
  test('公众号条解析', async () => {
    const result = await ParseHub.ParseArticleContentByUrl('https://mp.weixin.qq.com/s/sMtZAGeCkycNpPJloYmLjQ');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【文章解析】', () => {
  test('简书号条解析', async () => {
    const result = await ParseHub.ParseArticleContentByUrl('https://www.jianshu.com/p/484a57c4e587');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【文章解析】', () => {
  test('企鹅号条解析', async () => {
    const result = await ParseHub.ParseArticleContentByUrl('https://page.om.qq.com/page/OIlMjU2XCuhS2BTY0hnm_Mwg0');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【文章解析】', () => {
  test('网易条解析', async () => {
    const result = await ParseHub.ParseArticleContentByUrl('https://www.163.com/dy/article/JVCBLE6E0552ZF94.html');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【文章解析】', () => {
  test('一点解析', async () => {
    const result = await ParseHub.ParseArticleContentByUrl('https://www.yidianzixun.com/article/11Aldd4F');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【文章解析】', () => {
  test('搜狐解析', async () => {
    const result = await ParseHub.ParseArticleContentByUrl(
      'http://www.sohu.com/a/901025141_313745?edtsign=329DEDDEB68A8F8E9E57ADE2F735DF2EB9B7CD7E&edtcode=hQGWPJNdXWngTU0gYUMqNg%3D%3D&scm=thor.280_14-200000.0.0.&spm=smpc.home.top-news2.11.17489376706365jcifmZ_1467',
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
