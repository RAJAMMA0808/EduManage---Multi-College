



import React from 'react';
// FIX: Updated View type to be imported from types.ts
import { User, Role, View } from '../types';
import { LogoutIcon, AcademicCapIcon, ChartBarIcon, BookOpenIcon, SearchIcon } from './icons';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  view: View;
  setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, view, setView }) => {
  const navItemClass = (itemView: View) => 
    `flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer transition ${
      view === itemView ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
    }`;
  
  return (
    <aside className="w-52 bg-slate-900 p-4 flex flex-col hidden md:flex">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <AcademicCapIcon className="h-8 w-8 text-blue-400" />
        <h1 className="text-xl font-bold">EduManage</h1>
      </div>

      {/* Main content (profile + nav) */}
      <div className="flex-grow">
        {/* User Profile */}
        <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-slate-700 mx-auto mb-3 flex items-center justify-center font-bold text-2xl border-2 border-slate-600">
                {user.name.charAt(0)}
            </div>
            <h2 className="font-semibold text-lg">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.role}</p>
            {user.college && (
              <p className="text-sm text-blue-400 mt-1 font-semibold">{user.college}</p>
            )}
        </div>

        <hr className="border-slate-700 my-4" />

        {/* Navigation */}
        <nav className="space-y-2">
            <div role="button" tabIndex={0} onClick={() => setView('dashboard')} onKeyDown={(e) => e.key === 'Enter' && setView('dashboard')} className={navItemClass('dashboard')}>
              <AcademicCapIcon className="h-5 w-5" />
              <span className="text-sm">Dashboard</span>
            </div>
             {user.role !== Role.STUDENT && (
              <>
                <div role="button" tabIndex={0} onClick={() => setView('studentSearch')} onKeyDown={(e) => e.key === 'Enter' && setView('studentSearch')} className={navItemClass('studentSearch')}>
                  <SearchIcon className="h-5 w-5" />
                  <span className="text-sm">Student Search</span>
                </div>
              </>
            )}
            <div role="button" tabIndex={0} onClick={() => setView('courses')} onKeyDown={(e) => e.key === 'Enter' && setView('courses')} className={navItemClass('courses')}>
              <BookOpenIcon className="h-5 w-5" />
              <span className="text-sm">Courses</span>
            </div>
        </nav>
      </div>
      
      {/* Footer (Logout) */}
      <div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition mt-6"
        >
          <LogoutIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;