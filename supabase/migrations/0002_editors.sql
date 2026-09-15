-- Editors allowed into the studio. Login is a Supabase magic link; the
-- callback checks the signed-in email against this table.
create table editors (
  email text primary key,
  added_at timestamptz not null default now()
);
alter table editors enable row level security;
grant all on editors to service_role;

insert into editors (email) values ('ishay60@gmail.com');
