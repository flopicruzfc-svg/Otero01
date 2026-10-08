// Utilidades compartidas por las Edge Functions.
export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Devuelve las variables de entorno pedidas, o la lista de las que faltan. */
export function env(names: string[]): { vals: Record<string, string>; missing: string[] } {
  const vals: Record<string, string> = {};
  const missing: string[] = [];
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v && v.trim()) vals[n] = v.trim(); else missing.push(n);
  }
  return { vals, missing };
}

export const missingEnv = (missing: string[]) =>
  json(500, {
    code: 'missing_env',
    missing,
    message: 'Faltan variables de entorno en Supabase: ' + missing.join(', ') +
      '. Configuralas en Supabase › Edge Functions › Secrets (o con `supabase secrets set NOMBRE=valor`) y volvé a intentar.',
  });

export async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const escapeHtml = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
