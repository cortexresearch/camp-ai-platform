-- Real, minimal schema for the live platform: signup, submit a build, vote,
-- and a public profile (with a portfolio of past work) for builders and judges.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table users add column if not exists role text not null default 'builder' check (role in ('builder', 'judge'));
alter table users add column if not exists handle text unique;

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  episode text not null default 'S1E5',
  title text not null,
  how_it_works text not null,
  models_used text not null,
  token_cost text not null default '',
  prompts_issues text not null,
  created_at timestamptz not null default now()
);

alter table builds add column if not exists demo_url text not null default '';
alter table builds add column if not exists repo_url text not null default '';
alter table builds add column if not exists screenshot_path text not null default '';
alter table builds add column if not exists html_demo_path text not null default '';

alter table users add column if not exists x_url text not null default '';
alter table users add column if not exists github_url text not null default '';
alter table users add column if not exists website_url text not null default '';
alter table users add column if not exists is_admin boolean not null default false;
alter table users add column if not exists avatar_path text not null default '';

create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  theme text not null,
  status text not null default 'upcoming' check (status in ('complete', 'live', 'upcoming')),
  x_spaces_url text not null default '',
  created_at timestamptz not null default now()
);

insert into episodes (number, theme, status) values
  (1, 'Calculator', 'complete'),
  (2, 'Frequency', 'complete'),
  (3, 'Augmented Reality', 'complete'),
  (4, 'Game', 'complete'),
  (5, 'Media Editor + AI + Metadata', 'complete'),
  (6, 'Media Editor 2 + AI + Metadata', 'complete'),
  (7, 'Calendar', 'complete'),
  (8, 'Coding Collaboration Platform + AI + Contribution Tracking', 'upcoming')
on conflict (number) do nothing;

update users set is_admin = true where email = 'nftmansa@gmail.com';

-- votes is deprecated (superseded by ratings below) and unused by the app.
-- Left in place rather than dropped since it's empty and harmless.
create table if not exists votes (
  build_id uuid not null references builds(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);

create table if not exists ratings (
  build_id uuid not null references builds(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);
-- `category` is added via alter table below (kept separate so existing rows
-- backfill cleanly); primary key is widened to (build_id, user_id, category).

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists ratings_build_idx on ratings(build_id);
create index if not exists comments_build_idx on comments(build_id);

create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  url text not null default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists builds_episode_idx on builds(episode);
create index if not exists sessions_user_idx on sessions(user_id);
create index if not exists portfolio_items_user_idx on portfolio_items(user_id);

create table if not exists partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  website_url text not null default '',
  interest text not null default 'other' check (interest in ('sponsorship', 'prizes', 'tool-placement', 'other')),
  message text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists partner_inquiries_status_idx on partner_inquiries(status);

create table if not exists password_resets (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists password_resets_user_idx on password_resets(user_id);

-- Ratings split into three 1-5 categories (name, pitch, product) so a build can
-- earn up to 15 points from a single rater instead of 5. Pre-existing rows (from
-- when ratings were a single score) are backfilled as "product" ratings.
alter table ratings add column if not exists category text not null default 'product' check (category in ('name', 'pitch', 'product'));
alter table ratings drop constraint if exists ratings_pkey;
alter table ratings add primary key (build_id, user_id, category);

-- Builds are auto-mirrored into portfolio_items on submit/edit/delete so a
-- builder's shipped work shows up in "Previous work" without manual re-entry.
alter table portfolio_items add column if not exists build_id uuid references builds(id) on delete cascade;
create unique index if not exists portfolio_items_build_idx on portfolio_items(build_id) where build_id is not null;

-- Longer-form "what to build" guidance per episode, separate from the short
-- `theme` label — intentionally NOT a literal prompt to copy, just direction.
alter table episodes add column if not exists brief text not null default '';

-- Self-reported by the builder at submit time; null means "not indicated"
-- (most pre-existing builds), not "confirmed not mobile friendly".
alter table builds add column if not exists mobile_friendly boolean;

-- Scheduled go-live time. There's no background job in this app, so status
-- isn't flipped by a timer — getEpisodes() computes an effective 'live'
-- status on every read once now() passes live_at, for an 'upcoming' episode.
alter table episodes add column if not exists live_at timestamptz;

-- Fourth rating category: UI, alongside name/pitch/product (now up to 20
-- points per build from a single rater instead of 15).
alter table ratings drop constraint if exists ratings_category_check;
alter table ratings add constraint ratings_category_check check (category = any (array['name', 'pitch', 'product', 'ui']));
