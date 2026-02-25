
import { College, Role, User } from './types';

export const COLLEGE_NAMES: { [key in College]: string } = {
  [College.ALL]: 'All Colleges Overview',
  [College.BRIL]: 'BRIL',
  [College.BRIG]: 'BRIG',
  [College.KNRR]: 'KNRR',
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
    { id: 'GECE15022020-001', name: 'Prof. G. Reddy', email: 'faculty.bgiit@edu.com', password: 'password123', role: Role.FACULTY, college: College.BRIG },

    // Staff
    { id: 'KSTF15042020-001', name: 'Mr. A. Kumar', email: 'staff.knrcer@edu.com', password: 'password123', role: Role.STAFF, college: College.KNRR },
];


export const DEPARTMENTS = [
    'CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL', 'HS'
];

export const DEPT_COLORS: { [key: string]: string } = {
  'ECE': '#8B5CF6',   // Violet-500
  'EEE': '#F59E0B',   // Amber-500
  'MECH': '#14B8A6',  // Teal-500
  'CIVIL': '#6366F1', // Indigo-500
  'HS': '#6B7280',    // Gray-500
};

export const LATEST_ATTENDANCE_DATE = '2025-09-15';

// FIX: Added missing ACADEMIC_YEARS export to resolve import errors.
export const ACADEMIC_YEARS = ['2020', '2021', '2022', '2023', '2024', '2025'];

export const JNTUH_RULES = {
    INTERNAL_MIN: 14,
    EXTERNAL_MIN: 21,
    TOTAL_MIN: 40,
};