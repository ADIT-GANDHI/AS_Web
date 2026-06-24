/**
 * Subpath deploy only when the live URL includes /ajab (e.g. example.com/ajab/songs).
 * NOT used for ajab.damnetworks.com — that site uses build:final → /var/www/ajab/
 */
import { spawnSync } from 'child_process';

const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_BASE_PATH: '/ajab',
  NEXT_PUBLIC_AJAB_API_BASE:
    process.env.NEXT_PUBLIC_AJAB_API_BASE ||
    'https://ajab-admin.damnetworks.com/admin',
};

console.log('build:ajab');
console.log('  UI target:  /ajab/');
console.log('  API base:  ', env.NEXT_PUBLIC_AJAB_API_BASE);

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(result.status ?? 1);
