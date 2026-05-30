import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const replitDomain = process.env.REPLIT_DOMAINS || 
    (process.env.REPL_SLUG && process.env.REPL_OWNER 
        ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
        : 'localhost');
const isReplit = Boolean(
    process.env.REPLIT_DOMAINS || (process.env.REPL_SLUG && process.env.REPL_OWNER)
);
const serverPort = Number(process.env.VITE_PORT || 5173);
const hmrHost = process.env.VITE_HMR_HOST || (isReplit ? replitDomain : 'localhost');
const hmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT || (isReplit ? 443 : serverPort));
const hmrProtocol = process.env.VITE_HMR_PROTOCOL || (isReplit ? 'wss' : 'ws');

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@assets': path.resolve(__dirname, './resources'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: serverPort,
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            credentials: true,
        },
        strictPort: true,
        hmr: {
            host: hmrHost,
            clientPort: hmrClientPort,
            protocol: hmrProtocol,
        },
    },
});
