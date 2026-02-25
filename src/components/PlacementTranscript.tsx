
import React from 'react';
import { StudentDetailsType, PlacementDetails } from '../types';
import PrintLayout from './PrintLayout';

interface PlacementTranscriptProps {
  student: StudentDetailsType;
  placement: PlacementDetails;
}

const PlacementTranscript: React.FC<PlacementTranscriptProps> = ({ student, placement }) => {
  const yearStr = placement.year;
  const semester = placement.semester;

  return (
    <div id="transcript-content" className="hidden print:block">
      <div id="transcript-container" className="w-full bg-white text-black font-sans">
        <PrintLayout 
          student={student} 
          currentPage={1} 
          totalPages={1} 
          isLastPage={true} 
          reportTitle="Student Placement Report"
        >
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
          
          <div className="mt-4">
            <table className="w-full text-[9px] border-collapse border border-black">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-1.5 border border-black font-semibold">S.NO</th>
                  <th className="p-1.5 border border-black font-semibold">COLLEGE CODE</th>
                  <th className="p-1.5 border border-black font-semibold">ADMISSION NUMBER</th>
                  <th className="p-1.5 border border-black font-semibold">STUDENT NAME</th>
                  <th className="p-1.5 border border-black font-semibold">COURSE/BRANCH</th>
                  <th className="p-1.5 border border-black font-semibold">YEAR</th>
                  <th className="p-1.5 border border-black font-semibold">SEMESTER</th>
                  <th className="p-1.5 border border-black font-semibold">STUDENT MOBILE</th>
                  <th className="p-1.5 border border-black font-semibold">COMPANY NAME</th>
                  <th className="p-1.5 border border-black font-semibold">HR NAME</th>
                  <th className="p-1.5 border border-black font-semibold">HR MOBILE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white text-black">
                  <td className="p-1.5 text-center border border-black">1</td>
                  <td className="p-1.5 text-center border border-black">{student.collegeCode}</td>
                  <td className="p-1.5 text-center border border-black">{student.admissionNumber}</td>
                  <td className="p-1.5 text-center border border-black">{student.studentName}</td>
                  <td className="p-1.5 text-center border border-black">{student.programCode}</td>
                  <td className="p-1.5 text-center border border-black">{yearStr}</td>
                  <td className="p-1.5 text-center border border-black">{semester}th</td>
                  <td className="p-1.5 text-center border border-black">{placement.studentMobileNumber}</td>
                  <td className="p-1.5 text-center border border-black">{placement.companyName}</td>
                  <td className="p-1.5 text-center border border-black">{placement.hrName}</td>
                  <td className="p-1.5 text-center border border-black">{placement.hrMobileNumber}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </PrintLayout>
      </div>

      <style>
        {`
          @media print {
            @page { 
              size: A4 landscape; 
              margin: 0;
            }
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
          }
        `}
      </style>
    </div>
  );
};

export default PlacementTranscript;