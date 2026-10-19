import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/souhuhao/souhuhao-content-list.service';

describe.runIf(true)('【真实测试】', () => {
  test('获取搜狐号视频列表', async () => {
    const cookie =
      'SUV=16928376190123hlh7a; gidinf=x099980109ee17841bc8a7c4b00042a2147e70190cdb; mp-cv=100-1713767300988-d69588999a6b4f77a1e8506add491f2c; clt=1692837619; cld=20230824084019; reqtype=pc; jv=9152359807344ea99bda48ee88ce88cc-5WCP2Lyu1747971767530; ppinf=2|1747971767|1749181367|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNS0wNS0yM3xlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Mzpwd2R8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVuaXFuYW1lOjA6fA; pprdig=qT6OPU2GMSu0SfJ9UiP8OuEH_mTrdIlM0ZZxlUS7WymmdV3rez0XoNlH2WQ3tYgcIL6juJoXUCc-Nl199Rv-PLsRInyPI1NK8OyBFdKBQOuuGx5l1PTdOtjvogfQ8vfaftzSShdNd5lczwsY2t4jnemGYlv5UOiPFLNKmUI3BTQ; ppmdig=174797176800000034c6b3fb2828479ea2d2a43ec3219209; ppmdig=174797176800000034c6b3fb2828479ea2d2a43ec3219209; tgw_l7_route=632e20bf787d79623d2f5548ef898768; t=1747971831309';

    const result = await getContentListAsync(cookie, 1, 10, 121349544);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);
});
