# Book Notes Capstone Project
## The Task
### Overview
I read a lot of books but after I finish reading them I often don't remember all the most salient parts of the book. 
So I started taking notes. This capstone project is built on this idea. 
My friend Derek Sivers has this fantastic website where he has all the non-fiction books he has read, 
his notes, his ratings and when he read them. The books are sortable by rating, recency and title. 
It's a such cool idea for a project so I'm including it as a capstone here in this course.
#### Objectives
Revise how to integrate public APIs into web projects.
Gain more experience using Express/Node.js for server-side programming.
Demonstrate ability to Create Read Update and Delete data in a PostgreSQL Database to persist data.
##### Example Ideas
Use the Open Library Covers API to fetch book covers.
Create a database to store books you have read.
Have a way to add new data about books, update previous reviews and delete entries.
Be able to sort your book entries by rating and recency.
#### Requirements
<em> 1. Database Persistance</em>
Persist data using a PostgreSQL database.
<em>2. Project Setup</em>
Set up a new Node.js project using Express.js.
Include pg for working with your localhost PostgreSQL database.
Include EJS for templating.
Create a frontend in HTML CSS JS.
Ensure that the project has a structured directory and file organization.
<em>3. API Integration</em>
Implement at least a GET endpoint to interact with your chosen API.
Use Axios to send HTTP requests to the API and handle responses.
<em>4. Data Presentation</em>
Design the application to present the book covers from the API and the data in your database a in a user-friendly way.
Use appropriate HTML, CSS, and a templating engine like EJS.
Think about how you would allow the user to sort the data from the database.
<em>5. Error Handling</em>
Ensure that error handling is in place for both your application and any API requests. You can console log any errors, but you can also give users any user-relevant errors.
## The Solution
The solution uses nodejs express server and other js libraries front end and back end for example Front end:

        bootstrap, quill editor, font awesome
        
Back end: 

        express, bodyParser, dotenv/config, fs, promisify from util, path, axios, fileURLToPath from url, access from fs/promises, constants from fs, multer from multer, body and validationResult from express-validator

### 1. Clone my solution
To run my solution clone the repository using either a cli e.g. bash or git cli

      gh repo clone maruguMo/book-notes

or use http

      https://github.com/maruguMo/book-notes.git
### 2. Install dependencies
in vs code bash terminal run the following commands to install dependencies

      npm i

### 3. Set up pg database
If not installed, download and install PostgreSQL database including pgAdmin. Make sure you create a password that you can remember for the root postres user
Create a database called books [consult postgres documentation on how to do this](https://www.postgresql.org/docs/current/)
With the created database open the query editor and run this command

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

### 4. Environment variables
In the project root folder locate the file called: 

        example.env 
        
and rename it to 

        .env

modify the variables according to how you have set up your database i.e. database user, password and ports( application and database.

        DB_USER= postgres
        HOST= localhost
        DB= Books
        PASS= your_password
        DB_PORT = 5432
        APP_PORT = 3000
        BASE_URL = https://openlibrary.org/search.json
        COVERS_BASE= https://covers.openlibrary.org/b/id/
        DEFAULT_COVER = /covers/DefaultCover.png
        DEFAULT_TEMP=covers/temp/
        DEFAULT_UPLOAD=covers/

The application relies on the open library api download covers therefore leave the COVERS_BASE and BASE_URL as is. 
The DEFAULT_TEMP and DEFAULT_UPLOAD are relative paths that are used to store the path to the downloaded or uploaded
book cover (The app allows you to upload book covers as well). So its recommended you leave the variables as is

### 5. Run the Solution
On vs code bash cli CD into the root directory of the solution and run the following command:

      nodemon

This will start the express server and run the app.js. On your browser navigate to

        http://localhost:3000
## Look and Feel
### Home page
![Homepage books capstone](https://github.com/user-attachments/assets/c07ebc6f-9b6e-42aa-8367-eb1c9afdc377)

### Adding a new book

[add a new book capstone](https://github.com/user-attachments/assets/56a4380e-62f0-4122-99db-ac8162af6f37)

### View Book notes
![viewing book notes books capstone]

### Search for book/book cover on the open library
![Search results books capstone](https://github.com/user-attachments/assets/94d56903-b864-4bbe-828b-24e08e6b157b)




