import { $http } from '@/http';

export const getDeWuGoodsResponse = async (cookie: string, keyWord: string): Promise<DewuGoodsResponse> => {
  const url = `https://creator.dewu.com/sns-creator-center/v1/h5/content/search-spu?title=${encodeURIComponent(
    keyWord,
  )}&sign=`;

  const headers = {
    'Content-Type': 'application/json',
    referer: 'https://creator.dewu.com/release',
    Origin: 'https://creator.dewu.com',
    cookie: cookie,
    appVersion: '5.40.0',
    v: '5.45.0',
    'x-auth-token': decodeURIComponent(cookie.split('dewu_creator_x-auth-token=')[1]?.split(';')[0]),
    //traceparent: 00-f545518468aeba63b5616d9f0f825f90-d95c8eaee45455a4-01
  };
  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface DewuGoodsResponse {
  code: number;
  status: number;
  msg: string;
  data: {
    list: [DeWuGoodsInfo];
  };
}

export interface DeWuGoodsInfo {
  productId: number;
  propertyId: number;
  title: string;
  logoUrl: string;
}
