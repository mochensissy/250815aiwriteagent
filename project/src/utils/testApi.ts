/**
 * API测试工具
 * 用于验证API配置是否正确
 */

import { callGeminiAPI } from './api';

export const testGeminiAPI = async (): Promise<boolean> => {
  try {
    console.log('🧪 测试Gemini API连接...');
    const result = await callGeminiAPI('请回复"API连接成功"');
    console.log('✅ Gemini API测试结果:', result);
    return result.includes('API连接成功') || result.includes('成功') || result.length > 0;
  } catch (error) {
    console.error('❌ Gemini API测试失败:', error);
    return false;
  }
};


