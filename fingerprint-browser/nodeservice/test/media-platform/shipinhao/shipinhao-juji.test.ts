import { afterEach, describe, expect, test, vi } from 'vitest';
import { $http } from '@/http';
import { buildShipinhaoTagInfo } from '@/media-platform/shipinhao/shipinhao-base.service';
import { ShipinhaoStatementType } from '@/media-platform/shipinhao/shipinhao-types';
import { Shipinhao } from '../../../src';

test('没有创作申明时不请求tagKey', async () => {

  const cookie='';
  const result = await Shipinhao.getShipinhaoDrama(cookie,'','',1);

  expect(result).toBeUndefined();
});
