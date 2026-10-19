# 代理测试脚本

用于测试多个代理服务商的连通性、速度和稳定性的工具。

## 📋 功能特性

- ✅ 支持多个代理服务商对比测试
- ✅ 可配置测试网站和测试次数  
- ✅ 详细的成功率和响应时间统计
- ✅ 自动生成测试报告并保存到文件
- ✅ 智能排序推荐最优代理

## 🚀 快速开始

### 1. 配置代理信息

编辑 `example.ts` 文件，填入你的代理服务商信息：

```typescript
const proxies: IWebProxy[] = [
  {
    serverAdd: '你的代理1地址',
    serverPort: 1080,
    type: 'socks5',
    userName: '用户名1', 
    password: '密码1'
  },
  // ... 其他代理配置
];
```

### 2. 配置测试参数

```typescript
const config = {
  testSites: [
    'https://www.baidu.com',
    'https://www.google.com',
    // ... 更多测试网站
  ],
  testCount: 10,    // 每个网站测试次数
  timeout: 15000    // 超时时间(毫秒)
};
```

### 3. 运行测试

```bash
# 方式1：运行示例文件
npx ts-node proxy/example.ts

# 方式2：直接运行测试脚本
npx ts-node proxy/test-proxy.ts
```

## 📊 测试报告示例

```
🎯 代理测试报告
============================================================
测试配置: 7个网站, 每站10次请求
超时设置: 15秒

📊 代理1 [proxy1.com:1080]
- 总成功率: 65/70 (92.9%)
- 平均耗时: 1245ms
- 耗时范围: 234ms - 3421ms
  └─ www.baidu.com: 10/10 (100.0%) 平均856ms
  └─ www.google.com: 8/10 (80.0%) 平均2134ms
  └─ github.com: 10/10 (100.0%) 平均1456ms
  └─ httpbin.org: 9/10 (90.0%) 平均987ms
  └─ www.bing.com: 10/10 (100.0%) 平均1234ms
  └─ stackoverflow.com: 8/10 (80.0%) 平均1876ms
  └─ www.youtube.com: 10/10 (100.0%) 平均2345ms
- 错误类型: 请求超时, ECONNRESET

📊 代理2 [proxy2.com:1080]
- 总成功率: 58/70 (82.9%)
- 平均耗时: 1876ms
...

🏆 推荐排序:
🥇 1. 代理1 (92.9%成功率, 1245ms平均)
🥈 2. 代理3 (89.1%成功率, 1567ms平均)  
🥉 3. 代理2 (82.9%成功率, 1876ms平均)

测试完成! 🎉
```

## ⚙️ 配置选项

### TestConfig 接口

```typescript
interface TestConfig {
  testSites: string[];    // 测试网站列表
  testCount: number;      // 每个网站测试次数
  timeout?: number;       // 请求超时时间(ms)，默认10秒
}
```

### IWebProxy 接口

```typescript
interface IWebProxy {
  serverAdd: string;      // 代理地址
  serverPort: number;     // 代理端口
  userName?: string;      // 用户名
  password?: string;      // 密码
  type?: 'http' | 'socks5' | 'socks4';  // 代理类型
}
```

## 📈 评分算法

综合评分 = 成功率 × 70% + 速度评分 × 30%

- **成功率**: 所有请求的成功百分比
- **速度评分**: 基于平均响应时间的反向评分

## 📁 输出文件

测试完成后会自动生成报告文件：
- 文件名格式: `test-report-{timestamp}.txt`
- 保存位置: `proxy/` 目录下
- 包含完整的测试结果和统计信息

## 🔧 自定义配置

### 添加更多测试网站

```typescript
testSites: [
  'https://www.example.com',
  'https://api.github.com',
  'https://www.reddit.com',
  // 添加你需要测试的网站
]
```

### 调整测试强度

```typescript
testCount: 20,     // 增加测试次数提高准确性
timeout: 30000,    // 增加超时时间适应慢速网络
```

## ⚠️ 注意事项

1. 请确保代理信息正确，包括地址、端口、用户名和密码
2. 测试会产生实际的网络请求，请注意代理服务商的使用限制
3. 建议在非高峰时段进行测试以获得更准确的结果
4. 某些网站可能有反爬虫机制，影响测试结果

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个工具！ 