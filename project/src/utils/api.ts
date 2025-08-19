/**
 * API调用工具集合
 * 
 * 集成Google Gemini、Perplexity和豆包生图API
 * 提供统一的接口供组件调用各种AI服务
 */

import { getAPIConfig } from './storage';

/**
 * 调用Google Gemini API进行文本生成
 */
export const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const config = getAPIConfig();
    console.log('🚀 调用Gemini API');
    console.log('📝 Prompt长度:', prompt.length);
    console.log('📝 Prompt预览:', prompt.substring(0, 200) + '...');
    
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
      })
    });

    console.log('✅ Gemini API响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API错误详情:', errorText);
      throw new Error(`Gemini API错误: ${response.status}`);
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
  } catch (error) {
    console.error('❌ Gemini API调用失败:', error);
    throw error;
  }
};

/**
 * 调用Perplexity API进行外部搜索
 */
export const callPerplexityAPI = async (query: string): Promise<string> => {
  try {
    const config = getAPIConfig();
    const response = await fetch(config.perplexity.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.perplexity.apiKey}`,
      },
      body: JSON.stringify({
        query: query,
        model: 'llama-3.1-sonar-large-128k-online'
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API错误: ${response.status}`);
    }

    const data = await response.json();
    // 根据Perplexity API的实际响应格式调整
    return data.answer || data.result || data.response || JSON.stringify(data);
  } catch (error) {
    console.error('Perplexity API调用失败:', error);
    throw error;
  }
};

/**
 * 调用豆包生图API生成图片
 */
export const generateImage = async (prompt: string, size = '1024x1024'): Promise<string> => {
  try {
    const config = getAPIConfig();
    const response = await fetch(config.doubao.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.doubao.apiKey}`,
      },
      body: JSON.stringify({
        model: config.doubao.model,
        prompt: prompt,
        response_format: 'url',
        size: size,
        guidance_scale: 3,
        watermark: true
      })
    });

    if (!response.ok) {
      throw new Error(`豆包生图API错误: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0]?.url || '';
  } catch (error) {
    console.error('豆包生图API调用失败:', error);
    throw error;
  }
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
    const result = await callGeminiAPI(prompt);
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
  
  // 检查API配置
  const apiConfig = localStorage.getItem('apiConfig');
  console.log('⚙️ API配置检查:', apiConfig ? 'API已配置' : 'API未配置');
  
  if (!apiConfig) {
    console.warn('⚠️ 没有找到API配置，跳过推荐');
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
    const result = await callGeminiAPI(prompt);
    console.log('🤖 AI推荐结果:', result);
    
    try {
      const recommendations = JSON.parse(result);
      console.log('✅ 解析成功，推荐数量:', recommendations.length);
      
      // 验证数据结构并添加必要字段
      const validPrototypes = recommendations
        .filter(item => item.articleId && item.title && item.similarity)
        .map((item, index) => ({
          id: item.id || `prototype_${Date.now()}_${index}`,
          title: item.title,
          description: item.description || item.reason || '相似风格推荐',
          articleId: item.articleId,
          similarity: Math.min(100, Math.max(0, parseInt(item.similarity) || 70))
        }));
      
      console.log('🎯 有效推荐数量:', validPrototypes.length);
      return validPrototypes;
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError);
      console.log('📄 原始返回内容:', result);
      return [];
    }
  } catch (error) {
    console.error('❌ 风格原型推荐API调用失败:', error);
    return [];
  }
};

/**
 * 生成文章大纲
 */
export const generateOutline = async (draft: string, styleContext: string): Promise<any[]> => {
  console.log('🎯 开始生成微信公众号风格大纲...');
  console.log('📝 草稿内容预览:', draft.substring(0, 100) + '...');
  console.log('🎨 风格上下文:', styleContext);

  const prompt = `
你是一位经验丰富的微信公众号编辑，请基于用户草稿生成实用的文章大纲。

用户草稿内容：
---
${draft}
---

个人写作风格：
${styleContext}

**任务要求：**

1. **深度分析草稿核心内容**，提炼出逻辑清晰的内容结构
2. **每个小标题都要如实反映该部分的内容**，帮助读者理解文章脉络
3. **小标题应该简洁明了**，便于用户快速了解要写什么

**小标题创作规则：**
- 用简洁的陈述句描述该部分的主要内容
- 避免过度营销化的语言，注重实用性
- 每个标题要准确概括该部分要表达的核心观点
- 保持逻辑顺序和内容连贯性

**大纲结构（4-5个部分）：**
1. **开篇部分**：引出话题背景或个人经历
2. **核心内容1**：基于草稿的第一个重点论述
3. **核心内容2**：基于草稿的第二个重点论述  
4. **深入分析**：提供更深层的思考或分析
5. **总结建议**：给出具体的行动建议或总结

**标题示例：**
- "我的亲身经历：关于XXX的思考"
- "第一个发现：XXX背后的真实情况"
- "深度分析：为什么XXX会产生这种现象"
- "实用建议：如何更好地应对XXX"

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

**重要提醒：小标题要实用、准确，概述要说明该部分的具体写作内容！**
`;

  try {
    const result = await callGeminiAPI(prompt);
    console.log('🤖 AI大纲生成结果:', result);
    
    try {
      const outlineData = JSON.parse(result);
      console.log('✅ 大纲解析成功，节点数量:', outlineData.length);
      
      // 验证大纲数据并添加必要字段
      const validOutline = outlineData
        .filter(item => item.title && item.title.trim().length > 0)
        .map((item, index) => ({
          id: item.id || String(index + 1),
          title: item.title.trim(),
          summary: item.summary || '内容概述待补充',
          level: item.level || 1,
          order: item.order !== undefined ? item.order : index
        }));
      
      console.log('🎯 有效大纲节点:', validOutline.length);
      validOutline.forEach((node, i) => {
        console.log(`📖 ${i+1}. ${node.title}`);
      });
      
      return validOutline;
    } catch (parseError) {
      console.error('❌ 大纲JSON解析失败:', parseError);
      console.log('📄 原始返回内容:', result);
      
      // 备用大纲，但要基于草稿内容
      const draftKeywords = draft.substring(0, 50);
      return [
        { id: '1', title: `关于${draftKeywords}的思考开始...`, summary: '分享个人经历或引出话题背景', level: 1, order: 0 },
        { id: '2', title: '我发现了一个关键问题', summary: '基于草稿内容的核心观点阐述', level: 1, order: 1 },
        { id: '3', title: '深挖背后的真相', summary: '深入分析问题的本质原因', level: 1, order: 2 },
        { id: '4', title: '我的解决方案分享', summary: '提供具体可行的建议或总结', level: 1, order: 3 }
      ];
    }
  } catch (error) {
    console.error('❌ 大纲生成API调用失败:', error);
    return [
      { id: '1', title: '开篇：我的新发现', summary: '分享个人发现或经历', level: 1, order: 0 },
      { id: '2', title: '深度：核心观点分析', summary: '深入阐述主要观点', level: 1, order: 1 },
      { id: '3', title: '反思：改变我想法的关键', summary: '个人思考和感悟', level: 1, order: 2 },
      { id: '4', title: '行动：具体建议分享', summary: '提供实用的行动建议', level: 1, order: 3 }
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
  externalInsights?: string
): Promise<string> => {
  const prompt = `
基于以下信息生成一篇完整的文章：

原始草稿：
${draft}

文章大纲：
${outline.map(node => `${node.level === 1 ? '# ' : '## '}${node.title}`).join('\n')}

个人风格要求：
${styleContext}

${externalInsights ? `外部搜索增强信息：\n${externalInsights}\n` : ''}

请生成一篇结构完整、风格一致的文章，要求：
1. 严格按照大纲结构展开
2. 融入个人风格特征
3. 逻辑清晰，论证充分
4. 语言生动，易于阅读

直接返回Markdown格式的文章内容。
`;

  try {
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('文章生成失败:', error);
    throw error;
  }
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
用户想要修改以下内容：

${selectedText ? `选中的文本：\n${selectedText}\n\n` : ''}

完整内容：
${content}

修改指令：${instruction}

请根据指令进行修改，只返回修改后的${selectedText ? '选中部分' : '完整'}内容，不要包含其他解释。
`;

  try {
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('编辑指令处理失败:', error);
    throw error;
  }
};

/**
 * 生成配图提示词
 */
export const generateImagePrompts = async (content: string): Promise<string[]> => {
  const prompt = `
分析以下文章内容，为其生成3张配图的提示词：

${content}

请为文章生成3个不同位置的配图描述，要求：
1. 符合文章主题和氛围
2. 画面描述具体详细
3. 适合作为插图使用

返回JSON数组格式，每个元素为一个图片描述字符串。

示例：
[
  "科技感的未来城市景观，蓝色调，现代化建筑",
  "抽象的数据流动图，几何图形，渐变色彩",
  "简约的商业图表，柱状图，专业配色"
]
`;

  try {
    const result = await callGeminiAPI(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return result.split('\n').filter(line => line.trim());
    }
  } catch (error) {
    console.error('配图提示词生成失败:', error);
    return [];
  }
};