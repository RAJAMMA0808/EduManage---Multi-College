
import React, { useMemo } from 'react'; 
import { StudentDetailsType } from '../types/index';
import JntuhAttendanceRules from './JntuhAttendanceRules';
import PrintLayout from './PrintLayout';

interface StudentAttendanceTranscriptProps {
  student: StudentDetailsType;
  selectedSemester: string;
  selectedAcademicYear: string;
}

const StudentAttendanceTranscript: React.FC<StudentAttendanceTranscriptProps> = ({ student, selectedSemester, selectedAcademicYear }) => {
  const attendanceSorted = useMemo(() => {
    let attendance = student.attendance;
    const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);

    if (!admissionYearMatch) return [...attendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const admissionYear = parseInt(admissionYearMatch[1], 10);

    let startRangeDate: Date | null = null;
    let endRangeDate: Date | null = null;
    
    if (selectedAcademicYear !== 'All Years') {
        const startYear = parseInt(selectedAcademicYear.split('-')[0], 10);
        startRangeDate = new Date(`${startYear}-07-01`);
        endRangeDate = new Date(`${startYear + 1}-06-30`);
    }
    
    if (selectedSemester !== 'All Semesters') {
        const semNum = parseInt(selectedSemester, 10);
        const yearOffset = Math.floor((semNum - 1) / 2);
        const academicYearStart = admissionYear + yearOffset;
        
        let semesterStartDate: Date;
        let semesterEndDate: Date;

        if (semNum % 2 !== 0) { // Odd semester (e.g., 1, 3, 5, 7)
            semesterStartDate = new Date(`${academicYearStart}-07-01`);
            semesterEndDate = new Date(`${academicYearStart}-12-31`);
        } else { // Even semester (e.g., 2, 4, 6, 8)
            semesterStartDate = new Date(`${academicYearStart + 1}-01-01`);
            semesterEndDate = new Date(`${academicYearStart + 1}-06-30`);
        }
        
        startRangeDate = startRangeDate ? new Date(Math.max(startRangeDate.getTime(), semesterStartDate.getTime())) : semesterStartDate;
        endRangeDate = endRangeDate ? new Date(Math.min(endRangeDate.getTime(), semesterEndDate.getTime())) : semesterEndDate;
    }

    if (startRangeDate && endRangeDate) {
        const startDateString = startRangeDate.toISOString().split('T')[0];
        const endDateString = endRangeDate.toISOString().split('T')[0];
        attendance = attendance.filter(att => att.date >= startDateString && att.date <= endDateString);
    }

    return [...attendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [student.attendance, student.admissionNumber, selectedAcademicYear, selectedSemester]);

  const { totalDays, absentDays, halfDays, attendancePercentage, fullDays } = useMemo(() => {
    const attendanceByDate = new Map<string, { morning: string; afternoon: string }>();
    attendanceSorted.forEach(a => {
      if (!attendanceByDate.has(a.date)) {
        attendanceByDate.set(a.date, { morning: a.morning, afternoon: a.afternoon });
      }
    });

    let fullDays = 0, halfDays = 0, absentDays = 0;
    attendanceByDate.forEach(day => {
      if (day.morning === 'Present' && day.afternoon === 'Present') fullDays++;
      else if (day.morning === 'Present' || day.afternoon === 'Present') halfDays++;
      else absentDays++;
    });

    const totalDays = fullDays + halfDays + absentDays;
    const attendancePercentage = totalDays > 0 ? ((fullDays + halfDays * 0.5) / totalDays) * 100 : 0;
    return { totalDays, absentDays, halfDays, attendancePercentage, fullDays };  
  }, [attendanceSorted]);

  const ROWS_PER_FIRST_PAGE = 25;
  const ROWS_PER_SUBSEQUENT_PAGE = 45;

  const attendanceChunks = useMemo(() => {
    const chunks = [];
    if (attendanceSorted.length === 0) return [];
    if (attendanceSorted.length <= ROWS_PER_FIRST_PAGE) {
      chunks.push(attendanceSorted);
    } else {
      chunks.push(attendanceSorted.slice(0, ROWS_PER_FIRST_PAGE));
      const remaining = attendanceSorted.slice(ROWS_PER_FIRST_PAGE);
      for (let i = 0; i < remaining.length; i += ROWS_PER_SUBSEQUENT_PAGE) {
        chunks.push(remaining.slice(i, i + ROWS_PER_SUBSEQUENT_PAGE));
      }
    }
    return chunks;
  }, [attendanceSorted]);

  const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
  const admissionYear = admissionYearMatch ? admissionYearMatch[1] : 'N/A';
  const courseDuration = admissionYear !== 'N/A' ? `${admissionYear} - ${parseInt(admissionYear) + 4}` : '4 Years';

  return (
    <div id="transcript-content" className="hidden print:block">
      <div id="transcript-container" className="w-full bg-white text-black font-sans">
        {attendanceChunks.length > 0 ? attendanceChunks.map((chunk, index) => {
          const isFirstPage = index === 0;
          const isLastPage = index === attendanceChunks.length - 1;

          return (
            <PrintLayout
              key={index}
              // Fixed: Prop name changed from 'student' to 'person' to satisfy PrintLayoutProps
              person={student}
              currentPage={index + 1}
              totalPages={attendanceChunks.length}
              isLastPage={isLastPage}
              reportTitle="Student Attendance Report"
            >
              {isFirstPage && (
                <>
                  <table className="w-full my-2 text-xs border-collapse border border-black">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="font-bold p-1 w-[15%] border-r border-black">Student Name:</td>
                        <td className="p-1 w-[35%] border-r border-black">{student.studentName.toUpperCase()}</td>
                        <td className="font-bold p-1 w-[20%] border-r border-black">Admission No:</td>
                        <td className="p-1 w-[30%]">{student.admissionNumber}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="font-bold p-1 border-r border-black">Program:</td>
                        <td className="p-1 border-r border-black">{`B.Tech - ${student.programCode}`}</td>
                        <td className="font-bold p-1 border-r border-black">Current Semester:</td>
                        <td className="p-1">{selectedSemester === 'All Semesters' ? student.currentSemester : `Semester ${selectedSemester}`}</td>
                      </tr>
                      <tr className="border-b-0">
                        <td className="font-bold p-1 border-r border-black">Course Duration:</td>
                        <td className="p-1 border-r border-black">{courseDuration}</td>
                        <td className="font-bold p-1 border-r border-black">Academic Year:</td>
                        <td className="p-1">{selectedAcademicYear}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="my-2 grid grid-cols-5 gap-2 text-center text-sm">
                    <div className="bg-blue-100 p-1 rounded border border-gray-300">
                      <div className="font-bold text-lg">{totalDays}</div>
                      <div className="text-xs">Total Days</div>
                    </div>
                    <div className="bg-green-100 p-1 rounded border border-gray-300">
                      <div className="font-bold text-lg">{fullDays}</div>
                      <div className="text-xs">Full Days</div>
                    </div>
                    <div className="bg-yellow-100 p-1 rounded border border-gray-300">
                      <div className="font-bold text-lg">{halfDays}</div>
                      <div className="text-xs">Half Days</div>
                    </div>
                    <div className="bg-red-100 p-1 rounded border border-gray-300">
                      <div className="font-bold text-lg">{absentDays}</div>
                      <div className="text-xs">Absent Days</div>
                    </div>
                    <div className="bg-gray-200 p-1 rounded border border-gray-300">
                      <div className="font-bold text-lg">{attendancePercentage.toFixed(2)}%</div>
                      <div className="text-xs">Attendance %</div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold mt-2 mb-1">Detailed Attendance Log</h3>
                </>
              )}

              <table className="w-full text-[9px] border-collapse border border-black">
                <thead className="bg-gray-200 sticky top-0">
                  <tr>
                    <th className="p-1 border border-black font-bold">Date</th>
                    <th className="p-1 border border-black font-bold">Morning</th>
                    <th className="p-1 border border-black font-bold">Afternoon</th>
                    <th className="p-1 border border-black font-bold">Day Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((att) => {
                    const status =
                      att.morning === 'Present' && att.afternoon === 'Present'
                        ? 'Full Day'
                        : att.morning === 'Absent' && att.afternoon === 'Absent'
                          ? 'Absent'
                          : 'Half Day';
                    const rowClass =
                      status === 'Absent'
                        ? 'bg-red-100'
                        : status === 'Half Day'
                          ? 'bg-yellow-100'
                          : 'bg-white';
                    return (
                      <tr key={att.date} className={rowClass}>
                        <td className="p-1 text-center border border-black">{att.date}</td>
                        <td className="p-1 text-center border border-black">{att.morning}</td>
                        <td className="p-1 text-center border border-black">{att.afternoon}</td>
                        <td className="p-1 text-center border border-black font-semibold">{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {isLastPage && (
                <JntuhAttendanceRules forPrint={true} />
              )}
            </PrintLayout>
          );
        }) : (
          // Fixed: Prop name changed from 'student' to 'person' to satisfy PrintLayoutProps
          <PrintLayout person={student} currentPage={1} totalPages={1} isLastPage={true} reportTitle="Student Attendance Report">
             <table className="w-full my-2 text-xs border-collapse border border-black">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="font-bold p-1 w-[15%] border-r border-black">Student Name:</td>
                    <td className="p-1 w-[35%] border-r border-black">{student.studentName.toUpperCase()}</td>
                    <td className="font-bold p-1 w-[20%] border-r border-black">Admission No:</td>
                    <td className="p-1 w-[30%]">{student.admissionNumber}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="font-bold p-1 border-r border-black">Program:</td>
                    <td className="p-1 border-r border-black">{`B.Tech - ${student.programCode}`}</td>
                    <td className="font-bold p-1 border-r border-black">Current Semester:</td>
                    <td className="p-1">{selectedSemester === 'All Semesters' ? student.currentSemester : `Semester ${selectedSemester}`}</td>
                  </tr>
                  <tr className="border-b-0">
                    <td className="font-bold p-1 border-r border-black">Course Duration:</td>
                    <td className="p-1 border-r border-black">{courseDuration}</td>
                    <td className="font-bold p-1 border-r border-black">Academic Year:</td>
                    <td className="p-1">{selectedAcademicYear}</td>
                  </tr>
                </tbody>
              </table>
            <div className="text-center py-10 text-gray-500">No attendance data available for the selected filters.</div>
          </PrintLayout>
        )}
      </div>

      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html, body {
              font-family: 'Times New Roman', Times, serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body * { visibility: hidden; }
            #transcript-content, #transcript-content * { visibility: visible; }
            #transcript-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            #transcript-container {
              padding: 10mm;
              box-sizing: border-box;
            }
            .break-before-page {
              page-break-before: always;
            }
          }
        `}
      </style>
    </div>
  );
};

export default StudentAttendanceTranscript;
