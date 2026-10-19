import { ListInfoResponse } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { IWebProxy } from '@/media-platform/webproxy';
import { REDNOTE_CREATOR_ORIGIN } from './rednote-location.service';
import { redNoteSignedPost } from './rednote-signed-request.service';

export const REDNOTE_MENTION_USER_SEARCH_PATH = '/web_api/sns/v1/search/user_info';

export interface RedNoteMentionUserSearchParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  searchId?: string;
}

export interface RedNoteMentionUserInfo {
  desc?: string;
  image?: string;
  image_size_large?: string;
  red_id?: string;
  user_id: string;
  user_nickname: string;
  followed?: boolean;
  red_official_verified?: boolean;
  red_official_verify_type?: number;
  show_red_official_verify_icon?: boolean;
  group_id?: string;
  [key: string]: unknown;
}

export interface RedNoteMentionUserItem {
  user_base_dto: RedNoteMentionUserInfo;
  fans_total?: number;
  [key: string]: unknown;
}

export interface RedNoteMentionUserResponse {
  code: number;
  success?: boolean;
  msg?: string;
  data?: {
    user_info_dtos?: RedNoteMentionUserItem[];
    has_more?: boolean;
    [key: string]: unknown;
  };
}

export const getRedNoteMentionUserListResponse = async (
  cookie: string,
  params: RedNoteMentionUserSearchParams = {},
  proxy?: IWebProxy,
): Promise<RedNoteMentionUserResponse> =>
  redNoteSignedPost<RedNoteMentionUserResponse>(
    cookie,
    REDNOTE_MENTION_USER_SEARCH_PATH,
    {
      keyword: params.keyword ?? '',
      search_id: params.searchId ?? Date.now().toString(),
      page: {
        page_size: params.pageSize ?? 20,
        page: Math.max(params.page ?? 1, 1),
      },
    },
    {
      proxy,
      referer: `${REDNOTE_CREATOR_ORIGIN}/`,
      headers: { Origin: REDNOTE_CREATOR_ORIGIN },
    },
  );

export const getRedNoteMentionUserList = async (
  cookie: string,
  keyword: string = '',
  page: number = 1,
  proxy?: IWebProxy,
): Promise<ListInfoResponse> => {
  const result = await getRedNoteMentionUserListResponse(cookie, { keyword, page }, proxy);
  return {
    code: result.code === 0 ? errorCode.ok : errorCode.unknown_error,
    msg: result.msg ?? '',
    dataList: (result.data?.user_info_dtos ?? []).map((item) => ({
      yixiaoerId: item.user_base_dto.user_id,
      yixiaoerName: item.user_base_dto.user_nickname,
      yixiaoerImageUrl: item.user_base_dto.image ?? item.user_base_dto.image_size_large,
      yixiaoerDesc: item.user_base_dto.desc,
      raw: item.user_base_dto,
    })),
    nextPage: result.data?.has_more ? String(page + 1) : undefined,
    data: result.data,
  };
};
