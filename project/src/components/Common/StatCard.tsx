/**
 * 统计卡片组件
 * 
 * 显示数据统计的卡片组件
 * 支持动画效果和多种样式
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  color = 'blue',
  trend,
  className = ''
}) => {
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      accent: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-900',
      accent: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      text: 'text-purple-900',
      accent: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      text: 'text-orange-900',
      accent: 'text-orange-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-900',
      accent: 'text-red-600'
    }
  };

  const config = colorConfig[color];

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white ${config.border} border`}>
          <Icon className={`w-5 h-5 ${config.icon}`} />
        </div>
        {trend && (
          <div className={`text-xs font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className={`text-2xl font-bold ${config.text}`}>
          <AnimatedCounter 
            value={value} 
            prefix={prefix} 
            suffix={suffix}
            duration={1500}
          />
        </div>
        <div className="text-sm text-gray-600 font-medium">
          {title}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

