/**
 * 图片管理组件
 * 
 * 管理文章配图的生成、预览、替换和封面制作
 * 集成豆包生图API，提供智能图片生成功能
 */

import React, { useState } from 'react';
import { Image, RefreshCw, Trash2, Download, Crown } from 'lucide-react';
import { GeneratedImage } from '../../types';

interface ImageManagerProps {
  images: GeneratedImage[];
  coverImage?: GeneratedImage;
  onRegenerateImage: (imageId: string) => void;
  onDeleteImage: (imageId: string) => void;
  onGenerateCover: (style: string, platform: string) => void;
  isGenerating: boolean;
}

const ImageManager: React.FC<ImageManagerProps> = ({
  images,
  coverImage,
  onRegenerateImage,
  onDeleteImage,
  onGenerateCover,
  isGenerating
}) => {
  const [showCoverGenerator, setShowCoverGenerator] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('科技感');
  const [selectedPlatform, setSelectedPlatform] = useState('公众号');

  const coverStyles = [
    { value: '科技感', label: '科技感', description: '现代、简洁、蓝色调' },
    { value: '卡通', label: '卡通风', description: '可爱、生动、彩色' },
    { value: '纪实', label: '纪实风', description: '真实、自然、质感' },
    { value: '商务', label: '商务风', description: '专业、严谨、简约' }
  ];

  const platforms = [
    { value: '公众号', label: '公众号', ratio: '16:9' },
    { value: '小红书', label: '小红书', ratio: '3:4' },
    { value: '知乎', label: '知乎', ratio: '16:9' },
    { value: '头条', label: '今日头条', ratio: '16:9' }
  ];

  const handleGenerateCover = () => {
    onGenerateCover(selectedStyle, selectedPlatform);
    setShowCoverGenerator(false);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Image className="w-5 h-5 mr-2 text-green-400" />
          图片管理
        </h3>
        <button
          onClick={() => setShowCoverGenerator(true)}
          className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-1"
        >
          <Crown className="w-3 h-3" />
          生成封面
        </button>
      </div>

      {/* 封面图片 */}
      {coverImage && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">文章封面</h4>
          <div className="relative group">
            <img
              src={coverImage.url}
              alt="文章封面"
              className="w-full h-32 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <button
                onClick={() => onRegenerateImage(coverImage.id)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => onDeleteImage(coverImage.id)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
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

      {images.length === 0 && !coverImage && (
        <div className="text-center py-8 text-gray-500">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>还没有生成图片</p>
          <p className="text-sm">生成文章后可添加配图</p>
        </div>
      )}

      {/* 封面生成器模态框 */}
      {showCoverGenerator && (
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
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
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
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {platforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label} ({platform.ratio})
                  </option>
                ))}
              </select>
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
    </div>
  );
};

export default ImageManager;