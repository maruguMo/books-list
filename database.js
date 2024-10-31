import pg from "pg";

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PASS,
    port:process.env.DB_PORT,
  });

  db.connect().catch(err=>{
    console.error(err);
    process.exit(-1);
  });
  
//get all books
export async function getList( sortBy='date_read', sortDirection='DESC'){
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

  //add a new book to the database
export async function addBook(title, author, isbn, notes, rating, coverUrl, lang, date_read, avatar){
    const res = await db.query(
        `   INSERT INTO booklist (title, author, isbn13, notes,rating, cover_url, lang, date_read, avatar)
            VALUES ($1,$2,$3,$4,$5,$6, $7, $8,$9)`,
              [title, author, isbn, JSON.stringify(notes), rating, coverUrl, lang, date_read,avatar]
      );
  }  
export async function updateBook(title,author, isbn, notes, rating, coverUrl, lang, date_read, avatar, id){
    const res = await db.query(
      `   UPDATE  
              booklist  
          SET title = $1, 
              author = $2, 
              isbn13 =$3, 
              notes = $4,
              rating =$5, 
              cover_url = $6, 
              lang = $7, 
              date_read = $8 , 
              avatar =$9
          WHERE
              id = $10`,
            [title, author, isbn, JSON.stringify(notes), rating, coverUrl, lang, date_read,avatar, id]
    );
  }
export async function fetchBookLocal(searchParams, isISBN=false) {
    //check author or title or ISBN
    let query;
    const values=[`%${searchParams}%`];
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
    // console.log(values);
    const res= await db.query(query, values);
    return res.rows;
  } 
  export async function fetchBookById(id){
    if(id){
      const res= await db.query(` SELECT * FROM booklist WHERE id = $1`, [id]);
      // console.log(res.rows);
      return res.rows;
    }else{
      return [];
    }
  }   
// Function to update the book cover URL in the database
export async function updateBookCover(identifier, coverUrl, avatar,isISBN) {
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
export async function getSavedFileName(id){
  const query = ` SELECT 
                  avatar
                  FROM booklist
                  WHERE id = $1`;
  const res = await db.query(query, [id]);
  return res.rows[0].avatar;
}

//get ISBN from PostgreSQL
export async function getISBN(id){
    // Query to get ISBN from PostgreSQL
    const query = ` SELECT isbn13
                    FROM booklist
                    WHERE id = $1`;

    try {
        const res = await db.query(query, [id]);

        if (res.rows.length > 0 && res.rows[0].isbn13) {
            return res.rows[0].isbn13.toString();
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error querying the database:', error);
        return false;
    }
}
export async function deleteBook(id){
    //delete the book
    const query = ` DELETE
                    FROM booklist
                    WHERE id = $1`;
    const res = await db.query(query,[id]);
    return res;
}
export async function updateNotes(id, notes){
    const qry=` UPDATE booklist
                SET notes = $2
                WHERE id = 1`;
    const values=[id,JSON.stringify(notes)];
    const res=db.query(qry, values);
    console.log(res);
  }
  // Handle shutdown
export async function shutdown() {
    console.log('Shutting down gracefully...');
    await db.end();
    process.exit(0);
  }
  