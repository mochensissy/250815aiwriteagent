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
    setAppState(prev => ({
      ...prev,
      knowledgeBase: [...prev.knowledgeBase, ...testCases]
    }));
    saveKnowledgeBase([...appState.knowledgeBase, ...testCases]);
    toast.success('已添加测试案例数据，现在可以测试风格推荐功能了！');
  };

  // 推荐风格原型
  const recommendStylePrototypesFromDraft = async (draft: string): Promise<void> => {
    try {
      console.log('🎨 开始推荐风格原型...');
      console.log('📊 当前知识库文章总数:', appState.knowledgeBase.length);
      
      const caseArticles = appState.knowledgeBase.filter(a => a.category === 'case');
      const memoryArticles = appState.knowledgeBase.filter(a => a.category === 'memory');
      
      console.log('📁 案例库文章数:', caseArticles.length);
      console.log('🧠 记忆库文章数:', memoryArticles.length);
      
      // 如果案例库为空，使用记忆库文章作为推荐源
      const referenceArticles = caseArticles.length > 0 ? caseArticles : memoryArticles;
      
      if (referenceArticles.length === 0) {
        console.log('⚠️ 没有可用的参考文章，跳过风格推荐');
        setStylePrototypes([]);
        return;
      }
      
      console.log('🔍 使用', referenceArticles.length, '篇', caseArticles.length > 0 ? '案例库' : '记忆库', '文章进行推荐');
      
      const prototypes = await recommendStylePrototypes(draft, referenceArticles);
      console.log('✅ 风格原型推荐完成:', prototypes.length);
      
      if (prototypes.length > 0) {
        prototypes.forEach((p, i) => {
          console.log(`📖 推荐${i+1}: ${p.title} (相似度: ${p.similarity}%)`);
        });
      }
      
      setStylePrototypes(prototypes);
    } catch (error) {
      console.error('❌ 风格原型推荐失败:', error);
      setStylePrototypes([]);
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
      
      // 等待风格推荐完成，然后检查结果
      // 注意：这里需要等待异步的风格推荐完成
      await new Promise(resolve => setTimeout(resolve, 1000)); // 给AI推荐一点时间
      
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
        
        toast.success('请选择参考的写作风格，然后生成大纲');
        return; // 不继续执行大纲生成
      }
      
      console.log('⚠️ 没有找到推荐的风格原型，继续使用通用风格生成大纲...');
      
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
    createTestCaseData,
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