import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDataOverviewFansAsync,
  getCoreDataAsync,
} from '@/media-platform/pipixia/pipixia-data-overview.service';

describe('【Mock】', () => {
  describe('获取皮皮虾数据分析视频投稿', () => {
    const server = setupServer(
      rest.get('https://mp.pipix.com*/api/mp/bds/webapi/media_type_stat/', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              status_code: 0,
              message: 'success',
              prompt: '',
              time: 1698300658843,
              data: {
                media_type_stat: [
                  {
                    media_type: 3,
                    play_count: '11',
                    comment_count: '0',
                    item_count: '',
                    digg_count: '0',
                    stat_time: '2023-09-25',
                    favorite_count: '0',
                  },
                ],
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewAsync('success', '2023-09-25', '2023-10-24');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status_code).toBe(0);
      });
    });
  });

  describe('获取皮皮虾数据分析粉丝数据', () => {
    const server = setupServer(
      rest.get('https://mp.pipix.com*/api/mp/bds/webapi/fans_stat/', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              status_code: 0,
              message: 'success',
              prompt: '',
              time: 1698299555329,
              data: {
                fans_stat: [
                  {
                    user_id: '93668768025',
                    stat_time: '2023-09-25',
                    total_fans: '0',
                    new_fans: '0',
                    lost_fans: '0',
                  },
                ],
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewFansAsync('success', '2023-09-25', '2023-10-24');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status_code).toBe(0);
      });
    });
  });

  describe('获取皮皮虾数据分析整体数据', () => {
    const server = setupServer(
      rest.get('https://mp.pipix.com*/api/mp/bds/webapi/overall_stats/', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              status_code: 0,
              message: 'success',
              prompt: '',
              time: 1698299041563,
              data: {
                overall_stat: {
                  user_id: '0',
                  stat_time: '0',
                  total_fans: '0',
                  new_fans: '0',
                  lost_fans: '0',
                  total_play_count: '7449',
                  play_count: '5',
                  total_comment_count: '0',
                  comment_count: '0',
                  total_item_count: '49',
                  item_count: '0',
                  total_digg_count: '65',
                  digg_count: '0',
                },
                stat_date: '',
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getCoreDataAsync('success', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status_code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取皮皮虾数据分析视频投稿', async () => {
    const cookie =
      's_v_web_id=lo6lzcby_e9baABks_ZmzB_4q3s_8mBt_u2KmIFwEoyfS; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; csrf_session_id=b97990dd79d0f21207d188fe3ba642ba; passport_csrf_token=ee4d8ad08aee317a03779ec24a517a28; passport_csrf_token_default=ee4d8ad08aee317a03779ec24a517a28; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; sso_auth_status=e048dc4c72285d8feb930d94e0d600de; sso_auth_status_ss=e048dc4c72285d8feb930d94e0d600de; sso_uid_tt=d7e6cbad5fcd249f3ebec1fd8efa8d86; sso_uid_tt_ss=d7e6cbad5fcd249f3ebec1fd8efa8d86; toutiao_sso_user=1abcfe95fe49ecb1c782fdaa341892d0; toutiao_sso_user_ss=1abcfe95fe49ecb1c782fdaa341892d0; sid_ucp_sso_v1=1.0.0-KDA1NWJlNDc1MjUwYTdmYjdkNDI4YWNiZGUxNTc4ZjMwMmQ3MTUzMzgKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIDFhYmNmZTk1ZmU0OWVjYjFjNzgyZmRhYTM0MTg5MmQw; ssid_ucp_sso_v1=1.0.0-KDA1NWJlNDc1MjUwYTdmYjdkNDI4YWNiZGUxNTc4ZjMwMmQ3MTUzMzgKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIDFhYmNmZTk1ZmU0OWVjYjFjNzgyZmRhYTM0MTg5MmQw; passport_auth_status=67e243f719a4e3484d6bc7233a70024e%2Ca1a4bf4ca7393eb20103915ec9647bd5; passport_auth_status_ss=67e243f719a4e3484d6bc7233a70024e%2Ca1a4bf4ca7393eb20103915ec9647bd5; sid_guard=e82721fface46d64deb0ec289a2e9df9%7C1698289965%7C5184002%7CMon%2C+25-Dec-2023+03%3A12%3A47+GMT; uid_tt=9bcc4056c071f68e3a0db4e6fd0cefba; uid_tt_ss=9bcc4056c071f68e3a0db4e6fd0cefba; sid_tt=e82721fface46d64deb0ec289a2e9df9; sessionid=e82721fface46d64deb0ec289a2e9df9; sessionid_ss=e82721fface46d64deb0ec289a2e9df9; sid_ucp_v1=1.0.0-KDViZDhmNjQ3ODI3NGZmYTJhYmZkODk1MGU5NzI5Nzg3Y2ExNzZjMWQKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIGU4MjcyMWZmYWNlNDZkNjRkZWIwZWMyODlhMmU5ZGY5; ssid_ucp_v1=1.0.0-KDViZDhmNjQ3ODI3NGZmYTJhYmZkODk1MGU5NzI5Nzg3Y2ExNzZjMWQKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIGU4MjcyMWZmYWNlNDZkNjRkZWIwZWMyODlhMmU5ZGY5; store-region=cn-hn; store-region-src=uid';

    const result = await getDataOverviewAsync(cookie, '2023-09-25', '2023-10-24');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status_code).toBe(0);
  }, 10000000);

  test('获取皮皮虾数据分析粉丝数据', async () => {
    const cookie =
      's_v_web_id=lo6lzcby_e9baABks_ZmzB_4q3s_8mBt_u2KmIFwEoyfS; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; csrf_session_id=b97990dd79d0f21207d188fe3ba642ba; passport_csrf_token=ee4d8ad08aee317a03779ec24a517a28; passport_csrf_token_default=ee4d8ad08aee317a03779ec24a517a28; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; sso_auth_status=e048dc4c72285d8feb930d94e0d600de; sso_auth_status_ss=e048dc4c72285d8feb930d94e0d600de; sso_uid_tt=d7e6cbad5fcd249f3ebec1fd8efa8d86; sso_uid_tt_ss=d7e6cbad5fcd249f3ebec1fd8efa8d86; toutiao_sso_user=1abcfe95fe49ecb1c782fdaa341892d0; toutiao_sso_user_ss=1abcfe95fe49ecb1c782fdaa341892d0; sid_ucp_sso_v1=1.0.0-KDA1NWJlNDc1MjUwYTdmYjdkNDI4YWNiZGUxNTc4ZjMwMmQ3MTUzMzgKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIDFhYmNmZTk1ZmU0OWVjYjFjNzgyZmRhYTM0MTg5MmQw; ssid_ucp_sso_v1=1.0.0-KDA1NWJlNDc1MjUwYTdmYjdkNDI4YWNiZGUxNTc4ZjMwMmQ3MTUzMzgKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIDFhYmNmZTk1ZmU0OWVjYjFjNzgyZmRhYTM0MTg5MmQw; passport_auth_status=67e243f719a4e3484d6bc7233a70024e%2Ca1a4bf4ca7393eb20103915ec9647bd5; passport_auth_status_ss=67e243f719a4e3484d6bc7233a70024e%2Ca1a4bf4ca7393eb20103915ec9647bd5; sid_guard=e82721fface46d64deb0ec289a2e9df9%7C1698289965%7C5184002%7CMon%2C+25-Dec-2023+03%3A12%3A47+GMT; uid_tt=9bcc4056c071f68e3a0db4e6fd0cefba; uid_tt_ss=9bcc4056c071f68e3a0db4e6fd0cefba; sid_tt=e82721fface46d64deb0ec289a2e9df9; sessionid=e82721fface46d64deb0ec289a2e9df9; sessionid_ss=e82721fface46d64deb0ec289a2e9df9; sid_ucp_v1=1.0.0-KDViZDhmNjQ3ODI3NGZmYTJhYmZkODk1MGU5NzI5Nzg3Y2ExNzZjMWQKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIGU4MjcyMWZmYWNlNDZkNjRkZWIwZWMyODlhMmU5ZGY5; ssid_ucp_v1=1.0.0-KDViZDhmNjQ3ODI3NGZmYTJhYmZkODk1MGU5NzI5Nzg3Y2ExNzZjMWQKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIGU4MjcyMWZmYWNlNDZkNjRkZWIwZWMyODlhMmU5ZGY5; store-region=cn-hn; store-region-src=uid';

    const result = await getDataOverviewFansAsync(cookie, '2023-09-25', '2023-10-24');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status_code).toBe(0);
  }, 10000000);

  test('获取皮皮虾数据分析整体数据', async () => {
    const cookie =
      's_v_web_id=lo6lzcby_e9baABks_ZmzB_4q3s_8mBt_u2KmIFwEoyfS; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; csrf_session_id=b97990dd79d0f21207d188fe3ba642ba; passport_csrf_token=ee4d8ad08aee317a03779ec24a517a28; passport_csrf_token_default=ee4d8ad08aee317a03779ec24a517a28; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; sso_auth_status=e048dc4c72285d8feb930d94e0d600de; sso_auth_status_ss=e048dc4c72285d8feb930d94e0d600de; sso_uid_tt=d7e6cbad5fcd249f3ebec1fd8efa8d86; sso_uid_tt_ss=d7e6cbad5fcd249f3ebec1fd8efa8d86; toutiao_sso_user=1abcfe95fe49ecb1c782fdaa341892d0; toutiao_sso_user_ss=1abcfe95fe49ecb1c782fdaa341892d0; sid_ucp_sso_v1=1.0.0-KDA1NWJlNDc1MjUwYTdmYjdkNDI4YWNiZGUxNTc4ZjMwMmQ3MTUzMzgKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIDFhYmNmZTk1ZmU0OWVjYjFjNzgyZmRhYTM0MTg5MmQw; ssid_ucp_sso_v1=1.0.0-KDA1NWJlNDc1MjUwYTdmYjdkNDI4YWNiZGUxNTc4ZjMwMmQ3MTUzMzgKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIDFhYmNmZTk1ZmU0OWVjYjFjNzgyZmRhYTM0MTg5MmQw; passport_auth_status=67e243f719a4e3484d6bc7233a70024e%2Ca1a4bf4ca7393eb20103915ec9647bd5; passport_auth_status_ss=67e243f719a4e3484d6bc7233a70024e%2Ca1a4bf4ca7393eb20103915ec9647bd5; sid_guard=e82721fface46d64deb0ec289a2e9df9%7C1698289965%7C5184002%7CMon%2C+25-Dec-2023+03%3A12%3A47+GMT; uid_tt=9bcc4056c071f68e3a0db4e6fd0cefba; uid_tt_ss=9bcc4056c071f68e3a0db4e6fd0cefba; sid_tt=e82721fface46d64deb0ec289a2e9df9; sessionid=e82721fface46d64deb0ec289a2e9df9; sessionid_ss=e82721fface46d64deb0ec289a2e9df9; sid_ucp_v1=1.0.0-KDViZDhmNjQ3ODI3NGZmYTJhYmZkODk1MGU5NzI5Nzg3Y2ExNzZjMWQKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIGU4MjcyMWZmYWNlNDZkNjRkZWIwZWMyODlhMmU5ZGY5; ssid_ucp_v1=1.0.0-KDViZDhmNjQ3ODI3NGZmYTJhYmZkODk1MGU5NzI5Nzg3Y2ExNzZjMWQKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIGU4MjcyMWZmYWNlNDZkNjRkZWIwZWMyODlhMmU5ZGY5; store-region=cn-hn; store-region-src=uid';

    const result = await getCoreDataAsync(cookie, '93668768025');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status_code).toBe(0);
  }, 10000000);
});
