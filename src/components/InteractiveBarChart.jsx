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

const InteractiveBarChart = ({ 
  data, 
  title, 
  dataKey = 'value', 
  xAxisKey = 'label',
  bars = [],
  height = 300,
  showLegend = true,
  onSellerClick = null,
  selectedSeller = null
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


  return (
    <div className="card p-6 relative">
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
          {showLegend && <Legend wrapperStyle={{ color: '#cbd5e1' }} />}
          <Tooltip 
            content={(props) => {
              if (props.active && props.payload && props.payload.length) {
                const sellerData = data.find(item => item.label === props.label);
                return (
                  <div 
                    className="bg-dark-800 p-4 border border-white/10 rounded-lg shadow-lg max-w-xs"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="mb-3">
                      <p className="font-medium text-dark-100 text-lg">{props.label}</p>
                      <p className="text-sm text-dark-300">{sellerData?.sellerEmail || 'No email'}</p>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {props.payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm text-dark-200">
                          {entry.name}: {formatValue(entry.value)}
                        </p>
                      ))}
                    </div>
                    
                    {onSellerClick && sellerData && (
                      <div className="border-t border-white/10 pt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onSellerClick(sellerData);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                            selectedSeller?.sellerId === sellerData.sellerId
                              ? 'bg-primary-500 text-white'
                              : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
                          }`}
                        >
                          {selectedSeller?.sellerId === sellerData.sellerId
                            ? '✓ Selected - View Activity'
                            : 'View Activity'
                          }
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
            allowEscapeViewBox={{ x: false, y: false }}
            isAnimationActive={false}
            position={{ x: 'auto', y: 'auto' }}
            wrapperStyle={{ zIndex: 1000 }}
          />
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

export default InteractiveBarChart;