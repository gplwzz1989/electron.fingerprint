import { AuditResult } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { auditStatusEnum } from '@/utils';
import { AxiosError } from 'axios';
import { REDNOTE_CREATOR_ORIGIN } from './rednote-location.service';
import { redNoteSignedGet } from './rednote-signed-request.service';
import { IWebProxy } from '@/media-platform/webproxy';

export const REDNOTE_POSTED_NOTES_PATH = '/api/galaxy/v2/creator/note/user/posted';

export interface RedNotePostedNote {
  id: string;
  display_title?: string;
  tab_status?: number;
  permission_code?: number;
  post_timing?: boolean;
  schedule_post_time?: number;
  time?: string | number;
  images_list?: Array<{ url?: string }>;
  type?: 'normal' | 'video' | string;
  likes?: number;
  view_count?: number;
  collected_count?: number;
  comments_count?: number;
  shared_count?: number;
  sticky?: boolean;
  video_info?: { duration?: number };
  xsec_token?: string;
  xsec_source?: string;
  [key: string]: unknown;
}

export interface RedNotePostedNotesResponse {
  code?: number;
  success?: boolean;
  msg?: string;
  data?: {
    notes?: RedNotePostedNote[];
    page?: number;
  };
}

export const getRedNotePostedNotes = async (
  cookie: string,
  page: number = 0,
  tab: number = 0,
  proxy?: IWebProxy,
): Promise<RedNotePostedNotesResponse> => {
  const path = `${REDNOTE_POSTED_NOTES_PATH}?tab=${tab}&page=${page}`;
  return redNoteSignedGet<RedNotePostedNotesResponse>(cookie, path, {
    requestOrigin: REDNOTE_CREATOR_ORIGIN,
    referer: `${REDNOTE_CREATOR_ORIGIN}/new/note-manager`,
    proxy,
    headers: {
      Accept: 'application/json, text/plain, */*',
      Origin: REDNOTE_CREATOR_ORIGIN,
    },
  });
};

/** 临时映射；平台字段确认后只需调整此函数。 */
export const mapRedNoteAuditStatus = (note: RedNotePostedNote): auditStatusEnum => {
  if (note.permission_code === 1) return auditStatusEnum.notPublic;
  if (note.post_timing === true || note.tab_status === 4) return auditStatusEnum.prePublish;
  if (note.tab_status === 1) return auditStatusEnum.published;
  if (note.tab_status === 3) return auditStatusEnum.deny;
  return auditStatusEnum.inAudit;
};

const toSeconds = (value?: string | number): number | undefined => {
  if (value == null || value === '') return undefined;
  const timestamp = typeof value === 'number' ? value : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return undefined;
  return timestamp > 10_000_000_000 ? Math.floor(timestamp / 1000) : Math.floor(timestamp);
};

export const getRedNoteMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPages: number = 10,
): Promise<AuditResult> => {
  const result: AuditResult = { code: 0, msg: '', publishId };
  try {
    const pageCount = Math.max(1, maxPages);
    for (let page = 0; page < pageCount; page++) {
      const response = await getRedNotePostedNotes(cookie, page);
      if (response.code != null && response.code !== 0) {
        return { ...result, code: response.code, msg: response.msg ?? '查询作品状态失败' };
      }

      const notes = response.data?.notes ?? [];
      const note = notes.find((item) => item.id?.toString() === publishId.toString());
      if (note) {
        result.docId = note.id.toString();
        result.auditStatus = mapRedNoteAuditStatus(note);
        result.coverUrl = note.images_list?.[0]?.url;
        result.create_time = toSeconds(note.post_timing ? note.schedule_post_time : note.time);
        result.data = note;
        if (result.auditStatus === auditStatusEnum.published && note.xsec_token) {
          const query = new URLSearchParams({ xsec_token: note.xsec_token });
          if (note.xsec_source) query.set('xsec_source', note.xsec_source);
          result.openUrl = `https://www.rednote.com/explore/${note.id}?${query.toString()}`;
        }
        return result;
      }

      if (notes.length === 0) break;
    }
    result.msg = '未找到作品';
  } catch (error) {
    if (error instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = error.message;
    } else if (error instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = error.message;
    } else {
      result.code = errorCode.unknown_error;
      result.msg = String(error ?? '查询作品状态失败');
    }
  }
  return result;
};
