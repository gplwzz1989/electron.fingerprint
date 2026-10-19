import { IWebProxy, createKuaiProxyAgent } from '../../src/media-platform/webproxy';
import * as http from 'http';
import * as https from 'https';
import fs from 'fs';

interface TestConfig {
  /** 测试网站列表 */
  testSites: string[];
  /** 每个网站的测试次数 */
  testCount: number;
  /** 请求超时时间(ms) */
  timeout?: number;
}

interface TestResult {
  proxy: IWebProxy;
  proxyName: string;
  totalRequests: number;
  successCount: number;
  successRate: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  siteResults: SiteResult[];
  errors: string[];
}

interface SiteResult {
  site: string;
  requests: number;
  successes: number;
  successRate: number;
  avgTime: number;
  errors: string[];
}

interface RequestResult {
  success: boolean;
  responseTime: number;
  error?: string;
}

/**
 * 单次HTTP请求测试
 */
async function testSingleRequest(url: string, proxy: IWebProxy, timeout: number = 10000): Promise<RequestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const agent = createKuaiProxyAgent(proxy as any);

    if (!agent) {
      resolve({
        success: false,
        responseTime: 0,
        error: '代理创建失败',
      });
      return;
    }

    const isHttps = url.startsWith('https');
    const httpModule = isHttps ? https : http;

    const options = {
      agent: agent,
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };

    const req = httpModule.get(url, options, (res) => {
      const responseTime = Date.now() - startTime;

      // 读取响应数据
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve({
            success: true,
            responseTime: responseTime,
          });
        } else {
          resolve({
            success: false,
            responseTime: responseTime,
            error: `HTTP ${res.statusCode}`,
          });
        }
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        responseTime: responseTime,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        responseTime: timeout,
        error: '请求超时',
      });
    });
  });
}

/**
 * 测试单个网站
 */
async function testSite(site: string, proxy: IWebProxy, testCount: number, timeout: number): Promise<SiteResult> {
  console.log(`  测试 ${site} (${testCount}次)`);

  const results: RequestResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < testCount; i++) {
    process.stdout.write(`    进度: ${i + 1}/${testCount}\r`);

    const result = await testSingleRequest(site, proxy, timeout);
    results.push(result);

    if (!result.success && result.error) {
      errors.push(result.error);
    }

    // 请求间隔，避免过于频繁
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(''); // 换行

  const successes = results.filter((r) => r.success);
  const avgTime = successes.length > 0 ? successes.reduce((sum, r) => sum + r.responseTime, 0) / successes.length : 0;

  return {
    site: site,
    requests: testCount,
    successes: successes.length,
    successRate: (successes.length / testCount) * 100,
    avgTime: Math.round(avgTime),
    errors: [...new Set(errors)], // 去重
  };
}

/**
 * 测试单个代理
 */
async function testProxy(proxy: IWebProxy, config: TestConfig, index: number): Promise<TestResult> {
  const proxyName = `代理${index + 1} [${proxy.serverAdd}:${proxy.serverPort}]`;
  console.log(`\n🔍 测试 ${proxyName}`);

  const siteResults: SiteResult[] = [];
  const allErrors: string[] = [];

  for (const site of config.testSites) {
    const siteResult = await testSite(site, proxy, config.testCount, config.timeout || 10000);
    siteResults.push(siteResult);
    allErrors.push(...siteResult.errors);
  }

  // 计算总体统计
  const totalRequests = siteResults.reduce((sum, r) => sum + r.requests, 0);
  const totalSuccesses = siteResults.reduce((sum, r) => sum + r.successes, 0);
  const allSuccessfulTimes = siteResults.flatMap((r) => {
    // 这里简化处理，用平均时间近似
    return Array(r.successes).fill(r.avgTime);
  });

  const avgResponseTime =
    allSuccessfulTimes.length > 0
      ? Math.round(allSuccessfulTimes.reduce((sum, time) => sum + time, 0) / allSuccessfulTimes.length)
      : 0;

  const minResponseTime = allSuccessfulTimes.length > 0 ? Math.min(...allSuccessfulTimes) : 0;
  const maxResponseTime = allSuccessfulTimes.length > 0 ? Math.max(...allSuccessfulTimes) : 0;

  return {
    proxy: proxy,
    proxyName: proxyName,
    totalRequests: totalRequests,
    successCount: totalSuccesses,
    successRate: (totalSuccesses / totalRequests) * 100,
    avgResponseTime: avgResponseTime,
    minResponseTime: minResponseTime,
    maxResponseTime: maxResponseTime,
    siteResults: siteResults,
    errors: [...new Set(allErrors)],
  };
}

/**
 * 生成测试报告
 */
function generateReport(results: TestResult[], config: TestConfig): string {
  const report: string[] = [];

  report.push('');
  report.push('🎯 代理测试报告');
  report.push('='.repeat(60));
  report.push(`测试配置: ${config.testSites.length}个网站, 每站${config.testCount}次请求`);
  report.push(`超时设置: ${(config.timeout || 10000) / 1000}秒`);
  report.push('');

  // 详细结果
  results.forEach((result, index) => {
    report.push(`📊 ${result.proxyName}`);
    report.push(`- 总成功率: ${result.successCount}/${result.totalRequests} (${result.successRate.toFixed(1)}%)`);
    report.push(`- 平均耗时: ${result.avgResponseTime}ms`);
    report.push(`- 耗时范围: ${result.minResponseTime}ms - ${result.maxResponseTime}ms`);

    // 各网站详情
    result.siteResults.forEach((site) => {
      const siteName = new URL(site.site).hostname;
      report.push(
        `  └─ ${siteName}: ${site.successes}/${site.requests} (${site.successRate.toFixed(1)}%) 平均${site.avgTime}ms`,
      );
    });

    // 错误信息
    if (result.errors.length > 0) {
      report.push(`- 错误类型: ${result.errors.join(', ')}`);
    }

    report.push('');
  });

  // 排序推荐
  const sortedResults = [...results].sort((a, b) => {
    // 综合评分：成功率权重70%，速度权重30%
    const scoreA = a.successRate * 0.7 + (10000 / Math.max(a.avgResponseTime, 1)) * 0.3;
    const scoreB = b.successRate * 0.7 + (10000 / Math.max(b.avgResponseTime, 1)) * 0.3;
    return scoreB - scoreA;
  });

  report.push('🏆 推荐排序:');
  sortedResults.forEach((result, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
    report.push(
      `${medal} ${index + 1}. ${result.proxyName.split(' ')[0]} (${result.successRate.toFixed(1)}%成功率, ${
        result.avgResponseTime
      }ms平均)`,
    );
  });

  report.push('');
  report.push('测试完成! 🎉');

  return report.join('\n');
}

/**
 * 主测试函数
 */
export async function testProxies(proxies: IWebProxy[], config: TestConfig): Promise<void> {
  console.log('🚀 开始代理测试...');
  console.log(`测试目标: ${config.testSites.length}个网站`);
  console.log(`测试次数: 每个网站${config.testCount}次`);
  console.log(`超时设置: ${(config.timeout || 10000) / 1000}秒`);

  const results: TestResult[] = [];

  // 串行测试每个代理（避免并发过多）
  for (let i = 0; i < proxies.length; i++) {
    const result = await testProxy(proxies[i], config, i);
    results.push(result);
  }

  // 生成并输出报告
  const report = generateReport(results, config);
  console.log(report);

  // 保存报告到文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test/proxy/test-report-${timestamp}.txt`;

  try {
    fs.writeFileSync(filename, report, 'utf8');
    console.log(`📄 报告已保存到: ${filename}`);
  } catch (error) {
    console.log('⚠️  报告保存失败，但测试已完成');
  }
}

// 示例用法
if (require.main === module) {
  const proxies: IWebProxy[] = [
    {
      serverAdd: 'proxy1.example.com',
      serverPort: 1080,
      type: 'socks5',
      userName: 'user1',
      password: 'pass1',
    },
    {
      serverAdd: 'proxy2.example.com',
      serverPort: 1080,
      type: 'socks5',
      userName: 'user2',
      password: 'pass2',
    },
    {
      serverAdd: 'proxy3.example.com',
      serverPort: 1080,
      type: 'socks5',
      userName: 'user3',
      password: 'pass3',
    },
  ];

  const config: TestConfig = {
    testSites: [
      'https://www.baidu.com',
      'https://www.google.com',
      'https://github.com',
      'https://httpbin.org/ip',
      'https://www.bing.com',
    ],
    testCount: 5, // 示例用较少次数
    timeout: 10000,
  };

  testProxies(proxies, config).catch(console.error);
}
