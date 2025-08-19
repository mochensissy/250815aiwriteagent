/**
 * AI写作助手主应用组件
 * 
 * 整合所有功能模块，提供完整的写作工作流程
 * 从草稿输入到最终导出的一站式体验
 */

import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Settings } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import DraftInput from './components/Writing/DraftInput';
import OutlineEditor from './components/Editor/OutlineEditor';
import ArticleEditor from './components/Editor/ArticleEditor';
import ImageManager from './components/Images/ImageManager';
import APIManager from './components/Settings/APIManager';
import { useAppState } from './hooks/useAppState';
import { KnowledgeBaseArticle, StylePrototype } from './types';
import { generateImage } from './utils/api';

function App() {
  const {
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
    handleEditInstruction,
    performExternalSearch,
    generateImages,
    generateCover,
    updateOutline,
    updateContent,
    exportArticle,
    updateAPIConfig
  } = useAppState();

  const [currentView, setCurrentView] = useState<'draft' | 'outline' | 'editor'>('draft');
  const [selectedPrototype, setSelectedPrototype] = useState<StylePrototype>();
  const [showAPIManager, setShowAPIManager] = useState(false);

  // 处理文章选择
  const handleArticleSelect = (article: KnowledgeBaseArticle) => {
    console.log('选中文章:', article.title);
  };

  // 处理风格原型选择
  const handlePrototypeSelect = (prototype: StylePrototype) => {
    setSelectedPrototype(prototype);
  };

  // 处理外部搜索
  const handleExternalSearch = async (query: string) => {
    console.log('执行外部搜索:', query);
    try {
      await performExternalSearch(query);
    } catch (error) {
      console.error('外部搜索失败:', error);
    }
  };

  // 处理草稿提交
  const handleDraftSubmit = async (draft: string, platform: string) => {
    console.log('提交草稿:', draft.substring(0, 100) + '...', '平台:', platform);
    
    // 如果草稿长度足够且案例库不为空，先推荐风格原型
    if (draft.length > 100) {
      const caseArticles = appState.knowledgeBase.filter(a => a.category === 'case');
      if (caseArticles.length > 0) {
        console.log('🎨 草稿足够长且有案例库，先推荐风格原型...');
        await recommendStylePrototypesFromDraft(draft);
      }
    }
    
    await startNewArticle(draft, platform);
    // 如果有推荐的风格原型，停留在草稿页面等待用户确认
    // 否则直接跳转到大纲页面
    if (stylePrototypes.length === 0) {
      setCurrentView('outline');
    }
  };

  // 处理用户确认风格并生成大纲
  const handleGenerateOutlineWithStyle = async (selectedPrototypes: StylePrototype[]) => {
    await generateOutlineWithSelectedStyle(selectedPrototypes);
    setCurrentView('outline'); // 生成大纲后跳转到大纲页面
  };

  // 处理大纲生成完成
  const handleOutlineGenerate = async () => {
    console.log('开始生成文章...');
    await generateArticle();
    setCurrentView('editor');
  };

  // 重新生成图片
  const handleRegenerateImage = async (imageId: string) => {
    if (!appState.currentArticle) return;
    
    const image = appState.currentArticle.images.find(img => img.id === imageId) ||
                  appState.currentArticle.coverImage;
    
    if (image) {
      try {
        const newImageUrl = await generateImage(image.prompt);
        
        if (image.id.startsWith('cover_')) {
          // 更新封面
          const newCoverImage = { ...image, url: newImageUrl, id: `cover_${Date.now()}` };
          updateContent(appState.currentArticle.content); // 触发状态更新
        } else {
          // 更新配图
          const updatedImages = appState.currentArticle.images.map(img =>
            img.id === imageId ? { ...img, url: newImageUrl, id: `img_${Date.now()}` } : img
          );
          // 更新图片数组
        }
      } catch (error) {
        console.error('图片重新生成失败:', error);
      }
    }
  };

  // 删除图片
  const handleDeleteImage = (imageId: string) => {
    if (!appState.currentArticle) return;
    
    if (imageId.startsWith('cover_')) {
      // 删除封面
      updateContent(appState.currentArticle.content); // 触发状态更新
    } else {
      // 删除配图
      const updatedImages = appState.currentArticle.images.filter(img => img.id !== imageId);
      // 更新图片数组
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: 'white',
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      />
      
      {/* 侧边栏 */}
      <Sidebar
        articles={appState.knowledgeBase}
        onUpload={addToKnowledgeBase}
        onArticleSelect={handleArticleSelect}
        onDeleteArticle={deleteArticle}
        onStyleElementUpdate={updateStyleElement}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-900">
            AI写作助手
          </div>
          <div className="flex items-center gap-2">
            {/* 临时测试按钮 */}
            <button
              onClick={createTestCaseData}
              className="flex items-center gap-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
            >
              添加测试案例
            </button>
            <button
              onClick={() => setShowAPIManager(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="API管理"
            >
              <Settings className="w-4 h-4" />
              设置
            </button>
          </div>
        </div>

        {currentView === 'draft' && (
          <div className="flex-1 flex items-center justify-center p-8 bg-white">
            <DraftInput
              onSubmit={handleDraftSubmit}
              onExternalSearch={handleExternalSearch}
              stylePrototypes={stylePrototypes}
              onPrototypeSelect={handlePrototypeSelect}
              selectedPrototype={selectedPrototype}
              isProcessing={isProcessing}
              onGenerateOutlineWithStyle={handleGenerateOutlineWithStyle}
            />
          </div>
        )}

        {currentView === 'outline' && appState.currentArticle && (
          <div className="flex-1 p-8 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setCurrentView('draft')}
                    className="text-blue-600 hover:text-blue-700 text-sm transition-colors font-medium flex items-center"
                  >
                    ← 返回草稿
                  </button>
                  {appState.currentArticle.content && (
                    <button
                      onClick={() => setCurrentView('editor')}
                      className="text-green-600 hover:text-green-700 text-sm transition-colors font-medium flex items-center"
                    >
                      继续编辑 →
                    </button>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  第二步：调整文章大纲
                </h1>
                <p className="text-gray-600">
                  AI已为您生成初始大纲，您可以调整结构后生成完整文章
                </p>
              </div>
              
              <OutlineEditor
                outline={appState.currentArticle.outline}
                onChange={updateOutline}
                onGenerate={handleOutlineGenerate}
                onExternalSearch={performExternalSearch}
                isGenerating={isProcessing}
              />
            </div>
          </div>
        )}

        {currentView === 'editor' && appState.currentArticle && (
          <div className="flex-1 flex bg-white">
            <div className="flex-1 p-8">
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setCurrentView('outline')}
                    className="text-blue-600 hover:text-blue-700 text-sm transition-colors font-medium flex items-center"
                  >
                    ← 返回大纲
                  </button>
                  <button
                    onClick={() => setCurrentView('draft')}
                    className="text-gray-600 hover:text-gray-700 text-sm transition-colors font-medium"
                  >
                    重新开始
                  </button>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  第三步：精修文章内容
                </h1>
                <p className="text-gray-600">
                  使用智能编辑工具完善您的文章
                </p>
              </div>

              <ArticleEditor
                content={appState.currentArticle.content}
                onChange={updateContent}
                onEditInstruction={handleEditInstruction}
                onGenerateImages={generateImages}
                onGenerateCover={() => generateCover('科技感', '公众号')}
                onExport={exportArticle}
                isProcessing={isProcessing}
              />
            </div>

            {/* 右侧图片管理面板 */}
            <div className="w-80 p-8 bg-gray-50 border-l border-gray-200">
              <ImageManager
                images={appState.currentArticle.images}
                coverImage={appState.currentArticle.coverImage}
                onRegenerateImage={handleRegenerateImage}
                onDeleteImage={handleDeleteImage}
                onGenerateCover={generateCover}
                isGenerating={isProcessing}
              />
            </div>
          </div>
        )}
      </div>

      {/* API管理弹窗 */}
      <APIManager
        isOpen={showAPIManager}
        onClose={() => setShowAPIManager(false)}
        apiConfig={appState.apiConfig}
        onConfigChange={updateAPIConfig}
      />
    </div>
  );
}

export default App;