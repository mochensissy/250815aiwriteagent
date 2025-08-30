/**
 * AI写作助手主应用组件
 * 
 * 整合所有功能模块，提供完整的写作工作流程
 * 从草稿输入到最终导出的一站式体验
 */

import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Settings, TestTube, Zap } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import DraftInput from './components/Writing/DraftInput';
import ArticleSelection from './components/Writing/ArticleSelection';
import OutlineEditor from './components/Editor/OutlineEditor';
import ArticleEditor from './components/Editor/ArticleEditor';
import ImageManager from './components/Images/ImageManager';
import APIManager from './components/Settings/APIManager';
import APITester from './components/Testing/APITester';
import StyleSummary from './components/Common/StyleSummary';
import { useAppState } from './hooks/useAppState';
import { generateOutline } from './utils/api';
import { KnowledgeBaseArticle, StylePrototype } from './types';
import { generateImage } from './utils/api';
import { testCompleteWritingFlow, quickAPITest } from './utils/e2eTest';

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
    createTestCaseData,
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
  const [showAPITester, setShowAPITester] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<string>(''); // 保存当前草稿内容
  const [processingStatus, setProcessingStatus] = useState<string>('处理中...'); // 处理状态文本

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

  // 端到端测试函数
  const handleE2ETest = async () => {
    console.log('🚀 开始端到端测试...');
    try {
      const result = await testCompleteWritingFlow();
      if (result.success) {
        toast.success('🎉 端到端测试全部通过！');
      } else {
        toast.error('⚠️ 部分测试失败，请查看控制台');
      }
    } catch (error) {
      console.error('测试失败:', error);
      toast.error('测试过程出现异常');
    }
  };

  // 快速API测试函数
  const handleQuickTest = async () => {
    console.log('⚡ 快速API测试...');
    try {
      const result = await quickAPITest();
      const successCount = Object.values(result).filter(v => v === true).length;
      if (successCount === 2) {
        toast.success('✅ 所有API连接正常');
      } else {
        toast.error(`⚠️ ${2 - successCount}个API连接异常`);
      }
    } catch (error) {
      console.error('快速测试失败:', error);
      toast.error('快速测试过程出现异常');
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
              onClick={() => {
                console.log('🧪 打印当前应用状态...');
                console.log('📚 知识库状态:', {
                  总数: appState.knowledgeBase.length,
                  案例库: appState.knowledgeBase.filter(a => a.category === 'case').length,
                  记忆库: appState.knowledgeBase.filter(a => a.category === 'memory').length,
                  详细: appState.knowledgeBase.map(a => ({ id: a.id, title: a.title, category: a.category }))
                });
                console.log('🎯 当前风格原型:', stylePrototypes);
                console.log('📝 当前文章:', appState.currentArticle);
              }}
              className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
            >
              调试状态
            </button>
            
            <button
              onClick={() => {
                console.log('🔍 localStorage详细检查:');
                console.log('=== 所有localStorage数据 ===');
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  const value = localStorage.getItem(key);
                  console.log(`${key}:`, value);
                }
                console.log('=== 特定key检查 ===');
                console.log('知识库数据(正确key):', localStorage.getItem('ai_writer_knowledge_base'));
                console.log('知识库数据(旧key):', localStorage.getItem('knowledgeBase'));
                console.log('API配置:', localStorage.getItem('ai_writer_api_config'));
                console.log('当前文章:', localStorage.getItem('ai_writer_current_article'));
                alert('localStorage数据已打印到控制台，请查看！');
              }}
              className="flex items-center gap-2 px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
            >
              检查存储
            </button>
            
            <button
              onClick={async () => {
                const draft = prompt('请输入草稿内容：');
                if (draft) {
                  console.log('🚀 强制生成大纲（跳过风格推荐）...');
                  try {
                    // 直接调用已经导入的函数
                    const aiOutline = await generateOutline(draft, '通用写作风格');
                    console.log('🔍 AI大纲结果:', aiOutline);
                    
                    if (aiOutline && Array.isArray(aiOutline) && aiOutline.length > 0) {
                      const outline = aiOutline.map((node, index) => ({
                        id: String(index + 1),
                        title: node.title || `章节 ${index + 1}`,
                        summary: node.summary || '内容概述待补充',
                        level: node.level || 1,
                        order: index
                      }));
                      
                      // 这个功能需要通过 useAppState hook 来实现
                      console.log('需要通过正确的状态管理来设置文章状态');
                      setCurrentView('outline');
                      alert('大纲生成成功！');
                    } else {
                      alert('AI大纲生成失败，请查看控制台');
                    }
                  } catch (error) {
                    console.error('❌ 强制大纲生成失败:', error);
                    alert('大纲生成失败：' + error.message);
                  }
                }
              }}
              className="flex items-center gap-2 px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
            >
              强制生成大纲
            </button>
            
            <button
              onClick={handleQuickTest}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
              title="快速API测试"
            >
              <Zap className="w-4 h-4" />
              快速测试
            </button>
            <button
              onClick={handleE2ETest}
              className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-lg transition-colors"
              title="端到端测试"
            >
              <TestTube className="w-4 h-4" />
              完整测试
            </button>
            <button
              onClick={() => setShowAPITester(true)}
              className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
              title="API功能测试"
            >
              <Settings className="w-4 h-4" />
              测试
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
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-md mx-auto">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI正在处理</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {processingStatus}
                  </p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">请稍候，正在为您匹配最佳文章...</p>
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

      {/* API测试弹窗 */}
      <APITester
        isOpen={showAPITester}
        onClose={() => setShowAPITester(false)}
      />
    </div>
  );
}

export default App;