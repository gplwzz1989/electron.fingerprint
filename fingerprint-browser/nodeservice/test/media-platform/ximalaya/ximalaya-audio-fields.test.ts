import { describe, expect, test } from 'vitest';
import { StatementTypeEnum } from '@/cloud/model/BaseTaskFormModel';
import { VisibleTypeEnum } from '@/cloud/model/TypeEnum';
import {
  normalizeXimalayaTags,
  resolveXimalayaAlbumForPublish,
  resolveXimalayaIsAiTrack,
  resolveXimalayaVisibleCrowdType,
  validateXimalayaScheduleVisibility,
} from '@/media-platform/ximalaya/ximalaya-audio';

describe('喜马拉雅音频字段转换', () => {
  test('将统一 tags/topics 转为喜马拉雅 soundTags/topicTags', () => {
    const result = normalizeXimalayaTags(
      ['123', '哈哈哈', '知识经验', '讲故事'],
      [{ yixiaoerId: '10661', yixiaoerName: '《重案六组》开播惹争议' }],
    );

    expect(JSON.parse(result.soundTags)).toEqual({
      0: ['123', '哈哈哈', '知识经验', '讲故事'],
      10661: ['《重案六组》开播惹争议'],
    });
    expect(JSON.parse(result.topicTags)).toEqual({
      10661: ['《重案六组》开播惹争议'],
    });
  });

  test('忽略空标签与不完整话题', () => {
    const result = normalizeXimalayaTags(['有效标签', ' ', ''], [{ yixiaoerId: '', yixiaoerName: '无效话题' }]);

    expect(JSON.parse(result.soundTags)).toEqual({ 0: ['有效标签'] });
    expect(JSON.parse(result.topicTags)).toEqual({});
  });

  test('映射公开、仅好友可见、私密权限', () => {
    expect(resolveXimalayaVisibleCrowdType(VisibleTypeEnum.public)).toBe(2);
    expect(resolveXimalayaVisibleCrowdType(VisibleTypeEnum.friend)).toBe(3);
    expect(resolveXimalayaVisibleCrowdType(VisibleTypeEnum.private)).toBe(1);
    expect(resolveXimalayaVisibleCrowdType(VisibleTypeEnum.private, 99)).toBe(99);
  });

  test('从统一声明映射是否 AI 合成', () => {
    expect(resolveXimalayaIsAiTrack({ type: StatementTypeEnum.AI创作声明 })).toBe(true);
    expect(resolveXimalayaIsAiTrack({ type: StatementTypeEnum.图片视频由AI生成 })).toBe(true);
    expect(resolveXimalayaIsAiTrack({ type: StatementTypeEnum.不声明 })).toBe(false);
    expect(resolveXimalayaIsAiTrack({ type: StatementTypeEnum.AI创作声明 }, false)).toBe(false);
  });

  test('定时发布仅允许公开可见', () => {
    const scheduledTime = Date.now() + 60_000;

    expect(validateXimalayaScheduleVisibility(scheduledTime, 2)).toBeUndefined();
    expect(validateXimalayaScheduleVisibility(scheduledTime, 1)).toContain('仅支持公开');
    expect(validateXimalayaScheduleVisibility(scheduledTime, 3)).toContain('仅支持公开');
    expect(validateXimalayaScheduleVisibility(Date.now() - 60_000, 1)).toBeUndefined();
  });

  test('专辑分类必须与表单分类一致，并以专辑分类作为最终值', () => {
    const album = {
      yixiaoerId: '129531599',
      yixiaoerName: '测试专辑',
      raw: { categoryId: 4, albumStatusInfo: { isPublic: true } },
    };

    expect(resolveXimalayaAlbumForPublish(album, undefined, 4, 2)).toMatchObject({
      albumId: '129531599',
      categoryId: 4,
    });
    expect(resolveXimalayaAlbumForPublish(album, undefined, 5, 2).error).toContain('分类');
  });

  test('私密专辑仅允许私密音频', () => {
    const privateAlbum = {
      yixiaoerId: '129531599',
      yixiaoerName: '私密专辑',
      raw: { categoryId: 4, albumStatusInfo: { isPublic: false } },
    };

    expect(resolveXimalayaAlbumForPublish(privateAlbum, undefined, 4, 1).error).toBeUndefined();
    expect(resolveXimalayaAlbumForPublish(privateAlbum, undefined, 4, 2).error).toContain('私密');
    expect(resolveXimalayaAlbumForPublish(privateAlbum, undefined, 4, 3).error).toContain('私密');
  });
});
