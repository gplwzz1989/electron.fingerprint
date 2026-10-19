import { getSign, regex, UploadArgsResponse } from './kuaishou-base.service';
import * as buffer from 'buffer';
import { $http } from '../../http';
import { Guid, htmlDecode, isJson } from '../../utils';
import { KuaishouTopicInfo } from './kuaishou-topic.service';
import { KuaishouFriendInfo } from './kuaishou-friend.service';
import { KuaishouLocationInfo } from './kuaishou-location.service';
import { KuaishouGoodsInfo } from './kuaishou-shop.service';
import { HtmlDocument } from '../../htmlAgilityPack';
import { CancelToken } from '../../utils/CancelToken';
import { KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getKuaishouTopic } from '@/media-platform/kuaishou/kuaishou-common';
import { setActivityResponse } from '@/media-platform/kuaishou/kuaishou-activity.service';
import { KuaiShouMiniAppInfo } from '@/media-platform/kuaishou/kuaishou-miniapp.service';
import { BaseTask } from '@/media-platform/baseTask';

/**
 * 上传视频分片
 * @param uploadArgs 上传参数，来自于获取上传参数接口
 * @param videoData 视频分片二进制数据
 * @param partNum 分片编号
 * @param startIndex 分片数据在文件中的起始索引位置
 * @param endIndex 分片数据在文件中的结束索引位置
 * @param fileSize 文件大小
 */
export const uploadVideoPart = async (
  uploadArgs: UploadArgsResponse,
  videoData: buffer.Buffer,
  partNum: number,
  startIndex: number,
  endIndex: number,
  fileSize: number,
): Promise<UploadPartResponse> => {
  const url = `https://${uploadArgs.data?.endPoints[0]}/api/upload/fragment?upload_token=${encodeURIComponent(
    uploadArgs.data?.token ?? '',
  )}&fragment_id=${partNum}`;

  const headers = {
    Referer: 'https://cp.kuaishou.com/',
    'Content-Range': `bytes ${startIndex}-${endIndex}/${fileSize}`,
    'Content-Type': 'application/stream',
  };

  let result = await $http.post(url, buffer.Buffer.from(videoData), {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  if (!(result.data && typeof result.data == 'object')) {
    result = await $http.post(url, buffer.Buffer.from(videoData), {
      headers: headers,
    });
  }
  if (result.data && typeof result.data == 'object') {
    result.data['partNum'] = partNum;
  } else {
    return { result: result.status, partNum: -1, message: '服务异常' };
  }

  return result.data;
};

export interface UploadPartResponse {
  /**
   * 状态码 1正常，非1异常
   */
  result?: number;
  /**
   * 分片check值
   */
  checksum?: string;
  /**
   * 分片大小
   */
  size?: number;
  /**
   * 状态码，错误时才有
   */
  status?: number;
  /**
   *  错误消息
   */
  error?: string;
  /**
   *  详细提示信息
   */
  message?: string;

  path?: string;

  /**
   * 分片编号
   */
  partNum: number;
}

/**
 * 获取视频上传完成状态
 * @param uploadArgs 上传参数，来自获取上传参数接口
 * @param totalPartNums 视频总分片数
 */
export const getUploadedVideoStatusResponse = async (
  uploadArgs: UploadArgsResponse,
  totalPartNums: number,
): Promise<UploadVideoStatusResponse> => {
  const url = `https://${uploadArgs.data?.endPoints[0]}/api/upload/complete?fragment_count=${totalPartNums}&upload_token=${uploadArgs.data?.token}`;

  const headers = {
    Referer: 'https://cp.kuaishou.com/',
    'Content-Type': null,
  };

  const result = await $http.post(url, '', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadVideoStatusResponse {
  /**
   *  状态码 1正常,非1 异常
   */
  result: number;
  /**
   *  详细提示信息
   */
  message: string;
}

/**
 * 获取上传完成的视频信息
 * @param cookie
 * @param uploadArgs  上传参数，来源于获取上传参数接口
 * @param fileSize 视频文件字节大小
 * @param fileName 视频文件名称，带后缀名
 * @param fileType 文件类型 默认video/mp4
 */
export const getUploadedVideoInfo = async (
  cookie: string,
  uploadArgs: UploadArgsResponse,
  fileSize: number,
  fileName: string,
  fileType: string = 'video/mp4',
): Promise<UploadedVideoInfoResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/upload/finish';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
    'Content-type': 'application/json',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  const postData = {
    token: uploadArgs.data?.token,
    fileName: fileName,
    fileTyp: fileType,
    fileLength: fileSize,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const postStr = JSON.stringify(postData);
  const params = {
    __NS_sig3: await getSign(postStr),
  };

  const result = await $http.post(url, postStr, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface UploadedVideoInfoResponse {
  /**
   * 状态码
   */
  result: number;
  /**
   * 数据体
   */
  data?: {
    /**
     * 文件id
     */
    fileId: number;
    /**
     * 时长-秒
     */
    duration: number;
    /**
     * 系统自动封面，当没有指定封面时使用的封面
     */
    coverKey: string;
    /**
     * 视频像素宽
     */
    width: number;
    /**
     * 视频像素高
     */
    height: number;
    /**
     * 视频帧率
     */
    videoFrameRate: number;
    /**
     * 上传完成的视频媒体资源id
     */
    mediaId: string;
    /**
     * 封面媒体资源id
     */
    coverMediaId: string;
    /**
     * 作品id
     */
    photoIdStr: string;
    /**
     * 时长-毫秒
     */
    videoDuration: number;
  };
  /**
   * 提示消息
   */
  message: string;
}

/**
 * 组装推送数据字符串
 * @param taskData 快手视频发布任务体
 * @param videoFileId 上传完成的视频fileId
 * @param coverKey 上传完成的封面id
 * @param webapiId cookie的kuaishou.web.cp.api_ph
 * @param cookie
 * @param pkCoverKey
 */
export const buildPostData = async (
  taskData: KuaishouVideoTaskInput,
  videoFileId: number,
  coverKey: string,
  webapiId: string,
  cookie: string,
  pkCoverKey?: string,
): Promise<string> => {
  const re = {};
  let descStr = taskData?.desc?.toString() ?? '';

  //富文本话题好友
  if (descStr?.includes('<p') && descStr?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(descStr);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic') ?? [];
      const activitis = html.DocumentNode.SelectNodes('//activity') ?? [];
      topics.push(...activitis);
      if (topics?.length > 0) {
        let topicNum = 0;
        for (const item of topics) {
          if (topicNum >= 4) {
            item.parentNode?.removeChild(item);
            continue;
          }
          let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            const topicsTmp = await getKuaishouTopic(cookie, text ?? '');
            if (topicsTmp?.dataList?.length) {
              topicStr = JSON.stringify(topicsTmp.dataList[0]);
            } else {
              continue;
            }
          }
          topicNum++;
          const topicJo = JSON.parse(topicStr);
          if (topicJo?.raw?.activityId) {
            setActivityResponse(cookie, topicJo?.raw?.activityId);
          }
          item.textContent = `#${(topicJo?.raw as KuaishouTopicInfo)?.name ?? topicJo?.yixiaoerName} `;
        }
      }
      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          const friendStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!friendStr || !friendStr.startsWith('{')) {
            continue;
          }
          const friendJo = JSON.parse(friendStr);
          item.textContent = `@${friendJo?.raw?.userName ?? friendJo?.yixiaoerName}(O${
            friendJo?.raw?.userId ?? friendJo?.yixiaoerId ?? ''
          })`;
        }
      }
      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }
      descStr = htmlDecode(newText);
    }
  } else {
    // 话题
    if (taskData.topics?.length) {
      descStr = `${descStr} #${taskData.topics.map((obj) => obj.name).join(' #')}`;
    }

    // 好友
    if (taskData.mentionedUser?.length) {
      descStr = `@${taskData.mentionedUser
        .map((obj) => `${obj.userName}(O${obj.userId ?? ''})`)
        .join(' @')} ${descStr} `;
    }
  }

  // 组装好的描述
  re['caption'] = descStr;

  //pk封面
  if (pkCoverKey) {
    re['pkCoverKey'] = pkCoverKey;
    re['pkCoverSize'] = 'a';
    re['pkCoverTimeStamp'] = 0;
    re['pkCoverType'] = 2;
  }

  //地址
  if (taskData?.location?.id) {
    re['poiId'] = taskData.location.id;
    re['latitude'] = taskData.location.latitude;
    re['longitude'] = taskData.location.longitude;
  } else {
    re['latitude'] = '';
    re['longitude'] = '';
  }

  //分类
  re['domain'] = taskData.domain ?? '';
  re['secondDomain'] = taskData.secondDomain ?? '';

  re['coverCropped'] = false;
  re['coverKey'] = coverKey;
  re['coverType'] = coverKey ? 3 : 1;
  re['fileId'] = videoFileId;
  re['kuaishou.web.cp.api_ph'] = webapiId;
  re['movieId'] = '';
  re['notifyResult'] = 0;

  //可见类型
  re['photoStatus'] = taskData.visibilityType ?? 1;
  re['photoType'] = 0;

  //第二张封面，pk封面，暂时为空
  re['pkCoverKey'] = '';

  //定时发布
  re['publishTime'] = taskData.publishTime ?? 0;

  //是否禁止下载视频
  if (taskData.downloadType == 2) {
    re['downloadType'] = 2;
  }

  //是否禁止同城显示
  if (taskData.disableNearbyShow) {
    re['disableNearbyShow'] = true;
  }

  //是否允许同框
  if (taskData.allowSameFrame) {
    re['allowSameFrame'] = true;
  }

  //关联商品
  if (taskData.goods?.associateTaskId) {
    re['associateTasks'] = [taskData.goods.associateTaskId];
  }
  //挂载小程序
  else if (taskData.miniAppInfo?.associateTaskId) {
    re['associateTasks'] = [taskData.miniAppInfo.associateTaskId];
  }

  //作者申明  4:暂不支持
  if (taskData.declareInfo?.source && taskData.declareInfo.source != 4) {
    re['declareInfo'] = { source: taskData.declareInfo.source };
  } else {
    re['declareInfo'] = { source: 0 };
  }
  //合集
  if (taskData.collectionId) {
    re['collectionId'] = taskData.collectionId;
  }
  return JSON.stringify(re);
};

/**
 * 推送组装好的数据到官方,快手发布后没有publishId，需要用coverKey去待发布匹配，但是可能小概率出现匹配不上的情况，使用返回的时间前10位做publishId
 * @param cookie
 * @param postData 组装好的数据字符串
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | undefined | object,
): Promise<PushResultResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/submit';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const params = {
    __NS_sig3: await getSign(postData),
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PushResultResponse {
  /**
   * 状态码
   */
  result: number;
  /**
   * 发布时间
   */
  currentTime: number;
  /**
   * 提示消息
   */
  message: string;
}

/**
 * 获取等待发布的作品列表，该状态是一个短时间状态，可能出现获取不到的情况
 * @param cookie
 */
export const getWaitPublishResponse = async (cookie: string): Promise<WaitPublishResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/photo/list';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/manage/video?status=2',
    returnSetRootDomainLoginUrl: true,
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  const postData = {
    queryType: '2',
    cursor: 9007199254740991,
    startTime: new Date().setMinutes(new Date().getMinutes() - 5),
    endTime: 9007199254740991,
    limit: 30,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface WaitPublishResponse {
  /**
   * 状态码 1正常 非1异常
   */
  result: number;

  data: {
    /**
     * 待发布列表
     */
    list: Array<{
      /**
       * 发布id
       */
      publishId: number;
      /**
       * 发布时提交的coverKey,用于匹配，审核通过后，该值会变为null
       */
      unPublishCoverKey: string;
      /**
       * 提交时间戳 13位，取前10位作为publishId
       */
      uploadTime: number;
    }>;
    /**
     * 列表中项目数量
     */
    total: number;
  };
  /**
   * 提示消息
   */
  message: string;
}

export interface KuaishouVideoTaskInput extends BaseTask {
  /**
   *  取消执行任务的对象
   */
  cancelToken?: CancelToken;
  /**
   * 发布类型
   * 0 存草稿 平台支持才有效，否则默认为发布
   * 1 发布
   */
  pubType: number;
  /**
   * 任务唯一标志id
   */
  taskId: string;
  /**
   * 视频信息
   */
  video: {
    /**
     * 时长-秒-可带小数
     */
    duration?: number;
    /**
     * 视频宽度
     */
    width?: number;
    /**
     * 视频高度
     */
    height?: number;
    /**
     * 视频字节数大小
     */
    size?: number;
    /**
     * 视频本地路径
     */
    localPath: string;
  };
  /**
   * 封面信息
   */
  cover: {
    /**
     * 封面宽度
     */
    width?: number;
    /**
     * 封面高度
     */
    height?: number;
    /**
     * 封面字节数大小
     */
    size?: number;
    /**
     * 封面url或本地路径
     */
    pathOrUrl: string;
  };

  /**
   * pk封面信息
   */
  pkCover?: {
    /**
     * 封面宽度
     */
    width?: number;
    /**
     * 封面高度
     */
    height?: number;
    /**
     * 封面字节数大小
     */
    size?: number;
    /**
     * 封面url或本地路径
     */
    pathOrUrl: string;
  };

  /**
   *  描述
   */
  desc?: string;

  /**
   * 话题
   */
  topics?: Array<KuaishouTopicInfo>;

  /**
   * 好友
   */
  mentionedUser?: Array<KuaishouFriendInfo>;

  /**
   * 一级分类
   */
  domain?: string;

  /**
   * 二级分类
   */
  secondDomain?: string;

  /**
   * 定时发布，13位时间戳，不定时时默认为0
   */
  publishTime?: number;

  /**
   *地理位置
   */
  location?: KuaishouLocationInfo;

  /**
   * 是否禁止下载
   * 1为不禁止，2为禁止下载
   */
  downloadType?: number;

  /**
   * 是否禁止同城显示
   *
   */
  disableNearbyShow?: boolean;

  /**
   * 是否允许同框
   */
  allowSameFrame?: boolean;
  /**
   * 可见类型
   * 1公开   4好友可见   2私密
   *
   */
  visibilityType: number;

  /**
   * 需要挂载的商品
   */
  goods?: KuaishouGoodsInfo;

  /**
   * 作者申明
   */
  declareInfo?: {
    /**
     * 1：内容为ai生成
     * 2：演绎情节，仅供娱乐
     * 3:个人观点，仅供参考
     * 4:素材来源于网络，暂不支持
     */
    source?: 1 | 2 | 3 | 4;
  };

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 合集id
   */
  collectionId?: number;

  /**
   * 小程序挂载
   */
  miniAppInfo?: KuaiShouMiniAppInfo;
}
