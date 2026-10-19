import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

export const getLocationListAsync = async (
  cookie: string,
  proxyAgent?: object,
): Promise<ToutiaohaoLocationResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoLocationResponse>>(
    'https://mp.toutiao.com/toutiao/normandy/mp/city_district/',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
        authority: 'mp.toutiao.com',
      },
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface ToutiaohaoLocationResponse {
  data: {
    city_list: Array<{
      cities: Array<{
        /**
         * 城市名称
         */
        name: string;

        /**
         * 城市code
         */
        code: string;
      }>;

      /**
       * 首字母
       */
      name: string;
    }>;
    gps_location: {
      /**
       * 城市名称
       */
      city_name: string;

      /**
       * 城市code
       */
      city_code: string;
      district_name: string;
      district_code: string;
    };
  };
  message: string;
  status: number;
}
