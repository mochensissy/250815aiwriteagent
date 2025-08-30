/**
 * 基于风格的动态提示词生成系统
 * 
 * 根据用户选择的匹配文章风格元素，在基础提示词基础上
 * 叠加生成个性化的一次性提示词，用于指导特定文章的生成
 */

import { StylePrototype, KnowledgeBaseArticle, StyleElement } from '../types';
import { getAPIConfig } from './storage';
import { callOpenRouterAPI } from './api';

/**
 * 基础提示词模板
 * 这是所有文章生成的基础框架
 */
const BASE_PROMPT_TEMPLATE = `
你是一位专业的微信公众号编辑，擅长创作自然、真实、有共鸣的文章。

**基础写作要求：**
1. 语言自然流畅，避免AI痕迹
2. 内容真实可信，有个人色彩
3. 结构清晰，逻辑连贯
4. 适合微信公众号阅读习惯
5. 字数控制在2000字左右

**通用风格指导：**
- 保持真诚、自然的表达方式
- 用生活化的语言，避免过于书面化
- 适当使用个人经历和感受
- 关注读者的情感共鸣
- 提供实用的价值和启发
`;

/**
 * 风格元素类型映射
 * 将风格元素分类，便于生成针对性的提示词
 */
interface StyleElementCategory {
  content: string[];      // 内容特征
  language: string[];     // 语言特色
  structure: string[];    // 结构习惯
  emotion: string[];      // 情感色彩
  interaction: string[];  // 互动方式
}

/**
 * 从风格元素中提取分类特征
 */
const categorizeStyleElements = (styleElements: StyleElement[]): StyleElementCategory => {
  const categories: StyleElementCategory = {
    content: [],
    language: [],
    structure: [],
    emotion: [],
    interaction: []
  };

  styleElements.forEach(element => {
    const desc = element.description.toLowerCase();
    
    // 基于关键词判断风格元素类型
    if (desc.includes('题材') || desc.includes('主题') || desc.includes('素材') || desc.includes('价值观')) {
      categories.content.push(element.description);
    } else if (desc.includes('语言') || desc.includes('表达') || desc.includes('用词') || desc.includes('口语')) {
      categories.language.push(element.description);
    } else if (desc.includes('结构') || desc.includes('开头') || desc.includes('层次') || desc.includes('逻辑')) {
      categories.structure.push(element.description);
    } else if (desc.includes('情感') || desc.includes('色调') || desc.includes('氛围') || desc.includes('温暖')) {
      categories.emotion.push(element.description);
    } else if (desc.includes('互动') || desc.includes('对话') || desc.includes('引导') || desc.includes('设问')) {
      categories.interaction.push(element.description);
    } else {
      // 默认归类为语言特色
      categories.language.push(element.description);
    }
  });

  return categories;
};

/**
 * 生成基于风格的动态提示词
 * 
 * @param draft 用户草稿内容
 * @param selectedPrototypes 用户选择的匹配文章
 * @param knowledgeBase 知识库文章（用于获取完整风格元素）
 * @returns 个性化的一次性提示词
 */
export const generateStyleBasedPrompt = async (
  draft: string,
  selectedPrototypes: StylePrototype[],
  knowledgeBase: KnowledgeBaseArticle[]
): Promise<string> => {
  console.log('🎨 开始生成基于风格的动态提示词...');
  console.log('📝 草稿长度:', draft.length);
  console.log('🎯 选择的参考文章数量:', selectedPrototypes.length);

  // 如果没有选择参考文章，返回基础提示词
  if (selectedPrototypes.length === 0) {
    console.log('📋 未选择参考文章，使用基础提示词');
    return BASE_PROMPT_TEMPLATE;
  }

  // 收集所有选中文章的风格元素
  const allStyleElements: StyleElement[] = [];
  const referenceArticles: KnowledgeBaseArticle[] = [];

  selectedPrototypes.forEach(prototype => {
    const article = knowledgeBase.find(a => a.id === prototype.articleId);
    if (article) {
      referenceArticles.push(article);
      if (article.styleElements) {
        // 只使用已确认的风格元素
        const confirmedElements = article.styleElements.filter(e => e.confirmed);
        allStyleElements.push(...confirmedElements);
      }
    }
  });

  console.log('✅ 收集到的风格元素数量:', allStyleElements.length);

  // 如果没有风格元素，直接使用基础提示词
  if (allStyleElements.length === 0) {
    console.log('📋 未找到预存风格元素，使用基础提示词');
    return BASE_PROMPT_TEMPLATE + `

**📝 用户草稿内容：**
---
${draft}
---

请基于以上草稿内容，创作一篇符合基础写作规范的文章。
`;
  }

  // 将风格元素分类
  const categorizedElements = categorizeStyleElements(allStyleElements);
  console.log('📊 风格元素分类完成:', {
    content: categorizedElements.content.length,
    language: categorizedElements.language.length,
    structure: categorizedElements.structure.length,
    emotion: categorizedElements.emotion.length,
    interaction: categorizedElements.interaction.length
  });

  // 构建个性化提示词
  const personalizedPrompt = buildPersonalizedPrompt(
    draft,
    categorizedElements,
    selectedPrototypes,
    referenceArticles
  );

  console.log('🎉 个性化提示词生成完成');
  return personalizedPrompt;
};

/**
 * 构建个性化提示词
 */
const buildPersonalizedPrompt = (
  draft: string,
  styleElements: StyleElementCategory,
  prototypes: StylePrototype[],
  articles: KnowledgeBaseArticle[]
): string => {
  
  let personalizedPrompt = BASE_PROMPT_TEMPLATE;

  // 添加个性化风格指导
  personalizedPrompt += `

**📚 个性化风格指导（基于您选择的参考文章）：**

`;

  // 内容特征指导
  if (styleElements.content.length > 0) {
    personalizedPrompt += `
**内容特征：**
${styleElements.content.map(element => `- ${element}`).join('\n')}
`;
  }

  // 语言特色指导
  if (styleElements.language.length > 0) {
    personalizedPrompt += `
**语言特色：**
${styleElements.language.map(element => `- ${element}`).join('\n')}
`;
  }

  // 结构习惯指导
  if (styleElements.structure.length > 0) {
    personalizedPrompt += `
**结构习惯：**
${styleElements.structure.map(element => `- ${element}`).join('\n')}
`;
  }

  // 情感色彩指导
  if (styleElements.emotion.length > 0) {
    personalizedPrompt += `
**情感色彩：**
${styleElements.emotion.map(element => `- ${element}`).join('\n')}
`;
  }

  // 互动方式指导
  if (styleElements.interaction.length > 0) {
    personalizedPrompt += `
**互动方式：**
${styleElements.interaction.map(element => `- ${element}`).join('\n')}
`;
  }

  // 添加参考文章信息
  personalizedPrompt += `

**🎯 参考文章示例：**
${prototypes.map((prototype, index) => {
    const article = articles.find(a => a.id === prototype.articleId);
    return `
${index + 1}. 《${article?.title || '未知标题'}》（匹配度：${prototype.similarity}%）
   风格特点：${prototype.description}
   文章摘要：${article?.content.substring(0, 200) || ''}...`;
  }).join('')}

**⚠️ 重要提醒：**
- 请严格按照上述个性化风格特征来创作
- 保持与参考文章相似的语言风格和表达习惯
- 确保内容主题与草稿意图一致
- 融入个人化的表达方式，避免生硬模仿

**📝 用户草稿内容：**
---
${draft}
---

请基于以上风格指导和草稿内容，创作一篇符合个人风格的文章。
`;

  return personalizedPrompt;
};

/**
 * 当没有预存风格元素时，通过AI分析参考文章生成提示词
 */
const generatePromptFromArticleAnalysis = async (
  draft: string,
  referenceArticles: KnowledgeBaseArticle[]
): Promise<string> => {
  
  if (referenceArticles.length === 0) {
    return BASE_PROMPT_TEMPLATE;
  }

  // 构建AI分析提示
  const analysisPrompt = `
作为专业的写作风格分析师，请分析以下参考文章，提取关键的写作风格特征，用于指导新文章的创作。

**参考文章：**
${referenceArticles.map((article, index) => `
${index + 1}. 《${article.title}》
内容：${article.content.substring(0, 800)}...
`).join('\n')}

**用户草稿：**
${draft}

请从以下维度分析写作风格特征：

1. **语言特色**：用词习惯、句式特点、表达方式
2. **情感色调**：文章的整体情感氛围和表达倾向
3. **结构特点**：段落组织、逻辑展开、开头结尾方式
4. **内容偏好**：关注的主题类型、素材选择、价值观倾向
5. **互动方式**：与读者的互动模式、引导方式

基于分析结果，生成一套写作指导原则，帮助用户按照相似风格创作新文章。

返回格式：
**个性化写作指导：**
[具体的风格指导内容]
`;

  try {
    const analysisResult = await callOpenRouterAPI(analysisPrompt);
    
    // 将AI分析结果与基础提示词结合
    return `${BASE_PROMPT_TEMPLATE}

${analysisResult}

**📝 用户草稿内容：**
---
${draft}
---

请基于以上分析的风格特征和草稿内容，创作一篇风格一致的文章。
`;
  } catch (error) {
    console.error('❌ AI风格分析失败:', error);
    // 降级到基础提示词
    return BASE_PROMPT_TEMPLATE;
  }
};

/**
 * 生成风格要素摘要
 * 用于在UI中显示当前使用的风格特征
 */
export const generateStyleSummary = (
  selectedPrototypes: StylePrototype[],
  knowledgeBase: KnowledgeBaseArticle[]
): string => {
  if (selectedPrototypes.length === 0) {
    return '使用通用写作风格';
  }

  const styleFeatures: string[] = [];
  
  selectedPrototypes.forEach(prototype => {
    const article = knowledgeBase.find(a => a.id === prototype.articleId);
    if (article?.styleElements) {
      const confirmedElements = article.styleElements
        .filter(e => e.confirmed)
        .map(e => e.description);
      styleFeatures.push(...confirmedElements);
    }
  });

  if (styleFeatures.length === 0) {
    return `基于 ${selectedPrototypes.length} 篇参考文章的风格特征`;
  }

  // 去重并取前3个最重要的特征
  const uniqueFeatures = [...new Set(styleFeatures)].slice(0, 3);
  return `风格特征：${uniqueFeatures.join('、')}`;
};

/**
 * 验证风格元素的有效性
 */
export const validateStyleElements = (styleElements: StyleElement[]): boolean => {
  return styleElements.length > 0 && styleElements.some(e => e.confirmed);
};

/**
 * 获取风格元素统计信息
 */
export const getStyleElementsStats = (
  selectedPrototypes: StylePrototype[],
  knowledgeBase: KnowledgeBaseArticle[]
): {
  totalElements: number;
  confirmedElements: number;
  categories: Record<string, number>;
} => {
  let totalElements = 0;
  let confirmedElements = 0;
  const categories: Record<string, number> = {
    content: 0,
    language: 0,
    structure: 0,
    emotion: 0,
    interaction: 0
  };

  selectedPrototypes.forEach(prototype => {
    const article = knowledgeBase.find(a => a.id === prototype.articleId);
    if (article?.styleElements) {
      totalElements += article.styleElements.length;
      
      article.styleElements.forEach(element => {
        if (element.confirmed) {
          confirmedElements++;
          
          // 简单分类统计
          const desc = element.description.toLowerCase();
          if (desc.includes('题材') || desc.includes('主题')) {
            categories.content++;
          } else if (desc.includes('语言') || desc.includes('表达')) {
            categories.language++;
          } else if (desc.includes('结构') || desc.includes('逻辑')) {
            categories.structure++;
          } else if (desc.includes('情感') || desc.includes('色调')) {
            categories.emotion++;
          } else if (desc.includes('互动') || desc.includes('对话')) {
            categories.interaction++;
          }
        }
      });
    }
  });

  return {
    totalElements,
    confirmedElements,
    categories
  };
};
