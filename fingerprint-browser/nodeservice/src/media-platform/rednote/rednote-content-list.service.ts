import { EventEmitter } from 'events';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';
import { AccountContentListViewOutPut, syncContentEventName, syncContentMaxPage } from '@/media-platform/data-service';
import { errorCode } from '@/media-platform/errorCode';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { formatNumber, formatNumberNo, Task } from '@/utils';
import { getRedNotePostedNotes, RedNotePostedNote } from './rednote-content-status.service';

const headers = [
  { name: '封面', key: 'cover' },
  { name: '作品类型', key: 'type' },
  { name: '标题', key: 'title' },
  { name: '发布时间', key: 'date' },
  { name: '阅读', key: 'read' },
  { name: '评论', key: 'comment' },
  { name: '点赞', key: 'great' },
  { name: '收藏', key: 'collect' },
  { name: '分享', key: 'share' },
];

const pageUrl = (note: RedNotePostedNote): string => {
  const query = new URLSearchParams();
  if (note.xsec_token) query.set('xsec_token', note.xsec_token);
  if (note.xsec_source) query.set('xsec_source', note.xsec_source);
  const suffix = query.toString();
  return `https://www.rednote.com/explore/${note.id}${suffix ? `?${suffix}` : ''}`;
};

/** 查询并转换 RedNote 创作者中心的笔记管理列表。 */
export const getRedNoteContentListView = async (
  cookie: string,
  eventCallBack?: EventEmitter,
  days: number = 7,
  maxCount: number = 20,
  isHeader: boolean = false,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountContentListViewOutPut> => {
  const result: AccountContentListViewOutPut = { code: 0, msg: '', headers, data: [], dataList: [] };
  if (isHeader) return result;

  try {
    const lastDate = dayjs().subtract(days, 'day');
    let previousFirstId = '';
    let acceptedCount = 0;

    for (let page = 0; page < syncContentMaxPage; page++) {
      const response = await getRedNotePostedNotes(cookie, page, 0, proxy);
      if (response.code != null && response.code !== 0) {
        result.code = response.code;
        result.msg = response.msg ?? 'RedNote笔记列表查询失败';
        break;
      }

      const notes = response.data?.notes ?? [];
      if (!notes.length || notes[0].id === previousFirstId) break;
      previousFirstId = notes[0].id;

      let shouldStop = false;
      for (let index = 0; index < notes.length; index++) {
        const note = notes[index];
        if (note.permission_code === 1) continue;

        const date = dayjs(note.time);
        if (acceptedCount >= maxCount || (date.isValid() && date.isBefore(lastDate))) {
          // 创作者中心最多可能在列表顶部返回三条置顶旧笔记。
          if (index < 3 && note.sticky) continue;
          shouldStop = true;
          break;
        }

        const dateText = date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(note.time ?? '');
        const common = {
          id: note.id,
          cover: note.images_list?.[0]?.url ?? '',
          type: note.type === 'video' ? ('video' as const) : ('dynamic' as const),
          title: note.display_title ?? '',
          date: dateText,
          pageUrl: pageUrl(note),
        };
        result.data?.push({
          ...common,
          read: formatNumber(note.view_count ?? 0),
          comment: formatNumber(note.comments_count ?? 0),
          great: formatNumber(note.likes ?? 0),
          collect: formatNumber(note.collected_count ?? 0),
          share: formatNumber(note.shared_count ?? 0),
        });
        result.dataList?.push({
          ...common,
          read: formatNumberNo(note.view_count ?? 0),
          comment: formatNumberNo(note.comments_count ?? 0),
          great: formatNumberNo(note.likes ?? 0),
          collect: formatNumberNo(note.collected_count ?? 0),
          share: formatNumberNo(note.shared_count ?? 0),
        });
        acceptedCount++;
      }

      if (eventCallBack && result.data?.length) {
        eventCallBack.emit(syncContentEventName, {
          ...result,
          data: [...result.data],
          dataList: [...(result.dataList ?? [])],
        });
        result.data = [];
        result.dataList = [];
      }

      if (shouldStop || acceptedCount >= maxCount || response.data?.page === -1) break;
      await Task.Delay(1000);
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = error.message;
    } else if (error instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = error.message;
    } else {
      result.code = errorCode.unknown_error;
      result.msg = String(error ?? 'RedNote笔记列表查询失败');
    }
  }
  return result;
};
