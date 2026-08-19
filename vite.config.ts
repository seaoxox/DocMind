import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Set base to your repo name for GitHub Pages, e.g. '/docmind-qa/'.
// If deploying to a user/org root page (username.github.io), use '/'.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/docmind-qa/',
  plugins: [react(), tailwindcss()],
  worker: {
    format: 'es',
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('pdfjs-dist')) return 'pdf';
          if (id.includes('mammoth')) return 'docx';
          if (id.includes('node_modules/motion')) return 'motion';
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('mdast') || id.includes('micromark')) return 'markdown';
        },
      },
    },
  },
})
