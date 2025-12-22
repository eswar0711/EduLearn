
import { supabase } from './supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
  is_blocked: boolean;
  is_active: boolean;
  created_at?: string;
}

// =====================================================
// SIGN UP
// =====================================================
export const signUp = async (
  email: string,
  password: string,
  full_name: string,
  role: 'faculty' | 'student' = 'student'
) => {
  try {
    console.log('📝 Starting signup for:', email);

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role }
      }
    });

    if (authError) {
      console.error('❌ Auth signup error:', authError);
      throw new Error(`Auth signup failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No auth user created');
    }

    const userId = authData.user.id;
    console.log('✓ Auth user created:', userId);

    // Step 2: Insert into users table
    const { error: usersError } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name,
        email,
        role
      });

    if (usersError) {
      console.error('❌ Users table error:', usersError);
      throw new Error(`Users insert failed: ${usersError.message}`);
    }
    console.log('✓ User record created');

    // Step 3: Insert into user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name,
        email,
        role,
        is_active: true,
        is_blocked: false
      });

    if (profileError) {
      console.error('❌ User profiles error:', profileError);
      throw new Error(`Profile insert failed: ${profileError.message}`);
    }
    console.log('✓ User profile created');

    return {
      success: true,
      message: 'Signup successful! Please check your email to confirm your account.',
      user: authData.user
    };

  } catch (error) {
    console.error('❌ Signup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown signup error'
    };
  }
};

// =====================================================
// SIGN IN (LOGIN)
// =====================================================
export const signIn = async (email: string, password: string) => {
  try {
    console.log('🔐 Starting login for:', email);

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Auth login error:', authError);
      if (authError.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password');
      }
      throw new Error(authError.message || 'Login failed');
    }

    if (!authData.user) {
      throw new Error('No user returned from auth');
    }

    console.log('✓ Auth login successful:', authData.user.id);

    // 2. Fetch user profile
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_blocked, is_active, created_at')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      // If profile doesn't exist, return auth user
      console.warn('⚠️ Profile not found, using auth user data:', userError.message);
      console.log('✓ Login successful (auth user only)');
      return {
        user: authData.user,
        profile: {
          id: authData.user.id,
          email: authData.user.email || '',
          full_name: authData.user.user_metadata?.full_name || '',
          role: authData.user.user_metadata?.role || 'student',
          is_blocked: false,
          is_active: true
        }
      };
    }

    // 3. Check if user is blocked
    if (userData && userData.is_blocked) {
      console.warn('⚠️ User is blocked');
      await supabase.auth.signOut();
      throw new Error('Your account has been blocked. Please contact support.');
    }

    // 4. Check if user is active
    if (userData && !userData.is_active) {
      console.warn('⚠️ User is inactive');
      await supabase.auth.signOut();
      throw new Error('Your account is inactive. Please contact support.');
    }

    console.log('✓ Login successful:', userData);

    return {
      user: authData.user,
      profile: userData
    };

  } catch (error) {
    console.error('❌ Login failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
    throw new Error(errorMessage);
  }
};

// =====================================================
// SIGN OUT
// =====================================================
export const signOut = async () => {
  try {
    console.log('🚪 Signing out...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Signout error:', error);
      throw error;
    }

    console.log('✓ Signed out successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Signout failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown signout error'
    };
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('ℹ️ No authenticated user');
      return null;
    }

    // Fetch full profile from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_blocked, is_active, created_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('⚠️ Could not fetch user profile:', profileError);
      // Return basic user info
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        role: user.user_metadata?.role || 'student',
        is_blocked: false,
        is_active: true
      };
    }

    return profile as AuthUser;

  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
};

// =====================================================
// WATCH AUTH STATE CHANGES
// =====================================================
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  try {
    console.log('👁️ Watching auth state changes...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✓ User signed in:', session.user.id);
        
        // Fetch full profile
        const profile = await getCurrentUser();
        callback(profile);

      } else if (event === 'SIGNED_OUT') {
        console.log('✓ User signed out');
        callback(null);

      } else if (event === 'USER_UPDATED') {
        console.log('✓ User updated');
        const profile = await getCurrentUser();
        callback(profile);
      }
    });

    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from auth changes');
      subscription?.unsubscribe();
    };

  } catch (error) {
    console.error('❌ Error setting up auth state listener:', error);
    return () => {};
  }
};

// =====================================================
// GET USER BY ID (ADMIN ONLY)
// =====================================================
export const getUserById = async (userId: string): Promise<AuthUser | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_blocked, is_active, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching user:', error);
      return null;
    }

    return data as AuthUser;

  } catch (error) {
    console.error('❌ Error getting user by ID:', error);
    return null;
  }
};

// =====================================================
// UPDATE USER PROFILE
// =====================================================
export const updateUserProfile = async (
  userId: string,
  updates: Partial<AuthUser>
) => {
  try {
    console.log('✏️ Updating user profile:', userId);

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating profile:', error);
      throw new Error(`Update failed: ${error.message}`);
    }

    console.log('✓ Profile updated successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Update failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// =====================================================
// CHECK IF EMAIL EXISTS
// =====================================================
export const emailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found - email doesn't exist
      return false;
    }

    return !!data;

  } catch (error) {
    console.error('❌ Error checking email:', error);
    return false;
  }
};

// =====================================================
// VERIFY EMAIL (FOR FUTURE USE)
// =====================================================
export const verifyEmail = async (token: string) => {
  try {
    console.log('📧 Verifying email...');

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });

    if (error) {
      console.error('❌ Email verification failed:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }

    console.log('✓ Email verified successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================
export const resetPassword = async (email: string) => {
  try {
    console.log('🔑 Requesting password reset for:', email);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('❌ Password reset request failed:', error);
      throw new Error(`Reset failed: ${error.message}`);
    }

    console.log('✓ Password reset email sent');
    return {
      success: true,
      message: 'Check your email for password reset instructions'
    };

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reset failed'
    };
  }
};

// =====================================================
// UPDATE PASSWORD
// =====================================================
export const updatePassword = async (newPassword: string) => {
  try {
    console.log('🔐 Updating password...');

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('❌ Password update failed:', error);
      throw new Error(`Update failed: ${error.message}`);
    }

    console.log('✓ Password updated successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Password update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed'
    };
  }
};

// =====================================================
// ADMIN: BLOCK/UNBLOCK USER
// =====================================================
export const blockUser = async (userId: string, isBlocked: boolean) => {
  try {
    console.log(`${isBlocked ? '🚫' : '✅'} ${isBlocked ? 'Blocking' : 'Unblocking'} user:`, userId);

    const { error } = await supabase
      .from('user_profiles')
      .update({ is_blocked: isBlocked })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating user status:', error);
      throw new Error(`Update failed: ${error.message}`);
    }

    console.log(`✓ User ${isBlocked ? 'blocked' : 'unblocked'}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// =====================================================
// ADMIN: CHANGE USER ROLE
// =====================================================
export const changeUserRole = async (
  userId: string,
  newRole: 'student' | 'faculty' | 'admin'
) => {
  try {
    console.log('👤 Changing user role:', userId, '→', newRole);

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error changing role:', error);
      throw new Error(`Update failed: ${error.message}`);
    }

    console.log('✓ User role changed to:', newRole);
    return { success: true };

  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// =====================================================
// ADMIN: DELETE USER
// =====================================================
export const deleteUser = async (userId: string) => {
  try {
    console.log('🗑️ Deleting user:', userId);

    // Delete from user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Error deleting profile:', profileError);
      throw new Error(`Delete failed: ${profileError.message}`);
    }

    // Delete from users table (if exists)
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (usersError) {
      console.warn('⚠️ Warning deleting from users table:', usersError);
      // Continue anyway
    }

    console.log('✓ User deleted successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// =====================================================
// ADMIN: GET ALL USERS
// =====================================================
export const getAllUsers = async (): Promise<AuthUser[]> => {
  try {
    console.log('👥 Fetching all users...');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_blocked, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    }

    console.log('✓ Loaded', data?.length || 0, 'users');
    return data as AuthUser[];

  } catch (error) {
    console.error('❌ Error getting users:', error);
    return [];
  }
};

// =====================================================
// ADMIN: GET USERS BY ROLE
// =====================================================
export const getUsersByRole = async (role: 'student' | 'faculty' | 'admin'): Promise<AuthUser[]> => {
  try {
    console.log('👥 Fetching', role + 's', '...');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_blocked, is_active, created_at')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    }

    console.log('✓ Loaded', data?.length || 0, role + 's');
    return data as AuthUser[];

  } catch (error) {
    console.error('❌ Error getting users by role:', error);
    return [];
  }
};

// =====================================================
// SEARCH USERS
// =====================================================
export const searchUsers = async (query: string): Promise<AuthUser[]> => {
  try {
    console.log('🔍 Searching users:', query);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_blocked, is_active, created_at')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error searching users:', error);
      return [];
    }

    console.log('✓ Found', data?.length || 0, 'results');
    return data as AuthUser[];

  } catch (error) {
    console.error('❌ Search error:', error);
    return [];
  }
};