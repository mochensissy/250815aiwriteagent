/**
 * 节流Hook
 * 
 * 限制函数执行频率，确保在指定时间间隔内最多执行一次
 * 常用于滚动事件、窗口调整等高频事件
 */

import { useRef, useCallback } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

export default useThrottle;

