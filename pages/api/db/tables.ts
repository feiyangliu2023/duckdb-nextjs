import { NextApiRequest, NextApiResponse } from 'next';
import { listTables, getConnection } from '../../../lib/duckdb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract database path from query parameters if provided
    const dbPath = typeof req.query.dbPath === 'string' ? req.query.dbPath : undefined;
    
    // Connect to the specified database if a path was provided
    if (dbPath) {
      try {
        // Get connection ensures the database is loaded
        await getConnection(dbPath);
      } catch (connErr) {
        console.error('Error connecting to specified database:', connErr);
        // Continue anyway, as listTables has its own fallback mechanisms
      }
    }
    
    // List tables in the current (or specified) database
    const tables = await listTables();
    console.log(`Retrieved ${tables.length} tables from database`);
    
    res.status(200).json({ tables });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Failed to list tables',
      message: (error as Error).message
    });
  }
}