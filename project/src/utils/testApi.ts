/**
 * API测试工具
 * 
 * 提供独立的API测试功能，用于验证各个API服务的连接状态
 * 包含详细的测试日志和错误处理
 */

import { callGeminiAPI, callPerplexityAPI, generateImage, generateOutline, generateFullArticle } from './api';
import { getAPIConfig } from './storage';

/**
 * 测试结果接口
 */
export interface TestResult {
  success: boolean;
  message: string;
  responseTime: number;
  data?: any;
  error?: string;
}

/**
 * 测试Gemini API连接和基本功能
 */
export const testGeminiConnection = async (): Promise<TestResult> => {
  const startTime = Date.now();
  console.log('🧪 开始测试Gemini API连接...');
  
  try {
    const config = getAPIConfig();
    
    if (!config.gemini.apiKey) {
      return {
        success: false,
        message: 'Gemini API密钥未配置',
        responseTime: Date.now() - startTime,
        error: 'API密钥缺失'
      };
    }

    // 测试简单的文本生成
    const testPrompt = '请简单回复"Gemini API连接成功"，不要添加其他内容。';
    const result = await callGeminiAPI(testPrompt);
    
    const responseTime = Date.now() - startTime;
    
    if (result && result.length > 0) {
      console.log('✅ Gemini API测试成功');
      return {
        success: true,
        message: 'Gemini API连接成功',
        responseTime,
        data: result.substring(0, 100) + (result.length > 100 ? '...' : '')
      };
    } else {
      console.log('❌ Gemini API返回空结果');
      return {
        success: false,
        message: 'Gemini API返回空结果',
        responseTime,
        error: '返回数据为空'
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Gemini API测试失败:', error);
    
    return {
      success: false,
      message: 'Gemini API连接失败',
      responseTime,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 测试Perplexity API连接和搜索功能
 */
export const testPerplexityConnection = async (): Promise<TestResult> => {
  const startTime = Date.now();
  console.log('🧪 开始测试Perplexity API连接...');
  
  try {
    const config = getAPIConfig();
    
    if (!config.perplexity.apiKey) {
      return {
        success: false,
        message: 'Perplexity API密钥未配置',
        responseTime: Date.now() - startTime,
        error: 'API密钥缺失'
      };
    }

    // 测试简单的搜索查询
    const testQuery = '什么是人工智能？请简短回答。';
    const result = await callPerplexityAPI(testQuery);
    
    const responseTime = Date.now() - startTime;
    
    if (result && result.length > 0) {
      console.log('✅ Perplexity API测试成功');
      return {
        success: true,
        message: 'Perplexity API连接成功',
        responseTime,
        data: result.substring(0, 200) + (result.length > 200 ? '...' : '')
      };
    } else {
      console.log('❌ Perplexity API返回空结果');
      return {
        success: false,
        message: 'Perplexity API返回空结果',
        responseTime,
        error: '返回数据为空'
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Perplexity API测试失败:', error);
    
    return {
      success: false,
      message: 'Perplexity API连接失败',
      responseTime,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 测试豆包生图API连接和图片生成功能
 */
export const testDoubaoConnection = async (): Promise<TestResult> => {
  const startTime = Date.now();
  console.log('🧪 开始测试豆包生图API连接...');
  
  try {
    const config = getAPIConfig();
    
    if (!config.doubao.apiKey) {
      return {
        success: false,
        message: '豆包API密钥未配置',
        responseTime: Date.now() - startTime,
        error: 'API密钥缺失'
      };
    }

    // 测试简单的图片生成
    const testPrompt = '一朵简单的红色玫瑰花，白色背景，简约风格';
    const result = await generateImage(testPrompt, '512x512');
    
    const responseTime = Date.now() - startTime;
    
    if (result && result.startsWith('http')) {
      console.log('✅ 豆包生图API测试成功');
      return {
        success: true,
        message: '豆包生图API连接成功',
        responseTime,
        data: result
      };
    } else {
      console.log('❌ 豆包生图API返回无效结果');
      return {
        success: false,
        message: '豆包生图API返回无效结果',
        responseTime,
        error: '返回的不是有效的图片URL'
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ 豆包生图API测试失败:', error);
    
    return {
      success: false,
      message: '豆包生图API连接失败',
      responseTime,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 测试大纲生成功能
 */
export const testOutlineGeneration = async (): Promise<TestResult> => {
  const startTime = Date.now();
  console.log('🧪 开始测试大纲生成功能...');
  
  try {
    const testDraft = `
我最近在思考人工智能对我们日常生活的影响。从早上起床用语音助手查看天气，到晚上用推荐算法选择要看的电影，AI已经无处不在。

但是我发现，很多人对AI既充满期待又有些担忧。期待的是它能让我们的生活更便利，担忧的是它可能会取代人类的工作。

我觉得关键在于我们如何与AI共存，如何利用它的优势同时保持人类的独特价值。这需要我们不断学习和适应。
    `.trim();

    const styleContext = '个人观察和思考风格，语言亲切自然，善于从生活细节中提炼深层思考';
    
    // 使用已导入的大纲生成函数
    const result = await generateOutline(testDraft, styleContext);
    
    const responseTime = Date.now() - startTime;
    
    if (result && Array.isArray(result) && result.length > 0) {
      console.log('✅ 大纲生成测试成功');
      return {
        success: true,
        message: `大纲生成成功，包含${result.length}个节点`,
        responseTime,
        data: result
      };
    } else {
      console.log('❌ 大纲生成返回空结果');
      return {
        success: false,
        message: '大纲生成失败',
        responseTime,
        error: '返回的大纲数据无效'
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ 大纲生成测试失败:', error);
    
    return {
      success: false,
      message: '大纲生成功能测试失败',
      responseTime,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 测试文章生成功能
 */
export const testArticleGeneration = async (): Promise<TestResult> => {
  const startTime = Date.now();
  console.log('🧪 开始测试文章生成功能...');
  
  try {
    const testOutline = [
      { id: '1', title: 'AI在日常生活中的普及', summary: '描述AI在生活中的各种应用场景', level: 1, order: 0 },
      { id: '2', title: '人们对AI的复杂情感', summary: '分析人们对AI既期待又担忧的心理', level: 1, order: 1 },
      { id: '3', title: '与AI共存的关键思考', summary: '探讨如何更好地与AI协作发展', level: 1, order: 2 }
    ];

    const testDraft = 'AI已经深入我们的日常生活，我们需要学会与它共存...';
    const styleContext = '个人观察和思考风格，语言亲切自然';
    
    // 使用已导入的文章生成函数
    const result = await generateFullArticle(testOutline, testDraft, styleContext);
    
    const responseTime = Date.now() - startTime;
    
    if (result && result.length > 100) {
      console.log('✅ 文章生成测试成功');
      return {
        success: true,
        message: `文章生成成功，长度${result.length}字符`,
        responseTime,
        data: result.substring(0, 300) + (result.length > 300 ? '...' : '')
      };
    } else {
      console.log('❌ 文章生成返回内容过短');
      return {
        success: false,
        message: '文章生成失败',
        responseTime,
        error: '生成的文章内容过短或为空'
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ 文章生成测试失败:', error);
    
    return {
      success: false,
      message: '文章生成功能测试失败',
      responseTime,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 运行所有API测试
 */
export const runAllTests = async (): Promise<{[key: string]: TestResult}> => {
  console.log('🚀 开始运行所有API测试...');
  
  const results: {[key: string]: TestResult} = {};
  
  // 并行运行基础连接测试
  const [geminiResult, perplexityResult, doubaoResult] = await Promise.allSettled([
    testGeminiConnection(),
    testPerplexityConnection(),
    testDoubaoConnection()
  ]);
  
  results.gemini = geminiResult.status === 'fulfilled' ? geminiResult.value : {
    success: false,
    message: 'Gemini测试异常',
    responseTime: 0,
    error: geminiResult.reason
  };
  
  results.perplexity = perplexityResult.status === 'fulfilled' ? perplexityResult.value : {
    success: false,
    message: 'Perplexity测试异常',
    responseTime: 0,
    error: perplexityResult.reason
  };
  
  results.doubao = doubaoResult.status === 'fulfilled' ? doubaoResult.value : {
    success: false,
    message: '豆包测试异常',
    responseTime: 0,
    error: doubaoResult.reason
  };
  
  // 如果Gemini连接成功，继续测试高级功能
  if (results.gemini.success) {
    console.log('📝 Gemini连接成功，测试高级功能...');
    
    try {
      results.outline = await testOutlineGeneration();
      
      if (results.outline.success) {
        results.article = await testArticleGeneration();
      }
    } catch (error) {
      console.error('❌ 高级功能测试失败:', error);
    }
  }
  
  // 输出测试总结
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`📊 测试完成: ${successCount}/${totalCount} 项通过`);
  console.log('📋 测试结果详情:');
  
  Object.entries(results).forEach(([key, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${result.message} (${result.responseTime}ms)`);
  });
  
  return results;
};