/**
 * 交互式大纲编辑器组件
 * 
 * 提供可拖拽排序的大纲编辑功能
 * 支持添加、删除、修改大纲节点，以及实时预览结构
 * 新增外部搜索增强功能
 */

import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Edit2, Trash2, FileText, Search, Globe, CheckCircle, X, Copy, MoveUp, MoveDown, ChevronDown, ChevronRight } from 'lucide-react';
import { OutlineNode } from '../../types';
import toast from 'react-hot-toast';

interface OutlineEditorProps {
  outline: OutlineNode[];
  onChange: (outline: OutlineNode[]) => void;
  onGenerate: () => void;
  onExternalSearch?: (query: string) => Promise<any[]>;
  isGenerating: boolean;
}

interface ExternalSearchResult {
  title: string;
  summary: string;
  url?: string;
  relevance: number;
}

// 可排序的大纲项组件
const SortableOutlineItem: React.FC<{
  node: OutlineNode;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleLevel: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ node, onEdit, onDelete, onDuplicate, onMoveUp, onMoveDown, onToggleLevel, isFirst, isLast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [showActions, setShowActions] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() !== node.title) {
      onEdit(node.id, editTitle.trim());
      toast.success('大纲节点已更新');
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(node.title);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个大纲节点吗？')) {
      onDelete(node.id);
      toast.success('大纲节点已删除');
    }
  };

  const handleDuplicate = () => {
    onDuplicate(node.id);
    toast.success('大纲节点已复制');
  };

  // 层级指示器
  const levelIndicator = node.level === 1 ? 
    <ChevronRight className="w-4 h-4 text-blue-500" /> : 
    <ChevronDown className="w-4 h-4 text-green-500" />;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-sm transition-all group border ${
        isDragging ? 'border-blue-300 shadow-lg' : 'border-gray-100 hover:border-gray-200'
      } ${node.level === 2 ? 'ml-6 bg-gray-50' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* 层级指示器 */}
      <div className="flex items-center">
        {levelIndicator}
      </div>
      
      <div className="flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyPress}
            className="w-full bg-white text-gray-800 px-3 py-2 rounded-lg border border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
        ) : (
          <div 
            className="cursor-pointer hover:text-blue-600 transition-colors group-hover:bg-blue-50 px-2 py-1 rounded"
            onClick={() => setIsEditing(true)}
          >
            <span className={`${node.level === 1 ? 'font-semibold text-gray-900 text-base' : 'text-gray-700 text-sm'}`}>
              {node.title}
            </span>
            {node.summary && (
              <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                📝 {node.summary}
              </div>
            )}
            {node.content && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{node.content}</p>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={`flex gap-1 transition-opacity ${showActions || isEditing ? 'opacity-100' : 'opacity-0'}`}>
        {/* 层级切换 */}
        <button
          onClick={() => onToggleLevel(node.id)}
          className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
          title={node.level === 1 ? '设为子标题' : '设为主标题'}
        >
          {node.level === 1 ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        
        {/* 向上移动 */}
        {!isFirst && (
          <button
            onClick={() => onMoveUp(node.id)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="向上移动"
          >
            <MoveUp className="w-3 h-3" />
          </button>
        )}
        
        {/* 向下移动 */}
        {!isLast && (
          <button
            onClick={() => onMoveDown(node.id)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="向下移动"
          >
            <MoveDown className="w-3 h-3" />
          </button>
        )}
        
        {/* 复制 */}
        <button
          onClick={handleDuplicate}
          className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
          title="复制节点"
        >
          <Copy className="w-3 h-3" />
        </button>
        
        {/* 编辑 */}
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          title="编辑"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        
        {/* 删除 */}
        <button
          onClick={handleDelete}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="删除"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const OutlineEditor: React.FC<OutlineEditorProps> = ({ 
  outline, 
  onChange, 
  onGenerate, 
  onExternalSearch,
  isGenerating 
}) => {
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [showAddNode, setShowAddNode] = useState(false);
  const [showExternalSearch, setShowExternalSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExternalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = outline.findIndex(item => item.id === active.id);
      const newIndex = outline.findIndex(item => item.id === over?.id);
      
      const newOutline = arrayMove(outline, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index
      }));
      
      onChange(newOutline);
    }
  };

  const handleEditNode = (id: string, title: string) => {
    const newOutline = outline.map(node => 
      node.id === id ? { ...node, title } : node
    );
    onChange(newOutline);
  };

  const handleDeleteNode = (id: string) => {
    const newOutline = outline.filter(node => node.id !== id);
    onChange(newOutline);
  };

  const handleDuplicateNode = (id: string) => {
    const nodeIndex = outline.findIndex(node => node.id === id);
    if (nodeIndex === -1) return;
    
    const originalNode = outline[nodeIndex];
    const duplicatedNode: OutlineNode = {
      ...originalNode,
      id: Date.now().toString(),
      title: originalNode.title + ' (副本)',
      order: nodeIndex + 1
    };
    
    const newOutline = [...outline];
    newOutline.splice(nodeIndex + 1, 0, duplicatedNode);
    
    // 重新排序
    newOutline.forEach((node, index) => {
      node.order = index;
    });
    
    onChange(newOutline);
  };

  const handleMoveUp = (id: string) => {
    const index = outline.findIndex(node => node.id === id);
    if (index <= 0) return;
    
    const newOutline = arrayMove(outline, index, index - 1).map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    onChange(newOutline);
  };

  const handleMoveDown = (id: string) => {
    const index = outline.findIndex(node => node.id === id);
    if (index >= outline.length - 1) return;
    
    const newOutline = arrayMove(outline, index, index + 1).map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    onChange(newOutline);
  };

  const handleToggleLevel = (id: string) => {
    const newOutline = outline.map(node => 
      node.id === id ? { ...node, level: node.level === 1 ? 2 : 1 } : node
    );
    onChange(newOutline);
  };

  const handleAddNode = () => {
    if (!newNodeTitle.trim()) return;

    const newNode: OutlineNode = {
      id: Date.now().toString(),
      title: newNodeTitle,
      level: 1,
      order: outline.length
    };

    onChange([...outline, newNode]);
    setNewNodeTitle('');
    setShowAddNode(false);
  };

  // 处理外部搜索
  const handleExternalSearchSubmit = async () => {
    if (!searchQuery.trim() || !onExternalSearch) return;
    
    setIsSearching(true);
    try {
      // 模拟外部搜索结果
      const mockResults: ExternalSearchResult[] = [
        {
          title: `${searchQuery}的最新发展趋势`,
          summary: `关于${searchQuery}的深度分析，包含最新的行业观点和数据统计。文章探讨了当前市场状况、技术发展方向以及未来预测。`,
          relevance: 95
        },
        {
          title: `专家解读：${searchQuery}的核心要点`,
          summary: `业内专家对${searchQuery}进行全面解读，分析其核心价值和实际应用场景。提供了详细的案例研究和实践建议。`,
          relevance: 88
        },
        {
          title: `${searchQuery}实践指南与案例分析`,
          summary: `通过具体案例分析${searchQuery}的实际应用，总结成功经验和注意事项。为读者提供可操作的实践指导。`,
          relevance: 82
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('外部搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 添加搜索结果到大纲
  const handleAddSearchResult = (result: ExternalSearchResult) => {
    const newNode: OutlineNode = {
      id: Date.now().toString(),
      title: result.title,
      level: 1,
      order: outline.length,
      content: result.summary
    };

    onChange([...outline, newNode]);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-blue-500" />
            文章大纲
          </h3>
          {outline.length > 0 && (
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>共 {outline.length} 个节点</span>
              <span>主标题 {outline.filter(n => n.level === 1).length} 个</span>
              <span>子标题 {outline.filter(n => n.level === 2).length} 个</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {outline.length > 0 && (
            <button
              onClick={() => {
                const outlineText = outline.map(node => 
                  `${'#'.repeat(node.level)} ${node.title}`
                ).join('\n');
                navigator.clipboard.writeText(outlineText);
                toast.success('大纲已复制到剪贴板');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2 border border-gray-200 hover:border-gray-300"
              title="复制大纲到剪贴板"
            >
              <Copy className="w-4 h-4" />
              复制大纲
            </button>
          )}
          <button
            onClick={() => setShowExternalSearch(true)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-2 border border-blue-200 hover:border-blue-300"
          >
            <Globe className="w-4 h-4" />
            外部搜索增强
          </button>
          <button
            onClick={() => setShowAddNode(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            title="添加新节点"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 外部搜索模态框 */}
      {showExternalSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[800px] max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">外部搜索增强</h3>
              <button
                onClick={() => setShowExternalSearch(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入搜索关键词，如：人工智能发展趋势"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onKeyDown={(e) => e.key === 'Enter' && handleExternalSearchSubmit()}
                />
                <button
                  onClick={handleExternalSearchSubmit}
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors font-medium"
                >
                  {isSearching ? '搜索中...' : '搜索'}
                </button>
              </div>

              {/* 搜索结果 */}
              <div className="max-h-96 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex-1">{result.title}</h4>
                      <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full ml-3">
                        {result.relevance}% 相关
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">{result.summary}</p>
                    <button
                      onClick={() => handleAddSearchResult(result)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      添加到大纲
                    </button>
                  </div>
                ))}
                
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无搜索结果</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加节点输入框 */}
      {showAddNode && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="text"
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNode();
              if (e.key === 'Escape') setShowAddNode(false);
            }}
            placeholder="输入章节标题..."
            className="w-full bg-white text-gray-800 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleAddNode}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
            >
              添加
            </button>
            <button
              onClick={() => setShowAddNode(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 大纲列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={outline.map(node => node.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 mb-8">
            {outline.map((node, index) => (
              <SortableOutlineItem
                key={node.id}
                node={node}
                onEdit={handleEditNode}
                onDelete={handleDeleteNode}
                onDuplicate={handleDuplicateNode}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onToggleLevel={handleToggleLevel}
                isFirst={index === 0}
                isLast={index === outline.length - 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {outline.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">还没有大纲内容</p>
          <p className="text-sm">添加草稿后AI将自动生成大纲</p>
        </div>
      )}

      {/* 生成全文按钮 */}
      {outline.length > 0 && (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-semibold flex items-center justify-center shadow-lg hover:shadow-xl text-lg"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
              生成中...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-3" />
              生成完整文章
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default OutlineEditor;