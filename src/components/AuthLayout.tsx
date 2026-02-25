import React from 'react';
import { AcademicCapIcon, BuildingOfficeIcon, ChartBarIcon, UsersIcon } from './icons';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex text-slate-800">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-500 to-cyan-400 p-12 flex-col justify-center text-white">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <AcademicCapIcon className="h-10 w-10" />
            <h1 className="text-3xl font-bold">EduManage</h1>
          </div>
          <h2 className="text-4xl font-semibold mb-4">Multi-College Management System</h2>
          <p className="text-blue-100 mb-12">
            Comprehensive attendance and academic management dashboard for engineering colleges. Role-based access for Chairman, HODs, and staff with real-time analytics.
          </p>
          <ul className="space-y-6 text-lg">
            <li className="flex items-center gap-4">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
              <span>Manage multiple college campuses</span>
            </li>
            <li className="flex items-center gap-4">
               <UsersIcon className="h-6 w-6 text-white" />
              <span>Student & faculty attendance tracking</span>
            </li>
            <li className="flex items-center gap-4">
              <ChartBarIcon className="h-6 w-6 text-white" />
              <span>Real-time analytics and reporting</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
