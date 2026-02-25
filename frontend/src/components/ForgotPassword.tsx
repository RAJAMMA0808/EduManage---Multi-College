
import React, { useState } from 'react';
import { User } from '../types';

interface ForgotPasswordProps {
  onResetPassword: (username: string, newPassword: string) => void;
  switchToLogin: () => void;
  users: User[];
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onResetPassword, switchToLogin, users }) => {
  const [step, setStep] = useState(1); // 1: Username, 2: OTPs, 3: New Password
  const [username, setUsername] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const DEMO_MOBILE_OTP = '123456';
  const DEMO_EMAIL_OTP = '654321';

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userExists = users.some(u => u.id.toLowerCase() === username.toLowerCase());
    if (userExists) {
      setError('');
      setStep(2); // Move to OTPs step
    } else {
      setError('Username not found.');
    }
  };

  const handleOtpsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileOtp === DEMO_MOBILE_OTP && emailOtp === DEMO_EMAIL_OTP) {
      setError('');
      setMobileOtp('');
      setEmailOtp('');
      setStep(3); // Move to new password step
    } else {
      setError('One or both OTPs are incorrect. Please check and try again.');
    }
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    onResetPassword(username, newPassword);
  };
  
  const inputClass = `w-full px-4 py-2 border rounded-md bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-200`;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Forgot Password</h2>
        <p className="mt-2 text-sm text-slate-600">Reset your password to regain access</p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
        {step === 1 && (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">Enter Username</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="Enter your username or ID"
              />
               {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold">
              Generate OTPs
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpsSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">Verify OTPs</h3>
            <div className="p-3 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200 mb-4">
              <strong>SIMULATION MODE:</strong> No SMS/Email gateway is connected.<br/>
              Use Mobile: <strong>{DEMO_MOBILE_OTP}</strong> & Email: <strong>{DEMO_EMAIL_OTP}</strong>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Enter Mobile OTP</label>
              <input
                type="text"
                required
                value={mobileOtp}
                onChange={(e) => setMobileOtp(e.target.value)}
                className={inputClass}
                placeholder="Enter 6-digit mobile OTP"
                autoComplete="one-time-code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Enter Email OTP</label>
              <input
                type="text"
                required
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                className={inputClass}
                placeholder="Enter 6-digit email OTP"
                autoComplete="one-time-code"
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold">
              Verify OTPs
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">Set New Password</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Confirm new password"
              />
            </div>
             {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold">
              Reset Password
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-600">
          Remember your password?{' '}
          <button onClick={switchToLogin} className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
