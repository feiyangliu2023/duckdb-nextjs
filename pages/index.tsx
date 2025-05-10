import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  PolarAreaController
} from 'chart.js';

// Import components
import Header from '../components/Header';
import DatabaseInfo from '../components/DatabaseInfo';
import TablesCard from '../components/TablesCard';
import QueryPanel from '../components/QueryPanel';
import ChartDisplay from '../components/ChartDisplay';
import DataPreview from '../components/DataPreview';
import GlobalStyles from '../components/GlobalStyles';
import DatabaseFileUpload from '../components/DatabaseFileUpload';
import { ChartData, DatabaseInfo as DatabaseInfoType, ColumnSelection } from '../components/types';

// Import our client-side database service
import * as dbService from '../lib/db-service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  PolarAreaController
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'data visualization',
      font: {
        size: 18,
        family: "'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        weight: 'bold'
      },
      color: '#2D3748',
      padding: 20
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'type',
        font: {
          weight: 'bold',
        }
      },
      grid: {
        display: false
      }
    },
    y: {
      title: {
        display: true,
        text: 'value',
        font: {
          weight: 'bold',
        }
      },
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    }
  }
};

export default function Home() {
  const [query, setQuery] = useState<string>('SELECT name, value FROM items ORDER BY value DESC');
  const [chartData, setChartData] = useState<ChartData>({ labels: [], datasets: [] });
  const [error, setError] = useState<string | null>(null);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfoType>({ 
    connected: false, 
    path: ':memory:' 
  });
  const [tables, setTables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Separate state for preview data and query results
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  // New state for column selection
  const [columnSelection, setColumnSelection] = useState<ColumnSelection>({
    labelColumn: null,
    valueColumns: []
  });

  // Fetch database information
  const fetchDatabaseInfo = async () => {
    try {
      const info = await dbService.getDatabaseInfo();
      setDatabaseInfo(info);
      if (info.connected) {
        fetchTables();
      }
    } catch (err: any) {
      console.error('Error fetching database info:', err);
    }
  };

  // Fetch available tables in the database
  const fetchTables = async () => {
    try {
      const tablesData = await dbService.listTables();
      const tableNames = tablesData.map(t => t.name);
      setTables(tableNames);
      console.log('Available tables:', tableNames);
    } catch (err: any) {
      console.error('Error fetching tables:', err);
      setTables([]);
    }
  };

  // Open a database file
  const handleOpenDatabase = async () => {
    console.log('handleOpenDatabase called');
    setIsLoading(true);
    setQueryError(null);
    setPreviewError(null);
    setPreviewData(null);
    setQueryResults(null);
    setSelectedTable(null);
    setColumnSelection({ labelColumn: null, valueColumns: [] });
    
    try {
      // Create a simple prompt for the filename
      const filename = prompt("Enter database filename (e.g., mydb.duckdb):");
      if (!filename) {
        setIsLoading(false);
        return;
      }
      
      const result = await dbService.openDatabase(filename);
      
      if (result.success) {
        console.log(`Opened database: ${result.path}`);
        await fetchDatabaseInfo();
        // Clear previous chart data since we've switched databases
        setChartData({ labels: [], datasets: [] });
      } else {
        console.error('Failed to open database:', result.message);
        setQueryError(`Failed to open database: ${result.message}`);
      }
    } catch (err: any) {
      console.error('Error opening database:', err);
      setQueryError(`Error opening database: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload completion
  const handleFileUploaded = async (filename: string) => {
    setIsLoading(true);
    setQueryError(null);
    setPreviewError(null);
    setPreviewData(null);
    setQueryResults(null);
    setSelectedTable(null);
    setColumnSelection({ labelColumn: null, valueColumns: [] });
    
    try {
      const result = await dbService.openDatabase(filename);
      
      if (result.success) {
        console.log(`Opened uploaded database: ${result.path}`);
        await fetchDatabaseInfo();
        // Clear previous chart data since we've switched databases
        setChartData({ labels: [], datasets: [] });
      } else {
        console.error('Failed to open uploaded database:', result.message);
        setQueryError(`Failed to open database: ${result.message}`);
      }
    } catch (err: any) {
      console.error('Error opening uploaded database:', err);
      setQueryError(`Error opening database: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch data for query execution
  const fetchQueryData = async (sql: string) => {
    setQueryError(null);
    setIsLoading(true);
    try {
      console.log(`Executing query: ${sql}`);
      const result = await dbService.executeQuery(sql);
      console.log('Query result received:', result);
      
      // Set the raw query results
      setQueryResults(result);
      
      // Reset column selection when new query is executed
      setColumnSelection({
        labelColumn: null,
        valueColumns: []
      });
      
      // Clear the chart when a new query is run
      setChartData({ labels: [], datasets: [] });
      
      if (result && result.length === 0) {
        setQueryError('Empty result set');
      }
    } catch (err: any) {
      console.error('Error executing query:', err);
      setQueryError(`Error executing query: ${err.message}`);
      setQueryResults(null);
      setChartData({ labels: [], datasets: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate chart based on selected columns
  const generateChart = () => {
    if (!queryResults || queryResults.length === 0 || !columnSelection.labelColumn || columnSelection.valueColumns.length === 0) {
      setQueryError('there is no data to display');
      return;
    }

    try {
      const labelColumn = columnSelection.labelColumn;
      const labels = queryResults.map(row => String(row[labelColumn]));
      
      // Create datasets for each selected value column
      const datasets = columnSelection.valueColumns.map((column, index) => {
        const hue = (360 * index) / columnSelection.valueColumns.length;
        
        return {
          label: column,
          data: queryResults.map(row => Number(row[column]) || 0),
          backgroundColor: `hsla(${hue}, 70%, 60%, 0.7)`,
          borderColor: `hsla(${hue}, 70%, 45%, 1)`,
          borderWidth: 1,
        };
      });

      setChartData({
        labels,
        datasets
      });
      
      setQueryError(null);
    } catch (err: any) {
      console.error('Error generating chart:', err);
      setQueryError(`Error generating chart: ${err.message}`);
      setChartData({ labels: [], datasets: [] });
    }
  };

  // Function to fetch data for preview only
  const fetchPreviewData = async (tableName: string) => {
    setPreviewError(null);
    setIsLoading(true);
    try {
      const previewQuery = `SELECT * FROM ${tableName} LIMIT 20`;
      console.log(`Executing preview query: ${previewQuery}`);
      const result = await dbService.executeQuery(previewQuery);
      
      if (result && result.length > 0) {
        setPreviewData(result);
      } else {
        setPreviewData([]);
        setPreviewError('no data available for preview');
      }
    } catch (err: any) {
      console.error('Error fetching preview data:', err);
      setPreviewError(`Error fetching preveiw data: ${err.message}`);
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle table selection for preview
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    // Only fetch preview data, don't modify query
    fetchPreviewData(tableName);
  };

  // Generate example query for the selected table
  const generateExampleQuery = (tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 50`);
  };

  // Fetch initial database info on component mount
  useEffect(() => {
    fetchDatabaseInfo();
  }, []); // Empty dependency array means this runs once on mount

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleExecuteQuery = () => {
    fetchQueryData(query);
  };

  const handleColumnSelectionChange = (selection: ColumnSelection) => {
    setColumnSelection(selection);
  };

  return (
    <div className="app-container">
      <GlobalStyles />
      
      <Header />
      
      <div className="content-container">
        {/* Database info component */}
        <DatabaseInfo 
          databaseInfo={databaseInfo}
          onOpenDatabase={handleOpenDatabase}
          isLoading={isLoading}
        />
        
        {/* New Database File Upload component */}
        <DatabaseFileUpload
          onFileUploaded={handleFileUploaded}
          isLoading={isLoading}
        />
        
        {/* Tables card component */}
        <TablesCard
          tables={tables}
          onSelectTable={handleTableSelect}
        />

        {/* Data Preview component */}
        <DataPreview
          data={previewData}
          tableName={selectedTable}
          isLoading={isLoading}
          error={previewError}
        />

        {/* Query panel component with column selector */}
        <QueryPanel
          query={query}
          onQueryChange={handleQueryChange}
          onExecuteQuery={handleExecuteQuery}
          isLoading={isLoading}
          error={queryError}
          queryResults={queryResults}
          columnSelection={columnSelection}
          onColumnSelectionChange={handleColumnSelectionChange}
          onGenerateChart={generateChart}
        />

        {/* Chart display component */}
        <ChartDisplay
          chartData={chartData}
          error={queryError}
          options={options}
        />
      </div>
    </div>
  );
}

