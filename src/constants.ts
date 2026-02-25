
import { College, Role, User } from './types';

export const COLLEGE_NAMES: { [key in College]: string } = {
  [College.ALL]: 'All Colleges Overview',
  [College.BRIL]: 'BRIL',
  [College.BRIG]: 'BRIG',
  [College.KNRR]: 'KNRR',
};

export const COLLEGE_CODES: { [key in College]?: string } = {
  [College.BRIL]: 'B',
  [College.BRIG]: 'G',
  [College.KNRR]: 'K',
};

export const COLLEGE_COLORS: { [key: string]: string } = {
  [College.BRIL]: '#3B82F6',   // Blue-500
  [College.BRIG]: '#10B981',  // Emerald-500
  [College.KNRR]: '#F97316', // Orange-500
};

export const MOCK_USERS: User[] = [
    // Chairman
    { id: 'CHAIRMAN01', name: 'Dr. Chairman', email: 'chairman@edu.com', password: 'password123', role: Role.CHAIRMAN, college: null },
    
    // HOD
    { id: 'dharmaraj', name: 'Dr. Dharmaraj', email: 'dharmaraj.hod@edu.com', password: 'password123', role: Role.HOD, college: College.BRIL },

    // Faculty
    { id: 'BCSE01032020-001', name: 'Prof. B. Verma', email: 'faculty.biet@edu.com', password: 'password123', role: Role.FACULTY, college: College.BRIL },
    { id: 'GECE15022020-001', name: 'Prof. G. Reddy', email: 'faculty.bgiit@edu.com', password: 'password123', role: Role.FACULTY, college: College.BRIG },

    // Staff
    { id: 'KSTF15042020-001', name: 'Mr. A. Kumar', email: 'staff.knrcer@edu.com', password: 'password123', role: Role.STAFF, college: College.KNRR },

    // Student
    { id: 'KCSE202001', name: 'Aarav Kapoor', email: 'aarav.k@edu.com', password: 'password123', role: Role.STUDENT, college: College.KNRR },
];


export const DEPARTMENTS = [
    'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'HS', 'CSM', 'CSD', 'CSC'
];

export const DEPT_COLORS: { [key: string]: string } = {
  'CSE': '#EC4899',   // Pink-500
  'ECE': '#8B5CF6',   // Violet-500
  'EEE': '#F59E0B',   // Amber-500
  'MECH': '#14B8A6',  // Teal-500
  'CIVIL': '#6366F1', // Indigo-500
  'HS': '#6B7280',    // Gray-500
  'CSM': '#D946EF',   // Fuchsia-500
  'CSD': '#0EA5E9',   // Sky-500
  'CSC': '#84CC16',   // Lime-500
};

export const LATEST_ATTENDANCE_DATE = '2025-09-15';

export const JNTUH_RULES = {
    INTERNAL_MIN: 14,
    EXTERNAL_MIN: 21,
    TOTAL_MIN: 40,
};