// Edge Function: crea una invitación y envía el correo con Resend.
// La llama un administrador desde la app (con su sesión). Nunca simula el envío:
// si el correo no sale, la invitación se cancela y se devuelve el error.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { cors, json, env, missingEnv, sha256hex, randomToken, escapeHtml, validEmail } from '../_shared/comun.ts';

const DIAS_VIGENCIA = 14;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { code: 'method', message: 'Usá POST.' });

  // SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY los provee Supabase automáticamente.
  const { vals, missing } = env(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'EMAIL_FROM', 'APP_URL']);
  if (missing.length) return missingEnv(missing);

  // ¿Quién llama?
  const authHeader = req.headers.get('Authorization') || '';
  const asUser = createClient(vals.SUPABASE_URL, vals.SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: who, error: whoErr } = await asUser.auth.getUser();
  if (whoErr || !who?.user) return json(401, { code: 'no_session', message: 'Tu sesión venció. Volvé a ingresar.' });
  const caller = who.user;

  let body: { workspace_id?: string; email?: string; role?: string };
  try { body = await req.json(); } catch { return json(400, { code: 'bad_request', message: 'Solicitud inválida.' }); }
  const workspaceId = String(body.workspace_id || '');
  const email = String(body.email || '').trim().toLowerCase();
  const role = body.role === 'admin' ? 'admin' : 'empleado';
  if (!workspaceId || !validEmail(email)) return json(400, { code: 'bad_email', message: 'Revisá el correo: no parece válido.' });

  const admin = createClient(vals.SUPABASE_URL, vals.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Solo un administrador activo de ese estudio puede invitar.
  const { data: mine } = await admin.from('memberships').select('role,status')
    .eq('workspace_id', workspaceId).eq('user_id', caller.id).maybeSingle();
  if (!mine || mine.role !== 'admin' || mine.status !== 'activa') return json(403, { code: 'forbidden', message: 'Solo un administrador puede invitar.' });

  // ¿Ya es integrante activo?
  const { data: prof } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (prof) {
    const { data: already } = await admin.from('memberships').select('status')
      .eq('workspace_id', workspaceId).eq('user_id', prof.id).maybeSingle();
    if (already && already.status === 'activa') return json(409, { code: 'already_member', message: 'Esa persona ya forma parte del estudio.' });
  }

  const [{ data: ws }, { data: inviter }] = await Promise.all([
    admin.from('workspaces').select('name').eq('id', workspaceId).single(),
    admin.from('profiles').select('first_name,last_name').eq('id', caller.id).single(),
  ]);
  const studio = ws?.name || 'tu estudio';
  const inviterName = [inviter?.first_name, inviter?.last_name].filter(Boolean).join(' ').trim();

  // Una sola invitación pendiente por correo: la anterior se cancela.
  await admin.from('invitations').update({ status: 'cancelada' })
    .eq('workspace_id', workspaceId).eq('email', email).eq('status', 'pendiente');

  const token = randomToken(32);
  const expires = new Date(Date.now() + DIAS_VIGENCIA * 864e5);
  const { data: inv, error: insErr } = await admin.from('invitations').insert({
    workspace_id: workspaceId, email, role, token_hash: await sha256hex(token), invited_by: caller.id, expires_at: expires.toISOString(),
  }).select('id,email,role,status,created_at,expires_at').single();
  if (insErr || !inv) return json(500, { code: 'db_error', message: 'No se pudo guardar la invitación.' });

  const link = vals.APP_URL.replace(/#.*$/, '') + '#invitacion=' + token;
  const vence = expires.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const subject = 'Te invitaron a ' + studio;
  const intro = (inviterName ? inviterName + ' te invitó' : 'Te invitaron') + ' a sumarte al espacio de trabajo de ' + studio +
    ', donde se organizan los clientes, proyectos y tareas del estudio.';
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#F6F4F0;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1E1C19">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E7E3DC;border-radius:14px;padding:32px">
      <tr><td style="font-size:13px;color:#6B665F;padding-bottom:6px">${escapeHtml(studio)}</td></tr>
      <tr><td style="font-size:22px;font-weight:700;padding-bottom:14px">Te invitaron a ${escapeHtml(studio)}</td></tr>
      <tr><td style="font-size:15px;line-height:1.55;padding-bottom:22px">${escapeHtml(intro)} Para aceptar, creá tu contraseña desde el siguiente botón.</td></tr>
      <tr><td style="padding-bottom:22px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#2F5D50;color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">Aceptar invitación</a></td></tr>
      <tr><td style="font-size:13px;line-height:1.5;color:#6B665F;padding-bottom:6px">Si el botón no funciona, copiá este enlace en tu navegador:</td></tr>
      <tr><td style="font-size:13px;line-height:1.5;word-break:break-all;padding-bottom:18px"><a href="${escapeHtml(link)}" style="color:#2F5D50">${escapeHtml(link)}</a></td></tr>
      <tr><td style="font-size:12px;color:#6B665F">La invitación es para ${escapeHtml(email)}, sirve una sola vez y vence el ${vence}. Si no la esperabas, podés ignorar este correo.</td></tr>
    </table></td></tr></table></body></html>`;
  const text = `${subject}\n\n${intro}\n\nPara aceptar la invitación y crear tu contraseña, abrí este enlace:\n${link}\n\nLa invitación es para ${email}, sirve una sola vez y vence el ${vence}.`;

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + vals.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: vals.EMAIL_FROM, to: [email], subject, html, text }),
  });
  if (!sent.ok) {
    let detail = '';
    try { const e = await sent.json(); detail = e?.message || e?.name || ''; } catch { /* sin detalle */ }
    await admin.from('invitations').update({ status: 'cancelada' }).eq('id', inv.id);
    return json(502, {
      code: 'email_failed',
      message: 'El correo no se pudo enviar' + (detail ? ': ' + detail : '.') + ' La invitación no quedó activa. Revisá RESEND_API_KEY y EMAIL_FROM (el dominio del remitente tiene que estar verificado en Resend).',
    });
  }
  const resend = await sent.json().catch(() => ({}));
  return json(200, { ok: true, invitation: inv, email_id: resend?.id || null });
});
