import React from 'react';
import { StudentDetailsType } from '../types';

interface StudentDetailsProps {
  student: StudentDetailsType;
  onClose: () => void;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold text-blue-400 mb-4">{student.studentName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-sm">
            <p><span className="font-semibold text-slate-400">Admission No:</span> {student.admissionNumber}</p>
            <p><span className="font-semibold text-slate-400">Roll No:</span> {student.rollNo}</p>
            <p><span className="font-semibold text-slate-400">College:</span> {student.collegeCode}</p>
            <p><span className="font-semibold text-slate-400">Program:</span> {student.programCode}</p>
            <p><span className="font-semibold text-slate-400">Gender:</span> {student.gender === 'M' ? 'Male' : 'Female'}</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2 border-b border-slate-700 pb-2">Marks</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Semester</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Marks</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Result</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {student.marks.map((mark, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{mark.semester}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{mark.subjectName} ({mark.subjectCode})</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{mark.marksObtained} / {mark.maxMarks}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm font-semibold ${(mark.marksObtained / mark.maxMarks) >= 0.4 ? 'text-green-400' : 'text-red-400'}`}>
                        {(mark.marksObtained / mark.maxMarks) >= 0.4 ? 'Pass' : 'Fail'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2 border-b border-slate-700 pb-2">Attendance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Morning</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Afternoon</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {student.attendance.map((att, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{att.date}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${att.morning === 'Present' ? 'text-green-400' : 'text-red-400'}`}>{att.morning}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${att.afternoon === 'Present' ? 'text-green-400' : 'text-red-400'}`}>{att.afternoon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;