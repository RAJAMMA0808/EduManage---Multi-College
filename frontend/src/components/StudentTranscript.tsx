
import React, { useMemo } from 'react';
import { StudentDetailsType, StudentMark } from '../types/index';
import { JNTUH_RULES } from '../constants/index';
import PrintLayout from './PrintLayout';

interface StudentTranscriptProps {
  student: StudentDetailsType;
  selectedSemester: string;
  selectedAcademicYear: string;
}

const SemesterTable: React.FC<{ semester: number; student: StudentDetailsType }> = ({ semester, student }) => {
  const roman: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };
  
  const marksForSemester = student.marks
    .filter(m => m.semester === semester)
    .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));

  if (marksForSemester.length === 0) {
    return null;
  }

  return (
    <div className="break-inside-avoid mb-1">
      <h3 className="font-bold text-gray-800 text-sm mb-1 px-1">{roman[semester]} SEMESTER</h3>
      <table className="w-full text-[9px] border-collapse border border-black">
        <thead className="bg-gray-100 text-gray-800 font-bold">
          <tr>
            <th className="p-1 text-left border border-black w-[15%]">Sub Code</th>
            <th className="p-1 text-left border border-black w-[45%]">Subject Name</th>
            <th className="p-1 text-center border border-black text-[9px] leading-tight align-middle">Internal (40)</th>
            <th className="p-1 text-center border border-black text-[9px] leading-tight align-middle">External (60)</th>
            <th className="p-1 text-center border border-black text-[9px] leading-tight align-middle">Total (100)</th>
            <th className="p-1 text-center border border-black text-[9px] leading-tight align-middle">Result</th>
          </tr>
        </thead>
        <tbody>
          {marksForSemester.map(mark => {
            const internal = mark.internalMark ?? '';
            const external = mark.externalMark ?? '';
            const total = mark.marksObtained ?? '';

            let result = '';
            if (mark) {
              const isPass =
                (mark.internalMark ?? 0) >= JNTUH_RULES.INTERNAL_MIN &&
                (mark.externalMark ?? 0) >= JNTUH_RULES.EXTERNAL_MIN &&
                (mark.marksObtained ?? 0) >= JNTUH_RULES.TOTAL_MIN;
              result = isPass ? 'P' : 'F';
            }

            return (
              <tr key={mark.subjectCode} className="border-b border-black bg-white">
                <td className="py-0.5 px-1.5 font-mono border-x border-black">{mark.subjectCode}</td>
                <td className="py-0.5 px-1.5 border-x border-black">{mark.subjectName}</td>
                <td className="py-0.5 px-1.5 text-center border-x border-black">{internal}</td>
                <td className="py-0.5 px-1.5 text-center border-x border-black">{external}</td>
                <td className="py-0.5 px-1.5 text-center font-bold border-x border-black">{total}</td>
                <td className={`py-0.5 px-1.5 text-center font-bold border-x border-black ${result === 'F' ? 'text-red-600' : 'text-black'}`}>{result}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const StudentTranscript: React.FC<StudentTranscriptProps> = ({ student, selectedSemester, selectedAcademicYear }) => {
  const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
  const admissionYear = admissionYearMatch ? admissionYearMatch[1] : 'N/A';

  const filteredMarks = useMemo(() => {
    let marks = student.marks;
    if (selectedSemester !== 'All Semesters') {
      return marks.filter(m => m.semester.toString() === selectedSemester);
    }
    if (selectedAcademicYear !== 'All Years') {
      const admissionYearNum = parseInt(admissionYear, 10);
      if (!isNaN(admissionYearNum)) {
        const startYear = parseInt(selectedAcademicYear.split('-')[0], 10);
        const yearOffset = startYear - admissionYearNum;
        const startSem = yearOffset * 2 + 1;
        const endSem = yearOffset * 2 + 2;
        return marks.filter(m => m.semester === startSem || m.semester === endSem);
      }
    }
    return marks;
  }, [student.marks, selectedSemester, selectedAcademicYear, admissionYear]);

  const aggregateMarksString = useMemo(() => {
    // Use all marks in the filter for aggregation, including those with 0.
    const marksForAggregation = filteredMarks;
    const totalMarksSecured = marksForAggregation.reduce((sum, mark) => sum + mark.marksObtained, 0);
    const totalMaxPossibleMarks = marksForAggregation.reduce((sum, mark) => sum + (mark.maxMarks || 100), 0);
    const percentage = totalMaxPossibleMarks > 0 ? ((totalMarksSecured / totalMaxPossibleMarks) * 100).toFixed(2) : '0.00';
    return `Aggregate Marks Secured: ${totalMarksSecured} OUT OF ${totalMaxPossibleMarks} (${percentage}%)`;
  }, [filteredMarks]);

  const availableSemesters = useMemo(() => {
    return [...new Set(filteredMarks.map(m => m.semester))].sort((a: number, b: number) => a - b);
  }, [filteredMarks]);
  
  const page1Sems = availableSemesters.filter((s: number) => s <= 4);
  const page2Sems = availableSemesters.filter((s: number) => s > 4);

  const pages = [];
  if (page1Sems.length > 0) pages.push(page1Sems);
  if (page2Sems.length > 0) pages.push(page2Sems);

  const totalPages = pages.length || 1;

  return (
    <div id="transcript-content" className="hidden print:block">
      <div id="transcript-container" className="w-full bg-white text-black font-sans scale-[0.97] origin-top">
        {pages.length > 0 ? pages.map((chunk, index) => {
          const isLastPage = index === pages.length - 1;
          return (
            <PrintLayout
              key={index}
              // Fixed: Prop name changed from 'student' to 'person' to satisfy PrintLayoutProps
              person={student}
              currentPage={index + 1}
              totalPages={totalPages}
              isLastPage={isLastPage}
              reportTitle="Consolidated Marks Memo"
            >
              {index === 0 && (
                <table className="w-full my-1 text-[10px] border-collapse border border-black">
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
                      <td className="font-bold p-1 border-r border-black">Course Duration:</td>
                      <td className="p-1">{`${admissionYear} - ${parseInt(admissionYear) + 4}`}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              <main className="mt-1">
                {chunk.map(sem => <SemesterTable key={sem} semester={sem} student={student} />)}
              </main>

              {isLastPage && (
                <div className="pt-3 text-xs mt-auto flex flex-col">
                  <div className="text-left font-semibold text-[9px] leading-tight mb-1">
                    A+ - Outstanding (90–100)<br />
                    A - Excellent (80–89)<br />
                    B - Good (70–79)<br />
                    C - Satisfactory (60–69)<br />
                    D - Pass (50–59)<br />
                    F - Fail (&lt;50)
                  </div>
                  <div className="font-bold text-left text-[10px] my-2">
                    {aggregateMarksString}
                  </div>
                </div>
              )}
            </PrintLayout>
          );
        }) : (
          // Fixed: Prop name changed from 'student' to 'person' to satisfy PrintLayoutProps
          <PrintLayout person={student} currentPage={1} totalPages={1} isLastPage={true} reportTitle="Consolidated Marks Memo">
            <table className="w-full my-1 text-[10px] border-collapse border border-black">
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
                  <td className="font-bold p-1 border-r border-black">Course Duration:</td>
                  <td className="p-1">{`${admissionYear} - ${parseInt(admissionYear) + 4}`}</td>
                </tr>
              </tbody>
            </table>
            <main className="mt-4 text-center text-gray-500">
              <p>No marks data available for the selected filters.</p>
            </main>
            <div className="pt-3 text-xs mt-auto flex flex-col">
                <div className="text-left font-semibold text-[9px] leading-tight mb-1">
                  A+ - Outstanding (90–100)<br />
                  A - Excellent (80–89)<br />
                  B - Good (70–79)<br />
                  C - Satisfactory (60–69)<br />
                  D - Pass (50–59)<br />
                  F - Fail (&lt;50)
                </div>
                <div className="font-bold text-left text-[10px] my-2">
                   {aggregateMarksString}
                </div>
              </div>
          </PrintLayout>
        )}
      </div>

      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html, body { font-family: 'Times New Roman', Times, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body * { visibility: hidden; }
            #transcript-content, #transcript-content * { visibility: visible; }
            #transcript-content { position: absolute; left: 0; top: 0; width: 100%; }
            #transcript-container { padding: 8mm 10mm; box-sizing: border-box; }
            .break-before-page { page-break-before: always; }
          }
        `}
      </style>
    </div>
  );
};

export default StudentTranscript;
