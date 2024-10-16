--CREATE DATBASE SCRIPT
CREATE DATABASE "Books"
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- Table: public.booklist

-- DROP TABLE IF EXISTS public.booklist;

CREATE TABLE IF NOT EXISTS public.booklist
(
    id integer NOT NULL DEFAULT nextval('booklist_id_seq'::regclass),
    title character varying(200) COLLATE pg_catalog."default",
    author character varying(200) COLLATE pg_catalog."default",
    isbn13 character varying(15) COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    rating numeric(2,1),
    cover_url character varying(2048) COLLATE pg_catalog."default",
    date_read date,
    avatar character varying(100) COLLATE pg_catalog."default",
    lang character varying(10) COLLATE pg_catalog."default",
    CONSTRAINT booklist_pkey PRIMARY KEY (id),
    CONSTRAINT unique_isbn13 UNIQUE (isbn13),
    CONSTRAINT booklist_rating_check CHECK (rating >= 1.0 AND rating <= 5.0)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.booklist
    OWNER to postgres;


