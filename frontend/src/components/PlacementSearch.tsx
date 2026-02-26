import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, PlacementWithStudent, College, Role, StudentDetailsType } from '../types/index';
import { searchPlacements, getStudentDetails } from '../services/api';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, ChevronUpDownIcon, MenuIcon, XMarkIcon, DownloadIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS, ACADEMIC_YEARS } from '../constants/index';
import StudentDetails from './StudentDetails';

interface PlacementSearchProps {
  user: User;
  onToggleSidebar: () => void;
  selectedCollege: College;
  setSelectedCollege: (college: College) => void;
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedRollNo: string;
  setSelectedRollNo: (rollNo: string) => void;
  onDownload: (purpose: string) => void;
  isDownloading: boolean;
}

type SortKey = keyof PlacementWithStudent;
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

const TableHeader: React.FC<{ sortKey: SortKey, label: string, sortConfig: { key: SortKey; order: SortOrder; } | null, requestSort: (key: SortKey) => void }> = ({ sortKey, label, sortConfig, requestSort }) => {
  const sortIndicator = useMemo(() => {
    if (!sortConfig || sortConfig.key !== sortKey) return <ChevronUpDownIcon className="h-4 w-4 text-slate-400/70" />;
    return sortConfig.order === 'asc' ? <ChevronUpIcon className="h-4 w-4 text-slate-200" /> : <ChevronDownIcon className="h-4 w-4 text-slate-200" />;
  }, [sortConfig, sortKey]);

  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort(sortKey)}>
      <div className="flex items-center gap-1">{label}{sortIndicator}</div>
    </th>
  );
};

const PlacementSearch: React.FC<PlacementSearchProps> = ({ 
    user, onToggleSidebar, selectedCollege, setSelectedCollege, 
    selectedDepartment, setSelectedDepartment, selectedYear, setSelectedYear, 
    selectedRollNo, setSelectedRollNo, onDownload, isDownloading 
}) => {
  const [nameQuery, setNameQuery] = useState('');
  const [admissionNoQuery, setAdmissionNoQuery] = useState('');
  const [companyQuery, setCompanyQuery] = useState('');
  const [results, setResults] = useState<PlacementWithStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailsType | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder } | null>({ key: 'studentName', order: 'asc' });
  
  const debouncedNameQuery = useDebounce(nameQuery, 300);
  const debouncedAdmissionNoQuery = useDebounce(admissionNoQuery, 300);
  const debouncedCompanyQuery = useDebounce(companyQuery, 300);

  const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
  const forcedDept = user.department || (user.id.match(/^[A-Z]([A-Z]{2,4})\d+/) ? user.id.match(/^[A-Z]([A-Z]{2,4})\d+/)?.[1] : null);

  const fetchPlacements = useCallback(async () => {
    const isSearchActive = debouncedNameQuery || debouncedAdmissionNoQuery || debouncedCompanyQuery;
    const areFiltersActive = selectedYear !== '' || 
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
      const placementResults = await searchPlacements(
        { name: debouncedNameQuery, admissionNumber: debouncedAdmissionNoQuery, companyName: debouncedCompanyQuery },
        selectedCollege, selectedDepartment, selectedYear, selectedRollNo
      );
      setResults(placementResults);
    } catch (err) {
      console.error("Failed to search placements:", err);
      setError('Failed to fetch placement data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedNameQuery, debouncedAdmissionNoQuery, debouncedCompanyQuery, selectedCollege, selectedDepartment, selectedYear, selectedRollNo, user.role]);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

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
    return [...results].sort((a, b) => {
        if (!sortConfig) return 0;
        const key = sortConfig.key;
        const order = sortConfig.order;
        
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });
  }, [results, sortConfig]);
  
  const requestSort = (key: SortKey) => {
    setSortConfig(prev => ({ key, order: prev && prev.key === key && prev.order === 'asc' ? 'desc' : 'asc' }));
  };
  
  const renderTableBody = () => {
    if (loading) return <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading...</td></tr>;
    if (error) return <tr><td colSpan={6} className="text-center py-8 text-red-500">{error}</td></tr>;
    if (sortedResults.length > 0) return sortedResults.map((student) => (
        <tr key={student.admissionNumber} onClick={() => handleRowClick(student.admissionNumber)} className="hover:bg-slate-800/50 cursor-pointer" tabIndex={0}>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{student.studentName}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.admissionNumber}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.programCode}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.companyName}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.hrName}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.hrMobileNumber}</td>
        </tr>
      ));
    
    return <tr><td colSpan={6} className="text-center py-8 text-slate-400">No results found.</td></tr>;
  };

  const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors disabled:bg-slate-700 disabled:text-slate-500";

  return (
    <>
      <main className="p-4 md:p-6 lg:p-8 bg-transparent overflow-y-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
                <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}><MenuIcon className="h-6 w-6" /></button>
                <h2 className="text-2xl font-bold text-white">Placement Search</h2>
            </div>
            <button onClick={() => onDownload('placementSearch')} disabled={isDownloading} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-slate-600">
              <DownloadIcon className="h-5 w-5" />
              <span>{isDownloading ? 'Downloading...' : 'Download CSV'}</span>
            </button>
        </div>
        <div className="mb-6 p-6 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SearchInput id="studentNameSearch" label="Student Name" query={nameQuery} setQuery={setNameQuery} placeholder="e.g., Aarav Kapoor" />
              <SearchInput id="admissionNoSearch" label="Admission Number" query={admissionNoQuery} setQuery={setAdmissionNoQuery} placeholder="e.g., KCSE202001" />
              <SearchInput id="companyNameSearch" label="Company Name" query={companyQuery} setQuery={setCompanyQuery} placeholder="e.g., Infosys" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-700 pt-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">College</label>
              <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value as College)} className={commonSelectClass} disabled={user.role !== Role.CHAIRMAN}>
                  {Object.entries(COLLEGE_NAMES).map(([key, name]) => (<option key={key} value={key}>{name as React.ReactNode}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
              <select 
                  value={selectedDepartment} 
                  onChange={(e) => setSelectedDepartment(e.target.value)} 
                  className={commonSelectClass} 
                  disabled={isRestricted}
              >
                  {isRestricted ? (
                    <option value={forcedDept || 'all'}>{forcedDept || 'My Dept'}</option>
                  ) : (
                    <>
                      <option value="">All Depts</option>
                      {DEPARTMENTS.map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
                    </>
                  )}
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
              <label className="block text-sm font-medium text-slate-300 mb-1">Roll No</label>
              <select value={selectedRollNo} onChange={(e) => setSelectedRollNo(e.target.value)} className={commonSelectClass}>
                <option value="">All</option>
                {Array.from({ length: 60 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(rn => (<option key={rn} value={rn}>{rn}</option>))}
              </select>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-700"><thead className="bg-slate-700/50"><tr>
              <TableHeader sortKey="studentName" label="Name" sortConfig={sortConfig} requestSort={requestSort} />
              <TableHeader sortKey="admissionNumber" label="Admission No" sortConfig={sortConfig} requestSort={requestSort} />
              <TableHeader sortKey="programCode" label="Dept" sortConfig={sortConfig} requestSort={requestSort} />
              <TableHeader sortKey="companyName" label="Company" sortConfig={sortConfig} requestSort={requestSort} />
              <TableHeader sortKey="hrName" label="HR Name" sortConfig={sortConfig} requestSort={requestSort} />
              <TableHeader sortKey="hrMobileNumber" label="HR Contact" sortConfig={sortConfig} requestSort={requestSort} />
              </tr></thead><tbody className="bg-slate-800/20 divide-y divide-slate-700">{renderTableBody()}</tbody></table></div>
        </div>
        {/* FIX: Pass the 'user' prop to StudentDetails to satisfy its props interface. */}
        {(selectedStudent || modalLoading) && (modalLoading ? <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><div className="text-white bg-slate-800 px-4 py-2 rounded-lg shadow-lg">Loading details...</div></div> : selectedStudent && <StudentDetails user={user} student={selectedStudent} onClose={() => setSelectedStudent(null)} initialView="placement"/>)}
      </main>
    </>
  );
};

export default PlacementSearch;