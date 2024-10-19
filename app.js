import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import 'dotenv/config';
import fs from 'fs';
import { promisify } from 'util';
import path from "path";
import { fileURLToPath } from "url";
import { access } from 'fs/promises';
import { constants } from 'fs';
import multer from 'multer'
import { body, validationResult } from 'express-validator';

const app = express();
const PORT = process.env.APP_PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = process.env.BASE_URL;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.HOST,
  database: process.env.DB,
  password: process.env.PASS,
  port:process.env.DB_PORT,
});

// Function to check if a file exists
async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true; // File exists
  } catch (error) {
    return false; // File does not exist
  }
}

async function downloadImage(url, fileName) {
  const imagePath = path.resolve('public','covers','temp', `${fileName}.jpg`);
  const writer = fs.createWriteStream(imagePath);

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    writer.on('finish', () => console.log(`Saved: ${imagePath}`));
    writer.on('error', (err) => console.error('Error writing image:', err));
  } catch (error) {
    console.error('Error downloading image:', error.message);
  }
} 
async function saveBookAndCover(){

}

db.connect().catch(err=>{
  console.error(err);
  process.exit(-1);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('js'));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', './views');

//get all books
async function getList( sortBy='date_read', sortDirection='DESC'){
  const validSortColumns = ['title', 'author', 'date_read', 'rating'];
  const validSortDirections = ['ASC', 'DESC'];

  // Validate sortBy and sortDirection
  if (!validSortColumns.includes(sortBy)) {
      sortBy = 'date_read'; // Default sorting
  }
  if (!validSortDirections.includes(sortDirection)) {
      sortDirection = 'DESC'; // Default sorting direction
  }
    const res=await db.query(`
                        SELECT *
                        FROM booklist
                        ORDER BY ${sortBy} ${sortDirection}`);
    // console.log(res.rows);
    return res.rows;
}


// Function to get book details by title or ISBN
async function fetchBookRemote(searchParams,searchTerm) {

  let remURL=process.env.BASE_URL;
  switch(searchTerm){
    case  'ISBN':
      remURL +=`?isbn=${searchParams}&page=1,sort=new`;
      break;
    case 'Author':
      remURL +=`?author=${searchParams}&page=1,sort=new`;
      break;
    case 'Title':
      remURL +=`?title=${searchParams}&page=1,sort=new`;
      break;
    default:
      remURL +=`?q=${searchParams}&page=1,sort=new`;
      break;
  }
  console.log(remURL);
  try{
    const res=await axios.get(remURL);
    // console.log('data:', res.data);
    return res.data;
  } catch (error) {
    if (error.response) {
      // Server responded with a status other than 2xx
      // console.log('Error Status:', error.response.status);
      // console.log('Error Data:', error.response.data);
      // return error.response.status;
      console.log('Server responded with a status other than 2xx');
    } else if (error.request) {
      // Request was made, but no response was received
      // console.log('No response received:', error.request);
      console.log('No response received. Request might be bad');
    } else {
      // Something else happened while setting up the request
      // console.log('Error Message:', error.message);
      console.log('something else happened');
    }
    return null;
  }
}
// Function to download and save the image
 

//add a new book to the database
async function addBook(title, author, isbn, notes, rating, coverUrl, lang, date_read, avatar){
  // console.log(notes);  
  const res = await db.query(
      `   INSERT INTO booklist (title, author, isbn13, notes,rating, cover_url, lang, date_read, avatar)
          VALUES ($1,$2,$3,$4,$5,$6, $7, $8,$9)`,
            [title, author, isbn, JSON.stringify(notes), rating, coverUrl, lang, date_read,avatar]
    );
    
    // console.log(res);
}  

// Function to update the book cover URL in the database
async function updateBookCover(identifier, coverUrl, avatar,isISBN) {
    let query;
    let values;
    values = [coverUrl, identifier, avatar];
    if (isISBN) {
      query = `UPDATE booklist SET cover_url = $1, 
      avatar = $3
      WHERE isbn13 = $2`;
    } else {
      query = `UPDATE booklist SET cover_url = $1,
      avatar = $3 
      WHERE title = $2`;
    }
  
    try {
      await db.query(query, values);
      console.log('Book cover URL updated in the database');
    } catch (error) {
      console.error('Error updating the database:', error.message);
    }
  }

async function fetchBookLocal(searchParams, isISBN=false) {
  //check author or title or ISBN
  let query;
  const values=[searchParams];
  if (isISBN){
      query=`SELECT * 
             FROM booklist 
             WHERE isbn13 ILIKE $1`;
  }else{
    query= `SELECT * 
            FROM booklist
            WHERE author ILIKE $1
            OR title ILIKE $1
            OR notes ILIKE $1`;
  }
  console.log(values);
  const res= await db.query(query, values);
  return res.rows;
}

//sort route
app.get("/sort", async(req, res)=>{
  const {sortBy, sortdirection}=req.query;
  if (sortBy.trim()===''|| sortdirection.trim()===''){
      res.redirect('/');
  }else{
      const books = await getList(sortBy,sortdirection);
      console.log(books);
      res.render("index.ejs", {books, sortBy, sortdirection});
  }
});
// the get '/' route
app.get("/", async(req, res)=>{
    const books = await getList();
    // console.log(books)
    res.render("index.ejs", {books});
});
async function fetchBookById(id){
  if(id){
    const res= await db.query(` SELECT * FROM booklist WHERE id = $1`, [id]);
    // console.log(res.rows);
    return res.rows;
  }else{
    return [];
  }
}
function isValidJSONString(string){
  try{
    JSON.parse(string);
  }catch(e){
    return false;
  }
  return true;
}
app.get("/view-notes/:id", async(req, res) =>{
  const id = parseInt(req.params.id);
  
  // console.log(id);
  const book = await fetchBookById(id);
  if(book){
    const notesString = book[0].notes;
    //check if the string from the db is valid JSON and parse it
    //else attempt to clean it if that helps
    let cleanedNotes;
    if (isValidJSONString(notesString)){
      cleanedNotes=JSON.parse(notesString);
    }else{
      cleanedNotes = notesString.replace(/^"\{/, '{').replace(/\}"$/, '}').replace(/\\\\"/g, '"');
    }
    
    // console.log(cleanedNotes);
    res.status(200).render("viewNotes.ejs",{book, bookNotes: cleanedNotes});
  }else{
    res.status(404).render("errorPage.ejs",{error:'Resource not found', errorType:404});
  }
});
//#region search for book both online and local
app.get('/search',async(req,res)=>{
  
  // search locally i.e. search for title/author/ISBN
  // then search on open library.....

  const searchParams=req.query.search;
  const searchBy=req.query.searchBy;

  const isISBN=searchBy==='ISBN';
  const dbSearchParams=`%${req.query.search}%`;

  try{
    const books = await getList();
    const locRes= await fetchBookLocal(dbSearchParams, isISBN);
    const remBooks= await fetchBookRemote(searchParams,searchBy); //initial object to contain results from the API call
    console.log(remBooks);
    let remRes=null; //object to hold mapped results -(via the mpa function) - that will contain application specific field names
    // console.log(localBooks);
    if (remBooks && remBooks.docs){
            remRes = await Promise.all(
            remBooks.docs.map(async doc => {
            const coverId = doc.cover_i ? doc.cover_i : null;
            let localCoverPath = process.env.DEFAULT_COVER; // Default cover if none
            // Only download the cover if cover_id exists
            if (coverId) {
              const coverFileName = `${coverId}`; // Use cover_id as the filename
              const imageUrl = `${process.env.COVERS_BASE}${coverId}-M.jpg`;
              const tempCoverPath = path.resolve(process.env.DEFAULT_TEMP, `${coverFileName}.jpg`);

              // Check if the file already exists
              const exists = await fileExists(tempCoverPath); 

              if (!exists){
                await downloadImage(imageUrl, coverFileName);
              }          
              localCoverPath = `${process.env.DEFAULT_TEMP}${coverFileName}.jpg`;
            }
    
            return {
              author: doc.author_name ? doc.author_name.join(', ') : 'Unknown',
              author_key: doc.author_key ? doc.author_key.join(', ') : 'Unknown',
              avatar: localCoverPath, // Set to the local file path
              title: doc.title || 'untitled',
              lang: doc.language ? doc.language[0] : 'Unknown',
              isbn13: doc.isbn && doc.isbn.length > 0 ? doc.isbn[0] : 'No ISBN',
              publish:doc.publish_date ? doc.publish_date[0] : "Unknown"
            };
          })
        );
    }
    res.render('search.ejs',{locRes, remRes, SearchTerm: searchParams});
  }catch(error){
    // console.log(error.stack);
    res.status(500).render('errorPage.ejs', {error, errorType:500});
  }

});
//#region 

//#region  multer middleware region for image uploading
  const rename = promisify(fs.rename);
  const copyFile = promisify(fs.copyFile);
  const unlink = promisify(fs.unlink);
// Helper function to generate a random 6-digit filename
  function generateRandomFileName() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  // Set up multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) 
    {
        cb(null, path.join('public', 'covers', 'temp')); // Temp folder for caching
    },
    filename: function (req, file, cb) 
    {
        const randomFileName = `${generateRandomFileName()}.jpg`; 
        cb(null, randomFileName); // Save as ISBN.jpg
    }
  });
  // File validation (only images allowed)
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  };
  const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter
  });
//#endregion
app.post("/add", 
  upload.single('coverImage'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('isbn').trim().isISBN().withMessage('Invalid ISBN'),
    body('rating').isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    body('lang').trim().notEmpty().withMessage('Language is required'),
    body('date_read').isDate().withMessage('Invalid date format')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Render errorPage.ejs with validation errors
      return res.status(400).render('errorPage.ejs', { 
        error: {
          name: 'ValidationError',
          message: 'Validation failed',
          stack: errors.array().map(err => err.msg).join('\n')
        },
        errorType: 400
      });
    }

    const { title, author, isbn, notes, rating, lang, date_read } = req.body;
    const avatar = req.file ? `${process.env.DEFAULT_TEMP}${isbn}.jpg` : process.env.DEFAULT_COVER;
    const coverUrl = req.body.imgUrl || avatar;

    console.log(notes);

    try {
      // Move the file from /temp to /covers after successful upload
      if (req.file) {
        const tempPath = path.resolve('public', 'covers', 'temp', req.file.filename);
        const finalPath = path.resolve('public', 'covers', `${isbn}.jpg`);

        await rename(tempPath, finalPath);

        // Optionally copy the renamed file back to temp folder for caching
        const cachedFilePath = path.join('public', 'covers', 'temp', `${isbn}.jpg`);
        await copyFile(finalPath, cachedFilePath);
      }

      await addBook(title, author, isbn, notes, parseFloat(rating), coverUrl, lang, date_read, avatar);

      res.status(200).redirect("/");
    } catch (error) {
      console.error('Error adding book:', error);
      res.status(500).render('errorPage.ejs', { error, errorType: 500 });
    }
  }
);


// edit notes functionality
async function updateNotes(id, notes){
  const qry=` UPDATE booklist
              SET notes = $2
              WHERE id = 1`;
  const values=[id,JSON.stringify(notes)];
  const res=db.query(qry, values);
  console.log(res);
}
app.post("/edit-notes", async(req,res) =>{
  const id = parseInt(req.body.id);
  const notes=req.body.notes;
  if (id){
    await updateNotes(id, notes);
  }
});
//#region Handle shutdown gracefully
// Handle shutdown
async function shutdown() {
    console.log('Shutting down gracefully...');
    await db.end();
    process.exit(0);
  }
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
//#endregion

  //#region  Start the Server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  //#endregion
