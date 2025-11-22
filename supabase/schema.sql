create table public.users (
  id uuid not null,
  email character varying(255) not null,
  password_hash character varying(255) null default ''::character varying,
  subscription_tier character varying(20) null default 'free'::character varying,
  audit_limit integer null default 10,
  audits_this_month integer null default 0,
  last_audit_reset date null default CURRENT_DATE,
  subscription_expires timestamp without time zone null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  name character varying(255) null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint users_subscription_tier_check check (
    (
      (subscription_tier)::text = any (
        (
          array[
            'free'::character varying,
            'pro'::character varying,
            'max'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_subscription on public.users using btree (subscription_tier, subscription_expires) TABLESPACE pg_default;

create index IF not exists idx_users_audit_reset on public.users using btree (last_audit_reset) TABLESPACE pg_default;

create index IF not exists idx_users_name on public.users using btree (name) TABLESPACE pg_default;

create trigger set_audit_limit_on_tier_change BEFORE INSERT
or
update OF subscription_tier on users for EACH row
execute FUNCTION set_audit_limit_for_tier ();

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create table public.usage_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  action character varying(50) not null,
  metadata jsonb null,
  created_at timestamp without time zone not null default now(),
  constraint usage_logs_pkey primary key (id),
  constraint usage_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_usage_logs_user_id on public.usage_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_usage_logs_created_at on public.usage_logs using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_usage_logs_action on public.usage_logs using btree (action) TABLESPACE pg_default;

create table public.usage_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  action character varying(50) not null,
  metadata jsonb null,
  created_at timestamp without time zone not null default now(),
  constraint usage_logs_pkey primary key (id),
  constraint usage_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_usage_logs_user_id on public.usage_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_usage_logs_created_at on public.usage_logs using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_usage_logs_action on public.usage_logs using btree (action) TABLESPACE pg_default;