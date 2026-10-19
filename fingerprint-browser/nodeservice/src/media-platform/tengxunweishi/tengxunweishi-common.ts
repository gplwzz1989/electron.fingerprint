import { BaseResult } from '../baseResult';
import { getContentListAsync, TengxunweishiMediaContent } from './tengxunweishi-content-list.service';
import { getAuthInfoAsync, getPersonalInfoAsync, getUploadIndexPage } from './tengxunweishi-user.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { MediaStatusResultOutput, PlatformAuthorInfo, PlatformContentItem, PlatformContentItemNum } from '../baseModel';
import { auditStatusEnum, formatNumber, formatNumberNo, Task } from '@/utils';

import { getWeishiTopicsResponse, WeishiTopicInfo } from './tengxunweishi-topic.service';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '@/media-platform/data-service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { EventEmitter } from 'events';
import dayjs from 'dayjs';
import { deleteContent } from './tengxunweishi-content-delete.service';

/**
 * 腾讯微视视频管理
 * @param cookie
 * @param personId 授权信息接口返回的personId
 * @param attachInfo 首页传空字符串，下一页传上一页返回的attachInfo
 */
export const getTengxunweishiContentList = async (cookie: string, personId: string, attachInfo: string) => {
  const result: TengxunweishiContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, personId, attachInfo);

    result.code = contentListResult.code;
    result.msg = contentListResult.msg;
    result.total = contentListResult.total;
    result.isFinished = contentListResult.isFinished;
    result.attachInfo = contentListResult.attachInfo;
    result.data = contentListResult.feedDetailList;
    result.raw = contentListResult;
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

export interface TengxunweishiContentListOutput extends BaseResult {
  /**
   * 是否已到最后一页
   */
  isFinished?: number;
  /**
   * 下一页翻页的参数
   */
  attachInfo?: string;
  total?: number;
  data?: Array<TengxunweishiMediaContent>;
  raw?: unknown;
}

/**
 * 获取腾讯微视授权信息
 * @param cookie
 */
export const getTengxunweishiAuthInfo = async (cookie: string, proxy?: IWebProxy) => {
  const result: TengxunweishiAuthInfoOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webproxy;
    if (proxy?.serverAdd) {
      webproxy = createKuaiProxyAgent(proxy);
    }
    const authInfoResult = await getAuthInfoAsync(cookie, webproxy);

    result.code = authInfoResult.code;
    result.msg = authInfoResult.errorMsg;
    if (result.code === 6) {
      result.msg = '登录失效';
    }
    result.data = authInfoResult.data;
    result.raw = authInfoResult;
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

export interface TengxunweishiAuthInfoOutput extends BaseResult {
  data?: {
    /**
     * 微视openId
     */
    weishiOpenid: string;

    /**
     * 用户id
     */
    personid: string;

    /**
     * 授权类型
     */
    authType: string;
  };

  raw?: unknown;
}

/**
 * 腾讯微视用户基本信息
 * @param cookie
 * @param personId 授权信息返回的personId
 */
export const getTengxunweishiUserInfo = async (cookie: string, personId: string, proxy?: IWebProxy) => {
  const result: TengxunweishiUserInfoOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webproxy;
    if (proxy?.serverAdd) {
      webproxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getPersonalInfoAsync(cookie, personId, webproxy);

    result.yixiaoerId = userInfoResult?.personDetail?.personId?.toString();
    result.yixiaoerName = userInfoResult?.personDetail?.nickName?.toString();
    result.yixiaoerImageUrl = userInfoResult?.personDetail?.avatar?.toString();
    result.raw = userInfoResult?.personDetail;
    result.code = userInfoResult.code;
    result.msg = userInfoResult.msg;
    result.data = userInfoResult.personDetail;
    result.raw = userInfoResult;
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
    result.code = errorCode.exception;
  }

  return result;
};

export interface TengxunweishiUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    /**
     * 用户id
     */
    personId: string;

    /**
     * 用户头像
     */
    avatar: string;

    /**
     * 用户昵称
     */
    nickName: string;

    /**
     * 粉丝数
     */
    fansNum: number;

    /**
     * 关注数
     */
    interestNum: number;

    /**
     * 点赞数
     */
    receivePraiseNum: number;

    /**
     * 最后更新时间
     */
    lastUpdateTime: string;
    totalVideoNum: string;
    incVideoNum: string;
    totalPlayVv: string;
    incPlayVv: string;
    incFansNum: string;
  };
}

/**
 * 查询视频状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getWeiShiVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;
    const userAth = await getAuthInfoAsync(cookie);
    let nextPageInfo = '';
    let contentList: TengxunweishiContentListOutput | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getTengxunweishiContentList(cookie, userAth.data.personid, nextPageInfo);
      if (contentList?.data?.length) {
        nextPageInfo = contentList.attachInfo ?? '';
        for (const item of contentList?.data) {
          const findId = item?.video.fileId;

          if (findId === publishId) {
            geted = true;
            if (item.isPublish === 1) {
              result.auditStatus = auditStatusEnum.published;
            } else if (item.isPublish === 2) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else if (item.isPrePub) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            if (item.isLocked === 1) {
              result.auditStatus = auditStatusEnum.deny;
              if (item.isLegal === 1) {
                result.msg = '版权限制';
              }
            }
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = parseInt(item.publishTime);
            result.docId = item.feedId;
            result.coverUrl = item.imgList[0]?.url;
            if (result.auditStatus === auditStatusEnum.published) {
              result.openUrl = `https://h5.weishi.qq.com/weishi/feed/${item.feedId}`;
            }
            return result;
          }
        }
        if (geted || !nextPageInfo) {
          break;
        }
      } else {
        result.code = contentList?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.code ?? -1;
    result.msg = '未找到作品';
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
  result.code = -1;
  result.msg = '未找到作品';
  return result;
};

/**
 *  获取微视话题，keyWord可选，为空时返回默认话题列表
 * @param cookie
 * @param keyWord
 */
export const getWeiShiTopics = async (cookie: string, keyWord?: string): Promise<WeiShiTopicsOutPut> => {
  const result: WeiShiTopicsOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const topicResult = await getWeishiTopicsResponse(cookie, keyWord ?? '');
    result.code = topicResult.code;
    result.msg = topicResult.msg;
    result.topicList = topicResult.topicList;
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

export interface WeiShiTopicsOutPut {
  /**
   * 状态码 0:正常 非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 话题列表
   */
  topicList?: Array<WeishiTopicInfo>;
}

export const checkLogin = async (cookie: string, proxy?: IWebProxy): Promise<{ code: number; msg: string }> => {
  const result = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const topicResult = await getUploadIndexPage(cookie, webProxy);
    result.code = topicResult?.code;
    result.msg = topicResult?.result;
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

/**
 *
 * @param cookie
 * @param proxy
 */
export const getWeishiOverViewDashboard = async (
  cookie: string,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
    data: [],
  };

  const names = [
    { name: '粉丝', key: 'totalFansCount' },
    { name: '点赞', key: 'totalGreatsCount' },
  ];

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    //粉丝、点赞
    const newOverView = {
      all: {
        overview: {},
      },
    };
    result.dataObj = newOverView as never;
    const user = await getAuthInfoAsync(cookie, webProxy);

    const homeData = await getPersonalInfoAsync(cookie, user.data.personid, webProxy);
    if (homeData?.personDetail?.fansNum != undefined) {
      result.data?.push({
        name: '粉丝',
        key: 'totalFansCount',
        value: formatNumber(homeData?.personDetail?.fansNum),
        list: [],
      });
      result.data?.push({
        name: '点赞',
        key: 'totalGreatCount',
        value: formatNumber(homeData?.personDetail?.receivePraiseNum),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(homeData?.personDetail?.fansNum);
      newOverView.all.overview['totalGreatCount'] = formatNumberNo(homeData?.personDetail?.receivePraiseNum);
    } else {
      result.code = homeData?.code ?? errorCode.data_error;
      result.msg = homeData?.msg ?? '';
      return result;
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

  if (result?.data && result?.data?.length > 0) {
    result.code = 0;
  } else {
    result.code = -1;
  }
  const dataList = result.data ?? [];
  result.data = [];
  for (const { name, key } of names) {
    const tmp = dataList.find((item) => item.name === name);
    result.data.push(tmp ?? { name: name, key: key, value: '-', list: [] });
  }
  return result;
};

/**
 * 获取微视指定天数内公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getWeishiContentListView = async (
  cookie: string,
  eventCallBack?: EventEmitter,
  days: number = 7,
  maxCount: number = 20,
  isHeader: boolean = false,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountContentListViewOutPut> => {
  const result: AccountContentListViewOutPut = {
    code: 0,
    msg: '',
    data: [],
  };
  result.data = [];
  result.dataList = [];
  try {
    //封面、标题、创建时间
    // 播放、点赞、评论
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
      // { name: '展现量', key: 'reCommand' },
      { name: '播放', key: 'play' },
      // { name: '播放时长', key: 'playTime' },
      // { name: '播放完成率', key: 'finishPlay' },

      { name: '点赞', key: 'great' },
      { name: '评论', key: 'comment' },
      // { name: '弹幕数', key: 'danmu' },
      // { name: '分享量', key: 'share' },
      // { name: '收藏', key: 'collect' },
      // { name: '喜欢', key: 'like' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const user = await getAuthInfoAsync(cookie, webProxy);

    let nextArgs = '';
    let contentTmpId = '';
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getContentListAsync(cookie, user.data.personid, nextArgs, webProxy);
      if (contentList?.feedDetailList?.length) {
        if (contentList.feedDetailList[0].feedId === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.feedDetailList[0].feedId;
        }
        nextArgs = contentList.attachInfo;
        let j = 0;
        for (const item of contentList?.feedDetailList) {
          j++;

          const date = dayjs(parseInt(item.publishTime) * 1000).toDate();
          if (lastDate > date || result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, { ...result });
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          const newItem: PlatformContentItem = {
            id: item.feedId?.toString(),
            cover: item.imgList[0]?.url,
            title: item.desc,
            date: dateStr,

            play: formatNumber(item.playNum),
            comment: formatNumber(item.commentNum),
            great: formatNumber(item.likeNum),
            pageUrl: `https://h5.weishi.qq.com/weishi/feed/${item.feedId}`,
            type: 'video',
          };
          const newItemNum: PlatformContentItemNum = {
            id: item.feedId?.toString(),
            cover: item.imgList[0]?.url,
            title: item.desc,
            date: dateStr,

            play: formatNumberNo(item.playNum),
            comment: formatNumberNo(item.commentNum),
            great: formatNumberNo(item.likeNum),
            pageUrl: `https://h5.weishi.qq.com/weishi/feed/${item.feedId}`,
            type: 'video',
          };
          //当前数据无法组装pageurl
          result.data.push(newItem);
          result.dataList.push(newItemNum);
        }
        if (result.data?.length >= maxCount) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          return result;
        }
        if (eventCallBack) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          result.data = [];
          result.dataList = [];
        }
        await Task.Delay(1000);
      } else {
        if (!result.data.length) {
          result.code = contentList?.code ?? -1;
          result.msg = contentList?.msg;
        }
        break;
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

/**
 *删除作品
 * @param cookie
 * @param docId 做作品唯一id
 * @param personId
 */
export const deleteTengXunWeishiContent = async (
  cookie: string,
  docId: string,
  personId: string,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (!personId) {
      const userInfo = await getAuthInfoAsync(cookie);
      personId = userInfo?.data?.personid;
    }
    const deleteResult = await deleteContent(cookie, docId, personId);
    result.code = deleteResult?.code ?? -1;
    result.msg = deleteResult?.msg;
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
