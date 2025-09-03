import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  pin: string;
  concern: string;
  phone: string;
  email?: string;
  user_role: string;
  is_blocked?: boolean;
  created_at: string;
  username?: string;
}

interface DoctorProfile {
  id: string;
  username: string;
  name: string;
  degree: string;
  experience: string;
  designation: string;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminProfile {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  doctorProfile: DoctorProfile | null;
  adminProfile: AdminProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  pinSignUp: (userData: any) => Promise<{ error: any }>;
  pinSignIn: (pin: string, password?: string, rememberPassword?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isDoctor: boolean;
  isUser: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUserId: string) => {
    try {
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();

      if (doctorData) {
        setDoctorProfile(doctorData);
        setUserProfile(null);
        setAdminProfile(null);
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();

      if (userData) {
        setUserProfile(userData as UserProfile);
        setDoctorProfile(null);
        setAdminProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    
    try {
      const adminSession = localStorage.getItem('adminSession');
      if (adminSession) {
        const adminData = JSON.parse(adminSession);
        if (adminData.authenticated) {
          setAdminProfile({ id: adminData.adminId, name: adminData.adminName, role: adminData.adminRole });
          setUser(null); setSession(null); setUserProfile(null); setDoctorProfile(null);
          setLoading(false); return;
        }
      }

      const doctorSession = localStorage.getItem('doctorSession');
      if (doctorSession) {
        const doctorData = JSON.parse(doctorSession);
        if (doctorData.id) {
          setDoctorProfile(doctorData);
          setUser(null); setSession(null); setUserProfile(null); setAdminProfile(null);
          setLoading(false); return;
        }
      }

      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        const userData = JSON.parse(userSession);
        if (userData.id) {
          setUserProfile(userData as UserProfile);
          setUser(null); setSession(null); setDoctorProfile(null); setAdminProfile(null);
          setLoading(false); return;
        }
      }

      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      setSession(supabaseSession);
      setUser(supabaseSession?.user ?? null);

      if (supabaseSession?.user) {
        await fetchUserProfile(supabaseSession.user.id);
      } else {
        setUserProfile(null);
        setDoctorProfile(null);
        setAdminProfile(null);
      }
    } catch (error) {
      console.error('Error in checkAuthStatus:', error);
      setUserProfile(null); setDoctorProfile(null); setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const adminSess = localStorage.getItem('adminSession');
        const doctorSess = localStorage.getItem('doctorSession');
        const userSess = localStorage.getItem('userSession');

        if ((adminSess || doctorSess || userSess) && !session) {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          localStorage.removeItem('doctorSession');
          localStorage.removeItem('adminSession');
          localStorage.removeItem('userSession');
          setDoctorProfile(null);
          setAdminProfile(null);
          fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setDoctorProfile(null);
          setAdminProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAuthStatus]);

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: userData }
    });
    if (!error && data.user) {
      const { error: profileError } = await supabase.from("users").insert({
        auth_user_id: data.user.id, name: userData.name, pin: userData.pin,
        concern: userData.concern, phone: userData.phone, email: email, user_role: 'user'
      });
      if (profileError) return { error: profileError };
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const pinSignUp = async (userData: any) => {
    const { data: existingUsers, error: checkError } = await supabase
      .from('users').select('id').eq('pin', userData.pin);
    if (checkError) return { error: checkError };
    if (existingUsers && existingUsers.length > 0) {
      return { error: { message: 'PIN already exists' } };
    }
    return await supabase.from('users').insert([{ ...userData, user_role: 'user' }]);
  };

  const pinSignIn = async (pin: string, password?: string) => {
    const { data: users, error } = await supabase.from('users').select('*').eq('pin', pin).eq('password', password);
    if (error) return { error };
    if (!users || users.length === 0) return { error: { message: 'Invalid PIN or password' } };
    const user = users[0];
    if (user.is_blocked) return { error: { message: 'You are blocked by the admin.' } };
    
    localStorage.setItem('userSession', JSON.stringify(user));
    setUserProfile(user as UserProfile);
    setDoctorProfile(null); setAdminProfile(null); setUser(null);
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem('doctorSession');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('userSession');
    localStorage.removeItem('rememberedCredentials');
    localStorage.removeItem('adminRememberedCredentials');
    
    await supabase.auth.signOut();
    
    setUserProfile(null);
    setDoctorProfile(null);
    setAdminProfile(null);
    setUser(null);
    setSession(null);
  };

  const isAdmin = !!adminProfile;
  const isDoctor = !!doctorProfile;
  const isUser = !!userProfile;
  
  const value = {
    user, session, userProfile, doctorProfile, adminProfile, loading,
    signUp, signIn, pinSignUp, pinSignIn, signOut,
    isAdmin, isDoctor, isUser, refreshAuth: checkAuthStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};