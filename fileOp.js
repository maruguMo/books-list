import { promises as fs } from 'fs';
import path from 'path';
import 'dotenv/config';

async function clearTempFolder() {
  const tempFolderPath = path.resolve('public', process.env.DEFAULT_TEMP);
  
  try {
    const files = await fs.readdir(tempFolderPath);
    const deletePromises = files.map(file => fs.unlink(path.join(tempFolderPath, file)));
    await Promise.all(deletePromises);

    console.log('Temp folder cleared successfully.');
  } catch (error) {
    console.error('Error clearing temp folder:', error);
  }
}

export default clearTempFolder;