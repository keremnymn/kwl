create table if not exists "user" (
    id serial primary key,
    firstname varchar (30) not null,
    lastname varchar (30) not null,
    password varchar (120),
    email varchar (50) unique not null,
    email_subscription boolean default false,
    image_file varchar(150),
    is_confirmed boolean default false,
    is_admin boolean default false,
    is_banned boolean default false,
    created_on timestamp default now()::timestamp,
    last_login timestamp,
    account_type varchar(20) default 'normal'
);

create index if not exists idx_email on "user"(email);

create table if not exists "ticket" (
    id serial primary key,
    user_id int not null,
    created_on timestamp default now()::timestamp,
    know varchar (100) not null,
    want_to_learn varchar (100),
    learned varchar (100),
    topic varchar (60) not null,
    stage smallint not null default 0,
    remind_date date default null,
    valid_until date default null,
    on_air boolean default false,
    pin integer,
    unique (pin, on_air),
    uuid varchar(40) unique,
    foreign key (user_id) references "user"(id) on delete cascade
);

create table if not exists "ticket_message" (
    id bigserial primary key,
    user_id int,
    stage smallint,
    content text,
    name_and_surname varchar (150),
    ticket_id int not null,
    created_on timestamp default now()::timestamp,
    foreign key (user_id) references "user"(id) on delete cascade,
    foreign key (ticket_id) references "ticket"(id) on delete cascade
);

create table if not exists "tag" (
    id serial primary key,
    value varchar (100) unique,
    label varchar(100)
);

create table if not exists "article" (
    id serial primary key,
    user_id int,
    title varchar(150) not null,
    slug varchar(150) not null,
    article_description varchar (250) not null,
    main_image varchar(150) not null,
    content json not null,
    created_on timestamp default now()::timestamp,
    foreign key (user_id) references "user"(id) on delete cascade
);

create table if not exists "article_tag" (
    tag_id int references "tag" (id) on update cascade on delete cascade,
    article_id int references "article" (id) on update cascade,
    constraint article_tag_pkey primary key (tag_id, article_id)
);