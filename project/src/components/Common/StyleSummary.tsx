/**
 * 风格摘要组件
 * 
 * 显示当前使用的写作风格特征，让用户了解AI将基于哪些风格元素生成内容
 */

import React from 'react';
import { Palette, FileText, Users, Sparkles } from 'lucide-react';
import { StylePrototype, KnowledgeBaseArticle } from '../../types';
import { generateStyleSummary, getStyleElementsStats } from '../../utils/promptGenerator';

interface StyleSummaryProps {
  /** 选中的风格原型 */
  selectedPrototypes?: StylePrototype[];
  /** 知识库文章 */
  knowledgeBase: KnowledgeBaseArticle[];
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

const StyleSummary: React.FC<StyleSummaryProps> = ({
  selectedPrototypes = [],
  knowledgeBase,
  showDetails = false,
  className = ''
}) => {
  // 如果没有选中任何原型，不显示组件
  if (selectedPrototypes.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
            <Palette className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-700">使用通用写作风格</h3>
            <p className="text-sm text-gray-500">未选择特定的参考文章，将使用基础写作模板</p>
          </div>
        </div>
      </div>
    );
  }

  // 生成风格摘要
  const styleSummary = generateStyleSummary(selectedPrototypes, knowledgeBase);
  const stats = getStyleElementsStats(selectedPrototypes, knowledgeBase);

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-800">个性化写作风格</h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              已激活
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{styleSummary}</p>
          
          {/* 参考文章列表 */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileText className="w-3 h-3" />
              <span>参考文章 ({selectedPrototypes.length}篇)</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedPrototypes.map((prototype) => {
                const article = knowledgeBase.find(a => a.id === prototype.articleId);
                return (
                  <div
                    key={prototype.id}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs"
                  >
                    <div className="font-medium text-gray-700 truncate max-w-32">
                      {article?.title || '未知文章'}
                    </div>
                    <div className="text-purple-600 font-medium">
                      {prototype.similarity}% 匹配
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 详细统计信息 */}
          {showDetails && stats.confirmedElements > 0 && (
            <div className="border-t border-purple-200 pt-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Users className="w-3 h-3" />
                <span>风格元素统计</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <div className="font-medium text-gray-700">总元素数</div>
                  <div className="text-lg font-bold text-purple-600">{stats.confirmedElements}</div>
                </div>
                
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <div className="font-medium text-gray-700">主要类型</div>
                  <div className="text-sm text-gray-600">
                    {Object.entries(stats.categories)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => {
                        const typeNames: Record<string, string> = {
                          content: '内容',
                          language: '语言',
                          structure: '结构',
                          emotion: '情感',
                          interaction: '互动'
                        };
                        return `${typeNames[type] || type}(${count})`;
                      })
                      .slice(0, 2)
                      .join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleSummary;

