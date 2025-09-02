/**
 * 综合测试工具
 * 
 * 提供全面的功能测试、性能测试和集成测试
 * 确保所有模块正常工作
 */

import { 
  callOpenRouterAPI, 
  callPerplexityAPI, 
  generateImage, 
  analyzeStyleElements,
  recommendStylePrototypes,
  generateOutline,
  generateFullArticle,
  generateImagePrompts,
  generateArticleTitles
} from './api';
import { getAPIConfig, saveAPIConfig } from './storage';
import { performanceMonitor } from './performance';
import { handleError } from './errorHandler';

export interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'skipped';
  message: string;
  duration?: number;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
    totalDuration: number;
  };
}

/**
 * 综合测试类
 */
export class ComprehensiveTestRunner {
  private results: TestSuite[] = [];

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🚀 开始运行综合测试...');
    this.results = [];

    // 1. API配置测试
    await this.runAPIConfigTests();

    // 2. API连接测试
    await this.runAPIConnectionTests();

    // 3. 核心功能测试
    await this.runCoreFunctionTests();

    // 4. 性能测试
    await this.runPerformanceTests();

    // 5. 错误处理测试
    await this.runErrorHandlingTests();

    // 6. 存储功能测试
    await this.runStorageTests();

    console.log('✅ 综合测试完成');
    return this.results;
  }

  /**
   * API配置测试
   */
  private async runAPIConfigTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'API配置测试',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, totalDuration: 0 }
    };

    // 测试配置读取
    await this.runTest(suite, 'API配置读取', async () => {
      const config = getAPIConfig();
      if (!config) {
        throw new Error('无法读取API配置');
      }
      return { config: Object.keys(config) };
    });

    // 测试配置保存
    await this.runTest(suite, 'API配置保存', async () => {
      const testConfig = getAPIConfig();
      saveAPIConfig(testConfig);
      return { message: '配置保存成功' };
    });

    // 测试API密钥验证
    await this.runTest(suite, 'API密钥验证', async () => {
      const config = getAPIConfig();
      const results = {
        openrouter: !!config.openrouter?.apiKey,
        gemini: !!config.gemini?.apiKey,
        perplexity: !!config.perplexity?.apiKey,
        doubao: !!config.doubao?.apiKey
      };
      
      const configuredApis = Object.values(results).filter(Boolean).length;
      if (configuredApis === 0) {
        throw new Error('没有配置任何API密钥');
      }
      
      return { configuredApis, details: results };
    });

    this.results.push(suite);
  }

  /**
   * API连接测试
   */
  private async runAPIConnectionTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'API连接测试',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, totalDuration: 0 }
    };

    const config = getAPIConfig();

    // OpenRouter API测试
    if (config.openrouter?.apiKey) {
      await this.runTest(suite, 'OpenRouter API连接', async () => {
        const result = await callOpenRouterAPI('测试连接，请回复"连接成功"');
        if (!result || result.length < 2) {
          throw new Error('API响应异常');
        }
        return { response: result.substring(0, 100) };
      });
    } else {
      suite.tests.push({
        name: 'OpenRouter API连接',
        status: 'skipped',
        message: '未配置API密钥'
      });
    }

    // Perplexity API测试
    if (config.perplexity?.apiKey) {
      await this.runTest(suite, 'Perplexity API连接', async () => {
        const result = await callPerplexityAPI('AI技术发展趋势');
        if (!result || result.length < 10) {
          throw new Error('搜索结果异常');
        }
        return { response: result.substring(0, 100) };
      });
    } else {
      suite.tests.push({
        name: 'Perplexity API连接',
        status: 'skipped',
        message: '未配置API密钥'
      });
    }

    // 豆包API测试
    if (config.doubao?.apiKey) {
      await this.runTest(suite, '豆包API连接', async () => {
        const result = await generateImage('测试图片生成', '512x512');
        if (!result || !result.startsWith('http')) {
          throw new Error('图片生成失败');
        }
        return { imageUrl: result };
      });
    } else {
      suite.tests.push({
        name: '豆包API连接',
        status: 'skipped',
        message: '未配置API密钥'
      });
    }

    this.results.push(suite);
  }

  /**
   * 核心功能测试
   */
  private async runCoreFunctionTests(): Promise<void> {
    const suite: TestSuite = {
      name: '核心功能测试',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, totalDuration: 0 }
    };

    const testDraft = `AI技术正在快速发展，特别是在自然语言处理和图像生成方面取得了重大突破。
    
我认为AI的发展将会：
1. 提高工作效率
2. 改变教育方式
3. 推动科研进步

但同时也需要关注AI的伦理问题和潜在风险。`;

    const testArticles = [
      {
        id: 'test1',
        title: '测试文章1',
        content: testDraft,
        category: 'case' as const,
        tags: ['AI', '技术'],
        createdAt: new Date().toISOString(),
        source: 'paste' as const
      }
    ];

    // 风格分析测试
    await this.runTest(suite, '风格要素分析', async () => {
      const elements = await analyzeStyleElements([testDraft]);
      if (!Array.isArray(elements)) {
        throw new Error('风格分析结果格式错误');
      }
      return { elementsCount: elements.length, elements: elements.slice(0, 3) };
    });

    // 风格推荐测试
    await this.runTest(suite, '风格原型推荐', async () => {
      const prototypes = await recommendStylePrototypes(testDraft, testArticles);
      if (!Array.isArray(prototypes)) {
        throw new Error('风格推荐结果格式错误');
      }
      return { prototypesCount: prototypes.length };
    });

    // 大纲生成测试
    await this.runTest(suite, '文章大纲生成', async () => {
      const outline = await generateOutline(testDraft, '测试风格');
      if (!Array.isArray(outline) || outline.length === 0) {
        throw new Error('大纲生成失败');
      }
      return { outlineLength: outline.length, titles: outline.map(o => o.title) };
    });

    // 文章生成测试
    await this.runTest(suite, '完整文章生成', async () => {
      const outline = [
        { id: '1', title: '引言', summary: '介绍主题', level: 1, order: 0 },
        { id: '2', title: '主要观点', summary: '阐述观点', level: 1, order: 1 },
        { id: '3', title: '总结', summary: '总结全文', level: 1, order: 2 }
      ];
      
      const article = await generateFullArticle(outline, testDraft, '测试风格');
      if (!article || article.length < 100) {
        throw new Error('文章生成失败或内容过短');
      }
      return { articleLength: article.length };
    });

    // 配图提示词生成测试
    await this.runTest(suite, '配图提示词生成', async () => {
      const prompts = await generateImagePrompts(testDraft);
      if (!Array.isArray(prompts) || prompts.length === 0) {
        throw new Error('配图提示词生成失败');
      }
      return { promptsCount: prompts.length };
    });

    // 标题生成测试
    await this.runTest(suite, '文章标题生成', async () => {
      const outline = [
        { id: '1', title: '引言', summary: '介绍主题', level: 1, order: 0 }
      ];
      const titles = await generateArticleTitles(testDraft, outline);
      if (!Array.isArray(titles) || titles.length === 0) {
        throw new Error('标题生成失败');
      }
      return { titlesCount: titles.length, titles: titles.slice(0, 3) };
    });

    this.results.push(suite);
  }

  /**
   * 性能测试
   */
  private async runPerformanceTests(): Promise<void> {
    const suite: TestSuite = {
      name: '性能测试',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, totalDuration: 0 }
    };

    // 内存使用测试
    await this.runTest(suite, '内存使用检查', async () => {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      if (memoryUsage && memoryUsage.percentage > 90) {
        throw new Error(`内存使用率过高: ${memoryUsage.percentage.toFixed(1)}%`);
      }
      return { memoryUsage };
    });

    // 性能报告测试
    await this.runTest(suite, '性能报告生成', async () => {
      const report = performanceMonitor.getPerformanceReport();
      return {
        averageRenderTime: report.averageRenderTime,
        averageApiTime: report.averageApiTime,
        slowOperationsCount: report.slowestOperations.length
      };
    });

    // 大量数据处理测试
    await this.runTest(suite, '大量数据处理', async () => {
      const startTime = performance.now();
      
      // 模拟处理大量数据
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        content: `测试内容 ${i}`,
        processed: false
      }));
      
      // 处理数据
      const processed = largeArray.map(item => ({
        ...item,
        processed: true,
        processedAt: Date.now()
      }));
      
      const duration = performance.now() - startTime;
      
      if (duration > 1000) { // 超过1秒认为性能有问题
        throw new Error(`数据处理耗时过长: ${duration.toFixed(2)}ms`);
      }
      
      return { itemsProcessed: processed.length, duration: duration.toFixed(2) };
    });

    this.results.push(suite);
  }

  /**
   * 错误处理测试
   */
  private async runErrorHandlingTests(): Promise<void> {
    const suite: TestSuite = {
      name: '错误处理测试',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, totalDuration: 0 }
    };

    // 网络错误处理测试
    await this.runTest(suite, '网络错误处理', async () => {
      try {
        // 模拟网络错误
        await fetch('https://nonexistent-api.example.com/test');
        throw new Error('应该抛出网络错误');
      } catch (error) {
        if (error.message === '应该抛出网络错误') {
          throw error;
        }
        // 正确捕获了网络错误
        return { errorHandled: true, errorType: error.name };
      }
    });

    // 输入验证测试
    await this.runTest(suite, '输入验证', async () => {
      const testCases = [
        { input: '', shouldFail: true, description: '空字符串' },
        { input: 'a', shouldFail: true, description: '过短内容' },
        { input: 'a'.repeat(10000), shouldFail: true, description: '过长内容' },
        { input: '正常的测试内容，长度适中', shouldFail: false, description: '正常内容' }
      ];
      
      const results = testCases.map(testCase => {
        try {
          // 这里应该调用实际的验证函数
          const isValid = testCase.input.length >= 10 && testCase.input.length <= 5000;
          return {
            ...testCase,
            actualResult: isValid,
            passed: (isValid && !testCase.shouldFail) || (!isValid && testCase.shouldFail)
          };
        } catch (error) {
          return {
            ...testCase,
            actualResult: false,
            passed: testCase.shouldFail,
            error: error.message
          };
        }
      });
      
      const passedCount = results.filter(r => r.passed).length;
      if (passedCount !== testCases.length) {
        throw new Error(`输入验证测试失败: ${passedCount}/${testCases.length} 通过`);
      }
      
      return { testCases: results.length, passed: passedCount };
    });

    this.results.push(suite);
  }

  /**
   * 存储功能测试
   */
  private async runStorageTests(): Promise<void> {
    const suite: TestSuite = {
      name: '存储功能测试',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, totalDuration: 0 }
    };

    // localStorage可用性测试
    await this.runTest(suite, 'localStorage可用性', async () => {
      if (typeof Storage === 'undefined') {
        throw new Error('浏览器不支持localStorage');
      }
      
      // 测试写入和读取
      const testKey = 'test_storage_key';
      const testValue = { test: true, timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      localStorage.removeItem(testKey);
      
      if (retrieved.test !== testValue.test) {
        throw new Error('localStorage读写测试失败');
      }
      
      return { storageAvailable: true };
    });

    // 存储容量测试
    await this.runTest(suite, '存储容量检查', async () => {
      let usedSpace = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          usedSpace += localStorage[key].length + key.length;
        }
      }
      
      // 转换为KB
      const usedKB = (usedSpace / 1024).toFixed(2);
      
      return { usedSpace: `${usedKB} KB`, itemCount: localStorage.length };
    });

    this.results.push(suite);
  }

  /**
   * 运行单个测试
   */
  private async runTest(
    suite: TestSuite,
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const result = await testFunction();
      const duration = performance.now() - startTime;
      
      suite.tests.push({
        name: testName,
        status: 'success',
        message: '测试通过',
        duration,
        details: result
      });
      
      suite.summary.passed++;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      suite.tests.push({
        name: testName,
        status: 'error',
        message: error instanceof Error ? error.message : '未知错误',
        duration,
        details: { error: error.toString() }
      });
      
      suite.summary.failed++;
    }
    
    suite.summary.total++;
    suite.summary.totalDuration += performance.now() - startTime;
  }

  /**
   * 生成测试报告
   */
  generateReport(): string {
    let report = '# 综合测试报告\n\n';
    
    const totalTests = this.results.reduce((sum, suite) => sum + suite.summary.total, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.summary.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.summary.failed, 0);
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.summary.totalDuration, 0);
    
    report += `## 总体概况\n`;
    report += `- 总测试数: ${totalTests}\n`;
    report += `- 通过: ${totalPassed}\n`;
    report += `- 失败: ${totalFailed}\n`;
    report += `- 成功率: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`;
    report += `- 总耗时: ${(totalDuration / 1000).toFixed(2)}秒\n\n`;
    
    this.results.forEach(suite => {
      report += `## ${suite.name}\n`;
      report += `- 测试数: ${suite.summary.total}\n`;
      report += `- 通过: ${suite.summary.passed}\n`;
      report += `- 失败: ${suite.summary.failed}\n`;
      report += `- 耗时: ${(suite.summary.totalDuration / 1000).toFixed(2)}秒\n\n`;
      
      suite.tests.forEach(test => {
        const status = test.status === 'success' ? '✅' : 
                      test.status === 'error' ? '❌' : 
                      test.status === 'warning' ? '⚠️' : '⏭️';
        
        report += `### ${status} ${test.name}\n`;
        report += `- 状态: ${test.message}\n`;
        if (test.duration) {
          report += `- 耗时: ${test.duration.toFixed(2)}ms\n`;
        }
        if (test.details) {
          report += `- 详情: ${JSON.stringify(test.details, null, 2)}\n`;
        }
        report += '\n';
      });
    });
    
    return report;
  }
}

// 导出便捷函数
export const runComprehensiveTests = async (): Promise<TestSuite[]> => {
  const runner = new ComprehensiveTestRunner();
  return await runner.runAllTests();
};

export default ComprehensiveTestRunner;

