import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, LogEntry, College } from '../types/index';
import { getDeletedDataLog, clearDeletedDataLog, restoreStudentData, clearAllBrowserData } from '../services/api';
import { MenuIcon, TrashIcon, RefreshIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS, COLLEGE_CODES } from '../constants/index';

interface RemovedDataProps {
  user: User;
  onToggleSidebar: () => void;
}

const RestoreIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691L7.985 5.356m0 0v4.992m0 0h4.992m0 0l3.181-3.183a8.25 8.25 0 0111.664 0l3.181 3.183" />
    </svg>
);


const RemovedData: React.FC<RemovedDataProps> = ({ user, onToggleSidebar }) => {
    const [log, setLog] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
    const [selectedCollege, setSelectedCollege] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedDataType, setSelectedDataType] = useState<string>('');
    
    const fetchLog = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDeletedDataLog();
            setLog(data);
        } catch (error) {
            console.error("Failed to fetch removed data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLog();
    }, [fetchLog]);

    const isFilterActive = useMemo(() => {
        return (selectedCollege !== '' || selectedDepartment !== '' || selectedDataType !== '');
    }, [selectedCollege, selectedDepartment, selectedDataType]);

    const filteredLog = useMemo(() => {
        if (!isFilterActive) return [];
        return log.filter(entry => {
            const admissionNumber = entry.admissionNumber;
            if (selectedCollege && selectedCollege !== 'All' && selectedCollege !== '') {
                const expectedPrefix = COLLEGE_CODES[selectedCollege as College];
                if (expectedPrefix && !admissionNumber.startsWith(expectedPrefix)) return false;
            }
            if (selectedDepartment && selectedDepartment !== 'All' && selectedDepartment !== '') {
                const departmentMatch = admissionNumber.match(/^[A-Z]([A-Z]{2,4})\d+/);
                if ((departmentMatch ? departmentMatch[1] : null) !== selectedDepartment) return false;
            }
            if (selectedDataType && selectedDataType !== 'All' && selectedDataType !== '' && entry.dataType !== selectedDataType) return false;
            return true;
        });
    }, [log, selectedCollege, selectedDepartment, selectedDataType, isFilterActive]);

    const handleClearLog = async () => {
        try {
            await clearDeletedDataLog();
            fetchLog();
            alert("Deletion log cleared successfully.");
        } catch (e) {
            alert(`Failed: ${e instanceof Error ? e.message : "Error"}`);
        } finally {
            setShowConfirm(false);
        }
    };

    const handleResetFrontend = () => {
        if (window.confirm("CRITICAL: This will wipe all portal session memory, online attendance logs, and unsaved local profile changes. Use this to clear residual data showing in charts. Proceed?")) {
            clearAllBrowserData();
        }
    };

    const handleSelectLog = (id: number) => {
        setSelectedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
            return newSet;
        });
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedLogs(new Set(filteredLog.map(entry => entry.id)));
        else setSelectedLogs(new Set());
    };

    const isAllSelected = filteredLog.length > 0 && selectedLogs.size === filteredLog.length;

    const handleRestore = async () => {
        if (selectedLogs.size === 0) return;
        if (window.confirm(`Restore data from ${selectedLogs.size} logs?`)) {
            try {
                const result = await restoreStudentData(Array.from(selectedLogs));
                fetchLog();
                setSelectedLogs(new Set());
                alert(result.message);
            } catch (e) { alert("Failed"); }
        }
    };
    
    const compactSelectClass = "bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]";
    
    return (
        <>
            <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white">Removed Data Log</h2>
                            <p className="text-slate-400 mt-1 text-sm">Audit trail of all semester-wise data deletions.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 lg:ml-auto lg:justify-end">
                        <button 
                            onClick={handleResetFrontend}
                            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 text-xs font-bold py-1.5 px-3 rounded transition shadow-lg h-[34px]"
                            title="Clear browser cache and portal logs"
                        >
                            <RefreshIcon className="h-4 w-4" />
                            <span>Wipe Browser Memory</span>
                        </button>

                        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                             <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)} className={compactSelectClass} aria-label="Filter by College">
                                <option value="">College: All</option>
                                {Object.entries(COLLEGE_NAMES).filter(([key]) => key !== College.ALL).map(([key, name]) => (<option key={key} value={key}>{name as React.ReactNode}</option>))}
                            </select>

                             <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className={compactSelectClass} aria-label="Filter by Department">
                                <option value="">Dept: All</option>
                                {DEPARTMENTS.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                            </select>

                            <select value={selectedDataType} onChange={(e) => setSelectedDataType(e.target.value)} className={compactSelectClass} aria-label="Filter by Data Type">
                                <option value="">Type: All</option>
                                <option value="Marks">Marks</option>
                                <option value="Attendance">Attendance</option>
                                <option value="Fees">Fees</option>
                                <option value="Exam Fees">Exam Fees</option>
                                <option value="Placement">Placement</option>
                            </select>
                        </div>
                        
                        <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

                        <div className="flex items-center gap-2">
                            <button onClick={handleRestore} disabled={selectedLogs.size === 0} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded transition disabled:bg-slate-700 disabled:text-slate-500 h-[34px]">
                                <RestoreIcon className="h-4 w-4" />
                                <span>Restore ({selectedLogs.size})</span>
                            </button>
                            <button onClick={() => setShowConfirm(true)} disabled={log.length === 0} className="flex items-center gap-2 bg-slate-800 hover:bg-red-900/80 hover:text-red-100 text-slate-300 border border-slate-700 text-xs font-semibold py-1.5 px-3 rounded h-[34px]">
                                <TrashIcon className="h-4 w-4" />
                                <span>Clear Log</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-10">
                                        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} disabled={filteredLog.length === 0} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-blue-600 focus:ring-blue-500" />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Admission No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Data Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Scope</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Deleted By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-900 divide-y divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-slate-400">Loading log...</td></tr>
                                ) : !isFilterActive ? (
                                    <tr><td colSpan={8} className="text-center py-12 text-slate-500 italic">Please select a College, Department, or Data Type to view the log.</td></tr>
                                ) : filteredLog.length > 0 ? (
                                    filteredLog.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-4 text-center"><input type="checkbox" checked={selectedLogs.has(entry.id)} onChange={() => handleSelectLog(entry.id)} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-blue-600 focus:ring-blue-500 cursor-pointer" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{entry.studentName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">{entry.admissionNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entry.dataType === 'Marks' ? 'bg-indigo-900 text-indigo-200' : entry.dataType === 'Fees' ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-700 text-slate-200'}`}>{entry.dataType}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{entry.scope}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{entry.deletedBy}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{entry.reason || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={8} className="text-center py-12 text-slate-500 italic">No data matches filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showConfirm && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4" onClick={() => setShowConfirm(false)}>
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-red-400">Confirm Clear Log</h3>
                        <p className="my-4 text-slate-300">Are you sure you want to permanently delete all records from this log?</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md">Cancel</button>
                            <button onClick={handleClearLog} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2"><TrashIcon className="h-4 w-4" />Confirm & Clear</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RemovedData;