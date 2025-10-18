import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const BarChart = ({ 
  data, 
  title, 
  dataKey = 'value', 
  xAxisKey = 'label',
  bars = [],
  height = 300,
  showLegend = true,
  currency = 'USD'
}) => {
  const formatValue = (value) => {
    if (typeof value === 'number') {
      const currencySymbol = currency === 'ARS' ? 'AR$' : 'U$';
      if (value >= 1000000) {
        return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${currencySymbol}${(value / 1000).toFixed(1)}K`;
      } else {
        return `${currencySymbol}${value.toFixed(2)}`;
      }
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 p-3 border border-white/10 rounded-lg shadow-lg">
          <p className="font-medium text-dark-100">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm text-dark-200">
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-6">
      {title && (
        <h3 className="text-lg font-medium text-dark-100 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey={xAxisKey} 
            stroke="#cbd5e1"
            fontSize={12}
            tick={{ fill: '#cbd5e1' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#cbd5e1"
            fontSize={12}
            tick={{ fill: '#cbd5e1' }}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ color: '#cbd5e1' }} />}
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.color}
              name={bar.name}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;