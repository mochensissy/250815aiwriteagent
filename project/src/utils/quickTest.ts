/**
 * 快速端到端测试工具
 * 
 * 验证完整的写作流程：草稿 → 大纲 → 文章 → 配图
 * 用于开发阶段快速验证功能完整性
 */

import { callGeminiAPI, generateOutline, generateFullArticle, generateImage } from './api';
import { getAPIConfig } from './storage';

/**
 * 快速测试结果接口
 */
export interface QuickTestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  duration: number;
}

/**
 * 测试用的示例草稿
 */
const SAMPLE_DRAFT = `
最近我在思考人工智能对我们日常生活的深刻影响。从早上起床时用语音助手查看天气预报，到晚上用推荐算法选择要观看的电影，AI已经悄无声息地渗透到我们生活的每一个角落。

但是我发现，很多人对AI的态度是矛盾的。一方面，我们享受着AI带来的便利：智能导航帮我们避开拥堵，个性化推荐让我们更容易找到喜欢的内容，智能客服24小时为我们解答问题。另一方面，我们又对AI充满担忧：担心它会取代人类的工作，担心隐私泄露，担心失去人与人之间的真实连接。

我觉得关键在于我们如何与AI共存。AI不应该是人类的替代品，而应该是我们的增强器。它可以帮我们处理重复性的工作，让我们有更多时间专注于创造性和情感性的活动。比如，AI可以帮助医生快速诊断疾病，但医生的同理心和判断力是AI无法替代的。

未来的世界，我认为最成功的人不是那些与AI竞争的人，而是那些学会与AI协作的人。我们需要不断学习，适应这个快速变化的时代，同时保持人类独有的品质：创造力、同理心、批判性思维和道德判断。

这需要我们在教育、工作和生活中都做出相应的调整。我们要学会利用AI的优势，同时发展AI无法替代的能力。
`.trim();

/**
 * 运行快速端到端测试
 */
export const runQuickTest = async (): Promise<QuickTestResult[]> => {
  const results: QuickTestResult[] = [];
  let totalStartTime = Date.now();
  
  console.log('🚀 开始快速端到端测试...');
  console.log('📝 测试草稿长度:', SAMPLE_DRAFT.length, '字符');
  
  // 步骤1: 测试API配置
  let stepStartTime = Date.now();
  try {
    const config = getAPIConfig();
    const hasGemini = !!config.gemini.apiKey;
    const hasPerplexity = !!config.perplexity.apiKey;
    const hasDoubao = !!config.doubao.apiKey;
    
    results.push({
      step: '1. API配置检查',
      success: hasGemini,
      message: `Gemini: ${hasGemini ? '✅' : '❌'}, Perplexity: ${hasPerplexity ? '✅' : '❌'}, 豆包: ${hasDoubao ? '✅' : '❌'}`,
      data: { hasGemini, hasPerplexity, hasDoubao },
      duration: Date.now() - stepStartTime
    });
    
    if (!hasGemini) {
      console.log('❌ Gemini API未配置，跳过后续测试');
      return results;
    }
  } catch (error) {
    results.push({
      step: '1. API配置检查',
      success: false,
      message: `配置检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
      duration: Date.now() - stepStartTime
    });
    return results;
  }
  
  // 步骤2: 测试基础API连接
  stepStartTime = Date.now();
  try {
    console.log('🔗 测试Gemini API连接...');
    const testResponse = await callGeminiAPI('请简单回复"API连接正常"');
    
    results.push({
      step: '2. Gemini API连接',
      success: true,
      message: `连接成功，响应长度: ${testResponse.length}字符`,
      data: { response: testResponse.substring(0, 100) + '...' },
      duration: Date.now() - stepStartTime
    });
  } catch (error) {
    results.push({
      step: '2. Gemini API连接',
      success: false,
      message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
      duration: Date.now() - stepStartTime
    });
    return results;
  }
  
  // 步骤3: 测试大纲生成
  stepStartTime = Date.now();
  try {
    console.log('📋 测试大纲生成...');
    const outline = await generateOutline(SAMPLE_DRAFT, '个人观察和思考风格，语言亲切自然');
    
    if (outline && Array.isArray(outline) && outline.length > 0) {
      results.push({
        step: '3. 大纲生成',
        success: true,
        message: `大纲生成成功，包含${outline.length}个节点`,
        data: { 
          outlineCount: outline.length,
          titles: outline.map(node => node.title)
        },
        duration: Date.now() - stepStartTime
      });
    } else {
      results.push({
        step: '3. 大纲生成',
        success: false,
        message: '大纲生成失败或返回空结果',
        data: { outline },
        duration: Date.now() - stepStartTime
      });
      return results;
    }
  } catch (error) {
    results.push({
      step: '3. 大纲生成',
      success: false,
      message: `大纲生成异常: ${error instanceof Error ? error.message : '未知错误'}`,
      duration: Date.now() - stepStartTime
    });
    return results;
  }
  
  // 步骤4: 测试文章生成
  stepStartTime = Date.now();
  try {
    console.log('📄 测试文章生成...');
    
    // 使用简化的大纲进行测试
    const testOutline = [
      { id: '1', title: 'AI在日常生活中的普及', summary: '描述AI应用场景', level: 1, order: 0 },
      { id: '2', title: '人们对AI的复杂情感', summary: '分析矛盾心理', level: 1, order: 1 },
      { id: '3', title: '与AI共存的关键思考', summary: '探讨协作方式', level: 1, order: 2 }
    ];
    
    const article = await generateFullArticle(
      testOutline,
      SAMPLE_DRAFT,
      '个人观察和思考风格，语言亲切自然'
    );
    
    if (article && article.length > 200) {
      results.push({
        step: '4. 文章生成',
        success: true,
        message: `文章生成成功，长度${article.length}字符`,
        data: { 
          articleLength: article.length,
          preview: article.substring(0, 200) + '...'
        },
        duration: Date.now() - stepStartTime
      });
    } else {
      results.push({
        step: '4. 文章生成',
        success: false,
        message: '文章生成失败或内容过短',
        data: { article: article?.substring(0, 100) },
        duration: Date.now() - stepStartTime
      });
    }
  } catch (error) {
    results.push({
      step: '4. 文章生成',
      success: false,
      message: `文章生成异常: ${error instanceof Error ? error.message : '未知错误'}`,
      duration: Date.now() - stepStartTime
    });
  }
  
  // 步骤5: 测试图片生成（可选）
  stepStartTime = Date.now();
  try {
    const config = getAPIConfig();
    if (config.doubao.apiKey) {
      console.log('🎨 测试图片生成...');
      const imageUrl = await generateImage('科技感的AI概念图，蓝色调，现代简约风格', '512x512');
      
      if (imageUrl && imageUrl.startsWith('http')) {
        results.push({
          step: '5. 图片生成',
          success: true,
          message: '图片生成成功',
          data: { imageUrl },
          duration: Date.now() - stepStartTime
        });
      } else {
        results.push({
          step: '5. 图片生成',
          success: false,
          message: '图片生成失败或返回无效URL',
          data: { imageUrl },
          duration: Date.now() - stepStartTime
        });
      }
    } else {
      results.push({
        step: '5. 图片生成',
        success: false,
        message: '豆包API未配置，跳过图片生成测试',
        duration: Date.now() - stepStartTime
      });
    }
  } catch (error) {
    results.push({
      step: '5. 图片生成',
      success: false,
      message: `图片生成异常: ${error instanceof Error ? error.message : '未知错误'}`,
      duration: Date.now() - stepStartTime
    });
  }
  
  // 测试总结
  const totalDuration = Date.now() - totalStartTime;
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('📊 快速测试完成:');
  console.log(`   成功: ${successCount}/${totalCount} 项`);
  console.log(`   总耗时: ${totalDuration}ms`);
  console.log('📋 详细结果:');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.step}: ${result.message} (${result.duration}ms)`);
  });
  
  return results;
};

/**
 * 在浏览器控制台中运行快速测试
 */
export const runQuickTestInConsole = async () => {
  console.log('🧪 启动快速端到端测试...');
  console.log('⏱️  预计耗时: 30-60秒');
  console.log('💰 注意: 此测试会产生少量API调用费用');
  console.log('');
  
  try {
    const results = await runQuickTest();
    
    console.log('');
    console.log('🎯 测试结果总结:');
    console.log('='.repeat(50));
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试通过！应用功能正常。');
    } else if (successCount > 0) {
      console.log(`⚠️  部分测试通过 (${successCount}/${totalCount})，请检查失败项目。`);
    } else {
      console.log('❌ 所有测试失败，请检查API配置和网络连接。');
    }
    
    console.log(`⏱️  总耗时: ${(totalDuration / 1000).toFixed(1)}秒`);
    console.log('='.repeat(50));
    
    return results;
  } catch (error) {
    console.error('❌ 测试运行异常:', error);
    return [];
  }
};

