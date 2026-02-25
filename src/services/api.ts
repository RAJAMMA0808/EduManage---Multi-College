
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
  // FIX: Added missing imports for FacultyDetailsType and StaffDetailsType.
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
  // FIX: Import LogEntry type for data deletion logging.
  LogEntry,
} from '../types/index';
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
} from './mockData';
import { MOCK_USERS, LATEST_ATTENDANCE_DATE, JNTUH_RULES, COLLEGE_CODES } from '../constants/index';


// --- IndexedDB Setup ---
const DB_NAME = 'eduManageDB';
const DB_VERSION = 1;
const SYLLABUS_STORE = 'syllabi';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SYLLABUS_STORE)) {
        const store = db.createObjectStore(SYLLABUS_STORE, { keyPath: 'id' });
        store.createIndex('department', 'department', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};


// --- API Logic ---

// Pre-index attendance data by date for performance optimization
const studentAttendanceByDate = new Map<string, StudentAttendance[]>();
mockStudentAttendance.forEach(att => {
    if (!studentAttendanceByDate.has(att.date)) studentAttendanceByDate.set(att.date, []);
    studentAttendanceByDate.get(att.date)!.push(att);
});

const facultyAttendanceByDate = new Map<string, FacultyAttendance[]>();
mockFacultyAttendance.forEach(att => {
    if (!facultyAttendanceByDate.has(att.date)) facultyAttendanceByDate.set(att.date, []);
    facultyAttendanceByDate.get(att.date)!.push(att);
});

const staffAttendanceByDate = new Map<string, StaffAttendance[]>();
mockStaffAttendance.forEach(att => {
    if (!staffAttendanceByDate.has(att.date)) staffAttendanceByDate.set(att.date, []);
    staffAttendanceByDate.get(att.date)!.push(att);
});


const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStudentsForCollege = (college: College, year: string, department: string, rollNo: string, semester: string): Student[] => {
  let filteredStudents: Student[] = mockStudents;
  
  if (college && college !== College.ALL) {
    filteredStudents = filteredStudents.filter(s => s.collegeCode === college);
  }

  if (year) {
      const admissionYear = parseInt(year.split('-')[0], 10);
      filteredStudents = filteredStudents.filter(student => {
          const studentAdmissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
          if (studentAdmissionYearMatch) {
              const studentAdmissionYear = parseInt(studentAdmissionYearMatch[1], 10);
              return studentAdmissionYear === admissionYear;
          }
          return false;
      });
  }

  if (department) {
    filteredStudents = filteredStudents.filter(student => student.programCode === department);
  }

  if (rollNo) {
    filteredStudents = filteredStudents.filter(student => student.rollNo === rollNo);
  }

  if (semester) {
    const semNum = parseInt(semester, 10);
    const currentAcademicYear = new Date(LATEST_ATTENDANCE_DATE).getFullYear();
    const admissionYearForSem = currentAcademicYear - Math.floor((semNum - 1) / 2);
    filteredStudents = filteredStudents.filter(student => {
        const studentAdmissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
        if (studentAdmissionYearMatch) {
            const studentAdmissionYear = parseInt(studentAdmissionYearMatch[1], 10);
            return studentAdmissionYear === admissionYearForSem;
        }
        return false;
    });
  }
  
  return filteredStudents;
};

const getFacultyForCollege = (college: College, department: string): Faculty[] => {
    let filteredFaculty = mockFaculty;
    if (college !== College.ALL) {
      filteredFaculty = filteredFaculty.filter(f => f.collegeCode === college);
    }
    if (department) {
        filteredFaculty = filteredFaculty.filter(f => f.programCode === department);
    }
    return filteredFaculty;
};

const getStaffForCollege = (college: College): Staff[] => {
    if (college === College.ALL) {
        return mockStaff;
    }
    return mockStaff.filter(s => s.collegeCode === college);
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
  await simulateDelay(50);
  
  const emptyData: DashboardData = {
      studentAttendance: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
      studentAcademics: { passPercentage: 0, passCount: 0, failCount: 0, aggregatePercentage: 0 },
      facultyMetrics: { total: 0, fullDay: 0, halfDay: 0, absent: 0 },
      staffMetrics: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
      placementMetrics: { totalStudents: 0, placedStudents: 0, notPlacedStudents: 0, placementPercentage: 0 },
      studentFees: { totalFees: 0, paidAmount: 0, dueAmount: 0, paidCount: 0, partialCount: 0, dueCount: 0 },
  };

  const getAttendanceMetrics = (
    relevantPopulation: (Student | Faculty | Staff)[],
    idKey: 'admissionNumber' | 'facultyId' | 'staffId'
) => {
    let fullDay = 0;
    let halfDay = 0;

    let attendanceForDay: (StudentAttendance | FacultyAttendance | StaffAttendance)[] = [];
    if (idKey === 'admissionNumber') {
        attendanceForDay = studentAttendanceByDate.get(startDate) || [];
    } else if (idKey === 'facultyId') {
        attendanceForDay = facultyAttendanceByDate.get(startDate) || [];
    } else { // staffId
        attendanceForDay = staffAttendanceByDate.get(startDate) || [];
    }

    const populationIds = new Set(relevantPopulation.map(p => (p as any)[idKey]));
    
    const attendanceMap = new Map();
    attendanceForDay.forEach(att => {
        const id = (att as any)[idKey];
        if (populationIds.has(id)) {
            attendanceMap.set(id, att);
        }
    });

    relevantPopulation.forEach(person => {
        const record = attendanceMap.get((person as any)[idKey]);
        if (record) {
            if (record.morning === 'Present' && record.afternoon === 'Present') {
                fullDay++;
            } else if (record.morning === 'Present' || record.afternoon === 'Present') {
                halfDay++;
            }
        }
    });

    const total = relevantPopulation.length;
    const present = fullDay + halfDay;
    const absent = total - present;

    return { total, present, absent, fullDay, halfDay };
};

  if (facultyId && facultyId !== 'all') {
      const faculty = mockFaculty.find(f => f.facultyId.toLowerCase() === facultyId.toLowerCase());
      if (!faculty) return emptyData;
      const metrics = getAttendanceMetrics([faculty], 'facultyId');
      return { ...emptyData, facultyMetrics: { ...metrics, absent: metrics.absent } };
  }
  
  if (staffId && staffId !== 'all') {
      const staff = mockStaff.find(s => s.staffId.toLowerCase() === staffId.toLowerCase());
      if (!staff) return emptyData;
      const metrics = getAttendanceMetrics([staff], 'staffId');
      return { ...emptyData, staffMetrics: metrics };
  }

  const relevantStudents = getStudentsForCollege(college, year, department, rollNo, semester);
  const studentMetrics = getAttendanceMetrics(relevantStudents, 'admissionNumber');

  const studentIds = new Set(relevantStudents.map(s => s.admissionNumber));
  
  // --- Fee Metrics ---
  let relevantFees = mockStudentFees.filter(fee => studentIds.has(fee.admissionNumber));
  if (year) {
      const academicYearString = `${year}-${parseInt(year, 10) + 1}`;
      relevantFees = relevantFees.filter(fee => fee.academicYear === academicYearString);
  }

  const totalFees = relevantFees.reduce((sum, fee) => sum + fee.totalFees, 0);
  const paidAmount = relevantFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const dueAmount = totalFees - paidAmount;

  const feeStatusByStudent = new Map<string, 'Paid' | 'Partial' | 'Due'>();
  relevantStudents.forEach(student => {
      const studentFeesForYear = mockStudentFees.filter(f => f.admissionNumber === student.admissionNumber && (!year || f.academicYear.startsWith(year)));
      if(studentFeesForYear.length > 0) {
        const totalDueForStudent = studentFeesForYear.reduce((sum, f) => sum + f.dueAmount, 0);
        const totalPaidForStudent = studentFeesForYear.reduce((sum, f) => sum + f.paidAmount, 0);

        if (totalDueForStudent <= 0) {
          feeStatusByStudent.set(student.admissionNumber, 'Paid');
        } else if (totalPaidForStudent > 0) {
          feeStatusByStudent.set(student.admissionNumber, 'Partial');
        } else {
          feeStatusByStudent.set(student.admissionNumber, 'Due');
        }
      }
  });

  let paidCount = 0, partialCount = 0, dueCount = 0;
  feeStatusByStudent.forEach((status) => {
      if (status === 'Paid') paidCount++;
      else if (status === 'Partial') partialCount++;
      else if (status === 'Due') dueCount++;
  });

  const studentFees = { totalFees, paidAmount, dueAmount, paidCount, partialCount, dueCount };


  // --- Placement Metrics ---
  const totalStudents = relevantStudents.length;
  const placedStudents = relevantStudents.filter(s => s.isPlaced).length;
  const notPlacedStudents = totalStudents - placedStudents;
  const placementPercentage = totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0;
  const placementMetrics = {
      totalStudents,
      placedStudents,
      notPlacedStudents,
      placementPercentage: parseFloat(placementPercentage.toFixed(1)),
  };

  let relevantMarks = mockStudentMarks.filter(mark => studentIds.has(mark.admissionNumber));
  if (semester) relevantMarks = relevantMarks.filter(mark => mark.semester.toString() === semester);
  if (subject && subject !== 'All Subjects') relevantMarks = relevantMarks.filter(mark => mark.subjectName === subject);
  
  const marksByStudent = new Map<string, StudentMark[]>();
  relevantMarks.forEach(mark => {
    if (!marksByStudent.has(mark.admissionNumber)) {
      marksByStudent.set(mark.admissionNumber, []);
    }
    marksByStudent.get(mark.admissionNumber)!.push(mark);
  });

  let passCount = 0;
  const assessedStudentIds = new Set<string>();
  
  marksByStudent.forEach((studentMarks, admissionNumber) => {
    if (studentMarks.length > 0) {
      assessedStudentIds.add(admissionNumber);
      const hasFailed = studentMarks.some(mark => {
          const internal = mark.internalMark ?? 0;
          const external = mark.externalMark ?? 0;
          const total = mark.marksObtained;
          return !(internal >= JNTUH_RULES.INTERNAL_MIN && external >= JNTUH_RULES.EXTERNAL_MIN && total >= JNTUH_RULES.TOTAL_MIN);
      });
      if (!hasFailed) {
        passCount++;
      }
    }
  });

  const assessedStudentCount = assessedStudentIds.size;
  const failCount = assessedStudentCount - passCount;
  let passPercentage = 0;
  if (assessedStudentCount > 0) {
      passPercentage = (passCount / assessedStudentCount) * 100;
  }
  
  const relevantFaculty = getFacultyForCollege(college, department);
  const facultyMetrics = getAttendanceMetrics(relevantFaculty, 'facultyId');

  const relevantStaff = getStaffForCollege(college);
  const staffMetrics = getAttendanceMetrics(relevantStaff, 'staffId');
  
  return {
      studentAttendance: studentMetrics,
      studentAcademics: { passPercentage: parseFloat(passPercentage.toFixed(1)), passCount, failCount },
      facultyMetrics: { ...facultyMetrics, absent: facultyMetrics.absent },
      staffMetrics,
      placementMetrics,
      studentFees,
  };
};

export const searchStudents = async (
  queries: { name?: string; admissionNumber?: string },
  college: College,
  department: string,
  year: string,
  rollNo: string,
  semester: string,
  placementStatus: string
): Promise<Student[]> => {
  await simulateDelay(200);
  let students = getStudentsForCollege(college, year, department, rollNo, semester);

  const { name, admissionNumber } = queries;

  if (name) {
    const lowerCaseName = name.toLowerCase();
    students = students.filter(student =>
      student.studentName.toLowerCase().includes(lowerCaseName),
    );
  }

  if (admissionNumber) {
    students = students.filter(student =>
      student.admissionNumber.toLowerCase() === admissionNumber.toLowerCase(),
    );
  }

  if (placementStatus) {
    if (placementStatus === 'placed') {
        students = students.filter(s => s.isPlaced);
    } else if (placementStatus === 'not-placed') {
        students = students.filter(s => !s.isPlaced);
    }
  }

  return students.slice(0, 100); // Limit results for performance
};

export const getStudentDetails = async (admissionNumber: string): Promise<StudentDetailsType | null> => {
    await simulateDelay(400);
    const student = mockStudents.find(s => s.admissionNumber === admissionNumber);
    if (!student) return null;

    const marks = mockStudentMarks.filter(m => m.admissionNumber === admissionNumber);
    const attendance = mockStudentAttendance.filter(a => a.admissionNumber === admissionNumber);
    const fees = mockStudentFees.filter(f => f.admissionNumber === admissionNumber);
    const placementDetails = mockPlacementDetails.find(p => p.admissionNumber === admissionNumber);

    const LATEST_DATE = new Date(LATEST_ATTENDANCE_DATE);
    const currentYear = LATEST_DATE.getFullYear();
    const currentMonth = LATEST_DATE.getMonth() + 1; // 1-12

    let currentSemester: number | string = 'N/A';
    const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]{2,4}(\d{4})/);
    if (admissionYearMatch) {
        const admissionYear = parseInt(admissionYearMatch[1], 10);
        const yearsDiff = currentYear - admissionYear;
        let calculatedSemester: number;

        if (currentMonth >= 7) { // July onwards -> Odd semester
            calculatedSemester = yearsDiff * 2 + 1;
        } else { // Jan-June -> Even semester
            calculatedSemester = (yearsDiff -1) * 2 + 2;
        }

        if (calculatedSemester > 8) {
            currentSemester = 'Graduated';
        } else if (calculatedSemester > 0) {
            currentSemester = calculatedSemester;
        }
    }


    return {
        ...student,
        marks,
        attendance,
        fees,
        currentSemester,
        placementDetails
    };
};

// FIX: Add missing getFacultyDetails and getStaffDetails functions.
export const getFacultyDetails = async (facultyId: string): Promise<FacultyDetailsType | null> => {
    await simulateDelay(200);
    const faculty = mockFaculty.find(f => f.facultyId.toLowerCase() === facultyId.toLowerCase());
    if (!faculty) return null;

    const attendance = mockFacultyAttendance.filter(a => a.facultyId.toLowerCase() === facultyId.toLowerCase());
    return { ...faculty, attendance };
};

export const getStaffDetails = async (staffId: string): Promise<StaffDetailsType | null> => {
    await simulateDelay(200);
    const staff = mockStaff.find(s => s.staffId.toLowerCase() === staffId.toLowerCase());
    if (!staff) return null;

    const attendance = mockStaffAttendance.filter(a => a.staffId.toLowerCase() === staffId.toLowerCase());
    return { ...staff, attendance };
};

export const getPlacementDetailsForStudent = async (admissionNumber: string): Promise<PlacementDetails | null> => {
    await simulateDelay(100);
    return mockPlacementDetails.find(p => p.admissionNumber === admissionNumber) || null;
};

export const getMarksForStudentList = async (admissionNumbers: string[]): Promise<StudentMark[]> => {
    await simulateDelay(300);
    const idSet = new Set(admissionNumbers);
    return mockStudentMarks.filter(mark => idSet.has(mark.admissionNumber));
};

const getDetailedAttendanceMetrics = (attendanceInRange: (StudentAttendance | FacultyAttendance | StaffAttendance)[]) => {
    const attendanceByDate = new Map<string, { morning: string; afternoon: string }>();
    attendanceInRange.forEach(a => {
        if (!attendanceByDate.has(a.date)) {
            attendanceByDate.set(a.date, { morning: a.morning, afternoon: a.afternoon });
        }
    });

    let fullDays = 0, halfDays = 0, absentDays = 0;
    attendanceByDate.forEach(day => {
        if (day.morning === 'Present' && day.afternoon === 'Present') fullDays++;
        else if (day.morning === 'Present' || day.afternoon === 'Present') halfDays++;
        else absentDays++;
    });

    const presentDays = fullDays + halfDays;
    const totalDays = fullDays + halfDays + absentDays;
    return { totalDays, presentDays, absentDays, halfDays, fullDays };
};


export const getFilteredStudentDetails = async (
    college: College, year: string, department: string, rollNo: string, startDate: string, endDate: string, semester: string, subject: string
): Promise<DetailedStudentCSVData[]> => {
    await simulateDelay(150);
    const relevantStudents = getStudentsForCollege(college, year, department, rollNo, semester);
    const studentIds = new Set(relevantStudents.map(s => s.admissionNumber));

    const attendanceInRange = mockStudentAttendance.filter(a => studentIds.has(a.admissionNumber) && a.date >= startDate && a.date <= endDate);
    let marksInRange = mockStudentMarks.filter(m => studentIds.has(m.admissionNumber));
    if (semester) marksInRange = marksInRange.filter(m => m.semester.toString() === semester);
    if (subject && subject !== 'All Subjects') marksInRange = marksInRange.filter(m => m.subjectName === subject);
    
    const attendanceByStudent = new Map<string, StudentAttendance[]>();
    attendanceInRange.forEach(att => {
        if (!attendanceByStudent.has(att.admissionNumber)) {
            attendanceByStudent.set(att.admissionNumber, []);
        }
        attendanceByStudent.get(att.admissionNumber)!.push(att);
    });

    const marksByStudent = new Map<string, StudentMark[]>();
    marksInRange.forEach(mark => {
        if (!marksByStudent.has(mark.admissionNumber)) {
            marksByStudent.set(mark.admissionNumber, []);
        }
        marksByStudent.get(mark.admissionNumber)!.push(mark);
    });

    return relevantStudents.map(student => {
        const studentAttendance = attendanceByStudent.get(student.admissionNumber) || [];
        const { totalDays, presentDays, absentDays, halfDays } = getDetailedAttendanceMetrics(studentAttendance);

        const studentMarks = marksByStudent.get(student.admissionNumber) || [];
        
        let academicResult = 'N/A';
        if (studentMarks.length > 0) {
            const hasFailed = studentMarks.some(mark => {
                const internal = mark.internalMark ?? 0;
                const external = mark.externalMark ?? 0;
                const total = mark.marksObtained;
                return !(internal >= JNTUH_RULES.INTERNAL_MIN && external >= JNTUH_RULES.EXTERNAL_MIN && total >= JNTUH_RULES.TOTAL_MIN);
            });
            academicResult = hasFailed ? 'Fail' : 'Pass';
        }

        return {
            ...student, rollNo: student.rollNo, totalDays, presentDays, absentDays, halfDays, academicResult
        };
    });
};

export const getFilteredPlacementCsvData = async (
    college: College, year: string, department: string, rollNo: string
): Promise<DetailedPlacementCsvData[]> => {
    await simulateDelay(150);
    const relevantStudents = getStudentsForCollege(college, year, department, rollNo, '').filter(s => s.isPlaced);
    const studentMap = new Map(relevantStudents.map(s => [s.admissionNumber, s]));
    
    const placementMap = new Map(mockPlacementDetails.map(p => [p.admissionNumber, p]));

    const results: DetailedPlacementCsvData[] = [];
    let sNo = 1;
    
    studentMap.forEach((student, admissionNumber) => {
        const placement = placementMap.get(admissionNumber);
        if (placement) {
             const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
             const admissionYear = admissionYearMatch ? parseInt(admissionYearMatch[1], 10) : 0;
             const currentYear = new Date(LATEST_ATTENDANCE_DATE).getFullYear();
             const studentYearNum = currentYear - admissionYear + 1;
             
             let yearStr = `${studentYearNum}th Year`;
             if (studentYearNum === 1) yearStr = '1st Year';
             if (studentYearNum === 2) yearStr = '2nd Year';
             if (studentYearNum === 3) yearStr = '3rd Year';
             
             const currentMonth = new Date(LATEST_ATTENDANCE_DATE).getMonth() + 1;
             const semester = studentYearNum * 2 - (currentMonth < 7 ? 1 : 0);

            results.push({
                'S.NO': sNo++,
                'COLLEGE CODE': student.collegeCode,
                'ADMISSION NUMBER': student.admissionNumber,
                'STUDENT NAME': student.studentName,
                'COURSE/BRANCH': student.programCode,
                'YEAR': placement.year,
                'SEMESTER': `${placement.semester}th`,
                'STUDENT MOBIL.': student.mobileNumber || '-',
                'COMPANY/ORG NAME': placement.companyName,
                'COMPANY WEBSITE': '',
                'HR NAME': placement.hrName,
                'HR MOBILE NUMBER': placement.hrMobileNumber,
                'HR EMAIL ID': placement.hrEmail,
            });
        }
    });

    return results;
};


export const getFilteredFacultyDetails = async (facultyId: string, startDate: string, endDate: string): Promise<DetailedFacultyCSVData[]> => {
    if (!facultyId || facultyId === 'all') return [];
    const facultyMember = mockFaculty.find(f => f.facultyId.toLowerCase() === facultyId.toLowerCase());
    if (!facultyMember) return [];
    
    const attendanceInRange = mockFacultyAttendance.filter(
        att => att.facultyId === facultyMember.facultyId && att.date >= startDate && att.date <= endDate
    );

    const { totalDays, presentDays, absentDays, halfDays } = getDetailedAttendanceMetrics(attendanceInRange);

    return [{
        ...facultyMember,
        totalDays, presentDays, absentDays, halfDays,
    }];
};

export const getFilteredStaffDetails = async (staffId: string, startDate: string, endDate: string): Promise<DetailedStaffCSVData[]> => {
    if (!staffId || staffId === 'all') return [];
    const staffMember = mockStaff.find(s => s.staffId.toLowerCase() === staffId.toLowerCase());
    if (!staffMember) return [];

    const attendanceInRange = mockStaffAttendance.filter(
        att => att.staffId === staffMember.staffId && att.date >= startDate && att.date <= endDate
    );
    
    const { totalDays, presentDays, absentDays, halfDays } = getDetailedAttendanceMetrics(attendanceInRange);

    return [{
        ...staffMember,
        programCode: 'ADMIN',
        totalDays, presentDays, absentDays, halfDays,
    }];
};

export const searchStudentAttendance = async (
  queries: { name?: string; admissionNumber?: string },
  college: College,
  department: string,
  year: string,
  semester: string,
  rollNo: string
): Promise<StudentWithAttendance[]> => {
  await simulateDelay(250);

  let students = getStudentsForCollege(college, year, department, rollNo, '');

  const { name, admissionNumber } = queries;
  if (name) {
    students = students.filter(s => s.studentName.toLowerCase().includes(name.toLowerCase()));
  }
  if (admissionNumber) {
    students = students.filter(s => s.admissionNumber.toLowerCase() === admissionNumber.toLowerCase());
  }

  const studentIds = new Set(students.map(s => s.admissionNumber));
  const allAttendanceForStudents = mockStudentAttendance.filter(a => studentIds.has(a.admissionNumber));

  const attendanceByStudentId = new Map<string, StudentAttendance[]>();
  allAttendanceForStudents.forEach(att => {
    if (!attendanceByStudentId.has(att.admissionNumber)) {
      attendanceByStudentId.set(att.admissionNumber, []);
    }
    attendanceByStudentId.get(att.admissionNumber)!.push(att);
  });

  const results: StudentWithAttendance[] = students.map(student => {
    let studentAttendance = attendanceByStudentId.get(student.admissionNumber) || [];

    if (semester) {
      const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
      if (admissionYearMatch && admissionYearMatch[1]) {
        const admissionYear = parseInt(admissionYearMatch[1], 10);
        const semNum = parseInt(semester, 10);
        const academicYearOffset = Math.floor((semNum - 1) / 2);
        const academicYearStart = admissionYear + academicYearOffset;

        let semesterStartDate: Date;
        let semesterEndDate: Date;

        if (semNum % 2 !== 0) { // Odd semester (e.g., 1, 3, 5, 7)
          semesterStartDate = new Date(`${academicYearStart}-07-01`);
          semesterEndDate = new Date(`${academicYearStart}-12-31`);
        } else { // Even semester (e.g., 2, 4, 6, 8)
          semesterStartDate = new Date(`${academicYearStart + 1}-01-01`);
          semesterEndDate = new Date(`${academicYearStart + 1}-06-30`);
        }

        const startDateString = semesterStartDate.toISOString().split('T')[0];
        const endDateString = semesterEndDate.toISOString().split('T')[0];

        studentAttendance = studentAttendance.filter(att => {
          return att.date >= startDateString && att.date <= endDateString;
        });
      } else {
        studentAttendance = [];
      }
    }

    const { totalDays, presentDays, absentDays, halfDays, fullDays } = getDetailedAttendanceMetrics(studentAttendance);

    const effectivePresentDays = fullDays + (halfDays * 0.5);
    const attendancePercentage = totalDays > 0 ? (effectivePresentDays / totalDays) * 100 : 0;

    return {
      ...student,
      totalDays,
      presentDays,
      absentDays,
      halfDays,
      attendancePercentage,
    };
  });
  return results.slice(0, 100);
};


export const searchStudentFees = async (
  queries: { name?: string; admissionNumber?: string },
  college: College,
  department: string,
  academicYear: string,
  rollNo: string
): Promise<(StudentWithFee & { currentSemester?: number | string })[]> => {
  await simulateDelay(250);
  
  let students = getStudentsForCollege(college, '', department, rollNo, '');

  const { name, admissionNumber } = queries;
  if (name) {
    students = students.filter(s => s.studentName.toLowerCase().includes(name.toLowerCase()));
  }
  if (admissionNumber) {
     students = students.filter(s => s.admissionNumber.toLowerCase() === admissionNumber.toLowerCase());
  }

  let fees = mockStudentFees;
  if (academicYear) {
    fees = fees.filter(f => f.academicYear.startsWith(academicYear));
  }

  const studentIdSet = new Set(students.map(s => s.admissionNumber));
  
  const results: (StudentWithFee & { currentSemester?: number | string })[] = [];
  
  const LATEST_DATE = new Date(LATEST_ATTENDANCE_DATE);
  const currentYear = LATEST_DATE.getFullYear();
  const currentMonth = LATEST_DATE.getMonth() + 1; // 1-12

  fees.forEach(fee => {
    if (studentIdSet.has(fee.admissionNumber)) {
      const student = students.find(s => s.admissionNumber === fee.admissionNumber);
      if (student) {
        const { admissionNumber, ...feeDetails } = fee;
        
        let currentSemester: number | string = 'N/A';
        const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]{2,4}(\d{4})/);
        if (admissionYearMatch) {
            const admissionYear = parseInt(admissionYearMatch[1], 10);
            const yearsDiff = currentYear - admissionYear;
            let calculatedSemester: number;

            if (currentMonth >= 7) { // July onwards -> Odd semester
                calculatedSemester = yearsDiff * 2 + 1;
            } else { // Jan-June -> Even semester
                calculatedSemester = (yearsDiff -1) * 2 + 2;
            }

            if (calculatedSemester > 8) {
                currentSemester = 'Graduated';
            } else if (calculatedSemester > 0) {
                currentSemester = calculatedSemester;
            }
        }

        results.push({ ...student, ...feeDetails, currentSemester });
      }
    }
  });

  return results.slice(0, 100);
};

export const searchStudentFeesForCsv = async (
  college: College,
  department: string,
  academicYear: string,
  rollNo: string
): Promise<any[]> => {
  await simulateDelay(150);
  
  let students = getStudentsForCollege(college, academicYear, department, rollNo, '');

  const studentIdSet = new Set(students.map(s => s.admissionNumber));
  
  let fees = mockStudentFees.filter(f => studentIdSet.has(f.admissionNumber));
  
  if (academicYear) {
    fees = fees.filter(f => f.academicYear.startsWith(academicYear));
  }
  
  const results = fees.map(fee => {
    const student = students.find(s => s.admissionNumber === fee.admissionNumber)!;
    return {
      'Admission Number': fee.admissionNumber,
      'Student Name': student.studentName,
      'College': student.collegeCode,
      'Department': student.programCode,
      'Academic Year': fee.academicYear,
      'Total Fees': fee.totalFees,
      'Paid Amount': fee.paidAmount,
      'Due Amount': fee.dueAmount,
      'Status': fee.status,
    };
  });
  
  return results;
};

export const searchPlacements = async (
    queries: { name?: string; admissionNumber?: string; companyName?: string; },
    college: College,
    department: string,
    academicYear: string,
    rollNo: string
): Promise<PlacementWithStudent[]> => {
    await simulateDelay(250);
    
    let students = getStudentsForCollege(college, academicYear, department, rollNo, '');

    students = students.filter(s => s.isPlaced);

    const { name, admissionNumber, companyName } = queries;
    if (name) {
        students = students.filter(s => s.studentName.toLowerCase().includes(name.toLowerCase()));
    }
    if (admissionNumber) {
        students = students.filter(s => s.admissionNumber.toLowerCase() === admissionNumber.toLowerCase());
    }
    
    const studentIdSet = new Set(students.map(s => s.admissionNumber));
    let placements = mockPlacementDetails.filter(p => studentIdSet.has(p.admissionNumber));

    if (companyName) {
        placements = placements.filter(p => p.companyName.toLowerCase().includes(companyName.toLowerCase()));
    }

    const placementMap = new Map(placements.map(p => [p.admissionNumber, p]));

    const results: PlacementWithStudent[] = [];
    students.forEach(student => {
        const placement = placementMap.get(student.admissionNumber);
        if(placement) {
            results.push({ ...student, ...placement });
        }
    });

    return results.slice(0, 100);
};

export const getSubjects = async (college: College, department: string, semester: string): Promise<string[]> => {
    await simulateDelay(100);
    if (!department || !semester) return [];

    const relevantStudents = getStudentsForCollege(college, '', department, '', semester);
    const studentIds = new Set(relevantStudents.map(s => s.admissionNumber));
    
    const subjects = mockStudentMarks
        .filter(mark => studentIds.has(mark.admissionNumber) && mark.semester.toString() === semester)
        .map(mark => mark.subjectName);
        
    return [...new Set(subjects)];
};

export const addStudentMark = (
  data: StudentMark & {
    studentName: string;
    gender: 'M' | 'F';
    collegeCode: College;
    programCode: string;
    admissionNumber: string;
  },
) => {
  if (!mockStudents.some(s => s.admissionNumber === data.admissionNumber)) {
    mockStudents.push({
      collegeCode: data.collegeCode,
      programCode: data.programCode,
      admissionNumber: data.admissionNumber,
      rollNo: data.admissionNumber.slice(-2),
      studentName: data.studentName,
      gender: data.gender,
      isPlaced: false,
      mobileNumber: undefined,
    });
  }
  const newMark: StudentMark = {
    admissionNumber: data.admissionNumber,
    semester: data.semester,
    subjectCode: data.subjectCode,
    subjectName: data.subjectName,
    marksObtained: data.marksObtained,
    maxMarks: data.maxMarks,
    internalMark: data.internalMark,
    externalMark: data.externalMark,
  };
  mockStudentMarks.push(newMark);
};

export const addStudentFee = (data: StudentFee) => {
    const existingIndex = mockStudentFees.findIndex(
        fee => fee.admissionNumber === data.admissionNumber && fee.academicYear === data.academicYear
    );

    if (existingIndex > -1) {
        mockStudentFees[existingIndex] = data;
    } else {
        mockStudentFees.push(data);
    }
};

export const addStudentPlacement = (data: PlacementDetails) => {
    const student = mockStudents.find(s => s.admissionNumber.toLowerCase() === data.admissionNumber.toLowerCase());
    if (!student) {
        throw new Error(`Student with admission number ${data.admissionNumber} not found.`);
    }
    student.isPlaced = true;
    if(data.studentMobileNumber && !student.mobileNumber) {
        student.mobileNumber = data.studentMobileNumber;
    }

    const existingPlacementIndex = mockPlacementDetails.findIndex(p => p.admissionNumber.toLowerCase() === data.admissionNumber.toLowerCase());
    if (existingPlacementIndex !== -1) {
        mockPlacementDetails[existingPlacementIndex] = data; // Update if exists
    } else {
        mockPlacementDetails.push(data);
    }
};

export const addStudentAttendance = (data: {
  id: string;
  date: string;
  morning: 'Present' | 'Absent';
  afternoon: 'Present' | 'Absent';
}) => {
  mockStudentAttendance.push({
    admissionNumber: data.id,
    date: data.date,
    morning: data.morning,
    afternoon: data.afternoon,
  });
};

export const addFacultyAttendance = (data: {
  id: string;
  date: string;
  morning: 'Present' | 'Absent';
  afternoon: 'Present' | 'Absent';
}) => {
  mockFacultyAttendance.push({
    facultyId: data.id,
    date: data.date,
    morning: data.morning,
    afternoon: data.afternoon,
  });
};

export const addStaffAttendance = (data: {
  id: string;
  date: string;
  morning: 'Present' | 'Absent';
  afternoon: 'Present' | 'Absent';
}) => {
  mockStaffAttendance.push({
    staffId: data.id,
    date: data.date,
    morning: data.morning,
    afternoon: data.afternoon,
  });
};

export const uploadExcelData = (
  jsonData: any[],
  dataType: string,
  collegeCode: College,
): { success: boolean; message: string; stats: { totalRows: number; processed: number; errors: number } } => {
  const totalRows = jsonData.length;

  const getCellValue = (row: any, key: string): any => {
    const normalizedKey = key.toLowerCase().replace(/ /g, '');
    for (const rk in row) {
      if (rk.toLowerCase().replace(/ /g, '') === normalizedKey) {
        return row[rk];
      }
    }
    return undefined;
  };

  if (dataType === 'marks') {
    const validationErrors: string[] = [];
    jsonData.forEach((row, index) => {
      const rowNum = index + 2;
      try {
        const rowCollegeCode = String(getCellValue(row, 'College Code') || '').toUpperCase() as College;
        const admissionNumber = String(getCellValue(row, 'AdmissionNumber') || '').toUpperCase();
        if (!rowCollegeCode || !admissionNumber) throw new Error("Missing 'College Code' or 'AdmissionNumber'.");
        if (collegeCode !== College.ALL) {
          if (rowCollegeCode !== collegeCode) throw new Error(`Row College Code '${rowCollegeCode}' mismatches selected '${collegeCode}'.`);
          const expectedPrefix = COLLEGE_CODES[collegeCode];
          if (expectedPrefix && !admissionNumber.startsWith(expectedPrefix)) throw new Error(`Admission Number '${admissionNumber}' needs prefix '${expectedPrefix}'.`);
        }
        if (!getCellValue(row, 'Student Name') || isNaN(Number(getCellValue(row, 'Semester')))) {
             throw new Error("Missing/invalid required fields (e.g., Student Name, Semester).");
        }
      } catch (e) {
        validationErrors.push(`Row ${rowNum}: ${(e as Error).message}`);
      }
    });

    if (validationErrors.length > 0) {
      return {
        success: false,
        message: `Upload failed with ${validationErrors.length} validation error(s):\n- ${validationErrors.slice(0, 5).join('\n- ')}${validationErrors.length > 5 ? '\n...' : ''}`,
        stats: { totalRows, processed: 0, errors: validationErrors.length },
      };
    }

    const studentCache = new Map<string, Student>();
    const marksMap = new Map<string, StudentMark>(
      mockStudentMarks.map(mark => [`${mark.admissionNumber}_${mark.subjectCode}`, mark])
    );

    jsonData.forEach(row => {
        const admissionNumber = String(getCellValue(row, 'AdmissionNumber') || '').toUpperCase();
        if (!admissionNumber) return;

        if (!studentCache.has(admissionNumber)) {
             studentCache.set(admissionNumber, {
                collegeCode: String(getCellValue(row, 'College Code')) as College,
                programCode: String(getCellValue(row, 'Program Code')),
                admissionNumber,
                rollNo: admissionNumber.slice(-2),
                studentName: String(getCellValue(row, 'Student Name')),
                gender: String(getCellValue(row, 'Gender')) as 'M' | 'F',
                isPlaced: false,
             });
        }
        
        const internal = Number(getCellValue(row, 'Internal Mark')) || 0;
        const external = Number(getCellValue(row, 'External Mark')) || 0;
        
        const newMark: StudentMark = {
            admissionNumber,
            semester: Number(getCellValue(row, 'Semester')),
            subjectCode: String(getCellValue(row, 'SubjectCode')),
            subjectName: String(getCellValue(row, 'SubjectName')),
            internalMark: internal,
            externalMark: external,
            marksObtained: Number(getCellValue(row, 'Total Marks')) || (internal + external),
            maxMarks: Number(getCellValue(row, 'Out of Marks (Max)')) || 100,
        };
        
        marksMap.set(`${newMark.admissionNumber}_${newMark.subjectCode}`, newMark);
    });

    const existingStudentIds = new Set(mockStudents.map(s => s.admissionNumber));
    studentCache.forEach((student, admissionNumber) => {
        if (!existingStudentIds.has(admissionNumber)) {
            mockStudents.push(student);
        }
    });

    mockStudentMarks.length = 0;
    mockStudentMarks.push(...Array.from(marksMap.values()));

    return {
      success: true,
      message: `Successfully processed ${jsonData.length} of ${totalRows} rows.`,
      stats: { totalRows, processed: jsonData.length, errors: 0 },
    };
  } else {
    return {
        success: false,
        message: `Data type '${dataType}' is not supported for Excel upload yet.`,
        stats: { totalRows, processed: 0, errors: totalRows },
    };
  }
};


// --- Syllabus Functions (Upgraded to IndexedDB) ---

const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const getSyllabusPdfs = async (departmentAbbr: string): Promise<SyllabusPdf[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SYLLABUS_STORE, 'readonly');
        const store = transaction.objectStore(SYLLABUS_STORE);
        const request = store.getAll();

        request.onsuccess = async () => {
            const results = request.result.filter(item => item.department === departmentAbbr);
            try {
                const pdfsWithDataUrls = await Promise.all(
                    results.map(async (item) => ({
                        name: item.name,
                        data: await blobToDataURL(item.data),
                    }))
                );
                resolve(pdfsWithDataUrls);
            } catch (error) {
                reject(error);
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const uploadSyllabusPdf = async (departmentAbbr: string, file: File): Promise<{ success: boolean; message: string; }> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SYLLABUS_STORE, 'readwrite');
        const store = transaction.objectStore(SYLLABUS_STORE);
        
        const fileRecord = {
            id: `${departmentAbbr}-${file.name}`,
            department: departmentAbbr,
            name: file.name,
            data: file,
        };

        const request = store.put(fileRecord);

        request.onsuccess = () => {
             resolve({ success: true, message: `Syllabus "${file.name}" uploaded successfully for ${departmentAbbr}.` });
        };
        request.onerror = () => {
            console.error("IndexedDB upload error:", request.error);
            if (request.error?.name === 'QuotaExceededError') {
                 reject({ success: false, message: `Upload failed: Your browser's storage is full. Please clear some space and try again.` });
            } else {
                 reject({ success: false, message: `Upload failed: Could not save file. ${request.error?.message}` });
            }
        };
    });
};

export const downloadSyllabusPdf = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const deleteSyllabusPdf = async (departmentAbbr: string, filename: string): Promise<{ success: boolean; message: string; }> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SYLLABUS_STORE, 'readwrite');
        const store = transaction.objectStore(SYLLABUS_STORE);
        const request = store.delete(`${departmentAbbr}-${filename}`);

        transaction.oncomplete = () => {
            resolve({ success: true, message: `"${filename}" has been deleted successfully.` });
        };
        
        transaction.onerror = () => {
            console.error("IndexedDB delete error:", transaction.error);
            reject({ success: false, message: `Failed to delete "${filename}": ${transaction.error?.message}` });
        };
    });
};

let deletedDataLog: LogEntry[] = [];
let logIdCounter = 0;

export const deleteStudentData = async (options: {
    admissionNumber: string;
    studentName: string;
    // FIX: Included 'examFees' in the literal union type for tab.
    tab: 'marks' | 'attendance' | 'fees' | 'examFees';
    academicYear: string;
    semester: string;
    deletedBy: string;
    reason?: string;
}): Promise<{ success: boolean; message: string }> => {
    await simulateDelay(200);

    let deletedItems: any[] = [];
    const scope = options.semester !== 'All Semesters' ? `Semester ${options.semester}` : (options.academicYear !== 'All Years' ? `Academic Year ${options.academicYear}` : 'All Data');

    if (scope === 'All Data') {
        throw new Error("Cannot delete all data at once. Please specify a semester or academic year.");
    }

    if (options.tab === 'marks') {
        const itemsToDelete = mockStudentMarks.filter(mark => {
            if (mark.admissionNumber !== options.admissionNumber) return false;
            if (options.semester !== 'All Semesters') return mark.semester.toString() === options.semester;
            
            const admissionYearMatch = options.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
            if (admissionYearMatch && options.academicYear !== 'All Years') {
                const admissionYear = parseInt(admissionYearMatch[1], 10);
                const academicYearStart = parseInt(options.academicYear.split('-')[0], 10);
                const yearOffset = academicYearStart - admissionYear;
                const startSem = yearOffset * 2 + 1;
                const endSem = yearOffset * 2 + 2;
                return mark.semester === startSem || mark.semester === endSem;
            }
            return false;
        });
        if (itemsToDelete.length === 0) throw new Error("No marks found to delete for the specified scope.");
        deletedItems = itemsToDelete;
        const remainingMarks = mockStudentMarks.filter(mark => !itemsToDelete.includes(mark));
        mockStudentMarks.length = 0;
        mockStudentMarks.push(...remainingMarks);
    } else if (options.tab === 'attendance') {
        const itemsToDelete = mockStudentAttendance.filter(att => {
            if (att.admissionNumber !== options.admissionNumber) return false;

            const admissionYearMatch = options.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
            if (!admissionYearMatch) return false;
            const admissionYear = parseInt(admissionYearMatch[1], 10);

            let startRangeDate: Date | null = null;
            let endRangeDate: Date | null = null;
            
            if (options.academicYear !== 'All Years') {
                const startYear = parseInt(options.academicYear.split('-')[0], 10);
                startRangeDate = new Date(`${startYear}-07-01T00:00:00`);
                endRangeDate = new Date(`${startYear + 1}-06-30T00:00:00`);
            }
            if (options.semester !== 'All Semesters') {
                const semNum = parseInt(options.semester, 10);
                const yearOffset = Math.floor((semNum - 1) / 2);
                const academicYearStart = admissionYear + yearOffset;
                let semesterStartDate: Date, semesterEndDate: Date;
                if (semNum % 2 !== 0) {
                    semesterStartDate = new Date(`${academicYearStart}-07-01T00:00:00`);
                    semesterEndDate = new Date(`${academicYearStart}-12-31T00:00:00`);
                } else {
                    semesterStartDate = new Date(`${academicYearStart + 1}-01-01T00:00:00`);
                    semesterEndDate = new Date(`${academicYearStart + 1}-06-30T00:00:00`);
                }
                startRangeDate = startRangeDate ? new Date(Math.max(startRangeDate.getTime(), semesterStartDate.getTime())) : semesterStartDate;
                endRangeDate = endRangeDate ? new Date(Math.min(endRangeDate.getTime(), semesterEndDate.getTime())) : semesterEndDate;
            }
            if(startRangeDate && endRangeDate) {
                const attDate = new Date(att.date);
                return attDate >= startRangeDate && attDate <= endRangeDate;
            }
            return false;
        });
        if (itemsToDelete.length === 0) throw new Error("No attendance found to delete for the specified scope.");
        deletedItems = itemsToDelete;
        const remainingAttendance = mockStudentAttendance.filter(att => !itemsToDelete.includes(att));
        mockStudentAttendance.length = 0;
        mockStudentAttendance.push(...remainingAttendance);
    // FIX: Updated logic to handle both 'fees' (Tuition) and 'examFees'.
    } else if (options.tab === 'fees' || options.tab === 'examFees') {
        const targetFeeType = options.tab === 'fees' ? 'Tuition' : 'Exam';
        const itemsToDelete = mockStudentFees.filter(fee => {
            if (fee.admissionNumber !== options.admissionNumber) return false;
            
            // Check feeType if present, defaulting to Tuition if undefined for backward compatibility.
            const entryType = fee.feeType || 'Tuition';
            if (entryType !== targetFeeType) return false;

            if (options.semester !== 'All Semesters') {
                const admissionYearMatch = options.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
                if (admissionYearMatch) {
                    const admissionYear = parseInt(admissionYearMatch[1], 10);
                    const semNum = parseInt(options.semester, 10);
                    const yearOffset = Math.floor((semNum - 1) / 2);
                    const targetAcademicYearStart = admissionYear + yearOffset;
                    const targetAcademicYear = `${targetAcademicYearStart}-${targetAcademicYearStart + 1}`;
                    return fee.academicYear === targetAcademicYear;
                }
            } else if (options.academicYear !== 'All Years') {
                return fee.academicYear === options.academicYear;
            }
            return false;
        });
        if (itemsToDelete.length === 0) throw new Error(`No ${targetFeeType.toLowerCase()} fees found to delete for the specified scope.`);
        deletedItems = itemsToDelete;
        const remainingFees = mockStudentFees.filter(fee => !itemsToDelete.includes(fee));
        mockStudentFees.length = 0;
        mockStudentFees.push(...remainingFees);
    }
    
    // FIX: Properly format dataType for the log entry.
    const dataTypeStr = options.tab === 'examFees' ? 'Exam Fees' : (options.tab.charAt(0).toUpperCase() + options.tab.slice(1));

    deletedDataLog.push({
        id: ++logIdCounter,
        studentName: options.studentName,
        admissionNumber: options.admissionNumber,
        dataType: dataTypeStr as any,
        scope,
        deletedBy: options.deletedBy,
        timestamp: new Date().toISOString(),
        reason: options.reason,
        deletedData: deletedItems
    });
    
    return { success: true, message: `${deletedItems.length} ${options.tab} record(s) for ${scope} have been moved to the removed data log.` };
};

export const getDeletedDataLog = (): LogEntry[] => {
    return [...deletedDataLog].sort((a, b) => b.id - a.id);
};

export const clearDeletedDataLog = async (): Promise<void> => {
    deletedDataLog = [];
};

export const restoreStudentData = async (logIds: number[]): Promise<{ success: boolean, message: string }> => {
    await simulateDelay(300);
    const logsToRestore = deletedDataLog.filter(log => logIds.includes(log.id));
    if (logsToRestore.length === 0) return { success: false, message: 'No valid log entries found to restore.' };

    let restoredCount = 0;
    logsToRestore.forEach(log => {
        if (log.dataType === 'Marks') {
            mockStudentMarks.push(...(log.deletedData as StudentMark[]));
        } else if (log.dataType === 'Attendance') {
            mockStudentAttendance.push(...(log.deletedData as StudentAttendance[]));
        } else if (log.dataType === 'Fees') {
            mockStudentFees.push(...(log.deletedData as StudentFee[]));
        }
        restoredCount += log.deletedData.length;
    });

    deletedDataLog = deletedDataLog.filter(log => !logIds.includes(log.id));

    return { success: true, message: `${restoredCount} records from ${logsToRestore.length} log entries have been restored.` };
};
