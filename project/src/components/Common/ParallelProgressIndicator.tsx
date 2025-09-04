/**
 * 并行进度指示器组件
 * 
 * 专门用于显示多个并行任务的进度状态
 * 特别适用于封面生成等并行处理场景
 */

import React from 'react';
import { CheckCircle, Loader, XCircle, Clock } from 'lucide-react';

interface TaskProgress {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
}

interface ParallelProgressIndicatorProps {
  tasks: TaskProgress[];
  title?: string;
  totalTime?: number;
  className?: string;
}

const ParallelProgressIndicator: React.FC<ParallelProgressIndicatorProps> = ({
  tasks,
  title = '并行处理中',
  totalTime,
  className = ''
}) => {
  const completedCount = tasks.filter(task => task.status === 'completed').length;
  const failedCount = tasks.filter(task => task.status === 'failed').length;
  const runningCount = tasks.filter(task => task.status === 'running').length;
  const pendingCount = tasks.filter(task => task.status === 'pending').length;

  const progressPercentage = Math.round((completedCount / tasks.length) * 100);

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      default: // pending
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default: // pending
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* 头部信息 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm opacity-90">
            {completedCount}/{tasks.length}
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="mt-3">
          <div className="flex justify-between text-sm opacity-90 mb-1">
            <span>完成进度</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="p-6">
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${getTaskStatusColor(task.status)}`}
            >
              <div className="flex items-center gap-3">
                {getTaskIcon(task.status)}
                <div>
                  <div className="font-medium">{task.name}</div>
                  {task.message && (
                    <div className="text-sm opacity-75 mt-1">{task.message}</div>
                  )}
                </div>
              </div>
              
              {task.status === 'running' && (
                <div className="text-xs text-blue-600 font-medium animate-pulse">
                  处理中...
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 统计信息 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-gray-600">已完成</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{runningCount}</div>
              <div className="text-sm text-gray-600">进行中</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
              <div className="text-sm text-gray-600">等待中</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-gray-600">失败</div>
            </div>
          </div>
        </div>

        {/* 完成时间 */}
        {totalTime && completedCount === tasks.length && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              全部完成! 总用时: {totalTime}ms
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParallelProgressIndicator;
