import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import { resolve as pathResolve } from 'path';
import { initDatabase } from '../../../lib/duckdb';
import { IncomingForm } from 'formidable';

// Define the data directory
const DB_DIR = pathResolve(process.cwd(), 'data');

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure DB_DIR exists
    try {
      await fs.mkdir(DB_DIR, { recursive: true });
      
      // Create meta directory if needed
      const metaDir = pathResolve(DB_DIR, 'meta');
      if (!await fs.stat(metaDir).catch(() => false)) {
        await fs.mkdir(metaDir, { recursive: true });
      }
    } catch (err) {
      console.warn('Error creating DB directory:', err);
    }

    // Parse the form data
    const form = new IncomingForm({
      uploadDir: DB_DIR,
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
      multiples: false, // One file at a time
    });

    // Create a promise wrapper for formidable
    const formDataPromise = new Promise<{fields: any, files: any}>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          return reject(err);
        }
        resolve({ fields, files });
      });
    });

    // Wait for the form data
    const { files } = await formDataPromise;
    const fileData = files.file;
    
    // Handle file formats from different versions of formidable
    const file = Array.isArray(fileData) ? fileData[0] : fileData;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create a safe filename based on the original name
    const originalFilename = file.originalFilename || 'database.duckdb';
    const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Get the temporary path where formidable stored the file
    const tempPath = file.filepath;
    
    // Define the final path
    const finalPath = pathResolve(DB_DIR, safeName);
    
    // Move the file from temp location to final location
    await fs.rename(tempPath, finalPath);
    
    // Try to connect to the database to verify it's a valid DuckDB file
    try {
      await initDatabase(safeName);  // Just pass the filename, not the full path
      return res.status(200).json({ 
        success: true, 
        filename: safeName,
        path: finalPath
      });
    } catch (dbError) {
      // If there's an error connecting to the database, remove the file
      await fs.unlink(finalPath).catch(console.error);
      return res.status(400).json({ 
        error: 'Invalid DuckDB database file', 
        details: (dbError as Error).message 
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: (error as Error).message
    });
  }
}