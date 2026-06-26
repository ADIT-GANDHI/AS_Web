/**
 * Legacy staging build for /new subpath only — NOT the live site.
 * Live deploy: npm run build (root, ajab.damnetworks.com/)
 */
import { spawnSync } from 'child_process';

const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_BASE_PATH: '/new',
  NEXT_PUBLIC_AJAB_API_BASE:
    process.env.NEXT_PUBLIC_AJAB_API_BASE ||
    'https://ajab-admin.damnetworks.com/admin',
};

console.log('build:staging-new (legacy /new — not live)');
console.log('  API base:', env.NEXT_PUBLIC_AJAB_API_BASE);

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(result.status ?? 1);
