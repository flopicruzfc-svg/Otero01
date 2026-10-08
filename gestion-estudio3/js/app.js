(function(){
const { useState, useEffect, useRef } = React;
const html = htm.bind(React.createElement);

/* ---------- Fechas ---------- */
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const fromIso = (s) => { const p = String(s || '').split('-').map(Number); return new Date(p[0] || 2000, (p[1] || 1) - 1, p[2] || 1); };
const addD = (s, n) => { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d); };
const TODAY = iso(new Date());
const diff = (a, b) => Math.round((fromIso(a) - fromIso(b)) / 864e5);
const fmt = (s) => { if (!s) return '—'; const d = fromIso(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
const fmtY = (s) => s ? fmt(s) + '/' + fromIso(s).getFullYear() : '—';
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_C = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const capit = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const longDate = (s) => { const d = fromIso(s); return capit(DIAS[d.getDay()]) + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
const monIdx = (s) => (fromIso(s).getDay() + 6) % 7;
const rel = (at) => {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return 'Recién';
  if (m < 60) return 'Hace ' + m + ' min';
  const d = new Date(at), hh = pad(d.getHours()) + ':' + pad(d.getMinutes()), di = diff(TODAY, iso(d));
  if (di === 0) return 'Hoy ' + hh;
  if (di === 1) return 'Ayer ' + hh;
  return fmt(iso(d)) + ' ' + hh;
};

/* ---------- Catálogos ---------- */
const ST = {
  sin: { l: 'Sin comenzar', bg: 'var(--s-sin-bg)', fg: 'var(--s-sin-fg)', dot: 'var(--s-sin-dot)', d: 'Está asignada y todavía no empezó.' },
  curso: { l: 'En curso', bg: 'var(--s-curso-bg)', fg: 'var(--s-curso-fg)', dot: 'var(--s-curso-dot)', d: 'Se está trabajando ahora.' },
  rev: { l: 'En revisión', bg: 'var(--s-rev-bg)', fg: 'var(--s-rev-fg)', dot: 'var(--s-rev-dot)', d: 'El trabajo está hecho y un administrador lo revisa.' },
  fin: { l: 'Terminado', bg: 'var(--s-fin-bg)', fg: 'var(--s-fin-fg)', dot: 'var(--s-fin-dot)', d: 'Está completa. Sale del calendario, pero queda guardada.' }
};
const SK = ['sin', 'curso', 'rev', 'fin'];
const PR = { baja: { l: 'Baja', c: 'var(--p-baja)', r: 1 }, media: { l: 'Media', c: 'var(--p-media)', r: 2 }, alta: { l: 'Alta', c: 'var(--p-alta)', r: 3 }, urg: { l: 'Urgente', c: 'var(--p-urg)', r: 4 } };
const PK = ['baja', 'media', 'alta', 'urg'];
const CST = { 'Activo': ['var(--s-fin-bg)', 'var(--s-fin-fg)'], 'En alta': ['var(--s-curso-bg)', 'var(--s-curso-fg)'], 'En clausura': ['var(--s-rev-bg)', 'var(--s-rev-fg)'], 'Inactivo': ['var(--s-sin-bg)', 'var(--s-sin-fg)'] };
const CSTATES = ['Activo', 'En alta', 'En clausura', 'Inactivo'];
const ROLE = { admin: 'Administrador/a', emp: 'Empleado/a' };
const ICON = {
  dash: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  cal: 'M5 6h14v14H5zM5 10h14M9 3v4M15 3v4',
  clientes: 'M5 20V5h9v15M14 9h5v11M8 8h3M8 12h3M8 16h3M3 20h18',
  proyectos: 'M3 7h6l2 2h10v10H3z',
  tareas: 'M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  esp: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
  ayuda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01',
  cfg: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  bell: 'M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0',
  plus: 'M12 5v14M5 12h14',
  lock: 'M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3',
  x: 'M6 6l12 12M18 6L6 18',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5',
  check: 'M5 12l5 5 9-10',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.01',
  left: 'M15 6l-6 6 6 6', right: 'M9 6l6 6-6 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  out: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  key: 'M15 7a4 4 0 1 0-3.9 4.9L4 19v2h3v-2h2v-2h2l1.1-1.1A4 4 0 0 0 15 7z',
  chevup: 'M6 15l6-6 6 6',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-3.5 3.5-5.5 7-5.5s6.2 2 7 5.5M16 3.5a4 4 0 0 1 0 7.5M18 15.5c2 .7 3.4 2.6 4 5.5'
};
const NAV = {
  admin: [['dash', 'Dashboard'], ['cal', 'Calendario'], ['clientes', 'Clientes'], ['proyectos', 'Proyectos'], ['tareas', 'Tareas'], ['ayuda', 'Ayuda'], ['cfg', 'Configuración']],
  emp: [['esp', 'Mi espacio'], ['tareas', 'Mis tareas'], ['cal', 'Mi calendario'], ['proyectos', 'Mis proyectos'], ['clientes', 'Clientes'], ['ayuda', 'Ayuda'], ['cfg', 'Configuración']]
};
const TOUR = {
  admin: [
    { screen: 'dash', target: 'stats', title: 'Tu panel de control', body: 'Acá ves cuántas tareas hay pendientes, cuáles vencen hoy y cuáles están atrasadas en todo el estudio. Tocá un número para ver esas tareas.' },
    { screen: 'clientes', target: 'cli', title: 'Clientes', body: 'Cargá a tus clientes y abrí la ficha de cada uno: datos de contacto, proyectos, tareas e historial.' },
    { screen: 'proyectos', target: 'projects', title: 'Proyectos', body: 'Un proyecto agrupa las tareas de un mismo trabajo para un cliente, como la liquidación mensual. Le asignás un responsable y la barra muestra el avance.' },
    { screen: 'tareas', target: 'newtask', title: 'Crear y asignar tareas', body: 'Con “Nueva tarea” definís qué hay que hacer, quién se encarga, para cuándo y con qué prioridad. Así avanza cada tarea:', flow: ['Crear', 'Asignar', 'Trabajar', 'Revisar', 'Terminar'] },
    { screen: 'cal', target: 'calTools', title: 'Calendario del estudio', body: 'Cambiá entre día, semana y mes, y filtrá por persona, cliente, proyecto o estado. Las tareas terminadas se ocultan, pero quedan guardadas.' },
    { screen: 'dash', target: 'overdue', title: 'Seguimiento', body: 'Las tareas atrasadas aparecen primero. Más abajo ves cuánto trabajo tiene cada persona y la actividad reciente.' },
    { screen: 'cfg', target: 'users', title: 'Equipo y permisos', body: 'Acá sumás a las personas del estudio y elegís su rol. También aprobás las solicitudes de acceso y cambiás el nombre del estudio.' }
  ],
  emp: [
    { screen: 'esp', target: 'stats', title: 'Este es tu espacio de trabajo', body: 'Acá ves tu avance y, debajo, tus tareas de hoy, las próximas y las atrasadas.' },
    { screen: 'tareas', target: 'table', title: 'Tus tareas', body: 'Acá aparecen solo las tareas que te asignaron. Abrí una para cambiar su estado, comentar o adjuntar archivos.' },
    { screen: 'tareas', target: 'center', title: 'Los estados de una tarea', body: 'Cada tarea pasa por cuatro etapas. Actualizala a medida que avanzás.', states: true },
    { screen: 'cal', target: 'calTools', title: 'Tu calendario', body: 'Muestra tus tareas pendientes según su vencimiento, por día, semana o mes. Las terminadas dejan de verse, pero quedan guardadas.' },
    { screen: 'esp', target: 'bell', title: 'Notificaciones', body: 'Te avisamos cuando te asignan una tarea, cuando algo está por vencer o cuando te devuelven una tarea con observaciones.' },
    { screen: 'esp', target: 'center', title: 'Cómo terminar una tarea', body: 'Así se cierra el ciclo de cada tarea:', flow: ['Abrís la tarea y la pasás a “En curso”', 'Hacés el trabajo y dejás comentarios o archivos', 'La pasás a “En revisión” para que la apruebe un administrador', 'Si no necesita revisión, la marcás como “Terminado”'] }
  ]
};
const FAQ = {
  admin: [
    ['¿Cómo sumo a alguien del equipo?', 'En Configuración › Equipo tocá “Invitar integrante”, escribí su correo y elegí el rol. Le llega un correo con el botón «Aceptar invitación»: ahí crea su contraseña y entra al estudio desde cualquier computadora.'],
    ['¿Cómo cierro sesión?', 'Tocá tu nombre abajo en el menú lateral y elegí “Cerrar sesión”. En el celular está dentro de “Más”. Tus datos y tus tareas quedan guardados.'],
    ['Alguien olvidó su contraseña, ¿qué hago?', 'Puede tocar «¿Olvidaste tu contraseña?» en la pantalla de ingreso. También podés abrirla en Configuración › Equipo y tocar «Enviar correo para restablecer contraseña».'],
    ['¿Cómo reasigno una tarea?', 'Abrí la tarea y elegí otra persona en “Responsable”, o usá “Editar”. El cambio queda en el historial y la persona recibe una notificación.'],
    ['¿Dónde veo las tareas terminadas?', 'En Tareas, filtrando por estado “Terminado”. No aparecen en el calendario, pero nunca se borran.'],
    ['¿Un empleado puede crear tareas?', 'No. Solo puede trabajar sobre las que tiene asignadas: cambiar el estado, editar la descripción, comentar y adjuntar archivos.'],
    ['¿Qué hago con una tarea “En revisión”?', 'Abrila y elegí “Aprobar” para cerrarla o “Devolver con observaciones” para que vuelva a “En curso”.'],
    ['¿Cómo cambio el nombre del estudio?', 'En Configuración › Estudio. El cambio se ve al instante para todo el equipo.']
  ],
  emp: [
    ['No veo una tarea que me pidieron.', 'Si todavía no está cargada a tu nombre, pedile a un administrador que la cree y te la asigne.'],
    ['¿Puedo cambiar el responsable o el cliente?', 'No. Esos datos los define un administrador. Vos podés cambiar el estado, editar la descripción, comentar y adjuntar archivos.'],
    ['Terminé una tarea, ¿por qué desapareció del calendario?', 'El calendario muestra solo lo pendiente. La tarea sigue guardada y la encontrás en Mis tareas, filtrando por “Terminado”.'],
    ['Me devolvieron una tarea, ¿qué hago?', 'Leé los comentarios, hacé los ajustes y volvé a pasarla a “En revisión”.'],
    ['¿Cómo cierro sesión o cambio mi contraseña?', 'Tocá tu nombre abajo en el menú lateral (en el celular, dentro de “Más”). Ahí están “Configuración de cuenta” y “Cerrar sesión”.'],
    ['Olvidé mi contraseña.', 'En la pantalla de ingreso tocá «¿Olvidaste tu contraseña?». Te llega un correo con un enlace para crear una nueva.']
  ]
};

/* ---------- Piezas ---------- */
const Icon = ({ d, s = 18, w = 1.8, style }) => html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=${w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style=${style}><path d=${d} /></svg>`;
const SB = ({ k }) => html`<span className="sb" style=${{ background: ST[k].bg, color: ST[k].fg }}>${ST[k].l}</span>`;
const PD = ({ k }) => html`<span className="pr"><span className="dot" style=${{ background: (PR[k] || PR.media).c }}></span>${(PR[k] || PR.media).l}</span>`;
const Tip = ({ label, text, right }) => html`<span className=${'tip' + (right ? ' r' : '')} tabIndex="0">${label} <${Icon} d=${ICON.info} s=${13} w=${2} /><span className="tb" role="tooltip">${text}</span></span>`;
const LockTip = ({ text }) => html`<span className="tip" tabIndex="0" aria-label="Campo bloqueado"><${Icon} d=${ICON.lock} s=${12} w=${2} /><span className="tb" role="tooltip">${text}</span></span>`;
const isLate = (t) => t.s !== 'fin' && t.due && diff(t.due, TODAY) < 0;
const dueInfo = (t) => {
  if (!t.due) return { text: 'Sin fecha', cls: 'due' };
  const dd = diff(t.due, TODAY);
  if (t.s === 'fin') return { text: fmt(t.due), cls: 'due' };
  if (dd === 0) return { text: 'Hoy', cls: 'due today' };
  if (dd === 1) return { text: 'Mañana', cls: 'due' };
  if (dd < 0) return { text: 'Venció ' + fmt(t.due), cls: 'due late' };
  return { text: fmt(t.due), cls: 'due' };
};
const byDue = (a, b) => String(a.due || '9').localeCompare(String(b.due || '9')) || (PR[b.pr] || PR.media).r - (PR[a.pr] || PR.media).r;
const byPr = (a, b) => (PR[b.pr] || PR.media).r - (PR[a.pr] || PR.media).r;
const hash = (s) => { let h = 0; const str = String(s || ''); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h); };
const AVS = ['var(--av1)', 'var(--av2)', 'var(--av3)', 'var(--av4)'];
const initials = (n) => (String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')) || '?';
const errMsg = (e) => {
  const c = e && e.code;
  if (e && e.userMessage) return e.userMessage;
  if (c === 'permission') return 'No tenés permiso para hacer este cambio.';
  if (c === 'in_use') return 'No se puede eliminar porque tiene elementos asociados.';
  if (c === 'network') return 'No hay conexión con el servidor. Revisá tu internet y volvé a intentar.';
  return 'No se pudo guardar el cambio. Volvé a intentar en unos segundos.';
};
/* ============================================================================
   Backend: Supabase
   - Autenticación: Supabase Auth (las contraseñas nunca pasan por esta app ni por la base).
   - Datos: PostgreSQL con Row Level Security (ver supabase/migrations).
   - Sincronización: Supabase Realtime; ante cada cambio se vuelve a leer la colección afectada.
   - Adjuntos: Supabase Storage (bucket privado "adjuntos").
   La interfaz usa una API mínima de documentos (doc / collection / onSnapshot / add / update / delete);
   este bloque la traduce a tablas relacionales.
   ============================================================================ */
const CFG = window.APP_CONFIG || {};
const APP_URL = () => (CFG.APP_URL || (window.location.origin + window.location.pathname)).replace(/#.*$/, '');
const INITIAL_HASH = window.location.hash || '';

const SUPA = (() => {
  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'].filter((k) => !CFG[k] || /^(TU_|PEGAR|xxx)/i.test(String(CFG[k])));
  if (missing.length) return { missing, reason: 'config' };
  if (!window.supabase || !window.supabase.createClient) return { missing: [], reason: 'lib' };
  const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  let WS = null, UID = null;
  const err = (e) => {
    if (!e) return null;
    const x = new Error(e.message || 'error'); x.raw = e;
    const m = String(e.message || '');
    x.code = e.code === '42501' || /row-level security|permission denied|Solo un administrador|propietario/i.test(m) ? 'permission'
      : e.code === '23503' ? 'in_use'
      : /fetch|network|Failed to/i.test(m) ? 'network' : (e.code || 'error');
    x.userMessage = /Solo un administrador|propietario/.test(m) ? m : null;
    return x;
  };
  const must = (r) => { if (r.error) throw err(r.error); return r.data; };
  const fetchAll = async (q) => {
    const out = []; let from = 0;
    for (;;) { const rows = must(await q().range(from, from + 999)); out.push.apply(out, rows); if (rows.length < 1000) break; from += 1000; }
    return out;
  };

  /* ---------- conversiones entre la app y la base ---------- */
  const ms = (v) => (v ? new Date(v).getTime() : null);
  const dOnly = (v) => (v ? String(v).slice(0, 10) : '');
  const tsDay = (v) => (v ? iso(new Date(v)) : '');
  const nul = (v) => (v === '' || v === undefined ? null : v);
  const ST_DB = { sin: 'sin_comenzar', curso: 'en_curso', rev: 'en_revision', fin: 'terminado' };
  const ST_APP = { sin_comenzar: 'sin', en_curso: 'curso', en_revision: 'rev', terminado: 'fin' };
  const PR_DB = { baja: 'baja', media: 'media', alta: 'alta', urg: 'urgente' };
  const PR_APP = { baja: 'baja', media: 'media', alta: 'alta', urgente: 'urg' };
  const pick = (patch, map) => { const o = {}; Object.keys(map).forEach((k) => { if (k in patch) { const m = map[k]; o[m[0]] = m[1] ? m[1](patch[k]) : patch[k]; } }); return o; };
  const DEF = {
    clients: {
      table: 'clients',
      from: (r) => ({ id: r.id, n: r.name, rut: r.rut, contacto: r.contact_name, tel: r.phone, mail: r.email, dir: r.address, resp: r.responsible_id || '', st: r.status, createdAt: ms(r.created_at) }),
      to: { n: ['name'], rut: ['rut'], contacto: ['contact_name'], tel: ['phone'], mail: ['email'], dir: ['address'], resp: ['responsible_id', nul], st: ['status'] }
    },
    projects: {
      table: 'projects',
      from: (r) => ({ id: r.id, p: r.name, cId: r.client_id, o: r.responsible_id || '', start: dOnly(r.start_date), due: dOnly(r.due_date), pr: PR_APP[r.priority] || 'media', desc: r.description, createdAt: ms(r.created_at) }),
      to: { p: ['name'], cId: ['client_id'], o: ['responsible_id', nul], start: ['start_date', nul], due: ['due_date', nul], pr: ['priority', (v) => PR_DB[v] || 'media'], desc: ['description', (v) => v || ''] }
    },
    tasks: {
      table: 'tasks',
      from: (r) => ({ id: r.id, n: r.name, cId: r.client_id, pId: r.project_id, o: r.assignee_id, s: ST_APP[r.status] || 'sin', pr: PR_APP[r.priority] || 'media', start: dOnly(r.start_date), due: dOnly(r.due_date), desc: r.description, files: r.files || [], created: tsDay(r.created_at), mod: tsDay(r.updated_at), by: r.created_by, hist: cache.hist[r.id] || [] }),
      to: { n: ['name'], cId: ['client_id'], pId: ['project_id'], o: ['assignee_id'], s: ['status', (v) => ST_DB[v] || 'sin_comenzar'], pr: ['priority', (v) => PR_DB[v] || 'media'], start: ['start_date', nul], due: ['due_date', nul], desc: ['description', (v) => v || ''], files: ['files'] }
    },
    activity: {
      table: 'activity',
      from: (r) => ({ id: r.id, at: ms(r.created_at), x: r.message, cId: r.client_id || '', k: r.kind || '' }),
      to: { x: ['message'], cId: ['client_id', nul], k: ['kind'] }
    },
    notifs: {
      table: 'notifications',
      from: (r) => ({ id: r.id, to: r.recipient_id, x: r.message, task: r.task_id, at: ms(r.created_at), read: r.read }),
      to: { to: ['recipient_id'], x: ['message'], task: ['task_id', nul], read: ['read'] }
    }
  };

  /* ---------- caché y lectura ---------- */
  const cache = { config: null, members: [], clients: [], projects: [], tasks: [], hist: {}, activity: [], notifs: [], invites: [], prefs: {}, comments: {} };
  const loaders = {
    config: async () => { const w = must(await sb.from('workspaces').select('id,name,owner_id,created_at').eq('id', WS).maybeSingle()); cache.config = w ? { name: w.name, owner: w.owner_id, createdAt: ms(w.created_at) } : null; },
    members: async () => {
      const ms_ = must(await sb.from('memberships').select('user_id,role,status,joined_at').eq('workspace_id', WS));
      const ids = ms_.map((m) => m.user_id);
      const ps = ids.length ? must(await sb.from('profiles').select('id,email,first_name,last_name').in('id', ids)) : [];
      const pById = {}; ps.forEach((p) => { pById[p.id] = p; });
      const owner = cache.config && cache.config.owner;
      cache.members = ms_.map((m) => {
        const p = pById[m.user_id] || {};
        const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.email || 'Integrante';
        return { id: m.user_id, name, first: p.first_name || '', last: p.last_name || '', email: p.email || '', role: m.role === 'admin' ? 'admin' : 'emp', active: m.status === 'activa', owner: m.user_id === owner, addedAt: ms(m.joined_at) };
      });
    },
    clients: async () => { cache.clients = (await fetchAll(() => sb.from('clients').select('*').eq('workspace_id', WS).order('created_at'))).map(DEF.clients.from); },
    projects: async () => { cache.projects = (await fetchAll(() => sb.from('projects').select('*').eq('workspace_id', WS).order('created_at'))).map(DEF.projects.from); },
    tasks: async () => {
      const [rows, hs] = await Promise.all([
        fetchAll(() => sb.from('tasks').select('*').eq('workspace_id', WS).order('created_at')),
        fetchAll(() => sb.from('task_history').select('task_id,message,created_at').eq('workspace_id', WS).order('created_at', { ascending: false }))
      ]);
      const h = {}; hs.forEach((x) => { (h[x.task_id] = h[x.task_id] || []).push({ d: tsDay(x.created_at), x: x.message }); });
      cache.hist = h;
      cache.tasks = rows.map(DEF.tasks.from);
    },
    activity: async () => { cache.activity = must(await sb.from('activity').select('*').eq('workspace_id', WS).order('created_at', { ascending: false }).limit(300)).map(DEF.activity.from); },
    notifs: async () => { cache.notifs = must(await sb.from('notifications').select('*').eq('workspace_id', WS).eq('recipient_id', UID).order('created_at', { ascending: false }).limit(100)).map(DEF.notifs.from); },
    invites: async () => {
      const r = await sb.from('invitations').select('id,email,role,status,created_at,expires_at,invited_by').eq('workspace_id', WS).eq('status', 'pendiente').order('created_at', { ascending: false });
      cache.invites = r.error ? [] : r.data.map((i) => ({ id: i.id, email: i.email, role: i.role === 'admin' ? 'admin' : 'emp', at: ms(i.created_at), exp: ms(i.expires_at), expired: ms(i.expires_at) < Date.now() }));
    },
    prefs: async () => { const p = must(await sb.from('profiles').select('tour_seen').eq('id', UID).maybeSingle()); cache.prefs = { seen: !!(p && p.tour_seen) }; }
  };
  const loadComments = async (taskId) => {
    const rows = must(await sb.from('task_comments').select('id,author_id,body,created_at').eq('task_id', taskId).order('created_at'));
    cache.comments[taskId] = rows.map((c) => ({ id: c.id, a: c.author_id, at: ms(c.created_at), x: c.body }));
  };

  /* ---------- suscripciones de la interfaz ---------- */
  const subs = new Set();
  const loaded = {};
  const emit = (name) => subs.forEach((s) => { if (s.name === name) s.fire(); });
  const refresh = async (names) => {
    for (const n of names) {
      try {
        if (n.indexOf('comments:') === 0) await loadComments(n.slice(9)); else await loaders[n]();
        loaded[n] = true; emit(n);
      } catch (e) { subs.forEach((s) => { if (s.name === n && s.onErr) s.onErr(err(e.raw || e)); }); }
    }
  };
  let pending = new Set(), timer = null;
  const schedule = (names) => { names.forEach((n) => pending.add(n)); clearTimeout(timer); timer = setTimeout(() => { const n = Array.from(pending); pending = new Set(); refresh(n); }, 180); };
  const docsOf = (rows) => ({ docs: rows.map((r) => { const o = Object.assign({}, r); const id = o.id; delete o.id; return { id, exists: true, data: () => o }; }) });
  const listen = (name, getSnap, cb, onErr) => {
    const s = { name, onErr, last: null, fire: () => { const sn = getSnap(); const sig = JSON.stringify(sn.docs ? sn.docs.map((d) => [d.id, d.data()]) : [sn.exists, sn.exists && sn.data()]); if (sig === s.last) return; s.last = sig; cb(sn); } };
    subs.add(s);
    if (loaded[name]) Promise.resolve().then(s.fire); else refresh([name]);
    return () => subs.delete(s);
  };
  const cmp = (a, op, b) => (op === '==' ? a === b : op === '!=' ? a !== b : op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : op === '>=' ? a >= b : false);
  const shape = (rows, q) => {
    let r = rows.slice();
    (q.w || []).forEach((w) => { r = r.filter((x) => cmp(x[w[0]], w[1], w[2])); });
    if (q.o) { const f = q.o[0], dir = q.o[1] === 'desc' ? -1 : 1; r.sort((a, b) => (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * dir); }
    if (q.l) r = r.slice(0, q.l);
    return docsOf(r);
  };

  /* ---------- escrituras ---------- */
  const histInsert = async (taskId, entries) => {
    if (!entries || !entries.length) return;
    must(await sb.from('task_history').insert(entries.map((h) => ({ task_id: taskId, message: h.x, actor_id: UID }))));
  };
  const memberUpdate = async (id, patch) => {
    const m = {};
    if ('role' in patch) m.role = patch.role === 'admin' ? 'admin' : 'empleado';
    if ('active' in patch) m.status = patch.active === false ? 'inactiva' : 'activa';
    if (Object.keys(m).length) must(await sb.from('memberships').update(m).eq('workspace_id', WS).eq('user_id', id));
    if (id === UID && ('first' in patch || 'last' in patch)) must(await sb.from('profiles').update({ first_name: (patch.first || '').trim(), last_name: (patch.last || '').trim() }).eq('id', UID));
    await refresh(['members']);
  };
  const unsupported = () => Promise.reject(Object.assign(new Error('unsupported'), { code: 'unsupported' }));

  const docRef = (path) => {
    const seg = path.split('/');
    const [col, id] = seg;
    const ref = {
      id, path,
      collection: (sub) => colRef(path + '/' + sub),
      onSnapshot: (cb, onErr) => {
        if (path === 'config/estudio') return listen('config', () => ({ id: 'estudio', exists: !!cache.config, data: () => cache.config }), cb, onErr);
        if (col === 'data' && seg[3] === 'prefs') return listen('prefs', () => ({ id: 'prefs', exists: true, data: () => cache.prefs }), cb, onErr);
        return () => {};
      },
      set: async (data) => {
        if (col === 'data' && seg[3] === 'prefs') { must(await sb.from('profiles').update({ tour_seen: !!data.seen }).eq('id', UID)); return refresh(['prefs']); }
        return unsupported();
      },
      update: async (patch) => {
        if (path === 'config/estudio') { must(await sb.from('workspaces').update({ name: patch.name }).eq('id', WS)); return refresh(['config']); }
        if (col === 'members') return memberUpdate(id, patch);
        const def = DEF[col]; if (!def) return unsupported();
        const row = pick(patch, def.to);
        if (Object.keys(row).length) must(await sb.from(def.table).update(row).eq('id', id));
        if (col === 'tasks' && patch.hist && patch.hist.length) await histInsert(id, [patch.hist[0]]);
        return refresh(col === 'tasks' ? ['tasks', 'clients', 'projects'] : [col]);
      },
      delete: async () => {
        const def = DEF[col]; if (!def) return unsupported();
        must(await sb.from(def.table).delete().eq('id', id));
        return refresh(col === 'tasks' ? ['tasks', 'clients', 'projects'] : [col]);
      }
    };
    return ref;
  };
  const colRef = (path, q) => {
    q = q || {};
    const seg = path.split('/');
    const isComments = seg[0] === 'tasks' && seg[2] === 'comments';
    const name = isComments ? 'comments:' + seg[1] : seg[0];
    const rows = () => (isComments ? cache.comments[seg[1]] || [] : name === 'requests' ? [] : cache[name] || []);
    return {
      path,
      doc: (id) => docRef(path + '/' + id),
      where: (f, op, v) => colRef(path, Object.assign({}, q, { w: (q.w || []).concat([[f, op, v]]) })),
      orderBy: (f, dir) => colRef(path, Object.assign({}, q, { o: [f, dir || 'asc'] })),
      limit: (n) => colRef(path, Object.assign({}, q, { l: n })),
      onSnapshot: (cb, onErr) => (name === 'requests' ? (Promise.resolve().then(() => cb(docsOf([]))), () => {}) : listen(name, () => shape(rows(), q), cb, onErr)),
      add: async (data) => {
        if (isComments) {
          must(await sb.from('task_comments').insert({ task_id: seg[1], body: data.x, author_id: UID }));
          await refresh([name]); return { id: null };
        }
        const def = DEF[name]; if (!def) return unsupported();
        const row = Object.assign(pick(data, def.to), { workspace_id: WS });
        if (name === 'activity') row.actor_id = UID;
        if (name === 'activity' || name === 'notifs') { must(await sb.from(def.table).insert(row)); if (name === 'activity') schedule(['activity']); return { id: null }; }
        const created = must(await sb.from(def.table).insert(row).select('id').single());
        if (name === 'tasks') await histInsert(created.id, (data.hist || []).slice(0, 1));
        await refresh(name === 'tasks' ? ['tasks', 'clients', 'projects'] : [name]);
        return { id: created.id };
      }
    };
  };
  const db = { doc: docRef, collection: (p) => colRef(p) };

  /* ---------- Realtime ---------- */
  let channel = null;
  const startRealtime = () => {
    const T = {
      workspaces: ['config'], memberships: ['members'], profiles: ['members', 'prefs'], invitations: ['invites'],
      clients: ['clients'], projects: ['projects'], tasks: ['tasks', 'clients', 'projects'], task_history: ['tasks'],
      activity: ['activity'], notifications: ['notifs']
    };
    channel = sb.channel('estudio-' + WS);
    Object.keys(T).forEach((table) => {
      const filter = table === 'workspaces' ? 'id=eq.' + WS : table === 'profiles' ? undefined : 'workspace_id=eq.' + WS;
      channel.on('postgres_changes', Object.assign({ event: '*', schema: 'public', table }, filter ? { filter } : {}), () => schedule(T[table]));
      // Las bajas no se pueden filtrar por estudio en Realtime: se escuchan aparte y solo disparan una relectura.
      if (filter && table !== 'workspaces') channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table }, () => schedule(T[table]));
    });
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_comments', filter: 'workspace_id=eq.' + WS }, (p) => {
      const t = p && p.new && p.new.task_id; if (t && cache.comments[t]) schedule(['comments:' + t]);
    });
    channel.subscribe();
    // Red de seguridad: si se perdió algún evento (equipo suspendido, red caída), se relee todo al volver.
    const all = () => schedule(Object.keys(loaders).concat(Object.keys(cache.comments).map((t) => 'comments:' + t)));
    window.addEventListener('focus', all);
    window.addEventListener('online', all);
    setInterval(all, 120000);
  };

  /* ---------- archivos ---------- */
  const assets = {
    upload: async (file, taskId) => {
      const safe = String(file.name || 'archivo').replace(/[^\w.\-]+/g, '_').slice(-120);
      const path = WS + '/' + taskId + '/' + Date.now().toString(36) + '-' + safe;
      must(await sb.storage.from('adjuntos').upload(path, file, { upsert: false, contentType: file.type || undefined }));
      return { id: path, url: '' };
    },
    download: async (f) => {
      const r = await sb.storage.from('adjuntos').createSignedUrl(f.id, 120, { download: f.name || true });
      if (r.error) throw err(r.error);
      const a = document.createElement('a'); a.href = r.data.signedUrl; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    }
  };

  /* ---------- autenticación e invitaciones ---------- */
  const fnError = async (error) => {
    let body = null;
    try { if (error && error.context && typeof error.context.json === 'function') body = await error.context.json(); } catch (e) {}
    const x = new Error((body && body.message) || 'No se pudo completar la operación.');
    x.code = (body && body.code) || 'function_error'; x.missing = body && body.missing;
    if (!body && /Failed to send a request|fetch/i.test(String(error && error.message))) {
      x.code = 'function_unreachable';
      x.message = 'No se pudo contactar a la función del servidor. Verificá que esté desplegada en Supabase (supabase functions deploy).';
    }
    return x;
  };
  const auth = {
    client: sb,
    getSession: async () => (await sb.auth.getSession()).data.session,
    onChange: (fn) => sb.auth.onAuthStateChange(fn),
    signIn: async (email, password) => { const r = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }); if (r.error) throw r.error; return r.data; },
    signUp: async (o) => {
      const r = await sb.auth.signUp({ email: o.email.trim().toLowerCase(), password: o.password, options: { emailRedirectTo: APP_URL(), data: { first_name: o.first, last_name: o.last, pending_studio: o.studio } } });
      if (r.error) throw r.error;
      return r.data;
    },
    createWorkspace: async (name) => { const r = await sb.rpc('create_workspace', { p_name: name }); if (r.error) throw err(r.error); await sb.auth.updateUser({ data: { pending_studio: null } }); return r.data; },
    myMemberships: async () => {
      const u = (await sb.auth.getUser()).data.user; if (!u) return [];
      const r = await sb.from('memberships').select('workspace_id,role,status,workspaces(name)').eq('user_id', u.id);
      if (r.error) throw err(r.error);
      return r.data.map((m) => ({ ws: m.workspace_id, role: m.role, active: m.status === 'activa', name: (m.workspaces && m.workspaces.name) || 'Estudio' }));
    },
    resetPassword: async (email) => { const r = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: APP_URL() }); if (r.error) throw r.error; },
    updatePassword: async (pw) => { const r = await sb.auth.updateUser({ password: pw }); if (r.error) throw r.error; },
    changePassword: async (email, cur, pw) => {
      const v = await sb.auth.signInWithPassword({ email, password: cur });
      if (v.error) { const e = new Error('bad'); e.code = 'bad'; throw e; }
      const r = await sb.auth.updateUser({ password: pw }); if (r.error) throw r.error;
      await sb.auth.signOut({ scope: 'others' });
    },
    /* cierre de sesión real: revoca la sesión de este dispositivo en Supabase y borra el token local.
       No toca datos del estudio ni las sesiones de otros usuarios o dispositivos. */
    signOut: async () => { try { if (channel) await sb.removeChannel(channel); } catch (e) {} const r = await sb.auth.signOut({ scope: 'local' }); if (r.error) { try { await sb.auth.signOut({ scope: 'local' }); } catch (e) {} } },
    getInvitation: async (token) => { const r = await sb.rpc('get_invitation', { p_token: token }); if (r.error) throw err(r.error); return r.data; },
    acceptNew: async (o) => { const r = await sb.functions.invoke('accept-invitation', { body: o }); if (r.error) throw await fnError(r.error); return r.data; },
    acceptExisting: async (token) => { const r = await sb.rpc('accept_invitation', { p_token: token }); if (r.error) throw err(r.error); return r.data; },
    invite: async (email, role) => {
      const r = await sb.functions.invoke('send-invitation', { body: { workspace_id: WS, email, role: role === 'admin' ? 'admin' : 'empleado' } });
      if (r.error) throw await fnError(r.error);
      await refresh(['invites']); return r.data;
    },
    cancelInvite: async (id) => { must(await sb.from('invitations').update({ status: 'cancelada' }).eq('id', id)); await refresh(['invites']); }
  };

  return {
    missing: null, sb, db, assets, auth,
    start: (ws, uid) => { WS = ws; UID = uid; startRealtime(); },
    ws: () => WS,
    exportData: () => JSON.parse(JSON.stringify({ estudio: cache.config, equipo: cache.members, clientes: cache.clients, proyectos: cache.projects, tareas: cache.tasks, actividad: cache.activity }))
  };
})();

/* ---------- Datos de la versión anterior guardados en este navegador (solo lectura, para importarlos) ---------- */
const LEGACY = (() => {
  const get = (k) => { try { const r = window.localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  const studios = () => {
    const out = [];
    const dir = get('gestion-estudio:directorio');
    if (dir && dir.studios) Object.keys(dir.studios).forEach((sid) => { const st = dir.studios[sid]; const data = get(st.key); if (data && data['config/estudio']) out.push({ key: st.key, name: data['config/estudio'].name || st.name, data }); });
    if (!out.some((x) => x.key === 'gestion-estudio:v1')) { const v1 = get('gestion-estudio:v1'); if (v1 && v1['config/estudio']) out.push({ key: 'gestion-estudio:v1', name: v1['config/estudio'].name, data: v1 }); }
    return out.map((x) => {
      const rows = (p) => Object.keys(x.data).filter((k) => k.indexOf(p + '/') === 0 && k.split('/').length === 2).map((k) => Object.assign({ id: k.split('/')[1] }, x.data[k]));
      const comments = (tid) => Object.keys(x.data).filter((k) => k.indexOf('tasks/' + tid + '/comments/') === 0).map((k) => x.data[k]).sort((a, b) => a.at - b.at);
      return { key: x.key, name: x.name, members: rows('members'), clients: rows('clients'), projects: rows('projects'), tasks: rows('tasks'), comments, imported: !!get('gestion-estudio:importado:' + x.key) };
    });
  };
  const blob = (id) => new Promise((res) => {
    if (typeof indexedDB === 'undefined') return res(null);
    const r = indexedDB.open('gestion-estudio-archivos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onerror = () => res(null);
    r.onsuccess = () => { try { const g = r.result.transaction('files', 'readonly').objectStore('files').get(id); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); } catch (e) { res(null); } };
  });
  const markImported = (key) => { try { window.localStorage.setItem('gestion-estudio:importado:' + key, String(Date.now())); } catch (e) {} };
  const wipe = (key) => {
    try {
      window.localStorage.removeItem(key);
      const dir = get('gestion-estudio:directorio');
      if (dir && dir.studios) {
        Object.keys(dir.studios).forEach((sid) => {
          if (dir.studios[sid].key !== key) return;
          delete dir.studios[sid];
          ['accounts', 'sessions', 'invites'].forEach((t) => Object.keys(dir[t] || {}).forEach((k) => { if ((dir[t][k] || {}).sid === sid) delete dir[t][k]; }));
        });
        if (Object.keys(dir.studios).length) window.localStorage.setItem('gestion-estudio:directorio', JSON.stringify(dir)); else window.localStorage.removeItem('gestion-estudio:directorio');
      }
      ['gestion-estudio:sesion', 'gestion-estudio:perfil'].forEach((k) => window.localStorage.removeItem(k));
    } catch (e) {}
  };
  return { studios, blob, markImported, wipe };
})();

const getCap = (n) => Promise.resolve((SUPA && SUPA[n]) || null);
const flashSet = (m) => { try { window.sessionStorage.setItem('gestion-estudio:aviso', m); } catch (e) {} };
const flashTake = () => { try { const m = window.sessionStorage.getItem('gestion-estudio:aviso'); window.sessionStorage.removeItem('gestion-estudio:aviso'); return m || ''; } catch (e) { return ''; } };
/* Recarga sin dejar una entrada nueva en el historial: todo el estado anterior se descarta. */
const reloadClean = () => { if (window.__reload) window.__reload(); else window.location.replace(window.location.href.split('#')[0]); };
/* Si el navegador restaura la página desde su caché al tocar "Atrás", se recarga para volver a verificar la sesión. */
window.addEventListener('pageshow', (e) => { if (e.persisted) reloadClean(); });
const Logo = ({ name, size }) => html`<div className="logo" style=${size ? { width: size, height: size, borderRadius: size / 3.6, fontSize: size * 0.42 } : null}>${initials(name).slice(0, 1)}</div>`;
const Screen1 = ({ children }) => html`<div className="setup"><div className="box">${children}</div></div>`;

/* ---------- Ingreso, registro, recuperación e invitaciones ---------- */
const AUTH_MSG = (e) => {
  const m = String((e && (e.message || e.msg)) || '');
  const c = e && (e.code || e.error_code);
  if (/invalid login credentials|invalid_credentials/i.test(m) || c === 'invalid_credentials') return 'El correo o la contraseña no son correctos.';
  if (/email not confirmed/i.test(m) || c === 'email_not_confirmed') return 'Todavía no confirmaste tu correo. Revisá tu bandeja de entrada (y la carpeta de spam).';
  if (/already registered|already been registered|user_already_exists/i.test(m) || c === 'user_already_exists') return 'Ya hay una cuenta con ese correo. Ingresá con tu contraseña.';
  if (/password/i.test(m) && /(weak|short|least|characters)/i.test(m)) return 'La contraseña es demasiado débil. Usá al menos 8 caracteres y combiná letras y números.';
  if (/rate limit|too many/i.test(m) || c === 'over_email_send_rate_limit') return 'Demasiados intentos seguidos. Esperá unos minutos y volvé a intentar.';
  if (/fetch|network/i.test(m)) return 'No hay conexión con el servidor. Revisá tu internet y volvé a intentar.';
  return m || 'No se pudo completar la operación. Volvé a intentar.';
};
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());
const AuthShell = ({ children }) => html`<div className="setup"><div className="box">
  <div className="brand" style=${{ padding: 0, marginBottom: 6 }}><div className="logo">G</div><div><b>Gestión del estudio</b><span>Clientes, proyectos y tareas</span></div></div>
  ${children}
</div></div>`;
const Field = ({ label, type, value, onChange, ac, ph, hint, disabled }) => html`<label className="fld">${label}<input className="inp" type=${type || 'text'} value=${value} onChange=${onChange} autoComplete=${ac} placeholder=${ph || ''} disabled=${disabled} />${hint && html`<span className="muted" style=${{ fontWeight: 400, fontSize: 12 }}>${hint}</span>`}</label>`;
const Notice = ({ text }) => html`<div className="note" role="status" style=${{ maxWidth: 'none', marginBottom: 16, background: 'var(--accent-soft)', color: 'var(--accent-soft-ink)' }}><${Icon} d=${ICON.check} s=${16} w=${2.2} style=${{ flex: 'none' }} />${text}</div>`;
const ErrLine = ({ text }) => html`<p role="alert" style=${{ color: 'var(--danger)', fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>${text}</p>`;
const pwCheck = (pw, pw2) => (pw.length < 8 ? 'La contraseña tiene que tener al menos 8 caracteres.' : pw !== pw2 ? 'Las contraseñas no coinciden.' : '');

function Login() {
  const [tab, setTab] = useState('in');
  const [f, setF] = useState({ email: '', pw: '', pw2: '', first: '', last: '', studio: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [notice] = useState(() => flashTake());
  const ch = (k) => (e) => { const v = e.target.value; setF((x) => Object.assign({}, x, { [k]: v })); setErr(''); };
  const go = (t) => { setTab(t); setErr(''); setDone(''); setF((x) => Object.assign({}, x, { pw: '', pw2: '' })); };
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    if (tab === 'forgot') {
      if (!validEmail(f.email)) { setErr('Escribí el correo de tu cuenta.'); return; }
      setBusy(true);
      try { await SUPA.auth.resetPassword(f.email); setDone('Si hay una cuenta con ' + f.email.trim() + ', te llegó un correo con un enlace para crear una contraseña nueva.'); }
      catch (x) { setErr(AUTH_MSG(x)); }
      setBusy(false); return;
    }
    if (tab === 'in') {
      if (!validEmail(f.email) || !f.pw) { setErr('Completá tu correo y tu contraseña.'); return; }
      setBusy(true);
      try { await SUPA.auth.signIn(f.email, f.pw); reloadClean(); }
      catch (x) { setErr(AUTH_MSG(x)); setBusy(false); }
      return;
    }
    if (!f.studio.trim()) { setErr('Escribí el nombre del estudio.'); return; }
    if (!f.first.trim()) { setErr('Escribí tu nombre.'); return; }
    if (!validEmail(f.email)) { setErr('Revisá el correo: no parece válido.'); return; }
    const pe = pwCheck(f.pw, f.pw2); if (pe) { setErr(pe); return; }
    setBusy(true);
    try {
      const r = await SUPA.auth.signUp({ email: f.email, password: f.pw, first: f.first.trim(), last: f.last.trim(), studio: f.studio.trim() });
      if (r.session) { reloadClean(); return; }       // confirmación de correo desactivada: entra directo
      setDone('Te enviamos un correo a ' + f.email.trim() + '. Abrí el enlace para confirmar tu cuenta; después ingresá y se crea el espacio de ' + f.studio.trim() + '.');
    } catch (x) { setErr(AUTH_MSG(x)); }
    setBusy(false);
  };
  const title = tab === 'in' ? 'Ingresá a tu estudio' : tab === 'up' ? 'Registrá tu estudio' : 'Recuperar contraseña';
  const sub = tab === 'in' ? 'Con tu correo y tu contraseña entrás al espacio de trabajo de tu estudio, desde cualquier computadora.'
    : tab === 'up' ? 'Creá el espacio de trabajo y tu usuario de administrador. Después invitás al resto del equipo por correo.'
    : 'Escribí el correo de tu cuenta y te enviamos un enlace para crear una contraseña nueva.';
  return html`<${AuthShell}>
    <h1>${title}</h1>
    <p className="muted" style=${{ lineHeight: 1.55, marginBottom: 18 }}>${sub}</p>
    ${notice && html`<${Notice} text=${notice} />`}
    ${tab !== 'forgot' && html`<div className="seg" role="tablist" aria-label="Ingresar o registrar" style=${{ marginBottom: 18 }}>
      <button type="button" role="tab" aria-selected=${tab === 'in' ? 'true' : 'false'} aria-pressed=${tab === 'in' ? 'true' : 'false'} style=${{ flex: 1 }} onClick=${() => go('in')}>Ingresar</button>
      <button type="button" role="tab" aria-selected=${tab === 'up' ? 'true' : 'false'} aria-pressed=${tab === 'up' ? 'true' : 'false'} style=${{ flex: 1 }} onClick=${() => go('up')}>Registrar</button>
    </div>`}
    ${done ? html`<${Notice} text=${done} /><button className="btn" onClick=${() => go('in')}>Volver a ingresar</button>` : html`
    <form onSubmit=${submit} noValidate style=${{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      ${tab === 'up' && html`
        <${Field} label="Nombre del estudio" value=${f.studio} onChange=${ch('studio')} ac="organization" ph="Ej.: Estudio Contable Rodríguez & Asociados" />
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
          <${Field} label="Nombre" value=${f.first} onChange=${ch('first')} ac="given-name" />
          <${Field} label="Apellido" value=${f.last} onChange=${ch('last')} ac="family-name" />
        </div>`}
      <${Field} label="Correo" type="email" value=${f.email} onChange=${ch('email')} ac="email" ph="nombre@estudio.com.uy" />
      ${tab !== 'forgot' && html`<${Field} label="Contraseña" type="password" value=${f.pw} onChange=${ch('pw')} ac=${tab === 'in' ? 'current-password' : 'new-password'} ph=${tab === 'up' ? 'Al menos 8 caracteres' : ''} />`}
      ${tab === 'up' && html`<${Field} label="Repetir contraseña" type="password" value=${f.pw2} onChange=${ch('pw2')} ac="new-password" />`}
      ${err && html`<${ErrLine} text=${err} />`}
      <button type="submit" className="btn pri" style=${{ height: 46, marginTop: 4 }} disabled=${busy}>${busy ? 'Un momento…' : tab === 'in' ? 'Entrar' : tab === 'up' ? 'Registrar estudio' : 'Enviar enlace'}</button>
    </form>`}
    ${tab === 'in' && !done && html`<button className="link" style=${{ marginTop: 14, padding: 0 }} onClick=${() => go('forgot')}>¿Olvidaste tu contraseña?</button>`}
    ${tab === 'forgot' && html`<button className="link" style=${{ marginTop: 14, padding: 0 }} onClick=${() => go('in')}>Volver a ingresar</button>`}
  <//>`;
}

function NewPassword() {
  const [f, setF] = useState({ pw: '', pw2: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const ch = (k) => (e) => { const v = e.target.value; setF((x) => Object.assign({}, x, { [k]: v })); setErr(''); };
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    const pe = pwCheck(f.pw, f.pw2); if (pe) { setErr(pe); return; }
    setBusy(true);
    try { await SUPA.auth.updatePassword(f.pw); flashSet('Contraseña actualizada.'); reloadClean(); }
    catch (x) { setErr(AUTH_MSG(x)); setBusy(false); }
  };
  return html`<${AuthShell}>
    <h1>Creá tu contraseña nueva</h1>
    <p className="muted" style=${{ lineHeight: 1.55, marginBottom: 18 }}>Elegí una contraseña de al menos 8 caracteres.</p>
    <form onSubmit=${submit} noValidate style=${{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <${Field} label="Contraseña nueva" type="password" value=${f.pw} onChange=${ch('pw')} ac="new-password" />
      <${Field} label="Repetir contraseña" type="password" value=${f.pw2} onChange=${ch('pw2')} ac="new-password" />
      ${err && html`<${ErrLine} text=${err} />`}
      <button type="submit" className="btn pri" style=${{ height: 46 }} disabled=${busy}>${busy ? 'Guardando…' : 'Guardar contraseña'}</button>
    </form>
  <//>`;
}

const INVITE_MSG = {
  invalida: 'Este enlace de invitación no es válido. Revisá que lo hayas copiado completo o pedile al administrador que te envíe uno nuevo.',
  vencida: 'Esta invitación venció. Pedile al administrador del estudio que te envíe una nueva.',
  aceptada: 'Esta invitación ya se usó. Ingresá con tu correo y tu contraseña.',
  cancelada: 'Esta invitación fue cancelada. Si necesitás acceso, hablá con el administrador del estudio.'
};
function AcceptInvite({ token }) {
  const [info, setInfo] = useState(null);
  const [session, setSession] = useState(undefined);
  const [f, setF] = useState({ first: '', last: '', pw: '', pw2: '', loginPw: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  useEffect(() => {
    SUPA.auth.getInvitation(token).then(setInfo).catch((e) => setInfo({ status: 'error', message: AUTH_MSG(e) }));
    SUPA.auth.getSession().then((s) => setSession(s || null));
  }, []);
  const ch = (k) => (e) => { const v = e.target.value; setF((x) => Object.assign({}, x, { [k]: v })); setErr(''); };
  const enter = (ws) => { try { window.localStorage.setItem('gestion-estudio:ws', ws); } catch (e) {} flashSet('Te sumaste a ' + info.workspace_name + '.'); reloadClean(); };
  if (!info || session === undefined) return html`<${AuthShell}><div style=${{ textAlign: 'center', paddingTop: 30 }}><div className="spin"></div><p className="muted">Verificando la invitación…</p></div><//>`;
  if (info.status !== 'pendiente') return html`<${AuthShell}>
    <h1>No se puede usar esta invitación</h1>
    <p className="muted" style=${{ lineHeight: 1.55 }}>${info.status === 'error' ? info.message : INVITE_MSG[info.status] || INVITE_MSG.invalida}</p>
    <button className="btn pri" style=${{ marginTop: 18 }} onClick=${reloadClean}>Ir a ingresar</button>
  <//>`;
  const sessEmail = session && session.user && String(session.user.email || '').toLowerCase();
  const wrongUser = session && sessEmail !== info.email;
  const acceptWithSession = async () => {
    setBusy(true);
    try { enter(await SUPA.auth.acceptExisting(token)); } catch (x) { setErr(AUTH_MSG(x)); setBusy(false); }
  };
  const loginAndAccept = async (e) => {
    e.preventDefault(); if (busy) return;
    setBusy(true);
    try { await SUPA.auth.signIn(info.email, f.loginPw); enter(await SUPA.auth.acceptExisting(token)); }
    catch (x) { setErr(AUTH_MSG(x)); setBusy(false); }
  };
  const create = async (e) => {
    e.preventDefault(); if (busy) return;
    if (!f.first.trim()) { setErr('Escribí tu nombre.'); return; }
    const pe = pwCheck(f.pw, f.pw2); if (pe) { setErr(pe); return; }
    setBusy(true);
    try {
      const r = await SUPA.auth.acceptNew({ token, password: f.pw, first_name: f.first.trim(), last_name: f.last.trim() });
      await SUPA.auth.signIn(info.email, f.pw);
      enter(r && r.workspace_id ? r.workspace_id : '');
    } catch (x) {
      if (x && x.code === 'user_exists') { setNeedLogin(true); setErr(''); }
      else setErr(x && x.code === 'missing_env' ? x.message : AUTH_MSG(x));
      setBusy(false);
    }
  };
  return html`<${AuthShell}>
    <h1>Te invitaron a ${info.workspace_name}</h1>
    <p className="muted" style=${{ lineHeight: 1.55, marginBottom: 18 }}>${info.invited_by_name ? info.invited_by_name + ' te invitó' : 'Te invitaron'} a sumarte al espacio de trabajo del estudio como ${info.role === 'admin' ? 'administrador/a' : 'empleado/a'}.</p>
    ${wrongUser ? html`<div className="lock" style=${{ flexDirection: 'column', gap: 10 }}>
        <p style=${{ lineHeight: 1.5 }}>La invitación es para <b>${info.email}</b>, pero tenés abierta la sesión de <b>${sessEmail}</b>.</p>
        <button className="btn" onClick=${async () => { await SUPA.auth.signOut(); window.location.reload(); }}>Cerrar esa sesión y continuar</button></div>`
    : session ? html`<p style=${{ lineHeight: 1.5, marginBottom: 14 }}>Vas a sumarte con tu cuenta <b>${info.email}</b>.</p>
        ${err && html`<${ErrLine} text=${err} />`}
        <button className="btn pri" style=${{ height: 46, width: '100%' }} disabled=${busy} onClick=${acceptWithSession}>${busy ? 'Un momento…' : 'Aceptar invitación'}</button>`
    : needLogin ? html`<form onSubmit=${loginAndAccept} noValidate style=${{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style=${{ lineHeight: 1.5 }}>Ya tenés una cuenta con <b>${info.email}</b>. Ingresá tu contraseña para aceptar la invitación.</p>
        <${Field} label="Contraseña" type="password" value=${f.loginPw} onChange=${ch('loginPw')} ac="current-password" />
        ${err && html`<${ErrLine} text=${err} />`}
        <button type="submit" className="btn pri" style=${{ height: 46 }} disabled=${busy}>${busy ? 'Un momento…' : 'Ingresar y aceptar'}</button></form>`
    : html`<form onSubmit=${create} noValidate style=${{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <${Field} label="Correo" value=${info.email} ac="email" disabled=${true} hint="La cuenta se crea con el correo al que llegó la invitación." />
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
          <${Field} label="Nombre" value=${f.first} onChange=${ch('first')} ac="given-name" />
          <${Field} label="Apellido" value=${f.last} onChange=${ch('last')} ac="family-name" />
        </div>
        <${Field} label="Contraseña" type="password" value=${f.pw} onChange=${ch('pw')} ac="new-password" ph="Al menos 8 caracteres" />
        <${Field} label="Repetir contraseña" type="password" value=${f.pw2} onChange=${ch('pw2')} ac="new-password" />
        ${err && html`<${ErrLine} text=${err} />`}
        <button type="submit" className="btn pri" style=${{ height: 46, marginTop: 4 }} disabled=${busy}>${busy ? 'Creando tu cuenta…' : 'Aceptar invitación'}</button>
      </form>`}
    <p className="muted" style=${{ marginTop: 16, fontSize: 13 }}>La invitación vence el ${fmtY(iso(new Date(info.expires_at)))}.</p>
  <//>`;
}

function ConfigMissing() {
  const lib = SUPA.reason === 'lib';
  return html`<${AuthShell}>
    <h1>${lib ? 'No se pudo cargar Supabase' : 'Falta configurar la conexión con Supabase'}</h1>
    ${lib ? html`<p className="muted" style=${{ lineHeight: 1.55 }}>La librería de Supabase no cargó. Revisá tu conexión a internet y recargá la página.</p>`
      : html`<p className="muted" style=${{ lineHeight: 1.55 }}>La app todavía no sabe a qué proyecto de Supabase conectarse. Faltan estas variables:</p>
      <ul style=${{ margin: '12px 0', paddingLeft: 20, lineHeight: 1.8 }}>${SUPA.missing.map((m) => html`<li key=${m}><code>${m}</code></li>`)}</ul>
      <ol style=${{ paddingLeft: 20, lineHeight: 1.6, color: 'var(--ink2)' }}>
        <li>Copiá <code>.env.example</code> como <code>.env</code> y completá los valores (Supabase › Project Settings › API).</li>
        <li>Ejecutá <code>node scripts/generar-config.mjs</code>: crea <code>js/config.js</code>.</li>
        <li>Recargá esta página.</li>
      </ol>`}
  <//>`;
}

function Root() {
  const [st, setSt] = useState({ phase: 'loading' });
  const tokenInvite = (window.location.hash.match(/invitacion=([a-f0-9]{64})/) || [])[1];
  useEffect(() => {
    if (SUPA.missing) return;
    if (tokenInvite) return;
    let alive = true;
    let recovery = /type=recovery/.test(INITIAL_HASH);
    const { data: sub } = SUPA.auth.onChange((evt) => {
      if (evt === 'PASSWORD_RECOVERY') { recovery = true; setSt({ phase: 'recovery' }); }
      if (evt === 'SIGNED_OUT') reloadClean();
    });
    (async () => {
      try {
        const s = await SUPA.auth.getSession();
        if (!alive) return;
        if (recovery && s) { setSt({ phase: 'recovery' }); return; }
        if (!s) { setSt({ phase: 'login' }); return; }
        let ms_ = await SUPA.auth.myMemberships();
        const pendingStudio = s.user.user_metadata && s.user.user_metadata.pending_studio;
        if (pendingStudio && !ms_.some((m) => m.role === 'admin' && m.name === pendingStudio)) {
          const ws = await SUPA.auth.createWorkspace(pendingStudio);
          try { window.localStorage.setItem('gestion-estudio:ws', ws); } catch (e) {}
          ms_ = await SUPA.auth.myMemberships();
        }
        const active = ms_.filter((m) => m.active);
        if (!active.length) { setSt({ phase: ms_.length ? 'disabled' : 'none', user: s.user }); return; }
        let saved = null; try { saved = window.localStorage.getItem('gestion-estudio:ws'); } catch (e) {}
        const chosen = active.find((m) => m.ws === saved) || (active.length === 1 ? active[0] : null);
        if (!chosen) { setSt({ phase: 'pick', list: active }); return; }
        if (recovery) { setSt({ phase: 'recovery' }); return; }
        SUPA.start(chosen.ws, s.user.id);
        setSt({ phase: 'app', ws: chosen, list: active, user: s.user });
      } catch (e) { if (alive) setSt({ phase: 'error', message: AUTH_MSG(e) }); }
    })();
    return () => { alive = false; sub && sub.subscription && sub.subscription.unsubscribe(); };
  }, []);
  if (SUPA.missing) return html`<${ConfigMissing} />`;
  if (tokenInvite) return html`<${AcceptInvite} token=${tokenInvite} />`;
  const out = html`<button className="btn" style=${{ marginTop: 18 }} onClick=${async () => { flashSet('Cerraste sesión.'); await SUPA.auth.signOut(); reloadClean(); }}><${Icon} d=${ICON.out} s=${16} />Cerrar sesión</button>`;
  switch (st.phase) {
    case 'loading': return html`<${Screen1}><div style=${{ textAlign: 'center', paddingTop: 40 }}><div className="spin"></div><p className="muted">Cargando el espacio de trabajo…</p></div><//>`;
    case 'login': return html`<${Login} />`;
    case 'recovery': return html`<${NewPassword} />`;
    case 'error': return html`<${AuthShell}><h1>No se pudo cargar el estudio</h1><p className="muted" style=${{ lineHeight: 1.55 }}>${st.message}</p><button className="btn pri" style=${{ marginTop: 18 }} onClick=${() => window.location.reload()}>Volver a intentar</button>${out}<//>`;
    case 'none': return html`<${AuthShell}><h1>Todavía no pertenecés a ningún estudio</h1><p className="muted" style=${{ lineHeight: 1.55 }}>Para entrar a un estudio, pedile a su administrador que te invite. Te va a llegar un correo con el enlace «Aceptar invitación».</p>${out}<//>`;
    case 'disabled': return html`<${AuthShell}><h1>Tu acceso está desactivado</h1><p className="muted" style=${{ lineHeight: 1.55 }}>Un administrador del estudio desactivó tu usuario. Tus tareas y tu historial se conservan. Si creés que es un error, hablá con el estudio.</p>${out}<//>`;
    case 'pick': return html`<${AuthShell}><h1>Elegí un estudio</h1><p className="muted" style=${{ marginBottom: 14 }}>Formás parte de más de un estudio.</p>
      ${st.list.map((m) => html`<button key=${m.ws} className="luser" onClick=${() => { try { window.localStorage.setItem('gestion-estudio:ws', m.ws); } catch (e) {} window.location.reload(); }}><${Logo} name=${m.name} /><span className="who"><b>${m.name}</b><span>${m.role === 'admin' ? 'Administrador/a' : 'Empleado/a'}</span></span><${Icon} d=${ICON.right} /></button>`)}${out}<//>`;
    default: return html`<${App} wsList=${st.list} />`;
  }
}
window.addEventListener('hashchange', () => { if (/invitacion=/.test(window.location.hash)) window.location.reload(); });

/* ---------- App ---------- */
function App({ wsList }) {
  const [cap, setCap] = useState(null);
  const [d, setD] = useState({});
  const [ui, setUi] = useState({
    screen: null, sel: null, modal: null, form: null, confirmDel: false,
    q: '', tSt: 'all', tOwn: 'all', group: 'none', sort: 'due', scope: null,
    calView: 'mes', calRef: TODAY, hideDone: true, fEmp: 'all', fCli: 'all', fPro: 'all', fSt: 'all',
    gq: '', notif: false, draft: '', faq: -1, sheet: false, cli: null, pro: null,
    phase: undefined, step: 0, busy: false, studioDraft: null, pmenu: false, confirmOut: false, draftTask: null
  });
  const [toast, setToast] = useState('');
  const [rect, setRect] = useState(null);
  const [comments, setComments] = useState([]);
  const [hits, setHits] = useState([]);
  const [fatal, setFatal] = useState('');
  const tRef = useRef(null);
  const ensured = useRef(false);
  const formInit = useRef(null);
  const dirtyRef = useRef(null);
  const leaving = useRef(false);
  const set = (p) => setUi((u) => Object.assign({}, u, typeof p === 'function' ? p(u) : p));
  const flash = (m) => { setToast(m); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(''), 4500); };
  const run = async (fn, ok) => { try { await fn(); if (ok) flash(ok); return true; } catch (e) { flash(errMsg(e)); return false; } };

  /* arranque: la sesión ya la verificó Root; acá solo se toma el usuario y el estudio elegido */
  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await SUPA.auth.getSession();
      if (!s) { reloadClean(); return; }
      if (alive) setCap({ db: SUPA.db, assets: SUPA.assets, me: { id: s.user.id, email: s.user.email }, myId: s.user.id, owner: false });
    })();
    return () => { alive = false; };
  }, []);

  const db = cap && cap.db;
  const myId = cap && cap.myId;

  /* suscripciones */
  useEffect(() => {
    if (!db || !myId) return;
    const subs = [];
    const onErr = (e) => { if (e && e.code === 'network') flash('Sin conexión con el servidor. Los cambios se van a ver cuando vuelva la conexión.'); };
    const put = (k, v) => setD((x) => Object.assign({}, x, { [k]: v, [k + 'L']: true }));
    const col = (key, q) => subs.push(q.onSnapshot((s) => put(key, s.docs.map((x) => Object.assign({ id: x.id }, x.data()))), onErr));
    try {
      subs.push(db.doc('config/estudio').onSnapshot((s) => put('config', s.exists ? s.data() : null), onErr));
      col('members', db.collection('members'));
      col('clients', db.collection('clients'));
      col('projects', db.collection('projects'));
      col('tasks', db.collection('tasks'));
      col('invites', db.collection('invites'));
      col('activity', db.collection('activity').orderBy('at', 'desc').limit(200));
      col('notifs', db.collection('notifs').where('to', '==', myId));
      subs.push(db.doc('data/users/' + myId + '/prefs').onSnapshot((s) => put('prefs', s.exists ? s.data() : {}), () => put('prefs', {})));
    } catch (e) { setFatal('error'); }
    return () => subs.forEach((u) => { try { u(); } catch (e) {} });
  }, [db, myId]);

  /* comentarios de la tarea abierta */
  useEffect(() => {
    setComments([]);
    if (!db || !ui.sel) return;
    let un = null;
    try { un = db.doc('tasks/' + ui.sel).collection('comments').onSnapshot((s) => setComments(s.docs.map((x) => Object.assign({ id: x.id }, x.data())).sort((a, b) => a.at - b.at)), () => {}); } catch (e) {}
    return () => { if (un) un(); };
  }, [db, ui.sel]);

  /* snapshot del formulario al abrir un modal, para detectar cambios sin guardar */
  useEffect(() => { formInit.current = ui.modal ? JSON.stringify(ui.form) : null; }, [ui.modal]);

  /* guardia de sesión: si la sesión deja de ser válida (cierre en otra pestaña, token borrado, vencida),
     se recarga y aparece la pantalla de ingreso */
  useEffect(() => {
    if (!myId) return;
    const chk = async () => { const s = await SUPA.auth.getSession(); if (!s || s.user.id !== myId) { leaving.current = true; reloadClean(); } };
    const onVis = () => { if (document.visibilityState === 'visible') chk(); };
    const onStorage = (e) => { if (!e.key || /^sb-.*-auth-token$/.test(e.key)) chk(); };   // cierre de sesión en otra pestaña
    window.addEventListener('storage', onStorage); window.addEventListener('focus', chk); document.addEventListener('visibilitychange', onVis);
    const iv = setInterval(chk, 60000);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', chk); document.removeEventListener('visibilitychange', onVis); clearInterval(iv); };
  }, [myId]);

  /* advertir al cerrar la pestaña si hay cambios sin guardar */
  useEffect(() => {
    const h = (e) => { if (!leaving.current && dirtyRef.current && dirtyRef.current.length) { e.preventDefault(); e.returnValue = ''; return ''; } };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, []);

  /* Escape */
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') set((u) => (u.phase ? {} : u.confirmOut ? { confirmOut: false } : u.pmenu ? { pmenu: false } : { sel: null, modal: null, notif: false, gq: '', sheet: false, confirmDel: false })); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);

  const members = d.members || [];
  const member = members.find((m) => m.id === myId) || null;
  const isA = !!(member && member.active !== false && member.role === 'admin');
  const role = isA ? 'admin' : 'emp';
  const steps = TOUR[role];
  const cur = steps[Math.min(ui.step, steps.length - 1)];

  /* primera visita: bienvenida */
  useEffect(() => {
    if (ui.phase !== undefined || !d.prefsL || !d.config || !member) return;
    set({ phase: d.prefs && d.prefs.seen ? null : 'welcome', screen: ui.screen || (isA ? 'dash' : 'esp') });
  }, [d.prefsL, d.config, member]);

  /* tutorial: medir el elemento destacado */
  useEffect(() => {
    if (ui.phase !== 'steps' || cur.target === 'center') { setRect(null); return; }
    let first = true;
    const m = () => {
      const el = document.getElementById('tour-' + cur.target);
      if (!el) { setRect(null); return; }
      if (first) {
        first = false;
        const r0 = el.getBoundingClientRect();
        if (r0.top < 80 || r0.bottom > window.innerHeight - 40) el.scrollIntoView({ block: r0.height > window.innerHeight * 0.6 ? 'start' : 'center' });
      }
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight });
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(m));
    window.addEventListener('resize', m); window.addEventListener('scroll', m, true);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', m); window.removeEventListener('scroll', m, true); };
  }, [ui.phase, ui.step, ui.screen]);

  /* ---------- pantallas previas ---------- */
  const toastEl = toast && html`<div className="toast" role="status">${toast}</div>`;
  if (!cap) return html`<${Screen1}><div style=${{ textAlign: 'center', paddingTop: 40 }}><div className="spin"></div><p className="muted">Cargando el espacio de trabajo…</p></div><//>`;
  if (fatal) return html`<${Screen1}><h1>No se pudo cargar el estudio</h1><p className="muted">Recargá la página para volver a intentar.</p><//>`;
  const loaded = d.configL && d.membersL && d.tasksL && d.clientsL && d.projectsL && d.prefsL;
  if (!loaded) return html`<${Screen1}><div style=${{ textAlign: 'center', paddingTop: 40 }}><div className="spin"></div><p className="muted">Cargando el espacio de trabajo…</p></div><//>`;
  const quickOut = html`<button className="btn" style=${{ marginTop: 18 }} onClick=${async () => { leaving.current = true; flashSet('Cerraste sesión.'); await SUPA.auth.signOut(); reloadClean(); }}><${Icon} d=${ICON.out} s=${16} />Cerrar sesión</button>`;
  if (!d.config) return html`<${Screen1}><h1>No tenés acceso a este estudio</h1><p className="muted" style=${{ lineHeight: 1.55 }}>Puede que te hayan quitado el acceso. Si creés que es un error, hablá con el administrador del estudio.</p>${quickOut}<//>`;
  const studio = d.config.name || 'Estudio';
  /* acceso desactivado mientras la app estaba abierta */
  if (!member || member.active === false) return html`<${Screen1}><${Logo} name=${studio} size=${52} /><h1>Tu acceso está desactivado</h1><p className="muted" style=${{ lineHeight: 1.55 }}>Un administrador de ${studio} desactivó tu usuario. Tus tareas y tu historial se conservan. Si creés que es un error, hablá con el estudio.</p>${quickOut}<//>${toastEl}`;
  cap.owner = !!member.owner;

  /* ---------- derivados ---------- */
  const me = member;
  const myName = me.name;
  const firstName = String(myName).split(' ')[0];
  const team = members.filter((m) => m.active !== false).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const mname = (id) => { const m = members.find((x) => x.id === id); return m ? m.name : 'Ex integrante'; };
  const av = (id, s) => { s = s || 28; const n = mname(id); return html`<span className="av" title=${n} style=${{ width: s, height: s, background: AVS[hash(id) % 4], fontSize: Math.round(s * 0.38) }}>${initials(n)}</span>`; };
  const clients = (d.clients || []).slice().sort((a, b) => String(a.n).localeCompare(String(b.n)));
  const projects = d.projects || [];
  const tasks = d.tasks || [];
  const cById = {}; clients.forEach((c) => { cById[c.id] = c; });
  const pById = {}; projects.forEach((p) => { pById[p.id] = p; });
  const cn = (t) => (cById[t.cId] || {}).n || 'Sin cliente';
  const pn = (t) => (pById[t.pId] || {}).p || 'Sin proyecto';

  const mine = tasks.filter((t) => isA || t.o === myId);
  const open = mine.filter((t) => t.s !== 'fin');
  const cnt = (k) => mine.filter((t) => t.s === k).length;
  const lateL = open.filter(isLate).sort(byDue);
  const todayL = open.filter((t) => t.due === TODAY).sort(byDue);
  const myClients = isA ? clients : clients.filter((c) => mine.some((t) => t.cId === c.id));
  const projTasks = (p) => tasks.filter((t) => t.pId === p.id);
  const myProjects = projects.filter((p) => isA || mine.some((t) => t.pId === p.id)).sort((a, b) => String(a.p).localeCompare(String(b.p)));
  const projStatus = (p) => {
    const ts = projTasks(p);
    if (!ts.length) return { l: 'Sin tareas', bg: 'var(--s-sin-bg)', fg: 'var(--s-sin-fg)' };
    if (ts.every((t) => t.s === 'fin')) return { l: 'Terminado', bg: ST.fin.bg, fg: ST.fin.fg };
    if (ts.some(isLate)) return { l: 'Con atrasos', bg: 'var(--s-late-bg)', fg: 'var(--s-late-fg)' };
    return { l: 'En curso', bg: ST.curso.bg, fg: ST.curso.fg };
  };
  const myNotifs = (d.notifs || []).slice().sort((a, b) => b.at - a.at);
  const unread = myNotifs.filter((n) => !n.read).length;
  const reminders = open.filter((t) => t.o === myId && t.due && diff(t.due, TODAY) <= 1).sort(byDue);
  const requests = [];
  const invites = isA ? (d.invites || []) : [];

  /* ---------- acciones ---------- */
  const go = (screen, extra) => { set(Object.assign({ screen, sel: null, notif: false, gq: '', modal: null, sheet: false }, extra || {})); window.scrollTo(0, 0); };
  const openTask = (id) => set((u) => ({ sel: id, notif: false, gq: '', draft: u.draftTask === id ? u.draft : '', confirmDel: false }));
  const scopeTo = (cId, pId) => go('tareas', { scope: { cId, pId }, q: '', tSt: 'all', tOwn: 'all' });
  const logAct = (x, cId, k) => db.collection('activity').add({ at: Date.now(), x, cId: cId || '', k: k || '' }).catch(() => {});
  const notify = (to, x, task) => { if (to && to !== myId) db.collection('notifs').add({ to, x, task: task || null, at: Date.now(), read: false }).catch(() => {}); };
  const notifyAdmins = (x, task) => team.filter((m) => m.role === 'admin').forEach((m) => notify(m.id, x, task));
  const updTask = (t, patch, histX) => db.doc('tasks/' + t.id).update(Object.assign({}, patch, { mod: TODAY }, histX ? { hist: [{ d: TODAY, x: histX }].concat(t.hist || []).slice(0, 60) } : {}));
  const setStatus = (t, k, opt) => {
    if (t.s === k) return;
    opt = opt || {};
    run(async () => {
      await updTask(t, { s: k }, opt.hist || (myName + ' cambió el estado a “' + ST[k].l + '”.'));
      logAct(opt.act || (myName + ' pasó “' + t.n + '” a ' + ST[k].l), t.cId, k);
      if (!isA && k === 'rev') notifyAdmins(myName + ' envió “' + t.n + '” a revisión.', t.id);
      if (!isA && k === 'fin') notifyAdmins(myName + ' terminó “' + t.n + '”.', t.id);
      if (isA) notify(t.o, opt.note || (myName + ' cambió el estado de “' + t.n + '” a ' + ST[k].l + '.'), t.id);
    }, opt.msg || (k === 'fin' ? 'Tarea terminada. Ya no aparece en el calendario, pero queda guardada.' : 'Estado actualizado: ' + ST[k].l + '.'));
  };
  const markSeen = () => db.doc('data/users/' + myId + '/prefs').set(Object.assign({}, d.prefs || {}, { seen: true })).catch(() => {});
  const startTour = () => set({ phase: 'steps', step: 0, screen: steps[0].screen, sel: null, notif: false, modal: null, gq: '', sheet: false });
  const stepTo = (i) => { if (i < 0) return; if (i >= steps.length) { set({ phase: 'done' }); return; } set({ step: i, screen: steps[i].screen }); };
  const endTour = (skipped) => {
    markSeen();
    set({ phase: null, screen: isA ? 'dash' : 'esp' }); window.scrollTo(0, 0);
    if (skipped) flash('Tutorial omitido. Podés repetirlo cuando quieras desde Ayuda.');
  };

  /* ---------- sesión ---------- */
  const pending = [];
  if (['form', 'member', 'account', 'profile'].indexOf(ui.modal) >= 0 && formInit.current !== null && JSON.stringify(ui.form) !== formInit.current) pending.push('Un formulario abierto con cambios');
  if (ui.draft.trim()) pending.push('Un comentario que todavía no enviaste');
  if (ui.studioDraft !== null && ui.studioDraft.trim() !== studio) pending.push('El nuevo nombre del estudio, sin guardar');
  dirtyRef.current = pending;
  const doLogout = () => {
    leaving.current = true;
    flashSet('Cerraste sesión. Tus datos quedaron guardados.');
    SUPA.auth.signOut().finally(reloadClean);
  };
  const requestLogout = () => {
    set({ pmenu: false, sheet: false });
    if (pending.length) set({ confirmOut: true }); else doLogout();
  };
  const keepEditing = () => {
    if (ui.studioDraft !== null && ui.studioDraft.trim() !== studio) go('cfg', { studioDraft: ui.studioDraft });
    else if (ui.draft.trim() && ui.draftTask && !ui.modal) set({ confirmOut: false, sel: ui.draftTask });
    set({ confirmOut: false });
  };
  const account = { email: me.email || (cap.me && cap.me.email) || '' };

  /* ---------- filas ---------- */
  const TRow = (t, owner) => {
    const di = dueInfo(t);
    return html`<button key=${t.id} className="trow" onClick=${() => openTask(t.id)}>
      <span className="t ell"><b className="ell">${t.n}</b><span className="ell">${cn(t)} · ${pn(t)}</span></span>
      <span style=${{ display: 'flex', alignItems: 'center', gap: 10 }}>${owner !== false && av(t.o)}<${PD} k=${t.pr} /></span>
      <span className="r"><span className=${di.cls}>${di.text}</span><${SB} k=${t.s} /></span>
    </button>`;
  };
  const TaskList = (items, empty, owner) => html`${items.map((t) => TRow(t, owner))}${!items.length && empty && html`<p className="empty">${empty}</p>`}`;
  const Stats = (items) => html`<section id="tour-stats" className="stats" aria-label="Resumen">
    ${items.map((k) => html`<button key=${k.l} className="stat" onClick=${k.go}><span className="l"><span className="dot" style=${{ background: k.c }}></span>${k.l}</span><span className="v" style=${{ color: k.vc || 'var(--ink)' }}>${k.v}</span></button>`)}
  </section>`;
  const toT = (extra) => () => go('tareas', Object.assign({ scope: null, q: '', group: 'none', tOwn: 'all' }, extra));
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  /* ---------- formularios en blanco ---------- */
  const blankTask = (cId, pId) => {
    const c = cId || (clients[0] || {}).id || '';
    const p = pId || (projects.find((x) => x.cId === c) || {}).id || '';
    const o = (team.find((m) => m.role === 'emp') || team[0] || {}).id || myId;
    return { kind: 'task', id: null, n: '', cId: c, pId: p, o, start: TODAY, due: addD(TODAY, 7), pr: 'media', desc: '' };
  };
  const blankProj = (cId) => ({ kind: 'proj', id: null, p: '', cId: cId || (clients[0] || {}).id || '', o: (team[0] || {}).id || myId, start: TODAY, due: addD(TODAY, 30), pr: 'media', desc: '' });
  const blankClient = () => ({ kind: 'client', id: null, n: '', rut: '', contacto: '', tel: '', mail: '', dir: '', resp: (team[0] || {}).id || myId, st: 'Activo' });

  /* ---------- pantallas ---------- */
  const Dash = () => {
    const stats = [
      { l: 'Sin comenzar', v: cnt('sin'), c: ST.sin.dot, go: toT({ tSt: 'sin' }) },
      { l: 'Vencidas', v: lateL.length, c: 'var(--danger)', vc: lateL.length ? 'var(--danger)' : null, go: toT({ tSt: 'late' }) },
      { l: 'Para hoy', v: todayL.length, c: ST.rev.dot, go: () => go('cal', { calView: 'dia', calRef: TODAY }) },
      { l: 'En curso', v: cnt('curso'), c: ST.curso.dot, go: toT({ tSt: 'curso' }) },
      { l: 'En revisión', v: cnt('rev'), c: ST.rev.dot, go: toT({ tSt: 'rev' }) },
      { l: 'Terminadas', v: cnt('fin'), c: ST.fin.dot, go: toT({ tSt: 'fin' }) }
    ];
    const next = open.filter((t) => t.due && diff(t.due, TODAY) >= 0).sort(byDue).slice(0, 6);
    const first = [
      { l: 'Sumá a tu equipo', done: team.length > 1, go: () => go('cfg'), b: 'Ir a Equipo' },
      { l: 'Cargá tus clientes', done: clients.length > 0, go: () => set({ modal: 'form', form: blankClient() }), b: 'Nuevo cliente' },
      { l: 'Creá un proyecto', done: projects.length > 0, go: () => (clients.length ? set({ modal: 'form', form: blankProj() }) : flash('Primero cargá un cliente.')), b: 'Nuevo proyecto' },
      { l: 'Creá y asigná la primera tarea', done: tasks.length > 0, go: () => (projects.length ? set({ modal: 'form', form: blankTask() }) : flash('Primero creá un proyecto.')), b: 'Nueva tarea' }
    ];
    const pending = first.filter((x) => !x.done).length;
    return html`<div className="page">
      <div className="ph"><div><h1>${hello}, ${firstName}</h1><p>${longDate(TODAY)}. Así está ${studio} hoy.</p></div></div>
      ${requests.length > 0 && html`<section className="card" style=${{ overflow: 'hidden' }}><div className="card-h"><h2>Solicitudes de acceso</h2><button className="link" onClick=${() => go('cfg')}>Revisar en Equipo</button></div>
        ${requests.map((r) => html`<div key=${r.id} className="req"><b style=${{ flex: '1 1 200px' }}>${r.name || 'Alguien'} quiere sumarse al equipo</b><button className="btn sm" onClick=${() => go('cfg')}>Revisar</button></div>`)}</section>`}
      ${pending > 0 && html`<section className="card pad steps-card">
        <h2 style=${{ fontSize: 16 }}>Primeros pasos</h2><p className="muted" style=${{ margin: '4px 0 8px' }}>Te faltan ${pending} de 4 para dejar el estudio listo.</p>
        <ul>${first.map((x, i) => html`<li key=${i}><span className=${'ck' + (x.done ? ' done' : '')}>${x.done ? html`<${Icon} d=${ICON.check} s=${14} w=${2.6} />` : i + 1}</span><span style=${{ flex: 1, fontWeight: 600, color: x.done ? 'var(--muted)' : 'var(--ink)', textDecoration: x.done ? 'line-through' : 'none' }}>${x.l}</span>${!x.done && html`<button className="btn sm" onClick=${x.go}>${x.b}</button>`}</li>`)}</ul>
      </section>`}
      ${Stats(stats)}
      <div className="split">
        <div className="wide">
          <section id="tour-overdue" className="card" style=${{ overflow: 'hidden' }}>
            <div className="card-h late"><h2 style=${{ display: 'flex', alignItems: 'center', gap: 8 }}><${Icon} d=${ICON.clock} style=${{ color: 'var(--danger)' }} />Tareas atrasadas</h2><span className="pill">${lateL.length}</span></div>
            ${TaskList(lateL, 'No hay tareas atrasadas. Todo al día.')}
          </section>
          <section className="card" style=${{ overflow: 'hidden' }}>
            <div className="card-h"><h2>Próximos vencimientos</h2><button className="link" onClick=${toT({ tSt: 'all' })}>Ver todas</button></div>
            ${TaskList(next, 'No hay vencimientos próximos.')}
          </section>
        </div>
        <section className="narrow card pad">
          <h2 style=${{ fontSize: 16, marginBottom: 6 }}>Actividad reciente</h2>
          ${(d.activity || []).slice(0, 8).map((a) => html`<div key=${a.id} className="act"><span className="dot" style=${{ background: a.k && ST[a.k] ? ST[a.k].dot : 'var(--s-sin-dot)' }}></span><div><div>${a.x}</div><small>${rel(a.at)}${a.cId && cById[a.cId] ? ' · ' + cById[a.cId].n : ''}</small></div></div>`)}
          ${!(d.activity || []).length && html`<p className="muted">Acá vas a ver lo que va haciendo el equipo.</p>`}
        </section>
      </div>
      <section className="card pad">
        <div style=${{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <h2 style=${{ fontSize: 16 }}>Carga por persona</h2>
          <div className="legend">${SK.map((k) => html`<span key=${k}><i style=${{ background: ST[k].dot }}></i>${ST[k].l}</span>`)}</div>
        </div>
        ${team.map((p) => {
          const ts = tasks.filter((t) => t.o === p.id); const tot = ts.length || 1;
          const c = {}; SK.forEach((k) => { c[k] = ts.filter((t) => t.s === k).length; });
          const late = ts.filter(isLate).length;
          return html`<button key=${p.id} className="trow" style=${{ gridTemplateColumns: 'minmax(160px,220px) minmax(0,1fr) auto', padding: '12px 0', background: 'transparent' }} onClick=${() => go('tareas', { scope: null, q: '', tSt: 'all', tOwn: p.id, group: 'status' })}>
            <span style=${{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, minWidth: 0 }}>${av(p.id, 30)}<span className="ell">${p.name}</span></span>
            <span className="stack">${SK.map((k) => html`<span key=${k} style=${{ width: (c[k] / tot * 100) + '%', background: ST[k].dot }}></span>`)}</span>
            <span style=${{ fontSize: 13, color: 'var(--ink2)', whiteSpace: 'nowrap' }}>${c.sin + c.curso + c.rev} abiertas, ${c.fin} terminadas${late ? html`, <b style=${{ color: 'var(--danger)' }}>${late} atrasada${late > 1 ? 's' : ''}</b>` : ''}</span>
          </button>`;
        })}
      </section>
    </div>`;
  };

  const Esp = () => {
    const stats = [
      { l: 'Pendientes', v: cnt('sin'), c: ST.sin.dot, go: toT({ tSt: 'sin' }) },
      { l: 'En curso', v: cnt('curso'), c: ST.curso.dot, go: toT({ tSt: 'curso' }) },
      { l: 'En revisión', v: cnt('rev'), c: ST.rev.dot, go: toT({ tSt: 'rev' }) },
      { l: 'Terminadas', v: cnt('fin'), c: ST.fin.dot, go: toT({ tSt: 'fin' }) }
    ];
    const next = open.filter((t) => t.due && diff(t.due, TODAY) > 0).sort(byDue).slice(0, 5);
    return html`<div className="page">
      <div className="ph"><div><h1>Mi espacio · ${firstName}</h1><p>${longDate(TODAY)}. Esto es lo que tenés por delante.</p></div></div>
      ${Stats(stats)}
      <div className="split">
        <div className="wide">
          ${lateL.length > 0 && html`<section className="card" style=${{ overflow: 'hidden' }}>
            <div className="card-h late"><h2>Atrasadas</h2><span className="pill">${lateL.length}</span></div>${TaskList(lateL, '', false)}</section>`}
          <section className="card" style=${{ overflow: 'hidden' }}><div className="card-h"><h2>Hoy</h2></div>${TaskList(todayL, 'No tenés vencimientos hoy.', false)}</section>
          <section className="card" style=${{ overflow: 'hidden' }}><div className="card-h"><h2>Próximamente</h2><button className="link" onClick=${toT({ tSt: 'all' })}>Ver todas</button></div>${TaskList(next, mine.length ? 'No tenés tareas próximas.' : 'Todavía no tenés tareas asignadas. Cuando un administrador te asigne una, te va a llegar una notificación.', false)}</section>
        </div>
        <div className="narrow">
          <section className="card pad">
            <h2 style=${{ fontSize: 16, marginBottom: 12 }}>Acceso rápido</h2>
            <div className="quick">${[['tareas', 'Mis tareas'], ['cal', 'Mi calendario'], ['proyectos', 'Mis proyectos'], ['ayuda', 'Ayuda']].map((x) => html`<button key=${x[0]} onClick=${() => go(x[0])}><${Icon} d=${ICON[x[0]]} />${x[1]}</button>`)}</div>
          </section>
          <section className="card pad">
            <h2 style=${{ fontSize: 16, marginBottom: 4 }}>Mis proyectos</h2>
            ${myProjects.map((p) => { const ts = projTasks(p); const done = ts.filter((t) => t.s === 'fin').length; const pct = ts.length ? Math.round(done / ts.length * 100) : 0;
              return html`<button key=${p.id} className="trow" style=${{ display: 'block', padding: '10px 0', background: 'transparent' }} onClick=${() => go('proyecto', { pro: p.id })}>
                <b style=${{ display: 'block' }}>${p.p}</b><span style=${{ display: 'block', fontSize: 12, color: 'var(--muted)', margin: '2px 0 6px' }}>${(cById[p.cId] || {}).n || 'Sin cliente'} · ${done} de ${ts.length} completadas</span>
                <span className="bar" style=${{ height: 6 }}><span style=${{ width: pct + '%' }}></span></span></button>`; })}
            ${!myProjects.length && html`<p className="muted">Todavía no participás en ningún proyecto.</p>`}
          </section>
        </div>
      </div>
    </div>`;
  };

  const Tareas = () => {
    const q = ui.q.trim().toLowerCase();
    const list = mine.filter((t) =>
      (!q || (t.n + ' ' + cn(t) + ' ' + pn(t) + ' ' + mname(t.o)).toLowerCase().includes(q)) &&
      (!ui.scope || (t.cId === ui.scope.cId && (!ui.scope.pId || t.pId === ui.scope.pId))) &&
      (ui.tOwn === 'all' || t.o === ui.tOwn) &&
      (ui.tSt === 'all' || (ui.tSt === 'late' ? isLate(t) : t.s === ui.tSt))
    ).sort(ui.sort === 'prio' ? (a, b) => byPr(a, b) || byDue(a, b) : byDue);
    const keyOf = { owner: (t) => mname(t.o), status: (t) => t.s, client: cn, project: (t) => pn(t) + ' · ' + cn(t) }[ui.group];
    let groups;
    if (!keyOf) groups = [{ label: '', items: list }];
    else {
      const m = {}, order = [];
      list.forEach((t) => { const k = keyOf(t); if (!m[k]) { m[k] = []; order.push(k); } m[k].push(t); });
      if (ui.group === 'status') order.sort((a, b) => SK.indexOf(a) - SK.indexOf(b));
      groups = order.map((k) => ({ label: ui.group === 'status' ? ST[k].l : k, items: m[k] }));
    }
    const scopeLabel = ui.scope ? (ui.scope.pId ? ((pById[ui.scope.pId] || {}).p || 'Proyecto') + ' · ' : '') + ((cById[ui.scope.cId] || {}).n || 'Cliente') : '';
    return html`<div className="page">
      <div className="ph">
        <div><h1>${isA ? 'Tareas' : 'Mis tareas'}</h1><p>${isA ? 'Todas las tareas del estudio.' : 'Solo las tareas en las que figurás como responsable.'}</p></div>
        ${isA ? html`<div id="tour-newtask" style=${{ borderRadius: 12 }}><button className="btn pri" onClick=${() => (projects.length ? set({ modal: 'form', form: blankTask(ui.scope && ui.scope.cId, ui.scope && ui.scope.pId), confirmDel: false }) : flash('Para crear tareas, primero cargá un cliente y un proyecto.'))}><${Icon} d=${ICON.plus} s=${16} w=${2.2} />Nueva tarea</button></div>`
          : html`<div className="note"><${Icon} d=${ICON.lock} s=${16} style=${{ flex: 'none' }} />Las tareas nuevas las crea un administrador. Vos podés editar y avanzar las que te asignaron.</div>`}
      </div>
      <div className="tools">
        <div className="search"><label htmlFor="tq" className="sr">Buscar tareas</label><${Icon} d=${ICON.search} s=${15} w=${2} /><input id="tq" value=${ui.q} onChange=${(e) => set({ q: e.target.value })} placeholder="Buscar por tarea, cliente o proyecto" /></div>
        <label className="sel">Estado <select value=${ui.tSt} onChange=${(e) => set({ tSt: e.target.value })}><option value="all">Todos</option><option value="late">Atrasadas</option>${SK.map((k) => html`<option key=${k} value=${k}>${ST[k].l}</option>`)}</select></label>
        ${isA && html`<label className="sel">Responsable <select value=${ui.tOwn} onChange=${(e) => set({ tOwn: e.target.value })}><option value="all">Todo el equipo</option>${team.map((p) => html`<option key=${p.id} value=${p.id}>${p.id === myId ? p.name + ' (vos)' : p.name}</option>`)}</select></label>`}
        <label className="sel">Agrupar <select value=${ui.group} onChange=${(e) => set({ group: e.target.value })}><option value="none">Sin agrupar</option>${isA && html`<option value="owner">Responsable</option>`}<option value="status">Estado</option><option value="project">Proyecto</option><option value="client">Cliente</option></select></label>
        <label className="sel">Ordenar <select value=${ui.sort} onChange=${(e) => set({ sort: e.target.value })}><option value="due">Vencimiento</option><option value="prio">Prioridad</option></select></label>
        ${ui.scope && html`<span className="chipf">${scopeLabel}<button aria-label="Quitar filtro" onClick=${() => set({ scope: null })}>×</button></span>`}
      </div>
      <section id="tour-table" className="card" style=${{ overflow: 'hidden' }}>
        <div className="scroll"><div className="tbl">
          <div className="th"><span>Tarea</span><span>Cliente</span><span>Proyecto</span><${Tip} label="Responsable" text="Persona encargada de realizar la tarea." /><span>Vence</span><${Tip} label="Prioridad" text="Define qué tan urgente es completar esta tarea." /><${Tip} label="Estado" text="Indica en qué etapa se encuentra la tarea." right=${true} /></div>
          ${groups.map((g, gi) => html`<div key=${gi}>
            ${g.label && html`<div className="gh">${g.label} <span>· ${g.items.length}</span></div>`}
            ${g.items.map((t) => { const di = dueInfo(t); return html`<button key=${t.id} className="tr" onClick=${() => openTask(t.id)}>
              <b className="ell">${t.n}</b><span className="ell" style=${{ color: 'var(--ink2)' }}>${cn(t)}</span><span className="ell" style=${{ color: 'var(--ink2)' }}>${pn(t)}</span>
              <span style=${{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>${av(t.o, 26)}<span className="ell">${mname(t.o)}</span></span>
              <span className=${di.cls}>${di.text === 'Hoy' || di.text === 'Mañana' ? di.text : fmt(t.due)}</span><${PD} k=${t.pr} /><span><${SB} k=${t.s} /></span>
            </button>`; })}
          </div>`)}
        </div></div>
        ${!list.length && html`<div style=${{ padding: '44px 24px', textAlign: 'center' }}>
          ${mine.length ? html`<div style=${{ fontWeight: 700, fontSize: 16 }}>No hay tareas que coincidan</div><p className="muted" style=${{ margin: '6px 0 16px' }}>Probá con otra búsqueda o quitá los filtros.</p><button className="btn" onClick=${() => set({ scope: null, q: '', tSt: 'all', tOwn: 'all' })}>Limpiar filtros</button>`
            : html`<div style=${{ fontWeight: 700, fontSize: 16 }}>${isA ? 'Todavía no hay tareas' : 'Todavía no tenés tareas asignadas'}</div><p className="muted" style=${{ margin: '6px 0 0' }}>${isA ? 'Creá la primera con “Nueva tarea”. Antes necesitás al menos un cliente y un proyecto.' : 'Cuando un administrador te asigne una, va a aparecer acá y te va a llegar una notificación.'}</p>`}
        </div>`}
      </section>
    </div>`;
  };

  const Cal = () => {
    const base = mine.filter((t) => t.due && (!ui.hideDone || t.s !== 'fin') && (!isA || ui.fEmp === 'all' || t.o === ui.fEmp) && (ui.fCli === 'all' || t.cId === ui.fCli) && (ui.fPro === 'all' || t.pId === ui.fPro) && (ui.fSt === 'all' || t.s === ui.fSt));
    const on = (x) => base.filter((t) => t.due === x).sort(byPr);
    const ref = fromIso(ui.calRef);
    const shift = (n) => {
      if (ui.calView === 'mes') set({ calRef: iso(new Date(ref.getFullYear(), ref.getMonth() + n, 1)) });
      else set({ calRef: addD(ui.calRef, ui.calView === 'semana' ? 7 * n : n) });
    };
    const weekStart = addD(ui.calRef, -monIdx(ui.calRef));
    let label;
    if (ui.calView === 'mes') label = capit(MESES[ref.getMonth()]) + ' ' + ref.getFullYear();
    else if (ui.calView === 'semana') { const e = addD(weekStart, 6); label = 'Semana del ' + fromIso(weekStart).getDate() + ' de ' + MESES[fromIso(weekStart).getMonth()] + ' al ' + fromIso(e).getDate() + ' de ' + MESES[fromIso(e).getMonth()]; }
    else label = longDate(ui.calRef) + (ui.calRef === TODAY ? ' · Hoy' : '');
    const hidden = ui.hideDone ? mine.filter((t) => t.s === 'fin').length : 0;
    let body;
    if (ui.calView === 'mes') {
      const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const off = (first.getDay() + 6) % 7;
      const dim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
      const total = Math.ceil((off + dim) / 7) * 7;
      const cells = [];
      for (let i = 0; i < total; i++) { const x = new Date(ref.getFullYear(), ref.getMonth(), i - off + 1); cells.push({ d: iso(x), n: x.getDate(), out: x.getMonth() !== ref.getMonth() }); }
      body = html`<section className="card scroll"><div className="month">
        <div className="grid7">${DIAS_C.map((x) => html`<div key=${x} className="dh">${x}</div>`)}</div>
        <div className="grid7">${cells.map((c) => { const ts = on(c.d); return html`<div key=${c.d} className=${'cell' + (c.out ? ' out' : '')}>
          <button className=${'num' + (c.d === TODAY ? ' today' : '')} aria-label=${'Ver ' + longDate(c.d)} onClick=${() => set({ calView: 'dia', calRef: c.d })}>${c.n}</button>
          ${ts.slice(0, 3).map((t) => html`<button key=${t.id} className="cchip" title=${t.n + ' · ' + mname(t.o) + ' · ' + cn(t) + ' · ' + ST[t.s].l} style=${{ background: ST[t.s].bg, color: ST[t.s].fg }} onClick=${() => openTask(t.id)}><b>${initials(mname(t.o))}</b> ${t.n}</button>`)}
          ${ts.length > 3 && html`<button className="more" onClick=${() => set({ calView: 'dia', calRef: c.d })}>+${ts.length - 3} más</button>`}
        </div>`; })}</div>
      </div></section>`;
    } else if (ui.calView === 'semana') {
      body = html`<section className="card scroll"><div className="week">${[0, 1, 2, 3, 4, 5, 6].map((i) => { const x = addD(weekStart, i); return html`<div key=${x} className="wcol">
        <div className=${'whead' + (x === TODAY ? ' today' : '')}><small>${DIAS_C[i]}</small><b>${fromIso(x).getDate()}</b></div>
        <div style=${{ padding: 10 }}>${on(x).map((t) => html`<button key=${t.id} className="wcard" onClick=${() => openTask(t.id)}>
          <b style=${{ display: 'block', fontSize: 13, lineHeight: 1.3 }}>${t.n}</b><span style=${{ display: 'block', fontSize: 12, color: 'var(--muted)', margin: '3px 0 8px' }}>${cn(t)}</span>
          <span style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>${av(t.o, 24)}<${SB} k=${t.s} /></span></button>`)}</div>
      </div>`; })}</div></section>`;
    } else body = html`<section className="card" style=${{ overflow: 'hidden' }}>${TaskList(on(ui.calRef), 'No hay tareas para este día con los filtros actuales.')}</section>`;
    return html`<div className="page">
      <div className="ph"><div><h1>${isA ? 'Calendario del estudio' : 'Mi calendario'}</h1><p>${isA ? 'Cada tarea aparece el día en que vence.' : 'Tus tareas pendientes, según su vencimiento.'}</p></div></div>
      <section id="tour-calTools" className="card" style=${{ padding: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div className="seg" role="group" aria-label="Vista">${[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map((v) => html`<button key=${v[0]} aria-pressed=${ui.calView === v[0] ? 'true' : 'false'} onClick=${() => set({ calView: v[0] })}>${v[1]}</button>`)}</div>
        <div style=${{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="iconbtn ghost" aria-label="Anterior" onClick=${() => shift(-1)}><${Icon} d=${ICON.left} /></button>
          <button className="btn sm" onClick=${() => set({ calRef: TODAY })}>Hoy</button>
          <button className="iconbtn ghost" aria-label="Siguiente" onClick=${() => shift(1)}><${Icon} d=${ICON.right} /></button>
          <b style=${{ fontSize: 15, marginLeft: 6 }}>${label}</b>
        </div>
        <div style=${{ flex: 1 }}></div>
        ${isA && html`<label className="sel">Persona <select value=${ui.fEmp} onChange=${(e) => set({ fEmp: e.target.value })}><option value="all">Todo el equipo</option>${team.map((p) => html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}</select></label>`}
        <label className="sel">Cliente <select value=${ui.fCli} onChange=${(e) => set({ fCli: e.target.value })} style=${{ maxWidth: 190 }}><option value="all">Todos</option>${myClients.map((c) => html`<option key=${c.id} value=${c.id}>${c.n}</option>`)}</select></label>
        <label className="sel">Proyecto <select value=${ui.fPro} onChange=${(e) => set({ fPro: e.target.value })} style=${{ maxWidth: 190 }}><option value="all">Todos</option>${myProjects.map((p) => html`<option key=${p.id} value=${p.id}>${p.p} · ${(cById[p.cId] || {}).n || ''}</option>`)}</select></label>
        <label className="sel">Estado <select value=${ui.fSt} onChange=${(e) => set({ fSt: e.target.value })}><option value="all">Todos</option>${SK.filter((k) => !ui.hideDone || k !== 'fin').map((k) => html`<option key=${k} value=${k}>${ST[k].l}</option>`)}</select></label>
        <label style=${{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked=${ui.hideDone} onChange=${() => set({ hideDone: !ui.hideDone, fSt: 'all' })} style=${{ width: 18, height: 18, accentColor: 'var(--accent)' }} />Ocultar tareas terminadas</label>
      </section>
      ${body}
      <div className="legend">${SK.map((k) => html`<span key=${k}><i style=${{ background: ST[k].bg, border: '1px solid ' + ST[k].dot }}></i>${ST[k].l}</span>`)}
        ${hidden > 0 && html`<span className="muted">${hidden} ${hidden === 1 ? 'tarea terminada oculta' : 'tareas terminadas ocultas'} (siguen guardadas en Tareas)</span>`}</div>
    </div>`;
  };

  const cliCols = { gridTemplateColumns: 'minmax(220px,2fr) 150px minmax(160px,1.3fr) 120px 120px 120px' };
  const Clientes = () => html`<div className="page">
    <div className="ph"><div><h1>Clientes</h1><p>${isA ? 'Todos los clientes del estudio.' : 'Solo los clientes vinculados a tus tareas.'}</p></div>
      ${isA && html`<button className="btn pri" onClick=${() => set({ modal: 'form', form: blankClient(), confirmDel: false })}><${Icon} d=${ICON.plus} s=${16} w=${2.2} />Nuevo cliente</button>`}</div>
    <section id="tour-cli" className="card" style=${{ overflow: 'hidden' }}>
      <div className="scroll"><div style=${{ minWidth: 860 }}>
        <div className="th" style=${cliCols}><span>Cliente</span><span>RUT</span><span>Responsable</span><span>Proy. activos</span><span>Pendientes</span><span>Estado</span></div>
        ${myClients.map((c) => {
          const act = projects.filter((p) => p.cId === c.id && projTasks(p).some((t) => t.s !== 'fin')).length;
          const pend = tasks.filter((t) => t.cId === c.id && t.s !== 'fin' && (isA || t.o === myId)).length;
          const cs = CST[c.st] || CST.Activo;
          return html`<button key=${c.id} className="tr" style=${cliCols} onClick=${() => go('cliente', { cli: c.id })}>
            <span style=${{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, minWidth: 0 }}><span className="av" style=${{ width: 32, height: 32, borderRadius: 8, background: 'var(--chip)', fontSize: 12 }}>${initials(c.n)}</span><span className="ell">${c.n}</span></span>
            <span style=${{ color: 'var(--ink2)', fontVariantNumeric: 'tabular-nums' }}>${c.rut || '—'}</span><span className="ell" style=${{ color: 'var(--ink2)' }}>${c.resp ? mname(c.resp) : '—'}</span>
            <b>${act}</b><b>${pend}</b><span><span className="sb" style=${{ background: cs[0], color: cs[1] }}>${c.st || 'Activo'}</span></span>
          </button>`; })}
      </div></div>
      ${!myClients.length && html`<div style=${{ padding: '40px 24px', textAlign: 'center' }}><div style=${{ fontWeight: 700, fontSize: 16 }}>${isA ? 'Todavía no cargaste clientes' : 'Todavía no tenés clientes asignados'}</div><p className="muted" style=${{ marginTop: 6 }}>${isA ? 'Empezá con “Nuevo cliente”: nombre, RUT y datos de contacto.' : 'Vas a ver acá los clientes de las tareas que te asignen.'}</p></div>`}
    </section>
  </div>`;

  const Denied = () => html`<div className="page"><section className="card pad" style=${{ textAlign: 'center', padding: '48px 24px' }}>
    <div style=${{ display: 'inline-flex', width: 52, height: 52, borderRadius: 26, background: 'var(--chip)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><${Icon} d=${ICON.lock} s=${22} /></div>
    <h1 style=${{ fontSize: 20 }}>No tenés acceso a esta sección</h1>
    <p className="muted" style=${{ margin: '8px auto 18px', maxWidth: 420 }}>Solo ves la información vinculada a tus tareas, o el elemento ya no existe. Si necesitás acceso, pedíselo a un administrador.</p>
    <button className="btn pri" onClick=${() => go(isA ? 'dash' : 'esp')}>Volver al inicio</button></section></div>`;

  const PCard = (p) => {
    const ts = projTasks(p); const done = ts.filter((t) => t.s === 'fin').length; const pct = ts.length ? Math.round(done / ts.length * 100) : 0; const st = projStatus(p);
    return html`<button key=${p.id} className="pcard" onClick=${() => go('proyecto', { pro: p.id })}>
      <span style=${{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}><span style=${{ minWidth: 0 }}><b style=${{ display: 'block', fontSize: 15 }}>${p.p}</b><span className="muted" style=${{ fontSize: 13 }}>${(cById[p.cId] || {}).n || 'Sin cliente'}</span></span><span className="sb" style=${{ background: st.bg, color: st.fg, alignSelf: 'flex-start' }}>${st.l}</span></span>
      <span style=${{ width: '100%' }}><span style=${{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink2)', marginBottom: 6 }}><span>${done} de ${ts.length} tareas completadas</span><b>${pct}%</b></span><span className="bar"><span style=${{ width: pct + '%' }}></span></span></span>
      <span style=${{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 13, color: 'var(--ink2)', gap: 8 }}><span style=${{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>${av(p.o, 24)}<span className="ell">${mname(p.o)}</span></span><span style=${{ whiteSpace: 'nowrap' }}>Vence ${fmt(p.due)}</span></span>
    </button>`;
  };

  const Cliente = () => {
    const c = cById[ui.cli];
    if (!c || !myClients.includes(c)) return Denied();
    const ts = mine.filter((t) => t.cId === c.id).sort(byDue);
    const pjs = myProjects.filter((p) => p.cId === c.id);
    const acts = (d.activity || []).filter((a) => a.cId === c.id).slice(0, 10);
    const cs = CST[c.st] || CST.Activo;
    return html`<div className="page">
      <div><div className="crumbs"><button onClick=${() => go('clientes')}>Clientes</button>›<span>${c.n}</span></div>
        <div className="ph"><div><h1>${c.n}</h1><p>${c.rut ? 'RUT ' + c.rut : 'Sin RUT cargado'}</p></div>
          <div style=${{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="sb" style=${{ background: cs[0], color: cs[1] }}>${c.st || 'Activo'}</span>${isA && html`<button className="btn" onClick=${() => set({ modal: 'form', form: Object.assign({ kind: 'client' }, c), confirmDel: false })}>Editar</button>`}</div></div></div>
      <section className="card pad"><div className="kv">
        ${[['Contacto', c.contacto], ['Teléfono', c.tel], ['Email', c.mail], ['Dirección', c.dir], ['Responsable', c.resp ? mname(c.resp) : '']].map((x) => html`<div key=${x[0]}><small>${x[0]}</small><span style=${{ wordBreak: 'break-word' }}>${x[1] || '—'}</span></div>`)}
      </div></section>
      <div className="split">
        <div className="wide">
          <section className="card pad">
            <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h2 style=${{ fontSize: 16 }}>Proyectos</h2>${isA && html`<button className="btn sm" onClick=${() => set({ modal: 'form', form: blankProj(c.id), confirmDel: false })}><${Icon} d=${ICON.plus} s=${15} w=${2.2} />Nuevo proyecto</button>`}</div>
            <div className="pgrid">${pjs.map((p) => PCard(p))}</div>
            ${!pjs.length && html`<p className="muted">Este cliente todavía no tiene proyectos.</p>`}
          </section>
          <section className="card" style=${{ overflow: 'hidden' }}>
            <div className="card-h"><h2>${isA ? 'Tareas' : 'Mis tareas de este cliente'}</h2>${ts.length > 0 && html`<button className="link" onClick=${() => scopeTo(c.id, null)}>Ver en Tareas</button>`}</div>
            ${TaskList(ts, 'No hay tareas para este cliente.')}
          </section>
        </div>
        <section className="narrow card pad"><h2 style=${{ fontSize: 16, marginBottom: 6 }}>Historial</h2>
          ${acts.map((a) => html`<div key=${a.id} className="act"><span className="dot" style=${{ background: a.k && ST[a.k] ? ST[a.k].dot : 'var(--s-sin-dot)' }}></span><div><div>${a.x}</div><small>${rel(a.at)}</small></div></div>`)}
          ${!acts.length && html`<p className="muted">Todavía no hay actividad registrada.</p>`}
        </section>
      </div>
    </div>`;
  };

  const Proyectos = () => html`<div className="page">
    <div className="ph"><div><h1>${isA ? 'Proyectos' : 'Mis proyectos'}</h1><p>Cada proyecto agrupa las tareas de un trabajo para un cliente.</p></div>
      ${isA && html`<button className="btn pri" onClick=${() => (clients.length ? set({ modal: 'form', form: blankProj(), confirmDel: false }) : flash('Primero cargá un cliente.'))}><${Icon} d=${ICON.plus} s=${16} w=${2.2} />Nuevo proyecto</button>`}</div>
    <section id="tour-projects" className="pgrid" style=${{ minHeight: 60 }}>${myProjects.map((p) => PCard(p))}</section>
    ${!myProjects.length && html`<section className="card pad" style=${{ textAlign: 'center', padding: '40px 24px' }}><div style=${{ fontWeight: 700, fontSize: 16 }}>${isA ? 'Todavía no hay proyectos' : 'Todavía no participás en proyectos'}</div><p className="muted" style=${{ marginTop: 6 }}>${isA ? 'Por ejemplo: “Liquidación mensual” o “Declaración anual” para cada cliente.' : 'Vas a verlos acá cuando te asignen tareas.'}</p></section>`}
  </div>`;

  const Proyecto = () => {
    const p = pById[ui.pro];
    if (!p || !myProjects.includes(p)) return Denied();
    const all = projTasks(p); const ts = (isA ? all : all.filter((t) => t.o === myId)).sort(byDue);
    const done = all.filter((t) => t.s === 'fin').length; const pct = all.length ? Math.round(done / all.length * 100) : 0; const st = projStatus(p);
    const hist = [];
    all.forEach((t) => (t.hist || []).forEach((h) => hist.push({ d: h.d, x: h.x, n: t.n })));
    hist.sort((a, b) => String(b.d).localeCompare(String(a.d)));
    return html`<div className="page">
      <div><div className="crumbs"><button onClick=${() => go('proyectos')}>${isA ? 'Proyectos' : 'Mis proyectos'}</button>›<span>${p.p}</span></div>
        <div className="ph"><div><h1>${p.p}</h1><p>${p.desc || 'Sin descripción.'}</p></div>
          ${isA && html`<div style=${{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn" onClick=${() => set({ modal: 'form', form: Object.assign({ kind: 'proj' }, p), confirmDel: false })}>Editar</button><button className="btn pri" onClick=${() => set({ modal: 'form', form: blankTask(p.cId, p.id), confirmDel: false })}><${Icon} d=${ICON.plus} s=${16} w=${2.2} />Nueva tarea</button></div>`}</div></div>
      <section className="card pad"><div className="kv">
        <div><small>Cliente</small>${cById[p.cId] ? html`<button className="link" style=${{ padding: 0, textAlign: 'left' }} onClick=${() => go('cliente', { cli: p.cId })}>${cById[p.cId].n}</button>` : html`<span>Sin cliente</span>`}</div>
        <div><small>Responsable</small><span style=${{ display: 'flex', alignItems: 'center', gap: 6 }}>${av(p.o, 22)}${mname(p.o)}</span></div>
        <div><small>Inicio</small><span>${fmtY(p.start)}</span></div>
        <div><small>Vencimiento</small><span>${fmtY(p.due)}</span></div>
        <div><small>Estado</small><span className="sb" style=${{ background: st.bg, color: st.fg }}>${st.l}</span></div>
        <div><small>Prioridad</small><${PD} k=${p.pr} /></div>
      </div>
      <div style=${{ marginTop: 18 }}><div style=${{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><b>${done} de ${all.length} tareas completadas</b><b>${pct}%</b></div><span className="bar" style=${{ height: 10 }}><span style=${{ width: pct + '%' }}></span></span></div>
      </section>
      <div className="split">
        <section className="wide card" style=${{ overflow: 'hidden' }}><div className="card-h"><h2>${isA ? 'Tareas del proyecto' : 'Mis tareas en este proyecto'}</h2></div>${TaskList(ts, 'Todavía no hay tareas en este proyecto.')}</section>
        <section className="narrow card pad"><h2 style=${{ fontSize: 16, marginBottom: 6 }}>Actividad</h2>
          ${hist.slice(0, 12).map((h, i) => html`<div key=${i} className="hist"><span>${fmt(h.d)}</span><span>${h.x} <span className="muted">(${h.n})</span></span></div>`)}
          ${!hist.length && html`<p className="muted">Sin actividad todavía.</p>`}
        </section>
      </div>
    </div>`;
  };

  const Cfg = () => {
    const draft = ui.studioDraft === null ? studio : ui.studioDraft;
    const legacy = isA ? LEGACY.studios() : [];
    return html`<div className="page">
      <div className="ph"><div><h1>Configuración</h1><p>${isA ? 'Estudio, equipo y permisos.' : 'Tu perfil y tus permisos.'}</p></div></div>
      ${isA ? html`
        <section className="card pad">
          <h2 style=${{ fontSize: 16 }}>Estudio</h2>
          <div style=${{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginTop: 12 }}>
            <label className="fld" style=${{ flex: '1 1 300px' }}>Nombre del estudio<input className="inp" value=${draft} onChange=${(e) => set({ studioDraft: e.target.value })} /></label>
            <button className="btn pri" disabled=${!draft.trim() || draft.trim() === studio} onClick=${() => run(() => db.doc('config/estudio').update({ name: draft.trim() }), 'Nombre del estudio actualizado.').then((ok) => ok && set({ studioDraft: null }))}>Guardar nombre</button>
          </div>
          <p className="muted" style=${{ marginTop: 8, fontSize: 13 }}>Se muestra en el menú, en la bienvenida y en las pantallas de acceso.</p>
        </section>
        <section className="card pad">
          <h2 style=${{ fontSize: 16 }}>Copia de seguridad</h2>
          <p className="muted" style=${{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>Los datos del estudio se guardan en el servidor y se respaldan allí. Si querés una copia propia, descargá los clientes, proyectos, tareas y el equipo en un archivo JSON.</p>
          <div style=${{ marginTop: 12 }}><button className="btn" onClick=${() => {
            const txt = JSON.stringify(Object.assign({ app: 'gestion-estudio', exportado: new Date().toISOString() }, SUPA.exportData()), null, 2);
            const u = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
            const a = document.createElement('a'); a.href = u; a.download = 'copia-' + studio.replace(/[^\w]+/g, '-').toLowerCase() + '-' + TODAY + '.json';
            document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
          }}>Descargar copia</button></div>
        </section>
        ${legacy.length > 0 && html`<section className="card pad" style=${{ borderColor: 'var(--s-rev-dot)' }}>
          <h2 style=${{ fontSize: 16 }}>Datos de la versión anterior en este navegador</h2>
          <p className="muted" style=${{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>Encontramos datos guardados en este navegador por la versión anterior de la app. Podés pasarlos a este estudio: se copian clientes, proyectos, tareas, comentarios, historial y adjuntos. La copia local no se borra.</p>
          ${legacy.map((x) => html`<div key=${x.key} style=${{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <span style=${{ flex: '1 1 240px' }}><b>${x.name}</b> <span className="muted" style=${{ fontSize: 13 }}>· ${x.clients.length} clientes, ${x.projects.length} proyectos, ${x.tasks.length} tareas${x.imported ? ' · ya importado' : ''}</span></span>
            <button className="btn sm" onClick=${() => set({ modal: 'import', form: { key: x.key, map: {}, step: 'map', log: [] } })}>Importar</button>
          </div>`)}
        </section>`}
        <section id="tour-users" className="card" style=${{ overflow: 'hidden' }}>
          <div className="card-h"><h2>Equipo</h2><button className="btn sm pri" onClick=${() => set({ modal: 'member', form: { kind: 'member', email: '', role: 'emp', err: '', missing: null } })}><${Icon} d=${ICON.mail} s=${15} />Invitar integrante</button></div>
          ${invites.length > 0 && html`<div style=${{ borderTop: '1px solid var(--line2)' }}>
            <div style=${{ padding: '10px 18px 4px', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Invitaciones pendientes</div>
            ${invites.map((v) => html`<div key=${v.id} className="req" style=${{ background: 'transparent' }}>
              <span style=${{ flex: '1 1 240px', minWidth: 0 }}><b className="ell" style=${{ display: 'block' }}>${v.email}</b><span className="muted" style=${{ fontSize: 12 }}>${ROLE[v.role]} · enviada ${rel(v.at)} · ${v.expired ? 'vencida' : 'vence el ' + fmtY(iso(new Date(v.exp)))}</span></span>
              <button className="btn sm" disabled=${ui.busy} onClick=${() => resendInvite(v)}>Reenviar</button>
              <button className="btn sm danger" onClick=${() => run(() => SUPA.auth.cancelInvite(v.id), 'Invitación cancelada. El enlace ya no sirve.')}>Cancelar</button>
            </div>`)}
          </div>`}
          <div className="scroll"><div style=${{ minWidth: 640 }}>
            ${members.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))).map((m) => html`<div key=${m.id} style=${{ display: 'grid', gridTemplateColumns: 'minmax(220px,1.6fr) 150px 170px 110px', gap: 12, alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--line2)', opacity: m.active === false ? 0.55 : 1 }}>
              <span style=${{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, minWidth: 0 }}>${av(m.id, 32)}<span className="ell">${m.name}${m.id === myId ? ' (vos)' : ''}</span></span>
              <span><span className="sb" style=${{ background: m.role === 'admin' ? 'var(--accent-soft)' : 'var(--chip)', color: m.role === 'admin' ? 'var(--accent-soft-ink)' : 'var(--ink2)' }}>${m.active === false ? 'Desactivado/a' : ROLE[m.role] || ROLE.emp}</span></span>
              <span style=${{ color: 'var(--ink2)', fontSize: 13 }}>${tasks.filter((t) => t.o === m.id && t.s !== 'fin').length} abiertas</span>
              <button className="btn sm" onClick=${() => set({ modal: 'member', form: { kind: 'memberEdit', id: m.id, first: m.first || '', last: m.last || '', role: m.role, active: m.active !== false } })}>Editar</button>
            </div>`)}
          </div></div>
          <div style=${{ padding: '14px 18px', borderTop: '1px solid var(--line2)', background: 'var(--sunk)', fontSize: 13, color: 'var(--ink2)', lineHeight: 1.55 }}>
            <b>Cómo sumar a alguien:</b> tocá “Invitar integrante”, escribí su correo y elegí el rol. Le llega un correo con el botón «Aceptar invitación»: ahí crea su contraseña y entra al estudio desde cualquier computadora.
          </div>
        </section>
        <section className="card pad">
          <h2 style=${{ fontSize: 16, marginBottom: 10 }}>Qué puede hacer cada rol</h2>
          <div className="scroll"><div style=${{ minWidth: 520 }}>
            <div style=${{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 140px 130px', gap: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}><span>Permiso</span><span>Administrador/a</span><span>Empleado/a</span></div>
            ${[['Ver todas las tareas del estudio', 1, 0], ['Crear y eliminar clientes, proyectos y tareas', 1, 0], ['Asignar o cambiar responsable', 1, 0], ['Editar las tareas asignadas', 1, 1], ['Cambiar estado, comentar y adjuntar', 1, 1], ['Ver el calendario de todo el equipo', 1, 0], ['Gestionar el equipo y el nombre del estudio', 1, 0]].map((r) => html`<div key=${r[0]} style=${{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 140px 130px', gap: 8, padding: '9px 0', borderTop: '1px solid var(--line2)' }}>
              <span>${r[0]}</span><b style=${{ color: r[1] ? 'var(--s-fin-fg)' : 'var(--muted)' }}>${r[1] ? '✓ Sí' : '— No'}</b><b style=${{ color: r[2] ? 'var(--s-fin-fg)' : 'var(--muted)' }}>${r[2] ? '✓ Sí' : '— No'}</b></div>`)}
          </div></div>
        </section>` : html`
        <section className="card pad" style=${{ display: 'flex', alignItems: 'center', gap: 14 }}>${av(myId, 52)}<div><b style=${{ fontSize: 16 }}>${myName}</b><div className="muted">${ROLE[me.role] || ROLE.emp} en ${studio}</div></div></section>
        <div className="lock"><${Icon} d=${ICON.lock} s=${20} style=${{ flex: 'none', marginTop: 2, color: 'var(--muted)' }} /><div><b>Equipo y permisos</b><p style=${{ marginTop: 4, color: 'var(--ink2)', lineHeight: 1.5 }}>Solo los administradores pueden gestionar el equipo, los roles y el nombre del estudio. Si querés cambiar cómo figura tu nombre, pedíselo a un administrador.</p></div></div>`}
    </div>`;
  };

  const Ayuda = () => html`<div className="page">
    <div className="ph"><div><h1>Ayuda</h1><p>Todo lo que necesitás para usar el sistema, cuando lo necesites.</p></div></div>
    <section className="card pad" style=${{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, padding: 22 }}>
      <div style=${{ flex: '1 1 320px' }}><h2 style=${{ fontSize: 18 }}>Recorrido guiado</h2><p style=${{ marginTop: 6, color: 'var(--ink2)', lineHeight: 1.5 }}>${isA ? 'Volvé a ver los 7 pasos para administradores: panel, clientes, proyectos, tareas, calendario, seguimiento y equipo.' : 'Volvé a ver los 6 pasos: tu espacio, tus tareas, los estados, el calendario, las notificaciones y cómo terminar una tarea.'}</p></div>
      <button className="btn pri" onClick=${startTour}>Repetir tutorial</button>
    </section>
    <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
      <section className="card pad"><h2 style=${{ fontSize: 16, marginBottom: 10 }}>Guía rápida: estados de una tarea</h2>
        ${SK.map((k) => html`<div key=${k} style=${{ display: 'flex', gap: 12, padding: '8px 0', alignItems: 'flex-start' }}><span style=${{ width: 110, flex: 'none' }}><${SB} k=${k} /></span><span style=${{ color: 'var(--ink2)' }}>${ST[k].d}</span></div>`)}
      </section>
      <section className="card pad">
        <h2 style=${{ fontSize: 16, marginBottom: 8 }}>El calendario</h2>
        <p style=${{ color: 'var(--ink2)', lineHeight: 1.55 }}>Cada tarea aparece el día en que vence. Podés verlo por día, semana o mes. Las tareas terminadas se ocultan para que veas solo lo pendiente, pero siguen guardadas: las encontrás en Tareas filtrando por “Terminado”.</p>
        <h2 style=${{ fontSize: 16, margin: '18px 0 8px' }}>Tus permisos</h2>
        ${(isA ? [[1, 'Ves y gestionás todas las tareas, clientes y proyectos.'], [1, 'Creás tareas y proyectos y elegís quién los hace.'], [1, 'Aprobás o devolvés las tareas en revisión.'], [1, 'Gestionás el equipo y el nombre del estudio.']]
          : [[1, 'Ves tus tareas, tus proyectos y tu calendario.'], [1, 'Cambiás el estado, editás la descripción, comentás y adjuntás archivos.'], [0, 'No podés crear tareas ni cambiar el responsable, el cliente o el proyecto.'], [0, 'No ves las tareas de otras personas.']])
          .map((r, i) => html`<div key=${i} style=${{ display: 'flex', gap: 8, padding: '4px 0', color: 'var(--ink2)' }}><b style=${{ width: 16, color: r[0] ? 'var(--s-fin-fg)' : 'var(--muted)' }}>${r[0] ? '✓' : '—'}</b>${r[1]}</div>`)}
      </section>
    </div>
    <section className="card faq" style=${{ overflow: 'hidden' }}>
      <div className="card-h"><h2>Preguntas frecuentes</h2></div>
      ${FAQ[role].map((f, i) => html`<div key=${i}><button aria-expanded=${ui.faq === i ? 'true' : 'false'} onClick=${() => set({ faq: ui.faq === i ? -1 : i })}>${f[0]}<span aria-hidden="true" className="muted" style=${{ fontSize: 18 }}>${ui.faq === i ? '−' : '+'}</span></button>${ui.faq === i && html`<p>${f[1]}</p>`}</div>`)}
    </section>
  </div>`;

  /* ---------- detalle de tarea ---------- */
  const Drawer = () => {
    const t = tasks.find((x) => x.id === ui.sel);
    if (!t || (!isA && t.o !== myId)) return null;
    const di = dueInfo(t);
    const lockF = (label, text) => html`<small>${label}${!isA && html` <${LockTip} text=${text} />`}</small>`;
    const upload = async (f) => {
      if (!cap.assets) { flash('Adjuntar archivos no está disponible en este navegador.'); return; }
      set({ busy: true });
      await run(async () => {
        const r = await cap.assets.upload(f, t.id);
        await updTask(t, { files: (t.files || []).concat([{ id: r.id, url: r.url, name: f.name, at: Date.now(), by: myId }]) }, myName + ' adjuntó ' + f.name + '.');
        logAct(myName + ' adjuntó ' + f.name + ' en “' + t.n + '”', t.cId, '');
        if (isA) notify(t.o, myName + ' adjuntó un archivo en “' + t.n + '”.', t.id); else notifyAdmins(myName + ' adjuntó un archivo en “' + t.n + '”.', t.id);
      }, 'Archivo adjuntado: ' + f.name + '.');
      set({ busy: false });
    };
    return html`<button className="scrim" aria-label="Cerrar detalle" onClick=${() => set({ sel: null })}></button>
    <aside className="drawer" role="dialog" aria-label=${'Tarea: ' + t.n}>
      <div className="dhd"><span className="ell">${isA ? 'Tareas' : 'Mis tareas'} › ${cn(t)}</span>
        <span style=${{ display: 'flex', gap: 6 }}>${isA && html`<button className="btn sm" onClick=${() => set({ modal: 'form', form: Object.assign({ kind: 'task' }, t), confirmDel: false })}>Editar</button>`}<button className="iconbtn" aria-label="Cerrar" onClick=${() => set({ sel: null })}><${Icon} d=${ICON.x} /></button></span></div>
      <div className="body">
        <div><h2 style=${{ fontSize: 22 }}>${t.n}</h2>${isLate(t) && html`<span style=${{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--danger)', background: 'var(--danger-soft)', borderRadius: 6, padding: '3px 8px' }}>Atrasada · venció el ${fmt(t.due)}</span>`}</div>
        <div className="kv" style=${{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
          <div>${lockF('Cliente', 'Solo un administrador puede cambiar el cliente.')}${cById[t.cId] ? html`<button className="link" style=${{ padding: 0, textAlign: 'left' }} onClick=${() => go('cliente', { cli: t.cId })}>${cn(t)}</button>` : html`<span>Sin cliente</span>`}</div>
          <div>${lockF('Proyecto', 'Solo un administrador puede cambiar el proyecto.')}${pById[t.pId] ? html`<button className="link" style=${{ padding: 0, textAlign: 'left' }} onClick=${() => go('proyecto', { pro: t.pId })}>${pn(t)}</button>` : html`<span>Sin proyecto</span>`}</div>
          <div>${lockF('Responsable', 'Solo un administrador puede reasignar la tarea.')}
            ${isA ? html`<label className="sr" htmlFor="dOwner">Responsable</label><select id="dOwner" value=${t.o} style=${{ width: '100%', fontWeight: 600 }} onChange=${(e) => { const v = e.target.value; run(async () => { await updTask(t, { o: v }, myName + ' reasignó la tarea a ' + mname(v) + '.'); logAct(myName + ' reasignó “' + t.n + '” a ' + mname(v), t.cId, ''); notify(v, 'Se te asignó una tarea: ' + t.n + ' · ' + cn(t) + '.', t.id); }, 'Tarea reasignada a ' + mname(v) + '. Le llegará una notificación.'); }}>${team.map((p) => html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}${!team.some((p) => p.id === t.o) && html`<option value=${t.o}>${mname(t.o)}</option>`}</select>`
              : html`<span style=${{ display: 'flex', alignItems: 'center', gap: 6 }}>${av(t.o, 22)}${mname(t.o)}</span>`}
          </div>
          <div><small>Prioridad</small><${PD} k=${t.pr} /></div>
          <div><small>Inicio</small><span>${fmtY(t.start)}</span></div>
          <div><small>Vencimiento</small><span className=${di.cls} style=${{ fontSize: 14 }}>${fmtY(t.due)}</span></div>
          <div><small>Creada</small><span style=${{ fontWeight: 400 }}>${fmtY(t.created)}</span></div>
          <div><small>Última modificación</small><span style=${{ fontWeight: 400 }}>${fmtY(t.mod)}</span></div>
        </div>
        <div>
          <div style=${{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}><${Tip} label="Estado" text="Indica en qué etapa se encuentra la tarea." /></div>
          <div className="stbtns" role="group" aria-label="Cambiar estado">${SK.map((k) => { const onK = t.s === k; return html`<button key=${k} aria-pressed=${onK ? 'true' : 'false'} style=${onK ? { background: ST[k].bg, color: ST[k].fg, borderColor: ST[k].dot } : null} onClick=${() => setStatus(t, k)}>${ST[k].l}</button>`; })}</div>
          ${isA && t.s === 'rev' && html`<div className="review"><b style=${{ flex: '1 1 200px' }}>Esta tarea espera tu revisión.</b>
            <button className="btn sm" onClick=${() => setStatus(t, 'curso', { hist: myName + ' devolvió la tarea con observaciones.', act: myName + ' devolvió “' + t.n + '” a ' + mname(t.o), note: myName + ' te devolvió “' + t.n + '” con observaciones.', msg: 'Tarea devuelta. ' + mname(t.o) + ' recibirá una notificación.' })}>Devolver con observaciones</button>
            <button className="btn sm pri" onClick=${() => setStatus(t, 'fin', { hist: myName + ' aprobó la tarea.', act: myName + ' aprobó “' + t.n + '”', note: 'Tu tarea “' + t.n + '” fue aprobada.', msg: 'Tarea aprobada. Ya no aparece en el calendario, pero queda guardada.' })}>Aprobar</button></div>`}
        </div>
        <div><label htmlFor="dDesc" style=${{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Descripción</label>
          <textarea id="dDesc" className="inp" rows="3" defaultValue=${t.desc || ''} key=${'d' + t.id + (t.mod || '')} onBlur=${(e) => { const v = e.target.value; if (v !== (t.desc || '')) run(() => updTask(t, { desc: v }, myName + ' editó la descripción.'), 'Descripción guardada.'); }}></textarea>
          <small className="muted">Se guarda al salir del campo.</small></div>
        <div>
          <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><h3 style=${{ fontSize: 15 }}>Archivos</h3>
            ${cap.assets ? html`<label className="btn sm" style=${{ cursor: 'pointer', opacity: ui.busy ? 0.5 : 1 }}>${ui.busy ? 'Subiendo…' : 'Adjuntar archivo'}<input type="file" className="sr" disabled=${ui.busy} onChange=${(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; if (f.size > 50 * 1024 * 1024) { flash('El archivo pesa más de 50 MB.'); return; } upload(f); }} /></label>` : null}</div>
          ${(t.files || []).map((f, i) => typeof f === 'string' ? html`<div key=${i} className="file"><${Icon} d=${ICON.file} s=${16} /><span className="ell">${f}</span></div>`
            : html`<a key=${f.id || i} className="file" href="#" title="Descargar" onClick=${(e) => { e.preventDefault(); if (cap.assets) cap.assets.download(f).catch(() => flash('No se pudo descargar el archivo. Revisá tu conexión.')); }}><${Icon} d=${ICON.file} s=${16} style=${{ color: 'var(--muted)' }} /><span className="ell" style=${{ flex: 1 }}>${f.name}</span><small className="muted">${f.by ? mname(f.by) + ' · ' : ''}${rel(f.at)}</small></a>`)}
          ${!(t.files || []).length && html`<p className="muted">Todavía no hay archivos.</p>`}
          ${!cap.assets && html`<small className="muted">Adjuntar archivos no está disponible en este navegador.</small>`}
        </div>
        <div>
          <h3 style=${{ fontSize: 15, marginBottom: 10 }}>Comentarios</h3>
          ${comments.map((c) => html`<div key=${c.id} className="cmt">${av(c.a, 30)}<div><div style=${{ fontSize: 13 }}><b>${mname(c.a)}</b> <span className="muted">· ${rel(c.at)}</span></div><div style=${{ marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>${c.x}</div></div></div>`)}
          <label htmlFor="dCmt" className="sr">Nuevo comentario</label>
          <textarea id="dCmt" className="inp" rows="2" placeholder="Escribí un comentario…" value=${ui.draft} onChange=${(e) => set({ draft: e.target.value, draftTask: t.id })}></textarea>
          <div style=${{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}><button className="btn sm pri" disabled=${!ui.draft.trim()} onClick=${() => {
            const x = ui.draft.trim(); if (!x) return;
            set({ draft: '' });
            run(async () => {
              await db.doc('tasks/' + t.id).collection('comments').add({ a: myId, at: Date.now(), x });
              if (isA) notify(t.o, myName + ' comentó en “' + t.n + '”.', t.id); else notifyAdmins(myName + ' comentó en “' + t.n + '”.', t.id);
              logAct(myName + ' comentó en “' + t.n + '”', t.cId, '');
            });
          }}>Comentar</button></div>
        </div>
        <div><h3 style=${{ fontSize: 15, marginBottom: 8 }}>Historial</h3>${(t.hist || []).map((h, i) => html`<div key=${i} className="hist"><span>${fmt(h.d)}</span><span>${h.x}</span></div>`)}</div>
      </div>
    </aside>`;
  };

  /* ---------- formularios ---------- */
  const FormModal = () => {
    const f = ui.form; const isNew = !f.id;
    const setF = (k, v) => set((u) => ({ form: Object.assign({}, u.form, { [k]: v }) }));
    const close = () => set({ modal: null, confirmDel: false });
    let title, fields, ok, save, del, delBlock = '';
    const ownerSel = (k, label) => html`<label className="fld">${label}<select value=${f[k]} onChange=${(e) => setF(k, e.target.value)}>${team.map((p) => html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}</select></label>`;
    const prio = html`<div className="full"><div style=${{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Prioridad</div><div className="prio4" role="group" aria-label="Prioridad">${PK.map((k) => html`<button key=${k} aria-pressed=${f.pr === k ? 'true' : 'false'} onClick=${() => setF('pr', k)}><span className="dot" style=${{ background: PR[k].c }}></span>${PR[k].l}</button>`)}</div></div>`;
    const dates = html`<label className="fld">Inicio<input type="date" className="inp" value=${f.start || ''} onChange=${(e) => setF('start', e.target.value)} /></label><label className="fld">Vencimiento<input type="date" className="inp" value=${f.due || ''} onChange=${(e) => setF('due', e.target.value)} /></label>`;
    if (f.kind === 'task') {
      const pOpts = projects.filter((p) => p.cId === f.cId);
      title = isNew ? 'Nueva tarea' : 'Editar tarea';
      ok = f.n.trim() && f.pId && f.due && f.o;
      fields = html`
        <label className="fld full">Nombre de la tarea<input className="inp" value=${f.n} onChange=${(e) => setF('n', e.target.value)} placeholder="Ej.: Presentar IVA del mes" autoFocus /></label>
        <label className="fld">Cliente<select value=${f.cId} onChange=${(e) => { const c = e.target.value; set((u) => ({ form: Object.assign({}, u.form, { cId: c, pId: (projects.find((x) => x.cId === c) || {}).id || '' }) })); }}>${clients.map((c) => html`<option key=${c.id} value=${c.id}>${c.n}</option>`)}</select></label>
        <label className="fld">Proyecto<select value=${f.pId} onChange=${(e) => setF('pId', e.target.value)} disabled=${!pOpts.length}>${pOpts.length ? pOpts.map((p) => html`<option key=${p.id} value=${p.id}>${p.p}</option>`) : html`<option value="">Sin proyectos</option>`}</select>
          ${!pOpts.length && html`<span style=${{ fontWeight: 400, color: 'var(--danger)', fontSize: 12 }}>Este cliente no tiene proyectos. Creá uno primero.</span>`}</label>
        ${ownerSel('o', 'Responsable')}${dates}${prio}
        <label className="fld full">Descripción<textarea className="inp" rows="3" value=${f.desc} onChange=${(e) => setF('desc', e.target.value)} placeholder="Qué hay que hacer y qué se necesita"></textarea></label>`;
      save = () => run(async () => {
        if (isNew) {
          const ref = await db.collection('tasks').add({ n: f.n.trim(), cId: f.cId, pId: f.pId, o: f.o, s: 'sin', pr: f.pr, start: f.start, due: f.due, desc: f.desc, created: TODAY, mod: TODAY, files: [], hist: [{ d: TODAY, x: myName + ' creó la tarea y se la asignó a ' + mname(f.o) + '.' }] });
          logAct(myName + ' creó “' + f.n.trim() + '” y se la asignó a ' + mname(f.o), f.cId, '');
          notify(f.o, 'Se te asignó una nueva tarea: ' + f.n.trim() + ' · ' + ((cById[f.cId] || {}).n || '') + '.', ref.id);
        } else {
          const old = tasks.find((x) => x.id === f.id) || {};
          await updTask(old, { n: f.n.trim(), cId: f.cId, pId: f.pId, o: f.o, start: f.start, due: f.due, pr: f.pr, desc: f.desc }, myName + ' editó la tarea' + (old.o !== f.o ? ' y la reasignó a ' + mname(f.o) : '') + '.');
          if (old.o !== f.o) notify(f.o, 'Se te asignó una tarea: ' + f.n.trim() + '.', f.id);
          else if (old.due !== f.due) notify(f.o, myName + ' cambió el vencimiento de “' + f.n.trim() + '” al ' + fmt(f.due) + '.', f.id);
          logAct(myName + ' editó “' + f.n.trim() + '”', f.cId, '');
        }
        close();
      }, isNew ? 'Tarea creada y asignada a ' + mname(f.o) + '.' : 'Cambios guardados.');
      del = () => run(async () => { await db.doc('tasks/' + f.id).delete(); logAct(myName + ' eliminó la tarea “' + f.n + '”', f.cId, ''); set({ modal: null, sel: null, confirmDel: false }); }, 'Tarea eliminada.');
    } else if (f.kind === 'proj') {
      title = isNew ? 'Nuevo proyecto' : 'Editar proyecto';
      ok = f.p.trim() && f.cId && f.due;
      fields = html`
        <label className="fld full">Nombre del proyecto<input className="inp" value=${f.p} onChange=${(e) => setF('p', e.target.value)} placeholder="Ej.: Liquidación mensual" autoFocus /></label>
        <label className="fld">Cliente<select value=${f.cId} onChange=${(e) => setF('cId', e.target.value)}>${clients.map((c) => html`<option key=${c.id} value=${c.id}>${c.n}</option>`)}</select></label>
        ${ownerSel('o', 'Responsable')}${dates}${prio}
        <label className="fld full">Descripción<textarea className="inp" rows="3" value=${f.desc} onChange=${(e) => setF('desc', e.target.value)}></textarea></label>`;
      save = () => run(async () => {
        const body = { p: f.p.trim(), cId: f.cId, o: f.o, start: f.start, due: f.due, pr: f.pr, desc: f.desc };
        if (isNew) {
          const ref = await db.collection('projects').add(Object.assign(body, { createdAt: Date.now() }));
          logAct(myName + ' creó el proyecto “' + body.p + '”', f.cId, '');
          notify(f.o, 'Sos responsable del nuevo proyecto ' + body.p + '.', null);
          go('proyecto', { pro: ref.id });
        } else { await db.doc('projects/' + f.id).update(body); close(); }
      }, isNew ? 'Proyecto creado.' : 'Cambios guardados.');
      if (!isNew && tasks.some((t) => t.pId === f.id)) delBlock = 'Para eliminarlo, primero eliminá o mové sus tareas.';
      del = () => run(async () => { await db.doc('projects/' + f.id).delete(); logAct(myName + ' eliminó el proyecto “' + f.p + '”', f.cId, ''); go('proyectos'); }, 'Proyecto eliminado.');
    } else {
      title = isNew ? 'Nuevo cliente' : 'Editar cliente';
      ok = f.n.trim();
      const tx = (k, label, ph, full, type) => html`<label className=${'fld' + (full ? ' full' : '')}>${label}<input className="inp" type=${type || 'text'} value=${f[k] || ''} onChange=${(e) => setF(k, e.target.value)} placeholder=${ph || ''} /></label>`;
      fields = html`
        <label className="fld full">Nombre o razón social<input className="inp" value=${f.n} onChange=${(e) => setF('n', e.target.value)} placeholder="Ej.: Comercial Rivera SRL" autoFocus /></label>
        ${tx('rut', 'RUT', '21 456 789 0012')}${tx('contacto', 'Persona de contacto', 'Nombre y apellido')}
        ${tx('tel', 'Teléfono', '099 123 456', false, 'tel')}${tx('mail', 'Email', 'administracion@empresa.com.uy', false, 'email')}
        ${tx('dir', 'Dirección', 'Calle, número, ciudad', true)}
        ${ownerSel('resp', 'Responsable')}
        <label className="fld">Estado<select value=${f.st} onChange=${(e) => setF('st', e.target.value)}>${CSTATES.map((x) => html`<option key=${x} value=${x}>${x}</option>`)}</select></label>`;
      save = () => run(async () => {
        const body = { n: f.n.trim(), rut: f.rut || '', contacto: f.contacto || '', tel: f.tel || '', mail: f.mail || '', dir: f.dir || '', resp: f.resp, st: f.st };
        if (isNew) { const ref = await db.collection('clients').add(Object.assign(body, { createdAt: Date.now() })); logAct(myName + ' cargó al cliente ' + body.n, ref.id, ''); go('cliente', { cli: ref.id }); }
        else { await db.doc('clients/' + f.id).update(body); close(); }
      }, isNew ? 'Cliente creado.' : 'Cambios guardados.');
      if (!isNew && (projects.some((p) => p.cId === f.id) || tasks.some((t) => t.cId === f.id))) delBlock = 'Para eliminarlo, primero eliminá sus proyectos y tareas. También podés marcarlo como “Inactivo”.';
      del = () => run(async () => { await db.doc('clients/' + f.id).delete(); go('clientes'); }, 'Cliente eliminado.');
    }
    return html`<button className="scrim" style=${{ zIndex: 74 }} aria-label="Cerrar" onClick=${close}></button>
    <div className="modal" role="dialog" aria-label=${title}>
      <div className="mh"><h2 style=${{ fontSize: 18 }}>${title}</h2><button className="iconbtn" aria-label="Cerrar" onClick=${close}><${Icon} d=${ICON.x} /></button></div>
      <div className="mb">${fields}</div>
      <div className="mf">
        ${!isNew && (delBlock ? html`<span className="muted" style=${{ marginRight: 'auto', fontSize: 13, maxWidth: 300 }}>${delBlock}</span>`
          : ui.confirmDel ? html`<span style=${{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><b>¿Eliminar definitivamente?</b><button className="btn sm" onClick=${() => set({ confirmDel: false })}>No</button><button className="btn sm danger" onClick=${del}>Sí, eliminar</button></span>`
          : html`<button className="btn danger" style=${{ marginRight: 'auto' }} onClick=${() => set({ confirmDel: true })}>Eliminar</button>`)}
        <button className="btn" onClick=${close}>Cancelar</button>
        <button className="btn pri" disabled=${!ok} onClick=${save}>${isNew ? (f.kind === 'task' ? 'Crear y asignar' : 'Crear') : 'Guardar cambios'}</button>
      </div>
    </div>`;
  };

  /* invitaciones: las envía el servidor (Edge Function send-invitation + Resend) */
  const inviteErr = (e) => (e && e.code === 'missing_env'
    ? { err: 'El servidor todavía no puede enviar correos. Faltan estas variables de entorno en Supabase:', missing: e.missing || [] }
    : { err: (e && e.message) || 'No se pudo enviar la invitación.', missing: null });
  const resendInvite = async (v) => {
    set({ busy: true });
    try { await SUPA.auth.invite(v.email, v.role); flash('Invitación reenviada a ' + v.email + '. El enlace anterior ya no sirve.'); }
    catch (e) { const x = inviteErr(e); set({ modal: 'member', form: { kind: 'member', email: v.email, role: v.role, err: x.err, missing: x.missing } }); }
    set({ busy: false });
  };

  const MemberModal = () => {
    const f = ui.form;
    const setF = (k, v) => set((u) => ({ form: Object.assign({}, u.form, { [k]: v, err: k === 'err' ? v : '' , missing: k === 'err' ? u.form.missing : null }) }));
    const close = () => set({ modal: null });
    if (f.kind === 'memberEdit') {
      const target = members.find((m) => m.id === f.id) || {};
      const isOwnerTarget = !!target.owner;
      const admins = team.filter((m) => m.role === 'admin');
      const isLastAdmin = f.role === 'admin' && admins.length <= 1 && admins[0] && admins[0].id === f.id;
      const isSelf = f.id === myId;
      const lockRole = isLastAdmin || isOwnerTarget;
      const save = () => run(async () => {
        const patch = { role: f.role, active: f.active };
        if (isSelf) Object.assign(patch, { first: f.first, last: f.last });
        await db.doc('members/' + f.id).update(patch);
        if (target.active !== false && f.active === false) logAct(myName + ' desactivó el acceso de ' + target.name, '', '');
        close();
      }, 'Cambios guardados.');
      const sendReset = () => run(async () => { await SUPA.auth.resetPassword(target.email); }, 'Le enviamos a ' + target.email + ' un correo para crear una contraseña nueva.');
      return html`<button className="scrim" style=${{ zIndex: 74 }} aria-label="Cerrar" onClick=${close}></button>
      <div className="modal" role="dialog" aria-label="Editar integrante" style=${{ width: 500 }}>
        <div className="mh"><h2 style=${{ fontSize: 18 }}>Editar integrante</h2><button className="iconbtn" aria-label="Cerrar" onClick=${close}><${Icon} d=${ICON.x} /></button></div>
        <div className="mb" style=${{ gridTemplateColumns: '1fr' }}>
          ${isSelf ? html`<div style=${{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              <label className="fld">Nombre<input className="inp" value=${f.first} onChange=${(e) => setF('first', e.target.value)} /></label>
              <label className="fld">Apellido<input className="inp" value=${f.last} onChange=${(e) => setF('last', e.target.value)} /></label></div>`
            : html`<div className="fld">Integrante<span style=${{ fontWeight: 400 }}><b>${target.name}</b> · ${target.email}</span>
              <span className="muted" style=${{ fontWeight: 400, fontSize: 12 }}>Cada persona edita su nombre desde «Mi perfil».</span></div>`}
          <label className="fld">Rol<select value=${f.role} disabled=${lockRole} onChange=${(e) => setF('role', e.target.value)}><option value="emp">Empleado/a</option><option value="admin">Administrador/a</option></select>
            ${lockRole && html`<span className="muted" style=${{ fontWeight: 400, fontSize: 12 }}>${isOwnerTarget ? 'Quien creó el estudio siempre es administrador.' : 'Tiene que haber al menos un administrador.'}</span>`}</label>
          ${!isSelf && !isOwnerTarget && !isLastAdmin && html`<label style=${{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}><input type="checkbox" checked=${f.active} onChange=${() => setF('active', !f.active)} style=${{ width: 18, height: 18, accentColor: 'var(--accent)' }} />Acceso activo</label>
            <p className="muted" style=${{ fontSize: 12, marginTop: -6 }}>Si lo desactivás, deja de ver los datos del estudio de inmediato. Sus tareas y su historial se conservan.</p>`}
          ${!isSelf && target.email && html`<div><button className="btn sm" onClick=${sendReset}><${Icon} d=${ICON.key} s=${15} />Enviar correo para restablecer contraseña</button></div>`}
        </div>
        <div className="mf"><button className="btn" onClick=${close}>Cancelar</button><button className="btn pri" disabled=${isSelf && !String(f.first || '').trim()} onClick=${save}>Guardar cambios</button></div>
      </div>`;
    }
    const email = String(f.email || '').trim().toLowerCase();
    const isMember = members.some((m) => m.active !== false && String(m.email).toLowerCase() === email);
    const bad = !!email && (!validEmail(email) || isMember);
    const send = async () => {
      set((u) => ({ busy: true, form: Object.assign({}, u.form, { err: '', missing: null }) }));
      try {
        await SUPA.auth.invite(email, f.role);
        logAct(myName + ' invitó a ' + email + ' como ' + ROLE[f.role].toLowerCase(), '', '');
        set({ busy: false, modal: null }); flash('Invitación enviada a ' + email + '.');
      } catch (e) { const x = inviteErr(e); set((u) => ({ busy: false, form: Object.assign({}, u.form, x) })); }
    };
    return html`<button className="scrim" style=${{ zIndex: 74 }} aria-label="Cerrar" onClick=${close}></button>
    <div className="modal" role="dialog" aria-label="Invitar integrante" style=${{ width: 520 }}>
      <div className="mh"><h2 style=${{ fontSize: 18 }}>Invitar integrante</h2><button className="iconbtn" aria-label="Cerrar" onClick=${close}><${Icon} d=${ICON.x} /></button></div>
      <form className="mb" style=${{ gridTemplateColumns: '1fr' }} onSubmit=${(e) => { e.preventDefault(); if (email && !bad && !ui.busy) send(); }}>
        <label className="fld">Correo<input className="inp" type="email" value=${f.email} onChange=${(e) => setF('email', e.target.value)} placeholder="nombre@estudio.com.uy" autoFocus />
          ${bad && html`<span style=${{ fontWeight: 400, fontSize: 12, color: 'var(--danger)' }}>${isMember ? 'Esa persona ya forma parte del estudio.' : 'Ese correo no parece válido.'}</span>`}</label>
        <label className="fld">Rol<select value=${f.role} onChange=${(e) => setF('role', e.target.value)}><option value="emp">Empleado/a</option><option value="admin">Administrador/a</option></select></label>
        <p className="muted" style=${{ fontSize: 13, lineHeight: 1.5 }}>Le llega un correo con el botón «Aceptar invitación». Ahí crea su contraseña y entra al estudio, desde cualquier computadora. El enlace vence a los 14 días y sirve una sola vez.</p>
        ${f.err && html`<div role="alert" className="lock" style=${{ padding: 14, borderColor: 'var(--danger)', flexDirection: 'column', gap: 6 }}>
          <b style=${{ color: 'var(--danger)', fontSize: 13 }}>${f.err}</b>
          ${f.missing && f.missing.length > 0 && html`<ul style=${{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>${f.missing.map((m) => html`<li key=${m}><code>${m}</code></li>`)}</ul>
            <span className="muted" style=${{ fontSize: 12, lineHeight: 1.5 }}>Configuralas en Supabase › Edge Functions › Secrets (o con <code>supabase secrets set</code>). Hasta entonces no se envía ningún correo y la invitación no queda creada.</span>`}
        </div>`}
        <button type="submit" className="sr" tabIndex="-1">Invitar</button>
      </form>
      <div className="mf"><button className="btn" onClick=${close}>Cancelar</button><button className="btn pri" disabled=${!email || bad || ui.busy} onClick=${send}><${Icon} d=${ICON.mail} s=${16} />${ui.busy ? 'Enviando…' : 'Invitar'}</button></div>
    </div>`;
  };

  /* importación de los datos que la versión anterior guardaba en este navegador */
  const ImportModal = () => {
    const f = ui.form;
    const src = LEGACY.studios().find((x) => x.key === f.key);
    const close = () => { if (f.step !== 'run') set({ modal: null }); };
    if (!src) return null;
    const norm = (x) => String(x || '').trim().toLowerCase();
    const guess = (lm) => { const byMail = team.find((m) => lm.email && norm(m.email) === norm(lm.email)); const byName = team.find((m) => norm(m.name) === norm(lm.name)); return (byMail || byName || {}).id || myId; };
    const mapOf = (lm) => f.map[lm.id] || guess(lm);
    const go = async () => {
      set((u) => ({ form: Object.assign({}, u.form, { step: 'run', log: ['Empezando…'] }) }));
      const log = (x) => set((u) => ({ form: Object.assign({}, u.form, { log: u.form.log.concat([x]) }) }));
      const who = (id) => { const lm = src.members.find((m) => m.id === id); return lm ? mapOf(lm) : myId; };
      const sb = SUPA.sb, ws = SUPA.ws();
      const ins = async (table, row, sel) => { const q = sb.from(table).insert(row); const r = sel ? await q.select('id').single() : await q; if (r.error) throw new Error(r.error.message); return r.data; };
      const cMap = {}, pMap = {};
      const ST2 = { sin: 'sin_comenzar', curso: 'en_curso', rev: 'en_revision', fin: 'terminado' }, PR2 = { baja: 'baja', media: 'media', alta: 'alta', urg: 'urgente' };
      try {
        for (const c of src.clients) {
          const r = await ins('clients', { workspace_id: ws, name: c.n || 'Cliente', rut: c.rut || '', contact_name: c.contacto || '', phone: c.tel || '', email: c.mail || '', address: c.dir || '', responsible_id: c.resp ? who(c.resp) : null, status: CSTATES.indexOf(c.st) >= 0 ? c.st : 'Activo' }, true);
          cMap[c.id] = r.id;
        }
        log(src.clients.length + ' clientes copiados.');
        for (const p of src.projects) {
          if (!cMap[p.cId]) continue;
          const r = await ins('projects', { workspace_id: ws, client_id: cMap[p.cId], name: p.p || 'Proyecto', description: p.desc || '', responsible_id: p.o ? who(p.o) : null, start_date: p.start || null, due_date: p.due || null, priority: PR2[p.pr] || 'media' }, true);
          pMap[p.id] = r.id;
        }
        log(Object.keys(pMap).length + ' proyectos copiados.');
        let nT = 0, nC = 0, nF = 0, skipped = 0;
        for (const t of src.tasks) {
          if (!pMap[t.pId] || !cMap[t.cId]) { skipped++; continue; }
          const r = await ins('tasks', { workspace_id: ws, client_id: cMap[t.cId], project_id: pMap[t.pId], name: t.n || 'Tarea', description: t.desc || '', assignee_id: who(t.o), status: ST2[t.s] || 'sin_comenzar', priority: PR2[t.pr] || 'media', start_date: t.start || null, due_date: t.due || null }, true);
          nT++;
          const hist = (t.hist || []).slice().reverse();
          if (hist.length) await ins('task_history', hist.map((h) => ({ task_id: r.id, actor_id: myId, message: h.x, created_at: h.d ? h.d + 'T12:00:00Z' : undefined })));
          await ins('task_history', { task_id: r.id, actor_id: myId, message: myName + ' importó la tarea desde la versión anterior.' });
          for (const c of src.comments(t.id)) {
            const lm = src.members.find((m) => m.id === c.a);
            await ins('task_comments', { task_id: r.id, author_id: myId, body: (lm && norm(lm.name) !== norm(myName) ? '[' + lm.name + '] ' : '') + c.x, created_at: c.at ? new Date(c.at).toISOString() : undefined });
            nC++;
          }
          const files = [];
          for (const fl of (t.files || [])) {
            if (!fl || typeof fl === 'string' || !fl.id) continue;
            const rec = await LEGACY.blob(fl.id);
            if (!rec || !rec.blob) continue;
            const up = await SUPA.assets.upload(new File([rec.blob], fl.name || rec.name || 'archivo'), r.id);
            files.push({ id: up.id, name: fl.name || rec.name, at: fl.at || Date.now(), by: myId });
            nF++;
          }
          if (files.length) { const u = await sb.from('tasks').update({ files }).eq('id', r.id); if (u.error) throw new Error(u.error.message); }
        }
        log(nT + ' tareas, ' + nC + ' comentarios y ' + nF + ' adjuntos copiados.' + (skipped ? ' ' + skipped + ' tareas sin proyecto o cliente no se copiaron.' : ''));
        await ins('activity', { workspace_id: ws, actor_id: myId, message: myName + ' importó los datos de «' + src.name + '» desde la versión anterior', kind: '' });
        LEGACY.markImported(src.key);
        set((u) => ({ form: Object.assign({}, u.form, { step: 'done' }) }));
      } catch (e) {
        log('Se detuvo por un error: ' + e.message + '. Lo que ya se copió quedó guardado; si volvés a importar, se puede duplicar.');
        set((u) => ({ form: Object.assign({}, u.form, { step: 'error' }) }));
      }
    };
    return html`<button className="scrim" style=${{ zIndex: 74 }} aria-label="Cerrar" onClick=${close}></button>
    <div className="modal" role="dialog" aria-label="Importar datos" style=${{ width: 580 }}>
      <div className="mh"><h2 style=${{ fontSize: 18 }}>Importar «${src.name}»</h2>${f.step !== 'run' && html`<button className="iconbtn" aria-label="Cerrar" onClick=${close}><${Icon} d=${ICON.x} /></button>`}</div>
      <div style=${{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        ${f.step === 'map' ? html`
          ${src.imported && html`<div className="note" style=${{ maxWidth: 'none', background: 'var(--warn-soft)', color: 'var(--warn-ink)' }}>Estos datos ya se importaron una vez. Si los volvés a importar, se van a duplicar.</div>`}
          <p style=${{ lineHeight: 1.5 }}>Elegí a quién del equipo actual le corresponde cada persona de la versión anterior. Si todavía no aceptó su invitación, sus tareas quedan a tu nombre y después las reasignás.</p>
          ${src.members.map((lm) => html`<label key=${lm.id} className="fld" style=${{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <span style=${{ flex: '1 1 0', minWidth: 0 }} className="ell">${lm.name}${lm.email ? html` <span className="muted" style=${{ fontWeight: 400 }}>· ${lm.email}</span>` : ''}</span>
            <select style=${{ flex: '1 1 0' }} value=${mapOf(lm)} onChange=${(e) => { const v = e.target.value; set((u) => ({ form: Object.assign({}, u.form, { map: Object.assign({}, u.form.map, { [lm.id]: v }) }) })); }}>${team.map((m) => html`<option key=${m.id} value=${m.id}>${m.name}${m.id === myId ? ' (vos)' : ''}</option>`)}</select>
          </label>`)}
          <p className="muted" style=${{ fontSize: 12, lineHeight: 1.5 }}>Se copian ${src.clients.length} clientes, ${src.projects.length} proyectos y ${src.tasks.length} tareas con sus comentarios, historial y adjuntos. Los comentarios quedan a tu nombre, con el autor original entre corchetes. La copia local no se borra.</p>`
        : html`<div style=${{ display: 'flex', flexDirection: 'column', gap: 6 }}>${f.log.map((l, i) => html`<div key=${i} style=${{ fontSize: 13 }}>${l}</div>`)}</div>
          ${f.step === 'run' && html`<div className="spin" style=${{ margin: '6px 0' }}></div>`}
          ${f.step === 'done' && html`<p style=${{ lineHeight: 1.5 }}><b>Listo.</b> Los datos ya están en el servidor y los ve todo el equipo. Si querés, ahora podés borrar la copia que quedó en este navegador.</p>`}`}
      </div>
      <div className="mf">
        ${f.step === 'map' && html`<button className="btn" onClick=${close}>Cancelar</button><button className="btn pri" onClick=${go}>Importar al estudio</button>`}
        ${f.step === 'done' && html`<button className="btn danger" style=${{ marginRight: 'auto' }} onClick=${() => { if (window.confirm('Se borran los datos que la versión anterior guardó en este navegador. Lo importado al servidor no se toca. ¿Continuar?')) { LEGACY.wipe(src.key); set({ modal: null }); flash('Copia local borrada.'); } }}>Borrar la copia local</button><button className="btn pri" onClick=${() => set({ modal: null })}>Listo</button>`}
        ${f.step === 'error' && html`<button className="btn" onClick=${() => set({ modal: null })}>Cerrar</button>`}
      </div>
    </div>`;
  };

  /* ---------- cuenta ---------- */
  const ProfileModal = () => {
    const close = () => set({ modal: null });
    const pf = ui.form && ui.form.kind === 'profile' ? ui.form : { kind: 'profile', first: me.first || '', last: me.last || '' };
    const setPf = (k, v) => set((u) => ({ form: Object.assign({}, u.form && u.form.kind === 'profile' ? u.form : pf, { [k]: v }) }));
    const since = me.addedAt ? fmtY(iso(new Date(me.addedAt))) : '—';
    return html`<button className="scrim" style=${{ zIndex: 74 }} aria-label="Cerrar" onClick=${close}></button>
    <div className="modal" role="dialog" aria-label="Mi perfil" style=${{ width: 460 }}>
      <div className="mh"><h2 style=${{ fontSize: 18 }}>Mi perfil</h2><button className="iconbtn" aria-label="Cerrar" onClick=${close}><${Icon} d=${ICON.x} /></button></div>
      <div style=${{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style=${{ display: 'flex', alignItems: 'center', gap: 14 }}>${av(myId, 56)}<div style=${{ minWidth: 0 }}><b style=${{ fontSize: 18, display: 'block' }} className="ell">${myName}</b><span className="muted">${ROLE[me.role] || ROLE.emp} en ${studio}</span></div></div>
        <div className="kv" style=${{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
          <div><small>Correo</small><span style=${{ wordBreak: 'break-word' }}>${(account && account.email) || '—'}</span></div>
          <div><small>En el equipo desde</small><span>${since}</span></div>
          <div><small>Tareas abiertas</small><span>${tasks.filter((t) => t.o === myId && t.s !== 'fin').length}</span></div>
          <div><small>Tareas terminadas</small><span>${tasks.filter((t) => t.o === myId && t.s === 'fin').length}</span></div>
        </div>
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
          <label className="fld">Nombre<input className="inp" value=${pf.first} onChange=${(e) => setPf('first', e.target.value)} autoComplete="given-name" /></label>
          <label className="fld">Apellido<input className="inp" value=${pf.last} onChange=${(e) => setPf('last', e.target.value)} autoComplete="family-name" /></label>
        </div>
      </div>
      <div className="mf"><button className="btn" style=${{ marginRight: 'auto' }} onClick=${() => set({ modal: 'account', form: { cur: '', pw: '', pw2: '', err: '' } })}>Configuración de cuenta</button>
        <button className="btn" onClick=${close}>Cerrar</button>
        <button className="btn pri" disabled=${!pf.first.trim() || (pf.first === (me.first || '') && pf.last === (me.last || ''))} onClick=${() => run(async () => { await db.doc('members/' + myId).update({ first: pf.first, last: pf.last }); close(); }, 'Perfil actualizado.')}>Guardar</button></div>
    </div>`;
  };

  const AccountModal = () => {
    const f = ui.form;
    const setF = (k, v) => set((u) => ({ form: Object.assign({}, u.form, { [k]: v, err: '' }) }));
    const close = () => set({ modal: null });
    const save = async () => {
      if (f.pw.length < 8) { set((u) => ({ form: Object.assign({}, u.form, { err: 'La nueva contraseña tiene que tener al menos 8 caracteres.' }) })); return; }
      if (f.pw !== f.pw2) { set((u) => ({ form: Object.assign({}, u.form, { err: 'Las contraseñas nuevas no coinciden.' }) })); return; }
      set({ busy: true });
      try { await SUPA.auth.changePassword(account.email, f.cur, f.pw); set({ busy: false, modal: null }); flash('Contraseña actualizada. Se cerraron tus sesiones en otros dispositivos.'); }
      catch (e) { set((u) => ({ busy: false, form: Object.assign({}, u.form, { err: e && e.code === 'bad' ? 'La contraseña actual no es correcta.' : 'No se pudo cambiar la contraseña.' }) })); }
    };
    return html`<button className="scrim" style=${{ zIndex: 74 }} aria-label="Cerrar" onClick=${close}></button>
    <div className="modal" role="dialog" aria-label="Configuración de cuenta" style=${{ width: 480 }}>
      <div className="mh"><h2 style=${{ fontSize: 18 }}>Configuración de cuenta</h2><button className="iconbtn" aria-label="Cerrar" onClick=${close}><${Icon} d=${ICON.x} /></button></div>
      <form className="mb" style=${{ gridTemplateColumns: '1fr' }} onSubmit=${(e) => { e.preventDefault(); save(); }}>
        <label className="fld">Correo<input className="inp" value=${(account && account.email) || ''} disabled autoComplete="username" /></label>
        <h3 style=${{ fontSize: 15, marginTop: 4 }}>Cambiar contraseña</h3>
        <label className="fld">Contraseña actual<input className="inp" type="password" autoComplete="current-password" value=${f.cur} onChange=${(e) => setF('cur', e.target.value)} /></label>
        <label className="fld">Nueva contraseña<input className="inp" type="password" autoComplete="new-password" placeholder="Al menos 8 caracteres" value=${f.pw} onChange=${(e) => setF('pw', e.target.value)} /></label>
        <label className="fld">Repetí la nueva contraseña<input className="inp" type="password" autoComplete="new-password" value=${f.pw2} onChange=${(e) => setF('pw2', e.target.value)} /></label>
        ${f.err && html`<p role="alert" style=${{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>${f.err}</p>`}
        <button type="submit" className="sr" tabIndex="-1">Guardar</button>
      </form>
      <div className="mf">
        <button className="btn danger" style=${{ marginRight: 'auto' }} onClick=${() => { set({ modal: null }); setTimeout(requestLogout, 0); }}><${Icon} d=${ICON.out} s=${16} />Cerrar sesión</button>
        <button className="btn" onClick=${close}>Cancelar</button>
        <button className="btn pri" disabled=${!f.cur || !f.pw || !f.pw2 || ui.busy} onClick=${save}>${ui.busy ? 'Guardando…' : 'Cambiar contraseña'}</button>
      </div>
    </div>`;
  };

  const ConfirmOut = () => html`<button className="scrim" style=${{ zIndex: 80 }} aria-label="Cancelar" onClick=${keepEditing}></button>
    <div className="modal" role="alertdialog" aria-label="Cambios sin guardar" style=${{ width: 440, zIndex: 81 }}>
      <div style=${{ padding: '24px 22px 8px' }}>
        <h2 style=${{ fontSize: 19 }}>Tenés cambios sin guardar</h2>
        <p className="muted" style=${{ marginTop: 8, lineHeight: 1.5 }}>Si cerrás sesión ahora, se van a perder:</p>
        <ul style=${{ margin: '10px 0 0', paddingLeft: 20, lineHeight: 1.7 }}>${pending.map((x) => html`<li key=${x}>${x}</li>`)}</ul>
      </div>
      <div className="mf"><button className="btn danger" onClick=${doLogout}>Salir sin guardar</button><button className="btn pri" autoFocus onClick=${keepEditing}>Seguir editando</button></div>
    </div>`;

  /* ---------- tutorial ---------- */
  const Tour = () => {
    if (!ui.phase) return null;
    const inSteps = ui.phase === 'steps';
    const center = ui.phase !== 'steps' || cur.target === 'center';
    const dots = html`<div className="dots" aria-hidden="true">${steps.map((x, i) => html`<span key=${i} style=${{ width: i === ui.step ? 18 : 6, background: i <= ui.step ? 'var(--accent)' : 'var(--line)' }}></span>`)}</div>`;
    const nav = html`<div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>${dots}
      <div style=${{ display: 'flex', gap: 6 }}>
        <button className="link" style=${{ color: 'var(--muted)' }} onClick=${() => endTour(true)}>Saltar tutorial</button>
        <button className="btn sm" disabled=${ui.step === 0} onClick=${() => stepTo(ui.step - 1)}>Anterior</button>
        <button className="btn sm pri" onClick=${() => stepTo(ui.step + 1)}>${ui.step === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
      </div></div>`;
    const flowChips = cur.flow && !center ? html`<div className="flow">${cur.flow.map((l, i) => html`<span key=${i} style=${{ display: 'contents' }}><span className="c">${l}</span>${i < cur.flow.length - 1 && html`<span aria-hidden="true" className="muted">→</span>`}</span>`)}</div>` : null;
    let tip = null, spot = null;
    if (inSteps && !center && rect) {
      const TW = Math.min(340, rect.vw - 32);
      const st = { left: Math.max(16, Math.min(rect.x, rect.vw - TW - 16)) };
      let arrow = null;
      if (rect.h > rect.vh * 0.55) { st.top = Math.max(rect.y, 16) + 18; st.left = Math.max(16, Math.min(rect.x + rect.w - TW - 18, rect.vw - TW - 16)); }
      else if (rect.y + rect.h + 260 < rect.vh) { st.top = rect.y + rect.h + 16; arrow = 'top'; }
      else if (rect.y > 260) { st.bottom = rect.vh - rect.y + 16; arrow = 'bottom'; }
      else st.top = Math.max(16, rect.vh - 300);
      const ax = Math.max(18, Math.min(rect.x + Math.min(rect.w / 2, 40) - st.left - 6, TW - 30));
      spot = html`<div className="spot" style=${{ top: rect.y - 6, left: rect.x - 6, width: rect.w + 12, height: rect.h + 12 }}></div>`;
      tip = html`<div className="tipcard" role="dialog" aria-label="Tutorial" style=${st}>
        ${arrow && html`<span className="arrow" style=${arrow === 'top' ? { top: -6, left: ax } : { bottom: -6, left: ax }}></span>`}
        <div className="step-k">Paso ${ui.step + 1} de ${steps.length}</div>
        <div style=${{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>${cur.title}</div>
        <p style=${{ marginTop: 6, lineHeight: 1.5, color: 'var(--ink2)' }}>${cur.body}</p>${flowChips}${nav}</div>`;
    }
    let card = null;
    if (ui.phase === 'welcome') {
      card = html`<div className="center" role="dialog" aria-label="Bienvenida">
        <${Logo} name=${studio} size=${52} />
        <h2 style=${{ fontSize: 23, marginTop: 18 }}>${isA ? 'Hola, ' + firstName + '. Te damos la bienvenida al espacio de trabajo de ' + studio + '.' : '¡Hola, ' + firstName + '! Te damos la bienvenida a tu espacio de trabajo en ' + studio + '.'}</h2>
        <p style=${{ marginTop: 10, color: 'var(--ink2)', lineHeight: 1.55 }}>${isA ? 'Desde acá vas a poder organizar clientes, proyectos, tareas y el trabajo de todo el equipo.' : 'Acá vas a encontrar tus tareas, proyectos y calendario.'}</p>
        <div style=${{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>${(isA ? ['Organizar clientes y proyectos', 'Crear y asignar tareas', 'Seguir el avance de cada persona'] : ['Ver lo que tenés para hoy', 'Actualizar el estado de cada tarea', 'Consultar tu calendario']).map((b) => html`<div key=${b} style=${{ display: 'flex', alignItems: 'center', gap: 10 }}><${Icon} d=${ICON.check} w=${2.2} style=${{ color: 'var(--accent)' }} />${b}</div>`)}</div>
        <p className="muted" style=${{ marginTop: 18, fontSize: 13 }}>${steps.length} pasos, ${isA ? 'menos de 2 minutos' : 'alrededor de 1 minuto'}.</p>
        <div style=${{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          <button className="btn" onClick=${() => endTour(true)}>Ahora no</button>
          <button className="btn pri" onClick=${startTour}>${isA ? 'Comenzar recorrido' : 'Aprender cómo funciona'}</button></div></div>`;
    } else if (ui.phase === 'done') {
      card = html`<div className="center" role="dialog" aria-label="Tutorial completado" style=${{ textAlign: 'center' }}>
        <div style=${{ width: 56, height: 56, borderRadius: 28, background: ST.fin.bg, color: ST.fin.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><${Icon} d=${ICON.check} s=${28} w=${2.4} /></div>
        <h2 style=${{ fontSize: 22 }}>¡Listo! Ya conocés lo básico para comenzar a trabajar.</h2>
        <p style=${{ marginTop: 10, color: 'var(--ink2)' }}>Si querés volver a verlo, lo encontrás en Ayuda › Repetir tutorial.</p>
        <button className="btn pri" style=${{ marginTop: 22, height: 46, padding: '0 24px' }} onClick=${() => endTour(false)}>Comenzar a trabajar</button></div>`;
    } else if (center) {
      card = html`<div className="center" role="dialog" aria-label="Tutorial">
        <div className="step-k">Paso ${ui.step + 1} de ${steps.length}</div>
        <h2 style=${{ fontSize: 21, marginTop: 6 }}>${cur.title}</h2>
        <p style=${{ marginTop: 8, color: 'var(--ink2)', lineHeight: 1.5 }}>${cur.body}</p>
        ${cur.states && html`<div style=${{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16 }}>${SK.map((k, i) => html`<div key=${k}>
          <div style=${{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, background: 'var(--sunk)' }}><span style=${{ width: 108, flex: 'none' }}><${SB} k=${k} /></span><span style=${{ fontSize: 13, color: 'var(--ink2)' }}>${ST[k].d}</span></div>
          ${i < 3 && html`<div aria-hidden="true" className="muted" style=${{ textAlign: 'center', lineHeight: 1.2 }}>↓</div>`}</div>`)}</div>`}
        ${cur.flow && html`<div style=${{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>${cur.flow.map((l, i) => html`<div key=${i} style=${{ display: 'flex', alignItems: 'center', gap: 12 }}><span className="num-c">${i + 1}</span><span style=${{ fontWeight: 600 }}>${l}</span></div>`)}</div>`}
        ${nav}</div>`;
    }
    return html`<div className="tour-layer" style=${{ background: center || !rect ? 'var(--overlay)' : 'transparent' }}></div>${spot}${tip}${card}`;
  };

  /* ---------- búsqueda y notificaciones ---------- */
  const g = ui.gq.trim().toLowerCase();
  let gres = [];
  if (g.length >= 2) {
    const cl = myClients.filter((c) => (c.n + ' ' + (c.rut || '')).toLowerCase().includes(g)).slice(0, 3).map((c) => ({ k: c.id, l: c.n, sub: 'Cliente' + (c.rut ? ' · RUT ' + c.rut : ''), go: () => go('cliente', { cli: c.id }) }));
    const pj = myProjects.filter((p) => (p.p + ' ' + ((cById[p.cId] || {}).n || '')).toLowerCase().includes(g)).slice(0, 3).map((p) => ({ k: p.id, l: p.p, sub: 'Proyecto · ' + ((cById[p.cId] || {}).n || ''), go: () => go('proyecto', { pro: p.id }) }));
    const tk = mine.filter((t) => (t.n + ' ' + cn(t)).toLowerCase().includes(g)).slice(0, 4).map((t) => ({ k: 't' + t.id, l: t.n, sub: cn(t) + ' · ' + ST[t.s].l, go: () => openTask(t.id) }));
    const pp = isA ? team.filter((p) => String(p.name).toLowerCase().includes(g)).map((p) => ({ k: p.id, l: p.name, sub: ROLE[p.role] || '', go: () => go('tareas', { scope: null, q: '', tSt: 'all', tOwn: p.id, group: 'status' }) })) : [];
    gres = [['Clientes', cl], ['Proyectos', pj], ['Tareas', tk], ['Equipo', pp]].filter((x) => x[1].length);
  }
  const markRead = () => run(async () => { for (const n of myNotifs.filter((x) => !x.read)) await db.doc('notifs/' + n.id).update({ read: true }); });
  const openNotif = (n) => {
    if (!n.read) db.doc('notifs/' + n.id).update({ read: true }).catch(() => {});
    if (n.task && tasks.some((t) => t.id === n.task && (isA || t.o === myId))) openTask(n.task); else set({ notif: false });
  };

  const navItems = NAV[role];
  const activeKey = ui.screen === 'cliente' ? 'clientes' : ui.screen === 'proyecto' ? 'proyectos' : ui.screen;
  const screens = { dash: Dash, esp: Esp, tareas: Tareas, cal: Cal, clientes: Clientes, cliente: Cliente, proyectos: Proyectos, proyecto: Proyecto, cfg: Cfg, ayuda: Ayuda };
  const scr = ui.screen || (isA ? 'dash' : 'esp');
  const Screen = (scr === 'dash' && !isA) ? Esp : (scr === 'esp' && isA) ? Dash : (screens[scr] || Denied);

  return html`<div className="app">
    <nav className="side" aria-label="Principal">
      <div className="brand"><${Logo} name=${studio} /><div style=${{ minWidth: 0 }}><b className="ell">${studio}</b><span>Gestión interna</span></div></div>
      ${navItems.map((it) => html`<button key=${it[0]} className="navb" aria-current=${activeKey === it[0] ? 'page' : null} onClick=${() => go(it[0])}><${Icon} d=${ICON[it[0]]} />${it[1]}${it[0] === 'tareas' && open.length > 0 && html`<span className="count">${open.length}</span>`}${it[0] === 'cfg' && requests.length > 0 && html`<span className="count" style=${{ background: 'var(--danger)', color: '#fff' }}>${requests.length}</span>`}</button>`)}
      <div className="me">
        <button className="mebtn" aria-haspopup="menu" aria-expanded=${ui.pmenu ? 'true' : 'false'} onClick=${() => set({ pmenu: !ui.pmenu })}>
          ${av(myId, 36)}<span className="who"><b className="ell">${myName}</b><span>${isA ? 'Administrador/a' : 'Empleado/a'}</span></span><${Icon} d=${ICON.chevup} s=${16} style=${{ color: 'var(--muted)', transform: ui.pmenu ? 'none' : 'rotate(180deg)' }} />
        </button>
        ${ui.pmenu && html`<button className="scrim" style=${{ background: 'transparent', zIndex: 48 }} aria-label="Cerrar menú de perfil" tabIndex="-1" onClick=${() => set({ pmenu: false })}></button>
        <div className="pmenu" role="menu" aria-label="Opciones de tu cuenta">
          <div className="pm-head"><b className="ell">${myName}</b><span className="ell">${account.email}</span></div>
          <button role="menuitem" onClick=${() => set({ pmenu: false, modal: 'profile', form: { kind: 'profile', first: me.first || '', last: me.last || '' } })}><${Icon} d=${ICON.esp} s=${17} />Mi perfil</button>
          <button role="menuitem" onClick=${() => set({ pmenu: false, modal: 'account', form: { cur: '', pw: '', pw2: '', err: '' } })}><${Icon} d=${ICON.key} s=${17} />Configuración de cuenta</button>
          ${wsList && wsList.length > 1 && html`<button role="menuitem" onClick=${() => { try { window.localStorage.removeItem('gestion-estudio:ws'); } catch (e) {} window.location.reload(); }}><${Icon} d=${ICON.clientes} s=${17} />Cambiar de estudio</button>`}
          <hr />
          <button role="menuitem" className="out" onClick=${requestLogout}><${Icon} d=${ICON.out} s=${17} />Cerrar sesión</button>
        </div>`}
      </div>
    </nav>
    <div className="main">
      <header className="top">
        <div className="search">
          <label htmlFor="gq" className="sr">Buscar en el estudio</label><${Icon} d=${ICON.search} s=${16} w=${2} />
          <input id="gq" value=${ui.gq} autoComplete="off" placeholder="Buscar clientes, proyectos, tareas…" onChange=${(e) => set({ gq: e.target.value, notif: false })} />
          ${g.length >= 2 && html`<div className="drop">${gres.map((grp) => html`<div key=${grp[0]}><h4>${grp[0]}</h4>${grp[1].map((r) => html`<button key=${r.k} onClick=${r.go}><b>${r.l}</b><span>${r.sub}</span></button>`)}</div>`)}
            ${!gres.length && html`<p className="muted" style=${{ padding: '12px 10px' }}>Sin resultados para “${ui.gq}”.</p>`}</div>`}
        </div>
        <div style=${{ flex: 1 }}></div>
        <div id="tour-bell" style=${{ position: 'relative', borderRadius: 12 }}>
          <button className="iconbtn" aria-label=${'Notificaciones' + (unread ? ', ' + unread + ' sin leer' : '')} onClick=${() => set({ notif: !ui.notif, gq: '' })}><${Icon} d=${ICON.bell} s=${19} />${unread > 0 && html`<span className="badge-dot">${unread > 9 ? '9+' : unread}</span>`}</button>
          ${ui.notif && html`<div className="notif">
            <header><b style=${{ fontSize: 15 }}>Notificaciones</b>${unread > 0 && html`<button className="link" onClick=${markRead}>Marcar todo como leído</button>`}</header>
            <div style=${{ maxHeight: 420, overflowY: 'auto' }}>
              ${reminders.length > 0 && html`<div className="sec">Vencimientos</div>${reminders.map((t) => { const dd = diff(t.due, TODAY); return html`<button key=${'r' + t.id} className="n" onClick=${() => openTask(t.id)}><span className="dot" style=${{ background: dd < 0 ? 'var(--danger)' : ST.rev.dot }}></span><span>${dd < 0 ? 'Tenés una tarea atrasada: ' : dd === 0 ? 'Tenés una tarea que vence hoy: ' : 'Tenés una tarea que vence mañana: '}<b>${t.n}</b> · ${cn(t)}.</span></button>`; })}<div className="sec">Novedades</div>`}
              ${myNotifs.slice(0, 20).map((n) => html`<button key=${n.id} className=${'n' + (n.read ? '' : ' unread')} onClick=${() => openNotif(n)}><span className="dot" style=${{ background: n.read ? 'transparent' : 'var(--accent)' }}></span><span><span style=${{ display: 'block', lineHeight: 1.45 }}>${n.x}</span><small className="muted">${rel(n.at)}</small></span></button>`)}
              ${!myNotifs.length && html`<p className="muted" style=${{ padding: 16 }}>No tenés notificaciones.</p>`}
            </div></div>`}
        </div>
      </header>
      <main className="content">${Screen()}</main>
    </div>
    <nav className="bnav" aria-label="Principal (móvil)">
      ${navItems.slice(0, 4).map((it) => html`<button key=${it[0]} aria-current=${activeKey === it[0] ? 'page' : null} onClick=${() => go(it[0])}><${Icon} d=${ICON[it[0]]} s=${20} />${it[1].replace('Mi ', '').replace('Mis ', '')}</button>`)}
      <button aria-current=${navItems.slice(4).some((it) => it[0] === activeKey) ? 'page' : null} onClick=${() => set({ sheet: true })}><${Icon} d=${ICON.more} s=${20} w=${3} />Más</button>
    </nav>
    ${ui.sheet && html`<button className="scrim" style=${{ zIndex: 75 }} aria-label="Cerrar menú" onClick=${() => set({ sheet: false })}></button><div className="sheet" role="dialog" aria-label="Más opciones">
      <div style=${{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 12px', borderBottom: '1px solid var(--line2)', marginBottom: 6 }}>${av(myId, 36)}<div style=${{ minWidth: 0 }}><b className="ell" style=${{ display: 'block' }}>${myName}</b><span className="muted" style=${{ fontSize: 12 }}>${isA ? 'Administrador/a' : 'Empleado/a'}</span></div></div>
      ${navItems.slice(4).map((it) => html`<button key=${it[0]} className="navb" style=${{ height: 48 }} aria-current=${activeKey === it[0] ? 'page' : null} onClick=${() => go(it[0])}><${Icon} d=${ICON[it[0]]} />${it[1]}</button>`)}
      <div style=${{ borderTop: '1px solid var(--line2)', marginTop: 6, paddingTop: 6 }}>
        <button className="navb" style=${{ height: 48 }} onClick=${() => set({ sheet: false, modal: 'profile', form: { kind: 'profile', first: me.first || '', last: me.last || '' } })}><${Icon} d=${ICON.esp} />Mi perfil</button>
        <button className="navb" style=${{ height: 48 }} onClick=${() => set({ sheet: false, modal: 'account', form: { cur: '', pw: '', pw2: '', err: '' } })}><${Icon} d=${ICON.key} />Configuración de cuenta</button>
        <button className="navb" style=${{ height: 48, color: 'var(--danger)' }} onClick=${requestLogout}><${Icon} d=${ICON.out} />Cerrar sesión</button>
      </div></div>`}
    ${ui.sel != null && Drawer()}
    ${ui.modal === 'form' && ui.form && FormModal()}
    ${ui.modal === 'member' && ui.form && MemberModal()}
    ${ui.modal === 'import' && ui.form && ImportModal()}
    ${ui.modal === 'profile' && ProfileModal()}
    ${ui.modal === 'account' && ui.form && AccountModal()}
    ${ui.confirmOut && ConfirmOut()}
    ${Tour()}
    ${toastEl}
  </div>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${Root} />`);
})();

