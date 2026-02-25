// server/src/db-types.ts

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
    department?: string;
    fatherMobileNumber?: string;
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
      programCode: 'ADMIN';
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
    totalFees: number;
    paidAmount: number;
    dueAmount: number;
    status: 'Paid' | 'Partial' | 'Due';
  }