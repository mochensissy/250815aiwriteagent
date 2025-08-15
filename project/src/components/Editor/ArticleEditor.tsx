/**
 * 文章编辑器组件
 * 
 * 主要的文章编辑界面，支持富文本编辑、划词建议、对话式修改
 * 集成了智能编辑工具栏和实时预览功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Image, Download, Wand2, MoreHorizontal, Copy, Eye, Edit3 } from 'lucide-react';
import { EditSuggestion } from '../../types';
import ReactMarkdown from 'react-markdown';

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  onEditInstruction: (instruction: string, selectedText?: string) => void;
  onGenerateImages: () => void;
  onGenerateCover: () => void;
  onExport: () => void;
  isProcessing: boolean;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({
  content,
  onChange,
  onEditInstruction,
  onGenerateImages,
  onGenerateCover,
  onExport,
  isProcessing
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'system'; message: string }>>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'split'>('edit');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const editSuggestions: EditSuggestion[] = [
    { type: 'polish', label: '润色', icon: '✨' },
    { type: 'expand', label: '扩写', icon: '📝' },
    { type: 'shorten', label: '缩写', icon: '✂️' },
    { type: 'tone', label: '改语气', icon: '🎭' },
  ];

  // 处理文本选择
  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selected = content.substring(start, end);
      setSelectedText(selected);
      
      // 计算选择位置（简化实现）
      const rect = textarea.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + 100,
        y: rect.top + 50
      });
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 处理编辑建议
  const handleSuggestion = async (suggestion: EditSuggestion) => {
    let instruction = '';
    switch (suggestion.type) {
      case 'polish':
        instruction = '请润色这段文字，让它更加生动和吸引人';
        break;
      case 'expand':
        instruction = '请扩展这段内容，增加更多细节和论证';
        break;
      case 'shorten':
        instruction = '请精简这段文字，保留核心观点';
        break;
      case 'tone':
        instruction = '请调整这段文字的语气，让它更加专业或轻松';
        break;
    }
    
    await onEditInstruction(instruction, selectedText);
    setShowSuggestions(false);
  };

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
            <button
              onClick={onGenerateCover}
              disabled={isProcessing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="生成封面"
            >
              <Wand2 className="w-4 h-4" />
            </button>
            <button
              onClick={onExport}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="一键复制"
            >
              <Copy className="w-4 h-4" />
            </button>
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
              className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50"
              style={{
                left: selectionPosition.x,
                top: selectionPosition.y,
              }}
            >
              <div className="flex gap-1">
                {editSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.type}
                    onClick={() => handleSuggestion(suggestion)}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                  >
                    <span>{suggestion.icon}</span>
                    {suggestion.label}
                  </button>
                ))}
                <div className="w-px bg-gray-300 mx-1" />
                <button
                  onClick={() => {
                    const instruction = prompt('请输入具体的修改要求：');
                    if (instruction) {
                      handleSuggestion({ type: 'polish', label: '自定义', icon: '🎯' });
                    }
                  }}
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <MoreHorizontal className="w-3 h-3" />
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
    </div>
  );
};

export default ArticleEditor;