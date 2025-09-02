/**
 * 性能监控和优化工具
 * 
 * 提供性能测量、内存监控、组件性能分析等功能
 * 帮助识别和解决性能瓶颈
 */

// 性能指标接口
export interface PerformanceMetrics {
  timestamp: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime?: number;
  apiCallTime?: number;
  componentName?: string;
  operation?: string;
}

// 性能监控器类
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private timers: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始计时
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * 结束计时并记录
   */
  endTimer(name: string, operation?: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // 记录性能指标
    this.recordMetric({
      timestamp: Date.now(),
      renderTime: duration,
      operation: operation || name
    });

    return duration;
  }

  /**
   * 记录性能指标
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push({
      ...metric,
      memoryUsage: this.getMemoryUsage()
    });

    // 只保留最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): { used: number; total: number; percentage: number } | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return undefined;
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    averageRenderTime: number;
    averageApiTime: number;
    memoryTrend: number[];
    slowestOperations: Array<{ operation: string; time: number }>;
  } {
    const renderTimes = this.metrics
      .filter(m => m.renderTime)
      .map(m => m.renderTime!);
    
    const apiTimes = this.metrics
      .filter(m => m.apiCallTime)
      .map(m => m.apiCallTime!);

    const memoryTrend = this.metrics
      .filter(m => m.memoryUsage)
      .map(m => m.memoryUsage!.percentage)
      .slice(-20); // 最近20个数据点

    const slowestOperations = this.metrics
      .filter(m => m.renderTime && m.renderTime > 100) // 超过100ms的操作
      .sort((a, b) => (b.renderTime || 0) - (a.renderTime || 0))
      .slice(0, 10)
      .map(m => ({
        operation: m.operation || 'Unknown',
        time: m.renderTime || 0
      }));

    return {
      averageRenderTime: renderTimes.length > 0 
        ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
        : 0,
      averageApiTime: apiTimes.length > 0 
        ? apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length 
        : 0,
      memoryTrend,
      slowestOperations
    };
  }

  /**
   * 清空性能数据
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

/**
 * 性能装饰器 - 用于函数性能监控
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.startTimer(name);
    
    try {
      const result = fn(...args);
      
      // 如果是Promise，等待完成后记录
      if (result instanceof Promise) {
        return result.finally(() => {
          monitor.endTimer(name);
        });
      } else {
        monitor.endTimer(name);
        return result;
      }
    } catch (error) {
      monitor.endTimer(name);
      throw error;
    }
  }) as T;
}

/**
 * API调用性能监控
 */
export async function monitorApiCall<T>(
  apiCall: () => Promise<T>,
  apiName: string
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    monitor.recordMetric({
      timestamp: Date.now(),
      apiCallTime: duration,
      operation: `API: ${apiName}`
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    monitor.recordMetric({
      timestamp: Date.now(),
      apiCallTime: duration,
      operation: `API: ${apiName} (Error)`
    });
    
    throw error;
  }
}

/**
 * 组件渲染性能监控Hook
 */
export function usePerformanceMonitoring(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  React.useEffect(() => {
    const timerName = `${componentName}-mount`;
    monitor.startTimer(timerName);
    
    return () => {
      monitor.endTimer(timerName, `Component: ${componentName} mount`);
    };
  }, [componentName, monitor]);

  const measureRender = React.useCallback((operationName: string) => {
    const timerName = `${componentName}-${operationName}`;
    monitor.startTimer(timerName);
    
    return () => {
      monitor.endTimer(timerName, `Component: ${componentName} ${operationName}`);
    };
  }, [componentName, monitor]);

  return { measureRender };
}

/**
 * 内存泄漏检测
 */
export class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private intervals: Set<number> = new Set();
  private timeouts: Set<number> = new Set();
  private eventListeners: Map<EventTarget, Array<{ type: string; listener: EventListener }>> = new Map();

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  /**
   * 安全的setInterval
   */
  safeSetInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  /**
   * 安全的setTimeout
   */
  safeSetTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      callback();
      this.timeouts.delete(id);
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  /**
   * 安全的事件监听器
   */
  safeAddEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, []);
    }
    this.eventListeners.get(target)!.push({ type, listener });
  }

  /**
   * 清理所有资源
   */
  cleanup(): void {
    // 清理intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();

    // 清理timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();

    // 清理事件监听器
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach(({ type, listener }) => {
        target.removeEventListener(type, listener);
      });
    });
    this.eventListeners.clear();
  }
}

// 导出便捷函数
export const performanceMonitor = PerformanceMonitor.getInstance();
export const memoryLeakDetector = MemoryLeakDetector.getInstance();

// React import for usePerformanceMonitoring
import React from 'react';