/**
 * AI写作助手应用的核心类型定义
 * 
 * 定义了应用中所有主要数据结构和接口类型
 * 包括知识库、文章、风格要素等核心概念
 */

// 知识库文章类型
export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: 'memory' | 'case'; // memory: 个人风格源, case: 外部参考源
  tags: string[];
  createdAt: string;
  source: 'upload' | 'paste' | 'url';
  url?: string;
  styleElements?: StyleElement[]; // 与该文章关联的风格要素
}

// 风格要素类型
export interface StyleElement {
  id: string;
  articleId: string; // 关联的文章ID
  description: string;
  confirmed: boolean;
  category: 'vocabulary' | 'syntax' | 'structure' | 'rhetoric';
  createdAt: Date;
}

// 个人术语映射
export interface TermMapping {
  id: string;
  original: string;
  replacement: string;
  context?: string;
}

// 行文准则
export interface WritingRule {
  id: string;
  description: string;
  active: boolean;
}

// 文章大纲节点
export interface OutlineNode {
  id: string;
  title: string;
  summary?: string; // 内容概述
  level: number;
  content?: string;
  children?: OutlineNode[];
  order: number;
}

// 推荐风格原型
export interface StylePrototype {
  id: string;
  title: string;
  description: string;
  articleId: string;
  similarity: number;
}

// 编辑建议类型
export interface EditSuggestion {
  type: 'polish' | 'expand' | 'shorten' | 'tone' | 'professional' | 'casual';
  label: string;
  icon: string;
  description?: string;
}

// 生成图片结果
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  position?: number; // 在文章中的位置
}

// API配置相关类型
export interface APIConfig {
  gemini: {
    apiKey: string;
    endpoint: string;
    model: string;
  };
  perplexity: {
    apiKey: string;
    endpoint: string;
  };
  doubao: {
    apiKey: string;
    endpoint: string;
    model: string;
  };
}

export interface APITestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

// 应用状态类型
export interface AppState {
  currentArticle?: {
    title: string;
    draft: string;
    outline: OutlineNode[];
    content: string;
    images: GeneratedImage[];
    coverImage?: GeneratedImage;
    selectedStyleContext?: string; // 选择的风格上下文，用于一致性生成
    selectedPrototypes?: StylePrototype[]; // 选择的风格原型
  };
  knowledgeBase: KnowledgeBaseArticle[];
  termMappings: TermMapping[];
  writingRules: WritingRule[];
  selectedPrototype?: StylePrototype;
  apiConfig: APIConfig;
}