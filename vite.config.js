import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const replitDomain = process.env.REPLIT_DEV_DOMAIN || 
    (process.env.REPL_SLUG && process.env.REPL_OWNER 
        ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
        : 'localhost');

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            credentials: true,
        },
        strictPort: true,
        hmr: {
            host: replitDomain,
            clientPort: 443,
            protocol: replitDomain === 'localhost' ? 'ws' : 'wss',
        },
    },
});
