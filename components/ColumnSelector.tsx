import React from 'react';
import { ColumnSelection } from './types';

interface ColumnSelectorProps {
  columns: string[];
  columnSelection: ColumnSelection;
  onColumnSelectionChange: (selection: ColumnSelection) => void;
  onGenerateChart: () => void;
  disabled: boolean;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  columnSelection,
  onColumnSelectionChange,
  onGenerateChart,
  disabled
}) => {
  if (!columns || columns.length === 0) {
    return null;
  }

  const handleLabelColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === '' ? null : e.target.value;
    onColumnSelectionChange({
      ...columnSelection,
      labelColumn: value
    });
  };

  const handleValueColumnToggle = (column: string) => {
    const newValueColumns = columnSelection.valueColumns.includes(column)
      ? columnSelection.valueColumns.filter(c => c !== column)
      : [...columnSelection.valueColumns, column];
    
    onColumnSelectionChange({
      ...columnSelection,
      valueColumns: newValueColumns
    });
  };

  return (
    <div className="column-selector">
      <div className="selector-group">
        <label className="selector-label">Select x-axis label</label>
        <select
          value={columnSelection.labelColumn || ''}
          onChange={handleLabelColumnChange}
          className="column-select"
          disabled={disabled}
        >
          <option value="">-- Please select --</option>
          {columns.map(column => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-group">
        <span className="selector-label">Select value column(y-axis)：</span>
        <div className="column-checkboxes">
          {columns.map(column => (
            <label key={column} className="checkbox-label">
              <input
                type="checkbox"
                checked={columnSelection.valueColumns.includes(column)}
                onChange={() => handleValueColumnToggle(column)}
                disabled={disabled || column === columnSelection.labelColumn}
              />
              <span>{column}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        className="btn primary-btn generate-chart-btn"
        onClick={onGenerateChart}
        disabled={disabled || !columnSelection.labelColumn || columnSelection.valueColumns.length === 0}
      >
        Generate chart
      </button>

      <style jsx>{`
        .column-selector {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .selector-group {
          margin-bottom: 1rem;
        }
        
        .selector-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #4a5568;
        }
        
        .column-select {
          width: 100%;
          padding: 0.5rem;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
          font-size: 0.875rem;
          background-color: white;
          color: #4a5568;
          margin-bottom: 1rem;
        }
        
        .column-select:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 1px rgba(66, 153, 225, 0.5);
        }
        
        .column-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          background-color: #f7fafc;
          border-radius: 0.25rem;
          cursor: pointer;
          user-select: none;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        
        .checkbox-label:hover {
          background-color: #edf2f7;
        }
        
        .checkbox-label input {
          margin-right: 0.5rem;
        }
        
        .checkbox-label input:disabled + span {
          opacity: 0.5;
        }
        
        .generate-chart-btn {
          margin-top: 1rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default ColumnSelector;