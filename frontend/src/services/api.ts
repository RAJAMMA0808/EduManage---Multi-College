import {
  College,
  DashboardData,
  DetailedFacultyCSVData,
  DetailedStaffCSVData,
  DetailedStudentCSVData,
  Faculty,
  Staff,
  Student,
  StudentDetailsType,
  FacultyDetailsType,
  StaffDetailsType,
  StudentMark,
  StudentAttendance,
  FacultyAttendance,
  StaffAttendance,
  SyllabusPdf,
  Role,
  PlacementDetails,
  StudentFee,
  StudentWithFee,
  StudentAttendanceSummary,
  StudentWithAttendance,
  DetailedPlacementCsvData,
  PlacementWithStudent,
  LogEntry,
} from '../types/index';
import { downloadPdf } from '../utils/pdfUtils';
import {
  mockFaculty,
  mockFacultyAttendance,
  mockStaff,
  mockStaffAttendance,
  mockStudentAttendance,
  mockStudentMarks,
  mockStudents,
  mockPlacementDetails,
  mockStudentFees,
  ALL_SUBJECTS, 
} from './mockData';
import { MOCK_USERS, LATEST_ATTENDANCE_DATE, JNTUH_RULES, COLLEGE_CODES } from '../constants/index';

const getOnlineAttendanceLogs = (): any[] => {
    try {
        const stored = localStorage.getItem('online_attendance_log');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const clearAllBrowserData = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
};

export const verifyLocation = async (userId: string, lat: number, lng: number): Promise<{ distance: number; lat: number; lng: number; anchored: boolean }> => {
    const res = await fetch('/api/verify-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lat, lng })
    });
    if (!res.ok) throw new Error("Location verification failed on server.");
    return await res.json();
};

export const getDashboardData = async (
    college: College, 
    year: string, 
    department: string, 
    rollNo: string, 
    facultyId: string, 
    staffId: string, 
    startDate: string, 
    endDate: string, 
    semester: string, 
    subject: string
): Promise<DashboardData> => {
  try {
      const params = new URLSearchParams();
      if (college && college !== College.ALL) params.append('college', college);
      if (year && year !== 'all') params.append('year', year);
      if (department && department !== 'all') params.append('department', department);
      if (rollNo && rollNo !== 'all') params.append('rollNo', rollNo);
      if (facultyId && facultyId !== 'all') params.append('facultyId', facultyId);
      if (staffId && staffId !== 'all') params.append('staffId', staffId);
      params.append('date', startDate); 
      if (semester && semester !== 'all') params.append('semester', semester);
      if (subject && subject !== 'All Subjects') params.append('subject', subject);
      
      const response = await fetch(`/api/dashboard?${params.toString()}`);
      if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();

      const parts = startDate.split('-');
      const portalDateFormat = `${parts[2]}/${parts[1]}/${parts[0]}`;
      const onlineLogs = getOnlineAttendanceLogs().filter(log => {
          const matchesDate = log.date === portalDateFormat;
          const matchesCollege = !college || college === College.ALL || log.collegeCode === college;
          return matchesDate && matchesCollege;
      });
      
      if (onlineLogs.length > 0) {
          const onlineStudentsOnDate = onlineLogs.filter(log => log.userRole === Role.STUDENT);
          const studentIdsSet = new Set(onlineStudentsOnDate.map(l => l.userId));
          
          data.studentAttendance.present += studentIdsSet.size;
          data.studentAttendance.fullDay += studentIdsSet.size;
          data.studentAttendance.absent = Math.max(0, data.studentAttendance.total - data.studentAttendance.present);

          const onlineFacultyOnDate = onlineLogs.filter(log => log.userRole === Role.FACULTY);
          const facultyIdsSet = new Set(onlineFacultyOnDate.map(l => l.userId));
          
          data.facultyMetrics.fullDay += facultyIdsSet.size;
          data.facultyMetrics.absent = Math.max(0, data.facultyMetrics.total - (data.facultyMetrics.fullDay + data.facultyMetrics.halfDay));
      }

      return data;
  } catch (error) {
       return {
          studentAttendance: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
          studentAcademics: { passPercentage: 0, passCount: 0, failCount: 0, aggregatePercentage: 0 },
          facultyMetrics: { total: 0, fullDay: 0, halfDay: 0, absent: 0 },
          staffMetrics: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
          placementMetrics: { totalStudents: 0, placedStudents: 0, notPlacedStudents: 0, placementPercentage: 0 },
          studentFees: { totalFees: 0, paidAmount: 0, dueAmount: 0, paidCount: 0, partialCount: 0, dueCount: 0 },
      };
  }
};

export const getStudentDetails = async (admissionNumber: string): Promise<StudentDetailsType | null> => {
    try {
        const response = await fetch(`/api/students/${admissionNumber}`);
        if (!response.ok) return null;
        const data = await response.json();
        
        const onlineLogs = getOnlineAttendanceLogs().filter(log => log.userId === admissionNumber);
        onlineLogs.forEach(log => {
            const [d, m, y] = log.date.split('/');
            const systemDate = `${y}-${m}-${d}`;
            const exists = data.attendance.some((a: any) => a.date === systemDate);
            if (!exists) {
                data.attendance.push({ 
                    admissionNumber: log.userId, 
                    date: systemDate, 
                    morning: 'Present', 
                    afternoon: 'Present',
                    isLate: log.isLate || false,
                    time: log.time || ''
                });
            } else {
                const idx = data.attendance.findIndex((a: any) => a.date === systemDate);
                if (idx !== -1) {
                    data.attendance[idx].isLate = log.isLate || false;
                    data.attendance[idx].time = log.time || '';
                }
            }
        });

        return data;
    } catch (error) {
        return null;
    }
};

export const getFacultyDetails = async (facultyId: string): Promise<FacultyDetailsType | null> => {
    const faculty = mockFaculty.find(f => f.facultyId.toLowerCase() === facultyId.toLowerCase());
    if (!faculty) return null;
    const attendance = mockFacultyAttendance.filter(a => a.facultyId.toLowerCase() === facultyId.toLowerCase());
    
    const onlineLogs = getOnlineAttendanceLogs().filter(log => log.userId === facultyId);
    onlineLogs.forEach(log => {
        const [d, m, y] = log.date.split('/');
        const systemDate = `${y}-${m}-${d}`;
        const existingIdx = attendance.findIndex(a => a.date === systemDate);
        if (existingIdx === -1) {
            attendance.push({ 
                facultyId: log.userId, 
                date: systemDate, 
                morning: 'Present', 
                afternoon: 'Present',
                isLate: log.isLate || false,
                time: log.time || ''
            } as any);
        } else {
            (attendance[existingIdx] as any).isLate = log.isLate || false;
            (attendance[existingIdx] as any).time = log.time || '';
        }
    });

    return { ...faculty, attendance: attendance as any };
};

export const getStaffDetails = async (staffId: string): Promise<StaffDetailsType | null> => {
    const staff = mockStaff.find(s => s.staffId.toLowerCase() === staffId.toLowerCase());
    if (!staff) return null;
    const attendance = mockStaffAttendance.filter(a => a.staffId.toLowerCase() === staffId.toLowerCase());
    
    const onlineLogs = getOnlineAttendanceLogs().filter(log => log.userId === staffId);
    onlineLogs.forEach(log => {
        const [d, m, y] = log.date.split('/');
        const systemDate = `${y}-${m}-${d}`;
        const existingIdx = attendance.findIndex(a => a.date === systemDate);
        if (existingIdx === -1) {
            attendance.push({ 
                staffId: log.userId, 
                date: systemDate, 
                morning: 'Present', 
                afternoon: 'Present',
                isLate: log.isLate || false,
                time: log.time || ''
            } as any);
        } else {
            (attendance[existingIdx] as any).isLate = log.isLate || false;
            (attendance[existingIdx] as any).time = log.time || '';
        }
    });

    return { ...staff, attendance: attendance as any };
};

export const searchStudents = async (queries: any, college: College, department: string, year: string, rollNo: string, semester: string, placementStatus: string): Promise<Student[]> => {
    try {
        const params = new URLSearchParams();
        if (queries.name) params.append('name', queries.name);
        if (queries.admissionNumber) params.append('admissionNumber', queries.admissionNumber);
        if (college && college !== College.ALL) params.append('college', college);
        if (department && department !== 'all') params.append('department', department);
        if (year && year !== 'all') params.append('year', year);
        if (rollNo && rollNo !== 'all') params.append('rollNo', rollNo);
        if (semester && semester !== 'all') params.append('semester', semester);
        if (placementStatus) params.append('placementStatus', placementStatus);
        const response = await fetch(`/api/students?${params.toString()}`);
        return response.ok ? await response.json() : [];
    } catch { return []; }
};

export const getPlacementDetailsForStudent = async (admissionNumber: string): Promise<PlacementDetails | null> => {
    return mockPlacementDetails.find(p => p.admissionNumber === admissionNumber) || null;
};

export const getMarksForStudentList = async (admissionNumbers: string[]): Promise<StudentMark[]> => {
    const idSet = new Set(admissionNumbers);
    return mockStudentMarks.filter(mark => idSet.has(mark.admissionNumber));
};

export const getFilteredStudentDetails = async (college: College, year: string, department: string, rollNo: string, startDate: string, endDate: string, semester: string, subject: string): Promise<DetailedStudentCSVData[]> => { return []; };
export const getFilteredPlacementCsvData = async (college: College, year: string, department: string, rollNo: string): Promise<DetailedPlacementCsvData[]> => { return []; };
export const getFilteredFacultyDetails = async (facultyId: string, startDate: string, endDate: string): Promise<DetailedFacultyCSVData[]> => { return []; };
export const getFilteredStaffDetails = async (staffId: string, startDate: string, endDate: string): Promise<DetailedStaffCSVData[]> => { return []; };
export const searchStudentAttendance = async (queries: any, college: College, department: string, year: string, semester: string, rollNo: string): Promise<StudentWithAttendance[]> => { return []; };
export const searchStudentFees = async (queries: any, college: College, department: string, academicYear: string, rollNo: string): Promise<any[]> => { return []; };
export const searchStudentFeesForCsv = async (college: College, department: string, academicYear: string, rollNo: string): Promise<any[]> => { return []; };
export const searchPlacements = async (queries: any, college: College, department: string, academicYear: string, rollNo: string): Promise<PlacementWithStudent[]> => { return []; };

export const getSubjects = async (college: College, department: string, semester: string): Promise<string[]> => {
    try {
        const response = await fetch(`/api/subjects?department=${department}&semester=${semester}`);
        return response.ok ? await response.json() : [];
    } catch {
        return (ALL_SUBJECTS[department] && ALL_SUBJECTS[department][semester]) ? ALL_SUBJECTS[department][semester].map(s => s.name) : [];
    }
};

export const addStudentMark = async (data: any): Promise<string> => {
    const res = await fetch('/api/marks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed');
    return result.message;
};

export const addStudentFee = async (data: StudentFee): Promise<string> => {
    const res = await fetch('/api/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed');
    return result.message;
};

export const addStudentPlacement = async (data: any): Promise<string> => {
    const res = await fetch('/api/placement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed');
    return result.message;
};

export const uploadExcelData = async (jsonData: any[], dataType: string, collegeCode: College): Promise<any> => {
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: jsonData, dataType, collegeCode }) });
      return await res.json();
  } catch (e) { return { success: false, message: (e as Error).message, stats: { totalRows: jsonData.length, processed: 0, errors: jsonData.length } }; }
};

export const deleteStudentData = async (options: any): Promise<any> => {
    const res = await fetch('/api/delete-student-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options) });
    const result = await res.json();
    if(!res.ok) throw new Error(result.message);
    return result;
};

export const getDeletedDataLog = async (): Promise<LogEntry[]> => {
    try {
        const res = await fetch('/api/deleted-log');
        return res.ok ? await res.json() : [];
    } catch { return []; }
};

export const clearDeletedDataLog = async (): Promise<void> => { await fetch('/api/deleted-log', { method: 'DELETE' }); };

export const restoreStudentData = async (logIds: number[]): Promise<any> => {
     try {
        const res = await fetch('/api/restore-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logIds }) });
        const result = await res.json();
        if(!res.ok) throw new Error(result.message);
        return result;
    } catch(e) { return { success: false, message: (e as Error).message }; }
};

// --- REAL SYLLABUS PERSISTENCE LOGIC ---

const SYLLABUS_STORAGE_KEY = 'portal_syllabus_data';

export const uploadSyllabusPdf = async (department: string, file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const dataUrl = reader.result as string;
                const existing = JSON.parse(localStorage.getItem(SYLLABUS_STORAGE_KEY) || '[]');
                
                const newEntry = {
                    id: Date.now(),
                    department: department,
                    name: file.name,
                    data: dataUrl
                };

                localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify([newEntry, ...existing]));
                resolve({ success: true, message: `Syllabus "${file.name}" uploaded successfully.` });
            } catch (e) {
                reject({ success: false, message: "Storage limit reached. Clear cache." });
            }
        };
        reader.onerror = () => reject({ success: false, message: "File read error." });
        reader.readAsDataURL(file);
    });
};

export const getSyllabusPdfs = async (department: string): Promise<SyllabusPdf[]> => {
    try {
        const stored = localStorage.getItem(SYLLABUS_STORAGE_KEY);
        let allSyllabi = stored ? JSON.parse(stored) : [];
        
        // Provide initial mock data if empty
        if (allSyllabi.length === 0) {
            const mockSyllabus = [
                {
                    id: 1,
                    department: 'CSE',
                    name: 'CSE_R22_Syllabus.pdf',
                    data: "data:application/pdf;base64,JVBERi0xLjQKJfbk/N8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFszIDAgUl0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgo3MiA3MjAgVGQKKEpOVFVIIFN5bGxhYnVzIFNhbXBsZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA3NyAwMDAwMCBuIAowMDAwMDAwMTU4IDAwMDAwIG4gCjAwMDAwMDAzMDcgMDAwMDAgbiAKMDAwMDAwMDM5NCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ4OQolJUVPRgo="
                },
                {
                    id: 2,
                    department: 'ECE',
                    name: 'ECE_R22_Syllabus.pdf',
                    data: "data:application/pdf;base64,JVBERi0xLjQKJfbk/N8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFszIDAgUl0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgo3MiA3MjAgVGQKKEpOVFVIIFN5bGxhYnVzIFNhbXBsZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA3NyAwMDAwMCBuIAowMDAwMDAwMTU4IDAwMDAwIG4gCjAwMDAwMDAzMDcgMDAwMDAgbiAKMDAwMDAwMDM5NCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ4OQolJUVPRgo="
                }
            ];
            localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(mockSyllabus));
            allSyllabi = mockSyllabus;
        }

        return allSyllabi.filter((s: any) => s.department === department).map((s: any) => ({
            name: s.name,
            data: s.data
        }));
    } catch {
        return [];
    }
};

export const deleteSyllabusPdf = async (department: string, filename: string): Promise<any> => {
    try {
        const allSyllabi = JSON.parse(localStorage.getItem(SYLLABUS_STORAGE_KEY) || '[]');
        const updated = allSyllabi.filter((s: any) => !(s.department === department && s.name === filename));
        localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(updated));
        return { success: true, message: "File deleted." };
    } catch {
        return { success: false, message: "Delete failed." };
    }
};

export const downloadSyllabusPdf = (dataUrl: string, fileName: string) => {
    downloadPdf(dataUrl, fileName);
};

export const addStudentAttendance = (d: any) => {};
export const addFacultyAttendance = (d: any) => {};
export const addStaffAttendance = (d: any) => {};