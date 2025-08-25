import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // 代理豆包API请求以解决CORS问题
      '/api/doubao': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/doubao/, '/api/v3/images/generations'),
        headers: {
          'Origin': 'https://ark.cn-beijing.volces.com'
        }
      },
      // 代理Perplexity API请求以解决网络连接问题
      '/api/perplexity': {
        target: 'https://api.perplexity.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/perplexity/, '/chat/completions'),
        headers: {
          'Origin': 'https://api.perplexity.ai'
        }
      },
      // 代理Gemini API请求以解决网络连接问题
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, '/v1beta/models/gemini-2.0-flash:generateContent'),
        headers: {
          'Origin': 'https://generativelanguage.googleapis.com'
        }
      },
      // 代理OpenRouter API请求
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, '/api/v1/chat/completions'),
        headers: {
          'Origin': 'https://openrouter.ai'
        }
      }
    }
  }
});
