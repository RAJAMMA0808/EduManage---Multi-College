import React, { useMemo, useState } from 'react';

interface Bar {
    label: string;
    value: number;
    color: string;
}

interface SimpleBarChartProps {
    bars: Bar[];
}

interface TooltipState {
    visible: boolean;
    content: string;
    x: number;
    y: number;
}

const Tooltip: React.FC<{ tooltip: TooltipState }> = ({ tooltip }) => {
    if (!tooltip.visible) return null;
    return (
        <div 
            className="absolute z-20 px-3 py-1 text-sm font-semibold text-white bg-slate-950 rounded-md shadow-lg pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(10px, -100%)' }}
            aria-live="polite"
        >
            {tooltip.content}
        </div>
    );
};

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ bars }) => {
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, content: '', x: 0, y: 0 });
    const chartHeight = 150;
    const barWidth = 40;
    const barMargin = 25;
    const chartWidth = bars.length * (barWidth + barMargin);
    
    const maxValue = useMemo(() => {
        const maxVal = Math.max(...bars.map(b => b.value), 0);
        if (maxVal === 0) return 100;
        const top = maxVal * 1.2;
        const magnitude = Math.pow(10, Math.floor(Math.log10(top || 1)));
        const divisor = magnitude > 10 ? magnitude / 10 : 1;
        return Math.ceil(top / divisor) * divisor;
    }, [bars]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(1)} L`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)} K`;
        return value.toLocaleString('en-IN');
    };

    return (
        <div className="relative w-full overflow-x-auto">
            <Tooltip tooltip={tooltip} />
            <div className="flex justify-start items-end h-[200px] p-4 min-w-max" role="figure">
                <svg width={chartWidth} height={chartHeight} className="overflow-visible" aria-hidden="true">
                    {/* Y-Axis guide lines */}
                    {Array.from({ length: 4 }).map((_, i) => (
                        <line key={i} x1="0" y1={(chartHeight / 4) * i} x2="100%" y2={(chartHeight / 4) * i} stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                    ))}
                    <line x1="0" y1={chartHeight} x2="100%" y2={chartHeight} stroke="#475569" strokeWidth="1" />

                    {bars.map((bar, index) => {
                        const barHeight = maxValue > 0 ? (bar.value / maxValue) * chartHeight : 0;
                        const x = index * (barWidth + barMargin) + barMargin / 2;
                        const tooltipContent = `₹${bar.value.toLocaleString('en-IN')}`;

                        return (
                            <g key={bar.label}>
                                <rect
                                    x={x}
                                    y={chartHeight - barHeight}
                                    width={barWidth}
                                    height={barHeight}
                                    fill={bar.color}
                                    className="transition-opacity duration-200 hover:opacity-80"
                                    onMouseMove={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setTooltip({ visible: true, content: tooltipContent, x: rect.left + rect.width / 2, y: rect.top });
                                    }}
                                    onMouseLeave={() => setTooltip(t => ({...t, visible: false}))}
                                />
                                <text x={x + barWidth / 2} y={chartHeight - barHeight - 5} textAnchor="middle" fill={bar.color} fontSize="12" fontWeight="bold">
                                    {formatCurrency(bar.value)}
                                </text>
                                <text x={x + barWidth / 2} y={chartHeight + 18} textAnchor="middle" fill="#e2e8f0" fontSize="12">
                                    {bar.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default SimpleBarChart;