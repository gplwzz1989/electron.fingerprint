import { $http } from '../../http';

export const getKuaishouMusicResponse = async (
  cookie: string,
  keyWord: string,
  search_session_id: string,
  webapiId: string,
): Promise<KuaishouMusicResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/atlas/pc/upload/music/search';

  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/article/publish/video',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const postData = {
    page: 0,
    count: 50,
    keyword: keyWord ?? '',
    relateTask: false,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  if (search_session_id) {
    postData['search_session_id'] = search_session_id;
  }

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface KuaishouMusicResponse {
  /**
   * 状态码 1正常，非1异常
   */
  result: number;
  /**
   * 服务端时间
   */
  currentTime: number;
  /**
   * 列表及翻页信息
   */
  data: {
    /**
     * 下一页 参数
     */
    searchSessionId: string;
    /**
     * 音乐列表
     */
    musicList: Array<KuaishouMusicInfo>;
  };
  /**
   * 提示消息
   */
  message: string;
}

export interface KuaishouMusicInfo {
  /**
   * 音乐唯一id,发布时使用
   */
  musicId: string;
  /**
   * 音乐封面信息
   */
  cover: Array<{
    cdn: string;
    /**
     * 封面地址
     */
    url: string;
  }>;
  /**
   * 音乐名称
   */
  title: string;
  /**
   * 作者昵称
   */
  author: string;
  /**
   * 音乐时长/毫秒
   */
  duration: number;
  /**
   * 音乐播放地址列表
   */
  url: Array<{
    cdn: string;
    /**
     * 音乐播放地址
     */
    url: string;
  }>;
}
