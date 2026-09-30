import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chatgptPlugin } from './server/chatgpt_auth.js';

const sessionsDir = path.resolve(process.cwd(), 'sessions');

const sessionArchivePlugin = () => ({
  name: 'seimas-session-archive',
  configureServer(server) {
    server.middlewares.use(createSessionHandler());
  },
  configurePreviewServer(server) {
    server.middlewares.use(createSessionHandler());
  }
});

function createSessionHandler() {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/sessions')) {
      return next();
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Only POST allowed');
      return;
    }

    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || '{}');
      const { folderName, fileName, contents } = payload;
      if (!folderName || !fileName || !contents) {
        res.statusCode = 400;
        res.end('Missing folderName, fileName arba contents');
        return;
      }

      const folderPath = path.join(sessionsDir, folderName);
      await fs.mkdir(folderPath, { recursive: true });
      const filePath = path.join(folderPath, fileName);
      await fs.writeFile(filePath, contents, 'utf8');

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ path: `sessions/${folderName}/${fileName}` }));
    } catch (error) {
      console.error('Nepavyko išsaugoti sesijos:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Nepavyko išsaugoti sesijos' }));
    }
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default defineConfig({
  plugins: [react(), chatgptPlugin(), sessionArchivePlugin()],
  server: {
    port: 5173,
    host: true
  }
});
