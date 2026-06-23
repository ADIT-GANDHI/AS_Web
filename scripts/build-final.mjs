/**
 * Production build for ajab.damnetworks.com (root path, no /new).
 * API: https://ajab-admin.damnetworks.com/admin
 *
 * Override before DNS is live:
 *   set NEXT_PUBLIC_AJAB_API_BASE=http://165.232.187.173/admin
 *   npm run build:final
 */
import { spawnSync } from 'child_process';

const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_BASE_PATH: '',
  NEXT_PUBLIC_AJAB_API_BASE:
    process.env.NEXT_PUBLIC_AJAB_API_BASE ||
    'https://ajab-admin.damnetworks.com/admin',
};

console.log('build:final');
console.log('  UI target:  ajab.damnetworks.com/ (root)');
console.log('  API base:  ', env.NEXT_PUBLIC_AJAB_API_BASE);

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(result.status ?? 1);
