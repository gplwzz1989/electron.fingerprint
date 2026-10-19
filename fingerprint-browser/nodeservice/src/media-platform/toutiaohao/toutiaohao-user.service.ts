import { $http, HttpConfig } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

export let ToutiaohaoPublicAuthorSearchDefaultCookie =
  'passport_csrf_token=db90e7da9c94162a0275477e951ee9fc; passport_csrf_token_default=db90e7da9c94162a0275477e951ee9fc; passport_mfa_token=CjVqiZS4sgHaDFz3ZG7pMUWhIgufN%2B7dRRAhSmc0YwLRP7%2BqcE%2B6Dy%2BNOIpbyS4bRSrEYoIO2hpKCjwAAAAAAAAAAAAAUMZuUDm9nzmCR0v%2BE6Z71v87VHT1JC%2BjXnicoAVk34Etcag7qVckbcbPC3PN5r7%2BGMEQk7aZDhj2sdFsIAIiAQOVgvL9; d_ticket=c69ef152946788761bac6695bece7fda66b94; n_mh=NiapHmvsv_kDNVSiFvIHBvsbNE4_RRoW3EqcWkBYrBU; sso_auth_status=c9f82f2752fd3b74470668a0a1fd43fd; sso_auth_status_ss=c9f82f2752fd3b74470668a0a1fd43fd; sso_uid_tt=f43495b95f7a6daa7f35d133d5ae75ca; sso_uid_tt_ss=f43495b95f7a6daa7f35d133d5ae75ca; toutiao_sso_user=5dabd86f321e33a92e389b067ada32d8; toutiao_sso_user_ss=5dabd86f321e33a92e389b067ada32d8; sid_ucp_sso_v1=1.0.0-KGUzMTYxOTJlNWI5MTQwNzYzMWQwYzRlYjFmMTBkYTZkOGQwOTY5NGIKHQiCva_l-wEQrrX10wYYzwkgDDCK-pLNBTgCQPEHGgJsZiIgNWRhYmQ4NmYzMjFlMzNhOTJlMzg5YjA2N2FkYTMyZDg; ssid_ucp_sso_v1=1.0.0-KGUzMTYxOTJlNWI5MTQwNzYzMWQwYzRlYjFmMTBkYTZkOGQwOTY5NGIKHQiCva_l-wEQrrX10wYYzwkgDDCK-pLNBTgCQPEHGgJsZiIgNWRhYmQ4NmYzMjFlMzNhOTJlMzg5YjA2N2FkYTMyZDg; passport_auth_status=3aaf907799b550897b13ea0fd17c44a3%2C8cad0eaa752c15a9bb511f23ed44caa5; passport_auth_status_ss=3aaf907799b550897b13ea0fd17c44a3%2C8cad0eaa752c15a9bb511f23ed44caa5; sid_guard=ee4d297c4453f2334eb95eb64adbe22c%7C1786600110%7C5184001%7CMon%2C+12-Oct-2026+05%3A48%3A31+GMT; uid_tt=e81b664b94a1d011fcaaf88e7d3eeacd; uid_tt_ss=e81b664b94a1d011fcaaf88e7d3eeacd; sid_tt=ee4d297c4453f2334eb95eb64adbe22c; sessionid=ee4d297c4453f2334eb95eb64adbe22c; sessionid_ss=ee4d297c4453f2334eb95eb64adbe22c; session_tlb_tag=sttt%7C7%7C7k0pfERT8jNOuV62StviLP________-vnvD0EzpLJTB471SqtiW09zIGmLE5JBxmbuIEY_t1y1Q%3D; is_staff_user=false; has_biz_token=false; sid_ucp_v1=1.0.0-KDgyNTZiNGZlNWZjNTgzNjY1MTk1ZTFlZjc0OTViNmRmZjhhNWVmNGEKFwiCva_l-wEQrrX10wYYzwkgDDgCQPEHGgJscSIgZWU0ZDI5N2M0NDUzZjIzMzRlYjk1ZWI2NGFkYmUyMmM; ssid_ucp_v1=1.0.0-KDgyNTZiNGZlNWZjNTgzNjY1MTk1ZTFlZjc0OTViNmRmZjhhNWVmNGEKFwiCva_l-wEQrrX10wYYzwkgDDgCQPEHGgJscSIgZWU0ZDI5N2M0NDUzZjIzMzRlYjk1ZWI2NGFkYmUyMmM; tt_webid=7673388861817325071; ttwid=1%7C38Jgeihr4PTToe7wMKEvSRODu_CFYtnFf5iS3XpXDqo%7C1787619470%7Cf1c1864d09dbef5cc07ea619cdfa348386add13008651fe6eea9cefe3de1eb89; _ga=GA1.1.409780479.1787619470; odin_tt=d11714f0114105fbda0781d6bd3c784d2e735bf8ba627a1b4debed60d0834336c2e24b8ee0b2c7b5746e18033560c108; _ga_QEHZPBE5HH=GS2.1.s1787619469$o1$g0$t1787620125$j60$l0$h0; _tea_utm_cache_4916=undefined; __druidClientInfo=JTdCJTIyY2xpZW50V2lkdGglMjIlM0ExMjM5JTJDJTIyY2xpZW50SGVpZ2h0JTIyJTNBNzI1JTJDJTIyd2lkdGglMjIlM0ExMjM5JTJDJTIyaGVpZ2h0JTIyJTNBNzI1JTJDJTIyZGV2aWNlUGl4ZWxSYXRpbyUyMiUzQTEuMjk5OTk5OTUyMzE2Mjg0MiUyQyUyMnVzZXJBZ2VudCUyMiUzQSUyMk1vemlsbGElMkY1LjAlMjAoV2luZG93cyUyME5UJTIwMTAuMCUzQiUyMFdpbjY0JTNCJTIweDY0KSUyMEFwcGxlV2ViS2l0JTJGNTM3LjM2JTIwKEtIVE1MJTJDJTIwbGlrZSUyMEdlY2tvKSUyMDM2MCUyRjQuNi45JTIwQ2hyb21lJTJGMTM4LjAuNzIwNC4xODUlMjBTYWZhcmklMkY1MzcuMzYlMjIlN0Q=; s_v_web_id=verify_mt7yv9jr_dVsW0kG6_5aA2_4qsb_8xBI_qqwoGgB13Saa';
const ToutiaohaoPublicAuthorSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 360/4.6.9 Chrome/138.0.7204.185 Safari/537.36';
const ToutiaohaoPublicAuthorSearchSecChUa = '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"';
const ToutiaohaoPublicAuthorSearchAcceptLanguage = 'zh-CN,zh;q=0.9';

const appendToutiaohaoPublicAuthorSearchCookie = (cookie: string, name: string, value: string): string => {
  if (!name) {
    return cookie;
  }
  const cookieList = cookie
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith(`${name}=`));
  cookieList.push(`${name}=${value}`);
  return `${cookieList.join('; ')};`;
};

const mergeToutiaohaoPublicAuthorSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const responseCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return responseCookieList.reduce((currentCookie, responseCookie) => {
    const cookiePair = responseCookie.split(';')[0]?.trim();
    const equalIndex = cookiePair.indexOf('=');
    if (equalIndex <= 0) {
      return currentCookie;
    }
    return appendToutiaohaoPublicAuthorSearchCookie(
      currentCookie,
      cookiePair.slice(0, equalIndex).trim(),
      cookiePair.slice(equalIndex + 1).trim(),
    );
  }, cookie);
};

const syncToutiaohaoPublicAuthorSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeToutiaohaoPublicAuthorSearchResponseCookie(
    ToutiaohaoPublicAuthorSearchDefaultCookie,
    setCookie,
  );
  ToutiaohaoPublicAuthorSearchDefaultCookie = nextDefaultCookie;
  return mergeToutiaohaoPublicAuthorSearchResponseCookie(requestCookie, setCookie);
};

/**
 * 头条号账号统计数据
 * @param cookie
 * @param proxyAgent
 */
export const getUserStatisticAsync = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ToutiaohaoUserStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoUserStatisticResponse>>(
    'https://mp.toutiao.com/mp/fe_api/home/merge_v2',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/index',
        authority: 'mp.toutiao.com',
      },
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface ToutiaohaoUserStatisticResponse {
  code: number;
  data: {
    statistic: {
      data: {
        fans_data: {
          /**
           * 总粉丝数
           */
          total: string;
        };
        total_subscribe_count: string;
        thread_count: string;
        total_income: number;
        /**
         * 总阅读播放数
         */
        total_read_play_count: number;
      };
    };
  };
  message: '';
}

/**
 * 获取头条号公开作者搜索 HTML
 * @param cookie 为空时使用抓包中的公开搜索默认 cookie
 * @param keyWord 搜索关键词
 * @param proxyAgent 代理
 */
export const getToutiaohaoPublicAuthorSearchHtml = async (
  cookie: string | undefined,
  keyWord: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<string> => {
  const requestCookie = cookie?.trim() ? cookie : ToutiaohaoPublicAuthorSearchDefaultCookie;
  const params = new URLSearchParams({
    from: 'media',
    enable_druid_v2: '1',
    cur_tab_title: 'media',
    keyword: keyWord ?? '',
    dvpf: 'pc',
    source: 'input',
    action_type: 'search_subtab_switch',
    page_num: '0',
    pd: 'user',
  });
  const result = await $http.get<unknown, AxiosResponse<string>>(`https://so.toutiao.com/search?${params.toString()}`, {
    headers: {
      cookie: requestCookie,
      Host: 'so.toutiao.com',
      'User-Agent': ToutiaohaoPublicAuthorSearchUserAgent,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': ToutiaohaoPublicAuthorSearchAcceptLanguage,
      referer: `https://so.toutiao.com/search?from=media&enable_druid_v2=1&cur_tab_title=media&keyword=${encodeURIComponent(
        keyWord ?? '',
      )}&dvpf=pc&source=input&action_type=pagination&page_num=0&pd=user`,
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': ToutiaohaoPublicAuthorSearchSecChUa,
      'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
      'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
    },
    responseType: 'text',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  syncToutiaohaoPublicAuthorSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return result.data;
};
