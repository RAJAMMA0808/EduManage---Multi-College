
import React, { useMemo } from 'react';
import { DashboardData } from '../types/index';
import DashboardCard from './DashboardCard';
import PieChart from './PieChart';
import { AcademicCapIcon, CheckCircleIcon, UsersIcon, XCircleIcon, CurrencyDollarIcon } from './icons';

type MetricSectionProps = {
  title: string;
  metrics: DashboardData[keyof DashboardData];
  type: 'student' | 'academic' | 'faculty' | 'staff' | 'placement' | 'studentFee';
  studentAttendanceMetrics?: DashboardData['studentAttendance'];
}

interface LegendItem {
    name: string;
    value: number;
    color: string;
}

const formatCurrencyForCard = (value: number): string => {
    return `₹${value.toLocaleString('en-IN')}`;
};


const MetricSection: React.FC<MetricSectionProps> = ({ title, metrics, type, studentAttendanceMetrics }) => {
    
    const { items: pieData, total, totalLabel } = useMemo(() => {
        let items: LegendItem[] = [];
        let total = 0;
        let totalLabel = '';

        switch(type) {
            case 'student':
                const sa = metrics as DashboardData['studentAttendance'];
                items = [
                    { name: 'Full Day', value: sa.fullDay, color: '#10B981' },
                    { name: 'Half Day', value: sa.halfDay, color: '#F59E0B' },
                    { name: 'Absent', value: sa.absent, color: '#EF4444' },
                ];
                // SYNC: 'total' is now the sum of logs (e.g. 2 days), matching the slices sum
                total = sa.total;
                totalLabel = 'Total Days';
                break;
            case 'academic':
                const sc = metrics as DashboardData['studentAcademics'];
                const totalStudents = studentAttendanceMetrics?.total || sc.passCount + sc.failCount;
                const assessedStudents = sc.passCount + sc.failCount;
                const detainedCount = totalStudents > assessedStudents ? totalStudents - assessedStudents : 0;
                
                items = [
                    { name: 'Passed', value: sc.passCount, color: '#3B82F6' },
                    { name: 'Failed', value: sc.failCount, color: '#F97316' },
                    { name: 'Detained', value: detainedCount, color: '#6B7280' },
                ];
                total = totalStudents;
                totalLabel = 'Total Students';
                break;
            case 'placement':
                const pm = metrics as DashboardData['placementMetrics'];
                items = [
                    { name: 'Placed', value: pm.placedStudents, color: '#3B82F6' },
                    { name: 'Not Placed', value: pm.notPlacedStudents, color: '#6B7280' },
                ];
                total = pm.totalStudents;
                totalLabel = 'Total Students';
                break;
            case 'faculty':
                const fm = metrics as DashboardData['facultyMetrics'];
                items = [
                    { name: 'Full Day', value: fm.fullDay, color: '#8B5CF6' },
                    { name: 'Half Day', value: fm.halfDay, color: '#F59E0B' },
                    { name: 'Absent', value: fm.absent, color: '#EF4444' },
                ];
                total = fm.total;
                totalLabel = 'Total Faculty';
                break;
            case 'staff':
                const sm = metrics as DashboardData['staffMetrics'];
                items = [
                    { name: 'Full Day', value: sm.fullDay, color: '#10B981' },
                    { name: 'Half Day', value: sm.halfDay, color: '#F59E0B' },
                    { name: 'Absent', value: sm.absent, color: '#EF4444' },
                ];
                total = sm.total;
                totalLabel = 'Total Staff';
                break;
            case 'studentFee':
                const sf = metrics as DashboardData['studentFees'];
                const totalStudentsForFees = sf.paidCount + sf.partialCount + sf.dueCount;
                items = [
                    { name: 'Fully Paid', value: sf.paidCount, color: '#22C55E' },  
                    { name: 'Partial Payment', value: sf.partialCount, color: '#F59E0B' },
                    { name: 'Fees Due', value: sf.dueCount, color: '#EF4444' },
                ];
                total = studentAttendanceMetrics?.total || totalStudentsForFees;
                totalLabel = 'Total Students';
                break;
        }
        return { items, total, totalLabel };
    }, [metrics, type, studentAttendanceMetrics]);

    const borderColorClass = useMemo(() => {
        switch(type) {
            case 'student': return 'border-blue-500';
            case 'academic': return 'border-indigo-500';
            case 'placement': return 'border-indigo-500';
            case 'faculty': return 'border-violet-500';
            case 'staff': return 'border-green-500';
            case 'studentFee': return 'border-yellow-500';
            default: return 'border-slate-700';
        }
    }, [type]);
  
    const renderCards = () => {
        switch(type) {
            case 'student':
                const sa = metrics as DashboardData['studentAttendance'];
                // WEIGHTED LOGIC SYNC: Use cumulative overall percentage from backend (e.g. 75.0%)
                const overallAtt = (sa as any).overallPercentage ?? 0;
                return <>
                    <DashboardCard title="Attendance %" value={`${overallAtt.toFixed(1)}%`} icon={<CheckCircleIcon />} color="green" />
                    <DashboardCard title="Total Days" value={sa.total} icon={<UsersIcon />} color="blue" />
                    <DashboardCard title="Present Days" value={sa.present} icon={<CheckCircleIcon />} color="green" />
                    <DashboardCard title="Absent Days" value={sa.absent} icon={<XCircleIcon />} color="red" />
                </>;
            case 'academic':
                 const sc = metrics as DashboardData['studentAcademics'];
                 const marksPercentage = sc.aggregatePercentage ?? 0;

                return <>
                    <DashboardCard title="Marks %" value={`${marksPercentage.toFixed(1)}%`} icon={<AcademicCapIcon />} color="indigo" />
                    <DashboardCard title="Passed" value={sc.passCount} icon={<CheckCircleIcon />} color="green" />
                    <DashboardCard title="Failed" value={sc.failCount} icon={<XCircleIcon />} color="red" />
                    <DashboardCard title="Students (w/ marks)" value={sc.passCount + sc.failCount} icon={<UsersIcon />} color="blue" />
                </>;
            case 'placement':
                const pm = metrics as DashboardData['placementMetrics'];
                return <>
                    <DashboardCard title="Total Students" value={pm.totalStudents} icon={<UsersIcon />} color="blue" />
                    <DashboardCard title="Placed" value={pm.placedStudents} icon={<CheckCircleIcon />} color="green" />
                    <DashboardCard title="Placement %" value={`${pm.placementPercentage}%`} icon={<AcademicCapIcon />} color="indigo" />
                    <DashboardCard title="Not Placed" value={pm.notPlacedStudents} icon={<XCircleIcon />} color="red" />
                </>;
            case 'faculty':
                const fm = metrics as DashboardData['facultyMetrics'];
                return <>
                    <DashboardCard title="Total Faculty" value={fm.total} icon={<UsersIcon />} color="blue" />
                    <DashboardCard title="Full Day" value={fm.fullDay} icon={<CheckCircleIcon />} color="green" />
                    <DashboardCard title="Half Day" value={fm.halfDay} icon={<CheckCircleIcon />} color="yellow" />
                    <DashboardCard title="Absent" value={fm.absent} icon={<XCircleIcon />} color="red" />
                </>;
            case 'staff':
                const sm = metrics as DashboardData['staffMetrics'];
                return <>
                    <DashboardCard title="Total Staff" value={sm.total} icon={<UsersIcon />} color="blue" />
                    <DashboardCard title="Present" value={sm.present} icon={<CheckCircleIcon />} color="green" />
                    <DashboardCard title="Absent" value={sm.absent} icon={<XCircleIcon />} color="red" />
                    <DashboardCard title="Half Day" value={sm.halfDay} icon={<CheckCircleIcon />} color="yellow" />
                </>;
             case 'studentFee':
                const sf = metrics as DashboardData['studentFees'];
                return <>
                    <DashboardCard title="Total Fees (₹)" value={formatCurrencyForCard(sf.totalFees)} icon={<CurrencyDollarIcon />} color="blue" />
                    <DashboardCard title="Collected (₹)" value={formatCurrencyForCard(sf.paidAmount)} icon={<CheckCircleIcon />} color="green" />
                    <DashboardCard title="Due (₹)" value={formatCurrencyForCard(sf.dueAmount)} icon={<XCircleIcon />} color="red" />
                    <DashboardCard title="Students with Dues" value={sf.dueCount + sf.partialCount} icon={<UsersIcon />} color="yellow" />
                </>;
            default:
                return null;
        }
    };
    
    return (
    <div className="bg-slate-900 p-6 rounded-xl flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderCards()}
      </div>
      
      <div className={`mt-6 bg-slate-800 p-4 rounded-lg flex-1 flex flex-col items-center justify-center border-t-4 ${borderColorClass}`}>
        <div className="text-md font-semibold text-white mb-2">
            {type === 'studentFee' ? 'Student Status Distribution' : 'Distribution'}
        </div>
        <div className="flex justify-center items-center w-full">
            <PieChart data={pieData} size={180} />
        </div>
        <div className="mt-4 text-center w-full">
            <p className="text-sm text-slate-400 font-medium">
                {totalLabel}: <span className="font-bold text-slate-200">{total}</span>
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {pieData.map(item => {
                    if (total === 0 && item.value === 0) return null;
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                    return (
                        <div key={item.name} className="flex items-center">
                            <span className="h-2.5 w-2.5 rounded-full mr-1.5" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-400">{item.name}:</span>
                            <span className="font-semibold text-slate-200 ml-1">{item.value} ({percentage}%)</span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MetricSection;
