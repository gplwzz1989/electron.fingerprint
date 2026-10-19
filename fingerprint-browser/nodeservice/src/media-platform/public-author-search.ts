import type { PlatformPublicAuthorListOutput } from './baseModel';
import { errorCode } from './errorCode';
import { searchBaijiahaoPublicAuthorList } from './baijiahao/baijiahao-common';
import { searchBilibiliPublicAuthorList } from './bilibili/bilibili-common';
import { searchDouyinPublicAuthorList } from './douyin/douyin-common';
import { searchToutiaohaoPublicAuthorList } from './toutiaohao/toutiaohao-common';
import { searchXinlangweiboPublicAuthorList } from './xinlangweibo/xinlangweibo-common';
import type { KuaiDaiLiProxy } from './webproxy';
import type { Platforms } from '../service/datasync-service-manager';

export interface SearchPlatformPublicAuthorListInput {
  platform: Platforms;
  keyWord: string;
  cookie?: string;
  nextPage?: string;
  proxy?: KuaiDaiLiProxy;
}

const PublicAuthorSearchPlatforms = {
  DouYin: 'DouYin' as Platforms,
  BaiJiaHao: 'BaiJiaHao' as Platforms,
  TouTiaoHao: 'TouTiaoHao' as Platforms,
  BiLiBiLi: 'BiLiBiLi' as Platforms,
  XinLangWeiBo: 'XinLangWeiBo' as Platforms,
};

/**
 * 统一搜索公开渠道作者列表
 * @param input 搜索参数
 */
export const searchPlatformPublicAuthorList = async (
  input: SearchPlatformPublicAuthorListInput,
): Promise<PlatformPublicAuthorListOutput> => {
  const result: PlatformPublicAuthorListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };
  if (!input.keyWord?.trim()) {
    result.code = errorCode.data_error;
    result.msg = '搜索关键词不能为空';
    return result;
  }
  switch (input.platform) {
    case PublicAuthorSearchPlatforms.DouYin: {
      return searchDouyinPublicAuthorList(input.keyWord, input.cookie, input.nextPage, input.proxy);
    }
    case PublicAuthorSearchPlatforms.BaiJiaHao: {
      return searchBaijiahaoPublicAuthorList(input.keyWord, input.cookie, input.nextPage, input.proxy);
    }
    case PublicAuthorSearchPlatforms.TouTiaoHao: {
      return searchToutiaohaoPublicAuthorList(input.keyWord, input.cookie, input.nextPage, input.proxy);
    }
    case PublicAuthorSearchPlatforms.BiLiBiLi: {
      return searchBilibiliPublicAuthorList(input.keyWord, input.cookie, input.nextPage, input.proxy);
    }
    case PublicAuthorSearchPlatforms.XinLangWeiBo: {
      return searchXinlangweiboPublicAuthorList(input.keyWord, input.cookie, input.nextPage, input.proxy);
    }
    default:
      result.code = errorCode.data_error;
      result.msg = '暂不支持该平台的作者搜索';
      return result;
  }
};
