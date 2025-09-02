/**
 * 统一错误处理工具
 * 
 * 提供统一的错误处理、日志记录和用户反馈机制
 */

import { showToast } from '../components/Common/Toast';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  additionalData?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly isUserFacing: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context: ErrorContext = {},
    isUserFacing: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = { ...context, timestamp: new Date() };
    this.isUserFacing = isUserFacing;
  }
}

export class APIError extends AppError {
  constructor(
    message: string,
    code: string = 'API_ERROR',
    context: ErrorContext = {}
  ) {
    super(message, code, context, true);
    this.name = 'APIError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    context: ErrorContext = {}
  ) {
    super(message, 'VALIDATION_ERROR', { ...context, field }, true);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string = '网络连接异常，请检查网络设置',
    context: ErrorContext = {}
  ) {
    super(message, 'NETWORK_ERROR', context, true);
    this.name = 'NetworkError';
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误
   */
  handle(error: Error, context: ErrorContext = {}): void {
    // 记录错误
    this.log(error, context);

    // 根据错误类型决定如何处理
    if (error instanceof AppError) {
      this.handleAppError(error);
    } else if (error.name === 'NetworkError' || error.message.includes('fetch failed')) {
      this.handleNetworkError(error, context);
    } else if (error.name === 'TypeError' && error.message.includes('API')) {
      this.handleAPIError(error, context);
    } else {
      this.handleGenericError(error, context);
    }
  }

  /**
   * 记录错误
   */
  private log(error: Error, context: ErrorContext): void {
    const logEntry = {
      error,
      context: { ...context, timestamp: new Date() },
      timestamp: new Date()
    };

    this.errorLog.push(logEntry);

    // 控制台输出详细信息
    console.group(`🚨 Error in ${context.component || 'Unknown Component'}`);
    console.error('Error:', error);
    console.error('Context:', context);
    console.error('Stack:', error.stack);
    console.groupEnd();

    // 在开发环境中，可以发送到错误监控服务
    if (process.env.NODE_ENV === 'development') {
      // 这里可以集成 Sentry 等错误监控服务
    }
  }

  /**
   * 处理应用错误
   */
  private handleAppError(error: AppError): void {
    if (!error.isUserFacing) return;

    const action = this.getRetryAction(error.context);

    switch (error.code) {
      case 'API_ERROR':
        showToast.error('API调用失败', error.message, action);
        break;
      case 'VALIDATION_ERROR':
        showToast.warning('输入验证失败', error.message);
        break;
      case 'NETWORK_ERROR':
        showToast.error('网络连接异常', error.message, action);
        break;
      default:
        showToast.error('操作失败', error.message, action);
    }
  }

  /**
   * 处理网络错误
   */
  private handleNetworkError(error: Error, context: ErrorContext): void {
    const action = this.getRetryAction(context);
    showToast.error(
      '网络连接异常',
      '请检查网络连接后重试',
      action
    );
  }

  /**
   * 处理API错误
   */
  private handleAPIError(error: Error, context: ErrorContext): void {
    const action = this.getRetryAction(context);
    showToast.error(
      'API调用失败',
      '服务暂时不可用，请稍后重试',
      action
    );
  }

  /**
   * 处理通用错误
   */
  private handleGenericError(error: Error, context: ErrorContext): void {
    const action = this.getRetryAction(context);
    showToast.error(
      '操作失败',
      '遇到意外错误，请重试',
      action
    );
  }

  /**
   * 获取重试操作
   */
  private getRetryAction(context: ErrorContext): { text: string; onClick: () => void } | undefined {
    if (context.action && typeof context.action === 'string') {
      return {
        text: '重试',
        onClick: () => {
          // 这里可以根据context.action来决定重试逻辑
          window.location.reload();
        }
      };
    }
    return undefined;
  }

  /**
   * 获取错误日志
   */
  getErrorLog(): Array<{ error: Error; context: ErrorContext; timestamp: Date }> {
    return [...this.errorLog];
  }

  /**
   * 清空错误日志
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * 便捷的错误处理函数
 */
export const handleError = (error: Error, context: ErrorContext = {}): void => {
  ErrorHandler.getInstance().handle(error, context);
};

/**
 * 异步操作错误处理装饰器
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ErrorContext = {}
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, context);
      return undefined;
    }
  };
};

/**
 * 验证函数
 */
export const validate = {
  required: (value: any, fieldName: string): void => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`${fieldName}不能为空`, fieldName);
    }
  },

  minLength: (value: string, minLength: number, fieldName: string): void => {
    if (value.length < minLength) {
      throw new ValidationError(`${fieldName}至少需要${minLength}个字符`, fieldName);
    }
  },

  maxLength: (value: string, maxLength: number, fieldName: string): void => {
    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName}不能超过${maxLength}个字符`, fieldName);
    }
  },

  email: (value: string, fieldName: string = '邮箱'): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`请输入有效的${fieldName}地址`, fieldName);
    }
  }
};

export default ErrorHandler;

