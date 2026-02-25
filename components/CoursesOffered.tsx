



import React from 'react';
// FIX: Import MenuIcon
import { MenuIcon } from './icons';
import { User } from '../types';

// FIX: Add props interface
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
  { name: 'Humanities & Sciences', abbr: '' },
  { name: 'Computer Science and Engineering (Artificial Intelligence & Machine Learning)', abbr: 'CSM' },
  { name: 'Computer Science and Engineering (Data Science)', abbr: 'CSD' },
  { name: 'Computer Science and Engineering (Cyber Security)', abbr: 'CSC' },
];

const CoursesOffered: React.FC<CoursesOfferedProps> = ({ user, onToggleSidebar }) => {
  return (
    <main className="flex-1 p-8 bg-transparent overflow-y-auto">
      {/* FIX: Add hamburger menu button for mobile */}
      <div className="flex items-center gap-4 mb-8">
          <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
              <MenuIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Undergraduate (UG) Courses Offered</h2>
      </div>
      <div className="bg-slate-900 p-6 rounded-xl shadow-lg">
        <ul className="space-y-4">
          {courses.map((course, index) => (
            <li key={index} className="p-4 bg-slate-800 rounded-lg flex justify-between items-center transition-colors hover:bg-slate-700">
              <span className="text-slate-200">{course.name}</span>
              {course.abbr && <span className="font-mono text-sm bg-slate-700 text-blue-300 px-2 py-1 rounded">{course.abbr}</span>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

export default CoursesOffered;