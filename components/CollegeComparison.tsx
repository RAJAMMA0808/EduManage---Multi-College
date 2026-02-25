import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, College, DashboardData } from '../types/index';
import { getDashboardData } from '../services/api';
import { COLLEGE_NAMES, DEPARTMENTS, ACADEMIC_YEARS } from '../constants/index';
import { MenuIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

// --- Type Definitions ---
interface GroupedBarData {
    groupLabel: string;
    values: { key: string; value: number }[];
}

interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

interface ComparisonItem {
    id: string; 
    label: string;
    data: DashboardData;
}

// FIX: Update props to match what is passed from App.tsx
interface CollegeComparisonProps {
  user: User;
  onToggleSidebar: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dataVersion: number;
  selectedCollege: College;
  setSelectedCollege: (college: College) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
}


const formatDate = (date: Date) => date.toISOString().split('T')[0];

// --- Chart Components ---

const Tooltip: React.FC<{ tooltip: TooltipState }> = ({ tooltip }) => {
    if (!tooltip.visible) return null;
    return (
        <div 
            className="z-20 px-3 py-1 text-sm font-semibold text-white bg-slate-950 rounded-md shadow-lg"
            style={{ 
                position: 'fixed', 
                left: tooltip.x, 
                top: tooltip.y, 
                transform: 'translate(15px, -30px)',
                pointerEvents: 'none' 
            }}
            aria-live="polite"
        >
            {tooltip.content}
        </div>
    );
};

const YAxis: React.FC<{ height: number, maxValue: number, ticks?: number, formatLabel?: (value: number) => string }> = ({ height, maxValue, ticks = 4, formatLabel = (v) => String(v) }) => {
    if (maxValue === 0) {
        return (
            <g>
                <line x1="-5" y1={height} x2="100%" y2={height} stroke="#374151" strokeWidth="1" />
                <text x="-10" y={height + 5} textAnchor="end" fill="#94a3b8" fontSize="12">0</text>
            </g>
        );
    }
    const tickValues = Array.from({ length: ticks + 1 }, (_, i) => Math.round((maxValue / ticks) * i));

    return (
        <>
            {tickValues.map(val => (
                <g key={`y-axis-${val}`}>
                    <line x1="-5" y1={height - (val / maxValue) * height} x2="100%" y2={height - (val / maxValue) * height} stroke="#374151" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="-10" y={height - (val / maxValue) * height + 5} textAnchor="end" fill="#94a3b8" fontSize="12">
                        {formatLabel(val)}
                    </text>
                </g>
            ))}
        </>
    );
};

const GroupedBarChart: React.FC<{ data: GroupedBarData[], barColors: Record<string, string>, isCurrency?: boolean }> = ({ data, barColors, isCurrency = false }) => {
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, content: '', x: 0, y: 0 });
    const chartHeight = 200;
    const barWidth = 20;
    const barMargin = 5;
    const groupMargin = 40;
    
    const { groupWidth, chartWidth, maxValue } = useMemo(() => {
        if (!data[0]) return { groupWidth: 0, chartWidth: 0, maxValue: 100 };
        const groupWidth = data[0].values.length * (barWidth + barMargin);
        const chartWidth = data.length * (groupWidth + groupMargin);
        const maxVal = Math.max(...data.flatMap(g => g.values.map(v => v.value)), 0);
        
        const top = maxVal * 1.2;
        if (top === 0) return { groupWidth, chartWidth, maxValue: 10 };
        
        const magnitude = Math.pow(10, Math.floor(Math.log10(top || 1)));
        const divisor = magnitude > 10 ? magnitude / 10 : 1;
        const newMax = Math.ceil(top / divisor) * divisor;

        return { groupWidth, chartWidth, maxValue: newMax };
    }, [data]);

    const formatLabel = (value: number) => {
        if (!isCurrency) return value.toString();
        if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(1)} L`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)} K`;
        return value.toString();
    };

    return (
        <>
            <Tooltip tooltip={tooltip} />
            <div className="flex justify-start items-end h-[250px] p-4 min-w-max" role="figure">
                <svg width={chartWidth} height={chartHeight} className="overflow-visible" aria-hidden="true">
                    <YAxis height={chartHeight} maxValue={maxValue} formatLabel={formatLabel} />
                    {data.map((group, groupIndex) => {
                        const groupX = groupIndex * (groupWidth + groupMargin) + groupMargin / 2;
                        return (
                            <g key={group.groupLabel}>
                                {group.values.map((bar, barIndex) => {
                                    const barHeight = maxValue > 0 ? (bar.value / maxValue) * chartHeight : 0;
                                    const x = groupX + barIndex * (barWidth + barMargin);
                                    const tooltipContent = `${group.groupLabel} - ${bar.key}: ${isCurrency ? '₹' : ''}${bar.value.toLocaleString('en-IN')}`;
                                    return (
                                        <g key={bar.key}>
                                            <rect
                                                x={x}
                                                y={chartHeight - barHeight}
                                                width={barWidth}
                                                height={barHeight}
                                                fill={barColors[bar.key] || '#ccc'}
                                                className="transition-opacity duration-200 hover:opacity-80"
                                                onMouseMove={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setTooltip({ visible: true, content: tooltipContent, x: rect.left + rect.width / 2, y: rect.top });
                                                }}
                                                onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                                            />
                                            <text x={x + barWidth/2} y={chartHeight - barHeight - 5} textAnchor="middle" fill={barColors[bar.key] || '#ccc'} fontSize="10" fontWeight="bold">
                                                {formatLabel(bar.value)}
                                            </text>
                                        </g>
                                    );
                                })}
                                <text x={groupX + groupWidth / 2 - barMargin / 2} y={chartHeight + 20} textAnchor="middle" fill="#e2e8f0" fontSize="12">
                                    {group.groupLabel}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </>
    );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="overflow-x-auto">
            {children}
        </div>
    </div>
);

const Legend: React.FC<{ items: { label: string; color: string }[] }> = ({ items }) => (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm border-t border-slate-700 pt-4">
        {items.map(item => (
            <div key={item.label} className="flex items-center">
                <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300">{item.label}</span>
            </div>
        ))}
    </div>
);

const CollegeComparison: React.FC<CollegeComparisonProps> = ({ 
    onToggleSidebar, selectedDate, setSelectedDate, dataVersion, 
    selectedCollege, setSelectedCollege, selectedYear, setSelectedYear
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonItem[]>([]);
    const [departmentData, setDepartmentData] = useState<ComparisonItem[]>([]);

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date(selectedDate + 'T00:00:00'));
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);

    useEffect(() => {
        const fetchComparisonData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                if (selectedCollege === College.ALL) {
                    const params = [selectedYear, '', '', '', '', selectedDate, selectedDate, '', 'All Subjects'] as const;
                    const colleges: College[] = [College.BRIL, College.BRIG, College.KNRR];
                    const results = await Promise.all(colleges.map(c => getDashboardData(c, ...params)));
                    setComparisonData(colleges.map((c, i) => ({ id: c, label: COLLEGE_NAMES[c], data: results[i] })));
                } else {
                    const deptDataPromises = DEPARTMENTS.map((dept: string) => getDashboardData(selectedCollege, selectedYear, dept, '', '', '', selectedDate, selectedDate, '', 'All Subjects'));
                    const deptResults = await Promise.all(deptDataPromises);
                    setDepartmentData(DEPARTMENTS.map((dept, i) => ({ id: dept, label: dept, data: deptResults[i] })).filter(d => d.data.studentAttendance.total > 0 || d.data.facultyMetrics.total > 0));
                }
            } catch (err) {
                setError('Failed to load comparison data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchComparisonData();
    }, [selectedCollege, selectedYear, selectedDate, dataVersion]);
    
    const isAllCollegesView = selectedCollege === College.ALL;

    const renderCharts = () => {
        const dataSet = isAllCollegesView ? comparisonData : departmentData;
        const hasData = dataSet.some(d => d.data.studentAttendance.total > 0 || d.data.facultyMetrics.total > 0);

        if (loading) return <div className="col-span-full text-center py-16">Loading chart data...</div>;
        if (error) return <div className="col-span-full text-center py-16 text-red-400">{error}</div>;
        if (!hasData) return <div className="col-span-full text-center py-16 text-slate-400">No data available for the selected filters.</div>;

        const attendanceBarColors = { 'Total': '#94a3b8', 'Present': '#22c55e', 'Absent': '#ef4444', 'Half Day': '#eab308' };
        const academicsBarColors = { 'Total': '#94a3b8', 'Passed': '#3b82f6', 'Failed': '#f97316' };
        const placementBarColors = { 'Total': '#94a3b8', 'Placed': '#3b82f6' };
        const feeBarColors = { 'Total': '#94a3b8', 'Paid': '#22c55e', 'Due': '#ef4444' };
       
        const studentAttendanceData: GroupedBarData[] = dataSet.map(d => ({
            groupLabel: d.label,
            values: [
                { key: 'Total', value: d.data.studentAttendance.total },
                { key: 'Present', value: d.data.studentAttendance.present },
                { key: 'Absent', value: d.data.studentAttendance.absent },
                { key: 'Half Day', value: d.data.studentAttendance.halfDay },
            ]
        }));
        const studentAcademicsData: GroupedBarData[] = dataSet.map(d => ({
            groupLabel: d.label,
            values: [
                { key: 'Total', value: d.data.studentAcademics.passCount + d.data.studentAcademics.failCount },
                { key: 'Passed', value: d.data.studentAcademics.passCount },
                { key: 'Failed', value: d.data.studentAcademics.failCount },
            ]
        }));
         const facultyAttendanceData: GroupedBarData[] = dataSet.map(d => ({
            groupLabel: d.label,
            values: [
                { key: 'Total', value: d.data.facultyMetrics.total },
                { key: 'Present', value: d.data.facultyMetrics.fullDay + d.data.facultyMetrics.halfDay },
                { key: 'Absent', value: d.data.facultyMetrics.absent },
                { key: 'Half Day', value: d.data.facultyMetrics.halfDay },
            ]
        }));
        const staffAttendanceData: GroupedBarData[] = dataSet.map(d => ({
            groupLabel: d.label,
            values: [
                { key: 'Total', value: d.data.staffMetrics.total },
                { key: 'Present', value: d.data.staffMetrics.present },
                { key: 'Absent', value: d.data.staffMetrics.absent },
                { key: 'Half Day', value: d.data.staffMetrics.halfDay },
            ]
        }));
        const studentPlacementData: GroupedBarData[] = dataSet.map(d => ({
            groupLabel: d.label,
            values: [
                { key: 'Total', value: d.data.placementMetrics.totalStudents },
                { key: 'Placed', value: d.data.placementMetrics.placedStudents },
            ]
        }));
        const studentFeeData: GroupedBarData[] = dataSet.map(d => ({
            groupLabel: d.label,
            values: [
                { key: 'Total', value: d.data.studentFees.totalFees },
                { key: 'Paid', value: d.data.studentFees.paidAmount },
                { key: 'Due', value: d.data.studentFees.dueAmount },
            ]
        }));
        
        return <>
            <ChartCard title="Student Attendance"><GroupedBarChart data={studentAttendanceData} barColors={attendanceBarColors} /><Legend items={Object.entries(attendanceBarColors).map(([k,v])=>({label:k, color:v}))} /></ChartCard>
            <ChartCard title="Student Academics"><GroupedBarChart data={studentAcademicsData} barColors={academicsBarColors} /><Legend items={Object.entries(academicsBarColors).map(([k,v])=>({label:k, color:v}))} /></ChartCard>
            <ChartCard title="Faculty Attendance"><GroupedBarChart data={facultyAttendanceData} barColors={attendanceBarColors} /><Legend items={Object.entries(attendanceBarColors).map(([k,v])=>({label:k, color:v}))} /></ChartCard>
            <ChartCard title="Staff Attendance"><GroupedBarChart data={staffAttendanceData} barColors={attendanceBarColors} /><Legend items={Object.entries(attendanceBarColors).map(([k,v])=>({label:k, color:v}))} /></ChartCard>
            <ChartCard title="Student Placements"><GroupedBarChart data={studentPlacementData} barColors={placementBarColors} /><Legend items={Object.entries(placementBarColors).map(([k,v])=>({label:k, color:v}))} /></ChartCard>
            <ChartCard title="Student Fee Comparison (₹)"><GroupedBarChart data={studentFeeData} barColors={feeBarColors} isCurrency={true} /><Legend items={Object.entries(feeBarColors).map(([k,v])=>({label:k, color:v}))} /></ChartCard>
        </>
    };
    
    const renderCalendar = () => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
    
        const days = [
            ...Array(firstDayOfMonth).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
        ];
    
        const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
        const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
        const handleDayClick = (day: number) => {
            const newDate = new Date(year, month, day);
            setSelectedDate(formatDate(newDate));
            setIsCalendarOpen(false);
        };
    
        return (
            <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 p-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-slate-700"><ChevronLeftIcon className="h-5 w-5"/></button>
                    <span className="font-semibold">{calendarDate.toLocaleString('default', { month: 'long' })} {year}</span>
                    <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-slate-700"><ChevronRightIcon className="h-5 w-5"/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {days.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`} />;
                        const dayDateStr = formatDate(new Date(year, month, day));
                        const isSelected = dayDateStr === selectedDate;
                        const isToday = dayDateStr === formatDate(new Date());

                        const dayClass = `py-1.5 text-sm rounded-full cursor-pointer hover:bg-slate-700 ${isSelected ? 'bg-blue-600 text-white font-bold' : ''} ${isToday && !isSelected ? 'border border-slate-500' : ''}`;
                        return (
                            <div key={day} onClick={() => handleDayClick(day)} className={dayClass}>
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const title = isAllCollegesView ? 'College Performance Comparison' : `${COLLEGE_NAMES[selectedCollege]} - Department Comparison`;
    const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    return (
        <main className="p-4 md:p-8 bg-transparent overflow-y-auto">
             <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="college-filter" className="text-sm font-medium text-slate-400">College:</label>
                        <select id="college-filter" value={selectedCollege} onChange={e => setSelectedCollege(e.target.value as College)} className={commonSelectClass}>
                            {Object.entries(COLLEGE_NAMES).map(([key, name]) => <option key={key} value={key}>{name as React.ReactNode}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <label htmlFor="year-filter" className="text-sm font-medium text-slate-400">Academic Year:</label>
                        <select id="year-filter" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={commonSelectClass}>
                            <option value="">All Years</option>
                            {ACADEMIC_YEARS.map(year => (
                                <option key={year} value={year}>{`${year}-${parseInt(year) + 1}`}</option>
                            ))}
                        </select>
                    </div>
                    <div ref={calendarRef} className="relative flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-400">Date:</label>
                        <div 
                            onClick={() => setIsCalendarOpen(prev => !prev)}
                            className="flex items-center justify-between bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 w-full pl-3 pr-2 py-2.5 cursor-pointer"
                        >
                            <span className="tabular-nums tracking-wider">
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <CalendarIcon className="h-5 w-5 text-slate-400 ml-3" />
                        </div>
                        {isCalendarOpen && renderCalendar()}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderCharts()}
            </div>
        </main>
    );
};

export default CollegeComparison;
