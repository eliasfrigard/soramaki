import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/cache') specifier = 'next/cache.js';
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
    if (specifier.startsWith('.') || specifier.startsWith('file:')) {
      const url = new URL(specifier, context.parentURL ?? root);
      if (!url.pathname.endsWith('.ts') && existsSync(`${fileURLToPath(url)}.ts`)) {
        specifier = `${url.href}.ts`;
      }
    }
    return nextResolve(specifier, context);
  },
});
