import { GeoLocation, ListInfoResponse } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { IWebProxy } from '@/media-platform/webproxy';
import { redNoteSignedPost } from './rednote-signed-request.service';

export const REDNOTE_LOCATION_SEARCH_PATH = '/web_api/sns/v1/local/poi/creator/search';
export const REDNOTE_CREATOR_ORIGIN = 'https://creator.rednote.com';

export interface RedNoteLocationSearchParams {
  keyword: string;
  page?: number;
  size?: number;
  latitude?: number;
  longitude?: number;
}

export interface RedNoteLocationInfo {
  poi_id: string;
  poi_type?: number;
  name: string;
  full_address?: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  link?: string;
  [key: string]: unknown;
}

export interface RedNoteLocationResponse {
  code: number;
  success: boolean;
  msg?: string;
  data?: {
    poi_list?: RedNoteLocationInfo[];
    has_more?: boolean;
    [key: string]: unknown;
  };
}

export const getRedNoteLocationListResponse = async (
  cookie: string,
  params: RedNoteLocationSearchParams,
  proxy?: IWebProxy,
): Promise<RedNoteLocationResponse> =>
  redNoteSignedPost<RedNoteLocationResponse>(
    cookie,
    REDNOTE_LOCATION_SEARCH_PATH,
    {
      latitude: params.latitude ?? 0,
      longitude: params.longitude ?? 0,
      keyword: params.keyword ?? '',
      page: Math.max(params.page ?? 1, 1),
      size: params.size ?? 50,
      source: 'WEB',
      type: 3,
    },
    {
      proxy,
      referer: `${REDNOTE_CREATOR_ORIGIN}/`,
      headers: { Origin: REDNOTE_CREATOR_ORIGIN },
    },
  );

export const getRedNoteLocationList = async (
  cookie: string,
  keyword: string,
  page: number = 1,
  proxy?: IWebProxy,
  coords?: GeoLocation,
): Promise<ListInfoResponse> => {
  const result = await getRedNoteLocationListResponse(
    cookie,
    {
      keyword,
      page,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    },
    proxy,
  );
  return {
    code: result.code === 0 && result.success ? errorCode.ok : errorCode.unknown_error,
    msg: result.msg ?? '',
    dataList: (result.data?.poi_list ?? []).map((item) => ({
      yixiaoerId: item.poi_id,
      yixiaoerName: item.name,
      yixiaoerDesc: item.full_address ?? item.city_name,
      raw: {
        ...item,
        // 与现有小红书发布模型保持字段兼容，但不修改其实现。
        poiOid: item.poi_id,
        poiLongId: item.poi_id,
        recommendType: item.poi_type,
        subname: item.full_address ?? '',
      },
    })),
    nextPage: result.data?.has_more ? String(page + 1) : undefined,
    data: result.data,
  };
};
