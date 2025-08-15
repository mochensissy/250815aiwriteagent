/**
 * 应用状态管理Hook
 * 
 * 管理整个应用的状态，包括知识库、当前文章、风格设置等
 * 提供统一的状态更新接口和数据持久化
 */

import { useState, useEffect } from 'react';
import { AppState, KnowledgeBaseArticle, OutlineNode, GeneratedImage, StylePrototype } from '../types';
import { 
  getKnowledgeBase, 
  saveKnowledgeBase, 
  getCurrentArticle, 
  saveCurrentArticle 
} from '../utils/storage';
import { 
  analyzeStyleElements, 
  recommendStylePrototypes, 
  generateOutline, 
  generateFullArticle,
  processEditInstruction,
  callPerplexityAPI,
  generateImagePrompts,
  generateImage
} from '../utils/api';
import toast from 'react-hot-toast';

export const useAppState = () => {
  const [appState, setAppState] = useState<AppState>({
    knowledgeBase: [],
    styleElements: [],
    termMappings: [],
    writingRules: []
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [stylePrototypes, setStylePrototypes] = useState<StylePrototype[]>([]);

  // 初始化数据
  useEffect(() => {
    const knowledgeBase = getKnowledgeBase();
    const currentArticle = getCurrentArticle();
    
    setAppState(prev => ({
      ...prev,
      knowledgeBase,
      currentArticle: currentArticle || undefined
    }));
  }, []);

  // 添加文章到知识库
  const addToKnowledgeBase = async (
    content: string, 
    title: string, 
    category: 'memory' | 'case', 
    source: 'upload' | 'paste' | 'url',
    url?: string
  ) => {
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
    
    toast.success(`文章已添加到${category === 'memory' ? '记忆库' : '案例库'}`);
  };

  // 开始新文章创作
  const startNewArticle = async (draft: string, platform: string = '公众号') => {
    setIsProcessing(true);
    
    try {
      console.log('🚀 开始创作新文章');
      console.log('📝 草稿长度:', draft.length);
      console.log('🎯 目标平台:', platform);
      
      // 生成初始大纲
      const styleContext = appState.styleElements.map(e => e.description).join('; ');
      console.log('🎨 风格上下文:', styleContext || '无风格上下文');
      
      // 生成基础大纲结构
      const basicOutline: OutlineNode[] = [
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

      console.log('📋 生成基础大纲节点数量:', basicOutline.length);
      setAppState(prev => ({
        ...prev,
        currentArticle: {
          title: '新文章',
          draft,
          outline: basicOutline,
          content: '',
          images: []
        }
      }));

      toast.success('文章大纲已生成！');
    } catch (error) {
      console.error('创作启动失败:', error);
      toast.error('创作启动失败，请重试');
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
      
      const styleContext = appState.styleElements.map(e => e.description).join('; ');
      console.log('🎨 风格上下文:', styleContext || '无风格上下文');
      
      const fullContent = await generateFullArticle(
        appState.currentArticle.outline,
        appState.currentArticle.draft,
        styleContext
      );

      console.log('✅ 文章生成完成，长度:', fullContent.length);

      setAppState(prev => ({
        ...prev,
        currentArticle: prev.currentArticle ? {
          ...prev.currentArticle,
          content: fullContent
        } : undefined
      }));

      toast.success('文章已生成！');
    } catch (error) {
      console.error('❌ 文章生成失败:', error);
      toast.error('文章生成失败，请重试');
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
    setAppState
  };
};