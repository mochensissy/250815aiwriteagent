/**
 * 草稿输入组件
 * 
 * 用户输入初始草稿的界面
 * 包括文本输入、平台选择、风格原型推荐、外部搜索增强等功能
 */

import React, { useState } from 'react';
import { Send, Search, Sparkles, FileText, ArrowRight, Globe, Smartphone, Video } from 'lucide-react';
import { StylePrototype } from '../../types';

interface DraftInputProps {
  onSubmit: (draft: string, platform: string) => void;
  onExternalSearch: (query: string) => void;
  stylePrototypes: StylePrototype[];
  onPrototypeSelect: (prototype: StylePrototype) => void;
  selectedPrototype?: StylePrototype;
  isProcessing: boolean;
}

const DraftInput: React.FC<DraftInputProps> = ({
  onSubmit,
  onExternalSearch,
  stylePrototypes,
  onPrototypeSelect,
  selectedPrototype,
  isProcessing
}) => {
  const [draft, setDraft] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('公众号');
  const [showExternalSearch, setShowExternalSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

  const platforms = [
    { 
      id: '公众号', 
      name: '微信公众号', 
      icon: Globe, 
      description: '适合深度阅读的长文章',
      available: true
    },
    { 
      id: '小红书', 
      name: '小红书', 
      icon: Smartphone, 
      description: '图文并茂的生活分享',
      available: false
    },
    { 
      id: 'B站', 
      name: 'B站口播', 
      icon: Video, 
      description: '视频脚本和口播内容',
      available: false
    }
  ];

  const handleSubmit = () => {
    if (draft.trim()) {
      console.log('提交草稿，长度:', draft.length, '平台:', selectedPlatform);
      onSubmit(draft, selectedPlatform);
    }
  };

  // 快速测试功能
  const handleQuickTest = () => {
    const testDraft = `AI技术的发展正在深刻改变我们的工作和生活方式。从自动驾驶到智能助手，从医疗诊断到金融分析，AI已经渗透到各个领域。

我认为AI最重要的价值在于：
1. 提高效率：自动化重复性工作
2. 增强决策：基于数据的智能分析  
3. 拓展可能：探索人类无法触及的领域

但我们也需要关注AI带来的挑战，包括就业影响、隐私保护、伦理问题等。

总的来说，AI是一把双刃剑，关键在于如何正确使用和引导其发展。`;
    
    setDraft(testDraft);
    setSelectedPlatform('公众号');
    
    // 自动触发风格分析
    if (testDraft.length > 100) {
      triggerStyleAnalysis(testDraft);
    }
  };

  // 触发风格原型推荐
  const triggerStyleAnalysis = async (draftText: string) => {
    if (draftText.length < 100 || isAnalyzingStyle) return;
    
    setIsAnalyzingStyle(true);
    try {
      console.log('🎨 开始分析草稿并推荐风格原型...');
      // 这里会触发父组件的风格推荐逻辑
      // 实际的API调用应该在父组件或状态管理中处理
    } catch (error) {
      console.error('风格分析失败:', error);
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  const handleExternalSearch = () => {
    if (searchQuery.trim()) {
      onExternalSearch(searchQuery);
      setShowExternalSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* 头部说明 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          第一步：输入您的灵感草稿
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
          将您的口述、笔记或任何零散的想法粘贴到下方，AI将以此为基础开始创作。
        </p>
      </div>

      {/* 平台选择 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <Globe className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">选择发布平台</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const IconComponent = platform.icon;
              return (
                <div
                  key={platform.id}
                  onClick={() => platform.available && setSelectedPlatform(platform.id)}
                  className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedPlatform === platform.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : platform.available
                      ? 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <IconComponent className={`w-6 h-6 mr-3 ${
                      selectedPlatform === platform.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{platform.description}</p>
                  
                  {!platform.available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-xl">
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        敬请期待
                      </span>
                    </div>
                  )}
                  
                  {selectedPlatform === platform.id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 草稿输入区域 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">草稿内容</h3>
            </div>
            <button
              onClick={() => setShowExternalSearch(true)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              <Search className="w-4 h-4" />
              外部搜索增强
            </button>
          </div>
          
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-80 px-6 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none text-base leading-relaxed placeholder-gray-400"
            placeholder="在此处粘贴您的口述文章原文..."
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              {draft.length} 字符
            </div>
            <div className="text-sm text-gray-400">
              建议输入 500-2000 字的草稿内容
            </div>
          </div>
        </div>
      </div>

      {/* 外部搜索模态框 */}
      {showExternalSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-[500px] shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">外部搜索增强</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              AI将搜索相关的热门文章和最新观点，为您的文章提供更丰富的论点和论据。
            </p>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入搜索主题..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all mb-6"
              onKeyDown={(e) => e.key === 'Enter' && handleExternalSearch()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowExternalSearch(false)}
                className="flex-1 py-3 px-4 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-300 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleExternalSearch}
                disabled={!searchQuery.trim()}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors font-medium"
              >
                开始搜索
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 风格原型推荐 */}
      {stylePrototypes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            推荐的写作风格
          </h3>
          <div className="grid gap-4">
            {stylePrototypes.map((prototype) => (
              <div
                key={prototype.id}
                onClick={() => onPrototypeSelect(prototype)}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                  selectedPrototype?.id === prototype.id
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg">{prototype.title}</h4>
                  <span className="text-sm text-purple-600 font-semibold bg-purple-100 px-3 py-1 rounded-full">
                    {prototype.similarity}% 匹配
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">{prototype.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提交按钮 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* 快速测试按钮 */}
          <button
            onClick={handleQuickTest}
            className="px-6 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 border border-green-300"
          >
            <FileText className="w-4 h-4" />
            快速测试
          </button>
          
          {/* 开始写作按钮 */}
          <button
            onClick={handleSubmit}
            disabled={!draft.trim() || isProcessing}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                处理中...
              </>
            ) : (
              <>
                开始写作
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          点击"快速测试"自动填充示例内容，或点击"开始写作"使用您的草稿
        </p>
      </div>
    </div>
  );
};

export default DraftInput;