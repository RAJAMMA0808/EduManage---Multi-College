
import React, { useState, useMemo } from 'react';
import { Role, College } from '../types/index';
import { COLLEGE_NAMES, DEPARTMENTS, COLLEGE_CODES } from '../constants/index';
import { DocumentIcon, XCircleIcon } from './icons';

interface RegisterProps {
  onRegister: (details: any) => void;
  switchToLogin: () => void;
}

const ROLE_DISPLAY_NAMES: { [key in Role]: string } = {
    [Role.CHAIRMAN]: 'Chairman',
    [Role.PRINCIPAL]: 'Principal',
    [Role.HOD]: 'HOD',
    [Role.FACULTY]: 'Faculty',
    [Role.STAFF]: 'Staff',
    [Role.STUDENT]: 'Student',
};

const Register: React.FC<RegisterProps> = ({ onRegister, switchToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [fatherMobileNumber, setFatherMobileNumber] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [college, setCollege] = useState<College>(College.KNRR);
  const [department, setDepartment] = useState('CSE');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const { value } = e.target;
    if (/^\d*$/.test(value) && value.length <= 10) {
        setter(value);
    }
  };

  const validateID = (id: string, currentRole: Role, currentCollege: College, currentDept: string) => {
    const prefix = COLLEGE_CODES[currentCollege];
    const upperId = id.trim().toUpperCase();

    if (!upperId.startsWith(prefix || '')) {
        return `ID must start with "${prefix}" for ${COLLEGE_NAMES[currentCollege]}.`;
    }

    if (currentRole === Role.STUDENT) {
        const studentRegex = new RegExp(`^${prefix}${currentDept}\\d{4}\\d{2}$`);
        if (!studentRegex.test(upperId)) {
            return `Format: ${prefix}${currentDept}[Year][Roll]. e.g., ${prefix}${currentDept}202401`;
        }
    } else if (currentRole === Role.FACULTY || currentRole === Role.HOD) {
        const facultyRegex = new RegExp(`^${prefix}${currentDept}\\d{8}-\\d{3}$`);
        if (!facultyRegex.test(upperId)) {
            return `Format: ${prefix}${currentDept}[8-digit Date]-[3-digit Serial]`;
        }
    } else if (currentRole === Role.STAFF) {
        const staffRegex = new RegExp(`^${prefix}STF\\d{8}-\\d{3}$`);
        if (!staffRegex.test(upperId)) {
            return `Format: ${prefix}STF[8-digit Date]-[3-digit Serial]`;
        }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toUpperCase();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!firstName || !lastName || !email || !cleanUsername || !password || !fatherMobileNumber) {
        setError('All fields are required, including Father\'s Mobile Number.');
        return;
    }

    if (role !== Role.CHAIRMAN) {
        const idError = validateID(cleanUsername, role, college, department);
        if (idError) {
            setError(idError);
            return;
        }
    }

    onRegister({ 
      firstName, lastName, email, mobileNumber, fatherMobileNumber, 
      username: cleanUsername, role, password, college, 
      department: (role !== Role.STAFF && role !== Role.PRINCIPAL) ? department : undefined
    });
  };

  const inputClass = (fieldName: string) => `w-full px-4 py-2 border rounded-md bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${focused === fieldName ? 'border-blue-300' : 'border-slate-200'}`;
  const commonSelectClass = "w-full px-4 py-2 border rounded-md bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-200 cursor-pointer";

  return (
    <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-start">
      <div className="w-full lg:w-72 bg-white p-6 rounded-xl shadow-lg border border-slate-200 order-2 lg:order-1">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DocumentIcon className="h-5 w-5 text-blue-600" />
              Registration Guide
          </h3>
          <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">ID Format</p>
                  <p className="text-xs text-slate-600 font-medium">Use the official ID provided by the administration.</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1">Requirement</p>
                  <p className="text-xs text-red-600 font-medium leading-tight">Father's mobile number is mandatory for security verification.</p>
              </div>
          </div>
      </div>

      <div className="flex-1 order-1 lg:order-2">
        <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
            <p className="mt-1 text-sm text-slate-500">Provide accurate details for biometric authorization</p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className={inputClass('firstName')} required />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className={inputClass('lastName')} required />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass('email')} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">My Mobile (+91)</label>
                    <input type="text" value={mobileNumber} onChange={(e) => handleMobileNumberChange(e, setMobileNumber)} placeholder="10 digits" className={inputClass('mobileNumber')} required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Father's Mobile (+91) *</label>
                    <input type="text" value={fatherMobileNumber} onChange={(e) => handleMobileNumberChange(e, setFatherMobileNumber)} placeholder="Mandatory" className={inputClass('fatherMobileNumber')} required />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Role</label>
                    <select value={role} onChange={e => setRole(e.target.value as Role)} className={commonSelectClass}>
                        {Object.entries(ROLE_DISPLAY_NAMES).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                    </select>
                </div>
                {role !== Role.CHAIRMAN && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">College</label>
                    <select value={college} onChange={e => setCollege(e.target.value as College)} className={commonSelectClass}>
                        {Object.entries(COLLEGE_NAMES).filter(([k]) => k !== 'ALL').map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                    </select>
                </div>
                )}
            </div>

            {(role === Role.HOD || role === Role.FACULTY || role === Role.STUDENT) && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department / Branch</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)} className={commonSelectClass}>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User ID / Admission ID</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value.toUpperCase())} 
                    placeholder="e.g. KCSE202401" 
                    className={`${inputClass('username')} border-2 border-blue-100 font-mono tracking-wider`} 
                    required 
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" className={inputClass('password')} required />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="********" className={inputClass('confirmPassword')} required />
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 flex items-start gap-3">
                    <XCircleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-bold leading-tight">{error}</p>
                </div>
            )}
            
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98]">
                Create Account
            </button>
            </form>
            <p className="text-center text-sm text-slate-600">
                Already registered? <button onClick={switchToLogin} className="text-blue-600 font-bold hover:underline">Sign in</button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
