/**
 * API管理组件
 * 
 * 允许用户配置和测试三个主要API：
 * 1. Google Gemini API - 大模型文本生成
 * 2. Perplexity API - 外部搜索
 * 3. 豆包生图API - 图片生成
 */

import React, { useState, useEffect } from 'react';
import { Settings, Check, X, Loader, Eye, EyeOff, TestTube } from 'lucide-react';
import { APIConfig, APITestResult } from '../../types';
import toast from 'react-hot-toast';

interface APIManagerProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfig: APIConfig;
  onConfigChange: (config: APIConfig) => void;
}

const APIManager: React.FC<APIManagerProps> = ({ isOpen, onClose, apiConfig, onConfigChange }) => {
  const [config, setConfig] = useState<APIConfig>(apiConfig);
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    perplexity: false,
    doubao: false
  });
  const [testResults, setTestResults] = useState<{[key: string]: APITestResult | null}>({
    gemini: null,
    perplexity: null,
    doubao: null
  });
  const [testing, setTesting] = useState<{[key: string]: boolean}>({
    gemini: false,
    perplexity: false,
    doubao: false
  });

  // 默认配置
  const defaultConfig: APIConfig = {
    gemini: {
      apiKey: 'AIzaSyAH-wepOrQu0ujJfeqbcz2Pn7wHHvLihxg',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      model: 'gemini-2.0-flash'
    },
    perplexity: {
      apiKey: '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',
      endpoint: 'https://api.perplexity.ai/v1/query'
    },
    doubao: {
      apiKey: 'ca9d6a48-f76d-4c29-a621-2cf259a55b2f',
      endpoint: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      model: 'doubao-seedream-3-0-t2i-250415'
    }
  };

  useEffect(() => {
    setConfig(apiConfig);
  }, [apiConfig]);

  // 测试API连接
  const testAPI = async (apiType: 'gemini' | 'perplexity' | 'doubao') => {
    setTesting(prev => ({ ...prev, [apiType]: true }));
    const startTime = Date.now();

    try {
      let success = false;
      let message = '';

      switch (apiType) {
        case 'gemini':
          success = await testGeminiAPI(config.gemini);
          message = success ? 'Gemini API连接成功' : 'Gemini API连接失败';
          break;
        case 'perplexity':
          success = await testPerplexityAPI(config.perplexity);
          message = success ? 'Perplexity API连接成功' : 'Perplexity API连接失败';
          break;
        case 'doubao':
          success = await testDoubaoAPI(config.doubao);
          message = success ? '豆包生图API连接成功' : '豆包生图API连接失败';
          break;
      }

      const responseTime = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [apiType]: { success, message, responseTime }
      }));

      if (success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [apiType]: { 
          success: false, 
          message: `${apiType} API测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
          responseTime 
        }
      }));
      toast.error(`${apiType} API测试失败`);
    } finally {
      setTesting(prev => ({ ...prev, [apiType]: false }));
    }
  };

  // 测试Gemini API
  const testGeminiAPI = async (geminiConfig: APIConfig['gemini']): Promise<boolean> => {
    try {
      const response = await fetch(geminiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiConfig.apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "测试连接，请回复'连接成功'"
            }]
          }]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Gemini API测试失败:', error);
      return false;
    }
  };

  // 测试Perplexity API
  const testPerplexityAPI = async (perplexityConfig: APIConfig['perplexity']): Promise<boolean> => {
    try {
      const response = await fetch(perplexityConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${perplexityConfig.apiKey}`
        },
        body: JSON.stringify({
          query: '测试连接',
          model: 'llama-3.1-sonar-large-128k-online'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Perplexity API测试失败:', error);
      return false;
    }
  };

  // 测试豆包生图API
  const testDoubaoAPI = async (doubaoConfig: APIConfig['doubao']): Promise<boolean> => {
    try {
      const response = await fetch(doubaoConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${doubaoConfig.apiKey}`
        },
        body: JSON.stringify({
          model: doubaoConfig.model,
          prompt: '测试图片',
          response_format: 'url',
          size: '1024x1024',
          guidance_scale: 3,
          watermark: true
        })
      });

      return response.ok;
    } catch (error) {
      console.error('豆包API测试失败:', error);
      return false;
    }
  };

  // 重置为默认配置
  const resetToDefault = () => {
    setConfig(defaultConfig);
    setTestResults({
      gemini: null,
      perplexity: null,
      doubao: null
    });
    toast.success('已重置为默认配置');
  };

  // 保存配置
  const saveConfig = () => {
    onConfigChange(config);
    toast.success('API配置已保存');
    onClose();
  };

  // 切换密钥显示
  const toggleShowKey = (apiType: 'gemini' | 'perplexity' | 'doubao') => {
    setShowKeys(prev => ({ ...prev, [apiType]: !prev[apiType] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">API管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Google Gemini API */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Google Gemini API</h3>
              <div className="flex items-center gap-2">
                {testResults.gemini && (
                  <div className={`flex items-center gap-1 text-sm ${
                    testResults.gemini.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResults.gemini.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {testResults.gemini.message}
                    {testResults.gemini.responseTime && (
                      <span className="text-gray-500">({testResults.gemini.responseTime}ms)</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => testAPI('gemini')}
                  disabled={testing.gemini}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors"
                >
                  {testing.gemini ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  测试连接
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={config.gemini.apiKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      gemini: { ...prev.gemini, apiKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="输入Gemini API密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('gemini')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">模型</label>
                <input
                  type="text"
                  value={config.gemini.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    gemini: { ...prev.gemini, model: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="gemini-2.0-flash"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API端点</label>
              <input
                type="text"
                value={config.gemini.endpoint}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  gemini: { ...prev.gemini, endpoint: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
              />
            </div>
          </div>

          {/* Perplexity API */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Perplexity API</h3>
              <div className="flex items-center gap-2">
                {testResults.perplexity && (
                  <div className={`flex items-center gap-1 text-sm ${
                    testResults.perplexity.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResults.perplexity.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {testResults.perplexity.message}
                    {testResults.perplexity.responseTime && (
                      <span className="text-gray-500">({testResults.perplexity.responseTime}ms)</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => testAPI('perplexity')}
                  disabled={testing.perplexity}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors"
                >
                  {testing.perplexity ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  测试连接
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
                <div className="relative">
                  <input
                    type={showKeys.perplexity ? 'text' : 'password'}
                    value={config.perplexity.apiKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      perplexity: { ...prev.perplexity, apiKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="输入Perplexity API密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('perplexity')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.perplexity ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API端点</label>
                <input
                  type="text"
                  value={config.perplexity.endpoint}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    perplexity: { ...prev.perplexity, endpoint: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="https://api.perplexity.ai/v1/query"
                />
              </div>
            </div>
          </div>

          {/* 豆包生图API */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">豆包生图API</h3>
              <div className="flex items-center gap-2">
                {testResults.doubao && (
                  <div className={`flex items-center gap-1 text-sm ${
                    testResults.doubao.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResults.doubao.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {testResults.doubao.message}
                    {testResults.doubao.responseTime && (
                      <span className="text-gray-500">({testResults.doubao.responseTime}ms)</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => testAPI('doubao')}
                  disabled={testing.doubao}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors"
                >
                  {testing.doubao ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  测试连接
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
                <div className="relative">
                  <input
                    type={showKeys.doubao ? 'text' : 'password'}
                    value={config.doubao.apiKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      doubao: { ...prev.doubao, apiKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="输入豆包API密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('doubao')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.doubao ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">模型</label>
                <input
                  type="text"
                  value={config.doubao.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    doubao: { ...prev.doubao, model: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="doubao-seedream-3-0-t2i-250415"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API端点</label>
              <input
                type="text"
                value={config.doubao.endpoint}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  doubao: { ...prev.doubao, endpoint: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="https://ark.cn-beijing.volces.com/api/v3/images/generations"
              />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={resetToDefault}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            重置为默认配置
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={saveConfig}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIManager;
