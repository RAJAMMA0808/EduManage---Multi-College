import React, { useRef, useState, useEffect } from 'react';
import { User, Role, View, College } from '../types/index';
import { 
    LogoutIcon, AcademicCapIcon, ChartBarIcon, BookOpenIcon, SearchIcon, 
    CameraIcon, XMarkIcon, UploadIcon, CurrencyDollarIcon, TrashIcon, UserCheckIcon,
    CreditCardIcon, BellIcon, CheckCircleIcon, DocumentIcon
} from './icons';
import { COLLEGE_NAMES } from '../constants/index';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  view: View;
  setView: (view: View) => void;
  profileImage: string | null;
  onProfileImageChange: (file: File) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setSelectedCollege: (college: College) => void;
}

const SidebarContent: React.FC<Omit<SidebarProps, 'isOpen' | 'setIsOpen'>> = ({ 
    user, onLogout, view, setView, profileImage, onProfileImageChange, setSelectedCollege 
}) => {
  
  const navItemClass = (itemView: View) => 
    `flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm font-medium ${
      view === itemView ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasActiveNotifications, setHasActiveNotifications] = useState(false);

  useEffect(() => {
      try {
          const stored = localStorage.getItem('exam_notifications');
          if (stored) {
              const notifications = JSON.parse(stored);
              const today = new Date();
              const hasActive = notifications.some((n: any) => n.isNew && new Date(n.lastDate) >= today);
              setHasActiveNotifications(hasActive);
          }
      } catch (e) {
          setHasActiveNotifications(false);
      }
  }, []);

  const handleImageClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onProfileImageChange(e.target.files[0]);
      }
  };

  const canSeeAccessProvide = [Role.CHAIRMAN, Role.PRINCIPAL, Role.HOD, Role.FACULTY].includes(user.role);
  const canSeeOnlinePayment = [Role.STUDENT, Role.PRINCIPAL, Role.CHAIRMAN, Role.STAFF].includes(user.role);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6 px-3">
        <AcademicCapIcon className="h-8 w-8 text-blue-400" />
        <h1 className="text-xl font-bold text-white">EduManage</h1>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="text-center px-3">
            <div 
              className="relative w-20 h-20 rounded-full bg-slate-700 mx-auto mb-3 flex items-center justify-center font-bold text-2xl border-2 border-slate-600 group cursor-pointer"
              onClick={handleImageClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleImageClick()}
              aria-label="Change profile picture"
            >
              {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                  <span className="text-slate-300">{user.name.charAt(0)}</span>
              )}
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity">
                  <CameraIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
            />
            <h2 className="font-semibold text-lg text-white">{user.name}</h2>
            <p className="text-sm text-slate-400 capitalize">{user.role.toLowerCase()}</p>
            {user.college && (
              <p className="text-sm text-blue-400 mt-1 font-semibold">{COLLEGE_NAMES[user.college]}</p>
            )}
        </div>

        <hr className="border-slate-700 my-4" />

        <nav className="space-y-1 px-3">
            <div role="button" tabIndex={0} onClick={() => setView('dashboard')} onKeyDown={(e) => e.key === 'Enter' && setView('dashboard')} className={navItemClass('dashboard')}>
              <AcademicCapIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </div>

            {/* Online Attendance - Available for all roles */}
            <div role="button" tabIndex={0} onClick={() => setView('onlineAttendance')} onKeyDown={(e) => e.key === 'Enter' && setView('onlineAttendance')} className={navItemClass('onlineAttendance')}>
                <CheckCircleIcon className="h-5 w-5" />
                <span>Online Attendance</span>
            </div>

            {canSeeAccessProvide && (
              <>
                <div role="button" tabIndex={0} onClick={() => setView('loginAccessProvide')} onKeyDown={(e) => e.key === 'Enter' && setView('loginAccessProvide')} className={navItemClass('loginAccessProvide')}>
                    <UserCheckIcon className="h-5 w-5" />
                    <span>Login Access Provide</span>
                </div>
                <div role="button" tabIndex={0} onClick={() => setView('accessProvide')} onKeyDown={(e) => e.key === 'Enter' && setView('accessProvide')} className={navItemClass('accessProvide')}>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Attendance Access Provide</span>
                </div>
              </>
            )}
            
            <div role="button" tabIndex={0} onClick={() => setView('thumbRegistration')} onKeyDown={(e) => e.key === 'Enter' && setView('thumbRegistration')} className={navItemClass('thumbRegistration')}>
                <CameraIcon className="h-5 w-5" />
                <span>Thumb Registration Form</span>
            </div>

            {user.role !== Role.STUDENT && (
              <>
                <div role="button" tabIndex={0} onClick={() => setView('studentSearch')} onKeyDown={(e) => e.key === 'Enter' && setView('studentSearch')} className={navItemClass('studentSearch')}>
                    <SearchIcon className="h-5 w-5" />
                    <span>Student Information Search</span>
                </div>
                <div role="button" tabIndex={0} onClick={() => setView('applicationSubmission')} onKeyDown={(e) => e.key === 'Enter' && setView('applicationSubmission')} className={navItemClass('applicationSubmission')}>
                    <UploadIcon className="h-5 w-5" />
                    <span>Data Submission</span>
                </div>
                {/* FIX: Added navigation item for Intelligence OCR portal to handle automated marks extraction */}
                <div role="button" tabIndex={0} onClick={() => setView('ocr')} onKeyDown={(e) => e.key === 'Enter' && setView('ocr')} className={navItemClass('ocr')}>
                    <DocumentIcon className="h-5 w-5" />
                    <span>Intelligence OCR</span>
                </div>
              </>
            )}

            <div role="button" tabIndex={0} onClick={() => setView('courses')} onKeyDown={(e) => e.key === 'Enter' && setView('courses')} className={navItemClass('courses')}>
              <BookOpenIcon className="h-5 w-5" />
              <span>Courses</span>
            </div>
            
            <div role="button" tabIndex={0} onClick={() => setView('examNotification')} onKeyDown={(e) => e.key === 'Enter' && setView('examNotification')} className={navItemClass('examNotification')}>
                <BellIcon className="h-5 w-5" />
                <span className="flex-grow text-left">Exam Notification Date</span>
                {hasActiveNotifications && <span className="new-flag flag-animate">NEW</span>}
            </div>

            <div role="button" tabIndex={0} onClick={() => setView('collegeFeeDetails')} onKeyDown={(e) => e.key === 'Enter' && setView('collegeFeeDetails')} className={navItemClass('collegeFeeDetails')}>
              <CurrencyDollarIcon className="h-5 w-5" />
              <span>Fee Structure</span>
            </div>
            
            {(user.role === Role.CHAIRMAN || user.role === Role.PRINCIPAL) && (
              <div role="button" tabIndex={0} onClick={() => { 
                  setView('comparison'); 
                  if (user.role === Role.CHAIRMAN) {
                      setSelectedCollege(College.ALL);
                  }
                }} onKeyDown={(e) => { if(e.key === 'Enter') { setView('comparison'); if (user.role === Role.CHAIRMAN) { setSelectedCollege(College.ALL); }}}} className={navItemClass('comparison')}>
                <ChartBarIcon className="h-5 w-5" />
                <span>Comparison</span>
              </div>
            )}
            
            {canSeeOnlinePayment && (
                <div role="button" tabIndex={0} onClick={() => setView('onlineFeePayment')} onKeyDown={(e) => e.key === 'Enter' && setView('onlineFeePayment')} className={navItemClass('onlineFeePayment')}>
                  <CreditCardIcon className="h-5 w-5" />
                  <span>Online Fee Payment</span>
                </div>
            )}

            {(user.role === Role.CHAIRMAN || user.role === Role.PRINCIPAL) && (
                <div role="button" tabIndex={0} onClick={() => setView('removedData')} onKeyDown={(e) => e.key === 'Enter' && setView('removedData')} className={navItemClass('removedData')}>
                    <TrashIcon className="h-5 w-5" />
                    <span>Removed Data</span>
                </div>
            )}
        </nav>
      </div>
      
      <div className="px-3 mt-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          <LogoutIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { isOpen, setIsOpen } = props;

    return (
        <>
            <aside className="w-64 bg-slate-900 p-4 flex-col hidden md:flex">
                <SidebarContent {...props} />
            </aside>

            <div className={`fixed inset-0 z-40 transition-transform transform md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="relative w-64 h-full bg-slate-900 p-4 flex flex-col shadow-xl">
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                    <SidebarContent {...props} />
                </div>
            </div>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </>
    );
};

export default Sidebar;