
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import AuthLayout from './components/AuthLayout';
import CoursesOffered from './components/CoursesOffered';
import StudentSearch from './components/StudentSearch';
// FIX: Import College to use in state.
import { User, Role, View, College } from './types';
// FIX: Import LATEST_ATTENDANCE_DATE to initialize date state.
import { MOCK_USERS, LATEST_ATTENDANCE_DATE } from './constants';
// FIX: Import API for download functionality
import { getFilteredStudentDetails } from './services/api';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  // FIX: Add state for selectedDate to be passed down to child components.
  const [selectedDate, setSelectedDate] = useState(LATEST_ATTENDANCE_DATE);
  
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('eduManageUsers');
      return savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    } catch (error) {
      console.error("Failed to parse users from localStorage, falling back to default.", error);
      return MOCK_USERS;
    }
  });
  
  const [view, setView] = useState<View>('dashboard');

  // FIX: Add state for shared filters
  const [selectedCollege, setSelectedCollege] = useState<College>(College.ALL);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedRollNo, setSelectedRollNo] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('eduManageUsers', JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to localStorage.", error);
    }
  }, [users]);

  useEffect(() => {
    if (currentUser && currentUser.role !== Role.CHAIRMAN && currentUser.college) {
      setSelectedCollege(currentUser.college);
    }
  }, [currentUser]);


  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const handleRegister = (details: any) => {
    const userExists = users.some(user => user.id.toLowerCase() === details.username.toLowerCase());
    if (userExists) {
        alert(`Username "${details.username}" is already taken. Please choose another one.`);
        return;
    }
      
    const newUser: User = {
        id: details.username,
        name: `${details.firstName} ${details.lastName}`,
        email: details.email,
        mobileNumber: `+91${details.mobileNumber}`,
        password: details.password,
        role: details.role,
        college: details.college,
    };
    setUsers([...users, newUser]);
    alert(`Registration successful for ${newUser.name}! You can now log in.`);
    setIsRegistering(false);
  };

  // FIX: Add a handler for the sidebar toggle, required by child components.
  const onToggleSidebar = () => {};

  // FIX: Add download handlers
  const downloadCsv = (rows: string[], filename: string) => {
      const csvString = rows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
  };

  const onDownload = async (purpose: string) => {
      setIsDownloading(true);
      try {
          const data = await getFilteredStudentDetails(selectedCollege, selectedYear, selectedDepartment, selectedRollNo, selectedDate, selectedDate, selectedSemester, 'All Subjects');
          if (data.length === 0) { alert('No student marks data to download for the current filters.'); setIsDownloading(false); return; }
          const headers = ['admissionNumber', 'rollNo', 'studentName', 'collegeCode', 'programCode', 'gender', 'academicResult'];
          const rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
          downloadCsv([headers.join(','), ...rows], 'student_marks_report.csv');
      } catch (error) { 
          console.error("CSV Download failed:", error); 
          alert('Download failed.');
      } finally { 
          setIsDownloading(false); 
      }
  };

  if (!currentUser) {
    return (
      <AuthLayout>
        {isRegistering ? (
          <Register onRegister={handleRegister} switchToLogin={() => setIsRegistering(false)} />
        ) : (
          <Login onLogin={handleLogin} users={users} switchToRegister={() => setIsRegistering(true)} />
        )}
      </AuthLayout>
    );
  }

  const sharedFilterProps = {
    selectedCollege,
    setSelectedCollege,
    selectedDepartment,
    setSelectedDepartment,
    selectedYear,
    setSelectedYear,
    selectedSemester,
    setSelectedSemester,
    selectedRollNo,
    setSelectedRollNo,
  };

  return (
    <div className="h-screen w-full flex bg-slate-950 text-gray-100">
      <Sidebar user={currentUser} onLogout={handleLogout} view={view} setView={setView} />
      <div className="flex-1 flex flex-col">
        {/* FIX: Pass selectedDate and setSelectedDate to Dashboard to satisfy its props interface. */}
        {view === 'dashboard' && <Dashboard user={currentUser} onToggleSidebar={onToggleSidebar} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
        {/* FIX: Pass user prop to CoursesOffered to satisfy its props interface. */}
        {view === 'courses' && <CoursesOffered user={currentUser} onToggleSidebar={onToggleSidebar} />}
        {/* FIX: Pass all required props to StudentSearch to resolve missing properties error. */}
        {view === 'studentSearch' && <StudentSearch user={currentUser} onToggleSidebar={onToggleSidebar} {...sharedFilterProps} onDownload={onDownload} isDownloading={isDownloading} />}
      </div>
    </div>
  );
};

export default App;
