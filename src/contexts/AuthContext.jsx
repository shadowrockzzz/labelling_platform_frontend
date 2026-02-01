import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.jsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AUTO_LOGOUT_TIME } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    setupAutoLogout();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = authService.getUser();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        
        // Verify token is still valid
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
          // Token might be expired, clear auth
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      
      // Redirect based on role
      const redirectPath = getRedirectPath(userData.role);
      navigate(redirectPath);
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin':
        return '/dashboard';
      case 'project_manager':
        return '/dashboard';
      case 'reviewer':
        return '/dashboard';
      case 'annotator':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  const setupAutoLogout = () => {
    const resetTimer = () => {
      localStorage.setItem('last_activity', Date.now().toString());
    };

    const checkInactivity = () => {
      const lastActivity = parseInt(localStorage.getItem('last_activity') || '0');
      const currentTime = Date.now();
      const timeSinceActivity = currentTime - lastActivity;

      if (timeSinceActivity > AUTO_LOGOUT_TIME && isAuthenticated) {
        logout();
        toast.error('Session expired due to inactivity');
      }
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Check for inactivity every minute
    const inactivityCheck = setInterval(checkInactivity, 60000);

    // Initialize timer
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      clearInterval(inactivityCheck);
    };
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};