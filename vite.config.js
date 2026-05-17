// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // 开发代理：将 /api/siliconflow 开头的请求转发到硅基流动 API
    proxy: {
      '/api/siliconflow': {
        target: 'https://api.siliconflow.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/siliconflow/, '/v1'),
      },
    },
  },
})