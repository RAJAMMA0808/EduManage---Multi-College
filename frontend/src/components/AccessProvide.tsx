
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, College } from '../types/index';
import { MenuIcon, CheckCircleIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS, COLLEGE_CODES } from '../constants/index';

interface AccessProvideProps {
    user: User;
    allUsers: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    onToggleSidebar: () => void;
}

const AccessProvide: React.FC<AccessProvideProps> = ({ user, allUsers, setUsers, onToggleSidebar }) => {
    const [selectedCollege, setSelectedCollege] = useState<string>(user.role === Role.CHAIRMAN ? '' : (user.college || ''));
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('All');
    const [approverIds, setApproverIds] = useState<Record<string, string>>({});

    const getDeptFromId = (id: string): string | null => {
        const match = id.trim().toUpperCase().match(/^[A-Z]([A-Z]{2,4})\d+/);
        return match ? match[1] : null;
    };

    useEffect(() => {
        const dept = user.department || getDeptFromId(user.id);
        if (dept && (user.role === Role.HOD || user.role === Role.FACULTY)) {
            setSelectedDepartment(dept);
        }
    }, [user]);

    const usersNeedingAttendance = useMemo(() => {
        const matchesCollegePrefix = (id: string, targetCollege: string) => {
            if (!targetCollege || targetCollege === '') return true;
            const prefix = COLLEGE_CODES[targetCollege as College];
            return prefix ? id.trim().toUpperCase().startsWith(prefix) : true;
        };

        return allUsers
            .filter(u => u.attendanceStatus === 'pending')
            .filter(u => {
                if (user.role === Role.CHAIRMAN || user.role === Role.PRINCIPAL) {
                    return u.id !== user.id;
                }
                return u.role === Role.STUDENT;
            })
            .filter(u => {
                if (selectedRole === 'All') return true;
                return u.role === selectedRole;
            })
            .filter(u => {
                if (user.role === Role.CHAIRMAN) {
                    return selectedCollege === '' || u.college === selectedCollege || matchesCollegePrefix(u.id, selectedCollege);
                }
                return u.college === user.college || matchesCollegePrefix(u.id, user.college || '');
            })
            .filter(u => {
                const entryDept = u.department || getDeptFromId(u.id);
                const myDept = user.department || getDeptFromId(user.id);

                if (user.role === Role.HOD || user.role === Role.FACULTY) {
                    return entryDept === myDept;
                }
                
                if (selectedDepartment === '' || selectedDepartment === 'All') return true;
                return entryDept === selectedDepartment;
            });
    }, [allUsers, selectedCollege, selectedDepartment, selectedRole, user]);

    const handleAccept = (userIdToApprove: string) => {
        const approverId = (approverIds[userIdToApprove] || '').trim();
        if (!approverId) {
            alert('Please enter an Approver ID.');
            return;
        }

        const approver = allUsers.find(u => u.id.toLowerCase() === approverId.toLowerCase());
        if (!approver || ![Role.CHAIRMAN, Role.PRINCIPAL, Role.HOD, Role.FACULTY].includes(approver.role)) {
            alert(`ID "${approverId}" is not authorized to approve biometric access.`);
            return;
        }

        setUsers(prevUsers => prevUsers.map(u => 
            u.id === userIdToApprove 
            ? { ...u, attendanceStatus: 'approved', attendanceApprovedBy: approver.id } 
            : u
        ));
        alert(`Biometric access approved for ${userIdToApprove}.`);
    };

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
                <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                    <MenuIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                    Attendance Access Provider
                </h2>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">College</label>
                        <select 
                            value={selectedCollege} 
                            onChange={(e) => setSelectedCollege(e.target.value)} 
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg block w-full p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={user.role !== Role.CHAIRMAN && user.role !== Role.PRINCIPAL}
                        >
                            <option value="">All Colleges</option>
                            {Object.entries(COLLEGE_NAMES).filter(([k]) => k !== 'ALL').map(([key, name]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
                        <select 
                            value={selectedDepartment} 
                            onChange={(e) => setSelectedDepartment(e.target.value)} 
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg block w-full p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={user.role === Role.HOD || user.role === Role.FACULTY}
                        >
                            <option value="">All Departments</option>
                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg block w-full p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="All">All Roles</option>
                            <option value={Role.STUDENT}>Student</option>
                            <option value={Role.FACULTY}>Faculty</option>
                            <option value={Role.HOD}>HOD</option>
                            <option value={Role.STAFF}>Staff</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">User Name</th>
                            <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID Number</th>
                            <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approver ID</th>
                            <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {usersNeedingAttendance.length > 0 ? (
                            usersNeedingAttendance.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{u.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">{u.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <input
                                            type="text"
                                            value={approverIds[u.id] || ''}
                                            onChange={(e) => setApproverIds(prev => ({ ...prev, [u.id]: e.target.value }))}
                                            placeholder="Authorized ID"
                                            className="bg-slate-950 border border-slate-700 text-white text-xs rounded-md px-3 py-1.5 focus:ring-blue-500 block w-full"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <button 
                                            onClick={() => handleAccept(u.id)} 
                                            className="px-4 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-500 rounded-lg transition-all"
                                        >
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="text-center py-10 text-slate-500 italic">No pending biometric authorization requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default AccessProvide;
