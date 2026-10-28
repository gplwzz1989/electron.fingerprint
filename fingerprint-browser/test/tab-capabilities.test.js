const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { TabCapabilities } = require('../tab-capabilities')

let id = 0
function contents (url) { const value = new EventEmitter(); Object.assign(value, { id: ++id, mainFrame: { url }, isDestroyed: () => false }); return value }
const caller = sender => ({ sender, senderFrame: sender.mainFrame })
test('固定首页绑定具体 WebContents 与页面，普通标签访问相同地址不提权', () => {
  const registry = new TabCapabilities(); const url = 'https://workspace.example/'
  const home = contents(url + '#accounts'); registry.register(home, 'home', { pinnedUrl: url })
  registry.assert(caller(home), 'profiles:list'); registry.assert(caller(home), 'automation:request')
  const ordinary = contents(url); registry.register(ordinary, 'ordinary')
  assert.throws(() => registry.assert(caller(ordinary), 'profiles:list'))
  assert.throws(() => registry.update(ordinary, { capabilities: ['*'], allowedOrigins: ['https://workspace.example'] }))
  home.mainFrame.url = 'https://other.example/'
  assert.throws(() => registry.assert(caller(home), 'profiles:list'))
})
test('子框架、伪造身份、关闭后身份均不可继承权限', () => {
  const registry = new TabCapabilities(); const home = contents('https://workspace.example/')
  registry.register(home, 'home', { pinnedUrl: home.mainFrame.url })
  assert.throws(() => registry.assert({ sender: home, senderFrame: { url: home.mainFrame.url } }, 'profiles:list'))
  const impostor = contents(home.mainFrame.url); impostor.id = home.id
  assert.throws(() => registry.assert(caller(impostor), 'profiles:list'))
  home.emit('destroyed'); assert.throws(() => registry.assert(caller(home), 'profiles:list'))
})
test('系统标签可按能力授权、即时撤销及扩大授权，不能自行管理其他授权', () => {
  const registry = new TabCapabilities(); const tab = contents('https://platform.example/creator')
  registry.register(tab, 'managed', { capabilities: ['profiles'], allowedOrigins: ['https://platform.example'] })
  registry.assert(caller(tab), 'profiles:list'); assert.throws(() => registry.assert(caller(tab), 'groups:list'))
  registry.update(tab, { capabilities: [] }); assert.throws(() => registry.assert(caller(tab), 'profiles:list'))
  registry.update(tab, { capabilities: ['*'] }); registry.assert(caller(tab), 'automation:request')
  assert.throws(() => registry.assert(caller(tab), 'tabs:set-capabilities'))
  assert.throws(() => registry.assert(caller(tab), 'tabs:create-managed'))
  tab.mainFrame.url = 'https://redirect.example/'
  assert.throws(() => registry.assert(caller(tab), 'profiles:list'))
  registry.update(tab, { allowedOrigins: ['https://redirect.example'] }); registry.assert(caller(tab), 'profiles:list')
  registry.revoke(tab); assert.throws(() => registry.assert(caller(tab), 'profiles:list'))
})
test('本机外壳只持有浏览器控制能力，未知能力和非法来源不接受', () => {
  const registry = new TabCapabilities(); const shell = contents('file:///app/browser-shell.html')
  registry.register(shell, 'shell', { pinnedUrl: shell.mainFrame.url })
  registry.assert(caller(shell), 'window:action'); registry.assert(caller(shell), 'tabs:ordinary')
  assert.throws(() => registry.assert(caller(shell), 'profiles:list'))
  assert.throws(() => registry.normalize({ capabilities: ['unknown'] }))
  assert.throws(() => registry.normalize({ allowedOrigins: ['https://platform.example/creator'] }))
})
