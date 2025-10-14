import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const PieChart = ({ 
  data, 
  title, 
  dataKey = 'value', 
  nameKey = 'name',
  height = 300,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
}) => {
  const formatValue = (value) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      } else {
        return `$${value.toFixed(2)}`;
      }
    }
    return value;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-dark-800 p-3 border border-white/10 rounded-lg shadow-lg">
          <p className="font-medium text-dark-100">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            Value: {formatValue(data.value)}
          </p>
          <p className="text-sm text-dark-300">
            Percentage: {data.payload.percentage?.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry) => {
    return `${entry.percentage?.toFixed(1)}%`;
  };

  return (
    <div className="card p-6">
      {title && (
        <h3 className="text-lg font-medium text-dark-100 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#cbd5e1' }} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;