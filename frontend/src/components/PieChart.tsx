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
  const [clickedSlice, setClickedSlice] = useState<PieChartData | null>(null);

  const validData = data.filter(item => item.value > 0);
  const total = validData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-slate-500 w-full h-full" style={{ minHeight: `${size}px`}}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size/2} cy={size/2} r={(size/2) - 2} fill="#334155" stroke="#475569" strokeWidth="2" />
            </svg>
            <p className="text-xs mt-4 font-medium">No data available</p>
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

  const handleSliceClick = (e: React.MouseEvent, item: PieChartData) => {
    e.stopPropagation();
    setClickedSlice(prev => (prev?.name === item.name ? null : item));
  };

  return (
    <div className="flex flex-col items-center relative w-full">
      {hoveredSlice && (
        <div
          className="absolute -top-2 bg-slate-900 text-white text-xs px-2 py-1 rounded-md shadow-lg z-10 pointer-events-none"
          style={{ transform: 'translateY(-100%)' }}
          aria-live="polite"
        >
          {hoveredSlice.name}: {hoveredSlice.value} ({((hoveredSlice.value / total) * 100).toFixed(1)}%)
        </div>
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onMouseLeave={() => setHoveredSlice(null)} onClick={() => setClickedSlice(null)} className="cursor-pointer">
        {validData.map((item) => {
          const angle = (item.value / total) * 360;
          const currentCumulativeAngle = cumulativeAngle;
          
          const isClicked = clickedSlice?.name === item.name;

          let transform = 'scale(1)';
          if (isClicked) {
            const explodeDistance = 10;
            const midpointAngle = currentCumulativeAngle + angle / 2;
            const rad = (midpointAngle * Math.PI) / 180;
            const tx = Math.cos(rad) * explodeDistance;
            const ty = Math.sin(rad) * explodeDistance;
            transform = `translate(${tx}px, ${ty}px)`;
          }

          if (angle >= 359.99) { // Full circle case
             cumulativeAngle += angle;
             return (
              <circle
                key={item.name}
                cx={size / 2}
                cy={size / 2}
                r={size / 2}
                fill={item.color}
                onMouseEnter={() => setHoveredSlice(item)}
                onClick={(e) => handleSliceClick(e, item)}
                className="cursor-pointer transition-transform duration-300 ease-in-out"
                style={{ transform, transformOrigin: 'center center' }}
              />
            );
          }
          
          const [startX, startY] = getCoordinatesForAngle(currentCumulativeAngle, size / 2);
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
              key={item.name}
              d={pathData}
              fill={item.color}
              onMouseEnter={() => setHoveredSlice(item)}
              onClick={(e) => handleSliceClick(e, item)}
              className="cursor-pointer transition-transform duration-300 ease-in-out"
              style={{ transform, transformOrigin: 'center center' }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default PieChart;