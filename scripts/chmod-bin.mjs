import { chmodSync, existsSync } from 'node:fs';

const target = new URL('../dist/cli.js', import.meta.url);
if (existsSync(target)) {
  chmodSync(target, 0o755);
}
