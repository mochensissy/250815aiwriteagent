/**
 * 应用状态管理Hook
 * 
 * 管理整个应用的状态，包括知识库、当前文章、风格设置等
 * 提供统一的状态更新接口和数据持久化
 */

import { useState, useEffect } from 'react';
import { AppState, KnowledgeBaseArticle, OutlineNode, GeneratedImage, CoverOption, StylePrototype, APIConfig } from '../types';
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
  callOpenRouterAPI,
  generateArticleTitles
} from '../utils/api';
import toast from 'react-hot-toast';

export const useAppState = () => {
  // 直接从localStorage初始化状态，避免竞态条件
  const [appState, setAppState] = useState<AppState>(() => {
    console.log('🚀 初始化应用状态（useState回调）...');
    const knowledgeBase = getKnowledgeBase();
    const apiConfig = getAPIConfig();
    
    console.log('📖 从localStorage初始化的数据:', {
      知识库文章数: knowledgeBase.length,
      知识库详情: knowledgeBase.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        风格要素数量: a.styleElements?.length || 0,
        已确认要素: a.styleElements?.filter(e => e.confirmed).length || 0
      })),
      API配置: apiConfig ? '已配置' : '未配置'
    });
    
    return {
      knowledgeBase,
      termMappings: [],
      writingRules: [],
      apiConfig
    };
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [stylePrototypes, setStylePrototypes] = useState<StylePrototype[]>([]);

  // 初始化当前文章数据
  useEffect(() => {
    console.log('🔄 加载当前文章数据...');
    const currentArticle = getCurrentArticle();
    
    if (currentArticle) {
      console.log('📝 找到保存的当前文章:', currentArticle.title);
      setAppState(prev => ({
        ...prev,
        currentArticle
      }));
    }
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
                toast.success(`已分析出 ${styleElements.length} 个风格要素，请到"风格设置"页面确认`);
                
                
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
              // 给用户友好的提示
              toast.error('风格分析失败，请检查API配置。您仍可以手动添加风格要素。');
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

  // 创建测试案例数据（仅用于测试）
  const createTestCaseData = () => {
    const testCases = [
      {
        id: 'test_case_1',
        title: '深度思考：为什么你总是很忙却没有成果？',
        content: '每天忙忙碌碌，却发现一天结束后似乎什么都没做成。这种感觉你熟悉吗？\n\n我最近做了一个有趣的实验：记录自己一周的时间分配。结果让我震惊 - 真正用于重要工作的时间，不到20%。\n\n那么问题来了：剩下的80%时间去哪了？\n\n经过仔细分析，我发现了三个"时间黑洞"：\n\n**第一个黑洞：伪工作**\n看起来在工作，实际上在做无意义的事情。比如无目的地刷邮件、参加没有议程的会议、整理已经很整齐的文档。\n\n**第二个黑洞：切换成本**\n现代人最大的问题是注意力分散。每次任务切换，大脑需要重新聚焦，这个过程比你想象的要耗时。\n\n**第三个黑洞：完美主义陷阱**\n把80分的工作做到95分，往往需要3倍的时间。而这多出来的15分，很多时候对结果影响微乎其微。\n\n解决方案其实很简单：\n\n1. 每天开始前，列出3件最重要的事\n2. 用番茄工作法，25分钟专注做一件事\n3. 学会说"这样就够了"\n\n记住，忙碌不等于有效率。真正的高手，都是用最少的时间，做最重要的事。',
        category: 'case' as const,
        tags: ['效率', '时间管理', '深度思考'],
        createdAt: new Date().toISOString(),
        source: 'paste' as const
      },
      {
        id: 'test_case_2', 
        title: '我用3年时间验证了一个残酷真相：圈子决定命运',
        content: '三年前，我还是一个相信"努力就能改变命运"的人。\n\n直到我亲眼见证了两个同样优秀的朋友，走向了完全不同的人生轨迹。\n\n**故事的主角是小A和小B**\n\n两人都是985毕业，智商相当，工作能力不相上下。唯一的区别是：\n\n小A喜欢独来独往，认为朋友多了是负担\n小B热衷于各种聚会，总是在认识新朋友\n\n三年后的今天：\n\n小A还在原来的公司做着同样的工作，薪水涨了30%\n小B已经跳槽两次，现在的薪水是小A的3倍，还自己创业开了公司\n\n**这让我开始思考一个问题：到底是什么拉开了两个人的差距？**\n\n答案很残酷：圈子。\n\n小B通过不断社交，认识了：\n- 投资人（帮他拿到了创业资金）\n- 行业大佬（给了他很多商业建议）\n- 优秀同行（成为了合作伙伴）\n\n而小A，始终在一个人战斗。\n\n**我总结了3个关于圈子的残酷真相：**\n\n1. 信息差是最大的贫富差\n2. 人脉不是你认识多少人，而是多少人愿意帮你\n3. 圈子的质量，决定了你的上限\n\n如果你想改变现状，先从改变圈子开始。\n\n因为，和什么样的人在一起，你就会成为什么样的人。',
        category: 'case' as const,
        tags: ['人际关系', '社交', '成长'],
        createdAt: new Date().toISOString(),
        source: 'paste' as const
      }
    ];

    console.log('🧪 创建测试案例数据...');
    const updatedKnowledgeBase = [...appState.knowledgeBase, ...testCases];
    setAppState(prev => ({
      ...prev,
      knowledgeBase: updatedKnowledgeBase
    }));
    saveKnowledgeBase(updatedKnowledgeBase);
    
    console.log('✅ 测试数据添加完成:', {
      之前文章数: appState.knowledgeBase.length,
      新增文章数: testCases.length,
      现在总数: updatedKnowledgeBase.length,
      案例库数量: updatedKnowledgeBase.filter(a => a.category === 'case').length
    });
    
    toast.success('已添加测试案例数据，现在可以测试风格推荐功能了！');
  };

  // 获取风格原型推荐 (直接返回结果)
  const getStylePrototypesFromDraft = async (draft: string): Promise<StylePrototype[]> => {
    try {
      console.log('🎨 开始推荐风格原型...');
      console.log('📝 草稿内容预览:', draft.substring(0, 100) + '...');
      console.log('📊 当前知识库文章总数:', appState.knowledgeBase.length);
      
      const caseArticles = appState.knowledgeBase.filter(a => a.category === 'case');
      const memoryArticles = appState.knowledgeBase.filter(a => a.category === 'memory');
      
      console.log('📁 案例库文章数:', caseArticles.length);
      console.log('🧠 记忆库文章数:', memoryArticles.length);
      
      // 详细显示文章信息
      console.log('📁 案例库文章详情:', caseArticles.map(a => ({
        title: a.title,
        hasStyleElements: !!a.styleElements?.length,
        styleElementsCount: a.styleElements?.length || 0
      })));
      console.log('🧠 记忆库文章详情:', memoryArticles.map(a => ({
        title: a.title,
        hasStyleElements: !!a.styleElements?.length,
        styleElementsCount: a.styleElements?.length || 0
      })));
      
      // 如果案例库为空，使用记忆库文章作为推荐源
      const referenceArticles = caseArticles.length > 0 ? caseArticles : memoryArticles;
      
      if (referenceArticles.length === 0) {
        console.log('⚠️ 没有可用的参考文章，跳过风格推荐');
        return [];
      }
      
      console.log('🔍 使用', referenceArticles.length, '篇', caseArticles.length > 0 ? '案例库' : '记忆库', '文章进行推荐');
      
      // 检查参考文章是否有风格要素
      const articlesWithStyle = referenceArticles.filter(a => a.styleElements && a.styleElements.length > 0);
      console.log('🎨 有风格要素的参考文章:', articlesWithStyle.length);
      
      if (articlesWithStyle.length === 0) {
        console.log('⚠️ 参考文章都没有风格要素，无法进行智能推荐');
        return [];
      }
      
      console.log('🚀 调用recommendStylePrototypes API...');
      const prototypes = await recommendStylePrototypes(draft, referenceArticles);
      console.log('✅ 风格原型推荐完成:', prototypes.length);
      console.log('📊 推荐结果详情:', prototypes);
      
      if (prototypes.length > 0) {
        prototypes.forEach((p, i) => {
          console.log(`📖 推荐${i+1}: ${p.title} (相似度: ${p.similarity}%)`);
        });
      }
      
      return prototypes;
    } catch (error) {
      console.error('❌ 风格原型推荐失败:', error);
      return [];
    }
  };
  
  // 推荐风格原型 (兼容旧接口)
  const recommendStylePrototypesFromDraft = async (draft: string): Promise<StylePrototype[]> => {
    const prototypes = await getStylePrototypesFromDraft(draft);
    setStylePrototypes(prototypes);
    return prototypes;
  };

  // 用户确认风格后生成大纲
  const generateOutlineWithSelectedStyle = async (selectedPrototypes: StylePrototype[]) => {
    if (!appState.currentArticle) {
      console.error('❌ generateOutlineWithSelectedStyle - 当前没有文章');
      return;
    }
    
    try {
      console.log('🎨 useAppState - 使用选定的风格生成大纲...');
      console.log('📊 useAppState - 选定的原型数量:', selectedPrototypes.length);
      console.log('📝 useAppState - 当前文章草稿:', appState.currentArticle.draft.substring(0, 100) + '...');
      
      let styleContext = '';
      
      if (selectedPrototypes.length > 0) {
        // 获取选定文章的风格要素
        const selectedStyleElements = selectedPrototypes.flatMap(prototype => {
          const article = appState.knowledgeBase.find(a => a.id === prototype.articleId);
          console.log(`📖 处理文章: ${article?.title}, 风格要素数量: ${article?.styleElements?.length || 0}`);
          return article?.styleElements?.filter(e => e.confirmed).map(e => e.description) || [];
        });
        
        styleContext = selectedStyleElements.join('; ');
        console.log('🎨 选定的风格上下文:', styleContext);
        
        // 保存选中的原型到应用状态，供后续文章生成使用
        setAppState(prev => ({
          ...prev,
          selectedPrototypes: selectedPrototypes
        }));
      } else {
        // 如果没有选定原型，使用所有确认的风格要素
        const allStyleElements = appState.knowledgeBase
          .filter(a => a.category === 'memory')
          .flatMap(a => a.styleElements || [])
          .filter(e => e.confirmed)
          .map(e => e.description);
        
        styleContext = allStyleElements.join('; ');
        console.log('🎨 使用通用风格上下文:', styleContext);
      }
      
      // 使用新的大纲生成函数，传递选中的原型
      await generateOutlineFromDraft(
        appState.currentArticle.draft, 
        styleContext || '通用写作风格',
        selectedPrototypes
      );
      
    } catch (error) {
      console.error('大纲生成失败:', error);
      toast.error('大纲生成失败，请重试');
    }
  };

  // 开始新文章创作（仅创建基础状态，不生成大纲）
  const startNewArticle = async (draft: string, platform: string = '公众号') => {
    console.log('🚀 startNewArticle 函数被调用');
    console.log('📝 传入参数 - 草稿长度:', draft?.length || 0);
    console.log('🎯 传入参数 - 目标平台:', platform);
    
    try {
      console.log('✅ 创建基础文章状态');
      
      // 创建基础的文章状态，不包含大纲
      setAppState(prev => ({
        ...prev,
        currentArticle: {
          title: '新文章',
          draft,
          outline: [], // 空大纲，等待后续生成
          content: '',
          images: []
        }
      }));

      console.log('📋 基础文章状态已创建');
    } catch (error) {
      console.error('❌ 创建文章状态失败:', error);
      toast.error(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 生成大纲（独立函数）
  const generateOutlineFromDraft = async (
    draft: string, 
    styleContext?: string, 
    selectedPrototypes?: StylePrototype[]
  ) => {
    setIsProcessing(true);
    
    try {
      console.log('🤖 调用AI生成个性化大纲...');
      console.log('📝 传入草稿内容（前200字符）:', draft.substring(0, 200) + '...');
      console.log('🎨 传入风格上下文:', styleContext || '通用写作风格');
      console.log('🎯 选中的风格原型数量:', selectedPrototypes?.length || 0);
      
      const { generateOutline } = await import('../utils/api');
      const aiOutline = await generateOutline(
        draft, 
        styleContext || '通用写作风格',
        selectedPrototypes,
        appState.knowledgeBase
      );
      
      console.log('🔍 AI返回的原始结果:', aiOutline);
      
      // 如果AI生成失败，使用备用大纲
      let finalOutline: OutlineNode[];
      if (aiOutline && Array.isArray(aiOutline) && aiOutline.length > 0) {
        console.log('✅ AI大纲生成成功，节点数量:', aiOutline.length);
        finalOutline = aiOutline.map((node, index) => ({
          id: String(index + 1),
          title: node.title || `章节 ${index + 1}`,
          summary: node.summary || '内容概述待补充',
          level: node.level || 1,
          order: index
        }));
      } else {
        console.log('⚠️ AI大纲生成失败，使用备用大纲');
        finalOutline = [
          {
            id: '1',
            title: '引言：背景介绍',
            summary: '分享个人经历，引出核心话题',
            level: 1,
            order: 0
          },
          {
            id: '2', 
            title: '核心观点阐述',
            summary: '详细阐述草稿中的主要观点',
            level: 1,
            order: 1
          },
          {
            id: '3',
            title: '具体案例分析',
            summary: '通过具体案例支撑观点',
            level: 1,
            order: 2
          },
          {
            id: '4',
            title: '总结与展望',
            summary: '总结全文，给出行动建议',
            level: 1,
            order: 3
          }
        ];
      }

      console.log('📋 最终大纲节点数量:', finalOutline.length);
      
      // 更新文章状态
      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          outline: finalOutline
        } : undefined
      }));

      toast.success('文章大纲已生成！');
      return finalOutline;
    } catch (error) {
      console.error('❌ 大纲生成失败:', error);
      toast.error(`大纲生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
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

      const result = await callOpenRouterAPI(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('标题生成失败:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成完整文章
  const generateArticle = async (selectedPrototypes?: StylePrototype[]) => {
    if (!appState.currentArticle) return;

    setIsProcessing(true);
    
    try {
      console.log('🚀 开始生成文章');
      console.log('📋 大纲节点数量:', appState.currentArticle.outline.length);
      console.log('📝 草稿长度:', appState.currentArticle.draft.length);
      console.log('🎯 选中的风格原型数量:', selectedPrototypes?.length || 0);
      
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
          styleContext || '通用写作风格',
          undefined, // externalInsights
          selectedPrototypes,
          appState.knowledgeBase
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

  // 生成多种风格的微信公众号封面
  const generateCover = async () => {
    if (!appState.currentArticle?.title || !appState.currentArticle?.isCompleted) {
      toast.error('请先确认文章已完成！');
      return;
    }

    setIsProcessing(true);
    
    try {
      // 使用AI分析完整文章内容
      const { analyzeContentWithAI } = await import('../utils/api');
      const contentAnalysis = await analyzeContentWithAI(appState.currentArticle.content);
      
      // 检查并优化标题
      const articleTitle = appState.currentArticle.title === '新文章' ? 
        (appState.currentArticle.content.split('\n')[0]?.replace(/^#+\s*/, '') || '文章标题') : 
        appState.currentArticle.title;
      
      // 定义4种封面风格
      const coverStyles = [
        {
          style: '简约商务',
          description: '清爽配色，突出标题和核心信息，适合商务和职场类内容',
          designElements: '简洁线条、现代字体、商务蓝或灰色调'
        },
        {
          style: '创意设计', 
          description: '丰富视觉元素，适合个人品牌和创意类内容',
          designElements: '渐变色彩、几何图形、动感构图'
        },
        {
          style: '专业学术',
          description: '严谨布局，适合知识分享和深度内容',
          designElements: '稳重配色、规整排版、学术氛围'
        },
        {
          style: '时尚生活',
          description: '温馨配色，适合生活类和情感类内容',
          designElements: '暖色调、柔和曲线、生活化元素'
        }
      ];

      // 生成多个封面选项
      const coverOptions = [];
      
      for (const styleInfo of coverStyles) {
        const prompt = `
作为专业的微信公众号封面设计师，请为以下文章生成${styleInfo.style}风格的封面图：

【文章信息】：
- 标题：${articleTitle}
- 主要主题：${contentAnalysis.mainTheme}
- 情感色调：${contentAnalysis.emotionalTone}
- 场景类型：${contentAnalysis.sceneType}
- 视觉关键词：${contentAnalysis.visualKeywords?.join(', ') || '专业、现代'}

【完整文章内容】：
${appState.currentArticle.content.substring(0, 1000)}...

【${styleInfo.style}风格设计要求】：

1. **风格特色**：
   - ${styleInfo.description}
   - 设计元素：${styleInfo.designElements}
   - 微信公众号16:9横版布局

2. **核心设计原则**：
   - 准确传达文章主题"${contentAnalysis.mainTheme}"
   - 体现${contentAnalysis.emotionalTone}的情感氛围
   - 标题"${articleTitle}"清晰可读，占据显著位置
   - 无任何水印或AI标识

3. **视觉构成**：
   - 主视觉：占据封面60%区域，体现文章核心内容
   - 标题区域：明显的文字区域，字体大小适中
   - 背景：与主题相关的${styleInfo.style}风格背景
   - 整体和谐统一，符合${styleInfo.style}审美

4. **技术要求**：
   - 1280x720像素，适合微信公众号展示
   - 高清无压缩，色彩饱和度适中
   - ${styleInfo.style}风格的色彩搭配和构图

请生成一个专业的${styleInfo.style}风格微信公众号封面。
`;

        try {
          const imageUrl = await generateImage(prompt);
          
          coverOptions.push({
            id: `cover_${styleInfo.style}_${Date.now()}`,
            style: styleInfo.style,
            url: imageUrl,
            prompt: prompt,
            description: styleInfo.description
          });
          
          // 给用户一些进度反馈
          toast.success(`${styleInfo.style}风格封面已生成`);
          
        } catch (error) {
          console.error(`${styleInfo.style}风格封面生成失败:`, error);
          // 继续生成其他风格，不中断整个流程
        }
      }

      if (coverOptions.length === 0) {
        throw new Error('所有风格的封面都生成失败');
      }

      // 保存封面选项到状态
      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          coverOptions
        } : undefined
      }));

      toast.success(`成功生成${coverOptions.length}种风格的封面选项！`);
      
    } catch (error) {
      console.error('封面生成失败:', error);
      toast.error('封面生成失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 重新生成图片
  const regenerateImage = async (imageId: string) => {
    if (!appState.currentArticle) return;

    setIsProcessing(true);
    
    try {
      const targetImage = imageId.startsWith('cover_') 
        ? appState.currentArticle.coverImage
        : appState.currentArticle.images.find(img => img.id === imageId);

      if (!targetImage) {
        toast.error('找不到目标图片');
        return;
      }

      console.log('🔄 重新生成图片:', targetImage.prompt);
      const newImageUrl = await generateImage(targetImage.prompt);
      
      if (imageId.startsWith('cover_')) {
        // 更新封面
        const newCoverImage: GeneratedImage = {
          ...targetImage,
          id: `cover_${Date.now()}`,
          url: newImageUrl
        };

        setAppState(prev => ({
          ...prev,
          currentArticle: prev.currentArticle ? {
            ...prev.currentArticle,
            coverImage: newCoverImage
          } : undefined
        }));

        toast.success('封面已重新生成！');
      } else {
        // 更新配图
        const updatedImages = appState.currentArticle.images.map(img =>
          img.id === imageId 
            ? { ...img, id: `img_${Date.now()}`, url: newImageUrl }
            : img
        );

        setAppState(prev => ({
          ...prev,
          currentArticle: prev.currentArticle ? {
            ...prev.currentArticle,
            images: updatedImages
          } : undefined
        }));

        toast.success('配图已重新生成！');
      }
    } catch (error) {
      console.error('图片重新生成失败:', error);
      toast.error('图片重新生成失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 删除图片
  const deleteImage = (imageId: string) => {
    if (!appState.currentArticle) return;

    if (imageId.startsWith('cover_')) {
      // 删除封面
      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          coverImage: undefined
        } : undefined
      }));
      toast.success('封面已删除');
    } else {
      // 删除配图
      const updatedImages = appState.currentArticle.images.filter(img => img.id !== imageId);
      
      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          images: updatedImages
        } : undefined
      }));
      toast.success('配图已删除');
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
    
    // 立即保存更新后的知识库，确保状态持久化
    console.log('💾 立即保存风格要素状态到localStorage...');
    // 立即保存更新后的状态
    console.log('✅ 风格要素状态已保存');
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

  // 监听知识库变化，自动保存
  useEffect(() => {
    console.log('📚 知识库状态变化，自动保存...');
    console.log('📊 当前知识库状态:', {
      文章数量: appState.knowledgeBase.length,
      文章详情: appState.knowledgeBase.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        风格要素数量: a.styleElements?.length || 0,
        已确认要素: a.styleElements?.filter(e => e.confirmed).length || 0
      }))
    });
    saveKnowledgeBase(appState.knowledgeBase);
    
    // 验证保存是否成功
    setTimeout(() => {
      const saved = getKnowledgeBase();
      console.log('✅ 保存验证 - localStorage中的数据:', {
        文章数量: saved.length,
        总风格要素: saved.reduce((sum, a) => sum + (a.styleElements?.length || 0), 0),
        已确认要素: saved.reduce((sum, a) => sum + (a.styleElements?.filter(e => e.confirmed).length || 0), 0)
      });
    }, 100);
  }, [appState.knowledgeBase]);

  // 生成文章标题选项
  const generateTitles = async () => {
    if (!appState.currentArticle) {
      toast.error('请先生成文章内容');
      return [];
    }
    
    setIsProcessing(true);
    
    try {
      console.log('📝 开始生成标题选项...');
      const titles = await generateArticleTitles(
        appState.currentArticle.content,
        appState.currentArticle.outline
      );
      
      console.log('✅ 标题生成成功:', titles);
      toast.success(`生成了${titles.length}个标题选项`);
      return titles;
      
    } catch (error) {
      console.error('❌ 标题生成失败:', error);
      toast.error('标题生成失败，请重试');
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  // 设置选中的标题并自动插入到文章开头
  const setSelectedTitle = (title: string) => {
    if (!appState.currentArticle) return;
    
    let updatedContent = appState.currentArticle.content;
    
    // 自动将标题插入到文章开头
    if (updatedContent) {
      // 检查文章开头是否已经有标题格式
      const lines = updatedContent.split('\n');
      const firstLine = lines[0];
      
      // 如果第一行是以 # 开头的标题，替换它
      if (firstLine.startsWith('#')) {
        lines[0] = `# ${title}`;
        updatedContent = lines.join('\n');
        console.log('📝 替换了现有标题');
      } 
      // 否则在文章开头插入新标题
      else {
        updatedContent = `# ${title}\n\n${updatedContent}`;
        console.log('📝 在文章开头插入新标题');
      }
    } else {
      // 如果文章内容为空，只设置标题
      updatedContent = `# ${title}\n\n`;
    }
    
    setAppState(prev => ({
      ...prev,
      currentArticle: prev.currentArticle ? {
        ...prev.currentArticle,
        title,
        content: updatedContent
      } : undefined
    }));
    
    toast.success(`标题已更新并插入到文章开头：${title}`);
  };

  // 确认文章完成
  const confirmArticleComplete = () => {
    if (!appState.currentArticle) return;

    setAppState(prev => ({
      ...prev,
      currentArticle: prev.currentArticle ? {
        ...prev.currentArticle,
        isCompleted: true
      } : undefined
    }));

    toast.success('文章已确认完成！现在可以生成封面了');
  };

  return {
    appState,
    isProcessing,
    stylePrototypes,
    addToKnowledgeBase,
    deleteArticle,
    updateStyleElement,
    recommendStylePrototypesFromDraft,
    generateOutlineWithSelectedStyle,
    generateOutlineFromDraft,
    createTestCaseData,
    startNewArticle,
    generateArticle,
    generateTitleOptions,
    handleEditInstruction,
    performExternalSearch,
    generateImages,
    generateCover,
    regenerateImage,
    deleteImage,
    updateOutline,
    updateContent,
    generateTitles,
    setSelectedTitle,
    confirmArticleComplete,
    exportArticle,
    updateAPIConfig,
    setAppState
  };
};