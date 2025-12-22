import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import type { User } from '../../utils/supabaseClient';
import { User as UserIcon, Mail, Briefcase, Calendar, ArrowLeft } from 'lucide-react';

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (data) {
          setUser(data as User);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto mt-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-8 px-4 py-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 mt-2">View and manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-purple-500 to-yellow-600 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-opacity-20 mb-4">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h2>
            <p className="text-blue-100 mt-1 capitalize">{user?.role}</p>
          </div>

          {/* Profile Details */}
          <div className="p-8 space-y-6">
            {/* Email */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">email</p>
                <p className="text-gray-800 font-medium">{user?.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Role</p>
                <p className="text-gray-800 font-medium capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Member Since</p>
                <p className="text-gray-800 font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📝 To change your password, use the options in your Settings menu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
