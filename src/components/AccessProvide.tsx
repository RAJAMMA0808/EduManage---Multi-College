
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

    const showData = useMemo(() => {
        return [Role.CHAIRMAN, Role.PRINCIPAL, Role.HOD, Role.FACULTY].includes(user.role);
    }, [user.role]);

    const usersNeedingAttendance = useMemo(() => {
        if (!showData) return [];

        const matchesCollegePrefix = (id: string, targetCollege: College | string) => {
            if (!targetCollege || targetCollege === 'All' || targetCollege === '') return true;
            const prefix = COLLEGE_CODES[targetCollege as College];
            return prefix ? id.trim().toUpperCase().startsWith(prefix) : true;
        };

        return allUsers
            .filter(u => u.attendanceStatus === 'pending')
            .filter(u => {
                // Principals and Chairman see everyone
                if (user.role === Role.CHAIRMAN || user.role === Role.PRINCIPAL) {
                    return u.id !== user.id;
                }
                // HODs and Faculty only see students
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
                
                // Allow empty or "All" to show everything for Chairman/Principal
                if (selectedDepartment === '' || selectedDepartment === 'All' || selectedDepartment === 'all') return true;
                
                return entryDept === selectedDepartment;
            });
    }, [allUsers, selectedCollege, selectedDepartment, selectedRole, user, showData]);

    const handleAccept = (userIdToApprove: string) => {
        const approverId = (approverIds[userIdToApprove] || '').trim();
        if (!approverId) {
            alert('Please enter an Approver ID (Authorized Staff ID).');
            return;
        }

        const approver = allUsers.find(u => u.id.toLowerCase() === approverId.toLowerCase());
        
        if (!approver) {
            alert(`Error: Staff ID "${approverId}" not found in system.`);
            return;
        }
        
        const canApprove = [Role.CHAIRMAN, Role.PRINCIPAL, Role.HOD, Role.FACULTY].includes(approver.role);
        if (!canApprove) {
            alert(`Access Denied: ${approver.name} (${approver.role}) does not have approval authority.`);
            return;
        }

        setUsers(prevUsers => prevUsers.map(u => 
            u.id === userIdToApprove 
            ? { ...u, attendanceStatus: 'approved', attendanceApprovedBy: approver.id } 
            : u
        ));
        alert(`Attendance access approved for ${userIdToApprove} by ${approver.id}.`);
    };

    const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-colors hover:bg-slate-700";
    
    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex items-center gap-4 mb-2">
                <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg">
                        <CheckCircleIcon className="h-7 w-7 text-blue-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white underline decoration-slate-600 underline-offset-8 decoration-2">Attendance Access Provider</h2>
                </div>
            </div>
            <p className="text-slate-400 mb-8 ml-14">Authorizing biometric attendance training data for access.</p>

            <div className="bg-[#1e293b]/40 backdrop-blur-sm p-8 rounded-2xl border border-slate-800/50 mb-8 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Filter by College</label>
                        <select 
                            value={selectedCollege} 
                            onChange={(e) => setSelectedCollege(e.target.value)} 
                            className={commonSelectClass} 
                            disabled={user.role !== Role.CHAIRMAN && user.role !== Role.PRINCIPAL}
                        >
                            <option value="">All Colleges</option>
                            {Object.entries(COLLEGE_NAMES).filter(([k]) => k !== 'ALL').map(([key, name]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Filter by Department</label>
                        <select 
                            value={selectedDepartment} 
                            onChange={(e) => setSelectedDepartment(e.target.value)} 
                            className={commonSelectClass} 
                            disabled={user.role === Role.HOD || user.role === Role.FACULTY}
                        >
                            <option value="">All Departments</option>
                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Filter by Role</label>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className={commonSelectClass}>
                            <option value="All">All Roles</option>
                            <option value={Role.STUDENT}>Student</option>
                            <option value={Role.FACULTY}>Faculty</option>
                            <option value={Role.HOD}>HOD</option>
                            <option value={Role.STAFF}>Staff</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-800 overflow-hidden mb-20">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-[#1f2937]/50 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">USER NAME</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">REGISTRATION ID</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">FATHER'S MOBILE</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">APPROVER ID</th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-800/50">
                            {usersNeedingAttendance.length > 0 ? (
                                usersNeedingAttendance.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-100">{u.name}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-400 font-mono tracking-tight">{u.id}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-400">{u.fatherMobileNumber || '-'}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                                            <input
                                                type="text"
                                                value={approverIds[u.id] || ''}
                                                onChange={(e) => setApproverIds(prev => ({ ...prev, [u.id]: e.target.value }))}
                                                placeholder="Enter Authorized ID"
                                                className="bg-[#1e293b] border border-slate-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 outline-none"
                                            />
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-center">
                                            <button 
                                                onClick={() => handleAccept(u.id)} 
                                                className="px-6 py-2 text-xs font-bold text-white bg-[#22c55e] hover:bg-[#16a34a] rounded-lg transition-all shadow-lg shadow-green-900/20 disabled:opacity-30"
                                                disabled={!approverIds[u.id]?.trim()}
                                            >
                                                Approve Access
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-slate-500 italic">No pending biometric authorization requests found.</td>
                                </tr>
                            )}
                         </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default AccessProvide;
