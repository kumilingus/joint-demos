import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        // Allow the dev server to be reached through an ngrok tunnel (its subdomain changes every session).
        allowedHosts: ['.ngrok-free.app']
    }
});
