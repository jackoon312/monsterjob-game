import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if there's a stored token and try to restore the session
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('monsterjob_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: restoredUser } = await authApi.getMe();
        setUser(restoredUser);
      } catch (error) {
        // Token was invalid/expired - the axios interceptor already cleared it
        console.warn('Could not restore session:', error.message);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const loginUser = async (email, password) => {
    const { user: loggedInUser, token } = await authApi.login(email, password);
    localStorage.setItem('monsterjob_token', token);
    localStorage.setItem('monsterjob_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const registerUser = async (username, email, password) => {
    const { user: newUser, token } = await authApi.register(username, email, password);
    localStorage.setItem('monsterjob_token', token);
    localStorage.setItem('monsterjob_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logoutUser = () => {
    localStorage.removeItem('monsterjob_token');
    localStorage.removeItem('monsterjob_user');
    setUser(null);
  };

  // Re-fetches the current user from the backend - call this after any action
  // that changes money/XP/level (completing a job, buying equipment, etc.) so
  // the header display doesn't go stale. The user object from login/register
  // is only a snapshot at that moment.
  const refreshUser = async () => {
    try {
      const { user: freshUser } = await authApi.getMe();
      setUser(freshUser);
      localStorage.setItem('monsterjob_user', JSON.stringify(freshUser));
    } catch (error) {
      console.warn('Could not refresh user:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logoutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
