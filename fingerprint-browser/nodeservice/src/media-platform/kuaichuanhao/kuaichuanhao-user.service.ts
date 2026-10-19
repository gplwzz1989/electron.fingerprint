import { $http } from '@/http';

export const getKuaiChuanHaoUserInfo = async (cookie: string, proxyAgent?: object): Promise<KuaiChuanApiResponse> => {
  const url = 'https://kuaichuan.360kuai.com/user/detail';

  const headers = {
    cookie: cookie,
    referer: 'https://kuaichuan.360kuai.com/user/detail',
    Origin: 'https://kuaichuan.360kuai.com',
  };

  const result = await $http.get(url, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

interface KuaiChuanApiResponse {
  errno: number;
  errmsg: string;
  data: {
    user_info: KuaiChuanUserInfo;
    realm_list: { [key: string]: string };
    income_map: { [key: string]: string };
    editable: number;
  };
}

export interface KuaiChuanUserInfo {
  id: string;
  qid: string;
  type: string;
  m_type: string;
  status: string;
  name: string;
  description: string;
  image: string;
  aux: string;
  province: string;
  city: string;
  realm: string;
  owner_name: string;
  owner_id: string;
  owner_id_image: { [key: string]: string };
  media_code_image: string;
  confirm_image: string;
  qualification_image: string;
  cellphone: string;
  email: string;
  contacts: string;
  site: string;
  address: string;
  attn: string;
  attn_title: string;
  op_reason: any[];
  ext: string;
  create_time: string;
  update_time: string;
  invite: string;
  pqid: string;
  inviter: string;
  src: string;
  register_ip: string;
  income_attr: string;
  operator: string;
  operate_time: string;
  auto_detect_status: string;
  bd_cellphone: string;
  verify_name: string;
  verify_id: string;
  update_button: number;
}
