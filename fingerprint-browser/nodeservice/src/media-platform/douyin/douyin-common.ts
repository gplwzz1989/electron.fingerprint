import { AxiosError } from 'axios';
import { DouyinCategoryInfo, getCategoryInfo } from '../douyin/douyin-category.service';
import { DouyinCollectionInfo, getCollectionList } from '../douyin/douyin-collection.service';
import { deleteContent } from '../douyin/douyin-deletecontent.service';
import {
  DouyinUserInfo,
  getCreatorUserInfo,
  getMediaUserAnchor,
  getMediaUserInfo,
  getPCUserInfo,
  getDouyinPublicAuthorSearchHtml,
  getDouyinPublicAuthorSearchMoreResponse,
  getXiGuaUserInfo,
} from '../douyin/douyin-user.service';
import { getUserList } from '../douyin/douyin-friend.service';
import { getHotEvents, DouyinHotEventInfo } from '../douyin/douyin-hotevents.service';
import {
  DouYinLocationGoodsDetail,
  DouyinLocationInfo,
  douyinLocationResponse,
  getGoodsLocation,
  getLocation,
  getLocationAll,
  getLocationByCity,
  getLocationByCoords,
  getLocationByDefaultGoods,
  getLocationCityList,
  getLocationGoodsInfoResponse,
  getLocationGoodsListResponse,
} from '../douyin/douyin-location.service';
import { DouyinVideoStatusResultOutput, getMediaStatus } from '../douyin/douyin-mediastatus.service';
import { checkMiniAppEnable, DouyinMiniAppInfo, parseMiniAppInfo } from '../douyin/douyin-miniapp.service';
import {
  DouyinHistoryMediaContent,
  getAgwAuthKey,
  getSdkToken,
  getViewHistoryListResponse,
} from '../douyin/douyin-base.service';
import { checkGoodsIsInvalid, DouyinGoodsInfo, parseGoodsInfo } from '../douyin/douyin-shop.service';
import { DouyinTopicInfo, getTopics } from '../douyin/douyin-topic.service';
import { getContentListAsync, DouyinMediaContent, getAnalyzeContentListResponse } from './douyin-content-list.service';
import {
  getDataOverviewListAsync,
  getDouYinOverViewDashboardResponse,
  getSingleDataOverviewAsync,
} from './douyin-data-overview.service';
import { DouyinMusicInfo, getDouyinMusicResponse, searchDouyinMusicResponse } from '../douyin/douyin-music.service';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import {
  DouyinActivityCategory,
  DouyinActivityInfo,
  getActivityCategoryResponse,
  getDouyinActivityList,
} from '../douyin/douyin-activity.service';
import { hasDouYinDataManage, openDouyinDataManageResponse } from '../douyin/douyin-base';
import {
  DouyinTiaozhanInfo,
  getTiaoZhanRecommendKeyResponse,
  getTiaoZhanResponse,
  searchTiaoZhanResponse,
} from '../douyin/douyin-tiaozhan.service';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import { formatNumber, formatNumberNo, Guid, Task } from '@/utils';
import {
  DataColumn,
  GeoLocation,
  ListActivityInfoResponse,
  ListGoodsInfoResponse,
  ListInfoResponse,
  ListItemInfo,
  ListItemInfoLevel,
  ListLevelInfoResponse,
  ListLocationInfoResponse,
  ListMusicInfoResponse,
  LocationItemInfo,
  PublicAuthorPlatformCode,
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
} from '../baseModel';
import dayjs from 'dayjs';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '../webproxy';
import { EventEmitter } from 'events';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { DouYinAccountOverView } from '@/platform-body/accouont-overview';

const douyinShenMingLocation: string =
  '[{"code":"CN","name":"中国","pinyin":"zhrmghg","geoname_id":1814991,"asci_name":"People\'s Republic of China","level":0,"description":"Country","center":[116.372974,39.907779],"sub_region":[{"code":"34","name":"安徽","pinyin":"ahs","geoname_id":1818058,"asci_name":"Anhui","level":1,"description":"Province","center":[117.283042,31.86119],"sub_region":[{"code":"340800","name":"安庆","pinyin":"aqs","geoname_id":1817993,"asci_name":"Anqing","level":2,"description":"City","center":[117.043551,30.50883]},{"code":"340300","name":"蚌埠","pinyin":"bbs","geoname_id":1816440,"asci_name":"Bengbu","level":2,"description":"City","center":[117.363228,32.939667]},{"code":"341600","name":"亳州","pinyin":"bzs","geoname_id":1816234,"asci_name":"Bozhou","level":2,"description":"City","center":[115.782939,33.869338]},{"code":"341700","name":"池州","pinyin":"czs","geoname_id":1814934,"asci_name":"Chizhou","level":2,"description":"City","center":[117.489157,30.656037]},{"code":"341100","name":"滁州","pinyin":"czs","geoname_id":1814757,"asci_name":"Chuzhou","level":2,"description":"City","center":[118.316264,32.303627]},{"code":"341200","name":"阜阳","pinyin":"fys","geoname_id":1810845,"asci_name":"Fuyang","level":2,"description":"City","center":[115.819729,32.896969]},{"code":"340600","name":"淮北","pinyin":"hbs","geoname_id":1807700,"asci_name":"Huaibei","level":2,"description":"City","center":[116.794664,33.971707]},{"code":"340100","name":"合肥","pinyin":"hfs","geoname_id":1808722,"asci_name":"Hefei","level":2,"description":"City","center":[117.283042,31.86119]},{"code":"340400","name":"淮南","pinyin":"hns","geoname_id":1807680,"asci_name":"Huainan","level":2,"description":"City","center":[117.018329,32.647574]},{"code":"341000","name":"黄山","pinyin":"hss","geoname_id":1792359,"asci_name":"Huangshan","level":2,"description":"City","center":[118.317325,29.709239]},{"code":"341500","name":"六安","pinyin":"las","geoname_id":1802206,"asci_name":"Lu\'an","level":2,"description":"City","center":[116.507676,31.752889]},{"code":"340500","name":"马鞍山","pinyin":"mass","geoname_id":1801618,"asci_name":"Ma\'anshan","level":2,"description":"City","center":[118.507906,31.689362]},{"code":"341300","name":"宿州","pinyin":"szs","geoname_id":1793743,"asci_name":"Suzhou","level":2,"description":"City","center":[116.984084,33.633891]},{"code":"340700","name":"铜陵","pinyin":"tls","geoname_id":1792621,"asci_name":"Wusong","level":2,"description":"City","center":[117.816576,30.929935]},{"code":"340200","name":"芜湖","pinyin":"whs","geoname_id":1791236,"asci_name":"Wuhu","level":2,"description":"City","center":[118.376451,31.326319]},{"code":"341800","name":"宣城","pinyin":"xcs","geoname_id":1788080,"asci_name":"Xuancheng","level":2,"description":"City","center":[118.757995,30.945667]}]},{"code":"82","name":"澳门","pinyin":"amtbxzq","geoname_id":1821274,"asci_name":"Macau","level":1,"description":"Region","center":[113.545126,22.18043]},{"code":"11","name":"北京","pinyin":"bjs","geoname_id":2038349,"asci_name":"Beijing","level":1,"description":"Province","center":[116.405285,39.904989],"sub_region":[]},{"code":"50","name":"重庆","pinyin":"cqs","geoname_id":1814905,"asci_name":"Chongqing","level":1,"description":"Province","center":[106.504962,29.533155],"sub_region":[]},{"code":"35","name":"福建","pinyin":"fjs","geoname_id":1811017,"asci_name":"Fujian","level":1,"description":"Province","center":[119.306239,26.075302],"sub_region":[{"code":"350100","name":"福州","pinyin":"fzs","geoname_id":1810821,"asci_name":"Fuzhou","level":2,"description":"City","center":[119.306239,26.075302]},{"code":"350800","name":"龙岩","pinyin":"lys","geoname_id":1802276,"asci_name":"Longyan","level":2,"description":"City","center":[117.02978,25.091603]},{"code":"350900","name":"宁德","pinyin":"nds","geoname_id":1806097,"asci_name":"Ningde","level":2,"description":"City","center":[119.527082,26.65924]},{"code":"350700","name":"南平","pinyin":"nps","geoname_id":1799838,"asci_name":"Nanping","level":2,"description":"City","center":[118.178459,26.635627]},{"code":"350300","name":"莆田","pinyin":"pts","geoname_id":1798445,"asci_name":"Putian","level":2,"description":"City","center":[119.007558,25.431011]},{"code":"350500","name":"泉州","pinyin":"qzs","geoname_id":1797353,"asci_name":"Quanzhou","level":2,"description":"City","center":[118.589421,24.908853]},{"code":"350400","name":"三明","pinyin":"sms","geoname_id":1796663,"asci_name":"Sanming","level":2,"description":"City","center":[117.635001,26.265444]},{"code":"350200","name":"厦门","pinyin":"xms","geoname_id":1790645,"asci_name":"Xiamen","level":2,"description":"City","center":[118.11022,24.490474]},{"code":"350600","name":"漳州","pinyin":"zzs","geoname_id":1785018,"asci_name":"Zhangzhou","level":2,"description":"City","center":[117.661801,24.510897]}]},{"code":"44","name":"广东","pinyin":"gds","geoname_id":1809935,"asci_name":"Guangdong","level":1,"description":"Province","center":[113.280637,23.125178],"sub_region":[{"code":"445100","name":"潮州","pinyin":"czs","geoname_id":1815395,"asci_name":"Chaozhou","level":2,"description":"City","center":[116.632301,23.661701]},{"code":"441900","name":"东莞","pinyin":"dgs","geoname_id":1812545,"asci_name":"Dongguan","level":2,"description":"City","center":[113.746262,23.046237]},{"code":"440600","name":"佛山","pinyin":"fss","geoname_id":1811103,"asci_name":"Foshan","level":2,"description":"City","center":[113.122717,23.028762]},{"code":"440100","name":"广州","pinyin":"gzs","geoname_id":1809858,"asci_name":"Guangzhou","level":2,"description":"City","center":[113.280637,23.125178]},{"code":"441600","name":"河源","pinyin":"hys","geoname_id":1786112,"asci_name":"Heyuan","level":2,"description":"City","center":[114.697802,23.746266]},{"code":"441300","name":"惠州","pinyin":"hzs","geoname_id":1806776,"asci_name":"Huizhou","level":2,"description":"City","center":[114.412599,23.079404]},{"code":"440700","name":"江门","pinyin":"jms","geoname_id":1806299,"asci_name":"Jiangmen","level":2,"description":"City","center":[113.094942,22.590431]},{"code":"445200","name":"揭阳","pinyin":"jys","geoname_id":1797121,"asci_name":"Jieyang","level":2,"description":"City","center":[116.355733,23.543778]},{"code":"440900","name":"茂名","pinyin":"mms","geoname_id":1801180,"asci_name":"Maoming","level":2,"description":"City","center":[110.919229,21.659751]},{"code":"441400","name":"梅州","pinyin":"mzs","geoname_id":1800794,"asci_name":"Meizhou","level":2,"description":"City","center":[116.117582,24.299112]},{"code":"441800","name":"清远","pinyin":"qys","geoname_id":1797945,"asci_name":"Qingyuan","level":2,"description":"City","center":[113.051227,23.685022]},{"code":"440200","name":"韶关","pinyin":"sgs","geoname_id":1795874,"asci_name":"Shaoguan","level":2,"description":"City","center":[113.591544,24.801322]},{"code":"440500","name":"汕头","pinyin":"sts","geoname_id":1795932,"asci_name":"Shantou","level":2,"description":"City","center":[116.708463,23.37102]},{"code":"441500","name":"汕尾","pinyin":"sws","geoname_id":6571356,"asci_name":"Shanwei","level":2,"description":"City","center":[115.364238,22.774485]},{"code":"440300","name":"深圳","pinyin":"szs","geoname_id":1795565,"asci_name":"Shenzhen","level":2,"description":"City","center":[114.085947,22.547]},{"code":"445300","name":"云浮","pinyin":"yfs","geoname_id":1785725,"asci_name":"Yunfu","level":2,"description":"City","center":[112.044439,22.929801]},{"code":"441700","name":"阳江","pinyin":"yjs","geoname_id":1806408,"asci_name":"Yangjiang","level":2,"description":"City","center":[111.975107,21.859222]},{"code":"440400","name":"珠海","pinyin":"zhs","geoname_id":1790437,"asci_name":"Zhuhai","level":2,"description":"City","center":[113.553986,22.224979]},{"code":"440800","name":"湛江","pinyin":"zjs","geoname_id":1784990,"asci_name":"Zhanjiang","level":2,"description":"City","center":[110.364977,21.274898]},{"code":"441200","name":"肇庆","pinyin":"zqs","geoname_id":1784853,"asci_name":"Zhaoqing","level":2,"description":"City","center":[112.472529,23.051546]},{"code":"442000","name":"中山","pinyin":"zss","geoname_id":1915223,"asci_name":"Zhongshan","level":2,"description":"City","center":[113.382391,22.521113]}]},{"code":"62","name":"甘肃","pinyin":"gss","geoname_id":1810676,"asci_name":"Gansu","level":1,"description":"Province","center":[103.823557,36.058039],"sub_region":[{"code":"620400","name":"白银","pinyin":"bys","geoname_id":1817240,"asci_name":"Baiyin","level":2,"description":"City","center":[104.173606,36.54568]},{"code":"621100","name":"定西","pinyin":"dxs","geoname_id":1812749,"asci_name":"Dingxi","level":2,"description":"City","center":[104.626294,35.579578]},{"code":"623000","name":"甘南","pinyin":"gnzzzzz","geoname_id":1810686,"asci_name":"Gannan","level":2,"description":"City","center":[102.911008,34.986354]},{"code":"620300","name":"金昌","pinyin":"jcs","geoname_id":1805733,"asci_name":"Jinchang","level":2,"description":"City","center":[102.187888,38.514238]},{"code":"620900","name":"酒泉","pinyin":"jqs","geoname_id":1279945,"asci_name":"Jiuquan","level":2,"description":"City","center":[98.510795,39.744023]},{"code":"620200","name":"嘉峪关","pinyin":"jygs","geoname_id":1280957,"asci_name":"Jiayuguan","level":2,"description":"City","center":[98.277304,39.786529]},{"code":"621200","name":"陇南","pinyin":"lns","geoname_id":1802494,"asci_name":"Longnan","level":2,"description":"City","center":[104.929379,33.388598]},{"code":"622900","name":"临夏","pinyin":"lxhzzzz","geoname_id":1803330,"asci_name":"Linxia","level":2,"description":"City","center":[103.212006,35.599446]},{"code":"620100","name":"兰州","pinyin":"lzs","geoname_id":1804430,"asci_name":"Lanzhou","level":2,"description":"City","center":[103.823557,36.058039]},{"code":"620800","name":"平凉","pinyin":"pls","geoname_id":1798760,"asci_name":"Pingliang","level":2,"description":"City","center":[106.684691,35.54279]},{"code":"621000","name":"庆阳","pinyin":"qys","geoname_id":1797652,"asci_name":"Qingyang","level":2,"description":"City","center":[107.638372,35.734218]},{"code":"620500","name":"天水","pinyin":"tss","geoname_id":1792891,"asci_name":"Tianshui","level":2,"description":"City","center":[105.724998,34.578529]},{"code":"620600","name":"武威","pinyin":"wws","geoname_id":1803936,"asci_name":"Wuwei","level":2,"description":"City","center":[102.634697,37.929996]},{"code":"620700","name":"张掖","pinyin":"zys","geoname_id":1785036,"asci_name":"Zhangye","level":2,"description":"City","center":[100.455472,38.932897]}]},{"code":"45","name":"广西","pinyin":"gxzzzzq","geoname_id":1809867,"asci_name":"Guangxi","level":1,"description":"Province","center":[108.320004,22.82402],"sub_region":[{"code":"450500","name":"北海","pinyin":"bhs","geoname_id":1816705,"asci_name":"Beihai","level":2,"description":"City","center":[109.119254,21.473343]},{"code":"451000","name":"百色","pinyin":"bss","geoname_id":1816268,"asci_name":"Baise","level":2,"description":"City","center":[106.616285,23.897742]},{"code":"451400","name":"崇左","pinyin":"czs","geoname_id":7909220,"asci_name":"Chongzuo","level":2,"description":"City","center":[107.353926,22.404108]},{"code":"450600","name":"防城港","pinyin":"fcgs","geoname_id":7909223,"asci_name":"Fangchenggang","level":2,"description":"City","center":[108.345478,21.614631]},{"code":"450800","name":"贵港","pinyin":"ggs","geoname_id":1809532,"asci_name":"Guigang","level":2,"description":"City","center":[109.602146,23.0936]},{"code":"450300","name":"桂林","pinyin":"gls","geoname_id":1809498,"asci_name":"Guilin","level":2,"description":"City","center":[110.299121,25.274215]},{"code":"451200","name":"河池","pinyin":"hcs","geoname_id":1808757,"asci_name":"Hechi","level":2,"description":"City","center":[108.062105,24.695899]},{"code":"451100","name":"贺州","pinyin":"hzs","geoname_id":7909224,"asci_name":"Hezhou","level":2,"description":"City","center":[111.552056,24.414141]},{"code":"451300","name":"来宾","pinyin":"lbs","geoname_id":1804609,"asci_name":"Laibin","level":2,"description":"City","center":[109.229772,23.733766]},{"code":"450200","name":"柳州","pinyin":"lzs","geoname_id":1802851,"asci_name":"Liuzhou","level":2,"description":"City","center":[109.411703,24.314617]},{"code":"450100","name":"南宁","pinyin":"nns","geoname_id":1799869,"asci_name":"Nanning","level":2,"description":"City","center":[108.320004,22.82402]},{"code":"450700","name":"钦州","pinyin":"qzs","geoname_id":1797551,"asci_name":"Qinzhou","level":2,"description":"City","center":[108.624175,21.967127]},{"code":"450400","name":"梧州","pinyin":"wzs","geoname_id":1790840,"asci_name":"Wuzhou","level":2,"description":"City","center":[111.297604,23.474803]},{"code":"450900","name":"玉林","pinyin":"yls","geoname_id":1785781,"asci_name":"Yulin","level":2,"description":"City","center":[110.154393,22.63136]}]},{"code":"52","name":"贵州","pinyin":"gzs","geoname_id":1809445,"asci_name":"Guizhou","level":1,"description":"Province","center":[106.713478,26.578343],"sub_region":[{"code":"520400","name":"安顺","pinyin":"ass","geoname_id":1817968,"asci_name":"Anshun","level":2,"description":"City","center":[105.932188,26.245544]},{"code":"520500","name":"毕节","pinyin":"bjs","geoname_id":1816373,"asci_name":"Bijie","level":2,"description":"City","center":[105.28501,27.301693]},{"code":"520100","name":"贵阳","pinyin":"gys","geoname_id":1809461,"asci_name":"Guiyang","level":2,"description":"City","center":[106.713478,26.578343]},{"code":"520200","name":"六盘水","pinyin":"lpss","geoname_id":8533133,"asci_name":"Liupanshui","level":2,"description":"City","center":[104.846743,26.584643]},{"code":"522600","name":"黔东南","pinyin":"qdnmzdzzzz","geoname_id":1798360,"asci_name":"Qiandongnan","level":2,"description":"City","center":[107.977488,26.583352]},{"code":"522700","name":"黔南","pinyin":"qnbyzmzzzz","geoname_id":1798280,"asci_name":"Qiannan","level":2,"description":"City","center":[107.517156,26.258219]},{"code":"522300","name":"黔西南","pinyin":"qxnbyzmzzzz","geoname_id":1798226,"asci_name":"Qianxinan","level":2,"description":"City","center":[104.897971,25.08812]},{"code":"520600","name":"铜仁","pinyin":"trs","geoname_id":1792590,"asci_name":"Tongren","level":2,"description":"City","center":[109.191555,27.718346]},{"code":"520300","name":"遵义","pinyin":"zys","geoname_id":1783621,"asci_name":"Zunyi","level":2,"description":"City","center":[106.937265,27.706626]}]},{"code":"13","name":"河北","pinyin":"hbs","geoname_id":1808773,"asci_name":"Hebei","level":1,"description":"Province","center":[114.502461,38.045474],"sub_region":[{"code":"130600","name":"保定","pinyin":"bds","geoname_id":1816971,"asci_name":"Baoding","level":2,"description":"City","center":[115.482331,38.867657]},{"code":"130800","name":"承德","pinyin":"cds","geoname_id":2038085,"asci_name":"Chengde","level":2,"description":"City","center":[117.939152,40.976204]},{"code":"130900","name":"沧州","pinyin":"czs","geoname_id":1816080,"asci_name":"Cangzhou","level":2,"description":"City","center":[116.857461,38.310582]},{"code":"130400","name":"邯郸","pinyin":"hds","geoname_id":1808963,"asci_name":"Handan","level":2,"description":"City","center":[114.490686,36.612273]},{"code":"131100","name":"衡水","pinyin":"hss","geoname_id":1808392,"asci_name":"Hengshui","level":2,"description":"City","center":[115.665993,37.735097]},{"code":"131000","name":"廊坊","pinyin":"lfs","geoname_id":1804540,"asci_name":"Langfang","level":2,"description":"City","center":[116.704441,39.523927]},{"code":"130300","name":"秦皇岛","pinyin":"qhds","geoname_id":1797595,"asci_name":"Qinhuangdao","level":2,"description":"City","center":[119.586579,39.942531]},{"code":"130100","name":"石家庄","pinyin":"sjzs","geoname_id":1795266,"asci_name":"Shijiazhuang","level":2,"description":"City","center":[114.502461,38.045474]},{"code":"130200","name":"唐山","pinyin":"tss","geoname_id":1793343,"asci_name":"Tangshan","level":2,"description":"City","center":[118.175393,39.635113]},{"code":"130500","name":"邢台","pinyin":"xts","geoname_id":1788927,"asci_name":"Xingtai","level":2,"description":"City","center":[114.508851,37.0682]},{"code":"130700","name":"张家口","pinyin":"zjks","geoname_id":2033196,"asci_name":"Zhangjiakou","level":2,"description":"City","center":[114.884091,40.811901]}]},{"code":"42","name":"湖北","pinyin":"hbs","geoname_id":1806949,"asci_name":"Hubei","level":1,"description":"Province","center":[114.298572,30.584355],"sub_region":[{"code":"422800","name":"恩施","pinyin":"estjzmzzzz","geoname_id":1811624,"asci_name":"Enshi","level":2,"description":"City","center":[109.48699,30.283114]},{"code":"420700","name":"鄂州","pinyin":"ezs","geoname_id":1811618,"asci_name":"Ezhou","level":2,"description":"City","center":[114.890593,30.396536]},{"code":"421100","name":"黄冈","pinyin":"hgs","geoname_id":1807500,"asci_name":"Huanggang","level":2,"description":"City","center":[114.879365,30.447711]},{"code":"420200","name":"黄石","pinyin":"hss","geoname_id":1807225,"asci_name":"Huangshi","level":2,"description":"City","center":[115.077048,30.220074]},{"code":"420800","name":"荆门","pinyin":"jms","geoname_id":1805610,"asci_name":"Jingmen","level":2,"description":"City","center":[112.204251,31.03542]},{"code":"421000","name":"荆州","pinyin":"jzs","geoname_id":1805539,"asci_name":"Jingzhou","level":2,"description":"City","center":[112.23813,30.326857]},{"code":"429005","name":"潜江","pinyin":"qjs","geoname_id":1798313,"asci_name":"Qianjiang","level":2,"description":"City","center":[112.896866,30.421215]},{"code":"429021","name":"神农架","pinyin":"snjlq","geoname_id":1795614,"asci_name":"Shennongjia","level":2,"description":"City","center":[110.671525,31.744449]},{"code":"420300","name":"十堰","pinyin":"sys","geoname_id":1794903,"asci_name":"Shiyan","level":2,"description":"City","center":[110.787916,32.646907]},{"code":"421300","name":"随州","pinyin":"szs","geoname_id":1793879,"asci_name":"Suizhou","level":2,"description":"City","center":[113.37377,31.717497]},{"code":"429006","name":"天门","pinyin":"tms","geoname_id":1792925,"asci_name":"Tianmen","level":2,"description":"City","center":[113.165862,30.653061]},{"code":"420100","name":"武汉","pinyin":"whs","geoname_id":1791247,"asci_name":"Wuhan","level":2,"description":"City","center":[114.298572,30.584355]},{"code":"420900","name":"孝感","pinyin":"xgs","geoname_id":1790253,"asci_name":"Xiaogan","level":2,"description":"City","center":[113.926655,30.926423]},{"code":"421200","name":"咸宁","pinyin":"xns","geoname_id":1790395,"asci_name":"Xianning","level":2,"description":"City","center":[114.328963,29.832798]},{"code":"429004","name":"仙桃","pinyin":"xts","geoname_id":1790370,"asci_name":"Xiantao","level":2,"description":"City","center":[113.453974,30.364953]},{"code":"420600","name":"襄阳","pinyin":"xys","geoname_id":1790587,"asci_name":"Xiangyang","level":2,"description":"City","center":[112.144146,32.042426]},{"code":"420500","name":"宜昌","pinyin":"ycs","geoname_id":1786764,"asci_name":"Yichang","level":2,"description":"City","center":[111.290843,30.702636]}]},{"code":"23","name":"黑龙江","pinyin":"hljs","geoname_id":2036965,"asci_name":"Heilongjiang","level":1,"description":"Province","center":[126.642464,45.756967],"sub_region":[{"code":"230600","name":"大庆","pinyin":"dqs","geoname_id":2037847,"asci_name":"Daqing","level":2,"description":"City","center":[125.11272,46.590734]},{"code":"232700","name":"大兴安岭","pinyin":"dxaldq","geoname_id":2037961,"asci_name":"Daxing\'anling","level":2,"description":"City","center":[124.711526,52.335262]},{"code":"230100","name":"哈尔滨","pinyin":"hebs","geoname_id":2037013,"asci_name":"Harbin","level":2,"description":"City","center":[126.642464,45.756967]},{"code":"230400","name":"鹤岗","pinyin":"hgs","geoname_id":2036986,"asci_name":"Hegang","level":2,"description":"City","center":[130.277487,47.332085]},{"code":"231100","name":"黑河","pinyin":"hhs","geoname_id":2036973,"asci_name":"Heihe","level":2,"description":"City","center":[127.499023,50.249585]},{"code":"230800","name":"佳木斯","pinyin":"jmss","geoname_id":2036581,"asci_name":"Jiamusi","level":2,"description":"City","center":[130.361634,46.809606]},{"code":"230300","name":"鸡西","pinyin":"jxs","geoname_id":2036389,"asci_name":"Jixi","level":2,"description":"City","center":[130.975966,45.300046]},{"code":"231000","name":"牡丹江","pinyin":"mdjs","geoname_id":2035715,"asci_name":"Mudanjiang","level":2,"description":"City","center":[129.618602,44.582962]},{"code":"230200","name":"齐齐哈尔","pinyin":"qqhes","geoname_id":2035265,"asci_name":"Qiqihar","level":2,"description":"City","center":[123.95792,47.342081]},{"code":"230900","name":"七台河","pinyin":"qths","geoname_id":2035260,"asci_name":"Qitaihe","level":2,"description":"City","center":[131.015584,45.771266]},{"code":"231200","name":"绥化","pinyin":"shs","geoname_id":2034655,"asci_name":"Suihua","level":2,"description":"City","center":[126.99293,46.637393]},{"code":"230500","name":"双鸭山","pinyin":"syss","geoname_id":2034786,"asci_name":"Shuangyashan","level":2,"description":"City","center":[131.157304,46.643442]},{"code":"230700","name":"伊春","pinyin":"ycs","geoname_id":2033413,"asci_name":"Yichun","level":2,"description":"City","center":[128.899396,47.724775]}]},{"code":"46","name":"海南","pinyin":"hns","geoname_id":1809054,"asci_name":"Hainan","level":1,"description":"Province","center":[110.33119,20.031971],"sub_region":[{"code":"469025","name":"白沙","pinyin":"bslzzzx","geoname_id":1817425,"asci_name":"Baisha","level":2,"description":"City","center":[109.452606,19.224584]},{"code":"469029","name":"保亭","pinyin":"btlzmzzzx","geoname_id":1816903,"asci_name":"Baoting","level":2,"description":"City","center":[109.70245,18.636371]},{"code":"469026","name":"昌江","pinyin":"cjlzzzx","geoname_id":1815692,"asci_name":"Changjiang","level":2,"description":"City","center":[109.053351,19.260968]},{"code":"469023","name":"澄迈","pinyin":"cmx","geoname_id":1805505,"asci_name":"Chengmai","level":2,"description":"City","center":[110.007147,19.737095]},{"code":"469021","name":"定安","pinyin":"dax","geoname_id":1812824,"asci_name":"Ding\'an","level":2,"description":"City","center":[110.349235,19.684966]},{"code":"469007","name":"东方","pinyin":"dfs","geoname_id":1812589,"asci_name":"Dongfang","level":2,"description":"City","center":[108.653789,19.10198]},{"code":"460400","name":"儋州","pinyin":"dzs","geoname_id":1813805,"asci_name":"Danzhou","level":2,"description":"City","center":[109.576782,19.517486]},{"code":"460100","name":"海口","pinyin":"hks","geoname_id":1809078,"asci_name":"Haikou","level":2,"description":"City","center":[110.33119,20.031971]},{"code":"469027","name":"乐东","pinyin":"ldlzzzx","geoname_id":1804250,"asci_name":"Ledong","level":2,"description":"City","center":[109.175444,18.74758]},{"code":"469024","name":"临高","pinyin":"lgx","geoname_id":1803557,"asci_name":"Lingao","level":2,"description":"City","center":[109.687697,19.908293]},{"code":"469028","name":"陵水","pinyin":"lslzzzx","geoname_id":1803461,"asci_name":"Lingshui","level":2,"description":"City","center":[110.037218,18.505006]},{"code":"469002","name":"琼海","pinyin":"qhs","geoname_id":1806488,"asci_name":"Qionghai","level":2,"description":"City","center":[110.466785,19.246011]},{"code":"469030","name":"琼中","pinyin":"qzlzmzzzx","geoname_id":1797536,"asci_name":"Qiongzhong","level":2,"description":"City","center":[109.839996,19.03557]},{"code":"460300","name":"三沙","pinyin":"sss","geoname_id":8402317,"asci_name":"Sansha","level":2,"description":"City","center":[112.34882,16.831039]},{"code":"460200","name":"三亚","pinyin":"sys","geoname_id":1796539,"asci_name":"Sanya","level":2,"description":"City","center":[109.508268,18.247872]},{"code":"469022","name":"屯昌","pinyin":"tcx","geoname_id":1792374,"asci_name":"Tunchang","level":2,"description":"City","center":[110.102773,19.362916]},{"code":"469005","name":"文昌","pinyin":"wcs","geoname_id":1791540,"asci_name":"Wenchang","level":2,"description":"City","center":[110.753975,19.612986]},{"code":"469006","name":"万宁","pinyin":"wns","geoname_id":1791778,"asci_name":"Wanning","level":2,"description":"City","center":[110.388793,18.796216]},{"code":"469001","name":"五指山","pinyin":"wzss","geoname_id":1792571,"asci_name":"Wuzhishan","level":2,"description":"City","center":[109.516662,18.776921]}]},{"code":"41","name":"河南","pinyin":"hns","geoname_id":1808520,"asci_name":"Henan","level":1,"description":"Province","center":[113.665412,34.757975],"sub_region":[{"code":"410500","name":"安阳","pinyin":"ays","geoname_id":1785294,"asci_name":"Anyang","level":2,"description":"City","center":[114.352482,36.103442]},{"code":"410600","name":"鹤壁","pinyin":"hbs","geoname_id":1808770,"asci_name":"Hebi","level":2,"description":"City","center":[114.295444,35.748236]},{"code":"419001","name":"济源","pinyin":"jys","geoname_id":1805012,"asci_name":"Jiyuan","level":2,"description":"City","center":[112.590047,35.090378]},{"code":"410800","name":"焦作","pinyin":"jzs","geoname_id":1805987,"asci_name":"Jiaozuo","level":2,"description":"City","center":[113.238266,35.23904]},{"code":"410200","name":"开封","pinyin":"kfs","geoname_id":1804879,"asci_name":"Kaifeng","level":2,"description":"City","center":[114.341447,34.797049]},{"code":"411100","name":"漯河","pinyin":"lhs","geoname_id":1801934,"asci_name":"Luohe","level":2,"description":"City","center":[114.026405,33.575855]},{"code":"410300","name":"洛阳","pinyin":"lys","geoname_id":1801792,"asci_name":"Luoyang","level":2,"description":"City","center":[112.434468,34.663041]},{"code":"411300","name":"南阳","pinyin":"nys","geoname_id":1799629,"asci_name":"Nanyang","level":2,"description":"City","center":[112.540918,32.999082]},{"code":"410400","name":"平顶山","pinyin":"pdss","geoname_id":1798827,"asci_name":"Pingdingshan","level":2,"description":"City","center":[113.307718,33.735241]},{"code":"410900","name":"濮阳","pinyin":"pys","geoname_id":1941243,"asci_name":"Puyang","level":2,"description":"City","center":[115.041299,35.768234]},{"code":"411200","name":"三门峡","pinyin":"smxs","geoname_id":1796669,"asci_name":"Sanmenxia","level":2,"description":"City","center":[111.194099,34.777338]},{"code":"411400","name":"商丘","pinyin":"sqs","geoname_id":1783934,"asci_name":"Shangqiu","level":2,"description":"City","center":[115.650497,34.437054]},{"code":"411000","name":"许昌","pinyin":"xcs","geoname_id":1788045,"asci_name":"Xuchang","level":2,"description":"City","center":[113.826063,34.022956]},{"code":"410700","name":"新乡","pinyin":"xxs","geoname_id":1788571,"asci_name":"Xinxiang","level":2,"description":"City","center":[113.883991,35.302616]},{"code":"411500","name":"信阳","pinyin":"xys","geoname_id":1788527,"asci_name":"Xinyang","level":2,"description":"City","center":[114.075031,32.123274]},{"code":"411600","name":"周口","pinyin":"zks","geoname_id":1784130,"asci_name":"Zhoukou","level":2,"description":"City","center":[114.649653,33.620357]},{"code":"411700","name":"驻马店","pinyin":"zmds","geoname_id":1783873,"asci_name":"Zhumadian","level":2,"description":"City","center":[114.024736,32.980169]},{"code":"410100","name":"郑州","pinyin":"zzs","geoname_id":1784658,"asci_name":"Zhengzhou","level":2,"description":"City","center":[113.665412,34.757975]}]},{"code":"43","name":"湖南","pinyin":"hns","geoname_id":1806691,"asci_name":"Hunan","level":1,"description":"Province","center":[112.982279,28.19409],"sub_region":[{"code":"430700","name":"常德","pinyin":"cds","geoname_id":1791121,"asci_name":"Changde","level":2,"description":"City","center":[111.691347,29.040225]},{"code":"430100","name":"长沙","pinyin":"css","geoname_id":1815577,"asci_name":"Changsha","level":2,"description":"City","center":[112.982279,28.19409]},{"code":"431000","name":"郴州","pinyin":"czs","geoname_id":1815056,"asci_name":"Chenzhou","level":2,"description":"City","center":[113.032067,25.793589]},{"code":"431200","name":"怀化","pinyin":"hhs","geoname_id":1807689,"asci_name":"Huaihua","level":2,"description":"City","center":[109.97824,27.550082]},{"code":"430400","name":"衡阳","pinyin":"hys","geoname_id":1808370,"asci_name":"Hengyang","level":2,"description":"City","center":[112.607693,26.900358]},{"code":"431300","name":"娄底","pinyin":"lds","geoname_id":1802238,"asci_name":"Loudi","level":2,"description":"City","center":[112.008497,27.728136]},{"code":"430500","name":"邵阳","pinyin":"sys","geoname_id":1795852,"asci_name":"Shaoyang","level":2,"description":"City","center":[111.46923,27.237842]},{"code":"430300","name":"湘潭","pinyin":"xts","geoname_id":1790484,"asci_name":"Xiangtan","level":2,"description":"City","center":[112.944052,27.82973]},{"code":"433100","name":"湘西","pinyin":"xxtjzmzzzz","geoname_id":1790468,"asci_name":"Xiangxi","level":2,"description":"City","center":[109.739735,28.314296]},{"code":"430900","name":"益阳","pinyin":"yys","geoname_id":1786419,"asci_name":"Yiyang","level":2,"description":"City","center":[112.355042,28.570066]},{"code":"430600","name":"岳阳","pinyin":"yys","geoname_id":1785881,"asci_name":"Yueyang","level":2,"description":"City","center":[113.132855,29.37029]},{"code":"431100","name":"永州","pinyin":"yzs","geoname_id":1786217,"asci_name":"Yongzhou","level":2,"description":"City","center":[111.608019,26.434516]},{"code":"430800","name":"张家界","pinyin":"zjjs","geoname_id":1813171,"asci_name":"Zhangjiajie","level":2,"description":"City","center":[110.479921,29.127401]},{"code":"430200","name":"株洲","pinyin":"zzs","geoname_id":1783763,"asci_name":"Zhuzhou","level":2,"description":"City","center":[113.151737,27.835806]}]},{"code":"22","name":"吉林","pinyin":"jls","geoname_id":2036500,"asci_name":"Jilin","level":1,"description":"Province","center":[125.3245,43.886841],"sub_region":[{"code":"220800","name":"白城","pinyin":"bcs","geoname_id":2038569,"asci_name":"Baicheng","level":2,"description":"City","center":[122.841114,45.619026]},{"code":"220600","name":"白山","pinyin":"bss","geoname_id":2036646,"asci_name":"Baishan","level":2,"description":"City","center":[126.427839,41.942505]},{"code":"220100","name":"长春","pinyin":"ccs","geoname_id":2038180,"asci_name":"Changchun","level":2,"description":"City","center":[125.3245,43.886841]},{"code":"220200","name":"吉林","pinyin":"jls","geoname_id":2036502,"asci_name":"Jilin","level":2,"description":"City","center":[126.55302,43.843577]},{"code":"220400","name":"辽源","pinyin":"lys","geoname_id":2036107,"asci_name":"Liaoyuan","level":2,"description":"City","center":[125.145349,42.902692]},{"code":"220300","name":"四平","pinyin":"sps","geoname_id":2034711,"asci_name":"Siping","level":2,"description":"City","center":[124.370785,43.170344]},{"code":"220700","name":"松原","pinyin":"sys","geoname_id":6587798,"asci_name":"Songyuan","level":2,"description":"City","center":[124.823608,45.118243]},{"code":"220500","name":"通化","pinyin":"ths","geoname_id":2034414,"asci_name":"Tonghua","level":2,"description":"City","center":[125.936501,41.721177]},{"code":"222400","name":"延边","pinyin":"ybcxzzzz","geoname_id":2033525,"asci_name":"Yanbian","level":2,"description":"City","center":[129.513228,42.904823]}]},{"code":"32","name":"江苏","pinyin":"jss","geoname_id":1806260,"asci_name":"Jiangsu","level":1,"description":"Province","center":[118.767413,32.041544],"sub_region":[{"code":"320400","name":"常州","pinyin":"czs","geoname_id":1815456,"asci_name":"Changzhou","level":2,"description":"City","center":[119.946973,31.772752]},{"code":"320800","name":"淮安","pinyin":"has","geoname_id":1807649,"asci_name":"Huai\'an","level":2,"description":"City","center":[119.021265,33.597506]},{"code":"320700","name":"连云港","pinyin":"lygs","geoname_id":1788694,"asci_name":"Xinpu","level":2,"description":"City","center":[119.178821,34.600018]},{"code":"320100","name":"南京","pinyin":"njs","geoname_id":1799962,"asci_name":"Nanjing","level":2,"description":"City","center":[118.767413,32.041544]},{"code":"320600","name":"南通","pinyin":"nts","geoname_id":1799722,"asci_name":"Nantong","level":2,"description":"City","center":[120.864608,32.016212]},{"code":"321300","name":"宿迁","pinyin":"sqs","geoname_id":1793770,"asci_name":"Suqian","level":2,"description":"City","center":[118.275162,33.963008]},{"code":"320500","name":"苏州","pinyin":"szs","geoname_id":1886760,"asci_name":"Suzhou","level":2,"description":"City","center":[120.619585,31.299379]},{"code":"321200","name":"泰州","pinyin":"tzs","geoname_id":1793505,"asci_name":"Taizhou","level":2,"description":"City","center":[119.915176,32.484882]},{"code":"320200","name":"无锡","pinyin":"wxs","geoname_id":1790923,"asci_name":"Wuxi","level":2,"description":"City","center":[120.301663,31.574729]},{"code":"320300","name":"徐州","pinyin":"xzs","geoname_id":1787824,"asci_name":"Xuzhou","level":2,"description":"City","center":[117.184811,34.261792]},{"code":"320900","name":"盐城","pinyin":"ycs","geoname_id":1787746,"asci_name":"Yancheng","level":2,"description":"City","center":[120.139998,33.377631]},{"code":"321000","name":"扬州","pinyin":"yzs","geoname_id":1787227,"asci_name":"Yangzhou","level":2,"description":"City","center":[119.421003,32.393159]},{"code":"321100","name":"镇江","pinyin":"zjs","geoname_id":1784642,"asci_name":"Zhenjiang","level":2,"description":"City","center":[119.452753,32.204402]}]},{"code":"36","name":"江西","pinyin":"jxs","geoname_id":1806222,"asci_name":"Jiangxi","level":1,"description":"Province","center":[115.892151,28.676493],"sub_region":[{"code":"361000","name":"抚州","pinyin":"fzs","geoname_id":7739108,"asci_name":"Xidajie","level":2,"description":"City","center":[116.358351,27.98385]},{"code":"360700","name":"赣州","pinyin":"gzs","geoname_id":1810638,"asci_name":"Ganzhou","level":2,"description":"City","center":[114.940278,25.85097]},{"code":"360800","name":"吉安","pinyin":"jas","geoname_id":1806445,"asci_name":"Ji\'an","level":2,"description":"City","center":[114.986373,27.111699]},{"code":"360200","name":"景德镇","pinyin":"jdzs","geoname_id":1805680,"asci_name":"Jingdezhen","level":2,"description":"City","center":[117.214664,29.29256]},{"code":"360400","name":"九江","pinyin":"jjs","geoname_id":1805179,"asci_name":"Jiujiang","level":2,"description":"City","center":[115.992811,29.712034]},{"code":"360100","name":"南昌","pinyin":"ncs","geoname_id":1800163,"asci_name":"Nanchang","level":2,"description":"City","center":[115.892151,28.676493]},{"code":"360300","name":"萍乡","pinyin":"pxs","geoname_id":1798654,"asci_name":"Pingxiang","level":2,"description":"City","center":[113.852186,27.622946]},{"code":"361100","name":"上饶","pinyin":"srs","geoname_id":1787858,"asci_name":"Shangrao","level":2,"description":"City","center":[117.971185,28.44442]},{"code":"360500","name":"新余","pinyin":"xys","geoname_id":1788508,"asci_name":"Xinyu","level":2,"description":"City","center":[114.930835,27.810834]},{"code":"360900","name":"宜春","pinyin":"ycs","geoname_id":1786746,"asci_name":"Yichun","level":2,"description":"City","center":[114.391136,27.8043]},{"code":"360600","name":"鹰潭","pinyin":"yts","geoname_id":1786577,"asci_name":"Yingtan","level":2,"description":"City","center":[117.033838,28.238638]}]},{"code":"21","name":"辽宁","pinyin":"lns","geoname_id":2036115,"asci_name":"Liaoning","level":1,"description":"Province","center":[123.429096,41.796767],"sub_region":[{"code":"210300","name":"鞍山","pinyin":"ass","geoname_id":2038632,"asci_name":"Anshan","level":2,"description":"City","center":[122.995632,41.110626]},{"code":"210500","name":"本溪","pinyin":"bxs","geoname_id":2038300,"asci_name":"Benxi","level":2,"description":"City","center":[123.770519,41.297909]},{"code":"211300","name":"朝阳","pinyin":"cys","geoname_id":2038101,"asci_name":"Chaoyang","level":2,"description":"City","center":[120.451176,41.576758]},{"code":"210600","name":"丹东","pinyin":"dds","geoname_id":2037886,"asci_name":"Dandong","level":2,"description":"City","center":[124.383044,40.124296]},{"code":"210200","name":"大连","pinyin":"dls","geoname_id":1814087,"asci_name":"Dalian","level":2,"description":"City","center":[121.618622,38.91459]},{"code":"210400","name":"抚顺","pinyin":"fss","geoname_id":2037355,"asci_name":"Fushun","level":2,"description":"City","center":[123.921109,41.875956]},{"code":"210900","name":"阜新","pinyin":"fxs","geoname_id":2037346,"asci_name":"Fuxin","level":2,"description":"City","center":[121.648962,42.011796]},{"code":"211400","name":"葫芦岛","pinyin":"hlds","geoname_id":2036430,"asci_name":"Huludao","level":2,"description":"City","center":[120.856394,40.755572]},{"code":"210700","name":"锦州","pinyin":"jzs","geoname_id":2036427,"asci_name":"Jinzhou","level":2,"description":"City","center":[121.135742,41.119269]},{"code":"211000","name":"辽阳","pinyin":"lys","geoname_id":2036113,"asci_name":"Liaoyang","level":2,"description":"City","center":[123.18152,41.269402]},{"code":"211100","name":"盘锦","pinyin":"pjs","geoname_id":2035516,"asci_name":"Panjin","level":2,"description":"City","center":[122.06957,41.124484]},{"code":"210100","name":"沈阳","pinyin":"sys","geoname_id":2034937,"asci_name":"Shenyang","level":2,"description":"City","center":[123.429096,41.796767]},{"code":"211200","name":"铁岭","pinyin":"tls","geoname_id":2034437,"asci_name":"Tieling","level":2,"description":"City","center":[123.844279,42.290585]},{"code":"210800","name":"营口","pinyin":"yks","geoname_id":2033369,"asci_name":"Yingkou","level":2,"description":"City","center":[122.235151,40.667432]}]},{"code":"15","name":"内蒙古","pinyin":"nmgzzq","geoname_id":2035607,"asci_name":"Inner Mongolia","level":1,"description":"Province","center":[111.670801,40.818311],"sub_region":[{"code":"152900","name":"阿拉善","pinyin":"alsm","geoname_id":1818128,"asci_name":"Alxa","level":2,"description":"City","center":[105.706422,38.844814]},{"code":"150200","name":"包头","pinyin":"bts","geoname_id":2038432,"asci_name":"Baotou","level":2,"description":"City","center":[109.840405,40.658168]},{"code":"150800","name":"巴彦淖尔","pinyin":"bynes","geoname_id":2038392,"asci_name":"Bayannur","level":2,"description":"City","center":[107.416959,40.757402]},{"code":"150400","name":"赤峰","pinyin":"cfs","geoname_id":2038067,"asci_name":"Chifeng","level":2,"description":"City","center":[118.956806,42.275317]},{"code":"150600","name":"鄂尔多斯","pinyin":"eedss","geoname_id":8347664,"asci_name":"Ordos","level":2,"description":"City","center":[109.99029,39.817179]},{"code":"150100","name":"呼和浩特","pinyin":"hhhts","geoname_id":2036892,"asci_name":"Hohhot","level":2,"description":"City","center":[111.670801,40.818311]},{"code":"150700","name":"呼伦贝尔","pinyin":"hlbes","geoname_id":2036660,"asci_name":"Hulunbuir","level":2,"description":"City","center":[119.758168,49.215333]},{"code":"150500","name":"通辽","pinyin":"tls","geoname_id":2034400,"asci_name":"Tongliao","level":2,"description":"City","center":[122.263119,43.617429]},{"code":"150300","name":"乌海","pinyin":"whs","geoname_id":1791249,"asci_name":"Wuhai","level":2,"description":"City","center":[106.825563,39.673734]},{"code":"150900","name":"乌兰察布","pinyin":"wlcbs","geoname_id":2034303,"asci_name":"Ulanqab","level":2,"description":"City","center":[113.114543,41.034126]},{"code":"152200","name":"兴安","pinyin":"xam","geoname_id":2036898,"asci_name":"Hinggan","level":2,"description":"City","center":[122.070317,46.076268]},{"code":"152500","name":"锡林郭勒","pinyin":"xlglm","geoname_id":2033827,"asci_name":"Xilingol","level":2,"description":"City","center":[116.090996,43.944018]}]},{"code":"64","name":"宁夏","pinyin":"nxhzzzq","geoname_id":1799355,"asci_name":"Ningxia","level":1,"description":"Province","center":[106.278179,38.46637],"sub_region":[{"code":"640400","name":"固原","pinyin":"gys","geoname_id":1809151,"asci_name":"Guyuan","level":2,"description":"City","center":[106.285241,36.004561]},{"code":"640200","name":"石嘴山","pinyin":"szss","geoname_id":1794805,"asci_name":"Shizuishan","level":2,"description":"City","center":[106.376173,39.01333]},{"code":"640300","name":"吴忠","pinyin":"wzs","geoname_id":1786512,"asci_name":"Wuzhong","level":2,"description":"City","center":[106.199409,37.986165]},{"code":"640100","name":"银川","pinyin":"ycs","geoname_id":1786657,"asci_name":"Yinchuan","level":2,"description":"City","center":[106.278179,38.46637]},{"code":"640500","name":"中卫","pinyin":"zws","geoname_id":6643239,"asci_name":"Zhongwei","level":2,"description":"City","center":[105.189568,37.514951]}]},{"code":"63","name":"青海","pinyin":"qhs","geoname_id":1280239,"asci_name":"Qinghai","level":1,"description":"Province","center":[101.778916,36.623178],"sub_region":[{"code":"632600","name":"果洛","pinyin":"glzzzzz","geoname_id":1281178,"asci_name":"Golog","level":2,"description":"City","center":[100.242143,34.4736]},{"code":"632200","name":"海北","pinyin":"hbzzzzz","geoname_id":1809111,"asci_name":"Haibei","level":2,"description":"City","center":[100.901059,36.959435]},{"code":"630200","name":"海东","pinyin":"hds","geoname_id":1809101,"asci_name":"Haidong","level":2,"description":"City","center":[102.10327,36.502916]},{"code":"632500","name":"海南州","pinyin":"hnz","geoname_id":1809051,"asci_name":"Hainan","level":2,"description":"City","center":[100.619542,36.280353]},{"code":"632300","name":"黄南","pinyin":"hnzzzzz","geoname_id":1807329,"asci_name":"Huangnan","level":2,"description":"City","center":[102.019988,35.517744]},{"code":"632800","name":"海西","pinyin":"hxmgzzzzzz","geoname_id":1281075,"asci_name":"Haixi","level":2,"description":"City","center":[97.370785,37.374663]},{"code":"630100","name":"西宁","pinyin":"xns","geoname_id":1788852,"asci_name":"Xining","level":2,"description":"City","center":[101.778916,36.623178]},{"code":"632700","name":"玉树","pinyin":"yszzzzz","geoname_id":1279540,"asci_name":"Yushu","level":2,"description":"City","center":[97.008522,33.004049]}]},{"code":"51","name":"四川","pinyin":"scs","geoname_id":1794299,"asci_name":"Sichuan","level":1,"description":"Province","center":[104.065735,30.659462],"sub_region":[{"code":"513200","name":"阿坝","pinyin":"abzzqzzzz","geoname_id":1818175,"asci_name":"Ngawa","level":2,"description":"City","center":[102.221374,31.899792]},{"code":"511900","name":"巴中","pinyin":"bzs","geoname_id":6643375,"asci_name":"Bazhong","level":2,"description":"City","center":[106.753669,31.858809]},{"code":"510100","name":"成都","pinyin":"cds","geoname_id":1815286,"asci_name":"Chengdu","level":2,"description":"City","center":[104.065735,30.659462]},{"code":"510600","name":"德阳","pinyin":"dys","geoname_id":1812961,"asci_name":"Deyang","level":2,"description":"City","center":[104.398651,31.127991]},{"code":"511700","name":"达州","pinyin":"dzs","geoname_id":1813325,"asci_name":"Dazhou","level":2,"description":"City","center":[107.502262,31.209484]},{"code":"511600","name":"广安","pinyin":"gas","geoname_id":6643373,"asci_name":"Guang\'an","level":2,"description":"City","center":[106.633369,30.456398]},{"code":"510800","name":"广元","pinyin":"gys","geoname_id":1806466,"asci_name":"Guangyuan","level":2,"description":"City","center":[105.829757,32.433668]},{"code":"513300","name":"甘孜","pinyin":"gzzzzzz","geoname_id":1810269,"asci_name":"Garzê","level":2,"description":"City","center":[101.963815,30.050663]},{"code":"511100","name":"乐山","pinyin":"lss","geoname_id":1804153,"asci_name":"Leshan","level":2,"description":"City","center":[103.761263,29.582024]},{"code":"513400","name":"凉山","pinyin":"lsyzzzz","geoname_id":1803984,"asci_name":"Liangshan","level":2,"description":"City","center":[102.258746,27.886762]},{"code":"510500","name":"泸州","pinyin":"lzs","geoname_id":1801637,"asci_name":"Luzhou","level":2,"description":"City","center":[105.443348,28.889138]},{"code":"511400","name":"眉山","pinyin":"mss","geoname_id":1800818,"asci_name":"Meishan","level":2,"description":"City","center":[103.831788,30.048318]},{"code":"510700","name":"绵阳","pinyin":"mys","geoname_id":1800627,"asci_name":"Mianyang","level":2,"description":"City","center":[104.741722,31.46402]},{"code":"511300","name":"南充","pinyin":"ncs","geoname_id":1800146,"asci_name":"Nanchong","level":2,"description":"City","center":[106.082974,30.795281]},{"code":"511000","name":"内江","pinyin":"njs","geoname_id":1799491,"asci_name":"Neijiang","level":2,"description":"City","center":[105.066138,29.58708]},{"code":"510400","name":"攀枝花","pinyin":"pzhs","geoname_id":1798997,"asci_name":"Panzhihua","level":2,"description":"City","center":[101.716007,26.580446]},{"code":"510900","name":"遂宁","pinyin":"sns","geoname_id":6643374,"asci_name":"Suining","level":2,"description":"City","center":[105.571331,30.513311]},{"code":"511800","name":"雅安","pinyin":"yas","geoname_id":1787815,"asci_name":"Ya\'an","level":2,"description":"City","center":[103.001033,29.987722]},{"code":"511500","name":"宜宾","pinyin":"ybs","geoname_id":1786770,"asci_name":"Yibin","level":2,"description":"City","center":[104.630825,28.760189]},{"code":"510300","name":"自贡","pinyin":"zgs","geoname_id":1783745,"asci_name":"Zigong","level":2,"description":"City","center":[104.773447,29.352765]},{"code":"512000","name":"资阳","pinyin":"zys","geoname_id":8594180,"asci_name":"Ziyang","level":2,"description":"City","center":[104.641917,30.122211]}]},{"code":"37","name":"山东","pinyin":"sds","geoname_id":1796328,"asci_name":"Shandong","level":1,"description":"Province","center":[117.000923,36.675807],"sub_region":[{"code":"371600","name":"滨州","pinyin":"bzs","geoname_id":1816336,"asci_name":"Binzhou","level":2,"description":"City","center":[118.016974,37.383542]},{"code":"370500","name":"东营","pinyin":"dys","geoname_id":1812101,"asci_name":"Shengli","level":2,"description":"City","center":[118.66471,37.434564]},{"code":"371400","name":"德州","pinyin":"dzs","geoname_id":1812955,"asci_name":"Dezhou","level":2,"description":"City","center":[116.307428,37.453968]},{"code":"371700","name":"菏泽","pinyin":"hzs","geoname_id":1808198,"asci_name":"Heze","level":2,"description":"City","center":[115.469381,35.246531]},{"code":"370100","name":"济南","pinyin":"jns","geoname_id":1805753,"asci_name":"Jinan","level":2,"description":"City","center":[117.000923,36.675807]},{"code":"370800","name":"济宁","pinyin":"jns","geoname_id":1805518,"asci_name":"Jining","level":2,"description":"City","center":[116.587245,35.415393]},{"code":"371500","name":"聊城","pinyin":"lcs","geoname_id":1803834,"asci_name":"Liaocheng","level":2,"description":"City","center":[115.980367,36.456013]},{"code":"371300","name":"临沂","pinyin":"lys","geoname_id":1803316,"asci_name":"Linyi","level":2,"description":"City","center":[118.326443,35.065282]},{"code":"370200","name":"青岛","pinyin":"qds","geoname_id":1797929,"asci_name":"Qingdao","level":2,"description":"City","center":[120.355173,36.082982]},{"code":"371100","name":"日照","pinyin":"rzs","geoname_id":1797132,"asci_name":"Rizhao","level":2,"description":"City","center":[119.461208,35.428588]},{"code":"370900","name":"泰安","pinyin":"tas","geoname_id":1793722,"asci_name":"Tai\'an","level":2,"description":"City","center":[117.129063,36.194968]},{"code":"370700","name":"潍坊","pinyin":"wfs","geoname_id":1791681,"asci_name":"Weifang","level":2,"description":"City","center":[119.107078,36.70925]},{"code":"371000","name":"威海","pinyin":"whs","geoname_id":1791673,"asci_name":"Weihai","level":2,"description":"City","center":[122.116394,37.509691]},{"code":"370600","name":"烟台","pinyin":"yts","geoname_id":1787093,"asci_name":"Yantai","level":2,"description":"City","center":[121.391382,37.539297]},{"code":"370300","name":"淄博","pinyin":"zbs","geoname_id":1785286,"asci_name":"Zibo","level":2,"description":"City","center":[118.047648,36.814939]},{"code":"370400","name":"枣庄","pinyin":"zzs","geoname_id":1785453,"asci_name":"Zaozhuang","level":2,"description":"City","center":[117.557964,34.856424]}]},{"code":"31","name":"上海","pinyin":"shs","geoname_id":1796231,"asci_name":"Shanghai","level":1,"description":"Province","center":[121.472644,31.231706],"sub_region":[]},{"code":"61","name":"陕西","pinyin":"sxs","geoname_id":1796480,"asci_name":"Shaanxi","level":1,"description":"Province","center":[108.948024,34.263161],"sub_region":[{"code":"610900","name":"安康","pinyin":"aks","geoname_id":1789065,"asci_name":"Ankang","level":2,"description":"City","center":[109.029273,32.6903]},{"code":"610300","name":"宝鸡","pinyin":"bjs","geoname_id":11417275,"asci_name":"Baojishi","level":2,"description":"City","center":[107.14487,34.369315]},{"code":"610700","name":"汉中","pinyin":"hzs","geoname_id":1808857,"asci_name":"Hanzhong","level":2,"description":"City","center":[107.028621,33.077668]},{"code":"611000","name":"商洛","pinyin":"sls","geoname_id":1796165,"asci_name":"Shangluo","level":2,"description":"City","center":[109.939776,33.868319]},{"code":"610200","name":"铜川","pinyin":"tcs","geoname_id":7064006,"asci_name":"Tongchuan","level":2,"description":"City","center":[108.979608,34.916582]},{"code":"610500","name":"渭南","pinyin":"wns","geoname_id":1791636,"asci_name":"Weinan","level":2,"description":"City","center":[109.502882,34.499381]},{"code":"610100","name":"西安","pinyin":"xas","geoname_id":1790630,"asci_name":"Xi\'an","level":2,"description":"City","center":[108.948024,34.263161]},{"code":"610400","name":"咸阳","pinyin":"xys","geoname_id":1790353,"asci_name":"Xianyang","level":2,"description":"City","center":[108.705117,34.333439]},{"code":"610600","name":"延安","pinyin":"yas","geoname_id":1787763,"asci_name":"Yan\'an","level":2,"description":"City","center":[109.49081,36.596537]},{"code":"610800","name":"榆林","pinyin":"yls","geoname_id":1785769,"asci_name":"Yulin","level":2,"description":"City","center":[109.741193,38.290162]}]},{"code":"14","name":"山西","pinyin":"sxs","geoname_id":1795912,"asci_name":"Shanxi","level":1,"description":"Province","center":[112.549248,37.857014],"sub_region":[{"code":"140400","name":"长治","pinyin":"czs","geoname_id":1808956,"asci_name":"Changzhi","level":2,"description":"City","center":[113.113556,36.191112]},{"code":"140200","name":"大同","pinyin":"dts","geoname_id":2037799,"asci_name":"Datong","level":2,"description":"City","center":[113.295259,40.09031]},{"code":"140500","name":"晋城","pinyin":"jcs","geoname_id":1805739,"asci_name":"Jincheng","level":2,"description":"City","center":[112.851274,35.497553]},{"code":"140700","name":"晋中","pinyin":"jzs","geoname_id":1805302,"asci_name":"Jinzhong","level":2,"description":"City","center":[112.736465,37.696495]},{"code":"141000","name":"临汾","pinyin":"lfs","geoname_id":1803567,"asci_name":"Linfen","level":2,"description":"City","center":[111.517973,36.08415]},{"code":"141100","name":"吕梁","pinyin":"lls","geoname_id":1802029,"asci_name":"Lueliang","level":2,"description":"City","center":[111.134335,37.524366]},{"code":"140600","name":"朔州","pinyin":"szs","geoname_id":6642609,"asci_name":"Shuozhou","level":2,"description":"City","center":[112.433387,39.331261]},{"code":"140100","name":"太原","pinyin":"tys","geoname_id":1793511,"asci_name":"Taiyuan","level":2,"description":"City","center":[112.549248,37.857014]},{"code":"140900","name":"忻州","pinyin":"xzs","geoname_id":1788450,"asci_name":"Xinzhou","level":2,"description":"City","center":[112.733538,38.41769]},{"code":"140800","name":"运城","pinyin":"ycs","geoname_id":1785738,"asci_name":"Yuncheng","level":2,"description":"City","center":[111.003957,35.022778]},{"code":"140300","name":"阳泉","pinyin":"yqs","geoname_id":1787346,"asci_name":"Yangquan","level":2,"description":"City","center":[113.583285,37.861188]}]},{"code":"12","name":"天津","pinyin":"tjs","geoname_id":1792943,"asci_name":"Tianjin","level":1,"description":"Province","center":[117.190182,39.125596],"sub_region":[]},{"code":"71","name":"台湾","pinyin":"tws","geoname_id":7280291,"asci_name":"Taiwan Province","level":1,"description":"Province","center":[121.509738,25.040459]},{"code":"81","name":"香港","pinyin":"xgtbxzq","geoname_id":1819729,"asci_name":"Hong Kong","level":1,"description":"Region","center":[114.17051,22.276423]},{"code":"65","name":"新疆","pinyin":"xjwwezzq","geoname_id":1529047,"asci_name":"Xinjiang","level":1,"description":"Province","center":[87.617733,43.792818],"sub_region":[{"code":"652900","name":"阿克苏","pinyin":"aksdq","geoname_id":1529658,"asci_name":"Aksu","level":2,"description":"City","center":[80.265068,41.170712]},{"code":"659002","name":"阿拉尔","pinyin":"ales","geoname_id":8080717,"asci_name":"Alaer","level":2,"description":"City","center":[81.285884,40.541914]},{"code":"654300","name":"阿勒泰","pinyin":"altdq","geoname_id":1529650,"asci_name":"Altay","level":2,"description":"City","center":[88.13963,47.848393]},{"code":"652700","name":"博尔塔拉","pinyin":"betlmgzzz","geoname_id":1529581,"asci_name":"Bortala","level":2,"description":"City","center":[82.074778,44.903258]},{"code":"659005","name":"北屯","pinyin":"bts","geoname_id":1529594,"asci_name":"Beitun","level":2,"description":"City","center":[87.824932,47.353177]},{"code":"652800","name":"巴音郭楞","pinyin":"byglmgzzz","geoname_id":1529604,"asci_name":"Bayingolin","level":2,"description":"City","center":[86.150969,41.768552]},{"code":"652300","name":"昌吉","pinyin":"cjhzzzz","geoname_id":1529568,"asci_name":"Changji","level":2,"description":"City","center":[87.304012,44.014577]},{"code":"650500","name":"哈密","pinyin":"hms","geoname_id":1529484,"asci_name":"Hami","level":2,"description":"City","center":[93.51316,42.833248]},{"code":"653200","name":"和田","pinyin":"htdq","geoname_id":1281018,"asci_name":"Hotan","level":2,"description":"City","center":[79.92533,37.110687]},{"code":"659010","name":"胡杨河","pinyin":"hyhs","geoname_id":659010,"asci_name":"Huyanghe","level":2,"description":"City","center":[84.8275959,44.69288853]},{"code":"659008","name":"可克达拉","pinyin":"kkdls","geoname_id":659008,"asci_name":"Cocodala","level":2,"description":"City","center":[80.63579,43.6832]},{"code":"650200","name":"克拉玛依","pinyin":"klmys","geoname_id":1529401,"asci_name":"Karamay","level":2,"description":"City","center":[84.873946,45.595886]},{"code":"653100","name":"喀什","pinyin":"ksdq","geoname_id":1280848,"asci_name":"Kashgar","level":2,"description":"City","center":[75.989138,39.467664]},{"code":"659009","name":"昆玉","pinyin":"kys","geoname_id":659009,"asci_name":"Kunyu","level":2,"description":"City","center":[79.287372,37.207994]},{"code":"653000","name":"克孜勒苏","pinyin":"kzlskekzzzz","geoname_id":1280828,"asci_name":"Kizilsu Kyrgyz","level":2,"description":"City","center":[76.172825,39.713431]},{"code":"659007","name":"双河","pinyin":"shs","geoname_id":659007,"asci_name":"Shuanghe","level":2,"description":"City","center":[82.353656,44.840524]},{"code":"659001","name":"石河子","pinyin":"shzs","geoname_id":1529195,"asci_name":"Shihezi","level":2,"description":"City","center":[86.041075,44.305886]},{"code":"654200","name":"塔城","pinyin":"tcdq","geoname_id":1529166,"asci_name":"Tacheng","level":2,"description":"City","center":[82.985732,46.746301]},{"code":"650400","name":"吐鲁番","pinyin":"tlfs","geoname_id":1529111,"asci_name":"Turpan","level":2,"description":"City","center":[89.184078,42.947613]},{"code":"659006","name":"铁门关","pinyin":"tmgs","geoname_id":659006,"asci_name":"Tiemenguan","level":2,"description":"City","center":[85.501218,41.827251]},{"code":"659003","name":"图木舒克","pinyin":"tmsks","geoname_id":8080762,"asci_name":"Tumxuk","level":2,"description":"City","center":[79.077978,39.867316]},{"code":"659004","name":"五家渠","pinyin":"wjqs","geoname_id":8079473,"asci_name":"Wujiaqu","level":2,"description":"City","center":[87.526884,44.167401]},{"code":"650100","name":"乌鲁木齐","pinyin":"wlmqs","geoname_id":1529102,"asci_name":"Urumqi","level":2,"description":"City","center":[87.617733,43.792818]},{"code":"654000","name":"伊犁","pinyin":"ylhskzzz","geoname_id":1529434,"asci_name":"Ili","level":2,"description":"City","center":[81.317946,43.92186]}]},{"code":"54","name":"西藏","pinyin":"xzzzq","geoname_id":1279685,"asci_name":"Tibet","level":1,"description":"Province","center":[91.132212,29.660361],"sub_region":[{"code":"542500","name":"阿里","pinyin":"aldq","geoname_id":1280456,"asci_name":"Ngari","level":2,"description":"City","center":[80.105498,32.503187]},{"code":"540300","name":"昌都","pinyin":"cds","geoname_id":1280280,"asci_name":"Qamdo","level":2,"description":"City","center":[97.178452,31.136875]},{"code":"540100","name":"拉萨","pinyin":"lss","geoname_id":1280737,"asci_name":"Lhasa","level":2,"description":"City","center":[91.132212,29.660361]},{"code":"540400","name":"林芝","pinyin":"lzs","geoname_id":1280390,"asci_name":"Nyingchi","level":2,"description":"City","center":[94.362348,29.654693]},{"code":"542400","name":"那曲","pinyin":"nqs","geoname_id":1280515,"asci_name":"Nagqu","level":2,"description":"City","center":[92.060214,31.476004]},{"code":"540200","name":"日喀则","pinyin":"rkzs","geoname_id":1279713,"asci_name":"Shigatse","level":2,"description":"City","center":[88.885148,29.267519]},{"code":"540500","name":"山南","pinyin":"sns","geoname_id":1280019,"asci_name":"Shannan","level":2,"description":"City","center":[91.766529,29.236023]}]},{"code":"53","name":"云南","pinyin":"yns","geoname_id":1785694,"asci_name":"Yunnan","level":1,"description":"Province","center":[102.712251,25.040609],"sub_region":[{"code":"530500","name":"保山","pinyin":"bss","geoname_id":1281672,"asci_name":"Baoshan","level":2,"description":"City","center":[99.167133,25.111802]},{"code":"532300","name":"楚雄","pinyin":"cxyzzzz","geoname_id":1814758,"asci_name":"Chuxiong","level":2,"description":"City","center":[101.546046,25.041988]},{"code":"533100","name":"德宏","pinyin":"dhdzjpzzzz","geoname_id":1281381,"asci_name":"Dehong","level":2,"description":"City","center":[98.578363,24.436694]},{"code":"532900","name":"大理","pinyin":"dlbzzzz","geoname_id":1814065,"asci_name":"Dali","level":2,"description":"City","center":[100.225668,25.589449]},{"code":"533400","name":"迪庆","pinyin":"dqzzzzz","geoname_id":1281365,"asci_name":"Diqing","level":2,"description":"City","center":[99.706463,27.826853]},{"code":"532500","name":"红河","pinyin":"hhhnzyzzzz","geoname_id":1808130,"asci_name":"Honghe","level":2,"description":"City","center":[103.384182,23.366775]},{"code":"530100","name":"昆明","pinyin":"kms","geoname_id":1804651,"asci_name":"Kunming","level":2,"description":"City","center":[102.712251,25.040609]},{"code":"530900","name":"临沧","pinyin":"lcs","geoname_id":1803589,"asci_name":"Lincang","level":2,"description":"City","center":[100.08697,23.886567]},{"code":"530700","name":"丽江","pinyin":"ljs","geoname_id":1803666,"asci_name":"Lijiang","level":2,"description":"City","center":[100.233026,26.872108]},{"code":"533300","name":"怒江","pinyin":"njlszzzz","geoname_id":1280418,"asci_name":"Nujiang","level":2,"description":"City","center":[98.854304,25.850949]},{"code":"530800","name":"普洱","pinyin":"pes","geoname_id":1794208,"asci_name":"Pu\'er","level":2,"description":"City","center":[100.972344,22.777321]},{"code":"530300","name":"曲靖","pinyin":"qjs","geoname_id":1797318,"asci_name":"Qujing","level":2,"description":"City","center":[103.797851,25.501557]},{"code":"532600","name":"文山","pinyin":"wszzmzzzz","geoname_id":1791424,"asci_name":"Wenshan","level":2,"description":"City","center":[104.24401,23.36951]},{"code":"532800","name":"西双版纳","pinyin":"xsbndzzzz","geoname_id":1788323,"asci_name":"Xishuangbanna","level":2,"description":"City","center":[100.797941,22.001724]},{"code":"530400","name":"玉溪","pinyin":"yxs","geoname_id":1784185,"asci_name":"Yuxi","level":2,"description":"City","center":[102.543907,24.350461]},{"code":"530600","name":"昭通","pinyin":"zts","geoname_id":1784841,"asci_name":"Zhaotong","level":2,"description":"City","center":[103.717216,27.336999]}]},{"code":"33","name":"浙江","pinyin":"zjs","geoname_id":1784764,"asci_name":"Zhejiang","level":1,"description":"Province","center":[120.153576,30.287459],"sub_region":[{"code":"330100","name":"杭州","pinyin":"hzs","geoname_id":1808926,"asci_name":"Hangzhou","level":2,"description":"City","center":[120.153576,30.287459]},{"code":"330500","name":"湖州","pinyin":"hzs","geoname_id":1806535,"asci_name":"Huzhou","level":2,"description":"City","center":[120.102398,30.867198]},{"code":"330700","name":"金华","pinyin":"jhs","geoname_id":1805528,"asci_name":"Jinhua","level":2,"description":"City","center":[119.649506,29.089524]},{"code":"330400","name":"嘉兴","pinyin":"jxs","geoname_id":1805953,"asci_name":"Jiaxing","level":2,"description":"City","center":[120.750865,30.762653]},{"code":"331100","name":"丽水","pinyin":"lss","geoname_id":1803245,"asci_name":"Lishui","level":2,"description":"City","center":[119.921786,28.451993]},{"code":"330200","name":"宁波","pinyin":"nbs","geoname_id":1799397,"asci_name":"Ningbo","level":2,"description":"City","center":[121.549792,29.868388]},{"code":"330800","name":"衢州","pinyin":"qzs","geoname_id":1797264,"asci_name":"Quzhou","level":2,"description":"City","center":[118.87263,28.941708]},{"code":"330600","name":"绍兴","pinyin":"sxs","geoname_id":1795855,"asci_name":"Shaoxing","level":2,"description":"City","center":[120.582112,29.997117]},{"code":"331000","name":"台州","pinyin":"tzs","geoname_id":1793504,"asci_name":"Taizhou","level":2,"description":"City","center":[121.428599,28.661378]},{"code":"330300","name":"温州","pinyin":"wzs","geoname_id":1791388,"asci_name":"Wenzhou","level":2,"description":"City","center":[120.672111,28.000575]},{"code":"330900","name":"舟山","pinyin":"zss","geoname_id":1784107,"asci_name":"Zhoushan","level":2,"description":"City","center":[122.106863,30.016028]}]}]},{"code":"AD","name":"安道尔","geoname_id":3041565,"asci_name":"The Principality of Andorra","level":0,"description":"state","center":[1.5897,42.5419]},{"code":"AE","name":"阿联酋","geoname_id":290557,"asci_name":"United Arab Emirates","level":0,"description":"Country","center":[55.1509,24.3653]},{"code":"AF","name":"阿富汗","geoname_id":1149361,"asci_name":"The Islamic Republic of Afghanistan","level":0,"description":"state","center":[65.7792,34.0569]},{"code":"AG","name":"安提瓜和巴布达","geoname_id":3576396,"asci_name":"Antigua and Barbuda","level":0,"description":"state","center":[-61.7945,17.0856]},{"code":"AI","name":"安圭拉","geoname_id":3573511,"asci_name":"Anguilla","level":0,"description":"state","center":[-63.0406,18.2177]},{"code":"AL","name":"阿尔巴尼亚","geoname_id":783754,"asci_name":"The Republic of Albania","level":0,"description":"state","center":[20.0221,41.1701]},{"code":"AM","name":"亚美尼亚","geoname_id":174982,"asci_name":"Republic of Armenia","level":0,"description":"state","center":[44.8409,40.0811]},{"code":"AO","name":"安哥拉","geoname_id":3351879,"asci_name":"The Republic of Angola","level":0,"description":"state","center":[18.8562,-12.005]},{"code":"AQ","name":"南极洲","geoname_id":6697173,"asci_name":"Antarctica","level":0,"description":"state","center":[63.6432,-78.4168]},{"code":"AR","name":"阿根廷","geoname_id":3865483,"asci_name":"The Republic of Argentina","level":0,"description":"Country","center":[-64.9932,-38.6979]},{"code":"AS","name":"美属萨摩亚","geoname_id":5880801,"asci_name":"American Samoa","level":0,"description":"state","center":[-170.7595,-14.3063]},{"code":"AT","name":"奥地利","geoname_id":2782113,"asci_name":"The Republic of Austria","level":0,"description":"Country","center":[14.7915,47.713]},{"code":"AU","name":"澳大利亚","geoname_id":2077456,"asci_name":"The Commonwealth of Australia","level":0,"description":"Country","center":[133.5282,-25.7567]},{"code":"AW","name":"阿鲁巴","geoname_id":3577279,"asci_name":"Aruba","level":0,"description":"state","center":[-69.9818,12.5176]},{"code":"AX","name":"奥兰","geoname_id":661882,"asci_name":"Aland Island","level":0,"description":"state","center":[19.84660975280702,60.1985]},{"code":"AZ","name":"阿塞拜疆","geoname_id":587116,"asci_name":"The Republic of Azerbaijan","level":0,"description":"state","center":[47.7228,40.176]},{"code":"BA","name":"波斯尼亚和黑塞哥维那","geoname_id":3277605,"asci_name":"Bosnia and Herzegovina","level":0,"description":"state","center":[17.9371,43.9344]},{"code":"BB","name":"巴巴多斯","geoname_id":3374084,"asci_name":"Barbados","level":0,"description":"state","center":[-59.559,13.1898]},{"code":"BD","name":"孟加拉国","geoname_id":1210997,"asci_name":"The People\'s Republic of Bangladesh","level":0,"description":"Country","center":[89.8601,23.7235]},{"code":"BE","name":"比利时","geoname_id":2802361,"asci_name":"The Kingdom of Belgium","level":0,"description":"Country","center":[4.8641,50.5117]},{"code":"BF","name":"布基纳法索","geoname_id":2361809,"asci_name":"The Burkina Faso","level":0,"description":"state","center":[-1.1849,12.2601]},{"code":"BG","name":"保加利亚","geoname_id":732800,"asci_name":"The Republic of Bulgaria","level":0,"description":"state","center":[25.195,42.7429]},{"code":"BH","name":"巴林","geoname_id":290291,"asci_name":"The Kingdom of Bahrain","level":0,"description":"Country","center":[50.5534,26.025]},{"code":"BI","name":"布隆迪","geoname_id":433561,"asci_name":"The Republic of Burundi","level":0,"description":"state","center":[29.9472,-3.3908]},{"code":"BJ","name":"贝宁","geoname_id":2395170,"asci_name":"The Republic of Benin","level":0,"description":"state","center":[2.283,9.3333]},{"code":"BL","name":"圣巴泰勒米","geoname_id":3578476,"asci_name":"Saint Barthélemy","level":0,"description":"state","center":[-62.8117,17.9036]},{"code":"BM","name":"百慕大","geoname_id":3573345,"asci_name":"Bermuda","level":0,"description":"state","center":[-64.7737,32.3019]},{"code":"BN","name":"文莱","geoname_id":1820814,"asci_name":"Negara Brunei Darussalam","level":0,"description":"state","center":[114.5238,4.5256]},{"code":"BO","name":"玻利维亚","geoname_id":3923057,"asci_name":"Plurinational State of Bolivia","level":0,"description":"state","center":[-63.6244,-16.3961]},{"code":"BQ","name":"荷兰加勒比区","geoname_id":7626844,"asci_name":"Caribbean Netherlands","level":0,"description":"state","center":[-68.2465,12.1671]},{"code":"BR","name":"巴西","geoname_id":3469034,"asci_name":"The Federative Republic of Brazil","level":0,"description":"Country","center":[-49.7742,-15.1216]},{"code":"BS","name":"巴哈马","geoname_id":3572887,"asci_name":"The Commonwealth of The Bahamas","level":0,"description":"state","center":[-78.0455,24.7032]},{"code":"BT","name":"不丹","geoname_id":1252634,"asci_name":"The Kingdom of Bhutan","level":0,"description":"state","center":[90.3415,27.473]},{"code":"BV","name":"布韦岛","geoname_id":3371123,"asci_name":"Bouvet Island","level":0,"description":"state","center":[3.3595,-54.4197]},{"code":"BW","name":"博茨瓦纳","geoname_id":933860,"asci_name":"The Republic of Botswana","level":0,"description":"state","center":[24.4739,-22.4176]},{"code":"BY","name":"白罗斯","geoname_id":630336,"asci_name":"The Republic of Belarus","level":0,"description":"Country","center":[27.883,53.7747]},{"code":"BZ","name":"伯利兹","geoname_id":3582678,"asci_name":"Belize","level":0,"description":"state","center":[-88.7271,17.1949]},{"code":"CA","name":"加拿大","geoname_id":6251999,"asci_name":"Canada","level":0,"description":"Country","center":[-116.9186,60.2273]},{"code":"CC","name":"科科斯群岛","geoname_id":1547376,"asci_name":"Territory of Cocos (Keeling) Islands","level":0,"description":"state","center":[96.8303,-12.171]},{"code":"CD","name":"刚果（金）","geoname_id":203312,"asci_name":"The Democratic Republic of the Congo","level":0,"description":"state","center":[22.4374,-4.0875]},{"code":"CF","name":"中非","geoname_id":239880,"asci_name":"The Central African Republic","level":0,"description":"state","center":[20.6627,6.638]},{"code":"CG","name":"刚果（布）","geoname_id":2260494,"asci_name":"The Republic of the Congo","level":0,"description":"state","center":[16.0718,-0.6664]},{"code":"CH","name":"瑞士","geoname_id":2658434,"asci_name":"Swiss Confederation","level":0,"description":"国","center":[8.4481,46.8224]},{"code":"CI","name":"科特迪瓦","geoname_id":2287781,"asci_name":"The Republic of Côte d\'Ivoire","level":0,"description":"state","center":[-5.5573,7.5616]},{"code":"CK","name":"库克群岛","geoname_id":1899402,"asci_name":"The Cook Islands","level":0,"description":"state","center":[-159.7783,-21.2339]},{"code":"CL","name":"智利","geoname_id":3895114,"asci_name":"The Republic of Chile","level":0,"description":"Country","center":[-72.3188,-37.8958]},{"code":"CM","name":"喀麦隆","geoname_id":2233387,"asci_name":"The Republic of Cameroon","level":0,"description":"state","center":[13.6386,7.4045]},{"code":"CO","name":"哥伦比亚","geoname_id":3686110,"asci_name":"Republic of Colombia","level":0,"description":"Country","center":[-72.6147,4.1587]},{"code":"CR","name":"哥斯达黎加","geoname_id":3624060,"asci_name":"The Republic of Costa Rica","level":0,"description":"state","center":[-83.6675,9.6333]},{"code":"CU","name":"古巴","geoname_id":3562981,"asci_name":"The Republic of Cuba","level":0,"description":"state","center":[-77.8291,21.5254]},{"code":"CV","name":"佛得角","geoname_id":3374766,"asci_name":"The Republic of Cabo Verde","level":0,"description":"state","center":[-23.6351,15.1204]},{"code":"CW","name":"库拉索","geoname_id":7626836,"asci_name":"Country of Curaçao","level":0,"description":"state","center":[-69.0406,12.2132]},{"code":"CX","name":"圣诞岛","geoname_id":2078138,"asci_name":"Territory of Christmas Island","level":0,"description":"state","center":[105.6169,-10.4914]},{"code":"CY","name":"塞浦路斯","geoname_id":146669,"asci_name":"Republic of Cyprus","level":0,"description":"state","center":[33.3986,35.1661]},{"code":"CZ","name":"捷克","geoname_id":3077311,"asci_name":"The Czech Republic","level":0,"description":"Country","center":[15.5271,49.8197]},{"code":"DE","name":"德国","geoname_id":2921044,"asci_name":"The Federal Republic of Germany","level":0,"description":"国","center":[10.5807,51.3283]},{"code":"DJ","name":"吉布提","geoname_id":223816,"asci_name":"The Republic of Djibouti","level":0,"description":"state","center":[42.5037,11.8131]},{"code":"DK","name":"丹麦","geoname_id":2623032,"asci_name":"The Kingdom of Denmark","level":0,"description":"Country","center":[9.3144,55.9565]},{"code":"DM","name":"多米尼克","geoname_id":3575830,"asci_name":"The Commonwealth of Dominica","level":0,"description":"state","center":[-61.3411,15.4238]},{"code":"DO","name":"多米尼加","geoname_id":3508796,"asci_name":"The Dominican Republic","level":0,"description":"state","center":[-70.1246,18.7721]},{"code":"DZ","name":"阿尔及利亚","geoname_id":2589581,"asci_name":"The People\'s Democratic Republic of Algeria","level":0,"description":"state","center":[0.627319201707805,28.012153]},{"code":"EC","name":"厄瓜多尔","geoname_id":3658394,"asci_name":"Republic of Ecuador","level":0,"description":"Country","center":[-78.2725,-1.7987]},{"code":"EE","name":"爱沙尼亚","geoname_id":453733,"asci_name":"Republic of Estonia","level":0,"description":"state","center":[25.3668,58.6092]},{"code":"EG","name":"埃及","geoname_id":357994,"asci_name":"The Arab Republic of Egypt","level":0,"description":"Country","center":[29.4676,26.9406]},{"code":"EH","name":"西撒哈拉","geoname_id":2461445,"asci_name":"Western Sahara","level":0,"description":"state","center":[-13.686,24.2721]},{"code":"ER","name":"厄立特里亚","geoname_id":338010,"asci_name":"The State of Eritrea","level":0,"description":"state","center":[38.0893,15.2]},{"code":"ES","name":"西班牙","geoname_id":2510769,"asci_name":"The Kingdom of Spain","level":0,"description":"国","center":[-3.4204,40.0061]},{"code":"ET","name":"埃塞俄比亚","geoname_id":337996,"asci_name":"The Federal Democratic Republic of Ethiopia","level":0,"description":"state","center":[38.971,9.1927]},{"code":"FI","name":"芬兰","geoname_id":660013,"asci_name":"The Republic of Finland","level":0,"description":"Country","center":[27.5283,65.4504]},{"code":"FJ","name":"斐济","geoname_id":2205218,"asci_name":"The Republic of Fiji","level":0,"description":"state","center":[177.9784,-17.7941]},{"code":"FK","name":"福克兰群岛","geoname_id":3474414,"asci_name":"Falkland Islands","level":0,"description":"state","center":[-58.6015,-51.8]},{"code":"FM","name":"密克罗尼西亚联邦","geoname_id":2081918,"asci_name":"The Federated States of Micronesia","level":0,"description":"state","center":[158.2402,6.8852]},{"code":"FO","name":"法罗群岛","geoname_id":2622320,"asci_name":"Faroe Islands","level":0,"description":"state","center":[-7.0174,62.1252]},{"code":"FR","name":"法国","geoname_id":3017382,"asci_name":"The French Republic","level":0,"description":"国","center":[2.1592,46.8894]},{"code":"GA","name":"加蓬","geoname_id":2400553,"asci_name":"The Gabonese Republic","level":0,"description":"state","center":[11.6604,-0.8204]},{"code":"GB","name":"英国","geoname_id":2635167,"asci_name":"The United Kingdom of Great Britain and Northern Ireland","level":0,"description":"国","center":[-2.1838,54.5475]},{"code":"GD","name":"格林纳达","geoname_id":3580239,"asci_name":"Grenada","level":0,"description":"state","center":[-61.6867,12.111]},{"code":"GE","name":"格鲁吉亚","geoname_id":614540,"asci_name":"Georgia","level":0,"description":"state","center":[43.6774,42.3325]},{"code":"GF","name":"法属圭亚那","geoname_id":3381670,"asci_name":"French Guiana","level":0,"description":"state","center":[-53.0339,3.9307]},{"code":"GG","name":"根西","geoname_id":3042362,"asci_name":"Bailiwick of Guernsey","level":0,"description":"state","center":[-2.5827,49.4632]},{"code":"GH","name":"加纳","geoname_id":2300660,"asci_name":"The Republic of Ghana","level":0,"description":"state","center":[-1.0593,7.9674]},{"code":"GI","name":"直布罗陀","geoname_id":2411586,"asci_name":"Gibraltar","level":0,"description":"state","center":[-5.3482,36.134]},{"code":"GL","name":"格陵兰","geoname_id":3425505,"asci_name":"Greenland","level":0,"description":"state","center":[-40.4109,76.068]},{"code":"GM","name":"冈比亚","geoname_id":2413451,"asci_name":"The Republic of The Gambia","level":0,"description":"state","center":[-15.9739,13.4345]},{"code":"GN","name":"几内亚","geoname_id":2420477,"asci_name":"The Republic of Guinea","level":0,"description":"state","center":[-9.662,9.945]},{"code":"GP","name":"瓜德罗普","geoname_id":3579143,"asci_name":"Guadeloupe","level":0,"description":"state","center":[-61.6781,16.1544]},{"code":"GQ","name":"赤道几内亚","geoname_id":2309096,"asci_name":"The Republic of Equatorial Guine","level":0,"description":"state","center":[10.4695,1.6349]},{"code":"GR","name":"希腊","geoname_id":390903,"asci_name":"The Hellenic Republic","level":0,"description":"Country","center":[21.7609,39.1182]},{"code":"GS","name":"南乔治亚和南桑威齐群岛","geoname_id":3474415,"asci_name":"South Georgia and the South Sandwich Islands","level":0,"description":"state","center":[-36.4992,-54.4399]},{"code":"GT","name":"危地马拉","geoname_id":3595528,"asci_name":"The Republic of Guatemala","level":0,"description":"state","center":[-90.2956,15.7886]},{"code":"GU","name":"关岛","geoname_id":4043988,"asci_name":"Guam","level":0,"description":"state","center":[144.7577,13.4504]},{"code":"GW","name":"几内亚比绍","geoname_id":2372248,"asci_name":"The Republic of Guinea-Bissau","level":0,"description":"state","center":[-14.5964,11.805]},{"code":"GY","name":"圭亚那","geoname_id":3378535,"asci_name":"The Cooperative Republic of Guyana","level":0,"description":"state","center":[-58.9506,4.8622]},{"code":"HK","name":"中国香港","geoname_id":1819730,"asci_name":"Hong Kong Special Administrative Region of the People\'s Republic of China","level":0,"description":"Region","center":[114.17051,22.276423]},{"code":"HM","name":"赫德岛和麦克唐纳群岛","geoname_id":1547314,"asci_name":"Territory of Heard Island and McDonald Islands","level":0,"description":"state","center":[73.5286,-53.0783]},{"code":"HN","name":"洪都拉斯","geoname_id":3608932,"asci_name":"The Republic of Honduras","level":0,"description":"state","center":[-87.2195,14.5108]},{"code":"HR","name":"克罗地亚","geoname_id":3202326,"asci_name":"The Republic of Croatia","level":0,"description":"state","center":[15.3255,44.7753]},{"code":"HT","name":"海地","geoname_id":3723988,"asci_name":"The Republic of Haiti","level":0,"description":"state","center":[-72.2951,18.9902]},{"code":"HU","name":"匈牙利","geoname_id":719819,"asci_name":"Hungary","level":0,"description":"Country","center":[19.1493,47.1813]},{"code":"ID","name":"印度尼西亚","geoname_id":1643084,"asci_name":"Republic of Indonesia","level":0,"description":"国","center":[113.3193,0.1133]},{"code":"IE","name":"爱尔兰","geoname_id":2963597,"asci_name":"Ireland","level":0,"description":"Country","center":[-8.1132,53.4616]},{"code":"IL","name":"以色列","geoname_id":294640,"asci_name":"The State of Israel","level":0,"description":"Country","center":[34.665,31.434]},{"code":"IM","name":"马恩岛","geoname_id":3042225,"asci_name":"Isle of Man","level":0,"description":"state","center":[-4.5149,54.2362]},{"code":"IN","name":"印度","geoname_id":1269750,"asci_name":"The Republic of India","level":0,"description":"state","center":[78.6496,23.3717]},{"code":"IO","name":"英属印度洋领地","geoname_id":1282588,"asci_name":"British Indian Ocean Territory","level":0,"description":"state","center":[72.4716,-7.3392]},{"code":"IQ","name":"伊拉克","geoname_id":99237,"asci_name":"The Republic of Iraq","level":0,"description":"Country","center":[42.461,33.3185]},{"code":"IR","name":"伊朗","geoname_id":130758,"asci_name":"The Islamic Republic of Iran","level":0,"description":"state","center":[53.7474,32.719]},{"code":"IS","name":"冰岛","geoname_id":2629691,"asci_name":"the Republic of Iceland","level":0,"description":"state","center":[-18.32,65.0123]},{"code":"IT","name":"意大利","geoname_id":3175395,"asci_name":"Repubblica Italiana","level":0,"description":"国","center":[12.5138,42.6725]},{"code":"JE","name":"泽西","geoname_id":3042142,"asci_name":"Bailiwick of Jersey","level":0,"description":"state","center":[-2.1257,49.2127]},{"code":"JM","name":"牙买加","geoname_id":3489940,"asci_name":"Jamaica","level":0,"description":"state","center":[-77.1598,18.1159]},{"code":"JO","name":"约旦","geoname_id":248816,"asci_name":"The Hashemite Kingdom of Jordan","level":0,"description":"Country","center":[36.3091,31.3051]},{"code":"JP","name":"日本","geoname_id":1861060,"asci_name":"Japan","level":0,"description":"state","center":[139.8855,37.6006]},{"code":"KE","name":"肯尼亚","geoname_id":192950,"asci_name":"The Republic of Kenya","level":0,"description":"state","center":[37.4854,0.1774]},{"code":"KG","name":"吉尔吉斯斯坦","geoname_id":1527747,"asci_name":"Kyrgyz Republic","level":0,"description":"state","center":[75.0168,41.2558]},{"code":"KH","name":"柬埔寨","geoname_id":1831722,"asci_name":"the Kingdom of Cambodia","level":0,"description":"Country","center":[105.133,12.558]},{"code":"KI","name":"基里巴斯","geoname_id":4030945,"asci_name":"The Republic of Kiribati","level":0,"description":"state","center":[-157.371,1.8709]},{"code":"KM","name":"科摩罗","geoname_id":921929,"asci_name":"Union of the Comoros","level":0,"description":"state","center":[43.3307,-11.6527]},{"code":"KN","name":"圣基茨和尼维斯","geoname_id":3575174,"asci_name":"The Federation of Saint Kitts and Nevis","level":0,"description":"state","center":[-62.7446,17.3156]},{"code":"KP","name":"朝鲜","geoname_id":1873107,"asci_name":"Democratic People\'s Republic of Korea","level":0,"description":"state","center":[126.8405,40.3963]},{"code":"KR","name":"韩国","geoname_id":1835841,"asci_name":"Republic of Korea","level":0,"description":"国","center":[127.9592,36.4849]},{"code":"KW","name":"科威特","geoname_id":285570,"asci_name":"The State of Kuwait","level":0,"description":"Country","center":[47.4272,29.3169]},{"code":"KY","name":"开曼群岛","geoname_id":3580718,"asci_name":"Cayman Islands","level":0,"description":"state","center":[-81.1715,19.3299]},{"code":"KZ","name":"哈萨克斯坦","geoname_id":1522867,"asci_name":"The Republic of Kazakhstan","level":0,"description":"Country","center":[66.572,48.5488]},{"code":"LA","name":"老挝","geoname_id":1655842,"asci_name":"The Lao People’s Democratic Republi","level":0,"description":"state","center":[102.1592,18.2605]},{"code":"LB","name":"黎巴嫩","geoname_id":272103,"asci_name":"The Lebanese Republic","level":0,"description":"Country","center":[35.9001,33.878]},{"code":"LC","name":"圣卢西亚","geoname_id":3576468,"asci_name":"Saint Lucia","level":0,"description":"state","center":[-60.9779,13.9091]},{"code":"LI","name":"列支敦士登","geoname_id":3042058,"asci_name":"The Principality of Liechtenstein","level":0,"description":"state","center":[9.547,47.1593]},{"code":"LK","name":"斯里兰卡","geoname_id":1227603,"asci_name":"The Democratic Socialist Republic of Sri Lanka","level":0,"description":"state","center":[80.6383,7.8836]},{"code":"LR","name":"利比里亚","geoname_id":2275384,"asci_name":"The Republic of Liberia","level":0,"description":"state","center":[-9.6382,6.456]},{"code":"LS","name":"莱索托","geoname_id":932692,"asci_name":"The Kingdom of Lesotho","level":0,"description":"state","center":[28.1744,-29.6287]},{"code":"LT","name":"立陶宛","geoname_id":597427,"asci_name":"Republic of Lithuania","level":0,"description":"state","center":[24.182465117313534,55.174429]},{"code":"LU","name":"卢森堡","geoname_id":2960313,"asci_name":"The Grand Duchy of Luxembourg","level":0,"description":"state","center":[6.0814,49.8167]},{"code":"LV","name":"拉脱维亚","geoname_id":458258,"asci_name":"The Republic of Latvia","level":0,"description":"state","center":[24.4397,56.9003]},{"code":"LY","name":"利比亚","geoname_id":2215636,"asci_name":"State of Libya","level":0,"description":"state","center":[17.4424,26.5829]},{"code":"MA","name":"摩洛哥","geoname_id":2542007,"asci_name":"The Kingdom of Morocco","level":0,"description":"Country","center":[-6.1699,31.8889]},{"code":"MC","name":"摩纳哥","geoname_id":2993457,"asci_name":"The Principality of Monaco","level":0,"description":"state","center":[7.4243,43.7384]},{"code":"MD","name":"摩尔多瓦","geoname_id":617790,"asci_name":"Republic of Moldova","level":0,"description":"state","center":[28.8269,47.0019]},{"code":"ME","name":"黑山","geoname_id":3194884,"asci_name":"Montenegro","level":0,"description":"state","center":[19.2878,42.7151]},{"code":"MF","name":"法属圣马丁","geoname_id":3578421,"asci_name":"Saint-Martin","level":0,"description":"state","center":[-63.0507,18.0848]},{"code":"MG","name":"马达加斯加","geoname_id":1062947,"asci_name":"The Republic of Madagascar","level":0,"description":"state","center":[46.6872,-18.9175]},{"code":"MH","name":"马绍尔群岛","geoname_id":2080185,"asci_name":"The Republic of the Marshall Islands","level":0,"description":"state","center":[171.3717,7.109]},{"code":"MK","name":"马其顿","geoname_id":718075,"asci_name":"The Republic of North Macedonia","level":0,"description":"state","center":[21.7483,41.6182]},{"code":"ML","name":"马里","geoname_id":2453866,"asci_name":"The Republic of Mali","level":0,"description":"state","center":[-0.725,17.4996]},{"code":"MM","name":"缅甸","geoname_id":1327865,"asci_name":"The Republic of the Union of Myanmar","level":0,"description":"Country","center":[95.9058,19.5274]},{"code":"MN","name":"蒙古","geoname_id":2029969,"asci_name":"Mongolia","level":0,"description":"state","center":[105.2046,47.1285]},{"code":"MO","name":"中国澳门","geoname_id":1821275,"asci_name":"Macao Special Administrative Region of the People\'s Republic of China","level":0,"description":"Region","center":[113.545126,22.18043]},{"code":"MP","name":"北马里亚纳群岛","geoname_id":4041468,"asci_name":"Commonwealth of the Northern Mariana Islands","level":0,"description":"state","center":[145.7468,15.191]},{"code":"MQ","name":"马提尼克","geoname_id":3570311,"asci_name":"Martinique","level":0,"description":"state","center":[-61.0157,14.6368]},{"code":"MR","name":"毛里塔尼亚","geoname_id":2378080,"asci_name":"The Islamic Republic of Mauritania","level":0,"description":"state","center":[-11.4608,21.1503]},{"code":"MS","name":"蒙塞拉特岛","geoname_id":3578097,"asci_name":"Montserrat","level":0,"description":"state","center":[-62.1928,16.7492]},{"code":"MT","name":"马耳他","geoname_id":2562770,"asci_name":"The Republic of Malta","level":0,"description":"state","center":[14.4137,35.9023]},{"code":"MU","name":"毛里求斯","geoname_id":934292,"asci_name":"The Republic of Mauritius","level":0,"description":"state","center":[57.5899,-20.2529]},{"code":"MV","name":"马尔代夫","geoname_id":1282028,"asci_name":"The Republic of Maldives","level":0,"description":"state","center":[73.1,-0.6321]},{"code":"MW","name":"马拉维","geoname_id":927384,"asci_name":"The Republic of Malawi","level":0,"description":"state","center":[33.7428,-13.2731]},{"code":"MX","name":"墨西哥","geoname_id":3996063,"asci_name":"The United Mexican States","level":0,"description":"国","center":[-102.3697,23.9442]},{"code":"MY","name":"马来西亚","geoname_id":1733045,"asci_name":"Malaysia","level":0,"description":"国","center":[114.6579,3.9511]},{"code":"MZ","name":"莫桑比克","geoname_id":1036973,"asci_name":"The Republic of Mozambique","level":0,"description":"state","center":[34.3703,-18.8696]},{"code":"NA","name":"纳米比亚","geoname_id":3355338,"asci_name":"The Republic of Namibia","level":0,"description":"state","center":[17.213,-23.107]},{"code":"NC","name":"新喀里多尼亚","geoname_id":2139685,"asci_name":"New Caledonia","level":0,"description":"state","center":[165.2478,-21.24]},{"code":"NE","name":"尼日尔","geoname_id":2440476,"asci_name":"The Republic of Niger","level":0,"description":"state","center":[9.8913,17.5768]},{"code":"NF","name":"诺福克岛","geoname_id":2155115,"asci_name":"Territory of Norfolk Island","level":0,"description":"state","center":[167.9588,-29.0289]},{"code":"NG","name":"尼日利亚","geoname_id":2328926,"asci_name":"The Federal Republic of Nigeria","level":0,"description":"state","center":[7.99,9.1049]},{"code":"NI","name":"尼加拉瓜","geoname_id":3617476,"asci_name":"The Republic of Nicaragua","level":0,"description":"state","center":[-85.57501714767767,12.8690075]},{"code":"NL","name":"荷兰","geoname_id":2750405,"asci_name":"The Kingdom of the Netherlands","level":0,"description":"Country","center":[5.5869,52.1287]},{"code":"NO","name":"挪威","geoname_id":3144096,"asci_name":"The Kingdom of Norway","level":0,"description":"Country","center":[13.6065,65.3651]},{"code":"NP","name":"尼泊尔","geoname_id":1282988,"asci_name":"Nepal","level":0,"description":"state","center":[83.0746,28.4212]},{"code":"NR","name":"瑙鲁","geoname_id":2110425,"asci_name":"The Republic of Nauru","level":0,"description":"state","center":[166.9317,-0.5282]},{"code":"NU","name":"纽埃","geoname_id":4036232,"asci_name":"Niue","level":0,"description":"state","center":[-169.8494,-19.054]},{"code":"NZ","name":"新西兰","geoname_id":2186224,"asci_name":"New Zealand","level":0,"description":"Country","center":[171.0074,-43.6656]},{"code":"OM","name":"阿曼","geoname_id":286963,"asci_name":"The Sultanate of Oman","level":0,"description":"Country","center":[57.0243,20.8862]},{"code":"PA","name":"巴拿马","geoname_id":3703430,"asci_name":"The Republic of Panama","level":0,"description":"state","center":[-81.4812,8.4202]},{"code":"PE","name":"秘鲁","geoname_id":3932488,"asci_name":"Republic of Peru","level":0,"description":"Country","center":[-75.8061,-9.3155]},{"code":"PF","name":"法属波利尼西亚","geoname_id":4030656,"asci_name":"French Polynesia","level":0,"description":"state","center":[-149.4451,-17.688]},{"code":"PG","name":"巴布亚新几内亚","geoname_id":2088628,"asci_name":"The Independent State of Papua New Guinea","level":0,"description":"state","center":[144.3478,-6.6693]},{"code":"PH","name":"菲律宾","geoname_id":1694008,"asci_name":"Republic of the Philippines","level":0,"description":"Country","center":[120.7409,15.6149]},{"code":"PK","name":"巴基斯坦","geoname_id":1168579,"asci_name":"The Islamic Republic of Pakistan","level":0,"description":"Country","center":[70.1995,30.5986]},{"code":"PL","name":"波兰","geoname_id":798544,"asci_name":"The Republic of Poland","level":0,"description":"国","center":[19.1972,52.0136]},{"code":"PM","name":"圣皮埃尔和密克隆","geoname_id":3424932,"asci_name":"Territorial Collectivity of Saint-Pierre and Miquelon","level":0,"description":"state","center":[-56.3267,46.9642]},{"code":"PN","name":"皮特凯恩群岛","geoname_id":4030699,"asci_name":"Pitcairn, Henderson, Ducie and Oeno Islands","level":0,"description":"state","center":[-128.3268,-24.376]},{"code":"PR","name":"波多黎各","geoname_id":4566966,"asci_name":"Commonwealth of Puerto Rico","level":0,"description":"state","center":[-66.4038,18.2218]},{"code":"PS","name":"巴勒斯坦","geoname_id":6254930,"asci_name":"the State of Palestine","level":0,"description":"state","center":[35.2666,31.9491]},{"code":"PT","name":"葡萄牙","geoname_id":2264397,"asci_name":"A República Portuguesa","level":0,"description":"Country","center":[-8.2962,39.6065]},{"code":"PW","name":"帕劳","geoname_id":1559582,"asci_name":"The Republic of Palau","level":0,"description":"state","center":[134.5573,7.5288]},{"code":"PY","name":"巴拉圭","geoname_id":3437598,"asci_name":"Republic of Paraguay","level":0,"description":"state","center":[-58.4145,-23.4993]},{"code":"QA","name":"卡塔尔","geoname_id":289688,"asci_name":"The State of Qatar","level":0,"description":"Country","center":[51.1522,25.3174]},{"code":"RE","name":"留尼汪","geoname_id":935317,"asci_name":"Réunion","level":0,"description":"state","center":[55.537,-21.131]},{"code":"RO","name":"罗马尼亚","geoname_id":798549,"asci_name":"Romania","level":0,"description":"Country","center":[24.2311,45.9908]},{"code":"RS","name":"塞尔维亚","geoname_id":6290252,"asci_name":"The Republic of Serbia","level":0,"description":"state","center":[21.01427955153322,44.213059]},{"code":"RU","name":"俄罗斯","geoname_id":2017370,"asci_name":"Russian Federation","level":0,"description":"Country","center":[110.0304,65.0969]},{"code":"RW","name":"卢旺达","geoname_id":49518,"asci_name":"The Republic of Rwanda","level":0,"description":"state","center":[29.9879,-1.9431]},{"code":"SA","name":"沙特阿拉伯","geoname_id":102358,"asci_name":"Kingdom of Saudi Arabia","level":0,"description":"Country","center":[44.1943,24.5136]},{"code":"SB","name":"所罗门群岛","geoname_id":2103350,"asci_name":"Solomon Islands","level":0,"description":"state","center":[160.1487,-9.5987]},{"code":"SC","name":"塞舌尔","geoname_id":241170,"asci_name":"Republic of Seychelles","level":0,"description":"state","center":[55.4928,-4.6839]},{"code":"SD","name":"苏丹","geoname_id":366755,"asci_name":"The Republic of the Sudan","level":0,"description":"state","center":[29.7844,15.4506]},{"code":"SE","name":"瑞典","geoname_id":2661886,"asci_name":"Sweden","level":0,"description":"国","center":[14.9499,62.9927]},{"code":"SG","name":"新加坡","geoname_id":1880251,"asci_name":"Republic of Singapore","level":0,"description":"Country","center":[103.8302,1.3405]},{"code":"SH","name":"圣赫勒拿","geoname_id":3370751,"asci_name":"Saint Helena","level":0,"description":"state","center":[-12.2823,-37.1159]},{"code":"SI","name":"斯洛文尼亚","geoname_id":3190538,"asci_name":"The Republic of Slovenia","level":0,"description":"state","center":[14.634,46.1541]},{"code":"SJ","name":"斯瓦尔巴群岛和扬马延岛","geoname_id":607072,"asci_name":"Svalbard and Jan Mayen","level":0,"description":"state","center":[18.5821,78.4378]},{"code":"SK","name":"斯洛伐克","geoname_id":3057568,"asci_name":"Slovak Republic","level":0,"description":"state","center":[19.6543,48.6813]},{"code":"SL","name":"塞拉利昂","geoname_id":2403846,"asci_name":"The Republic of Sierra Leone","level":0,"description":"state","center":[-11.875,8.4655]},{"code":"SM","name":"圣马力诺","geoname_id":3168068,"asci_name":"La Repubblica di San Marino","level":0,"description":"state","center":[12.4611,43.942]},{"code":"SN","name":"塞内加尔","geoname_id":2245662,"asci_name":"The Republic of Senegal","level":0,"description":"state","center":[-14.6562,14.5118]},{"code":"SO","name":"索马里","geoname_id":51537,"asci_name":"The Federal Republic of Somalia","level":0,"description":"state","center":[46.8166,5.1742]},{"code":"SR","name":"苏里南","geoname_id":3382998,"asci_name":"The Republic of Suriname","level":0,"description":"state","center":[-56.1048,3.9238]},{"code":"SS","name":"南苏丹","geoname_id":7909807,"asci_name":"The Republic of South Sudan","level":0,"description":"state","center":[29.1116,7.8795]},{"code":"ST","name":"圣多美和普林西比","geoname_id":2410758,"asci_name":"The Democratic Republic of Sao Tome and Principe","level":0,"description":"state","center":[6.595,0.216]},{"code":"SV","name":"萨尔瓦多","geoname_id":3585968,"asci_name":"The Republic of El Salvador","level":0,"description":"state","center":[-88.9105,13.802]},{"code":"SX","name":"荷属圣马丁","geoname_id":7609695,"asci_name":"Saint-Martin","level":0,"description":"state","center":[-63.0544,18.034]},{"code":"SY","name":"叙利亚","geoname_id":163843,"asci_name":"The Syrian Arab Republic","level":0,"description":"state","center":[38.5585,34.8522]},{"code":"SZ","name":"斯威士兰","geoname_id":934841,"asci_name":"The Kingdom of Eswatini","level":0,"description":"state","center":[31.4607,-26.5203]},{"code":"TC","name":"特克斯和凯科斯群岛","geoname_id":3576916,"asci_name":"Turks and Caicos Islands","level":0,"description":"state","center":[-71.7669,21.7784]},{"code":"TD","name":"乍得","geoname_id":2434508,"asci_name":"The Republic of Chad","level":0,"description":"state","center":[18.6422,15.5973]},{"code":"TF","name":"法属南方和南极洲领地","geoname_id":1546748,"asci_name":"French Southern and Antarctic Lands","level":0,"description":"state","center":[70.2177,-49.1974]},{"code":"TG","name":"多哥","geoname_id":2363686,"asci_name":"The Republic of Togo","level":0,"description":"state","center":[1.0401,8.6357]},{"code":"TH","name":"泰国","geoname_id":1605651,"asci_name":"The Kingdom of Thailand","level":0,"description":"国","center":[101.6544,13.1506]},{"code":"TJ","name":"塔吉克斯坦","geoname_id":1220409,"asci_name":"The Republic of Tajikistan","level":0,"description":"state","center":[70.945,38.8917]},{"code":"TK","name":"托克劳","geoname_id":4031074,"asci_name":"Tokelau","level":0,"description":"state","center":[-171.7801,-9.1757]},{"code":"TL","name":"东帝汶","geoname_id":1966436,"asci_name":"Democratic Republic of Timor-Leste","level":0,"description":"state","center":[125.7585,-8.8915]},{"code":"TM","name":"土库曼斯坦","geoname_id":1218197,"asci_name":"Turkmenistan","level":0,"description":"state","center":[58.902,39.0689]},{"code":"TN","name":"突尼斯","geoname_id":2464461,"asci_name":"The Republic of Tunisia","level":0,"description":"state","center":[8.886700222294479,33.788971]},{"code":"TO","name":"汤加","geoname_id":4032283,"asci_name":"The Kingdom of Tonga","level":0,"description":"state","center":[-175.2735,-21.168]},{"code":"TR","name":"土耳其","geoname_id":298795,"asci_name":"Republic of Turkey","level":0,"description":"Country","center":[35.5135,39.0251]},{"code":"TT","name":"特立尼达和多巴哥","geoname_id":3573591,"asci_name":"The Republic of Trinidad and Tobago","level":0,"description":"state","center":[-61.2616,10.4437]},{"code":"TV","name":"图瓦卢","geoname_id":2110297,"asci_name":"Tuvalu","level":0,"description":"state","center":[178.6758,-7.4786]},{"code":"TW","name":"台湾","geoname_id":1668284,"asci_name":"Taiwan","level":0,"description":"Region","center":[120.8354,23.609]},{"code":"TZ","name":"坦桑尼亚","geoname_id":149590,"asci_name":"The United Republic of Tanzania","level":0,"description":"state","center":[34.2541,-6.4017]},{"code":"UA","name":"乌克兰","geoname_id":690791,"asci_name":"Ukraine","level":0,"description":"Country","center":[31.0081,48.5409]},{"code":"UG","name":"乌干达","geoname_id":226074,"asci_name":"The Republic of Uganda","level":0,"description":"state","center":[32.723,1.3719]},{"code":"UM","name":"美国本土外小岛屿","geoname_id":5854968,"asci_name":"United States Minor Outlying Islands","level":0,"description":"state","center":[-162.3503,6.4052]},{"code":"US","name":"美国","geoname_id":6252001,"asci_name":"The United States of America","level":0,"description":"Country","center":[-99.5889,38.1815]},{"code":"UY","name":"乌拉圭","geoname_id":3439705,"asci_name":"Oriental Republic of Uruguay","level":0,"description":"Country","center":[-55.7993,-32.5625]},{"code":"UZ","name":"乌兹别克斯坦","geoname_id":1512440,"asci_name":"The Republic of Uzbekistan","level":0,"description":"state","center":[63.3577,41.5182]},{"code":"VA","name":"梵蒂冈","geoname_id":3164670,"asci_name":"The Vatican City State","level":0,"description":"state","center":[12.4532,41.9038]},{"code":"VC","name":"圣文森特和格林纳丁斯","geoname_id":3577815,"asci_name":"Saint Vincent and the Grenadines","level":0,"description":"state","center":[-61.1949,13.2528]},{"code":"VE","name":"委内瑞拉","geoname_id":3625428,"asci_name":"Bolivarian Republic of Venezuela","level":0,"description":"state","center":[-65.4352,6.4568]},{"code":"VG","name":"英属维尔京群岛","geoname_id":3577718,"asci_name":"British Virgin Islands","level":0,"description":"state","center":[-64.64,18.4204]},{"code":"VI","name":"美属维尔京群岛","geoname_id":4796775,"asci_name":"Virgin Islands of the United States","level":0,"description":"state","center":[-64.7592,17.7289]},{"code":"VN","name":"越南","geoname_id":1562822,"asci_name":"The Socialist Republic of Viet Nam","level":0,"description":"国","center":[107.6937,16.115]},{"code":"VU","name":"瓦努阿图","geoname_id":2134431,"asci_name":"The Republic of Vanuatu","level":0,"description":"state","center":[167.051,-15.1569]},{"code":"WF","name":"瓦利斯和富图纳","geoname_id":4034749,"asci_name":"Territory of the Wallis and Futuna Islands","level":0,"description":"state","center":[-176.2086,-13.2859]},{"code":"WS","name":"萨摩亚","geoname_id":4034894,"asci_name":"The Independent State of Samoa","level":0,"description":"state","center":[-172.4389,-13.6222]},{"code":"XK","name":"科索沃","geoname_id":831053,"asci_name":"Republic of Kosovo","level":0,"description":"state","center":[20.9131,42.5637]},{"code":"YE","name":"也门","geoname_id":69543,"asci_name":"Republic of Yemen","level":0,"description":"state","center":[47.4901,15.822]},{"code":"YT","name":"马约特","geoname_id":1024031,"asci_name":"Department of Mayotte","level":0,"description":"state","center":[45.1494,-12.8253]},{"code":"ZA","name":"南非","geoname_id":953987,"asci_name":"The Republic of South Africa","level":0,"description":"Country","center":[23.9312,-28.6718]},{"code":"ZM","name":"赞比亚","geoname_id":895949,"asci_name":"The Republic of Zambia","level":0,"description":"state","center":[25.4621,-13.2073]},{"code":"ZW","name":"津巴布韦","geoname_id":878675,"asci_name":"The Republic of Zimbabwe","level":0,"description":"state","center":[29.4113,-19.0547]}]';

/**
 * 获取分类下的音乐
 * @param cookie
 * @param categoryId 分类id
 * @param cursor 翻页游标,第一页默认为0，当返回数据指示有下一页时，可翻页，每次翻页在上一页游标基础上+20
 * @param sdkToken 请求认证token，同一个账号下可多次使用，不传的情况下会自动获取一个新的
 */
export const getDouyinCategoryMusicList = async (
  cookie: string,
  categoryId: string,
  cursor: number = 0,
  sdkToken: string = '',
): Promise<DouyinMusicResultOutput> => {
  const result: DouyinMusicResultOutput = {
    code: 0,
    msg: '',
  };

  try {
    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie);
    }
    const musicResult = await getDouyinMusicResponse(cookie, categoryId, cursor, sdkToken);
    result.code = musicResult.status_code ?? errorCode.data_error;
    result.msg = musicResult.status_msg;
    result.hasMore = musicResult.has_more;
    if (musicResult.songs?.length) {
      result.dataList = musicResult.songs?.map((obj) => ({
        yixiaoerId: obj.music_id,
        yixiaoerName: obj.music_name,
        authorName: obj.music_author,
        playUrl: obj.play_url,
        duration: obj.duration,
        raw: obj,
      }));
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
/**
 * 通过关键词搜索音乐
 * @param cookie 账号cookie
 * @param keyword 关键词
 * @param cursor 翻页游标,第一页默认为0，当返回数据指示有下一页时，可翻页，每次翻页在上一页游标基础上+20
 * @param agwToken 接口认证参数，，不传的情况下会自动获取一个新的
 */
export const searchDouyinMusicList = async (
  cookie: string,
  keyword: string,
  cursor: number = 0,
  agwToken: string = '',
): Promise<DouyinMusicResultOutput> => {
  const result: DouyinMusicResultOutput = {
    code: 0,
    msg: '',
  };

  try {
    if (!agwToken) {
      const agwResult = await getAgwAuthKey(cookie);
      agwToken = agwResult.signature;
    }
    const musicResult = await searchDouyinMusicResponse(cookie, keyword, agwToken, cursor);
    result.code = musicResult.status_code ?? errorCode.data_error;
    result.msg = musicResult.status_msg;
    result.songs = [];
    if (musicResult.music?.length > 0) {
      result.dataList = musicResult.music?.map((obj) => ({
        yixiaoerId: obj.id_str,
        yixiaoerName: obj.title,
        authorName: obj.author,
        album: obj.author,
        playUrl: obj.play_url?.uri,
        duration: obj.duration,
        raw: obj,
      }));
    }
    result.hasMore = musicResult.has_more === 1;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取抖音分类
 * @param cookie 登录后cookie
 */
export const getDouyinCategory = async (cookie: string): Promise<DouyinCategoryResultOutput> => {
  const result: DouyinCategoryResultOutput = {
    code: errorCode.ok,
    msg: '',
  };
  try {
    const locationResult = await getCategoryInfo(cookie);
    result.code = locationResult.status_code;
    result.msg = locationResult.status_msg;
    result.tag_list = locationResult.tag_list;
    if (result.tag_list?.length) {
      result.dataList = [];
      for (const item of result.tag_list) {
        const category: ListItemInfoLevel = {
          yixiaoerId: item.tag_id.toString(),
          yixiaoerName: item.show_name,
        };
        if (item.child_list?.length) {
          category.child = [];
          for (const child of item.child_list) {
            const childCategory: ListItemInfoLevel = {
              yixiaoerId: child.tag_id.toString(),
              yixiaoerName: child.show_name,
              raw: child,
            };
            category.child.push(childCategory);
          }
        }
        item.child_list = [];
        result.dataList.push(category);
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取合集列表
 * @param cookie  账号cookie字符串
 */
export const getDouyinCollection = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: errorCode.ok,
    msg: '',
    dataList: [],
  };
  try {
    const collectionResult = await getCollectionList(cookie);
    result.code = collectionResult.status_code;
    result.msg = collectionResult.status_msg;
    if (collectionResult.mix_list?.length) {
      for (const item of collectionResult.mix_list) {
        const collection: ListItemInfoLevel = {
          yixiaoerId: item.mix_id,
          yixiaoerName: item.mix_name,
          yixiaoerImageUrl: item.cover_url?.url_list?.length ? item.cover_url.url_list[0] : '',
          child: [],
          raw: { statis: item.statis },
        };
        const num = item?.statis?.updated_to_episode;
        if (num >= 0) {
          for (let i = 0; i <= num; i++) {
            const childCoolection: ListItemInfoLevel = {
              yixiaoerName: '第' + (i + 1) + '集',
              yixiaoerId: i.toString(),
              //yixiaoerDesc: item.mix_id,
            };
            childCoolection['parentId'] = item.mix_id;
            collection.child?.push(childCoolection);
          }
        }
        result.dataList?.push(collection);
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 *删除抖音作品
 * @param cookie
 * @param docId 做作品唯一id
 */
export const deleteDouyinContent = async (cookie: string, docId: string): Promise<DouyinDeleteContentResultOutput> => {
  const result: DouyinDeleteContentResultOutput = {
    code: 0,
    msg: '',
  };
  try {
    const deleteResult = await deleteContent(cookie, docId);
    result.code = deleteResult.status_code;
    result.msg = deleteResult.status_msg;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取抖音好友/用户
 * @param cookie
 * @param keyWord 搜索关键词
 * @param cursor 索引游标，用于翻页，
 */
export const getDouyinFriend = async (
  cookie: string,
  keyWord: string = '',
  cursor: number = 0,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const friendResult = await getUserList(cookie, keyWord, cursor);
    result.code = friendResult.status_code;
    result.msg = friendResult.status_msg;
    if (friendResult.user_list?.length) {
      result.dataList = friendResult.user_list?.map((obj) => ({
        yixiaoerId: obj.uid,
        yixiaoerName: obj.nickname,
        yixiaoerImage: obj.avatar_thumb?.url_list[0],
        fansNum: Number(obj.follower_count),
        douyinId: obj.unique_id ? obj.unique_id : obj.short_id,
        yixiaoerDesc: obj.signature,
        raw: { uid: obj.uid, nickname: obj.nickname },
      }));
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

interface DouyinPublicSearchData {
  business_data?: Array<{
    data?: {
      provider_doc_id_str?: string;
      raw_data?: string | DouyinPublicSearchRawData;
    };
  }>;
  log?: {
    search_id?: string;
  };
  has_more?: boolean;
  cursor?: number;
  offset?: number;
}

interface DouyinPublicSearchRawData {
  user_info?: {
    uid?: string;
    nickname?: string;
    signature?: string;
    avatar_larger?: { url_list?: Array<string> };
    avatar_medium?: { url_list?: Array<string> };
    avatar_thumb?: { url_list?: Array<string> };
    follower_count?: number;
    total_favorited?: number | string;
    aweme_count?: number;
    unique_id?: string;
    short_id?: string;
    sec_uid?: string;
  };
}

const extractDouyinPublicSearchJsonValue = (source: string, valueStart: number): string => {
  const openChar = source[valueStart];
  const closeChar = openChar === '{' ? '}' : openChar === '[' ? ']' : '';
  if (!closeChar) {
    return '';
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = valueStart; i < source.length; i++) {
    const char = source[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        return source.substring(valueStart, i + 1);
      }
    }
  }
  return '';
};

const findDouyinPublicPredictAckData = (value: unknown): DouyinPublicSearchData | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const valueRecord = value as Record<string, any>;
  if (valueRecord.predictAckData?.business_data) {
    return valueRecord.predictAckData as DouyinPublicSearchData;
  }
  if (Array.isArray(valueRecord.business_data)) {
    return valueRecord as DouyinPublicSearchData;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const searchData = findDouyinPublicPredictAckData(item);
      if (searchData) {
        return searchData;
      }
    }
    return undefined;
  }
  for (const key of Object.keys(valueRecord)) {
    const searchData = findDouyinPublicPredictAckData(valueRecord[key]);
    if (searchData) {
      return searchData;
    }
  }
  return undefined;
};

const findDouyinPublicRscJsonStart = (source: string): number => {
  const arrayStart = source.indexOf('[');
  const objectStart = source.indexOf('{');
  if (arrayStart < 0) {
    return objectStart;
  }
  if (objectStart < 0) {
    return arrayStart;
  }
  return Math.min(arrayStart, objectStart);
};

const extractDouyinPublicRscSearchData = (html: string): DouyinPublicSearchData | undefined => {
  let pushIndex = -1;
  while ((pushIndex = html.indexOf('self.__rsc_f.push(', pushIndex + 1)) >= 0) {
    const argumentStart = html.indexOf('[', pushIndex);
    if (argumentStart < 0) {
      continue;
    }
    const argumentJson = extractDouyinPublicSearchJsonValue(html, argumentStart);
    if (!argumentJson) {
      continue;
    }
    try {
      const argumentData = JSON.parse(argumentJson) as Array<unknown>;
      for (const item of argumentData) {
        if (typeof item !== 'string' || (!item.includes('predictAckData') && !item.includes('business_data'))) {
          continue;
        }
        const rscJsonStart = findDouyinPublicRscJsonStart(item);
        if (rscJsonStart < 0) {
          continue;
        }
        const searchData = findDouyinPublicPredictAckData(JSON.parse(item.substring(rscJsonStart)));
        if (searchData) {
          return searchData;
        }
      }
    } catch (e) {
      continue;
    }
  }
  return undefined;
};

const extractDouyinPublicLetSearchData = (html: string): DouyinPublicSearchData | undefined => {
  const dataIndex = html.indexOf('let data =');
  if (dataIndex < 0) {
    return undefined;
  }
  const jsonStart = html.indexOf('{', dataIndex);
  if (jsonStart < 0) {
    return undefined;
  }

  const dataJson = extractDouyinPublicSearchJsonValue(html, jsonStart);
  if (!dataJson) {
    return undefined;
  }
  try {
    return JSON.parse(dataJson) as DouyinPublicSearchData;
  } catch (e) {
    return undefined;
  }
};

const extractDouyinPublicSearchData = (html: string): DouyinPublicSearchData | undefined => {
  const rscData = extractDouyinPublicRscSearchData(html);
  const letData = extractDouyinPublicLetSearchData(html);
  if (rscData && letData) {
    return {
      ...rscData,
      log: rscData.log ?? letData.log,
      business_data: [...(letData.business_data ?? []), ...(rscData.business_data ?? [])],
    };
  }
  return rscData ?? letData;
};

const parseDouyinPublicSearchRawData = (
  rawData: string | DouyinPublicSearchRawData | undefined,
): DouyinPublicSearchRawData | undefined => {
  if (!rawData) {
    return undefined;
  }
  if (typeof rawData !== 'string') {
    return rawData;
  }
  try {
    return JSON.parse(rawData) as DouyinPublicSearchRawData;
  } catch (e) {
    return undefined;
  }
};

const decodeDouyinPublicHtmlText = (value: string): string => {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

const parseDouyinPublicCountText = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }
  const numberValue = Number(value.replace(/[万亿]/g, ''));
  if (Number.isNaN(numberValue)) {
    return 0;
  }
  if (value.includes('亿')) {
    return Math.round(numberValue * 100000000);
  }
  if (value.includes('万')) {
    return Math.round(numberValue * 10000);
  }
  return numberValue;
};

const extractDouyinPublicHtmlAuthorList = (html: string): Array<PlatformPublicAuthorInfo> => {
  const result: Array<PlatformPublicAuthorInfo> = [];
  const exists = new Set<string>();
  const authorLinkReg = /<a\b(?=[^>]*douyin\.com\/user\/)(?=[^>]*userInfo-)[^>]*>[\s\S]*?<\/a>/g;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = authorLinkReg.exec(html))) {
    const linkHtml = linkMatch[0];
    const href = decodeDouyinPublicHtmlText(linkHtml.match(/\bhref="([^"]+)"/)?.[1] ?? '');
    const secUid = href.match(/\/user\/([^?"]+)/)?.[1] ?? '';
    const avatarUrl = decodeDouyinPublicHtmlText(linkHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)?.[1] ?? '');
    const textList = decodeDouyinPublicHtmlText(linkHtml.replace(/<[^>]+>/g, '\n'))
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    const text = textList.join(' ');
    const douyinId = text.match(/抖音号[:：]\s*([^\s]+)/)?.[1] ?? '';
    const extAuthorId = secUid || douyinId;
    if (!extAuthorId || exists.has(extAuthorId)) {
      continue;
    }
    exists.add(extAuthorId);

    const followerText = text.match(/([\d.]+[万亿]?)\s*粉丝/)?.[1];
    const likeText = text.match(/([\d.]+[万亿]?)\s*获赞/)?.[1];
    const followerIndex = textList.findIndex((item) => item.includes('粉丝'));
    const description = (followerIndex >= 0 ? textList.slice(followerIndex + 1) : []).join('');
    result.push({
      platform_code: PublicAuthorPlatformCode.DouYin,
      ext_author_id: extAuthorId,
      nickname: textList[0] ?? '',
      avatar_url: avatarUrl,
      description: description || (text.includes('此用户没有填写简介') ? '此用户没有填写简介' : ''),
      aut_index: secUid ? `https://www.douyin.com/user/${secUid}` : href,
      aut_spi_url: secUid,
      follower_count: parseDouyinPublicCountText(followerText),
      total_views: 0,
      total_comments: 0,
      total_likes: parseDouyinPublicCountText(likeText),
      work_count: 0,
    });
  }
  return result;
};

const parseDouyinPublicAuthorSearchData = (
  searchData: DouyinPublicSearchData | undefined,
  offset: number = 0,
): PlatformPublicAuthorListOutput => {
  const result: PlatformPublicAuthorListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };
  if (!searchData) {
    return result;
  }

  const exists = new Set<string>();
  for (const item of searchData.business_data ?? []) {
    const userInfo = parseDouyinPublicSearchRawData(item?.data?.raw_data)?.user_info;
    const extAuthorId = userInfo?.uid?.toString() ?? item?.data?.provider_doc_id_str?.toString() ?? '';
    if (!extAuthorId || exists.has(extAuthorId)) {
      continue;
    }
    exists.add(extAuthorId);

    const avatarUrl =
      userInfo?.avatar_larger?.url_list?.[0] ??
      userInfo?.avatar_medium?.url_list?.[0] ??
      userInfo?.avatar_thumb?.url_list?.[0] ??
      '';
    const secUid = userInfo?.sec_uid ?? '';
    const douyinId = userInfo?.unique_id || userInfo?.short_id || extAuthorId;
    result.dataList?.push({
      platform_code: PublicAuthorPlatformCode.DouYin,
      ext_author_id: extAuthorId,
      nickname: userInfo?.nickname ?? '',
      avatar_url: avatarUrl,
      description: userInfo?.signature ?? '',
      aut_index: secUid ? `https://www.douyin.com/user/${secUid}` : `https://www.douyin.com/search/${douyinId}`,
      aut_spi_url: `sec_uid=${secUid}`,
      follower_count: Number(userInfo?.follower_count ?? 0),
      total_views: 0,
      total_comments: 0,
      total_likes: Number(userInfo?.total_favorited ?? 0),
      work_count: Number(userInfo?.aweme_count ?? 0),
    });
  }
  if (searchData.log?.search_id && result.dataList?.length && (offset <= 0 || result.dataList.length >= 20)) {
    result.nextPage = (offset + result.dataList.length).toString();
  }
  return result;
};

/**
 * 解析抖音公开作者搜索 HTML
 * @param html 抖音公开搜索页 HTML
 */
export const parseDouyinPublicAuthorSearchHtml = (html: string): Array<PlatformPublicAuthorInfo> => {
  const dataList = parseDouyinPublicAuthorSearchData(extractDouyinPublicSearchData(html)).dataList ?? [];
  return dataList.length ? dataList : extractDouyinPublicHtmlAuthorList(html);
};

/**
 * 搜索抖音公开作者列表
 * @param cookie 为空时使用抓包中的公开搜索默认 cookie
 * @param keyWord 搜索关键词
 * @param nextPage 下一页参数
 * @param proxy 代理
 */
export const searchDouyinPublicAuthorList = async (
  keyWord: string,
  cookie?: string | undefined,
  nextPage?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<PlatformPublicAuthorListOutput> => {
  const result: PlatformPublicAuthorListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const offset = Number(nextPage ?? 0) || 0;
    const html = await getDouyinPublicAuthorSearchHtml(cookie, keyWord, webProxy);
    const firstSearchData = extractDouyinPublicSearchData(html);
    const firstPageResult = parseDouyinPublicAuthorSearchData(firstSearchData);
    if (offset <= 0) {
      result.dataList = firstPageResult.dataList?.length ? firstPageResult.dataList : parseDouyinPublicAuthorSearchHtml(html);
      result.nextPage = firstPageResult.nextPage;
    } else {
      const searchId = firstSearchData?.log?.search_id;
      if (!searchId) {
        result.dataList = [];
      } else {
        const moreResponse = (await getDouyinPublicAuthorSearchMoreResponse(
          cookie,
          keyWord,
          offset,
          searchId,
          webProxy,
        )) as DouyinPublicSearchData;
        const moreResult = parseDouyinPublicAuthorSearchData(moreResponse, offset);
        result.dataList = moreResult.dataList;
        result.nextPage = moreResult.nextPage;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求抖音作者搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析抖音作者搜索结果失败';
    } else {
      result.msg = '抖音作者搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取抖音热点
 * @param cookie
 * @param keyWord 搜索关键词
 */
export const getDouyinHotEvents = async (cookie: string, keyWord: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const eventResult = await getHotEvents(cookie, keyWord);
    result.code = eventResult?.status_code ?? -1;
    result.msg = eventResult?.status_msg;
    if (eventResult?.sentences?.length) {
      for (const sentence of eventResult?.sentences) {
        result.dataList?.push({
          yixiaoerId: sentence?.sentence_id,
          yixiaoerName: sentence?.word,
          yixiaoerImageUrl: sentence?.word_cover?.url_list?.length ? sentence?.word_cover?.url_list[0] : '',
          viewNum: sentence?.hot_value,
          raw: sentence,
        });
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取抖音地点
 * @param cookie
 * @param keyWord 搜索关键词
 * @param locationType  根据高权益值决定，默认0，代表本地地点
 * @param pageNum 翻页参数,默认第1页，
 * @param proxy 代理桉树
 * @param coords 坐标/定位信息，来自浏览器自带定位接口
 * @param city
 * @param locationMode 1:带货 2:打卡
 */
export const getDouyinLocation = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxy?: KuaiDaiLiProxy,
  coords?: GeoLocation,
  city?: ListItemInfo,
  locationMode?: number,
): Promise<DouyinLocationResultOutput> => {
  const result: DouyinLocationResultOutput = {
    code: 0,
    msg: '',
  };
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    let locationResult: douyinLocationResponse | undefined;
    if (locationMode === 1 && !coords?.latitude) {
      locationResult = await getLocationByDefaultGoods(cookie, keyWord, locationType, pageNum, webProxy, 12);
    } else if (city?.yixiaoerId) {
      locationResult = await getLocationByCity(
        cookie,
        keyWord,
        locationType,
        pageNum,
        webProxy,
        coords,
        12,
        0,
        city,
        locationMode,
      );
    } else if (coords?.latitude) {
      locationResult = await getLocationByCoords(
        cookie,
        keyWord,
        locationType,
        pageNum,
        webProxy,
        coords,
        12,
        0,
        city,
        locationMode,
      );
    } else if (locationType == 2) {
      locationResult = await getLocationAll(
        cookie,
        keyWord,
        locationType,
        pageNum,
        webProxy,
        coords,
        12,
        0,
        city,
        locationMode,
      );
    } else {
      locationResult = await getLocation(
        cookie,
        keyWord,
        locationType,
        pageNum,
        webProxy,
        coords,
        12,
        0,
        city,
        locationMode,
      );
    }
    result.code = locationResult?.status_code ?? -1;
    result.msg = locationResult?.status_msg;
    result.poi_list = locationResult?.current_locs?.length
      ? locationResult?.current_locs.concat(locationResult.poi_list)
      : locationResult.poi_list;

    if (result.poi_list?.length) {
      result.dataList = result.poi_list?.map((obj) => ({
        yixiaoerId: obj.poi_id,
        yixiaoerName: obj.poi_name,
        yixiaoerDesc: obj.simple_address_str,
        productCount: obj.spu_count ?? 0,
        cpsProductCount: obj.cps_spu_count ?? 0,
        raw: obj,
      }));
    }
    result.poi_list = undefined;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取可选的城市
 * @param cookie
 * @param proxy
 */
export const getDouyinCity = async (cookie: string, proxy?: KuaiDaiLiProxy): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const locationResult = await getLocationCityList(cookie, '', 0, 1, webProxy, undefined, 12, 1);
    result.code = locationResult.status_code;
    result.msg = locationResult.status_msg;
    if (locationResult?.user_interest_city_code_list?.length) {
      result.dataList = locationResult?.user_interest_city_code_list?.map((obj) => ({
        yixiaoerId: obj.code.toString(),
        yixiaoerName: obj.name.toString(),
        raw: obj,
      }));
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
/**
 * 查询作品状态
 * @param cookie
 * @param publishId 作品id,来源于发布时产生的publishId
 * @param maxPage 查询最大翻页数，默认10页
 */
export const getDouyinVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<DouyinVideoStatusResultOutput> => {
  const result: DouyinVideoStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    const statusResult = await getMediaStatus(cookie, publishId, maxPage);
    result.code = statusResult.code;
    result.msg = statusResult.msg;
    result.data = statusResult.data;
    result.auditStatus = statusResult.auditStatus;
    result.create_time = statusResult.create_time;
    result.docId = statusResult.docId;
    result.openUrl = statusResult.openUrl;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 解析小程序链接，获取小程序信息
 * @param cookie
 * @param appUrl 小程序url链接
 * @param sdkToken
 */
export const getDouyinMiniApp = async (
  cookie: string,
  appUrl: string,
  sdkToken: string,
): Promise<DouyinMiniAppResultOutput> => {
  const result: DouyinMiniAppResultOutput = {
    code: 0,
    msg: '',
  };
  result.dataList = [];

  try {
    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie);
    }
    const appResult = await parseMiniAppInfo(cookie, appUrl, sdkToken);
    result.code = appResult?.status_code ?? -1;
    result.msg = appResult?.status_msg;
    if (appResult?.anchor_list?.length) {
      appResult.anchor_list.forEach((x) => {
        result.dataList?.push({
          yixiaoerId: x.id?.toString(),
          yixiaoerName: x.name,
          yixiaoerImageUrl: x.poster?.url_list[0],
          yixiaoerDesc: x.summary,
          enable: x.enable_mount,
          reason: x.reason ?? '当前小程序不支持挂载',
          raw: x,
        } as never);
      });
      // if (appResult?.anchor_list[0]?.enable_mount === false) {
      //   result.code = errorCode.privilege_error;
      //   result.msg = appResult.anchor_list[0].reason ?? '当前小程序不支持挂载';
      // }
    }
    if (result.dataList?.length) {
      const checkRe = await checkMiniAppEnable(cookie, result.dataList[0].yixiaoerId, sdkToken);
      if (checkRe?.ok === false && checkRe.reason) {
        result.dataList[0]['reason'] = checkRe?.reason?.replace('视频', '')?.replace('{anchor_name}', '小程序');
        result.dataList[0]['enable'] = false;
      }
    }

    result.anchor_list = appResult.anchor_list;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取商品信息
 * @param cookie
 * @param goodsUrl 商品url链接
 * @param sdkToken
 */
export const getDouyinGoods = async (
  cookie: string,
  goodsUrl: string,
  sdkToken: string,
): Promise<ListGoodsInfoResponse> => {
  const result: ListGoodsInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie);
    }
    const goodsResult = await parseGoodsInfo(cookie, goodsUrl, sdkToken);
    result.code = goodsResult?.status_code ?? -1;
    result.msg = goodsResult?.status_msg;
    if (goodsResult.promotions?.length) {
      result.dataList = goodsResult.promotions?.map((obj) => ({
        yixiaoerId: obj?.promotion_id,
        yixiaoerName: obj.title,
        yixiaoerDesc: '',
        yixiaoerImageUrl: obj.goods_imgs?.length ? obj.goods_imgs[0]?.elastic_img?.url_list[0] : '',
        price: obj.price,
        earnPrice: obj.cos_fee ?? 0,
        images: obj.goods_imgs?.map((img) => img?.elastic_img?.url_list[0]),
        raw: obj,
      }));
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 检测商品是否能挂车，检测针对蒸鹅数组，不会指出具体哪一个不行
 * @param cookie
 * @param sdkToken
 * @param goodsList 要检测的商品列表
 */
export const checkDouyinGoodsCanPublish = async (
  cookie: string,
  sdkToken: string,
  goodsList: Array<DouyinGoodsInfo>,
): Promise<{ code: number; msg: string }> => {
  const result = { code: 0, msg: '' };
  try {
    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie);
    }
    const checkResult = await checkGoodsIsInvalid(cookie, sdkToken, goodsList);
    result.code = checkResult.status_code;
    result.msg = checkResult.status_msg;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取抖音话题
 * @param cookie
 * @param keyWord 搜索关键词
 */
export const getDouyinTopics = async (cookie: string, keyWord: string): Promise<DouyinTopicResultOutput> => {
  const result: DouyinTopicResultOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const topicResult = await getTopics(cookie, keyWord);
    result.code = topicResult.status_code;
    result.msg = topicResult.status_msg;
    if (topicResult.sug_list?.length) {
      result.dataList = topicResult.sug_list?.map((obj) => ({
        yixiaoerId: obj.cid,
        yixiaoerName: obj.cha_name,
        viewNum: obj.view_count,
        raw: obj,
      }));
    } else {
      const id = Date.now().toString();
      result.dataList?.push({
        yixiaoerId: id,
        yixiaoerName: keyWord,
        viewNum: 0,
        raw: { cha_name: keyWord, cid: id },
      });
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 * 获取抖音作品数
 * @param cookie
 * @param max_cursor 内容分页最大数（首页传0，下一页此参数传上一页返回的数据）
 */
export const getDouyinContentList = async (
  cookie: string,
  max_cursor: number = 0,
): Promise<DouyinContentListResultOutput> => {
  const result: DouyinContentListResultOutput = {
    code: 0,
    msg: '',
    data: {},
  };

  try {
    const contentListResult = await getContentListAsync(cookie, max_cursor);
    result.code = contentListResult.status_code;
    result.msg = contentListResult.status_msg;
    result.data.aweme_list = contentListResult.aweme_list;
    result.data.has_more = contentListResult.has_more;
    result.data.max_cursor = contentListResult.max_cursor;
    result.data.min_cursor = contentListResult.min_cursor;
    result.raw = contentListResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 * 抖音数据总览分析
 * @param cookie
 * @param option_type 数据类型 默认播放量 （1：播放量，2：主页访问，3：作品点赞，4：作品分享，5：作品评论，6：作品粉丝）
 * @param last_days_type 数据范围 默认30天 （0：昨天，1：7天，3：30天）
 */
export const getDouyinDataOverview = async (
  cookie: string,
  option_type: 1 | 2 | 3 | 4 | 5 | 6 = 1,
  last_days_type: 0 | 1 | 3 = 3,
) => {
  const result: DouyinDataOverviewResultOutput = {
    code: 0,
    msg: '',
    data: {},
  };

  try {
    const dataOverviewResult = await getDataOverviewListAsync(cookie, option_type, last_days_type);
    result.code = dataOverviewResult.status_code;
    result.msg = dataOverviewResult.status_msg;
    result.data.option_list = dataOverviewResult.option_list;
    result.data.option_type = dataOverviewResult.option_type;
    result.raw = dataOverviewResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 * 获取抖音活动分类
 * @param cookie
 */
export const getDouyinActivityCategory = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    dataList: [],
  };

  try {
    const activityCategoryResult = await getActivityCategoryResponse(cookie);
    result.code = activityCategoryResult?.status_code ?? -1;
    //result.query_tags = activityCategoryResult.query_tags ?? [];
    result.msg = activityCategoryResult?.status_msg;
    if (activityCategoryResult?.query_tags?.length) {
      for (const item of activityCategoryResult?.query_tags) {
        result.dataList?.push({ yixiaoerId: item.id?.toString(), yixiaoerName: item.name?.toString() });
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export const getDouyinActivityListInfo = async (
  cookie: string,
  categoryId: string = '0',
  page: number = 1,
): Promise<ListActivityInfoResponse> => {
  const result: ListActivityInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (categoryId === '100001') {
      categoryId = '';
    }
    const activityResponse = await getDouyinActivityList(cookie, categoryId, page);
    result.code = activityResponse?.status_code ?? errorCode?.data_error;
    //result.activity_list = activityResponse.activity_list;
    result.msg = activityResponse?.status_msg;
    if (activityResponse?.activity_list?.length) {
      for (const item of activityResponse?.activity_list) {
        if (!item.challenge_ids?.length || !item.challenge_ids[0]) {
          continue;
        }
        result.dataList?.push({
          yixiaoerId: item.activity_id,
          yixiaoerName: item.activity_name,
          yixiaoerImageUrl: item.cover_image,
          viewNum: item.hot_score,
          start_date: item.show_end_time,
          end_date: item.show_end_time,
          category_id: item.query_tag?.toString(),
          raw: item,
        } as never);
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};
/**
 * 检测抖音账号是否已开通数据分析
 * @param cookie
 */
export const checkDouyinHasDataManage = async (cookie: string): Promise<DouyinHasDataManage> => {
  const result: DouyinHasDataManage = {
    code: 0,
    msg: '',
  };

  try {
    const activityResponse = await hasDouYinDataManage(cookie);
    result.code = activityResponse.status_code;
    result.has_data_mgmt_perm = activityResponse.has_data_mgmt_perm;
    result.msg = activityResponse.status_msg;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 * 开启抖音号数据管理分析
 * @param cookie
 */
export const openDouyinDataManage = async (cookie: string): Promise<DouyinOpenDataManage> => {
  const result: DouyinOpenDataManage = {
    code: 0,
    msg: '',
  };

  try {
    const activityResponse = await openDouyinDataManageResponse(cookie);
    result.code = activityResponse.status_code;
    result.msg = activityResponse.status_msg;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface DouyinHasDataManage {
  /**
   * 状态码
   * 0 正常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;

  /**
   * 是否已经开通数据分析  true:已开通 否则未开通
   */
  has_data_mgmt_perm?: boolean;
}

export interface DouyinOpenDataManage {
  /**
   * 状态码
   * 0 成功 非0 失败
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
}
/**
 * 开启抖音号数据管理分析
 * @param cookie
 * @param maxCursor 下一页参数
 */
export const getDouyinViewHistoryList = async (cookie: string, maxCursor: number = 0): Promise<DouyinViewHistory> => {
  const result: DouyinViewHistory = {
    code: 0,
    msg: '',
  };

  try {
    const activityResponse = await getViewHistoryListResponse(cookie, maxCursor);
    result.code = activityResponse.status_code;
    result.msg = activityResponse.status_msg;
    result.aweme_list = activityResponse.aweme_list;
    result.has_more = activityResponse.has_more;
    result.max_cursor = activityResponse.max_cursor;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};
export interface DouyinViewHistory {
  /**
   * 状态码
   * 0 成功 非0 失败
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 下一页参数
   */
  max_cursor?: number;

  /**
   * 是否有下一页
   * 1:是
   * 0:否
   */
  has_more?: 1 | 0;

  /**
   * 内容列表
   */
  aweme_list?: Array<DouyinHistoryMediaContent>;
}

export interface DouyinActivityOutput {
  /**
   * 状态码
   * 0 正常
   */
  code: number;

  /**
   * 提示消息
   */
  msg?: string;

  /**
   * 活动列表
   */
  activity_list?: Array<DouyinActivityInfo>;
}

export interface DouyinActivityCategoryOutput {
  /**
   * 状态码
   * 0 正常
   */
  code: number;

  /**
   * 错误提示
   */
  msg?: string;
  /**
   * 分类列表
   */
  query_tags?: Array<DouyinActivityCategory>;
}

export interface DouyinMusicResultOutput extends ListMusicInfoResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 音乐列表
   */
  songs?: Array<DouyinMusicInfo>;

  /**
   * 是否有下一页
   */
  hasMore?: boolean;
}

export interface DouyinTopicResultOutput extends ListInfoResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 话题列表
   */
  challenge_list?: Array<DouyinTopicInfo>;
}

export interface DouyinGoodsResultOutput {
  /**
   * 状态码
   * -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 商品列表
   */
  promotions?: Array<DouyinGoodsInfo>;
}

export interface DouyinMiniAppResultOutput extends ListInfoResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 小程序/挂载项目列表
   */
  anchor_list?: Array<DouyinMiniAppInfo>;
}

export interface DouyinLocationResultOutput extends ListLocationInfoResponse {
  /**
   * 状态码
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   *地点列表
   */
  poi_list?: Array<DouyinLocationInfo>;

  /**
   * 是否还有下一页
   */
  has_more?: number;

  /**
   *  下一页页码
   */
  page?: number;
}

export interface DouyinHotEventsResultOutput {
  /**
   * 状态码
   * -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 热点列表
   */
  sentences?: Array<DouyinHotEventInfo>;
}

export interface DouyinFriendResultOutput extends ListLevelInfoResponse {
  /**
   *状态码
   * -0正常,非0异常
   */
  code: number;
  /**
   * 消息提示
   */
  msg: string;

  /**
   * 用户/好友列表
   */
  user_list?: Array<DouyinUserInfo>;

  /**
   *是否还有更多
   */
  has_more?: boolean;

  /**
   * 索引游标值
   */
  cursor?: number;
}

export interface DouyinDeleteContentResultOutput {
  /**
   *  状态码
   *  -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
}

export interface DouyinCategoryResultOutput extends ListLevelInfoResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 分类列表
   */
  tag_list?: Array<DouyinCategoryInfo>;
}

export interface DouyinCollectionResultOutput extends ListInfoResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 合集列表
   */
  mix_list?: Array<DouyinCollectionInfo>;
}

export interface DouyinContentListResultOutput {
  /**
   * 状态码
   * 0正常，非0异常
   */
  code: number;

  /**
   * 提示消息
   */
  msg: string;

  data: {
    /**
     * 内容分页最大数
     */
    max_cursor?: number;

    /**
     * 是否有更多数据
     */
    has_more?: boolean;

    /**
     * 内容分页最小数
     */
    min_cursor?: number;

    /**
     * 作品列表
     */
    aweme_list?: Array<DouyinMediaContent>;
  };

  raw?: unknown;
}

export interface DouyinDataOverviewResultOutput {
  code: number;
  msg: string;
  data: {
    option_list?: Array<{
      count: string;
      date: string;
      last_day_incr_rate?: string;
    }>;
    option_type?: number;
  };
  raw?: unknown;
}

/**
 * 抖音单篇数据
 * @param cookie
 * @param item_id 作品id
 * @param publish_time 作品发布时间
 * @param index_type 数据类型（1：播放量，2：完播率，8：平均播放是机舱，3：点赞量，4：评论量，5：分享量，9：新增粉丝量）
 */
export const getDouyinSingleDataOverview = async (
  cookie: string,
  item_id: string,
  publish_time: number,
  index_type: 1 | 2 | 3 | 4 | 5 | 8 | 9 = 1,
) => {
  const result: DouyinSingleDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewSingleResult = await getSingleDataOverviewAsync(cookie, item_id, publish_time, index_type);
    result.code = dataOverviewSingleResult.status_code;
    result.msg = dataOverviewSingleResult.status_msg;
    result.data = dataOverviewSingleResult.trend_data;
    result.raw = dataOverviewSingleResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export const getDouyinShenMingLocationList = (): Array<DouyinShenMingLocation> | null => {
  try {
    const re = JSON.parse(douyinShenMingLocation);
    return re;
  } catch (e) {
    // console.debug(e?.toString());
  }
  return null;
};

export interface DouyinSingleDataOverviewOutput extends BaseResult {
  data?: Array<{
    /**
     * 日期
     */
    key: string;

    /**
     * 对应的值
     */
    value: number;
  }>;
  raw?: unknown;
}

export interface DouyinShenMingLocation {
  code: string;
  /**
   * 地点地理位置id
   */
  geoname_id: number;
  /**
   * 地点级别
   */
  level: number;
  /**
   *
   * 地点名称
   */
  name: string;
  /**
   * 下一级地理信息
   */
  sub_region: Array<DouyinShenMingLocation>;
}

/**
 * 获取挑战数据列表
 * @param cookie
 */
export const getDouyinTiaozhanList = async (cookie: string, keyWord?: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    if (keyWord) {
      const recKeys = await getTiaoZhanRecommendKeyResponse(cookie, keyWord);
      const keys = recKeys?.recommend_list?.map((obj) => obj.text);
      const tiaoResult = await searchTiaoZhanResponse(cookie, keys);
      if (tiaoResult?.flash_mob_info_map?.length) {
        for (const item of tiaoResult.flash_mob_info_map) {
          result.dataList?.push({
            yixiaoerId: item.flash_mob_infos.id,
            yixiaoerName: item.flash_mob_text,
            yixiaoerImageUrl: item?.flash_mob_infos?.cover?.url_list?.length
              ? item.flash_mob_infos.cover.url_list[0]
              : '',
            viewNum: item.flash_mob_infos?.count,
          });
        }
      }
    }
    const tiaoResult = await getTiaoZhanResponse(cookie);
    result.code = tiaoResult?.status_code ?? -1;
    result.msg = tiaoResult?.status_msg;
    if (tiaoResult?.rank_cell_list?.length) {
      for (const item of tiaoResult?.rank_cell_list) {
        result?.dataList?.push({
          yixiaoerId: item?.flash_mob_id,
          yixiaoerName: item?.text,
          yixiaoerImageUrl: item.cover?.url_list?.length ? item.cover.url_list[0] : '',
          //raw: item,
        });
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export interface DouyinTiaozhanList extends BaseResult {
  /**
   * 挑战列表
   */
  rank_cell_list?: Array<DouyinTiaozhanInfo>;
}

/**
 *
 * @param cookie
 * @param days  1: 昨天数据，7: 7天数据，30: 30天数据
 * @param proxy
 */
export const getDouYinOverViewDashboard = async (
  cookie: string,
  days: 1 | 7 | 30 = 30,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
  };

  const names = [
    {
      key: 'playCount',
      name: '播放量',
    },
    {
      key: 'homepageViewCount',
      name: '主页访问',
    },
    {
      key: 'greatCount',
      name: '作品点赞',
    },
    {
      key: 'shareCount',
      name: '作品分享',
    },
    {
      key: 'commentCount',
      name: '作品评论',
    },
    {
      key: 'coverClickRatio',
      name: '封面点击率',
    },
    {
      key: 'netFansCount',
      name: '净增粉丝',
    },
    {
      key: 'cancelFansCount',
      name: '取关粉丝',
    },
    {
      key: 'totalFansCount',
      name: '总粉丝量',
    },
  ];

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const tiaoResult = await getDouYinOverViewDashboardResponse(cookie, days, proxyAgent);
    result.code = tiaoResult?.status_code ?? -1;
    result.msg = tiaoResult?.status_msg;
    if (tiaoResult?.metrics?.length > 0) {
      result.data = [];
      for (const metric of tiaoResult?.metrics) {
        if (!metric?.metric_name) {
          continue;
        }
        const nameItem = names.find((item) => item.name === metric.metric_name);

        const dataItem: DataColumn = {
          key: nameItem?.key ?? metric.english_metric_name,
          name: metric.metric_name,
          value: '-',
          list: [],
        };
        if (dataItem.name === '封面点击率' || dataItem.name === '封面设置率') {
          dataItem.value = `${(metric.metric_value * 100).toFixed(2)}%`;
          newOverView.all.overview[dataItem.key] = parseFloat((metric.metric_value ?? 0).toFixed(4));
        } else {
          dataItem.value = formatNumber(metric.metric_value);
          newOverView.all.overview[dataItem.key] = formatNumberNo(metric.metric_value);
        }
        result.data.push(dataItem);
        if (metric.trends?.length > 0) {
          for (const trendItem of metric.trends) {
            const dateStr = `${trendItem.date_time.substr(0, 4)}-${trendItem.date_time.substr(
              4,
              2,
            )}-${trendItem.date_time.substr(6, 2)}`;

            dataItem.list.push({
              date: new Date(dateStr).getTime(),
              value: trendItem.value,
            });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        } else {
          result.data = [];
        }
      }
    } else {
      result.code = result.code ?? -1;
      result.data = [];
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  if (result?.data && result?.data?.length > 0) {
    result.code = 0;
  } else {
    result.code = -1;
  }
  const dataList = result.data ?? [];
  result.data = [];
  for (const { name, key } of names) {
    const tmp = dataList.find((item) => item.name === name);
    result.data.push(tmp ?? { name: name, key: key, value: '-', list: [] });
  }
  return result;
};

/**
 * 获取抖音指定天数内，最多20条公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getDouYinContentListView = async (
  cookie: string,
  eventCallBack?: EventEmitter,
  days: number = 7,
  maxCount: number = 20,
  isHeader: boolean = false,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountContentListViewOutPut> => {
  const result: AccountContentListViewOutPut = {
    code: 0,
    msg: '',
    data: [],
  };
  result.data = [];
  result.dataList = [];
  try {
    const lastDate = dayjs().add(-days, 'days').toDate();

    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '描述', key: 'desc' },
      { name: '发布时间', key: 'date' },
      { name: '作品类型', key: 'type' },
      { name: '播放', key: 'play' },
      { name: '点赞', key: 'great' },
      { name: '评论', key: 'comment' },
      { name: '分享', key: 'share' },
      { name: '收藏', key: 'collect' },
    ];

    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let pageCor = 0;
    let contentTmpId = '';
    for (let i = 0; i < syncContentMaxPage; i++) {
      const contentList = await getContentListAsync(cookie, pageCor, 1, undefined);
      if (contentList?.aweme_list?.length) {
        if (contentList?.aweme_list[0]?.aweme_id === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.aweme_list[0].aweme_id;
        }
        let j = 0;
        for (const item of contentList?.aweme_list) {
          j++;
          if (item.status_value === 140 || item.status_value === 143) {
            continue;
          }
          const date = dayjs(item.create_time * 1000).toDate();
          if (lastDate > date || result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, result);
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          result.data.push({
            id: item.aweme_id,
            cover: item.Cover?.url_list?.length ? item.Cover.url_list[0] : '',
            desc: item?.desc ?? '',
            date: dateStr,
            type: item.aweme_type == 4 ? 'video' : 'dynamic',
            play: formatNumber(item.statistics?.play_count),
            great: formatNumber(item.statistics.digg_count),
            comment: formatNumber(item.statistics?.comment_count),
            share: formatNumber(item.statistics?.share_count),
            collect: formatNumber(item.statistics?.collect_count),
            pageUrl: item.share_url ?? `https://www.douyin.com/video/${item.aweme_id}`,
          } as never);
          result.dataList.push({
            id: item.aweme_id,
            cover: item.Cover?.url_list?.length ? item.Cover.url_list[0] : '',
            desc: item?.desc ?? '',
            date: dateStr,
            type: item.aweme_type == 4 ? 'video' : 'dynamic',
            play: formatNumberNo(item.statistics?.play_count),
            great: formatNumberNo(item.statistics.digg_count),
            comment: formatNumberNo(item.statistics?.comment_count),
            share: formatNumberNo(item.statistics?.share_count),
            collect: formatNumberNo(item.statistics?.collect_count),
            pageUrl: item.share_url ?? `https://www.douyin.com/video/${item.aweme_id}`,
            //visibleType: item.status?.private_status,
          } as never);
        }
        pageCor = contentList.max_cursor ?? 0;
        if (!pageCor || result.data?.length >= maxCount) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          return result;
        }
        if (eventCallBack) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          result.data = [];
          result.dataList = [];
        }
        await Task.Delay(1000);
      } else {
        if (!result.data.length) {
          result.code = contentList?.status_code ?? -1;
          result.msg = contentList?.status_msg;
        }
        break;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export const getDouYinAnalyzeContentListView = async (
  cookie: string,
  eventCallBack?: EventEmitter,
  days: number = 7,
  maxCount: number = 20,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountContentListViewOutPut> => {
  const result: AccountContentListViewOutPut = {
    code: 0,
    msg: '',
    data: [],
  };
  result.data = [];
  result.dataList = [];
  try {
    const lastDate = dayjs().add(-days, 'days').toDate();

    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let pageCor = 0;
    let contentTmpId = '';
    for (let i = 0; i < syncContentMaxPage; i++) {
      const contentList = await getAnalyzeContentListResponse(cookie, pageCor, webProxy);
      if (contentList?.items?.length) {
        if (contentList?.items[0]?.id === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.items[0].id;
        }
        let j = 0;
        for (const item of contentList?.items) {
          j++;
          const date = dayjs(Number(item.create_time) * 1000).toDate();
          if (lastDate > date || result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            eventCallBack?.emit(syncContentEventName, result);
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          result.dataList.push({
            id: item.id?.toString(),
            cover: item.cover?.url_list[0],
            desc: item?.description ?? '',
            date: dateStr,
            type: item.type === 1 ? 'dynamic' : item.type === 8 ? 'article' : 'video',
            play: formatNumberNo(Number(item.metrics.view_count)),
            finishPlay: formatNumberNo(Number((item.metrics.completion_rate ?? '0').substring(0, 6))),
            finishPlay_5s: formatNumberNo(Number((item.metrics.completion_rate_5s ?? '0').substring(0, 6))),
            coverClickRatio: formatNumberNo(Number((item.metrics.cover_click_rate ?? '0').substring(0, 6))),
            outView_2s: formatNumberNo(Number((item.metrics.bounce_rate_2s ?? '0').substring(0, 6))),
            averagePlayTime: formatNumberNo(Number((item.metrics.avg_view_second ?? '0').substring(0, 4))),
            great: formatNumberNo(Number(item.metrics.like_count)),
            comment: formatNumberNo(Number(item.metrics.comment_count)),
            share: formatNumberNo(Number(item.metrics.share_count)),
            collect: formatNumberNo(Number(item.metrics.favorite_count)),
            homepageViewCount: formatNumberNo(Number(item.metrics.homepage_visit_count)),
            addFans: formatNumberNo(Number(item.metrics.subscribe_count)),
            pageUrl: `https://www.douyin.com/video/${item.id}`,
          });
        }
        pageCor = contentList.has_more ? Number(contentList.max_cursor) : 0;
        if (contentList?.has_more === false || result.data?.length >= maxCount) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          return result;
        }
        if (eventCallBack) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          result.data = [];
          result.dataList = [];
        }
        await Task.Delay(1000);
      } else {
        if (!result.data.length) {
          result.code = contentList?.status_code ?? -1;
          result.msg = contentList?.status_msg;
        }
        break;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 * 获取具有商品推广的地址下商家和商品信息
 * @param cookie
 * @param poiId 地址的poi_id
 */
export const getDouYinLocationGoodsDetail = async (
  cookie: string,
  poiId: string,
): Promise<DouYinLocationGoodsDetailOutPut> => {
  const result: DouYinLocationGoodsDetailOutPut = {
    code: 0,
    msg: '',
  };
  try {
    const goodsResult = await getLocationGoodsInfoResponse(cookie, poiId);
    result.code = goodsResult?.status_code ?? -1;
    result.msg = goodsResult.status_msg;
    result.data = goodsResult.cps_detail;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export interface DouYinLocationGoodsDetailOutPut extends BaseResult {
  /**
   * 地点下商家/商品详情
   */
  data?: DouYinLocationGoodsDetail;
}

export const getDouyinLocationGoodsList = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxy?: KuaiDaiLiProxy,
  coords?: GeoLocation,
): Promise<ListGoodsInfoResponse> => {
  const result: ListGoodsInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const locationResult = await getGoodsLocation(cookie, '', locationType, pageNum, webProxy, coords, 1);
    const cityCode =
      locationResult?.poi_list?.length > 0
        ? locationResult.poi_list[0]?.address_info?.city_code
        : locationResult?.current_locs?.length
        ? locationResult.current_locs[0]?.address_info?.city_code
        : locationResult?.user_interest_city_code_list?.length
        ? locationResult?.user_interest_city_code_list[0]?.code
        : '000000';

    const goodsResult = await getLocationGoodsListResponse(cookie, keyWord ?? '', cityCode, (pageNum - 1) * 10, 10);
    result.code = goodsResult.status_code ?? -1;
    result.msg = goodsResult.status_msg;
    if (goodsResult?.cps_spu_list?.length) {
      result.dataList = goodsResult?.cps_spu_list?.map((obj) => ({
        yixiaoerId: obj.spu_id?.toString(),
        yixiaoerName: obj.spu_name,
        yixiaoerDesc: obj.poi?.poi_name,
        yixiaoerImageUrl: obj.image_url?.url_list?.length ? obj.image_url.url_list[0] : '',
        price: obj.actual_price,
        earnPrice: obj.earn_price,
        images: obj.image_url?.url_list.map((img) => img),
        raw: obj,
      }));
      if (goodsResult?.has_more === 1) {
        result.nextPage = (pageNum + 1).toString();
      } else {
        result.nextPage = undefined;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
let checkIndex = 1;
export const checkDouYinLogin = async (cookie: string, proxy?: IWebProxy): Promise<BaseResult> => {
  const result: BaseResult = {
    code: -1,
    msg: '',
  };
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    //基础检测
    const pcRe = await getPCUserInfo(cookie, webProxy);
    if ((pcRe?.status_code != undefined && pcRe.status_code != null) || pcRe.status_code === 0) {
      result.code = pcRe?.status_code;
      result.msg = pcRe?.status_ms;
      return result;
    }
    checkIndex++;
    if (checkIndex % 2 === 0) {
      console.log('第1渠道');
      const crRe = await getCreatorUserInfo(cookie, webProxy);
      if ((crRe?.status_code != undefined && crRe.status_code != null) || crRe.status_code === 0) {
        result.code = crRe?.status_code;
        result.msg = crRe?.status_msg;
        return result;
      }
    } else if (checkIndex % 3 === 0) {
      console.log('第2渠道');
      const crRe = await getXiGuaUserInfo(cookie, webProxy);
      if ((crRe?.status_code != undefined && crRe.status_code != null) || crRe.status_code === 0) {
        result.code = crRe?.status_code;
        result.msg = crRe?.status_ms;
        return result;
      }
    } else if (checkIndex % 4 === 0) {
      console.log('第3渠道');
      const crRe = await getMediaUserInfo(cookie, webProxy);
      if ((crRe?.status_code != undefined && crRe.status_code != null) || crRe.status_code === 0) {
        result.code = crRe?.status_code;
        result.msg = crRe?.status_msg;
        return result;
      }
    } else {
      console.log('第4渠道');
      const crRe = await getMediaUserAnchor(cookie, webProxy);
      if ((crRe?.status_code != undefined && crRe.status_code != null) || crRe.status_code === 0) {
        result.code = crRe?.status_code;
        result.msg = crRe?.status_msg;
        return result;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    result.code = errorCode.exception;
  }

  return result;
};
