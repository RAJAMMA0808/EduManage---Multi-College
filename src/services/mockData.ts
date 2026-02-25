import { Student, StudentMark, StudentAttendance, Faculty, FacultyAttendance, Staff, StaffAttendance, College, PlacementDetails, StudentFee } from '../types/index';
import { LATEST_ATTENDANCE_DATE, DEPARTMENTS } from '../constants/index';

const cseSubjects: Record<string, { code: string; name: string }[]> = {
    '1': [
        { code: 'MA101BS', name: 'Engineering Mathematics – I' },
        { code: 'PH102BS', name: 'Engineering Physics' },
        { code: 'CH103BS', name: 'Engineering Chemistry' },
        { code: 'EE104ES', name: 'Basic Electrical Engineering' },
        { code: 'ME105ES', name: 'Engineering Graphics' },
        { code: 'EN106HS', name: 'English Communication Skills' },
        { code: 'PH107BS', name: 'Physics Lab' },
        { code: 'CS108ES', name: 'IT Workshop' },
    ],
    '2': [
        { code: 'MA201BS', name: 'Engineering Mathematics – II' },
        { code: 'CS202ES', name: 'Data Structures' },
        { code: 'EC203ES', name: 'Basic Electronics Engineering' },
        { code: 'CS204ES', name: 'Programming for Problem Solving (C Language)' },
        { code: 'ME206ES', name: 'Engineering Mechanics' },
        { code: 'MC205ES', name: 'Environmental Science' },
        { code: 'CS207ES', name: 'Data Structures Lab' },
        { code: 'CS208ES', name: 'Programming Lab' },
    ],
    '3': [
        { code: 'MA301BS', name: 'Engineering Mathematics – III' },
        { code: 'CS302ES', name: 'Digital Logic Design' },
        { code: 'CS303ES', name: 'Computer Organization & Architecture' },
        { code: 'CS304PC', name: 'Object Oriented Programming (C++ / Java)' },
        { code: 'MA305BS', name: 'Discrete Mathematics' },
        { code: 'CS306PC', name: 'Data Structures & Algorithms' },
        { code: 'CS307PC', name: 'OOP Lab' },
        { code: 'CS308PC', name: 'DSA Lab' },
    ],
    '4': [
        { code: 'CS603PC', name: 'Design & Analysis of Algorithms' },
        { code: 'CS404PC', name: 'Database Management Systems (DBMS)' },
        { code: 'CS403PC', name: 'Operating System' },
        { code: 'CS502PC', name: 'Software Engineering' },
        { code: 'ME105ES', name: 'Engineering Graphics' },
        { code: 'EN106HS', name: 'English Communication Skills' },
        { code: 'CS407PC', name: 'DBMS Lab' },
        { code: 'CS406PC', name: 'OS Lab' },
    ],
    '5': [
        { code: 'CS503PC', name: 'Computer Networks' },
        { code: 'CS502PC', name: 'Compiler Design' },
        { code: 'CS504PC', name: 'Artificial Intelligence (Intro)' },
        { code: 'CS505PC', name: 'Web Technologies' },
        { code: 'MA502BS', name: 'Probability & Statistics' },
        { code: 'CS511PE', name: 'Professional Elective – I' },
        { code: 'CS507PC', name: 'CN Lab' },
        { code: 'CS508PC', name: 'Web Tech Lab' },
    ],
    '6': [
        { code: 'CS601PC', name: 'Machine Learning' },
        { code: 'CS602PC', name: 'Formal Languages & Automata Theory' },
        { code: 'CS603PC', name: 'Artificial Intelligence' },
        { code: 'CS604PC', name: 'Machine Learning Lab' },
        { code: 'CS605PC', name: 'Artificial Intelligence Lab' },
        { code: 'CS606PC', name: 'Industrial Oriented Mini Project' },
        { code: 'CS612OE', name: 'Database Management Systems (OE)' },
        { code: 'CS635P', name: 'Software Testing Methodologies' },
    ],
    '7': [
        { code: 'CS701PC', name: 'Cloud Computing' },
        { code: 'CS702PC', name: 'Advanced DBMS / Blockchain Technology' },
        { code: 'CS634PE', name: 'Mobile Application Development' },
        { code: 'CS832OE', name: 'Introduction to Computer Networks' },
        { code: 'CS705PC', name: 'Minor Project' },
        { code: 'CS7127', name: 'Seminar / Internship' },
    ],
    '8': [
        { code: 'CS863PE', name: 'Deep Learning' },
        { code: 'CS742PE', name: 'Cyber Security' },
        { code: 'CS831OE', name: 'Algorithm Design & Analysis' },
        { code: 'CS801PC', name: 'Project / Thesis' },
        { code: 'CS306123', name: 'Comprehensive Viva' },
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

const colleges = [
    { prefix: 'K', code: College.KNRR },
    { prefix: 'B', code: College.BRIL },
    { prefix: 'G', code: College.BRIG },
];

const years = [2020, 2021, 2022, 2023, 2024, 2025];
const studentsPerDept = 60;

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Saanvi', 'Aanya', 'Aadhya', 'Aaradhya', 'Anika', 'Anvi', 'Diya', 'Pari', 'Myra', 'Sara'];
const lastNames = ['Kumar', 'Singh', 'Gupta', 'Sharma', 'Patel', 'Reddy', 'Khan', 'Verma', 'Yadav', 'Jain'];


// --- Student Data Generation ---
const generatedStudents: Student[] = [];
const generatedMarks: StudentMark[] = [];
const generatedStudentAttendance: StudentAttendance[] = [];
const generatedPlacementDetails: PlacementDetails[] = [];
const generatedStudentFees: StudentFee[] = [];

let studentCounter = 0;

colleges.forEach(college => {
    DEPARTMENTS.forEach(dept => {
        years.forEach(year => {
            const isCSTrack = ['CSE', 'CSM', 'CSD', 'CSC'].includes(dept);
            for (let i = 1; i <= studentsPerDept; i++) {
                const rollNo = i.toString().padStart(2, '0');
                const admissionNumber = `${college.prefix}${dept}${year}${rollNo}`;
                
                const studentName = `${firstNames[studentCounter % firstNames.length]} ${lastNames[studentCounter % lastNames.length]}`;
                const gender = studentCounter % 2 === 0 ? 'M' : 'F';

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
                
                    // Correct year mapping
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
                    const yearlyTotalFees = [65000, 70000, 72000, 75000][y];
                    
                    // A yearly fee record. Assign it to the first semester of that academic year.
                    const semester = y * 2 + 1; 

                    let paidAmount = 0;
                    const paymentScenario = Math.random();
                    if (paymentScenario > 0.4) { // fully paid
                        paidAmount = yearlyTotalFees;
                    } else if (paymentScenario > 0.1) { // partially paid
                        paidAmount = Math.floor(Math.random() * (yearlyTotalFees - 10000)) + 10000;
                    }

                    generatedStudentFees.push({
                        admissionNumber,
                        academicYear,
                        semester,
                        paymentDate: `${year + y}-08-15`,
                        programCode: dept,
                        totalFees: yearlyTotalFees,
                        paidAmount,
                        dueAmount: yearlyTotalFees - paidAmount,
                        status: paidAmount === yearlyTotalFees ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Due'),
                    });
                }
                
                // --- NEW DYNAMIC ATTENDANCE GENERATION ---
                const LATEST_DATE_ATT = new Date(LATEST_ATTENDANCE_DATE);
                const admissionYear = year;

                // Generate attendance for each relevant academic year
                for (let y = 0; y <= LATEST_DATE_ATT.getFullYear() - admissionYear; y++) {
                    const academicYearStart = admissionYear + y;
                    
                    // Semester 1 (Odd: Jul-Dec)
                    const sem1StartDate = new Date(`${academicYearStart}-07-01`);
                    const sem1EndDate = new Date(`${academicYearStart}-12-31`);
                    
                    if (sem1StartDate > LATEST_DATE_ATT) continue;
                    
                    let currentAttDate = new Date(sem1StartDate);
                    while (currentAttDate <= sem1EndDate && currentAttDate <= LATEST_DATE_ATT) {
                        if (currentAttDate.getDay() !== 0 && currentAttDate.getDay() !== 6) {
                            if (Math.random() > 0.1) {
                                const morning = Math.random() > 0.1 ? 'Present' : 'Absent';
                                const afternoon = morning === 'Present' && Math.random() > 0.2 ? 'Present' : 'Absent';
                                generatedStudentAttendance.push({
                                    admissionNumber,
                                    date: currentAttDate.toISOString().split('T')[0],
                                    morning,
                                    afternoon,
                                });
                            }
                        }
                        currentAttDate.setDate(currentAttDate.getDate() + 1);
                    }

                    // Semester 2 (Even: Jan-Jun of next year)
                    const sem2StartDate = new Date(`${academicYearStart + 1}-01-01`);
                    const sem2EndDate = new Date(`${academicYearStart + 1}-06-30`);

                    if (sem2StartDate > LATEST_DATE_ATT) continue;

                    currentAttDate = new Date(sem2StartDate);
                    while (currentAttDate <= sem2EndDate && currentAttDate <= LATEST_DATE_ATT) {
                        if (currentAttDate.getDay() !== 0 && currentAttDate.getDay() !== 6) {
                            if (Math.random() > 0.1) {
                                const morning = Math.random() > 0.1 ? 'Present' : 'Absent';
                                const afternoon = morning === 'Present' && Math.random() > 0.2 ? 'Present' : 'Absent';
                                generatedStudentAttendance.push({
                                    admissionNumber,
                                    date: currentAttDate.toISOString().split('T')[0],
                                    morning,
                                    afternoon,
                                });
                            }
                        }
                        currentAttDate.setDate(currentAttDate.getDate() + 1);
                    }
                }
                // --- END NEW DYNAMIC ATTENDANCE GENERATION ---

                // Marks generation for non-CSE tracks
                const curriculum = ALL_SUBJECTS[dept];
                for (let sem = 1; sem <= 8; sem++) {
                    const subjectsForSem = curriculum[String(sem)] || [];
                    subjectsForSem.forEach(subject => {
                        let internalMark = Math.floor(Math.random() * (40 - 14 + 1)) + 14;
                        let externalMark = Math.floor(Math.random() * (60 - 21 + 1)) + 21;

                        if (studentCounter > 0 && studentCounter % 5 === 0) externalMark = Math.floor(Math.random() * 21);
                        if (studentCounter > 0 && studentCounter % 7 === 0) internalMark = Math.floor(Math.random() * 14);
                        
                        generatedMarks.push({
                            admissionNumber, semester: sem, subjectCode: subject.code, subjectName: subject.name,
                            internalMark, externalMark, marksObtained: internalMark + externalMark, maxMarks: 100,
                        });
                    });
                }
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

// --- Date Range for Faculty/Staff Attendance (remains static) ---
const endDate = new Date(LATEST_ATTENDANCE_DATE);
const startDate = new Date(endDate);
startDate.setDate(endDate.getDate() - 90);

const dateRange: string[] = [];
let currentFDate = new Date(startDate);
while (currentFDate <= endDate) {
    if (currentFDate.getDay() !== 0 && currentFDate.getDay() !== 6) {
        dateRange.push(currentFDate.toISOString().split('T')[0]);
    }
    currentFDate.setDate(currentFDate.getDate() + 1);
}

// --- Faculty Data Generation ---
const facultyJoinData = {
    [College.KNRR]: { CSE: { date: '15042020', count: 8 }, CSM: { date: '16042020', count: 4 }, CSD: { date: '17042020', count: 4 }, CSC: { date: '18042020', count: 4 }, ECE: { date: '12052021', count: 5 }, EEE: { date: '01012022', count: 8 }, MECH: { date: '20032020', count: 6 }, CIVIL: { date: '10022021', count: 4 }, HS: { date: '25082020', count: 3 } },
    [College.BRIL]: { CSE: { date: '01032020', count: 6 }, CSM: { date: '02032020', count: 3 }, CSD: { date: '03032020', count: 3 }, CSC: { date: '04032020', count: 3 }, ECE: { date: '10072020', count: 2 }, EEE: { date: '15082021', count: 4 }, MECH: { date: '22012022', count: 3 }, CIVIL: { date: '05022020', count: 4 }, HS: { date: '12032021', count: 3 } },
    [College.BRIG]: { CSE: { date: '05012021', count: 5 }, CSM: { date: '06012021', count: 2 }, CSD: { date: '07012021', count: 2 }, CSC: { date: '08012021', count: 2 }, ECE: { date: '15022020', count: 2 }, EEE: { date: '12032022', count: 2 }, MECH: { date: '05012022', count: 2 }, CIVIL: { date: '20042020', count: 2 }, HS: { date: '10062021', count: 2 } },
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

            generatedFaculty.push({ collegeCode: collegeCode as College, programCode: deptCode, facultyId, facultyName, gender });
            
            dateRange.forEach(date => {
                const morning = Math.random() > 0.05 ? 'Present' : 'Absent';
                const afternoon = morning === 'Present' && Math.random() > 0.1 ? 'Present' : 'Absent';
                generatedFacultyAttendance.push({ facultyId, date, morning, afternoon });
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
    [College.BRIL]: [{ date: '10072021', count: 2 }, { date: '11082022', count: 3 }],
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

            generatedStaff.push({ collegeCode: collegeCode as College, programCode: 'ADMIN', staffId, staffName, gender });

            dateRange.forEach(date => {
                const morning = Math.random() > 0.08 ? 'Present' : 'Absent';
                const afternoon = morning === 'Present' && Math.random() > 0.15 ? 'Present' : 'Absent';
                generatedStaffAttendance.push({ staffId, date, morning, afternoon });
            });
            staffCounter++;
        }
    });
});

export const mockStaff: Staff[] = generatedStaff;
export const mockStaffAttendance: StaffAttendance[] = generatedStaffAttendance;