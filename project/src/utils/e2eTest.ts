/**
 * 端到端测试工具
 * 
 * 验证完整的AI写作流程，从草稿输入到图文并茂文章生成
 */

import { callOpenRouterAPI, generateImagePrompts, generateImage } from './api';
import { getAPIConfig } from './storage';

/**
 * 测试完整的写作流程
 */
export const testCompleteWritingFlow = async (): Promise<{
  success: boolean;
  results: {
    apiConfig: boolean;
    textGeneration: boolean;
    imagePrompts: boolean;
    imageGeneration: boolean;
  };
  errors: string[];
}> => {
  const results = {
    apiConfig: false,
    textGeneration: false,
    imagePrompts: false,
    imageGeneration: false
  };
  const errors: string[] = [];

  console.log('🚀 开始端到端测试...');

  try {
    // 1. 测试API配置
    console.log('📋 1. 检查API配置...');
    const config = getAPIConfig();
    if (config.openrouter.apiKey && config.doubao.apiKey) {
      results.apiConfig = true;
      console.log('✅ API配置检查通过');
    } else {
      errors.push('API配置不完整');
      console.log('❌ API配置检查失败');
    }

    // 2. 测试文本生成 (OpenRouter API)
    console.log('📝 2. 测试文本生成...');
    try {
      const testPrompt = `
请为以下草稿生成一个简单的文章大纲：

草稿内容：
最近我发现了一个提高工作效率的方法，就是使用AI工具来辅助写作。通过AI的帮助，我可以更快地整理思路，生成高质量的内容。

请生成3个小标题的大纲，JSON格式：
[
  {"title": "标题1", "summary": "概述1"},
  {"title": "标题2", "summary": "概述2"},
  {"title": "标题3", "summary": "概述3"}
]
`;
      
      const textResult = await callOpenRouterAPI(testPrompt);
      if (textResult && textResult.length > 50) {
        results.textGeneration = true;
        console.log('✅ 文本生成测试通过');
        console.log('📄 生成结果预览:', textResult.substring(0, 100) + '...');
      } else {
        errors.push('文本生成结果异常');
        console.log('❌ 文本生成测试失败');
      }
    } catch (error) {
      errors.push(`文本生成失败: ${error.message}`);
      console.log('❌ 文本生成测试失败:', error.message);
    }

    // 3. 测试图片提示词生成
    console.log('🎨 3. 测试图片提示词生成...');
    try {
      const testContent = `
# AI写作工具的使用心得

最近我开始使用AI写作工具来提高工作效率，发现这确实是一个很好的辅助手段。

## 主要优势

AI写作工具可以帮助我们：
- 快速整理思路
- 生成高质量内容
- 节省大量时间

## 使用建议

在使用AI写作工具时，建议大家注意以下几点：
1. 保持原创性
2. 人工审核和编辑
3. 结合个人经验
`;

      const imagePrompts = await generateImagePrompts(testContent);
      if (imagePrompts && Array.isArray(imagePrompts) && imagePrompts.length > 0) {
        results.imagePrompts = true;
        console.log('✅ 图片提示词生成测试通过');
        console.log('🖼️ 生成的提示词数量:', imagePrompts.length);
        imagePrompts.forEach((prompt, index) => {
          console.log(`   ${index + 1}. ${prompt.substring(0, 50)}...`);
        });
      } else {
        errors.push('图片提示词生成结果异常');
        console.log('❌ 图片提示词生成测试失败');
      }
    } catch (error) {
      errors.push(`图片提示词生成失败: ${error.message}`);
      console.log('❌ 图片提示词生成测试失败:', error.message);
    }

    // 4. 测试图片生成 (豆包API)
    console.log('🖼️ 4. 测试图片生成...');
    try {
      const testImagePrompt = '现代简约风格的办公场景，蓝白色调，干净的线条，柔和的光线，展现专业和创新的氛围';
      const imageUrl = await generateImage(testImagePrompt);
      
      if (imageUrl && imageUrl.startsWith('http')) {
        results.imageGeneration = true;
        console.log('✅ 图片生成测试通过');
        console.log('🖼️ 生成的图片URL:', imageUrl);
      } else {
        errors.push('图片生成结果异常');
        console.log('❌ 图片生成测试失败');
      }
    } catch (error) {
      errors.push(`图片生成失败: ${error.message}`);
      console.log('❌ 图片生成测试失败:', error.message);
    }

  } catch (error) {
    errors.push(`测试过程出现异常: ${error.message}`);
    console.log('❌ 测试过程出现异常:', error.message);
  }

  // 计算总体成功率
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const success = successCount === totalTests;

  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 成功: ${successCount}/${totalTests}`);
  console.log(`❌ 失败: ${totalTests - successCount}/${totalTests}`);
  
  if (errors.length > 0) {
    console.log('\n❌ 错误详情:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  if (success) {
    console.log('\n🎉 端到端测试全部通过！AI写作助手功能完整可用！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关配置和网络连接');
  }

  return { success, results, errors };
};

/**
 * 快速API连接测试
 */
export const quickAPITest = async (): Promise<{
  openrouter: boolean;
  doubao: boolean;
  errors: string[];
}> => {
  const results = { openrouter: false, doubao: false };
  const errors: string[] = [];

  console.log('⚡ 快速API连接测试...');

  // 测试OpenRouter
  try {
    const result = await callOpenRouterAPI('请回复"连接成功"');
    if (result && result.includes('连接成功')) {
      results.openrouter = true;
      console.log('✅ OpenRouter API连接正常');
    } else {
      console.log('⚠️ OpenRouter API响应异常，但连接成功');
      results.openrouter = true; // 只要有响应就算成功
    }
  } catch (error) {
    errors.push(`OpenRouter API: ${error.message}`);
    console.log('❌ OpenRouter API连接失败:', error.message);
  }

  // 测试豆包API
  try {
    const imageUrl = await generateImage('简单的蓝色圆形');
    if (imageUrl && imageUrl.startsWith('http')) {
      results.doubao = true;
      console.log('✅ 豆包API连接正常');
    } else {
      errors.push('豆包API: 返回结果异常');
      console.log('❌ 豆包API连接失败: 返回结果异常');
    }
  } catch (error) {
    errors.push(`豆包API: ${error.message}`);
    console.log('❌ 豆包API连接失败:', error.message);
  }

  return { ...results, errors };
};
