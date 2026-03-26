-- iOS Kit Supabase 初始化脚本

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- 项目表
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  bundle_id text,
  category text,
  description text,
  subtitle text,
  keywords text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 截图表
create table screenshots (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  original_url text not null,
  processed_urls jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 隐私政策表
create table privacy_policies (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  content text not null,
  public_slug text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 创建索引
create index projects_user_id_idx on projects(user_id);
create index screenshots_project_id_idx on screenshots(project_id);
create index privacy_policies_project_id_idx on privacy_policies(project_id);
create index privacy_policies_public_slug_idx on privacy_policies(public_slug);

-- 启用行级安全 (RLS)
alter table projects enable row level security;
alter table screenshots enable row level security;
alter table privacy_policies enable row level security;

-- 项目表 RLS 策略
create policy "用户只能查看自己的项目"
  on projects for select
  using (auth.uid() = user_id);

create policy "用户只能创建自己的项目"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "用户只能更新自己的项目"
  on projects for update
  using (auth.uid() = user_id);

create policy "用户只能删除自己的项目"
  on projects for delete
  using (auth.uid() = user_id);

-- 截图表 RLS 策略
create policy "用户只能查看自己项目的截图"
  on screenshots for select
  using (
    exists (
      select 1 from projects
      where projects.id = screenshots.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "用户只能创建自己项目的截图"
  on screenshots for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = screenshots.project_id
      and projects.user_id = auth.uid()
    )
  );

-- 隐私政策表 RLS 策略
create policy "用户只能查看自己项目的隐私政策"
  on privacy_policies for select
  using (
    exists (
      select 1 from projects
      where projects.id = privacy_policies.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "用户只能创建自己项目的隐私政策"
  on privacy_policies for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = privacy_policies.project_id
      and projects.user_id = auth.uid()
    )
  );

-- 隐私政策公开访问策略 (通过 public_slug)
create policy "任何人都可以通过 slug 查看隐私政策"
  on privacy_policies for select
  using (true);

-- 自动更新 updated_at 的函数
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 触发器
create trigger projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at_column();

-- Storage: 创建存储桶
-- 注意：这需要在 Supabase Dashboard 中手动创建，或者使用 Management API
-- 存储桶名称：screenshots, privacy-documents
