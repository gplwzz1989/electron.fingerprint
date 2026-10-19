import { beforeEach, describe, expect, test, vi } from 'vitest';

const { postMock, getNewSignMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getNewSignMock: vi.fn(async () => JSON.stringify({ 'X-s': 'test-x-s', 'X-t': 'test-x-t' })),
}));

vi.mock('../../../src/http', () => ({
  $http: {
    post: postMock,
  },
}));

vi.mock('../../../src/media-platform/xiaohongshu/xiaohongshu-base.service', () => ({
  getNewSign: getNewSignMock,
  uploadXiaohongshuDynamicImage: vi.fn(),
}));

import {
  generateXiaohongshuSingleImage,
  XiaohongshuSingleImageGenerateInput,
} from '../../../src/media-platform/xiaohongshu/xiaohongshu-article.service';

describe('小红书单图生成', () => {
  beforeEach(() => {
    postMock.mockReset();
    getNewSignMock.mockClear();
  });

  test('按抓包格式发送请求并返回模板图片列表', async () => {
    postMock.mockResolvedValue({
      data: {
        code: 0,
        success: true,
        msg: '成功',
        data: {
          text2_img_type_results: [
            { img_url: 'https://example.com/first.jpg', img_type: 200 },
            { img_url: 'https://example.com/second.png', img_type: 201 },
            { img_type: 202 },
          ],
        },
      },
    });

    const input: XiaohongshuSingleImageGenerateInput = {
      cookie: 'a1=test',
      text: '远远看去，是一片绿油油的草地',
      styleJson: { id: 200 },
    };
    const result = await generateXiaohongshuSingleImage(input);

    expect(result.code).toBe(0);
    expect(result.dataList).toEqual([
      { pathOrUrl: 'https://example.com/first.jpg', format: 'jpg' },
      { pathOrUrl: 'https://example.com/second.png', format: 'png' },
    ]);
    expect(getNewSignMock).toHaveBeenCalledWith(
      '/api/galaxy/v2/creator/post/inspiration/text2imgv3',
      expect.any(String),
    );

    const [url, postData, requestConfig] = postMock.mock.calls[0];
    const body = JSON.parse(postData);
    expect(url).toBe('https://creator.xiaohongshu.com/api/galaxy/v2/creator/post/inspiration/text2imgv3');
    expect(body.page_type).toBe('cover');
    expect(body.page_num).toBe(1);
    expect(body.text_config_list).toHaveLength(1);
    expect(body.text_config_list[0].text).toBe(input.text);
    expect(JSON.parse(body.text_config_list[0].text_attribute).text_list).toEqual([input.text]);
    expect(body.style_json).toBe(JSON.stringify(input.styleJson));
    expect(requestConfig.headers['X-s']).toBe('test-x-s');
    expect(requestConfig.headers['X-t']).toBe('test-x-t');
  });

  test('缺少文字内容时返回中文错误', async () => {
    const result = await generateXiaohongshuSingleImage({
      cookie: 'a1=test',
      text: '  ',
    });

    expect(result.code).toBe(-1);
    expect(result.msg).toBe('小红书单图生成失败：缺少文字内容');
    expect(postMock).not.toHaveBeenCalled();
  });
});
