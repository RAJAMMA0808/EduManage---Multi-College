

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, StudentWithFee, College, Role, StudentDetailsType } from '../types/index';
import { searchStudentFees, getStudentDetails } from '../services/api';
// FIX: Add DownloadIcon import
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, ChevronUpDownIcon, MenuIcon, XMarkIcon, DownloadIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS, ACADEMIC_YEARS } from '../constants/index';
import { mockStudentFees } from '../services/mockData';
import StudentDetails from './StudentDetails';

// FIX: Add missing props for download functionality and shared filters.
interface StudentFeeProps {
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

type SortKey = keyof (StudentWithFee & { currentSemester?: number | string });
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
  requestSort: (key: SortKey) => void,
  className?: string;
}> = ({ sortKey, label, sortConfig, requestSort, className = '' }) => {
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronUpDownIcon className="h-4 w-4 text-slate-400 inline-block ml-1" />;
    return sortConfig.order === 'asc' ? <ChevronUpIcon className="h-4 w-4 text-slate-200 inline-block ml-1" /> : <ChevronDownIcon className="h-4 w-4 text-slate-200 inline-block ml-1" />;
  };

  return (
    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer select-none ${className}`} onClick={() => requestSort(sortKey)} aria-sort={sortConfig?.key === sortKey ? (sortConfig.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <div className="flex items-center">{label}{getSortIndicator(sortKey)}</div>
    </th>
  );
};


const StudentFee: React.FC<StudentFeeProps> = ({ user, onToggleSidebar, selectedCollege, setSelectedCollege, selectedDepartment, setSelectedDepartment, selectedYear, setSelectedYear, selectedRollNo, setSelectedRollNo, onDownload, isDownloading }) => {
  const [nameQuery, setNameQuery] = useState('');
  const [admissionNoQuery, setAdmissionNoQuery] = useState('');
  const [results, setResults] = useState<(StudentWithFee & { currentSemester?: number | string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder } | null>({ key: 'dueAmount', order: 'desc' });
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailsType | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const debouncedNameQuery = useDebounce(nameQuery, 250);
  const debouncedAdmissionNoQuery = useDebounce(admissionNoQuery, 250);
  
  const academicYears = useMemo(() => ['', ...Array.from(new Set(mockStudentFees.map(f => f.academicYear))).sort((a: string, b: string) => b.localeCompare(a))], []);

  const fetchStudentFees = useCallback(async () => {
    const isSearchActive = debouncedNameQuery || debouncedAdmissionNoQuery;
    const areFiltersActive = (user.role === Role.CHAIRMAN && selectedCollege !== College.ALL) || 
                             selectedDepartment !== '' || 
                             selectedYear !== '' || 
                             selectedRollNo !== '';

    if (!isSearchActive && !areFiltersActive) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const feeResults = await searchStudentFees(
        { name: debouncedNameQuery, admissionNumber: debouncedAdmissionNoQuery },
        selectedCollege,
        selectedDepartment,
        selectedYear,
        selectedRollNo
      );
      setResults(feeResults);
    } catch (err) {
      console.error("Failed to search student fees:", err);
      setError('Failed to fetch student fee data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user.role, debouncedNameQuery, debouncedAdmissionNoQuery, selectedCollege, selectedDepartment, selectedYear, selectedRollNo]);

  useEffect(() => { fetchStudentFees(); }, [fetchStudentFees]);
  
  const handleRowClick = async (admissionNumber: string) => {
    setModalLoading(true);
    setSelectedStudent(null);
    try {
      const details = await getStudentDetails(admissionNumber);
      setSelectedStudent(details as StudentDetailsType);
    } catch (err) { 
      console.error("Failed to get student details:", err);
    } finally { 
      setModalLoading(false); 
    }
  };


  const sortedResults = useMemo(() => {
    let sortableItems = [...results];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        const order = sortConfig.order;

        const valA = a[key];
        const valB = b[key];

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
    if (loading) return <tr><td colSpan={10} className="text-center py-8 text-slate-400">Loading...</td></tr>;
    if (error) return <tr><td colSpan={10} className="text-center py-8 text-red-500">{error}</td></tr>;
    if (sortedResults.length > 0) return sortedResults.map((studentFee) => (
        <tr key={`${studentFee.admissionNumber}-${studentFee.academicYear}`} className="hover:bg-slate-800/50 cursor-pointer transition-colors duration-200" onClick={() => handleRowClick(studentFee.admissionNumber)}>
          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-100">{studentFee.studentName}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{studentFee.admissionNumber}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{COLLEGE_NAMES[studentFee.collegeCode]}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{studentFee.programCode}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{studentFee.academicYear}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-center">{studentFee.currentSemester}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-right">{studentFee.totalFees.toLocaleString('en-IN')}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-right">{studentFee.paidAmount.toLocaleString('en-IN')}</td>
          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${studentFee.dueAmount > 0 ? 'text-red-400' : 'text-slate-300'}`}>{studentFee.dueAmount.toLocaleString('en-IN')}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
            <span className={`px-2 py-1 rounded-full text-xs ${
                studentFee.status === 'Paid' ? 'bg-green-500/20 text-green-300' 
                : studentFee.status === 'Partial' ? 'bg-yellow-500/20 text-yellow-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>{studentFee.status}</span>
          </td>
        </tr>
      ));
    
    const isSearchActive = nameQuery || admissionNoQuery || selectedCollege !== College.ALL || selectedDepartment !== '' || selectedYear !== '' || selectedRollNo !== '';
    if (isSearchActive) {
        return <tr><td colSpan={10} className="text-center py-8 text-slate-400">No student fee records found for the current criteria.</td></tr>;
    }
    
    return <tr><td colSpan={10} className="text-center py-8 text-slate-400">Apply filters or enter a search query to begin.</td></tr>;
  };

  const commonSelectClass = "bg-slate-700/50 border border-slate-600 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-200";

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-transparent overflow-y-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
              <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}><MenuIcon className="h-6 w-6" /></button>
              <h2 className="text-2xl font-bold text-white">Student College Fee Details</h2>
          </div>
          <button onClick={() => onDownload('studentFee')} disabled={isDownloading} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-slate-600">
            <DownloadIcon className="h-5 w-5" />
            <span>{isDownloading ? 'Downloading...' : 'Download CSV'}</span>
          </button>
      </div>
      <div className="mb-6 p-6 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">College</label>
            <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value as College)} className={commonSelectClass} disabled={user.role !== Role.CHAIRMAN}>
                {Object.entries(COLLEGE_NAMES).map(([key, name]) => (<option className="bg-slate-800 text-white" key={key} value={key}>{name as React.ReactNode}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className={commonSelectClass}>
                <option value="" className="bg-slate-800 text-white">All Depts</option>
                {DEPARTMENTS.map((dept: string) => (<option className="bg-slate-800 text-white" key={dept} value={dept}>{dept}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Academic Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={commonSelectClass}>
                {academicYears.map(year => (<option key={year as React.Key} value={year.toString()}>{year === '' ? 'All Years' : year}</option>))}
            </select>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Roll No</label>
            <select value={selectedRollNo} onChange={(e) => setSelectedRollNo(e.target.value)} className={commonSelectClass}>
              <option value="" className="bg-slate-800 text-white">All</option>
              {Array.from({ length: 60 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(rn => (
                <option className="bg-slate-800 text-white" key={rn} value={rn}>{rn}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-700 pt-6">
            <SearchInput id="studentNameSearch" label="Refine by Student Name" query={nameQuery} setQuery={setNameQuery} placeholder="e.g., Aarav Kapoor" />
            <SearchInput id="admissionNoSearch" label="Refine by Admission Number" query={admissionNoQuery} setQuery={setAdmissionNoQuery} placeholder="e.g., KCSE202001" />
        </div>
      </div>
      <div className="bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <TableHeader sortKey="studentName" label="Name" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="admissionNumber" label="Admission No" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="collegeCode" label="College" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="programCode" label="Dept" sortConfig={sortConfig} requestSort={requestSort} />
                <TableHeader sortKey="academicYear" label="Acad. Year" sortConfig={sortConfig} requestSort={requestSort} />
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Current Sem</th>
                <TableHeader sortKey="totalFees" label="Total Fees (₹)" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                <TableHeader sortKey="paidAmount" label="Paid (₹)" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                <TableHeader sortKey="dueAmount" label="Due (₹)" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                <TableHeader sortKey="status" label="Status" sortConfig={sortConfig} requestSort={requestSort} />
              </tr>
            </thead>
            <tbody className="bg-slate-800/20 divide-y divide-slate-700">{renderTableBody()}</tbody>
          </table>
        </div>
      </div>
       {/* FIX: Pass the 'user' prop to StudentDetails to satisfy its props interface. */}
       {(selectedStudent || modalLoading) && (
        modalLoading ? 
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><div className="text-white bg-slate-800 px-4 py-2 rounded-lg shadow-lg">Loading details...</div></div> 
        : selectedStudent && <StudentDetails user={user} student={selectedStudent} onClose={() => setSelectedStudent(null)} initialView="fees" />
      )}
    </main>
  );
};

export default StudentFee;
