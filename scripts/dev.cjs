const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.resolve(rootDir, 'server');

console.log('🚀 Iniciando Fábrica de Conteúdo (Backend :4000 + Frontend :5173)...');

const server = spawn('npm', ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
});

const client = spawn('npm', ['run', 'dev:client'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const cleanup = (code = 0) => {
  try { server.kill(); } catch (_) {}
  try { client.kill(); } catch (_) {}
  process.exit(code);
};

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.warn(`[Server] Processo encerrou com código ${code}`);
  }
});

client.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.warn(`[Client] Processo encerrou com código ${code}`);
  }
});

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
