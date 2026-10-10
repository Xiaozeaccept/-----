-- ============================================================
-- 晨间自学室 · 后端数据库结构（Supabase / Postgres）
-- 在 Supabase 控制台 → SQL Editor → New query 里整段粘贴 → Run
-- ============================================================

-- 1) 用户资料表（对接 Supabase 自带 auth.users）
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz default now()
);

-- 2) 用户业务数据表：把站点的 mb.* 键值（课表/打卡/错词本/壁纸/便签/专注时长…）存到云端
create table if not exists public.user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

-- 3) 活动日志（管理员看用户动向）
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  action text,
  created_at timestamptz default now()
);

-- 4) 管理员名单表（把想当管理员的人 username 加进来）
create table if not exists public.admins (
  username text primary key,
  added_at timestamptz default now()
);
insert into public.admins (username) values ('accept')
on conflict (username) do nothing;

-- 5) 判断当前登录者是不是管理员（RLS 复用）
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.admins a where a.username = coalesce((
    select p.username from public.profiles p where p.id = auth.uid()), '')
  );
$$;

-- 6) 开启行级安全（RLS）并设好策略：数据默认隔离，每个用户只能看/改自己的
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "user_data all own" on public.user_data;
create policy "user_data all own" on public.user_data for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "activity own" on public.activity_log;
create policy "activity own" on public.activity_log for insert
  with check (user_id = auth.uid());

-- 7) 管理员专用视图：给管理员看所有用户和他们的数据（走 security definer，绕开行级隔离）
create or replace function public.admin_users()
returns table (
  id uuid, username text, created_at timestamptz,
  key text, value jsonb, updated_at timestamptz
) language sql security definer stable as $$
  select p.id, p.username, p.created_at, d.key, d.value, d.updated_at
  from public.profiles p
  left join public.user_data d on d.user_id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

-- 8) 注册自动建档：任何在站点/后台注册的 Supabase 用户，登录账号创建后自动在 profiles 生成一条记录，
--    这样「管理员后台」和「表编辑器」里立刻能看到新注册用户。
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 9) 把自己设为管理员：把 <你的邮箱> 换成你注册时用的邮箱，执行一次即可：
--    insert into public.admins (username) values ('<你的邮箱>') on conflict (username) do nothing;
