import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { dataRepository } from '../services/dataService';
import { auth, GoogleAuthProvider, signInWithPopup, signOut } from '../services/firebaseClient';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  user: Profile | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseConnected: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    schoolName: string,
    wilaya: string,
    municipality?: string,
    academicYear?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateCredentials: (updates: Partial<Profile>, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  forceUploadToFirebase: () => Promise<{ success: boolean; count: number; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const prof = dataRepository.getProfile();
        prof.id = fbUser.uid;
        if (fbUser.email) prof.email = fbUser.email;
        if (fbUser.displayName) prof.full_name = fbUser.displayName;
        setUser({ ...prof });
        localStorage.removeItem('eps_dz_logged_out');
        localStorage.setItem('eps_dz_current_user', JSON.stringify(prof));
      } else {
        const isExplicitlyLoggedOut = localStorage.getItem('eps_dz_logged_out') === 'true';
        const savedUserJson = localStorage.getItem('eps_dz_current_user');
        if (isExplicitlyLoggedOut) {
          setUser(null);
        } else if (savedUserJson) {
          try {
            setUser(JSON.parse(savedUserJson));
          } catch {
            setUser(null);
          }
        } else {
          // Default initial profile
          setUser(dataRepository.getProfile());
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const prof = await dataRepository.updateProfile({
        id: fbUser.uid,
        email: fbUser.email || 'teacher@education.dz',
        full_name: fbUser.displayName || profFallbackName(fbUser.email),
      });

      setUser(prof);
      localStorage.removeItem('eps_dz_logged_out');
      localStorage.setItem('eps_dz_current_user', JSON.stringify(prof));

      // Trigger sync
      await dataRepository.forceUploadAllToFirestore();

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      console.error('Google Sign-In Error:', err);
      return { success: false, error: err.message || 'فشل تسجيل الدخول باستخدام حساب Google' };
    }
  };

  const profFallbackName = (email?: string | null) => {
    if (!email) return 'الأستاذ';
    return email.split('@')[0];
  };

  const login = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // Update in-memory profile
    const currentProfile = dataRepository.getProfile();
    currentProfile.email = email;
    setUser({ ...currentProfile });
    localStorage.removeItem('eps_dz_logged_out');
    localStorage.setItem('eps_dz_current_user', JSON.stringify(currentProfile));

    setIsLoading(false);
    return { success: true };
  };

  const signup = async (
    email: string,
    _password: string,
    fullName: string,
    schoolName: string,
    wilaya: string,
    municipality?: string,
    academicYear?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    const newProf = await dataRepository.updateProfile({
      email,
      full_name: fullName,
      school_name: schoolName,
      wilaya,
      municipality: municipality || '',
      academic_year: academicYear || '2026 / 2027',
    });

    setUser(newProf);
    localStorage.removeItem('eps_dz_logged_out');
    localStorage.setItem('eps_dz_current_user', JSON.stringify(newProf));
    setIsLoading(false);
    return { success: true };
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('eps_dz_current_user');
    localStorage.setItem('eps_dz_logged_out', 'true');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const updated = await dataRepository.updateProfile(updates);
    setUser(updated);
    localStorage.setItem('eps_dz_current_user', JSON.stringify(updated));
  };

  const updateCredentials = async (
    updates: Partial<Profile>,
    _newPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = await dataRepository.updateProfile(updates);
      setUser(updated);
      localStorage.setItem('eps_dz_current_user', JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل تحديث البيانات' };
    }
  };

  const forceUploadToFirebase = async () => {
    return await dataRepository.forceUploadAllToFirestore();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: Boolean(user),
        isLoading,
        isFirebaseConnected: Boolean(firebaseUser),
        loginWithGoogle,
        login,
        signup,
        logout,
        updateProfile,
        updateCredentials,
        forceUploadToFirebase,
      }}
    >
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
