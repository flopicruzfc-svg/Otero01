// Edge Function: acepta una invitación creando el usuario en Supabase Auth.
// La llama la pantalla "Aceptar invitación" sin sesión (por eso se despliega con --no-verify-jwt):
// la autorización es el propio token de un solo uso, validado en la base.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { cors, json, env, missingEnv, sha256hex } from '../_shared/comun.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { code: 'method', message: 'Usá POST.' });

  const { vals, missing } = env(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (missing.length) return missingEnv(missing);

  let body: { token?: string; password?: string; first_name?: string; last_name?: string };
  try { body = await req.json(); } catch { return json(400, { code: 'bad_request', message: 'Solicitud inválida.' }); }
  const token = String(body.token || '');
  const password = String(body.password || '');
  const first = String(body.first_name || '').trim().slice(0, 80);
  const last = String(body.last_name || '').trim().slice(0, 80);
  if (!/^[a-f0-9]{64}$/.test(token)) return json(400, { code: 'invitacion_invalida', message: 'El enlace de invitación no es válido.' });
  if (password.length < 8) return json(400, { code: 'weak_password', message: 'La contraseña tiene que tener al menos 8 caracteres.' });
  if (!first) return json(400, { code: 'name', message: 'Escribí tu nombre.' });

  const admin = createClient(vals.SUPABASE_URL, vals.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: inv } = await admin.from('invitations').select('id,email,status,expires_at')
    .eq('token_hash', await sha256hex(token)).maybeSingle();
  if (!inv) return json(404, { code: 'invitacion_invalida', message: 'El enlace de invitación no es válido.' });
  if (inv.status !== 'pendiente') return json(409, { code: 'invitacion_' + inv.status, message: 'Esta invitación ya no está disponible (' + inv.status + ').' });
  if (new Date(inv.expires_at).getTime() < Date.now()) {
    await admin.from('invitations').update({ status: 'vencida' }).eq('id', inv.id);
    return json(409, { code: 'invitacion_vencida', message: 'La invitación venció. Pedile al administrador que te envíe una nueva.' });
  }

  // Si ya existe un usuario con ese correo, tiene que ingresar con su contraseña y aceptar desde su sesión.
  const { data: existing } = await admin.from('profiles').select('id').eq('email', inv.email).maybeSingle();
  if (existing) return json(409, { code: 'user_exists', message: 'Ya tenés un usuario con este correo. Ingresá con tu contraseña para aceptar la invitación.' });

  // El correo queda confirmado: la persona demostró que lo recibe al abrir el enlace.
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email: inv.email, password, email_confirm: true, user_metadata: { first_name: first, last_name: last },
  });
  if (cErr || !created?.user) {
    const weak = /password/i.test(cErr?.message || '');
    return json(400, { code: weak ? 'weak_password' : 'create_failed', message: weak ? 'La contraseña no cumple los requisitos de seguridad. Probá con una más larga.' : 'No se pudo crear tu usuario.' });
  }

  const { data: wsId, error: aErr } = await admin.rpc('accept_invitation_for', { p_token: token, p_user: created.user.id, p_email: inv.email });
  if (aErr) {
    await admin.auth.admin.deleteUser(created.user.id); // sin membresía no dejamos un usuario suelto
    return json(409, { code: 'accept_failed', message: 'No se pudo aceptar la invitación: ' + aErr.message });
  }
  return json(200, { ok: true, email: inv.email, workspace_id: wsId });
});
