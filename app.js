//#region:  IMPORTS
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

    import { getList, shutdown, addBook, updateBook, fetchBookById, getISBN, fetchBookLocal, updateNotes, deleteBook } from './database.js'

    import { downloadImage, fetchBookRemote } from "./apiAccess.js";
    import clearTempFolder from './fileOp.js';
//#endregion

//#region  Module Level Declarations
    const app = express();
    const PORT = process.env.APP_PORT;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const baseUrl = process.env.BASE_URL;
//#endregion

//#region Middleware and express server settings
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static('public'));
    app.use(express.static('js'));
    app.use(express.json());

    app.set('view engine', 'ejs');
    app.set('views', './views');
//#endregion

  //#region  multer middleware region for image uploading and other helper functions
      const rename = promisify(fs.rename);
      const copyFile = promisify(fs.copyFile);
      const unlink = promisify(fs.unlink);
      
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
      
      //helper function to check if a string is valid URL
      function isValidURL(string){
        try {
            new URL(string);
            return true;
        } catch (error) {
            return false;
        }
      }
      
      
      //helper function to check if a string is valid JSON
      function isValidJSONString(string){
        try{
          JSON.parse(string);
        }catch(e){
          return false;
        }
        return true;
      }

      // Helper function to generate a random 6-digit filename
      function generateRandomFileName() {
          return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
      //helper Function to check if a file exists
      async function fileExists(filePath) {
        try {
            await access(filePath, constants.F_OK);
            return true; // File exists
        } catch (error) {
            return false; // File does not exist
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
//#endregion

//#region savecover and delete cover functions
      //Save cover functionality for add/edit book
      async function saveCover(file, newISBN, id=0)
      {
      /*
        check if the file passed is not null or undefined and start the save operations. It will also
        implicitly delete any other cover(s) with the same isbn 
      */
        try{
          let tempPath;
          let returnPathRelative;
          //check if the file is a string or an object
          if (typeof file === 'string') {
            // If `file` is a string, use it directly as the path
            tempPath = path.resolve(__dirname, 'public', process.env.DEFAULT_TEMP, path.basename(file));
            returnPathRelative = file;
          } else if (file && file.path) {
            // If `file` is an object (from upload), use its `path` property. This needs lots of testing
            tempPath = path.resolve(__dirname, 'public', process.env.DEFAULT_TEMP, path.basename(file.path));
            returnPathRelative = path.basename(file.path);
          } else {
            // If `file` is null or invalid, return false
            return false;
          }
          if (id>0){
            //get file name from the db
            const fileName = await getSavedFileName(id);
            //delete existing cover from the upload folder
            if(fileName.avatar){
              await deleteCover(fileNames.avatar);
            }
          }
            //save cover and return file name
            const finalPath = path.resolve(__dirname, 'public', process.env.DEFAULT_UPLOAD, `${newISBN}-${path.basename(tempPath)}`);
            await rename(tempPath, finalPath);

            // Optionally copy the renamed file back to temp folder for caching
            const cachedFilePath = path.resolve(__dirname, 'public', process.env.DEFAULT_TEMP, `${newISBN}-${path.basename(tempPath)}.jpg`);
            await copyFile(finalPath, cachedFilePath);
            const returnPath = `/${process.env.DEFAULT_UPLOAD}${newISBN}-${path.basename(returnPathRelative)}`;
            //this is the path that will be used to update the book record in the db. 
            //This is the file name only i.e.relative path
            //because image display reads relative paths and does not need the full path
            //this is also war path---let see what happens. WE ARE AT WAR
            return returnPath;
            // return path.join('public', process.env.DEFAULT_UPLOAD, `${newISBN}-${path.basename(finalPath)}`);

        }catch{error}{
          console.log(error)
          // console.error('Error saving book cover:', error, errors.array().map(err => err.msg).join('\n'));
          return false;
        }
      }

      //delete corresponding cover
      async function deleteCover(fileName){
        try {

          if (!fileName) {
            throw new Error('Invalid filename');
          }    
          //this might be problematic if it does not resolve to the correct path but the function checks if the file exists 
          //and deletes it if it does so saving grace. TO DO: exhaustively test this
            const delFilePath = path.resolve(__dirname, 'public', process.env.DEFAULT_UPLOAD, fileName);


            // Delete temp image
            if (await fileExists(delFilePath)){
                await unlink(delFilePath);
            }  
            console.log(`Successfully deleted cover image: ${fileName}`);
        } catch (error) {
              console.error(`Error deleting cover images: ${error.message}`);
        }  
      }

//#endregion

//#region get routers: "/sort", "/", "view-notes/:id", "/search"
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

    // Global variables to store the last search parameters and results
    let searchParamsGlobal = '';
    let searchByGlobal = '';
    let remResGlobal = [];
    let locRes=[];

    app.get('/search', async (req, res) => {
      // search locally i.e. search for title/author/ISBN
      // then search on open library.....      
      const searchParams = req.query.search;
      const searchBy = req.query.searchBy;

      const isISBN = searchBy === 'ISBN';

      const isNewSearch = searchParams !== searchParamsGlobal || searchBy !== searchByGlobal;

      try {

        if (isNewSearch){
            //reset thhe global parameters
            searchParamsGlobal = searchParams;
            searchByGlobal = searchBy;

            locRes = await fetchBookLocal(searchParams, isISBN);

            const remBooks = await fetchBookRemote(searchParams, searchBy); //initial object to contain results from the API call

            remResGlobal=[];

            if (remBooks && remBooks.docs) {
                // console.log(remBooks);
                  remResGlobal = await Promise.all(

                    remBooks.docs.map(async doc => {

                      const imageUrl = doc.cover_i ? `${process.env.COVERS_BASE}${doc.cover_i}-M.jpg` : null;

                      return {
                        author: doc.author_name ? doc.author_name.join(', ') : 'Unknown',
                        author_key: doc.author_key ? doc.author_key.join(', ') : 'Unknown',
                        avatar: imageUrl || null,
                        title: doc.title || 'untitled',
                        lang: doc.language ? doc.language[0] : 'Unknown',
                        isbn13: doc.isbn && doc.isbn.length > 0 ? doc.isbn[0] : 'No ISBN',
                        publish: doc.publish_date ? doc.publish_date[0] : 'Unknown',
                        cover_url: imageUrl,
                        cover_id: doc.cover_i
                      };
                    })
                );
            }
        }
        // Calculate total pages and slice results for current page
        // Pagination variables/// query current page
        const page = parseInt(req.query.page) || 1;
        const pageSize = 10;
        const totalPages = Math.ceil(remResGlobal.length / pageSize);


        // Paginate the cached results : object to hold mapped results -(via the mpa function) - that will contain application specific field names
        const remRes = remResGlobal.slice((page - 1) * pageSize, page * pageSize);    
        // Render search results with pagination data
        res.render('search.ejs', {locRes, remRes, coversbase: process.env.COVERS_BASE ,search: searchParams,searchBy, page, totalPages});
      }catch (error) {
          console.log(error.stack);
          res.status(500).render('errorPage.ejs', { error, errorType: 500 });
      }
    });
    //#endregion

 //#region post routes /add, /edit/:id, /delete/:id, /edit-notes
    app.post("/add",  upload.single('coverImage'),    async (req, res) => {
        
        const { title, author, isbn, notes, rating, lang, date_read,avatar,cover_id} = req.body;

        let finalAvatarPath = avatar ? avatar:null; //assign finalAvatarPath to avatar initially

        let error = {
          name: 'Internal server error',
          message: 'File Operation error or other error: Saving cover failed',         
          errorType: 500
        }

        console.log(cover_id);
        //if we are uploading a file, then avatar will be empty therefore give it a file name i.e 'isbn-uploadfilename'
        if(avatar.trim()===''){
          finalAvatarPath = req.file ? `${process.env.DEFAULT_UPLOAD}${isbn}-${path.basename(req.file.path)}` : process.env.DEFAULT_COVER;
        }

        const coverUrl = req.body.imgUrl || avatar;
        try {
          
          //check if avatar is a url and valid. If so download the image
          const isURL=isValidURL(avatar);
          if (req.file) {
              finalAvatarPath=await saveCover(req.file,isbn);
              if (!finalAvatarPath){
                  console.log("error saving cover");
                  return res.status(500).render('errorPage.ejs', error, {errorType: 500});
              }
          }else if(isURL){
              const randFileName = generateRandomFileName();
              const coverId = cover_id? cover_id : randFileName;
 
                /*
                  Filename that the cover will be given when downloaded. 
                  This is either the original cover_id or a random file number generated
               */ 

              const coverFilePath=path.resolve('public',process.env.DEFAULT_UPLOAD, `${isbn}-${coverId}.jpg`);
              
              //download only when the user selects add this book. download direct to uploads folder
              // if the cover exists delete it first
              const exists = await fileExists(coverFilePath); 
              if (exists){
                  await deleteCover(coverFilePath);  
              }

              const downloaded = await downloadImage(coverUrl, coverFilePath);
              if (!downloaded){
                error.message="Error downloading cover";
                error.name="Internal server error: Download failed";
                error.errorType="500";
                return res.status(500).render('errorPage.ejs', error, {errorType: 500});
              }
              finalAvatarPath =`/${process.env.DEFAULT_UPLOAD}${path.basename(coverFilePath)}`;
          }else{
            error.message="Error adding book";
            error.name="Internal server error: Unknown error";
            error.errorType="500";
            return res.status(500).render('errorPage.ejs', error, {errorType: 500});
          }
          
          //add book to database
          await addBook(title, author, isbn, notes, parseFloat(rating), coverUrl, lang, date_read, finalAvatarPath);

          res.status(200).redirect("/");
        } catch (error) {
            console.error('Post /add: Error adding book:', error);
            res.status(500).render('errorPage.ejs', { error:  errors.array().map(err => err.msg).join('\n'), errorType: 500 });
        }
      }
    );

    app.post("/edit/:id", upload.single('coverImage'), async(req, res)=>{
      //check if the user has uploaded a new book cover, if so delete the old one by retrieving the stored ISBN(Not changed)

      const { title, author, isbn, notes, rating, lang, date_read, avatar } = req.body;
      // This line determines the avatar (book cover image) for the book being edited
      // It checks three possible sources for the image in order of priority:
      // 1. A newly uploaded file (req.file)
      // 2. An existing image URL from the form (req.body.imgUrl)
      // 3. The default cover image
      // The paths are stored in environment variables for easy configuration

      const coverUrl = req.body.imgUrl || avatar;
      const id= parseInt(req.params.id);
      try{
        if (req.file) {
          const finalPath=await saveCover(req.file,isbn,id);
          if (!finalPath){
            console.log("error saving book cover");
            return res.status(500).render('errorPage.ejs', { 
              error: {
                name: 'Internal server error',
                message: 'File Operation error or other error: Saving cover failed',
              },
              errorType: 500
            });
          }else{
            avatar=finalPath;
          }
        }
        //update book 
        await updateBook(title,author,isbn,notes,rating,coverUrl,lang,date_read,avatar,id);  
        res.status(200).redirect("/");
      }catch(error){
        console.error('Error editing book:', error);
        res.status(500).render('errorPage.ejs', { error:  errors.array().map(err => err.msg).join('\n'), errorType: 500 });
      }  

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
//#endregion

//#region Handle shutdown gracefully
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
//#endregion

//#region  Start the Server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
//#endregion
