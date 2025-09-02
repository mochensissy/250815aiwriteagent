/**
 * 动画计数器组件
 * 
 * 提供数字动画效果，用于显示统计数据
 * 支持从0到目标值的平滑动画
 */

import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  suffix = '',
  prefix = '',
  className = ''
}) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // 使用缓动函数让动画更自然
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * value);
      
      setCurrentValue(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{currentValue.toLocaleString()}{suffix}
    </span>
  );
};

export default AnimatedCounter;

