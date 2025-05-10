import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery, listTables, getConnection } from '../../../lib/duckdb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sql, dbPath } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }
    
    // Extract table name from the query to provide better error messages
    const tableMatch = sql.match(/\bFROM\s+([^\s;]+)/i);
    let targetTable = tableMatch ? tableMatch[1] : null;
    
    try {
      // Verify connection first
      await getConnection(dbPath);
      
      // Try to execute the query with specified database path if provided
      const results = await executeQuery(sql, [], dbPath);
      res.status(200).json({ results });
    } catch (queryError) {
      const errorMessage = (queryError as Error).message;
      // Check if the error is about a missing table
      const isTableNotFoundError = errorMessage.includes('not exist') || 
                                  errorMessage.includes('No table') || 
                                  errorMessage.includes('Unknown relation') ||
                                  errorMessage.includes('Catalog Error');
      
      if (isTableNotFoundError) {
        // Parse available tables from the error message if present
        const availableTables: string[] = [];
        const tablesMatch = errorMessage.match(/Available tables: (.*?)($|\n)/);
        
        if (tablesMatch && tablesMatch[1]) {
          tablesMatch[1].split(', ').filter(Boolean).forEach(table => {
            availableTables.push(table);
          });
        } else {
          // If not in error message, try to fetch available tables
          try {
            const tables = await listTables();
            tables.forEach((t: any) => {
              availableTables.push(t.name);
            });
          } catch (e) {
            console.error("Failed to get available tables:", e);
          }
        }
        
        return res.status(400).json({
          error: 'Table not found',
          message: errorMessage,
          targetTable,
          availableTables: availableTables.length > 0 ? availableTables : ['items']
        });
      } else {
        // For other types of errors
        return res.status(400).json({
          error: 'Query error',
          message: errorMessage
        });
      }
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Failed to execute query',
      message: (error as Error).message
    });
  }
}