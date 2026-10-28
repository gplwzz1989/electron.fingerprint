'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

// 引入发布模块与适配器
const { NodeServicePublisher, PUBLISH_TYPES, PLATFORM_LOGIN_URLS } = require('../creator-hub/nodeservice-adapter')

test('NodeServicePublisher 8大发布类型元数据完整性', () => {
  const types = NodeServicePublisher.getPublishTypes()
  assert.equal(types.length, 8, '应支持完整的 8 大发布类型')

  const expectedTypeIds = [
    'wechat-article',
    'wechat-dynamic',
    'douyin-video',
    'douyin-dynamic',
    'douyin-text',
    'weibo-video',
    'weibo-dynamic',
    'weibo-article'
  ]

  for (const id of expectedTypeIds) {
    const meta = PUBLISH_TYPES[id]
    assert.ok(meta, `类型 ${id} 必须在元数据中定义`)
    assert.equal(meta.id, id)
    assert.ok(meta.name, '必须包含中文名称')
    assert.ok(['wechat', 'douyin', 'weibo'].includes(meta.platform), '必须属于微信、抖音、微博三大平台之一')
  }
})

test('未配置外部平台服务时保持未接入状态', () => {
  const { loadExternalService } = require('../external-service')
  assert.equal(loadExternalService(''), null)
  assert.throws(() => loadExternalService('relative-service.js'), /外部平台服务配置无效/)
})

test('NodeServicePublisher.formatCookies Cookie 格式化转换', () => {
  const cookieList = [
    { name: 'sessionid', value: 'abc123456', domain: '.douyin.com' },
    { name: 'passport_csrf_token', value: 'xyz789', domain: '.douyin.com' },
    { name: 'empty_val', value: '' }
  ]
  const str = NodeServicePublisher.formatCookies(cookieList)
  assert.equal(str, 'sessionid=abc123456; passport_csrf_token=xyz789')
})

test('checkAccountStatus 拦截空或非法凭据', async () => {
  const publisher = new NodeServicePublisher()
  const resEmpty = await publisher.checkAccountStatus('douyin', '')
  assert.equal(resEmpty.online, false)
  assert.match(resEmpty.error, /登录凭证/)

  const resUnknown = await publisher.checkAccountStatus('unknown_platform', 'test=123')
  assert.equal(resUnknown.online, false)
})

test('publishMultiAccounts 异常前置拦截与配置合并校验', async () => {
  const publisher = new NodeServicePublisher()

  // 1. 非法类型
  await assert.rejects(
    async () => {
      await publisher.publishMultiAccounts({
        publishType: 'invalid-type',
        targetAccounts: [{ accountId: 'acc1' }],
        commonConfig: {}
      })
    },
    /不支持的发布类型/
  )

  // 2. 空账号列表
  await assert.rejects(
    async () => {
      await publisher.publishMultiAccounts({
        publishType: 'douyin-video',
        targetAccounts: [],
        commonConfig: {}
      })
    },
    /请至少选择一个要发布的账号/
  )

  // 3. 验证无有效 Cookie 时友好提示；外部引擎未配置时优先阻止发布。
  await assert.rejects(publisher.publishMultiAccounts({
    publishType: 'wechat-article',
    targetAccounts: [
      {
        accountId: 'env1__wechat',
        environmentId: 'env1',
        environmentName: '测试环境',
        nickname: '公众号A',
        cookieStr: ''
      }
    ],
    commonConfig: {
      title: '通用标题',
      content: '<p>测试内容</p>'
    },
    accountConfigs: {
      env1__wechat: {
        title: '独立专属标题-定制'
      }
    }
  }), /发布引擎尚未正确加载/)
})

test('customCookieStore 手动凭据管理与持久化缓存', () => {
  const publisher = new NodeServicePublisher()
  publisher.setCustomCookie('env100', 'wechat', 'slave_user=gh_12345; slave_sid=xyz')

  assert.equal(publisher.customCookieStore.get('env100:wechat'), 'slave_user=gh_12345; slave_sid=xyz')

  publisher.setCustomCookie('env100', 'wechat', null)
  assert.equal(publisher.customCookieStore.has('env100:wechat'), false)
})
