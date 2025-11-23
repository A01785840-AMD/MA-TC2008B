import {defineConfig} from 'vite';

console.log("Initial simulation config");

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                secure: false,
                rewrite: path => path.replace(/^\/api/, '')
            },
            '/socket.io': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                ws: true,
                secure: false,
            }
        }
    }
})