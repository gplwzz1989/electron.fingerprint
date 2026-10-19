import { getXimalayaAlbum, getXimalayaCategory, getXimalayaUserInfo, searchXimalayaTopic } from './ximalaya-common';
import { publishXimalayaAudio } from './ximalaya-audio';

export const Ximalaya = {
  getXimalayaUserInfo,
  getXimalayaCategory,
  getXimalayaAlbum,
  searchTopic: searchXimalayaTopic,
  publishAudio: publishXimalayaAudio,
};

export { publishXimalayaAudio } from './ximalaya-audio';
export type { XimalayaAudioPublishResultOutput, XimalayaAudioTaskInput } from './ximalaya-audio';
