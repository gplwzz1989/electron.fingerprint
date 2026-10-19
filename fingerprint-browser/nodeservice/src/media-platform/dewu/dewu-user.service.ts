import { $http } from '@/http';

export const getDeWuUserInfoResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<DeWuUserInfo | undefined> => {
  // const url = `http://o.fun.tv/ajax/check_account?_=${Date.now()}`;
  //
  // const headers = {
  //   cookie: cookie,
  //   referer: 'http://o.fun.tv',
  //   origin: 'http://o.fun.tv',
  // };
  //
  // const result = await $http.get(url, { headers: headers });
  //
  // return result.data;
  const userStr = cookie.split('dewu_creator_userInfo=');
  if (userStr?.length > 1) {
    const userJoStr = decodeURIComponent(userStr[1]?.split(';')[0]);
    const userInfo = JSON.parse(userJoStr);
    return userInfo as DeWuUserInfo;
  } else {
    return undefined;
  }
};

export interface DeWuUserInfo {
  /** 用户ID */
  userId: number;
  /** 用户名 */
  userName: string;
  /** 用户头像图标URL */
  icon: string;
  /** 性别（0可能表示未知、1男、2女等，需结合业务定义） */
  sex: 0;
  /** 个人签名 */
  idiograph: '';
  /** 格式化的时间（如'刚刚'、'1小时前'等） */
  formatTime: '刚刚';
  /** 封禁状态（0表示未封禁） */
  banned: 0;
  /** VIP状态（0表示非VIP） */
  vip: 0;
  /** 数量/金额（具体含义需结合业务） */
  amount: 0;
  /** 金额签名/标识 */
  amountSign: string; // 例如 'b37e38060e294be96da74a3e6889f02e'
  /** 是否为老用户（0表示否） */
  isOlder: 0;
  /** 是否为问题专家（0表示否） */
  isQuestionExpert: 0;
  /** 是否为管理员（0表示否） */
  isAdmin: 0;
  /** 是否绑定手机（1表示是） */
  isBindMobile: 1;
  /** 信息是否完善（1表示是） */
  isComplete: 1;
  /** 加入天数 */
  joinDays: 0;
  /** 是否阅读协议（0表示否） */
  isReadProtocol: 0;
  /** 是否认证（0表示否） */
  isCertify: 0;
  /** 手机号（中间四位用*隐藏） */
  mobile: '138****3847';
  /** 注册/添加时间戳 */
  addTime: 1756279105;
  /** 手机号MD5加密值 */
  mobileMd5: '0dd24acf81e02659a665cc55ff426228';
  /** 账号（为空字符串） */
  account: '';
  /** 账号类型（0表示默认类型） */
  accountType: 0;
}
