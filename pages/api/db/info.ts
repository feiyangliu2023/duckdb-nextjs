import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabaseInfo } from '../../../lib/duckdb';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const info = getDatabaseInfo();
    res.status(200).json(info);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Failed to get database info',
      message: (error as Error).message
    });
  }
}