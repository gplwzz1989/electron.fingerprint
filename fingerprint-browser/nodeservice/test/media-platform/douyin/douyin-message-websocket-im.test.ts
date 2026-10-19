import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { convertCookieStr, Task } from '../../../src/utils';
import { DouyinMessageWebSocketImService } from '../../../src/media-platform/douyin/douyin-message-websocket-im.service';
import { Douyin } from '../../../src';

const SHOULD_RUN_REAL_IM_WS_TEST = process.env.RUN_DOUYIN_IM_WS_DEBUG === '1';
const DEFAULT_DEBUG_DURATION_MS = 10 * 60 * 1000;
const TEST_TIMEOUT_MS = 150 * 60 * 1000;

function readLocalText(fileName: string): string {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
}

function readDebugCookie(): string {
  const envCookie = String(process.env.DOUYIN_IM_WS_COOKIE || '').trim();
  if (envCookie) {
    return envCookie;
  }

  return readLocalText('cookie.txt');
}

function printDebug(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(title);
    return;
  }

  try {
    console.log(title, JSON.stringify(payload, null, 2));
  } catch (error) {
    console.log(title, payload);
  }
}
test('获取新消息列表2', async () => {
  const cookie =
    'douyin.com; device_web_cpu_core=6; device_web_memory_size=32; architecture=amd64; enter_pc_once=1; UIFID_TEMP=e8af8eec168e6006bb749042c72c8d2abad7941d853b8500624783ee98d61da6d4b13530006983fe1e4552867048de41823bbf503dc2b3aa2658b370f3b96af38dae3dbe5d27f29ce18b12999d9e8af9; x-web-secsdk-uid=6f2a4270-1077-46dd-9afa-43c2209e4fd5; s_v_web_id=verify_mpxife4p_oo9Y9bqW_srSp_48JH_8BwT_rrrcDimZLI1E; is_support_rtm_web_ts=1; home_can_add_dy_2_desktop=%220%22; dy_swidth=1477; dy_sheight=831; hevc_supported=true; fpk1=U2FsdGVkX1+2OHswttnkpwnRgdU8XPaJgf9K4HCc8dsga9BvKovIwslH8BIj2BorwoxIALw0ExicqxnDaRkKCw==; fpk2=90daa551604269dbcdcf237b5cc700f3; strategyABtestKey=%221780457510.001%22; passport_csrf_token=937a5ce385feb03422472cfeefcca8b0; passport_csrf_token_default=937a5ce385feb03422472cfeefcca8b0; bd_ticket_guard_client_web_domain=2; UIFID=e8af8eec168e6006bb749042c72c8d2abad7941d853b8500624783ee98d61da6da99bd0d57799264487f85acd5e969880d96fbf2d592a71a22a47d29ccd0a5c5ba168860e53736d19fa2c7dee5d932be6b680cf473b0ff7d1844661edfb75d1d2f3ccbf99a1396a0b8186befde4fc82b05aa09408b3711fc280b4b2fcc62eb3ba851163c1fbe28cd8f1a3e111f1de80387cd2812a6137453a5eca2c2ddf8d382; __ac_signature=_02B4Z6wo00f01m-4GCwAAIDDOz84amHLnPpvmByAAPIA45; passport_mfa_token=CjXlTtsy0FycE%2BWAQuSpgfYoElFFCgVn21gXRCD8t2bZGvR%2FHLTMs2yzfBODj5MPxWpZfHzmzRpKCjwAAAAAAAAAAAAAUH%2Bo7iLC7TdI7vePoL5PDgCXY44OURpoa4PdGW%2BG4ZofpU0ltxZP84wMchP%2Bxbi1KboQ%2BpaTDhj2sdFsIAIiAQPJVRwB; d_ticket=7f325aabd47ab403aae8b215b1e031966a116; passport_assist_user=Cjxlts3_vOSOiIMHNhd4osIc0tdmkDb3i7qZLVpxl-eiLAoVkOEPdqaKV3OuxYIUu75KLlLLSxTRNexBERkaSgo8AAAAAAAAAAAAAFB_24KXZ97HMHPGtGRqolOyVZp_74TTTPAgQ6C3gSENOKupCYiXJ-J5LjiaytihOk74EOOWkw4Yia_WVCABIgEDIDrTig%3D%3D; n_mh=byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4; sid_guard=2a3af1bf2ccccd04ad7ccc2a7315916b%7C1780470835%7C5184000%7CSun%2C+02-Aug-2026+07%3A13%3A55+GMT; uid_tt=7515e20555e25c72dd6d8325990780f6; uid_tt_ss=7515e20555e25c72dd6d8325990780f6; sid_tt=2a3af1bf2ccccd04ad7ccc2a7315916b; sessionid=2a3af1bf2ccccd04ad7ccc2a7315916b; sessionid_ss=2a3af1bf2ccccd04ad7ccc2a7315916b; session_tlb_tag=sttt%7C15%7CKjrxvyzMzQStfMwqcxWRa__________K9TLHaN3rTXgqFI0va-UnjqOXpvwx_i6BcjlgBoqmGj4%3D; is_staff_user=false; has_biz_token=false; sid_ucp_v1=1.0.0-KDAxMDhlYThkYzgwMzYzN2ZkNDI1ZDA1NzkzYzdmNGFhZTg4MGI4OTUKHwjUlrWVoAIQs6j_0AYY7zEgDDCJ4uPQBTgHQPQHSAQaAmxxIiAyYTNhZjFiZjJjY2NjZDA0YWQ3Y2NjMmE3MzE1OTE2Yg; ssid_ucp_v1=1.0.0-KDAxMDhlYThkYzgwMzYzN2ZkNDI1ZDA1NzkzYzdmNGFhZTg4MGI4OTUKHwjUlrWVoAIQs6j_0AYY7zEgDDCJ4uPQBTgHQPQHSAQaAmxxIiAyYTNhZjFiZjJjY2NjZDA0YWQ3Y2NjMmE3MzE1OTE2Yg; _bd_ticket_crypt_cookie=e50d09124ec3f7930c1af3fcd52c0251; __security_mc_1_s_sdk_sign_data_key_web_protect=aef8757c-40a5-bdc9; __security_mc_1_s_sdk_cert_key=c61dfb1b-43f3-aaa1; __security_mc_1_s_sdk_crypt_sdk=ea93cb98-4435-b2f3; __security_server_data_status=1; login_time=1780470835508; is_dash_user=1; stream_recommend_feed_params=%22%7B%5C%22cookie_enabled%5C%22%3Atrue%2C%5C%22screen_width%5C%22%3A1477%2C%5C%22screen_height%5C%22%3A831%2C%5C%22browser_online%5C%22%3Atrue%2C%5C%22cpu_core_num%5C%22%3A6%2C%5C%22device_memory%5C%22%3A32%2C%5C%22downlink%5C%22%3A10%2C%5C%22effective_type%5C%22%3A%5C%224g%5C%22%2C%5C%22round_trip_time%5C%22%3A50%7D%22; SelfTabRedDotControl=%5B%7B%22id%22%3A%227574432070844287027%22%2C%22u%22%3A21%2C%22c%22%3A0%7D%2C%7B%22id%22%3A%227484258221582977034%22%2C%22u%22%3A26%2C%22c%22%3A0%7D%5D; FOLLOW_LIVE_POINT_INFO=%22MS4wLjABAAAAD6xhDbsKTwKbFSKbE5GjZ60IKR_n4HD9QzZ3hhlgdpo%2F1780502400000%2F0%2F1780470837846%2F0%22; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCR0ROMEhBNGZYWTN0LzBBOG5taWVDeEVTNVFWTHZWc1NubHJTalhXSlNoZWRtNVhMWXRjVHFPYnlsdEdiUnhDQTZRaXVtd2JualhiUzVwejNva0phWFk9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; odin_tt=0b69238008a61e414a2e48a1bf4696a92641b5cf0937bde875051af04a3a5ffc0e544a4575d300933fea739b3cc8aff17ccc965405222f1b7c388ba27a935cad; ttwid=1%7CwZGpsEqD9B7PsTSFfsz5LNVPwqTjwFuD6B4LNg77rOA%7C1780470840%7C677e96385e4af7aa75e86ba61006ae3779ff44c7dce9827fb8b0d3f53ba0cad4; download_guide=%220%2F%2F1%22; publish_badge_show_info=%220%2C0%2C0%2C1780470842640%22; biz_trace_id=00272a58; sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e582729277672715a646971273f2763646976602729277f6b5a666475273f2763646976602729276d6a6e5a6b6a716c273f2763646976602729276c6b6f5a7f6367273f27636469766027292771273f27333336373433313231353d3234272927676c715a75776a716a666a69273f2763646976602778; bit_env=j7k6GhSTnVyKoc35XRmnnogYq8Z6qIgFZPEgzH9j0NHLi-x8f0T2eJfjvZOW7MtnHUMBuE--IR5uFCVuhoTExrYiATsE4oyCf0af9FUWf2yoMEpYSDpQTzlfEtrQuxoK4baCnoE6d_On-67Rc2QiUxVEzMpi3EczbvqZw-EpmPZxnV7kPQDMs9Poj3dOq3X3G3i_DD5Q9DKULQphvArymPH4JRoSVPUOnViiyAxMKEf_04wKf37x8-HkNgxxHJ0FZHAQ6rRD-oF7QeC6TSt1WpO5VqihmT_aBIloHJnlQEoxpCdhXQW5Vy41bYeEy8y4pqckSGAXVK9fG9eLtvNnfJ-P6BwI6ahmAgVD4lyzS3KN5iltXj2daVBtDJKSmUymiJJIipoU0PnIYzm5W4vvyJP0XpPdQmyEXY9u3Ky3mlVB8u3VQ4LOS_WDUeAdF3kVPm03U0qBa4Qz08Ic5rnFD8gLMV0oVDsDtZVbUWhIMEJlzmJs8PmrTzNWOrMG6mGR; gulu_source_res=eyJwX2luIjoiYzI2YmJhYzE0ZTUwZDg3M2I0OGE2ZmEwMGJiODE4NzA5MzQ3N2ZhODY1MmFkYmNjODJkZDcyOWQxOTJhZjhlNCJ9; passport_auth_mix_state=rid62yfff4g2kfnju9ivpu15y3hdl05bz70rtpam1faqbaeo; bd_ticket_guard_client_data_v2=eyJyZWVfcHVibGljX2tleSI6IkJHRE4wSEE0ZlhZM3QvMEE4bm1pZUN4RVM1UVZMdlZzU25sclNqWFdKU2hlZG01WExZdGNUcU9ieWx0R2JSeENBNlFpdW13Ym5qWGJTNXB6M29rSmFYWT0iLCJ0c19zaWduIjoidHMuMi4wZGEyYjNkYTE3YTk1Yjk1NTY2MmQxMGY1OTNkNWZmOTlhNWRhZDlkYWI2OTA2ZmE3NWJiMDIyNmY4Mzc2MWU4YzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJUeEJ2dDREK2xPdm9ITk9RanBMVGtPUnd6ZWlLTzM3dzVnTTQzb2tkWGFVPSIsInNlY190cyI6IiNrYmlFeGZZcTVzbGo3ZnpUYWI2Z0JYVDk4aVo1VDBLcEx4WEFVMHlUcFFlWkFXUkZiZFpxb1RWR0laUGEifQ%3D%3D; IsDouyinActive=false';
  const result = await Douyin.getDouYinLatestCommentNoticeList(cookie, '', {
    lastCreateTime: 0,
    isFirstFetch: true,
  });
  console.log(JSON.stringify(result, null, 2));
}, 6000000);

// 将环境变量 RUN_DOUYIN_IM_WS_DEBUG 设为 1 后，可直接连接真实的抖音 frontier-im 服务。
describe.runIf(true)('【抖音 frontier-im WebSocket 调试】', () => {
  test(
    '连接 IM 服务并打印收到的评论和私信',
    async () => {
      //const cookie =
      //'bd_ticket_guard_client_web_domain=2; passport_csrf_token=4ba142797da74dff825dcf2443e64d5b; passport_csrf_token_default=4ba142797da74dff825dcf2443e64d5b; passport_mfa_token=CjeCBzuwcZNoCnq%2BbbQPHhYg8ir6oI2t56n3vl1W3AIqJq00l2nYJWYcf8jsmR69F8ZpSJJqZa3FGkoKPAAAAAAAAAAAAABQWg8nJlq9ivUlCGt37CG53BIrNIGDt6A8afrO3k3P37RPjJY02fpv896%2FdOnSd7gr1RCM9o8OGPax0WwgAiIBA9FarI4%3D; d_ticket=363b94b90f3c406ea91456b7efd21d3bdbe0a; passport_assist_user=CkFYCojHtg_8ibDth2kE0cRQzVdc5kwqPQVIQpV-RFpMc7gsGqwmfFt7x_fFcpSIrcstGSPLkFV-2VHF2n1BHOnBCBpKCjwAAAAAAAAAAAAAUFrocwcttlKl9MoB0k3fWAdwdAki-bvgcZcFeEfEQaJVZaiHFHw8vS2yeICwSmnM72sQr_WPDhiJr9ZUIAEiAQOzbvyX; n_mh=9-mIeuD4wZnlYrrOvfzG3MuT6aQmCUtmr8FxV8Kl8xY; uid_tt=eb2faf8ef88dd49d69a42e44c747527d; uid_tt_ss=eb2faf8ef88dd49d69a42e44c747527d; sid_tt=584099b7c80c4a68f1263c868ebb974c; sessionid=584099b7c80c4a68f1263c868ebb974c; sessionid_ss=584099b7c80c4a68f1263c868ebb974c; is_staff_user=true; has_biz_token=true; sid_ucp_v1=1.0.0-KGRmOTllM2Y1YTc4ZDBhMGM2ZjY0MjNjZmUzNDI4MWIzOWU0OTg4MzEKIQiU4YDV2PS2AhCQ_rvPBhjaFiAMMNTV4uoFOAdA9AdIBBoCbGYiIDU4NDA5OWI3YzgwYzRhNjhmMTI2M2M4NjhlYmI5NzRj; ssid_ucp_v1=1.0.0-KGRmOTllM2Y1YTc4ZDBhMGM2ZjY0MjNjZmUzNDI4MWIzOWU0OTg4MzEKIQiU4YDV2PS2AhCQ_rvPBhjaFiAMMNTV4uoFOAdA9AdIBBoCbGYiIDU4NDA5OWI3YzgwYzRhNjhmMTI2M2M4NjhlYmI5NzRj; _bd_ticket_crypt_doamin=2; _bd_ticket_crypt_cookie=41fa2fd440499debe6384cf0c394a52a; __security_mc_1_s_sdk_sign_data_key_web_protect=c3b02d0b-43d8-b6d3; __security_mc_1_s_sdk_cert_key=b9e817d0-4d17-9764; __security_server_data_status=1; __security_mc_1_s_sdk_crypt_sdk=c83daab4-4aea-9f59; sid_guard=584099b7c80c4a68f1263c868ebb974c%7C1779760707%7C4747116%7CMon%2C+20-Jul-2026+00%3A37%3A03+GMT; session_tlb_tag=sttt%7C14%7CWECZt8gMSmjxJjyGjruXTP________-7e_FUj7SAIEQ678n4SIaXnEbbGODMqha_FQVezKAfnV8%3D; __ac_nonce=06a1f920b0087df8486af; __ac_signature=_02B4Z6wo00f0115N2EQAAIDCgRYrCFe.hctebdzAAL2Ycb; enter_pc_once=1; UIFID_TEMP=74d5f82b6979f9df67daf6b0fb2af371638fd81f291e5d1d686bb931c0456a44fbb074408fa9315e92155f8882f85de6585dc8614b7e9744e01b8fe22d9a7e6af5d772c66176ab8dcffab9bac6f439b1; x-web-secsdk-uid=44b65a14-3a54-4d3d-aea0-8b5e4568bb41; s_v_web_id=verify_mpxga5u5_LzvTfmvn_pLNi_4vTD_AsVa_2xsC1HMNS85r; douyin.com; device_web_cpu_core=6; device_web_memory_size=8; architecture=amd64; is_support_rtm_web_ts=1; hevc_supported=true; IsDouyinActive=true; home_can_add_dy_2_desktop=%220%22; dy_swidth=1477; dy_sheight=831; stream_recommend_feed_params=%22%7B%5C%22cookie_enabled%5C%22%3Atrue%2C%5C%22screen_width%5C%22%3A1477%2C%5C%22screen_height%5C%22%3A831%2C%5C%22browser_online%5C%22%3Atrue%2C%5C%22cpu_core_num%5C%22%3A6%2C%5C%22device_memory%5C%22%3A8%2C%5C%22downlink%5C%22%3A10%2C%5C%22effective_type%5C%22%3A%5C%224g%5C%22%2C%5C%22round_trip_time%5C%22%3A100%7D%22; SelfTabRedDotControl=%5B%7B%22id%22%3A%227068120932788111374%22%2C%22u%22%3A57%2C%22c%22%3A0%7D%5D; FOLLOW_LIVE_POINT_INFO=%22MS4wLjABAAAANMQL7A-_Dkm5fapJrVPCZwHKgs2EuWsfwx_2k31i1cZauZNJBSpn2HWq2k-KF_22%2F1780502400000%2F0%2F1780453904714%2F0%22; fpk1=U2FsdGVkX1/C85cpp3wk2yeTRU/kvD20Igbf6XDTRpDvc5VW+sWh8Oxom0wtDkS2OD+t9sF4FRunVHkUmsfnMg==; fpk2=3844cf69a9954c27a05d42914f7a44dc; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCQm9TT2lySE5zYk4vY3h6ODZid3Y3RWdNSThhVjhZbi8zY2luM3F3d1ZWSHdlaGVQbjdNYS9kbEJnd2hIZXU0TWx4YkFRemltQlhaVnZIUU9QUUpTNW89IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; strategyABtestKey=%221780453913.12%22; ttwid=1%7C0LNoLh2zHhK9hzZ6jfmjqxGVMBEB1JNBMFBuYDvhKWk%7C1780453914%7C9256732f7e07939c39390cc7ce8be1b11386b41fa449d94b8ebff4d5a60f9d0e; gulu_source_res=eyJwX2luIjoiNzkyYzg1NjRmYjIyMWU4Njk1NWI1ZGI4NzgyZGU4ZjQ0MTBiYjMwZTAyNDdmYWVhOTU5OTM2M2MyNzgzZmIwOCJ9; sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e582729277672715a646971273f2763646976602729277f6b5a666475273f2763646976602729276d6a6e5a6b6a716c273f2763646976602729276c6b6f5a7f6367273f27636469766027292771273f2731313031343c363031353d3234272927676c715a75776a716a666a69273f27717770602778; bit_env=ZxLltAKkf6Lhr5zcb-X6q-rXUqiTZ6C_yRXNOrxE0gtZ2Oj3tLD3L6Ys8WKGytYWY76uuCdsEMGctcTKEf9_C-Is_x9-4uYUw9f-4hZk07LszDosvoDU1hpK3cNxWYX3boq_kTFoj8qybfsHrRSoPRVBkppsCu9RFITZOC2g_XgtRBmOulc6EfcCJ8ALEa7G2OHcyEZJZnoN7yGbrrXuJV79mlxpNSj39HTqaXS0637DJvNoX-7cPQy6qvjSjaQykP4c8QI6j-eUNKxP74XAOYrqGkRQ8tJv3JjtTulNw8P5WDmN-PkN2N879IDMPeNAtLBwxRYf9TVoPHR1PcmxKC9lbIQYPOLFAbca2QcT1lCmwlpm7tAzvwSRCFsc97I4gSYPEwKOKHdKoC2kiYNn_zLgyTDcN-aFxNE-N32Hu6ScqBsePcTV7S9TsdIymdeFTzgFmPjTsoUfrOqw1CfxOF37QPIb7kF91HrEZlPzgMUjhw90qS9Cxv1KobOG_3k5CRN4deKyxhKd5cTisdrRFd66_GyRLQNyUWAB_5Y6gQg%3D; passport_auth_mix_state=yg5y4zz76d5gs03cp93vgmtfvgs1e4d2jwvyfk2n873th7v1; biz_trace_id=220eb5b7; odin_tt=6c272fd521fd1f0fc23c50f83539b3dc889cf670360bf7b71674248965d4d53245731c088362f4d5b8a6afe7733fd78eb5d005e7e71209bd4ea4fec476f8bd09; bd_ticket_guard_client_data_v2=eyJyZWVfcHVibGljX2tleSI6IkJCb1NPaXJITnNiTi9jeHo4NmJ3djdFZ01JOGFWOFluLzNjaW4zcXd3VlZId2VoZVBuN01hL2RsQmd3aEhldTRNbHhiQVF6aW1CWFpWdkhRT1BRSlM1bz0iLCJ0c19zaWduIjoidHMuMi44MWExMWVkODZiNTM2NzU0NWNlOGFmMzZjMTFkZTI2ZTljYjM0YTQ4Nzk1ZTY1Mzk4MDVhMTQ4ZGY2MDBmMGVmYzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJwaFBzOFR2MmdhZUZJUk9oSGl5bTlNZWkyOHJWMFRSdGdDTjRrV09QNlprPSIsInNlY190cyI6IiNiWjhzM2JSbG1DSkhFdGlDeEFJY00wSVVveXVSL3RDT0ZZajJ5ZmR3V3RMY01wYndTekZRQkVROTB1Qy8ifQ%3D%3D; is_dash_user=1; publish_badge_show_info=%221%2C0%2C0%2C1780453905540%22; download_guide=%221%2F20260603%2F0%22';
      const cookie =convertCookieStr('gd_random=eyJtYXRjaCI6ZmFsc2UsInBlcmNlbnQiOjAuMDk5NjM2MjU4NzE0OTkyNn0=.u+X7jVVWEdvT5yFvQWQU4iTl+ag2ZTm305ZO2WtMqEk=;gd_random=eyJtYXRjaCI6ZmFsc2UsInBlcmNlbnQiOjAuMDk5NjM2MjU4NzE0OTkyNn0=.u+X7jVVWEdvT5yFvQWQU4iTl+ag2ZTm305ZO2WtMqEk=;gd_random=eyJtYXRjaCI6ZmFsc2UsInBlcmNlbnQiOjAuMDk5NjM2MjU4NzE0OTkyNn0=.u+X7jVVWEdvT5yFvQWQU4iTl+ag2ZTm305ZO2WtMqEk=;gd_random=eyJtYXRjaCI6ZmFsc2UsInBlcmNlbnQiOjAuMDk5NjM2MjU4NzE0OTkyNn0=.u+X7jVVWEdvT5yFvQWQU4iTl+ag2ZTm305ZO2WtMqEk=;x-web-secsdk-uid=85007961-c459-405d-a8ac-3f68b552926f;gfkadpd=2906,33638;_tea_utm_cache_2906=undefined;csrf_session_id=30dddfbe74d0c70d1e4719ed85a9dd59;bd_ticket_guard_regenerate_keys_time=2026-08-26/17:23:23;bd_ticket_guard_client_web_domain=2;passport_csrf_token=928c73fb69b351a5a57130b84f46444d;passport_csrf_token_default=928c73fb69b351a5a57130b84f46444d;sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e5827292771273f2733363d313537333632323d32342778;bit_env=1GDo6wTPZ7PeYcs2cbr5wnhSo8569UxrIxb8HaogxXRkHsBa_OPU94voU_Ozy0uALw4KLnudX-1V5J2lPlV_c55h4X_3H7EABMwoUvE0LA0raYHEcPidvA-6SoST0qSt9LkpkViNvVDdC3P6UjLMAjviweFtGv2dglLmK8vS6Av5_M0-W-b8jBwyTOOYXOQ69ncGWN6-rGvP1eUCpY7iBrmgy25LlFO-mTT0XMjjg0vXA5KFGXM4lqQp0h4sit695_EHu-LityJwRmXiZIFtnBcuKPKGkayOtb0ZKYoXLyJgEXLW4eZRvdNfBpgpeqIspAG6H0VD3zxwWnoSFof59n30GdEAdJWS2JsMBCRUqR5rBE160o0CUACrYjFamekjK5c30fn-BkUltdWmDfUAMnTQimdji6HxTcTlIxKXeUhb497ua63jK8zrp2ggM99C0bQNIT-vewm29qnpzTqJ6-q4hhEyv8qm9-iZZAH4fxa8lpsDghQEongtza9ycRrNs36aAJdj9xsMuTih-H5m2HrRcPphCUifcEa3p_ogssE%3D;gulu_source_res=eyJwX2luIjoiNzkyYzg1NjRmYjIyMWU4Njk1NWI1ZGI4NzgyZGU4ZjQ0MTBiYjMwZTAyNDdmYWVhOTU5OTM2M2MyNzgzZmIwOCJ9;passport_auth_mix_state=retjgw62unno1n21ca3kwwy0bhuq0xx9;s_v_web_id=verify_mt9vz89m_CrhUtFUg_llqS_4Seh_9J8R_cW0lalk9Xn78;passport_mfa_token=CjjvzkF%2FprFU%2BM1j8q7JGVbOXK83UoW%2BSnA2a3wB6JXS941EIe0std%2B8%2B2Zra1MqHuQqhtAOkV1q%2BhpKCjwAAAAAAAAAAAAAUNPcTmxKbnLSbM7kyj%2F%2BoXV7wGNhVO1mUjua9Df%2BQskbYkGWE5f4S0gFV%2BX0jxQ5%2FAMQqsmaDhj2sdFsIAIiAQMsIP7I;d_ticket=d44a73d4b809f13b8f46221e82708a23e2ef3;biz_trace_id=03dc894d;passport_assist_user=CkTEvGBOkI4bNyQBjuZKpF7C4Td2sZ3VyBXASl5kq1HWs9xoInJcJ3n7MN8EqXiM5Ct7SQKp2eSUhdAXmua0qMSwTS1mTRpKCjwAAAAAAAAAAAAAUNMcjLmsOq_ntHFvvlJJlZFrTLPPaX4ketnGNapwbfcv7jYnSAZTdz4aTaGhDq88pOgQiMqaDhiJr9ZUIAEiAQPmNPuF;n_mh=ALGeE53COMBN0Ix2aFghRdIKY1wplr4FCDHh-b3Y38s;sid_guard=7aa65a6955b491b422e59c390f3152ea%7C1787736220%7C5184000%7CSun%2C+25-Oct-2026+09%3A23%3A40+GMT;uid_tt=5e5b52ecd3a95b8da7a83586089a77317a13d4f9b7413f509eb6846d7899b73e;uid_tt_ss=5e5b52ecd3a95b8da7a83586089a77317a13d4f9b7413f509eb6846d7899b73e;sid_tt=7aa65a6955b491b422e59c390f3152ea;sessionid=7aa65a6955b491b422e59c390f3152ea;sessionid_ss=7aa65a6955b491b422e59c390f3152ea;session_tlb_tag=sttt%7C1%7CeqZaaVW0kbQi5Zw5DzFS6v_________2wjtj7DsaUPOylhyHhSmwvc5oqyx6nI_Oc7FmdMaM0Go%3D;is_staff_user=false;has_biz_token=false;sid_ucp_v1=1.0.0-KDE5ODU1YWY2Yzg5YTA2YmUyNjE2MTgwMTQ3YjgxNmVhYzU2OGYxMTQKIgixiIek_9_luGoQnOG61AYY2hYgDDDYu8bTBjgHQPQHSAQaAmxmIiA3YWE2NWE2OTU1YjQ5MWI0MjJlNTljMzkwZjMxNTJlYQ;ssid_ucp_v1=1.0.0-KDE5ODU1YWY2Yzg5YTA2YmUyNjE2MTgwMTQ3YjgxNmVhYzU2OGYxMTQKIgixiIek_9_luGoQnOG61AYY2hYgDDDYu8bTBjgHQPQHSAQaAmxmIiA3YWE2NWE2OTU1YjQ5MWI0MjJlNTljMzkwZjMxNTJlYQ;is_dbsc=false;x_tt_token=007aa65a6955b491b422e59c390f3152ea0109216542864e4e118d47e8b234513d342df0885f0bca633ba39349f338e85faa3938af943f1c33e31cacf29eb3b6ed3865717e10681533f8eb84d9e76d155c204c984b2752800064727c4088036ebdb1b--0a490a20256ad2c9df57fb92260bc19854d54006d455a70d1f11b8965eadb2290a90c8e61220e840b9ed1f5c87a69238cb46877a06a830705239710f87cabe1f01f0b08576ca18f6b4d309-3.0.4;odin_tt=9fde1e7e86948268d74c69c65f034caebbe0bbae7bdd5600f5fb08a7a454fdaf14ac2f8143d7c43237d29c74ddf3f7b41d672a99e63ab6522cf114a85d909a4e;ttwid=1%7ChH0ca2Qavx25bL4ATaf1bkKGna6wPZJuXecs0RAZr94%7C1787736222%7Ccf45556666b6e145a2ca04dede7b80bc5e7f3d6dfe63390a57b51a0d4d1efd74;_bd_ticket_crypt_doamin=2;bd_ticket_guard_ts_sign_id=ts.2.10c39888dbaf2db;_bd_ticket_crypt_cookie=a1cf8a2747703c6c63ec35bc48353476;__security_mc_1_s_sdk_sign_data_key_web_protect=5d83d04e-4248-bca8;__security_mc_1_s_sdk_cert_key=0d27a4fb-4d95-8a28;__security_mc_1_s_sdk_crypt_sdk=149f224b-40af-bf8e;__security_server_data_status=1;bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCQmw0SldXVnBWNnFMWTQ2ZWk0dG5BYzhETTREZUVYMGpRLytBU2JlYWlQLzN4YVpkSm9pVUJSOUFvdDR0OWNZdFpQYWM5c3RPbVVRQ3lRRWpzeUE5M1E9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D;fg_uid=RID20260826172343F34752DD58929041B138;csrf_session_id=30dddfbe74d0c70d1e4719ed85a9dd59');
      const durationMs = Number(process.env.DOUYIN_IM_WS_TEST_DURATION_MS || DEFAULT_DEBUG_DURATION_MS);
      expect(cookie).toBeTruthy();

      const service = new DouyinMessageWebSocketImService({
        cookie,
      });

      service.on('connected', () => {
        printDebug(`${Date.now().toString()} [抖音 frontier-im] 已连接`);
      });

      service.on('deviceResolved', (data) => {
        printDebug(`${Date.now().toString()} [抖音 frontier-im] 解析到的设备信息`, data);
      });

      service.on('authFailed', (reason) => {
        printDebug(`${Date.now().toString()} [抖音 frontier-im] 认证失败`, reason);
      });

      service.on('newMessage', (event) => {
        printDebug(`${Date.now().toString()} [抖音 frontier-im] 收到私信`, event.messages);
      });

      service.on('newComment', (event) => {
        printDebug(`${Date.now().toString()} [抖音 frontier-im] 收到评论`, event.comments);
      });

      service.on('error', (error) => {
        printDebug(
          `${Date.now().toString()} [抖音 frontier-im] WebSocket 异常`,
          error instanceof Error ? { message: error.message, stack: error.stack } : error,
        );
      });

      service.on('closed', (code, reason) => {
        printDebug(`${Date.now().toString()} [抖音 frontier-im] 连接关闭`, {
          code,
          reason,
        });
      });

      const authFailedPromise = new Promise<never>((_, reject) => {
        service.once('authFailed', (reason) => {
          reject(new Error(String(reason || '抖音 frontier-im 认证失败')));
        });
      });

      try {
        await service.prepareConnection();
        printDebug('[抖音 frontier-im] 准备连接完成', service.getResolvedDeviceInfo());
        service.connect();

        await Promise.race([authFailedPromise, Task.Delay(durationMs)]);
      } finally {
        //service.close();

        await Task.Delay(TEST_TIMEOUT_MS);
      }
    },
    TEST_TIMEOUT_MS,
  );
});
