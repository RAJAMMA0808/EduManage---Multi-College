import React, { useState, useEffect, useCallback } from 'react';
import { College, DashboardData, Role, User, StudentDetailsType } from '../types';
import { getDashboardData, getStudentDetails, getSubjects, getFilteredFacultyDetails, getFilteredStaffDetails } from '../services/api';
import { COLLEGE_NAMES, LATEST_ATTENDANCE_DATE, DEPARTMENTS, ACADEMIC_YEARS } from '../constants/index';
import MetricSection from './MetricSection';
import { DownloadIcon, UsersIcon, CheckCircleIcon, XCircleIcon, MenuIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon } from './icons';
import DashboardCard from './DashboardCard';

interface DashboardProps {
  user: User;
  onToggleSidebar: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  apiStatus: 'checking' | 'connected' | 'disconnected';
  dataVersion: number;
  selectedCollege: College;
  setSelectedCollege: (college: College) => void;
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedSemester: string;
  setSelectedSemester: (semester: string) => void;
  selectedRollNo: string;
  setSelectedRollNo: (rollNo: string) => void;
  onDownload: (purpose: string, options?: { facultyId?: string, staffId?: string, subject?: string }) => Promise<void>;
  isDownloading: boolean;
}

const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


const StudentDashboardView: React.FC<{ user: User, onToggleSidebar: () => void }> = ({ user, onToggleSidebar }) => {
    const [loading, setLoading] = useState(true);
    const [studentDetails, setStudentDetails] = useState<StudentDetailsType | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const details = await getStudentDetails(user.id);
            setStudentDetails(details);
            setLoading(false);
        };
        fetchDetails();
    }, [user.id]);

    if (loading || !studentDetails) {
        return <div className="flex-1 p-8 text-white flex items-center justify-center">Loading your details...</div>;
    }
    
    const totalDays = studentDetails.attendance.length;
    const fullDays = studentDetails.attendance.filter(a => a.morning === 'Present' && a.afternoon === 'Present').length;
    const halfDays = studentDetails.attendance.filter(a => (a.morning === 'Present' && a.afternoon === 'Absent') || (a.morning === 'Absent' && a.afternoon === 'Present')).length;
    const presentDays = fullDays + halfDays;
    const absentDays = totalDays - presentDays;
    const totalMarks = studentDetails.marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMaxMarks = studentDetails.marks.reduce((sum, m) => sum + m.maxMarks, 0);
    const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    
    const isPassing = studentDetails.marks.every(mark => {
        const internal = mark.internalMark ?? 0;
        const external = mark.externalMark ?? 0;
        const total = mark.marksObtained;
        return internal >= 14 && external >= 21 && total >= 40;
    });

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
                 <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Welcome, {user.name}!</h2>
                    <p className="text-slate-400 mt-1 text-sm">
                        {studentDetails.collegeCode} &bull; {studentDetails.programCode} &bull; {studentDetails.admissionNumber}
                    </p>
                </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg mb-8">
                <h3 className="text-lg font-semibold mb-4 text-white">My Attendance Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   <DashboardCard title="Total Days Tracked" value={totalDays} icon={<UsersIcon className="h-6 w-6 text-white"/>} color="blue" />
                   <DashboardCard title="Days Present" value={presentDays} icon={<CheckCircleIcon className="h-6 w-6 text-white"/>} color="green" />
                   <DashboardCard title="Days Absent" value={absentDays} icon={<XCircleIcon className="h-6 w-6 text-white"/>} color="red" />
                   <DashboardCard title="Half Days" value={halfDays} icon={<CheckCircleIcon className="h-6 w-6 text-white"/>} color="yellow" />
                </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-white">My Academic Record</h3>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-slate-300">Overall: {overallPercentage.toFixed(2)}%</span>
                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${isPassing ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{isPassing ? 'Passing' : 'Failing'}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Semester</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Subject</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Marks</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Result</th>
                        </tr>
                        </thead>
                        <tbody className="bg-slate-900 divide-y divide-slate-700">
                        {studentDetails.marks.map((mark, index) => {
                            const isPass = (mark.internalMark ?? 0) >= 14 && (mark.externalMark ?? 0) >= 21 && mark.marksObtained >= 40;
                            return (
                                <tr key={index} className="hover:bg-slate-800">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{mark.semester}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{mark.subjectName} ({mark.subjectCode})</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{mark.marksObtained} / {mark.maxMarks}</td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${isPass ? 'text-green-400' : 'text-red-400'}`}>{isPass ? 'Pass' : 'Fail'}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ 
    user, onToggleSidebar, selectedDate, setSelectedDate,
    selectedCollege, setSelectedCollege, selectedDepartment, setSelectedDepartment,
    selectedYear, setSelectedYear, selectedSemester, setSelectedSemester,
    selectedRollNo, setSelectedRollNo, onDownload, isDownloading, apiStatus
}) => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [selectedFacultyId, setSelectedFacultyId] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [viewType, setViewType] = useState('all');
    const [distributionData, setDistributionData] = useState<Record<string, DashboardData> | null>(null);

    const debouncedFacultyId = useDebounce(selectedFacultyId, 500);
    const debouncedStaffId = useDebounce(selectedStaffId, 500);
    const [facultyIdError, setFacultyIdError] = useState('');
    const [staffIdError, setStaffIdError] = useState('');

    const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
    const forcedDept = user.department || (user.id.match(/^[A-Z]([A-Z]{2,4})\d+/) ? user.id.match(/^[A-Z]([A-Z]{2,4})\d+/)?.[1] : null);

    if (user.role === Role.STUDENT) return <StudentDashboardView user={user} onToggleSidebar={onToggleSidebar} />;

    useEffect(() => {
        if (selectedFacultyId && selectedFacultyId.toUpperCase().includes('STF')) {
            setFacultyIdError('Invalid ID: A Staff ID was entered. Please enter a Faculty ID.');
        } else {
            setFacultyIdError('');
        }
    }, [selectedFacultyId]);

    useEffect(() => {
        if (selectedStaffId && selectedStaffId.length > 0 && !selectedStaffId.toUpperCase().includes('STF')) {
            setStaffIdError('Invalid ID: Staff ID must contain "STF".');
        } else {
            setStaffIdError('');
        }
    }, [selectedStaffId]);

    useEffect(() => {
        const fetchSubjects = async () => {
            if (selectedDepartment !== 'all' && selectedSemester !== 'all') {
                const subjects = await getSubjects(selectedCollege, selectedDepartment, selectedSemester);
                setAvailableSubjects(subjects);
                setSelectedSubject('All Subjects');
            } else {
                setAvailableSubjects([]);
                setSelectedSubject('All Subjects');
            }
        };
        fetchSubjects();
    }, [selectedCollege, selectedDepartment, selectedSemester]);
    
    // Filter Exclusivity Logic
    useEffect(() => {
        if (debouncedFacultyId) {
          setSelectedDepartment(forcedDept || 'all'); setSelectedYear('all'); setSelectedRollNo('all'); setSelectedStaffId('');
          setSelectedSemester('all'); setSelectedSubject('All Subjects');
        }
      }, [debouncedFacultyId, setSelectedDepartment, setSelectedYear, setSelectedRollNo, setSelectedStaffId, setSelectedSemester, forcedDept]);
      
      useEffect(() => {
          if (debouncedStaffId) {
            setSelectedDepartment(forcedDept || 'all'); setSelectedYear('all'); setSelectedRollNo('all'); setSelectedFacultyId('');
            setSelectedSemester('all'); setSelectedSubject('All Subjects');
          }
      }, [debouncedStaffId, setSelectedDepartment, setSelectedYear, setSelectedRollNo, setSelectedFacultyId, setSelectedSemester, forcedDept]);
    
      useEffect(() => {
        if (selectedDepartment !== 'all' || selectedYear !== 'all' || selectedRollNo !== 'all' || selectedSemester !== 'all' || selectedSubject !== 'All Subjects') {
          setSelectedFacultyId(''); setSelectedStaffId('');
        }
      }, [selectedDepartment, selectedYear, selectedRollNo, selectedSemester, selectedSubject, setSelectedFacultyId, setSelectedStaffId]);

    const fetchAllData = useCallback(async () => {
        const emptyData: DashboardData = {
          studentAttendance: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
          studentAcademics: { passPercentage: 0, passCount: 0, failCount: 0, aggregatePercentage: 0 },
          facultyMetrics: { total: 0, fullDay: 0, halfDay: 0, absent: 0 },
          staffMetrics: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
          placementMetrics: { totalStudents: 0, placedStudents: 0, notPlacedStudents: 0, placementPercentage: 0 },
          studentFees: { totalFees: 0, paidAmount: 0, dueAmount: 0, paidCount: 0, partialCount: 0, dueCount: 0 },
        };

        if (facultyIdError || staffIdError) {
          setDashboardData(emptyData);
          setDistributionData(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
            const mainDataPromise = getDashboardData(
                selectedCollege, selectedYear, selectedDepartment,
                selectedRollNo, debouncedFacultyId || 'all', debouncedStaffId || 'all',
                selectedDate, selectedDate, selectedSemester, selectedSubject
            );

            const distributionDataPromise = (selectedCollege === College.ALL && !debouncedFacultyId && !debouncedStaffId)
                ? Promise.all([
                    getDashboardData(College.BRIL, selectedYear, selectedDepartment, selectedRollNo, 'all', 'all', selectedDate, selectedDate, selectedSemester, selectedSubject),
                    getDashboardData(College.BRIG, selectedYear, selectedDepartment, selectedRollNo, 'all', 'all', selectedDate, selectedDate, selectedSemester, selectedSubject),
                    getDashboardData(College.KNRR, selectedYear, selectedDepartment, selectedRollNo, 'all', 'all', selectedDate, selectedDate, selectedSemester, selectedSubject)
                ]) : Promise.resolve(null);
            
            const [mainData, distributionResults] = await Promise.all([mainDataPromise, distributionDataPromise]);
            
            setDashboardData(mainData);

            if (distributionResults) {
                setDistributionData({
                    [College.BRIL]: distributionResults[0],
                    [College.BRIG]: distributionResults[1],
                    [College.KNRR]: distributionResults[2],
                });
            } else {
                setDistributionData(null);
            }

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            setDashboardData(emptyData);
        } finally {
            setLoading(false);
        }
    }, [selectedCollege, selectedYear, selectedDepartment, selectedRollNo, debouncedFacultyId, debouncedStaffId, selectedDate, selectedSemester, selectedSubject, facultyIdError, staffIdError]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleDownload = async () => {
        await onDownload('dashboard', {
            facultyId: debouncedFacultyId,
            staffId: debouncedStaffId,
            subject: selectedSubject,
        });
    };
    
    const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-slate-700 disabled:text-slate-400";
    const commonInputClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-slate-500 disabled:bg-slate-700 disabled:text-slate-400";
    
    const isIndividualFilterActive = !!debouncedFacultyId || !!debouncedStaffId;
    const isStudentFilterActive = (selectedDepartment !== 'all' && selectedDepartment !== forcedDept) || selectedYear !== 'all' || selectedRollNo !== 'all' || selectedSemester !== 'all' || selectedSubject !== 'All Subjects';

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}><MenuIcon className="h-6 w-6" /></button>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">Welcome back, {user.name}!</h2>
                        <p className="text-slate-400 mt-1 text-sm">{COLLEGE_NAMES[selectedCollege]}</p>
                    </div>
                </div>
                <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-400">Purpose:</label>
                        <select value={viewType} onChange={e => setViewType(e.target.value)} className={commonSelectClass}>
                            <option value="all">All Purposes</option>
                            <option value="student">Student Attendance</option>
                            <option value="academic">Academic Performance</option>
                            <option value="placement">Placement Statistics</option>
                            <option value="faculty">Faculty Metrics</option>
                            <option value="staff">Staff Metrics</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-400">Date:</label>
                        <div className="relative">
                            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 w-full pl-3 pr-2 py-2.5">
                                <span className="tabular-nums tracking-wider">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')}
                                </span>
                                <CalendarIcon className="h-5 w-5 text-slate-400 ml-3" />
                            </div>
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={e => setSelectedDate(e.target.value)} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Select date"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl shadow-lg mb-8">
                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center justify-between w-full text-left font-semibold text-white mb-4">
                    <span className="text-lg">Detailed Filters</span>
                    {isFilterOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </button>

                {isFilterOpen && (
                    <div className="pt-4 border-t border-slate-700 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                            <div><label className="block text-xs font-medium text-slate-400 mb-1">College</label>
                                <select name="college" value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value as College)} className={commonSelectClass} disabled={user.role !== Role.CHAIRMAN}>
                                    {Object.entries(COLLEGE_NAMES).map(([key, name]) => (<option key={key} value={key}>{name}</option>))}
                                </select>
                            </div>
                            <div><label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
                                <select 
                                    name="department" 
                                    value={selectedDepartment} 
                                    onChange={(e) => setSelectedDepartment(e.target.value)} 
                                    className={commonSelectClass} 
                                    disabled={isRestricted || isIndividualFilterActive}
                                >
                                    {isRestricted ? (
                                        <option value={forcedDept || 'all'}>{forcedDept || 'My Dept'}</option>
                                    ) : (
                                        <>
                                            <option value="all">All Departments</option>
                                            {DEPARTMENTS.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div><label className="block text-xs font-medium text-slate-400 mb-1">Year</label><select name="year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={commonSelectClass} disabled={isIndividualFilterActive}><option value="all">All</option>{ACADEMIC_YEARS.map(year => (<option key={year} value={year}>{`${year}-${parseInt(year) + 1}`}</option>))}</select></div>
                            <div><label className="block text-xs font-medium text-slate-400 mb-1">Semester</label><select name="semester" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className={commonSelectClass} disabled={isIndividualFilterActive}><option value="all">All</option>{Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (<option key={sem} value={sem}>{sem}</option>))}</select></div>
                             <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Roll No.</label>
                                <select name="rollNo" value={selectedRollNo} onChange={e => setSelectedRollNo(e.target.value)} className={commonSelectClass} disabled={isIndividualFilterActive}>
                                    <option value="all">All</option>
                                    {Array.from({ length: 60 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(rn => (
                                        <option key={rn} value={rn}>{rn}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1"><label className="block text-xs font-medium text-slate-400 mb-1">Subject</label><select name="subject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={availableSubjects.length === 0 || isIndividualFilterActive} className={commonSelectClass}><option value="All Subjects">All Subjects</option>{availableSubjects.map(sub => (<option key={sub} value={sub}>{sub}</option>))}</select></div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Faculty ID</label>
                                <input type="text" name="facultyId" value={selectedFacultyId} onChange={e => setSelectedFacultyId(e.target.value)} placeholder="Faculty ID" className={`${commonInputClass} ${facultyIdError ? 'border-red-500 ring-red-500' : ''}`} disabled={isStudentFilterActive}/>
                                {facultyIdError && <p className="mt-1 text-xs text-red-400">{facultyIdError}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Staff ID</label>
                                <input type="text" name="staffId" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} placeholder="Staff ID" className={`${commonInputClass} ${staffIdError ? 'border-red-500 ring-red-500' : ''}`} disabled={isStudentFilterActive}/>
                                {staffIdError && <p className="mt-1 text-xs text-red-400">{staffIdError}</p>}
                            </div>
                            <div className="flex justify-end"><button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:bg-slate-600"><DownloadIcon className="h-5 w-5" /><span>{isDownloading ? 'Downloading...' : 'Download'}</span></button></div>
                        </div>
                    </div>
                )}
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-slate-400">Loading data...</p>
                </div>
            ) : !dashboardData ? (
                 <div className="flex items-center justify-center h-64">
                    <p className="text-slate-400">No data to display for the current filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {(viewType === 'all' || viewType === 'student') && <MetricSection title="Student Attendance" metrics={dashboardData.studentAttendance} type="student" studentAttendanceMetrics={dashboardData.studentAttendance} />}
                    {(viewType === 'all' || viewType === 'academic') && <MetricSection title="Student Academic Performance" metrics={dashboardData.studentAcademics} type="academic" studentAttendanceMetrics={dashboardData.studentAttendance} />}
                    {(viewType === 'all' || viewType === 'placement') && <MetricSection title="Placement Statistics" metrics={dashboardData.placementMetrics} type="placement" />}
                    {(viewType === 'all' || viewType === 'faculty') && <MetricSection title="Faculty Metrics" metrics={dashboardData.facultyMetrics} type="faculty" />}
                    {(viewType === 'all' || viewType === 'staff') && <MetricSection title="Staff Metrics" metrics={dashboardData.staffMetrics} type="staff" />}
                    {(viewType === 'all' || viewType === 'studentFee') && <MetricSection title="Student Fee Status" metrics={dashboardData.studentFees} type="studentFee" studentAttendanceMetrics={dashboardData.studentAttendance} />}
                </div>
            )}
        </main>
    );
};

export default Dashboard;