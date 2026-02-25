

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, StudentWithAttendance, College, Role, StudentDetailsType } from '../types/index';
import { searchStudentAttendance, getStudentDetails } from '../services/api';
// FIX: Add DownloadIcon import
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, ChevronUpDownIcon, MenuIcon, XMarkIcon, DownloadIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS, ACADEMIC_YEARS } from '../constants/index';
import StudentDetails from './StudentDetails';
import JntuhAttendanceRules from './JntuhAttendanceRules';

// FIX: Add missing props for download functionality and shared filters.
interface StudentAttendanceProps {
  user: User;
  onToggleSidebar: () => void;
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
  onDownload: (purpose: string) => void;
  isDownloading: boolean;
}

type SortKey = keyof StudentWithAttendance;
type SortOrder = 'asc' | 'desc';

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

const SearchInput: React.FC<{ id: string, label: string, query: string, setQuery: (q: string) => void, placeholder: string }> = ({ id, label, query, setQuery, placeholder }) => (
  <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-slate-400" /></div>
          <input id={id} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="block w-full pl-10 pr-10 py-2 border border-slate-600 rounded-md bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          {query && <button onClick={() => setQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center"><XMarkIcon className="h-5 w-5 text-slate-400 hover:text-slate-200" /></button>}
      </div>
  </div>
);

const TableHeader: React.FC<{ 
  sortKey: SortKey, 
  label: string, 
  sortConfig: { key: SortKey; order: SortOrder; } | null,
  requestSort: (key: SortKey) => void 
}> = ({ sortKey, label, sortConfig, requestSort }) => {
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronUpDownIcon className="h-4 w-4 text-slate-400 inline-block ml-1" />;
    return sortConfig.order === 'asc' ? <ChevronUpIcon className="h-4 w-4 text-slate-200 inline-block ml-1" /> : <ChevronDownIcon className="h-4 w-4 text-slate-200 inline-block ml-1" />;
  };

  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort(sortKey)} aria-sort={sortConfig?.key === sortKey ? (sortConfig.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <div className="flex items-center">{label}{getSortIndicator(sortKey)}</div>
    </th>
  );
};


const StudentAttendanceView: React.FC<StudentAttendanceProps> = ({ 
  user, 
  onToggleSidebar,
  selectedCollege,
  setSelectedCollege,
  selectedDepartment,
  setSelectedDepartment,
  selectedYear,
  setSelectedYear,
  selectedSemester,
  setSelectedSemester,
  selectedRollNo,
  setSelectedRollNo,
  onDownload,
  isDownloading
}) => {
  const [nameQuery, setNameQuery] = useState('');
  const [admissionNoQuery, setAdmissionNoQuery] = useState('');
  const [results, setResults] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder } | null>({ key: 'studentName', order: 'asc' });
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailsType | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const debouncedNameQuery = useDebounce(nameQuery, 250);
  const debouncedAdmissionNoQuery = useDebounce(admissionNoQuery, 250);

  const fetchStudents = useCallback(async () => {
    const isSearchActive = debouncedNameQuery || debouncedAdmissionNoQuery;
    const areFiltersActive = (user.role === Role.CHAIRMAN && selectedCollege !== College.ALL) || 
                             selectedDepartment !== '' || 
                             selectedYear !== '' || 
                             selectedSemester !== '' || 
                             selectedRollNo !== '';

    if (!isSearchActive && !areFiltersActive) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const studentResults = await searchStudentAttendance(
        { name: debouncedNameQuery, admissionNumber: debouncedAdmissionNoQuery },
        selectedCollege,
        selectedDepartment,
        selectedYear,
        selectedSemester,
        selectedRollNo
      );
      setResults(studentResults);
    } catch (err) {
      console.error("Failed to search student attendance:", err);
      setError('Failed to fetch student data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user.role, debouncedNameQuery, debouncedAdmissionNoQuery, selectedCollege, selectedDepartment, selectedYear, selectedSemester, selectedRollNo]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleRowClick = async (admissionNumber: string) => {
    setModalLoading(true);
    setSelectedStudent(null);
    try {
      const details = await getStudentDetails(admissionNumber);
      setSelectedStudent(details);
    } catch (err) { console.error("Failed to get student details:", err);
    } finally { setModalLoading(false); }
  };

  const sortedResults = useMemo(() => {
    let sortableItems = [...results];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const key = sortConfig.key;
            const order = sortConfig.order;

            const valA = key === 'collegeCode' ? COLLEGE_NAMES[a.collegeCode] : a[key];
            const valB = key === 'collegeCode' ? COLLEGE_NAMES[b.collegeCode] : b[key];

            if (valA == null && valB == null) return 0;
            if (valA == null) return order === 'asc' ? -1 : 1;
            if (valB == null) return order === 'asc' ? 1 : -1;

            if (typeof valA === 'string' && typeof valB === 'string') {
                return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return order === 'asc' ? valA - valB : valB - valA;
            }
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return sortableItems;
  }, [results, sortConfig]);
  
  const requestSort = (key: SortKey) => {
    setSortConfig(prev => ({ key, order: prev && prev.key === key && prev.order === 'asc' ? 'desc' : 'asc' }));
  };
  
  const renderTableBody = () => {
    if (loading) return <tr><td colSpan={9} className="text-center py-8 text-slate-400">Loading...</td></tr>;
    if (error) return <tr><td colSpan={9} className="text-center py-8 text-red-500">{error}</td></tr>;
    if (sortedResults.length > 0) return sortedResults.map((student) => (
        <tr key={student.admissionNumber} onClick={() => handleRowClick(student.admissionNumber)} onKeyDown={(e) => e.key === 'Enter' && handleRowClick(student.admissionNumber)} className="hover:bg-slate-800 cursor-pointer" tabIndex={0}>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{student.studentName}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.admissionNumber}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{COLLEGE_NAMES[student.collegeCode]}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.programCode}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-center">{student.presentDays}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-center">{student.absentDays}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-center">{student.halfDays}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-center">{student.totalDays}</td>
          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-center ${student.attendancePercentage >= 75 ? 'text-green-400' : student.attendancePercentage < 65 ? 'text-red-400' : 'text-yellow-400'}`}>
            {student.attendancePercentage.toFixed(2)}%
          </td>
        </tr>
      ));
    
    if (!loading && (debouncedNameQuery || debouncedAdmissionNoQuery || selectedCollege !== College.ALL || selectedDepartment !== '' || selectedYear !== '' || selectedSemester !== '' || selectedRollNo !== '')) {
        return <tr><td colSpan={9} className="text-center py-8 text-slate-400">No students found for the current criteria.</td></tr>;
    }
    
    return <tr><td colSpan={9} className="text-center py-8 text-slate-400">Apply filters or enter a search query to begin.</td></tr>;
  };

  const commonSelectClass = "bg-slate-800 border border-slate-600 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-transparent overflow-y-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
              <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}><MenuIcon className="h-6 w-6" /></button>
              <h2 className="text-2xl font-bold text-white">Student Attendance Search</h2>
          </div>
          <button onClick={() => onDownload('studentAttendance')} disabled={isDownloading} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-slate-600">
            <DownloadIcon className="h-5 w-5" />
            <span>{isDownloading ? 'Downloading...' : 'Download CSV'}</span>
          </button>
      </div>
      <div className="mb-6 p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">College</label>
            <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value as College)} className={commonSelectClass} disabled={user.role !== Role.CHAIRMAN}>
                {Object.entries(COLLEGE_NAMES).map(([key, name]) => (<option key={key} value={key}>{name as React.ReactNode}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className={commonSelectClass}>
                <option value="">All Depts</option>
                {DEPARTMENTS.map((dept: string) => (<option key={dept} value={dept}>{dept}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Academic Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={commonSelectClass}>
                <option value="">All Years</option>
                {ACADEMIC_YEARS.map(year => (<option key={year} value={year}>{`${year}-${parseInt(year) + 1}`}</option>))}
            </select>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Semester</label>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className={commonSelectClass}>
                <option value="">All Semesters</option>
                {Array.from({length: 8}, (_, i) => i + 1).map(sem => <option key={sem} value={sem}>{sem}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Roll No</label>
            <select value={selectedRollNo} onChange={(e) => setSelectedRollNo(e.target.value)} className={commonSelectClass}>
              <option value="">All</option>
              {Array.from({ length: 60 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(rn => (
                <option key={rn} value={rn}>{rn}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-700 pt-6">
            <SearchInput id="studentNameSearch" label="Refine by Student Name" query={nameQuery} setQuery={setNameQuery} placeholder="e.g., Aarav Kapoor" />
            <SearchInput id="admissionNoSearch" label="Refine by Admission Number" query={admissionNoQuery} setQuery={setAdmissionNoQuery} placeholder="e.g., KCSE202001" />
        </div>
      </div>
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <TableHeader sortKey="studentName" label="Name" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="admissionNumber" label="Admission No" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="collegeCode" label="College" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="programCode" label="Department" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="presentDays" label="Present" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="absentDays" label="Absent" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="halfDays" label="Half Days" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="totalDays" label="Total Days" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="attendancePercentage" label="Attendance %" sortConfig={sortConfig} requestSort={requestSort} />
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">{renderTableBody()}</tbody>
          </table>
        </div>
      </div>
       <div className="mt-6 text-center">
            <button onClick={() => setShowRules(!showRules)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                {showRules ? 'Hide' : 'Show'} JNTUH Attendance Regulations
            </button>
       </div>
       {showRules && <JntuhAttendanceRules />}
      {/* FIX: Pass the 'user' prop to StudentDetails to satisfy its props interface. */}
      {(selectedStudent || modalLoading) && (modalLoading ? <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><div className="text-white bg-slate-800 px-4 py-2 rounded-lg shadow-lg">Loading details...</div></div> : selectedStudent && <StudentDetails user={user} student={selectedStudent} onClose={() => setSelectedStudent(null)} initialView="attendance" />)}
    </main>
  );
};

export default StudentAttendanceView;
