
import React, { useMemo } from 'react';
import { StudentDetailsType, StudentFee } from '../types/index';
import PrintLayout from './PrintLayout';
import { FEE_STRUCTURE } from '../constants/index';

interface StudentFeeTranscriptProps {
  student: StudentDetailsType;
  selectedAcademicYear: string;
  selectedSemester: string;
  feeType?: 'Tuition' | 'Exam';
}

const StudentFeeTranscript: React.FC<StudentFeeTranscriptProps> = ({ student, selectedAcademicYear, selectedSemester, feeType = 'Tuition' }) => {
  const feesSorted = useMemo(() => {
    // Filter fees by type
    let fees: StudentFee[] = student.fees.filter(f => (f.feeType || 'Tuition') === feeType);

    // Logic to gap-fill missing academic years (ONLY for Tuition)
    if (feeType === 'Tuition') {
        const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
        if (admissionYearMatch) {
            const admissionYear = parseInt(admissionYearMatch[1], 10);
            
            // Generate standard 4 years
            for (let i = 0; i < 4; i++) {
                 const startYear = admissionYear + i;
                 const acYear = `${startYear}-${startYear + 1}`;
                 
                 // Check if this year exists in transactions (of current type)
                 const exists = fees.some(f => f.academicYear === acYear);
                 if (!exists) {
                     const total = FEE_STRUCTURE[student.programCode] || 0;
                     fees.push({
                        admissionNumber: student.admissionNumber,
                        academicYear: acYear,
                        semester: (i * 2) + 1,
                        paymentDate: '', // Empty indicates no payment made
                        programCode: student.programCode,
                        totalFees: total,
                        paidAmount: 0,
                        dueAmount: total,
                        status: 'Due',
                        feeType: 'Tuition'
                     });
                 }
            }
        }
    }
    
    // For Exam fees, we treat them as individual records without annual aggregation logic
    if (feeType === 'Exam') {
        // Apply Filters
        if (selectedSemester !== 'All Semesters') {
            const semNum = parseInt(selectedSemester, 10);
            if (!isNaN(semNum)) fees = fees.filter(f => f.semester === semNum);
        }
        if (selectedAcademicYear !== 'All Years') {
            fees = fees.filter(f => f.academicYear === selectedAcademicYear);
        }
        
        // Sort: Latest first usually, but for transcript maybe Chronological
        return fees.sort((a, b) => {
             const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
             const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
             return dateB - dateA; // Latest first
        });
    }

    // Tuition Fee Grouping Logic (Annual Balance)
    // Group by Academic Year to ensure total fees and running balance are consistent per year
    const yearlyGroups = new Map<string, StudentFee[]>();
    fees.forEach(f => {
        const year = f.academicYear.trim();
        if(!yearlyGroups.has(year)) yearlyGroups.set(year, []);
        yearlyGroups.get(year)!.push(f);
    });

    let processedFees: StudentFee[] = [];

    yearlyGroups.forEach((groupFees) => {
        const maxTotalFee = Math.max(...groupFees.map(f => f.totalFees), 0);
        
        // Sort chronologically (Oldest First) for calculation
        groupFees.sort((a, b) => {
             const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
             const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
             return dateA - dateB;
        });

        let runningPaid = 0;
        const feesWithBalance = groupFees.map(f => {
             runningPaid += f.paidAmount;
             const balanceDue = Math.max(0, maxTotalFee - runningPaid);
             
             let status: 'Paid' | 'Partial' | 'Due' = f.status;
             if (balanceDue === 0) status = 'Paid';
             else if (runningPaid > 0) status = 'Partial';
             else status = 'Due';

             return {
                 ...f,
                 totalFees: maxTotalFee,
                 dueAmount: balanceDue,
                 status: status
             };
        });
        
        processedFees.push(...feesWithBalance);
    });

    // Apply filters for Tuition
    if (selectedSemester !== 'All Semesters') {
      const semNum = parseInt(selectedSemester, 10);
      if (!isNaN(semNum)) processedFees = processedFees.filter(f => f.semester === semNum);
    } else if (selectedAcademicYear !== 'All Years') {
        processedFees = processedFees.filter(f => f.academicYear === selectedAcademicYear);
    }

    // Sort by Academic Year ASC
    processedFees.sort((a, b) => {
        if (a.academicYear !== b.academicYear) return a.academicYear.localeCompare(a.academicYear);
        const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        return dateA - dateB;
    });

    return processedFees;
  }, [student.fees, selectedAcademicYear, selectedSemester, student.admissionNumber, student.programCode, feeType]);

  const totalFeeSum = feesSorted.reduce((sum, fee) => sum + fee.totalFees, 0);
  const totalPaidSum = feesSorted.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const totalDueSum = feesSorted.reduce((sum, fee) => sum + fee.dueAmount, 0);
  
  // For Tuition: Unique totals
  // For Exam: Simple sum
  let displayTotalFee = totalFeeSum;
  let displayTotalDue = totalDueSum;

  if (feeType === 'Tuition') {
      const feesByYear = new Map<string, StudentFee>();
      feesSorted.forEach(fee => {
          feesByYear.set(fee.academicYear, fee); // Last record has latest state
      });
      displayTotalDue = Array.from(feesByYear.values()).reduce((sum, fee) => sum + fee.dueAmount, 0);
      displayTotalFee = Array.from(feesByYear.values()).reduce((sum, fee) => sum + fee.totalFees, 0);
  }

  const formatPaymentDate = (dateString: string) => {
      if (!dateString) return '-';
      try {
          const date = new Date(dateString);
          return new Intl.DateTimeFormat('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
          }).format(date);
      } catch (e) {
          return dateString;
      }
  };
  
  const reportTitle = feeType === 'Tuition' ? "Student Tuition Fee Report" : "Student Exam Fee Report";

  return (
    <div id="transcript-content" className="hidden print:block">
      <div id="transcript-container" className="w-full bg-white text-black font-sans">
        {/* Fixed: Prop name changed from 'student' to 'person' to satisfy PrintLayoutProps */}
        <PrintLayout person={student} currentPage={1} totalPages={1} isLastPage={true} reportTitle={reportTitle}>
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
                  {feeType === 'Exam' && <th className="p-1 border border-black font-bold">Sem</th>}
                  <th className="p-1 border border-black font-bold">Total Fees (₹)</th>
                  <th className="p-1 border border-black font-bold">Paid Amount (₹)</th>
                  <th className="p-1 border border-black font-bold">Balance Due (₹)</th>
                  <th className="p-1 border border-black font-bold">Status</th>
                  <th className="p-1 border border-black font-bold">Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {feesSorted.map((fee, index) => (
                  <tr key={index} className="bg-white">
                    <td className="p-1.5 text-center border border-black">{fee.academicYear}</td>
                    {feeType === 'Exam' && <td className="p-1.5 text-center border border-black">{fee.semester}</td>}
                    <td className="p-1.5 text-right border border-black">{fee.totalFees.toLocaleString('en-IN')}</td>
                    <td className="p-1.5 text-right border border-black">{fee.paidAmount.toLocaleString('en-IN')}</td>
                    <td className={`p-1.5 text-right border border-black font-semibold ${fee.dueAmount > 0 ? 'text-red-600' : ''}`}>{fee.dueAmount.toLocaleString('en-IN')}</td>
                    <td className="p-1.5 text-center border border-black font-semibold">{fee.status}</td>
                    <td className="p-1.5 text-center border border-black">{formatPaymentDate(fee.paymentDate)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan={feeType === 'Exam' ? 2 : 1} className="p-1.5 text-right border border-black">Total</td>
                  <td className="p-1.5 text-right border border-black">{displayTotalFee.toLocaleString('en-IN')}</td>
                  <td className="p-1.5 text-right border border-black">{totalPaidSum.toLocaleString('en-IN')}</td>
                  <td className={`p-1.5 text-right border border-black ${displayTotalDue > 0 ? 'text-red-600' : ''}`}>{displayTotalDue.toLocaleString('en-IN')}</td>
                  <td className="p-1.5 border border-black"></td>
                  <td className="p-1.5 border border-black"></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="text-center py-10 text-gray-500">No {feeType.toLowerCase()} fee data available for the selected filters.</div>
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
