create table usuarios (
  id bigint generated always as identity primary key,
  username text unique not null,
  password text not null,
  role text default 'user'
);

create table chat_messages (
  id bigint generated always as identity primary key,
  sender text not null,
  text text not null,
  city text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table suggestions (
  id bigint generated always as identity primary key,
  title text not null,
  text text not null,
  sender text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table support_tickets (
  id bigint generated always as identity primary key,
  usuario text not null,
  city text not null,
  question text not null,
  answer text,
  date_str text not null
);

create table city_data (
  city text primary key,
  agua integer not null,
  esgoto integer not null,
  informativo text not null,
  registrado boolean default true
);


alter table usuarios disable row level security;
alter table chat_messages disable row level security;
alter table suggestions disable row level security;
alter table support_tickets disable row level security;
alter table city_data disable row level security;