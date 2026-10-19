import { ListInfoResponse, ListItemInfo} from '@/media-platform';
import { errorCode } from '@/media-platform/errorCode';
import { AxiosError } from 'axios';
import { getGameListResponse } from './douyin-game.service';

export const getDouyinGameList = async (cookie: string, keyword?: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: errorCode.ok,
    msg: '',
    dataList: [],
  };
  try {
    const collectionResult = await getGameListResponse(cookie, keyword);
    result.code = collectionResult?.status_code ?? -1;
    result.msg = collectionResult?.status_msg;
    if (collectionResult.data?.mount_games?.length) {
      for (const item of collectionResult.data?.mount_games) {
        const collection: ListItemInfo = {
          yixiaoerId: item.game_info?.unified_game_id,
          yixiaoerName: item.game_info?.name,
          yixiaoerImageUrl: item.game_info?.icon,
          raw: JSON.parse((item.game_info?.short_video_point as string) ?? '{}'),
        };

        result.dataList?.push(collection);
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
