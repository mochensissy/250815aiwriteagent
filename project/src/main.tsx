import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeStorage } from './utils/storage';
import { testGeminiAPI } from './utils/testApi';

// 初始化存储系统
initializeStorage();

// 测试API连接
testGeminiAPI().then(success => {
  if (success) {
    console.log('🎉 API连接测试成功');
  } else {
    console.warn('⚠️ API连接测试失败，某些功能可能不可用');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
