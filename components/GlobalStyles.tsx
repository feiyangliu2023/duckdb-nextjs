import React from 'react';

const GlobalStyles: React.FC = () => {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      body {
        background-color: #f7fafc;
        color: #2d3748;
        line-height: 1.5;
      }
      
      .app-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      
      .header {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #2c5282;
        margin-bottom: 0.5rem;
      }
      
      .subtitle {
        color: #718096;
        font-size: 1.1rem;
      }
      
      .content-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      
      .card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
      }
      
      .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.07), 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      
      .card-header {
        background-color: #ebf4ff;
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .card-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #2c5282;
        margin: 0;
      }
      
      .card-content {
        padding: 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .database-info {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      .info-item {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .info-label {
        font-weight: 600;
        color: #4a5568;
        min-width: 100px;
      }
      
      .info-value {
        word-break: break-all;
      }
      
      .connection-status {
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
      }
      
      .connected {
        background-color: #c6f6d5;
        color: #276749;
      }
      
      .disconnected {
        background-color: #fed7d7;
        color: #9b2c2c;
      }
      
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 0.375rem;
        padding: 0.625rem 1.25rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.875rem;
      }
      
      .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .primary-btn {
        background-color: #4299e1;
        color: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .primary-btn:hover:not(:disabled) {
        background-color: #3182ce;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .tables-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      
      .table-btn {
        background-color: #edf2f7;
        color: #2d3748;
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
      }
      
      .table-btn:hover {
        background-color: #e2e8f0;
        color: #1a202c;
      }
      
      .helper-text {
        font-size: 0.875rem;
        color: #718096;
        margin-top: 0.5rem;
      }
      
      .query-container {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      
      .query-input {
        flex: 1;
        padding: 0.625rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }
      
      .query-input:focus {
        outline: none;
        border-color: #4299e1;
        box-shadow: 0 0 0 1px rgba(66, 153, 225, 0.5);
      }
      
      .error-message {
        color: #e53e3e;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background-color: #fff5f5;
        border-radius: 0.25rem;
      }
      
      .loading-message {
        color: #3182ce;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background-color: #ebf8ff;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
      }
      
      .loading-message::before {
        content: '';
        display: inline-block;
        width: 1rem;
        height: 1rem;
        margin-right: 0.5rem;
        border: 2px solid #90cdf4;
        border-top-color: #3182ce;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      .chart-card {
        grid-column: 1 / -1;
      }
      
      .chart-container {
        width: 100%;
        min-height: 300px;
        position: relative;
      }
      
      .no-data-message {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 300px;
        color: #718096;
        text-align: center;
        background-color: #f7fafc;
        border-radius: 0.25rem;
        border: 1px dashed #e2e8f0;
      }
      
      .chart-controls {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #edf2f7;
      }
      
      .chart-type-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .chart-select {
        padding: 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid #e2e8f0;
        font-size: 0.875rem;
        background-color: white;
        color: #4a5568;
      }
      
      .chart-select:focus {
        outline: none;
        border-color: #4299e1;
        box-shadow: 0 0 0 1px rgba(66, 153, 225, 0.5);
      }
      
      .data-preview-container {
        width: 100%;
        overflow: hidden;
      }
      
      .data-preview-info {
        margin-bottom: 1rem;
        display: flex;
        gap: 1rem;
      }
      
      .preview-count {
        background-color: #ebf8ff;
        color: #3182ce;
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        font-weight: 500;
      }
      
      .table-wrapper {
        width: 100%;
        overflow-x: auto;
        border-radius: 0.375rem;
        border: 1px solid #e2e8f0;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      
      .data-table th {
        background-color: #f7fafc;
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: #4a5568;
        border-bottom: 2px solid #e2e8f0;
        white-space: nowrap;
      }
      
      .data-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #edf2f7;
        color: #2d3748;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .data-table tr:last-child td {
        border-bottom: none;
      }
      
      .data-table tr:hover td {
        background-color: #f7fafc;
      }
      
      .more-data-note {
        padding: 0.5rem;
        font-size: 0.75rem;
        color: #718096;
        text-align: center;
        background-color: #f7fafc;
      }
      
      @media (min-width: 768px) {
        .content-container {
          grid-template-columns: repeat(2, 1fr);
        }
        
        /* Make sure top row cards have consistent height */
        .content-container > div:nth-child(1),
        .content-container > div:nth-child(2) {
          height: 300px; /* Match height for the first two cards */
        }
        
        /* Make sure the next row also has consistent height */
        .content-container > div:nth-child(3),
        .content-container > div:nth-child(4) {
          height: auto; /* Allow these to grow based on content */
          min-height: 300px; /* Minimum height */
        }
      }
      
      .query-results {
        margin-top: 1.5rem;
        border-top: 1px solid #edf2f7;
        padding-top: 1rem;
      }
      
      .results-title {
        font-size: 1rem;
        font-weight: 600;
        color: #3182ce;
        margin-bottom: 0.75rem;
      }
      
      .no-results-message {
        margin-top: 1rem;
        padding: 0.75rem;
        background-color: #f7fafc;
        border-radius: 0.25rem;
        color: #718096;
        text-align: center;
        border: 1px dashed #e2e8f0;
      }
    `}</style>
  );
};

export default GlobalStyles;