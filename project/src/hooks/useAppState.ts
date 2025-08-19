/**
 * 应用状态管理Hook
 * 
 * 管理整个应用的状态，包括知识库、当前文章、风格设置等
 * 提供统一的状态更新接口和数据持久化
 */

import { useState, useEffect } from 'react';
import { AppState, KnowledgeBaseArticle, OutlineNode, GeneratedImage, StylePrototype, APIConfig } from '../types';
import { 
  getKnowledgeBase, 
  saveKnowledgeBase, 
  getCurrentArticle, 
  saveCurrentArticle,
  getAPIConfig,
  saveAPIConfig 
} from '../utils/storage';
import { 
  analyzeStyleElements, 
  recommendStylePrototypes, 
  generateOutline, 
  generateFullArticle,
  processEditInstruction,
  callPerplexityAPI,
  generateImagePrompts,
  generateImage,
  callGeminiAPI
} from '../utils/api';
import toast from 'react-hot-toast';

export const useAppState = () => {
  const [appState, setAppState] = useState<AppState>({
    knowledgeBase: [],
    termMappings: [],
    writingRules: [],
    apiConfig: getAPIConfig()
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [stylePrototypes, setStylePrototypes] = useState<StylePrototype[]>([]);

  // 初始化数据
  useEffect(() => {
    const knowledgeBase = getKnowledgeBase();
    const currentArticle = getCurrentArticle();
    const apiConfig = getAPIConfig();
    
    setAppState(prev => ({
      ...prev,
      knowledgeBase,
      currentArticle: currentArticle || undefined,
      apiConfig
    }));
  }, []);

  // 添加文章到知识库
  const addToKnowledgeBase = async (
    content: string, 
    title: string, 
    category: 'memory' | 'case', 
    source: 'upload' | 'paste' | 'url',
    url?: string
  ): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        const newArticle: KnowledgeBaseArticle = {
          id: Date.now().toString(),
          title,
          content,
          category,
          tags: [], // 后续可添加AI自动标签功能
          createdAt: new Date().toISOString(),
          source,
          url
        };

        const updatedKnowledgeBase = [...appState.knowledgeBase, newArticle];
        setAppState(prev => ({ ...prev, knowledgeBase: updatedKnowledgeBase }));
        saveKnowledgeBase(updatedKnowledgeBase);
        
        // 如果是记忆库文章，异步分析该文章的风格要素
        if (category === 'memory') {
          // 异步执行风格分析，不阻塞主流程
          setTimeout(async () => {
            try {
              console.log('🎨 开始分析该文章的风格要素...');
              
              const styleElements = await analyzeStyleElements([content]);
              console.log('✅ 风格分析完成，提取风格要素:', styleElements.length);
              
              if (styleElements.length > 0) {
                const updatedStyleElements = styleElements.map((description, index) => ({
                  id: `style_${newArticle.id}_${index}`,
                  articleId: newArticle.id,
                  description,
                  confirmed: false, // 需要用户确认
                  createdAt: new Date(),
                  category: 'structure' as const // 默认分类，实际应该由AI分析决定
                }));
                
                // 更新该文章的风格要素
                setAppState(prev => ({
                  ...prev,
                  knowledgeBase: prev.knowledgeBase.map(article => 
                    article.id === newArticle.id 
                      ? { ...article, styleElements: updatedStyleElements }
                      : article
                  )
                }));
                
                // 同时保存到localStorage
                const updatedKnowledgeBaseWithStyle = updatedKnowledgeBase.map(article => 
                  article.id === newArticle.id 
                    ? { ...article, styleElements: updatedStyleElements }
                    : article
                );
                saveKnowledgeBase(updatedKnowledgeBaseWithStyle);
                
                console.log('🎨 风格要素已更新到状态');
                
                // 查找与新文章相似的现有文章
                const existingMemoryArticles = updatedKnowledgeBase.filter(a => 
                  a.category === 'memory' && a.id !== newArticle.id
                );
                
                if (existingMemoryArticles.length > 0) {
                  console.log('🔍 开始查找相似文章...');
                  try {
                    const similarArticles = await recommendStylePrototypes(content, existingMemoryArticles);
                    if (similarArticles.length > 0) {
                      console.log(`✨ 找到 ${similarArticles.length} 篇相似文章，相似度最高: ${similarArticles[0].similarity}%`);
                      toast.success(`发现 ${similarArticles.length} 篇相似风格的文章！`);
                    }
                  } catch (error) {
                    console.error('相似文章查找失败:', error);
                  }
                }
              }
            } catch (styleError) {
              console.error('风格分析失败:', styleError);
              // 不影响主流程，静默处理
            }
          }, 1000);
        }
        
        // 模拟一点延迟来显示上传过程
        setTimeout(() => {
          resolve();
        }, 500);
      } catch (error) {
        console.error('添加到知识库失败:', error);
        throw error;
      }
    });
  };

  // 推荐风格原型
  const recommendStylePrototypesFromDraft = async (draft: string): Promise<void> => {
    try {
      console.log('🎨 开始推荐风格原型...');
      const caseArticles = appState.knowledgeBase.filter(a => a.category === 'case');
      
      if (caseArticles.length === 0) {
        console.log('⚠️ 案例库为空，无法推荐风格原型');
        return;
      }
      
      const prototypes = await recommendStylePrototypes(draft, caseArticles);
      console.log('✅ 风格原型推荐完成:', prototypes.length);
      
      setStylePrototypes(prototypes);
    } catch (error) {
      console.error('风格原型推荐失败:', error);
    }
  };

  // 用户确认风格后生成大纲
  const generateOutlineWithSelectedStyle = async (selectedPrototypes: StylePrototype[]) => {
    if (!appState.currentArticle) return;
    
    setIsProcessing(true);
    
    try {
      console.log('🎨 使用选定的风格生成大纲...');
      
      // 获取选定文章的风格要素
      const selectedStyleElements = selectedPrototypes.flatMap(prototype => {
        const article = appState.knowledgeBase.find(a => a.id === prototype.articleId);
        return article?.styleElements?.filter(e => e.confirmed).map(e => e.description) || [];
      });
      
      const styleContext = selectedStyleElements.join('; ');
      console.log('🎨 选定的风格上下文:', styleContext);
      
      // 调用AI生成大纲
      const { generateOutline } = await import('../utils/api');
      const aiOutline = await generateOutline(appState.currentArticle.draft, styleContext || '通用写作风格');
      
      // 处理AI生成的大纲
      let finalOutline: OutlineNode[];
      if (aiOutline && Array.isArray(aiOutline) && aiOutline.length > 0) {
        console.log('✅ AI大纲生成成功，节点数量:', aiOutline.length);
        finalOutline = aiOutline.map((node, index) => ({
          id: String(index + 1),
          title: node.title || `章节 ${index + 1}`,
          level: node.level || 1,
          order: index
        }));
      } else {
        console.log('⚠️ AI生成失败，使用备用大纲');
        finalOutline = [
          { id: '1', title: '开篇：引出话题', level: 1, order: 0 },
          { id: '2', title: '核心观点展开', level: 1, order: 1 },
          { id: '3', title: '个人思考感悟', level: 1, order: 2 },
          { id: '4', title: '结语：呼应升华', level: 1, order: 3 }
        ];
      }
      
      // 更新文章状态
      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          outline: finalOutline
        } : undefined
      }));
      
      toast.success('大纲已生成！');
    } catch (error) {
      console.error('大纲生成失败:', error);
      toast.error('大纲生成失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 开始新文章创作
  const startNewArticle = async (draft: string, platform: string = '公众号') => {
    setIsProcessing(true);
    
    try {
      console.log('🚀 开始创作新文章');
      console.log('📝 草稿长度:', draft.length);
      console.log('🎯 目标平台:', platform);
      
      // 先推荐风格原型，但不立即生成大纲
      console.log('🔍 推荐风格原型...');
      await recommendStylePrototypesFromDraft(draft);
      
      // 检查是否有推荐的风格原型
      if (stylePrototypes.length > 0) {
        console.log(`✨ 找到 ${stylePrototypes.length} 个推荐的风格原型，等待用户确认...`);
        // 不立即生成大纲，等待用户在界面上确认选择的参考文章
        
        // 创建临时的文章状态，包含草稿但没有大纲
        setAppState(prev => ({
          ...prev,
          currentArticle: {
            title: '新文章',
            draft,
            outline: [], // 空大纲，等待用户确认风格后生成
            content: '',
            images: []
          }
        }));
        
        toast.success('请在右侧选择参考的写作风格，然后生成大纲');
        return; // 不继续执行大纲生成
      }
      
      // 如果没有推荐的风格原型，使用所有确认的风格要素
      const allStyleElements = appState.knowledgeBase
        .filter(a => a.category === 'memory')
        .flatMap(a => a.styleElements || [])
        .filter(e => e.confirmed) // 只使用已确认的风格要素
        .map(e => e.description);
      
      const styleContext = allStyleElements.join('; ');
      console.log('🎨 风格上下文:', styleContext || '无风格上下文');
      console.log('📊 可用风格要素数量:', allStyleElements.length);
      
      // 调用AI生成大纲
      console.log('🤖 调用AI生成个性化大纲...');
      const { generateOutline } = await import('../utils/api');
      const aiOutline = await generateOutline(draft, styleContext || '通用写作风格');
      
      // 如果AI生成失败，使用备用大纲
      let finalOutline: OutlineNode[];
      if (aiOutline && Array.isArray(aiOutline) && aiOutline.length > 0) {
        console.log('✅ AI大纲生成成功，节点数量:', aiOutline.length);
        finalOutline = aiOutline.map((node, index) => ({
          id: String(index + 1),
          title: node.title || `章节 ${index + 1}`,
          level: node.level || 1,
          order: index
        }));
      } else {
        console.log('⚠️ AI大纲生成失败，使用备用大纲');
        finalOutline = [
          {
            id: '1',
            title: '引言：背景介绍',
            level: 1,
            order: 0
          },
          {
            id: '2', 
            title: '核心观点阐述',
            level: 1,
            order: 1
          },
          {
            id: '3',
            title: '具体案例分析',
            level: 1,
            order: 2
          },
          {
            id: '4',
            title: '总结与展望',
            level: 1,
            order: 3
          }
        ];
      }

      console.log('📋 最终大纲节点数量:', finalOutline.length);
      setAppState(prev => ({
        ...prev,
        currentArticle: {
          title: '新文章',
          draft,
          outline: finalOutline,
          content: '',
          images: []
        }
      }));

      toast.success('文章大纲已生成！');
    } catch (error) {
      console.error('创作启动失败:', error);
      toast.error(`创作启动失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      // 即使出错也提供基础大纲
      const fallbackOutline: OutlineNode[] = [
        { id: '1', title: '引言', level: 1, order: 0 },
        { id: '2', title: '主体内容', level: 1, order: 1 },
        { id: '3', title: '总结', level: 1, order: 2 }
      ];
      
      setAppState(prev => ({
        ...prev,
        currentArticle: {
          title: '新文章',
          draft,
          outline: fallbackOutline,
          content: '',
          images: []
        }
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成标题选项
  const generateTitleOptions = async (): Promise<string[]> => {
    if (!appState.currentArticle?.content) return [];

    setIsProcessing(true);
    
    try {
      const prompt = `
基于以下文章内容，生成5个吸引人的标题选项：

${appState.currentArticle.content}

要求：
1. 标题要简洁有力，能准确概括文章主题
2. 具有吸引力和点击欲望
3. 适合在社交媒体和内容平台传播
4. 长度控制在15-25个字符

请以JSON数组格式返回5个标题选项。
`;

      const result = await callGeminiAPI(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('标题生成失败:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成完整文章
  const generateArticle = async () => {
    if (!appState.currentArticle) return;

    setIsProcessing(true);
    
    try {
      console.log('🚀 开始生成文章');
      console.log('📋 大纲节点数量:', appState.currentArticle.outline.length);
      console.log('📝 草稿长度:', appState.currentArticle.draft.length);
      
      // 获取风格上下文（从所有记忆库文章的风格要素中）
      const allStyleElements = appState.knowledgeBase
        .filter(a => a.category === 'memory')
        .flatMap(a => a.styleElements || [])
        .filter(e => e.confirmed) // 只使用已确认的风格要素
        .map(e => e.description);
      
      const styleContext = allStyleElements.join('; ');
      console.log('🎨 风格上下文:', styleContext || '无风格上下文');
      console.log('📊 可用风格要素数量:', allStyleElements.length);
      
      let fullContent: string;
      try {
        console.log('🤖 调用AI生成完整文章...');
        fullContent = await generateFullArticle(
          appState.currentArticle.outline,
          appState.currentArticle.draft,
          styleContext || '通用写作风格'
        );
        console.log('✅ AI文章生成完成，长度:', fullContent.length);
      } catch (aiError) {
        console.log('⚠️ AI生成失败，使用备用模板:', aiError);
        
        // 生成基于大纲的模板文章
        fullContent = `# ${appState.currentArticle.title || '我的文章'}

## 前言

基于您提供的草稿内容，我为您生成了这篇文章框架。您可以在编辑器中进一步完善内容。

**原始草稿：**
${appState.currentArticle.draft}

---

${appState.currentArticle.outline.map(node => {
  const prefix = node.level === 1 ? '## ' : '### ';
  return `${prefix}${node.title}

这一部分将围绕"${node.title}"展开详细论述。

- 核心观点阐述
- 具体案例分析  
- 实用建议提供
- 关键要点总结

`;
}).join('\n')}

## 总结

通过以上内容的梳理和分析，我们对这个话题有了更深入的理解。希望这篇文章能为您提供有价值的参考。

---

*提示：本文基于您的草稿和大纲生成，请使用编辑器功能进一步完善内容。*`;
      }

      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          content: fullContent
        } : undefined
      }));

      toast.success('文章已生成！可在编辑器中进一步完善');
    } catch (error) {
      console.error('❌ 文章生成失败:', error);
      toast.error(`文章生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理编辑指令
  const handleEditInstruction = async (instruction: string, selectedText?: string) => {
    if (!appState.currentArticle) return;

    setIsProcessing(true);
    
    try {
      const editedContent = await processEditInstruction(
        instruction,
        appState.currentArticle.content,
        selectedText
      );

      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          content: editedContent
        } : undefined
      }));

      toast.success('内容已修改！');
    } catch (error) {
      console.error('编辑失败:', error);
      toast.error('编辑失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 外部搜索增强
  const performExternalSearch = async (query: string) => {
    setIsProcessing(true);
    
    try {
      const insights = await callPerplexityAPI(query);
      toast.success('外部搜索完成，信息已整合到创作上下文中');
      return insights;
    } catch (error) {
      console.error('外部搜索失败:', error);
      toast.error('外部搜索失败，请重试');
      return '';
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成配图
  const generateImages = async () => {
    if (!appState.currentArticle?.content) return;

    setIsProcessing(true);
    
    try {
      const prompts = await generateImagePrompts(appState.currentArticle.content);
      const images: GeneratedImage[] = [];

      for (let i = 0; i < Math.min(prompts.length, 3); i++) {
        const imageUrl = await generateImage(prompts[i]);
        images.push({
          id: `img_${Date.now()}_${i}`,
          url: imageUrl,
          prompt: prompts[i],
          position: i
        });
      }

      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          images
        } : undefined
      }));

      toast.success(`已生成 ${images.length} 张配图！`);
    } catch (error) {
      console.error('配图生成失败:', error);
      toast.error('配图生成失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成封面
  const generateCover = async (style: string, platform: string) => {
    if (!appState.currentArticle?.title) return;

    setIsProcessing(true);
    
    try {
      const prompt = `为文章"${appState.currentArticle.title}"生成${style}风格的${platform}封面图，尺寸适配${platform}平台要求`;
      const imageUrl = await generateImage(prompt);
      
      const coverImage: GeneratedImage = {
        id: `cover_${Date.now()}`,
        url: imageUrl,
        prompt
      };

      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          coverImage
        } : undefined
      }));

      toast.success('封面已生成！');
    } catch (error) {
      console.error('封面生成失败:', error);
      toast.error('封面生成失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 更新大纲
  const updateOutline = (outline: OutlineNode[]) => {
    setAppState(prev => ({
      ...prev,
      currentArticle: prev.currentArticle ? {
        ...prev.currentArticle,
        outline
      } : undefined
    }));
  };

  // 更新文章内容
  const updateContent = (content: string) => {
    setAppState(prev => ({
      ...prev,
      currentArticle: prev.currentArticle ? {
        ...prev.currentArticle,
        content
      } : undefined
    }));
  };

  // 导出文章
  const exportArticle = () => {
    if (!appState.currentArticle) return;

    let exportContent = `# ${appState.currentArticle.title}\n\n`;
    exportContent += appState.currentArticle.content;

    // 添加图片
    if (appState.currentArticle.images.length > 0) {
      exportContent += '\n\n## 配图\n\n';
      appState.currentArticle.images.forEach((image, index) => {
        exportContent += `![配图${index + 1}](${image.url})\n\n`;
      });
    }

    navigator.clipboard.writeText(exportContent).then(() => {
      toast.success('文章已复制到剪贴板！可直接粘贴到发布平台');
    }).catch(() => {
      toast.error('复制失败，请手动选择文本复制');
    });
  };

  // 删除文章
  const deleteArticle = async (articleId: string): Promise<void> => {
    try {
      const updatedKnowledgeBase = appState.knowledgeBase.filter(article => article.id !== articleId);
      
      setAppState(prev => ({
        ...prev,
        knowledgeBase: updatedKnowledgeBase
      }));
      
      // 保存到本地存储
      saveKnowledgeBase(updatedKnowledgeBase);
      
      toast.success('文章已删除');
      // 注意：风格要素现在直接关联到文章，删除文章时会自动删除对应的风格要素
    } catch (error) {
      console.error('删除文章失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 更新风格要素
  const updateStyleElement = (elementId: string, confirmed: boolean) => {
    if (confirmed) {
      // 确认风格要素
      setAppState(prev => ({
        ...prev,
        knowledgeBase: prev.knowledgeBase.map(article => ({
          ...article,
          styleElements: article.styleElements?.map(element =>
            element.id === elementId 
              ? { ...element, confirmed: true }
              : element
          )
        }))
      }));
      toast.success('风格要素已确认');
    } else {
      // 删除风格要素
      setAppState(prev => ({
        ...prev,
        knowledgeBase: prev.knowledgeBase.map(article => ({
          ...article,
          styleElements: article.styleElements?.filter(element => element.id !== elementId)
        }))
      }));
      toast.success('风格要素已删除');
    }
    
    // 保存更新后的知识库
    setTimeout(() => {
      saveKnowledgeBase(appState.knowledgeBase);
    }, 100);
  };

  // 更新API配置
  const updateAPIConfig = (apiConfig: APIConfig) => {
    setAppState(prev => ({
      ...prev,
      apiConfig
    }));
    saveAPIConfig(apiConfig);
    toast.success('API配置已更新');
  };

  // 保存当前文章状态
  useEffect(() => {
    if (appState.currentArticle) {
      saveCurrentArticle(appState.currentArticle);
    }
  }, [appState.currentArticle]);

  return {
    appState,
    isProcessing,
    stylePrototypes,
    addToKnowledgeBase,
    deleteArticle,
    updateStyleElement,
    recommendStylePrototypesFromDraft,
    generateOutlineWithSelectedStyle,
    startNewArticle,
    generateArticle,
    generateTitleOptions,
    handleEditInstruction,
    performExternalSearch,
    generateImages,
    generateCover,
    updateOutline,
    updateContent,
    exportArticle,
    updateAPIConfig,
    setAppState
  };
};