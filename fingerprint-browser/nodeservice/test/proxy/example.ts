import { testProxies } from './test-proxy';
import { IWebProxy } from '../../src/media-platform/webproxy';

/**
 * 代理测试使用示例
 */
async function runProxyTest() {
  // 配置你的三个代理服务商
  const proxies: IWebProxy[] = [
    {
      serverAdd: '106.15.138.47',
      serverPort: 44001,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44002,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44003,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44004,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44005,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44006,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44007,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44008,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44009,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    },
    {
      serverAdd: '106.15.138.47',
      serverPort: 44010,
      type: 'socks5',
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    }
  ];

  // 测试配置
  const config = {
    // 测试网站列表 - 可以根据需要调整
    testSites: [
      'https://weibo.com',
      'https://bilibili.com',
      'https://creator.douyin.com',
      'https://creator.xiaohongshu.com',
      'https://cp.kuaishou.com',
      'https://channels.weixin.qq.com/',
      'https://mp.toutiao.com',
      'https://baijiahao.baidu.com',
    ],
    testCount: 10, // 每个网站测试10次 - 可以调整
    timeout: 15000, // 15秒超时 - 可以调整
  };

  try {
    await testProxies(proxies, config);
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  runProxyTest();
}

export { runProxyTest };
