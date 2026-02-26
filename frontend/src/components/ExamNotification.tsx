
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { MenuIcon, DocumentIcon, BellIcon, TrashIcon, DownloadIcon } from './icons';
import { DEPARTMENTS } from '../constants';
import { viewPdf, downloadPdf } from '../utils/pdfUtils';

interface ExamNotificationProps {
  user: User;
  onToggleSidebar: () => void;
}

interface Notification {
    id: number;
    title: string;
    department: string; // 'All' or specific dept
    lastDate: string;
    uploadDate: string; // ISO string
    fileName: string;
    fileUrl: string; // Mock URL or blob URL
    isNew: boolean;
}

// A small valid PDF Data URL for mock data
const SAMPLE_PDF_DATA = "data:application/pdf;base64,JVBERi0xLjQKJfbk/N8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFszIDAgUl0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgo3MiA3MjAgVGQKKEV4YW0gTm90aWZpY2F0aW9uIFNhbXBsZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA3NyAwMDAwMCBuIAowMDAwMDAwMTU4IDAwMDAwIG4gCjAwMDAwMDAzMDcgMDAwMDAgbiAKMDAwMDAwMDM5NCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ4OQolJUVPRgo=";

// Mock initial data
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        title: "B.Tech 4-1 Semester Regular/Supply Exams Notification",
        department: "All",
        lastDate: "2025-12-31",
        uploadDate: "2025-12-16T10:00:00Z", 
        fileName: "JNTUH_BTech_4-1_Exams_Notification_Dec_2025.pdf",
        fileUrl: SAMPLE_PDF_DATA, 
        isNew: true
    }
];

const ExamNotification: React.FC<ExamNotificationProps> = ({ user, onToggleSidebar }) => {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const stored = localStorage.getItem('exam_notifications');
            if (stored !== null) {
                return JSON.parse(stored);
            } else {
                localStorage.setItem('exam_notifications', JSON.stringify(MOCK_NOTIFICATIONS));
                return MOCK_NOTIFICATIONS;
            }
        } catch (e) {
            return MOCK_NOTIFICATIONS;
        }
    });

    // PERMISSION LOGIC:
    // Delete is available for Chairman, Principal, and HOD.
    // Open and Download are available for everyone.
    const canDelete = [Role.CHAIRMAN, Role.PRINCIPAL, Role.HOD].includes(user.role);

    useEffect(() => {
        const checkNew = (dateStr: string) => {
            const uploadTime = new Date(dateStr).getTime();
            const fiveDaysAgo = Date.now() - (5 * 24 * 60 * 60 * 1000);
            return uploadTime > fiveDaysAgo;
        };
        setNotifications(prev => prev.map(n => ({...n, isNew: checkNew(n.uploadDate)})));
    }, []);

    const handleDelete = (id: number) => {
        if(window.confirm("Are you sure you want to delete this notification?")) {
            const updatedNotifications = notifications.filter(n => n.id !== id);
            setNotifications(updatedNotifications);
            localStorage.setItem('exam_notifications', JSON.stringify(updatedNotifications)); 
        }
    }

    const handleDownload = (notification: Notification) => {
        downloadPdf(notification.fileUrl, notification.fileName);
    };

    const handleOpen = (notification: Notification) => {
        viewPdf(notification.fileUrl);
    };

    // Filter notifications based on user department
    const filteredNotifications = notifications.filter(n => {
        if (user.role === Role.STUDENT) {
             const match = user.id.match(/^[A-Z]([A-Z]{2,4})\d+/);
             const userDept = match ? match[1] : null;
             return n.department === 'All' || n.department === userDept;
        }
        return true; 
    });

    // Group by department
    const groupedNotifications: Record<string, Notification[]> = {};
    ['All', ...DEPARTMENTS].forEach(d => { groupedNotifications[d] = []; });

    filteredNotifications.forEach(n => {
        if (!groupedNotifications[n.department]) {
            groupedNotifications[n.department] = [];
        }
        groupedNotifications[n.department].push(n);
    });

    // Helper to determine if flag should actvie (Date hasn't passed)
    const isDateActive = (lastDate: string) => {
        const today = new Date();
        const examDate = new Date(lastDate);
        return today <= examDate;
    };

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
             <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                            Exam Notification Fees Last Date 
                        </h2>
                        <p className="text-slate-400 mt-1 text-sm">View official exam notifications and fee payment deadlines.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* General Notifications Section */}
                {groupedNotifications['All'].length > 0 && (
                     <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
                             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <BellIcon className="h-5 w-5 text-yellow-500" />
                                General Notifications (All Branches)
                             </h3>
                        </div>
                        <div className="divide-y divide-slate-800/50">
                            {groupedNotifications['All'].map(n => (
                                <div key={n.id} className="p-6 bg-slate-900 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-base font-bold text-blue-500 hover:underline cursor-pointer" onClick={() => handleOpen(n)}>{n.title}</h4>
                                            {/* Flag only appears if active date and recent upload */}
                                            {n.isNew && isDateActive(n.lastDate) && (
                                                <span className="new-flag flag-animate">NEW</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                                            <DocumentIcon className="h-4 w-4" />
                                            <span>{n.fileName}</span>
                                            <span className="text-slate-600">|</span>
                                            <span>Uploaded: {new Date(n.uploadDate).toLocaleDateString('en-GB')}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                                        {/* LAST DATE BOX */}
                                        <div className="flex flex-col items-center justify-center bg-[#1a0b0b] border border-red-900/30 px-4 py-1.5 rounded w-28">
                                            <p className="text-[9px] text-[#ff5555] font-bold uppercase tracking-wider mb-0.5">LAST DATE</p>
                                            <p className="text-sm font-bold text-white tracking-wide">{new Date(n.lastDate).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleOpen(n)} 
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
                                            >
                                                View PDF
                                            </button>

                                            <button 
                                                onClick={() => handleDownload(n)} 
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md" 
                                            >
                                                <DownloadIcon className="h-4 w-4" />
                                                <span>Download</span>
                                            </button>
                                            
                                            {canDelete && (
                                                <button 
                                                    onClick={() => handleDelete(n.id)} 
                                                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors shadow-md"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                )}

                {/* Other Departments */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {Object.keys(groupedNotifications).filter(d => d !== 'All').map(dept => {
                         const deptNotifs = groupedNotifications[dept];
                         if (deptNotifs.length === 0) return null;

                         return (
                            <div key={dept} className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col">
                                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800">
                                    <h3 className="font-bold text-white">{dept} Notifications</h3>
                                </div>
                                <div className="divide-y divide-slate-800 flex-grow">
                                    {deptNotifs.map(n => (
                                        <div key={n.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                                            <div className="mb-3">
                                                <div className="flex items-start gap-2">
                                                    <h5 className="text-sm font-bold text-blue-400 line-clamp-2 leading-snug cursor-pointer hover:underline" onClick={() => handleOpen(n)}>{n.title}</h5>
                                                    {n.isNew && isDateActive(n.lastDate) && (
                                                        <span className="new-flag flex-shrink-0 flag-animate">NEW</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-end">
                                                 <div className="flex flex-col items-center justify-center bg-[#1a0b0b] border border-red-900/30 px-3 py-1 rounded">
                                                    <p className="text-[8px] text-[#ff5555] font-bold uppercase">LAST DATE</p>
                                                    <p className="text-xs font-bold text-white">{new Date(n.lastDate).toLocaleDateString('en-GB')}</p>
                                                 </div>
                                                 
                                                 <div className="flex gap-2 items-center">
                                                     <button 
                                                        onClick={() => handleOpen(n)} 
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-white text-xs font-bold shadow-md"
                                                     >
                                                        View PDF
                                                     </button>
                                                     <button 
                                                        onClick={() => handleDownload(n)} 
                                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-bold shadow-md" 
                                                     >
                                                        <DownloadIcon className="h-3.5 w-3.5" />
                                                        <span>Download</span>
                                                     </button>
                                                     {canDelete && (
                                                         <button 
                                                            onClick={() => handleDelete(n.id)} 
                                                            className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white shadow-md"
                                                         >
                                                             <TrashIcon className="h-4 w-4" />
                                                         </button>
                                                     )}
                                                 </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         );
                    })}
                </div>
            </div>
        </main>
    );
};

export default ExamNotification;
