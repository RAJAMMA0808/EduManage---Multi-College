import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, College, DashboardData, Role } from '../types/index';
import { getDashboardData } from '../services/api';
import { COLLEGE_NAMES, DEPARTMENTS, ACADEMIC_YEARS } from '../constants/index';
import { MenuIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from './icons';

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
    user, onToggleSidebar, selectedDate, setSelectedDate, dataVersion, 
    selectedCollege, setSelectedCollege, selectedYear, setSelectedYear
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonItem[]>([]);
    const [departmentData, setDepartmentData] = useState<ComparisonItem[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);

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
                const yearForApi = selectedYear || '';
                if (selectedCollege === College.ALL) {
                    const colleges: College[] = [College.BRIL, College.BRIG, College.KNRR];
                    const results = await Promise.all(
                        colleges.map(c => getDashboardData(c, yearForApi, '', '', '', '', selectedDate, selectedDate, '', 'All Subjects'))
                    );
                    setComparisonData(colleges.map((c, i) => ({ id: c, label: COLLEGE_NAMES[c], data: results[i] })));
                } else {
                    const deptDataPromises = DEPARTMENTS.map((dept: string) => getDashboardData(selectedCollege, yearForApi, dept, '', '', '', selectedDate, selectedDate, '', 'All Subjects'));
                    const deptResults = await Promise.all(deptDataPromises);
                    // FIX: Removed the filter that hides empty departments so user can see charts even if data is 0 for that year
                    setDepartmentData(DEPARTMENTS.map((dept, i) => ({ id: dept, label: dept, data: deptResults[i] })));
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

    const handleDownload = () => {
        setIsDownloading(true);

        const dataSet = isAllCollegesView ? comparisonData : departmentData;
        if (dataSet.length === 0) {
            alert('No data to download.');
            setIsDownloading(false);
            return;
        }

        const headers = [
            isAllCollegesView ? 'College' : 'Department',
            'Student Total', 'Student Present', 'Student Absent', 'Student HalfDay',
            'Academic Assessed', 'Academic Passed', 'Academic Failed',
            'Faculty Total', 'Faculty Present', 'Faculty Absent', 'Faculty HalfDay',
            'Staff Total', 'Staff Present', 'Staff Absent', 'Staff HalfDay',
            'Placement Total', 'Placement Placed',
            'Total Fees (INR)', 'Paid Fees (INR)', 'Due Fees (INR)',
            'Students Fully Paid', 'Students Partially Paid', 'Students with Dues'
        ];

        const rows = dataSet.map(item => {
            const d = item.data;
            return [
                `"${item.label}"`,
                d.studentAttendance.total,
                d.studentAttendance.present,
                d.studentAttendance.absent,
                d.studentAttendance.halfDay,
                d.studentAcademics.passCount + d.studentAcademics.failCount,
                d.studentAcademics.passCount,
                d.studentAcademics.failCount,
                d.facultyMetrics.total,
                d.facultyMetrics.fullDay + d.facultyMetrics.halfDay,
                d.facultyMetrics.absent,
                d.facultyMetrics.halfDay,
                d.staffMetrics.total,
                d.staffMetrics.present,
                d.staffMetrics.absent,
                d.staffMetrics.halfDay,
                d.placementMetrics.totalStudents,
                d.placementMetrics.placedStudents,
                d.studentFees.totalFees,
                d.studentFees.paidAmount,
                d.studentFees.dueAmount,
                d.studentFees.paidCount,
                d.studentFees.partialCount,
                d.studentFees.dueCount
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const viewName = isAllCollegesView ? 'all_colleges' : selectedCollege;
        const yearName = selectedYear || 'all_years';
        const filename = `${viewName}_comparison_${yearName}_${selectedDate}.csv`;
        link.setAttribute('download', filename);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsDownloading(false);
    };

    const renderCharts = () => {
        const dataSet = isAllCollegesView ? comparisonData : departmentData;
        const hasData = dataSet.length > 0;

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
        const handlePrevYear = () => setCalendarDate(new Date(year - 1, month, 1));
        const handleNextYear = () => setCalendarDate(new Date(year + 1, month, 1));
        const handleDayClick = (day: number) => {
            const newDate = new Date(year, month, day);
            setSelectedDate(formatDate(newDate));
            setIsCalendarOpen(false);
        };
    
        return (
            <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 p-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevYear} className="p-1 rounded-full hover:bg-slate-700 flex" title="Previous Year"><ChevronLeftIcon className="h-5 w-5"/><ChevronLeftIcon className="h-5 w-5 -ml-3"/></button>
                    <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-slate-700" title="Previous Month"><ChevronLeftIcon className="h-5 w-5"/></button>
                    <span className="font-semibold text-center flex-grow">{calendarDate.toLocaleString('default', { month: 'long' })} {year}</span>
                    <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-slate-700" title="Next Month"><ChevronRightIcon className="h-5 w-5"/></button>
                    <button onClick={handleNextYear} className="p-1 rounded-full hover:bg-slate-700 flex" title="Next Year"><ChevronRightIcon className="h-5 w-5"/><ChevronRightIcon className="h-5 w-5 -ml-3"/></button>
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
    
    // New compact select styling for the toolbar
    const compactSelectClass = "bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 min-w-[100px] cursor-pointer outline-none";

    return (
        <main className="p-4 md:p-8 bg-transparent overflow-y-auto">
             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
                </div>
                
                {/* Right Side Toolbar */}
                <div className="flex flex-wrap items-center gap-3 lg:ml-auto lg:justify-end">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                        {/* College Filter */}
                        <select 
                            id="college-filter" 
                            value={selectedCollege} 
                            onChange={e => setSelectedCollege(e.target.value as College)} 
                            className={compactSelectClass} 
                            disabled={user.role !== Role.CHAIRMAN}
                            aria-label="Select College"
                        >
                            {Object.entries(COLLEGE_NAMES)
                                .filter(([key]) => user.role === Role.CHAIRMAN || key === user.college)
                                .map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                        </select>
                        
                        {/* Academic Year Filter */}
                        <select 
                            id="year-filter" 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(e.target.value)} 
                            className={compactSelectClass}
                            aria-label="Select Academic Year"
                        >
                            <option value="all">Year: All</option>
                            {ACADEMIC_YEARS.map(year => (
                                <option key={year} value={year}>{`${year}-${parseInt(year) + 1}`}</option>
                            ))}
                        </select>

                        {/* Date Picker Trigger */}
                        <div ref={calendarRef} className="relative">
                            <div 
                                onClick={() => setIsCalendarOpen(prev => !prev)}
                                className={`${compactSelectClass} flex items-center justify-between gap-2 min-w-[130px]`}
                            >
                                <span className="truncate">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            {isCalendarOpen && renderCalendar()}
                            {/* Hidden input to ensure consistent state management if needed */}
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={e => setSelectedDate(e.target.value)} 
                                max={new Date().toISOString().split('T')[0]}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
                                aria-hidden="true"
                                tabIndex={-1}
                            />
                        </div>
                    </div>
                    
                    <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

                    <button 
                        onClick={handleDownload} 
                        disabled={isDownloading} 
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded transition disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap h-[34px]"
                    >
                        <DownloadIcon className="h-4 w-4" />
                        <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderCharts()}
            </div>
        </main>
    );
};

export default CollegeComparison;