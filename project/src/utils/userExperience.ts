/**
 * 用户体验改进工具函数
 * 
 * 提供各种用户体验优化功能
 */

import toast from 'react-hot-toast';

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string, successMessage?: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 现代浏览器的异步API
      await navigator.clipboard.writeText(text);
    } else {
      // 兼容旧浏览器的同步API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('复制失败');
      }
    }
    
    if (successMessage) {
      toast.success(successMessage);
    }
    return true;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    toast.error('复制失败，请手动复制');
    return false;
  }
};

/**
 * 下载文本文件
 */
export const downloadTextFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    toast.success(`文件 ${filename} 下载成功`);
  } catch (error) {
    console.error('文件下载失败:', error);
    toast.error('文件下载失败');
  }
};

/**
 * 🚀 增强版多格式导出功能
 */
export const exportArticle = {
  /**
   * 导出为Markdown格式
   */
  asMarkdown: (content: string, title?: string): void => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = title ? `${title.replace(/[^\w\s]/gi, '')}_${timestamp}.md` : `article_${timestamp}.md`;
    downloadTextFile(content, filename, 'text/markdown');
  },
  
  /**
   * 导出为纯文本格式
   */
  asText: (content: string, title?: string): void => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = title ? `${title.replace(/[^\w\s]/gi, '')}_${timestamp}.txt` : `article_${timestamp}.txt`;
    downloadTextFile(content, filename, 'text/plain');
  },
  
  /**
   * 导出为HTML格式（带样式）
   */
  asHTML: (content: string, title?: string): void => {
    const htmlContent = convertMarkdownToHTML(content, title);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = title ? `${title.replace(/[^\w\s]/gi, '')}_${timestamp}.html` : `article_${timestamp}.html`;
    downloadTextFile(htmlContent, filename, 'text/html');
  },
  
  /**
   * 复制为富文本格式（适合直接粘贴到公众号）
   */
  copyAsRichText: async (content: string): Promise<boolean> => {
    try {
      // 转换Markdown为富文本
      const richTextContent = convertMarkdownToRichText(content);
      return await copyToClipboard(richTextContent, '✨ 富文本格式已复制！可直接粘贴到微信公众号编辑器');
    } catch (error) {
      console.error('富文本复制失败:', error);
      toast.error('富文本复制失败，请使用普通复制');
      return false;
    }
  },

  /**
   * 🚀 复制HTML格式（保持样式的富文本）
   */
  copyAsHTML: async (content: string): Promise<boolean> => {
    try {
      const htmlContent = convertMarkdownToStyledHTML(content);
      
      // 创建一个临时的div来复制HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      // 选择HTML内容
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // 复制到剪贴板
      const success = document.execCommand('copy');
      
      // 清理
      document.body.removeChild(tempDiv);
      selection?.removeAllRanges();
      
      if (success) {
        toast.success('🎨 HTML格式已复制！可直接粘贴到公众号，保持样式');
        return true;
      } else {
        throw new Error('HTML复制失败');
      }
    } catch (error) {
      console.error('HTML复制失败:', error);
      toast.error('HTML复制失败，请使用普通复制');
      return false;
    }
  },
  
  /**
   * 导出为JSON格式（包含元数据）
   */
  asJSON: (content: string, metadata: any = {}, title?: string): void => {
    const exportData = {
      title: title || '未命名文章',
      content,
      metadata: {
        ...metadata,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        format: 'AI写作助手导出'
      }
    };
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = title ? `${title.replace(/[^\w\s]/gi, '')}_${timestamp}.json` : `article_${timestamp}.json`;
    downloadTextFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
  }
};

/**
 * 🚀 专门用于微信公众号的样式化HTML转换
 */
const convertMarkdownToStyledHTML = (markdown: string): string => {
  let html = markdown
    // 标题转换 - 微信公众号样式
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 20px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e5e5; line-height: 1.4;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: bold; color: #333; margin: 25px 0 12px 0; line-height: 1.4; position: relative; padding-left: 15px;"><span style="position: absolute; left: 0; top: 0; width: 4px; height: 100%; background-color: #4285f4;"></span>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: bold; color: #333; margin: 20px 0 10px 0; line-height: 1.4;">• $1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 style="font-size: 16px; font-weight: 600; color: #333; margin: 18px 0 8px 0; line-height: 1.4;">▪ $1</h4>')
    
    // 粗体和斜体 - 微信公众号样式
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #333; background-color: #fff3cd; padding: 2px 4px; border-radius: 3px;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #4285f4; font-weight: 500;">$1</em>')
    
    // 链接 - 保持可点击
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #4285f4; text-decoration: none; border-bottom: 1px dotted #4285f4;">$1</a>')
    
    // 图片 - 居中显示
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div style="text-align: center; margin: 20px 0;"><img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e5e5;"><p style="font-size: 14px; color: #666; margin-top: 8px; font-style: italic;">$1</p></div>')
    
    // 处理段落
    .split('\n\n')
    .map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // 处理列表
      if (paragraph.includes('\n- ') || paragraph.includes('\n* ')) {
        const listItems = paragraph.split('\n').filter(line => line.trim().match(/^[\-\*]\s+/));
        const listHTML = listItems.map(item => {
          const content = item.replace(/^[\-\*]\s+/, '');
          return `<li style="margin: 8px 0; line-height: 1.6; display: flex; align-items: flex-start;"><span style="color: #4285f4; margin-right: 8px; font-weight: bold;">•</span><span style="flex: 1;">${content}</span></li>`;
        }).join('');
        return `<ul style="margin: 15px 0; padding-left: 0; list-style: none;">${listHTML}</ul>`;
      }
      
      // 处理有序列表
      if (paragraph.includes('\n1. ') || /\n\d+\.\s+/.test(paragraph)) {
        const listItems = paragraph.split('\n').filter(line => line.trim().match(/^\d+\.\s+/));
        const listHTML = listItems.map((item, index) => {
          const content = item.replace(/^\d+\.\s+/, '');
          return `<li style="margin: 8px 0; line-height: 1.6; display: flex; align-items: flex-start;"><span style="color: #4285f4; margin-right: 8px; font-weight: bold; min-width: 20px;">${index + 1}.</span><span style="flex: 1;">${content}</span></li>`;
        }).join('');
        return `<ol style="margin: 15px 0; padding-left: 0; list-style: none;">${listHTML}</ol>`;
      }
      
      // 处理引用
      if (paragraph.startsWith('>')) {
        const content = paragraph.replace(/^>\s*/, '');
        return `<blockquote style="border-left: 4px solid #4285f4; padding: 15px 20px; margin: 20px 0; background-color: #f8f9fa; border-radius: 0 8px 8px 0; font-style: italic; color: #555; position: relative;"><span style="color: #4285f4; font-size: 24px; position: absolute; top: 10px; left: 10px;">"</span><div style="margin-left: 20px;">${content}</div></blockquote>`;
      }
      
      // 普通段落
      return `<p style="color: #333; margin: 15px 0; line-height: 1.8; font-size: 16px; text-align: justify;">${paragraph.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(p => p)
    .join('');
    
  return html;
};

/**
 * 🎨 Markdown转HTML工具函数
 */
const convertMarkdownToHTML = (markdown: string, title?: string): string => {
  let html = markdown
    // 标题转换
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">')
    // 段落
    .split('\n\n')
    .map(paragraph => paragraph.trim() ? `<p>${paragraph.replace(/\n/g, '<br>')}</p>` : '')
    .join('');

  // 构建完整HTML文档
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || '文章'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
        }
        .article {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1, h2, h3 { color: #2c3e50; margin-top: 30px; margin-bottom: 15px; }
        h1 { font-size: 2em; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.2em; }
        p { margin-bottom: 15px; }
        img { display: block; margin: 20px auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .meta { color: #7f8c8d; font-size: 0.9em; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1; }
    </style>
</head>
<body>
    <div class="article">
        ${html}
        <div class="meta">
            <p>📝 由AI写作助手生成 • ${new Date().toLocaleDateString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * 🎨 Markdown转富文本格式（保持结构，优化微信公众号显示）
 */
const convertMarkdownToRichText = (markdown: string): string => {
  return markdown
    // 处理标题 - 保持层级结构但用可视化方式
    .replace(/^# (.*$)/gm, '📝 $1\n\n') // 一级标题
    .replace(/^## (.*$)/gm, '🔸 $1\n\n') // 二级标题  
    .replace(/^### (.*$)/gm, '• $1\n\n') // 三级标题
    .replace(/^#### (.*$)/gm, '▪ $1\n\n') // 四级标题
    
    // 处理强调格式 - 转换为视觉符号
    .replace(/\*\*(.*?)\*\*/g, '【$1】') // 粗体转为中文方括号
    .replace(/\*(.*?)\*/g, '「$1」') // 斜体转为中文引号
    
    // 处理链接 - 保留有用信息
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // 保留链接文字
    
    // 处理图片 - 用中文占位符
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '\n📷 [配图]\n\n') // 图片占位符
    
    // 处理列表 - 保持列表结构
    .replace(/^[\s]*-[\s]+(.+)$/gm, '◦ $1') // 无序列表
    .replace(/^[\s]*\*[\s]+(.+)$/gm, '◦ $1') // 无序列表(星号)
    .replace(/^[\s]*\d+\.[\s]+(.+)$/gm, (match, p1, offset, string) => {
      // 有序列表 - 自动编号
      const lines = string.substring(0, offset).split('\n');
      const listCount = lines.filter(line => /^[\s]*\d+\.[\s]+/.test(line)).length + 1;
      return `${listCount}. ${p1}`;
    })
    
    // 处理引用 - 转换为易识别格式
    .replace(/^>\s*(.+)$/gm, '💭 $1') // 引用块
    
    // 处理代码 - 用中文标识
    .replace(/```[\s\S]*?```/g, '\n📋 [代码块]\n\n') // 代码块占位符
    .replace(/`([^`]+)`/g, '『$1』') // 行内代码用书名号
    
    // 清理多余的空行，但保持段落结构
    .replace(/\n{3,}/g, '\n\n') // 最多保持两个换行
    .replace(/^\n+/, '') // 移除开头的空行
    .replace(/\n+$/, '') // 移除结尾的空行
    .trim();
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化时间间隔
 */
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}小时前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}天前`;
  } else {
    return past.toLocaleDateString('zh-CN');
  }
};

/**
 * 截断文本
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * 高亮搜索关键词
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) {
    return text;
  }
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
};

/**
 * 平滑滚动到元素
 */
export const smoothScrollTo = (elementId: string, offset: number = 0): void => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

/**
 * 检测设备类型
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
  
  if (isMobile && !isTablet) {
    return 'mobile';
  } else if (isTablet) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * 防止重复点击
 */
export const preventDoubleClick = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 1000
): T => {
  let isClicking = false;
  
  return ((...args: Parameters<T>) => {
    if (isClicking) {
      return;
    }
    
    isClicking = true;
    setTimeout(() => {
      isClicking = false;
    }, delay);
    
    return func(...args);
  }) as T;
};

/**
 * 生成随机ID
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证URL格式
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * 颜色工具函数
 */
export const colorUtils = {
  /**
   * 十六进制转RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  
  /**
   * RGB转十六进制
   */
  rgbToHex: (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },
  
  /**
   * 获取对比色（黑或白）
   */
  getContrastColor: (hex: string): string => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return '#000000';
    
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
};

/**
 * 本地存储工具（带错误处理）
 */
export const safeStorage = {
  get: (key: string, defaultValue: any = null): any => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`读取localStorage失败 (${key}):`, error);
      return defaultValue;
    }
  },
  
  set: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`写入localStorage失败 (${key}):`, error);
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`删除localStorage失败 (${key}):`, error);
      return false;
    }
  }
};
