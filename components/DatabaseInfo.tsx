import React, { useState } from 'react';
import { DatabaseInfo as DatabaseInfoType } from './types';
import CardWrapper from './CardWrapper';
import { createDatabaseBackup } from '../lib/db-service';

interface DatabaseInfoProps {
  databaseInfo: DatabaseInfoType;
  onOpenDatabase: () => void;
  isLoading: boolean;
}

const DatabaseInfo: React.FC<DatabaseInfoProps> = ({ databaseInfo, onOpenDatabase, isLoading }) => {
  const [backupStatus, setBackupStatus] = useState<{
    isCreating: boolean;
    success: string | null;
    error: string | null;
  }>({
    isCreating: false,
    success: null,
    error: null,
  });

  const handleBackupDatabase = async () => {
    // Don't allow backing up in-memory database
    if (databaseInfo.path === ':memory:') {
      setBackupStatus({
        isCreating: false,
        success: null,
        error: "Cannot backup in-memory database",
      });
      return;
    }

    setBackupStatus({
      isCreating: true,
      success: null,
      error: null,
    });

    try {
      // Extract just the filename from the path
      const pathParts = databaseInfo.path.split(/[\/\\]/);
      const filename = pathParts[pathParts.length - 1];
      
      const result = await createDatabaseBackup(filename);
      
      if (result.success) {
        setBackupStatus({
          isCreating: false,
          success: `Backup created successfully at ${result.path}`,
          error: null,
        });
      } else {
        setBackupStatus({
          isCreating: false,
          success: null,
          error: result.message || "Failed to create backup",
        });
      }
    } catch (error) {
      setBackupStatus({
        isCreating: false,
        success: null,
        error: `Error: ${(error as Error).message}`,
      });
    }
  };

  const isMemoryDatabase = databaseInfo.path === ':memory:';

  return (
    <CardWrapper title="database info">
      <div className="database-info-content">
        <div className="database-info">
          <button 
            className="btn primary-btn"
            onClick={onOpenDatabase}
            disabled={isLoading || backupStatus.isCreating}
          >
            Select database file
          </button>
          
          {databaseInfo.connected && !isMemoryDatabase && (
            <button 
              className="btn backup-btn"
              onClick={handleBackupDatabase}
              disabled={isLoading || backupStatus.isCreating}
            >
              {backupStatus.isCreating ? 'Creating backup...' : 'Backup database'}
            </button>
          )}
          
          <div className="info-item">
            <span className="info-label">Current database:</span>
            <span className="info-value">{isMemoryDatabase ? 'memory database(demo)' : databaseInfo.path}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">connection status:</span>
            <span className={`connection-status ${databaseInfo.connected ? 'connected' : 'disconnected'}`}>
              {databaseInfo.connected ? 'connected' : 'disconnected'}
            </span>
          </div>
          
          {backupStatus.success && (
            <div className="success-message">
              {backupStatus.success}
            </div>
          )}
          
          {backupStatus.error && (
            <div className="error-message">
              {backupStatus.error}
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .database-info-content {
          /* Match the height with TablesCard */
          min-height: 245px; /* This height accounts for the content plus padding in the card */
          display: flex;
          flex-direction: column;
        }
        
        .database-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
        }
        
        .info-item {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .info-value {
          word-break: break-all;
        }
        
        /* Button styles */
        .primary-btn {
          margin-bottom: 0.5rem;
        }
        
        .backup-btn {
          background-color: #38a169;
          color: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .backup-btn:hover:not(:disabled) {
          background-color: #2f855a;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .backup-btn:disabled {
          background-color: #9ae6b4;
          cursor: not-allowed;
        }
        
        .success-message {
          background-color: #c6f6d5;
          color: #276749;
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          border: 1px solid #9ae6b4;
        }
        
        .error-message {
          background-color: #fed7d7;
          color: #9b2c2c;
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          border: 1px solid #feb2b2;
        }
      `}</style>
    </CardWrapper>
  );
};

export default DatabaseInfo;