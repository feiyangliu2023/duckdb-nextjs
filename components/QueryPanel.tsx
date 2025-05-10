import React from 'react';
import CardWrapper from './CardWrapper';
import ColumnSelector from './ColumnSelector';
import { ColumnSelection } from './types';

interface QueryPanelProps {
  query: string;
  onQueryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExecuteQuery: () => void;
  isLoading: boolean;
  error: string | null;
  queryResults: any[] | null;
  columnSelection: ColumnSelection;
  onColumnSelectionChange: (selection: ColumnSelection) => void;
  onGenerateChart: () => void;
}

const QueryPanel: React.FC<QueryPanelProps> = ({
  query,
  onQueryChange,
  onExecuteQuery,
  isLoading,
  error,
  queryResults,
  columnSelection,
  onColumnSelectionChange,
  onGenerateChart
}) => {
  // Get column names from the first result if available
  const columns = queryResults && queryResults.length > 0 ? Object.keys(queryResults[0]) : [];
  
  return (
    <CardWrapper title="SQL query">
      <div className="query-container">
        <input
          type="text"
          value={query}
          onChange={onQueryChange}
          placeholder="enter SQL query"
          className="query-input"
        />
        <button 
          className="btn primary-btn"
          onClick={onExecuteQuery}
          disabled={isLoading}
        >
          execute query
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {isLoading && <p className="loading-message">Processing...</p>}
      
      {/* SQL Query Results */}
      {queryResults && queryResults.length > 0 && (
        <div className="query-results">
          <h4 className="results-title">query result</h4>
          <div className="data-preview-info">
            <span className="preview-count">{queryResults.length} row data</span>
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
                {queryResults.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <td key={`${rowIndex}-${colIndex}`}>{String(row[column])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {queryResults.length > 10 && (
              <div className="more-data-note">
                Showing 10 lines, totally {queryResults.length} lines
              </div>
            )}
          </div>
          
          {/* Column Selector for Chart Visualization */}
          <ColumnSelector 
            columns={columns}
            columnSelection={columnSelection}
            onColumnSelectionChange={onColumnSelectionChange}
            onGenerateChart={onGenerateChart}
            disabled={isLoading}
          />
        </div>
      )}
      
      {queryResults && queryResults.length === 0 && (
        <div className="no-results-message">
          Query returned no results
        </div>
      )}
    </CardWrapper>
  );
};

export default QueryPanel;