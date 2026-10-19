import { BadRequestException, UnknownException } from '../../error';
import { $http, HttpConfig } from '../../http';
import { AxiosInstance, AxiosProxyConfig, AxiosResponse } from 'axios';
import * as buffer from 'buffer';
import crc from 'crc';
import { CalcSha256Hex, uploadedImageInfo } from '../douyin/douyin-base.service';
import { DouyinVideoTaskInput, UploadPartResult } from '../douyin/douyin-video';
import { htmlDecode, isJson, logger, Random } from '../../utils';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '../../htmlAgilityPack';

import crypto from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getDouyinTopics } from './douyin-common';
import { encryptParams, getSign } from '@/media-platform/douyin/douyin-base';
import { DouYinSyncAppInfo } from '@/media-platform/douyin/douyin-user.service';
import { DouYinGameAnchorContent, DouYinGameShortVideoPoint } from '@/media-platform/douyin/douyin-game.service';

/**
 * 组装发布参数
 * @param taskData
 * @param coverInfo
 * @param videoInfo
 * @param shopDraftId 商品挂载id
 * @param cookie
 */
const buildPostData = async (
  taskData: DouyinVideoTaskInput,
  coverInfo: uploadedImageInfo,
  videoInfo: uploadedVideoInfo,
  shopDraftId: string,
  cookie: string,
): Promise<string> => {
  const argsList: Array<string> = [];
  argsList.push('video_id=' + videoInfo.Result.Results[0].Vid);
  argsList.push('ifLongTitle=true');
  argsList.push('poster=' + encodeURIComponent(coverInfo.Result.Results[0].Uri));
  argsList.push('cover_optimized_uri=' + encodeURIComponent(coverInfo.Result.Results[0].Uri));
  argsList.push('cover_text_uri=');
  argsList.push('cover_text=');
  argsList.push('poster_delay=0');
  let text = '';

  const topicNames: Array<object> = [];
  const topicIds: Array<number> = [];
  const mentions: Array<string> = [];

  text = taskData.text ?? '';

  let titleLength = 0;

  //标题
  if (taskData.title) {
    argsList.push(`item_title=${encodeURIComponent(taskData.title)}`);
    titleLength = taskData.title.length + 1;
  }

  //兼容话题好友活动中间插入
  if (taskData.text?.includes('<p') && taskData.text?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.text);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      ////替换缓存
      const tmpDataMap = new Map<string, string>();

      let iCount = 0;
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        let topicNum = 0;
        for (const item of topics) {
          if (topicNum >= 5) {
            item.parentNode?.removeChild(item);
            continue;
          }
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            const topicsTmp = await getDouyinTopics(cookie, htmlDecode(text ?? ''));
            if (topicsTmp?.dataList?.length) {
              topicStr = JSON.stringify(topicsTmp.dataList[0].raw);
            } else {
              item.innerHTML = '';
              continue;
            }
          }
          iCount++;
          topicNum++;
          const key = `{tmp_t${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, topicStr);
        }
      }

      //活动
      const activities = html.DocumentNode.SelectNodes('//activity');
      if (activities?.length > 0) {
        for (const item of activities) {
          iCount++;
          const activityStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!activityStr?.startsWith('{')) {
            continue;
          }
          const key = `{tmp_a${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, activityStr);
        }
      }

      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          iCount++;
          const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!friendStr?.startsWith('{')) {
            continue;
          }
          const key = `{tmp_f${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, friendStr);
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      //缓存替换
      const regex = /\{tmp_[^}]+\}/g;

      const matches: string[] = [];

      let match;
      while ((match = regex.exec(newText)) !== null) {
        matches.push(match[0]);
      }
      const activityIds: Array<number> = [];
      for (const tmpKey of matches) {
        const jo = JSON.parse(tmpDataMap.get(tmpKey) ?? '{}');
        const indexNum = newText.indexOf(tmpKey);
        if (tmpKey.includes('tmp_t')) {
          const topicOriName = jo.cha_name.trimStart();
          const replaceName = `#${topicOriName} `;
          newText = newText.replace(tmpKey, replaceName);
          const topic = {};
          topic['start'] = titleLength + indexNum;
          topic['type'] = 1;
          topic['user_id'] = '';
          topic['hashtag_id'] = jo.cid ? parseInt(jo.cid) : 0;
          topic['end'] = titleLength + indexNum + replaceName.length - 1;
          topic['hashtag_name'] = topicOriName;
          topic['caption_start'] = indexNum;
          topic['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(topic);
          if (jo?.cid) {
            topicIds.push(parseInt(jo?.cid));
          }
        } else if (tmpKey.includes('tmp_a')) {
          const activityOriName = (jo.challenge[0] ?? jo.activity_name).trimStart();

          const replaceName = `#${activityOriName} `;
          newText = newText.replace(tmpKey, replaceName);

          const activity = {};
          activity['start'] = titleLength + indexNum;
          activity['type'] = 1;
          activity['user_id'] = '';
          activity['hashtag_id'] = jo.challenge_ids[0];
          activity['end'] = titleLength + indexNum + replaceName.length - 1;
          activity['hashtag_name'] = activityOriName;
          activity['caption_start'] = indexNum;
          activity['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(activity);
          if (jo.challenge_ids[0]) {
            topicIds.push(jo.challenge_ids[0]);
            activityIds.push(jo.challenge_ids[0]);
          }
        } else if (tmpKey.includes('tmp_f')) {
          const friendOriName = jo?.nickname.trimStart();

          const replaceName = `@${friendOriName} `;
          newText = newText.replace(tmpKey, replaceName);

          const friend = {};
          friend['start'] = titleLength + indexNum;
          friend['type'] = 0;
          friend['user_id'] = jo?.uid?.toString();
          friend['end'] = titleLength + indexNum + replaceName.length - 1;
          friend['hashtag_name'] = '';
          friend['caption_start'] = indexNum;
          friend['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(friend);
          mentions.push(jo?.uid?.toString());
        }
      }

      argsList.push(`activity=${encodeURIComponent(JSON.stringify(activityIds))}`);
      text = htmlDecode(newText);
    } else {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          const itemHtmlStr = item.toString();
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            const topicsTmp = await getDouyinTopics(cookie, text ?? '');
            if (topicsTmp?.dataList?.length) {
              topicStr = JSON.stringify(topicsTmp.dataList[0].raw);
            }
          }
          const topicItem = topicStr?.startsWith('{') ? JSON.parse(topicStr) : null;
          if (!topicItem) {
            continue;
          }
          const topicIndex = text.indexOf(itemHtmlStr);
          if (topicIndex < 0) {
            continue;
          }

          const topicShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, topicShowName);

          const topicOriName = topicItem.cha_name.trimStart();
          const topic = {};
          topic['start'] = titleLength + topicIndex;
          topic['type'] = 1;
          topic['user_id'] = '';
          topic['hashtag_id'] = topicItem.cid ? parseInt(topicItem.cid) : 0;
          topic['end'] = titleLength + topicIndex + topicShowName.length;
          topic['hashtag_name'] = topicOriName;
          topic['caption_start'] = topicIndex;
          topic['caption_end'] = topicIndex + topicShowName.length;
          topicNames.push(topic);
          if (topicItem?.cid) {
            topicIds.push(parseInt(topicItem?.cid));
          }
        }
      }

      //活动
      const activitys = html.DocumentNode.SelectNodes('//activity');
      if (activitys?.length > 0) {
        const activityIds: Array<number> = [];
        for (const item of activitys) {
          const itemHtmlStr = item.toString();
          const activityStr = htmlDecode(item.getAttribute('raw') ?? '');
          const activityItem = activityStr?.startsWith('{') ? JSON.parse(activityStr) : null;
          if (!activityItem) {
            continue;
          }
          const activityIndex = text.indexOf(itemHtmlStr);
          if (activityIndex < 0) {
            continue;
          }

          const activityShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, activityShowName);

          const activityOriName = activityItem.cha_name.trimStart();
          const activity = {};
          activity['start'] = titleLength + activityIndex;
          activity['type'] = 1;
          activity['user_id'] = '';
          activity['hashtag_id'] = activityItem.challenge_ids[0];
          activity['end'] = titleLength + activityIndex + activityShowName.length;
          activity['hashtag_name'] = activityOriName;
          activity['caption_start'] = activityIndex;
          activity['caption_end'] = activityIndex + activityShowName.length;
          topicNames.push(activity);
          if (activityItem.challenge_ids[0]) {
            topicIds.push(activityItem.challenge_ids[0]);
            activityIds.push(activityItem.challenge_ids[0]);
          }
        }
        argsList.push(`activity=${encodeURIComponent(JSON.stringify(activityIds))}`);
      }

      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          const itemHtmlStr = item.toString();
          const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
          const friendItem = friendStr?.startsWith('{') ? JSON.parse(friendStr) : null;
          if (!friendItem) {
            continue;
          }
          const friendIndex = text.indexOf(itemHtmlStr);
          if (friendIndex < 0) {
            continue;
          }

          const friendShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, friendShowName);
          const friend = {};
          friend['start'] = titleLength + friendIndex;
          friend['type'] = 0;
          friend['user_id'] = friendItem?.uid?.toString();
          friend['end'] = titleLength + friendIndex + friendShowName.length;
          friend['hashtag_name'] = '';
          friend['caption_start'] = friendIndex;
          friend['caption_end'] = friendIndex + friendShowName.length;
          topicNames.push(friend);
          mentions.push(friendItem?.uid?.toString());
        }
      }
    }
  } else {
    let titleIndex = text.length;

    //话题
    if (taskData.challenges && taskData.challenges?.length > 0) {
      for (const item of taskData.challenges) {
        const name = item.cha_name?.replace(/#/g, '');
        text = text + '#' + name + ' ';

        const topic = {};
        topic['start'] = titleLength + titleIndex;
        topic['type'] = 1;
        topic['user_id'] = '';
        topic['hashtag_id'] = item.cid ? parseInt(item.cid) : 0;
        topic['end'] = titleLength + titleIndex + name.length + 1;
        topic['hashtag_name'] = name;
        topic['caption_start'] = titleIndex;
        topic['caption_end'] = titleIndex + name.length + 1;
        topicNames.push(topic);
        if (item?.cid) {
          topicIds.push(parseInt(item?.cid));
        }
        titleIndex = text.length;
      }
    }

    //活动
    if (taskData.activity && taskData.activity?.length > 0) {
      argsList.push(`activity=${encodeURIComponent(JSON.stringify(taskData.activity.map((x) => x.challenge_ids[0])))}`);
      for (const item of taskData.activity) {
        const name = item.challenge[0] ?? item.activity_name?.replace(/#/g, '').split(' ')[0];
        text = text + '#' + name + ' ';

        const topic = {};
        topic['start'] = titleLength + titleIndex;
        topic['type'] = 1;
        topic['user_id'] = '';
        topic['hashtag_id'] = item.challenge_ids[0];
        topic['end'] = titleLength + titleIndex + name.length + 1;
        topic['hashtag_name'] = name;
        topic['caption_start'] = titleIndex;
        topic['caption_end'] = titleIndex + name.length + 1;
        topicNames.push(topic);
        if (item?.challenge_ids[0]) {
          topicIds.push(item?.challenge_ids[0]);
        }
        titleIndex = text.length;
      }
    }

    //好友;
    if (taskData.mentions && taskData.mentions?.length > 0) {
      for (const item of taskData.mentions) {
        const name = item?.nickname?.toString();
        text = text + '@' + name + ' ';

        const user = {};
        user['start'] = titleLength + titleIndex;
        user['type'] = 0;
        user['user_id'] = item?.uid?.toString();
        user['end'] = titleLength + titleIndex + name?.length + 2;
        user['hashtag_name'] = '';
        user['caption_start'] = titleIndex;
        user['caption_end'] = titleIndex + name?.length + 2;
        topicNames.push(user);
        mentions.push(item?.uid?.toString());
        titleIndex = text.length;
      }
    }
  }

  //好友
  argsList.push(`mentions=${encodeURIComponent(JSON.stringify(mentions))}`);

  if (topicIds?.length > 0) {
    argsList.push(`challenges=${encodeURIComponent(JSON.stringify(topicIds))}`);
    const hashtag_source: Array<string> = [];
    for (let i = 0; i < topicIds.length; i++) {
      hashtag_source.push('search'); //话题来源，默认都是搜索而来
    }
    argsList.push(`hashtag_source=${encodeURIComponent(hashtag_source.join('/'))}`);
  } else {
    argsList.push('challenges=%5B%5D');
    argsList.push('hashtag_source=%22%22');
  }

  //话题
  if (topicNames?.length > 0) {
    argsList.push(`text_extra=${encodeURIComponent(JSON.stringify(topicNames))}`);
  } else {
    argsList.push('text_extra=%5B%5D');
  }

  //同步
  argsList.push(`should_sync=${taskData.should_sync ?? ''}`);
  if (taskData.should_sync) {
    argsList.push(`xigua_params=${encodeURIComponent('{"is_mvp_publish":true,"is_original":false}')}`);
  }

  //地点-推广
  if (taskData.location?.isCommerceIntention && (taskData.location?.poiId || taskData.poi_id)) {
    //    primary_recommend_product_type: 1;
    const anchor_content = {};
    if (!taskData.location?.cpsInfo) {
      anchor_content['primary_recommend_product_type'] = 1;
    } else {
      if (taskData.location?.cpsInfo.cps_choose_scence === 0) {
        taskData.location.cpsInfo.cps_choose_source_list = [];
        taskData.location.cpsInfo.cps_choose_mini_app_list = [];
      }
      const cpsInfo = {
        cps_choose_scence: taskData.location.cpsInfo.cps_choose_scence,
        cps_choose_source_list: taskData.location.cpsInfo.cps_choose_source_list,
        cps_choose_mini_app_list: taskData.location.cpsInfo.cps_choose_mini_app_list,
      };
      anchor_content['cps_info'] = JSON.stringify(cpsInfo);
    }
    anchor_content['recommend_poi_group'] = taskData.location?.recommendPoiGroup ?? false;
    anchor_content['is_commerce_intention'] = true;
    argsList.push(`anchor_content=${encodeURIComponent(JSON.stringify(anchor_content))}`);
    argsList.push(`poi_id=${taskData?.location?.poiId ?? taskData.poi_id}`);
    argsList.push(`poi_name=${encodeURIComponent(taskData?.location?.poiName ?? taskData.poi_name ?? '')}`);
  } else if (taskData.poi_id || taskData?.location?.poiId) {
    //{"is_commerce_intention":true,"recommend_poi_group":true,"cps_info":"{\"cps_choose_scence\":1,\"cps_choose_source_list\":[100006399],\"cps_choose_mini_app_list\":[\"tt99daef6706e36ff401\"]}"}
    argsList.push(`anchor_content=${encodeURIComponent('{"is_commerce_intention":false}')}`);
    argsList.push(`poi_id=${taskData?.location?.poiId ?? taskData.poi_id}`);
    argsList.push(`poi_name=${encodeURIComponent(taskData?.location?.poiName ?? taskData.poi_name ?? '')}`);
  }

  //描述
  let finalText = text;
  if (taskData.title) {
    finalText = `${taskData.title} ${text}`;
  }
  argsList.push(`text=${encodeURIComponent(finalText)}`);
  if (text) {
    argsList.push(`caption=${encodeURIComponent(text)}`);
    argsList.push(`chapter=${encodeURIComponent('{"chapter_details":[],"chapter_type":0}')}`);
  }

  argsList.push('record=null');
  argsList.push('source_info=');
  argsList.push('music_source=0');
  argsList.push('music_id=');
  //可见类型
  argsList.push(`visibility_type=${taskData.visibility_type ?? 0}`);
  //允许保存视频
  argsList.push(`download=${taskData.download ?? 0}`);
  argsList.push('upload_source=1&is_preview=0');

  //创作申明

  if (taskData.declareInfo?.choose_value) {
    if (taskData.declareInfo?.user_declare_place) {
      taskData.declareInfo.user_declare_place = taskData.declareInfo.user_declare_place.replace('中国', '')?.trim();
      const seps = taskData.declareInfo.user_declare_place?.split(' ');
      if (seps.length == 2 && seps[0] == seps[1]) {
        taskData.declareInfo.user_declare_place = seps[0];
      }
    }
    argsList.push(`user_declare_info=${encodeURIComponent(JSON.stringify(taskData.declareInfo))}`);
  }

  //关联热点
  if (taskData.hot_sentence && taskData.hot_sentence?.length > 0) {
    argsList.push(`hot_sentence=${encodeURIComponent(taskData.hot_sentence) ?? ''}`);
  }

  //分类
  let creator_self_tags = {};
  if (taskData.tag_level1_id && taskData.tag_level1_id > 0) {
    creator_self_tags = {
      tag_level1_id: taskData.tag_level1_id,
      tag_level2_id: taskData.tag_level2_id ?? 0,
      tag_level3_id: [],
      tag_level3_name: [],
    };
  }

  //标签 ,暂时不适用

  //加入分类
  if (creator_self_tags && Object.keys(creator_self_tags).length > 0) {
    argsList.push(`creator_self_tags=${encodeURIComponent(JSON.stringify(creator_self_tags))}`);
  }

  //合集
  if (taskData.mix_id && taskData.mix_id.length > 0) {
    argsList.push(`mix_id=${taskData.mix_id}`);
    argsList.push(`mix_order=${taskData.mix_order}`);
  }

  //定时发布
  if (taskData.timing && taskData.timing > 0) {
    if (taskData.timing.toString().length == 13) {
      argsList.push(`timing=${taskData.timing / 1000}`);
    } else {
      argsList.push(`timing=${taskData.timing}`);
    }
  }

  //小程序
  if (taskData.miniAppInfo && taskData.miniAppInfo.id) {
    const anchor = {
      content: taskData.miniAppInfo.extra,
      type: taskData.miniAppInfo.type,
      id: taskData.miniAppInfo.id,
    };
    argsList.push('anchor=' + encodeURIComponent(JSON.stringify(anchor)));
  }

  //挂载商品
  if (shopDraftId) {
    argsList.push(`shop_draft_id=${shopDraftId}`);
  }

  //挑战
  if (taskData.flashMobInfo?.yixiaoerId) {
    const flashInfo = [
      {
        type: 24,
        index: 0,
        track_info: '[{"scale":0.8,"x":0.31,"y":0.22,"r":0,"s":0.8}]',
        text_info: taskData.flashMobInfo.yixiaoerName,
        image_index: 0,
        flash_mob_info: { id: taskData.flashMobInfo.yixiaoerId, text: taskData.flashMobInfo.yixiaoerName },
      },
    ];
    argsList.push(`interaction_stickers=${encodeURIComponent(JSON.stringify(flashInfo))}`);
  }

  return argsList.join('&');
};

const buildPostData_v2 = async (
  taskData: DouyinVideoTaskInput,
  coverInfo: uploadedImageInfo,
  videoInfo: uploadedVideoInfo,
  shopDraftId: string,
  cookie: string,
  hCoverInfo?: uploadedImageInfo | null,
): Promise<string> => {
  const postData = {
    item: {
      common: {
        text: '',
        caption: '',
        item_title: taskData.title ?? '',
        activity: '[]',
        text_extra: '',
        challenges: '',
        mentions: '',
        hashtag_source: '',
        hot_sentence: '',
        visibility_type: taskData.visibility_type ?? 0,
        download: taskData.download ?? 1,
        timing: taskData.timing ?? 0,
        creation_id: `jdhajhsh${Date.now()}`,
        media_type: 4,
        video_id: videoInfo?.Result?.Results[0]?.Vid,
        music_source: 0,
        music_id: taskData.musicInfo?.music_id ?? taskData.musicInfo?.id_str,
        music_end_time: (taskData.musicInfo?.duration ?? 1) * 1000,
      },
      cooperation: { co_info: '' },
      cover: {
        custom_cover_image_height: taskData?.cover?.height ?? 335,
        custom_cover_image_width: taskData?.cover?.width ?? 251,
        poster: coverInfo?.Result?.Results[0]?.Uri,
        poster_delay: 0,
        horizontal_custom_cover_image_uri: hCoverInfo?.Result?.Results[0]?.Uri ?? coverInfo?.Result?.Results[0]?.Uri,
        horizontal_cover_tsp: 0,
        horizontal_custom_cover_image_height: taskData?.horizontalCover?.height ?? taskData?.cover?.height ?? 335,
        horizontal_custom_cover_image_width: taskData?.horizontalCover?.width ?? taskData?.cover?.width ?? 447,
        cover_tools_extend_info: '',
        cover_tools_info: '',
      },
      mix: {},
      chapter: {
        chapter: `{"chapter_abstract":"","chapter_details":[],"chapter_type":1,"chapter_tools_info":{"chapter_recommend_detail":[],"chapter_recommend_abstract":"","chapter_source":2,"chapter_recommend_type":-2,"create_date":${
          Date.now() / 1000
        },"is_pc":"1","is_pre_generated":"0","is_syn":"1"}}`,
      },
      anchor: {},
      sync: {
        limit_client_keys: undefined,
        should_sync: taskData.should_sync === 1 ? true : false,
        sync_to_toutiao: 0,
      },
      open_platform: {},
      assistant: {
        is_preview: 0,
        is_post_assistant: 1,
      },
      declare: {
        user_declare_info: '{}',
      },
    },
  };

  let text = '';

  const topicNames: Array<object> = [];
  const topicIds: Array<number> = [];
  const mentions: Array<string> = [];

  text = taskData.text ?? '';

  let titleLength = 0;

  //共创
  if (taskData.cooperation_info?.length) {
    const infoStr: Array<string> = [];
    for (const coop of taskData.cooperation_info) {
      infoStr.push(...coop.userIds.map((x) => `${x}_0_${coop?.typeId ?? ''}`));
    }
    postData.item.cooperation.co_info = JSON.stringify(infoStr);
  } else {
    delete (postData.item as any).cooperation;
  }

  //标题
  if (taskData.title) {
    titleLength = taskData.title.length + 1;
  }

  //兼容话题好友活动中间插入
  if (taskData.text?.includes('<p') && taskData.text?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.text);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      ////替换缓存
      const tmpDataMap = new Map<string, string>();

      let iCount = 0;
      let topicNum = 0;
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          if (topicNum >= 5) {
            item.parentNode?.removeChild(item);
            continue;
          }
          let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            const topicsTmp = await getDouyinTopics(cookie, htmlDecode(text ?? ''));
            if (topicsTmp?.dataList?.length) {
              topicStr = JSON.stringify(topicsTmp.dataList[0]);
            } else {
              item.innerHTML = '';
              continue;
            }
          }
          iCount++;
          topicNum++;
          const key = `{tmp_t${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, topicStr);
        }
      }

      //活动
      const activities = html.DocumentNode.SelectNodes('//activity');
      if (activities?.length > 0) {
        for (const item of activities) {
          if (topicNum >= 5) {
            item.parentNode?.removeChild(item);
            continue;
          }

          const activityStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!activityStr?.startsWith('{')) {
            continue;
          }
          iCount++;
          topicNum++;
          const key = `{tmp_a${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, activityStr);
        }
      }

      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          iCount++;
          const friendStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!friendStr?.startsWith('{')) {
            continue;
          }
          const key = `{tmp_f${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, friendStr);
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      //缓存替换
      const regex = /\{tmp_[^}]+\}/g;

      const matches: string[] = [];

      let match;
      while ((match = regex.exec(newText)) !== null) {
        matches.push(match[0]);
      }
      const activityIds: Array<number> = [];
      for (const tmpKey of matches) {
        const jo = JSON.parse(tmpDataMap.get(tmpKey) ?? '{}')?.raw;
        const indexNum = newText.indexOf(tmpKey);
        if (tmpKey.includes('tmp_t')) {
          const topicOriName = jo?.cha_name?.trimStart();
          if (!topicOriName) {
            throw new Error('存在不支持的话题');
          }
          const replaceName = `#${topicOriName} `;
          newText = newText.replace(tmpKey, replaceName);
          const topic = {};
          topic['start'] = titleLength + indexNum;
          topic['type'] = 1;
          topic['user_id'] = '';
          topic['hashtag_id'] = jo.cid ? parseInt(jo.cid) : 0;
          topic['end'] = titleLength + indexNum + replaceName.length - 1;
          topic['hashtag_name'] = topicOriName;
          topic['caption_start'] = indexNum;
          topic['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(topic);
          if (jo?.cid) {
            topicIds.push(parseInt(jo?.cid));
          }
        } else if (tmpKey.includes('tmp_a')) {
          const activityOriName = (jo.challenge[0] ?? jo.activity_name).trimStart();

          const replaceName = `#${activityOriName} `;
          newText = newText.replace(tmpKey, replaceName);

          const activity = {};
          activity['start'] = titleLength + indexNum;
          activity['type'] = 1;
          activity['user_id'] = '';
          activity['hashtag_id'] = jo.challenge_ids[0];
          activity['end'] = titleLength + indexNum + replaceName.length - 1;
          activity['hashtag_name'] = activityOriName;
          activity['caption_start'] = indexNum;
          activity['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(activity);
          if (jo.challenge_ids[0]) {
            topicIds.push(jo.challenge_ids[0]);
            activityIds.push(jo.challenge_ids[0]);
          }
        } else if (tmpKey.includes('tmp_f')) {
          const friendOriName = jo?.nickname.trimStart();

          const replaceName = `@${friendOriName} `;
          newText = newText.replace(tmpKey, replaceName);

          const friend = {};
          friend['start'] = titleLength + indexNum;
          friend['type'] = 0;
          friend['user_id'] = jo?.uid?.toString();
          friend['end'] = titleLength + indexNum + replaceName.length - 1;
          friend['hashtag_name'] = '';
          friend['caption_start'] = indexNum;
          friend['caption_end'] = indexNum + replaceName.length - 1;
          topicNames.push(friend);
          mentions.push(jo?.uid?.toString());
        }
      }

      //argsList.push(`activity=${encodeURIComponent(JSON.stringify(activityIds))}`);
      postData.item.common.activity = JSON.stringify(activityIds ?? []);
      text = htmlDecode(newText);
    } else {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          const itemHtmlStr = item.toString();
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            const topicsTmp = await getDouyinTopics(cookie, text ?? '');
            if (topicsTmp?.dataList?.length) {
              topicStr = JSON.stringify(topicsTmp.dataList[0]);
            }
          }
          const topicItem = topicStr?.startsWith('{') ? JSON.parse(topicStr)?.raw : null;
          if (!topicItem) {
            continue;
          }
          const topicIndex = text.indexOf(itemHtmlStr);
          if (topicIndex < 0) {
            continue;
          }

          const topicShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, topicShowName);

          const topicOriName = topicItem.cha_name.trimStart();
          const topic = {};
          topic['start'] = titleLength + topicIndex;
          topic['type'] = 1;
          topic['user_id'] = '';
          topic['hashtag_id'] = topicItem.cid ? parseInt(topicItem.cid) : 0;
          topic['end'] = titleLength + topicIndex + topicShowName.length;
          topic['hashtag_name'] = topicOriName;
          topic['caption_start'] = topicIndex;
          topic['caption_end'] = topicIndex + topicShowName.length;
          topicNames.push(topic);
          if (topicItem?.cid) {
            topicIds.push(parseInt(topicItem?.cid));
          }
        }
      }

      //活动
      const activitys = html.DocumentNode.SelectNodes('//activity');
      if (activitys?.length > 0) {
        const activityIds: Array<number> = [];
        for (const item of activitys) {
          const itemHtmlStr = item.toString();
          const activityStr = htmlDecode(item.getAttribute('raw') ?? '');
          const activityItem = activityStr?.startsWith('{') ? JSON.parse(activityStr)?.raw : null;
          if (!activityItem) {
            continue;
          }
          const activityIndex = text.indexOf(itemHtmlStr);
          if (activityIndex < 0) {
            continue;
          }

          const activityShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, activityShowName);

          const activityOriName = activityItem.cha_name.trimStart();
          const activity = {};
          activity['start'] = titleLength + activityIndex;
          activity['type'] = 1;
          activity['user_id'] = '';
          activity['hashtag_id'] = activityItem.challenge_ids[0];
          activity['end'] = titleLength + activityIndex + activityShowName.length;
          activity['hashtag_name'] = activityOriName;
          activity['caption_start'] = activityIndex;
          activity['caption_end'] = activityIndex + activityShowName.length;
          topicNames.push(activity);
          if (activityItem.challenge_ids[0]) {
            topicIds.push(activityItem.challenge_ids[0]);
            activityIds.push(activityItem.challenge_ids[0]);
          }
        }
        postData.item.common.activity = JSON.stringify(activityIds ?? []);
      }

      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          const itemHtmlStr = item.toString();
          const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
          const friendItem = friendStr?.startsWith('{') ? JSON.parse(friendStr)?.raw : null;
          if (!friendItem) {
            continue;
          }
          const friendIndex = text.indexOf(itemHtmlStr);
          if (friendIndex < 0) {
            continue;
          }

          const friendShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, friendShowName);
          const friend = {};
          friend['start'] = titleLength + friendIndex;
          friend['type'] = 0;
          friend['user_id'] = friendItem?.uid?.toString();
          friend['end'] = titleLength + friendIndex + friendShowName.length;
          friend['hashtag_name'] = '';
          friend['caption_start'] = friendIndex;
          friend['caption_end'] = friendIndex + friendShowName.length;
          topicNames.push(friend);
          mentions.push(friendItem?.uid?.toString());
        }
      }
    }
  } else {
    let titleIndex = text.length;

    //话题
    if (taskData.challenges && taskData.challenges?.length > 0) {
      for (const item of taskData.challenges) {
        const name = item.cha_name?.replace(/#/g, '');
        text = text + '#' + name + ' ';

        const topic = {};
        topic['start'] = titleLength + titleIndex;
        topic['type'] = 1;
        topic['user_id'] = '';
        topic['hashtag_id'] = item.cid ? parseInt(item.cid) : 0;
        topic['end'] = titleLength + titleIndex + name.length + 1;
        topic['hashtag_name'] = name;
        topic['caption_start'] = titleIndex;
        topic['caption_end'] = titleIndex + name.length + 1;
        topicNames.push(topic);
        if (item?.cid) {
          topicIds.push(parseInt(item?.cid));
        }
        titleIndex = text.length;
      }
    }

    //活动
    if (taskData.activity && taskData.activity?.length > 0) {
      postData.item.common.activity = JSON.stringify(taskData.activity.map((x) => x.challenge_ids[0]));
      for (const item of taskData.activity) {
        const name = item.challenge[0] ?? item.activity_name?.replace(/#/g, '').split(' ')[0];
        text = text + '#' + name + ' ';

        const topic = {};
        topic['start'] = titleLength + titleIndex;
        topic['type'] = 1;
        topic['user_id'] = '';
        topic['hashtag_id'] = item.challenge_ids[0];
        topic['end'] = titleLength + titleIndex + name.length + 1;
        topic['hashtag_name'] = name;
        topic['caption_start'] = titleIndex;
        topic['caption_end'] = titleIndex + name.length + 1;
        topicNames.push(topic);
        if (item?.challenge_ids[0]) {
          topicIds.push(item?.challenge_ids[0]);
        }
        titleIndex = text.length;
      }
    }

    //好友;
    if (taskData.mentions && taskData.mentions?.length > 0) {
      for (const item of taskData.mentions) {
        const name = item?.nickname?.toString();
        text = text + '@' + name + ' ';

        const user = {};
        user['start'] = titleLength + titleIndex;
        user['type'] = 0;
        user['user_id'] = item?.uid?.toString();
        user['end'] = titleLength + titleIndex + name?.length + 2;
        user['hashtag_name'] = '';
        user['caption_start'] = titleIndex;
        user['caption_end'] = titleIndex + name?.length + 2;
        topicNames.push(user);
        mentions.push(item?.uid?.toString());
        titleIndex = text.length;
      }
    }
  }

  //好友
  postData.item.common.mentions = JSON.stringify(mentions);

  if (topicIds?.length > 0) {
    postData.item.common.challenges = JSON.stringify(topicIds);
    const hashtag_source: Array<string> = [];
    for (let i = 0; i < topicIds.length; i++) {
      hashtag_source.push('search'); //话题来源，默认都是搜索而来
    }
    postData.item.common.hashtag_source = hashtag_source.join('/');
  } else {
    postData.item.common.challenges = '[]';
    postData.item.common.hashtag_source = '';
  }

  //话题
  if (topicNames?.length > 0) {
    postData.item.common.text_extra = JSON.stringify(topicNames);
  } else {
    postData.item.common.text_extra = '[]';
  }

  //同步
  if (taskData.should_sync) {
    //argsList.push(`xigua_params=${encodeURIComponent('{"is_mvp_publish":true,"is_original":false}')}`);
  }

  //同时发布到
  if (taskData.sync_apps?.length) {
    const appKeys: Array<string> = [];
    for (const app of taskData.sync_apps) {
      const oriKeys = (app.raw as DouYinSyncAppInfo)?.client_keys;
      if (oriKeys?.length) {
        appKeys.push(...oriKeys);
      } else if (app.yixiaoerId.length > 3) {
        appKeys.push(app.yixiaoerId);
      }
    }
    postData.item.sync.limit_client_keys = appKeys as never;
  }

  //地点-推广
  if (taskData.location?.poiId || taskData.poi_id) {
    postData.item.anchor = {
      poi_id: taskData?.location?.poiId ?? taskData.poi_id ?? undefined,
      poi_name: taskData?.location?.poiName ?? taskData.poi_name ?? undefined,
      anchor_content: '{"is_commerce_intention":false}',
    };
    if (taskData.location?.isCommerceIntention) {
      //    primary_recommend_product_type: 1;
      const anchor_content = {};
      if (!taskData.location?.cpsInfo) {
        anchor_content['primary_recommend_product_type'] = 1;
      } else {
        if (taskData.location?.cpsInfo.cps_choose_scence === 0) {
          taskData.location.cpsInfo.cps_choose_source_list = [];
          taskData.location.cpsInfo.cps_choose_mini_app_list = [];
        }
        const cpsInfo = {
          cps_choose_scence: taskData.location.cpsInfo.cps_choose_scence,
          cps_choose_source_list: taskData.location.cpsInfo.cps_choose_source_list,
          cps_choose_mini_app_list: taskData.location.cpsInfo.cps_choose_mini_app_list,
        };
        anchor_content['cps_info'] = JSON.stringify(cpsInfo);
      }
      anchor_content['recommend_poi_group'] = taskData.location?.recommendPoiGroup ?? false;
      anchor_content['is_commerce_intention'] = true;
      postData.item.anchor['anchor_content'] = JSON.stringify(anchor_content);
    }
  } else if (taskData.location_shopping?.data) {
    //挂载团购
    const anchor = {
      id: taskData.location_shopping.data.spu_id,
      type: 13010,
      content: {
        content: {
          spu_id: taskData.location_shopping.data.spu_id,
          anchor_title: taskData.location_shopping.sale_title,
          forbid_edit_anchor: 0,
          is_movie: 0,
          user_type: 'life_daren',
          show_type: taskData.location_shopping.data.show_type,
          post_source: 0,
          poi_indirect: {
            biz_type: 1,
            biz_id: taskData.location_shopping.data.spu_id,
            biz_ext: '{}',
            ss_poi_id: taskData.location_shopping.data.poi.poi_id,
          },
          life_task_order_title: '',
          life_task_name: '',
          life_product_id: taskData.location_shopping.data.spu_id,
          life_anchor_secret_audit: '',
          security_audit: 0,
          spu_intranetpage: !!taskData.location_shopping.brand_switch_value,
          brand_switch: { value: taskData.location_shopping.brand_switch_value },
          intranet_page_type: 0,
        },
      },
      source: 1,
    };
    const anchor_content = {
      content: {
        spu_id: taskData.location_shopping.data.spu_id,
        anchor_title: taskData.location_shopping.sale_title,
        forbid_edit_anchor: 0,
        is_movie: 0,
        user_type: 'life_daren',
        show_type: taskData.location_shopping.data.show_type,
        post_source: 0,
        poi_indirect: {
          biz_type: 1,
          biz_id: taskData.location_shopping.data.spu_id,
          biz_ext: '{}',
          ss_poi_id: taskData.location_shopping.data.poi.poi_id,
        },
        life_task_order_title: '',
        life_task_name: '',
        life_product_id: taskData.location_shopping.data.spu_id,
        life_anchor_secret_audit: '',
        security_audit: 0,
        spu_intranetpage: !!taskData.location_shopping.brand_switch_value,
        brand_switch: { value: taskData.location_shopping.brand_switch_value },
        intranet_page_type: 0,
      },
    };
    postData.item.anchor = {
      anchor: JSON.stringify(anchor),
      anchor_business_type: 13010,
      anchor_content: JSON.stringify(anchor_content),
    };
  } else if (taskData.miniAppInfo && taskData.miniAppInfo.id) {
    //小程序
    const anchor = {
      content: taskData.miniAppInfo.extra,
      type: taskData.miniAppInfo.type,
      id: taskData.miniAppInfo.id,
    };
    postData.item.anchor['anchor'] = JSON.stringify(anchor);
  } else if (shopDraftId) {
    //挂车
    postData.item.anchor['shop_draft_id'] = shopDraftId;
  } else if (taskData.film?.yixiaoerId) {
    postData.item.anchor['anchor'] = JSON.stringify({ id: taskData.film.yixiaoerId, type: 11 });
  } else if (taskData.game?.yixiaoerId) {
    const shortVideoData = taskData.game.raw as DouYinGameShortVideoPoint;
    const anchor_content = JSON.parse(shortVideoData.anchor_content ?? '{}') as DouYinGameAnchorContent;
    const content = {
      type: shortVideoData.anchor_business_type,
      anchor_title: shortVideoData.anchor_title,
      anchor_id: shortVideoData.anchor_id,
      anchor_tag: anchor_content.anchor_tag,
      anchor_icon: {
        url_list: shortVideoData.anchor_icon.url_list,
      },
      icon_uri: 'venus/game_center/common/anchor_icon.png',
      open_url: anchor_content.open_url,
      from_source: anchor_content.from_source ?? 2,
      content: JSON.parse(anchor_content.content ?? '{}'),
    };
    const anchor = {
      id: shortVideoData.anchor_id,
      type: shortVideoData.anchor_business_type,
      content: JSON.stringify(content),
    };
    postData.item.anchor['anchor'] = JSON.stringify(anchor);
  }

  //描述
  let finalText = text;
  if (taskData.title) {
    finalText = `${taskData.title} ${text}`;
  }
  postData.item.common.text = finalText;
  if (text) {
    postData.item.common.caption = text;
    postData.item.chapter.chapter = '{"chapter_details":[],"chapter_type":0}';
  }

  //创作申明

  if (taskData.declareInfo?.choose_value) {
    if (taskData.declareInfo?.user_declare_place) {
      taskData.declareInfo.user_declare_place = taskData.declareInfo.user_declare_place.replace('中国', '')?.trim();
      const seps = taskData.declareInfo.user_declare_place?.split(' ');
      if (seps.length == 2 && seps[0] == seps[1]) {
        taskData.declareInfo.user_declare_place = seps[0];
      }
    }
    postData.item.declare.user_declare_info = JSON.stringify(taskData.declareInfo);
  }

  //关联热点
  if (taskData.hot_sentence && taskData.hot_sentence?.length > 0) {
    postData.item.common.hot_sentence = taskData.hot_sentence ?? '';
  }

  //合集
  if (taskData.mix_id && taskData.mix_id.length > 0) {
    postData.item.mix['mix_id'] = taskData.mix_id;
    postData.item.mix['mix_order'] = taskData.mix_order;
  }

  //挑战
  if (taskData.flashMobInfo?.yixiaoerId) {
    const flashInfo = [
      {
        type: 24,
        index: 0,
        track_info: '[{"scale":0.8,"x":0.31,"y":0.22,"r":0,"s":0.8}]',
        text_info: taskData.flashMobInfo.yixiaoerName,
        image_index: 0,
        flash_mob_info: { id: taskData.flashMobInfo.yixiaoerId, text: taskData.flashMobInfo.yixiaoerName },
      },
    ];
    postData.item.common['interaction_stickers'] = JSON.stringify(flashInfo);
  }

  return JSON.stringify(postData);
};

/**
 * 获取上传认证输出项
 */
export interface GetUploadAuthTokenOutput {
  /**
   * 状态码
   */
  status_code: number;
  /**
   * 状态消息
   */
  status_msg?: string;
  /**
   * ak
   */
  ak: string;
  /**
   * 认证信息
   *  - 结果为json序列化后的字符串，需要手动反序列化，类型为 UploadAuthInfo
   */
  auth: string;
}

/**
 * 上传认证信息
 */
export interface UploadAuthInfo {
  AccessKeyID: string;
  SecretAccessKey: string;
  SessionToken: string;
}

/**
 * 获取上传认证参数
 * @param {string} cookie
 * @return {Promise<any>}
 */
const getUploadAuthToken = async (cookie: string): Promise<GetUploadAuthTokenOutput> => {
  const result = await $http.get<never, AxiosResponse<GetUploadAuthTokenOutput>>(
    'https://creator.douyin.com/web/api/media/upload/auth/v5/',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        Cookie: cookie,
      },
    },
  );

  // 非正常请求，抛出异常
  if (result.data.status_code !== 0) {
    throw new BadRequestException(result.data.status_msg, result.data.status_code, result.data);
  }

  return result.data;
};

/**
 * 获取封面上传参数输出项
 */
export interface GetUploadCoverArgsOutput {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    Error?: {
      CodeN: string;
      Code: string;
      Message: string;
    };
  };
  Result: {
    UploadAddress: {
      StoreInfos: Array<{ StoreUri: string; Auth: string; UploadID: string }>;
      UploadHosts: Array<string>;
      SessionKey: string;
    };
  };
}

/**
 * 获取封面上传参数
 * @param {AxiosInstance} $http
 * @param {string} userId 当前用户ID
 */
const getCoverUploadArgs = async ($http: AxiosInstance, userId: string): Promise<GetUploadCoverArgsOutput> => {
  const result = await $http.get<never, AxiosResponse<GetUploadCoverArgsOutput>>('https://imagex.bytedanceapi.com', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    params: {
      // 固定参数
      Action: 'ApplyImageUpload',
      Version: '2018-08-01',
      ServiceId: 'jm8ajry58r',
      app_id: 2906,

      // 当前用户ID
      user_id: userId,

      // 随机字符
      s: Math.random().toString(36).substring(2),
    },
  });

  // 请求失败
  if (result.status === 400) {
    const error = result.data?.ResponseMetadata?.Error ?? undefined;
    throw new BadRequestException(error?.Message, error?.Code, result.data);
  }

  // 请求成功
  if (result.status === 200) {
    // 出现业务错误，如：AccessKey 无效
    const error = result.data.ResponseMetadata.Error;
    if (error?.Code) {
      throw new BadRequestException(error?.Message, error?.Code, result.data);
    }

    // 返回明确的成功
    return result.data;
  }

  throw new UnknownException();
};

/**
 * 上传封面图片输入项
 */
export interface UploadCoverImageInput {
  /**
   * 授权信息
   */
  authorization: string;
  /**
   * 上传主机
   */
  uploadHost: string;
  /**
   * store URI
   */
  storeUri: string;
  /**
   * 用户ID
   */
  userId: string;
  /**
   * CRC32 值
   */
  crc32: string;
  /**
   * 文件数据
   */
  data: Buffer;
}

/**
 * 上传封面图片输出项
 */
export interface UploadCoverImageOutput {
  crc32: string;
}

/**
 * 上传封面视频
 * @param {UploadCoverImageInput} input
 * @return {Promise<UploadCoverImageOutput>}
 */
const uploadCoverImage = async (input: UploadCoverImageInput): Promise<UploadCoverImageOutput> => {
  // 组装上传地址
  // 如：`https://tos-d-x-hl.snssdk.com/upload/v1/tos-cn-i-jm8ajry58r/b766820191cd4895992ea80d2c7010c5`
  const url = `https://${input.uploadHost}/upload/v1/${input.storeUri}`;

  // 执行上传
  const result = await $http.post(url, input.data, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: {
      Origin: 'https://creator.douyin.com',
      Referer: 'https://creator.douyin.com/',
      Authorization: input.authorization,
      Accept: '*/*',
      'Content-Disposition': 'attachment; filename="undefined"',
      'X-Storage-U': input.userId,
      'Content-Type': 'application/octet-stream',
      'Content-CRC32': input.crc32,
    },
  });

  return result.data;
};

/**
 * 提交图片上传输出项
 */
export interface CommitImageUploadOutput {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    Error?: {
      CodeN: string;
      Code: string;
      Message: string;
    };
  };
  Result: {
    Results: Array<{ Uri: string; UriStatus: number }>;
    RequestId: string;
    PluginResult: Array<{
      FileName: string;
      SourceUri: string;
      ImageUri: string;
      ImageWidth: number;
      ImageHeight: number;
      ImageMd5: number;
      ImageFormat: string;
      ImageSize: number;
      FrameCnt: number;
    }>;
  };
}

/**
 * 提交图片上传
 * @param $http Axios 实例
 * @param {string} userId 当前用户ID
 * @param {string} sessionKey 上传会话信息
 * @return {Promise<CommitImageUploadOutput>}
 */
const commitImageUpload = async (
  $http: AxiosInstance,
  userId: string,
  sessionKey: string,
): Promise<CommitImageUploadOutput> => {
  const postData = {
    SessionKey: sessionKey,
  };

  const result = await $http.post<never, AxiosResponse<CommitImageUploadOutput>>(
    'https://imagex.bytedanceapi.com',
    postData,
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        Accept: '*/*',
        Origin: 'https://creator.douyin.com',
        Referer: 'https://creator.douyin.com/',
        'X-Amz-Content-Sha256': CalcSha256Hex(JSON.stringify(postData)),
      },
      params: {
        // 固定参数
        Action: 'CommitImageUpload',
        Version: '2018-08-01',
        ServiceId: 'jm8ajry58r',
        app_id: 2906,

        // 当前用户ID
        user_id: userId,
      },
    },
  );

  // 请求失败
  if (result.data.ResponseMetadata?.Error) {
    throw new BadRequestException(
      result.data.ResponseMetadata.Error.Message,
      result.data.ResponseMetadata.Error.Code,
      result.data,
    );
  }

  return result.data;
};

export const douyinVideoService = {
  getUploadAuthToken: getUploadAuthToken,
  getCoverUploadArgs: getCoverUploadArgs,
  uploadCoverImage: uploadCoverImage,
  commitImageUpload: commitImageUpload,
};

/**
 * 获取上传参数，后续视频上传需要
 * @param videoSize
 * @param userId
 * @param $http
 * @param proxy
 */
export const getVideoUploadArgs = async (
  videoSize: number,
  userId: string,
  $http: AxiosInstance,
  proxy: AxiosProxyConfig | undefined = undefined,
  fileType: 'video' | 'image' = 'video',
  space?: string,
): Promise<uploadVideoArgs> => {
  const sId = Math.random().toString(36).substring(2);
  const headers = {};
  headers['Referer'] = 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page';
  headers['User-Agent'] = HttpConfig.userAgent;

  const result = await $http.get<never, AxiosResponse<uploadVideoArgs>>('https://vod.bytedanceapi.com', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    params: {
      Action: 'ApplyUploadInner',
      Version: '2020-11-19',
      SpaceName: space ?? 'aweme',
      FileType: fileType ?? 'video',
      IsInner: 1,
      FileSize: videoSize,
      app_id: 2906,
      user_id: userId,
      s: sId,
    },
    headers: headers,
    proxy: proxy,
  });
  return result?.data;
};

/**
 * 上传视频，并返回视频的crc32值，后续校验需要
 * @param videoData 视频二进制数据
 * @param partNum 视频分片编号
 * @param blockSize 分片大小固定值
 * @param userId 用户id
 * @param uploadId 上传id,随机Guid值，同一个视频多个分辨需要一致
 * @param uploadArgs 上传参数
 * @param proxy
 */
export const uploadVideoPart = async (
  videoData: buffer.Buffer,
  partNum: number,
  blockSize: number,
  userId: string,
  uploadId: string,
  uploadArgs: uploadVideoArgs,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<UploadPartResult> => {
  let uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[0];
  if (
    uploadArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 1 &&
    (!uploadNode.SessionKey?.toString() || !uploadNode.UploadHost?.toString() || !(uploadNode?.StoreInfos?.length > 0))
  ) {
    uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[1];
  }

  let crc32Str = crc.crc32(videoData).toString(16).replace('-', '');
  while (crc32Str.length < 8) {
    crc32Str = `0${crc32Str}`;
  }
  const headers = {
    'Content-CRC32': crc32Str,
    Authorization: uploadNode?.StoreInfos[0].Auth,
    'Content-Type': 'application/octet-stream',
    'X-Storage-U': userId,
    'User-Agent': HttpConfig.userAgent,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
  };

  const uploadUrl = `https://${uploadNode.UploadHost}/upload/v1/${uploadNode.StoreInfos[0]
    ?.StoreUri}?uploadid=${uploadId}&part_number=${partNum}&phase=transfer&part_offset=${(partNum - 1) * blockSize}`;
  let result = await $http.post(uploadUrl, buffer.Buffer.from(videoData), {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    proxy: proxy,
  });
  if (result.status != 403 && !(result.data && typeof result.data == 'object')) {
    result = await $http.post(uploadUrl, buffer.Buffer.from(videoData), {
      headers: headers,
    });
  }
  if (result.data && typeof result.data == 'object') {
    result.data.partNum = partNum;
    const reData: UploadPartResult = result.data as UploadPartResult;
    if (!reData?.data?.crc32) {
      // console.debug(`分片上传失败:${partNum}`, result.data);
    }
  } else {
    return { code: result.status, message: '服务异常', partNum: -1 };
  }

  return result?.data;
};

/**
 * 分片上传完成后进行整体校验是否成功
 * @param userId 用户uid
 * @param uploadId 上传id
 * @param uploadPartListStr 分片上传结果的列表链接字符串，格式partNum:crc32 eg: 1:5071ef55,2:a38225ca,3:24236b53,4:e37922fa
 * @param uploadArgs 上传参数
 * @param proxy
 * @constructor
 */
export const checkVideoUpload = async (
  userId: string,
  uploadId: string,
  uploadPartListStr: string,
  uploadArgs: uploadVideoArgs,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<CheckUploadResultResponse> => {
  let uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[0];
  if (
    uploadArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 1 &&
    (!uploadNode.SessionKey?.toString() || !uploadNode.UploadHost?.toString() || !(uploadNode?.StoreInfos?.length > 0))
  ) {
    uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[1];
  }
  const headers = {
    Authorization: uploadNode?.StoreInfos[0].Auth,
    'Content-Type': 'text/plain;charset=UTF-8',
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
    'X-Storage-U': userId,
    'User-Agent': HttpConfig.userAgent,
  };

  const uploadUrl = `https://${uploadNode.UploadHost}/upload/v1/${uploadNode.StoreInfos[0]?.StoreUri}?uploadid=${uploadId}&phase=finish&uploadmode=part`;
  const result = await $http.post(uploadUrl, uploadPartListStr, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    proxy: proxy,
  });

  return result?.data;
};

export interface CheckUploadResultResponse {
  code: number;
  apiversion: string;
  message: string;
  data?: { hash: string; key: string };
}

export const getUploadedVideoInfo = async (
  userId: string,
  uploadArgs: uploadVideoArgs,
  $http: AxiosInstance,
  proxy: AxiosProxyConfig | undefined = undefined,
  isMsg: boolean = false,
  space?: string,
): Promise<uploadedVideoInfo> => {
  let uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[0];
  if (
    uploadArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 1 &&
    (!uploadNode.SessionKey?.toString() || !uploadNode.UploadHost?.toString() || !(uploadNode?.StoreInfos?.length > 0))
  ) {
    uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[1];
  }

  const requestBody = {
    SessionKey: uploadNode?.SessionKey,
    Functions: [{ name: 'GetMeta' }, { name: 'Snapshot', input: { SnapshotTime: 0 } }],
  };
  if (isMsg) {
    requestBody.Functions = [
      {
        name: 'Encryption',
        input: { Config: { copies: 'cipher_v2' }, PolicyParams: { 'policy-set': 'check,thumb,medium,large' } } as never,
      },
    ];
  }

  const headers = {
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com',
    'User-Agent': HttpConfig.userAgent,
    'X-Amz-Content-Sha256': CalcSha256Hex(JSON.stringify(requestBody)),
  };

  const result = await $http.post<never, AxiosResponse<uploadedVideoInfo>>(
    'https://vod.bytedanceapi.com',
    requestBody,
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: headers,
      params: {
        Action: 'CommitUploadInner',
        Version: '2020-11-19',
        SpaceName: space ?? 'aweme',
        app_id: 2906,
        user_id: userId,
      },
      proxy: proxy,
    },
  );
  return result?.data;
};

export const publishlimit = async (cookie: string, sdkToken: string): Promise<void> => {
  const url =
    'https://creator.douyin.com/aweme/v1/open/publish/limit_app_groups/?device_platform=pc&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F130.0.0.0+Safari%2F537.36+Edg%2F130.0.0.0&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&msToken=&a_bogus=';

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
    'x-secsdk-csrf-token': sdkToken,
    'User-Agent': HttpConfig.userAgent,
  };

  await $http.post(url, '', { headers: headers });
};

export const checkByPassword = async (
  cookie: string,
  sdkToken: string,
  password: string,
  checkStr: string,
  proxyAgent?: object,
): Promise<string> => {
  let enuid = '';
  if (checkStr?.startsWith('{')) {
    const cheObj = JSON.parse(checkStr);
    enuid = cheObj['encrypt_uid'] ?? '';
  }

  const postDataPre = {
    encrypt_uid: enuid,
    verify_ticket: '',
    copywriting_key: 'creator',
    new_verify_flow: '',
    password: password,
    aid: 2906,
  };

  const postData = encryptParams(postDataPre, 'password');

  const biz_trace_id = cookie.split('biz_trace_id=')[1]?.split(';')[0];
  const passport_csrf_token = cookie.split('passport_csrf_token=')[1]?.split(';')[0];

  const url =
    'https://creator.douyin.com/passport/web/account/verify/?passport_jssdk_version=5.0.2&passport_jssdk_type=lite&is_from_ttaccountsdk=1&aid=2906&language=zh&new_authn_sdk_version=1.1.3-web&is_vcd=1&biz_trace_id=c809dd0f&msToken=&a_bogus=';

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
    'x-secsdk-csrf-token': sdkToken,
    'User-Agent': HttpConfig.userAgent,
    'x-tt-passport-csrf-token': passport_csrf_token,
    'x-tt-passport-trace-id': biz_trace_id,
    'x-tt-passport-verify-portrait': '',
    'content-type': 'application/x-www-form-urlencoded',
  };

  const re = await $http.post<{ data: { error_code: number; description: string }; message: string }>(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  if (re?.data?.data?.error_code) {
    return re.data?.data?.description ?? '验证失败';
  }
  return '';
};

export const checkBySMSCode = async (
  cookie: string,
  sdkToken: string,
  smsCode: string,
  checkStr: string,
  proxyAgent?: object,
): Promise<string> => {
  let enuid = '';
  if (checkStr?.startsWith('{')) {
    const cheObj = JSON.parse(checkStr);
    enuid = cheObj['encrypt_uid'] ?? '';
  }

  const postDataPre = {
    encrypt_uid: enuid,
    verify_ticket: '',
    type: '3737',
    copywriting_key: 'creator',
    new_verify_flow: '',
    code: smsCode,
    aid: 2906,
  };

  const postData = encryptParams(postDataPre, 'code');

  const biz_trace_id = cookie.split('biz_trace_id=')[1]?.split(';')[0];
  const passport_csrf_token = cookie.split('passport_csrf_token=')[1]?.split(';')[0];

  const url =
    'https://creator.douyin.com/passport/web/validate_code/?passport_jssdk_version=5.0.2&passport_jssdk_type=lite&is_from_ttaccountsdk=1&aid=2906&language=zh&new_authn_sdk_version=1.1.3-web&is_vcd=1&biz_trace_id=c809dd0f&msToken=&a_bogus=';

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
    'x-secsdk-csrf-token': sdkToken,
    'User-Agent': HttpConfig.userAgent,
    'x-tt-passport-csrf-token': passport_csrf_token,
    'x-tt-passport-trace-id': biz_trace_id,
    'x-tt-passport-verify-portrait': '',
    'content-type': 'application/x-www-form-urlencoded',
  };

  const re = await $http.post<{ data: { error_code: number; description: string }; message: string }>(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  if (re?.data?.data?.error_code) {
    return re.data?.data?.description ?? '验证失败';
  }
  return '';
};

export const sendSMSCode = async (
  cookie: string,
  sdkToken: string,
  checkStr: string,
  proxyAgent?: object,
  signal?: AbortSignal,
): Promise<{ error_code: number; description: string; mobile: string }> => {
  let enuid = '';
  if (checkStr?.startsWith('{')) {
    const cheObj = JSON.parse(checkStr);
    enuid = cheObj['encrypt_uid'] ?? '';
  }

  const postData = `mix_mode=1&type=3737&encrypt_uid=${encodeURIComponent(
    enuid,
  )}&verify_ticket=&copywriting_key=creator&new_verify_flow=&is6Digits=1&aid=2906&new_authn_sdk_version=1.0.0.379-web`;

  const biz_trace_id = cookie.split('biz_trace_id=')[1]?.split(';')[0];
  const passport_csrf_token = cookie.split('passport_csrf_token=')[1]?.split(';')[0];

  const url =
    'https://creator.douyin.com/passport/web/send_code/?passport_jssdk_version=5.0.2&passport_jssdk_type=lite&is_from_ttaccountsdk=1&aid=2906&language=zh&new_authn_sdk_version=1.1.3-web&is_vcd=1&biz_trace_id=c809dd0f&msToken=&a_bogus=';

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
    'x-secsdk-csrf-token': sdkToken,
    'User-Agent': HttpConfig.userAgent,
    'x-tt-passport-csrf-token': passport_csrf_token,
    'x-tt-passport-trace-id': biz_trace_id,
    'x-tt-passport-verify-portrait': '',
    'content-type': 'application/x-www-form-urlencoded',
  };

  const re = await $http.post<{ data: { error_code: number; description: string; mobile: string }; message: string }>(
    url,
    postData,
    {
      headers: headers,
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
      signal,
    },
  );
  return re.data.data;
};

export interface DouyinPublishResponse {
  status_code: number;
  status_msg?: string;
  aweme?: {
    aweme_id: string;
  };
  item_id?: string;
  checkStr?: string;
  postData?: string;
}

/**
 * 使用已经组装完成的发布数据请求抖音，不重复上传素材
 */
export const publishVideoPostData = async (
  cookie: string,
  sdkToken: string,
  postData: string,
  taskId: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
  password?: string,
): Promise<DouyinPublishResponse> => {
  let pubKey = '';
  if (cookie?.includes('bd_ticket_guard_client_data=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['bd-ticket-guard-ree-public-key'];
  } else if (cookie?.includes('bd_ticket_guard_client_data_v2=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data_v2=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['ree_public_key'];
  }

  const signValue = clientSign(cookie);
  const signObj = JSON.parse(
    JSON.parse(
      decodeURIComponent(cookie.split('security-sdk/s_sdk_sign_data_key/web_protect=')[1]?.split(';')[0]?.trim()),
    ).data,
  );
  const webVer = signObj.ticket?.startsWith('hash') ? '2' : '1';
  const headers = {
    cookie: cookie,
    'User-Agent': HttpConfig.userAgent,
    'Content-Type': 'application/json',
    'x-secsdk-csrf-token': sdkToken,
    'bd-ticket-guard-web-version': webVer,
    'bd-ticket-guard-version': '2',
    'bd-ticket-guard-iteration-version': '1',
    'bd-ticket-guard-web-sign-type': '0',
    'bd-ticket-guard-ree-public-key': pubKey,
    'bd-ticket-guard-client-data': signValue,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
  };

  const msToken = cookie.split('msToken=')[1]?.split(';')[0] ?? `a12man123masb${Date.now()}`;
  const url = `https://creator.douyin.com/web/api/media/aweme/create_v2/?read_aid=2906&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F140.0.0.0+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=${msToken}&a_bogus=`;

  // console.debug('抖音推送数据', taskId, cookie, postData);
  let publishResult = await $http.post(url, postData?.trim(), {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  // console.debug('抖音推送返回数据', taskId, publishResult.data);
  const checkStr = publishResult.headers['x-tt-verify-passport-decision'];
  if (checkStr) {
    if (password) {
      const checkRe = await checkByPassword(cookie, sdkToken, password, checkStr, proxyAgent);
      if (checkRe) {
        logger.info(`自动验证失败:${checkRe}`);
        return { status_code: errorCode.risk_verify, status_msg: `发布验证失败:${checkRe}`, checkStr, postData };
      }
      publishResult = await $http.post(url, postData?.trim(), {
        headers: headers,
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent,
      });
    } else {
      return {
        status_code: errorCode.risk_verify,
        status_msg: '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。',
        checkStr,
        postData,
      };
    }
  }
  if (isJson(publishResult.data)) {
    return publishResult.data;
  }
  return {
    status_code: publishResult.status ?? errorCode.data_error,
    status_msg: '服务异常',
  };
};

export const publish = async (
  cookie: string,
  sdkToken: string,
  publishPostData: DouyinVideoTaskInput,
  coverInfo: uploadedImageInfo,
  videoInfo: uploadedVideoInfo,
  shopDraftId: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
  password?: string,
  hCoverInfo?: uploadedImageInfo | null,
): Promise<DouyinPublishResponse> => {
  const postData = await buildPostData_v2(publishPostData, coverInfo, videoInfo, shopDraftId, cookie, hCoverInfo);

  //暂时取消
  //const sign = await getSign(signData);
  return publishVideoPostData(cookie, sdkToken, postData, publishPostData.taskId, proxyAgent, password);
};

export const clientSign = (cookie: string) => {
  try {
    const pk = JSON.parse(
      JSON.parse(decodeURIComponent(cookie.split('security-sdk/s_sdk_crypt_sdk=')[1]?.split(';')[0]?.trim())).data,
    ).ec_privateKey;

    const signObj = JSON.parse(
      JSON.parse(
        decodeURIComponent(cookie.split('security-sdk/s_sdk_sign_data_key/web_protect=')[1]?.split(';')[0]?.trim()),
      ).data,
    );

    // 将字符串转换为 Key 对象
    const privateKey = crypto.createPrivateKey(pk);

    const tm = parseInt(String(new Date().getTime() / 1000));
    const tick = signObj.ticket;
    // 签名数据
    const data = `ticket=${tick}&path=/web/api/media/aweme/create_v2/&timestamp=${tm}`;
    //const data = `ticket=${tick}&path=/aweme/v1/web/commit/item/digg/&timestamp=${tm}`;
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    const signature = sign.sign(privateKey, 'base64');

    const tssign = signObj.ts_sign;

    const reStr = JSON.stringify({
      ts_sign: tssign,
      req_content: 'ticket,path,timestamp',
      req_sign: signature,
      timestamp: tm,
    });

    return Buffer.from(reStr).toString('base64');
  } catch (e) {
    throw new Error('账号信息缺失，请重新授权此账号再试');
  }
};

export interface DouyinClientSignV2Options {
  path?: string;
  timestamp?: number;
  aid?: number;
  serverCert?: string;
  disableCache?: boolean;
  localstorage?: DouyinLocalStorageLike;
}

export type DouyinLocalStorageLike = Record<string, unknown>;

const douyinClientSignV2Cache = new Map<string, { ticket: string; value: string; expiresAt: number }>();
const DOUYIN_TICKET_GUARD_SERVER_CERT = `-----BEGIN CERTIFICATE-----
MIIEfTCCBCKgAwIBAgIUXWdS2tzmSoewCWfKFyiWMrJqs/0wCgYIKoZIzj0EAwIw
MTELMAkGA1UEBhMCQ04xIjAgBgNVBAMMGXRpY2tldF9ndWFyZF9jYV9lY2RzYV8y
NTYwIBcNMjIxMTE4MDUyMDA2WhgPMjA2OTEyMzExNjAwMDBaMCQxCzAJBgNVBAYT
AkNOMRUwEwYDVQQDEwxlY2llcy1zZXJ2ZXIwWTATBgcqhkjOPQIBBggqhkjOPQMB
BwNCAASE2llDPlfc8Rq+5J5HXhg4edFjPnCF3Ua7JBoiE/foP9m7L5ELIcvxCgEx
aRCHbQ8kCCK/ArZ4FX/qCobZAkToo4IDITCCAx0wDgYDVR0PAQH/BAQDAgWgMDEG
A1UdJQQqMCgGCCsGAQUFBwMBBggrBgEFBQcDAgYIKwYBBQUHAwMGCCsGAQUFBwME
MCkGA1UdDgQiBCABydxqGrVEHhtkCWTb/vicGpDZPFPDxv82wiuywUlkBDArBgNV
HSMEJDAigCAypWfqjmRIEo3MTk1Ae3MUm0dtU3qk0YDXeZSXeyJHgzCCAZQGCCsG
AQUFBwEBBIIBhjCCAYIwRgYIKwYBBQUHMAGGOmh0dHA6Ly9uZXh1cy1wcm9kdWN0
aW9uLmJ5dGVkYW5jZS5jb20vYXBpL2NlcnRpZmljYXRlL29jc3AwRgYIKwYBBQUH
MAGGOmh0dHA6Ly9uZXh1cy1wcm9kdWN0aW9uLmJ5dGVkYW5jZS5uZXQvYXBpL2Nl
cnRpZmljYXRlL29jc3AwdwYIKwYBBQUHMAKGa2h0dHA6Ly9uZXh1cy1wcm9kdWN0
aW9uLmJ5dGVkYW5jZS5jb20vYXBpL2NlcnRpZmljYXRlL2Rvd25sb2FkLzQ4RjlD
MEU3QjBDNUE3MDVCOTgyQkU1NTE3MDVGNjQ1QzhDODc4QTguY3J0MHcGCCsGAQUF
BzAChmtodHRwOi8vbmV4dXMtcHJvZHVjdGlvbi5ieXRlZGFuY2UubmV0L2FwaS9j
ZXJ0aWZpY2F0ZS9kb3dubG9hZC80OEY5QzBFN0IwQzVBNzA1Qjk4MkJFNTUxNzA1
RjY0NUM4Qzg3OEE4LmNydDCB5wYDVR0fBIHfMIHcMGygaqBohmZodHRwOi8vbmV4
dXMtcHJvZHVjdGlvbi5ieXRlZGFuY2UuY29tL2FwaS9jZXJ0aWZpY2F0ZS9jcmwv
NDhGOUMwRTdCMEM1QTcwNUI5ODJCRTU1MTcwNUY2NDVDOEM4NzhBOC5jcmwwbKBq
oGiGZmh0dHA6Ly9uZXh1cy1wcm9kdWN0aW9uLmJ5dGVkYW5jZS5uZXQvYXBpL2Nl
cnRpZmljYXRlL2NybC80OEY5QzBFN0IwQzVBNzA1Qjk4MkJFNTUxNzA1RjY0NUM4
Qzg3OEE4LmNybDAKBggqhkjOPQQDAgNJADBGAiEAqMjT5ADMdGMeaImoJK4J9jzE
LqZ573rNjsT3k14pK50CIQCLpWHVKWi71qqqrMjiSDvUhpyO1DpTPRHlavPRuaNm
ww==
-----END CERTIFICATE-----`;

const getDouyinCookieValue = (cookie: string, key: string): string => {
  const cookiePart = cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  return cookiePart ? cookiePart.slice(key.length + 1) : '';
};

const getDouyinLocalStorageValue = (localstorage: DouyinLocalStorageLike | undefined, key: string): string => {
  const value = localstorage?.[key];
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value).trim();
};

const decodeDouyinStorageValue = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
};

const parseDouyinSecurityStorage = <T = any>(
  cookie: string,
  key: string,
  localstorage?: DouyinLocalStorageLike,
): T => {
  const rawValue = getDouyinLocalStorageValue(localstorage, key) || getDouyinCookieValue(cookie, key);
  if (!rawValue) {
    throw new Error('账号签名信息缺失，请重新授权此账号再试');
  }

  const value = JSON.parse(decodeDouyinStorageValue(rawValue));
  if (typeof value?.data === 'string') {
    return JSON.parse(value.data);
  }
  return value?.data ?? value;
};

const getDouyinClientSignPath = (type: 'publish' | 'comment', path?: string): string => {
  if (path) {
    return path;
  }
  if (type === 'comment') {
    return '/aweme/v1/creator/comment/reply/';
  }
  return '/web/api/media/aweme/create_v2/';
};

const normalizePem = (pem: string): string => pem.replace(/\\n/g, '\n').trim();

const hkdfSha256 = (salt: Buffer, key: Buffer, info: Buffer, length: number): Buffer => {
  const prk = crypto.createHmac('sha256', salt.length ? salt : Buffer.alloc(32)).update(key).digest();
  let previous = Buffer.alloc(0);
  let output = Buffer.alloc(0);
  let index = 1;

  while (output.length < length) {
    previous = crypto
      .createHmac('sha256', prk)
      .update(Buffer.concat([previous, info, Buffer.from([index])]))
      .digest();
    output = Buffer.concat([output, previous]);
    index++;
  }

  return output.subarray(0, length);
};

const signDouyinTicketGuardWithEcdsa = (privateKeyPem: string, data: string): string => {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(crypto.createPrivateKey(normalizePem(privateKeyPem)), 'base64');
};

const signDouyinTicketGuardWithHmac = (privateKeyPem: string, serverCert: string, data: string): string => {
  const privateKey = crypto.createPrivateKey(normalizePem(privateKeyPem));
  const publicKey = new crypto.X509Certificate(normalizePem(serverCert)).publicKey;
  const secret = crypto.diffieHellman({ privateKey, publicKey });
  const hmacKey = hkdfSha256(Buffer.alloc(32), secret, Buffer.alloc(0), 32);

  return crypto.createHmac('sha256', hmacKey).update(data).digest('base64');
};

export const clientSign_v2 = async (
  cookie: string,
  type: 'publish' | 'comment' = 'publish',
  options: DouyinClientSignV2Options = {},
): Promise<string> => {
  try {
    const cryptObj = parseDouyinSecurityStorage<{
      ec_privateKey: string;
      ec_publicKey?: string;
      ec_csr?: string;
    }>(cookie, 'security-sdk/s_sdk_crypt_sdk', options.localstorage);

    const signObj = parseDouyinSecurityStorage<{
      ticket: string;
      ts_sign: string;
      client_cert?: string;
    }>(cookie, 'security-sdk/s_sdk_sign_data_key/web_protect', options.localstorage);

    const tm = options.timestamp ?? Math.floor(Date.now() / 1000);
    const path = getDouyinClientSignPath(type, options.path);
    const tick = signObj.ticket;
    const data = `ticket=${tick}&path=${path}&timestamp=${tm}`;
    const cacheKey = `${path}:${tick}`;

    if (!options.disableCache && !options.timestamp) {
      const cached = douyinClientSignV2Cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
    }

    const isNewCert = !signObj.client_cert || signObj.client_cert.includes('pub.');
    let signature = '';
    if (isNewCert) {
      const serverCert = options.serverCert ?? DOUYIN_TICKET_GUARD_SERVER_CERT;
      signature = signDouyinTicketGuardWithHmac(cryptObj.ec_privateKey, serverCert, data);
    } else {
      signature = signDouyinTicketGuardWithEcdsa(cryptObj.ec_privateKey, data);
    }

    const value = Buffer.from(
      JSON.stringify({
        ts_sign: signObj.ts_sign,
        req_content: 'ticket,path,timestamp',
        req_sign: signature,
        timestamp: tm,
      }),
    ).toString('base64');

    if (!options.disableCache && !options.timestamp) {
      douyinClientSignV2Cache.set(cacheKey, {
        ticket: tick,
        value,
        expiresAt: Date.now() + 18e6,
      });
    }

    return value;
  } catch (e) {
    throw new Error('账号签名信息缺失，请重新授权此账号再试');
  }
};

/**
 * 获取的上传参数结构
 */
export interface uploadVideoArgs {
  status_code: number;
  status_msg: string;
  Result: {
    InnerUploadAddress: {
      UploadNodes: Array<{
        Vid: string;
        StoreInfos: Array<{
          StoreUri: string;
          Auth: string;
          UploadID: string;
        }>;
        UploadHost: string;
        SessionKey: string;
      }>;
      AdvanceOption: {
        EncryptionKey: string;
      };
    };
  };
  Error: {
    CodeN: number;
    Code: string;
    Message: string;
  };
}

/**
 * 上传视频结果
 */
export interface uploadedVideoInfo {
  status_code: number;
  status_msg?: string;
  Result: {
    Results: Array<{
      Vid: string;
      VideoMeta: {
        Uri: string;
        Height: number;
        Width: number;
        OriginHeight: number;
        OriginWidth: number;
        Duration: number;
        Bitrate: number;
        Md5: string;
        Format: string;
        Size: number;
        FileType: string;
        Codec: string;
      };
      PosterUri: string;
      Encryption: {
        Extra: {
          img_size: number;
          img_width: number;
          img_height: number;
          img_format: string;
        };
        SecretKey: string;
        SourceMd5: string;
        Uri: string;
      };
    }>;
  };
}
