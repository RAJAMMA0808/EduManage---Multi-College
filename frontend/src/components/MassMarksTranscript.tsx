

import React, { useMemo } from 'react';
import { Student, StudentMark, College } from '../types/index';
import { COLLEGE_NAMES, JNTUH_RULES } from '../constants/index';
// FIX: Added missing import for icon components.
import { KNRRLogoIcon, BRILLogoIcon, BRIGLogoIcon } from './icons';

interface MassMarksTranscriptProps {
  students: Student[];
  marks: StudentMark[];
}

const CollegeLogo: React.FC<{ college: College, className?: string }> = ({ college, className }) => {
    switch(college) {
        case College.KNRR: return <KNRRLogoIcon className={className || "h-12 w-auto"} background="transparent" />;
        case College.BRIL: return <BRILLogoIcon className={className || "h-12 w-auto"} background="transparent" />;
        case College.BRIG: return <BRIGLogoIcon className={className || "h-12 w-auto"} background="transparent" />;
        default: return null;
    }
};

const MassMarksTranscript: React.FC<MassMarksTranscriptProps> = ({ students, marks }) => {
  const marksByStudent = useMemo(() => {
    const map = new Map<string, StudentMark[]>();
    marks.forEach(mark => {
      if (!map.has(mark.admissionNumber)) {
        map.set(mark.admissionNumber, []);
      }
      map.get(mark.admissionNumber)!.push(mark);
    });
    return map;
  }, [marks]);

  return (
    <div id="print-content" className="hidden print:block">
      <div className="report-container">
        <header className="report-header">
          <div className="flex justify-between items-center">
            <div className="w-20">
                {students.length > 0 && <CollegeLogo college={students[0].collegeCode} />}
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold">Student Marks List</h1>
              <p className="text-sm">{COLLEGE_NAMES[students[0]?.collegeCode] || 'All Colleges'}</p>
            </div>
            <div className="w-20 text-right">
              <p className="text-xs">Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </header>

        <footer className="report-footer">
          <span className="page-number"></span>
        </footer>

        <table className="report-table">
          <thead>
            <tr>
              <th className="w-[8%]">Sem</th>
              <th className="w-[12%]">Sub Code</th>
              <th className="w-[40%] text-left">Subject Name</th>
              <th className="w-[10%]">Internal</th>
              <th className="w-[10%]">External</th>
              <th className="w-[10%]">Total</th>
              <th className="w-[10%]">Result</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const studentMarks = marksByStudent.get(student.admissionNumber) || [];
              // FIX: Replaced reduce with a more explicit forEach loop to ensure marksBySemester is correctly typed, resolving the 'map does not exist on unknown' error.
              const marksBySemester: Record<number, StudentMark[]> = {};
              studentMarks.forEach(mark => {
                if (!marksBySemester[mark.semester]) {
                  marksBySemester[mark.semester] = [];
                }
                marksBySemester[mark.semester].push(mark);
              });
              const semesterEntries = Object.entries(marksBySemester);

              return (
                <React.Fragment key={student.admissionNumber}>
                  <tr className="student-header-row">
                    <td colSpan={7}>
                      <div className="student-header-content">
                        <span className="font-bold">{student.studentName.toUpperCase()}</span>
                        <span>{student.admissionNumber}</span>
                        <span>{student.programCode}</span>
                      </div>
                    </td>
                  </tr>
                  {semesterEntries.length > 0 ? (
                    semesterEntries.map(([semester, semMarks]) => (
                      semMarks.map((mark, markIndex) => {
                        const isPass = (mark.internalMark ?? 0) >= JNTUH_RULES.INTERNAL_MIN && (mark.externalMark ?? 0) >= JNTUH_RULES.EXTERNAL_MIN && mark.marksObtained >= JNTUH_RULES.TOTAL_MIN;
                        return (
                          <tr key={`${mark.subjectCode}-${mark.semester}`}>
                            <td className="text-center">{markIndex === 0 ? semester : ''}</td>
                            <td>{mark.subjectCode}</td>
                            <td className="text-left">{mark.subjectName}</td>
                            <td className="text-center">{mark.internalMark}</td>
                            <td className="text-center">{mark.externalMark}</td>
                            <td className="text-center font-bold">{mark.marksObtained}</td>
                            <td className={`text-center font-bold ${isPass ? '' : 'text-red-600'}`}>{isPass ? 'P' : 'F'}</td>
                          </tr>
                        );
                      })
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center no-marks">No marks data found for this student.</td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          html, body {
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 9pt;
          }
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content { position: absolute; left: 0; top: 0; width: 100%; }
          
          .report-header, .report-footer {
            position: fixed;
            width: 100%;
            padding: 0 15mm;
            box-sizing: border-box;
            left: 0;
          }
          .report-header { top: 0; }
          .report-footer { bottom: 0; text-align: right; }
          
          .report-footer .page-number::before {
            content: "Page " counter(page);
          }

          .report-table {
            width: 100%;
            border-collapse: collapse;
            counter-reset: page;
          }
          .report-table thead {
            display: table-header-group;
          }
          .report-table tbody {
            display: table-row-group;
          }
          .report-table th, .report-table td {
            border: 1px solid #ccc;
            padding: 4px 6px;
            font-size: 8pt;
          }
          .report-table th {
            background-color: #f2f2f2 !important;
            font-weight: bold;
          }
          .student-header-row {
            break-before: auto;
            break-inside: avoid;
          }
          .student-header-row td {
            background-color: #e0e0e0 !important;
            font-weight: bold;
            padding: 6px;
          }
          .student-header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .no-marks td {
            padding: 10px;
            color: #888;
          }
        }
      `}</style>
    </div>
  );
};

export default MassMarksTranscript;