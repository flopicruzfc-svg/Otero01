# Gestión interna del estudio

App de gestión interna para estudios contables: clientes, proyectos, tareas, calendario y equipo.
Es multiusuario, con datos centralizados en **Supabase**: cada estudio es un espacio aislado y cada persona entra desde cualquier computadora.

- Frontend: React 18 + htm, sin paso de compilación (`index.html`, `css/`, `js/`).
- Backend: Supabase (Auth, PostgreSQL con Row Level Security, Realtime, Storage, Edge Functions).
- Correos de invitación: Resend, enviados desde el servidor.

---

## 1. Análisis de la versión anterior

| Qué | Dónde estaba | Qué pasa ahora |
|---|---|---|
| Clientes, proyectos, tareas, comentarios, actividad, notificaciones, equipo, nombre del estudio | `localStorage` del navegador (`gestion-estudio:v1`, luego `gestion-estudio:estudio:<id>`) | Tablas en PostgreSQL |
| Usuarios, contraseñas, sesiones, invitaciones | `localStorage` (`gestion-estudio:directorio`) | Supabase Auth + tabla `invitations` |
| Archivos adjuntos | IndexedDB del navegador | Supabase Storage (bucket privado `adjuntos`) |
| Tutorial visto | documento local por usuario | Columna `profiles.tour_seen` |

**Componentes que dependían del almacenamiento local.** Todas las pantallas leían y escribían a través de una sola capa (`db.doc` / `db.collection`), y el ingreso pasaba por `LOCAL.auth`.
- La capa de datos ahora traduce esas llamadas a tablas de Supabase. Por eso las pantallas, la navegación y los estilos no cambiaron.
- El ingreso y las invitaciones se reescribieron sobre Supabase Auth y Edge Functions.

**Qué queda en el navegador, y por qué:**
- La sesión de Supabase Auth: la guarda la librería oficial y es necesaria para mantenerte conectado.
- El último estudio elegido, si pertenecés a más de uno (preferencia de interfaz).
- Un aviso temporal entre pantallas, como «Cerraste sesión» (`sessionStorage`).
- Los datos de la versión anterior: solo se leen para importarlos (ver punto 8) y se borran únicamente si lo pedís.

Ningún dato del estudio se guarda en el navegador.

---

## 2. Tablas y relaciones

Archivo: `supabase/migrations/20261008120000_esquema_inicial.sql`

```
auth.users (Supabase Auth: correo y contraseña cifrada)
   │ 1:1
profiles ─────────────── nombre, apellido, correo, tutorial visto
   │
   │ N:M a través de memberships (rol admin | empleado, estado activa | inactiva)
   ▼
workspaces (estudios) ── owner_id → auth.users
   │
   ├── invitations   correo, rol, hash del token, estado (pendiente | aceptada | vencida | cancelada), vencimiento, invitado por
   ├── clients       responsable → miembro del estudio
   │     └── projects    cliente (mismo estudio), responsable, fechas, prioridad
   │           └── tasks     proyecto y cliente (mismo estudio), responsable, creador, estado, prioridad, fechas, adjuntos
   │                 ├── task_comments   autor, texto
   │                 └── task_history    quién, qué cambió
   ├── activity      actividad reciente del estudio
   └── notifications destinatario, tarea, leída
```

- **Integridad:** las relaciones usan claves compuestas `(workspace_id, id)`. Así una tarea no puede apuntar a un proyecto, cliente o responsable de otro estudio.
- **Borrado:** no se puede borrar un cliente que tiene proyectos, ni un proyecto que tiene tareas (igual que antes en la app).
- **Estados de tarea:** `sin_comenzar`, `en_curso`, `en_revision`, `terminado`.
- **Prioridades:** `baja`, `media`, `alta`, `urgente`.
- **Estado del proyecto:** se sigue calculando a partir de sus tareas, como antes: «En curso», «Con atrasos» o «Terminado».

---

## 3. Seguridad (Row Level Security)

Todas las tablas tienen RLS activado. La base aplica las reglas aunque alguien use la clave pública desde fuera de la app:

- Solo ves datos de los estudios en los que tenés una membresía **activa**.
- **Administrador:** ve y modifica todo su estudio.
- **Empleado:**
  - Ve solo sus tareas, y los clientes y proyectos vinculados a ellas.
  - Puede cambiar el estado, la descripción, los comentarios y los adjuntos de sus tareas.
  - No puede crear ni eliminar tareas, ni cambiar responsable, cliente, proyecto, nombre, fechas o prioridad (lo impide un trigger).
- **Invitaciones:** solo las ve el administrador. Se crean y se aceptan únicamente desde las funciones del servidor.
- **Protección del estudio:** el propietario no puede perder el rol de administrador, y siempre queda al menos uno.
- **Desactivar a alguien:** deja de ver los datos al instante; sus tareas y su historial se conservan.
- **Adjuntos:** las reglas de Storage usan la ruta `estudio/tarea/archivo`, así que solo los ve quien ve la tarea.

---

## 4. Autenticación

- **Registrar:** pide nombre del estudio, nombre, apellido, correo, contraseña y repetirla. Crea el usuario en Supabase Auth, después el estudio y la membresía de administrador (función `create_workspace`), y te lleva al estudio.
  - Si en Supabase está activada la confirmación de correo, primero llega un correo para confirmar. El estudio se crea al ingresar por primera vez.
- **Ingresar:** correo y contraseña.
- **Recuperar contraseña:** «¿Olvidaste tu contraseña?» envía el correo de Supabase. El enlace abre la pantalla «Creá tu contraseña nueva».
- **Cerrar sesión:** está en el menú del usuario (abajo en el menú lateral; en el celular, dentro de «Más»).
  - Ejecuta el `signOut` de Supabase solo para este dispositivo y borra la sesión local.
  - Recarga sin dejar historial y lleva a la pantalla de ingreso.
  - Si hay cambios sin guardar, primero avisa.
- **Pantallas privadas:** sin sesión válida no se carga ninguna.
  - La sesión se verifica al abrir la app, al volver a la pestaña, cada minuto y cuando se cierra sesión en otra pestaña.
  - Si el navegador restaura la página desde su caché al tocar «Atrás», se recarga y vuelve a verificar.
- **Contraseñas:** las guarda solo Supabase Auth, cifradas. La app y las tablas nunca las ven ni las almacenan.

---

## 5. Invitaciones

1. En **Configuración › Equipo › Invitar integrante**, el administrador escribe el correo y elige el rol.
2. La app llama a la Edge Function **`send-invitation`**, que:
   - verifica que quien invita sea administrador activo de ese estudio;
   - cancela una invitación pendiente anterior para el mismo correo;
   - genera un token aleatorio de 256 bits y guarda en la base solo su hash SHA-256;
   - envía el correo con Resend.
3. Si el correo no sale, la invitación se cancela y la app muestra el error real. Solo dice «Invitación enviada» cuando Resend aceptó el envío.
4. El enlace es `APP_URL#invitacion=<token>`. Funciona en cualquier computadora y vence a los 14 días.
5. Al abrirlo:
   - se valida el token con `get_invitation`;
   - se muestran el estudio, el correo (que no se puede cambiar) y quién invitó;
   - la persona escribe nombre, apellido y su contraseña.
6. La Edge Function **`accept-invitation`**:
   - crea el usuario en Supabase Auth con ese mismo correo, que queda confirmado porque lo recibió;
   - crea la membresía y marca la invitación como «aceptada».
   Después la app inicia sesión y entra directo al estudio.
7. Si la persona ya tenía usuario (por ejemplo, en otro estudio), ingresa con su contraseña y acepta desde su sesión. El correo tiene que coincidir con el de la invitación.

Desde Equipo, el administrador ve las invitaciones pendientes y puede **reenviarlas** o **cancelarlas**.

---

## 6. Correos

| Correo | Lo envía | Configuración |
|---|---|---|
| Invitación | Edge Function `send-invitation` con **Resend** | `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` como secretos de las funciones |
| Confirmación de cuenta y recuperación de contraseña | **Supabase Auth** | Supabase › Authentication › Emails |

Si falta alguna variable, la app muestra cuáles son y no envía nada.

**Recomendado:** usá Resend también para los correos de Supabase Auth, en Authentication › Emails › SMTP Settings (host `smtp.resend.com`, puerto 465, usuario `resend`, contraseña = tu API key). El servicio de correo incluido en Supabase tiene un límite muy bajo de envíos por hora.

---

## 7. Sincronización

- Cada pantalla se suscribe a **Supabase Realtime**: tareas, historial, proyectos, clientes, equipo, invitaciones, actividad y notificaciones del estudio.
- Ante cualquier cambio de otra persona, se vuelve a leer lo afectado y la pantalla se actualiza sola, sin recargar.
- Las reglas de seguridad también filtran lo que llega por Realtime.
- Como red de seguridad, se relee todo al volver a la pestaña, al recuperar la conexión y cada 2 minutos.

**Ediciones simultáneas:**
- Cada cambio guarda **solo los campos modificados**. Si dos personas cambian campos distintos de la misma tarea (por ejemplo, Florencia el estado y el administrador la fecha), se conservan ambos cambios.
- Si cambian **el mismo campo**, queda el último que se guardó, y el historial de la tarea registra los dos cambios con su autor.
- Los cambios de otros aparecen en pantalla en uno o dos segundos.
- Las acciones que la base rechaza (por ejemplo, borrar un proyecto que tiene tareas) muestran un aviso y no se aplican.

---

## 8. Migración de tus datos actuales

Los datos que la versión anterior guardó en el navegador **no se borran ni se pierden**:

1. Registrá el estudio en la versión nueva (o ingresá como administrador).
2. Invitá al equipo y esperá a que acepte. Así podés asignarle sus tareas en la importación.
3. En la computadora donde estaban los datos, entrá a **Configuración**. Aparece «Datos de la versión anterior en este navegador».
4. Tocá **Importar** y elegí a qué integrante actual corresponde cada persona de la versión anterior.
5. Se copian clientes, proyectos, tareas, historial, comentarios y adjuntos.
   - Los comentarios quedan a tu nombre, con el autor original entre corchetes.
   - Las tareas de quien todavía no aceptó la invitación quedan a tu nombre, para reasignarlas después.
6. La copia local queda intacta. Al terminar podés borrarla con «Borrar la copia local».

---

## 9. Variables de entorno

Plantilla: `.env.example`.

| Variable | Dónde va | Para qué |
|---|---|---|
| `SUPABASE_URL` | `.env` → `js/config.js` | Dirección del proyecto (Project Settings › API) |
| `SUPABASE_ANON_KEY` | `.env` → `js/config.js` | Clave pública «anon». Es segura en el navegador porque RLS protege los datos |
| `APP_URL` | `.env` y secretos de las funciones | Dirección pública de la app; se usa en los enlaces de los correos |
| `RESEND_API_KEY` | Solo secretos de las funciones | Enviar correos |
| `EMAIL_FROM` | Solo secretos de las funciones | Remitente; el dominio tiene que estar verificado en Resend |
| `SUPABASE_SERVICE_ROLE_KEY` | Automática en las funciones | No la cargues en ningún archivo del frontend |

`node scripts/generar-config.mjs` crea `js/config.js` solo con los valores públicos. Si por error pegás la service_role key, se niega a generarlo. `.env` y `js/config.js` están en `.gitignore`.

---

## 10. Puesta en marcha (lo que tenés que hacer vos)

1. **Supabase:** creá un proyecto en <https://supabase.com>. Es gratis para empezar.
2. **Base de datos:** en Supabase › SQL Editor, pegá y ejecutá `supabase/migrations/20261008120000_esquema_inicial.sql`. Crea tablas, reglas, funciones, el bucket `adjuntos` y activa Realtime.
3. **Auth › URL Configuration:**
   - poné tu `APP_URL` como **Site URL**;
   - agregala en **Redirect URLs**, y también `http://localhost:8000/` para probar.
4. **Auth › Providers › Email:** decidí si querés confirmación de correo al registrarse. La app funciona de las dos formas.
5. **Resend:** creá una cuenta en <https://resend.com>, verificá tu dominio en Domains (agregando los registros DNS que indica) y creá una API key.
6. **Edge Functions**, con la CLI de Supabase:
   ```bash
   npm i -g supabase            # o: brew install supabase/tap/supabase
   supabase login
   supabase link --project-ref TU-PROYECTO
   supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="Tu Estudio <invitaciones@tudominio.com.uy>" APP_URL=https://tu-app/
   supabase functions deploy send-invitation
   supabase functions deploy accept-invitation --no-verify-jwt
   ```
   `accept-invitation` usa `--no-verify-jwt` porque la persona todavía no tiene sesión. La autoriza el token de un solo uso, que se valida en la base.
7. **Frontend:**
   ```bash
   cp .env.example .env           # completá SUPABASE_URL, SUPABASE_ANON_KEY y APP_URL
   node scripts/generar-config.mjs
   python3 -m http.server 8000    # probar en http://localhost:8000
   ```
8. **Publicar:** subí la carpeta a un hosting estático (Netlify, Vercel, Cloudflare Pages). Cargá las mismas variables públicas en el hosting y usá como comando de build `node scripts/generar-config.mjs`.
9. **Probar los 7 casos** con dos navegadores o computadoras distintas: registrar, invitar, aceptar desde la otra, crear y asignar una tarea, cambiar su estado, cerrar sesión, e intentar ver datos de otro estudio.

---

## 11. Pruebas realizadas

Se probaron con el código real, sin el proyecto real de Supabase ni Resend:

- **Esquema y seguridad:** la migración real en PostgreSQL 16, con usuarios simulados (33 verificaciones). Incluye aislamiento entre estudios, permisos de empleado, tokens de invitación de un solo uso y que el correo de la cuenta coincida con el de la invitación.
- **De punta a punta:** la app completa en dos «computadoras» separadas contra esa base, con las Edge Functions reales y el envío a Resend simulado (36 verificaciones). Cubre los casos 1 a 7, la falta de variables, el rechazo de Resend y la recuperación de contraseña.
- **Funciones de servidor** (9 verificaciones) e **importación de datos** de la versión anterior (8 verificaciones).

Pendiente de verificar en tu proyecto real: el envío efectivo con tu dominio en Resend y los correos de Supabase Auth. Dependen de tus cuentas y no se pueden probar sin ellas.
