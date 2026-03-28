import { supabase } from '../config/supabase';
import { ACCESS_TOKEN_KEY } from '../utils/constants';


// ============ REGISTER ============

export const register = async (userData) => {
  try {

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          university: userData.university,
          role: userData.role || 'student',
        },
      },
    });

    if (error) throw error;

    const session = data.session;
    const user = data.user;

    if (session) {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
    }

    return {
      user,
      idToken: session?.access_token || null,
    };

  } catch (error) {

    console.error('Registration error:', error);

    if (error.message.includes('User already registered')) {
      throw new Error('Email already exists');
    }

    if (error.message.includes('Password')) {
      throw new Error('Password must be at least 6 characters');
    }

    throw error;
  }
};



// ============ LOGIN ============

export const login = async (email, password) => {
  try {

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const session = data.session;
    const user = data.user;

    if (session) {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
    }

    return {
      user,
      idToken: session?.access_token,
    };

  } catch (error) {

    console.error('Login error:', error);

    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password');
    }

    throw error;
  }
};



// ============ LOGOUT ============

export const logout = async () => {
  try {

    await supabase.auth.signOut();
    localStorage.removeItem(ACCESS_TOKEN_KEY);

  } catch (error) {

    console.error('Logout error:', error);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};



// ============ GET CURRENT USER ============

export const getCurrentUser = async () => {
  try {

    const { data } = await supabase.auth.getUser();

    if (!data?.user) return null;

    return {
      uid: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name,
    };

  } catch (error) {

    console.error('Get current user error:', error);
    throw error;
  }
};



// ============ AUTH STATE LISTENER ============

export const subscribeToAuthChanges = (callback) => {

  const { data: listener } = supabase.auth.onAuthStateChange(
    async (event, session) => {

      if (session) {

        localStorage.setItem(
          ACCESS_TOKEN_KEY,
          session.access_token
        );

        callback({
          user: session.user,
          idToken: session.access_token,
        });

      } else {

        localStorage.removeItem(ACCESS_TOKEN_KEY);

        callback({
          user: null,
          idToken: null,
        });
      }
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
};



// ============ CHECK AUTHENTICATION ============

export const isAuthenticated = () => {

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  return !!token;
};



// ============ REFRESH TOKEN ============

export const refreshToken = async () => {
  try {

    const { data, error } = await supabase.auth.refreshSession();

    if (error) throw error;

    const token = data.session?.access_token;

    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }

    return token;

  } catch (error) {

    console.error('Token refresh error:', error);
    throw error;
  }
};