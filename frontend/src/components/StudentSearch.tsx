
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, Student, StudentDetailsType, College, Role } from '../types/index';
import { searchStudents, getStudentDetails, deleteStudentData } from '../services/api';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, ChevronUpDownIcon, MenuIcon, XMarkIcon, DownloadIcon, TrashIcon } from './icons';
import StudentDetails from './StudentDetails';
import { COLLEGE_NAMES, DEPARTMENTS, ACADEMIC_YEARS } from '../constants/index';

interface StudentSearchProps {
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
  onDownload: (purpose: string, options?: { facultyId?: string, staffId?: string, subject?: string }) => void;
  isDownloading: boolean;
  selectedPlacement: string;
  setSelectedPlacement: (placement: string) => void;
}

type SortKey = keyof Student;
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
          <input id={id} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="block w-full pl-10 pr-10 py-2 border border-slate-600 rounded-md bg-slate-700/50 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
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

const StudentSearch: React.FC<StudentSearchProps> = ({ 
    user, onToggleSidebar, selectedCollege, setSelectedCollege, 
    selectedDepartment, setSelectedDepartment, selectedYear, setSelectedYear, 
    selectedSemester, setSelectedSemester, selectedRollNo, setSelectedRollNo,
    onDownload, isDownloading, selectedPlacement, setSelectedPlacement
}) => {
  const [nameQuery, setNameQuery] = useState('');
  const [admissionNoQuery, setAdmissionNoQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailsType | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder } | null>({ key: 'studentName', order: 'asc' });
  
  const debouncedNameQuery = useDebounce(nameQuery, 250);
  const debouncedAdmissionNoQuery = useDebounce(admissionNoQuery, 250);
  
  const canDelete = [Role.CHAIRMAN, Role.PRINCIPAL, Role.STAFF].includes(user.role);
  const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
  const forcedDept = user.department || (user.id.match(/^[A-Z]([A-Z]{2,4})\d+/) ? user.id.match(/^[A-Z]([A-Z]{2,4})\d+/)?.[1] : null);

  const fetchStudents = useCallback(async () => {
    const isSearchActive = debouncedNameQuery || debouncedAdmissionNoQuery;
    const areFiltersActive = selectedYear !== 'all' || selectedSemester !== 'all' || selectedRollNo !== 'all' || selectedPlacement !== '';

    if (!isSearchActive && !areFiltersActive) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const collegeForApi = selectedCollege === College.ALL ? '' : selectedCollege;
      const studentResults = await searchStudents(
        { name: debouncedNameQuery, admissionNumber: debouncedAdmissionNoQuery },
        collegeForApi as College, selectedDepartment, selectedYear, selectedRollNo, selectedSemester, selectedPlacement
      );
      setResults(studentResults);
    } catch (err) {
      console.error("Failed to search students:", err);
      setError('Failed to fetch student data.');
    } finally {
      setLoading(false);
    }
  }, [debouncedNameQuery, debouncedAdmissionNoQuery, selectedCollege, selectedDepartment, selectedYear, selectedSemester, selectedRollNo, selectedPlacement]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleRowClick = async (admissionNumber: string) => {
    setModalLoading(true);
    setSelectedStudent(null);
    try {
      const details = await getStudentDetails(admissionNumber);
      setSelectedStudent(details);
    } catch (err) { console.error("Failed to get student details:", err);
    } finally { setModalLoading(false); }
  };

  const handleDeleteRecord = async (e: React.MouseEvent, student: Student) => {
      e.stopPropagation();
      if (window.confirm(`Are you sure you want to PERMANENTLY remove all data for student ${student.studentName} (${student.admissionNumber})? This will delete all Marks, Attendance, and Fees.`)) {
          try {
              const tabs: ('marks' | 'attendance' | 'fees' | 'examFees')[] = ['marks', 'attendance', 'fees', 'examFees'];
              for (const tab of tabs) {
                  try {
                    await deleteStudentData({
                        admissionNumber: student.admissionNumber,
                        studentName: student.studentName,
                        tab: tab,
                        academicYear: 'All Years',
                        semester: 'All Semesters',
                        deletedBy: user.id,
                        reason: 'Manual deletion from search list'
                    });
                  } catch (e) { }
              }
              alert(`Successfully wiped data for ${student.studentName}.`);
              fetchStudents();
          } catch (err) {
              alert("Deletion failed.");
          }
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
    const colSpan = 6;
    if (loading) return <tr><td colSpan={colSpan} className="text-center py-8 text-slate-400">Loading...</td></tr>;
    if (error) return <tr><td colSpan={colSpan} className="text-center py-8 text-red-500">{error}</td></tr>;
    if (sortedResults.length > 0) return sortedResults.map((student) => (
        <tr key={student.admissionNumber} onClick={() => handleRowClick(student.admissionNumber)} className="hover:bg-slate-800 cursor-pointer focus:outline-none focus:bg-slate-700" tabIndex={0} role="button">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{student.studentName}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">{student.admissionNumber}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{COLLEGE_NAMES[student.collegeCode]}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.programCode}</td>
           <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${student.isPlaced ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                {student.isPlaced ? 'Placed' : 'Not Placed'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
              {canDelete && (
                  <button 
                    onClick={(e) => handleDeleteRecord(e, student)} 
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Permanently Delete All Student Data"
                  >
                      <TrashIcon className="h-4 w-4" />
                  </button>
              )}
          </td>
        </tr>
      ));
    
    const isSearchActive = nameQuery || admissionNoQuery || selectedYear !== 'all' || selectedSemester !== 'all' || selectedRollNo !== 'all' || selectedPlacement !== '';
    if (isSearchActive) return <tr><td colSpan={colSpan} className="text-center py-8 text-slate-400">No students found.</td></tr>;
    
    return <tr><td colSpan={colSpan} className="text-center py-8 text-slate-400 font-medium italic">Enter search criteria to view student list.</td></tr>;
  };

  const commonSelectClass = "bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-slate-700 disabled:text-slate-500 transition-opacity";

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-transparent overflow-y-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
              <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}><MenuIcon className="h-6 w-6" /></button>
              <h2 className="text-2xl font-bold text-white">Student Information Search</h2>
          </div>
          <button onClick={() => onDownload('studentSearch')} disabled={isDownloading} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-slate-600 shadow-md">
            <DownloadIcon className="h-5 w-5" />
            <span>{isDownloading ? 'Downloading...' : 'Download CSV'}</span>
          </button>
      </div>
      <div className="mb-6 p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">College</label><select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value as College)} className={commonSelectClass} disabled={user.role !== Role.CHAIRMAN}>{Object.entries(COLLEGE_NAMES).map(([key, name]) => (<option key={key} value={key}>{name as React.ReactNode}</option>))}</select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Department</label>
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
                    {DEPARTMENTS.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                  </>
                )}
            </select>
          </div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Adm. Year</label><select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={commonSelectClass}><option value="all">All Years</option>{ACADEMIC_YEARS.map(year => (<option key={year} value={year}>{`${year}-${parseInt(year) + 1}`}</option>))}</select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Semester</label><select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className={commonSelectClass}><option value="all">All</option>{Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (<option key={sem} value={sem}>{sem}</option>))}</select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Roll No</label><select value={selectedRollNo} onChange={(e) => setSelectedRollNo(e.target.value)} className={commonSelectClass}><option value="all">All</option>{Array.from({ length: 60 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(rn => (<option key={rn} value={rn}>{rn}</option>))}</select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Placement</label><select value={selectedPlacement} onChange={(e) => setSelectedPlacement(e.target.value)} className={commonSelectClass}><option value="">All</option><option value="placed">Placed</option><option value="not-placed">Not Placed</option></select></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-700 pt-6">
            <SearchInput id="studentNameSearch" label="Search by Name" query={nameQuery} setQuery={setNameQuery} placeholder="e.g., Aarav Kapoor" />
            <SearchInput id="admissionNoSearch" label="Search by ID" query={admissionNoQuery} setQuery={setAdmissionNoQuery} placeholder="e.g., KCSE202001" />
        </div>
      </div>
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-700"><thead className="bg-slate-800"><tr>
            <TableHeader sortKey="studentName" label="Name" sortConfig={sortConfig} requestSort={requestSort} />
            <TableHeader sortKey="admissionNumber" label="Admission No" sortConfig={sortConfig} requestSort={requestSort} />
            <TableHeader sortKey="collegeCode" label="College" sortConfig={sortConfig} requestSort={requestSort} />
            <TableHeader sortKey="programCode" label="Department" sortConfig={sortConfig} requestSort={requestSort} />
            <TableHeader sortKey="isPlaced" label="Placement" sortConfig={sortConfig} requestSort={requestSort} />
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
            </tr></thead><tbody className="bg-slate-900 divide-y divide-slate-800">{renderTableBody()}</tbody></table></div>
      </div>
      {(selectedStudent || modalLoading) && (modalLoading ? <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><div className="text-white bg-slate-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-pulse"><div className="h-4 w-4 rounded-full border-t-2 border-blue-500 animate-spin"></div>Loading student file...</div></div> : selectedStudent && (
        <StudentDetails 
          user={user} 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
          initialAcademicYear={selectedYear !== 'all' ? `${selectedYear}-${parseInt(selectedYear)+1}` : 'All Years'}
          initialSemester={selectedSemester !== 'all' ? selectedSemester : 'All Semesters'}
        />
      ))}
    </main>
  );
};

export default StudentSearch;
