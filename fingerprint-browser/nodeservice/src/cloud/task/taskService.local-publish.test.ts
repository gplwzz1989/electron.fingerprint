import { describe, expect, it, vi } from 'vitest';
import {
  pushLocalPublishTask,
  pushOpenPlatformPublishTask,
  type LocalOpenPlatformTaskSet,
} from './taskService';

describe('发布入口鉴权边界', () => {
  it('开放平台入口缺少 authorization 时拒绝任务', async () => {
    const result = await pushOpenPlatformPublishTask({} as never, '');

    expect(result).toBe('回调auth参数不能为空');
  });

  it('本机 Socket 入口不校验 authorization，继续执行公共任务校验', async () => {
    const feedbackHandler = vi.fn();
    const result = await pushLocalPublishTask({} as LocalOpenPlatformTaskSet, feedbackHandler);

    expect(result).toBe('发布类型不能为空');
    expect(feedbackHandler).not.toHaveBeenCalled();
  });

  it('本机 Socket 入口必须提供回传函数', async () => {
    const result = await pushLocalPublishTask({} as LocalOpenPlatformTaskSet, undefined as never);

    expect(result).toBe('本机Socket回传函数不能为空');
  });
});
