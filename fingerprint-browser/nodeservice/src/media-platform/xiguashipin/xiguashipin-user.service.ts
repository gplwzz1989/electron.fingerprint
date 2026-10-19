import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 获取西瓜视频账号数据
 * @param cookie
 * @param user_id 西瓜视频账号id
 */
export const getUserDataAsync = async (cookie: string, user_id: string) => {
  const url = 'https://www.ixigua.com/home/' + user_id + '?list_entrance=homepage';
  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://www.ixigua.com/',
    },
  });

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.status, result.data);
  }

  const data: XiguashipinUserDataResponse = {
    status: 0,
    message: 'success',
    data: {
      fansNum: '0',
      followNum: '0',
      diggNum: '0',
    },
  };

  const followArray = new RegExp('followNum":"[0-9]+",').exec(result.data);

  if (followArray != null && followArray.length > 0) {
    data.data.followNum = followArray[0].split('"')[2];
  }

  const fansArray = new RegExp('fansNum":"[0-9]+",').exec(result.data);

  if (fansArray != null && fansArray.length > 0) {
    data.data.fansNum = fansArray[0].split('"')[2];
  }

  const diggArray = new RegExp('diggNum":[0-9]+,').exec(result.data);

  if (diggArray != null && diggArray.length > 0) {
    data.data.diggNum = diggArray[0].split('"')[1].replace(':', '').replace(',', '');
  }

  return data;
};

export interface XiguashipinUserDataResponse {
  status: number;
  message: string;
  data: {
    fansNum: string;
    followNum: string;
    diggNum: string;
  };
}

export const getUserInfoAsync = async (cookie: string): Promise<XiguashipinUserInfoResponse> => {
  const url = 'https://studio.ixigua.com/';
  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
    },
  });

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.status, result.data);
  }

  const data: XiguashipinUserInfoResponse = {
    status: 0,
    message: 'success',
    data: {
      userId: '',
      userName: '',
      userImage: '',
    },
  };

  const userIdArray = new RegExp("_user_id[\\s]{0,}=[\\s]{0,}'[0-9]{3,}';").exec(result.data);

  if (userIdArray != null && userIdArray.length > 0) {
    data.data.userId = userIdArray[0].split("'")[1];
  }

  const userNameArray = new RegExp("_user_name[\\s]{0,}=[\\s]{0,}'.*';").exec(result.data);

  if (userNameArray != null && userNameArray.length > 0) {
    data.data.userName = userNameArray[0].split("'")[1];
  }

  const avatarArray = new RegExp("_avatar_url[\\s]{0,}=[\\s]{0,}'.*';").exec(result.data);

  if (avatarArray != null && avatarArray.length > 0) {
    data.data.userImage = avatarArray[0].split("'")[1];
  }

  if (data.data.userId === '' || data.data.userName === '') {
    data.status = -12;
    data.message = '用户信息获取失败';
    return data;
  }

  return data;
};

export interface XiguashipinUserInfoResponse {
  status: number;
  message: string;
  data: {
    userId: string;
    userName: string;
    userImage: string;
  };
}
