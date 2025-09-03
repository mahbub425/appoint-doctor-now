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
  refreshAuth: () => Promise<void>; // Added refreshAuth function
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
      // Check if user is a doctor (using auth_user_id)
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

      // Check if user is a patient (using auth_user_id)
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
      // 1. Check for admin session in localStorage
      const adminSession = localStorage.getItem('adminSession');
      if (adminSession) {
        try {
          const adminData = JSON.parse(adminSession);
          if (adminData.authenticated && adminData.adminId && adminData.adminRole === 'admin') {
            setAdminProfile({ id: adminData.adminId, name: adminData.adminName, role: adminData.adminRole });
            setUserProfile(null);
            setDoctorProfile(null);
            setUser(null); // Clear Supabase auth user if admin session is active
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing admin session:', error);
          localStorage.removeItem('adminSession');
        }
      }

      // 2. Check for doctor session in localStorage
      const doctorSession = localStorage.getItem('doctorSession');
      if (doctorSession) {
        try {
          const doctorData = JSON.parse(doctorSession);
          console.log("AuthContext: Found doctor session", doctorData);
          if (doctorData.id && doctorData.username && doctorData.name) {
            console.log("AuthContext: Setting doctor profile");
            setDoctorProfile(doctorData);
            setUserProfile(null);
            setAdminProfile(null);
            setUser(null); // Clear Supabase auth user if doctor session is active
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing doctor session:', error);
          localStorage.removeItem('doctorSession');
        }
      }

      // 3. Check for user (PIN) session in localStorage
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        try {
          const userData = JSON.parse(userSession);
          if (userData.id && userData.pin) { // Basic validation
            setUserProfile(userData as UserProfile);
            setDoctorProfile(null);
            setAdminProfile(null);
            setUser(null);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing user session:', error);
          localStorage.removeItem('userSession');
        }
      }

      // 4. Finally, check for Supabase auth session (if applicable)
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
      setUserProfile(null);
      setDoctorProfile(null);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  }, []); // useCallback ensures this function is stable

  useEffect(() => {
    checkAuthStatus();

    // Set up auth state listener for regular users (Supabase auth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // If a Supabase user logs in, clear other local storage sessions
          localStorage.removeItem('doctorSession');
          localStorage.removeItem('adminSession');
          localStorage.removeItem('userSession');
          localStorage.removeItem('rememberedCredentials'); // Clear old PIN credentials too
          setDoctorProfile(null);
          setAdminProfile(null);
          fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          // Only clear the supabase-related user profile on sign out
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAuthStatus]); // Dependency on checkAuthStatus

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });

    if (!error && data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          auth_user_id: data.user.id,
          name: userData.name,
          pin: userData.pin,
          concern: userData.concern,
          phone: userData.phone,
          email: email,
          user_role: 'user'
        });

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        return { error: profileError };
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const pinSignUp = async (userData: any) => {
    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, pin')
        .eq('pin', userData.pin);

      if (checkError) {
        console.error('Error checking existing users:', checkError);
        return { error: checkError };
      }

      if (existingUsers && existingUsers.length > 0) {
        return { error: { message: 'PIN already exists' } };
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: userData.name,
          pin: userData.pin,
          concern: userData.concern,
          phone: userData.phone,
          password: userData.password,
          user_role: 'user'
        }])
        .select()
        .single();

      if (error) {
        console.error('User creation error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('PIN signup error:', error);
      return { error };
    }
  };

  const pinSignIn = async (pin: string, password?: string) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .eq('password', password);

      if (error) {
        console.error('PIN login error:', error);
        return { error };
      }

      if (!users || users.length === 0) {
        return { error: { message: 'Invalid PIN or password' } };
      }

      const user = users[0];
      
      if (user.is_blocked === true) {
        return { error: { message: 'You are blocked by the admin you can\'t login your user pannel.' } };
      }
      
      // Store user session in localStorage for persistence
      localStorage.setItem('userSession', JSON.stringify(user));
      
      setDoctorProfile(null);
      setAdminProfile(null);
      setUserProfile(user as UserProfile);
      setUser(null);

      return { error: null };
    } catch (error) {
      console.error('PIN login error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('doctorSession');
      localStorage.removeItem('adminSession');
      localStorage.removeItem('userSession');
      localStorage.removeItem('rememberedCredentials'); // Clean up old data
      
      await supabase.auth.signOut();
      
      setUserProfile(null);
      setDoctorProfile(null);
      setAdminProfile(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isAdmin = !!adminProfile && adminProfile.role === 'admin';
  const isDoctor = !!doctorProfile && !userProfile && !adminProfile;
  const isUser = !!userProfile && userProfile.user_role === 'user' && !doctorProfile && !adminProfile;
  
  const value = {
    user,
    session,
    userProfile,
    doctorProfile,
    adminProfile,
    loading,
    signUp,
    signIn,
    pinSignUp,
    pinSignIn,
    signOut,
    isAdmin,
    isDoctor,
    isUser,
    refreshAuth: checkAuthStatus // Expose the refresh function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};