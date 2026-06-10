/**
 * Free port 3000 when a stale Next dev server from this repo is still listening.
 * Prevents `next dev` from silently moving to :3001.
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const PORT = Number(process.env.PORT || 3000);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT_NORM = ROOT.replace(/\//g, '\\').toLowerCase();

function pidsOnPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr ":${port} "`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (pid > 0) pids.add(pid);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function processCommandLine(pid) {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
      { encoding: 'utf8' }
    );
    return out.trim();
  } catch {
    return '';
  }
}

const pids = pidsOnPort(PORT);
for (const pid of pids) {
  const cmd = processCommandLine(pid).toLowerCase();
  const isNextFromRepo =
    cmd.includes(ROOT_NORM) && cmd.includes('start-server.js');
  if (!isNextFromRepo) {
    console.warn(
      `[free-dev-port] Port ${PORT} is used by PID ${pid} (not this project's Next dev). Stop it manually if needed.`
    );
    continue;
  }
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    console.log(`[free-dev-port] Stopped stale Next dev (PID ${pid}) on :${PORT}`);
  } catch (err) {
    console.warn(`[free-dev-port] Could not stop PID ${pid}:`, err.message);
  }
}
