import type { Plugin } from 'vite';
import { runSession } from './index.js';

export const sessionContextPlugin = (): Plugin => {
  return {
    name: 'global-storage',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((_req, _res, next) => {
        return runSession(next);
      });
    },
  };
};
