import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, College, Role, SyllabusPdf, PlacementDetails, StudentFee, Student, StudentDetailsType } from '../types/index';
import { MenuIcon, DownloadIcon, UploadIcon, TableCellsIcon, CheckCircleIcon, XCircleIcon, DocumentIcon, TrashIcon, BellIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS, LATEST_ATTENDANCE_DATE, ACADEMIC_YEARS, FEE_STRUCTURE } from '../constants/index';
import SampleDataModal from './SampleDataModal';
import { 
  addStudentMark, 
  addStudentAttendance, 
  addFacultyAttendance, 
  addStaffAttendance, 
  uploadExcelData, 
  uploadSyllabusPdf,
  addStudentPlacement,
  addStudentFee,
  getStudentDetails,
  getSubjects
} from '../services/api';
import { mockStudents } from '../services/mockData';

// Declare XLSX to inform TypeScript that it's available globally from the script tag in index.html
declare const XLSX: any;

interface ApplicationSubmissionProps {
  user: User;
  onToggleSidebar: () => void;
  onDataChange: () => void;
}

type ActiveTab = 'manual' | 'upload' | 'syllabus' | 'notificationUpload';
type FormType = 'marks' | 'studentAttendance' | 'facultyAttendance' | 'staffAttendance' | 'placement' | 'fee' | 'examFee';

interface UploadResultStats {
  message: string;
  totalRows: number;
  processed: number;
  errors: number;
  successRate: string;
}

// Helper to get department for restricted users
const getRestrictedDepartment = (user: User) => {
    if (user.role === Role.HOD || user.role === Role.FACULTY) {
        if (user.department) return user.department;
        // Fallback parse from ID
        const match = user.id.match(/^[A-Z]([A-Z]{2,4})\d+/);
        return match ? match[1] : null;
    }
    return null;
};

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

const commonInputClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-slate-700 disabled:text-slate-400";
const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-slate-700 disabled:text-slate-400";
const commonButtonClass = "w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-blue-400 disabled:cursor-not-allowed";
const commonResetButtonClass = "w-full sm:w-auto text-white bg-slate-600 hover:bg-slate-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const Field: React.FC<{ label: string; children: React.ReactNode; desc?: string }> = ({ label, children, desc }) => (
    <div><label className="block mb-1.5 text-sm font-medium text-slate-300">{label}</label>{children}{desc && <p className="mt-1 text-xs text-slate-500">{desc}</p>}</div>
);

const ExamFeeEntryForm: React.FC<{ college: College; onDataChange: () => void; user: User }> = ({ college, onDataChange, user }) => {
    const forcedDept = getRestrictedDepartment(user);
    const initialFormState = { admissionNumber: '', studentName: '', gender: 'M', programCode: forcedDept || 'CSE', semester: '1', academicYear: '', paymentDate: formatDate(new Date()), examFee: '0', lateFee: '0', totalAmount: '0' };
    const [formData, setFormData] = useState(initialFormState);
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isAllSubjects, setIsAllSubjects] = useState(false);
    const [studentNotFoundError, setStudentNotFoundError] = useState('');
    const debouncedAdmissionNumber = useDebounce(formData.admissionNumber, 500);

    const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
    const visibleDepts = isRestricted && forcedDept ? DEPARTMENTS.filter(d => d === forcedDept) : DEPARTMENTS;

    useEffect(() => {
        if (!debouncedAdmissionNumber) { 
            setFormData(prev => ({ ...prev, studentName: '', gender: 'M' })); 
            setStudentNotFoundError('');
            return; 
        }
        const fetchStudent = async () => {
            try {
                const details = await getStudentDetails(debouncedAdmissionNumber);
                if (details) { 
                    setFormData(prev => ({ 
                        ...prev, 
                        studentName: details.studentName, 
                        gender: details.gender, 
                        programCode: forcedDept || details.programCode
                    })); 
                    setStudentNotFoundError(''); 
                } else { 
                    setStudentNotFoundError('Student not found in database.'); 
                }
            } catch (e) { console.error(e); }
        };
        fetchStudent();
    }, [debouncedAdmissionNumber, forcedDept]);

    useEffect(() => {
        const fetchSubs = async () => {
            if (formData.programCode && formData.semester) {
                const subs = await getSubjects(college, formData.programCode, formData.semester);
                setAvailableSubjects(subs); 
            }
        };
        fetchSubs();
    }, [formData.programCode, formData.semester, college]);

    useEffect(() => {
        let baseFee = 0;
        const subjectCount = isAllSubjects ? (availableSubjects.length || 8) : selectedSubjects.length; 
        if (subjectCount === 0) baseFee = 0; 
        else if (subjectCount === 1) baseFee = 360; 
        else if (subjectCount === 2) baseFee = 460; 
        else if (subjectCount === 3) baseFee = 560; 
        else baseFee = 760;
        
        const late = parseInt(formData.lateFee) || 0; 
        const total = baseFee + late;
        setFormData(prev => ({ ...prev, examFee: String(baseFee), totalAmount: String(total) }));
    }, [selectedSubjects, isAllSubjects, formData.lateFee, availableSubjects]);

    const handleSubjectChange = (subject: string) => { 
        if (isAllSubjects) setIsAllSubjects(false); 
        setSelectedSubjects(prev => { 
            if (prev.includes(subject)) return prev.filter(s => s !== subject); 
            return [...prev, subject]; 
        }); 
    };

    const handleAllSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        setIsAllSubjects(e.target.checked); 
        if (e.target.checked) { setSelectedSubjects([]); } 
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); 
    };

    const handleSubmit = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        const now = new Date(); 
        const [y, m, d] = formData.paymentDate.split('-').map(Number); 
        const paymentTimestamp = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()); 
        
        const feeData: StudentFee = { 
            admissionNumber: formData.admissionNumber.toUpperCase(), 
            academicYear: formData.academicYear, 
            semester: parseInt(formData.semester, 10), 
            programCode: formData.programCode, 
            paymentDate: paymentTimestamp.toISOString(), 
            totalFees: parseFloat(formData.totalAmount) || 0, 
            paidAmount: parseFloat(formData.totalAmount) || 0, 
            dueAmount: 0, 
            status: 'Paid', 
            feeType: 'Exam' 
        }; 
        
        try { 
            await addStudentFee(feeData); 
            alert(`Exam Fee of ₹${formData.totalAmount} recorded for ${formData.admissionNumber}`); 
            handleReset();
            onDataChange(); 
        } catch (error) { 
            alert(`Submission failed: ${error instanceof Error ? error.message : String(error)}`); 
        } 
    };

    const handleReset = () => {
        setFormData(initialFormState); 
        setIsAllSubjects(false); 
        setSelectedSubjects([]); 
        setAvailableSubjects([]);
        setStudentNotFoundError('');
    };

    const derivedAcademicYears = useMemo(() => { 
        if (!formData.admissionNumber) return []; 
        const match = formData.admissionNumber.match(/[a-zA-Z]+(\d{4})/); 
        if (!match) return []; 
        const start = parseInt(match[1], 10); 
        return Array.from({ length: 4 }, (_, i) => `${start + i}-${start + i + 1}`); 
    }, [formData.admissionNumber]);

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-6">
                    <Field label="Admission Number" desc="Enter ID to auto-load Student branch and subjects"><input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} className={commonInputClass} required placeholder="e.g. KCSE202001"/></Field>
                    <Field label="Program Code (Branch)"><select name="programCode" value={formData.programCode} onChange={handleChange} className={commonSelectClass} disabled={isRestricted || !!debouncedAdmissionNumber}>{visibleDepts.map(d => <option key={d} value={d}>{d}</option>)}</select></Field>
                    <div className="grid grid-cols-2 gap-4"><Field label="Semester"><select name="semester" value={formData.semester} onChange={handleChange} className={commonSelectClass}>{Array.from({ length: 8 }, (_, i) => i + 1).map(sem => <option key={sem} value={sem}>{sem}</option>)}</select></Field><Field label="Academic Year"><select name="academicYear" value={formData.academicYear} onChange={handleChange} className={commonSelectClass} required><option value="">Select</option>{derivedAcademicYears.map(y => <option key={y} value={y}>{y}</option>)}</select></Field></div>
                    <div className="p-4 bg-slate-800 border border-slate-700 rounded-md"><label className="block mb-3 text-sm font-bold text-slate-200">Select Branch Subjects ({formData.programCode})</label><div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar"><label className="flex items-center space-x-3 p-2 rounded hover:bg-slate-700 cursor-pointer border border-transparent hover:border-slate-600"><input type="checkbox" checked={isAllSubjects} onChange={handleAllSubjectsChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 border-gray-600" /><span className="text-white font-semibold">Whole Examination (All Subjects)</span></label><div className="h-px bg-slate-600 my-2"></div>{availableSubjects.map(sub => (<label key={sub} className={`flex items-center space-x-3 p-2 rounded cursor-pointer border border-transparent ${isAllSubjects ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700 hover:border-slate-600'}`}><input type="checkbox" checked={selectedSubjects.includes(sub)} onChange={() => handleSubjectChange(sub)} disabled={isAllSubjects} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 border-gray-600" /><span className="text-slate-300 text-sm">{sub}</span></label>))}{availableSubjects.length === 0 && <p className="text-xs text-slate-500 italic p-2">No subjects found for {formData.programCode} in Semester {formData.semester}.</p>}</div></div>
                </div>
                <div className="space-y-6">
                    <Field label="Student Name"><input type="text" value={formData.studentName} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} />{studentNotFoundError && <p className="text-xs text-red-400 mt-1 font-bold">{studentNotFoundError}</p>}</Field>
                    <Field label="Gender"><select name="gender" value={formData.gender} onChange={handleChange} className={commonSelectClass} disabled={!!debouncedAdmissionNumber}><option value="M">Male</option><option value="F">Female</option></select></Field>
                    <Field label="Payment Date"><input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className={commonInputClass} /></Field>
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
                        <Field label="Exam Fees (₹)" desc="Calculated based on subject count"><input type="text" value={formData.examFee} readOnly className={`${commonInputClass} bg-slate-700 font-bold text-green-400`} /></Field>
                        <Field label="Late Exam Fees (₹)"><input type="number" name="lateFee" value={formData.lateFee} onChange={handleChange} className={commonInputClass} placeholder="0" onWheel={(e) => (e.target as HTMLInputElement).blur()} /></Field>
                        <div className="pt-4 border-t border-slate-600"><div className="flex justify-between items-center"><span className="text-lg font-bold text-white">Total Amount:</span><span className="text-2xl font-bold text-blue-400">₹{parseInt(formData.totalAmount).toLocaleString()}</span></div></div>
                    </div>
                </div>
            </div>
             <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-700"><button type="button" onClick={handleReset} className={commonResetButtonClass}>Reset Form</button><button type="submit" className={commonButtonClass}>Submit</button></div>
        </form>
    );
};

const FeeEntryForm: React.FC<{ college: College; onDataChange: () => void; user: User }> = ({ college, onDataChange, user }) => {
    const forcedDept = getRestrictedDepartment(user);
    const initialFormState = { admissionNumber: '', admissionType: 'Counselling Seat/Scholarship/Sports Quota', programCode: forcedDept || 'CSE', semester: '1', academicYear: '', paymentDate: formatDate(new Date()), totalFees: String(FEE_STRUCTURE[forcedDept || 'CSE'] || ''), paidAmount: '', gender: 'M', previousPaidAmount: '0' };
    const [formData, setFormData] = useState(initialFormState);
    const [studentName, setStudentName] = useState('');
    const [studentNotFoundError, setStudentNotFoundError] = useState('');
    const [error, setError] = useState('');
    const [fetchedStudent, setFetchedStudent] = useState<any | null>(null);
    const [historicalPaid, setHistoricalPaid] = useState(0);
    const debouncedAdmissionNumber = useDebounce(formData.admissionNumber, 500);

    const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
    const visibleDepts = isRestricted && forcedDept ? DEPARTMENTS.filter(d => d === forcedDept) : DEPARTMENTS;

    useEffect(() => { if (!debouncedAdmissionNumber) { setStudentName(''); setStudentNotFoundError(''); setFetchedStudent(null); setHistoricalPaid(0); return; } const fetchStudentData = async () => { try { const details = await getStudentDetails(debouncedAdmissionNumber); if (details) { setFetchedStudent(details); setStudentName(details.studentName); setStudentNotFoundError(''); if (!forcedDept) { setFormData(prev => ({ ...prev, programCode: details.programCode })); } } else { setFetchedStudent(null); setStudentName(''); setStudentNotFoundError('Student not found in database.'); setHistoricalPaid(0); } } catch (e) { console.error("Error fetching student for Tuition Fees Entry:", e); setStudentNotFoundError('Error fetching details.'); setFetchedStudent(null); } }; fetchStudentData(); }, [debouncedAdmissionNumber, forcedDept]);
    useEffect(() => { if (fetchedStudent && formData.academicYear) { const histPaid = fetchedStudent.fees.filter((f: StudentFee) => f.academicYear === formData.academicYear && (f.feeType === 'Tuition' || !f.feeType)).reduce((sum: number, f: StudentFee) => sum + f.paidAmount, 0); setHistoricalPaid(histPaid); const existingFeeRecord = fetchedStudent.fees.find((f: StudentFee) => f.academicYear === formData.academicYear && (f.feeType === 'Tuition' || !f.feeType)); if (existingFeeRecord) { setFormData(prev => ({ ...prev, totalFees: String(existingFeeRecord.totalFees) })); } } else { setHistoricalPaid(0); } }, [fetchedStudent, formData.academicYear]);
    const { dueAmount, finalDueAmount, status } = useMemo(() => { const total = Math.round(parseFloat(formData.totalFees)) || 0; const currentPay = Math.round(parseFloat(formData.paidAmount)) || 0; const currentOutstanding = Math.max(0, total - historicalPaid); const remainingAfterPay = Math.max(0, currentOutstanding - currentPay); let status: 'Paid' | 'Partial' | 'Due' = 'Due'; if (remainingAfterPay <= 0) status = 'Paid'; else if ((historicalPaid + currentPay) > 0) status = 'Partial'; return { dueAmount: currentOutstanding.toFixed(2), finalDueAmount: remainingAfterPay, status }; }, [formData.totalFees, formData.paidAmount, historicalPaid]);
    const derivedAcademicYears = useMemo(() => { if (!formData.admissionNumber) return []; const admissionYearMatch = formData.admissionNumber.match(/[a-zA-Z]+(\d{4})/); if (!admissionYearMatch) return []; const startYear = parseInt(admissionYearMatch[1], 10); return Array.from({ length: 4 }, (_, i) => `${startYear + i}-${startYear + i + 1}`); }, [formData.admissionNumber]);
    useEffect(() => { const fee = FEE_STRUCTURE[formData.programCode]; if (fee !== undefined) { setFormData(prev => ({ ...prev, totalFees: String(fee) })); } }, [formData.programCode]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setError(''); setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); if (!formData.academicYear) { setError('Please select an Academic Year.'); return; } try { const now = new Date(); const [year, month, day] = formData.paymentDate.split('-').map(Number); const dateWithTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()); const feeData: StudentFee = { admissionNumber: formData.admissionNumber.toUpperCase(), admissionType: formData.admissionType, academicYear: formData.academicYear, semester: parseInt(formData.semester, 10), programCode: formData.programCode, paymentDate: dateWithTime.toISOString(), totalFees: Math.round(parseFloat(formData.totalFees)) || 0, paidAmount: Math.round(parseFloat(formData.paidAmount)) || 0, dueAmount: finalDueAmount, status: status, feeType: 'Tuition' }; const message = await addStudentFee(feeData); alert(message); handleReset(); onDataChange(); } catch (error) { const message = error instanceof Error ? error.message : String(error); setError(message); alert(`Submission failed: ${message}`); } };
    const handleReset = () => { setFormData(initialFormState); setStudentName(''); setError(''); setStudentNotFoundError(''); setFetchedStudent(null); setHistoricalPaid(0); };
    const statusColor = status === 'Paid' ? 'bg-green-600' : status === 'Partial' ? 'bg-yellow-600' : 'bg-red-600';
    return ( 
        <form onSubmit={handleSubmit} className="space-y-8"> 
            {error && <div className="p-3 mb-4 rounded-md text-sm font-medium bg-red-500/10 text-red-300">{error}</div>} 
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6"> 
                <div className="space-y-6"> 
                    <Field label="Admission Number"><input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} placeholder="e.g., KCSE202001" className={commonInputClass} required/></Field> 
                    <Field label="Gender"><select name="gender" value={formData.gender} onChange={handleChange} className={commonSelectClass}><option value="M">Male</option><option value="F">Female</option></select></Field> 
                    <Field label="Program Code"><select name="programCode" value={formData.programCode} onChange={handleChange} className={commonSelectClass} disabled={isRestricted || !!debouncedAdmissionNumber}>{visibleDepts.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></Field> 
                    <Field label="Semester"><select name="semester" value={formData.semester} onChange={handleChange} className={commonSelectClass}>{Array.from({ length: 8 }, (_, i) => i + 1).map(sem => <option key={sem} value={sem}>{sem}</option>)}</select></Field> 
                    <Field label="Academic Year"><select name="academicYear" value={formData.academicYear} onChange={handleChange} className={commonSelectClass} required disabled={!formData.admissionNumber || derivedAcademicYears.length === 0}><option value="">{formData.admissionNumber ? 'Select' : 'Enter Admission No first'}</option>{derivedAcademicYears.map(year => <option key={year} value={year}>{year}</option>)}</select></Field> 
                    <Field label="Due Amount (₹)"><input type="text" value={`₹ ${parseFloat(dueAmount).toLocaleString('en-IN')}`} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} /></Field> 
                </div> 
                <div className="space-y-6"> 
                    <Field label="Student Name"><input type="text" value={studentName} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} placeholder="Student name appears here" />{studentNotFoundError && <p className="mt-1 text-xs text-yellow-400">{studentNotFoundError}</p>}</Field> 
                    <Field label="Admission Type"><select name="admissionType" value={formData.admissionType} onChange={handleChange} className={commonSelectClass}> <option>Counselling Seat/Scholarship/Sports Quota</option> <option>Management / Payment Seat</option> </select></Field> 
                    <Field label="Payment Date"><input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className={commonInputClass} required/></Field> 
                    <Field label="Total Fees (₹)"><input type="number" name="totalFees" value={formData.totalFees} onChange={handleChange} placeholder="e.g., 120000" className={commonInputClass} required onWheel={(e) => (e.target as HTMLInputElement).blur()} /></Field> 
                    <Field label="Paid Amount (₹)"><input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} placeholder="e.g., 75000" className={commonInputClass} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></Field> 
                    <Field label="Status"><div className={`flex items-center justify-center h-[42px] px-3 ${statusColor} text-white font-semibold rounded-md`}>{status}</div></Field> 
                </div> 
            </div> 
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-700"><button type="button" onClick={handleReset} className={commonResetButtonClass}>Reset Form</button><button type="submit" className={commonButtonClass}>Submit</button></div> 
        </form> 
    );
};

const PlacementEntryForm: React.FC<{ college: College; onDataChange: () => void; user: User }> = ({ college, onDataChange, user }) => {
    const forcedDept = getRestrictedDepartment(user);
    const initialFormState = { admissionNumber: '', studentName: '', gender: 'M', programCode: forcedDept || 'CSE', year: '4', semester: '7', studentMobileNumber: '', companyName: '', hrName: '', hrMobileNumber: '', academicYear: '', hrEmail: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [error, setError] = useState('');
    
    const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
    const visibleDepts = isRestricted && forcedDept ? DEPARTMENTS.filter(d => d === forcedDept) : DEPARTMENTS;

    const semesterOptions = useMemo(() => { return formData.year === '3' ? ['5', '6'] : ['7', '8']; }, [formData.year]);
    const academicYearsOptions = useMemo(() => { if (!formData.admissionNumber) return []; const admissionYearMatch = formData.admissionNumber.match(/[a-zA-Z]+(\d{4})/); if (!admissionYearMatch || !admissionYearMatch[1]) return []; const startYear = parseInt(admissionYearMatch[1], 10); return Array.from({ length: 4 }, (_, i) => `${startYear + i}-${startYear + i + 1}`); }, [formData.admissionNumber]);
    useEffect(() => { setFormData(prev => ({ ...prev, semester: prev.year === '3' ? '5' : '7' })); }, [formData.year]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setError(''); setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); if (!formData.academicYear) { setError('Please select an Academic Year.'); return; } const admissionYearMatch = formData.admissionNumber.match(/[a-zA-Z]+(\d{4})/); if (!admissionYearMatch || !admissionYearMatch[1]) { setError("Invalid Admission Number format. Cannot determine student's year."); return; } const admissionYear = parseInt(admissionYearMatch[1], 10); const currentAcademicYear = new Date(LATEST_ATTENDANCE_DATE).getFullYear(); const studentYear = currentAcademicYear - admissionYear + 1; if (studentYear < 3) { setError(`This student is in year ${studentYear}. Placements can only be entered for 3rd and 4th year students.`); return; } try { const placementData = { ...formData, collegeCode: college }; const message = await addStudentPlacement(placementData as any); alert(message); handleReset(); onDataChange(); } catch (error) { const message = error instanceof Error ? error.message : String(error); setError(message); alert(`Submission failed: ${message}`); } };
    const handleReset = () => { setFormData(initialFormState); setError(''); };
    return ( <form onSubmit={handleSubmit} className="space-y-8"> {error && <div className="p-3 mb-4 rounded-md text-sm font-medium bg-red-500/10 text-red-300">{error}</div>} <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6"> <div className="space-y-6"> <Field label="Admission Number"><input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} placeholder="e.g., KCSE202201" className={commonInputClass} required/></Field> <Field label="Student Name"><input type="text" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Student Name" className={commonInputClass} required/></Field> <Field label="Gender"><select name="gender" value={formData.gender} onChange={handleChange} className={commonSelectClass}><option value="M">Male</option><option value="F">Female</option></select></Field> <Field label="Course/Branch"><select name="programCode" value={formData.programCode} onChange={handleChange} className={commonSelectClass} disabled={isRestricted}>{visibleDepts.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></Field> <div className="grid grid-cols-3 gap-4"> <Field label="Year"><select name="year" value={formData.year} onChange={handleChange} className={commonSelectClass}><option value="3">3rd Year</option><option value="4">4th Year</option></select></Field> <Field label="Semester"><select name="semester" value={formData.semester} onChange={handleChange} className={commonSelectClass}>{semesterOptions.map(sem => <option key={sem} value={sem}>{sem}</option>)}</select></Field> <Field label="Academic Year"><select name="academicYear" value={formData.academicYear} onChange={handleChange} className={commonSelectClass} required disabled={academicYearsOptions.length === 0}><option value="">{academicYearsOptions.length > 0 ? 'Select' : 'Enter Admission No'}</option>{academicYearsOptions.map(year => <option key={year} value={year}>{year}</option>)}</select></Field> </div> <Field label="Student Mobile Number"><input type="tel" name="studentMobileNumber" value={formData.studentMobileNumber} onChange={handleChange} placeholder="10-digit number" pattern="[0-9]{10}" className={commonInputClass} required/></Field> </div> <div className="space-y-6"> <Field label="Company/Organization Name"><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g., Infosys Ltd" className={commonInputClass} required/></Field> <Field label="HR Name"><input type="text" name="hrName" value={formData.hrName} onChange={handleChange} placeholder="e.g., Priya Sharma" className={commonInputClass} required/></Field> <Field label="HR Mobile Number"><input type="tel" name="hrMobileNumber" value={formData.hrMobileNumber} onChange={handleChange} placeholder="10-digit number" pattern="[0-9]{10}" className={commonInputClass} required/></Field> <Field label="HR Email"><input type="email" name="hrEmail" value={formData.hrEmail} onChange={handleChange} placeholder="e.g., hr@infosys.com" className={commonInputClass} required/></Field> </div> </div> <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-700"><button type="button" onClick={handleReset} className={commonResetButtonClass}>Reset Form</button><button type="submit" className={commonButtonClass}>Submit</button></div> </form> );
};

const MarksEntryForm: React.FC<{ user: User; college: College; onDataChange: () => void }> = ({ user, college, onDataChange }) => {
    const forcedDept = getRestrictedDepartment(user);
    const initialFormState = { examType: 'Semester', admissionNumber: '', programCode: forcedDept || 'CSE', studentName: '', gender: 'M' as 'M' | 'F', semester: '1', subjectCode: '', subjectName: '', internalMark: '', internalOutOf: '40', externalMark: '', externalOutOf: '60' };
    const [formData, setFormData] = useState(initialFormState);
    
    const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
    const visibleDepts = isRestricted && forcedDept ? DEPARTMENTS.filter(d => d === forcedDept) : DEPARTMENTS;

    const { totalMarks, maxMarks } = useMemo(() => { const internal = parseInt(formData.internalMark, 10) || 0; const external = parseInt(formData.externalMark, 10) || 0; const internalOutOf = parseInt(formData.internalOutOf, 10) || 0; const externalOutOf = parseInt(formData.externalOutOf, 10) || 0; return { totalMarks: internal + external, maxMarks: internalOutOf + externalOutOf }; }, [formData.internalMark, formData.externalMark, formData.internalOutOf, formData.externalOutOf]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { const message = await addStudentMark({ ...formData, collegeCode: college, semester: parseInt(formData.semester, 10), marksObtained: totalMarks, maxMarks: maxMarks, internalMark: parseInt(formData.internalMark, 10) || undefined, externalMark: parseInt(formData.externalMark, 10) || undefined, }); alert(message); handleReset(); onDataChange(); } catch (error) { alert(`Submission failed: ${error instanceof Error ? error.message : String(error)}`); } };
    const handleReset = () => { setFormData(initialFormState); };
    return ( <form onSubmit={handleSubmit} className="space-y-8"> <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6"> <div className="space-y-6"> <Field label="Admission Number"><input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} placeholder="e.g., KCSE202401" className={commonInputClass} required/></Field> <Field label="Program Code"><select name="programCode" value={formData.programCode} onChange={handleChange} className={commonSelectClass} required disabled={isRestricted}><option value="" disabled>Select Program</option>{visibleDepts.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></Field> <Field label="Student Name"><input type="text" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Student Name" className={commonInputClass} required/></Field> <Field label="Gender"><select name="gender" value={formData.gender} onChange={handleChange} className={commonSelectClass}><option value="M">Male</option><option value="F">Female</option></select></Field> <Field label="Semester"><select name="semester" value={formData.semester} onChange={handleChange} className={commonSelectClass} required>{Array.from({ length: 8 }, (_, i) => i + 1).map(sem => <option key={sem} value={sem}>{sem}</option>)}</select></Field> <Field label="Subject Code"><input type="text" name="subjectCode" value={formData.subjectCode} onChange={handleChange} placeholder="e.g., CS101" className={commonInputClass} required/></Field> <Field label="Subject Name"><input type="text" name="subjectName" value={formData.subjectName} onChange={handleChange} placeholder="e.g., Intro to Programming" className={commonInputClass} required/></Field> </div> <div className="space-y-6"> <Field label="Exam Type"><select name="examType" value={formData.examType} onChange={handleChange} className={commonSelectClass}><option>Semester</option><option>Internal</option><option>Midterm</option></select></Field> <Field label="Internal Mark" desc="Enter marks obtained"><select name="internalMark" value={formData.internalMark} onChange={handleChange} className={commonSelectClass}><option value="">Select Mark</option>{Array.from({ length: 41 }, (_, i) => i).map(mark => <option key={mark} value={mark}>{mark}</option>)}</select></Field> <Field label="Internal Out of Marks" desc="Default = 40 (editable)"><input type="number" name="internalOutOf" value={formData.internalOutOf} onChange={handleChange} className={commonInputClass} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></Field> <Field label="External Mark" desc="Enter marks obtained"><select name="externalMark" value={formData.externalMark} onChange={handleChange} className={commonSelectClass}><option value="">Select Mark</option>{Array.from({ length: 61 }, (_, i) => i).map(mark => <option key={mark} value={mark}>{mark}</option>)}</select></Field> <Field label="External Out of Marks" desc="Default = 60 (editable)"><input type="number" name="externalOutOf" value={formData.externalOutOf} onChange={handleChange} className={commonInputClass} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></Field> <Field label="Total Marks" desc="Auto = Internal + External"><input type="text" value={totalMarks} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} /></Field> <Field label="Out of Marks (Max)" desc="Auto = Internal Out Of + External Out Of"><input type="number" name="maxMarks" value={maxMarks} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} /></Field> </div> </div> <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-700"><button type="button" onClick={handleReset} className={commonResetButtonClass}>Reset Form</button><button type="submit" className={commonButtonClass}>Submit</button></div> </form> );
};

const AttendanceForm: React.FC<{ type: 'student' | 'faculty' | 'staff', onDataChange: () => void }> = ({ type, onDataChange }) => {
    const [id, setId] = useState(''); const [date, setDate] = useState(formatDate(new Date())); const [morning, setMorning] = useState<'Present' | 'Absent'>('Present'); const [afternoon, setAfternoon] = useState<'Present' | 'Absent'>('Present'); const idLabel = type === 'student' ? 'Admission Number' : (type === 'faculty' ? 'Faculty ID' : 'Staff ID');
    const { status, statusColor } = useMemo(() => { if (morning === 'Present' && afternoon === 'Present') return { status: 'Present', statusColor: 'text-green-400' }; if (morning === 'Present' || afternoon === 'Present') return { status: 'Half Day', statusColor: 'text-yellow-400' }; return { status: 'Absent', statusColor: 'text-red-400' }; }, [morning, afternoon]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); try { const data = { id, date, morning, afternoon }; if (type === 'student') addStudentAttendance(data); else if (type === 'faculty') addFacultyAttendance(data); else if (type === 'staff') addStaffAttendance(data); alert(`${type.charAt(0).toUpperCase() + type.slice(1)} attendance for ID ${id} submitted.`); handleReset(); onDataChange(); } catch (error) { alert(`Submission failed: ${error instanceof Error ? error.message : String(error)}`); } };
    const handleReset = () => { setId(''); setDate(formatDate(new Date())); setMorning('Present'); setAfternoon('Present'); };
    return ( <form onSubmit={handleSubmit} className="space-y-6"> <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end"> <div className="lg:col-span-2"> <label className="block mb-2 text-sm font-medium text-slate-300">{idLabel}</label> <input type="text" value={id} onChange={e => setId(e.target.value)} className={commonInputClass} required /> </div> <div> <label className="block mb-2 text-sm font-medium text-slate-300">Date</label> <input type="date" value={date} onChange={e => setDate(e.target.value)} className={commonInputClass} required /> </div> <div> <label className="block mb-2 text-sm font-medium text-slate-300">Morning</label> <select value={morning} onChange={e => setMorning(e.target.value as any)} className={commonSelectClass}><option>Present</option><option>Absent</option></select> </div> <div> <label className="block mb-2 text-sm font-medium text-slate-300">Afternoon</label> <select value={afternoon} onChange={e => setAfternoon(e.target.value as any)} className={commonSelectClass}><option>Present</option><option>Absent</option></select> </div> <div> <label className="block mb-2 text-sm font-medium text-slate-300">Status</label> <div className={`flex items-center h-[42px] px-3 bg-slate-700 border border-slate-700 rounded-md text-sm font-semibold cursor-not-allowed ${statusColor}`}>{status}</div> </div> </div> <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700"><button type="button" onClick={handleReset} className={commonResetButtonClass}>Reset Form</button><button type="submit" className={commonButtonClass}>Submit</button></div> </form> );
};

const SyllabusUploadForm: React.FC<{ user: User }> = ({ user }) => {
    const forcedDept = getRestrictedDepartment(user);
    const [department, setDepartment] = useState(forcedDept || 'CSE');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
    const visibleDepts = isRestricted && forcedDept ? DEPARTMENTS.filter(d => d === forcedDept) : DEPARTMENTS;

    const showTemporaryNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].type !== 'application/pdf') {
                showTemporaryNotification('error', 'Only PDF files are allowed.');
                return;
            }
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !department) {
            showTemporaryNotification('error', 'Please select a department and a PDF file.');
            return;
        }
        setIsUploading(true);
        try {
            const result = await uploadSyllabusPdf(department, file);
            if (result.success) {
                showTemporaryNotification('success', result.message);
                
                // FIXED: Removed the logic that created an automatic entry in 'exam_notifications' 
                // to maintain strict separation between Syllabus and Notifications.

                setFile(null); 
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                showTemporaryNotification('error', result.message);
            }
        } catch (error) {
            const err = error as { success: boolean, message: string };
            showTemporaryNotification('error', `Upload failed: ${err.message || "An unexpected error occurred."}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-white">Upload JNTUH Syllabus PDFs</h3>
            
            {notification && (
                <div className={`p-4 rounded-md text-sm font-medium ${notification.type === 'success' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                    {notification.message}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                <div>
                    <label htmlFor="syllabus-dept" className="block mb-2 text-sm font-medium text-slate-300">Department</label>
                    <select id="syllabus-dept" value={department} onChange={e => setDepartment(e.target.value)} className={commonSelectClass} disabled={isRestricted}>
                        {visibleDepts.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="syllabus-file" className="block mb-2 text-sm font-medium text-slate-300">Syllabus File (PDF only)</label>
                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            id="syllabus-file"
                            type="file"
                            onChange={handleFileChange}
                            accept="application/pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-between bg-slate-800 border border-slate-700 text-white text-sm rounded-md p-2.5">
                            <span className={file ? 'text-white truncate' : 'text-slate-400'}>{file ? file.name : 'Choose a PDF file...'}</span>
                            <UploadIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        </div>
                    </div>
                </div>
                 <div className="md:col-span-2 flex justify-end">
                    <button onClick={handleUpload} disabled={!file || isUploading} className="w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-blue-400 disabled:cursor-not-allowed">
                        {isUploading ? 'Syncing...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const NotificationUploadForm: React.FC<{ user: User }> = ({ user }) => {
    const forcedDept = getRestrictedDepartment(user);
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState(forcedDept || 'All');
    const [lastDate, setLastDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
    const visibleDepts = isRestricted && forcedDept ? DEPARTMENTS.filter(d => d === forcedDept) : DEPARTMENTS;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || !lastDate) {
            alert("Please fill all fields.");
            return;
        }

        const fileUrl = URL.createObjectURL(file);
        const newNotif = {
            id: Date.now(),
            title: title,
            department: department,
            lastDate: lastDate,
            uploadDate: new Date().toISOString(),
            fileName: file.name,
            fileUrl: fileUrl, 
            isNew: true
        };

        const existingNotifs = JSON.parse(localStorage.getItem('exam_notifications') || '[]');
        localStorage.setItem('exam_notifications', JSON.stringify([newNotif, ...existingNotifs]));

        alert("Notification Submitted Successfully!");
        setTitle('');
        setDepartment(forcedDept || 'All');
        setLastDate('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-white">Upload Exam Notification Date</h3>
            <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Notification Title</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className={commonInputClass}
                        placeholder="e.g., B.Tech 4-1 Exam Fee Notification"
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                    <select 
                        value={department} 
                        onChange={(e) => setDepartment(e.target.value)} 
                        className={commonSelectClass}
                        disabled={isRestricted}
                    >
                        {!isRestricted && <option value="All">All Departments</option>}
                        {visibleDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Last Date (Without Fine)</label>
                    <input 
                        type="date" 
                        value={lastDate} 
                        onChange={(e) => setLastDate(e.target.value)} 
                        className={commonInputClass}
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">PDF File</label>
                    <div className="relative">
                         <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required
                        />
                         <div className="flex items-center justify-between bg-slate-800 border border-slate-700 text-white text-sm rounded-md p-2.5">
                            <span className={file ? 'text-white truncate' : 'text-slate-400'}>{file ? file.name : 'Choose a PDF file...'}</span>
                            <UploadIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        </div>
                    </div>
                </div>
                <div className="pt-4">
                    <button type="submit" className={commonButtonClass}>Submit</button>
                </div>
            </form>
        </div>
    );
};

const ApplicationSubmission: React.FC<ApplicationSubmissionProps> = ({ user, onToggleSidebar, onDataChange }) => {
    const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD;
    
    const [activeTab, setActiveTab] = useState<ActiveTab>('manual');
    const [manualFormType, setManualFormType] = useState<FormType>(isRestricted ? 'marks' : 'fee');
    const [manualCollege, setManualCollege] = useState<College>(user.role === Role.CHAIRMAN ? College.KNRR : user.college!);
    const [uploadDataType, setUploadDataType] = useState<FormType>('marks');
    const [uploadCollege, setUploadCollege] = useState<College>(user.role === Role.CHAIRMAN ? College.KNRR : user.college!);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedDateTime, setUploadedDateTime] = useState('');

    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [uploadResult, setUploadResult] = useState<UploadResultStats | null>(null);
    const [uploadedFileChecksums, setUploadedFileChecksums] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (uploadDataType === 'fee') {
            const now = new Date();
            const formatted = now.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', '');
            setUploadedDateTime(formatted);
        } else {
            setUploadedDateTime('');
        }
    }, [uploadDataType]);

    const manualOptions = useMemo(() => [
        { value: 'fee', label: 'Tuition Fees Entry', restricted: true },
        { value: 'examFee', label: 'Exam Fees Entry', restricted: true },
        { value: 'placement', label: 'Placement Entry', restricted: false },
        { value: 'marks', label: 'Marks Entry', restricted: false },
        { value: 'studentAttendance', label: 'Student Attendance', restricted: false },
        { value: 'facultyAttendance', label: 'Faculty Attendance', restricted: true },
        { value: 'staffAttendance', label: 'Staff Attendance', restricted: true },
    ].filter(opt => !isRestricted || !opt.restricted), [isRestricted]);

    const uploadOptions = useMemo(() => [
        { value: 'marks', label: 'Marks Data', restricted: false },
        { value: 'fee', label: 'Tuition Fees', restricted: true },
        { value: 'examFee', label: 'Exam Fees', restricted: true },
        { value: 'placement', label: 'Placement List', restricted: false },
        { value: 'studentAttendance', label: 'Student Attendance', restricted: false },
        { value: 'facultyAttendance', label: 'Faculty Attendance', restricted: true },
        { value: 'staffAttendance', label: 'Staff Attendance', restricted: true },
    ].filter(opt => !isRestricted || !opt.restricted), [isRestricted]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].size > 10 * 1024 * 1024) { alert("File size exceeds 10MB."); return; }
            setSelectedFile(e.target.files[0]);
            setUploadStatus('idle');
        }
    };
    
    const handleFileUpload = () => {
        if (!selectedFile) {
            alert("Please select a file first.");
            return;
        }

        const checksum = `${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}-${uploadCollege}`;
        if (uploadedFileChecksums.has(checksum)) {
            setUploadStatus('error');
            setUploadResult({
                message: 'This file appears to have been uploaded already for this college. Duplicate upload blocked.',
                totalRows: 0, processed: 0, errors: 0, successRate: '0%',
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
            try {
                if (!e.target?.result) {
                    throw new Error("Failed to read file.");
                }
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                
                let allRows: any[] = [];
                workbook.SheetNames.forEach((sheetName: string) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    const normalizedRows = rows.map((row: any) => {
                        const newRow: any = {};
                        Object.keys(row).forEach(key => {
                            const lowerKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            const val = row[key];

                            if (['admissionnumber', 'admissionno', 'htno', 'rollno'].includes(lowerKey)) newRow.admissionNumber = String(val || '').trim();
                            else if (['studentname', 'name'].includes(lowerKey)) newRow.studentName = String(val || '').trim();
                            else if (['collegecode', 'college'].includes(lowerKey)) newRow.collegeCode = String(val || '').trim();
                            else if (['programcode', 'department', 'branch', 'course'].includes(lowerKey)) newRow.programCode = String(val || '').trim();
                            else if (lowerKey === 'gender') newRow.gender = String(val || '').trim();
                            else if (lowerKey === 'semester') newRow.semester = val;
                            else if (['subjectcode', 'subcode'].includes(lowerKey)) newRow.subjectCode = String(val || '').trim();
                            else if (['subjectname', 'subname'].includes(lowerKey)) newRow.subjectName = String(val || '').trim();
                            else if (['internal', 'internalmark', 'internalmarks', 'internalm'].includes(lowerKey)) newRow.internalMark = val;
                            else if (['external', 'externalmark', 'externalmarks', 'externalm'].includes(lowerKey)) newRow.externalMark = val;
                            else if (['total', 'totalmarks', 'marks', 'marksobtained'].includes(lowerKey)) newRow.marksObtained = val;
                            else if (['maxmarks', 'outof', 'max', 'outofmarksmax'].includes(lowerKey)) newRow.maxMarks = val;
                            else if (['academicyear', 'year'].includes(lowerKey)) newRow.academicYear = String(val || '').trim();
                            else if (['totalfees', 'fee', 'amount'].includes(lowerKey)) newRow.totalFees = val;
                            else if (['paidamount', 'paid'].includes(lowerKey)) newRow.paidAmount = val;
                            else if (['dueamount', 'due'].includes(lowerKey)) newRow.dueAmount = val;
                            else if (lowerKey === 'status') newRow.status = val;
                            else if (['paymentdate', 'date'].includes(lowerKey)) newRow.paymentDate = val;
                            else newRow[key] = val; 
                        });

                        if (newRow.admissionNumber) {
                            newRow.admissionNumber = String(newRow.admissionNumber).toUpperCase();
                        }
                        if (uploadDataType === 'marks' && newRow.maxMarks === undefined) {
                            newRow.maxMarks = 100; 
                        }
                        if (!newRow.subjectCode && sheetName && uploadDataType === 'marks') {
                             const sheetParts = sheetName.split('-');
                             const potentialCode = sheetParts[0].trim();
                             if (potentialCode.length < 15 && potentialCode.length > 3) {
                                 newRow.subjectCode = potentialCode;
                             }
                        }
                        newRow.__SheetName__ = sheetName;
                        if(uploadedDateTime) newRow.__UploadTimestamp__ = uploadedDateTime;
                        return newRow;
                    });
                    const validRows = normalizedRows.filter((r: any) => r.admissionNumber && String(r.admissionNumber).length > 2);
                    allRows = allRows.concat(validRows);
                });

                if (allRows.length === 0) {
                    throw new Error("The Excel file is empty or contains no processable data (checked all sheets).");
                }

                const result = await uploadExcelData(allRows, uploadDataType, uploadCollege);
                const stats = result.stats || { totalRows: 0, processed: 0, errors: 0 };
                setUploadStatus(result.success ? 'success' : 'error');
                setUploadResult({
                    message: result.message,
                    totalRows: stats.totalRows,
                    processed: stats.processed,
                    errors: stats.errors,
                    successRate: stats.totalRows > 0 ? ((stats.processed / stats.totalRows) * 100).toFixed(0) + '%' : '100%',
                });

                if (result.success) {
                    setUploadedFileChecksums(prev => new Set(prev).add(checksum));
                    const now = new Date();
                    const formatted = now.toLocaleString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
                    }).replace(',', '');
                    setUploadedDateTime(formatted);
                    onDataChange();
                }
            } catch (error) {
                setUploadStatus('error');
                setUploadResult({
                    message: `An error occurred during processing: ${error instanceof Error ? error.message : "Unknown error"}`,
                    totalRows: 0, processed: 0, errors: 0, successRate: '0%',
                });
            } finally {
                if (document.getElementById('file-upload-input')) {
                  (document.getElementById('file-upload-input') as HTMLInputElement).value = '';
                }
                setSelectedFile(null);
            }
        };
        reader.onerror = () => {
             setUploadStatus('error');
             setUploadResult({
                message: "Failed to read the file. Please ensure it is not corrupted.",
                totalRows: 0, processed: 0, errors: 0, successRate: '0%',
             });
        };
        reader.readAsArrayBuffer(selectedFile);
    };
    
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, d: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragging(d); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files?.[0]) {
            if (e.dataTransfer.files[0].size > 10 * 1024 * 1024) { alert("File size exceeds 10MB."); return; }
            setSelectedFile(e.dataTransfer.files[0]);
            setUploadStatus('idle');
        }
    };

    const tabClass = (tabName: ActiveTab) => `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tabName ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`;
    
    const getTemplateInfo = (type: FormType) => {
        if (type === 'fee') {
            return "Columns: College Code, AdmissionNumber, Student Name, Gender, Admission Type, Program Code, Semester, Academic Year, Paid Amount, Total Fees.";
        }
        return ({
            'marks': "Columns: College Code, AdmissionNumber, Program Code, Student Name, Gender, Year, Semester, ExamType, SubjectCode, SubjectName, Internal Mark, Internal Out of Marks, External Mark, External Out of Marks, Total Marks, Out of Marks (Max).",
            'studentAttendance': "Columns: AdmissionNumber, Date, Morning, Afternoon.", 
            'facultyAttendance': "Columns: FacultyID, Date, Morning, Afternoon.", 
            'staffAttendance': "Columns: StaffID, Date, Morning, Afternoon.",
            'placement': "Columns: S.No, College Code, Admission Number, Student Name, Course/Branch, Year, Semester, Student Mobile Number, Company/Organization Name, HR Name, HR Mobile Number.",
            'fee': "Columns: AdmissionNumber, AcademicYear, TotalFees, PaidAmount.",
            'examFee': "Columns: AdmissionNumber, Semester, Academic Year, LateFee, TotalExamFee."
        }[type]);
    };

    const renderManualTab = () => (
        <div className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Select Form Type</label>
                    <select value={manualFormType} onChange={(e) => setManualFormType(e.target.value as FormType)} className={commonSelectClass}>
                        {manualOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">College Code</label>
                    <select value={manualCollege} onChange={(e) => setManualCollege(e.target.value as College)} className={commonSelectClass} disabled={user.role !== Role.CHAIRMAN}>
                        {Object.entries(COLLEGE_NAMES)
                            .filter(([key]) => key !== 'ALL')
                            .map(([key, name]) => <option key={key} value={key}>{name as React.ReactNode}</option>)}
                    </select>
                </div>
            </div>
            <div className="p-6 bg-slate-900 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-6 capitalize">{manualFormType.replace(/([A-Z])/g, ' $1')} Form</h3>
                {manualFormType === 'marks' && <MarksEntryForm user={user} college={manualCollege} onDataChange={onDataChange} />}
                {manualFormType === 'placement' && <PlacementEntryForm college={manualCollege} onDataChange={onDataChange} user={user} />}
                {manualFormType === 'fee' && <FeeEntryForm user={user} college={manualCollege} onDataChange={onDataChange} />}
                {manualFormType === 'examFee' && <ExamFeeEntryForm college={manualCollege} onDataChange={onDataChange} user={user} />}
                {manualFormType === 'studentAttendance' && <AttendanceForm type="student" onDataChange={onDataChange} />}
                {manualFormType === 'facultyAttendance' && <AttendanceForm type="faculty" onDataChange={onDataChange} />}
                {manualFormType === 'staffAttendance' && <AttendanceForm type="staff" onDataChange={onDataChange} />}
            </div>
        </div>
    );
    
    const UploadResultDisplay = () => {
        if (uploadStatus === 'idle' || !uploadResult) return null;
      
        const isSuccess = uploadStatus === 'success';
        const bannerClasses = isSuccess ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30';
        const textClasses = isSuccess ? 'text-green-300' : 'text-red-300';
        const icon = isSuccess ? <CheckCircleIcon className="h-5 w-5 text-green-400" /> : <XCircleIcon className="h-5 w-5 text-red-400" />;
      
        const StatCard = ({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) => (
          <div className="bg-slate-950/30 p-3 rounded-lg text-center">
            <p className="text-xs text-slate-400">{label}</p>
            <p className={`text-xl font-bold ${valueColor || 'text-white'}`}>{value}</p>
          </div>
        );
      
        return (
          <div className={`p-4 rounded-lg border ${bannerClasses} mb-6`}>
            <div className="flex items-start gap-3 mb-4">
              {icon}
              <p className={`text-sm font-semibold ${textClasses} whitespace-pre-wrap`}>{uploadResult.message}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Rows" value={uploadResult.totalRows} />
              <StatCard label="Processed" value={uploadResult.processed} valueColor={isSuccess ? 'text-green-400' : 'text-white'} />
              <StatCard label="Errors" value={uploadResult.errors} valueColor={uploadResult.errors > 0 ? 'text-red-400' : 'text-white'} />
              <StatCard label="Success Rate" value={uploadResult.successRate} valueColor={isSuccess ? 'text-green-400' : 'text-white'} />
            </div>
          </div>
        );
      };

    const renderUploadTab = () => (
        <div className="p-6 space-y-6">
            <UploadResultDisplay />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block mb-2 text-sm font-medium text-slate-300">College Code</label><select value={uploadCollege} onChange={e => setUploadCollege(e.target.value as College)} disabled={user.role !== Role.CHAIRMAN} className={commonSelectClass}>{Object.entries(COLLEGE_NAMES).filter(([key]) => key !== 'ALL').map(([key, name]) => <option key={key} value={key}>{name as React.ReactNode}</option>)}</select></div>
                <div><label className="block mb-2 text-sm font-medium text-slate-300">Uploaded By</label><input type="text" value={user.name} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} /></div>
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">Select Data Type</label>
                <select value={uploadDataType} onChange={(e) => setUploadDataType(e.target.value as FormType)} className={commonSelectClass}>
                    {uploadOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="mt-4 p-4 bg-blue-900/50 border border-blue-700 rounded-md"><p className="text-sm text-blue-200"><span className="font-semibold">Template Info:</span> {getTemplateInfo(uploadDataType)}</p><div className="flex items-center gap-4 mt-2"><button className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:underline"><DownloadIcon className="h-4 w-4" /> Download Template</button><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:underline"><TableCellsIcon className="h-4 w-4" /> Show Sample Data</button></div></div>
            </div>
            <div onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)} onDragOver={(e) => handleDragEvents(e, true)} onDrop={handleDrop} className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-slate-800' : 'border-slate-600 bg-slate-900 hover:border-slate-500'}`}>
                <div className="flex flex-col items-center justify-center text-slate-400"><UploadIcon className="h-10 w-10 mb-3" /><h3 className="text-lg font-semibold text-slate-200">{selectedFile ? `File: ${selectedFile.name}` : 'Click or drag file to upload'}</h3><p className="text-sm">Supports: .xlsx, .xls, .csv (max 10MB)</p></div>
                <input id="file-upload-input" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
            </div>
            <div className="flex items-center justify-end"><button onClick={handleFileUpload} disabled={!selectedFile} className={commonButtonClass}><UploadIcon className="h-5 w-5 -ml-1 mr-2 inline-block"/>Upload Excel File</button></div>
        </div>
    );
    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex items-center gap-4 mb-4"><button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}><MenuIcon className="h-6 w-6" /></button><div><h2 className="text-2xl sm:text-3xl font-bold text-white">Application Submission</h2><p className="text-slate-400 mt-1 text-sm">Submit attendance and marks data manually or upload Excel files in bulk.</p></div></div>
            <div className="bg-slate-800 rounded-lg shadow-lg">
                <div className="border-b border-slate-700 flex justify-between items-center">
                    <nav className="-mb-px flex space-x-6 px-6">
                        <button onClick={() => setActiveTab('manual')} className={tabClass('manual')}>Manual Submit</button>
                        <button onClick={() => setActiveTab('upload')} className={tabClass('upload')}>Upload MS Excel</button>
                        <button onClick={() => setActiveTab('syllabus')} className={tabClass('syllabus')}>JNTUH Syllabus PDFs</button>
                        <button onClick={() => setActiveTab('notificationUpload')} className={tabClass('notificationUpload')}>Exam Notification Date</button>
                    </nav>
                </div>
                <div className="p-4 bg-slate-900/50 border-b border-slate-700"><p className="text-sm text-slate-300">Logged in as: <span className="font-semibold text-white">{user.name} ({user.role})</span> | College: <span className="font-semibold text-white">{user.college ? COLLEGE_NAMES[user.college] : 'ALL'}</span> | ID: <span className="font-semibold text-white">{user.id}</span></p></div>
                {activeTab === 'manual' && renderManualTab()}
                {activeTab === 'upload' && renderUploadTab()}
                {activeTab === 'syllabus' && <SyllabusUploadForm user={user} />}
                {activeTab === 'notificationUpload' && <NotificationUploadForm user={user} />}
            </div>
            {isModalOpen && <SampleDataModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dataType={uploadDataType} />}
        </main>
    );
};
export default ApplicationSubmission;