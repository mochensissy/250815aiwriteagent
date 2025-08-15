/**
 * 本地存储管理工具
 * 
 * 管理应用数据在localStorage中的存储和读取
 * 包括知识库、风格设置、文章草稿等数据的持久化
 */

import { AppState, KnowledgeBaseArticle, StyleElement, TermMapping, WritingRule } from '../types';

const STORAGE_KEYS = {
  KNOWLEDGE_BASE: 'ai_writer_knowledge_base',
  STYLE_ELEMENTS: 'ai_writer_style_elements',
  TERM_MAPPINGS: 'ai_writer_term_mappings',
  WRITING_RULES: 'ai_writer_writing_rules',
  CURRENT_ARTICLE: 'ai_writer_current_article'
};

/**
 * 获取知识库文章列表
 */
export const getKnowledgeBase = (): KnowledgeBaseArticle[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
  return stored ? JSON.parse(stored) : [];
};

/**
 * 保存知识库文章列表
 */
export const saveKnowledgeBase = (articles: KnowledgeBaseArticle[]): void => {
  localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(articles));
};

/**
 * 获取风格要素列表
 */
export const getStyleElements = (): StyleElement[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.STYLE_ELEMENTS);
  return stored ? JSON.parse(stored) : [];
};

/**
 * 保存风格要素列表
 */
export const saveStyleElements = (elements: StyleElement[]): void => {
  localStorage.setItem(STORAGE_KEYS.STYLE_ELEMENTS, JSON.stringify(elements));
};

/**
 * 获取术语映射列表
 */
export const getTermMappings = (): TermMapping[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TERM_MAPPINGS);
  return stored ? JSON.parse(stored) : [];
};

/**
 * 保存术语映射列表
 */
export const saveTermMappings = (mappings: TermMapping[]): void => {
  localStorage.setItem(STORAGE_KEYS.TERM_MAPPINGS, JSON.stringify(mappings));
};

/**
 * 获取行文准则列表
 */
export const getWritingRules = (): WritingRule[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.WRITING_RULES);
  return stored ? JSON.parse(stored) : [];
};

/**
 * 保存行文准则列表
 */
export const saveWritingRules = (rules: WritingRule[]): void => {
  localStorage.setItem(STORAGE_KEYS.WRITING_RULES, JSON.stringify(rules));
};

/**
 * 获取当前文章草稿
 */
export const getCurrentArticle = (): AppState['currentArticle'] | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_ARTICLE);
  return stored ? JSON.parse(stored) : null;
};

/**
 * 保存当前文章草稿
 */
export const saveCurrentArticle = (article: AppState['currentArticle']): void => {
  if (article) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ARTICLE, JSON.stringify(article));
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