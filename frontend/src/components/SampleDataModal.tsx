
import React, { useMemo } from 'react';

// FIX: Add 'fee' and 'examFee' to DataType
type DataType = 'marks' | 'studentAttendance' | 'facultyAttendance' | 'staffAttendance' | 'placement' | 'fee' | 'examFee';

interface SampleDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: DataType;
}

const sampleData: Record<DataType, { headers: string[], rows: string[][] }> = {
    marks: {
        headers: ['College Code', 'AdmissionNumber', 'Program Code', 'Student Name', 'Gender', 'Year', 'Semester', 'ExamType', 'SubjectCode', 'SubjectName', 'Internal Mark', 'Internal Out of Marks', 'External Mark', 'External Out of Marks', 'Total Marks', 'Out of Marks (Max)'],
        rows: [
            ['KNRR', 'KCSE202001', 'CSE', 'Aarav Kapoor', 'M', '2020-2021', '1', 'Semester', 'MA101BS', 'Engineering Mathematics – I', '25', '40', '40', '60', '65', '100'],
            ['KNRR', 'KCSE202002', 'CSE', 'Bharat Rani', 'F', '2020-2021', '1', 'Semester', 'MA101BS', 'Engineering Mathematics – I', '25', '40', '40', '60', '65', '100'],
        ]
    },
    studentAttendance: {
        headers: ['AdmissionNumber', 'Date', 'Morning', 'Afternoon', 'Status'],
        rows: [
            ['KCSE202401', '2025-09-15', 'Present', 'Present', 'Present'],
            ['KCSE202402', '2025-09-15', 'Present', 'Absent', 'Half Day'],
        ]
    },
    facultyAttendance: {
        headers: ['FacultyID', 'Date', 'Morning', 'Afternoon', 'Status'],
        rows: [
            ['KCSE15042020-001', '2025-09-15', 'Present', 'Present', 'Present'],
            ['BECE10072020-001', '2025-09-15', 'Absent', 'Absent', 'Absent'],
        ]
    },
    staffAttendance: {
        headers: ['StaffID', 'Date', 'Morning', 'Afternoon', 'Status'],
        rows: [
            ['KSTF15042020-001', '2025-09-15', 'Present', 'Absent', 'Half Day'],
            ['BSTF10072021-001', '2025-09-15', 'Present', 'Present', 'Present'],
        ]
    },
    placement: {
        headers: ['S.No', 'College Code', 'Admission Number', 'Student Name', 'Course/Branch', 'Year', 'Semester', 'Student Mobile Number', 'Company/Organization Name', 'HR Name', 'HR Mobile Number'],
        rows: [
            ['1', 'KNRR', 'KCSE202201', 'Ramesh K', 'CSE', '4th Year', '8th', '9876543210', 'Infosys Ltd', 'Priya Sharma', '9876501234'],
            ['2', 'BRIL', 'BCSE202305', 'Sunita M', 'CSE', '3rd Year', '6th', '9876543211', 'TCS', 'Amit Jain', '9876501235'],
        ]
    },
    fee: {
        headers: ['AdmissionNumber', 'AcademicYear', 'TotalFees', 'PaidAmount'],
        rows: [
            ['KCSE202301', '2023-2024', '75000', '75000'],
            ['BECE202302', '2023-2024', '75000', '40000'],
        ]
    },
    examFee: {
        headers: ['AdmissionNumber', 'Semester', 'Academic Year', 'Late Fee', 'Total Exam Fee'],
        rows: [
            ['KCSE202301', '1', '2023-2024', '0', '760'],
            ['KCSE202302', '1', '2023-2024', '100', '860'],
        ]
    }
};

const SampleDataModal: React.FC<SampleDataModalProps> = ({ isOpen, onClose, dataType }) => {
  if (!isOpen) return null;

  const { headers, rows } = sampleData[dataType];
  const title = `Sample Data: ${dataType.charAt(0).toUpperCase() + dataType.slice(1).replace(/([A-Z])/g, ' $1')}`;

  const modalWidthClass = useMemo(() => {
    switch (dataType) {
        case 'marks':
        case 'placement':
            return 'max-w-7xl'; // Bigger for marks and placement data
        default:
            return 'max-w-5xl'; // A little smaller for attendance data
    }
  }, [dataType]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-data-title"
    >
      <div 
        className={`bg-slate-800 text-white rounded-lg shadow-xl w-full ${modalWidthClass} max-h-full overflow-y-auto p-6 relative border border-slate-700`}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
        <h2 id="sample-data-title" className="text-xl font-bold text-blue-400 mb-4">{title}</h2>
        <p className="text-sm text-slate-400 mb-4">This is an example of the required format for your Excel file.</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleDataModal;
