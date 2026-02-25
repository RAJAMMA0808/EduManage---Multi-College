



import React, { useState } from 'react';
import { Role, College } from '../types';
import { COLLEGE_NAMES, DEPARTMENTS } from '../constants';

interface RegisterProps {
  onRegister: (details: any) => void;
  switchToLogin: () => void;
}

const ROLE_DISPLAY_NAMES: { [key in Role]: string } = {
    [Role.CHAIRMAN]: 'Chairman',
    [Role.HOD]: 'HOD',
    [Role.FACULTY]: 'Faculty',
    [Role.STAFF]: 'Staff',
    // FIX: Add missing STUDENT role to satisfy the type definition.
    [Role.STUDENT]: 'Student',
};

const Register: React.FC<RegisterProps> = ({ onRegister, switchToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>(Role.HOD);
  // FIX: Corrected college enum value to match type definitions.
  const [college, setCollege] = useState<College>(College.BRIL);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Allow only digits and limit to 10 characters
    if (/^\d*$/.test(value) && value.length <= 10) {
        setMobileNumber(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
    }
    if (!firstName || !lastName || !email || !username || !password) {
        setError('Please fill in all required fields.');
        return;
    }
    
    // --- Strict validation for Faculty, HOD, and Staff IDs ---
    // FIX: Corrected college enum values to match type definitions.
    const collegeCodeMap: { [key in College]?: string } = {
        [College.BRIL]: 'B',
        [College.BRIG]: 'G',
        [College.KNRR]: 'K',
    };
    
    const expectedPrefix = collegeCodeMap[college];

    if (role === Role.STUDENT) {
        if (!expectedPrefix || !username.toUpperCase().startsWith(expectedPrefix)) {
            setError(`Admission number for ${COLLEGE_NAMES[college]} must start with "${expectedPrefix}".`);
            return;
        }
        const studentIdRegex = new RegExp(`^${expectedPrefix}[A-Z]{2,4}\\d{4}\\d{2,3}$`);
        if (!studentIdRegex.test(username.toUpperCase())) {
            setError('Invalid Admission Number format. Expected: [CollegePrefix][DeptCode][Year][SerialNo]');
            return;
        }
    } else if (role === Role.FACULTY || role === Role.STAFF || role === Role.HOD) {
        if (!expectedPrefix || !username.toUpperCase().startsWith(expectedPrefix)) {
            setError(`Invalid ID for ${COLLEGE_NAMES[college]}. It must start with the prefix "${expectedPrefix}".`);
            return;
        }

        if (role === Role.FACULTY || role === Role.HOD) {
            const facultyIdRegex = new RegExp(`^${expectedPrefix}(${DEPARTMENTS.join('|')})\\d{8}-\\d{3}$`);
            if (!facultyIdRegex.test(username.toUpperCase())) {
                setError('Invalid Faculty/HOD ID. Expected format: [CollegeCode][DeptCode][DDMMYYYY]-[SerialNo]');
                return;
            }
        } else if (role === Role.STAFF) {
            const staffIdRegex = new RegExp(`^${expectedPrefix}STF\\d{8}-\\d{3}$`);
            if (!staffIdRegex.test(username.toUpperCase())) {
                setError('Invalid Staff ID. Expected format: [CollegeCode]STF[DDMMYYYY]-[SerialNo]');
                return;
            }
        }
    }
    
    onRegister({ 
      firstName, 
      lastName, 
      email, 
      mobileNumber,
      username, 
      role, 
      password,
      college: role === Role.CHAIRMAN ? null : college
    });
  };

  const getUsernameLabel = () => role === Role.STUDENT ? 'Admission Number' : 'Username';

  const getUsernamePlaceholder = () => {
    switch (role) {
        case Role.STUDENT:
            return 'e.g., KCSE2024001';
        case Role.FACULTY:
        case Role.HOD:
            return 'e.g., KCSE15042020-001';
        case Role.STAFF:
            return 'e.g., KSTF15042020-001';
        default:
            return 'Enter a unique username';
    }
  };

  const getUsernameHint = () => {
      if (role === Role.STUDENT) {
          return 'Format: [CollegePrefix][DeptCode][Year][SerialNo]';
      }
      if (role === Role.FACULTY || role === Role.HOD) {
          return 'Format: [CollegeCode][DeptCode][DDMMYYYY]-[SerialNo]';
      }
      if (role === Role.STAFF) {
          return 'Format: [CollegeCode]STF[DDMMYYYY]-[SerialNo]';
      }
      return null;
  };

  const inputClass = (fieldName: string) => `w-full px-4 py-2 border rounded-md bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${focused === fieldName ? 'border-blue-300' : 'border-slate-200'}`;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Create account</h2>
        <p className="mt-2 text-sm text-slate-600">Sign up to get started with EduManage</p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
        <div className="text-left">
          <h3 className="text-2xl font-semibold text-slate-900">Sign Up</h3>
          <p className="text-slate-500 text-sm">Fill in your details to create a new account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className={inputClass('firstName')} onFocus={() => setFocused('firstName')} onBlur={() => setFocused(null)} required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className={inputClass('lastName')} onFocus={() => setFocused('lastName')} onBlur={() => setFocused(null)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={inputClass('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} required />
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-slate-900 bg-slate-200 border border-r-0 border-slate-300 rounded-l-md">
                +91
              </span>
              <input
                type="text"
                value={mobileNumber}
                onChange={handleMobileNumberChange}
                placeholder="10-digit mobile number"
                className={`${inputClass('mobileNumber').replace('w-full', '')} rounded-l-none flex-1 min-w-0`}
                onFocus={() => setFocused('mobileNumber')}
                onBlur={() => setFocused(null)}
                required
              />
            </div>
          </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as Role)} className={inputClass('role')} onFocus={() => setFocused('role')} onBlur={() => setFocused(null)}>
                {Object.entries(ROLE_DISPLAY_NAMES).map(([roleValue, roleName]) => <option key={roleValue} value={roleValue}>{roleName as React.ReactNode}</option>)}
              </select>
            </div>
          {role !== Role.CHAIRMAN && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
              <select value={college} onChange={e => setCollege(e.target.value as College)} className={inputClass('college')} onFocus={() => setFocused('college')} onBlur={() => setFocused(null)}>
                {Object.entries(COLLEGE_NAMES)
                  .filter(([key]) => key !== College.ALL)
                  .map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
              </select>
            </div>
          )}
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{getUsernameLabel()}</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={getUsernamePlaceholder()} className={inputClass('username')} onFocus={() => setFocused('username')} onBlur={() => setFocused(null)} required />
            {getUsernameHint() && (
                <p className="mt-1 text-xs text-slate-500">{getUsernameHint()}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" className={inputClass('password')} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password" className={inputClass('confirmPassword')} onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)} required />
          </div>
          {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold transition-colors duration-300">
            Create Account
          </button>
        </form>
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button onClick={switchToLogin} className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;