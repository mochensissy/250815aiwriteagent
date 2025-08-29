/**
 * 性能优化工具函数
 * 
 * 提供防抖、节流等性能优化功能
 */

/**
 * 防抖函数 - 延迟执行，多次调用只执行最后一次
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数 - 限制执行频率
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 异步防抖函数 - 用于异步操作
 */
export function asyncDebounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let resolvePromise: ((value: any) => void) | null = null;
  let rejectPromise: ((reason?: any) => void) | null = null;
  
  return function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);
        if (rejectPromise) {
          rejectPromise(new Error('Debounced'));
        }
      }
      
      resolvePromise = resolve;
      rejectPromise = reject;
      
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (resolvePromise) {
            resolvePromise(result);
          }
        } catch (error) {
          if (rejectPromise) {
            rejectPromise(error);
          }
        } finally {
          timeout = null;
          resolvePromise = null;
          rejectPromise = null;
        }
      }, wait);
    });
  };
}

/**
 * 缓存函数结果
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * 批量处理函数 - 将多个调用合并为一次处理
 */
export function batchProcess<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  batchSize: number = 10,
  delay: number = 100
): (item: T) => Promise<R> {
  let batch: T[] = [];
  let promises: Array<{
    resolve: (value: R) => void;
    reject: (reason?: any) => void;
  }> = [];
  let timeout: NodeJS.Timeout | null = null;
  
  const processBatch = async () => {
    if (batch.length === 0) return;
    
    const currentBatch = [...batch];
    const currentPromises = [...promises];
    
    batch = [];
    promises = [];
    timeout = null;
    
    try {
      const results = await processor(currentBatch);
      currentPromises.forEach((promise, index) => {
        promise.resolve(results[index]);
      });
    } catch (error) {
      currentPromises.forEach(promise => {
        promise.reject(error);
      });
    }
  };
  
  return (item: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      batch.push(item);
      promises.push({ resolve, reject });
      
      if (batch.length >= batchSize) {
        if (timeout) {
          clearTimeout(timeout);
        }
        processBatch();
      } else if (!timeout) {
        timeout = setTimeout(processBatch, delay);
      }
    });
  };
}

/**
 * 重试函数 - 失败时自动重试
 */
export async function retry<T>(
  func: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await func();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

/**
 * 超时控制函数
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    })
  ]);
}
