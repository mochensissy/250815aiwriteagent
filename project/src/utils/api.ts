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
  const prompt = `
作为专业的文本风格分析师，请分析以下文章内容，提炼出作者的写作风格特征：

${articles.map((article, index) => `文章${index + 1}:\n${article}\n\n`).join('')}

请从以下维度分析并提炼风格要素：
1. 词汇特点（常用词汇、专业术语偏好）
2. 句法特点（句式结构、语言节奏）
3. 结构特点（文章组织方式、段落安排）
4. 修辞特点（比喻手法、表达方式）

每个维度请提供3-5个具体的风格特征描述，格式如："倾向于使用设问句开篇"、"经常使用'底层逻辑'等分析性词汇"等。

请以JSON数组格式返回，每个元素为一个风格特征描述字符串。
`;

  try {
    const result = await callGeminiAPI(prompt);
    // 尝试解析JSON，如果失败则分割文本
    try {
      return JSON.parse(result);
    } catch {
      return result.split('\n').filter(line => line.trim() && !line.includes('```'));
    }
  } catch (error) {
    console.error('风格分析失败:', error);
    return [];
  }
};

/**
 * 推荐风格原型
 */
export const recommendStylePrototypes = async (draft: string, caseArticles: any[]): Promise<any[]> => {
  const prompt = `
基于用户的草稿内容，从案例库中推荐最匹配的写作风格原型：

用户草稿：
${draft}

案例库文章：
${caseArticles.map((article, index) => `${index + 1}. 标题：${article.title}\n内容摘要：${article.content.substring(0, 200)}...\n\n`).join('')}

请分析草稿的主题、语气、结构需求，从案例库中选择1-3个最匹配的文章作为风格原型。

返回JSON数组格式，包含：
- articleId: 文章ID
- similarity: 相似度分数(0-100)
- reason: 推荐理由

示例：
[
  {
    "articleId": "1",
    "similarity": 85,
    "reason": "同样是分析类文章，结构清晰，逻辑严密"
  }
]
`;

  try {
    const result = await callGeminiAPI(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  } catch (error) {
    console.error('风格原型推荐失败:', error);
    return [];
  }
};

/**
 * 生成文章大纲
 */
export const generateOutline = async (draft: string, styleContext: string): Promise<any[]> => {
  const prompt = `
基于用户草稿和风格要求，生成结构化的文章大纲：

草稿内容：
${draft}

风格要求：
${styleContext}

请生成一个清晰的文章大纲，包含：
1. 引言部分
2. 3-5个主要章节
3. 结论部分

返回JSON数组格式，每个节点包含：
- id: 唯一标识
- title: 章节标题
- level: 层级（1为主标题，2为副标题）
- order: 排序

示例：
[
  {
    "id": "1",
    "title": "引言：未来能源的重要性",
    "level": 1,
    "order": 0
  }
]
`;

  try {
    const result = await callGeminiAPI(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  } catch (error) {
    console.error('大纲生成失败:', error);
    return [];
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