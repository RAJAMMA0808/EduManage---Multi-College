
import React, { useState, useMemo } from 'react';
import { User, Role, College } from '../types/index';
import { MenuIcon, UserCheckIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS } from '../constants/index';

interface LoginAccessProvideProps {
    user: User;
    allUsers: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    onToggleSidebar: () => void;
}

const LoginAccessProvide: React.FC<LoginAccessProvideProps> = ({ user, allUsers, setUsers, onToggleSidebar }) => {
    const [selectedCollege, setSelectedCollege] = useState<string>(user.role === Role.CHAIRMAN ? '' : (user.college || ''));
    const [selectedDepartment, setSelectedDepartment] = useState<string>(user.department || '');
    const [selectedRole, setSelectedRole] = useState<string>('All');

    /**
     * STRICT APPROVAL WORKFLOW LOGIC:
     * 1. Faculty/HOD/Staff Requests -> Visible to Chairman and College Principal.
     * 2. Student Requests -> Visible to College Principal and Department HOD.
     */
    const pendingUsers = useMemo(() => {
        return allUsers
            .filter(u => u.status === 'pending')
            .filter(candidate => {
                const isAuthorityReq = [Role.FACULTY, Role.HOD, Role.STAFF, Role.PRINCIPAL].includes(candidate.role);
                const isStudentReq = candidate.role === Role.STUDENT;

                // Chairman sees all Authority requests across all colleges
                if (user.role === Role.CHAIRMAN && isAuthorityReq) return true;

                // Principal sees all requests (Authority & Student) but only for THEIR college
                if (user.role === Role.PRINCIPAL && candidate.college === user.college) return true;

                // HOD sees only Student requests for THEIR college AND THEIR department
                if (user.role === Role.HOD && isStudentReq && 
                    candidate.college === user.college && 
                    candidate.department === user.department) return true;

                return false;
            })
            .filter(u => {
                if (selectedRole !== 'All' && u.role !== selectedRole) return false;
                if (selectedCollege && u.college !== selectedCollege) return false;
                if (selectedDepartment && u.department !== selectedDepartment) return false;
                return true;
            });
    }, [allUsers, user, selectedCollege, selectedDepartment, selectedRole]);

    const handleApprove = (userIdToApprove: string) => {
        setUsers(prevUsers => prevUsers.map(u => 
            u.id === userIdToApprove 
            ? { ...u, status: 'approved', approvedBy: user.id } 
            : u
        ));
        alert(`Access Approved: ${userIdToApprove} is now authorized to log in.`);
    };

    const handleDelete = (userIdToDelete: string) => {
        if (window.confirm(`Permanently reject registration request for ${userIdToDelete}?`)) {
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userIdToDelete));
        }
    };

    const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-lg block w-full p-2.5 outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-700 transition-colors";

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex items-center gap-4 mb-2">
                <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg">
                        <UserCheckIcon className="h-7 w-7 text-blue-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white underline decoration-slate-600 underline-offset-8 decoration-2">Login Access Provider</h2>
                </div>
            </div>
            <p className="text-slate-400 mb-8 ml-14">Approving portal registration requests for new accounts.</p>

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
                            disabled={user.role === Role.HOD}
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
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">ROLE</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">FATHER'S MOBILE</th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {pendingUsers.length > 0 ? (
                                pendingUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-100">{u.name}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-400 font-mono tracking-tight">{u.id}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                                            <span className="bg-slate-800 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black border border-slate-700 uppercase tracking-tighter shadow-sm">{u.role}</span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-400">{u.fatherMobileNumber || 'N/A'}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-center space-x-3">
                                            <button onClick={() => handleApprove(u.id)} className="px-5 py-2 text-[11px] font-black text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest">Approve</button>
                                            <button onClick={() => handleDelete(u.id)} className="px-5 py-2 text-[11px] font-black text-red-500 hover:bg-red-600 hover:text-white border border-red-500/50 rounded-lg transition-all uppercase tracking-widest">Reject</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-slate-500 font-bold uppercase text-xs italic tracking-widest">
                                        No pending login registration requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default LoginAccessProvide;
