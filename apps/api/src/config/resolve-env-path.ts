import { existsSync } from 'fs';
import { join } from 'path';

/** Localiza `.env` na raiz do monorepo (KLIPYT), mesmo rodando de `apps/api`. */
export function resolveEnvPath(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) return candidate;
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return join(process.cwd(), '.env');
}
