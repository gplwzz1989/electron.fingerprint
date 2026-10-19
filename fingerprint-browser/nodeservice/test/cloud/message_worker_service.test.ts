import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { MessageWorkerService } from '../../src/cloud/task/message_worker_service';
import { Platforms } from '../../src';

describe('MessageWorkerService', () => {
  let service: MessageWorkerService;
  const mockConfig = {
    cookie: 'test-cookie',
    platformAccountId: 'test-account-123',
    platformAuthorId: 'test-author-123',
    localStorage: { key: 'value' },
    authorization: 'Bearer test-token',
  };

  beforeEach(() => {
    // 创建MessageWorkerService实例
    service = new MessageWorkerService(Platforms.DouYin, mockConfig);
  });

  afterEach(() => {
    // 清理定时器
    if (service) {
      service.stop();
    }
    vi.clearAllTimers();
  });

  describe('构造函数', () => {
    test('应该正确初始化私信相关属性', () => {
      expect(service['gettingMsg']).toBe(false);
      expect(service['drop']).toBe(false);
      expect(service['lastMsgTimestamp']).toBe(0);
    });

    test('应该不包含评论相关属性', () => {
      expect(service['gettingComment']).toBeUndefined();
      expect(service['commentContentMaxDays']).toBeUndefined();
    });
  });

  describe('startGetMessage', () => {
    test('应该启动私信监控循环', () => {
      const loopSecond = 30;
      service.startGetMessage(loopSecond);

      expect(service['gettingMsg']).toBe(true);
      expect(service['drop']).toBe(false);
    });

    test('应该使用默认轮询间隔30秒', () => {
      service.startGetMessage();
      expect(service['gettingMsg']).toBe(true);
    });

    test('应该启动心跳定时器', () => {
      service.startGetMessage(30);
      expect(service['heartbeatTimer']).toBeDefined();
    });
  });

  describe('stop', () => {
    test('应该停止私信监控', () => {
      service.startGetMessage(30);
      service.stop();

      expect(service['drop']).toBe(true);
      expect(service['gettingMsg']).toBe(false);
    });

    test('应该清理心跳定时器', () => {
      service.startGetMessage(30);
      const timer = service['heartbeatTimer'];

      service.stop();

      expect(service['heartbeatTimer']).toBeUndefined();
    });

    test('应该清理私信轮询定时器', () => {
      service.startGetMessage(30);

      service.stop();

      expect(service['msgTimer']).toBeUndefined();
    });
  });

  describe('updateCookie', () => {
    test('应该成功更新Cookie', () => {
      const newCookie = 'new-cookie';
      const newLocalStorage = { newKey: 'newValue' };

      const error = service.updateCookie(newCookie, newLocalStorage);

      expect(error).toBeNull();
      expect(service['cookie']).toBe(newCookie);
      expect(service['localStorage']).toEqual(newLocalStorage);
    });

    test('应该只更新Cookie不更新localStorage', () => {
      const oldLocalStorage = service['localStorage'];
      const newCookie = 'new-cookie';

      const error = service.updateCookie(newCookie);

      expect(error).toBeNull();
      expect(service['cookie']).toBe(newCookie);
      expect(service['localStorage']).toEqual(oldLocalStorage);
    });

    test('当Worker正在运行时应该返回错误', () => {
      service.startGetMessage(30);

      const error = service.updateCookie('new-cookie');

      expect(error).toBe('Worker正在运行,无法更新Cookie');
    });
  });

  describe('startHeartbeat', () => {
    test('应该启动59秒心跳定时器', () => {
      vi.useFakeTimers();

      service['startHeartbeat']();

      expect(service['heartbeatTimer']).toBeDefined();

      vi.useRealTimers();
    });

    test('应该在心跳时更新lastHeartbeat时间戳', () => {
      vi.useFakeTimers();

      const initialTime = Date.now();
      service['startHeartbeat']();

      // 快进59秒
      vi.advanceTimersByTime(59000);

      expect(service['lastHeartbeat']).toBeGreaterThanOrEqual(initialTime);

      vi.useRealTimers();
    });
  });

  describe('REST API方法', () => {
    test('应该包含getConversationList方法', () => {
      expect(typeof service.getConversationList).toBe('function');
    });

    test('应该包含getConversationInfo方法', () => {
      expect(typeof service.getConversationInfo).toBe('function');
    });

    test('应该包含getMessageListByConversation方法', () => {
      expect(typeof service.getMessageListByConversation).toBe('function');
    });

    test('应该包含getNewMessageList方法', () => {
      expect(typeof service.getNewMessageList).toBe('function');
    });

    test('应该包含SendMessage方法', () => {
      expect(typeof service.SendMessage).toBe('function');
    });
  });

  describe('Webhook推送方法', () => {
    test('应该包含postBackPrivateMsg方法', () => {
      expect(typeof service['postBackPrivateMsg']).toBe('function');
    });

    test('应该包含postBackPrivateMsgNotify方法', () => {
      expect(typeof service['postBackPrivateMsgNotify']).toBe('function');
    });
  });
});
