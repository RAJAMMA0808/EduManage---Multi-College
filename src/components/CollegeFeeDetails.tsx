import React from 'react';
import { User, College, Role } from '../types';
import { MenuIcon, BuildingOfficeIcon } from './icons';
import { COLLEGE_NAMES } from '../constants';

interface CollegeFeeDetailsProps {
  user: User;
  onToggleSidebar: () => void;
  selectedCollege: College;
  setSelectedCollege: (college: College) => void;
}

const feeDataByCollege: Record<string, { branch: string; duration: string; fee: string; remarks: string }[]> = {
  [College.KNRR]: [
    { branch: 'B.E. (Computer Science & Engineering)', duration: '4 Years', fee: '₹ 1,20,000', remarks: 'Most popular specialization' },
    { branch: 'B.E. (Artificial Intelligence & Machine Learning)', duration: '4 Years', fee: '₹ 1,25,000', remarks: 'AI & ML focused program' },
    { branch: 'B.E. (Electronics & Communication Engineering)', duration: '4 Years', fee: '₹ 1,10,000', remarks: '-' },
    { branch: 'B.E. (Electrical & Electronics Engineering)', duration: '4 Years', fee: '₹ 1,05,000', remarks: '-' },
    { branch: 'B.E. (Mechanical Engineering)', duration: '4 Years', fee: '₹ 1,00,000', remarks: '-' },
    { branch: 'B.E. (Civil Engineering)', duration: '4 Years', fee: '₹ 95,000', remarks: '-' },
    { branch: 'B.E. (Computer Science & Design)', duration: '4 Years', fee: '₹ 1,15,000', remarks: 'Specialized CSE stream' },
  ],
  [College.BRIL]: [
    { branch: 'B.E. (Computer Science & Engineering)', duration: '4 Years', fee: '₹ 1,15,000', remarks: 'High demand course' },
    { branch: 'B.E. (Electronics & Communication Engineering)', duration: '4 Years', fee: '₹ 1,05,000', remarks: '-' },
    { branch: 'B.E. (Electrical & Electronics Engineering)', duration: '4 Years', fee: '₹ 1,00,000', remarks: '-' },
  ],
  [College.BRIG]: [
    { branch: 'B.E. (Computer Science & Engineering)', duration: '4 Years', fee: '₹ 1,18,000', remarks: 'Flagship program' },
    { branch: 'B.E. (AI & ML)', duration: '4 Years', fee: '₹ 1,22,000', remarks: 'Industry-aligned curriculum' },
    { branch: 'B.E. (Mechanical Engineering)', duration: '4 Years', fee: '₹ 98,000', remarks: '-' },
  ],
};

const CollegeFeeDetails: React.FC<CollegeFeeDetailsProps> = ({ user, onToggleSidebar, selectedCollege, setSelectedCollege }) => {
    const collegeToDisplay = selectedCollege === College.ALL ? (user.college || College.KNRR) : selectedCollege;
    const data = feeDataByCollege[collegeToDisplay] || feeDataByCollege[College.KNRR];

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
                {user.role === Role.CHAIRMAN && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="college-filter" className="text-sm font-medium text-slate-400">College:</label>
                        <select id="college-filter" value={selectedCollege} onChange={e => setSelectedCollege(e.target.value as College)} className={commonSelectClass}>
                            {Object.entries(COLLEGE_NAMES).filter(([key]) => key !== College.ALL).map(([key, name]) => <option key={key} value={key}>{name as React.ReactNode}</option>)}
                        </select>
                    </div>
                )}
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