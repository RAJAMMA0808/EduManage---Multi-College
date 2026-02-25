import React, { useMemo, useState } from 'react';
import { User, College, Role } from '../types';
import { MenuIcon, BuildingOfficeIcon, DownloadIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS, FEE_STRUCTURE, DEPT_REMARKS } from '../constants';

interface CollegeFeeDetailsProps {
  user: User;
  onToggleSidebar: () => void;
  selectedCollege: College;
  setSelectedCollege: (college: College) => void;
}

const CollegeFeeDetails: React.FC<CollegeFeeDetailsProps> = ({ user, onToggleSidebar, selectedCollege, setSelectedCollege }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const collegeToDisplay = user.role === Role.STUDENT ? user.college! : (selectedCollege === College.ALL ? College.KNRR : selectedCollege);
    
    const data = useMemo(() => {
        const fullCourseNames: Record<string, string> = {
            'CSE': 'B.E. (Computer Science & Engineering)',
            'CSM': 'B.E. (Artificial Intelligence & Machine Learning)',
            'CSD': 'B.E. (Computer Science & Design)',
            'CSC': 'B.E. (Computer Science and Engineering (Cyber Security))',
            'ECE': 'B.E. (Electronics & Communication Engineering)',
            'EEE': 'B.E. (Electrical & Electronics Engineering)',
            'MECH': 'B.E. (Mechanical Engineering)',
            'CIVIL': 'B.E. (Civil Engineering)',
            'HS': 'B.E. (Humanities & Sciences)',
        };

        // FIX: Include Role.STUDENT in restricted view to enforce branch-wise visibility
        const isRestricted = user.role === Role.FACULTY || user.role === Role.HOD || user.role === Role.STUDENT;
        
        // Detect department from user profile or ID prefix
        const userDept = user.department || (user.id.match(/^[A-Z]([A-Z]{2,4})\d+/) ? user.id.match(/^[A-Z]([A-Z]{2,4})\d+/)?.[1] : null);

        let departmentsToList = isRestricted && userDept 
            ? DEPARTMENTS.filter(d => d === userDept) 
            : DEPARTMENTS;

        return departmentsToList.map(dept => {
            const fee = FEE_STRUCTURE[dept] || 0;
            return {
                branch: fullCourseNames[dept] || `B.E. (${dept})`,
                duration: dept === 'HS' ? '1st Year Common' : '4 Years',
                feeAmount: fee,
                fee: `₹ ${fee.toLocaleString('en-IN')}`,
                remarks: DEPT_REMARKS[dept] || '-',
            };
        });
    }, [user.role, user.department, user.id]);

    const handleDownload = () => {
        setIsDownloading(true);
        try {
            const headers = ['Course / Branch', 'Duration', 'Fee (Per Annum)', 'Remarks'];
            const rows = data.map(item => [
                `"${item.branch}"`,
                `"${item.duration}"`,
                `"${item.fee}"`,
                `"${item.remarks}"`
            ].join(','));

            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const safeCollegeName = COLLEGE_NAMES[collegeToDisplay].replace(/\s+/g, '_');
            link.href = url;
            link.download = `${safeCollegeName}_Fee_Structure_2025_26.csv`;
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download fee structure.");
        } finally {
            setIsDownloading(false);
        }
    };

    const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-white">Branch-wise Fee Structure</h2>
                </div>
                
                <div className="flex items-center gap-4">
                    {user.role === Role.CHAIRMAN && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="college-filter" className="text-sm font-medium text-slate-400">College:</label>
                            <select id="college-filter" value={selectedCollege} onChange={e => setSelectedCollege(e.target.value as College)} className={commonSelectClass}>
                                {Object.entries(COLLEGE_NAMES).filter(([key]) => key !== College.ALL).map(([key, name]) => <option key={key} value={key}>{name as React.ReactNode}</option>)}
                            </select>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleDownload} 
                        disabled={isDownloading} 
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-slate-600 shadow-md"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        <span>{isDownloading ? 'Downloading...' : 'Download CSV'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
                <div className="flex items-center gap-4 mb-6">
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-400" />
                    <div>
                        <h3 className="text-xl font-semibold text-white">{COLLEGE_NAMES[collegeToDisplay]}</h3>
                        <p className="text-slate-400">Fee Structure for Academic Year 2025-2026</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Course / Branch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Fee (Per Annum)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-900 divide-y divide-slate-800">
                            {data.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{item.branch}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{item.duration}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-semibold">{item.fee}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{item.remarks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default CollegeFeeDetails;