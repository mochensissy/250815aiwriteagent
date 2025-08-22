import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeStorage } from './utils/storage';
import { testGeminiConnection } from './utils/testApi';

// 初始化存储系统
initializeStorage();

// 测试API连接
testGeminiConnection().then(result => {
  if (result.success) {
    console.log('🎉 API连接测试成功:', result.message);
  } else {
    console.warn('⚠️ API连接测试失败，某些功能可能不可用:', result.message);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
