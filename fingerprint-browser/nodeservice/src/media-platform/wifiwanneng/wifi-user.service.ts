import { $http } from '@/http';

export const getWiFiHaoUserInfo = async (cookie: string, proxyAgent?: object): Promise<WifiUserInfo> => {
  const url = 'https://mp.lsttnews.com/media-center/entry/entryAdd.do';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.lsttnews.com/',
    Origin: 'https://mp.lsttnews.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = 'entry_type=0';

  const result = await $http.post(url, postData, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface WifiUserInfo {
  /** 接口核心数据体 */
  data: {
    /** 主体入驻信息（如用户/机构的详细资料） */
    entryInfo: {
      /** 是否同意访问子网站（0：不同意，1：同意） */
      agree_visit_subwebsite: 0;
      /** 归属地（省份级别，例："云南省"） */
      attributionPlace: string;
      /** 内容领域（例："健身"） */
      contentRealm: string;
      /** 信息创建时间戳（毫秒级，例：1618199266000） */
      ctime: number;
      /** 入驻类型标识（字符串格式，例："0"） */
      entry_type: string;
      /** 主体指数值（例：-1.0） */
      exponent: number;
      /** 指数增加值（例：0.0） */
      exponent_add: number;
      /** 领域编码（例："280400"） */
      field: string;
      /** 禁用状态标识（N：未禁用，Y：已禁用） */
      forbiddenFlag: 'N' | 'Y';
      /** 公众号ID（例："xz-zxy"） */
      gzhId: string;
      /** 主体唯一ID（数字格式，例：4201603461627904） */
      id: number;
      /** 主体简介（例："骑行，是一种生活方式！"） */
      introduce: string;
      /** 地区编码（例："530100" 对应云南省昆明市） */
      location: string;
      /** 媒体属性标识（0：非媒体类型，其他值需结合业务定义） */
      media_attribute: number;
      /** 主体名称（例："热爱骑行的周校长"） */
      name: string;
      /** 运营者性别（1：男，2：女，0：未知） */
      operatorGender: number;
      /** 基于身份证的运营者性别（1：男，2：女） */
      operatorGenderByIdNo: number;
      /** 运营者身份证号（脱敏前完整格式，例："530103196806220615"） */
      operator_idno: string;
      /** 运营者邮箱（例："541804705@qq.com"） */
      operator_mail: string;
      /** 运营者姓名（例："周向阳"） */
      operator_name: string;
      /** 运营者手机号（例："18908847375"） */
      operator_phone: string;
      /** 运营者正面照片URL（例："http://xxx.com/xxx_3"） */
      operator_photo: string;
      /** 运营者背面照片URL（例："http://xxx.com/xxx_3"） */
      operator_photo_back: string;
      /** 机构层级（0：无层级，其他值需结合业务定义） */
      organization_level: number;
      /** 原创保护状态（0：未开启，1：已开启等） */
      originalProtectStatus: number;
      /** 其他联系方式（例："QQ:541804705"） */
      other_contact: string;
      /** 主体头像照片URL（例："https://xxx.com/xxx_3"） */
      portrait_photo: string;
      /** 专业资质照片URL（多个URL用逗号分隔，例："url1,url2"） */
      professional_qualification_photo: string;
      /** 分数配置（JSON字符串格式，需解析后使用，例："{"199":"1","28":"1"}"） */
      score: string;
      /** 主体状态（1：正常/审核中，其他值需结合业务定义，如0：未通过） */
      status: number;
      /** 补充材料（含说明文本与链接，例："今日头条作者\nhttps://xxx.com/xxx"） */
      supplementary_materials: string;
      /** 置顶位置（0：未置顶，其他值为置顶排序序号） */
      top_position: number;
      /** 审核未通过原因（仅未通过时有效，例："请提交运营证明..."） */
      unpass_reason: string;
      /** 用户唯一ID（数字格式，例：4186333914677248） */
      user_id: number;
      /** 用户类型（0：普通用户，其他值需结合业务定义） */
      user_type: number;
      /** 信息更新时间戳（毫秒级，例：1666233269000） */
      utime: number;
      /** 微信审核链接（例："https://mp.weixin.qq.com/xxx"） */
      wechat_check_url: string;
      /** 微信名称（例："校长"） */
      wechat_name: string;
      /** 微信状态（3：通常表示已审核，其他值需结合业务定义） */
      wechat_status: number;
    };
    /** 分类配置表（键：分类ID，值：分类名称） */
    category: {
      [categoryId: string]: string;
      // "1": string;  // 体育
      // "2": string;  // 娱乐
      // "4": string;  // 彩票
    };
  };
  error: { code: number; message: string };
  success: boolean;
}
