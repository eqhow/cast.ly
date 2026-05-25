import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    
    // Настройка плагина для генерации Progressive Web App (PWA)
    VitePWA({
      registerType: 'autoUpdate',
      
      // Параметры манифеста (должны дублировать или дополнять public/manifest.json)
      manifest: {
        name: 'CastLy Web Application',
        short_name: 'CastLy',
        theme_color: '#000000',
        
        // Ресурсы иконок, которые плагин подтянет из директории public при сборке
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          }
        ],
      },
    }),
  ],
})