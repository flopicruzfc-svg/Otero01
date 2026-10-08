-- ============================================================================
-- Gestión del estudio · esquema inicial
-- Multiusuario con estudios (workspaces) aislados por Row Level Security.
-- Ejecutar una sola vez: Supabase › SQL Editor, o `supabase db push`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------------

-- Perfil de cada usuario de Supabase Auth (la contraseña la guarda Supabase Auth, nunca esta tabla).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  first_name  text not null default '',
  last_name   text not null default '',
  tour_seen   boolean not null default false,          -- tutorial visto (preferencia por usuario)
  created_at  timestamptz not null default now()
);

create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 1 and 120),
  owner_id    uuid not null references auth.users (id),
  created_at  timestamptz not null default now()
);

create table public.memberships (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          text not null check (role in ('admin', 'empleado')),
  status        text not null default 'activa' check (status in ('activa', 'inactiva')),
  joined_at     timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email        text not null check (email = lower(trim(email)) and email like '%@%'),
  role         text not null default 'empleado' check (role in ('admin', 'empleado')),
  token_hash   text not null unique,                  -- SHA-256 del token; el token en claro solo viaja en el correo
  status       text not null default 'pendiente' check (status in ('pendiente', 'aceptada', 'vencida', 'cancelada')),
  invited_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '14 days',
  accepted_at  timestamptz,
  accepted_by  uuid references auth.users (id) on delete set null
);
create unique index invitations_una_pendiente on public.invitations (workspace_id, email) where status = 'pendiente';

create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  name            text not null check (length(trim(name)) > 0),
  rut             text not null default '',
  contact_name    text not null default '',
  phone           text not null default '',
  email           text not null default '',
  address         text not null default '',
  responsible_id  uuid,
  status          text not null default 'Activo' check (status in ('Activo', 'En alta', 'En clausura', 'Inactivo')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, responsible_id) references public.memberships (workspace_id, user_id)
);

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  client_id       uuid not null,
  name            text not null check (length(trim(name)) > 0),
  description     text not null default '',
  responsible_id  uuid,
  start_date      date,
  due_date        date,
  priority        text not null default 'media' check (priority in ('baja', 'media', 'alta', 'urgente')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, client_id) references public.clients (workspace_id, id),          -- no se borra un cliente con proyectos
  foreign key (workspace_id, responsible_id) references public.memberships (workspace_id, user_id)
);

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null,
  client_id     uuid not null,
  name          text not null check (length(trim(name)) > 0),
  description   text not null default '',
  assignee_id   uuid not null,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  status        text not null default 'sin_comenzar' check (status in ('sin_comenzar', 'en_curso', 'en_revision', 'terminado')),
  priority      text not null default 'media' check (priority in ('baja', 'media', 'alta', 'urgente')),
  start_date    date,
  due_date      date,
  files         jsonb not null default '[]'::jsonb,    -- [{id: ruta en Storage, name, at, by}]
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (workspace_id, project_id) references public.projects (workspace_id, id),        -- no se borra un proyecto con tareas
  foreign key (workspace_id, client_id) references public.clients (workspace_id, id),
  foreign key (workspace_id, assignee_id) references public.memberships (workspace_id, user_id)
);

create table public.task_comments (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  task_id       uuid not null references public.tasks (id) on delete cascade,
  author_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body          text not null check (length(trim(body)) > 0),
  created_at    timestamptz not null default now()
);

create table public.task_history (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  task_id       uuid not null references public.tasks (id) on delete cascade,
  actor_id      uuid default auth.uid() references auth.users (id) on delete set null,
  message       text not null,
  created_at    timestamptz not null default now()
);

create table public.activity (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  actor_id      uuid default auth.uid() references auth.users (id) on delete set null,
  message       text not null,
  client_id     uuid references public.clients (id) on delete set null,
  task_id       uuid references public.tasks (id) on delete set null,
  kind          text not null default '',
  created_at    timestamptz not null default now()
);

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  recipient_id  uuid not null references auth.users (id) on delete cascade,
  task_id       uuid references public.tasks (id) on delete set null,
  message       text not null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index on public.memberships (user_id);
create index on public.tasks (workspace_id, assignee_id);
create index on public.tasks (project_id);
create index on public.projects (client_id);
create index on public.task_comments (task_id);
create index on public.task_history (task_id);
create index on public.activity (workspace_id, created_at desc);
create index on public.notifications (recipient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Funciones de permisos (security definer: evitan recursión entre políticas)
-- ---------------------------------------------------------------------------

create or replace function public.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.workspace_id = ws and m.user_id = auth.uid() and m.status = 'activa');
$$;

create or replace function public.is_admin(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.workspace_id = ws and m.user_id = auth.uid() and m.status = 'activa' and m.role = 'admin');
$$;

create or replace function public.can_see_task(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tasks x
    where x.id = t and (public.is_admin(x.workspace_id) or (x.assignee_id = auth.uid() and public.is_member(x.workspace_id)))
  );
$$;

-- Un empleado ve solo los clientes y proyectos vinculados a sus tareas o de los que es responsable.
-- (Las políticas usan las columnas de la propia fila para que el alta con "returning" funcione.)
create or replace function public.emp_linked_client(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tasks t where t.client_id = c and t.assignee_id = auth.uid())
      or exists (select 1 from projects p where p.client_id = c and p.responsible_id = auth.uid());
$$;

create or replace function public.emp_linked_project(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tasks t where t.project_id = p and t.assignee_id = auth.uid());
$$;

create or replace function public.shares_workspace(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships a join memberships b on a.workspace_id = b.workspace_id
    where a.user_id = auth.uid() and a.status = 'activa' and b.user_id = other
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger clients_touch before update on public.clients for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

-- Perfil automático al crear un usuario en Supabase Auth.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, first_name, last_name)
  values (new.id, lower(new.email),
          coalesce(new.raw_user_meta_data ->> 'first_name', ''),
          coalesce(new.raw_user_meta_data ->> 'last_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set email = lower(new.email) where id = new.id;
  return new;
end $$;
create trigger on_auth_user_email after update of email on auth.users for each row execute function public.handle_user_email_change();

-- Un empleado puede editar sus tareas, pero no el responsable, el cliente, el proyecto, el nombre, las fechas ni la prioridad.
create or replace function public.guard_task_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin(old.workspace_id) then return new; end if;
  if new.workspace_id is distinct from old.workspace_id
     or new.assignee_id is distinct from old.assignee_id
     or new.client_id is distinct from old.client_id
     or new.project_id is distinct from old.project_id
     or new.name is distinct from old.name
     or new.start_date is distinct from old.start_date
     or new.due_date is distinct from old.due_date
     or new.priority is distinct from old.priority
     or new.created_by is distinct from old.created_by then
    raise exception 'Solo un administrador puede cambiar ese dato de la tarea.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger tasks_guard before update on public.tasks for each row execute function public.guard_task_update();

-- Comentarios e historial heredan el estudio de su tarea (el cliente no puede elegirlo).
create or replace function public.set_ws_from_task() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select workspace_id into new.workspace_id from tasks where id = new.task_id;
  return new;
end $$;
create trigger comments_ws before insert on public.task_comments for each row execute function public.set_ws_from_task();
create trigger history_ws before insert on public.task_history for each row execute function public.set_ws_from_task();

-- Siempre queda al menos un administrador activo, y el propietario no puede perder ese rol.
create or replace function public.guard_membership() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.workspace_id <> old.workspace_id or new.user_id <> old.user_id) then
    raise exception 'No se puede mover una membresía.' using errcode = '42501';
  end if;
  if exists (select 1 from workspaces w where w.id = old.workspace_id and w.owner_id = old.user_id)
     and (tg_op = 'DELETE' or new.role <> 'admin' or new.status <> 'activa') then
    raise exception 'El propietario del estudio siempre es administrador.' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger memberships_guard before update or delete on public.memberships for each row execute function public.guard_membership();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles      enable row level security;
alter table public.workspaces    enable row level security;
alter table public.memberships   enable row level security;
alter table public.invitations   enable row level security;
alter table public.clients       enable row level security;
alter table public.projects      enable row level security;
alter table public.tasks         enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_history  enable row level security;
alter table public.activity      enable row level security;
alter table public.notifications enable row level security;

-- perfiles
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.shares_workspace(id));
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- estudios (se crean con la función create_workspace)
create policy workspaces_select on public.workspaces for select to authenticated using (public.is_member(id));
create policy workspaces_update on public.workspaces for update to authenticated using (public.is_admin(id)) with check (public.is_admin(id));

-- membresías (se crean al registrarse o al aceptar una invitación)
create policy memberships_select on public.memberships for select to authenticated using (public.is_member(workspace_id) or user_id = auth.uid());
create policy memberships_update on public.memberships for update to authenticated using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));

-- invitaciones: solo administradores del estudio (el alta la hace la función send-invitation)
create policy invitations_select on public.invitations for select to authenticated using (public.is_admin(workspace_id));
create policy invitations_update on public.invitations for update to authenticated using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));

-- clientes
create policy clients_select on public.clients for select to authenticated using (
  public.is_admin(workspace_id) or (public.is_member(workspace_id) and (responsible_id = auth.uid() or public.emp_linked_client(id))));
create policy clients_insert on public.clients for insert to authenticated with check (public.is_admin(workspace_id));
create policy clients_update on public.clients for update to authenticated using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
create policy clients_delete on public.clients for delete to authenticated using (public.is_admin(workspace_id));

-- proyectos
create policy projects_select on public.projects for select to authenticated using (
  public.is_admin(workspace_id) or (public.is_member(workspace_id) and (responsible_id = auth.uid() or public.emp_linked_project(id))));
create policy projects_insert on public.projects for insert to authenticated with check (public.is_admin(workspace_id));
create policy projects_update on public.projects for update to authenticated using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
create policy projects_delete on public.projects for delete to authenticated using (public.is_admin(workspace_id));

-- tareas: el empleado ve y edita solo las suyas; crear y eliminar es de administradores
create policy tasks_select on public.tasks for select to authenticated
  using (public.is_admin(workspace_id) or (assignee_id = auth.uid() and public.is_member(workspace_id)));
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_admin(workspace_id));
create policy tasks_update on public.tasks for update to authenticated
  using (public.is_admin(workspace_id) or (assignee_id = auth.uid() and public.is_member(workspace_id)))
  with check (public.is_admin(workspace_id) or (assignee_id = auth.uid() and public.is_member(workspace_id)));
create policy tasks_delete on public.tasks for delete to authenticated using (public.is_admin(workspace_id));

-- comentarios e historial
create policy comments_select on public.task_comments for select to authenticated using (public.can_see_task(task_id));
create policy comments_insert on public.task_comments for insert to authenticated with check (author_id = auth.uid() and public.can_see_task(task_id));
create policy history_select on public.task_history for select to authenticated using (public.can_see_task(task_id));
create policy history_insert on public.task_history for insert to authenticated with check (actor_id = auth.uid() and public.can_see_task(task_id));

-- actividad: el administrador ve todo; el empleado, lo suyo y lo de sus tareas
create policy activity_select on public.activity for select to authenticated
  using (public.is_admin(workspace_id) or (public.is_member(workspace_id) and (actor_id = auth.uid() or (task_id is not null and public.can_see_task(task_id)))));
create policy activity_insert on public.activity for insert to authenticated with check (actor_id = auth.uid() and public.is_member(workspace_id));

-- notificaciones: cada uno ve las suyas; se pueden enviar a integrantes del mismo estudio
create policy notifications_select on public.notifications for select to authenticated using (recipient_id = auth.uid() and public.is_member(workspace_id));
create policy notifications_update on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated using (recipient_id = auth.uid());
create policy notifications_insert on public.notifications for insert to authenticated with check (
  public.is_member(workspace_id)
  and exists (select 1 from public.memberships m where m.workspace_id = notifications.workspace_id and m.user_id = recipient_id and m.status = 'activa')
);

-- Privilegios: nada para usuarios anónimos; RLS decide para los autenticados.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, delete on public.workspaces, public.memberships, public.invitations from authenticated;
revoke delete on public.profiles from authenticated;

-- ---------------------------------------------------------------------------
-- 5. Funciones de negocio (RPC)
-- ---------------------------------------------------------------------------

-- Registro: crea el estudio y la membresía de administrador del usuario actual.
create or replace function public.create_workspace(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  if auth.uid() is null then raise exception 'Necesitás iniciar sesión.' using errcode = '42501'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Falta el nombre del estudio.' using errcode = '22023'; end if;
  insert into workspaces (name, owner_id) values (trim(p_name), auth.uid()) returning id into ws;
  insert into memberships (workspace_id, user_id, role) values (ws, auth.uid(), 'admin');
  return ws;
end $$;
revoke execute on function public.create_workspace(text) from public, anon;
grant execute on function public.create_workspace(text) to authenticated;

-- Datos públicos de una invitación a partir del token (para la pantalla "Aceptar invitación").
create or replace function public.get_invitation(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare inv invitations; ws_name text; inviter text;
begin
  select * into inv from invitations where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  if not found then return jsonb_build_object('status', 'invalida'); end if;
  if inv.status = 'pendiente' and inv.expires_at < now() then
    update invitations set status = 'vencida' where id = inv.id;
    inv.status := 'vencida';
  end if;
  select name into ws_name from workspaces where id = inv.workspace_id;
  select trim(first_name || ' ' || last_name) into inviter from profiles where id = inv.invited_by;
  return jsonb_build_object('status', inv.status, 'workspace_name', ws_name, 'email', inv.email, 'role', inv.role,
                            'invited_by_name', coalesce(inviter, ''), 'expires_at', inv.expires_at);
end $$;
revoke execute on function public.get_invitation(text) from public;
grant execute on function public.get_invitation(text) to anon, authenticated;

-- Núcleo de la aceptación: valida token, vigencia y correo; crea la membresía y marca la invitación.
create or replace function public.accept_invitation_for(p_token text, p_user uuid, p_email text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv invitations;
begin
  select * into inv from invitations
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') for update;
  if not found then raise exception 'invitacion_invalida' using errcode = 'P0001'; end if;
  if inv.status <> 'pendiente' then raise exception 'invitacion_%', inv.status using errcode = 'P0001'; end if;
  if inv.expires_at < now() then
    update invitations set status = 'vencida' where id = inv.id;
    raise exception 'invitacion_vencida' using errcode = 'P0001';
  end if;
  if lower(trim(p_email)) <> inv.email then raise exception 'invitacion_otro_correo' using errcode = 'P0001'; end if;
  insert into memberships (workspace_id, user_id, role) values (inv.workspace_id, p_user, inv.role)
  on conflict (workspace_id, user_id) do update set status = 'activa', role = excluded.role;
  update invitations set status = 'aceptada', accepted_at = now(), accepted_by = p_user where id = inv.id;
  return inv.workspace_id;
end $$;
revoke execute on function public.accept_invitation_for(text, uuid, text) from public, anon, authenticated;
grant execute on function public.accept_invitation_for(text, uuid, text) to service_role;

-- Aceptación por alguien que ya tiene usuario (por ejemplo, ya trabaja en otro estudio).
create or replace function public.accept_invitation(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Necesitás iniciar sesión.' using errcode = '42501'; end if;
  return public.accept_invitation_for(p_token, auth.uid(), (select email from profiles where id = auth.uid()));
end $$;
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Archivos adjuntos (Supabase Storage) y Realtime
--    Se aplican solo si existen (en Supabase siempre existen).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('adjuntos', 'adjuntos', false) on conflict (id) do nothing;
    -- ruta de cada archivo: <workspace_id>/<task_id>/<archivo>
    execute $p$create policy adjuntos_select on storage.objects for select to authenticated using (
      bucket_id = 'adjuntos' and public.can_see_task(nullif(split_part(name, '/', 2), '')::uuid)
      and (select workspace_id::text from public.tasks where id = nullif(split_part(name, '/', 2), '')::uuid) = split_part(name, '/', 1))$p$;
    execute $p$create policy adjuntos_insert on storage.objects for insert to authenticated with check (
      bucket_id = 'adjuntos' and public.can_see_task(nullif(split_part(name, '/', 2), '')::uuid)
      and (select workspace_id::text from public.tasks where id = nullif(split_part(name, '/', 2), '')::uuid) = split_part(name, '/', 1))$p$;
    execute $p$create policy adjuntos_delete on storage.objects for delete to authenticated using (
      bucket_id = 'adjuntos' and public.is_admin(nullif(split_part(name, '/', 1), '')::uuid))$p$;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.workspaces, public.memberships, public.clients, public.projects,
      public.tasks, public.task_comments, public.task_history, public.activity, public.notifications, public.profiles, public.invitations;
  end if;
end $$;
