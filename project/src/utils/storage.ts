/**
 * 本地存储管理工具
 * 
 * 管理应用数据在localStorage中的存储和读取
 * 包括知识库、风格设置、文章草稿等数据的持久化
 */

import { AppState, KnowledgeBaseArticle, StyleElement, TermMapping, WritingRule, APIConfig } from '../types';

const STORAGE_KEYS = {
  KNOWLEDGE_BASE: 'ai_writer_knowledge_base',
  STYLE_ELEMENTS: 'ai_writer_style_elements',
  TERM_MAPPINGS: 'ai_writer_term_mappings',
  WRITING_RULES: 'ai_writer_writing_rules',
  CURRENT_ARTICLE: 'ai_writer_current_article',
  API_CONFIG: 'ai_writer_api_config'
};

/**
 * 获取知识库文章列表
 */
export const getKnowledgeBase = (): KnowledgeBaseArticle[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
  return safeJsonParse(stored, []);
};

/**
 * 保存知识库文章列表
 */
export const saveKnowledgeBase = (articles: KnowledgeBaseArticle[]): void => {
  const serialized = safeJsonStringify(articles);
  if (serialized) {
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, serialized);
  }
};

/**
 * 获取风格要素列表
 */
export const getStyleElements = (): StyleElement[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.STYLE_ELEMENTS);
  return safeJsonParse(stored, []);
};

/**
 * 保存风格要素列表
 */
export const saveStyleElements = (elements: StyleElement[]): void => {
  const serialized = safeJsonStringify(elements);
  if (serialized) {
    localStorage.setItem(STORAGE_KEYS.STYLE_ELEMENTS, serialized);
  }
};

/**
 * 获取术语映射列表
 */
export const getTermMappings = (): TermMapping[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TERM_MAPPINGS);
  return safeJsonParse(stored, []);
};

/**
 * 保存术语映射列表
 */
export const saveTermMappings = (mappings: TermMapping[]): void => {
  const serialized = safeJsonStringify(mappings);
  if (serialized) {
    localStorage.setItem(STORAGE_KEYS.TERM_MAPPINGS, serialized);
  }
};

/**
 * 获取行文准则列表
 */
export const getWritingRules = (): WritingRule[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.WRITING_RULES);
  return safeJsonParse(stored, []);
};

/**
 * 保存行文准则列表
 */
export const saveWritingRules = (rules: WritingRule[]): void => {
  const serialized = safeJsonStringify(rules);
  if (serialized) {
    localStorage.setItem(STORAGE_KEYS.WRITING_RULES, serialized);
  }
};

/**
 * 获取当前文章草稿
 */
export const getCurrentArticle = (): AppState['currentArticle'] | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_ARTICLE);
  return safeJsonParse(stored, null);
};

/**
 * 保存当前文章草稿
 */
export const saveCurrentArticle = (article: AppState['currentArticle']): void => {
  if (article) {
    const serialized = safeJsonStringify(article);
    if (serialized) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ARTICLE, serialized);
    }
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ARTICLE);
  }
};

/**
 * 清除所有存储数据
 */
export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * 安全的JSON解析，包含错误处理
 */
const safeJsonParse = <T>(str: string | null, defaultValue: T): T => {
  if (!str) return defaultValue;
  
  try {
    const parsed = JSON.parse(str);
    return parsed !== null ? parsed : defaultValue;
  } catch (error) {
    console.warn('JSON解析失败，使用默认值:', error);
    return defaultValue;
  }
};

/**
 * 安全的JSON字符串化，包含错误处理
 */
const safeJsonStringify = (data: any): string | null => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('JSON序列化失败:', error);
    return null;
  }
};

/**
 * 检查localStorage可用性
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * 获取存储使用情况统计
 */
export const getStorageUsage = (): {
  used: number;
  available: number;
  percentage: number;
  items: Array<{ key: string; size: number }>;
} => {
  if (!isLocalStorageAvailable()) {
    return { used: 0, available: 0, percentage: 0, items: [] };
  }

  let totalSize = 0;
  const items: Array<{ key: string; size: number }> = [];

  Object.values(STORAGE_KEYS).forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      const size = new Blob([value]).size;
      totalSize += size;
      items.push({ key, size });
    }
  });

  // 大多数浏览器localStorage限制为5MB
  const maxSize = 5 * 1024 * 1024;
  const available = maxSize - totalSize;
  const percentage = (totalSize / maxSize) * 100;

  return {
    used: totalSize,
    available,
    percentage,
    items: items.sort((a, b) => b.size - a.size)
  };
};

/**
 * 导出所有数据为JSON
 */
export const exportAllData = (): string | null => {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage不可用');
  }

  const exportData: Record<string, any> = {};
  
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const value = localStorage.getItem(key);
    if (value) {
      exportData[name] = safeJsonParse(value, null);
    }
  });

  exportData._exportedAt = new Date().toISOString();
  exportData._version = '1.0';

  return safeJsonStringify(exportData);
};

/**
 * 从JSON导入数据
 */
export const importAllData = (jsonData: string): boolean => {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage不可用');
  }

  try {
    const importData = JSON.parse(jsonData);
    
    // 验证导入数据格式
    if (!importData || typeof importData !== 'object') {
      throw new Error('无效的导入数据格式');
    }

    // 清除现有数据
    clearAllData();

    // 导入数据
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (importData[name]) {
        const serialized = safeJsonStringify(importData[name]);
        if (serialized) {
          localStorage.setItem(key, serialized);
        }
      }
    });

    console.log('数据导入成功:', {
      exportedAt: importData._exportedAt,
      version: importData._version
    });

    return true;
  } catch (error) {
    console.error('数据导入失败:', error);
    return false;
  }
};

/**
 * 备份当前数据到本地文件
 */
export const downloadDataBackup = (): void => {
  try {
    const data = exportAllData();
    if (!data) {
      throw new Error('数据导出失败');
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-writer-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('数据备份失败:', error);
    throw error;
  }
};

/**
 * 从文件恢复数据
 */
export const restoreDataFromFile = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importAllData(content);
        resolve(success);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * 数据迁移和版本升级工具
 */
export const migrateData = (): void => {
  const currentVersion = '1.0';
  const versionKey = 'ai_writer_data_version';
  const storedVersion = localStorage.getItem(versionKey);
  
  if (storedVersion === currentVersion) {
    return; // 无需迁移
  }

  console.log(`开始数据迁移: ${storedVersion} -> ${currentVersion}`);
  
  // 这里可以添加具体的数据迁移逻辑
  // 例如：重命名字段、转换数据格式等
  
  localStorage.setItem(versionKey, currentVersion);
  console.log('数据迁移完成');
};

/**
 * 定期清理过期数据
 */
export const cleanupExpiredData = (): void => {
  // 这里可以添加清理逻辑
  // 例如：删除超过一定时间的草稿、清理无效的图片链接等
  console.log('执行数据清理...');
};

/**
 * 初始化存储系统
 */
export const initializeStorage = (): void => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage不可用，某些功能可能受限');
    return;
  }

  // 执行数据迁移
  migrateData();
  
  // 清理过期数据
  cleanupExpiredData();
  
  // 检查存储使用情况
  const usage = getStorageUsage();
  if (usage.percentage > 80) {
    console.warn('存储空间使用率超过80%，建议清理数据');
  }

  console.log('存储系统初始化完成');
};

/**
 * 获取API配置
 */
export const getAPIConfig = (): APIConfig => {
  if (!isLocalStorageAvailable()) {
    return getDefaultAPIConfig();
  }
  
  const stored = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
  if (!stored) {
    return getDefaultAPIConfig();
  }
  
  const parsed = safeJsonParse(stored, null);
  if (!parsed) {
    return getDefaultAPIConfig();
  }
  
  // 确保配置结构完整
  return {
    gemini: {
      apiKey: parsed.gemini?.apiKey || '',
      endpoint: parsed.gemini?.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      model: parsed.gemini?.model || 'gemini-2.0-flash'
    },
    perplexity: {
      apiKey: parsed.perplexity?.apiKey || '',
      endpoint: parsed.perplexity?.endpoint || 'https://api.perplexity.ai/v1/query'
    },
    doubao: {
      apiKey: parsed.doubao?.apiKey || '',
      endpoint: parsed.doubao?.endpoint || 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      model: parsed.doubao?.model || 'doubao-seedream-3-0-t2i-250415'
    }
  };
};

/**
 * 保存API配置
 */
export const saveAPIConfig = (config: APIConfig): void => {
  if (isLocalStorageAvailable()) {
    const serialized = safeJsonStringify(config);
    if (serialized) {
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, serialized);
    }
  }
};

/**
 * 获取默认API配置
 */
export const getDefaultAPIConfig = (): APIConfig => {
  return {
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
};