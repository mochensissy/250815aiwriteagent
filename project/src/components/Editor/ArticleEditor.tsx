/**
 * 文章编辑器组件
 * 
 * 主要的文章编辑界面，支持富文本编辑、划词建议、对话式修改
 * 集成了智能编辑工具栏和实时预览功能
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Image, Download, Wand2, MoreHorizontal, Copy, Eye, Edit3, Send, X, Sparkles, Type, Scissors, Volume2, BookOpen, Zap } from 'lucide-react';
import { EditSuggestion } from '../../types';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { copyToClipboard, downloadTextFile } from '../../utils/userExperience';

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  onEditInstruction: (instruction: string, selectedText?: string) => void;
  onGenerateImages: () => void;
  onGenerateCover: () => void;
  onExport: () => void;
  isProcessing: boolean;
  images?: Array<{ id: string; url: string; prompt: string; position?: number }>; // 新增：可用的图片列表
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({
  content,
  onChange,
  onEditInstruction,
  onGenerateImages,
  onGenerateCover,
  onExport,
  isProcessing,
  images = []
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'system'; message: string }>>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'split'>('edit');
  const [showImagePicker, setShowImagePicker] = useState(false);
  
  // 字数统计函数
  const getWordCount = (text: string): { characters: number; charactersNoSpaces: number; words: number } => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { characters, charactersNoSpaces, words };
  };
  
  const wordStats = getWordCount(content);
  
  // 通用关键词提取系统
  const extractKeywords = (imageDescription: string): string[] => {
    const keywords: string[] = [];
    const cleanText = imageDescription.toLowerCase().replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, '');
    
    // 使用正则提取所有有意义的中文词汇
    const chineseWords = cleanText.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
    
    // 过滤停用词和无意义词汇
    const stopWords = new Set([
      '的', '了', '在', '和', '是', '有', '就', '都', '会', '说', '到', '还', '也', '可以', 
      '这个', '那个', '什么', '怎么', '为什么', '如果', '因为', '所以', '但是', '然后',
      '非常', '很多', '一些', '一个', '这样', '那样', '现在', '当时', '后来', '开始',
      '结束', '已经', '正在', '应该', '可能', '或者', '而且', '不过', '只是', '真的'
    ]);
    
    // 筛选有效关键词
    chineseWords.forEach(word => {
      if (word.length >= 2 && 
          word.length <= 6 && 
          !stopWords.has(word) &&
          keywords.length < 10) {
        keywords.push(word);
      }
    });
    
    // 提取英文关键词（如有）
    const englishWords = imageDescription.match(/[a-zA-Z]{3,}/g) || [];
    englishWords.forEach(word => {
      if (word.length >= 3 && keywords.length < 15) {
        keywords.push(word.toLowerCase());
      }
    });
    
    console.log(`🔍 从图片描述"${imageDescription.substring(0, 50)}..."中提取关键词:`, [...new Set(keywords)]);
    
    return [...new Set(keywords)];
  };
  
  // 通用相关性计算算法
  const calculateRelevance = (paragraph: string, imageKeywords: string[]): number => {
    if (imageKeywords.length === 0) return 0;
    
    const paragraphLower = paragraph.toLowerCase();
    let matchCount = 0;
    let totalMatches = 0;
    
    // 统计匹配的关键词数量
    imageKeywords.forEach(keyword => {
      if (paragraphLower.includes(keyword.toLowerCase())) {
        matchCount++;
        // 计算关键词在段落中出现的次数
        const regex = new RegExp(keyword.toLowerCase(), 'g');
        const occurrences = (paragraphLower.match(regex) || []).length;
        totalMatches += occurrences;
      }
    });
    
    // 基础相关性得分 (0-1)
    const basicRelevance = imageKeywords.length > 0 ? matchCount / imageKeywords.length : 0;
    
    // 匹配密度加分
    const densityBonus = totalMatches > matchCount ? 0.1 : 0;
    
    // 段落长度评分（适中长度更适合插图）
    const length = paragraph.length;
    let lengthScore = 0;
    if (length >= 60 && length <= 200) {
      lengthScore = 0.2; // 最佳长度
    } else if (length >= 200 && length <= 350) {
      lengthScore = 0.15; // 良好长度
    } else if (length >= 350 && length <= 500) {
      lengthScore = 0.1; // 可接受长度
    } else if (length < 60) {
      lengthScore = 0.05; // 太短
    }
    
    // 位置评分（避免在文章最开头插入）
    let positionScore = 0;
    const articleStart = content.substring(0, 150);
    if (!articleStart.includes(paragraph.substring(0, 30))) {
      positionScore = 0.1;
    }
    
    const finalScore = basicRelevance + densityBonus + lengthScore + positionScore;
    
    console.log(`📊 段落相关性评分:`, {
      paragraph: paragraph.substring(0, 30) + '...',
      matchCount,
      basicRelevance: basicRelevance.toFixed(2),
      lengthScore: lengthScore.toFixed(2),
      positionScore: positionScore.toFixed(2),
      finalScore: finalScore.toFixed(2)
    });
    
    return finalScore;
  };
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // 分布式图片插入系统
  const insertImage = (imageUrl: string, altText: string) => {
    console.log('🖼️ 开始插入图片:', { imageUrl, altText });
    
    if (!onChange) {
      console.error('❌ onChange 函数不存在');
      toast.error('编辑器初始化失败');
      return;
    }
    
    // 智能插入图片到合适位置
    const imageMarkdown = `\n\n![${altText}](${imageUrl})\n\n`;
    
    // 获取当前内容并检查已有图片
    const currentContent = content;
    const existingImages = (currentContent.match(/!\[.*?\]\(.*?\)/g) || []).length;
    console.log(`📊 当前已有图片数量: ${existingImages}`);
    
    // 分析文章结构，分段处理
    const paragraphs = currentContent.split('\n\n').filter(p => p.trim().length > 20);
    let insertPosition = currentContent.length; // 默认插入到末尾
    
    if (paragraphs.length > 2) {
      // 根据已有图片数量，选择不同的插入策略
      const strategy = existingImages % 3;
      
      switch (strategy) {
        case 0: // 第一张图片：插入到前1/3位置
          const firstThird = Math.floor(paragraphs.length / 3);
          const targetIndex1 = Math.max(1, firstThird); // 至少跳过第一段
          const targetParagraphs1 = paragraphs.slice(0, targetIndex1 + 1);
          const targetText1 = targetParagraphs1.join('\n\n');
          insertPosition = currentContent.indexOf(targetText1) + targetText1.length;
          console.log(`📍 策略0: 插入到前1/3位置 (段落${targetIndex1 + 1}后)`);
          break;
          
        case 1: // 第二张图片：插入到中间1/3位置
          const middleThird = Math.floor(paragraphs.length * 2 / 3);
          const targetIndex2 = Math.min(middleThird, paragraphs.length - 2);
          const targetParagraphs2 = paragraphs.slice(0, targetIndex2 + 1);
          const targetText2 = targetParagraphs2.join('\n\n');
          insertPosition = currentContent.indexOf(targetText2) + targetText2.length;
          console.log(`📍 策略1: 插入到中间1/3位置 (段落${targetIndex2 + 1}后)`);
          break;
          
        case 2: // 第三张图片：插入到后1/3位置
          const lastThird = Math.floor(paragraphs.length * 5 / 6);
          const targetIndex3 = Math.min(lastThird, paragraphs.length - 1);
          const targetParagraphs3 = paragraphs.slice(0, targetIndex3 + 1);
          const targetText3 = targetParagraphs3.join('\n\n');
          insertPosition = currentContent.indexOf(targetText3) + targetText3.length;
          console.log(`📍 策略2: 插入到后1/3位置 (段落${targetIndex3 + 1}后)`);
          break;
      }
      
      // 二次优化：检查关键词相关性
      const imageKeywords = extractKeywords(altText);
      if (imageKeywords.length > 0) {
        // 在选定区域附近寻找更相关的段落
        const searchStart = Math.max(0, Math.floor(insertPosition / currentContent.length * paragraphs.length) - 1);
        const searchEnd = Math.min(paragraphs.length, searchStart + 3);
        
        let bestMatch = 0;
        let bestLocalPosition = insertPosition;
        
        for (let i = searchStart; i < searchEnd; i++) {
          const paragraph = paragraphs[i];
          const relevance = calculateRelevance(paragraph, imageKeywords);
          
          if (relevance > bestMatch && relevance > 0.15) {
            bestMatch = relevance;
            const beforeParagraphs = paragraphs.slice(0, i + 1);
            const beforeText = beforeParagraphs.join('\n\n');
            bestLocalPosition = currentContent.indexOf(beforeText) + beforeText.length;
            console.log(`🎯 在附近找到更相关位置，相关性: ${relevance}`);
          }
        }
        
        if (bestMatch > 0.15) {
          insertPosition = bestLocalPosition;
        }
      }
    } else {
      // 文章段落较少，简单分布
      if (existingImages === 0 && paragraphs.length > 1) {
        // 第一张图插入到第二段后
        const firstParagraph = paragraphs[1];
        const firstPosition = currentContent.indexOf(firstParagraph) + firstParagraph.length;
        insertPosition = firstPosition;
        console.log('📍 短文章策略: 插入到第二段后');
      }
    }
    
    // 插入图片
    const newContent = currentContent.slice(0, insertPosition) + imageMarkdown + currentContent.slice(insertPosition);
    
    console.log('📝 插入详情:', {
      '插入前长度': currentContent.length,
      '插入后长度': newContent.length,
      '插入位置': insertPosition,
      '已有图片数': existingImages
    });
    
    try {
      onChange(newContent);
      setShowImagePicker(false);
      toast.success(`图片已分布式插入 (第${existingImages + 1}张)`);
      
      // 如果 textarea 存在，尝试聚焦
      if (textareaRef.current) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const textLength = newContent.length;
            textareaRef.current.setSelectionRange(textLength, textLength);
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ 插入图片时出错:', error);
      toast.error('插入图片失败');
    }
  };

  // 改进的导出功能
  const handleExport = () => {
    if (!content.trim()) {
      toast.error('文章内容为空，无法导出');
      return;
    }

    // 复制到剪贴板
    copyToClipboard(content, '文章已复制到剪贴板');
  };

  // 下载为Markdown文件
  const handleDownloadMarkdown = () => {
    if (!content.trim()) {
      toast.error('文章内容为空，无法下载');
      return;
    }

    const filename = `article_${new Date().toISOString().slice(0, 10)}.md`;
    downloadTextFile(content, filename, 'text/markdown');
  };

  const editSuggestions: EditSuggestion[] = [
    { type: 'polish', label: '润色', icon: '✨', description: '优化语言表达，让文字更优美' },
    { type: 'expand', label: '扩写', icon: '📝', description: '增加内容细节，丰富表达' },
    { type: 'shorten', label: '缩写', icon: '✂️', description: '精简内容，突出重点' },
    { type: 'tone', label: '改语气', icon: '🎭', description: '调整文章语气和风格' },
    { type: 'professional', label: '专业化', icon: '💼', description: '让表达更专业正式' },
    { type: 'casual', label: '口语化', icon: '💬', description: '让表达更轻松自然' },
  ];

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 延迟执行，确保选择状态已更新
    setTimeout(() => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end && end - start > 1) {
        const selected = content.substring(start, end).trim();
        if (selected.length > 0) {
          setSelectedText(selected);
          
          // 计算工具栏位置 - 相对于视口
          const rect = textarea.getBoundingClientRect();
          
          // 简化位置计算
          const x = Math.min(rect.right - 300, Math.max(rect.left, rect.left + 20));
          const y = rect.top - 60; // 工具栏显示在选中文本上方
          
          setSelectionPosition({ x, y });
          setShowSuggestions(true);
        }
      } else {
        setShowSuggestions(false);
        setSelectedText('');
        setSelectionPosition(null);
      }
    }, 10);
  }, [content]);

  // 处理编辑建议
  const handleSuggestion = useCallback(async (suggestion: EditSuggestion) => {
    if (!selectedText) return;
    
    let instruction = '';
    switch (suggestion.type) {
      case 'polish':
        instruction = `请润色以下文字，让它更加生动和吸引人："${selectedText}"`;
        break;
      case 'expand':
        instruction = `请扩展以下内容，增加更多细节和论证："${selectedText}"`;
        break;
      case 'shorten':
        instruction = `请精简以下文字，保留核心观点："${selectedText}"`;
        break;
      case 'tone':
        instruction = `请调整以下文字的语气，让它更适合目标读者："${selectedText}"`;
        break;
      case 'professional':
        instruction = `请将以下文字改写得更专业正式："${selectedText}"`;
        break;
      case 'casual':
        instruction = `请将以下文字改写得更轻松口语化："${selectedText}"`;
        break;
      default:
        instruction = `请优化以下文字："${selectedText}"`;
    }
    
    await onEditInstruction(instruction, selectedText);
    
    // 隐藏建议栏
    setShowSuggestions(false);
    setSelectedText('');
    setSelectionPosition(null);
    
    toast.success(`正在${suggestion.label}选中文本...`);
  }, [selectedText, onEditInstruction]);

  // 处理对话指令
  const handleChatSubmit = async () => {
    if (!chatMessage.trim()) return;

    setChatHistory(prev => [...prev, { type: 'user', message: chatMessage }]);
    
    try {
      await onEditInstruction(chatMessage);
      setChatHistory(prev => [...prev, { type: 'system', message: '已根据您的指令进行修改' }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { type: 'system', message: '修改失败，请重试' }]);
    }
    
    setChatMessage('');
  };

  // 关闭建议框
  const closeSuggestions = () => {
    setShowSuggestions(false);
    setSelectedText('');
    setSelectionPosition(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions && selectionPosition) {
        closeSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions, selectionPosition]);

  // 微信公众号样式的预览CSS
  const wechatPreviewStyles = `
    .wechat-preview {
      max-width: 677px;
      margin: 0 auto;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
      font-size: 17px;
      line-height: 1.6;
      color: #3e3e3e;
      word-wrap: break-word;
      padding: 20px;
    }
    .wechat-preview h1 {
      font-size: 24px;
      font-weight: bold;
      color: #2c2c2c;
      margin: 20px 0 15px 0;
      line-height: 1.4;
    }
    .wechat-preview h2 {
      font-size: 20px;
      font-weight: bold;
      color: #2c2c2c;
      margin: 18px 0 12px 0;
      line-height: 1.4;
    }
    .wechat-preview h3 {
      font-size: 18px;
      font-weight: bold;
      color: #2c2c2c;
      margin: 16px 0 10px 0;
      line-height: 1.4;
    }
    .wechat-preview p {
      margin: 10px 0;
      line-height: 1.8;
    }
    .wechat-preview strong {
      font-weight: bold;
      color: #2c2c2c;
    }
    .wechat-preview em {
      font-style: italic;
    }
    .wechat-preview blockquote {
      border-left: 4px solid #d0d7de;
      padding-left: 16px;
      margin: 16px 0;
      color: #656d76;
    }
    .wechat-preview ul, .wechat-preview ol {
      padding-left: 20px;
      margin: 10px 0;
    }
    .wechat-preview li {
      margin: 5px 0;
      line-height: 1.8;
    }
    .wechat-preview code {
      background: #f6f8fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 14px;
    }
    .wechat-preview pre {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 16px 0;
    }
    .wechat-preview img {
      max-width: 100%;
      height: auto;
      margin: 16px 0;
      border-radius: 4px;
    }
  `;

  return (
    <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden relative">
      {/* 添加微信预览样式 */}
      <style>{wechatPreviewStyles}</style>
      
      {/* 顶部工具栏 */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-4 py-2 text-sm rounded-l-lg transition-colors flex items-center gap-2 ${
                  viewMode === 'edit' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-4 py-2 text-sm rounded-r-lg transition-colors flex items-center gap-2 ${
                  viewMode === 'split' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-4 h-4" />
                分屏预览
              </button>
            </div>
          </div>

          {/* 字数统计 */}
          <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
            <span className="flex items-center gap-1">
              <Type className="w-4 h-4" />
              <span className="font-medium text-gray-700">{wordStats.charactersNoSpaces}</span>字
            </span>
            <span className="text-gray-300">|</span>
            <span><span className="font-medium text-gray-700">{wordStats.words}</span>词</span>
            <span className="text-gray-300">|</span>
            <span><span className="font-medium text-gray-700">{wordStats.characters}</span>字符</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition-colors ${
                showChat 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="对话式编辑"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onGenerateImages}
              disabled={isProcessing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="智能配图"
            >
              <Image className="w-4 h-4" />
            </button>
            {images && images.length > 0 && (
              <button
                onClick={() => setShowImagePicker(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="插入图片"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onGenerateCover}
              disabled={isProcessing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="生成封面"
            >
              <Wand2 className="w-4 h-4" />
            </button>
            <div className="relative group">
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="导出文章"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              {/* 导出选项下拉菜单 */}
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-32">
                <button
                  onClick={handleExport}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                >
                  <Copy className="w-3 h-3" />
                  复制文本
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  下载MD
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* 主编辑区域 */}
        <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} relative`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onSelect={handleTextSelection}
            className="w-full h-full p-6 text-gray-800 resize-none focus:outline-none text-base leading-relaxed border-r border-gray-200"
            placeholder="开始书写您的文章内容..."
            style={{ minHeight: '600px' }}
          />

          {/* 划词建议工具栏 */}
          {showSuggestions && selectionPosition && (
            <div
              className="fixed bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 backdrop-blur-sm"
              style={{
                left: selectionPosition.x,
                top: selectionPosition.y,
                maxWidth: '320px'
              }}
            >
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    已选择 {selectedText.length} 个字符
                  </span>
                  <button
                    onClick={() => {
                      setShowSuggestions(false);
                      setSelectedText('');
                      setSelectionPosition(null);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs text-gray-400 truncate bg-gray-50 px-2 py-1 rounded">
                  "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {editSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.type}
                    onClick={() => handleSuggestion(suggestion)}
                    className="group p-2 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 rounded-lg text-sm transition-all duration-200 text-left"
                    title={suggestion.description}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base group-hover:scale-110 transition-transform">
                        {suggestion.icon}
                      </span>
                      <span className="font-medium text-gray-700 group-hover:text-blue-600">
                        {suggestion.label}
                      </span>
                    </div>
                    {suggestion.description && (
                      <div className="text-xs text-gray-500 group-hover:text-blue-500">
                        {suggestion.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowChat(true);
                    setShowSuggestions(false);
                  }}
                  className="w-full p-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-200 rounded-lg text-sm text-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  自定义指令
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 分屏预览区域 */}
        {viewMode === 'split' && (
          <div className="w-1/2 bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm min-h-full border border-gray-200">
                <div className="wechat-preview">
                  <ReactMarkdown 
                    components={{
                      h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{children}</h1>,
                      h2: ({children}) => <h2 className="text-xl font-bold text-gray-800 mb-3 mt-6 leading-tight">{children}</h2>,
                      h3: ({children}) => <h3 className="text-lg font-bold text-gray-800 mb-2 mt-5 leading-tight">{children}</h3>,
                      p: ({children}) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                      strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                      em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                      ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-700 space-y-1">{children}</ol>,
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 text-gray-700 italic">
                          {children}
                        </blockquote>
                      ),
                      code: ({children}) => (
                        <code className="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({children}) => (
                        <pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto text-sm">
                          {children}
                        </pre>
                      )
                    }}
                  >
                    {content || '# 文章标题\n\n开始编辑您的文章内容，右侧将实时显示微信公众号样式的预览效果。\n\n## 二级标题\n\n这里是正文内容，支持**粗体**、*斜体*等格式。\n\n> 这是一个引用块\n\n- 列表项1\n- 列表项2\n- 列表项3'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 对话编辑面板 */}
        {showChat && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-800">对话式编辑</h4>
              <p className="text-sm text-gray-600 mt-1">用自然语言描述您想要的修改</p>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white ml-4'
                        : 'bg-gray-200 text-gray-800 mr-4'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="例：把引言改得更简洁..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={!chatMessage.trim() || isProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 图片选择器模态框 */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">选择图片插入</h3>
              <button
                onClick={() => setShowImagePicker(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {!images || images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>还没有生成图片</p>
                <p className="text-sm">请先生成配图</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image) => (
                  <div key={image.id} className="relative group cursor-pointer">
                    <img
                      src={image.url}
                      alt={`配图 ${image.id}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-transparent hover:border-blue-500 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🖱️ 点击了图片:', image.id, image.url);
                        insertImage(image.url, image.prompt || '配图');
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded truncate">
                        {image.prompt || '配图'}
                      </div>
                    </div>
                    {/* 测试按钮 */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔘 点击了按钮:', image.id);
                        insertImage(image.url, image.prompt || '配图');
                      }}
                      className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                    >
                      插入
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              {/* 调试测试按钮 */}
              <button
                onClick={() => {
                  console.log('🧪 测试插入功能');
                  insertImage('https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=测试图片', '测试图片');
                }}
                className="w-full py-2 px-4 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-sm"
              >
                🧪 测试插入（调试用）
              </button>
              
              <button
                onClick={() => setShowImagePicker(false)}
                className="w-full py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;