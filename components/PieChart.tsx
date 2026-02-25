import React, { useState } from 'react';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

const PieChart: React.FC<PieChartProps> = ({ data, size = 150 }) => {
  const [hoveredSlice, setHoveredSlice] = useState<PieChartData | null>(null);
  const validData = data.filter(item => item.value > 0);
  const total = validData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-slate-500" style={{ height: `${size}px`, width: `${size}px`}}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size/2} cy={size/2} r={(size/2) - 2} fill="#334155" stroke="#475569" strokeWidth="2" />
            </svg>
            <p className="text-xs mt-4">No data available</p>
        </div>
    );
  }

  const getCoordinatesForAngle = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    const x = size / 2 + radius * Math.cos(rad);
    const y = size / 2 + radius * Math.sin(rad);
    return [x, y];
  };

  let cumulativeAngle = -90;

  return (
    <div className="flex flex-col items-center relative">
      {hoveredSlice && (
        <div
          className="absolute -top-1 bg-slate-950 text-white text-sm px-3 py-1 rounded-lg shadow-xl z-10 pointer-events-none"
          style={{ transform: 'translateY(-100%)' }}
          aria-live="polite"
        >
          {hoveredSlice.name}: {hoveredSlice.value} ({((hoveredSlice.value / total) * 100).toFixed(1)}%)
        </div>
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onMouseLeave={() => setHoveredSlice(null)}>
        {validData.map((item, index) => {
          const angle = (item.value / total) * 360;

          if (angle >= 359.99) { // Full circle case
             return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={size / 2}
                fill={item.color}
                onMouseEnter={() => setHoveredSlice(item)}
                className="cursor-pointer transition-transform duration-300 ease-in-out"
                style={{
                  transform: hoveredSlice === item ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center center'
                }}
              />
            );
          }
          
          const [startX, startY] = getCoordinatesForAngle(cumulativeAngle, size / 2);
          cumulativeAngle += angle;
          const [endX, endY] = getCoordinatesForAngle(cumulativeAngle, size / 2);

          const largeArcFlag = angle > 180 ? 1 : 0;

          const pathData = [
            `M ${size / 2},${size / 2}`,
            `L ${startX},${startY}`,
            `A ${size / 2},${size / 2} 0 ${largeArcFlag} 1 ${endX},${endY}`,
            'Z',
          ].join(' ');
          
          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              onMouseEnter={() => setHoveredSlice(item)}
              className="cursor-pointer transition-transform duration-300 ease-in-out"
              style={{
                transform: hoveredSlice === item ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'center center'
              }}
            />
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={index} className="flex items-center">
              <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
              <span className="text-slate-300">{item.name}: {item.value} ({percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PieChart;