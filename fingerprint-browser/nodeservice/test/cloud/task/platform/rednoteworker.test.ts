import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auditMock, groupMock, locationMock, mentionMock, topicMock, userMock, publishVideoMock, toVideoInputMock } =
  vi.hoisted(() => ({
    auditMock: vi.fn(),
    groupMock: vi.fn(),
    locationMock: vi.fn(),
    mentionMock: vi.fn(),
    topicMock: vi.fn(),
    userMock: vi.fn(),
    publishVideoMock: vi.fn(),
    toVideoInputMock: vi.fn(),
  }));

vi.mock('@/media-platform/rednote', () => ({
  getRedNoteMediaStatus: auditMock,
  getRedNoteGroupList: groupMock,
  getRedNoteLocationList: locationMock,
  getRedNoteMentionUserList: mentionMock,
  getRedNoteTopicList: topicMock,
  getRedNoteUserInfo: userMock,
  publishRedNoteVideo: publishVideoMock,
  toRedNoteVideoPublishInput: toVideoInputMock,
}));

import { RedNoteWorker } from '@/cloud/task/platform/rednoteworker';
import { PubContentEnum } from '@/cloud/model/TypeEnum';

describe('RedNoteWorker unified search contract', () => {
  beforeEach(() => {
    groupMock.mockReset();
    auditMock.mockReset();
    locationMock.mockReset();
    mentionMock.mockReset();
    topicMock.mockReset();
    userMock.mockReset();
    publishVideoMock.mockReset();
    toVideoInputMock.mockReset();
  });

  it('routes video tasks through the RedNote video publisher', async () => {
    const task = { publishType: PubContentEnum.video, taskId: 'video-task' };
    const input = { taskId: 'video-task' };
    toVideoInputMock.mockReturnValue(input);
    publishVideoMock.mockResolvedValue({ code: 0, taskId: 'video-task', publishId: 'note-id' });
    const worker = new RedNoteWorker('a1=value');
    await expect(worker.publish(task as never)).resolves.toMatchObject({ code: 0, publishId: 'note-id' });
    expect(toVideoInputMock).toHaveBeenCalledWith(task);
    expect(publishVideoMock).toHaveBeenCalledWith(worker.cookies, input, worker.event);
  });

  it('routes audit status queries through the RedNote note manager API', async () => {
    auditMock.mockResolvedValue({ code: 0, publishId: 'note-id', auditStatus: 0 });
    const worker = new RedNoteWorker('a1=value');
    await expect(worker.checkAuditStatus('note-id', PubContentEnum.video)).resolves.toMatchObject({
      publishId: 'note-id',
      auditStatus: 0,
    });
    expect(auditMock).toHaveBeenCalledWith(worker.cookies, 'note-id');
  });

  it('routes topic searches through the common ListInfoResponse API', async () => {
    topicMock.mockResolvedValue({ code: 0, dataList: [] });
    const worker = new RedNoteWorker('a1=value');
    await expect(worker.searchTopic('AI', PubContentEnum.video)).resolves.toEqual({ code: 0, dataList: [] });
    expect(topicMock).toHaveBeenCalledWith(worker.cookies, 'AI');
  });

  it('routes location pagination, proxy and coordinates', async () => {
    locationMock.mockResolvedValue({ code: 0, dataList: [], nextPage: '3' });
    const worker = new RedNoteWorker('a1=value');
    const proxy = { serverAdd: '127.0.0.1', serverPort: 8080 };
    const coords = { latitude: 22.3193, longitude: 114.1694 };
    await worker.searchLocation('香港', '2', proxy, undefined, coords);
    expect(locationMock).toHaveBeenCalledWith(worker.cookies, '香港', 2, proxy, coords);
  });

  it('routes mention-user searches through searchUserInfoList', async () => {
    mentionMock.mockResolvedValue({ code: 0, dataList: [] });
    const worker = new RedNoteWorker('a1=value');
    await expect(worker.searchUserInfoList('用户')).resolves.toEqual({ code: 0, dataList: [] });
    expect(mentionMock).toHaveBeenCalledWith(worker.cookies, '用户');
  });

  it('routes group-list requests through the RedNote group API', async () => {
    groupMock.mockResolvedValue({ code: 0, dataList: [] });
    const worker = new RedNoteWorker('a1=value');
    const proxy = { serverAdd: '127.0.0.1', serverPort: 8080 };
    await expect(worker.getGroupList({ proxy })).resolves.toEqual({ code: 0, dataList: [] });
    expect(groupMock).toHaveBeenCalledWith(worker.cookies, proxy);
  });

  it('normalizes request failures instead of leaking undefined to third parties', async () => {
    topicMock.mockRejectedValue(new Error('签名失败'));
    const worker = new RedNoteWorker('a1=value');
    await expect(worker.searchTopic('AI', PubContentEnum.video)).resolves.toMatchObject({
      msg: '签名失败',
      dataList: [],
    });
  });
});
