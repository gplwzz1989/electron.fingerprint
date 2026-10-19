import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 多多视频用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoAsync = async (cookie: string, proxyAgent?: object): Promise<DuoduoshipinUserInfoResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DuoduoshipinUserInfoResponse>>(
    'https://live.pinduoduo.com/sprite/obs/anchor/info',
    {
      headers: {
        cookie: cookie,
        referer: 'https://live.pinduoduo.com/n-creator/video/video-all-data',
        authority: 'live.pinduoduo.com',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface DuoduoshipinUserInfoResponse {
  success: boolean;
  errorCode: number;
  error_code: number;
  error_msg: string;
  result: {
    roomId: string;
    name: string;
    image: string;
    fansNumTip: string;
    fansNumDataTip: string;
    fansNumSuffixTip: string;
    showNum: number;
    userCertificationStatus: number;
    platformJudgeResult: number;
    goodsLimit: number;
    hideGoodsMaxCount: number;
    showGoodsMaxCount: number;
    anchorUid: number;
    hideSellInfo: boolean;
    cashRemain: number;
    sourceType: number;
    supportRelay: boolean;
    pidType: number;
    webObsOfflineInfo: {
      in_whitelist: boolean;
      is_living: boolean;
    };
    grayControlMap: {
      canUseThirdObs: boolean;
    };
  };
}
