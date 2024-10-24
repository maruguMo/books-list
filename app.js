import express from "express";
import bodyParser from "body-parser";
import 'dotenv/config';
import fs from 'fs';
import { promisify } from 'util';
import path from "path";
import { fileURLToPath } from "url";
import { access } from 'fs/promises';
import { constants } from 'fs';
import multer from 'multer'
import { body, validationResult } from 'express-validator';

import { getList, shutdown, addBook, updateBook, fetchBookById, getISBN, fetchBookLocal, updateBookCover, updateNotes, deleteBook } from './database.js'

import { downloadImage, saveBookAndCover, fetchBookRemote } from "./apiAccess.js";

const app = express();
const PORT = process.env.APP_PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = process.env.BASE_URL;



// Function to check if a file exists
async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true; // File exists
  } catch (error) {
    return false; // File does not exist
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('js'));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', './views');

//sort route
app.get("/sort", async(req, res)=>{
  const {sortBy, sortdirection}=req.query;
  if (sortBy.trim()===''|| sortdirection.trim()===''){
      res.redirect('/');
  }else{
      const books = await getList(sortBy,sortdirection);
      // console.log(books);
      res.render("index.ejs", {books, sortBy, sortdirection});
  }
});
// the get '/' route
app.get("/", async(req, res)=>{
    const books = await getList();
    // console.log(books)
    res.render("index.ejs", {books});
});

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
    // console.log(remBooks);
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
    console.log(`we are here ${remRes}`)
    res.render('search.ejs',{locRes, remRes, SearchTerm: searchParams});
  }catch(error){
    console.log(error.stack);
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
    const avatar = req.file ? `${process.env.DEFAULT_UPLOAD}${isbn}.jpg` : process.env.DEFAULT_COVER;
    const coverUrl = req.body.imgUrl || avatar;

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
//edit book functionality
app.post("/edit/:id", upload.single('coverImage'), async(req, res)=>{


  res.status(200).redirect("/");
});

app.post("/delete/:id", async(req, res)=>{
  try{
    const { id }=req.params;
    if(parseInt(id)>0 ){
        //get isbn to delete the corresponding image
        const isbn = await getISBN(parseInt(id));
        await deleteBook(id);
        if(isbn){
          await deleteCover(isbn);
        }
        res.status(200).redirect('/');
    }
  } catch(error){
      console.error('Error adding book:', error);
      res.status(500).render('errorPage.ejs', { error, errorType: 500 });    
  }
});
app.post("/edit-notes", async(req,res) =>{
  const id = parseInt(req.body.id);
  const notes=req.body.notes;
  if (id){
    await updateNotes(id, notes);
  }
});
//delete corresponding cover
async function deleteCover(isbn){
  try {

    if (!isbn) {
      throw new Error('Invalid ISBN');
    }    
      // Construct file paths
   
      const tempPath = path.join('public', 'covers', 'temp', `${isbn}.jpg`);
      const uploadPath = path.join('public', 'covers', `${isbn}.jpg`);

      console.log(tempPath, uploadPath);

      // Delete temp image
      await unlink(tempPath);

      // Delete uploaded image
      await unlink(uploadPath);
      console.log(`Successfully deleted cover images for ISBN: ${isbn}`);
  } catch (error) {
        console.error(`Error deleting cover images: ${error.message}`);
  }  
}
// A utility function to format dates
// A utility function to format dates to "dddd mmmm d yyyy"
function formatDate(dateString) {
  const date = new Date(dateString);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayName = weekdays[date.getDay()]; // Get the name of the day
  const monthName = months[date.getMonth()]; // Get the name of the month
  const day = date.getDate(); // Get the day of the month
  const year = date.getFullYear(); // Get the full year

  return `${dayName}, ${monthName}-${day} ${year}`;
}
// Expose the function in your app (if using Express)
app.locals.formatDate = formatDate;
//#region Handle shutdown gracefully

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
//#endregion

  //#region  Start the Server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  //#endregion
