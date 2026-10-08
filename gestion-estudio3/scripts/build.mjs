// Build para Vercel (o cualquier hosting estático): arma la carpeta dist/ solo con lo que la app necesita
// (index.html, css/, js/) y genera dist/js/config.js con las variables PÚBLICAS.
// Así no se publican el README, la carpeta supabase/ ni otros archivos del proyecto.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
cpSync(join(root, 'index.html'), join(dist, 'index.html'));
cpSync(join(root, 'css'), join(dist, 'css'), { recursive: true });
cpSync(join(root, 'js'), join(dist, 'js'), { recursive: true, filter: (src) => !src.endsWith('config.js') });
try {
  execFileSync(process.execPath, [join(root, 'scripts', 'generar-config.mjs'), '--out', join(dist, 'js', 'config.js')], { stdio: 'inherit' });
} catch {
  process.exit(1); // el motivo ya se mostró arriba
}
console.log('Listo: carpeta dist/ preparada.');
