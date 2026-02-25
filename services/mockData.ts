// FIX: Added function to generate subjects and exported ALL_SUBJECTS to fix import error in StudentTranscript.
const generateSubjectsForDept = (dept: string) => {
    const subjects: Record<string, { code: string, name: string }[]> = {};
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

import { Student, StudentMark, StudentAttendance, Faculty, FacultyAttendance, Staff, StaffAttendance, College, PlacementDetails, StudentFee } from '../types';
import { LATEST_ATTENDANCE_DATE } from '../constants';

const colleges = [
    { prefix: 'K', code: College.KNRR },
    { prefix: 'B', code: College.BRIL },
    { prefix: 'G', code: College.BRIG },
];

const departments = [
    'CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL', 'HS'
];

// FIX: Populate ALL_SUBJECTS for all departments
departments.forEach(dept => {
    ALL_SUBJECTS[dept] = generateSubjectsForDept(dept);
});


const years = [2020, 2021, 2022, 2023, 2024, 2025];
const studentsPerDept = 60;

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Saanvi', 'Aanya', 'Aadhya', 'Aaradhya', 'Anika', 'Anvi', 'Diya', 'Pari', 'Myra', 'Sara'];
const lastNames = ['Kumar', 'Singh', 'Gupta', 'Sharma', 'Patel', 'Reddy', 'Khan', 'Verma', 'Yadav', 'Jain'];

// --- Date Range for Attendance ---
const endDate = new Date(LATEST_ATTENDANCE_DATE);
const startDate = new Date(endDate);
startDate.setDate(endDate.getDate() - 90); // 90 days of attendance data

const dateRange: string[] = [];
let currentDate = new Date(startDate);
while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip weekends
        dateRange.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
}

// --- Student Data Generation ---
const generatedStudents: Student[] = [];
const generatedMarks: StudentMark[] = [];
const generatedStudentAttendance: StudentAttendance[] = [];
const generatedPlacementDetails: PlacementDetails[] = [];
const generatedStudentFees: StudentFee[] = [];

let studentCounter = 0;

colleges.forEach(college => {
    departments.forEach(dept => {
        years.forEach(year => {
            for (let i = 1; i <= studentsPerDept; i++) {
                const rollNo = i.toString().padStart(2, '0');
                const admissionNumber = `${college.prefix}${dept}${year}${rollNo}`;
                
                const studentName = `${firstNames[studentCounter % firstNames.length]} ${lastNames[studentCounter % lastNames.length]}`;
                const gender = studentCounter % 2 === 0 ? 'M' : 'F';

                // FIX: Updated isPlaced logic and added data generation for missing PlacementDetails fields.
                const LATEST_DATE = new Date(LATEST_ATTENDANCE_DATE);
                const currentFullYear = LATEST_DATE.getFullYear();
                const currentMonth = LATEST_DATE.getMonth(); // 0-11
                const yearsPassed = currentFullYear - year;

                let currentSemester: number;
                // Academic year starts in July (month 6)
                if (currentMonth >= 6) { 
                    currentSemester = yearsPassed * 2 + 1;
                } else {
                    currentSemester = yearsPassed * 2;
                }
                
                const isEligibleForPlacement = currentSemester >= 6;
                const isCSTrack = ['CSE', 'CSM', 'CSD', 'CSC'].includes(dept);

                let placementChance = 0.0;
                if (isEligibleForPlacement) {
                    placementChance = 0.2; // Base for eligible
                    if (isCSTrack) placementChance += 0.4;
                    if (currentSemester > 8) placementChance += 0.2; // Higher chance if graduated
                }
                
                const isPlaced = Math.random() < placementChance;
                
                generatedStudents.push({
                    collegeCode: college.code,
                    programCode: dept,
                    admissionNumber,
                    rollNo,
                    studentName,
                    gender,
                    isPlaced,
                    mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`
                });

                if (isPlaced) {
                    const placementSemesters = [6, 7, 8];
                    const possiblePlacementSems = placementSemesters.filter(s => s <= currentSemester);
                
                    let placementSemester: number;
                    if (possiblePlacementSems.length > 0) {
                        placementSemester = possiblePlacementSems[Math.floor(Math.random() * possiblePlacementSems.length)];
                    } else {
                        placementSemester = placementSemesters[Math.floor(Math.random() * placementSemesters.length)];
                    }
                
                    let placementYearStr = '';
                    if (placementSemester === 6) {
                        placementYearStr = '3rd Year';
                    } else if (placementSemester === 7 || placementSemester === 8) {
                        placementYearStr = '4th Year';
                    }
                
                    const academicYearOffset = Math.floor((placementSemester - 1) / 2);
                    const academicYearForPlacement = `${year + academicYearOffset}-${year + academicYearOffset + 1}`;

                    generatedPlacementDetails.push({
                        admissionNumber,
                        companyName: ['Infosys Ltd', 'TCS', 'Wipro', 'Capgemini', 'HCL Tech'][studentCounter % 5],
                        hrName: `Vihaan Verma`,
                        hrMobileNumber: `8729944326`,
                        studentMobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
                        year: placementYearStr,
                        semester: String(placementSemester),
                        academicYear: academicYearForPlacement,
                        hrEmail: `hr@${['infosys', 'tcs', 'wipro', 'capgemini', 'hcl'][studentCounter % 5]}.com`
                    });
                }
                
                for (let y = 0; y < 4; y++) {
                    const academicYear = `${year + y}-${year + y + 1}`;
                    const totalFees = [65000, 70000, 72000, 75000][y];
                    let paidAmount = 0;
                    const paymentScenario = Math.random();
                    if (paymentScenario > 0.4) { // fully paid
                        paidAmount = totalFees;
                    } else if (paymentScenario > 0.1) { // partially paid
                        paidAmount = Math.floor(Math.random() * (totalFees - 10000)) + 10000;
                    } // else 0 paid (due)

                    generatedStudentFees.push({
                        admissionNumber, academicYear, totalFees, paidAmount,
                        dueAmount: totalFees - paidAmount,
                        status: paidAmount === totalFees ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Due'),
                    });
                }


                for (let sem = 1; sem <= 8; sem++) {
                    for (let sub = 1; sub <= 5; sub++) {
                        let internalMark = Math.floor(Math.random() * (40 - 14 + 1)) + 14;
                        let externalMark = Math.floor(Math.random() * (60 - 21 + 1)) + 21;

                        if (studentCounter > 0 && studentCounter % 5 === 0 && sub === 1) { 
                            externalMark = Math.floor(Math.random() * 21);
                        }
                        if (studentCounter > 0 && studentCounter % 7 === 0 && sub === 2) { 
                            internalMark = Math.floor(Math.random() * 14);
                        }
                        if (studentCounter > 0 && studentCounter % 10 === 0 && sub === 3) {
                            internalMark = 14; 
                            externalMark = 25;
                        }
                        
                        generatedMarks.push({
                            admissionNumber,
                            semester: sem,
                            subjectCode: `${dept}${sem}0${sub}`,
                            subjectName: `${dept} Subject ${sem}0${sub}`,
                            internalMark,
                            externalMark,
                            marksObtained: internalMark + externalMark,
                            maxMarks: 100,
                        });
                    }
                }

                dateRange.forEach(date => {
                    const morning = Math.random() > 0.1 ? 'Present' : 'Absent';
                    const afternoon = morning === 'Present' && Math.random() > 0.2 ? 'Present' : 'Absent';
                    generatedStudentAttendance.push({
                        admissionNumber,
                        date,
                        morning,
                        afternoon,
                    });
                });

                studentCounter++;
            }
        });
    });
});

export const mockStudents: Student[] = generatedStudents;
export const mockStudentMarks: StudentMark[] = generatedMarks;
export const mockStudentAttendance: StudentAttendance[] = generatedStudentAttendance;
export const mockPlacementDetails: PlacementDetails[] = generatedPlacementDetails;
export const mockStudentFees: StudentFee[] = generatedStudentFees;

// --- Faculty Data Generation ---
const facultyJoinData = {
    [College.KNRR]: { ECE: { date: '12052021', count: 5 }, EEE: { date: '01012022', count: 8 }, MECH: { date: '20032020', count: 6 }, CIVIL: { date: '10022021', count: 4 }, HS: { date: '25082020', count: 3 } },
    [College.BRIL]: { ECE: { date: '10072020', count: 2 }, EEE: { date: '15082021', count: 4 }, MECH: { date: '22012022', count: 3 }, CIVIL: { date: '05022020', count: 4 }, HS: { date: '12032021', count: 3 } },
    [College.BRIG]: { ECE: { date: '15022020', count: 2 }, EEE: { date: '12032022', count: 2 }, MECH: { date: '05012022', count: 2 }, CIVIL: { date: '20042020', count: 2 }, HS: { date: '10062021', count: 2 } },
};
const generatedFaculty: Faculty[] = [];
const generatedFacultyAttendance: FacultyAttendance[] = [];
let facultyCounter = 0;

Object.entries(facultyJoinData).forEach(([collegeCode, depts]) => {
    const collegePrefix = colleges.find(c => c.code === collegeCode as College)!.prefix;
    Object.entries(depts).forEach(([deptCode, details]) => {
        for (let i = 1; i <= details.count; i++) {
            const serialNo = i.toString().padStart(3, '0');
            const facultyId = `${collegePrefix}${deptCode}${details.date}-${serialNo}`;
            const facultyName = `Prof. ${firstNames[(facultyCounter + 5) % firstNames.length]} ${lastNames[(facultyCounter + 5) % lastNames.length]}`;
            const gender = facultyCounter % 3 === 0 ? 'F' : 'M';

            generatedFaculty.push({
                collegeCode: collegeCode as College,
                programCode: deptCode,
                facultyId,
                facultyName,
                gender,
            });
            
            dateRange.forEach(date => {
                const morning = Math.random() > 0.05 ? 'Present' : 'Absent';
                const afternoon = morning === 'Present' && Math.random() > 0.1 ? 'Present' : 'Absent';
                generatedFacultyAttendance.push({
                    facultyId,
                    date,
                    morning,
                    afternoon,
                });
            });
            facultyCounter++;
        }
    });
});

export const mockFaculty: Faculty[] = generatedFaculty;
export const mockFacultyAttendance: FacultyAttendance[] = generatedFacultyAttendance;

// --- Staff Data Generation ---
const staffJoinData = {
    [College.KNRR]: [{ date: '15042020', count: 5 }],
    [College.BRIL]: [{ date: '10072021', count: 2 }, { date: '11082022', count: 3 }], // Total 5
    [College.BRIG]: [{ date: '05012022', count: 5 }],
};

const generatedStaff: Staff[] = [];
const generatedStaffAttendance: StaffAttendance[] = [];
let staffCounter = 0;

Object.entries(staffJoinData).forEach(([collegeCode, joinGroups]) => {
    const collegePrefix = colleges.find(c => c.code === collegeCode as College)!.prefix;
    joinGroups.forEach(group => {
        for (let i = 1; i <= group.count; i++) {
            const serialNo = i.toString().padStart(3, '0');
            const staffId = `${collegePrefix}STF${group.date}-${serialNo}`;
            const staffName = `${firstNames[(staffCounter + 10) % firstNames.length]} ${lastNames[(staffCounter + 10) % lastNames.length]}`;
            const gender = staffCounter % 2 === 0 ? 'M' : 'F';

            generatedStaff.push({
                collegeCode: collegeCode as College,
                programCode: 'ADMIN',
                staffId,
                staffName,
                gender,
            });

            dateRange.forEach(date => {
                const morning = Math.random() > 0.08 ? 'Present' : 'Absent';
                const afternoon = morning === 'Present' && Math.random() > 0.15 ? 'Present' : 'Absent';
                generatedStaffAttendance.push({
                    staffId,
                    date,
                    morning,
                    afternoon,
                });
            });
            staffCounter++;
        }
    });
});

export const mockStaff: Staff[] = generatedStaff;
export const mockStaffAttendance: StaffAttendance[] = generatedStaffAttendance;