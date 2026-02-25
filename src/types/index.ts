import { 
  Role as SharedRole, 
  College as SharedCollege,
  User as SharedUser,
  Student as SharedStudent,
  StudentMark as SharedStudentMark,
  StudentAttendance as SharedStudentAttendance,
  Faculty as SharedFaculty,
  FacultyAttendance as SharedFacultyAttendance,
  Staff as SharedStaff,
  StaffAttendance as SharedStaffAttendance,
  DashboardData as SharedDashboardData,
  StudentDetailsType as SharedStudentDetailsType,
  // FIX: Add missing imports for FacultyDetailsType and StaffDetailsType from shared types.
  FacultyDetailsType as SharedFacultyDetailsType,
  StaffDetailsType as SharedStaffDetailsType,
  DetailedStudentCSVData as SharedDetailedStudentCSVData,
  DetailedPlacementCsvData as SharedDetailedPlacementCsvData,
  DetailedFacultyCSVData as SharedDetailedFacultyCSVData,
  DetailedStaffCSVData as SharedDetailedStaffCSVData,
  SyllabusPdf as SharedSyllabusPdf,
  PlacementDetails as SharedPlacementDetails,
  StudentFee as SharedStudentFee,
  StudentWithFee as SharedStudentWithFee,
  StudentAttendanceSummary as SharedStudentAttendanceSummary,
  StudentWithAttendance as SharedStudentWithAttendance,
  PlacementWithStudent as SharedPlacementWithStudent,
  LogEntry as SharedLogEntry,
} from '@shared/types';

// Re-exporting from shared to be used within the frontend
export const Role = SharedRole;
export type Role = SharedRole;
export const College = SharedCollege;
export type College = SharedCollege;
export type User = SharedUser;
export type Student = SharedStudent;
export type StudentMark = SharedStudentMark;
export type StudentAttendance = SharedStudentAttendance;
export type Faculty = SharedFaculty;
export type FacultyAttendance = SharedFacultyAttendance;
export type Staff = SharedStaff;
export type StaffAttendance = SharedStaffAttendance;
export type DashboardData = SharedDashboardData;
export type StudentDetailsType = SharedStudentDetailsType;
// FIX: Export FacultyDetailsType and StaffDetailsType to resolve import errors.
export type FacultyDetailsType = SharedFacultyDetailsType;
export type StaffDetailsType = SharedStaffDetailsType;
export type DetailedStudentCSVData = SharedDetailedStudentCSVData;
export type DetailedPlacementCsvData = SharedDetailedPlacementCsvData;
export type DetailedFacultyCSVData = SharedDetailedFacultyCSVData;
export type DetailedStaffCSVData = SharedDetailedStaffCSVData;
export type SyllabusPdf = SharedSyllabusPdf;
export type PlacementDetails = SharedPlacementDetails;
export type StudentFee = SharedStudentFee;
export type StudentWithFee = SharedStudentWithFee;
export type StudentAttendanceSummary = SharedStudentAttendanceSummary;
export type StudentWithAttendance = SharedStudentWithAttendance;
export type PlacementWithStudent = SharedPlacementWithStudent;


// Frontend-specific types
// FIX: Added missing view types 'onlineAttendance' and 'ocr' to satisfy src/App.tsx switch cases.
export type View = 'dashboard' | 'comparison' | 'courses' | 'studentSearch' | 'applicationSubmission' | 'collegeFeeDetails' | 'removedData' | 'accessProvide' | 'studentAttendance' | 'studentFee' | 'placementSearch' | 'onlineFeePayment' | 'loginAccessProvide' | 'examNotification' | 'thumbRegistration' | 'onlineAttendance' | 'ocr';

// FIX: Added 'examFees' to TranscriptView to support specialized reports and satisfy PrintTrigger logic.
export type TranscriptView = 'marks' | 'attendance' | 'fees' | 'placement' | 'examFees';

// FIX: Correctly re-export LogEntry type from shared types.
export type LogEntry = SharedLogEntry;