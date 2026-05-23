import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000,
  },
  publicDir: 'src/public',
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      spa: { enabled: true },
    }),
    viteReact(),
  ],
  optimizeDeps: {
    include: ['three'],
  },
})
