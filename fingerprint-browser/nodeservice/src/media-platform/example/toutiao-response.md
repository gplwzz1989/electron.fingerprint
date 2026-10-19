# 今日头条（头条号）

##  获取用户信息

URL: `https://mp.toutiao.com/mp/agw/creator_center/user_info`

> 可用于判断授权是否有效

### **请求示例**

```shell
curl --location --request GET 'https://mp.toutiao.com/mp/agw/creator_center/user_info' \
--header 'authority: mp.toutiaohao.com' \
--header 'accept: application/json' \
--header 'accept-language: zh-CN,zh;q=0.9' \
--header 'cookie: tt_webid=7066800664953751054; n_mh=F1twh9n6SUA5aLZ78gplphnsbeT9P4w2vpi43y6hj5E; _S_DPR=2; _S_IPAD=0; _ga=GA1.2.1690743618.1650730061; MONITOR_WEB_ID=a36b1796-0f60-41a0-b903-3f025b9debb6; csrf_session_id=3943020c8e6733d7f98b6e1870abfd98; xigua_csrf_token=k3cu-8rgQF38u0N_Mxbzv3KM; xg_p_tos_token=2ee2a871132483e11c23bc4b432f555e; _ba=BA0.2-20220220-5110e-VLleLnW2E0a1suB46GDb; passport_csrf_token=0fca9571a08d0794085093172e388793; sso_uid_tt=b5ad9edd40b8a472e3988d3e84121a02; sso_uid_tt_ss=b5ad9edd40b8a472e3988d3e84121a02; toutiao_sso_user=24ff8cf37a9ba02fd12513ed167aa51b; toutiao_sso_user_ss=24ff8cf37a9ba02fd12513ed167aa51b; sid_ucp_sso_v1=1.0.0-KGU1ZDkwZDNhOWFkNjI4MmI1YjkzYzZhNzA2ZmY0MzQ5ZmJmYTdlNGUKEwi79bavBBCn8pCaBhgYOAZA9AcaAmxxIiAyNGZmOGNmMzdhOWJhMDJmZDEyNTEzZWQxNjdhYTUxYg; ssid_ucp_sso_v1=1.0.0-KGU1ZDkwZDNhOWFkNjI4MmI1YjkzYzZhNzA2ZmY0MzQ5ZmJmYTdlNGUKEwi79bavBBCn8pCaBhgYOAZA9AcaAmxxIiAyNGZmOGNmMzdhOWJhMDJmZDEyNTEzZWQxNjdhYTUxYg; sid_guard=cc4379e215cd9816148505cf7300b84c%7C1665415464%7C5183999%7CFri%2C+09-Dec-2022+15%3A24%3A23+GMT; uid_tt=af18ca95fc17f439cc2c85718708c504; sid_tt=cc4379e215cd9816148505cf7300b84c; sessionid=cc4379e215cd9816148505cf7300b84c; sid_ucp_v1=1.0.0-KGNiOWY2NjFkMjcxNjRhYzMzNDQxYjQ0MjhiMjA4OTU4YjgzYjg3OGIKFQi79bavBBCo8pCaBhgYIAw4BkD0BxoCbGYiIGNjNDM3OWUyMTVjZDk4MTYxNDg1MDVjZjczMDBiODRj; ssid_ucp_v1=1.0.0-KGNiOWY2NjFkMjcxNjRhYzMzNDQxYjQ0MjhiMjA4OTU4YjgzYjg3OGIKFQi79bavBBCo8pCaBhgYIAw4BkD0BxoCbGYiIGNjNDM3OWUyMTVjZDk4MTYxNDg1MDVjZjczMDBiODRj; odin_tt=4d5eac5e2bc83738dc8439317fdb28c40464da59b40815bdccf8ab34d7366782901cc6b9de108cc9fdfafc928408fd6c; _S_WIN_WH=1800_995; uid_tt_ss=b5ad9edd40b8a472e3988d3e84121a02; sessionid_ss=24ff8cf37a9ba02fd12513ed167aa51b; s_v_web_id=verify_l9xud2ww_2QJblqfL_DzlZ_400Y_BV4B_hhtMx2AWn0cN; msToken=V7DCnTJjL9fB2N-UohjvKu3bD3kmTaiIv5g42843-aolwbRV0YJj9zljtDOwOvarYRq3lJvT62jv5eHwF9jjkpOM0cmGdiRCzaeNJDjcWqI=; ttwid=1%7Cs489CT--mSJ3EOYDtES2hYKpoioLKfxSkA7RwQuIlz0%7C1668442104%7Ce5ce78826c22e649541e9bd0c0c6dac7ce40a00714f56f9d92bdc4e14859fee5; gftoken=Y2M0Mzc5ZTIxNXwxNjY4NDQyMTA4NTN8fDAGBgYGBgY; tt_scid=2LrdHJDDwhSkkJBbnnuvKysju4Yxz-tBmaEravdIhIj-uXIYr2O9szTK4p5ZzIf2569a' \
--header 'dnt: 1' \
--header 'referer: https://mp.toutiao.com/profile_v4/analysis/works-overall/all' \
--header 'sec-ch-ua: "Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"' \
--header 'sec-ch-ua-mobile: ?0' \
--header 'sec-ch-ua-platform: "macOS"' \
--header 'sec-fetch-dest: empty' \
--header 'sec-fetch-mode: cors' \
--header 'sec-fetch-site: same-origin' \
--header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
```

### 登录成功示例

```json
{
  "auth_type": -1,
  "avatar_url": "https://sf6-cdn-tos.toutiaostatic.com/img/user-avatar/cf0148cb45c48f7199b778c3a2933a32~300x300.image",
  "code": 0,
  "extra": {
    "claim_origin_permission": "1",
    "impr_boost_pkg_permission": "0",
    "medium_video_cnt": "0",
    "show_authentication_entrance": "1"
  },
  "is_creator": false,
  "media_id": 1600088830985223,
  "message": "success",
  "name": "洲谋天下",
  "show_data_assistant": false,
  "show_impression": false,
  "tie_fans": {
    "banner_image_url": "https://p9.toutiaoimg.com/obj/toutiao-activity-bucket/activity/pgc_media/task4/f8722a4963abfc81ebc014b84bae74af",
    "banner_schema": "sslocal://webview?hide_search=1&status_bar_color=white&bounce_disable=1&hide_more=1&hide_back_close=1&hide_bar=1&hide_status_bar=1&should_append_common_param=1&url=https%3A%2F%2Fi.snssdk.com%2Ffeoffline%2Ftt_data_assistant%2Fincrease-fans.html",
    "tie_fan_authority": false
  },
  "total_fans_count": 20,
  "user_id": 1173207739,
  "welcome_msg": "在头条创作的第 2426 天"
}
```

### 登录失败示例
> 通常由于 Cookie 失效时引发

```json
{
    "code": 100004,
    "data": null,
    "err_no": 100004,
    "message": "user not login",
    "now": 0,
    "reason": ""
}
```