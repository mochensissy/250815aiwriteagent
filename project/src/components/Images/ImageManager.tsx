/**
 * 图片管理组件
 * 
 * 管理文章配图的生成、预览、替换和封面制作
 * 集成豆包生图API，提供智能图片生成功能
 */

import React, { useState } from 'react';
import { Image, RefreshCw, Trash2, Download, Crown, Wand2, Plus, Type, CheckCircle } from 'lucide-react';
import { GeneratedImage, CoverOption } from '../../types';
import LoadingSpinner from '../Common/LoadingSpinner';

interface ImageManagerProps {
  images: GeneratedImage[];
  coverImage?: GeneratedImage;
  coverOptions?: CoverOption[]; // 新增：封面选项
  isArticleCompleted?: boolean; // 新增：文章是否已完成
  onRegenerateImage: (imageId: string) => void;
  onDeleteImage: (imageId: string) => void;
  onGenerateCover: () => void; // 修改：不再需要参数
  onRegenerateCover?: (coverId: string, newPrompt: string) => void; // 新增：重新生成特定封面
  onSelectCover?: (cover: CoverOption) => void; // 新增：选择封面
  onGenerateImages?: () => void; // 新增：智能配图生成
  onGenerateTitles?: () => Promise<string[]>; // 新增：标题生成
  onSelectTitle?: (title: string) => void; // 新增：选择标题
  currentTitle?: string; // 新增：当前标题
  isGenerating: boolean;
}

const ImageManager: React.FC<ImageManagerProps> = ({
  images,
  coverImage,
  coverOptions = [],
  isArticleCompleted = false,
  onRegenerateImage,
  onDeleteImage,
  onGenerateCover,
  onRegenerateCover,
  onSelectCover,
  onGenerateImages,
  onGenerateTitles,
  onSelectTitle,
  currentTitle = '新文章',
  isGenerating
}) => {

  const [showTitleGenerator, setShowTitleGenerator] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [editingCover, setEditingCover] = useState<string | null>(null); // 正在编辑的封面ID
  const [editingPrompt, setEditingPrompt] = useState<string>(''); // 编辑中的提示词



  // 处理标题生成
  const handleGenerateTitles = async () => {
    if (!onGenerateTitles) return;
    
    setIsGeneratingTitles(true);
    try {
      const titles = await onGenerateTitles();
      setGeneratedTitles(titles);
      setShowTitleGenerator(true);
    } catch (error) {
      console.error('标题生成失败:', error);
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  // 选择标题
  const handleSelectTitle = (title: string) => {
    if (onSelectTitle) {
      onSelectTitle(title);
      setShowTitleGenerator(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Image className="w-5 h-5 mr-2 text-green-400" />
          图片管理
        </h3>
        <div className="flex gap-2">
          {onGenerateImages && (
            <button
              onClick={onGenerateImages}
              disabled={isGenerating}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-1"
            >
              {isGenerating ? <LoadingSpinner size="sm" color="gray" /> : <Wand2 className="w-3 h-3" />}
              {isGenerating ? '生成中...' : '智能配图'}
            </button>
          )}
          {/* 只有文章完成后才显示封面生成按钮 */}
          {isArticleCompleted && (
            <button
              onClick={onGenerateCover}
              disabled={isGenerating}
              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              {isGenerating ? '生成中...' : '生成封面'}
            </button>
          )}
        </div>
      </div>

      {/* 标题管理 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Type className="w-4 h-4 mr-2 text-yellow-400" />
          标题管理
        </h4>
        
        <div className="bg-gray-800 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">当前标题</span>
            {onGenerateTitles && (
              <button
                onClick={handleGenerateTitles}
                disabled={isGeneratingTitles || isGenerating}
                className="px-2 py-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-600 text-white text-xs rounded-md transition-all duration-200 flex items-center gap-1"
              >
                {isGeneratingTitles ? <LoadingSpinner size="sm" color="gray" /> : <Plus className="w-3 h-3" />}
                {isGeneratingTitles ? '生成中...' : '生成标题'}
              </button>
            )}
          </div>
          <div className="text-sm text-white bg-gray-700 rounded p-2">
            {currentTitle}
          </div>
        </div>
      </div>

      {/* 封面选项展示 */}
      {coverOptions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <Crown className="w-4 h-4 mr-2 text-purple-400" />
            封面选项 ({coverOptions.length}种风格)
          </h4>
          <div className="space-y-4">
            {coverOptions.map((cover) => (
              <div key={cover.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                {/* 风格标题和描述 */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="text-white font-medium">{cover.style}</h5>
                    <p className="text-gray-400 text-xs mt-1">{cover.description}</p>
                  </div>
                  {onSelectCover && (
                    <button
                      onClick={() => onSelectCover(cover)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                    >
                      选择此封面
                    </button>
                  )}
                </div>
                
                {/* 封面图片 */}
                <div className="relative group mb-3">
                  <img
                    src={cover.url}
                    alt={`${cover.style}风格封面`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCover(cover.id);
                        setEditingPrompt(cover.prompt);
                      }}
                      className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                      title="编辑提示词"
                    >
                      <Type className="w-3 h-3 text-white" />
                    </button>
                    {onRegenerateCover && (
                      <button
                        onClick={() => onRegenerateCover(cover.id, cover.prompt)}
                        className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                        title="重新生成"
                      >
                        <RefreshCw className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 提示词显示和编辑 */}
                {editingCover === cover.id ? (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-300">编辑提示词:</label>
                    <textarea
                      value={editingPrompt}
                      onChange={(e) => setEditingPrompt(e.target.value)}
                      className="w-full h-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs resize-none"
                      placeholder="输入新的提示词..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (onRegenerateCover) {
                            onRegenerateCover(cover.id, editingPrompt);
                          }
                          setEditingCover(null);
                        }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        重新生成
                      </button>
                      <button
                        onClick={() => setEditingCover(null)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-700 rounded p-2">
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {cover.prompt.length > 100 ? `${cover.prompt.substring(0, 100)}...` : cover.prompt}
                    </p>
                    <button
                      onClick={() => {
                        setEditingCover(cover.id);
                        setEditingPrompt(cover.prompt);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-xs mt-1 transition-colors"
                    >
                      点击编辑提示词
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 配图列表 */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">文章配图 ({images.length})</h4>
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={`配图 ${image.id}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                  <button
                    onClick={() => onRegenerateImage(image.id)}
                    className="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={() => onDeleteImage(image.id)}
                    className="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
                {image.position !== undefined && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                    位置 {image.position + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && coverOptions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-2">还没有生成图片</p>
          <p className="text-sm mb-4">为文章添加精美配图，提升阅读体验</p>
          {onGenerateImages && (
            <button
              onClick={onGenerateImages}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              {isGenerating ? '生成中...' : '开始生成配图'}
            </button>
          )}
        </div>
      )}

      {/* 旧的封面生成器模态框已删除，使用新的封面选项展示 */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">生成封面图</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择风格
              </label>
              <div className="grid grid-cols-2 gap-2">
                {coverStyles.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setSelectedStyle(style.value)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      selectedStyle === style.value
                        ? `border-purple-500 ${style.color}`
                        : `border-gray-200 hover:border-purple-300 ${style.color}`
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                发布平台
              </label>
              <div className="space-y-2">
                {platforms.map((platform) => (
                  <label key={platform.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="platform"
                      value={platform.value}
                      checked={selectedPlatform === platform.value}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="mr-3 text-purple-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{platform.label}</div>
                      <div className="text-xs text-gray-500">{platform.description} • {platform.ratio}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCoverGenerator(false)}
                className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGenerateCover}
                disabled={isGenerating}
                className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isGenerating ? '生成中...' : '生成封面'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标题选择器模态框 */}
      {showTitleGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Type className="w-5 h-5 mr-2 text-yellow-600" />
                  选择标题
                </h3>
                <button
                  onClick={() => setShowTitleGenerator(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                点击选择合适的标题，或点击"生成标题"获取更多选项
              </p>
            </div>
            
            <div className="p-4">
              {generatedTitles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Type className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无生成的标题</p>
                  <p className="text-sm">请点击"生成标题"按钮</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {generatedTitles.map((title, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectTitle(title)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 ${
                        title === currentTitle 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 flex-1">
                          {title}
                        </span>
                        {title === currentTitle && (
                          <CheckCircle className="w-4 h-4 text-blue-600 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {title.length}字
                        </span>
                        <span className="text-xs text-gray-400">
                          {['疑问式', '分享式', '干货式', '情感式'][Math.floor(index / 2)]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={handleGenerateTitles}
                  disabled={isGeneratingTitles}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  {isGeneratingTitles ? <LoadingSpinner size="sm" color="gray" /> : <Plus className="w-4 h-4" />}
                  {isGeneratingTitles ? '生成中...' : '重新生成'}
                </button>
                <button
                  onClick={() => setShowTitleGenerator(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManager;