
import React, { useMemo } from 'react';
import { StudentDetailsType } from '../types/index';
import PrintLayout from './PrintLayout';

// FIX: Add selectedSemester to props to match what is passed from StudentDetails.
interface StudentFeeTranscriptProps {
  student: StudentDetailsType;
  selectedAcademicYear: string;
  selectedSemester: string;
}

const StudentFeeTranscript: React.FC<StudentFeeTranscriptProps> = ({ student, selectedAcademicYear, selectedSemester }) => {
  // FIX: Update filtering logic to account for both academic year and semester.
  const feesSorted = useMemo(() => {
    let fees = student.fees;
    
    if (selectedSemester !== 'All Semesters') {
      const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
      if (admissionYearMatch) {
          const admissionYear = parseInt(admissionYearMatch[1], 10);
          const semNum = parseInt(selectedSemester, 10);
          const yearOffset = Math.floor((semNum - 1) / 2);
          const targetAcademicYearStart = admissionYear + yearOffset;
          const targetAcademicYear = `${targetAcademicYearStart}-${targetAcademicYearStart + 1}`;
          
          fees = fees.filter(f => f.academicYear === targetAcademicYear);
      }
    } else if (selectedAcademicYear !== 'All Years') {
        fees = fees.filter(f => f.academicYear === selectedAcademicYear);
    }

    return [...fees].sort((a, b) => a.academicYear.localeCompare(b.academicYear));
  }, [student.fees, selectedAcademicYear, selectedSemester, student.admissionNumber]);

  const totalFeeSum = feesSorted.reduce((sum, fee) => sum + fee.totalFees, 0);
  const totalPaidSum = feesSorted.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const totalDueSum = feesSorted.reduce((sum, fee) => sum + fee.dueAmount, 0);
  
  return (
    <div id="transcript-content" className="hidden print:block">
      <div id="transcript-container" className="w-full bg-white text-black font-sans">
        <PrintLayout student={student} currentPage={1} totalPages={1} isLastPage={true} reportTitle="Student Fee Report">
          <table className="w-full my-2 text-xs border-collapse border border-black">
            <tbody>
              <tr className="border-b border-black">
                <td className="font-bold p-1 w-[15%] border-r border-black">Student Name:</td>
                <td className="p-1 w-[35%] border-r border-black">{student.studentName.toUpperCase()}</td>
                <td className="font-bold p-1 w-[20%] border-r border-black">Admission No:</td>
                <td className="p-1 w-[30%]">{student.admissionNumber}</td>
              </tr>
              <tr className="border-b-0">
                <td className="font-bold p-1 border-r border-black">Program:</td>
                <td className="p-1 border-r border-black">{`B.Tech - ${student.programCode}`}</td>
                <td className="font-bold p-1 border-r border-black">Current Semester:</td>
                <td className="p-1">{student.currentSemester}</td>
              </tr>
            </tbody>
          </table>
          
          <h3 className="text-sm font-bold mt-4 mb-1">Detailed Fee Log</h3>
          {feesSorted.length > 0 ? (
            <table className="w-full text-[10px] border-collapse border border-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-1 border border-black font-bold">Academic Year</th>
                  <th className="p-1 border border-black font-bold">Total Fees (₹)</th>
                  <th className="p-1 border border-black font-bold">Paid Amount (₹)</th>
                  <th className="p-1 border border-black font-bold">Due Amount (₹)</th>
                  <th className="p-1 border border-black font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {feesSorted.map((fee, index) => (
                  <tr key={index} className="bg-white">
                    <td className="p-1.5 text-center border border-black">{fee.academicYear}</td>
                    <td className="p-1.5 text-right border border-black">{fee.totalFees.toLocaleString('en-IN')}</td>
                    <td className="p-1.5 text-right border border-black">{fee.paidAmount.toLocaleString('en-IN')}</td>
                    <td className={`p-1.5 text-right border border-black font-semibold ${fee.dueAmount > 0 ? 'text-red-600' : ''}`}>{fee.dueAmount.toLocaleString('en-IN')}</td>
                    <td className="p-1.5 text-center border border-black font-semibold">{fee.status}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="p-1.5 text-right border border-black">Total</td>
                  <td className="p-1.5 text-right border border-black">{totalFeeSum.toLocaleString('en-IN')}</td>
                  <td className="p-1.5 text-right border border-black">{totalPaidSum.toLocaleString('en-IN')}</td>
                  <td className={`p-1.5 text-right border border-black ${totalDueSum > 0 ? 'text-red-600' : ''}`}>{totalDueSum.toLocaleString('en-IN')}</td>
                  <td className="p-1.5 border border-black"></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="text-center py-10 text-gray-500">No fee data available for the selected filters.</div>
          )}
        </PrintLayout>
      </div>

      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html, body { font-family: 'Times New Roman', Times, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body * { visibility: hidden; }
            #transcript-content, #transcript-content * { visibility: visible; }
            #transcript-content { position: absolute; left: 0; top: 0; width: 100%; }
            #transcript-container { padding: 10mm; box-sizing: border-box; }
          }
        `}
      </style>
    </div>
  );
};

export default StudentFeeTranscript;
