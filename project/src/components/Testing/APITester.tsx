/**
 * API测试组件
 * 
 * 提供可视化的API测试界面，方便开发者验证各个API服务的连接状态
 * 包含详细的测试结果展示和错误信息
 */

import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock, Loader, RefreshCw } from 'lucide-react';
import { runAllTests, TestResult } from '../../utils/testApi';
import toast from 'react-hot-toast';

interface APITesterProps {
  isOpen: boolean;
  onClose: () => void;
}

const APITester: React.FC<APITesterProps> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{[key: string]: TestResult} | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // 运行所有测试
  const handleRunTests = async () => {
    setTesting(true);
    setStartTime(Date.now());
    setResults(null);
    
    try {
      toast.loading('正在运行API测试...', { id: 'api-test' });
      const testResults = await runAllTests();
      setResults(testResults);
      
      const successCount = Object.values(testResults).filter(r => r.success).length;
      const totalCount = Object.keys(testResults).length;
      
      if (successCount === totalCount) {
        toast.success(`所有测试通过！(${successCount}/${totalCount})`, { id: 'api-test' });
      } else {
        toast.error(`部分测试失败 (${successCount}/${totalCount})`, { id: 'api-test' });
      }
    } catch (error) {
      console.error('测试运行失败:', error);
      toast.error('测试运行失败', { id: 'api-test' });
    } finally {
      setTesting(false);
    }
  };

  // 重置测试结果
  const handleReset = () => {
    setResults(null);
    setStartTime(null);
  };

  // 获取测试项的显示信息
  const getTestInfo = (key: string) => {
    const testInfoMap: {[key: string]: {name: string, description: string, color: string}} = {
      gemini: {
        name: 'Gemini API',
        description: '大模型文本生成服务',
        color: 'blue'
      },
      perplexity: {
        name: 'Perplexity API',
        description: '外部搜索增强服务',
        color: 'purple'
      },
      doubao: {
        name: '豆包生图API',
        description: '图片生成服务',
        color: 'green'
      },
      outline: {
        name: '大纲生成',
        description: '基于草稿生成文章大纲',
        color: 'orange'
      },
      article: {
        name: '文章生成',
        description: '基于大纲生成完整文章',
        color: 'red'
      }
    };
    
    return testInfoMap[key] || {
      name: key,
      description: '未知测试项',
      color: 'gray'
    };
  };

  // 格式化响应时间
  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">API功能测试</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* 控制按钮 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRunTests}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                {testing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {testing ? '测试中...' : '运行所有测试'}
              </button>
              
              {results && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  重置
                </button>
              )}
            </div>
            
            {startTime && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                开始时间: {new Date(startTime).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* 测试说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">测试说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 此测试将验证所有API服务的连接状态和基本功能</li>
              <li>• 包括Gemini文本生成、Perplexity搜索、豆包图片生成等</li>
              <li>• 测试过程中会产生少量API调用费用</li>
              <li>• 请确保已正确配置所有API密钥</li>
            </ul>
          </div>

          {/* 测试结果 */}
          {results && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">测试结果</h3>
              
              {Object.entries(results).map(([key, result]) => {
                const testInfo = getTestInfo(key);
                
                return (
                  <div
                    key={key}
                    className={`border rounded-lg p-4 ${
                      result.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        
                        <div>
                          <h4 className={`font-medium ${
                            result.success ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {testInfo.name}
                          </h4>
                          <p className={`text-sm ${
                            result.success ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {testInfo.description}
                          </p>
                          
                          <div className="mt-2">
                            <p className={`text-sm font-medium ${
                              result.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {result.message}
                            </p>
                            
                            {result.error && (
                              <p className="text-sm text-red-600 mt-1">
                                错误: {result.error}
                              </p>
                            )}
                            
                            {result.data && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <p className="text-xs text-gray-600 mb-1">返回数据:</p>
                                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                  {typeof result.data === 'string' 
                                    ? result.data 
                                    : JSON.stringify(result.data, null, 2)
                                  }
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          result.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.success ? '通过' : '失败'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatResponseTime(result.responseTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* 测试总结 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">测试总结</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">总测试项:</span>
                    <span className="ml-2 font-medium">{Object.keys(results).length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">通过:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {Object.values(results).filter(r => r.success).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">失败:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {Object.values(results).filter(r => !r.success).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">总耗时:</span>
                    <span className="ml-2 font-medium">
                      {formatResponseTime(
                        Math.max(...Object.values(results).map(r => r.responseTime))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {testing && !results && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">正在运行API测试，请稍候...</p>
              <p className="text-sm text-gray-500 mt-2">
                这可能需要几十秒时间，请耐心等待
              </p>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default APITester;
