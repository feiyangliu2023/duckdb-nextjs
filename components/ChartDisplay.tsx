import React, { useState } from 'react';
import { Bar, Line, Pie, Doughnut, Scatter, Bubble, PolarArea, Radar } from 'react-chartjs-2';
import { ChartData } from './types';
import CardWrapper from './CardWrapper';

interface ChartDisplayProps {
  chartData: ChartData;
  error: string | null;
  options: any;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ chartData, error, options }) => {
  const [chartType, setChartType] = useState<string>('bar');

  // Render appropriate chart based on selected type
  const renderChart = () => {
    if (chartData.labels.length === 0) {
      return (
        <div className="no-data-message">
          {error ? 'failed to load data' : 'No data available'}
        </div>
      );
    }

    switch(chartType) {
      case 'line':
        return <Line options={options} data={chartData} />;
      case 'pie':
        return <Pie data={chartData} />;
      case 'doughnut':
        return <Doughnut data={chartData} />;
      case 'polarArea':
        return <PolarArea data={chartData} />;
      case 'radar':
        return <Radar data={chartData} />;
      case 'bar':
      default:
        return <Bar options={options} data={chartData} />;
    }
  };

  const chartTypes = [
    { value: 'bar', label: 'bar chart' },
    { value: 'line', label: 'line chart' },
    { value: 'pie', label: 'pie chart' },
    { value: 'doughnut', label: 'doughnut chart' },
    { value: 'polarArea', label: 'polar area chart' },
    { value: 'radar', label: 'radar chart' }
  ];

  // Only show chart selector if there's data
  const showChartTypeSelector = chartData.labels.length > 0;

  return (
    <CardWrapper title="Visualize result of search" className="chart-card">
      {showChartTypeSelector && (
        <div className="chart-controls">
          <div className="chart-type-selector">
            <label>Type of chart：</label>
            <select 
              value={chartType} 
              onChange={(e) => setChartType(e.target.value)}
              className="chart-select"
            >
              {chartTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="chart-container">
        {renderChart()}
      </div>
    </CardWrapper>
  );
};

export default ChartDisplay;