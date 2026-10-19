import { ListInfoResponse } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { IWebProxy } from '@/media-platform/webproxy';
import { REDNOTE_CREATOR_ORIGIN } from './rednote-location.service';
import { redNoteSignedGet } from './rednote-signed-request.service';

export const REDNOTE_GROUP_LIST_PATH = '/api/im/web/nns/group_list?note_id=';

export interface RedNoteGroupInfo {
  group_id: string;
  avatar?: string;
  group_name: string;
  desc?: string;
  linkable?: boolean;
  [key: string]: unknown;
}

export interface RedNoteGroupResponse {
  code: number;
  success: boolean;
  msg?: string;
  data?: {
    group_list?: RedNoteGroupInfo[];
    [key: string]: unknown;
  };
}

export const getRedNoteGroupListResponse = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<RedNoteGroupResponse> =>
  redNoteSignedGet<RedNoteGroupResponse>(cookie, REDNOTE_GROUP_LIST_PATH, {
    proxy,
    referer: `${REDNOTE_CREATOR_ORIGIN}/`,
    headers: { Origin: REDNOTE_CREATOR_ORIGIN },
  });

export const getRedNoteGroupList = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<ListInfoResponse> => {
  const result = await getRedNoteGroupListResponse(cookie, proxy);
  return {
    code: result.code === 0 && result.success ? errorCode.ok : errorCode.unknown_error,
    msg: result.msg ?? '',
    dataList: (result.data?.group_list ?? []).map((item) => ({
      yixiaoerId: item.group_id,
      yixiaoerName: item.group_name,
      yixiaoerDesc: item.desc,
      yixiaoerImageUrl: item.avatar,
      raw: item,
    })),
    data: result.data,
  };
};
