export enum Role {
  CHAIRMAN = 'CHAIRMAN',
  PRINCIPAL = 'PRINCIPAL',
  HOD = 'HOD',
  FACULTY = 'FACULTY',
  STAFF = 'STAFF',
  STUDENT = 'STUDENT',
}

export enum College {
  ALL = 'ALL',
  BRIL = 'BRIL',
  BRIG = 'BRIG',
  KNRR = 'KNRR',
}

export interface User {
  id: string;
  name: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  role: Role;
  college: College | null;
  department?: string;
  fatherMobileNumber?: string;
  status?: 'pending' | 'approved';
  attendanceStatus?: 'pending' | 'approved';
  approvedBy?: string;
  attendanceApprovedBy?: string;
}

export interface Student {
  collegeCode: College;
  programCode: string;
  admissionNumber: string;
  rollNo: string;
  studentName: string;
  gender: 'M' | 'F';
  isPlaced: boolean;
  mobileNumber?: string;
  fatherMobileNumber?: string;
}

export interface StudentMark {
  admissionNumber: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  examType?: string;
  internalMark?: number;
  externalMark?: number;
}

export interface StudentAttendance {
  admissionNumber: string;
  date: string;
  morning: 'Present' | 'Absent';
  afternoon: 'Present' | 'Absent';
}

export interface Faculty {
    collegeCode: College;
    programCode: string;
    facultyId: string;
    facultyName: string;
    gender: 'M' | 'F';
}

export interface FacultyAttendance {
    facultyId: string;
    date: string;
    morning: 'Present' | 'Absent';
    afternoon: 'Present' | 'Absent';
}

export interface Staff {
    collegeCode: College;
    programCode: 'ADMIN'; // Staff are not associated with academic programs
    staffId: string;
    staffName: string;
    gender: 'M' | 'F';
}

export interface StaffAttendance {
    staffId: string;
    date: string;
    morning: 'Present' | 'Absent';
    afternoon: 'Present' | 'Absent';
}


export interface DashboardData {
    studentAttendance: {
        total: number;
        present: number;
        absent: number;
        fullDay: number;
        halfDay: number;
    };
    studentAcademics: {
        passPercentage: number;
        passCount: number;
        failCount: number;
        aggregatePercentage: number;
    };
    facultyMetrics: {
        total: number;
        fullDay: number;
        halfDay: number;
        absent: number;
    };
    staffMetrics: {
        total: number;
        present: number;
        absent: number;
        fullDay: number;
        halfDay: number;
    };
    placementMetrics: {
        totalStudents: number;
        placedStudents: number;
        notPlacedStudents: number;
        placementPercentage: number;
    };
    studentFees: {
        totalFees: number;
        paidAmount: number;
        dueAmount: number;
        paidCount: number;
        partialCount: number;
        dueCount: number;
    };
}

export interface PlacementDetails {
  admissionNumber: string;
  companyName: string;
  hrName: string;
  hrMobileNumber: string;
  studentMobileNumber: string;
  year: string;
  semester: string;
  academicYear: string;
  hrEmail: string;
}

export interface StudentFee {
  admissionNumber: string;
  academicYear: string;
  semester: number;
  paymentDate: string;
  programCode: string;
  admissionType?: string;
  totalFees: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Partial' | 'Due';
  feeType?: 'Tuition' | 'Exam';
}

export interface StudentDetailsType extends Student {
  marks: StudentMark[];
  attendance: StudentAttendance[];
  fees: StudentFee[];
  currentSemester?: number | string;
  placementDetails?: PlacementDetails;
}

export interface FacultyDetailsType extends Faculty {
  attendance: FacultyAttendance[];
}

export interface StaffDetailsType extends Staff {
  attendance: StaffAttendance[];
}


export interface DetailedStudentCSVData {
    admissionNumber: string;
    rollNo: string;
    studentName: string;
    collegeCode: string;
    programCode: string;
    gender: 'M' | 'F';
    totalDays: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    academicResult: string;
}

export interface DetailedPlacementCsvData {
  'S.NO': number;
  'COLLEGE CODE': string;
  'ADMISSION NUMBER': string;
  'STUDENT NAME': string;
  'COURSE/BRANCH': string;
  'YEAR': string;
  'SEMESTER': string;
  'STUDENT MOBIL.': string;
  'COMPANY/ORG NAME': string;
  'COMPANY WEBSITE': string;
  'HR NAME': string;
  'HR MOBILE NUMBER': string;
  'HR EMAIL ID': string;
}

export interface DetailedFacultyCSVData {
    facultyId: string;
    facultyName: string;
    collegeCode: string;
    programCode: string;
    gender: 'M' | 'F';
    totalDays: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
}

export interface DetailedStaffCSVData {
    staffId: string;
    staffName: string;
    collegeCode: string;
    programCode: 'ADMIN';
    gender: 'M' | 'F';
    totalDays: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
}

export interface SyllabusPdf {
  name: string;
  data: string; // base64 data URL
}


export type StudentWithFee = Student & Omit<StudentFee, 'admissionNumber'>;

export interface StudentAttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  attendancePercentage: number;
}

export type StudentWithAttendance = Student & StudentAttendanceSummary;

export type PlacementWithStudent = Student & PlacementDetails;

export interface LogEntry {
  id: number;
  studentName: string;
  admissionNumber: string;
  dataType: 'Marks' | 'Attendance' | 'Fees' | 'Exam Fees' | 'Placement'; 
  scope: string;
  deletedBy: string;
  timestamp: string;
  reason?: string;
  deletedData: any[]; 
}