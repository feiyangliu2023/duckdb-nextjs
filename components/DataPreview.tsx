import React from 'react';
import CardWrapper from './CardWrapper';

interface DataPreviewProps {
  data: any[] | null;
  tableName: string | null;
  isLoading: boolean;
  error: string | null;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, tableName, isLoading, error }) => {
  // Parse error message to extract available tables if present
  const parseAvailableTables = (): string[] => {
    if (!error) return [];
    
    const availableTablesMatch = error.match(/Available tables: (.*?)($|\n)/);
    if (availableTablesMatch && availableTablesMatch[1]) {
      return availableTablesMatch[1].split(', ').filter(Boolean);
    }
    return [];
  };
  
  const availableTables = parseAvailableTables();
  const isTableNotFoundError = error?.includes('Table not found') || 
                             error?.includes('does not exist') ||
                             error?.includes('Unknown relation');

  if (!data || data.length === 0) {
    return (
      <CardWrapper title="Data preview">
        <div className="data-preview-container">
          {isLoading ? (
            <div className="loading-state">Loading data...</div>
          ) : error ? (
            <div className="error-state">
              <div className="error-message">
                {isTableNotFoundError ? 'Table not found' : 'Error loading data'}
              </div>
              
              <div className="error-details">
                <p>Error: {error}</p>
                
                {isTableNotFoundError && availableTables.length > 0 && (
                  <div className="available-tables">
                    <p className="tables-header">Available tables:</p>
                    <div className="tables-list">
                      {availableTables.map(table => (
                        <span key={table} className="table-name">{table}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-data-message">
              select a table to preview data
            </div>
          )}
        </div>
        
        <style jsx>{`
          .data-preview-container {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 1rem;
          }
          
          .loading-state {
            color: #4299e1;
            font-weight: 500;
          }
          
          .error-state {
            width: 100%;
          }
          
          .error-message {
            color: #e53e3e;
            font-weight: 600;
            margin-bottom: 0.75rem;
          }
          
          .error-details {
            color: #4a5568;
            font-size: 0.875rem;
            background-color: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 0.375rem;
            padding: 1rem;
          }
          
          .available-tables {
            margin: 1rem 0;
          }
          
          .tables-header {
            font-weight: 500;
            margin-bottom: 0.5rem;
          }
          
          .tables-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .table-name {
            background-color: #edf2f7;
            color: #2d3748;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-family: monospace;
          }
          
          .no-data-message {
            text-align: center;
            color: #718096;
          }
        `}</style>
      </CardWrapper>
    );
  }

  // Get column names from first row
  const columns = Object.keys(data[0]);

  return (
    <CardWrapper title={`data preview: ${tableName}`}>
      <div className="data-preview-container">
        <div className="data-preview-info">
          <span className="preview-count">{data.length} row data</span>
          <span className="preview-count">{columns.length} column</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`}>{String(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <div className="more-data-note">
              Showing 10 lines of data, totally {data.length} lines
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};

export default DataPreview;