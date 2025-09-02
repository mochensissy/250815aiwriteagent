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
import ArticleSelection from './components/Writing/ArticleSelection';
import OutlineEditor from './components/Editor/OutlineEditor';
import ArticleEditor from './components/Editor/ArticleEditor';
import ImageManager from './components/Images/ImageManager';
import APIManager from './components/Settings/APIManager';

import StyleSummary from './components/Common/StyleSummary';
import ProgressIndicator from './components/Common/ProgressIndicator';
import StatusCard from './components/Common/StatusCard';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { showToast } from './components/Common/Toast';
import { useAppState } from './hooks/useAppState';
import { generateOutline } from './utils/api';
import { KnowledgeBaseArticle, StylePrototype } from './types';
import { generateImage } from './utils/api';

import toast from 'react-hot-toast';

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
    generateOutlineFromDraft,

    startNewArticle,
    generateArticle,
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
    exportArticle,
    updateAPIConfig
  } = useAppState();

  const [currentView, setCurrentView] = useState<'draft' | 'selection' | 'outline' | 'editor'>('draft');
  const [selectedPrototype, setSelectedPrototype] = useState<StylePrototype>();
  const [showAPIManager, setShowAPIManager] = useState(false);

  const [currentDraft, setCurrentDraft] = useState<string>(''); // 保存当前草稿内容
  const [processingStatus, setProcessingStatus] = useState<string>('处理中...'); // 处理状态文本

  // 获取当前步骤信息
  const getProgressSteps = () => {
    const steps = [
      {
        id: 'draft',
        title: '输入草稿',
        description: '输入您的创作灵感',
        status: currentView === 'draft' ? 'current' : 
                (currentView !== 'draft' ? 'completed' : 'pending')
      },
      {
        id: 'selection',
        title: '选择风格',
        description: '匹配写作风格',
        status: currentView === 'selection' ? 'current' : 
                (currentView === 'outline' || currentView === 'editor' ? 'completed' : 'pending')
      },
      {
        id: 'outline',
        title: '调整大纲',
        description: '完善文章结构',
        status: currentView === 'outline' ? 'current' : 
                (currentView === 'editor' ? 'completed' : 'pending')
      },
      {
        id: 'editor',
        title: '精修内容',
        description: '完善文章内容',
        status: currentView === 'editor' ? 'current' : 'pending'
      }
    ];

    return steps.map(step => ({
      ...step,
      status: step.status as 'completed' | 'current' | 'pending'
    }));
  };

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
    
    try {
      // 第一步：保存草稿内容
      setProcessingStatus('正在保存草稿...');
      setCurrentDraft(draft);
      
      // 第二步：创建基础文章状态
      setProcessingStatus('初始化文章状态...');
      await startNewArticle(draft, platform);
      
      // 第三步：AI推荐风格原型
      setProcessingStatus('AI正在分析您的写作风格...');
      console.log('🔍 开始推荐风格原型...');
      const recommendedPrototypes = await recommendStylePrototypesFromDraft(draft);
      
      console.log('📊 推荐结果数量:', recommendedPrototypes.length);
      
      // 第四步：根据推荐结果决定跳转页面
      if (recommendedPrototypes.length > 0) {
        setProcessingStatus('找到匹配文章，准备选择界面...');
        console.log('✅ 有推荐文章，跳转到选择页面');
        setTimeout(() => {
          setCurrentView('selection');
        }, 500); // 给用户一点时间看到成功状态
      } else {
        setProcessingStatus('生成通用大纲中...');
        console.log('⚠️ 没有推荐文章，生成通用大纲并跳转到大纲页面');
        // 没有推荐文章时，直接生成通用大纲
        await generateOutlineFromDraft(draft, '通用写作风格');
        setCurrentView('outline');
      }
    } catch (error) {
      console.error('❌ 草稿处理失败:', error);
      setProcessingStatus('处理失败，请重试');
      
      // 使用增强的错误提示
      showToast.error(
        '草稿处理失败',
        error instanceof Error ? error.message : '未知错误，请重试',
        {
          text: '重新尝试',
          onClick: () => handleDraftSubmit(draft, selectedPlatform)
        }
      );
      
      // 3秒后重置状态
      setTimeout(() => {
        setProcessingStatus('处理中...');
      }, 3000);
    }
  };

  // 处理用户确认风格并生成大纲（从草稿页面）
  const handleGenerateOutlineWithStyle = async (selectedPrototypes: StylePrototype[]) => {
    await generateOutlineWithSelectedStyle(selectedPrototypes);
    setCurrentView('outline'); // 生成大纲后跳转到大纲页面
  };

  // 处理文章选择页面的确认选择
  const handleConfirmArticleSelection = async (selectedPrototypes: StylePrototype[]) => {
    await generateOutlineWithSelectedStyle(selectedPrototypes);
    setCurrentView('outline');
  };

  // 处理跳过文章选择
  const handleSkipArticleSelection = async () => {
    // 使用通用模板生成大纲
    if (appState.currentArticle) {
      // 直接使用通用风格生成大纲
      await generateOutlineFromDraft(appState.currentArticle.draft, '通用写作风格');
    }
    setCurrentView('outline');
  };

  // 从文章选择页面返回草稿页面
  const handleBackToDraft = () => {
    setCurrentView('draft');
  };

  // 处理大纲生成完成
  const handleOutlineGenerate = async () => {
    console.log('开始生成文章...');
    // 传递选中的原型数据给文章生成函数
    await generateArticle(appState.selectedPrototypes);
    setCurrentView('editor');
  };

  // 图片管理事件处理器直接使用hook中的方法
  const handleRegenerateImage = regenerateImage;
  const handleDeleteImage = deleteImage;



  return (
    <ErrorBoundary>
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
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xl font-bold text-gray-900">
              AI写作助手
            </div>
          <div className="flex items-center gap-2">
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
          
          {/* 进度指示器 */}
          <ProgressIndicator 
            steps={getProgressSteps()} 
            className="mb-0"
          />
        </div>

        {currentView === 'draft' && (
          <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
            <DraftInput
              onSubmit={handleDraftSubmit}
              onExternalSearch={handleExternalSearch}
              stylePrototypes={stylePrototypes}
              onPrototypeSelect={handlePrototypeSelect}
              selectedPrototype={selectedPrototype}
              isProcessing={isProcessing}
              processingStatus={processingStatus}
              onGenerateOutlineWithStyle={handleGenerateOutlineWithStyle}
            />
            
            {/* 全屏加载遮罩 */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="max-w-md mx-auto">
                  <StatusCard
                    type="loading"
                    title="AI正在处理"
                    message={processingStatus}
                    className="shadow-2xl"
                  />
                  <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 text-center">请稍候，正在为您匹配最佳文章...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'selection' && (
          <div className="flex-1 p-8 bg-white">
            <ArticleSelection
              draft={currentDraft}
              stylePrototypes={stylePrototypes}
              knowledgeBase={appState.knowledgeBase}
              onBack={handleBackToDraft}
              onConfirmSelection={handleConfirmArticleSelection}
              onSkipSelection={handleSkipArticleSelection}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {currentView === 'outline' && appState.currentArticle && (
          <div className="flex-1 p-8 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setCurrentView(stylePrototypes.length > 0 ? 'selection' : 'draft')}
                    className="text-blue-600 hover:text-blue-700 text-sm transition-colors font-medium flex items-center"
                  >
                    ← {stylePrototypes.length > 0 ? '返回文章选择' : '返回草稿'}
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
                
                {/* 风格摘要显示 */}
                <div className="mt-6">
                  <StyleSummary
                    selectedPrototypes={appState.selectedPrototypes}
                    knowledgeBase={appState.knowledgeBase}
                    showDetails={true}
                    className="max-w-2xl"
                  />
                </div>
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
                    onClick={() => setCurrentView(stylePrototypes.length > 0 ? 'selection' : 'draft')}
                    className="text-gray-600 hover:text-gray-700 text-sm transition-colors font-medium"
                  >
                    重新选择文章
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
                images={appState.currentArticle.images}
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
                onGenerateImages={generateImages}
                onGenerateTitles={generateTitles}
                onSelectTitle={setSelectedTitle}
                currentTitle={appState.currentArticle.title}
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
    </ErrorBoundary>
  );
}

export default App;