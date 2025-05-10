// Client-side service for interacting with DuckDB through Next.js API routes
// This replaces the Electron IPC mechanism previously used

// Store current database path client-side for consistent queries
let currentDbPath: string | null = null;

/**
 * Execute a DuckDB query through the API
 */
export async function executeQuery(sql: string) {
  try {
    const response = await fetch('/api/db/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sql,
        dbPath: currentDbPath // Pass current database path to ensure consistency
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to execute query');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

/**
 * List all tables in the current database
 */
export async function listTables() {
  try {
    // Pass the current database path as a query parameter if available
    const url = currentDbPath 
      ? `/api/db/tables?dbPath=${encodeURIComponent(currentDbPath)}`
      : '/api/db/tables';
      
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list tables');
    }

    const data = await response.json();
    return data.tables;
  } catch (error) {
    console.error('List tables error:', error);
    throw error;
  }
}

/**
 * Get information about the current database connection
 */
export async function getDatabaseInfo() {
  try {
    const response = await fetch('/api/db/info');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get database info');
    }

    const info = await response.json();
    // Update the client-side path tracking
    if (info && info.path) {
      currentDbPath = info.path;
    }
    return info;
  } catch (error) {
    console.error('Database info error:', error);
    throw error;
  }
}

/**
 * Open a database file
 */
export async function openDatabase(filename: string) {
  try {
    const response = await fetch('/api/db/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to open database');
    }

    const result = await response.json();
    // Update client-side path tracking on successful open
    if (result && result.success && result.path) {
      currentDbPath = filename;
      console.log(`Client updated current database path to: ${currentDbPath}`);
    }
    return result;
  } catch (error) {
    console.error('Open database error:', error);
    throw error;
  }
}

/**
 * Create a backup of the current database
 */
export async function createDatabaseBackup(filename: string) {
  try {
    const response = await fetch('/api/db/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create backup');
    }

    return await response.json();
  } catch (error) {
    console.error('Create backup error:', error);
    throw error;
  }
}