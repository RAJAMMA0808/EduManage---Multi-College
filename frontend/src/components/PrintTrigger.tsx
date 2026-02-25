
import React, { useEffect } from 'react';
import { StudentDetailsType, FacultyDetailsType, StaffDetailsType, TranscriptView } from '../types';
import StudentTranscript from './StudentTranscript';
import StudentAttendanceTranscript from './StudentAttendanceTranscript';
import StudentFeeTranscript from './StudentFeeTranscript';
import PlacementTranscript from './PlacementTranscript';
import FacultyAttendanceTranscript from './FacultyAttendanceTranscript';
import StaffAttendanceTranscript from './StaffAttendanceTranscript';

interface PrintRequest {
    person: StudentDetailsType | FacultyDetailsType | StaffDetailsType;
    view: TranscriptView;
    semester: string;
    academicYear: string;
}

interface PrintTriggerProps {
    request: PrintRequest;
    onDone: () => void;
}

const PrintTrigger: React.FC<PrintTriggerProps> = ({ request, onDone }) => {
    useEffect(() => {
        const personId = 'admissionNumber' in request.person ? request.person.admissionNumber : 'facultyId' in request.person ? request.person.facultyId : request.person.staffId;
        const originalTitle = document.title;
        document.title = `${personId}_${request.view}_report.pdf`;
        
        const handleAfterPrint = () => {
            document.title = originalTitle;
            onDone();
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        
        window.addEventListener('afterprint', handleAfterPrint);

        const printTimeout = setTimeout(() => {
            window.print();
        }, 100);

        const cleanupTimeout = setTimeout(() => {
            handleAfterPrint();
        }, 2000);

        return () => {
            document.title = originalTitle;
            window.removeEventListener('afterprint', handleAfterPrint);
            clearTimeout(printTimeout);
            clearTimeout(cleanupTimeout);
        };
    }, [request, onDone]);

    const renderTranscript = () => {
        // Check for Student
        if ('rollNo' in request.person) {
            const studentDetails = request.person as StudentDetailsType;
            switch (request.view) {
                case 'marks':
                    return <StudentTranscript student={studentDetails} selectedSemester={request.semester} selectedAcademicYear={request.academicYear} />;
                case 'attendance':
                    return <StudentAttendanceTranscript student={studentDetails} selectedSemester={request.semester} selectedAcademicYear={request.academicYear} />;
                case 'fees':
                    return <StudentFeeTranscript student={studentDetails} selectedSemester={request.semester} selectedAcademicYear={request.academicYear} feeType="Tuition" />;
                case 'examFees':
                    return <StudentFeeTranscript student={studentDetails} selectedSemester={request.semester} selectedAcademicYear={request.academicYear} feeType="Exam" />;
                case 'placement':
                    if (studentDetails.placementDetails) {
                        return <PlacementTranscript student={studentDetails} placement={studentDetails.placementDetails} />;
                    }
                    return null;
                default:
                    return null;
            }
        } 
        // Check for Faculty
        else if ('facultyId' in request.person) {
            if (request.view === 'attendance') {
                return <FacultyAttendanceTranscript faculty={request.person as FacultyDetailsType} academicYear={request.academicYear} />;
            }
        } 
        // Check for Staff
        else if ('staffId' in request.person) {
            if (request.view === 'attendance') {
                return <StaffAttendanceTranscript staff={request.person as StaffDetailsType} academicYear={request.academicYear} />;
            }
        }
        return null;
    };

    return renderTranscript();
};

export default PrintTrigger;
