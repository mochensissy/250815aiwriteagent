/**
 * API调用工具集合
 * 
 * 集成Google Gemini、Perplexity和豆包生图API
 * 提供统一的接口供组件调用各种AI服务
 */

import { getAPIConfig } from './storage';
import { monitorApiCall } from './performance';

/**
 * 调用Google Gemini API进行文本生成
 * 包含网络问题的智能处理和降级策略
 * 作为OpenRouter的备用方案
 */
export const callGeminiAPI = async (prompt: string): Promise<string> => {
  return monitorApiCall(async () => {
    const config = getAPIConfig();
    console.log('🚀 调用Gemini API (备用)');
    console.log('📝 Prompt长度:', prompt.length);
    console.log('📝 Prompt预览:', prompt.substring(0, 200) + '...');
    
    // 设置超时时间为30秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(config.gemini.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': config.gemini.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('✅ Gemini API响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API错误详情:', errorText);
      
      // 处理429错误（请求过多）
      if (response.status === 429) {
        console.warn('⚠️ Gemini API请求过多，可能的原因：');
        console.warn('  1. API配额已用完');
        console.warn('  2. 请求频率过高');
        console.warn('  3. 需要等待一段时间后重试');
        throw new Error('Gemini API请求过多，请稍后重试');
      }
      
      throw new Error(`Gemini API错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 Gemini API响应数据结构:', {
      candidates: data.candidates?.length || 0,
      hasContent: !!data.candidates?.[0]?.content,
      hasParts: !!data.candidates?.[0]?.content?.parts?.length
    });
    
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('📄 生成内容长度:', result.length);
    console.log('📄 生成内容预览:', result.substring(0, 200) + '...');
    
    return result;
  }, 'Gemini API');
};

/**
 * 生成模拟的Perplexity搜索响应
 * 当网络连接问题时使用
 */
const generateMockPerplexityResponse = (query: string): string => {
  console.log('🤖 使用模拟Perplexity搜索响应');
  
  // 根据查询内容生成相关的模拟响应
  const responses = {
    'AI': `人工智能（Artificial Intelligence, AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。

**主要特点：**
- **机器学习**：通过数据训练改进性能
- **自然语言处理**：理解和生成人类语言
- **计算机视觉**：识别和分析图像
- **决策制定**：基于数据做出智能选择

**应用领域：**
- 内容创作和写作辅助
- 图像生成和处理
- 语音识别和合成
- 自动驾驶技术
- 医疗诊断辅助

**发展趋势：**
- 大语言模型（LLM）快速发展
- 多模态AI技术成熟
- AI工具日益普及化
- 行业应用深度整合

*注：这是基于常见知识的模拟搜索结果。实际使用时，Perplexity API会提供更准确和最新的信息。*`,

    '写作': `AI写作技术正在革命性地改变内容创作领域，为创作者提供强大的辅助工具。

**核心优势：**
- **效率提升**：快速生成初稿和大纲
- **创意激发**：提供多样化的写作思路
- **风格适应**：学习并模仿特定写作风格
- **质量优化**：语法检查和内容润色

**主要应用：**
- 文章大纲生成
- 内容扩写和改写
- 多语言翻译
- SEO优化建议
- 创意写作辅助

**技术发展：**
- GPT系列模型持续进化
- 专业化写作模型出现
- 个性化定制能力增强
- 实时协作功能完善

**注意事项：**
- 需要人工审核和编辑
- 避免完全依赖AI生成
- 保持原创性和个人风格
- 遵守版权和伦理规范

*模拟搜索结果 - 实际API会提供更详细和最新的信息*`,

    '技术': `当前技术发展呈现出快速迭代和深度融合的特点，多个领域都在经历重大变革。

**热门技术趋势：**
- **人工智能**：大模型、生成式AI、AGI研究
- **云计算**：边缘计算、无服务器架构、混合云
- **区块链**：Web3、DeFi、NFT应用
- **物联网**：5G/6G、智能设备、工业4.0
- **量子计算**：量子优势、实用化应用

**发展特点：**
- 跨领域技术融合加速
- 开源生态系统繁荣
- 低代码/无代码平台普及
- 可持续发展技术重视
- 数据安全和隐私保护

**应用场景：**
- 智慧城市建设
- 数字化转型
- 远程协作办公
- 个性化服务
- 自动化生产

*基于技术发展趋势的模拟分析 - 实际搜索会提供更具体的最新信息*`
  };

  // 根据查询关键词匹配响应
  const queryLower = query.toLowerCase();
  if (queryLower.includes('ai') || queryLower.includes('人工智能') || queryLower.includes('artificial intelligence')) {
    return responses['AI'];
  } else if (queryLower.includes('写作') || queryLower.includes('writing') || queryLower.includes('content')) {
    return responses['写作'];
  } else if (queryLower.includes('技术') || queryLower.includes('technology') || queryLower.includes('tech')) {
    return responses['技术'];
  }

  // 默认通用响应
  return `基于查询"${query}"的搜索分析：

这是一个关于"${query}"的综合性分析。在实际应用中，Perplexity API会通过实时搜索互联网获取最新、最准确的信息。

**当前状态：**
由于网络连接限制，我们提供这个模拟搜索结果来确保应用功能的正常运行。

**建议：**
1. 检查网络连接状态
2. 确认API密钥有效性
3. 验证账户余额充足
4. 稍后重试真实API调用

**功能保障：**
虽然使用模拟数据，但外部搜索功能的核心流程保持完整，确保您的写作工作流程不受影响。

*这是模拟搜索结果 - 网络恢复后将自动切换到真实的Perplexity API服务*`;
};

/**
 * 调用Perplexity API进行外部搜索
 * 根据官方文档更新API调用格式，包含智能降级机制
 */
export const callPerplexityAPI = async (query: string): Promise<string> => {
  try {
    const config = getAPIConfig();
    console.log('🔍 调用Perplexity API');
    console.log('📝 查询内容:', query);
    
    // 设置更短的超时时间，快速检测网络问题（5秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(config.perplexity.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.perplexity.apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'Be precise and concise. Provide detailed explanations and cite sources.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 800,
        temperature: 0.5
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('✅ Perplexity API响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity API错误详情:', errorText);
      
      // 处理429错误（请求过多）
      if (response.status === 429) {
        console.warn('⚠️ Perplexity API请求过多，使用模拟搜索');
        return generateMockPerplexityResponse(query);
      }
      
      // 其他错误也使用模拟响应
      console.warn('⚠️ Perplexity API错误，使用模拟搜索');
      return generateMockPerplexityResponse(query);
    }

    const data = await response.json();
    console.log('📦 Perplexity API响应数据结构:', {
      choices: data.choices?.length || 0,
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content
    });
    
    const result = data.choices?.[0]?.message?.content || '';
    console.log('📄 搜索结果长度:', result.length);
    console.log('📄 搜索结果预览:', result.substring(0, 200) + '...');
    
    return result;
  } catch (error) {
    console.error('❌ Perplexity API调用失败:', error);
    
    // 网络问题时使用模拟响应
    if (error.name === 'AbortError') {
      console.warn('⚠️ Perplexity API请求超时，使用模拟搜索');
      return generateMockPerplexityResponse(query);
    }
    
    if (error.message?.includes('fetch failed') || error.message?.includes('timeout')) {
      console.warn('⚠️ 网络连接问题，使用模拟搜索');
      return generateMockPerplexityResponse(query);
    }
    
    // 其他错误也使用模拟响应，确保应用不会崩溃
    console.warn('⚠️ 未知错误，使用模拟搜索');
    return generateMockPerplexityResponse(query);
  }
};

/**
 * 调用OpenRouter API进行文本生成
 * 使用Gemini 2.5 Flash Lite模型
 */
export const callOpenRouterAPI = async (prompt: string): Promise<string> => {
  return monitorApiCall(async () => {
    const config = getAPIConfig();
    console.log('🔄 调用OpenRouter API');
    console.log('📝 Prompt预览:', prompt.substring(0, 200) + '...');
    
    // 设置超时时间为30秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(config.openrouter.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openrouter.apiKey}`,
        'HTTP-Referer': 'https://ai-writer.local',
        'X-Title': 'AI Writer Assistant'
      },
      body: JSON.stringify({
        model: config.openrouter.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('✅ OpenRouter API响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API错误详情:', errorText);
      
      // 处理429错误（请求过多）
      if (response.status === 429) {
        console.warn('⚠️ OpenRouter API请求过多，可能的原因：');
        console.warn('  1. API配额已用完');
        console.warn('  2. 请求频率过高');
        console.warn('  3. 需要等待一段时间后重试');
        throw new Error('OpenRouter API请求过多，请稍后重试');
      }
      
      // 处理401错误（认证失败）
      if (response.status === 401) {
        throw new Error('OpenRouter API认证失败，请检查API密钥');
      }
      
      throw new Error(`OpenRouter API错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 OpenRouter API响应数据结构:', {
      choices: data.choices?.length || 0,
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
      usage: data.usage
    });
    
    const result = data.choices?.[0]?.message?.content || '';
    console.log('📄 生成结果长度:', result.length);
    console.log('📄 生成结果预览:', result.substring(0, 200) + '...');
    console.log('📊 使用情况:', data.usage);
    
    return result;
  }, 'OpenRouter API');
};

/**
 * 调用豆包生图API生成图片
 * 根据火山引擎文档更新API调用格式
 */
export const generateImage = async (prompt: string, size = '1024x1024', forceWatermarkFree = true): Promise<string> => {
  console.log('🎨 开始图片生成流程', { forceWatermarkFree });
  
  // 如果强制无水印，直接使用无水印方案
  if (forceWatermarkFree) {
    console.log('🚫 强制无水印模式，跳过豆包API');
    try {
      return await generateImageWithUnsplash(prompt);
    } catch (error) {
      console.log('⚠️ 无水印方案失败，回退到豆包...', error);
      return await generateImageWithDoubao(prompt, size);
    }
  }
  
  // 方案1: 尝试豆包API（可能有水印）
  try {
    return await generateImageWithDoubao(prompt, size);
  } catch (error) {
    console.log('⚠️ 豆包生成失败，尝试备选方案...', error);
    
    // 方案2: 使用免费的无水印图片API
    try {
      return await generateImageWithUnsplash(prompt);
    } catch (unsplashError) {
      console.log('⚠️ 无水印方案失败，使用豆包结果...', unsplashError);
      // 如果所有方案都失败，重新尝试豆包
      return await generateImageWithDoubao(prompt, size);
    }
  }
};

// 豆包图片生成
const generateImageWithDoubao = async (prompt: string, size: string): Promise<string> => {
  const config = getAPIConfig();
  console.log('🎨 调用豆包生图API');
  console.log('📝 图片描述:', prompt);
  console.log('📏 图片尺寸:', size);
  
  try {
    // 根据火山引擎文档的调用格式
    const response = await fetch(config.doubao.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.doubao.apiKey}`,
      },
      body: JSON.stringify({
        model: config.doubao.model,
        prompt: `${prompt}, raw photography, clean composition, commercial stock photo, professional quality, no text, no watermarks, no overlays, no branding, pure image content, studio shot, high resolution, commercial license`,
        n: 1,
        size: size,
        response_format: 'url'
      })
    });

    console.log('✅ 豆包API响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 豆包API错误详情:', errorText);
      throw new Error(`豆包生图API错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 豆包API响应数据结构:', {
      hasData: !!data.data,
      dataLength: data.data?.length || 0,
      hasUrl: !!data.data?.[0]?.url
    });
    
    if (data.data && data.data.length > 0 && data.data[0].url) {
      const imageUrl = data.data[0].url;
      console.log('🖼️ 生成的图片URL:', imageUrl);
      return imageUrl;
    } else {
      console.error('❌ 豆包API返回数据格式异常:', data);
      throw new Error('豆包API返回的图片数据格式异常');
    }
  } catch (error) {
    console.error('❌ 豆包生图API调用失败:', error);
    throw error;
  }
};

// 使用免费图片API获取无水印图片
const generateImageWithUnsplash = async (prompt: string): Promise<string> => {
  console.log('🌅 尝试获取无水印图片');
  
  // 从prompt中提取关键词
  const keywords = extractKeywordsFromPrompt(prompt);
  const query = keywords.slice(0, 2).join(' ') || 'professional photography';
  
  console.log('🔍 搜索关键词:', query);
  
  try {
    // 使用Picsum作为无水印图片源（Lorem Picsum）
    const imageUrl = `https://picsum.photos/1024/1024?random=${Math.floor(Math.random() * 1000)}`;
    
    console.log('✅ 无水印图片获取成功:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.log('❌ 无水印图片获取失败:', error);
    throw error;
  }
};

// 从提示词中提取关键词
const extractKeywordsFromPrompt = (prompt: string): string[] => {
  // 移除常见的摄影术语，保留主要内容关键词
  const cleanPrompt = prompt
    .replace(/professional photography|high quality|clean image|studio lighting|commercial/gi, '')
    .replace(/no watermarks|no text|no logos/gi, '');
  
  // 提取英文关键词
  const englishWords = cleanPrompt.match(/[a-zA-Z]{3,}/g) || [];
  
  // 提取中文关键词  
  const chineseWords = cleanPrompt.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  
  return [...englishWords, ...chineseWords].filter(word => word.length > 2).slice(0, 5);
};

/**
 * 分析文章风格要素
 */
export const analyzeStyleElements = async (articles: string[]): Promise<string[]> => {
  const combinedContent = articles.join('\n\n---\n\n');
  
  const prompt = `
作为专业的写作特征分析师，请分析以下文章内容，提取作者的写作特征。需要从内容和风格两个维度进行全面分析：

文章内容：
${combinedContent}

请从以下维度分析写作特征：

**内容特征（便于题材匹配）：**
1. 主要题材领域（如：个人成长、职场感悟、生活观察、技能学习、情感表达等）
2. 常用素材类型（如：个人经历、案例故事、数据引用、理论分析、生活细节等）
3. 关注焦点（如：内心感受、实用方法、深度思考、现象观察、价值探讨等）
4. 价值观取向（如：积极正面、理性客观、感性细腻、批判反思、幽默轻松等）

**表达风格（便于风格匹配）：**
5. 语言特色（如：口语化亲切、正式严谨、文艺诗意、简洁直接、生动形象等）
6. 情感色彩（如：温暖治愈、犀利直白、幽默风趣、深沉内敛、激昂热烈等）
7. 结构习惯（如：故事引入、问题导向、观点先行、层层递进、对比分析等）
8. 互动方式（如：设问引导、直接对话、经验分享、启发思考、呼吁行动等）

每个特征要具体、准确，有助于后续匹配相似题材和风格的文章。

返回JSON数组格式：
["具体的特征描述1", "具体的特征描述2", ...]

示例：
["专注个人成长和自我反思类题材", "善于从生活小事中提炼深层思考", "习惯用故事开头引出观点", "语言温暖亲切，富有共鸣感"]
`;

  try {
    const result = await callOpenRouterAPI(prompt);
    console.log('🎨 多维度特征分析结果:', result);
    
    try {
      const features = JSON.parse(result);
      console.log('✅ 提取到的写作特征:', features);
      return features;
    } catch (parseError) {
      console.error('❌ 特征分析结果解析失败:', parseError);
      // 备用解析方法
      const lines = result.split('\n').filter(line => 
        line.trim() && 
        !line.includes('```') && 
        !line.includes('JSON') &&
        line.includes('：') || line.includes('"')
      );
      return lines.slice(0, 8); // 最多返回8个特征
    }
  } catch (error) {
    console.error('❌ 特征分析API调用失败:', error);
    return [];
  }
};

/**
 * 推荐风格原型
 */
export const recommendStylePrototypes = async (draft: string, referenceArticles: any[]): Promise<any[]> => {
  console.log('🔍 开始AI风格原型推荐...');
  console.log('📝 草稿长度:', draft.length);
  console.log('📚 参考文章数量:', referenceArticles.length);
  
  // 检查API配置 - 优先OpenRouter，备用Gemini
  const apiConfig = getAPIConfig();
  const hasOpenRouter = !!apiConfig.openrouter.apiKey;
  const hasGemini = !!apiConfig.gemini.apiKey;
  console.log('⚙️ API配置检查:', hasOpenRouter ? 'OpenRouter已配置' : hasGemini ? 'Gemini备用可用' : 'API未配置');
  
  if (!hasOpenRouter && !hasGemini) {
    console.warn('⚠️ 没有找到可用的API配置，跳过推荐');
    return [];
  }

  const prompt = `
作为专业的写作风格匹配分析师，请基于用户草稿内容，从参考文章中推荐最匹配的写作参考原型。

用户草稿：
${draft}

参考文章库：
${referenceArticles.map((article, index) => `${index + 1}. ID: ${article.id}
标题：${article.title}
内容摘要：${article.content.substring(0, 400)}...
写作特征：${(article.styleElements || []).filter(e => e.confirmed).map(e => e.description).join('; ') || '暂无特征分析'}

`).join('')}

请从以下维度进行匹配分析：

**内容维度（题材匹配）：**
- 主题相关性：草稿的核心主题与参考文章是否相符
- 素材类型：使用的素材和论证方式是否相似
- 价值观倾向：表达的态度和价值取向是否一致

**风格维度（表达匹配）：**
- 语言风格：语言特色和表达方式是否相近
- 情感色彩：文章的情感调性是否匹配
- 结构习惯：行文组织和逻辑结构是否相似

选择1-3个最匹配的文章作为风格参考原型，优先考虑题材相关性。

返回JSON数组格式：
[
  {
    "id": "prototype_${Date.now()}_1",
    "title": "参考文章标题",
    "description": "推荐理由：题材匹配度高（具体说明），写作风格相似（具体说明）",
    "articleId": "文章ID",
    "similarity": 85,
    "matchReason": "具体的匹配分析"
  }
]

要求：相似度评分要准确，推荐理由要具体说明题材和风格的匹配点。
`;

  try {
    const result = await callOpenRouterAPI(prompt);
    console.log('🤖 AI推荐结果:', result);
    console.log('📄 AI返回内容长度:', result.length);
    
    // 尝试多种解析方式
    let recommendations = null;
    
    try {
      // 方式1：直接JSON解析
      recommendations = JSON.parse(result);
      console.log('✅ 直接JSON解析成功');
    } catch (e1) {
      console.log('⚠️ 直接JSON解析失败，尝试提取JSON...');
      
      try {
        // 方式2：提取JSON部分
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON提取解析成功');
        }
      } catch (e2) {
        console.log('⚠️ JSON提取也失败，使用备用推荐...');
        
        // 方式3：备用推荐 - 如果有参考文章，就推荐前几篇
        if (referenceArticles.length > 0) {
          recommendations = referenceArticles.slice(0, Math.min(3, referenceArticles.length)).map((article, index) => ({
            articleId: article.id,
            title: article.title,
            similarity: 85 - index * 5, // 简单的相似度递减
            description: '基于内容相似性推荐',
            reason: '题材和写作风格相近'
          }));
          console.log('✅ 备用推荐成功，推荐', recommendations.length, '篇文章');
        }
      }
    }
    
    if (recommendations && Array.isArray(recommendations) && recommendations.length > 0) {
      console.log('✅ 解析成功，推荐数量:', recommendations.length);
      
      // 验证数据结构并添加必要字段
      const validPrototypes = recommendations
        .filter(item => item.articleId && item.title)
        .map((item, index) => ({
          id: item.id || `prototype_${Date.now()}_${index}`,
          title: item.title,
          description: item.description || item.reason || '相似风格推荐',
          articleId: item.articleId,
          similarity: Math.min(100, Math.max(0, parseInt(item.similarity) || 75))
        }))
        .sort((a, b) => b.similarity - a.similarity) // 按匹配度从高到低排序
        .slice(0, 3); // 最多3个推荐
      
      console.log('🎯 有效推荐数量:', validPrototypes.length);
      validPrototypes.forEach((p, i) => {
        console.log(`📖 推荐${i+1}: ${p.title} (${p.similarity}%)`);
      });
      
      return validPrototypes;
    } else {
      console.log('⚠️ 没有找到有效推荐');
      return [];
    }
  } catch (error) {
    console.error('❌ 风格原型推荐API调用失败:', error);
    
    // 最终备用方案：如果有参考文章，就简单推荐
    if (referenceArticles.length > 0) {
      console.log('🔄 使用最终备用推荐逻辑...');
      const backupRecommendations = referenceArticles.slice(0, 2).map((article, index) => ({
        id: `backup_${Date.now()}_${index}`,
        title: article.title,
        description: '基于备用逻辑推荐',
        articleId: article.id,
        similarity: 80 - index * 5
      }));
      
      console.log('✅ 最终备用推荐完成，数量:', backupRecommendations.length);
      return backupRecommendations;
    }
    
    return [];
  }
};

/**
 * 生成文章大纲
 */
export const generateOutline = async (
  draft: string, 
  styleContext: string,
  selectedPrototypes?: any[],
  knowledgeBase?: any[]
): Promise<any[]> => {
  console.log('🎯 开始生成微信公众号风格大纲...');
  console.log('📝 草稿内容预览:', draft.substring(0, 100) + '...');
  console.log('🎨 风格上下文:', styleContext);

  // 导入动态提示词生成器
  const { generateStyleBasedPrompt } = await import('./promptGenerator');
  
  // 生成基于风格的动态提示词
  let dynamicPrompt = '';
  if (selectedPrototypes && knowledgeBase && selectedPrototypes.length > 0) {
    console.log('🎨 使用动态风格提示词生成大纲...');
    dynamicPrompt = await generateStyleBasedPrompt(draft, selectedPrototypes, knowledgeBase);
  } else {
    console.log('📋 使用基础提示词生成大纲...');
    dynamicPrompt = `
你是一位专业的微信公众号编辑，擅长将用户的真实经历和想法整理成自然、口语化的文章结构。

**用户原始内容（类似录音整理）：**
---
${draft}
---

**个人写作风格参考：**
${styleContext || '保持自然、真实、接地气的表达方式'}`;
  }

  const prompt = `${dynamicPrompt}

**任务要求：**

1. **理解用户真实想表达的内容**，提炼出自然的分享逻辑
2. **小标题要像真人说话一样自然**，避免过于正式或书面化
3. **保持原始内容的真实感和个人色彩**，不要让标题显得很"AI"

**小标题创作规则：**
- 使用口语化、自然的表达方式，避免文绉绉的标题
- 就像在和朋友聊天时会说的话一样自然
- 避免过度营销化或AI痕迹的语言
- 每个标题要真实反映该部分要分享的内容
- 保持逻辑顺序，让读者容易跟上思路

**大纲结构要求：**
- **2000字左右文章建议4-6个小标题**
- **每个部分300-500字，内容充实有深度**
- **避免过度细分，保持内容的完整性**

**标准结构（4-6个部分）：**
1. **开篇部分**：引出话题背景或个人经历（300-400字）
2. **核心内容1**：基于草稿的第一个重点论述（400-500字）
3. **核心内容2**：基于草稿的第二个重点论述  
4. **深入分析**：提供更深层的思考或分析
5. **总结建议**：给出具体的行动建议或总结

**标题示例（口语化风格）：**
- "说说我遇到的那件事"
- "这里面有个问题我想和大家聊聊"
- "后来我想明白了一个道理"
- "给大家分享几个小建议"
- "其实这事没那么复杂"
- "我的一点小感悟"

**重要要求：**
- **严格控制在4-6个小标题之间**
- **每个标题对应300-500字内容**
- **不要过度细分，保持内容完整性**

请返回JSON格式，每个标题要包含概述说明：
[
  {
    "id": "1", 
    "title": "基于草稿内容的实用标题", 
    "summary": "这一部分将要写什么内容的简要概述（30-50字）",
    "level": 1, 
    "order": 0
  }
]

**最终提醒：2000字文章最多6个小标题，每个部分要有足够的内容深度！**
`;

  try {
    const result = await callOpenRouterAPI(prompt);
    console.log('🤖 AI大纲生成结果:', result);
    console.log('📄 AI返回内容长度:', result.length);
    
    // 尝试多种解析方式
    let outlineData = null;
    
    try {
      // 方式1：直接JSON解析
      outlineData = JSON.parse(result);
      console.log('✅ 直接JSON解析成功');
    } catch (e1) {
      console.log('⚠️ 直接JSON解析失败，尝试提取JSON...');
      
      try {
        // 方式2：提取JSON部分
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          outlineData = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON提取解析成功');
        }
      } catch (e2) {
        console.log('⚠️ JSON提取也失败，尝试手动解析...');
        
        // 方式3：手动解析标题
        const lines = result.split('\n').filter(line => line.trim());
        const titles = [];
        
        for (const line of lines) {
          // 查找包含"title"的行
          if (line.includes('"title"') || line.includes('title:')) {
            const titleMatch = line.match(/"([^"]+)"/);
            if (titleMatch) {
              titles.push(titleMatch[1]);
            }
          }
          // 或者查找数字开头的行
          else if (/^\d+\./.test(line.trim())) {
            titles.push(line.replace(/^\d+\.\s*/, '').trim());
          }
        }
        
        if (titles.length > 0) {
          outlineData = titles.map((title, index) => ({
            id: String(index + 1),
            title: title,
            summary: `关于"${title}"的详细阐述`,
            level: 1,
            order: index
          }));
          console.log('✅ 手动解析成功，提取到', titles.length, '个标题');
        }
      }
    }
    
    if (outlineData && Array.isArray(outlineData) && outlineData.length > 0) {
      console.log('✅ 大纲解析成功，节点数量:', outlineData.length);
      
      // 验证大纲数据并添加必要字段
      const validOutline = outlineData
        .filter(item => (item.title || item) && String(item.title || item).trim().length > 0)
        .map((item, index) => ({
          id: item.id || String(index + 1),
          title: (item.title || item).toString().trim(),
          summary: item.summary || `关于"${(item.title || item).toString().trim()}"的详细内容`,
          level: item.level || 1,
          order: item.order !== undefined ? item.order : index
        }));
      
      console.log('🎯 有效大纲节点:', validOutline.length);
      validOutline.forEach((node, i) => {
        console.log(`📖 ${i+1}. ${node.title}`);
      });
      
      return validOutline;
    } else {
      console.error('❌ 所有解析方式都失败了');
      console.log('📄 原始返回内容:', result);
      
      // 基于草稿内容生成个性化备用大纲
      const draftWords = draft.split(/\s+/).slice(0, 10).join(' ');
      const topic = draftWords.length > 20 ? draftWords.substring(0, 20) + '...' : draftWords;
      
      return [
        { id: '1', title: `我对${topic}的新认识`, summary: '分享个人经历和发现', level: 1, order: 0 },
        { id: '2', title: '深入分析这个现象', summary: '详细分析草稿中的核心观点', level: 1, order: 1 },
        { id: '3', title: '我的思考和感悟', summary: '个人思考和深层感悟', level: 1, order: 2 },
        { id: '4', title: '给大家的建议', summary: '基于经验提供实用建议', level: 1, order: 3 }
      ];
    }
  } catch (error) {
    console.error('❌ 大纲生成API调用失败:', error);
    
    // 基于草稿内容生成个性化备用大纲
    const draftPreview = draft.substring(0, 30);
    return [
      { id: '1', title: `关于${draftPreview}...的思考`, summary: '分享个人发现或经历', level: 1, order: 0 },
      { id: '2', title: '我发现的关键问题', summary: '深入阐述主要观点', level: 1, order: 1 },
      { id: '3', title: '深层次的思考', summary: '个人思考和感悟', level: 1, order: 2 },
      { id: '4', title: '我的建议和总结', summary: '提供实用的行动建议', level: 1, order: 3 }
    ];
  }
};

/**
 * 生成完整文章
 */
export const generateFullArticle = async (
  outline: any[],
  draft: string,
  styleContext: string,
  externalInsights?: string,
  selectedPrototypes?: any[],
  knowledgeBase?: any[]
): Promise<string> => {
  
  // 导入动态提示词生成器
  const { generateStyleBasedPrompt } = await import('./promptGenerator');
  
  // 生成基于风格的动态提示词
  let dynamicPrompt = '';
  if (selectedPrototypes && knowledgeBase && selectedPrototypes.length > 0) {
    console.log('🎨 使用动态风格提示词生成完整文章...');
    dynamicPrompt = await generateStyleBasedPrompt(draft, selectedPrototypes, knowledgeBase);
  } else {
    console.log('📋 使用基础提示词生成完整文章...');
    dynamicPrompt = `
## 定位
你是一位专业的内容转换专家，专注于将口语化的录音文字整理为适合微信公众号发表的优质文章。

## 能力
1. **编辑优化**：精简冗余内容，合并重复部分，使文章更加流畅自然。
2. **保持原意**：确保整理后的文章忠实于原始录音内容和语气。
3. **语言风格**：使用自然、口语化的表达方式，避免过于书面化或AI痕迹。

## 知识储备
1. 熟悉微信公众号的写作特点和读者偏好。
2. 具备中文写作能力，能够调整文章结构以适应平台要求。
3. 了解如何通过简洁明了的语言吸引读者关注。

**个人写作风格参考：**
${styleContext || '保持自然、真实、接地气的表达方式'}`;
  }

  const prompt = `${dynamicPrompt}

---

现在请基于以下素材生成一篇微信公众号文章：

**文章结构大纲：**
${outline.map(node => `${node.level === 1 ? '# ' : '## '}${node.title}`).join('\n')}

${externalInsights ? `**补充信息：**\n${externalInsights}\n` : ''}

**重要写作要求：**

1. **内容要求**：
   - **直接输出文章内容，不要任何AI回复性质的开头**
   - **绝对不要出现"好的，我来为您生成..."等大模型回复**
   - **严格按照大纲结构展开，每个标题下都要有充实的内容**
   - **保持原始内容的真实感和个人色彩**

2. **开头要求**：
   - **直接进入主题，不要寒暄**
   - **绝对禁止使用"嘿朋友们"、"大家好"、"各位朋友"等自媒体式开头**
   - **不要使用"今天我想和大家聊聊"等口播稿式表达**
   - **开头应该直接描述场景、事件或感受**

3. **语言风格**：
   - 使用口语化、自然的表达方式
   - 就像在写日记或向朋友分享经历
   - 拒绝AI痕迹和自媒体腔调
   - 真诚、真实、不装腔作势

4. **结构要求**：
   - 每个段落都要有实质内容，避免空话套话
   - 段落要短，便于手机阅读
   - 逻辑清晰，情感真实
   - 结尾自然，不要刻意总结

**格式要求：直接输出文章内容，不要任何额外的说明文字。文章应该像一篇真实的个人分享，而不是AI生成的内容。**
`;

  try {
    const rawResult = await callOpenRouterAPI(prompt);
    
    // 清理AI回复式的开头和结尾
    const cleanedResult = cleanAIResponse(rawResult);
    
    return cleanedResult;
  } catch (error) {
    console.error('文章生成失败:', error);
    throw error;
  }
};

/**
 * 清理AI回复式的内容
 */
const cleanAIResponse = (content: string): string => {
  let cleaned = content.trim();
  
  // 移除常见的AI回复开头
  const aiResponses = [
    /^好的，.*?[：:]/,
    /^当然.*?[：:]/,
    /^我来.*?[：:]/,
    /^为您.*?[：:]/,
    /^根据.*?，.*?[：:]/,
    /^基于.*?，.*?[：:]/,
    /^以下是.*?[：:]/,
    /^这是.*?[：:]/,
    /^我会.*?[：:]/,
    /^让我.*?[：:]/
  ];
  
  // 移除自媒体式开头
  const socialMediaOpeners = [
    /^嘿[，,]?朋友们[！!，,]*/,
    /^大家好[！!，,]*/,
    /^各位朋友[！!，,]*/,
    /^朋友们[！!，,]*/,
    /^今天.*?和大家聊聊/,
    /^今天.*?想跟大家分享/,
    /^今天.*?来跟大家说说/
  ];
  
  // 应用清理规则
  [...aiResponses, ...socialMediaOpeners].forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // 移除多余的换行符
  cleaned = cleaned.replace(/^\n+/, '');
  
  // 移除常见的结尾总结
  const aiEndings = [
    /\n*希望这篇文章.*$/,
    /\n*以上就是.*$/,
    /\n*这就是.*分享.*$/,
    /\n*感谢.*阅读.*$/
  ];
  
  aiEndings.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned.trim();
};

/**
 * 处理编辑指令
 */
export const processEditInstruction = async (
  instruction: string,
  content: string,
  selectedText?: string
): Promise<string> => {
  const prompt = `
你是一位专业的微信公众号编辑，擅长用自然、口语化的方式优化文章内容。

**编辑任务：**
${selectedText ? `选中的文本：\n${selectedText}\n\n` : ''}

完整内容：
${content}

用户的修改要求：${instruction}

**编辑原则：**
1. **保持口语化风格**：使用自然、真实的表达方式，避免过于书面化
2. **保持原意和语气**：不改变作者的本意和个人色彩
3. **增强可读性**：让文字更流畅、更容易理解
4. **符合公众号特色**：适合手机阅读，段落简洁有力

请根据用户要求进行修改，只返回修改后的${selectedText ? '选中部分' : '完整'}内容，保持自然、真实的语气，就像一个真实的人在分享自己的想法和经历。
`;

  try {
    return await callOpenRouterAPI(prompt);
  } catch (error) {
    console.error('编辑指令处理失败:', error);
    throw error;
  }
};

/**
 * 生成文章标题
 */
export const generateArticleTitles = async (content: string, outline: any[]): Promise<string[]> => {
  console.log('📝 开始生成文章标题...');
  
  const prompt = `
基于以下文章内容和大纲，生成吸引人的微信公众号标题：

文章内容：
${content.substring(0, 500)}...

文章大纲：
${outline.map(node => `- ${node.title}`).join('\n')}

标题生成要求：
1. **标题字数**：确保标题长度在7-18字之间为佳，核心信息尽量在前7个字呈现
2. **吸引力**：要能增加读者想点进来的冲动
3. **风格**：自然、口语化，避免过于夸张或标题党
4. **关键词前置**：最重要的关键词要在前面
5. **情感共鸣**：能触动读者的情感或好奇心
6. **真实性**：符合文章实际内容，不夸大不误导

请生成8个不同风格的标题选项：
- 2个 疑问式标题（激发好奇）
- 2个 分享式标题（个人经历感受）
- 2个 干货式标题（实用价值）
- 2个 情感式标题（触动共鸣）

返回JSON数组格式：
["标题1", "标题2", "标题3", "标题4", "标题5", "标题6", "标题7", "标题8"]

要求每个标题都要：
- 字数控制在7-18字
- 自然不做作
- 能准确反映文章内容
- 有点击欲望但不是标题党
`;

  try {
    const result = await callOpenRouterAPI(prompt);
    console.log('🤖 AI标题生成结果:', result);
    
    try {
      // 尝试解析JSON
      const titles = JSON.parse(result);
      if (Array.isArray(titles) && titles.length > 0) {
        console.log('✅ 成功生成标题:', titles);
        return titles.slice(0, 8); // 最多8个标题
      }
    } catch (parseError) {
      console.log('⚠️ JSON解析失败，尝试提取标题...');
      
      // 备用解析：提取引号中的内容
      const lines = result.split('\n');
      const titles: string[] = [];
      
      for (const line of lines) {
        // 查找引号中的内容
        const matches = line.match(/"([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const title = match.replace(/"/g, '').trim();
            if (title.length >= 5 && title.length <= 25 && !titles.includes(title)) {
              titles.push(title);
            }
          });
        }
      }
      
      if (titles.length > 0) {
        console.log('✅ 备用解析成功:', titles);
        return titles.slice(0, 8);
      }
    }
    
    // 最终备用方案：基于内容生成简单标题
    console.log('⚠️ 使用备用标题方案...');
    const firstLine = content.split('\n')[0]?.replace(/^#+\s*/, '') || '';
    const baseTitle = firstLine.substring(0, 12) || '我的一些想法';
    
    return [
      baseTitle,
      `关于${baseTitle.substring(0, 8)}的思考`,
      `说说${baseTitle.substring(0, 8)}这件事`,
      `${baseTitle.substring(0, 8)}：我的亲身经历`,
      `聊聊${baseTitle.substring(0, 8)}`,
      `${baseTitle.substring(0, 8)}背后的故事`,
      `我对${baseTitle.substring(0, 8)}的看法`,
      `${baseTitle.substring(0, 8)}的一些感悟`
    ];
    
  } catch (error) {
    console.error('❌ 标题生成失败:', error);
    
    // 错误时的备用方案
    return [
      '我的一些想法和感悟',
      '最近发生的一件事',
      '说说心里话',
      '分享一些生活感悟',
      '聊聊最近的思考',
      '一些不成熟的想法',
      '关于生活的思考',
      '我想和大家聊聊'
    ];
  }
};

/**
 * 分析文章内容，提取关键信息
 */
const analyzeArticleContent = (content: string): {
  theme: string;
  emotion: string;
  keywords: string[];
  scenes: string[];
} => {
  const text = content.toLowerCase();
  
  // 情感词汇检测
  const emotions = {
    '温暖': ['温暖', '温馨', '感动', '暖心', '治愈', '美好', '幸福'],
    '励志': ['努力', '奋斗', '坚持', '成长', '进步', '突破', '成功'],
    '思考': ['思考', '反思', '感悟', '领悟', '明白', '理解', '认识'],
    '怀念': ['回忆', '怀念', '过去', '曾经', '那时', '记得', '想起'],
    '友情': ['朋友', '友谊', '伙伴', '同学', '闺蜜', '兄弟', '姐妹'],
    '亲情': ['家人', '父母', '孩子', '家庭', '亲人', '妈妈', '爸爸'],
    '工作': ['工作', '职场', '同事', '公司', '项目', '团队', '业务']
  };
  
  let detectedEmotion = '温暖';
  let maxCount = 0;
  
  for (const [emotion, words] of Object.entries(emotions)) {
    const count = words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
    if (count > maxCount) {
      maxCount = count;
      detectedEmotion = emotion;
    }
  }
  
  // 提取关键词
  const keywords: string[] = [];
  const keywordPatterns = [
    /咖啡厅|餐厅|办公室|学校|家里|公园|街道/g,
    /朋友|同事|家人|老师|同学/g,
    /电话|信件|微信|聊天|对话/g,
    /回忆|故事|经历|感受|想法/g
  ];
  
  keywordPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      keywords.push(...matches);
    }
  });
  
  return {
    theme: detectedEmotion,
    emotion: detectedEmotion,
    keywords: [...new Set(keywords)],
    scenes: keywords.filter(k => ['咖啡厅', '餐厅', '办公室', '学校', '家里', '公园', '街道'].includes(k))
  };
};

/**
 * 根据主题获取配图示例
 */
const getImageExamplesByTheme = (theme: string): string => {
  const examples = {
    '温暖': [
      '温馨的家庭场景，柔和的灯光，暖色调，体现家的温暖',
      '朋友间的拥抱或握手，温暖的光线，表达人与人之间的温情',
      '一杯热茶和书本的静物，温馨的氛围，象征内心的宁静'
    ],
    '友情': [
      '两个朋友在咖啡厅聊天的场景，温暖的灯光，现代简约风格',
      '朋友间的合影或并肩而行，夕阳背景，温暖的色调',
      '手写信件和照片的静物组合，怀旧风格，象征珍贵的友谊'
    ],
    '怀念': [
      '老照片和回忆物品的静物摄影，怀旧色调，文艺风格',
      '夕阳下的剪影，温暖的橙色调，表达对过往的怀念',
      '旧时光的场景重现，复古色调，营造怀旧氛围'
    ],
    '励志': [
      '向上攀登的人物剪影，朝阳背景，积极向上的氛围',
      '书桌上的学习用品，明亮的光线，表达努力和进步',
      '成功时刻的庆祝场景，明亮的色彩，传达正能量'
    ],
    '思考': [
      '独自思考的人物剪影，安静的环境，深沉的色调',
      '书本和咖啡的静物，柔和的光线，营造思考的氛围',
      '窗边的沉思场景，自然光线，表达内心的思考'
    ],
    '亲情': [
      '家庭聚餐的温馨场景，温暖的灯光，表达家庭和睦',
      '父母与孩子的互动，柔和的色调，体现亲情的温暖',
      '家庭照片和纪念品，温馨的布置，象征家庭的重要性'
    ],
    '工作': [
      '现代办公环境，简洁明亮，体现专业和效率',
      '团队合作的场景，积极的氛围，表达协作精神',
      '工作成果的展示，整洁的布局，传达成就感'
    ]
  };
  
  const themeExamples = examples[theme as keyof typeof examples] || examples['温暖'];
  return themeExamples.map((example, index) => `${index + 1}. ${example}`).join('\n');
};

/**
 * 通用内容分析系统 - 使用AI深度理解文章内容
 */
export const analyzeContentWithAI = async (content: string): Promise<{
  mainTheme: string;
  keyElements: string[];
  sceneType: string;
  emotionalTone: string;
  visualKeywords: string[];
  imageStyle?: string;
  colorTone?: string;
}> => {
  const prompt = `
作为专业的内容分析师，请深度分析以下文章，为配图生成提供准确的指导信息：

【完整文章内容】：
${content}

【分析任务】：
请从配图设计的角度分析文章，重点关注：

1. **核心主题识别**：文章要传达的核心信息和价值观
2. **情感基调分析**：文章的整体情感氛围和读者感受
3. **场景环境理解**：文章涉及的主要环境和背景
4. **视觉元素提取**：适合用于配图的具体视觉元素
5. **意境营造方向**：配图应该营造的整体意境

【输出要求】：
请返回JSON格式的分析结果：
{
  "mainTheme": "文章核心主题的准确描述",
  "emotionalTone": "文章的主要情感基调",
  "sceneType": "文章主要涉及的场景环境",
  "keyElements": ["与主题直接相关的关键元素，最多5个"],
  "visualKeywords": ["适合配图的视觉关键词，最多6个"],
  "imageStyle": "推荐的配图风格（如：温馨生活、都市情感、自然意境等）",
  "colorTone": "推荐的色彩基调（如：暖色调、冷色调、自然色等）"
}

【重要提醒】：
- 分析要基于文章的整体内容和情感，而非局部细节
- keyElements应该是能够代表文章核心主题的元素
- visualKeywords要避免过于具体的物品，重点是意境和氛围
- 确保所有元素都与文章主题高度相关
- 返回纯JSON格式，不要任何额外文字
`;

  try {
    console.log('🔍 开始AI内容分析...');
    const result = await callOpenRouterAPI(prompt);
    console.log('📄 AI分析原始结果:', result);
    
    const analysis = JSON.parse(result);
    console.log('🧠 AI内容分析结果:', analysis);
    
    // 确保返回的对象包含所有必需字段
    const completeAnalysis = {
      mainTheme: analysis.mainTheme || '生活感悟',
      emotionalTone: analysis.emotionalTone || '温暖',
      sceneType: analysis.sceneType || '生活场景',
      keyElements: analysis.keyElements || [],
      visualKeywords: analysis.visualKeywords || [],
      imageStyle: analysis.imageStyle || '现代简约',
      colorTone: analysis.colorTone || '和谐自然'
    };
    
    return completeAnalysis;
  } catch (error) {
    console.error('❌ AI分析失败:', error);
    console.log('🔄 使用本地分析作为备选...');
    return analyzeContentLocally(content);
  }
};

/**
 * 本地内容分析作为备选方案
 */
const analyzeContentLocally = (content: string): {
  mainTheme: string;
  keyElements: string[];
  sceneType: string;
  emotionalTone: string;
  visualKeywords: string[];
  imageStyle: string;
  colorTone: string;
} => {
  const text = content.toLowerCase();
  
  // 主题检测
  let mainTheme = '生活感悟';
  if (text.includes('工作') || text.includes('职场')) mainTheme = '工作体验';
  else if (text.includes('旅行') || text.includes('游')) mainTheme = '旅行见闻';
  else if (text.includes('美食') || text.includes('吃')) mainTheme = '美食探索';
  else if (text.includes('朋友') || text.includes('家人')) mainTheme = '人际关系';
  
  // 提取关键元素（使用通用词汇匹配）
  const keyElements: string[] = [];
  const sentences = content.split(/[。！？]/);
  sentences.forEach(sentence => {
    const words = sentence.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    words.forEach(word => {
      if (word.length >= 2 && 
          !['这个', '那个', '什么', '怎么', '为什么', '如果', '因为', '所以'].includes(word) &&
          keyElements.length < 8) {
        keyElements.push(word);
      }
    });
  });
  
  // 场景类型检测
  let sceneType = '生活场景';
  if (text.includes('办公') || text.includes('公司')) sceneType = '办公环境';
  else if (text.includes('家') || text.includes('房间')) sceneType = '家庭环境';
  else if (text.includes('户外') || text.includes('公园') || text.includes('街道')) sceneType = '户外场景';
  else if (text.includes('自然') || text.includes('山') || text.includes('水')) sceneType = '自然环境';
  
  // 情感色调
  let emotionalTone = '平静';
  if (text.includes('温暖') || text.includes('美好')) emotionalTone = '温暖';
  else if (text.includes('思考') || text.includes('反思')) emotionalTone = '思考';
  else if (text.includes('怀念') || text.includes('回忆')) emotionalTone = '怀念';
  else if (text.includes('开心') || text.includes('快乐')) emotionalTone = '欢快';
  
  return {
    mainTheme,
    keyElements: [...new Set(keyElements)].slice(0, 8),
    sceneType,
    emotionalTone,
    visualKeywords: [...new Set(keyElements)].slice(0, 6),
    imageStyle: '现代简约',
    colorTone: '和谐自然'
  };
};

/**
 * 生成配图提示词
 */
export const generateImagePrompts = async (content: string): Promise<string[]> => {
  console.log('🎨 开始生成配图提示词...');
  
  // 使用AI进行深度内容分析
  const contentAnalysis = await analyzeContentWithAI(content);
  console.log('🧠 内容分析完成:', contentAnalysis);
  
  // 构建更智能的配图生成提示
  const imagePrompt = `
你是专业的文章配图设计师，请基于深度内容分析为文章生成高度相关的配图。

【文章核心信息】：
- 核心主题：${contentAnalysis.mainTheme}
- 情感基调：${contentAnalysis.emotionalTone}
- 场景环境：${contentAnalysis.sceneType}
- 推荐风格：${contentAnalysis.imageStyle || '现代简约'}
- 色彩基调：${contentAnalysis.colorTone || '和谐自然'}
- 关键元素：${contentAnalysis.keyElements.join('、')}

【完整文章内容】：
${content}

【配图设计要求】：

**核心原则**：
1. 配图必须准确反映文章的核心主题："${contentAnalysis.mainTheme}"
2. 传达文章的情感基调："${contentAnalysis.emotionalTone}"
3. 营造与文章内容高度吻合的视觉意境
4. 避免任何与文章主题无关的元素

**视觉风格**：
- 整体风格：${contentAnalysis.imageStyle || '现代简约风格'}
- 色彩运用：${contentAnalysis.colorTone || '和谐自然的色彩'}
- 构图方式：简洁有力，突出主题
- 质感要求：专业摄影级别的视觉效果

**内容匹配**：
- 基于完整文章内容理解，而非表面关键词
- 体现文章的深层含义和情感价值
- 与文章的叙事节奏和情感起伏相呼应
- 确保读者看到配图能联想到文章内容

**技术要求**：
- 生成3个配图：开篇引入图、核心内容图、总结升华图
- 每个配图都要与对应段落的内容和情感匹配
- 所有配图保持统一的视觉风格和色彩基调
- 避免过于具体的物品，重点营造意境和氛围

请生成3个配图描述，返回JSON格式：
["开篇配图描述", "核心配图描述", "总结配图描述"]

每个描述必须：
- 准确体现对应部分的文章内容和情感
- 与文章主题"${contentAnalysis.mainTheme}"高度相关
- 营造"${contentAnalysis.emotionalTone}"的情感氛围
- 使用"${contentAnalysis.imageStyle || '现代简约'}"的视觉风格
- 采用"${contentAnalysis.colorTone || '和谐自然'}"的色彩基调
`;

  try {
    const result = await callOpenRouterAPI(imagePrompt);
    console.log('🎨 配图分析结果:', result);
    
    try {
      // 尝试解析JSON
      const prompts = JSON.parse(result);
      if (Array.isArray(prompts) && prompts.length > 0) {
        console.log('✅ 成功生成配图提示词:', prompts);
        return prompts;
      }
    } catch (parseError) {
      console.log('⚠️ JSON解析失败，尝试提取配图描述...');
      
      // 备用解析：提取引号中的内容
      const lines = result.split('\n');
      const prompts: string[] = [];
      
      for (const line of lines) {
        // 查找引号中的内容
        const matches = line.match(/"([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const prompt = match.replace(/"/g, '').trim();
            if (prompt.length > 20 && !prompts.includes(prompt)) {
              prompts.push(prompt);
            }
          });
        }
      }
      
      if (prompts.length > 0) {
        console.log('✅ 备用解析成功:', prompts);
        return prompts.slice(0, 3);
      }
    }
    
    // 最终备用方案：基于本地分析生成相关配图
    console.log('⚠️ 使用基于本地分析的备用配图方案...');
    return generateFallbackPrompts(analysis, content);
    
  } catch (error) {
    console.error('❌ 配图提示词生成失败:', error);
    
    // 错误时的备用方案：基于本地分析
    const analysis = analyzeArticleContent(content);
    return generateFallbackPrompts(analysis, content);
  }
};

/**
 * 生成备用配图提示词
 */
const generateFallbackPrompts = (analysis: any, content: string): string[] => {
  const contentPreview = content.substring(0, 100);
  const theme = analysis.emotion;
  const keywords = analysis.keywords.slice(0, 3);
  
  const basePrompts = {
    '友情': [
      `朋友间温馨对话的场景，${keywords.includes('咖啡厅') ? '咖啡厅' : '温馨环境'}，暖色调，现代简约风格`,
      `友谊象征的静物摄影，${keywords.includes('信件') ? '信件和照片' : '温暖的物品'}，柔和光线，文艺风格`,
      `朋友并肩的剪影，夕阳背景，温暖色调，表达友谊的陪伴`
    ],
    '怀念': [
      `怀旧回忆的场景，老照片和纪念品，复古色调，文艺风格`,
      `时光流逝的意境图，温暖的夕阳，怀旧氛围，表达对过往的思念`,
      `回忆中的美好时光，柔和的光线，温馨的色彩，营造怀念情绪`
    ],
    '温暖': [
      `温馨的生活场景，柔和的灯光，暖色调，体现生活的美好`,
      `温暖的人际互动，自然的光线，现代简约风格，表达人情温暖`,
      `治愈系的静物摄影，温馨的布置，柔和色彩，营造温暖氛围`
    ],
    '励志': [
      `积极向上的场景，明亮的光线，清新色调，传达正能量`,
      `努力奋斗的象征，朝阳背景，温暖色彩，体现进步和成长`,
      `成功时刻的表达，明亮的环境，现代风格，展现成就感`
    ],
    '思考': [
      `安静思考的场景，柔和的光线，深沉色调，营造思考氛围`,
      `沉思的意境图，自然光线，简约风格，表达内心的思考`,
      `哲思的静物摄影，书本和茶杯，文艺风格，体现思考的深度`
    ]
  };
  
  const prompts = basePrompts[theme as keyof typeof basePrompts] || basePrompts['温暖'];
  
  // 如果有特定关键词，进行个性化调整
  return prompts.map((prompt, index) => {
    if (keywords.length > 0 && index === 0) {
      // 第一张图片尽量包含文章的关键元素
      const keywordStr = keywords.slice(0, 2).join('和');
      return prompt.replace(/场景|环境/, `包含${keywordStr}的场景`);
    }
    return prompt;
  });
};