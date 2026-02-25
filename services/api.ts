
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
  StudentMark,
  StudentAttendance,
  FacultyAttendance,
  StaffAttendance,
  PlacementWithStudent,
  StudentFee,
} from '../types';
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

const JNTUH_RULES = {
    INTERNAL_MIN: 14,
    EXTERNAL_MIN: 21,
    TOTAL_MIN: 40,
};

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStudentsForCollege = (college: College, year: string, department: string, rollNo: string, semester: string): Student[] => {
  let filteredStudents: Student[] = mockStudents;
  
  if (college !== College.ALL) {
    filteredStudents = filteredStudents.filter(s => s.collegeCode === college);
  }

  if (year !== 'all' && semester !== 'all' && !isNaN(parseInt(semester))) {
      const currentAcademicYear = parseInt(year, 10);
      const semNum = parseInt(semester, 10);
      const admissionYear = currentAcademicYear - Math.floor((semNum - 1) / 2);
      filteredStudents = filteredStudents.filter(student => student.admissionNumber.includes(admissionYear.toString()));

  } else if (year !== 'all') {
      filteredStudents = filteredStudents.filter(student => student.admissionNumber.includes(year));
  }

  if (department !== 'all') {
    filteredStudents = filteredStudents.filter(student => student.programCode === department);
  }

  if (rollNo !== 'all') {
    filteredStudents = filteredStudents.filter(student => student.rollNo === rollNo);
  }
  
  return filteredStudents;
};

const getFacultyForCollege = (college: College): Faculty[] => {
    if (college === College.ALL) {
      return mockFaculty;
    }
    return mockFaculty.filter(f => f.collegeCode === college);
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
  await simulateDelay(150);
  
  const emptyData: DashboardData = {
      studentAttendance: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
      studentAcademics: { passPercentage: 0, passCount: 0, failCount: 0 },
      facultyMetrics: { total: 0, fullDay: 0, halfDay: 0, absent: 0 },
      staffMetrics: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
      placementMetrics: { totalStudents: 0, placedStudents: 0, notPlacedStudents: 0, placementPercentage: 0 },
  };

  const getAttendanceMetrics = (
    relevantPopulation: (Student | Faculty | Staff)[],
    attendanceRecords: (StudentAttendance | FacultyAttendance | StaffAttendance)[],
    idKey: 'admissionNumber' | 'facultyId' | 'staffId'
) => {
    let fullDay = 0;
    let halfDay = 0;

    const attendanceForDay = attendanceRecords.filter(att => att.date === startDate);
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
      // FIX: The variable 'metrics' was not defined. It should be 'facultyMetrics'.
      const facultyMetrics = getAttendanceMetrics([faculty], mockFacultyAttendance, 'facultyId');
      return { ...emptyData, facultyMetrics: { ...facultyMetrics, absent: facultyMetrics.absent } };
  }
  
  if (staffId && staffId !== 'all') {
      const staff = mockStaff.find(s => s.staffId.toLowerCase() === staffId.toLowerCase());
      if (!staff) return emptyData;
      const metrics = getAttendanceMetrics([staff], mockStaffAttendance, 'staffId');
      return { ...emptyData, staffMetrics: metrics };
  }

  // --- Aggregated Views ---
  const relevantStudents = getStudentsForCollege(college, year, department, rollNo, semester);
  const studentMetrics = getAttendanceMetrics(relevantStudents, mockStudentAttendance, 'admissionNumber');

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

  const studentIds = new Set(relevantStudents.map(s => s.admissionNumber));
  let relevantMarks = mockStudentMarks.filter(mark => studentIds.has(mark.admissionNumber));
  if (semester !== 'all') relevantMarks = relevantMarks.filter(mark => mark.semester.toString() === semester);
  if (subject !== 'All Subjects') relevantMarks = relevantMarks.filter(mark => mark.subjectName === subject);
  
  // --- Optimized Academic Calculation ---
  const marksByStudent = new Map<string, StudentMark[]>();
  relevantMarks.forEach(mark => {
    if (!marksByStudent.has(mark.admissionNumber)) {
      marksByStudent.set(mark.admissionNumber, []);
    }
    marksByStudent.get(mark.admissionNumber)!.push(mark);
  });

  let passCount = 0;
  marksByStudent.forEach((studentMarks) => {
    const subjectsInFilter = new Set(studentMarks.map(m => m.subjectCode));
    if (subjectsInFilter.size === 0) return;

    const hasFailed = Array.from(subjectsInFilter).some(subjectCode => {
        const marksForSubject = studentMarks.find(m => m.subjectCode === subjectCode);
        if (!marksForSubject) return true;

        const internal = marksForSubject.internalMark ?? 0;
        const external = marksForSubject.externalMark ?? 0;
        const total = marksForSubject.marksObtained;

        return !(internal >= JNTUH_RULES.INTERNAL_MIN && external >= JNTUH_RULES.EXTERNAL_MIN && total >= JNTUH_RULES.TOTAL_MIN);
    });

    if (!hasFailed) {
      passCount++;
    }
  });

  const studentPoolForAcademics = marksByStudent.size;
  const failCount = studentPoolForAcademics > 0 ? studentPoolForAcademics - passCount : 0;
  let passPercentage = 0;

  if (studentPoolForAcademics > 0) {
      if ((semester === 'all' && subject === 'All Subjects') && relevantMarks.length > 0) {
          // For broad overviews, student-based pass rate is too strict. Use a subject-instance pass rate for the percentage.
          const passedExams = relevantMarks.filter(mark => {
              const internal = mark.internalMark ?? 0;
              const external = mark.externalMark ?? 0;
              const total = mark.marksObtained;
              return (internal >= JNTUH_RULES.INTERNAL_MIN && external >= JNTUH_RULES.EXTERNAL_MIN && total >= JNTUH_RULES.TOTAL_MIN);
          }).length;
          passPercentage = (passedExams / relevantMarks.length) * 100;
      } else {
          // For specific filters, use the strict student-based pass rate.
          passPercentage = (passCount / studentPoolForAcademics) * 100;
      }
  }
  
  const relevantFaculty = getFacultyForCollege(college);
  const facultyMetrics = getAttendanceMetrics(relevantFaculty, mockFacultyAttendance, 'facultyId');

  const relevantStaff = getStaffForCollege(college);
  const staffMetrics = getAttendanceMetrics(relevantStaff, mockStaffAttendance, 'staffId');
  
  return {
      studentAttendance: studentMetrics,
      studentAcademics: { passPercentage: parseFloat(passPercentage.toFixed(1)), passCount, failCount },
      facultyMetrics: { ...facultyMetrics, absent: facultyMetrics.absent },
      staffMetrics,
      placementMetrics,
  };
};

// FIX: Add missing parameters rollNo and semester to match function call.
export const searchStudents = async (
  queries: { name?: string; admissionNumber?: string },
  college: College,
  department: string,
  year: string,
  rollNo: string,
  semester: string
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
    const lowerCaseAdmissionNo = admissionNumber.toLowerCase();
    students = students.filter(student =>
      student.admissionNumber.toLowerCase().includes(lowerCaseAdmissionNo),
    );
  }

  return students;
};

export const getStudentDetails = async (admissionNumber: string): Promise<StudentDetailsType | null> => {
    await simulateDelay(400);
    const student = mockStudents.find(s => s.admissionNumber === admissionNumber);
    if (!student) return null;

    const marks = mockStudentMarks.filter(m => m.admissionNumber === admissionNumber);
    const attendance = mockStudentAttendance.filter(a => a.admissionNumber === admissionNumber);
    const fees = mockStudentFees.filter(f => f.admissionNumber === admissionNumber);
    const placementDetails = mockPlacementDetails.find(p => p.admissionNumber === admissionNumber);

    return {
        ...student,
        marks,
        attendance,
        // FIX: Add missing 'fees', 'currentSemester' and 'placementDetails' properties to satisfy StudentDetailsType
        fees,
        currentSemester: 'N/A', // Simplified, could be calculated
        placementDetails,
    };
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
    return { totalDays, presentDays, absentDays, halfDays };
};


export const getFilteredStudentDetails = async (
    college: College, year: string, department: string, rollNo: string, startDate: string, endDate: string, semester: string, subject: string
): Promise<DetailedStudentCSVData[]> => {
    await simulateDelay(150);
    const relevantStudents = getStudentsForCollege(college, year, department, rollNo, semester);
    const studentIds = new Set(relevantStudents.map(s => s.admissionNumber));

    // 1. Filter data once
    const attendanceInRange = mockStudentAttendance.filter(a => studentIds.has(a.admissionNumber) && a.date >= startDate && a.date <= endDate);
    let marksInRange = mockStudentMarks.filter(m => studentIds.has(m.admissionNumber));
    if (semester !== 'all') marksInRange = marksInRange.filter(m => m.semester.toString() === semester);
    if (subject !== 'All Subjects') marksInRange = marksInRange.filter(m => m.subjectName === subject);
    
    // 2. Group data into Maps for efficient lookup
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

    // 3. Map over students and perform fast lookups
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
            ...student, totalDays, presentDays, absentDays, halfDays, academicResult
        };
    });
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
        totalDays, presentDays, absentDays, halfDays,
    }];
};

export const getSubjects = async (college: College, department: string, semester: string): Promise<string[]> => {
    await simulateDelay(100);
    if (department === 'all' || semester === 'all') return [];
    
    const relevantStudents = getStudentsForCollege(college, 'all', department, 'all', semester);
    const studentIds = new Set(relevantStudents.map(s => s.admissionNumber));
    
    const subjects = mockStudentMarks
        .filter(mark => studentIds.has(mark.admissionNumber) && mark.semester.toString() === semester)
        .map(mark => mark.subjectName);
        
    return [...new Set(subjects)];
};

// FIX: Add missing searchPlacements function to resolve import error.
export const searchPlacements = async (
    queries: { name?: string; admissionNumber?: string; companyName?: string; },
    college: College,
    department: string,
    year: string,
    rollNo: string
): Promise<PlacementWithStudent[]> => {
    await simulateDelay(250);
    
    let students = getStudentsForCollege(college, year, department, rollNo, 'all');

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
      isPlaced: false, // Default isPlaced to false for manually added students
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

// FIX: Completed the addStaffAttendance function to resolve syntax error.
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