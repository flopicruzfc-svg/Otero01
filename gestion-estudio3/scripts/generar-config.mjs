// Genera js/config.js a partir de .env (o de las variables de entorno del sistema, por ejemplo en Netlify o Vercel).
// Solo copia valores PÚBLICOS: la URL del proyecto y la clave anónima, que el navegador necesita
// y que están protegidas por las reglas de seguridad (RLS) de la base.
// Nunca pongas acá la service_role key ni la clave de Resend: esas van solo en los secretos de Supabase.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env');
const fromFile = {};
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) fromFile[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const get = (k) => (process.env[k] || fromFile[k] || '').trim();
const PUBLIC = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'APP_URL'];
const cfg = Object.fromEntries(PUBLIC.map((k) => [k, get(k)]));
const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'].filter((k) => !cfg[k]);
if (missing.length) {
  console.error('Faltan variables: ' + missing.join(', ') + '. En Vercel: Settings › Environment Variables. En tu computadora: copiá .env.example como .env y completalas.');
  process.exit(1);
}
if (/service_role/i.test(Buffer.from((cfg.SUPABASE_ANON_KEY.split('.')[1] || ''), 'base64').toString())) {
  console.error('SUPABASE_ANON_KEY parece ser la service_role key. Usá la clave "anon public": la service_role nunca debe llegar al navegador.');
  process.exit(1);
}
const outIdx = process.argv.indexOf('--out');
const outFile = outIdx > 0 ? process.argv[outIdx + 1] : join(root, 'js', 'config.js');
writeFileSync(outFile, '// Generado por scripts/generar-config.mjs. No editar a mano.\nwindow.APP_CONFIG = ' + JSON.stringify(cfg, null, 2) + ';\n');
console.log(outFile.replace(root + '/', '') + ' generado para ' + cfg.SUPABASE_URL);
