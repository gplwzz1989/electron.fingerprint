# 抖音

## 获取创作用户信息

URL：`https://creator.douyin.com/web/api/creator/user/info/`

> 可用于判断授权是否有效

### **请求示例**

```shell
curl 'https://creator.douyin.com/aweme/v1/creator/user/info/?no_cache=1693796397499&aid=2906&app_name=aweme_creator_platform&device_platform=web&referer=https:%2F%2Fcreator.douyin.com%2Fcreator-micro%2Fhome&user_agent=Mozilla%2F5.0+(Macintosh%3B+Intel+Mac+OS+X+10_15_7)+AppleWebKit%2F537.36+(KHTML,+like+Gecko)+Chrome%2F116.0.0.0+Safari%2F537.36&cookie_enabled=true&screen_width=1800&screen_height=1169&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0+(Macintosh%3B+Intel+Mac+OS+X+10_15_7)+AppleWebKit%2F537.36+(KHTML,+like+Gecko)+Chrome%2F116.0.0.0+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&_signature=_02B4Z6wo00d0101B0nQAAIDAHTaWj4zsUDNNRdbAALewbo9WAD65AX.ase0s4LOQkw5UufZG-ie6ysanqSSB5..Y-ihQl1YGbEjFT-nw2Q56AmP9Pc8mRUioQxcb31KM6qx4Bp1KAa025yqz64' \
-H 'Host: creator.douyin.com' \
-H 'Connection: keep-alive' \
-H 'sec-ch-ua: "Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"' \
-H 'Accept: application/json, text/plain, */*' \
-H 'DNT: 1' \
-H 'x-secsdk-csrf-token: 0001000000010cb648c3931e3f08ef440ae108141a294fbed45d366553b588e5b391756f9986178192d97a83d3ef' \
-H 'sec-ch-ua-mobile: ?0' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36' \
-H 'sec-ch-ua-platform: "macOS"' \
-H 'Sec-Fetch-Site: same-origin' \
-H 'Sec-Fetch-Mode: cors' \
-H 'Sec-Fetch-Dest: empty' \
-H 'Referer: https://creator.douyin.com/creator-micro/certification' \
-H 'Accept-Language: zh-CN,zh;q=0.9' \
--cookie 'ttcid=213947aeb08b4f0a8278b120ccc2e91817; s_v_web_id=lk81e585_VhEjmvg5_u427_417Y_AM2Q_G0oJZ0zjNaXO; passport_csrf_token=6d2ca83e3bea0555e219b6af79a6fb2d; passport_csrf_token_default=6d2ca83e3bea0555e219b6af79a6fb2d; n_mh=F1twh9n6SUA5aLZ78gplphnsbeT9P4w2vpi43y6hj5E; csrf_session_id=7e33eecc55adc371407ddf226b9d7e47; __security_server_data_status=1; oc_login_type=LOGIN_PERSON; xgplayer_device_id=42983643623; xgplayer_user_id=335952786838; store-region-src=uid; d_ticket=b7d90520d5f3d200de9c3a9fa60ce2dffe153; passport_assist_user=CjyRx6_C7MNIy8fKuFvIS77t5ZedkInaiV4IBqAgOk5GBuP66sd9BRUpEPLs53bMyC2g5r1z766kh4TQkcwaSAo86i4TmhuJulxbQKVcU2mt2QgwkTW85vFAAC95mgKGIojxeOKSiulO8desSQ6CG-vmBJs2I-ANJ4evuyunEJiauA0Yia_WVCIBA7c1xO4%3D; sso_uid_tt=c642d96127ef760b794aa9304fc66eac; sso_uid_tt_ss=c642d96127ef760b794aa9304fc66eac; toutiao_sso_user=14fdb95221bef86301627ee05240bdbd; toutiao_sso_user_ss=14fdb95221bef86301627ee05240bdbd; uid_tt=c9beed3456e7d521e1d8b73d856b8ff0; uid_tt_ss=c9beed3456e7d521e1d8b73d856b8ff0; sid_tt=3ad0f4960f73d9e9db18770382e55b2c; sessionid=3ad0f4960f73d9e9db18770382e55b2c; sessionid_ss=3ad0f4960f73d9e9db18770382e55b2c; _bd_ticket_crypt_cookie=7c4e550e78fdfa3cc7cfce143ead2071; store-region=cn-hn; LOGIN_STATUS=1; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCUE0ybk9Ybk5haG5WeStqS05ydHRXZ2VYek9pQytwRXcvMC9MYU03VVZrc0UvaFZ6TUhiQXM0MW9rNDZsazhaRHFqUjFLM1BsbkhLdC9UTEM3MTgzVnM9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoxfQ==; passport_fe_beating_status=true; sid_ucp_sso_v1=1.0.0-KGRmOWYyNDNiZDA3NzNlOGE0OTBhMTVkYjE4ZmMyNTVmNzgyMTlkMmQKHQiQ3rC4ogIQnuXBpwYY2hYgDDDX1PjQBTgGQPQHGgJobCIgMTRmZGI5NTIyMWJlZjg2MzAxNjI3ZWUwNTI0MGJkYmQ; ssid_ucp_sso_v1=1.0.0-KGRmOWYyNDNiZDA3NzNlOGE0OTBhMTVkYjE4ZmMyNTVmNzgyMTlkMmQKHQiQ3rC4ogIQnuXBpwYY2hYgDDDX1PjQBTgGQPQHGgJobCIgMTRmZGI5NTIyMWJlZjg2MzAxNjI3ZWUwNTI0MGJkYmQ; sid_guard=3ad0f4960f73d9e9db18770382e55b2c%7C1693479582%7C5184000%7CMon%2C+30-Oct-2023+10%3A59%3A42+GMT; sid_ucp_v1=1.0.0-KDQ2YmU1YjY3N2E3ZGEyNzJhZjcwMTJjOGJkMjBlNWEwNzg4MTkwZjEKGQiQ3rC4ogIQnuXBpwYY2hYgDDgGQPQHSAQaAmxmIiAzYWQwZjQ5NjBmNzNkOWU5ZGIxODc3MDM4MmU1NWIyYw; ssid_ucp_v1=1.0.0-KDQ2YmU1YjY3N2E3ZGEyNzJhZjcwMTJjOGJkMjBlNWEwNzg4MTkwZjEKGQiQ3rC4ogIQnuXBpwYY2hYgDDgGQPQHSAQaAmxmIiAzYWQwZjQ5NjBmNzNkOWU5ZGIxODc3MDM4MmU1NWIyYw; _tea_utm_cache_2906=undefined; strategyABtestKey=%221693560557.364%22; stream_recommend_feed_params=%22%7B%5C%22cookie_enabled%5C%22%3Atrue%2C%5C%22screen_width%5C%22%3A2560%2C%5C%22screen_height%5C%22%3A1440%2C%5C%22browser_online%5C%22%3Atrue%2C%5C%22cpu_core_num%5C%22%3A10%2C%5C%22device_memory%5C%22%3A8%2C%5C%22downlink%5C%22%3A10%2C%5C%22effective_type%5C%22%3A%5C%224g%5C%22%2C%5C%22round_trip_time%5C%22%3A50%7D%22; VIDEO_FILTER_MEMO_SELECT=%7B%22expireTime%22%3A1694165357568%2C%22type%22%3A1%7D; FOLLOW_LIVE_POINT_INFO=%22MS4wLjABAAAATVL-tW8PUSOZlcNwKJ4guFrOS_ECR9uMkogBON3rPmg%2F1693584000000%2F0%2F1693560557572%2F0%22; volume_info=%7B%22isUserMute%22%3Afalse%2C%22isMute%22%3Afalse%2C%22volume%22%3A0.998%7D; FOLLOW_NUMBER_YELLOW_POINT_INFO=%22MS4wLjABAAAATVL-tW8PUSOZlcNwKJ4guFrOS_ECR9uMkogBON3rPmg%2F1693584000000%2F0%2F1693560587624%2F0%22; home_can_add_dy_2_desktop=%221%22; publish_badge_show_info=%221%2C0%2C0%2C1693560595319%22; IsDouyinActive=false; odin_tt=188cd9745178ddd16efe86e4a6693708071062938da647268b9e42784a9c28d4f6225f0a8d0af67b96c3f75c45f40a2f; ttwid=1%7Cs489CT--mSJ3EOYDtES2hYKpoioLKfxSkA7RwQuIlz0%7C1693795623%7C79cd2f52d635f119b2e531aef644b5d096daf6d309d2db4a8ef04a40640ae8e7; tt_scid=h1lvd43xOkRndnpmYdZcBkVVANfez.HY.-UchoJIrDVmXR2z.HVppYrCdlyr9fOeec97; msToken=rbEhoAmIb2Ail2NEDiEsYwx0YTgPI9equ-It77YLQOhxlVJdvpyZmVQsopr-yLs09uvoXOjaRfQ5iYwv3BrytOc4_AoMyfUT56l54Dl3mk_AUTkfG3bEHQ=='
```

### 登录成功示例

```json
{
  "cert_info": {
    "tele_play_cert": {
      "has_drama_role": false
    }
  },
  "dashboard_opend_date": "2020-10-14",
  "douyin_user_verify_info": {
    "avatar_url": "https://p26.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c001_b3f6b608dcb143eeb1fc0e547d5fc799.jpeg?from=2956013662",
    "douyin_unique_id": "376623504",
    "follower_count": 80,
    "following_count": 80,
    "is_super_tag_user": false,
    "nick_name": "Midnight",
    "sync_to_xigua": true,
    "teen_model": false,
    "total_favorited": 339
  },
  "extra": {
    "now": 1693796398000
  },
  "has_data_mgmt_perm": true,
  "has_welfare_donate_permission": false,
  "is_commerce_user": false,
  "is_confer_login": false,
  "is_log_as_person": true,
  "is_login_hotsoon": false,
  "is_perm_revoke": false,
  "is_registered": true,
  "permissions": [
    {
      "extra": "",
      "id": 300,
      "key": "CreatorLogin",
      "name": "CreatorLogin",
      "status": 3
    },
    {
      "extra": "",
      "id": 301,
      "key": "CreatorContentManage",
      "name": "CreatorContentManage",
      "status": 3
    },
    {
      "extra": "",
      "id": 302,
      "key": "CreatorInterManage",
      "name": "CreatorInterManage",
      "status": 3
    },
    {
      "extra": "",
      "id": 304,
      "key": "CreatorConferManage",
      "name": "CreatorConferManage",
      "status": 3
    },
    {
      "extra": "",
      "id": 320,
      "key": "CreatorInterManage.Following",
      "name": "CreatorInterManage.Following",
      "status": 3
    },
    {
      "extra": "",
      "id": 321,
      "key": "CreatorInterManage.Fans",
      "name": "CreatorInterManage.Fans",
      "status": 3
    },
    {
      "extra": "",
      "id": 334,
      "key": "CreatorDataManage.Banner",
      "name": "CreatorDataManage.Banner",
      "status": 3
    },
    {
      "extra": "",
      "id": 335,
      "key": "CreatorDataManage.TraceOthers",
      "name": "CreatorDataManage.TraceOthers",
      "status": 3
    },
    {
      "extra": "",
      "id": 336,
      "key": "CreatorDataManage.SearchSelf",
      "name": "CreatorDataManage.SearchSelf",
      "status": 3
    },
    {
      "extra": "{\"scene\": \"live_data\", \"priority\": 1}",
      "id": 342,
      "key": "CreatorDataManage.Live",
      "name": "CreatorDataManage.Live",
      "status": 3
    },
    {
      "extra": "",
      "id": 344,
      "key": "CreatorMusicManage",
      "name": "CreatorMusicManage",
      "status": 3
    },
    {
      "extra": "",
      "id": 347,
      "key": "CreatorDataManage.Banner.Star",
      "name": "CreatorDataManage.Banner.Star",
      "status": 3
    },
    {
      "extra": "",
      "id": 348,
      "key": "CreatorDataManage.Banner.Music",
      "name": "CreatorDataManage.Banner.Music",
      "status": 3
    },
    {
      "extra": "",
      "id": 349,
      "key": "CreatorDataManage.Banner.HotLive",
      "name": "CreatorDataManage.Banner.HotLive",
      "status": 3
    },
    {
      "extra": "",
      "id": 350,
      "key": "CreatorDataManage.Banner.Movies",
      "name": "CreatorDataManage.Banner.Movies",
      "status": 3
    },
    {
      "extra": "",
      "id": 351,
      "key": "CreatorDataManage.Banner.Sport",
      "name": "CreatorDataManage.Banner.Sport",
      "status": 3
    },
    {
      "extra": "",
      "id": 352,
      "key": "CreatorDataManage.Banner.SportDe",
      "name": "CreatorDataManage.Banner.SportDe",
      "status": 3
    },
    {
      "extra": "",
      "id": 353,
      "key": "CreatorInterManage.relation",
      "name": "CreatorInterManage.relation",
      "status": 3
    },
    {
      "extra": "",
      "id": 354,
      "key": "CreatorInterManage.im",
      "name": "CreatorInterManage.im",
      "status": 3
    },
    {
      "extra": "",
      "id": 355,
      "key": "CreatorDataManage.Banner.Cospa",
      "name": "CreatorDataManage.Banner.Cospa",
      "status": 3
    },
    {
      "extra": "",
      "id": 356,
      "key": "CreatorDataManage.Banner.Food",
      "name": "CreatorDataManage.Banner.Food",
      "status": 3
    },
    {
      "extra": "",
      "id": 357,
      "key": "CreatorDataManage.Banner.Drama",
      "name": "CreatorDataManage.Banner.Drama",
      "status": 3
    },
    {
      "extra": "",
      "id": 359,
      "key": "CreatorDataManage.Banner.Travel",
      "name": "CreatorDataManage.Banner.Travel",
      "status": 3
    },
    {
      "extra": "",
      "id": 362,
      "key": "CreatorDataManage.Banner.Amuse",
      "name": "CreatorDataManage.Banner.Amuse",
      "status": 3
    },
    {
      "extra": "",
      "id": 364,
      "key": "CreatorDataManage.Banner.Car",
      "name": "CreatorDataManage.Banner.Car",
      "status": 3
    },
    {
      "extra": "",
      "id": 365,
      "key": "CreatorDataManage.Banner.Game",
      "name": "CreatorDataManage.Banner.Game",
      "status": 3
    },
    {
      "extra": "",
      "id": 366,
      "key": "CreatorInterManage.interactScore",
      "name": "CreatorInterManage.interactScore",
      "status": 3
    },
    {
      "extra": "",
      "id": 303,
      "key": "CreatorDataManage",
      "name": "CreatorDataManage",
      "status": 3
    },
    {
      "extra": "",
      "id": 330,
      "key": "CreatorDataManage.UserOverview",
      "name": "CreatorDataManage.UserOverview",
      "status": 3
    },
    {
      "extra": "",
      "id": 331,
      "key": "CreatorDataManage.ItemL1",
      "name": "CreatorDataManage.ItemL1",
      "status": 3
    },
    {
      "extra": "",
      "id": 333,
      "key": "CreatorDataManage.Portrait",
      "name": "CreatorDataManage.Portrait",
      "status": 3
    },
    {
      "extra": "",
      "id": 370,
      "key": "CreatorDataManage.WeekReport",
      "name": "CreatorDataManage.WeekReport",
      "status": 3
    },
    {
      "extra": "",
      "id": 332,
      "key": "CreatorDataManage.ItemL2",
      "name": "CreatorDataManage.ItemL2",
      "status": 3
    }
  ],
  "person_info": {
    "category": "生活记录"
  },
  "roles": [
    {
      "id": 100,
      "key": "CreatorDefaultRole",
      "name": "创作平台默认角色"
    },
    {
      "id": 124,
      "key": "CreatorJuniorTask",
      "name": "创作者平台-完成初级任务"
    },
    {
      "id": 134,
      "key": "CreatorDataManagementRole",
      "name": "创作者数据管理角色"
    }
  ],
  "status_code": 0,
  "status_msg": "",
  "user_dashboard_time": "2022-06-21",
  "user_profile": {
    "account_region": "",
    "avatar_url": "https://p26.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c001_b3f6b608dcb143eeb1fc0e547d5fc799.jpeg?from=2956013662",
    "follower_count": 80,
    "following_count": 80,
    "gender": 1,
    "location": "",
    "login_with_only_tc": false,
    "mobile": "133******76",
    "nick_name": "Midnight",
    "region": "CN",
    "school": "",
    "secret_id": "MS4wLjABAAAATVL-tW8PUSOZlcNwKJ4guFrOS_ECR9uMkogBON3rPmg",
    "signature": "一个会写代码的摩托佬",
    "total_favorited": 339,
    "unique_id": "376623504",
    "vcd_info": {
      "auth_relation_time": 0,
      "auth_time": 1617980629,
      "aweme_hotsoon_auth": 1,
      "aweme_hotsoon_auth_relation": 0,
      "register_from": ""
    }
  }
}
```

### 登录失败示例

> 通常由于 Cookie 失效引发

```json
{
  "extra": {
    "logid": "20230913145336C4721EA915C409035B61",
    "now": 1694588016000
  },
  "status_code": 8,
  "status_msg": "用户未登录"
}
```


## 获取媒体用户信息

URL：`https://creator.douyin.com/web/api/media/user/info/`

> 包含高权益等信息的接口

### **请求示例**

```shell

```

### 请求成功

```shell

```
