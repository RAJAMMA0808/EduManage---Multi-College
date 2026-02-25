
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import StudentDashboard from './components/StudentDashboard';
import Sidebar from './components/Sidebar';
import AuthLayout from './components/AuthLayout';
import CollegeComparison from './components/CollegeComparison';
import CoursesOffered from './components/CoursesOffered';
import StudentSearch from './components/StudentSearch';
import ApplicationSubmission from './components/ApplicationSubmission';
import StudentAttendance from './components/StudentAttendance';
import StudentFee from './components/StudentFee';
import { User, Role, View, College, StudentDetailsType, TranscriptView, FacultyDetailsType, StaffDetailsType } from './types/index';
import { MOCK_USERS, LATEST_ATTENDANCE_DATE, COLLEGE_CODES } from './constants/index';
import { getFilteredStudentDetails, getFilteredFacultyDetails, getFilteredStaffDetails, getStudentDetails, getFacultyDetails, getStaffDetails, getFilteredPlacementCsvData } from './services/api';
import PlacementSearch from './components/PlacementSearch';
import RemovedData from './components/RemovedData';
import AccessProvide from './components/AccessProvide';
import LoginAccessProvide from './components/LoginAccessProvide';
import Chatbot from './components/Chatbot';
import PrintTrigger from './components/PrintTrigger';
import CollegeFeeDetails from './components/CollegeFeeDetails';
import OnlineFeePayment from './components/OnlineFeePayment';
import ExamNotification from './components/ExamNotification';
import ThumbRegistrationForm from './components/ThumbRegistrationForm';
import OnlineAttendance from './components/OnlineAttendance';
import OcrComponent from './components/OcrComponent';

type AuthView = 'login' | 'register' | 'forgotPassword';

interface PrintingRequest {
    person: StudentDetailsType | FacultyDetailsType | StaffDetailsType;
    view: TranscriptView;
    semester: string;
    academicYear: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  const [selectedCollege, setSelectedCollege] = useState<College>(College.ALL);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedRollNo, setSelectedRollNo] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [printingRequest, setPrintingRequest] = useState<PrintingRequest | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<string>('');

  const [users, setUsers] = useState<User[]>(() => {
    try {
        const savedUsersRaw = localStorage.getItem('eduManageUsers');
        const currentUsers = savedUsersRaw ? JSON.parse(savedUsersRaw) as User[] : [...MOCK_USERS];
        const userMap = new Map(currentUsers.map(u => [u.id, u]));
        MOCK_USERS.forEach(mockUser => {
            if (!userMap.has(mockUser.id)) {
              userMap.set(mockUser.id, {...mockUser, status: 'approved', attendanceStatus: 'approved'});
            }
        });
        return Array.from(userMap.values());
    } catch (error) {
        return [...MOCK_USERS].map(u => ({...u, status: 'approved', attendanceStatus: 'approved'}));
    }
  });

  const [view, setView] = useState<View>('dashboard');
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => setDataVersion(prev => prev + 1);
  
  useEffect(() => {
    if (currentUser) {
        const savedImage = localStorage.getItem(`profileImage_${currentUser.id}`);
        setProfileImage(savedImage);
        
        const updated = users.find(u => u.id === currentUser.id);
        if (updated) setCurrentUser(updated);
    } else {
        setProfileImage(null);
    }
  }, [currentUser?.id, users]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === Role.CHAIRMAN) {
        setSelectedCollege(College.ALL);
      } else if (currentUser.college) {
        setSelectedCollege(currentUser.college);
      }

      if (currentUser.role === Role.HOD || currentUser.role === Role.FACULTY) {
          const match = currentUser.id.match(/^[A-Z]([A-Z]{2,4})\d+/);
          const dept = currentUser.department || (match ? match[1] : null);
          if (dept) setSelectedDepartment(dept);
      } else {
          setSelectedDepartment('all');
      }

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
  
  const handleLogin = (user: User) => {
    const prefix = user.id.charAt(0).toUpperCase();
    let derivedCollege: College | null = null;
    Object.entries(COLLEGE_CODES).forEach(([college, code]) => {
        if (code === prefix) derivedCollege = college as College;
    });

    const updatedUser = { ...user, college: derivedCollege || user.college };
    if (!updatedUser.department) {
        const match = updatedUser.id.match(/^[A-Z]([A-Z]{2,4})\d+/);
        if (match) updatedUser.department = match[1];
    }
    
    setCurrentUser(updatedUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthView('login');
  };
  
  const handleRegister = (details: any) => {
    const userExists = users.some(user => user.id.toLowerCase() === details.username.toLowerCase());
    if (userExists) {
        alert(`Username "${details.username}" is already taken.`);
        return;
    }
      
    const newUser: User = {
        id: details.username,
        name: `${details.firstName} ${details.lastName}`,
        email: details.email,
        mobileNumber: `+91${details.mobileNumber}`,
        fatherMobileNumber: details.fatherMobileNumber,
        password: details.password,
        role: details.role,
        college: details.college,
        department: details.department,
        status: 'pending',
        attendanceStatus: 'pending',
    };
    setUsers([...users, newUser]);
    alert(`Registration successful! Awaiting admin approval.`);
    setAuthView('login');
  };

  const handleResetPassword = (username: string, newPassword: string) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id.toLowerCase() === username.toLowerCase() ? { ...user, password: newPassword } : user
    ));
    alert(`Password reset for ${username}.`);
    setAuthView('login');
  };
  
  const handleProfileImageChange = (file: File) => {
    if (!currentUser) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfileImage(dataUrl);
        localStorage.setItem(`profileImage_${currentUser.id}`, dataUrl);
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
    };

    const handleDownload = async (purpose: string, options?: { facultyId?: string, staffId?: string, subject?: string }) => {
        setIsDownloading(true);
        try {
            let data: any[];
            let headers: string[];
            let rows: string[];
            let filename: string;

            if (purpose === 'dashboard' && options?.facultyId) {
                data = await getFilteredFacultyDetails(options.facultyId, selectedDate, selectedDate);
                if (data.length === 0) { alert('No data.'); setIsDownloading(false); return; }
                headers = Object.keys(data[0]);
                rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                filename = `faculty_${options.facultyId}.csv`;
            } else if (purpose === 'dashboard' && options?.staffId) {
                data = await getFilteredStaffDetails(options.staffId, selectedDate, selectedDate);
                if (data.length === 0) { alert('No data.'); setIsDownloading(false); return; }
                headers = Object.keys(data[0]);
                rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                filename = `staff_${options.staffId}.csv`;
            } else if (purpose === 'placementSearch') {
                 const pData = await getFilteredPlacementCsvData(selectedCollege, selectedYear, selectedDepartment, selectedRollNo);
                 if (pData.length === 0) { alert('No data.'); setIsDownloading(false); return; }
                 headers = Object.keys(pData[0]);
                 rows = pData.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                 filename = 'placement_report.csv';
            } else { 
                data = await getFilteredStudentDetails(selectedCollege, selectedYear, selectedDepartment, selectedRollNo, selectedDate, selectedDate, selectedSemester, options?.subject || 'All Subjects');
                if (data.length === 0) { alert('No data.'); setIsDownloading(false); return; }
                headers = ['admissionNumber', 'rollNo', 'studentName', 'collegeCode', 'programCode', 'gender', 'academicResult'];
                rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                filename = 'student_report.csv';
            }
            downloadCsv([headers.join(','), ...rows], filename);
        } catch { alert('Download failed.'); }
        finally { setIsDownloading(false); }
    };

  const handlePdfRequest = async (userId: string, payload: { view: TranscriptView, semester: string, academicYear: string }) => {
    let person: StudentDetailsType | FacultyDetailsType | StaffDetailsType | null = null;
    const userMatch = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
    if (!userMatch) return;
    if (userMatch.role === Role.STUDENT) person = await getStudentDetails(userId);
    else if (userMatch.role === Role.FACULTY) person = await getFacultyDetails(userId);
    else if (userMatch.role === Role.STAFF) person = await getStaffDetails(userId);
    if (person) setPrintingRequest({ person, ...payload });
  };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const sharedFilterProps = {
    onToggleSidebar: toggleSidebar,
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

  const renderMainView = () => {
    if (!currentUser) return null;
    
    const isAuthority = [Role.CHAIRMAN, Role.PRINCIPAL, Role.HOD, Role.FACULTY].includes(currentUser.role);

    switch(view) {
      case 'dashboard':
        if (currentUser.role === Role.STUDENT) return <StudentDashboard user={currentUser} onToggleSidebar={toggleSidebar} />;
        return <Dashboard user={currentUser} apiStatus={apiStatus} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dataVersion={dataVersion} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} />;
      case 'comparison':
        return (currentUser.role === Role.CHAIRMAN || currentUser.role === Role.PRINCIPAL) ? <CollegeComparison user={currentUser} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dataVersion={dataVersion} {...sharedFilterProps} /> : null;
      case 'courses':
        return <CoursesOffered user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'studentSearch':
        return currentUser.role !== Role.STUDENT ? <StudentSearch user={currentUser} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} selectedPlacement={selectedPlacement} setSelectedPlacement={setSelectedPlacement} /> : null;
      case 'accessProvide':
        return isAuthority ? <AccessProvide user={currentUser} allUsers={users} setUsers={setUsers} onToggleSidebar={toggleSidebar} /> : null;
      case 'loginAccessProvide':
        return isAuthority ? <LoginAccessProvide user={currentUser} allUsers={users} setUsers={setUsers} onToggleSidebar={toggleSidebar} /> : null;
      case 'studentAttendance':
         return currentUser.role !== Role.STUDENT ? <StudentAttendance user={currentUser} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} /> : null;
      case 'studentFee':
         return currentUser.role !== Role.STUDENT ? <StudentFee user={currentUser} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} /> : null;
      case 'placementSearch':
         return currentUser.role !== Role.STUDENT ? <PlacementSearch user={currentUser} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} /> : null;
      case 'applicationSubmission':
        return currentUser.role !== Role.STUDENT ? <ApplicationSubmission user={currentUser} onToggleSidebar={toggleSidebar} onDataChange={refreshData} /> : null;
      case 'collegeFeeDetails':
        return <CollegeFeeDetails user={currentUser} onToggleSidebar={toggleSidebar} selectedCollege={selectedCollege} setSelectedCollege={setSelectedCollege} />;
      case 'onlineFeePayment':
        return <OnlineFeePayment user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'examNotification':
        return <ExamNotification user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'thumbRegistration':
        return <ThumbRegistrationForm user={currentUser} onToggleSidebar={toggleSidebar} onSubmitSuccess={() => setView('accessProvide')} setUsers={setUsers} />;
      case 'onlineAttendance':
        return <OnlineAttendance user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'removedData':
        return (currentUser.role === Role.CHAIRMAN || currentUser.role === Role.PRINCIPAL) ? <RemovedData user={currentUser} onToggleSidebar={toggleSidebar} /> : null;
      case 'ocr':
        return <OcrComponent onToggleSidebar={toggleSidebar} />;
      default:
        return null;
    }
  }

  return (
    <>
      {!currentUser ? (
        <AuthLayout>
          {authView === 'register' ? <Register onRegister={handleRegister} switchToLogin={() => setAuthView('login')} /> :
           authView === 'forgotPassword' ? <ForgotPassword onResetPassword={handleResetPassword} switchToLogin={() => setAuthView('login')} users={users} /> :
           <Login onLogin={handleLogin} users={users} switchToRegister={() => setAuthView('register')} switchToForgotPassword={() => setAuthView('forgotPassword')} />}
        </AuthLayout>
      ) : (
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
            setSelectedCollege={setSelectedCollege}
          />
          <div className="flex-1 flex flex-col overflow-y-auto">
            {renderMainView()}
          </div>
        </div>
      )}
      <Chatbot users={users} onPdfRequest={handlePdfRequest} loggedInUser={currentUser}/>
      {printingRequest && <PrintTrigger request={printingRequest} onDone={() => setPrintingRequest(null)} />}
    </>
  );
};

export default App;
