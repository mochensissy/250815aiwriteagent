/**
 * 简单的API测试脚本
 * 用于验证各个API服务的基本连接状态
 */

// 测试Gemini API
async function testGemini() {
  console.log('🧪 测试Gemini API...');
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': 'AIzaSyAH-wepOrQu0ujJfeqbcz2Pn7wHHvLihxg'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: '请简单回复"Gemini API连接成功"'
          }]
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('✅ Gemini API测试成功:', result.substring(0, 50));
      return true;
    } else {
      console.log('❌ Gemini API测试失败:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API测试异常:', error.message);
    return false;
  }
}

// 测试Perplexity API
async function testPerplexity() {
  console.log('🧪 测试Perplexity API...');
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'Be precise and concise.'
          },
          {
            role: 'user',
            content: '请简单回复"Perplexity API连接成功"'
          }
        ],
        max_tokens: 100,
        temperature: 0.5
      })
    });

    if (response.ok) {
      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || '';
      console.log('✅ Perplexity API测试成功:', result.substring(0, 50));
      return true;
    } else {
      console.log('❌ Perplexity API测试失败:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Perplexity API测试异常:', error.message);
    return false;
  }
}

// 测试豆包生图API
async function testDoubao() {
  console.log('🧪 测试豆包生图API...');
  
  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ca9d6a48-f76d-4c29-a621-2cf259a55b2f'
      },
      body: JSON.stringify({
        model: 'doubao-seedream-3-0-t2i-250415',
        prompt: '一朵简单的红色玫瑰花，白色背景',
        response_format: 'url',
        size: '512x512',
        guidance_scale: 3,
        watermark: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      const imageUrl = data.data?.[0]?.url || '';
      console.log('✅ 豆包生图API测试成功:', imageUrl ? '图片生成成功' : '无图片URL');
      return true;
    } else {
      console.log('❌ 豆包生图API测试失败:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ 豆包生图API测试异常:', error.message);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('🚀 开始API连接测试...\n');
  
  const results = {
    gemini: await testGemini(),
    perplexity: await testPerplexity(),
    doubao: await testDoubao()
  };
  
  console.log('\n📊 测试结果总结:');
  console.log('='.repeat(40));
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  Object.entries(results).forEach(([api, success]) => {
    const status = success ? '✅ 通过' : '❌ 失败';
    console.log(`${api.padEnd(12)}: ${status}`);
  });
  
  console.log('='.repeat(40));
  console.log(`总计: ${successCount}/${totalCount} 项通过`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有API测试通过！可以开始使用应用了。');
  } else {
    console.log('⚠️  部分API测试失败，请检查API密钥配置。');
  }
}

// 如果在Node.js环境中运行
if (typeof window === 'undefined') {
  // Node.js环境需要安装node-fetch
  console.log('请在浏览器控制台中运行此脚本');
} else {
  // 浏览器环境直接运行
  runTests();
}
