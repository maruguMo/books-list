import axios from "axios";
import fs from 'fs';
import path from "path";


export async function downloadImage(url, fileName) {
    const imagePath = path.resolve('public','covers','temp', `${fileName}.jpg`);
    const writer = fs.createWriteStream(imagePath);
  
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });
  
      response.data.pipe(writer);
  
      writer.on('finish', () => {
        //console.log(`Saved: ${imagePath}`)
        return true;
      });
      writer.on('error', (err) => {
        //console.error('Error writing image:', err);
        return false;
      });
    } catch (error) {
      console.error('Error downloading image:', error.message);
      return false;
    }
  }

  export async function saveBookAndCover(){

  }
  // Function to get book details by title or ISBN
export async function fetchBookRemote(searchParams,searchTerm) {

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