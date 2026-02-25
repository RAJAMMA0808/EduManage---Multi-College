
import React, { useState } from 'react';
import { User } from '../types/index';
import { MOCK_USERS } from '../constants/index';
import { EyeIcon, EyeSlashIcon } from './icons';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  switchToRegister: () => void;
  switchToForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, switchToRegister, switchToForgotPassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.id.toLowerCase() === username.toLowerCase());
    
    if (user && user.password === password) {
      if (user.status === 'pending') {
        setError('Your account is awaiting approval from an administrator.');
      } else {
        onLogin(user);
      }
    } else {
      setError('Invalid Username or Password.');
    }
  };
  
  // Fixed: Background set to white, text to dark slate for high contrast on light card
  const inputClass = (fieldName: string) => `w-full px-4 py-2 border rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${focused === fieldName ? 'border-blue-500' : 'border-slate-300 shadow-sm'}`;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-600 font-medium">Sign in to your account to continue</p>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-100">
        <div className="text-left">
          <h3 className="text-2xl font-bold text-slate-900">Sign In</h3>
          <p className="text-slate-500 text-sm">Enter your credentials to access the dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Username</label>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass('username')}
              onFocus={() => setFocused('username')}
              onBlur={() => setFocused(null)}
              placeholder="Enter User ID"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
              <button type="button" onClick={switchToForgotPassword} className="text-xs font-bold text-blue-600 hover:text-blue-500">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass('password')} pr-12`}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-pulse">
                {error}
            </div>
          )}
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-bold uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95 mt-2">
            Sign In
          </button>
        </form>

        <div className="pt-6 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 text-center uppercase tracking-[0.2em] mb-4">Demo Credentials</h4>
            <ul className="space-y-2">
                {MOCK_USERS.map(user => (
                    <li key={user.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="text-[11px]">
                            <span className="font-bold text-slate-700">ID:</span> <span className="font-mono text-slate-900">{user.id}</span> <br/>
                            <span className="font-bold text-slate-700">PW:</span> <span className="font-mono text-slate-900">{user.password}</span>
                        </div>
                        <span className="px-2 py-1 text-white bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm">{user.role}</span>
                    </li>
                ))}
            </ul>
        </div>
        
        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <button onClick={switchToRegister} className="font-bold text-blue-600 hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
