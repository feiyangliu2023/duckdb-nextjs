// Database information type
export interface DatabaseInfo {
  connected: boolean;
  path: string;
}

// Chart data type
export interface ChartData {
  labels: string[];
  datasets: any[];
}

// Column selection type
export interface ColumnSelection {
  labelColumn: string | null;
  valueColumns: string[];
}