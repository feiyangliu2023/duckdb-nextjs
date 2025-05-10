import React, { useState } from 'react';
import CardWrapper from './CardWrapper';

interface TablesCardProps {
  tables: string[];
  onSelectTable: (tableName: string) => void;
}

const TablesCard: React.FC<TablesCardProps> = ({ tables, onSelectTable }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filter tables based on search term
  const filteredTables = tables.filter(table => 
    table.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <CardWrapper title="database tables">
      <div className="tables-card-content">
        <div className="table-search">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="search table"
            className="table-search-input"
          />
        </div>
        
        {tables.length > 0 ? (
          <>
            <div className="tables-container">
              {filteredTables.length > 0 ? (
                filteredTables.map(table => (
                  <button
                    key={table}
                    onClick={() => onSelectTable(table)}
                    className="table-btn"
                  >
                    {table}
                  </button>
                ))
              ) : (
                <div className="no-tables-found">No matching tables</div>
              )}
            </div>
            <p className="helper-text">Click table name to preview data</p>
          </>
        ) : (
          <div className="empty-state">
            <div className="no-tables-message">
              No tables found in the current database
            </div>
            <div className="table-help-message">
              <p>Possible reasons:</p>
              <ul>
                <li>Database file is empty</li>
                <li>Tables have non-standard names</li>
                <li>Database needs to be configured first</li>
              </ul>
              <p className="helper-tip">Try uploading a DuckDB file with tables or using the sample database.</p>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .tables-card-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .table-search {
          margin-bottom: 0.75rem;
        }
        
        .table-search-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        
        .table-search-input:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 1px rgba(66, 153, 225, 0.5);
        }
        
        .tables-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          overflow-y: auto;
          flex: 1;
          max-height: 180px; /* Fixed height for scrollable area */
          padding-right: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .no-tables-found {
          width: 100%;
          text-align: center;
          padding: 1rem;
          color: #718096;
          background-color: #f7fafc;
          border-radius: 0.375rem;
          border: 1px dashed #e2e8f0;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 1rem;
        }
        
        .no-tables-message {
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 1rem;
        }
        
        .table-help-message {
          font-size: 0.875rem;
          color: #718096;
          max-width: 100%;
        }
        
        .table-help-message ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          list-style-type: disc;
        }
        
        .table-help-message li {
          margin-bottom: 0.25rem;
        }
        
        .helper-tip {
          margin-top: 0.5rem;
          font-style: italic;
          color: #4299e1;
        }
        
        .table-btn {
          padding: 0.5rem 0.75rem;
          background-color: #edf2f7;
          color: #2d3748;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
          text-align: left;
          white-space: nowrap;
        }
        
        .table-btn:hover {
          background-color: #e2e8f0;
        }
        
        .table-btn:active {
          transform: translateY(1px);
        }
      `}</style>
    </CardWrapper>
  );
};

export default TablesCard;