import type { PlatformPublicWorkListOutput, PlatformPublicWorkSearchContentType } from './baseModel';
import { errorCode } from './errorCode';
import { searchBaijiahaoPublicWorkList } from './baijiahao/baijiahao-public-work-search.service';
import { searchBilibiliPublicWorkList } from './bilibili/bilibili-public-work-search.service';
import { searchDouyinPublicWorkList } from './douyin/douyin-public-work-search.service';
import { searchToutiaohaoPublicWorkList } from './toutiaohao/toutiaohao-public-work-search.service';
import { searchXinlangweiboPublicWorkList } from './xinlangweibo/xinlangweibo-public-work-search.service';
import type { KuaiDaiLiProxy } from './webproxy';
import type { Platforms } from '../service/datasync-service-manager';

export interface SearchPlatformPublicWorkListInput {
  platform: Platforms;
  keyWord: string;
  cookie?: string;
  nextPage?: string;
  proxy?: KuaiDaiLiProxy;
  contentType?: PlatformPublicWorkSearchContentType;
}

const PublicWorkSearchPlatforms = {
  DouYin: 'DouYin' as Platforms,
  BaiJiaHao: 'BaiJiaHao' as Platforms,
  TouTiaoHao: 'TouTiaoHao' as Platforms,
  BiLiBiLi: 'BiLiBiLi' as Platforms,
  XinLangWeiBo: 'XinLangWeiBo' as Platforms,
};

/**
 * 统一搜索公开渠道作品列表
 * @param input 搜索参数
 */
export const searchPlatformPublicWorkList = async (
  input: SearchPlatformPublicWorkListInput,
): Promise<PlatformPublicWorkListOutput> => {
  const result: PlatformPublicWorkListOutput = {
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
    case PublicWorkSearchPlatforms.DouYin: {
      return searchDouyinPublicWorkList(
        input.keyWord,
        input.cookie,
        input.nextPage,
        input.proxy,
        input.contentType ?? 'video',
      );
    }
    case PublicWorkSearchPlatforms.BaiJiaHao: {
      return searchBaijiahaoPublicWorkList(
        input.keyWord,
        input.cookie,
        input.nextPage,
        input.proxy,
        input.contentType ?? 'video',
      );
    }
    case PublicWorkSearchPlatforms.TouTiaoHao: {
      return searchToutiaohaoPublicWorkList(
        input.keyWord,
        input.cookie,
        input.nextPage,
        input.proxy,
        input.contentType ?? 'video',
      );
    }
    case PublicWorkSearchPlatforms.BiLiBiLi: {
      return searchBilibiliPublicWorkList(
        input.keyWord,
        input.cookie,
        input.nextPage,
        input.proxy,
        input.contentType ?? 'video',
      );
    }
    case PublicWorkSearchPlatforms.XinLangWeiBo: {
      return searchXinlangweiboPublicWorkList(
        input.keyWord,
        input.cookie,
        input.nextPage,
        input.proxy,
        input.contentType ?? 'video',
      );
    }
    default:
      result.code = errorCode.data_error;
      result.msg = '暂不支持该平台的作品搜索';
      return result;
  }
};
