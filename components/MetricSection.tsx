
import React from 'react';
import { DashboardData } from '../types';
import DashboardCard from './DashboardCard';
import PieChart from './PieChart';
import { AcademicCapIcon, CheckCircleIcon, UsersIcon, XCircleIcon } from './icons';

type MetricSectionProps = {
  title: string;
  metrics: DashboardData[keyof DashboardData];
  type: 'student' | 'academic' | 'faculty' | 'staff' | 'placement';
  studentAttendanceMetrics?: DashboardData['studentAttendance'];
}

interface LegendItem {
    name: string;
    value: number;
    color: string;
}


const MetricSection: React.FC<MetricSectionProps> = ({ title, metrics, type, studentAttendanceMetrics }) => {
    
    const getPieChartDataAndLegend = () => {
        let items: LegendItem[] = [];
        let total = 0;
        let totalLabel = '';

        switch(type) {
            case 'student':
                const sa = metrics as DashboardData['studentAttendance'];
                items = [
                    { name: 'Full Day', value: sa.fullDay, color: '#10B981' }, // Green
                    { name: 'Half Day', value: sa.halfDay, color: '#F59E0B' }, // Amber
                    { name: 'Absent', value: sa.absent, color: '#EF4444' },  // Red
                ];
                total = sa.total;
                totalLabel = 'Total Students';
                break;
            case 'academic':
                const sc = metrics as DashboardData['studentAcademics'];
                const totalStudents = studentAttendanceMetrics?.total || sc.passCount + sc.failCount;
                const assessedStudents = sc.passCount + sc.failCount;
                const notAssessed = totalStudents > assessedStudents ? totalStudents - assessedStudents : 0;
                
                items = [
                    { name: 'Passed', value: sc.passCount, color: '#3B82F6' },
                    { name: 'Failed', value: sc.failCount, color: '#F97316' },
                    { name: 'Not Assessed', value: notAssessed, color: '#475569' }, // slate-600
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
                    { name: 'Full Day', value: fm.fullDay, color: '#8B5CF6' },  // Purple
                    { name: 'Half Day', value: fm.halfDay, color: '#F59E0B' }, // Amber
                    { name: 'Absent', value: fm.absent, color: '#EF4444' },   // Red
                ];
                total = fm.total;
                totalLabel = 'Total Faculty';
                break;
            case 'staff':
                const sm = metrics as DashboardData['staffMetrics'];
                items = [
                    { name: 'Full Day', value: sm.fullDay, color: '#10B981' },   // Green
                    { name: 'Half Day', value: sm.halfDay, color: '#F59E0B' }, // Amber
                    { name: 'Absent', value: sm.absent, color: '#EF4444' },   // Red
                ];
                total = sm.total;
                totalLabel = 'Total Staff';
                break;
        }
        return { items, total, totalLabel };
    };
  
    const renderCards = () => {
        switch(type) {
            case 'student':
                const sa = metrics as DashboardData['studentAttendance'];
                return <>
                    <DashboardCard title="Total Students" value={sa.total} icon={<UsersIcon />} color="blue" />
                    <DashboardCard title="Present" value={sa.present} icon={<CheckCircleIcon />} color="green" />
                    <DashboardCard title="Absent" value={sa.absent} icon={<XCircleIcon />} color="red" />
                    <DashboardCard title="Half Day" value={sa.halfDay} icon={<CheckCircleIcon />} color="yellow" />
                </>;
            case 'academic':
                 const sc = metrics as DashboardData['studentAcademics'];
                 const assessedStudents = sc.passCount + sc.failCount;
                 const passPercentage = assessedStudents > 0 ? (sc.passCount / assessedStudents) * 100 : 0;

                return <>
                    <DashboardCard title="Pass %" value={`${passPercentage.toFixed(1)}%`} icon={<AcademicCapIcon />} color="indigo" />
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
            default:
                return null;
        }
    };
    
    const { items: pieData, total, totalLabel } = getPieChartDataAndLegend();

    return (
    <div className="bg-slate-900 p-6 rounded-xl flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderCards()}
      </div>
      <div className="mt-6 bg-slate-800 p-4 rounded-lg flex-1 flex flex-col items-center justify-center">
        <PieChart data={pieData} size={180} />
        <div className="mt-4 text-center w-full">
            <p className="text-sm text-slate-400 font-medium">
                {totalLabel}: <span className="font-bold text-slate-200">{total}</span>
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {pieData.map(item => {
                    if (total === 0 && item.value === 0) return null; // Don't show 0 value items if total is 0
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
