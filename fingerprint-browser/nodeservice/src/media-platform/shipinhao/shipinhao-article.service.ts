import { PubImageInfo, ShipinhaoDynamicTaskInput, ShipinhaoPublishResultOutput } from './shipinhao-article';
import { ShipinhaoPublishResponse } from './shipinhao-video.service';
import { convertImageFileToBuffer, htmlDecode, isJson } from '@/utils';
import path from 'path';
import {
  buildShipinhaoTagInfo,
  getTimeStamp,
  getUploadedImageInfo,
  getUploadId,
  uploadImage,
} from './shipinhao-base.service';
import {
  MediaType,
  ShipinhaoTagInfo,
} from './shipinhao-types';
import { $http } from '@/http';
import crypto from 'crypto';
import XMLWriter from 'xml-writer';
import { HtmlDocument } from '@/htmlAgilityPack';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 准备数据，并推送到官方
 * @param cookie
 * @param taskData  发布任务体
 * @param images 上传完成的图片
 * @param finderUsername 可选参数,默认空
 * @param rawKeyBuff 可循啊参数，默认空
 * @param clientId 随机uuid
 * @param proxyAgent
 * @constructor
 */
export const publish = async (
  cookie: string,
  taskData: ShipinhaoDynamicTaskInput,
  images: Array<PubImageInfo>,
  finderUsername?: string,
  rawKeyBuff?: string,
  clientId?: string,
  proxyAgent?: HttpsProxyAgent<string> | object | undefined,
): Promise<ShipinhaoPublishResponse> => {
  const url = `https://channels.weixin.qq.com/micro/content/cgi-bin/mmfinderassistant-bin/post/post_${
    taskData.pubType == 1 ? 'create' : 'draft'
  }`;

  const headers = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    'Content-type': 'application/json',
  };

  const tagInfo = await buildShipinhaoTagInfo(
    cookie,
    taskData.statement,
    finderUsername ?? '',
    rawKeyBuff ?? '',
    proxyAgent,
  );
  const postData = buildPostData(
    taskData,
    images,
    finderUsername ?? '',
    rawKeyBuff ?? '',
    clientId ?? '',
    tagInfo,
  );

  console.debug('视频号推送数据', taskData.taskId, cookie, postData);
  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });
  console.debug('视频号推送返回数据', taskData.taskId, result.data);
  return result.data;
};
export const buildPostData = (
  taskData: ShipinhaoDynamicTaskInput,
  images: Array<PubImageInfo>,
  finderUsername: string,
  rawKeyBuff: string,
  clientId: string,
  tagInfo?: ShipinhaoTagInfo,
): string => {
  const isFullPost = 1;
  let location = {};
  const locationAddress = taskData.location?.address?.trim() || taskData.location?.fullAddress?.trim() || '';
  if (taskData.location?.uid) {
    location = {
      latitude: taskData.location.latitude,
      longitude: taskData.location.longitude,
      city: taskData.location.city,
      poiName: taskData.location.name,
      address: locationAddress,
      poiClassifyId: taskData.location.uid,
    };
  } else if (taskData.location?.city) {
    location = {
      latitude: taskData.location.latitude,
      longitude: taskData.location.longitude,
      city: taskData.location.city,
      poiClassifyId: '',
    };
  }

  const xmlETag = new XMLWriter();

  //话题，好友/用户，地点数据预备
  const topics = taskData.topics?.length ? taskData.topics : [];
  const mentionUser = taskData?.mentionUser?.length ? taskData.mentionUser : [];
  const mentionedUser: Array<{ nickname: string }> = [];
  const mentionedUserNameList: Array<string> = [];
  let descStr = '';

  //兼容html中话题好友
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      const html = new HtmlDocument();
      html.LoadHtml(taskData.desc);

      const pList = html.DocumentNode.SelectNodes('//p');
      if (pList?.length > 0) {
        ////替换缓存
        const tmpDataMap = new Map<string, string>();

        let iCount = 0;
        //话题
        const topics = html.DocumentNode.SelectNodes('//topic');
        if (topics?.length > 0) {
          for (const item of topics) {
            iCount++;
            let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
            if (!topicStr?.startsWith('{')) {
              const text = item.getAttribute('text') ?? '';
              topicStr = JSON.stringify({ yixiaoerId: '1', yixiaoerName: text, raw: { id: 1, name: text } });
            }

            const key = `{tmp_t${iCount}}`;
            item.textContent = key;
            tmpDataMap.set(key, topicStr);
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

        const strList: Array<string> = [];

        //分割
        for (const tmpKey of matches) {
          const preStr = newText.split(tmpKey)[0];
          if (preStr.length > 0) {
            strList.push(preStr.trimStart());
          }
          strList.push(tmpKey);
          newText = newText.replace(preStr + tmpKey, '');
        }
        if (newText?.trim()) {
          strList.push(newText.trim());
        }
        //创建话题 用户 描述数据
        xmlETag.startElement('finder');
        xmlETag.writeElement('version', 1);

        let viewNum = 0;
        const atList: Array<number> = [];

        //替换
        for (let i = 0; i < strList.length; i++) {
          const item = strList[i];
          if (item.includes('tmp_f')) {
            const jo = JSON.parse(tmpDataMap.get(item) ?? '{}');
            const nameStr = jo?.raw?.nickName ?? jo?.yixiaoerName;
            strList[i] = `@${nameStr} `;
            mentionedUserNameList.push(nameStr);
            mentionedUser.push({ nickname: nameStr });
            atList.push(viewNum - 1);
            viewNum += 2;
          } else if (item.includes('tmp_t')) {
            const jo = JSON.parse(tmpDataMap.get(item) ?? '{}');
            strList[i] = `#${jo?.raw?.name ?? jo?.yixiaoerName} `;
            viewNum += 2;
          } else {
            viewNum++;
          }
        }
        descStr = htmlDecode(strList.join(''));

        xmlETag.writeElement('valuecount', viewNum);
        xmlETag.startElement('style');
        xmlETag.writeElement('at', atList.join(','));
        xmlETag.endElement();

        let vNum = 0;
        for (let i = 0; i < strList.length; i++) {
          const item = strList[i];
          //话题
          if (item.startsWith('#')) {
            xmlETag.startElement(`value${vNum}`);
            xmlETag.writeElement('topic', `<![CDATA[${item.trim()}#]]>`);
            xmlETag.endElement();
            vNum++;
            xmlETag.writeElement(`value${vNum}`, '<![CDATA[ ]]>');
            vNum++;
          }
          //@用户/好友
          else if (item.startsWith('@')) {
            xmlETag.writeElement(`value${vNum}`, `<![CDATA[${item.trim()}]]>`);
            vNum++;
            xmlETag.writeElement(`value${vNum}`, '<![CDATA[ ]]>');
          } else {
            xmlETag.writeElement(`value${vNum}`, `<![CDATA[${item}]]>`);
            vNum++;
          }
        }

        xmlETag.endElement();

        console.log('创建xml成功：' + xmlETag.toString());
      }
    } else {
      descStr = html.DocumentNode.InnerText();
    }
  } else {
    //创建话题 用户 描述数据
    xmlETag.startElement('finder');
    xmlETag.writeElement('version', 1);
    // noinspection SpellCheckingInspection
    xmlETag.writeElement('valuecount', 1 + topics.length + mentionUser.length);
    xmlETag.startElement('style');
    let atIndex: string;
    if (mentionUser?.length > 0) {
      atIndex = '';
      const atStart = (topics?.length ?? 0) + 1;
      for (let at = 0; at < mentionUser?.length; at++) {
        atIndex = (atStart + at).toString() + ',';
      }
      atIndex = atIndex.substring(0, atIndex.length - 1);
    } else {
      atIndex = (topics?.length > 0 ? topics.length + 2 : 2).toString();
    }
    xmlETag.writeElement('at', atIndex);
    xmlETag.endElement();
    xmlETag.writeElement(
      'value0',
      '<![CDATA[' + (taskData?.desc?.toString()?.split('#')[0]?.split('@')[0] ?? '') + ']]>',
    );
    let v = 1;
    //话题
    if (topics?.length > 0)
      for (let i = 0; i < topics.length; i++) {
        const topicStr = topics[i];
        if (!topicStr) {
          continue;
        }
        xmlETag.startElement('value' + v);
        xmlETag.writeElement('topic', '<![CDATA[#' + topicStr + '#]]>');
        xmlETag.endElement();
        v++;
      }
    //@用户/好友
    if (mentionUser?.length > 0) {
      for (let i = 0; i < mentionUser.length; i++) {
        xmlETag.writeElement('value' + v, '<![CDATA[@' + (mentionUser[i].nickName ?? '') + ']]>');
        v++;
        mentionedUser.push({ nickname: mentionUser[i].nickName });
        mentionedUserNameList.push(mentionUser[i].nickName);
      }
    }
    xmlETag.endElement();

    descStr =
      (taskData?.desc ?? '') +
      (mentionedUserNameList?.length > 0 ? '@' + mentionedUserNameList.join('@') : '') +
      (topics?.length > 0 ? '#' + topics.join('#') : '');
    console.log('创建xml成功：' + xmlETag.toString());
  }

  // noinspection SpellCheckingInspection
  const re = {
    longitude: 0,
    latitude: 0,
    feedLongitude: 0,
    feedLatitude: 0,
    originalFlag: 0,
    objectType: 7, //0会导致定时发布变为视频
    //原创
    postFlag: 0,
    isFullPost: isFullPost, //新字段 宽高比小于6/7为0，大于为1
    handleFlag: 2,
    topics: topics,
    objectDesc: {
      description: descStr,
      event: {},
      extReading: {},
      mediaType: 2,
      location: location,
      topic: {
        finderTopicInfo: xmlETag?.toString()?.replace(/&lt;/g, '<')?.replace(/&gt;/g, '>') ?? '',
      },
      mentionedUser: mentionedUser,
      mpTitle: '',
      media: images,
      shortTitle: '',
      finderNewlifeDesc: {
        richTextTitle: taskData.title ?? '',
        richTextJson: `[{"insert":"${taskData.title ?? ''}"},{"attributes":{"header":1},"insert":"\\n"}`,
        fromRichPublisher: 1,
      },
    },
    tagInfo: tagInfo,
    clientid: clientId,
    timestamp: getTimeStamp(13),
    _log_finder_id: finderUsername,
    _log_finder_uin: null,
    mode: 1,
    sence: 7,
    reqScene: 7,
  };
  //音乐
  if (taskData.music?.id) {
    const docType=taskData.music.raw['playableInfo']
      ? taskData.music.raw['playableInfo']['type']
      : (taskData.music?.raw
        ? taskData.music.raw['docType']
        : '');
    if(!docType&&docType!=0)
    {
      throw new Error('音乐信息异常');
    }
    re.objectDesc['followPostInfo'] = {
      musicInfo: {
        docId: taskData.music.id,
        albumThumbUrl: taskData.music.image,
        name: taskData.music.name,
        artist: taskData.music.authorName,
        mediaStreamingUrl: taskData.music.url,
        docType: docType,
      },
      groupId: taskData.music.id,
      hasBgm: 1,
      bgmSource: taskData.music.raw['bgmSource'],
      bgmQuery: taskData.music.raw['query'] ?? '',
    };
  }
  //描述
  if (taskData.desc) {
    re.objectDesc.finderNewlifeDesc.richTextJson = `${re.objectDesc.finderNewlifeDesc.richTextJson},{"insert":"${descStr}"}]`;
  }
  //商品
  if (taskData.goods?.productId) {
    re.objectDesc['product'] = {
      productId: taskData.goods.productId,
      title: taskData.goods.title,
    };
    re.objectDesc['component'] = {
      id: taskData.goods.productId,
      type: 1,
    };
    re.objectDesc.extReading['urlType'] = 5;
  }
  //短剧
  if (taskData.drama?.yixiaoerId) {
    re.objectDesc['component'] = {
      id: taskData.drama.yixiaoerId,
      type: 8,
      title: taskData.drama.yixiaoerName,
    };
    re.objectDesc.extReading['urlType'] = 13;
  }
  //合集
  if (taskData.collection?.id) {
    re.objectDesc.topic['collectionId'] = taskData.collection.id;
    re.objectDesc.topic['collectionName'] = taskData.collection.name;
  }

  re['scene'] = 1;
  //定时任务
  const prePubTime = taskData.effectiveTime?.toString();
  if (prePubTime && prePubTime.length > 9) {
    re['effectiveTime'] = parseInt(prePubTime.substring(0, 10));
  }
  //活动
  if (taskData.event?.eventTopicId) {
    re.objectDesc['event'] = taskData.event;
  }

  if (taskData.pubType === 0) {
    const result = {
      _log_finder_id: re._log_finder_id,
      objectId: null,
      pluginSessionId: null,
      postReq: re,
      rawKeyBuff: '',
      scene: 1,
      timestamp: getTimeStamp(13),
    };
    delete re.objectDesc['product'];
    return JSON.stringify(result);
  } else {
    return JSON.stringify(re);
  }
};

/**
 * 上传图片完成流程
 * @param imgUrl 图片url或者本地路径
 * @param taskId 发布任务id
 * @param innerTaskId 发布流程内部任务id，发布流程需保持一致
 * @param uin 用户uin
 * @param authKey 上传认证参数
 * @param pubResult
 */
export const uploadImageList = async (
  imgUrl: string,
  taskId: string,
  innerTaskId: string,
  uin: number,
  authKey: string,
  pubResult: ShipinhaoPublishResultOutput,
): Promise<{ DownloadURL: string; errMsg?: string; md5?: string } | null> => {
  const imgDataRes = await convertImageFileToBuffer(imgUrl);
  if (!imgDataRes || !(imgDataRes?.length > 0)) {
    console.debug('图片读取失败', taskId, imgUrl);
    pubResult.code = -1;
    pubResult.msg = `读取图片失败:${imgUrl}`;
    return null;
  }
  if (imgDataRes.length > 524288) {
    console.debug('图片大小超限制512kb', taskId, imgUrl);
    pubResult.code = -1;
    pubResult.msg = `图片大小超限制512kb:${imgUrl}`;
    return null;
  }

  const fileName = path.basename(imgUrl);

  const uploadIdOb = await getUploadId(imgDataRes.length, fileName, uin, innerTaskId, authKey, MediaType.image);
  if (!uploadIdOb.UploadID) {
    console.debug('获取上传id失败', taskId, uploadIdOb);
    pubResult.code = -1;
    pubResult.msg = `获取上传id失败:${uploadIdOb?.errMsg}`;
    return null;
  }

  const uploadResult = await uploadImage(
    imgDataRes,
    fileName,
    MediaType.image,
    uin,
    innerTaskId,
    imgDataRes.length,
    authKey,
    uploadIdOb.UploadID,
  );

  if (!uploadResult?.ETag?.toString()) {
    console.debug('上传图片失败', taskId, uploadResult);
    pubResult.code = -1;
    pubResult.msg = `上传图片失败${uploadResult?.errMsg}`;
    return null;
  }

  const imagePartList = [{ PartNumber: 1, ETag: uploadResult.ETag }];
  const re = await getUploadedImageInfo(
    imagePartList,
    uin,
    fileName,
    uploadIdOb.UploadID,
    imgDataRes.length,
    innerTaskId,
    authKey,
    MediaType.image,
  );
  let md5Str = '';
  if (re.DownloadURL) {
    const md5 = crypto.createHash('md5');
    md5.update(imgDataRes);
    md5Str = md5.digest('hex');
  }
  return { DownloadURL: re.DownloadURL, errMsg: re.errMsg, md5: md5Str };
};
