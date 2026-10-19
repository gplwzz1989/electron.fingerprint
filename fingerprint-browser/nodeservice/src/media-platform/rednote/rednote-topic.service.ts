import { ListInfoResponse } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { IWebProxy } from '@/media-platform/webproxy';
import { redNoteSignedPost } from './rednote-signed-request.service';

export const REDNOTE_TOPIC_SEARCH_PATH = '/web_api/sns/v1/search/topic';
const REDNOTE_TOPIC_CREATE_PATH = '/web_api/sns/capa/postgw/topic/batch_customized';
const REDNOTE_CREATOR_ORIGIN = 'https://creator.rednote.com';

export interface RedNoteTopicInfo {
  id: string;
  name: string;
  link?: string;
  view_num?: number;
  type?: string;
  smart?: boolean;
}

export interface RedNoteTopicResponse {
  code: number;
  success: boolean;
  msg?: string;
  data?: {
    result?: { success?: boolean };
    topic_info_dtos?: RedNoteTopicInfo[];
  };
}

export interface RedNoteCreateTopicResponse {
  msg?: string;
  data?: {
    topic_infos?: Array<{
      id: string;
      name: string;
    }>;
  };
  result: number;
  success: boolean;
}

export const getRedNoteTopicListResponse = async (
  cookie: string,
  keyword: string,
  page: number = 1,
  proxy?: IWebProxy,
): Promise<RedNoteTopicResponse> =>
  redNoteSignedPost<RedNoteTopicResponse>(
    cookie,
    REDNOTE_TOPIC_SEARCH_PATH,
    {
      keyword: keyword ?? '',
      suggest_topic_request: { title: '', desc: '' },
      page: { page_size: 20, page: Math.max(page, 1) },
    },
    { proxy },
  );

export const getRedNoteTopicList = async (
  cookie: string,
  keyword: string,
  page: number = 1,
  proxy?: IWebProxy,
): Promise<ListInfoResponse> => {
  const result = await getRedNoteTopicListResponse(cookie, keyword, page, proxy);
  return {
    code: result.code === 0 && result.success ? errorCode.ok : errorCode.unknown_error,
    msg: result.msg ?? '',
    dataList: (result.data?.topic_info_dtos ?? []).map((item) => ({
      yixiaoerId: item.id,
      yixiaoerName: item.name,
      yixiaoerDesc: item.view_num?.toString(),
      raw: item,
    })),
    data: result.data,
  };
};

/**
 * 创建发布图文或视频时使用的自定义话题。
 *
 * 这是发布流程的内部能力，不通过 rednote/index.ts 暴露。
 */
export const createRedNoteTopicResponse = async (
  cookie: string,
  topicName: string,
  proxy?: IWebProxy,
): Promise<RedNoteCreateTopicResponse> =>
  redNoteSignedPost<RedNoteCreateTopicResponse>(
    cookie,
    REDNOTE_TOPIC_CREATE_PATH,
    { topic_names: topicName },
    {
      proxy,
      referer: `${REDNOTE_CREATOR_ORIGIN}/`,
      headers: { Origin: REDNOTE_CREATOR_ORIGIN },
    },
  );
