
import React, { useState, useEffect } from 'react';
import { MenuIcon, ChevronDownIcon, ChevronUpIcon, DocumentIcon, TrashIcon } from './icons';
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
    if (!isAlreadyExpanded && !syllabi[abbr]) {
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
          {courses.map((course) => (
            <li key={course.abbr || course.name} className="bg-slate-800 rounded-lg overflow-hidden transition-all duration-300">
              <button
                onClick={() => course.abbr && handleToggleCourse(course.abbr)}
                className="w-full p-4 flex justify-between items-center text-left transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!course.abbr}
                aria-expanded={expandedCourse === course.abbr}
                aria-controls={`syllabus-content-${course.abbr}`}
              >
                <span className="text-slate-200 font-medium">{course.name}</span>
                {course.abbr ? (
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-sm bg-slate-700 text-blue-300 px-2.5 py-1 rounded-md">{course.abbr}</span>
                        {expandedCourse === course.abbr
                            ? <ChevronUpIcon className="h-5 w-5 text-slate-400" />
                            : <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                        }
                    </div>
                ) : <div className="w-16"></div>}
              </button>
              {expandedCourse === course.abbr && (
                <div id={`syllabus-content-${course.abbr}`} className="p-4 border-t border-slate-700 bg-slate-800/50">
                    {/* FIX: Changed text color for better visibility and consistency. */}
                    <h4 className="font-semibold text-yellow-400 mb-3">JNTUH Syllabus PDFs</h4>
                    {loadingSyllabus === course.abbr && <p className="text-sm text-slate-400">Loading...</p>}
                    {syllabi[course.abbr] && syllabi[course.abbr].length > 0 ? (
                        <ul className="space-y-2">
                            {syllabi[course.abbr].map(pdf => (
                                <li key={pdf.name} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900/50 p-3 rounded-md gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <DocumentIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                                        <span className="text-sm text-slate-300 truncate" title={pdf.name}>{pdf.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                                        <a href={pdf.data} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors">Open</a>
                                        <button onClick={() => downloadSyllabusPdf(pdf.data, pdf.name)} className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Download</button>
                                        {user.role === Role.CHAIRMAN && (
                                            <button onClick={() => handleDelete(course.abbr!, pdf)} className="p-1.5 bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                                              <TrashIcon className="h-4 w-4 text-white" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        loadingSyllabus !== course.abbr && <p className="text-sm text-slate-500">No syllabus PDFs found for this department.</p>
                    )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

export default CoursesOffered;
