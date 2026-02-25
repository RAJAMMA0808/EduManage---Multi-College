export enum Role {
  CHAIRMAN = 'CHAIRMAN',
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
}

// FIX: Added 'fees', 'currentSemester', and 'placementDetails' to support fee details, transcript generation, and placement info.
export interface StudentDetailsType extends Student {
  marks: StudentMark[];
  attendance: StudentAttendance[];
  fees: StudentFee[];
  currentSemester?: number | string;
  placementDetails?: PlacementDetails;
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

export interface PlacementDetails {
  admissionNumber: string;
  companyName: string;
  hrName: string;
  hrMobileNumber: string;
  studentMobileNumber: string;
  // FIX: Added missing properties to match usage in PlacementTranscript.tsx and data from mockData.ts
  year: string;
  semester: string;
  academicYear: string;
  hrEmail: string;
}

export interface StudentFee {
  admissionNumber: string;
  academicYear: string;
  totalFees: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Partial' | 'Due';
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
// FIX: Added PlacementWithStudent type to support placement search results.
export type PlacementWithStudent = Student & PlacementDetails;
// FIX: Extended View type to include all required application sections to prevent type mismatches.
export type View = 'dashboard' | 'comparison' | 'courses' | 'studentSearch' | 'applicationSubmission' | 'studentAttendance' | 'studentFee' | 'placementSearch' | 'onlineAttendance' | 'ocr' | 'collegeFeeDetails' | 'removedData' | 'accessProvide' | 'onlineFeePayment' | 'loginAccessProvide' | 'examNotification' | 'thumbRegistration';

export type TranscriptView = 'marks' | 'attendance' | 'fees' | 'placement';

// FIX: Added AppState enum for story generation flow.
export enum AppState {
  IDLE,
  ROUTE_FOUND,
  ROUTE_CONFIRMED,
  GENERATING_OUTLINE,
  GENERATING_STORY,
  PLAYING,
}

// FIX: Added StoryStyle type.
export type StoryStyle = 'NOIR' | 'CHILDREN' | 'HISTORICAL' | 'FANTASY';

// FIX: Added RouteDetails interface.
export interface RouteDetails {
  startAddress: string;
  endAddress: string;
  distance: string;
  duration: string;
  durationSeconds: number;
  travelMode: 'WALKING' | 'DRIVING';
  voiceName: string;
  storyStyle: StoryStyle;
}

// FIX: Added StorySegment interface.
export interface StorySegment {
  index: number;
  text: string;
  audioBuffer: AudioBuffer | null;
}

// FIX: Added AudioStory interface.
export interface AudioStory {
  totalSegmentsEstimate: number;
  segments: StorySegment[];
}
