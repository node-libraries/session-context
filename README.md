# session-context

Exchanging data globally within a session.

## Remix + Cloudflare Workers example

https://github.com/SoraKumo001/remix-global-prisma

- vite.config.ts

```js
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getLoadContext } from './load-context';
import { sessionContextPlugin } from 'session-context/vite';

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy({ getLoadContext }),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
    sessionContextPlugin(),
  ],
});
```

- load-context.ts

```ts
import { AppLoadContext } from '@remix-run/cloudflare';
import { getSessionContext } from 'session-context';
import { type PlatformProxy } from 'wrangler';

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>;

declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

type GetLoadContext = (args: {
  request: Request;
  context: { cloudflare: Cloudflare };
}) => AppLoadContext;

export const getLoadContext: GetLoadContext = ({ context }) => {
  const store = getSessionContext();
  store.env = context.cloudflare.env; // Save the environment variables
  return context;
};
```

- app/libs/prisma.ts

```ts
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getSessionContext } from 'session-context';

export const getPrisma = () => {
  const store = getSessionContext<{ prisma?: PrismaClient; env: Env }>();
  if (!store.prisma) {
    const adapter = new PrismaD1(store.env.DB);
    store.prisma = new PrismaClient({ adapter });
  }
  return store.prisma;
};

export const prisma = new Proxy<PrismaClient>({} as never, {
  get(_target: unknown, props: keyof PrismaClient) {
    return getPrisma()[props];
  },
});
```

- app/routes/index.tsx

```tsx
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getSessionContext } from 'session-context';

export const getPrisma = () => {
  const store = getSessionContext<{ prisma?: PrismaClient; env: Env }>();
  if (!store.prisma) {
    const adapter = new PrismaD1(store.env.DB);
    store.prisma = new PrismaClient({ adapter });
  }
  return store.prisma;
};

export const prisma = new Proxy<PrismaClient>({} as never, {
  get(_target: unknown, props: keyof PrismaClient) {
    return getPrisma()[props];
  },
});
```
