import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

export default defineConfig({
  plugins: [
    react(),
    rollupNodePolyFill(),
  ],
  resolve: {
    alias: {
      process: 'rollup-plugin-polyfill-node/process-es6',
    },
  },
})
