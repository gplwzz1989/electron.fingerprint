import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNowTimeStamp } from '@/utils/use-date';

describe('getNowTimeStamp', () => {
  beforeEach(() => {
    // 告诉 vitest 我们使用模拟时间
    vi.useFakeTimers();
  });

  afterEach(() => {
    // 每次测试运行后恢复日期
    vi.useRealTimers();
  });

  it('应该等于当前时间戳', () => {
    // Arrange
    // 设置系统时间为 2023-9-2 12:00:00
    const date = new Date(2023, 9, 2, 12, 0, 0, 0);
    const datetime = date.getTime().toString();
    vi.setSystemTime(date);

    // Act
    const result = getNowTimeStamp();

    // Assert
    expect(result).toBe(datetime);
  });
});
