import { test, expect } from '@playwright/test';

/** Same default as `lib/ajabEnv.ts` — override with `E2E_CMS_BASE`. */
const CMS_BASE = (process.env.E2E_CMS_BASE || 'https://ajab.designanddevelopment.in/admin').replace(/\/+$/, '');

test('CMS /Api/list returns JSON (no local Next required)', async ({ request }) => {
  const res = await request.get(
    `${CMS_BASE}/Api/list?page=1&limit=1&search=&singer=&poet=`
  );
  expect(res.ok(), `HTTP ${res.status()}`).toBeTruthy();
  const json = await res.json();
  expect(json).toHaveProperty('data');
  expect(Array.isArray(json.data)).toBeTruthy();
});
