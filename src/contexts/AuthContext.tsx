import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  doctorProfile: any | null;
  adminProfile: any | null; // Added adminProfile
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  pinSignUp: (userData: any) => Promise<{ error: any }>;
  pinSignIn: (pin: string, password?: string, rememberPassword?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isDoctor: boolean;
  isUser: boolean;
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
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any | null>(null);
  const [adminProfile, setAdminProfile] = useState<any | null>(null); // State for admin profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      // Check for admin session in localStorage first
      const adminSession = localStorage.getItem('adminSession');
      if (adminSession) {
        try {
          const adminData = JSON.parse(adminSession);
          if (adminData.authenticated && adminData.adminId) {
            setAdminProfile(adminData);
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

      // Then check for doctor session
      const doctorSession = localStorage.getItem('doctorSession');
      if (doctorSession) {
        try {
          const doctorData = JSON.parse(doctorSession);
          setDoctorProfile(doctorData);
          setUserProfile(null);
          setAdminProfile(null);
          setUser(null); // Clear Supabase auth user if doctor session is active
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing doctor session:', error);
          localStorage.removeItem('doctorSession');
        }
      }

      // Finally, check for Supabase auth session
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
      setLoading(false);
    };

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
          setDoctorProfile(null);
          setAdminProfile(null);
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setDoctorProfile(null);
          setAdminProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUserId: string) => {
    try {
      // Check if user is a doctor
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

      // Check if user is a patient
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();

      if (userData) {
        setUserProfile(userData);
        setDoctorProfile(null);
        setAdminProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

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
          email: email
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
      // Insert user without checking existing PIN (let database handle constraints)
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: userData.name,
          pin: userData.pin,
          concern: userData.concern,
          phone: userData.phone,
          password: userData.password
        }])
        .select()
        .single();

      if (error) {
        // Check if error is due to duplicate PIN
        if (error.message.includes('duplicate') || error.code === '23505') {
          return { error: { message: 'PIN already exists' } };
        }
        console.error('User creation error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('PIN signup error:', error);
      return { error };
    }
  };

  const pinSignIn = async (pin: string, password?: string, rememberPassword?: boolean) => {
    try {
      // For PIN + password authentication, use direct query (allowed by RLS for authentication)
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
      
      console.log("User data fetched for PIN login:", user);
      console.log("User is_blocked status:", user.is_blocked);
      
      // Check if user is blocked
      if (user.is_blocked === true) {
        console.log("User is blocked, preventing login");
        return { error: { message: 'You are blocked by the admin you can\'t login your user pannel.' } };
      }
      
      console.log("PIN login successful, user data:", user);
      
      // Handle remember password functionality
      if (rememberPassword && password) {
        // Store credentials securely in localStorage for auto-login
        localStorage.setItem('rememberedCredentials', JSON.stringify({
          pin: pin,
          password: password,
          timestamp: Date.now()
        }));
      }
      
      // Clear other profiles and set user profile for PIN login
      setDoctorProfile(null);
      setAdminProfile(null);
      setUserProfile(user);
      
      // Create a mock user object for compatibility if needed, otherwise rely on userProfile
      // For now, we'll keep user as null for PIN-based logins to clearly distinguish
      setUser(null); 

      return { error: null };
    } catch (error) {
      console.error('PIN login error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear all sessions from localStorage
      localStorage.removeItem('doctorSession');
      localStorage.removeItem('adminSession');
      localStorage.removeItem('rememberedCredentials');
      
      // Sign out from Supabase auth
      await supabase.auth.signOut();
      
      setUserProfile(null);
      setDoctorProfile(null);
      setAdminProfile(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Determine roles based on active profiles
  const isAdmin = !!adminProfile;
  const isDoctor = !!doctorProfile && !userProfile && !adminProfile; // Only doctor if no user/admin profile
  const isUser = !!userProfile && !doctorProfile && !adminProfile; // Only user if no doctor/admin profile
  
  console.log("Auth state - user:", !!user, "userProfile:", !!userProfile, "doctorProfile:", !!doctorProfile, "adminProfile:", !!adminProfile, "isUser:", isUser, "isDoctor:", isDoctor, "isAdmin:", isAdmin);

  const value = {
    user,
    session,
    userProfile,
    doctorProfile,
    adminProfile, // Added adminProfile to context value
    loading,
    signUp,
    signIn,
    pinSignUp,
    pinSignIn,
    signOut,
    isAdmin,
    isDoctor,
    isUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};