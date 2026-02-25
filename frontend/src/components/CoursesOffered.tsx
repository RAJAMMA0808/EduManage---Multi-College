import React, { useState, useEffect, useMemo } from 'react';
// Added RefreshIcon to imports
import { MenuIcon, ChevronDownIcon, ChevronUpIcon, DocumentIcon, TrashIcon, DownloadIcon, RefreshIcon } from './icons';
import { getSyllabusPdfs, downloadSyllabusPdf, deleteSyllabusPdf } from '../services/api';
import { SyllabusPdf, User, Role } from '../types';

interface CoursesOfferedProps {
  user: User;
  onToggleSidebar: () => void;
}

const courses = [
  { name: 'Computer Science Engineering', abbr: 'CSE' },
  { name: 'Electronics and Communication Engineering', abbr: 'ECE' },
  { name: 'Electrical & Electronics Engineering', abbr: 'EEE' },
  { name: 'Mechanical Engineering', abbr: 'MECH' },
  { name: 'Civil Engineering', abbr: 'CIVIL' },
  { name: 'Humanities & Sciences', abbr: 'HS' },
  { name: 'Computer Science and Engineering (AI & ML)', abbr: 'CSM' },
  { name: 'Computer Science and Engineering (Data Science)', abbr: 'CSD' },
  { name: 'Computer Science and Engineering (Cyber Security)', abbr: 'CSC' },
];

const CoursesOffered: React.FC<CoursesOfferedProps> = ({ user, onToggleSidebar }) => {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [syllabi, setSyllabi] = useState<Record<string, SyllabusPdf[]>>({});
  const [loadingSyllabus, setLoadingSyllabus] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  /**
   * REVISED VISIBILITY LOGIC:
   * 1. Chairman, Principal, and Staff (Admin) can see ALL branches.
   * 2. Students, HODs, and Faculty see ONLY their specific branch.
   */
  const filteredCourses = useMemo(() => {
    // Admin and Oversight roles
    if ([Role.CHAIRMAN, Role.PRINCIPAL, Role.STAFF].includes(user.role)) {
      return courses;
    }
    
    // Restricted roles (Student, Faculty, HOD)
    const userDept = user.department || (user.id.match(/^[A-Z]([A-Z]{2,4})\d+/) ? user.id.match(/^[A-Z]([A-Z]{2,4})\d+/)?.[1] : null);
    
    if (userDept) {
      // Strictly filter to only show their specific branch
      const matches = courses.filter(c => c.abbr === userDept);
      
      // If student and we matched their branch, auto-expand it for better UX
      if (user.role === Role.STUDENT && matches.length > 0 && !expandedCourse) {
         // Side effect inside useMemo is usually bad, but we just need to know what to return
      }
      return matches;
    }
    
    return []; // Return none if no dept match found for restricted users
  }, [user]);

  // Handle auto-expansion for students safely
  useEffect(() => {
    if (user.role === Role.STUDENT && filteredCourses.length === 1 && !expandedCourse) {
       handleToggleCourse(filteredCourses[0].abbr);
    }
  }, [filteredCourses]);

  const fetchPdfsForCourse = async (abbr: string) => {
    setLoadingSyllabus(abbr);
    try {
        const pdfs = await getSyllabusPdfs(abbr);
        setSyllabi(prev => ({ ...prev, [abbr]: pdfs }));
    } catch (error) {
        console.error(`Failed to load syllabus for ${abbr}:`, error);
        showTemporaryNotification('error', `Failed to load syllabus for ${abbr}.`);
    } finally {
        setLoadingSyllabus(null);
    }
  };

  const handleToggleCourse = (abbr: string) => {
    const isAlreadyExpanded = expandedCourse === abbr;
    setExpandedCourse(isAlreadyExpanded ? null : abbr);
    if (!isAlreadyExpanded) {
        fetchPdfsForCourse(abbr);
    }
  };

  const showTemporaryNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = async (departmentAbbr: string, pdf: SyllabusPdf) => {
    if (window.confirm(`Are you sure you want to delete "${pdf.name}"? This action cannot be undone.`)) {
        try {
            const result = await deleteSyllabusPdf(departmentAbbr, pdf.name);
            if (result.success) {
                setSyllabi(prev => ({
                    ...prev,
                    [departmentAbbr]: prev[departmentAbbr].filter(p => p.name !== pdf.name)
                }));
                showTemporaryNotification('success', result.message);
            } else {
                showTemporaryNotification('error', result.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not delete file.";
            showTemporaryNotification('error', message);
        }
    }
  };

  const handleOpenPdf = (dataUrl: string) => {
    const newWindow = window.open();
    if (newWindow) {
        newWindow.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
        alert('Please allow popups to view the PDF.');
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-transparent overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
          <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
              <MenuIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-white">Undergraduate (UG) Courses Offered</h2>
      </div>

       {notification && (
          <div className={`mb-4 p-3 rounded-md text-sm font-medium ${notification.type === 'success' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
              {notification.message}
          </div>
      )}

      <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
        <ul className="space-y-3">
          {filteredCourses.map((course) => (
            <li key={course.abbr} className="bg-slate-800 rounded-lg overflow-hidden transition-all duration-300">
              <button
                onClick={() => handleToggleCourse(course.abbr)}
                className="w-full p-4 flex justify-between items-center text-left transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={expandedCourse === course.abbr}
                aria-controls={`syllabus-content-${course.abbr}`}
              >
                <span className="text-slate-200 font-medium">{course.name}</span>
                <div className="flex items-center gap-4">
                    <span className="font-mono text-sm bg-slate-700 text-blue-300 px-2.5 py-1 rounded-md">{course.abbr}</span>
                    {expandedCourse === course.abbr
                        ? <ChevronUpIcon className="h-5 w-5 text-slate-400" />
                        : <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                    }
                </div>
              </button>
              {expandedCourse === course.abbr && (
                <div id={`syllabus-content-${course.abbr}`} className="p-4 border-t border-slate-700 bg-slate-800/50">
                    <h4 className="font-semibold text-yellow-400 mb-3">JNTUH Syllabus PDFs</h4>
                    {loadingSyllabus === course.abbr && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs animate-pulse py-2">
                             <RefreshIcon className="h-4 w-4 animate-spin" />
                             <span>Syncing documents...</span>
                        </div>
                    )}
                    {syllabi[course.abbr] && syllabi[course.abbr].length > 0 ? (
                        <ul className="space-y-2">
                            {syllabi[course.abbr].map(pdf => (
                                <li key={pdf.name} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900/50 p-3 rounded-md gap-3 border border-slate-700 hover:border-blue-500/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <DocumentIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                                        <span className="text-sm text-slate-300 truncate font-bold" title={pdf.name}>{pdf.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                                        <button 
                                            onClick={() => handleOpenPdf(pdf.data)} 
                                            className="flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all shadow-lg"
                                        >
                                            View
                                        </button>
                                        <button 
                                            onClick={() => downloadSyllabusPdf(pdf.data, pdf.name)} 
                                            className="flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-lg"
                                        >
                                            <DownloadIcon className="h-3 w-3" />
                                            Get File
                                        </button>
                                        {(user.role === Role.CHAIRMAN || user.role === Role.PRINCIPAL || (user.role === Role.HOD && user.department === course.abbr)) && (
                                            <button 
                                                onClick={() => handleDelete(course.abbr!, pdf)} 
                                                className="p-1.5 bg-red-600 hover:bg-red-700 rounded-md hover:scale-105 transition-all shadow-lg" 
                                                title="Delete document"
                                            >
                                              <TrashIcon className="h-4 w-4 text-white" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !loadingSyllabus && <p className="text-xs text-slate-500 italic py-4">No official syllabus documents have been linked to this branch yet.</p>
                    )}
                </div>
              )}
            </li>
          ))}
          {filteredCourses.length === 0 && (
              <li className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest italic opacity-50">Authorized Course Telemetry Unavailable</li>
          )}
        </ul>
      </div>
    </main>
  );
};

export default CoursesOffered;