import { ListMusicInfoResponse } from '@/media-platform';
import { Platforms } from '@/service/datasync-service-manager';
import { QueryWorker } from '@/cloud/task/taskService';

export interface SearchMusicTask {
  platform: Platforms;
  cookie: string;
  keyword: string;
  categoryId: string;
  categoryName: string;
  platformUserId: string;
  nextPage?: string;
}
export const getMusicData = async (queryData: SearchMusicTask): Promise<ListMusicInfoResponse | undefined> => {
  const worker = new QueryWorker('', queryData.platform, {
    cookie: queryData.cookie,
    platformAuthorId: queryData.platformUserId,
  });
  if (queryData.platform == Platforms.DouYin) {
    if (queryData.keyword) {
      return worker.searchMusic(queryData.keyword ?? '', queryData.nextPage ?? '');
    } else {
      return worker.getMusicByCategory(queryData.categoryId, queryData.categoryName, queryData.nextPage ?? '');
    }
  } else {
    return worker.searchMusic(queryData.keyword ?? '', queryData.nextPage ?? '');
  }
};
