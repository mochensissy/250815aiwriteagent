/**
 * 状态卡片组件
 * 
 * 显示各种状态信息的统一卡片组件
 * 支持成功、警告、错误、信息等多种状态
 */

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, Loader } from 'lucide-react';

interface StatusCardProps {
  type: 'success' | 'warning' | 'error' | 'info' | 'loading';
  title: string;
  message: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  type,
  title,
  message,
  action,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          messageColor: 'text-green-700',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-700',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'loading':
        return {
          icon: Loader,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
      default: // info
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-2xl p-6 ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${type === 'loading' ? 'animate-spin' : ''}`}>
          <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div className="ml-4 flex-1">
          <h3 className={`text-lg font-semibold ${config.titleColor} mb-2`}>
            {title}
          </h3>
          <p className={`${config.messageColor} leading-relaxed mb-4`}>
            {message}
          </p>
          {action && (
            <button
              onClick={action.onClick}
              className={`${config.buttonColor} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              {action.text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusCard;

