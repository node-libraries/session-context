import { AsyncLocalStorage } from 'node:async_hooks';

const global = globalThis as typeof globalThis & {
  __context: AsyncLocalStorage<Record<string, unknown>>;
};

export const createSessionContext = () => {
  if (!global.__context) {
    global.__context = new AsyncLocalStorage<Record<string, unknown>>();
  }
  return global.__context;
};

export const getSessionContext = <T extends Record<string, unknown>>() => {
  const store = global.__context.getStore();
  if (!store) {
    throw new Error('Global store is not initialized');
  }
  return store as T;
};

export const runSession = <R, TArgs extends unknown[]>(
  callback: (...args: TArgs) => R,
  ...args: TArgs
) => {
  const context = createSessionContext();
  return context.run({}, callback, ...args);
};
