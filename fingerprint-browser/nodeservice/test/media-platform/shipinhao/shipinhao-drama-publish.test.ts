import { describe, expect, test } from 'vitest';
import {
  buildPostData as buildVideoPostData,
  ShipinhaoVideoTaskInput,
} from '@/media-platform/shipinhao/shipinhao-video.service';
import {
  buildPostData as buildDynamicPostData,
  PubImageInfo,
} from '@/media-platform/shipinhao/shipinhao-article.service';
import { ShipinhaoDynamicTaskInput } from '@/media-platform/shipinhao/shipinhao-article';

const drama = {
  yixiaoerId: 'event/drama-id',
  yixiaoerName: '向着光的小花',
};

const locationWithoutAddress = {
  uid: 'qqmap_11055403409462920708',
  name: '浙江瓯版建材园',
  longitude: 120.63679504394531,
  latitude: 27.972394943237305,
  address: '',
  province: '浙江省',
  city: '温州市',
  region: '瓯海区',
  fullAddress: '浙江省温州市瓯海区',
  source: 0,
};

const expectedLocation = {
  latitude: locationWithoutAddress.latitude,
  longitude: locationWithoutAddress.longitude,
  city: locationWithoutAddress.city,
  poiName: locationWithoutAddress.name,
  address: locationWithoutAddress.fullAddress,
  poiClassifyId: locationWithoutAddress.uid,
};

describe('视频号短剧发布参数', () => {
  test('视频发布数据包含短剧组件', () => {
    const taskData = {
      pubType: 1,
      taskId: 'video-task',
      video: { duration: 7, width: 720, height: 1280, size: 1024, localPath: '' },
      cover: { pathOrUrl: '' },
      uin: 0,
      finderUsername: '',
      postFlag: 0,
      drama,
    } as ShipinhaoVideoTaskInput;

    const postData = JSON.parse(
      buildVideoPostData(taskData, 'video-url', 'cover-url', 'md5', 'draft-id', 'clip-key', '', '', ''),
    );

    expect(postData.objectDesc.component).toEqual({ id: drama.yixiaoerId, type: 8, title: drama.yixiaoerName });
    expect(postData.objectDesc.extReading.urlType).toBe(13);
  });

  test('图文发布数据包含短剧组件', () => {
    const taskData = {
      pubType: 1,
      taskId: 'dynamic-task',
      images: [],
      title: '图文标题',
      uin: 0,
      finderUsername: '',
      drama,
    } as ShipinhaoDynamicTaskInput;

    const postData = JSON.parse(buildDynamicPostData(taskData, [] as PubImageInfo[], '', '', ''));

    expect(postData.objectDesc.component).toEqual({ id: drama.yixiaoerId, type: 8, title: drama.yixiaoerName });
    expect(postData.objectDesc.extReading.urlType).toBe(13);
  });

  test('视频发布使用 fullAddress 兜底并保留地点名称', () => {
    const taskData = {
      pubType: 1,
      taskId: 'video-location-task',
      video: { duration: 7, width: 720, height: 1280, size: 1024, localPath: '' },
      cover: { pathOrUrl: '' },
      uin: 0,
      finderUsername: '',
      postFlag: 0,
      location: locationWithoutAddress,
    } as ShipinhaoVideoTaskInput;

    const postData = JSON.parse(
      buildVideoPostData(taskData, 'video-url', 'cover-url', 'md5', 'draft-id', 'clip-key', '', '', ''),
    );

    expect(postData.objectDesc.location).toEqual(expectedLocation);
  });

  test('图文发布使用 fullAddress 兜底并保留地点名称', () => {
    const taskData = {
      pubType: 1,
      taskId: 'dynamic-location-task',
      images: [],
      title: '图文地点测试',
      uin: 0,
      finderUsername: '',
      location: locationWithoutAddress,
    } as ShipinhaoDynamicTaskInput;

    const postData = JSON.parse(buildDynamicPostData(taskData, [], '', '', ''));

    expect(postData.objectDesc.location).toEqual(expectedLocation);
  });
});
