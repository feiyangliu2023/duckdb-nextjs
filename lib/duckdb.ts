import * as duckdbApi from '@duckdb/node-api';
import { resolve } from 'path';
import * as fs from 'fs';

// Type definitions for the DuckDB API
type DuckDBInstance = {
  closeSync(): void;
  connect(): Promise<DuckDBConnection>;
};

type DuckDBConnection = {
  disconnectSync(): void;
  run(sql: string, params?: any[]): Promise<void>;
  runAndReadAll(sql: string): Promise<{ getRowObjects(): any[] }>;
  prepare(sql: string): Promise<{
    executeAll(params: any[]): Promise<{ getRowObjects(): any[] }>;
  }>;
};

// Interface for connection pool entry
interface PoolEntry {
  instance: DuckDBInstance;
  connection: DuckDBConnection;
  lastAccessed: number; // Timestamp of last access
}

// Global connection pool
const connectionPool: Map<string, PoolEntry> = new Map();

// Current active database
let currentDbPath: string | null = null;

// Max pool size and idle timeout in ms (15 minutes)
const MAX_POOL_SIZE = 10;
const IDLE_TIMEOUT = 15 * 60 * 1000;

// Directory for storing database files - use environment variable if available
const DB_DIR = process.env.DB_DATA_DIR ? resolve(process.cwd(), process.env.DB_DATA_DIR) : resolve(process.cwd(), 'data');

// Initialize directory if it doesn't exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });

  // Create a metadata folder for backups and logs
  const metaDir = resolve(DB_DIR, 'meta');
  if (!fs.existsSync(metaDir)) {
    fs.mkdirSync(metaDir, { recursive: true });
  }
}

// Cleanup idle connections periodically
setInterval(() => {
  const now = Date.now();
  // Use Array.from to safely iterate through the Map entries
  Array.from(connectionPool.entries()).forEach(([dbPath, entry]) => {
    if (now - entry.lastAccessed > IDLE_TIMEOUT) {
      console.log(`Closing idle connection for ${dbPath}`);
      try {
        entry.connection.disconnectSync();
        entry.instance.closeSync();
        connectionPool.delete(dbPath);
      } catch (error) {
        console.error(`Error closing idle connection for ${dbPath}:`, error);
      }
    }
  });
}, IDLE_TIMEOUT / 3); // Check every third of the timeout period

// Function to close connection if it exists - useful for reconnecting to files
export async function closeDatabase(dbPath?: string): Promise<boolean> {
  try {
    const pathToUse = dbPath ? resolve(DB_DIR, dbPath) : currentDbPath || ':memory:';
    
    if (connectionPool.has(pathToUse)) {
      console.log(`Explicitly closing connection for ${pathToUse}`);
      const entry = connectionPool.get(pathToUse)!;
      try {
        entry.connection.disconnectSync();
        entry.instance.closeSync();
        connectionPool.delete(pathToUse);
        
        // Reset current path if we're closing the current database
        if (pathToUse === currentDbPath) {
          currentDbPath = null;
        }
        
        return true;
      } catch (error) {
        console.error(`Error closing connection for ${pathToUse}:`, error);
        return false;
      }
    }
    return true; // No connection to close, so technically success
  } catch (error) {
    console.error('Error in closeDatabase:', error);
    return false;
  }
}

// Initialize DuckDB using the specified database path
export async function initDatabase(dbPath?: string): Promise<{
  instance: DuckDBInstance;
  connection: DuckDBConnection;
}> {
  try {
    // Use provided path or fallback to in-memory 
    // Special handling for in-memory database - don't resolve it with DB_DIR
    const fullPath = dbPath && dbPath !== ':memory:' ? resolve(DB_DIR, dbPath) : ':memory:';
    
    // Check if this database is already in the pool
    if (connectionPool.has(fullPath)) {
      console.log(`Reusing existing connection for ${fullPath}`);
      const entry = connectionPool.get(fullPath)!;
      entry.lastAccessed = Date.now();
      currentDbPath = fullPath;
      return { instance: entry.instance, connection: entry.connection };
    }
    
    // If we're switching databases, close any other connections first
    if (currentDbPath && currentDbPath !== fullPath && connectionPool.has(currentDbPath)) {
      console.log(`Switching database from ${currentDbPath} to ${fullPath}`);
      await closeDatabase();
    }
    
    // Close the least recently used connection if pool is at max size
    if (connectionPool.size >= MAX_POOL_SIZE) {
      let oldestPath: string | null = null;
      let oldestTime = Date.now();
      
      // Use Array.from to safely iterate through the Map entries
      Array.from(connectionPool.entries()).forEach(([path, entry]) => {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestPath = path;
        }
      });
      
      if (oldestPath) {
        console.log(`Closing oldest connection for ${oldestPath} to make room in pool`);
        await closeDatabase(oldestPath);
      }
    }

    console.log(`Opening database: ${fullPath}`);
    
    // Create a DuckDB instance with the provided file path
    const instance = await (duckdbApi as any).DuckDBInstance.create(fullPath) as DuckDBInstance;
    
    // Connect to the instance
    const connection = await instance.connect();
    
    // If using in-memory database, create sample data
    if (fullPath === ':memory:') {
      await connection.run(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY,
          name VARCHAR,
          value INTEGER
        );
        
        INSERT OR REPLACE INTO items (id, name, value) VALUES
          (1, 'Alpha', 10),
          (2, 'Bravo', 25),
          (3, 'Charlie', 5),
          (4, 'Delta', 30),
          (5, 'Echo', 15),
          (6, 'Foxtrot', 40),
          (7, 'Golf', 20);
      `);
    }
    
    // Create backup and maintenance tables if this is a file-based database
    if (fullPath !== ':memory:') {
      try {
        await connection.run(`
          CREATE TABLE IF NOT EXISTS _meta_backup_history (
            id INTEGER PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            backup_path VARCHAR,
            backup_size_bytes INTEGER,
            status VARCHAR
          );
          
          CREATE TABLE IF NOT EXISTS _meta_query_log (
            id INTEGER PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            query TEXT,
            execution_time_ms INTEGER,
            row_count INTEGER
          );
        `);
      } catch (err) {
        // If we can't create metadata tables, log but continue
        console.warn("Could not create metadata tables:", err);
      }
    }
    
    // Add to connection pool
    connectionPool.set(fullPath, {
      instance,
      connection,
      lastAccessed: Date.now()
    });
    
    currentDbPath = fullPath;
    console.log('DuckDB initialized successfully');
    
    return { instance, connection };
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error);
    throw error;
  }
}

// Get the current connection or initialize a new one
export async function getConnection(dbPath?: string): Promise<DuckDBConnection> {
  try {
    // Use specified dbPath, current path, or in-memory as fallback
    const pathToUse = dbPath ? dbPath : currentDbPath || ':memory:';
    
    // Handle in-memory database path specially - don't resolve it with the DB_DIR
    const fullPath = pathToUse === ':memory:' ? pathToUse : resolve(DB_DIR, pathToUse);

    // If we have this connection in the pool, update access time and return it
    if (connectionPool.has(fullPath)) {
      const entry = connectionPool.get(fullPath)!;
      entry.lastAccessed = Date.now();
      return entry.connection;
    }
    
    // Otherwise initialize a new connection
    console.log(`No existing connection found for ${fullPath}, initializing new one`);
    const { connection } = await initDatabase(pathToUse);
    return connection;
  } catch (error) {
    console.error('Error getting connection:', error);
    throw error;
  }
}

// Execute a query and return the results
export async function executeQuery(sql: string, params: any[] = [], dbPath?: string) {
  try {
    const startTime = Date.now();
    // Use the specified database path if provided
    const connection = await getConnection(dbPath);
    
    // Prepare statement if there are parameters
    if (params.length > 0) {
      const stmt = await connection.prepare(sql);
      const result = await stmt.executeAll(params);
      const rowsResult = result.getRowObjects();
      
      // Log query if not in-memory database
      if (currentDbPath && currentDbPath !== ':memory:') {
        try {
          await connection.run(`
            INSERT INTO _meta_query_log (query, execution_time_ms, row_count)
            VALUES (?, ?, ?)
          `, [sql, Date.now() - startTime, rowsResult.length]);
        } catch (logError) {
          console.warn('Failed to log query:', logError);
        }
      }
      
      return rowsResult;
    } else {
      // Direct execution for simple queries without parameters
      const result = await connection.runAndReadAll(sql);
      const rowsResult = result.getRowObjects();
      
      // Log query if not in-memory database
      if (currentDbPath && currentDbPath !== ':memory:') {
        try {
          await connection.run(`
            INSERT INTO _meta_query_log (query, execution_time_ms, row_count)
            VALUES (?, ?, ?)
          `, [sql, Date.now() - startTime, rowsResult.length]);
        } catch (logError) {
          console.warn('Failed to log query:', logError);
        }
      }
      
      return rowsResult;
    }
  } catch (error) {
    console.error('Database query error:', error);
    
    // Try to list available tables to provide more helpful error message
    const tableListError = await listTablesWithError();
    
    if (tableListError.tables && tableListError.tables.length > 0) {
      throw new Error(`${(error as Error).message} Available tables: ${tableListError.tables.join(', ')}`);
    } else {
      throw new Error(`Query failed: ${(error as Error).message}`);
    }
  }
}

// Helper function to list tables with error handling for better error messages
async function listTablesWithError() {
  try {
    const tables = await listTables();
    return { success: true, tables: tables.map((t: any) => t.name) };
  } catch (error) {
    return { success: false, error: String(error), tables: [] };
  }
}

// List tables in the current database with improved error handling
export async function listTables() {
  try {
    const connection = await getConnection();
    
    // Try these methods in sequence until one works
    const queryMethods = [
      // Method 1: SQLite style master table
      async () => {
        try {
          const result = await connection.runAndReadAll(
            `SELECT name, type FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE '_meta_%' AND name NOT LIKE 'sqlite_%'
            ORDER BY name;`
          );
          const tables = result.getRowObjects();
          if (tables.length > 0) return tables;
          throw new Error("No tables found in sqlite_master");
        } catch (err) {
          console.log("sqlite_master query failed:", err);
          throw err;
        }
      },
      
      // Method 2: DuckDB information schema
      async () => {
        try {
          const result = await connection.runAndReadAll(`
            SELECT table_name as name, 'table' as type 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_name;
          `);
          return result.getRowObjects();
        } catch (err) {
          console.log("information_schema query failed:", err);
          throw err;
        }
      },
      
      // Method 3: DuckDB SHOW TABLES command
      async () => {
        try {
          const result = await connection.runAndReadAll(`SHOW TABLES;`);
          return result.getRowObjects().map((t: any) => ({
            name: t.name || t.table_name,
            type: 'table'
          }));
        } catch (err) {
          console.log("SHOW TABLES query failed:", err);
          throw err;
        }
      },
      
      // Method 4: Try to list schemas then tables in each schema
      async () => {
        try {
          // Get schemas
          const schemasResult = await connection.runAndReadAll(`SHOW SCHEMAS;`);
          const schemas = schemasResult.getRowObjects();
          
          let allTables: any[] = [];
          
          for (const schema of schemas) {
            const schemaName = schema.name || schema.schema_name;
            if (!schemaName || schemaName === 'information_schema' || schemaName === 'pg_catalog') {
              continue;
            }
            
            try {
              const tablesResult = await connection.runAndReadAll(`SHOW TABLES IN ${schemaName};`);
              const tables = tablesResult.getRowObjects().map((t: any) => ({
                name: `${schemaName}.${t.name || t.table_name}`, 
                type: 'table'
              }));
              
              allTables = [...allTables, ...tables];
            } catch (err) {
              console.log(`Error listing tables in schema ${schemaName}:`, err);
              // Continue with other schemas
            }
          }
          
          return allTables;
        } catch (err) {
          console.log("Schema-based table listing failed:", err);
          throw err;
        }
      },
      
      // Method 5: Fallback to return at least 'items' for demo
      async () => {
        console.log("All table listing methods failed, returning default 'items' table");
        return [{ name: 'items', type: 'table' }];
      }
    ];
    
    // Try each method in sequence until one works
    for (const method of queryMethods) {
      try {
        const tables = await method();
        if (tables.length > 0) {
          return tables;
        }
      } catch (err) {
        // Continue to next method
      }
    }
    
    // If all methods fail, return empty array
    return [];
    
  } catch (error) {
    console.error('Error listing tables:', error);
    // Return at least the default 'items' table
    return [{ name: 'items', type: 'table' }];
  }
}

// Create a backup of the current database
export async function createBackup(dbPath: string): Promise<{ success: boolean; path?: string; message?: string }> {
  try {
    if (!dbPath || dbPath === ':memory:') {
      throw new Error('Cannot backup in-memory database');
    }
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${dbPath.replace(/\.[^/.]+$/, '')}_backup_${timestamp}.duckdb`;
    const backupPath = resolve(DB_DIR, 'meta', backupFileName);
    
    const fullSourcePath = resolve(DB_DIR, dbPath);
    const connection = await getConnection(dbPath);
    
    // Force checkpoint to make sure all changes are flushed to disk
    await connection.run('CHECKPOINT');
    
    // Copy the database file
    fs.copyFileSync(fullSourcePath, backupPath);
    
    const stats = fs.statSync(backupPath);
    
    // Log backup in the database
    await connection.run(`
      INSERT INTO _meta_backup_history (backup_path, backup_size_bytes, status)
      VALUES (?, ?, ?)
    `, [backupPath, stats.size, 'success']);
    
    console.log(`Database backup created at ${backupPath}`);
    
    return {
      success: true,
      path: backupPath
    };
  } catch (error) {
    console.error('Backup creation failed:', error);
    return {
      success: false,
      message: `Backup failed: ${(error as Error).message}`
    };
  }
}

// Get current database info
export function getDatabaseInfo() {
  return {
    connected: connectionPool.size > 0,
    path: currentDbPath || ':memory:'
  };
}

// Open a database file with improved error handling
export async function openDatabase(filePath: string) {
  try {
    console.log(`Opening database file: ${filePath}`);
    
    // First, close any existing connection to this database to start fresh
    await closeDatabase(filePath);
    
    // Handle path correctly - don't add DB_DIR to absolute paths
    let fullPath;
    if (filePath === ':memory:') {
      fullPath = ':memory:';
    } else if (filePath.includes(':\\') || filePath.startsWith('/')) {
      // Already an absolute path
      fullPath = filePath;
    } else {
      // Relative path - resolve against DB_DIR
      fullPath = resolve(DB_DIR, filePath);
    }
    
    console.log(`Resolved full path: ${fullPath}`);
    
    const isNewDb = fullPath !== ':memory:' && !fs.existsSync(fullPath);
    
    if (isNewDb) {
      console.log(`Creating new database file: ${fullPath}`);
      // Directory must exist for DuckDB to create the file
      const dirPath = fullPath.substring(0, Math.max(fullPath.lastIndexOf('/'), fullPath.lastIndexOf('\\')));
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
    
    // Initialize the database with the appropriate path
    const dbPath = filePath === ':memory:' ? ':memory:' : filePath;
    await initDatabase(dbPath);
    
    // Try to list tables to verify connection works
    try {
      const tables = await listTables();
      console.log(`Found ${tables.length} tables in database ${filePath}`);
      
      return {
        success: true,
        path: fullPath,
        isNew: isNewDb,
        tableCount: tables.length,
        tables: tables.map((t: any) => t.name)
      };
    } catch (tableError) {
      console.error('Error listing tables after opening database:', tableError);
      return {
        success: true, // Still return success since we opened the file
        path: fullPath,
        isNew: isNewDb,
        warning: 'Database opened but could not list tables'
      };
    }
  } catch (error) {
    console.error('Failed to open database:', error);
    return {
      success: false,
      message: `Failed to open database: ${(error as Error).message}`
    };
  }
}