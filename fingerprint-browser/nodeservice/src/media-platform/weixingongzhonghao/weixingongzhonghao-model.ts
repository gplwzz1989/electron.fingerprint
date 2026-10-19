import { ListItemInfo } from '../../media-platform';
import { BaseResult } from '../../media-platform/baseResult';

export interface ShipinhaoContentItem extends ListItemInfo {
  authorLogo: string;

  authLogo?:string;

  authorId: string;

  authorName: string;

  nonceId: string;

  videoWidth: number;

  videoHeight: number;
}

export interface WeiXinGongZhongHaoVoteItem extends ListItemInfo {
  /**
   * 过期时间 10位时间戳
   */
  expire: number;

  /**
   * 投票人数
   */
  votePerson: number;
}

export interface WeixingongzhonghaoUserItem extends ListItemInfo {
  /**
   *
   */
  alias: string;

  serviceType: number;

  verifyStatus: number;
}

export interface WeiXinGongZhongHaoUserListOutPut extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<WeixingongzhonghaoUserItem>;

  nextPage?: string;
}

export interface WeiXinGongZhongHaoVoteListOutPut extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<WeiXinGongZhongHaoVoteItem>;
}

export interface ShipinhaoContentListInfoOutPut extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<ShipinhaoContentItem>;
  /**
   * 下一页参数
   */
  nextPage?: string;
}

export interface WeiXinGongZhongHaoCreateVoteRequest {
  /**
   * 投票名称
   */
  title: string;
  /**
   * 投票权限，默认传'1'
   */
  vote_permission: string; // '1';
  /**
   * 过期时间戳（10位数），不过期为0
   */
  expire_time: number;
  /**
   * 投票问题列表
   */
  vote_subject: Array<{
    /**
     * 问题名称
     */
    title: string;
    /**
     * 选择方式 ‘1’为单选，‘2’为多选
     */
    type: '1' | '2';
    /**
     * 问题下选项列表，至少要2个
     */
    options: Array<{
      /**
       * 选项名称
       */
      name: string;
      /**
       * 选项图片，可选，没有图片传空字符串
       */
      url: string;
    }>;
  }>;
  is_editing: 0;
  vote_create_type: 0;
}

export interface WeiXinGongZhongHaoUpdateVoteDetailInfo {
  id: string;
  /**
   * 投票名称
   */
  title: string;
  vote_permission: number;
  expire_time: number;
  create_time: number;
  /**
   * 问题列表
   */
  vote_subject: Array<{
    /**
     * 选择类型 1单选 2多选
     */
    type: number;
    /**
     * 问题名称
     */
    title: string;
    /**
     * 选项列表
     */
    options: Array<{
      /**
       * 选项名称
       */
      name: string;
      /**
       * 图片地址
       */
      url: string;
      /**
       * 选择人数
       */
      cnt: number;
    }>;
    /**
     * 参与人数
     */
    total_cnt: number;
  }>;
  /**
   * 总投票人数
   */
  total_person: number;
  del_flag: number;
  is_editing: number;
  /**
   * 投票发布时间
   */
  publish_time: number;
  vote_create_type: number;
}

export interface WeiXinGongZhongHaoCreateVoteResponse extends BaseResult {
  voteId?: number;
}

export interface WeiXinGongZhongHaoVoteDetailOutPut extends BaseResult {
  data?: WeiXinGongZhongHaoUpdateVoteDetailInfo;
}

export interface WeiXinGongZhongHaoVoteImageOutPut extends BaseResult {
  imgUrl?: string;
}
