import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { dataRepository } from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    async function initAuth() {
      // 1. Sync full online database from server first
      try {
        await dataRepository.syncOnlineDatabase();
      } catch (e) {
        console.warn('Initial online sync warning:', e);
      }

      const isExplicitlyLoggedOut = localStorage.getItem('eps_dz_logged_out') === 'true';
      const savedUserJson = localStorage.getItem('eps_dz_current_user');
      const supabase = getSupabase();
      setIsSupabaseConnected(Boolean(supabase));

      if (isExplicitlyLoggedOut) {
        setUser(null);
      } else if (savedUserJson) {
        try {
          const parsed = JSON.parse(savedUserJson);
          setUser(parsed);
        } catch {
          setUser(null);
        }
      } else {
        // Automatically check if server already has a registered teacher profile
        try {
          const res = await fetch('/api/auth/teacher-info');
          if (res.ok) {
            const info = await res.json();
            if (info.hasAccount) {
              const prof = dataRepository.getProfile();
              if (prof && prof.email) {
                setUser(prof);
                localStorage.setItem('eps_dz_current_user', JSON.stringify(prof));
              }
            }
          }
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // 1. Authenticate with Online Server Database
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          const prof = json.user;
          // Ensure all classes, students, and pedagogical records are synced
          await dataRepository.syncOnlineDatabase();
          setUser(prof);
          localStorage.removeItem('eps_dz_logged_out');
          localStorage.setItem('eps_dz_current_user', JSON.stringify(prof));
          setIsLoading(false);
          return { success: true };
        } else if (json.error) {
          setIsLoading(false);
          return { success: false, error: json.error };
        }
      }
    } catch {
      // fallback if offline
    }

    const supabase = getSupabase();
    if (supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const prof = dataRepository.getProfile();
          prof.id = data.user.id;
          prof.email = data.user.email || email;
          setUser(prof);
          localStorage.removeItem('eps_dz_logged_out');
          localStorage.setItem('eps_dz_current_user', JSON.stringify(prof));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'فشل الاتصال بـ Supabase' };
      }
    }

    // Local / Offline authentication fallback
    const currentProfile = dataRepository.getProfile();
    currentProfile.email = email;
    setUser(currentProfile);
    localStorage.removeItem('eps_dz_logged_out');
    localStorage.setItem('eps_dz_current_user', JSON.stringify(currentProfile));
    setIsLoading(false);
    return { success: true };
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    schoolName: string,
    wilaya: string,
    municipality?: string,
    academicYear?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // 1. Register with Online Server Database
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          schoolName,
          wilaya,
          municipality,
          academicYear,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          const newProf = json.user;
          setUser(newProf);
          localStorage.removeItem('eps_dz_logged_out');
          localStorage.setItem('eps_dz_current_user', JSON.stringify(newProf));
          setIsLoading(false);
          return { success: true };
        }
      }
    } catch {
      // fallback
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, school_name: schoolName, wilaya },
          },
        });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const newProf = await dataRepository.updateProfile({
            id: data.user.id,
            email,
            full_name: fullName,
            school_name: schoolName,
            wilaya,
          });
          setUser(newProf);
          localStorage.removeItem('eps_dz_logged_out');
          localStorage.setItem('eps_dz_current_user', JSON.stringify(newProf));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'فشل إنشاء الحساب عبر Supabase' };
      }
    }

    // Local account creation
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
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
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
    newPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = await dataRepository.updateProfile(updates);
      setUser(updated);
      localStorage.setItem('eps_dz_current_user', JSON.stringify(updated));

      // Persist to server online database
      await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updated.id,
          email: updated.email,
          fullName: updated.full_name,
          matricule: updated.matricule,
          phone: updated.phone,
          schoolName: updated.school_name,
          wilaya: updated.wilaya,
          municipality: updated.municipality,
          academicYear: updated.academic_year,
          specialty: updated.specialty,
          directorName: updated.director_name,
          inspectorName: updated.inspector_name,
          password: newPassword,
        }),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل تحديث البيانات' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        updateCredentials,
        isSupabaseConnected,
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
