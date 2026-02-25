import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
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
import { MOCK_USERS, LATEST_ATTENDANCE_DATE } from './constants/index';
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
        console.error("Failed to initialize users from localStorage, falling back to default.", error);
        return [...MOCK_USERS].map(u => ({...u, status: 'approved', attendanceStatus: 'approved'}));
    }
  });

  const [view, setView] = useState<View>('dashboard');
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => setDataVersion(prev => prev + 1);
  
  useEffect(() => {
    if (currentUser) {
        const updated = users.find(u => u.id === currentUser.id);
        if (updated) setCurrentUser(updated);
    }
  }, [users]);

  useEffect(() => {
    const checkApiHealth = async () => {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                const data = await response.json();
                console.log('API Health Check OK:', data);
                setApiStatus('connected');
            } else {
                throw new Error(`API health check failed with status: ${response.status}`);
            }
        } catch (error) {
            console.warn('API Health Check Failed:', error);
            setApiStatus('disconnected');
        }
    };
    checkApiHealth();
  }, []);
  
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== Role.CHAIRMAN && currentUser.college) {
        setSelectedCollege(currentUser.college);
      } else {
        setSelectedCollege(College.ALL);
      }

      if (currentUser.role === Role.HOD || currentUser.role === Role.FACULTY) {
          const match = currentUser.id.match(/^[A-Z]([A-Z]{2,4})\d+/);
          const deptFromId = match ? match[1] : null;
          const dept = currentUser.department || deptFromId;
          if (dept) {
              setSelectedDepartment(dept);
          }
      } else if (currentUser.role === Role.STUDENT) {
           const match = currentUser.id.match(/^[A-Z]([A-Z]{2,4})\d+/);
           const deptFromId = match ? match[1] : null;
           if (deptFromId) {
               setSelectedDepartment(deptFromId);
           }
      } else {
          setSelectedDepartment('all');
      }

      setSelectedYear('all');
      setSelectedSemester('all');
      setSelectedRollNo('all');

    } else {
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

  useEffect(() => {
    if (currentUser) {
        document.body.classList.add('app-view');
        document.body.classList.remove('auth-view');
    } else {
        document.body.classList.add('auth-view');
        document.body.classList.remove('app-view');
    }
  }, [currentUser]);

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
        department: details.department,
        fatherMobileNumber: details.fatherMobileNumber,
        status: 'pending',
        attendanceStatus: 'pending',
    };
    setUsers([...users, newUser]);
    alert(`Registration successful for ${newUser.name}! Your request has been sent for approval.`);
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

    const handleDownload = async (purpose: string, options?: { facultyId?: string, staffId?: string, subject?: string }) => {
        setIsDownloading(true);
        try {
            let data: any[];
            let headers: string[];
            let rows: string[];
            let filename: string;

            if (purpose === 'dashboard' && options?.facultyId) {
                data = await getFilteredFacultyDetails(options.facultyId, selectedDate, selectedDate);
                if (data.length === 0) {
                    alert('No faculty data found.');
                    setIsDownloading(false);
                    return;
                }
                headers = Object.keys(data[0]);
                rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                filename = `faculty_${options.facultyId}_data.csv`;
            } else if (purpose === 'dashboard' && options?.staffId) {
                data = await getFilteredStaffDetails(options.staffId, selectedDate, selectedDate);
                if (data.length === 0) {
                    alert('No staff data found.');
                    setIsDownloading(false);
                    return;
                }
                headers = Object.keys(data[0]);
                rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                filename = `staff_${options.staffId}_data.csv`;
            } else if (purpose === 'placementSearch') {
                 const placementData = await getFilteredPlacementCsvData(selectedCollege, selectedYear, selectedDepartment, selectedRollNo);
                 if (placementData.length === 0) { alert('No placement data to download for the current filters.'); setIsDownloading(false); return; }
                 headers = Object.keys(placementData[0]);
                 rows = placementData.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                 filename = 'placement_report.csv';
            } else { 
                data = await getFilteredStudentDetails(selectedCollege, selectedYear, selectedDepartment, selectedRollNo, selectedDate, selectedDate, selectedSemester, options?.subject || 'All Subjects');
                if (data.length === 0) {
                    alert('No student marks data to download for the current filters.');
                    setIsDownloading(false);
                    return;
                }
                headers = ['admissionNumber', 'rollNo', 'studentName', 'collegeCode', 'programCode', 'gender', 'academicResult'];
                rows = data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','));
                filename = 'student_marks_report.csv';
            }
            downloadCsv([headers.join(','), ...rows], filename);
        } catch (error) { 
            console.error("CSV Download failed:", error); 
            alert('Download failed.');
        } finally { 
            setIsDownloading(false); 
        }
    };

  const handlePdfRequest = async (userId: string, payload: { view: TranscriptView, semester: string, academicYear: string }) => {
    let personDetails: StudentDetailsType | FacultyDetailsType | StaffDetailsType | null = null;
    
    const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
    if (!user) {
      alert("Could not find user details to generate PDF.");
      return;
    }
    
    if (user.role === Role.STUDENT) {
        personDetails = await getStudentDetails(userId);
    } else if (user.role === Role.FACULTY) {
        personDetails = await getFacultyDetails(userId);
    } else if (user.role === Role.STAFF) {
        personDetails = await getStaffDetails(userId);
    }

    if (personDetails) {
        setPrintingRequest({
            person: personDetails,
            ...payload
        });
    } else {
        alert("Could not find details to generate PDF.");
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
    
    const isChairmanOrPrincipal = currentUser.role === Role.CHAIRMAN || currentUser.role === Role.PRINCIPAL;
    const canSeeAccessProvide = isChairmanOrPrincipal || currentUser.role === Role.HOD || currentUser.role === Role.FACULTY;

    switch(view) {
      case 'dashboard':
        if (currentUser.role === Role.STUDENT) {
            return <StudentDashboard user={currentUser} onToggleSidebar={toggleSidebar} />;
        }
        return <Dashboard user={currentUser} apiStatus={apiStatus} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dataVersion={dataVersion} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} />;
      case 'comparison':
        return isChairmanOrPrincipal && <CollegeComparison user={currentUser} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dataVersion={dataVersion} {...sharedFilterProps} />;
      case 'courses':
        return <CoursesOffered user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'collegeFeeDetails':
        return <CollegeFeeDetails user={currentUser} onToggleSidebar={toggleSidebar} selectedCollege={selectedCollege} setSelectedCollege={setSelectedCollege} />;
      case 'studentSearch':
        return currentUser.role !== Role.STUDENT && <StudentSearch user={currentUser} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} selectedPlacement={selectedPlacement} setSelectedPlacement={setSelectedPlacement} />;
      case 'studentAttendance':
         return currentUser.role !== Role.STUDENT && <StudentAttendance user={currentUser} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} />;
      case 'studentFee':
         return currentUser.role !== Role.STUDENT && <StudentFee user={currentUser} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} />;
      case 'placementSearch':
         return currentUser.role !== Role.STUDENT && <PlacementSearch user={currentUser} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} />;
      case 'applicationSubmission':
        return currentUser.role !== Role.STUDENT && <ApplicationSubmission user={currentUser} onToggleSidebar={toggleSidebar} onDataChange={refreshData} />;
      case 'onlineFeePayment':
        return <OnlineFeePayment user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'removedData':
        return isChairmanOrPrincipal && <RemovedData user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'accessProvide':
        return canSeeAccessProvide && <AccessProvide user={currentUser} allUsers={users} setUsers={setUsers} onToggleSidebar={toggleSidebar} />;
      case 'loginAccessProvide':
        return canSeeAccessProvide && <LoginAccessProvide user={currentUser} allUsers={users} setUsers={setUsers} onToggleSidebar={toggleSidebar} />;
      case 'examNotification':
        return <ExamNotification user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'thumbRegistration':
        return <ThumbRegistrationForm user={currentUser} onToggleSidebar={toggleSidebar} onSubmitSuccess={() => setView('accessProvide')} setUsers={setUsers} />;
      case 'onlineAttendance':
        return <OnlineAttendance user={currentUser} onToggleSidebar={toggleSidebar} />;
      case 'ocr':
        return <OcrComponent onToggleSidebar={toggleSidebar} />;
      default:
        if (currentUser.role === Role.STUDENT) {
            return <StudentDashboard user={currentUser} onToggleSidebar={toggleSidebar} />;
        }
        return <Dashboard user={currentUser} apiStatus={apiStatus} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dataVersion={dataVersion} {...sharedFilterProps} onDownload={handleDownload} isDownloading={isDownloading} />;
    }
  }

  return (
    <>
      {!currentUser ? (
        <AuthLayout>
          {renderAuthComponent()}
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
