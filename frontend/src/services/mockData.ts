import { Student, StudentMark, StudentAttendance, Faculty, FacultyAttendance, Staff, StaffAttendance, College, PlacementDetails, StudentFee } from '../types/index';
import { LATEST_ATTENDANCE_DATE, DEPARTMENTS } from '../constants/index';

const cseSubjects: Record<string, { code: string; name: string }[]> = {
    '1': [
        { code: 'CH102BS', name: 'Engineering Chemistry' },
        { code: 'CH103BS', name: 'Programming for Problem Solving' },
        { code: 'CH107BS', name: 'Engineering Chemistry Laboratory' },
        { code: 'CS106ES', name: 'Elements of Computer Science & Engineering' },
        { code: 'CS108ES', name: 'Programming for Problem Solving Laboratory' },
        { code: 'EE104ES', name: 'Basic Electrical Engineering' },
        { code: 'EE109ES', name: 'Basic Electrical Engineering Laboratory' },
        { code: 'MA101BS', name: 'Matrices and Calculus' },
        { code: 'ME105ES', name: 'Computer Aided Engineering Graphics' },
    ],
    '2': [
        { code: 'CS206ES', name: 'Python Programming Laboratory' },
        { code: 'CS208ES', name: 'IT Workshop' },
        { code: 'EC205ES', name: 'Electronic Devices and Circuits' },
        { code: 'EN208HS', name: 'English Language and Communication Skills Laboratory' },
        { code: 'MA201BS', name: 'Ordinary Differential Equations and Vector Calculus' },
        { code: 'ME203ES', name: 'Engineering Workshop' },
        { code: 'PH202BS', name: 'Applied Physics' },
        { code: 'PH207BS', name: 'Applied Physics Laboratory' },
    ],
    '3': [
        { code: 'CS301ESD', name: 'Digital Electronics' },
        { code: 'CS302PC', name: 'Data Structures' },
        { code: 'CS304PC', name: 'Computer Organization and Architecture' },
        { code: 'CS305PC', name: 'Object Oriented Programming through Java' },
        { code: 'CS306PC', name: 'Data Structures Lab' },
        { code: 'CS309PC', name: 'Java Lab' },
        { code: 'CS410SD', name: 'Data Visualization – R Programming / Power BI' },
        { code: 'MA303BS', name: 'Computer Oriented Statistical Methods' },
    ],
    '4': [
        { code: 'CS320SD', name: 'Real-time Research Project / Societal Related Project' },
        { code: 'CS401PC', name: 'Discrete Mathematics' },
        { code: 'CS403PC', name: 'Operating System' },
        { code: 'CS404PC', name: 'Computer Organization and Architecture' },
        { code: 'CS405PC', name: 'Software Engineering' },
        { code: 'CS407PC', name: 'Database Management Systems Lab' },
        { code: 'EN106HS', name: 'Operating Systems Lab' },
        { code: 'SM402MS', name: 'Business Economics & Financial Analysis' },
    ],
    '5': [
        { code: 'CS503PC', name: 'Computer Networks Lab' },
        { code: 'CS701PC', name: 'Design and Analysis of Algorithms' },
        { code: 'CS702PC', name: 'Computer Networks' },
        { code: 'CS721PE', name: 'DevOps' },
        { code: 'CS722PE', name: 'DevOps Lab' },
        { code: 'CS754PE', name: 'Blockchain Technology' },
        { code: 'CS755PE', name: 'Software Process & Project Management' },
        { code: 'EN708HS', name: 'Advanced English Communication Skills Lab' },
    ],
    '6': [
        { code: 'CS601PC', name: 'Machine Learning' },
        { code: 'CS602PC', name: 'Formal Languages & Automata Theory' },
        { code: 'CS603PC', name: 'Artificial Intelligence' },
        { code: 'CS604PC', name: 'Machine Learning Lab' },
        { code: 'CS605PC', name: 'Artificial Intelligence Lab' },
        { code: 'CS606PC', name: 'Industrial Oriented Mini Project' },
        { code: 'CS612OE', name: 'Database Management Systems' },
        { code: 'CS635P', name: 'Software Testing Methodologies' },
    ],
    '7': [
        { code: 'CS634PE', name: 'Mobile Application Development' },
        { code: 'CS702PC', name: 'Advanced DBMS / Blockchain Technology' },
        { code: 'CS705PC', name: 'Minor Project' },
        { code: 'CS7123', name: 'Seminar / Internship' },
        { code: 'CS802PC', name: 'Compiler Design' },
        { code: 'CS832OE', name: 'Introduction to Computer Networks' },
    ],
    '8': [
        { code: 'CS306123', name: 'Comprehensive Viva' },
        { code: 'CS742PE', name: 'Cyber Security' },
        { code: 'CS801PC', name: 'Project / Thesis' },
        { code: 'CS831OE', name: 'Algorithm Design & Analysis' },
        { code: 'CS863PE', name: 'Deep Learning' },
    ],
};

const generateSubjectsForDept = (dept: string) => {
    const subjects: Record<string, { code: string; name: string }[]> = {};
    for (let sem = 1; sem <= 8; sem++) {
        const subjectCount = sem < 3 ? 8 : 5;
        subjects[String(sem)] = Array.from({ length: subjectCount }, (_, i) => ({
            code: `${dept}${sem}0${i + 1}`,
            name: `${dept} Subject ${sem}0${i + 1}`,
        }));
    }
    return subjects;
};

export const ALL_SUBJECTS: Record<string, Record<string, { code: string; name: string }[]>> = {};
DEPARTMENTS.forEach(dept => {
    const isCSTrack = ['CSE', 'CSM', 'CSD', 'CSC'].includes(dept);
    if (isCSTrack) {
        ALL_SUBJECTS[dept] = cseSubjects;
    } else {
        ALL_SUBJECTS[dept] = generateSubjectsForDept(dept);
    }
});

export const mockStudents: Student[] = [];
export const mockStudentMarks: StudentMark[] = [];
export const mockStudentAttendance: StudentAttendance[] = [];
export const mockPlacementDetails: PlacementDetails[] = [];
export const mockStudentFees: StudentFee[] = [];
export const mockFaculty: Faculty[] = [];
export const mockFacultyAttendance: FacultyAttendance[] = [];
export const mockStaff: Staff[] = [];
export const mockStaffAttendance: StaffAttendance[] = [];