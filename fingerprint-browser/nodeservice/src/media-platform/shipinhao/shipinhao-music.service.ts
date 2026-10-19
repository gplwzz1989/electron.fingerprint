import { Guid } from '@/utils';
import { $http } from '@/http';

/**
 * 获取视频号音乐
 * @param cookie
 * @param finderId 用户finderid
 * @param type 类型 'recommend':推荐 | 'collect':收藏 | 'search':搜索
 * @param keyWord 搜索关键词
 * @param page 翻页页码，默认1
 * @param lastBuffer 翻页时下一页参数，来自于返回值
 * @param size
 */
export const getShipinhaoMusicResponse = async (
  cookie: string,
  finderId: string,
  type: 'recommend' | 'collect' | 'search',
  keyWord: string = '',
  page: number = 1,
  lastBuffer: string = '',
  size: number = 5,
): Promise<ShipinhaoMusicListResponse> => {
  const url = `https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/get_bgm_list?_rid=678ddecb-${Guid.NewGuid().substring(
    0,
    10,
  )}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://channels.weixin.qq.com/platform/post/finderNewLifeCreate',
    Origin: 'https://channels.weixin.qq.com',
    ContentType: 'application/json; charset=UTF-8',
  };

  const postData = {
    currentPage: page,
    lastBuffer: lastBuffer,
    pageSize: size,
    timestamp: new Date().getTime(),
    _log_finder_uin: '',
    _log_finder_id: finderId,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };
  if (type === 'search') {
    postData['query'] = keyWord ?? '';
    postData['type'] = 104;
  } else if (type === 'recommend') {
    postData['recommendThumbUrlList'] = [];
    postData['type'] = 103;
  } else {
    postData['type'] = 3;
  }

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface ShipinhaoMusicListResponse {
  errCode: number;
  errMsg: string;
  data: {
    items: Array<{
      listenItem: ShipinhaoMusicInfo;
    }>;
    /**
     * 下一页参数
     */
    lastBuffer: string; //'CAAQwob4ltODiwM=';
    /**
     * 总数
     */
    totalCount: number;
  };
}

export interface ShipinhaoMusicInfo {
  colorList: [];
  hitInfo: [];
  playableInfo: {
    type: number; //1
    /**
     * 歌名
     */
    title: string;
    /**
     * 作者昵称
     */
    author: string;
    /**
     * 封面
     */
    cover: string;
    /**
     * 时长，毫秒
     */
    duration: number;
    finderFeedId: string;
    finderNonceId: string;
    /**
     * 音乐id
     */
    listenId: string;
  };
  playable: number;
  /**
   * 播放地址
   */
  url: string;
  /**
   *
   */
  mirBegin: string; //"0",
  mirEnd: string; //"0",
  /**
   * 歌词
   */
  lyric: string;
  /**
   * 音乐id
   */
  musicSid: number;
  recommendBuf: string;
}
