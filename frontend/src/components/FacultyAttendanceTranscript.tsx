import React, { useMemo } from 'react';
import { FacultyDetailsType } from '../types/index';
import PrintLayout from './PrintLayout';

interface FacultyAttendanceTranscriptProps {
  faculty: FacultyDetailsType;
  academicYear: string;
}

const FacultyAttendanceTranscript: React.FC<FacultyAttendanceTranscriptProps> = ({ faculty, academicYear }) => {
  const attendanceSorted = useMemo(() => {
    let attendance = faculty.attendance;
    if (academicYear !== 'All Years') {
        const startYear = parseInt(academicYear.split('-')[0], 10);
        const startRangeDate = new Date(`${startYear}-07-01`);
        const endRangeDate = new Date(`${startYear + 1}-06-30`);
        const startDateString = startRangeDate.toISOString().split('T')[0];
        const endDateString = endRangeDate.toISOString().split('T')[0];
        attendance = attendance.filter(att => att.date >= startDateString && att.date <= endDateString);
    }
    return [...attendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [faculty.attendance, academicYear]);

  const { totalDays, absentDays, halfDays, attendancePercentage, fullDays } = useMemo(() => {
    const attendanceByDate = new Map<string, { morning: string; afternoon: string }>();
    attendanceSorted.forEach(a => {
      if (!attendanceByDate.has(a.date)) {
        attendanceByDate.set(a.date, { morning: a.morning, afternoon: a.afternoon });
      }
    });

    let full = 0, half = 0, absent = 0;
    attendanceByDate.forEach(day => {
      if (day.morning === 'Present' && day.afternoon === 'Present') full++;
      else if (day.morning === 'Present' || day.afternoon === 'Present') half++;
      else absent++;
    });

    const total = full + half + absent;
    const percentage = total > 0 ? ((full + half * 0.5) / total) * 100 : 0;
    return { totalDays: total, absentDays: absent, halfDays: half, attendancePercentage: percentage, fullDays: full };  
  }, [attendanceSorted]);

  const ROWS_PER_PAGE = 40;
  const attendanceChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < attendanceSorted.length; i += ROWS_PER_PAGE) {
        chunks.push(attendanceSorted.slice(i, i + ROWS_PER_PAGE));
    }
    return chunks;
  }, [attendanceSorted]);

  return (
    <div id="transcript-content" className="hidden print:block">
      <div id="transcript-container" className="w-full bg-white text-black font-sans">
        {attendanceChunks.length > 0 ? attendanceChunks.map((chunk, index) => (
            <PrintLayout
              key={index}
              person={faculty}
              currentPage={index + 1}
              totalPages={attendanceChunks.length}
              isLastPage={index === attendanceChunks.length - 1}
              reportTitle="Faculty Attendance Report"
            >
              {index === 0 && (
                <>
                  <table className="w-full my-2 text-xs border-collapse border border-black">
                     <tbody>
                        <tr className="border-b border-black">
                            <td className="font-bold p-1 w-[15%] border-r border-black">Faculty Name:</td>
                            <td className="p-1 w-[35%] border-r border-black">{faculty.facultyName.toUpperCase()}</td>
                            <td className="font-bold p-1 w-[20%] border-r border-black">Faculty ID:</td>
                            <td className="p-1 w-[30%]">{faculty.facultyId}</td>
                        </tr>
                        <tr className="border-b-0">
                            <td className="font-bold p-1 border-r border-black">Department:</td>
                            <td className="p-1 border-r border-black">{faculty.programCode}</td>
                            <td className="font-bold p-1 border-r border-black">Academic Year:</td>
                            <td className="p-1">{academicYear}</td>
                        </tr>
                    </tbody>
                  </table>
                  <div className="my-2 grid grid-cols-5 gap-2 text-center text-sm">
                    <div className="bg-blue-100 p-1 rounded border border-gray-300"><div className="font-bold text-lg">{totalDays}</div><div className="text-xs">Total Days</div></div>
                    <div className="bg-green-100 p-1 rounded border border-gray-300"><div className="font-bold text-lg">{fullDays}</div><div className="text-xs">Full Days</div></div>
                    <div className="bg-yellow-100 p-1 rounded border border-gray-300"><div className="font-bold text-lg">{halfDays}</div><div className="text-xs">Half Days</div></div>
                    <div className="bg-red-100 p-1 rounded border border-gray-300"><div className="font-bold text-lg">{absentDays}</div><div className="text-xs">Absent Days</div></div>
                    <div className="bg-gray-200 p-1 rounded border border-gray-300"><div className="font-bold text-lg">{attendancePercentage.toFixed(2)}%</div><div className="text-xs">Attendance %</div></div>
                  </div>
                  <h3 className="text-sm font-bold mt-2 mb-1">Detailed Attendance Log</h3>
                </>
              )}
               <table className="w-full text-[9px] border-collapse border border-black">
                <thead className="bg-gray-200 sticky top-0"><tr>
                    <th className="p-1 border border-black font-bold">Date</th>
                    <th className="p-1 border border-black font-bold">Morning</th>
                    <th className="p-1 border border-black font-bold">Afternoon</th>
                    <th className="p-1 border border-black font-bold">Day Status</th>
                </tr></thead>
                <tbody>
                  {chunk.map((att) => {
                    const status = att.morning === 'Present' && att.afternoon === 'Present' ? 'Full Day' : att.morning === 'Absent' && att.afternoon === 'Absent' ? 'Absent' : 'Half Day';
                    return (
                      <tr key={att.date} className="bg-white">
                        <td className="p-1 text-center border border-black">{att.date}</td>
                        <td className="p-1 text-center border border-black">{att.morning}</td>
                        <td className="p-1 text-center border border-black">{att.afternoon}</td>
                        <td className="p-1 text-center border border-black font-semibold">{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </PrintLayout>
        )) : (
             <PrintLayout person={faculty} currentPage={1} totalPages={1} isLastPage={true} reportTitle="Faculty Attendance Report">
                <div className="text-center py-10 text-gray-500">No attendance data available.</div>
             </PrintLayout>
        )}
      </div>
       <style>{` @media print { @page { size: A4 portrait; margin: 0; } body * { visibility: hidden; } #transcript-content, #transcript-content * { visibility: visible; } #transcript-content { position: absolute; left: 0; top: 0; width: 100%; } #transcript-container { padding: 10mm; } .break-before-page { page-break-before: always; } }`}</style>
    </div>
  );
};

export default FacultyAttendanceTranscript;