import React, { useState } from 'react';
import { signIn, signUp } from '../utils/auth';
import '../index.css';
import EduvergeLogo from '../assets/smartVerg.jpeg'; // <- your logo file
import OnlyLogo from '../assets/onlylogo.jpeg'
interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [first_name, setName] = useState('');
  const [role, setRole] = useState<'faculty' | 'student'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, first_name, role);
        alert('Your account is created. Please sign in using the same credentials.');
        setIsSignUp(false);
        //setEmail('');
        //setPassword('');
        setName('');
        setRole('student');
      } else {
        await signIn(email, password);
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      {/* Card with watermark */}
      <div className="relative bg-gray-50 rounded-3xl shadow-2xl w-full max-w-md p-10 overflow-hidden">

        {/* Watermark logo in background */}
        <img
          src={OnlyLogo}
          alt="EduVerge watermark"
          className="pointer-events-none select-none absolute -top-10 -right-16 w-80 opacity-15 blur-[1px]"
        />

        {/* Foreground content */}
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            {/* Small logo on top */}
            <div className="bg-primary-100 p-3 rectangle-full mb-4 shadow-sm">
              <img
                src={EduvergeLogo}
                alt="EduVerge logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">EduVerge</h1>
            <p className="text-gray-600 mt-2">Smart Learning &amp; Assessment</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={first_name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  required
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                required
                minLength={6}
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'faculty' | 'student')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-blue-500 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setName('');
                // setEmail('');
                // setPassword('');
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
