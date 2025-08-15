/**
 * 应用侧边栏组件
 * 
 * 提供知识库管理、风格设置等功能的导航入口
 * 包含文件上传、标签管理、风格要素展示等核心功能
 */

import React, { useState, useRef } from 'react';
import { FileText, Upload, Tags, Palette, Settings, BookOpen, Brain, Link, X, Eye, AlertCircle } from 'lucide-react';
import { KnowledgeBaseArticle } from '../../types';

interface SidebarProps {
  articles: KnowledgeBaseArticle[];
  onUpload: (content: string, title: string, category: 'memory' | 'case', source: 'upload' | 'paste' | 'url') => void;
  onArticleSelect: (article: KnowledgeBaseArticle) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ articles, onUpload, onArticleSelect }) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'case' | 'style'>('memory');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadContent, setUploadContent] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件读取
  const handleFileRead = async (file: File) => {
    setIsProcessing(true);
    
    try {
      let content = '';
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        // 文本文件直接读取
        content = await file.text();
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // PDF文件模拟解析（实际项目中需要PDF解析库）
        content = `PDF文件内容解析：${file.name}\n\n这是一个PDF文件的模拟解析内容。在实际应用中，这里会调用PDF解析API来提取文本内容。\n\n文件大小：${(file.size / 1024).toFixed(2)} KB\n创建时间：${new Date(file.lastModified).toLocaleString()}`;
      } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
        // Word文档模拟解析
        content = `Word文档内容解析：${file.name}\n\n这是一个Word文档的模拟解析内容。在实际应用中，这里会调用文档解析API来提取文本内容。\n\n文件大小：${(file.size / 1024).toFixed(2)} KB\n创建时间：${new Date(file.lastModified).toLocaleString()}`;
      } else {
        throw new Error('不支持的文件格式');
      }
      
      setUploadContent(content);
      setPreviewContent(content);
    } catch (error) {
      console.error('文件读取失败:', error);
      alert('文件读取失败，请检查文件格式');
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
    if (!uploadUrl) return;
    
    setIsProcessing(true);
    try {
      // 模拟URL获取内容
      const mockContent = `从URL获取的内容: ${uploadUrl}\n\n这是一篇关于技术发展的文章，讨论了人工智能在现代社会中的应用和影响。文章深入分析了AI技术的发展趋势，以及它对各个行业带来的变革。\n\n主要观点包括：\n1. AI技术正在快速发展\n2. 各行业都在积极拥抱AI\n3. 需要关注AI发展带来的挑战\n4. 未来AI将更加普及和智能化`;
      setUploadContent(mockContent);
      setPreviewContent(mockContent);
    } catch (error) {
      console.error('URL获取失败:', error);
      alert('URL获取失败，请检查网址是否正确');
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理内容粘贴
  const handleContentPaste = (content: string) => {
    setUploadContent(content);
    setPreviewContent(content);
  };

  // 提交上传
  const handleSubmitUpload = () => {
    if (uploadContent) {
      // AI自动生成标题
      const lines = uploadContent.split('\n').filter(line => line.trim());
      const autoTitle = lines[0]?.substring(0, 30).replace(/[^\w\s\u4e00-\u9fff]/g, '').trim() + '...' || '未命名文章';
      
      onUpload(uploadContent, autoTitle, activeTab as 'memory' | 'case', 'paste');
      setUploadContent('');
      setUploadUrl('');
      setPreviewContent('');
      setShowUpload(false);
    }
  };

  const memoryArticles = articles.filter(a => a.category === 'memory');
  const caseArticles = articles.filter(a => a.category === 'case');

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
        </div>
      </div>

      {/* 说明文字 */}
      <div className="px-6 pb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800 leading-relaxed">
            {activeTab === 'memory' 
              ? '上传您的得意之作和具有明显个人特点的文章。AI将从中提炼您的个人写作风格，用于后续创作。'
              : '上传您认为优秀的文章作为参考案例。AI将学习这些文章的写作技巧和风格特点，帮助您创作出更好的内容。'
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
          <div className="bg-white rounded-2xl w-[900px] max-h-[80vh] overflow-hidden shadow-2xl">
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

            <div className="flex h-[600px]">
              {/* 左侧上传区域 */}
              <div className="w-1/2 p-6 border-r border-gray-100">
                <div className="space-y-6">
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
                  </div>

                  {/* 直接粘贴 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      直接粘贴内容
                    </label>
                    <textarea
                      value={uploadContent}
                      onChange={(e) => handleContentPaste(e.target.value)}
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                      placeholder="粘贴文章内容..."
                    />
                  </div>

                  {/* 处理进度 */}
                  {isProcessing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                        <span className="text-sm text-blue-800">正在处理文件内容...</span>
                      </div>
                      <div className="mt-2 bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧预览区域 */}
              <div className="w-1/2 p-6 bg-gray-50">
                <div className="flex items-center mb-3">
                  <Eye className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">内容预览</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full overflow-y-auto">
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
            </div>

            {/* 模态框底部 */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
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
                disabled={!previewContent.trim() || isProcessing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {isProcessing ? '添加中...' : '确认添加'}
              </button>
            </div>
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
                  onClick={() => onArticleSelect(article)}
                  className="p-4 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-xl cursor-pointer transition-all duration-200"
                >
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">{article.title}</h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
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
                  onClick={() => onArticleSelect(article)}
                  className="p-4 bg-white border border-gray-200 hover:border-purple-300 hover:shadow-sm rounded-xl cursor-pointer transition-all duration-200"
                >
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">{article.title}</h4>
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
              <h4 className="text-sm font-semibold mb-2 flex items-center text-blue-800">
                <Brain className="w-4 h-4 mr-2" />
                风格要素
              </h4>
              <p className="text-blue-700 text-xs leading-relaxed">
                上传更多作品后，AI将分析并提炼您的个人写作风格特征
              </p>
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