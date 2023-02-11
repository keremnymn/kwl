create or replace function new_pin()
    returns int
    language plpgsql
    as
    $$
    begin 
        return cast(000000 + floor(random() * 999999) as int);
    end;
    $$;

create or replace function create_unique_pin_and_uuid(ticket_id int, received_user_id int)
    returns table (new_pin integer, new_uuid varchar(40))
    language plpgsql
    as
    $$
    declare
        new_pin integer = new_pin();
        new_uuid varchar = gen_random_uuid();
    begin
        if received_user_id = (select user_id from ticket where id = ticket_id) then
            while (select exists(select 1 from ticket where pin = new_pin and on_air = true and uuid = new_uuid)) loop
                new_pin := new_pin();
            end loop;
            while (select exists(select 1 from ticket where uuid = new_uuid and on_air = true)) loop
                new_uuid := gen_random_uuid();
            end loop;
        
        else raise exception 'received_user_id is not valid';
        end if;
        update ticket 
                    set pin = new_pin, 
                        on_air = true, 
                        uuid = new_uuid, 
                        valid_until = now() + '24 hours'::interval
                    where id = ticket_id;

        return query select new_pin as pin, new_uuid as uuid;
    end;
    $$;

create or replace function remove_ticket_from_air(ui int, ticket_id int)
    returns boolean
    language plpgsql
    as
    $$
    begin
        if (select exists(select 1 from ticket where user_id = ui and id = ticket_id)) then 
            update ticket set uuid = null, pin = null, on_air = false where id = ticket_id;
        else
            raise exception 'user is not owner';
        end if;
        return true;
    end;
    $$;

create or replace function delete_ticket(ui int, ticket_id int)
    returns boolean
    language plpgsql
    as
    $$
    begin
        if (select exists(select 1 from ticket where user_id = ui and id = ticket_id)) then 
            delete from ticket where id = ticket_id; 
        end if;  
        return true;
    end;
    $$;

create or replace function change_stage_of_ticket(ui int, ticket_id int, new_stage smallint)
    returns boolean
    language plpgsql
    as
    $$
    begin
        if (select exists(select 1 from ticket where user_id = ui and id = ticket_id)) then 
            update ticket set stage = new_stage where id = ticket_id; 
        end if;  
        return true;
    end;
    $$;

create or replace function insert_message_for_ticket(
    received_ticket_id int, 
    stage smallint,
    message_content text, 
    ns character varying(150),
    ui integer
)
    returns table(
        current_id int,
        current_name_and_surname varchar(150)
    )
    language plpgsql
    as
    $$
    declare
        current_id int;
        current_name_and_surname varchar(150);
    begin
        if (select exists(select 1 from ticket where on_air = true and id = received_ticket_id)) then 
            insert into ticket_message 
                        (ticket_id, content, user_id, stage, name_and_surname) 
                    values (received_ticket_id, message_content, ui, stage, ns) 
                    returning id
                    into current_id;
            if (ui > 0) then
                select concat("firstname", ' ', "lastname")
                into current_name_and_surname
                from "user"
                where id = ui;
            else
                current_name_and_surname := ns;
            end if;
        else
            raise exception 'ticket not found';
        end if;  
        return query select current_id, current_name_and_surname;
    end;
    $$;

create or replace function get_ticket_info(received_uuid character varying(40), received_pin int)
    returns table(
                    ticket_id int, 
                    ticket_know varchar (100), 
                    ticket_want_to_learn varchar (100), 
                    ticket_learned varchar (100),
                    ticket_stage smallint,
                    messages json
                )
    language plpgsql
    as
    $$
    begin
        if not exists (select 1 from ticket where on_air = true and pin = received_pin and uuid = received_uuid and now() <= valid_until::date) then
            raise exception sqlstate 'P0002';
        else
            return query select 
                            ticket.id,
                            ticket.know,
                            ticket.want_to_learn,
                            ticket.learned,
                            ticket.stage,
                            json_agg(
                                    json_build_object(
                                        'userID', ticket_message.user_id, 
                                        'messageID', ticket_message.id,
                                        'content',ticket_message.content, 
                                        'stage', ticket_message.stage, 
                                        'sender', case when ticket_message.name_and_surname is null
                                                    then (
                                                        select concat("firstname", ' ', "lastname")
                                                        from "user"
                                                        where id = ticket_message.user_id
                                                    )
                                                    else ticket_message.name_and_surname
                                                    end
                                    )
                            )
                            as "messages" 
                            from ticket 
                        left join ticket_message 
                            on ticket_message.ticket_id = ticket.id 
                        where ticket.uuid = received_uuid and ticket.pin = received_pin
                        group by ticket.id;
        end if;
    end;
    $$;

create or replace function add_article(
    new_title varchar(150),
    new_article_description varchar(250), 
    new_main_image varchar(150), 
    new_content json,
    new_tags varchar[],
    ui int
)
    returns boolean
    language plpgsql
    as
    $$
    declare
        article_id int;
        new_slug text;
    begin 
        new_slug := slugify(new_title);
        insert into article (
                            title, slug, article_description, main_image, content, user_id
                        ) 
                    values(
                            new_title, new_slug, new_article_description, new_main_image, new_content, ui
                        ) 
                    returning id into article_id;
        
        insert into article_tag
            select t.id, a.id
            from   article a
            left join lateral (select id from tag where value = any(new_tags)) t on true
            where  a.id=article_id;

        return true;
    end;
    $$;

create or replace function update_article(
    current_slug varchar(150),
    new_title varchar(150),
    new_article_description varchar(250), 
    new_main_image varchar(150), 
    new_content json,
    new_tags varchar[],
    _current_date date
)
    returns boolean
    language plpgsql
    as
    $$
    declare
        article_id_to_update int;
    begin 
        select id from article where date_trunc('day', created_on) = _current_date and 
                slug = current_slug
                into article_id_to_update;
        update article 
                    set 
                        title = new_title, 
                        article_description = new_article_description,
                        main_image = coalesce(new_main_image, main_image),
                        content = new_content
                    where id = article_id_to_update;
        
        delete from article_tag where article_id = article_id_to_update;
        insert into article_tag
            select t.id, a.id
            from   article a
            left join lateral (select id from tag where value = any(new_tags)) t on true
            where  a.id=article_id_to_update;
        
        return true;
    end;
    $$;

-- taken from https://www.kdobson.net/2019/ultimate-postgresql-slug-function/
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE OR REPLACE FUNCTION slugify("value" TEXT)
RETURNS TEXT AS $$
  -- removes accents (diacritic signs) from a given string --
  WITH "unaccented" AS (
    SELECT unaccent("value") AS "value"
  ),
  -- lowercases the string
  "lowercase" AS (
    SELECT lower("value") AS "value"
    FROM "unaccented"
  ),
  -- remove single and double quotes
  "removed_quotes" AS (
    SELECT regexp_replace("value", '[''"]+', '', 'gi') AS "value"
    FROM "lowercase"
  ),
  -- replaces anything that's not a letter, number, hyphen('-'), or underscore('_') with a hyphen('-')
  "hyphenated" AS (
    SELECT regexp_replace("value", '[^a-z0-9\\-_]+', '-', 'gi') AS "value"
    FROM "removed_quotes"
  ),
  -- trims hyphens('-') if they exist on the head or tail of the string
  "trimmed" AS (
    SELECT regexp_replace(regexp_replace("value", '\-+$', ''), '^\-', '') AS "value"
    FROM "hyphenated"
  )
  SELECT "value" FROM "trimmed";
$$ LANGUAGE SQL STRICT IMMUTABLE;