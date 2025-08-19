/**
 * 应用侧边栏组件
 * 
 * 提供知识库管理、风格设置等功能的导航入口
 * 包含文件上传、标签管理、风格要素展示等核心功能
 */

import React, { useState, useRef } from 'react';
import { FileText, Upload, Tags, Palette, Settings, BookOpen, Brain, Link, X, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { KnowledgeBaseArticle, StyleElement } from '../../types';
import { parseFile, fetchWebContent, isSupportedFileType, formatFileSize, estimateReadingTime } from '../../utils/fileParser';
import toast from 'react-hot-toast';

interface SidebarProps {
  articles: KnowledgeBaseArticle[];
  onUpload: (content: string, title: string, category: 'memory' | 'case', source: 'upload' | 'paste' | 'url') => Promise<void>;
  onArticleSelect: (article: KnowledgeBaseArticle) => void;
  onDeleteArticle: (articleId: string) => Promise<void>;
  onStyleElementUpdate: (elementId: string, confirmed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ articles, onUpload, onArticleSelect, onDeleteArticle, onStyleElementUpdate }) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'case' | 'style'>('memory');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadContent, setUploadContent] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [extractedTitle, setExtractedTitle] = useState(''); // 存储从文件/URL中提取的标题
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedArticle, setUploadedArticle] = useState<{title: string, category: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件读取
  const handleFileRead = async (file: File) => {
    // 检查文件大小限制（50MB）
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('文件过大，请选择小于50MB的文件');
      return;
    }

    // 检查文件类型是否支持
    if (!isSupportedFileType(file)) {
      toast.error('不支持的文件格式。支持的格式：PDF、Word、Markdown、TXT');
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.loading('正在解析文件...', { id: 'file-parsing' });
      
      const result = await parseFile(file);
      
      // 检查解析结果
      if (!result.content || result.content.trim().length < 10) {
        throw new Error('文件内容为空或过短，请检查文件是否有效');
      }
      
      // 构建预览内容，包含元数据
      const metadata = result.metadata;
      let previewText = result.content;
      
      if (metadata) {
        const metadataText = [
          `📄 文件名: ${file.name}`,
          `📊 字数统计: ${metadata.wordCount || 0} 字`,
          `📏 文件大小: ${formatFileSize(metadata.fileSize || 0)}`,
          `⏱️ 预计阅读: ${estimateReadingTime(metadata.wordCount || 0)}`,
          metadata.pageCount ? `📖 页数: ${metadata.pageCount} 页` : '',
          metadata.lastModified ? `📅 修改时间: ${metadata.lastModified.toLocaleString()}` : '',
          '---'
        ].filter(Boolean).join('\n');
        
        previewText = `${metadataText}\n\n${result.content}`;
      }
      
      setUploadContent(result.content);
      setPreviewContent(previewText);
      setExtractedTitle(result.title || ''); // 保存提取的标题
      
      console.log('文件解析完成:', {
        title: result.title,
        contentLength: result.content.length,
        previewLength: previewText.length,
        hasContent: !!previewText.trim()
      });
      
      toast.success(`文件解析成功！提取了 ${metadata?.wordCount || 0} 字内容`, { id: 'file-parsing' });
    } catch (error) {
      console.error('文件读取失败:', error);
      const errorMessage = error instanceof Error ? error.message : '文件读取失败，请检查文件格式';
      toast.error(errorMessage, { id: 'file-parsing' });
      
      // 清理状态
      setUploadContent('');
      setPreviewContent('');
      setExtractedTitle('');
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  // 处理URL获取
  const handleUrlFetch = async () => {
    if (!uploadUrl.trim()) return;
    
    // 基本URL格式验证
    try {
      new URL(uploadUrl);
    } catch {
      toast.error('请输入有效的URL地址');
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await fetchWebContent(uploadUrl);
      
      // 构建预览内容，包含元数据
      const metadata = result.metadata;
      let previewText = result.content;
      
      if (metadata) {
        const metadataText = [
          `🌐 来源: ${uploadUrl}`,
          `📊 字数统计: ${metadata.wordCount || 0} 字`,
          `⏱️ 预计阅读: ${estimateReadingTime(metadata.wordCount || 0)}`,
          `📅 获取时间: ${new Date().toLocaleString()}`,
          '---'
        ].join('\n');
        
        previewText = `${metadataText}\n\n${result.content}`;
      }
      
      setUploadContent(result.content);
      setPreviewContent(previewText);
      setExtractedTitle(result.title || ''); // 保存提取的标题
      
      console.log('URL解析完成:', {
        title: result.title,
        contentLength: result.content.length,
        url: uploadUrl
      });
      
      toast.success(`网页内容获取成功！提取了 ${metadata?.wordCount || 0} 字内容`);
    } catch (error) {
      console.error('URL获取失败:', error);
      const errorMessage = error instanceof Error ? error.message : 'URL获取失败，请检查网址是否正确';
      
      // 为微信公众号链接提供特殊处理
      if (uploadUrl.includes('mp.weixin.qq.com')) {
        // 显示更详细的错误信息，包含操作指引
        toast.error(
          errorMessage.length > 200 ? errorMessage : 
          '微信公众号链接解析失败。建议：1. 复制文章内容直接粘贴 2. 保存为PDF后上传',
          { 
            duration: 8000,
            style: {
              maxWidth: '500px',
              fontSize: '14px'
            }
          }
        );
        
        // 自动切换到内容预览标签，方便用户粘贴
        setActiveTab('memory');
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理内容粘贴
  const handleContentPaste = (content: string) => {
    setUploadContent(content);
    setPreviewContent(content);
    setExtractedTitle(''); // 粘贴内容时清空提取的标题，使用智能生成
    
    // 如果内容不为空，短暂延迟后滚动到底部显示确认按钮
    if (content.trim()) {
      setTimeout(() => {
        const modal = document.querySelector('.upload-modal');
        if (modal) {
          modal.scrollTop = modal.scrollHeight;
        }
      }, 100);
    }
  };

  // 提交上传
  const handleSubmitUpload = async () => {
    if (!uploadContent.trim()) {
      toast.error('请添加内容后再提交');
      return;
    }
    
    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      // 优先使用提取的标题，否则智能生成标题
      let autoTitle = extractedTitle || '未命名文章';
      
      // 如果没有提取的标题，尝试从内容中生成
      if (!extractedTitle) {
        const lines = uploadContent.split('\n').filter(line => line.trim());
        
        // 尝试从内容中提取标题
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.length > 5 && trimmedLine.length <= 100) {
            // 去除markdown标记
            autoTitle = trimmedLine
              .replace(/^#+\s*/, '') // 去除markdown标题标记
              .replace(/[*_`]/g, '') // 去除markdown格式标记
              .replace(/^[0-9]+\.\s*/, '') // 去除数字列表标记
              .trim();
            break;
          }
        }
      }
      
      // 如果标题太长，截断并添加省略号
      if (autoTitle.length > 50) {
        autoTitle = autoTitle.substring(0, 47) + '...';
      }
      
      const sourceType = uploadUrl ? 'url' : 'paste';
      
      // 等待上传完成
      await onUpload(uploadContent, autoTitle, activeTab as 'memory' | 'case', sourceType);
      
      // 如果是添加到记忆库，触发风格分析
      if (activeTab === 'memory') {
        console.log('🎨 添加到记忆库，开始风格分析...');
        try {
          const { analyzeStyleElements } = await import('../../utils/api');
          const styleElements = await analyzeStyleElements([uploadContent]);
          console.log('✅ 风格分析完成，提取到', styleElements.length, '个风格要素');
          
          if (styleElements.length > 0) {
            toast.success(`文章已添加！检测到 ${styleElements.length} 个个人风格特征`);
          } else {
            toast.success('文章已添加到记忆库！');
          }
        } catch (styleError) {
          console.error('风格分析失败:', styleError);
          toast.success('文章已添加！（风格分析正在后台进行）');
        }
      } else {
        toast.success(`成功添加到案例库！`);
      }
      
      // 设置成功状态
      setUploadSuccess(true);
      setUploadedArticle({
        title: autoTitle,
        category: activeTab === 'memory' ? '记忆库' : '案例库'
      });
      
      // 3秒后自动关闭并清理状态
      setTimeout(() => {
        setUploadContent('');
        setUploadUrl('');
        setPreviewContent('');
        setExtractedTitle('');
        setUploadSuccess(false);
        setUploadedArticle(null);
        setShowUpload(false);
      }, 3000);
      
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const memoryArticles = articles.filter(a => a.category === 'memory');
  const caseArticles = articles.filter(a => a.category === 'case');
  
  // 计算所有风格要素
  const allStyleElements = memoryArticles
    .flatMap(article => article.styleElements || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // 检查是否是最近添加的文章（5秒内）
  const isRecentlyAdded = (article: KnowledgeBaseArticle) => {
    const createdTime = new Date(article.createdAt).getTime();
    const now = Date.now();
    return now - createdTime < 5000; // 5秒内
  };

  // 定期更新以移除高亮效果
  React.useEffect(() => {
    const interval = setInterval(() => {
      // 强制重新渲染以更新高亮状态
      // 这里不需要显式的状态更新，组件会自动重新计算 isRecentlyAdded
    }, 1000);

    return () => clearInterval(interval);
  }, [articles]);

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          知识库管理
        </h1>
        <p className="text-gray-500 text-sm">构建个性化写作风格</p>
      </div>

      {/* 标签页切换 */}
      <div className="px-6 py-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('memory')}
            className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'memory' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Brain className="w-4 h-4 mr-2" />
            记忆库
          </button>
          <button
            onClick={() => setActiveTab('case')}
            className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'case' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            案例库
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'style' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Palette className="w-4 h-4 mr-2" />
            风格设置
          </button>
        </div>
      </div>

      {/* 说明文字 */}
      <div className="px-6 pb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800 leading-relaxed">
            {activeTab === 'memory' 
              ? '上传您的得意之作和具有明显个人特点的文章。AI将从中提炼您的个人写作风格，用于后续创作。'
              : activeTab === 'case'
              ? '上传您认为优秀的文章作为参考案例。AI将学习这些文章的写作技巧和风格特点，帮助您创作出更好的内容。'
              : '管理从您的个人作品中提取的风格要素。您可以确认有用的风格特征，删除不准确的内容，以优化AI的写作风格。'
            }
          </p>
        </div>
      </div>

      {/* 上传按钮 */}
      {(activeTab === 'memory' || activeTab === 'case') && (
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowUpload(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Upload className="w-4 h-4 mr-2" />
            添加文章
          </button>
        </div>
      )}

      {/* 上传模态框 */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="upload-modal bg-white rounded-2xl w-[900px] h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">
                添加到{activeTab === 'memory' ? '记忆库' : '案例库'}
              </h3>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* 上传成功确认页面 */}
              {uploadSuccess && uploadedArticle ? (
                <div className="w-full p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-green-50 to-blue-50">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">上传成功！</h3>
                    <p className="text-gray-600 text-lg">
                      文章已成功添加到您的{uploadedArticle.category}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 max-w-md w-full mb-8">
                    <div className="flex items-center mb-3">
                      <FileText className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-gray-700">文章标题</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {uploadedArticle.title}
                    </h4>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="flex items-center mr-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        已保存
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {uploadedArticle.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    页面将在几秒后自动关闭，或点击下方按钮手动关闭
                  </div>
                  
                  <button
                    onClick={() => {
                      setUploadContent('');
                      setUploadUrl('');
                      setPreviewContent('');
                      setExtractedTitle('');
                      setUploadSuccess(false);
                      setUploadedArticle(null);
                      setShowUpload(false);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    完成
                  </button>
                </div>
              ) : (
                <>
              {/* 左侧上传区域 */}
              <div className="w-1/2 p-6 border-r border-gray-100 flex flex-col">
                <div className="space-y-6 flex-1 overflow-y-auto">
                  {/* 文件上传 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      上传文件
                    </label>
                    <div 
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                        isDragging 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.pdf,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
                      <span className="text-sm text-gray-600 block">
                        {isDragging ? '松开鼠标上传文件' : '点击选择文件或拖拽到此处'}
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block">支持 TXT, MD, PDF, DOCX</span>
                    </div>
                  </div>

                  {/* URL输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      或输入网址
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={uploadUrl}
                          onChange={(e) => setUploadUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleUrlFetch}
                        disabled={!uploadUrl.trim() || isProcessing}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium"
                      >
                        {isProcessing ? '获取中...' : '获取'}
                      </button>
                    </div>
                    
                    {/* 微信公众号特别提示 */}
                    {uploadUrl.includes('mp.weixin.qq.com') && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <div className="text-amber-600 mt-0.5 text-sm">💡</div>
                          <div className="text-amber-700 text-sm">
                            <p className="font-medium mb-1">微信公众号文章提示：</p>
                            <p className="text-xs leading-relaxed">
                              由于访问限制，解析可能失败。建议手动复制文章内容到下方"直接粘贴内容"区域，或保存为PDF上传。
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 直接粘贴 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      直接粘贴内容
                    </label>
                    <textarea
                      value={uploadContent}
                      onChange={(e) => handleContentPaste(e.target.value)}
                      className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                      placeholder="粘贴文章内容..."
                    />
                  </div>

                  {/* 处理进度 */}
                  {isProcessing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                          <span className="text-sm text-blue-800 font-medium">
                            {uploadUrl ? '正在获取网页内容' : '正在解析文件内容'}
                          </span>
                        </div>
                        <span className="text-xs text-blue-600">处理中...</span>
                      </div>
                      
                      {/* 进度条 */}
                      <div className="mb-3">
                        <div className="bg-blue-200 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full animate-pulse transition-all duration-1000" 
                               style={{width: '75%'}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs text-blue-700 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                          文件读取完成
                        </div>
                        <div className="text-xs text-blue-700 flex items-center">
                          <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          {uploadUrl ? '分析网页结构中...' : '提取文本内容中...'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <div className="w-3 h-3 border border-gray-300 rounded-full mr-2"></div>
                          生成预览内容
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 成功提示 */}
                  {previewContent && !isProcessing && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">内容解析完成，可以在右侧预览</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧预览区域 */}
              <div className="w-1/2 p-6 bg-gray-50 flex flex-col">
                <div className="flex items-center mb-3">
                  <Eye className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">内容预览</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1 overflow-y-auto">
                  {previewContent ? (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                        {previewContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">上传或粘贴内容后将在此处预览</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
                </>
              )}
            </div>

            {/* 模态框底部 - 只在非成功状态下显示 */}
            {!uploadSuccess && (
            <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="text-sm text-gray-500">
                {previewContent.trim() ? (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>
                      内容预览: {previewContent.trim().split(/\s+/).length} 字 · 可以提交
                    </span>
                  </div>
                ) : (
                  <span>请先添加内容后提交</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setUploadContent('');
                    setUploadUrl('');
                    setPreviewContent('');
                  }}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitUpload}
                  disabled={!previewContent.trim() || isProcessing || isUploading}
                  className={`px-6 py-2.5 ${
                    previewContent.trim() && !isProcessing && !isUploading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg animate-pulse' 
                      : 'bg-gray-300 cursor-not-allowed text-gray-500'
                  } rounded-lg transition-all font-medium flex items-center gap-2`}
                  title={previewContent.trim() ? '' : '请先添加内容'}
                >
                  {isProcessing || isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isUploading ? '正在添加到库中...' : '添加中...'}
                    </>
                  ) : previewContent.trim() ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      确认添加到{activeTab === 'memory' ? '记忆库' : '案例库'}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      请先添加内容
                    </>
                  )}
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* 内容列表 */}
      <div className="px-6">
        {activeTab === 'memory' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">我的作品风格库</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{memoryArticles.length}</span>
            </div>
            <div className="space-y-3">
              {memoryArticles.map((article) => (
                <div
                  key={article.id}
                  className={`p-4 bg-white border rounded-xl transition-all duration-200 ${
                    isRecentlyAdded(article)
                      ? 'border-green-300 bg-green-50 shadow-md ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 
                      className="font-medium text-gray-900 line-clamp-1 flex-1 cursor-pointer hover:text-blue-600"
                      onClick={() => onArticleSelect(article)}
                    >
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {isRecentlyAdded(article) && (
                        <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">
                          新增
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('确定要删除这篇文章吗？删除后会重新分析风格要素。')) {
                            onDeleteArticle(article.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                        title="删除文章"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p 
                    className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed cursor-pointer"
                    onClick={() => onArticleSelect(article)}
                  >
                    {article.content.substring(0, 100)}...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {memoryArticles.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">还没有上传作品</p>
                  <p className="text-xs mt-1">上传您的得意之作来构建个人风格库</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'case' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">优秀案例库</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{caseArticles.length}</span>
            </div>
            <div className="space-y-3">
              {caseArticles.map((article) => (
                <div
                  key={article.id}
                  className={`p-4 bg-white border rounded-xl transition-all duration-200 ${
                    isRecentlyAdded(article)
                      ? 'border-green-300 bg-green-50 shadow-md ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 
                      className="font-medium text-gray-900 line-clamp-1 flex-1 cursor-pointer hover:text-purple-600"
                      onClick={() => onArticleSelect(article)}
                    >
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {isRecentlyAdded(article) && (
                        <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">
                          新增
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('确定要删除这篇案例文章吗？')) {
                            onDeleteArticle(article.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                        title="删除文章"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                    {article.content.substring(0, 100)}...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {caseArticles.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">还没有添加案例</p>
                  <p className="text-xs mt-1">添加优秀文章作为写作参考</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">写作风格设置</h3>
            
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold flex items-center text-blue-800">
                          <Brain className="w-4 h-4 mr-2" />
                          个人风格要素 ({allStyleElements.length})
                        </h4>
                        {allStyleElements.some(e => !e.confirmed) && (
                          <button
                            onClick={() => {
                              const unconfirmedElements = allStyleElements.filter(e => !e.confirmed);
                              unconfirmedElements.forEach(element => {
                                onStyleElementUpdate(element.id, true);
                              });
                              toast.success(`已确认 ${unconfirmedElements.length} 个风格要素`);
                            }}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors"
                          >
                            一键确认全部
                          </button>
                        )}
                      </div>
              
              {allStyleElements.length === 0 ? (
                <p className="text-blue-700 text-xs leading-relaxed">
                  上传更多作品到记忆库后，AI将分析并提炼您的个人写作风格特征
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allStyleElements.map((element) => (
                    <div key={element.id} className="flex items-start justify-between p-2 bg-white rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {element.description}
                        </p>
                        <div className="flex items-center mt-1 gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            element.confirmed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {element.confirmed ? '已确认' : '待确认'}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            来源: {memoryArticles.find(a => a.id === element.articleId)?.title?.substring(0, 10) || '未知'}...
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {!element.confirmed && (
                          <button
                            onClick={() => onStyleElementUpdate(element.id, true)}
                            className="text-xs text-green-600 hover:text-green-700 px-2 py-1 hover:bg-green-50 rounded"
                          >
                            确认
                          </button>
                        )}
                        <button
                          onClick={() => onStyleElementUpdate(element.id, false)}
                          className="text-xs text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl">
              <h4 className="text-sm font-semibold mb-2 flex items-center text-green-800">
                <Tags className="w-4 h-4 mr-2" />
                术语映射
              </h4>
              <p className="text-green-700 text-xs leading-relaxed">
                定义专业术语的个性化表达方式
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-xl">
              <h4 className="text-sm font-semibold mb-2 flex items-center text-purple-800">
                <Settings className="w-4 h-4 mr-2" />
                行文准则
              </h4>
              <p className="text-purple-700 text-xs leading-relaxed">
                设置个人写作偏好和约束条件
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;