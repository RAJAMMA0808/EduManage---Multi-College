import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  switchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, switchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id.toLowerCase() === username.toLowerCase());
    
    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError('Invalid Username or Password.');
    }
  };
  
  const inputClass = (fieldName: string) => `w-full px-4 py-2 border rounded-md bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${focused === fieldName ? 'border-blue-300' : 'border-slate-200'}`;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-600">Sign in to your account to continue</p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
        <div className="text-left">
          <h3 className="text-2xl font-semibold text-slate-900">Sign In</h3>
          <p className="text-slate-500 text-sm">Enter your credentials to access the dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass('username')}
              onFocus={() => setFocused('username')}
              onBlur={() => setFocused(null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass('password')}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold transition-colors duration-300">
            Sign In
          </button>
        </form>

        <div className="pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-600 text-center mb-3">Demo Credentials</h4>
            <ul className="space-y-2 text-xs text-slate-600">
                {MOCK_USERS.map(user => (
                    <li key={user.id} className="flex justify-between items-center p-2 bg-slate-100 rounded">
                        <div>
                            <span className="font-bold">User:</span> {user.id} <br/>
                            <span className="font-bold">Pass:</span> {user.password}
                        </div>
                        <span className="px-2 py-1 text-white bg-slate-600 rounded-full text-[10px] font-mono">{user.role}</span>
                    </li>
                ))}
            </ul>
        </div>
        
        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <button onClick={switchToRegister} className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;