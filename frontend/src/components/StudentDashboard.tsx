
import React, { useState, useEffect, useMemo } from 'react';
import { User, StudentDetailsType, StudentFee } from '../types';
import { getStudentDetails } from '../services/api';
import { MenuIcon, DownloadIcon, UsersIcon, CheckCircleIcon, XCircleIcon, DocumentIcon } from './icons';
import DashboardCard from './DashboardCard';
import PieChart from './PieChart';
import StudentTranscript from './StudentTranscript';
import StudentAttendanceTranscript from './StudentAttendanceTranscript';
import StudentFeeTranscript from './StudentFeeTranscript';
import PlacementTranscript from './PlacementTranscript';
import { JNTUH_RULES, FEE_STRUCTURE } from '../constants';

interface StudentDashboardProps {
  user: User;
  onToggleSidebar: () => void;
}

const DonutChart: React.FC<{ percentage: number; status: string; }> = ({ percentage, status }) => {
    const size = 160;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const isFailing = status.toLowerCase() === 'failing' || status.toLowerCase() === 'detained';
    const color = isFailing ? '#EF4444' : '#22C55E';

    return (
        <div className="relative flex flex-col items-center justify-center gap-2">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle className="text-slate-700" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
                <circle stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dashoffset 0.5s ease-in-out'
                    }}
                />
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="text-3xl font-bold fill-white">
                    {percentage.toFixed(1)}%
                </text>
            </svg>
            <span className={`px-3 py-1 rounded-full font-bold text-xs ${isFailing ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{status}</span>
        </div>
    );
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onToggleSidebar }) => {
    const [loading, setLoading] = useState(true);
    const [studentDetails, setStudentDetails] = useState<StudentDetailsType | null>(null);
    const [academicYear, setAcademicYear] = useState('All Years');
    const [semester, setSemester] = useState('All Semesters');
    const [viewFilter, setViewFilter] = useState('all');
    const [printingWhat, setPrintingWhat] = useState<string | null>(null);
    const originalTitle = document.title;
    
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const details = await getStudentDetails(user.id);
            setStudentDetails(details);
            setLoading(false);
        };
        fetchDetails();
    }, [user.id]);

    const studentAcademicYears = useMemo(() => {
        const match = user.id.match(/[A-Z]+(\d{4})/);
        if (!match || !match[1]) return [];
        const startYear = parseInt(match[1], 10);
        return Array.from({ length: 4 }, (_, i) => `${startYear + i}-${startYear + i + 1}`);
    }, [user.id]);

    useEffect(() => {
        if (printingWhat && studentDetails) {
          document.title = `${studentDetails.admissionNumber}_${printingWhat}_report.pdf`;
          const handleAfterPrint = () => { document.title = originalTitle; setPrintingWhat(null); window.removeEventListener('afterprint', handleAfterPrint); };
          window.addEventListener('afterprint', handleAfterPrint);
          setTimeout(() => { window.print(); }, 100);
        }
    }, [printingWhat, studentDetails, originalTitle]);

    const handleDownload = () => { if (viewFilter !== 'all') setPrintingWhat(viewFilter); };

    const downloadButtonText = useMemo(() => {
        switch(viewFilter) {
          case 'attendance': return 'Download Attendance Report';
          case 'fee': return 'Download Tuition Fee Report';
          case 'examFee': return 'Download Exam Fee Report';
          case 'marks': return 'Download Marks Memo';
          case 'placement': return 'Download Placement Details';
          default: return 'Select Section to Download';
        }
    }, [viewFilter]);

    const formatTransactionDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
        } catch (e) { return dateString; }
    };

    const renderFeeSection = (title: string, data: StudentFee[]) => (
        <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
            <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Year</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Total (₹)</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Paid (₹)</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Due (₹)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Transaction Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {data.length > 0 ? data.map((f, i) => (
                                <tr key={i} className="hover:bg-slate-800/30">
                                    <td className="px-4 py-3 text-sm text-slate-200">{f.academicYear}</td>
                                    <td className="px-4 py-3 text-sm text-slate-200 text-right">{f.totalFees.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-sm text-slate-200 text-right">{f.paidAmount.toLocaleString('en-IN')}</td>
                                    <td className={`px-4 py-3 text-sm text-right font-bold ${f.dueAmount > 0 ? 'text-red-400' : 'text-slate-200'}`}>{f.dueAmount.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${f.status === 'Paid' ? 'bg-green-500/20 text-green-300' : f.status === 'Partial' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {f.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-400 text-right font-mono">{formatTransactionDate(f.paymentDate)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic text-sm">No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );

    const tuitionFeesData = useMemo(() => {
        if (!studentDetails) return [];
        let fees: StudentFee[] = studentDetails.fees.filter(f => f.feeType === 'Tuition' || !f.feeType);
        const adMatch = studentDetails.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
        if (adMatch) {
            const adYear = parseInt(adMatch[1], 10);
            for (let i = 0; i < 4; i++) {
                 const acYear = `${adYear + i}-${adYear + i + 1}`;
                 if (!fees.some(f => f.academicYear === acYear)) {
                     const total = FEE_STRUCTURE[studentDetails.programCode] || 0;
                     fees.push({ admissionNumber: studentDetails.admissionNumber, academicYear: acYear, semester: (i * 2) + 1, paymentDate: '', programCode: studentDetails.programCode, totalFees: total, paidAmount: 0, dueAmount: total, status: 'Due', feeType: 'Tuition' });
                 }
            }
        }
        if (academicYear !== 'All Years') fees = fees.filter(f => f.academicYear === academicYear);
        if (semester !== 'All Semesters') fees = fees.filter(f => f.semester === parseInt(semester, 10));
        
        fees.sort((a, b) => {
            if (a.academicYear !== b.academicYear) return a.academicYear.localeCompare(a.academicYear);
            return (a.paymentDate ? new Date(a.paymentDate).getTime() : 0) - (b.paymentDate ? new Date(b.paymentDate).getTime() : 0);
        });

        const results: StudentFee[] = [];
        const yearlyPaidMap = new Map<string, number>();
        for (const fee of fees) {
            const runningPaid = (yearlyPaidMap.get(fee.academicYear) || 0) + (fee.paidAmount || 0);
            yearlyPaidMap.set(fee.academicYear, runningPaid);
            const due = Math.max(0, fee.totalFees - runningPaid);
            results.push({ ...fee, dueAmount: due, status: due === 0 ? 'Paid' : (runningPaid > 0 ? 'Partial' : 'Due') });
        }
        return results.reverse();
    }, [studentDetails, academicYear, semester]);

    const examFeesData = useMemo(() => {
        if (!studentDetails) return [];
        let fees = studentDetails.fees.filter(f => f.feeType === 'Exam');
        if (academicYear !== 'All Years') fees = fees.filter(f => f.academicYear === academicYear);
        if (semester !== 'All Semesters') fees = fees.filter(f => f.semester === parseInt(semester, 10));
        return fees.sort((a, b) => (b.paymentDate ? new Date(b.paymentDate).getTime() : 0) - (a.paymentDate ? new Date(a.paymentDate).getTime() : 0));
    }, [studentDetails, academicYear, semester]);

    const filteredData = useMemo(() => {
        if (!studentDetails) return { marks: [], attendance: [] };
        let filteredMarks = studentDetails.marks;
        let filteredAttendance = studentDetails.attendance;
        const match = studentDetails.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
        const adYear = match ? parseInt(match[1], 10) : null;

        if (academicYear !== 'All Years' && adYear) {
            const startYear = parseInt(academicYear.split('-')[0], 10);
            const yearOffset = startYear - adYear;
            filteredMarks = filteredMarks.filter(m => m.semester === (yearOffset * 2 + 1) || m.semester === (yearOffset * 2 + 2));
            const sD = new Date(`${startYear}-07-01`), eD = new Date(`${startYear + 1}-06-30`);
            filteredAttendance = filteredAttendance.filter(a => { const d = new Date(a.date); return d >= sD && d <= eD; });
        }
        if (semester !== 'All Semesters') {
            const semNum = parseInt(semester, 10);
            filteredMarks = filteredMarks.filter(m => m.semester === semNum);
            if (adYear) {
                const yOff = Math.floor((semNum - 1) / 2);
                let sS, eS;
                if (semNum % 2 !== 0) { sS = new Date(`${adYear + yOff}-07-01`); eS = new Date(`${adYear + yOff}-12-31`); }
                else { eS = new Date(`${adYear + yOff + 1}-06-30`); sS = new Date(`${adYear + yOff + 1}-01-01`); }
                filteredAttendance = filteredAttendance.filter(a => { const d = new Date(a.date); return d >= sS && d <= eS; });
            }
        }
        return { marks: filteredMarks, attendance: filteredAttendance };
    }, [studentDetails, academicYear, semester]);

    const metrics = useMemo(() => {
        if (!studentDetails) return { totalDays: 0, presentDays: 0, absentDays: 0, halfDays: 0, distribution: [], marksPercentage: 0, attPercentage: 0, passStatus: 'N/A', attStatus: 'N/A' };
        const attSource = filteredData.attendance;
        let full = 0, half = 0, absent = 0;
        new Set(attSource.map(a => a.date)).forEach(date => {
            const day = attSource.find(a => a.date === date);
            if (day?.morning === 'Present' && day?.afternoon === 'Present') full++;
            else if (day?.morning === 'Present' || day?.afternoon === 'Present') half++;
            else absent++;
        });

        const totalMarks = filteredData.marks.reduce((sum, m) => sum + m.marksObtained, 0);
        const totalMax = filteredData.marks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
        const isFailing = filteredData.marks.some(m => !((m.internalMark ?? 0) >= JNTUH_RULES.INTERNAL_MIN && (m.externalMark ?? 0) >= JNTUH_RULES.EXTERNAL_MIN && m.marksObtained >= JNTUH_RULES.TOTAL_MIN));
        
        const totalAttDays = full + half + absent;
        // FIXED: Standardized Effective Presence (Full=1, Half=0.5)
        const effectiveAttDays = full + (0.5 * half);
        const attPercentage = totalAttDays > 0 ? (effectiveAttDays / totalAttDays) * 100 : 0;
        
        let attStatus = 'Normal';
        if (attPercentage >= 75) attStatus = 'Excellent';
        else if (attPercentage >= 65) attStatus = 'Condonation';
        else attStatus = 'Detained';

        return { 
            totalDays: totalAttDays, presentDays: effectiveAttDays, absentDays: absent, halfDays: half,
            distribution: [{ name: 'Full Day', value: full, color: '#10B981' }, { name: 'Half Day', value: half, color: '#F59E0B' }, { name: 'Absent', value: absent, color: '#EF4444' }],
            marksPercentage: totalMax > 0 ? (totalMarks / totalMax) * 100 : 0,
            attPercentage,
            passStatus: filteredData.marks.length === 0 ? 'N/A' : (isFailing ? 'Failing' : 'Passing'),
            attStatus: totalAttDays === 0 ? 'N/A' : attStatus
        };
    }, [filteredData, studentDetails]);

    if (loading || !studentDetails) return <div className="flex-1 p-8 text-white flex items-center justify-center">Loading dashboard...</div>;

    return (
        <>
            <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto print:hidden">
                <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}><MenuIcon className="h-6 w-6" /></button>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white">Welcome, {user.name}!</h2>
                            <p className="text-slate-400 mt-1 text-sm">{studentDetails.collegeCode} &bull; {studentDetails.programCode} &bull; {studentDetails.admissionNumber}</p>
                        </div>
                    </div>
                    <button onClick={handleDownload} disabled={viewFilter === 'all'} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-slate-500 transition-all shadow-lg">
                        <DownloadIcon className="h-5 w-5" />
                        <span>{downloadButtonText}</span>
                    </button>
                </header>

                <section className="bg-slate-900 p-6 rounded-xl shadow-lg mb-8 border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Dashboard Filters</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                            <option>All Years</option>
                            {studentAcademicYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <select value={semester} onChange={e => setSemester(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                            <option>All Semesters</option>
                            {Array.from({length: 8}, (_,i) => i+1).map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                        <select value={viewFilter} onChange={e => setViewFilter(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all">View All Sections</option>
                            <option value="attendance">Attendance</option>
                            <option value="fee">Tuition Fees</option>
                            <option value="examFee">Exam Fees</option>
                            <option value="marks">Marks</option>
                            <option value="placement">Placement</option>
                        </select>
                    </div>
                </section>

                {(viewFilter === 'all' || viewFilter === 'attendance') && (
                <section className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-white">My Attendance Summary</h3>
                    <div className="bg-slate-900 rounded-xl shadow-lg p-6 flex flex-col lg:flex-row gap-8 border border-slate-800">
                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <DashboardCard title="Total Days" value={metrics.totalDays} icon={<UsersIcon />} color="blue" />
                            <DashboardCard title="Present Days" value={metrics.presentDays} icon={<CheckCircleIcon />} color="green" />
                            <DashboardCard title="Absent Days" value={metrics.absentDays} icon={<XCircleIcon />} color="red" />
                            <DashboardCard title="Half Days" value={metrics.halfDays} icon={<CheckCircleIcon />} color="yellow" />
                        </div>
                        <div className="flex-shrink-0 lg:w-56 flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Attendance %</h4>
                            <DonutChart percentage={metrics.attPercentage} status={metrics.attStatus} />
                        </div>
                    </div>
                </section>
                )}

                {(viewFilter === 'all' || viewFilter === 'fee') && renderFeeSection('Tuition Fee Summary', tuitionFeesData)}
                {(viewFilter === 'all' || viewFilter === 'examFee') && renderFeeSection('Exam Fee Summary', examFeesData)}
                
                {(viewFilter === 'all' || viewFilter === 'marks') && (
                <section className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-white">My Academic Performance</h3>
                    <div className="bg-slate-900 rounded-xl shadow-lg p-6 flex flex-col lg:flex-row gap-8 border border-slate-800">
                        <div className="flex-grow overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Semester</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Subject</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Internal</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">External</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Total</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                {filteredData.marks.map((mark, idx) => {
                                    const pass = (mark.internalMark ?? 0) >= JNTUH_RULES.INTERNAL_MIN && (mark.externalMark ?? 0) >= JNTUH_RULES.EXTERNAL_MIN && mark.marksObtained >= JNTUH_RULES.TOTAL_MIN;
                                    return (
                                    <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="px-4 py-3 text-sm text-slate-200 text-center">{mark.semester}</td>
                                        <td className="px-4 py-3 text-sm text-slate-200">{mark.subjectName}</td>
                                        <td className="px-4 py-3 text-sm text-slate-200 text-center">{mark.internalMark ?? '-'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-200 text-center">{mark.externalMark ?? '-'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-200 text-center font-bold">{mark.marksObtained}</td>
                                        <td className={`px-4 py-3 text-sm font-bold text-center ${pass ? 'text-green-400' : 'text-red-400'}`}>{pass ? 'Pass' : 'Fail'}</td>
                                    </tr>);
                                })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex-shrink-0 lg:w-56 flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Marks %</h4>
                            <DonutChart percentage={metrics.marksPercentage} status={metrics.passStatus} />
                        </div>
                    </div>
                </section>
                )}
            </main>
            <div className="hidden print:block">
              {printingWhat === 'marks' && <StudentTranscript student={studentDetails} selectedSemester={semester} selectedAcademicYear={academicYear} />}
              {printingWhat === 'attendance' && <StudentAttendanceTranscript student={studentDetails} selectedSemester={semester} selectedAcademicYear={academicYear} />}
              {printingWhat === 'fee' && <StudentFeeTranscript student={studentDetails} selectedSemester={semester} selectedAcademicYear={academicYear} feeType="Tuition" />}
              {printingWhat === 'examFee' && <StudentFeeTranscript student={studentDetails} selectedSemester={semester} selectedAcademicYear={academicYear} feeType="Exam" />}
              {printingWhat === 'placement' && studentDetails.placementDetails && <PlacementTranscript student={studentDetails} placement={studentDetails.placementDetails} />}
            </div>
        </>
    );
};

export default StudentDashboard;
