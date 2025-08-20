/**
 * 文章选择组件
 * 
 * 在草稿输入后显示匹配的文章，让用户选择参考文章
 * 然后基于选择的文章生成个性化大纲
 */

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, FileText, Eye, Calendar } from 'lucide-react';
import { StylePrototype, KnowledgeBaseArticle } from '../../types';

interface ArticleSelectionProps {
  /** 草稿内容 */
  draft: string;
  /** 推荐的风格原型文章 */
  stylePrototypes: StylePrototype[];
  /** 知识库文章（用于显示完整信息） */
  knowledgeBase: KnowledgeBaseArticle[];
  /** 返回草稿页面 */
  onBack: () => void;
  /** 确认选择并生成大纲 */
  onConfirmSelection: (selectedPrototypes: StylePrototype[]) => void;
  /** 跳过选择，使用通用模板 */
  onSkipSelection: () => void;
  /** 是否正在处理 */
  isProcessing: boolean;
}

const ArticleSelection: React.FC<ArticleSelectionProps> = ({
  draft,
  stylePrototypes,
  knowledgeBase,
  onBack,
  onConfirmSelection,
  onSkipSelection,
  isProcessing
}) => {
  const [selectedPrototypes, setSelectedPrototypes] = useState<StylePrototype[]>([]);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // 切换文章选择状态
  const togglePrototypeSelection = (prototype: StylePrototype) => {
    setSelectedPrototypes(prev => {
      const isSelected = prev.some(p => p.id === prototype.id);
      if (isSelected) {
        return prev.filter(p => p.id !== prototype.id);
      } else {
        return [...prev, prototype];
      }
    });
  };

  // 获取文章详细信息
  const getArticleDetails = (articleId: string) => {
    return knowledgeBase.find(article => article.id === articleId);
  };

  // 切换文章内容展开/收起
  const toggleArticleExpansion = (articleId: string) => {
    setExpandedArticle(prev => prev === articleId ? null : articleId);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 截取文章内容预览
  const getContentPreview = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* 头部说明 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          选择参考文章
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
          AI为您找到了 {stylePrototypes.length} 篇风格相似的文章。选择您希望参考的文章，我们将基于其写作风格为您生成个性化大纲。
        </p>
      </div>

      {/* 草稿预览 */}
      <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">您的草稿内容</h3>
        </div>
        <div className="text-gray-700 leading-relaxed bg-white rounded-lg p-4 border border-blue-100">
          {getContentPreview(draft, 300)}
        </div>
      </div>

      {/* 推荐文章列表 */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
            推荐的参考文章
          </h2>
          <div className="text-sm text-gray-500">
            已选择 {selectedPrototypes.length} 篇文章
          </div>
        </div>

        {stylePrototypes.map((prototype) => {
          const article = getArticleDetails(prototype.articleId);
          const isSelected = selectedPrototypes.some(p => p.id === prototype.id);
          const isExpanded = expandedArticle === prototype.articleId;

          if (!article) return null;

          return (
            <div
              key={prototype.id}
              className={`bg-white rounded-2xl border-2 transition-all duration-200 ${
                isSelected 
                  ? 'border-purple-500 shadow-lg bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="p-6">
                {/* 文章头部信息 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{article.title}</h3>
                      <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                        {prototype.similarity}% 匹配
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(article.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {article.category === 'case' ? '案例库' : '记忆库'}
                      </div>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-1">
                          {article.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed">{prototype.description}</p>
                  </div>

                  {/* 选择按钮 */}
                  <button
                    onClick={() => togglePrototypeSelection(prototype)}
                    className={`ml-4 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-300 hover:border-purple-400 text-gray-400 hover:text-purple-600'
                    }`}
                  >
                    {isSelected && <Check className="w-5 h-5" />}
                  </button>
                </div>

                {/* 风格要素展示 */}
                {article.styleElements && article.styleElements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">写作风格特征：</h4>
                    <div className="flex flex-wrap gap-2">
                      {article.styleElements.slice(0, 5).map((element) => (
                        <span
                          key={element.id}
                          className={`text-xs px-2 py-1 rounded-full ${
                            element.confirmed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {element.description}
                        </span>
                      ))}
                      {article.styleElements.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{article.styleElements.length - 5} 更多
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 查看内容按钮 */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleArticleExpansion(prototype.articleId)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {isExpanded ? '收起内容' : '查看内容'}
                  </button>
                  
                  {isSelected && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Check className="w-4 h-4" />
                      已选择为参考
                    </div>
                  )}
                </div>

                {/* 文章内容展开区域 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                        {article.content}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部操作按钮 */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          返回修改草稿
        </button>

        <div className="flex items-center gap-4">
          {/* 跳过选择按钮 */}
          <button
            onClick={onSkipSelection}
            disabled={isProcessing}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium border border-gray-300"
          >
            跳过，使用通用模板
          </button>

          {/* 确认选择按钮 */}
          <button
            onClick={() => onConfirmSelection(selectedPrototypes)}
            disabled={selectedPrototypes.length === 0 || isProcessing}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成大纲中...
              </>
            ) : (
              <>
                确认选择并生成大纲
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 选择提示 */}
      {selectedPrototypes.length === 0 && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            请至少选择一篇文章作为参考，或点击"跳过"使用通用模板
          </p>
        </div>
      )}
    </div>
  );
};

export default ArticleSelection;
