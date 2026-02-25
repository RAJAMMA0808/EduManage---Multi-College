import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import AuthLayout from './components/AuthLayout';
import CollegeComparison from './components/CollegeComparison';
import CoursesOffered from './components/CoursesOffered';
import StudentSearch from './components/StudentSearch';
import ApplicationSubmission from './components/ApplicationSubmission';
// FIX: Renamed import to avoid name collision with the StudentAttendance type.
import StudentAttendance from './components/StudentAttendance';
import StudentFee from './components/StudentFee';
import { User, Role, View, College } from './types/index';
import { MOCK_USERS, LATEST_ATTENDANCE_DATE } from './constants/index';
import { getFilteredPlacementCsvData, getFilteredStudentDetails } from './services/api';
import PlacementSearch from './components/PlacementSearch';

type AuthView = 'login' | 'register' | 'forgotPassword';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(LATEST_ATTENDANCE_DATE);
  
  // FIX: Lift state up for shared filters
  const [selectedCollege, setSelectedCollege] = useState<College>(College.ALL);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedRollNo, setSelectedRollNo] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState(false);

  const [users, setUsers] = useState<User[]>(() => {
    try {
        const savedUsersRaw = localStorage.getItem('eduManageUsers');
        const currentUsers = savedUsersRaw ? JSON.parse(savedUsersRaw) as User[] : [...MOCK_USERS];
        const userMap = new Map(currentUsers.map(u => [u.id, u]));
        MOCK_USERS.forEach(mockUser => {
            userMap.set(mockUser.id, mockUser);
        });
        return Array.from(userMap.values());
    } catch (error) {
        console.error("Failed to initialize users from localStorage, falling back to default.", error);
        return [...MOCK_USERS];
    }
  });

  const [view, setView] = useState<View>('dashboard');
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => setDataVersion(prev => prev + 1);
  
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== Role.CHAIRMAN && currentUser.college) {
        setSelectedCollege(currentUser.college);
      } else {
        setSelectedCollege(College.ALL);
      }
    } else {
      // Reset filters on logout
      setSelectedCollege(College.ALL);
      setSelectedDepartment('all');
      setSelectedYear('all');
      setSelectedSemester('all');
      setSelectedRollNo('all');
    }
  }, [currentUser]);


  useEffect(() => {
    try {
      localStorage.setItem('eduManageUsers', JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to localStorage.", error);
    }
  }, [users]);
  
   useEffect(() => {
    const savedImage = localStorage.getItem('eduManageProfileImage');
    if (savedImage) {
        setProfileImage(savedImage);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthView('login');
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
    setAuthView('login');
  };

  const handleResetPassword = (username: string, newPassword: string) => {
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user.id.toLowerCase() === username.toLowerCase()) {
          return { ...user, password: newPassword };
        }
        return user;
      });
    });
    alert(`Password for user "${username}" has been reset. You can now log in with your new password.`);
    setAuthView('login');
  };
  
  const handleProfileImageChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfileImage(dataUrl);
        try {
            localStorage.setItem('eduManageProfileImage', dataUrl);
        } catch (error) {
            console.error("Failed to save image to localStorage.", error);
            alert("Could not save image. It might be too large for local storage.");
        }
    };
    reader.readAsDataURL(file);
  };
  
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

    const handleDownload = async (purpose: string) => {
        setIsDownloading(true);
        try {
            if (purpose === 'placement') {
                const data = await getFilteredPlacementCsvData(selectedCollege, selectedYear, selectedDepartment, selectedRollNo);
                 if (data.length === 0) { alert('No placement data to download for the current filters.'); return; }
                const headers = Object.keys(data[0]);
                const rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                downloadCsv([headers.join(','), ...rows], 'placement_report.csv');
            } else {
                const data = await getFilteredStudentDetails(selectedCollege, selectedYear, selectedDepartment, selectedRollNo, selectedDate, selectedDate, selectedSemester, 'All Subjects');
                if (data.length === 0) { alert('No student data to download for the current filters.'); return; }
                const headers = Object.keys(data[0]);
                const rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                downloadCsv([headers.join(','), ...rows], 'student_details_report.csv');
            }
        } catch (error) { 
            console.error("CSV Download failed:", error); 
            alert('Download failed.');
        } finally { 
            setIsDownloading(false); 
        }
    };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const renderAuthComponent = () => {
    switch (authView) {
      case 'register':
        return <Register onRegister={handleRegister} switchToLogin={() => setAuthView('login')} />;
      case 'forgotPassword':
        return <ForgotPassword onResetPassword={handleResetPassword} switchToLogin={() => setAuthView('login')} users={users} />;
      case 'login':
      default:
        return <Login onLogin={handleLogin} users={users} switchToRegister={() => setAuthView('register')} switchToForgotPassword={() => setAuthView('forgotPassword')} />;
    }
  };

  if (!currentUser) {
    return (
      <AuthLayout>
        {renderAuthComponent()}
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
      <Sidebar 
        user={currentUser} 
        onLogout={handleLogout} 
        view={view} 
        setView={setView} 
        profileImage={profileImage}
        onProfileImageChange={handleProfileImageChange}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-y-auto">
        {view === 'dashboard' && <Dashboard user={currentUser} onToggleSidebar={toggleSidebar} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dataVersion={dataVersion} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} />}
        {view === 'comparison' && currentUser.role === Role.CHAIRMAN && <CollegeComparison user={currentUser} onToggleSidebar={toggleSidebar} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dataVersion={dataVersion} {...sharedFilterProps} />}
        {view === 'courses' && <CoursesOffered user={currentUser} onToggleSidebar={toggleSidebar} />}
        {view === 'studentSearch' && currentUser.role !== Role.STUDENT && <StudentSearch user={currentUser} onToggleSidebar={toggleSidebar} {...sharedFilterProps} />}
        {view === 'studentAttendance' && currentUser.role !== Role.STUDENT && <StudentAttendance user={currentUser} onToggleSidebar={toggleSidebar} {...sharedFilterProps} />}
        {view === 'studentFee' && currentUser.role !== Role.STUDENT && <StudentFee user={currentUser} onToggleSidebar={toggleSidebar} {...sharedFilterProps} />}
        {view === 'placementSearch' && currentUser.role !== Role.STUDENT && <PlacementSearch user={currentUser} onToggleSidebar={toggleSidebar} />}
        {view === 'applicationSubmission' && currentUser.role !== Role.STUDENT && <ApplicationSubmission user={currentUser} onToggleSidebar={toggleSidebar} onDataChange={refreshData} />}
      </div>
    </div>
  );
};

export default App;