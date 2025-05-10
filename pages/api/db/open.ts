import { NextApiRequest, NextApiResponse } from 'next';
import { openDatabase } from '../../../lib/duckdb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const result = await openDatabase(filename);
    res.status(200).json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Failed to open database',
      message: (error as Error).message
    });
  }
}