/**
 * 进度指示器组件
 * 
 * 显示用户在写作流程中的当前位置
 * 提供清晰的步骤导航和进度反馈
 */

import React from 'react';
import { Check, Circle, ArrowRight } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

interface ProgressIndicatorProps {
  steps: Step[];
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              {/* 步骤图标 */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                step.status === 'completed'
                  ? 'bg-green-100 text-green-600 border-2 border-green-200'
                  : step.status === 'current'
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-200 ring-4 ring-blue-50'
                  : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
              }`}>
                {step.status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              
              {/* 步骤信息 */}
              <div className="text-center">
                <h3 className={`font-semibold text-sm mb-1 ${
                  step.status === 'current' ? 'text-blue-900' : 
                  step.status === 'completed' ? 'text-green-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-xs leading-tight ${
                  step.status === 'current' ? 'text-blue-600' : 
                  step.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
            
            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div className="flex-1 max-w-20 mx-4">
                <div className={`h-0.5 transition-all duration-300 ${
                  steps[index + 1].status === 'completed' || steps[index + 1].status === 'current'
                    ? 'bg-gradient-to-r from-green-400 to-blue-400'
                    : 'bg-gray-200'
                }`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;

