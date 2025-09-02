/**
 * 增强的Toast通知组件
 * 
 * 提供更丰富的通知样式和交互
 * 支持多种类型和自定义操作
 */

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  action,
  onDismiss
}) => {
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-700'
        };
      default: // info
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 shadow-lg max-w-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-semibold ${config.titleColor}`}>
            {title}
          </h3>
          {message && (
            <p className={`text-sm ${config.messageColor} mt-1`}>
              {message}
            </p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={`text-sm font-medium ${config.iconColor} hover:underline mt-2`}
            >
              {action.text}
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// 便捷的toast函数
export const showToast = {
  success: (title: string, message?: string, action?: { text: string; onClick: () => void }) => {
    toast.custom((t) => (
      <Toast
        type="success"
        title={title}
        message={message}
        action={action}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
      position: 'top-right'
    });
  },
  
  error: (title: string, message?: string, action?: { text: string; onClick: () => void }) => {
    toast.custom((t) => (
      <Toast
        type="error"
        title={title}
        message={message}
        action={action}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 6000,
      position: 'top-right'
    });
  },
  
  warning: (title: string, message?: string, action?: { text: string; onClick: () => void }) => {
    toast.custom((t) => (
      <Toast
        type="warning"
        title={title}
        message={message}
        action={action}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 5000,
      position: 'top-right'
    });
  },
  
  info: (title: string, message?: string, action?: { text: string; onClick: () => void }) => {
    toast.custom((t) => (
      <Toast
        type="info"
        title={title}
        message={message}
        action={action}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
      position: 'top-right'
    });
  }
};

export default Toast;

