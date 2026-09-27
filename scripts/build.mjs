import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Desktop tooling may inherit NODE_ENV=development; releases must not inherit it.
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const result = spawnSync(process.execPath, [vite, 'build', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
