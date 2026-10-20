const assert = require('node:assert/strict')
const test = require('node:test')
const { COUNTRY_LOCALE_MAP, alignFingerprintWithGeo } = require('../geo-ip')

test('COUNTRY_LOCALE_MAP: 覆盖主要国家和地区语系配置', () => {
  assert.ok(COUNTRY_LOCALE_MAP.US, '必须包含美国配置')
  assert.equal(COUNTRY_LOCALE_MAP.US.language, 'en-US')
  assert.ok(COUNTRY_LOCALE_MAP.CN, '必须包含中国配置')
  assert.equal(COUNTRY_LOCALE_MAP.CN.language, 'zh-CN')
  assert.ok(COUNTRY_LOCALE_MAP.JP, '必须包含日本配置')
  assert.equal(COUNTRY_LOCALE_MAP.JP.language, 'ja-JP')
})

test('alignFingerprintWithGeo: 正确将 IP 归属地时区与语言对齐到指纹配置', () => {
  const baseProfile = {
    id: 'test-profile',
    browser: {
      family: 'Chrome',
      acceptLanguage: 'zh-CN,zh;q=0.9'
    },
    locale: {
      language: 'zh-CN',
      languages: ['zh-CN', 'zh'],
      timezone: 'Asia/Shanghai'
    }
  }

  const usGeoInfo = {
    ip: '23.247.137.168',
    country: 'United States',
    countryCode: 'US',
    city: 'Los Angeles',
    timezone: 'America/Los_Angeles',
    locale: {
      language: 'en-US',
      languages: ['en-US', 'en'],
      acceptLanguage: 'en-US,en;q=0.9'
    }
  }

  const aligned = alignFingerprintWithGeo(baseProfile, usGeoInfo)

  assert.equal(aligned.locale.timezone, 'America/Los_Angeles', '时区必须对齐到美国洛杉矶')
  assert.equal(aligned.locale.language, 'en-US', '系统语言必须对齐为 en-US')
  assert.deepEqual(aligned.locale.languages, ['en-US', 'en'], '语言偏好列表必须对齐')
  assert.equal(aligned.browser.acceptLanguage, 'en-US,en;q=0.9', 'HTTP Accept-Language 必须对齐')

  // 保证原始对象不可变性
  assert.equal(baseProfile.locale.timezone, 'Asia/Shanghai', '原对象不得被污染')
})
