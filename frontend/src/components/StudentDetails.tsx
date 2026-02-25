import React, { useState, useEffect, useMemo } from 'react';
import { StudentDetailsType, TranscriptView, StudentAttendance, User, Role, College, StudentFee } from '../types/index';
import { XMarkIcon, DownloadIcon, TrashIcon, DocumentIcon, CheckCircleIcon, XCircleIcon } from './icons';
import StudentTranscript from './StudentTranscript';
import StudentAttendanceTranscript from './StudentAttendanceTranscript';
import StudentFeeTranscript from './StudentFeeTranscript';
import PlacementTranscript from './PlacementTranscript';
import { JNTUH_RULES, FEE_STRUCTURE } from '../constants/index';
import { deleteStudentData } from '../services/api';

interface StudentDetailsProps {
  student: StudentDetailsType;
  onClose: () => void;
  initialView?: TranscriptView;
  user: User;
  initialAcademicYear?: string;
  initialSemester?: string;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ 
  student, 
  onClose, 
  initialView, 
  user,
  initialAcademicYear,
  initialSemester
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [printingWhat, setPrintingWhat] = useState<TranscriptView | null>(null);
  const [activeTab, setActiveTab] = useState<TranscriptView>(initialView || 'marks');
  const originalTitle = document.title;
  
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(initialAcademicYear || 'All Years');
  const [selectedSemester, setSelectedSemester] = useState(initialSemester || 'All Semesters');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  const academicYears = useMemo(() => {
    const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
    if (!admissionYearMatch) return ['All Years'];
    const startYear = parseInt(admissionYearMatch[1], 10);
    return ['All Years', ...Array.from({ length: 4 }, (_, i) => `${startYear + i}-${startYear + i + 1}`)];
  }, [student.admissionNumber]);

  const semesterOptions = useMemo(() => {
    if (selectedAcademicYear === 'All Years') {
        return ['All Semesters', ...Array.from({ length: 8 }, (_, i) => (i + 1).toString())];
    }
    const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
    if (!admissionYearMatch) return ['All Semesters'];
    
    const admissionYear = parseInt(admissionYearMatch[1], 10);
    const academicYearStart = parseInt(selectedAcademicYear.split('-')[0], 10);
    const yearOffset = academicYearStart - admissionYear;

    if (yearOffset < 0 || yearOffset > 3) {
      return ['All Semesters'];
    }

    const startSem = yearOffset * 2 + 1;
    const endSem = yearOffset * 2 + 2;
    
    return ['All Semesters', String(startSem), String(endSem)];
  }, [selectedAcademicYear, student.admissionNumber]);

  useEffect(() => {
    if (!semesterOptions.includes(selectedSemester)) {
      setSelectedSemester('All Semesters');
    }
  }, [semesterOptions, selectedSemester]);

  useEffect(() => {
    if (!initialAcademicYear && !initialSemester) {
      setSelectedAcademicYear('All Years');
      setSelectedSemester('All Semesters');
    }
  }, [activeTab, initialAcademicYear, initialSemester]);
  
  const handleDownload = () => {
    setPrintingWhat(activeTab);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (activeTab === 'placement') return;
    try {
        const result = await deleteStudentData({
            admissionNumber: student.admissionNumber,
            studentName: student.studentName,
            tab: activeTab === 'fees' ? 'fees' : (activeTab === 'examFees' ? 'examFees' : activeTab as any),
            academicYear: selectedAcademicYear,
            semester: selectedSemester,
            deletedBy: user.id,
            reason: deletionReason,
        });
        alert(result.message);
        onClose();
    } catch (e) {
        alert(`Deletion failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
        setShowDeleteConfirm(false);
    }
  };

  const deletionScope = useMemo(() => {
    if (selectedSemester !== 'All Semesters') {
        return `Semester ${selectedSemester}`;
    }
    if (selectedAcademicYear !== 'All Years') {
        return `Academic Year ${selectedAcademicYear}`;
    }
    return 'All Data';
  }, [selectedAcademicYear, selectedSemester]);

  const ccEmails = useMemo(() => {
      const chairmanEmail = 'jyosh4468@gmail.com';
      let principalEmail = '';

      switch (student.collegeCode) {
          case College.BRIL:
              principalEmail = 'BPRN01@gmail.com';
              break;
          case College.BRIG:
              principalEmail = 'GPRN01@gmail.com';
              break;
          case College.KNRR:
              principalEmail = 'KPRN01@gmail.com';
              break;
          default:
              principalEmail = 'principal@edu.com'; 
      }

      return `${chairmanEmail}, ${principalEmail}`;
  }, [student.collegeCode]);

  useEffect(() => {
    if (printingWhat && student) {
      document.title = `${student.admissionNumber}_${printingWhat}_report.pdf`;
      
      const handleAfterPrint = () => {
        document.title = originalTitle;
        setPrintingWhat(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      
      window.addEventListener('afterprint', handleAfterPrint);

      setTimeout(() => {
        window.print();
      }, 100);
    }
  }, [printingWhat, student, originalTitle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const animationClass = isClosing ? 'animate-fade-out-scale-down' : 'animate-fade-in-scale-up';
  
  const TabButton: React.FC<{ view: TranscriptView; label: string; disabled?: boolean; }> = ({ view, label, disabled }) => (
    <button
      onClick={() => setActiveTab(view)}
      disabled={disabled}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors disabled:cursor-not-allowed disabled:text-slate-600 disabled:border-transparent ${
        activeTab === view
          ? 'border-blue-500 text-blue-400'
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
      }`}
    >
      {label}
    </button>
  );

  const formatPaymentDate = (dateString: string) => {
      if (!dateString) return '-';
      try {
          const date = new Date(dateString);
          return new Intl.DateTimeFormat('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
          }).format(date);
      } catch (e) {
          return dateString;
      }
  };

  const filteredMarks = useMemo(() => {
      let marks = student.marks;
      if (selectedSemester !== 'All Semesters') {
          marks = marks.filter(m => m.semester.toString() === selectedSemester);
      } else if (selectedAcademicYear !== 'All Years') {
          const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
          if (admissionYearMatch) {
              const admissionYear = parseInt(admissionYearMatch[1], 10);
              const academicYearStart = parseInt(selectedAcademicYear.split('-')[0], 10);
              const yearOffset = academicYearStart - admissionYear;
              const startSem = yearOffset * 2 + 1;
              const endSem = yearOffset * 2 + 2;
              marks = marks.filter(m => m.semester === startSem || m.semester === endSem);
          }
      }
      return marks;
  }, [student.marks, student.admissionNumber, selectedAcademicYear, selectedSemester]);

  const filteredFees = useMemo(() => {
    let fees: StudentFee[] = student.fees.filter(f => !f.feeType || f.feeType === 'Tuition');
    const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
    if (admissionYearMatch) {
        const admissionYear = parseInt(admissionYearMatch[1], 10);
        for (let i = 0; i < 4; i++) {
             const startYear = admissionYear + i;
             const acYear = `${startYear}-${startYear + 1}`;
             const exists = fees.some(f => f.academicYear === acYear);
             if (!exists) {
                 const total = FEE_STRUCTURE[student.programCode] || 0;
                 fees.push({
                    admissionNumber: student.admissionNumber,
                    academicYear: acYear,
                    semester: (i * 2) + 1,
                    paymentDate: '', 
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
    if (selectedAcademicYear !== 'All Years') fees = fees.filter(f => f.academicYear === selectedAcademicYear);
    if (selectedSemester !== 'All Semesters') {
        const semNum = parseInt(selectedSemester, 10);
        fees = fees.filter(f => f.semester === semNum);
    }
    const yearlyGroups = new Map<string, StudentFee[]>();
    fees.forEach(f => {
        const year = f.academicYear.trim();
        if(!yearlyGroups.has(year)) yearlyGroups.set(year, []);
        yearlyGroups.get(year)!.push(f);
    });
    let processedFees: StudentFee[] = [];
    yearlyGroups.forEach((groupFees) => {
        const maxTotalFee = Math.max(...groupFees.map(f => f.totalFees), 0);
        groupFees.sort((a, b) => {
             const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
             const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
             return dateA - dateB;
        });
        let runningPaid = 0;
        const feesWithBalance = groupFees.map(f => {
             runningPaid += f.paidAmount;
             const balanceDue = Math.max(0, maxTotalFee - runningPaid);
             let status: 'Paid' | 'Partial' | 'Due' = 'Due';
             if (balanceDue === 0) status = 'Paid';
             else if (runningPaid > 0) status = 'Partial';
             return { ...f, totalFees: maxTotalFee, dueAmount: balanceDue, status: status };
        });
        processedFees.push(...feesWithBalance);
    });
    return processedFees.sort((a, b) => {
        if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
        const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        return dateB - dateA;
    });
  }, [student.fees, selectedAcademicYear, selectedSemester, student.admissionNumber, student.programCode]);

  const filteredAttendance = useMemo(() => {
    let attendance = student.attendance;
    const admissionYearMatch = student.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
    if (!admissionYearMatch) return attendance;
    const admissionYear = parseInt(admissionYearMatch[1], 10);
    let startRangeDate: Date | null = null;
    let endRangeDate: Date | null = null;
    if (selectedAcademicYear !== 'All Years') {
        const startYear = parseInt(selectedAcademicYear.split('-')[0], 10);
        startRangeDate = new Date(`${startYear}-07-01T00:00:00`);
        endRangeDate = new Date(`${startYear + 1}-06-30T00:00:00`);
    }
    if (selectedSemester !== 'All Semesters') {
        const semNum = parseInt(selectedSemester, 10);
        const yearOffset = Math.floor((semNum - 1) / 2);
        const academicYearStart = admissionYear + yearOffset;
        let semesterStartDate: Date, semesterEndDate: Date;
        if (semNum % 2 !== 0) {
            semesterStartDate = new Date(`${academicYearStart}-07-01T00:00:00`);
            semesterEndDate = new Date(`${academicYearStart}-12-31T00:00:00`);
        } else {
            semesterStartDate = new Date(`${academicYearStart + 1}-01-01T00:00:00`);
            semesterEndDate = new Date(`${academicYearStart + 1}-06-30T00:00:00`);
        }
        startRangeDate = startRangeDate ? new Date(Math.max(startRangeDate.getTime(), semesterStartDate.getTime())) : semesterStartDate;
        endRangeDate = endRangeDate ? new Date(Math.min(endRangeDate.getTime(), semesterEndDate.getTime())) : semesterEndDate;
    }
    if (startRangeDate && endRangeDate) {
        const startDateString = startRangeDate.toISOString().split('T')[0];
        const endDateString = endRangeDate.toISOString().split('T')[0];
        return attendance.filter(att => att.date >= startDateString && att.date <= endDateString);
    }
    return attendance;
  }, [student.attendance, student.admissionNumber, selectedAcademicYear, selectedSemester]);
  
  const headerMetrics = useMemo(() => {
    // Standardized Marks Calculation: (Total Obtained / Total Max) * 100
    const totalMarks = filteredMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const maxMarks = filteredMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
    const marksPercentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : null;
    const marksColor = marksPercentage === null ? 'text-slate-400' : marksPercentage >= 40 ? 'text-green-400' : 'text-red-400';

    const attendanceByDate = new Map<string, { morning: string; afternoon: string }>();
    filteredAttendance.forEach(a => {
      if (!attendanceByDate.has(a.date)) {
        attendanceByDate.set(a.date, { morning: a.morning, afternoon: a.afternoon });
      }
    });
    let fullD = 0, halfD = 0, absentD = 0;
    attendanceByDate.forEach(day => {
      if (day.morning === 'Present' && day.afternoon === 'Present') fullD++;
      else if (day.morning === 'Present' || day.afternoon === 'Present') halfD++;
      else absentD++;
    });
    const totalD = fullD + halfD + absentD;
    const attendancePercentage = totalD > 0 ? ((fullD + 0.5 * halfD) / totalD) * 100 : null;
    const attendanceColor = attendancePercentage === null ? 'text-slate-400' : attendancePercentage >= 75 ? 'text-green-400' : attendancePercentage < 65 ? 'text-red-400' : 'text-yellow-400';

    const uniqueFeeYears = Array.from(new Set(filteredFees.map(f => f.academicYear)));
    let dueForScope = 0;
    uniqueFeeYears.forEach(year => {
        const latestRecordForYear = filteredFees.find(f => f.academicYear === year);
        if (latestRecordForYear) dueForScope += latestRecordForYear.dueAmount;
    });

    let examFeeStatus = 'N/A';
    let examFeeColor = 'bg-slate-600 text-slate-200';
    if (attendancePercentage !== null) {
        if (attendancePercentage >= 75) { examFeeStatus = 'Eligible'; examFeeColor = 'bg-blue-500/20 text-blue-300'; }
        else if (attendancePercentage >= 65) { examFeeStatus = 'Condonation'; examFeeColor = 'bg-yellow-500/20 text-yellow-300'; }
        else { examFeeStatus = 'Detained'; examFeeColor = 'bg-red-500/20 text-red-300'; }
    }

    return {
        marksPercentage,
        marksColor,
        attendancePercentage,
        attendanceColor,
        dueForScope,
        examFeeStatus,
        examFeeColor,
        isPlaced: student.isPlaced,
        placedColor: student.isPlaced ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-200',
        placedText: student.isPlaced ? 'Placed' : 'Not Placed',
    };
  }, [student, filteredMarks, filteredAttendance, filteredFees]);

  return (
    <>
      <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4 animate-fade-in print:hidden" onClick={handleClose} role="dialog" aria-modal="true">
        <div className={`bg-slate-800 text-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-700 ${animationClass}`} onClick={e => e.stopPropagation()}>
          <header className="p-6 border-b border-slate-700 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-blue-400">{student.studentName}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                <span>{student.admissionNumber}</span>
                <span className="hidden sm:inline">&bull;</span>
                <span>{student.collegeCode}</span>
                <span className="hidden sm:inline">&bull;</span>
                <span>{student.programCode}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-x-4 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
                  <div>
                      <span className="text-xs text-slate-400">Marks %</span>
                      <p className={`text-xl font-bold ${headerMetrics.marksColor}`}>
                          {headerMetrics.marksPercentage !== null ? headerMetrics.marksPercentage.toFixed(1) + '%' : 'N/A'}
                      </p>
                  </div>
                  <div className="h-8 w-px bg-slate-600"></div>
                  <div>
                      <span className="text-xs text-slate-400">Attendance %</span>
                      <p className={`text-xl font-bold ${headerMetrics.attendanceColor}`}>
                          {headerMetrics.attendancePercentage !== null ? headerMetrics.attendancePercentage.toFixed(1) + '%' : 'N/A'}
                      </p>
                  </div>
                  <div className="h-8 w-px bg-slate-600"></div>
                  <div>
                      <span className="text-xs text-slate-400">Fee Due</span>
                      <p className={`text-xl font-bold ${headerMetrics.dueForScope > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          ₹{headerMetrics.dueForScope.toLocaleString('en-IN')}
                      </p>
                  </div>
                  <div className="h-8 w-px bg-slate-600"></div>
                   <span className={`px-3 py-1 self-center rounded-md text-xs font-semibold ${headerMetrics.examFeeColor}`}>{headerMetrics.examFeeStatus}</span>
                  <span className={`px-3 py-1 self-center rounded-md text-xs font-semibold ${headerMetrics.placedColor}`}>{headerMetrics.placedText}</span>
              </div>
              <div className="flex items-start gap-2">
                  <div className="flex flex-col items-stretch gap-2">
                      <button onClick={handleDownload} className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                          <DownloadIcon className="h-4 w-4" />
                          <span>Print Report</span>
                      </button>
                      {[Role.CHAIRMAN, Role.PRINCIPAL, Role.STAFF].includes(user.role) && (
                        <button onClick={handleDeleteClick} className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-slate-600" disabled={activeTab === 'placement'} title={`Delete ${activeTab} data`}>
                            <TrashIcon className="h-4 w-4" />
                            <span>Delete Data</span>
                        </button>
                      )}
                  </div>
                  <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"><XMarkIcon className="h-6 w-6"/></button>
              </div>
            </div>
          </header>

          <nav className="px-6 border-b border-slate-700 flex space-x-2 flex-shrink-0">
            <TabButton view="marks" label="Marks Summary" />
            <TabButton view="attendance" label="Attendance Log" />
            <TabButton view="fees" label="Fee History" />
            <TabButton view="examFees" label="Exam Fees" />
            <TabButton view="placement" label="Placement Details" disabled={!student.placementDetails} />
          </nav>

          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Academic Year</label>
                    <select value={selectedAcademicYear} onChange={e => setSelectedAcademicYear(e.target.value)} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-md focus:ring-blue-500 block w-full p-2 disabled:opacity-50" disabled={activeTab === 'placement'}>
                        {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Semester</label>
                    <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-md focus:ring-blue-500 block w-full p-2 disabled:opacity-50" disabled={activeTab === 'placement'}>
                        {semesterOptions.map(sem => <option key={sem} value={sem}>{sem === 'All Semesters' ? sem : `Semester ${sem}`}</option>)}
                    </select>
                </div>
            </div>
          </div>
          
          <main className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-900">
            {activeTab === 'marks' && (
              filteredMarks.length > 0 ? (
                <div className="overflow-x-auto rounded-lg">
                  <table className="min-w-full divide-y divide-slate-700">
                      <thead className="bg-slate-700 sticky top-0 z-10">
                      <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Semester</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Subject</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Internal <span className="font-normal text-slate-400">(40)</span></th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">External <span className="font-normal text-slate-400">(60)</span></th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Total <span className="font-normal text-slate-400">(100)</span></th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Result</th>
                      </tr>
                      </thead>
                      <tbody className="bg-slate-800 divide-y divide-slate-700">
                      {filteredMarks.map((mark, index) => {
                           const isPass = (mark.internalMark ?? 0) >= JNTUH_RULES.INTERNAL_MIN && (mark.externalMark ?? 0) >= JNTUH_RULES.EXTERNAL_MIN && mark.marksObtained >= JNTUH_RULES.TOTAL_MIN;
                           return(
                              <tr key={index}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{mark.semester}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm">{mark.subjectName} ({mark.subjectCode})</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{mark.internalMark ?? '-'}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{mark.externalMark ?? '-'}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-bold">{mark.marksObtained}</td>
                                  <td className={`px-4 py-2 whitespace-nowrap text-sm font-semibold text-center ${isPass ? 'text-green-400' : 'text-red-400'}`}>{isPass ? 'Pass' : 'Fail'}</td>
                              </tr>
                          )
                      })}
                      </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500"><p>No marks data available for the selected filters.</p></div>
              )
            )}
            
            {activeTab === 'fees' && (
                <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-700 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-2">Academic Year</th>
                                <th className="px-4 py-2 text-right">Total (₹)</th>
                                <th className="px-4 py-2 text-right">Paid (₹)</th>
                                <th className="px-4 py-2 text-right">Due (₹)</th>
                                <th className="px-4 py-2 text-center">Status</th>
                                <th className="px-4 py-2 text-right">Transaction Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700 text-sm">
                            {filteredFees.map((fee, i) => (
                                <tr key={`${fee.academicYear}-${i}`}>
                                    <td className="px-4 py-2">{fee.academicYear}</td>
                                    <td className="px-4 py-2 text-right">{fee.totalFees.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-2 text-right">{fee.paidAmount.toLocaleString('en-IN')}</td>
                                    <td className={`px-4 py-2 text-right font-semibold ${fee.dueAmount > 0 ? 'text-red-400' : 'text-slate-300'}`}>{fee.dueAmount.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-2 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${fee.status === 'Paid' ? 'bg-green-500/20 text-green-300' : fee.status === 'Partial' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>{fee.status}</span></td>
                                    <td className="px-4 py-2 text-right font-mono text-slate-300">{formatPaymentDate(fee.paymentDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'attendance' && (
              filteredAttendance.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg">
                      <table className="min-w-full divide-y divide-slate-700">
                          <thead className="bg-slate-700 sticky top-0 z-10">
                          <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Morning</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Afternoon</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                          </tr>
                          </thead>
                          <tbody className="bg-slate-800 divide-y divide-slate-700">
                          {filteredAttendance.map((att, index) => {
                                const status = att.morning === 'Present' && att.afternoon === 'Present' ? 'Full Day' : (att.morning === 'Absent' && att.afternoon === 'Absent' ? 'Absent' : 'Half Day');
                                const statusColor = status === 'Full Day' ? 'text-green-400' : status === 'Absent' ? 'text-red-400' : 'text-yellow-400';
                              return (
                                <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{att.date}</td>
                                <td className={`px-4 py-2 whitespace-nowrap text-sm text-center ${att.morning === 'Present' ? 'text-green-400' : 'text-red-400'}`}>{att.morning}</td>
                                <td className={`px-4 py-2 whitespace-nowrap text-sm text-center ${att.afternoon === 'Present' ? 'text-green-400' : 'text-red-400'}`}>{att.afternoon}</td>
                                <td className={`px-4 py-2 whitespace-nowrap text-sm text-center font-semibold ${statusColor}`}>{status}</td>
                                </tr>
                              );
                          })}
                          </tbody>
                      </table>
                  </div>
              ) : (
                <div className="text-center py-10 text-slate-500"><p>No attendance data available for the selected filters.</p></div>
              )
            )}
            
            {activeTab === 'placement' && student.placementDetails && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="bg-slate-800 p-4 rounded-lg"><p className="text-xs text-slate-400">Company</p><p className="font-semibold text-slate-100 mt-1">{student.placementDetails.companyName}</p></div>
                    <div className="bg-slate-800 p-4 rounded-lg"><p className="text-xs text-slate-400">HR Name</p><p className="font-semibold text-slate-100 mt-1">{student.placementDetails.hrName}</p></div>
                    <div className="bg-slate-800 p-4 rounded-lg"><p className="text-xs text-slate-400">HR Contact</p><p className="font-semibold text-slate-100 mt-1">{student.placementDetails.hrMobileNumber}</p></div>
                 </div>
            )}
          </main>
        </div>
      </div>
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[60]" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 border border-slate-700" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-red-400">Confirm Deletion</h3>
                <p className="my-4 text-slate-300">Are you sure you want to delete <span className="font-bold">{deletionScope}</span> data for <span className="font-bold">{student.studentName}</span>?</p>
                <p className="text-sm text-yellow-400 font-semibold mb-4">This action cannot be undone.</p>
                <div className="space-y-2 mb-6">
                    <label className="block text-sm font-medium text-slate-300">Reason for Deletion</label>
                    <textarea value={deletionReason} onChange={(e) => setDeletionReason(e.target.value)} placeholder="Enter reason here..." className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm text-slate-200" rows={3}></textarea>
                    <p className="text-[10px] text-slate-500 italic">Audit Log: {ccEmails}</p>
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-md">Cancel</button>
                    <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md flex items-center gap-2"><TrashIcon className="h-4 w-4" />Confirm & Delete</button>
                </div>
            </div>
        </div>
      )}

      {printingWhat === 'marks' && student && <StudentTranscript student={student} selectedSemester={selectedSemester} selectedAcademicYear={selectedAcademicYear} />}
      {printingWhat === 'attendance' && student && <StudentAttendanceTranscript student={student} selectedSemester={selectedSemester} selectedAcademicYear={selectedAcademicYear} />}
      {printingWhat === 'fees' && student && <StudentFeeTranscript student={student} selectedSemester={selectedSemester} selectedAcademicYear={selectedAcademicYear} feeType="Tuition" />}
      {printingWhat === 'examFees' && student && <StudentFeeTranscript student={student} selectedSemester={selectedSemester} selectedAcademicYear={selectedAcademicYear} feeType="Exam" />}
      {printingWhat === 'placement' && student && student.placementDetails && <PlacementTranscript student={student} placement={student.placementDetails} />}
    </>
  );
};

export default StudentDetails;