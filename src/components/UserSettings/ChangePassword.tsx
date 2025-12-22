import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Lock, Eye, EyeOff, Check, AlertCircle, ArrowLeft } from 'lucide-react';


interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}


const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);


  // Calculate password strength
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;


    const strengths: PasswordStrength[] = [
      { score: 0, label: 'Too Weak', color: 'bg-red-500' },
      { score: 1, label: 'Weak', color: 'bg-orange-500' },
      { score: 2, label: 'Fair', color: 'bg-yellow-500' },
      { score: 3, label: 'Good', color: 'bg-blue-500' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 6, label: 'Very Strong', color: 'bg-green-600' },
    ];


    return strengths[Math.min(score, 5)];
  };


  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    if (password.length > 0) {
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  };


  const validateForm = (): boolean => {
    if (!currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Current password is required.' });
      return false;
    }


    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return false;
    }


    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return false;
    }


    if (currentPassword === newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password.' });
      return false;
    }


    return true;
  };


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);


    if (!validateForm()) return;


    setLoading(true);


    try {
      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });


      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: '✅ Password changed successfully! Please log in again.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStrength(null);


        // Optional: Log out after successful password change
        setTimeout(() => {
          supabase.auth.signOut();
        }, 2000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto mt-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-8 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Change Password</h1>
          <p className="text-gray-600 mt-2">Secure your account with a strong password</p>
        </div>


        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>


            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>


              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Strength:</span>
                    <span className={`text-xs font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>✓ At least 8 characters</p>
                    <p>✓ Mix of uppercase and lowercase</p>
                    <p>✓ Include numbers and symbols for better security</p>
                  </div>
                </div>
              )}
            </div>


            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Re-enter new password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>


              {/* Match Indicator */}
              {newPassword && confirmPassword && (
                <div className="mt-2">
                  {newPassword === confirmPassword ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Passwords match</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Change Password
                </>
              )}
            </button>
          </form>


          {/* Messages */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}


          {/* Security Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">🔒 Security Tips</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Use a unique password not used elsewhere</li>
              <li>• Include uppercase, lowercase, numbers & symbols</li>
              <li>• Never share your password with anyone</li>
              <li>• Change your password regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


export default ChangePassword;
