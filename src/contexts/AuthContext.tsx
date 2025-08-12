
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  doctorProfile: any | null;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for doctor session in localStorage
    const checkDoctorSession = () => {
      const doctorSession = localStorage.getItem('doctorSession');
      if (doctorSession) {
        try {
          const doctorData = JSON.parse(doctorSession);
          setDoctorProfile(doctorData);
          setLoading(false);
          return true;
        } catch (error) {
          console.error('Error parsing doctor session:', error);
          localStorage.removeItem('doctorSession');
        }
      }
      return false;
    };

    // First check for doctor session
    if (checkDoctorSession()) {
      return;
    }

    // Set up auth state listener for regular users
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear doctor profile when regular user signs in
        if (session?.user) {
          setDoctorProfile(null);
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
          setDoctorProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

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
      // Use the secure authentication function to check if PIN already exists
      const { data: existingUser, error: checkError } = await supabase
        .rpc('authenticate_user_by_pin', { 
          user_pin: userData.pin, 
          user_phone: userData.phone 
        });

      if (checkError) {
        console.error('PIN check error:', checkError);
        return { error: checkError };
      }

      if (existingUser && existingUser.length > 0) {
        return { error: { message: 'PIN already exists' } };
      }

      // Insert user without Supabase auth
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
      // For PIN-only authentication, we need to get user data securely
      if (!password) {
        // Use the secure function for PIN authentication by phone
        // First, we need to find the user's phone number through a separate query
        // This is a limitation of the current approach - we need phone number for secure auth
        console.log("PIN-only authentication requires phone number lookup");
        return { error: { message: 'Phone number required for secure authentication' } };
      }

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
      
      console.log("User data fetched:", user);
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
      
      // Clear doctor profile and set user profile for PIN login
      setDoctorProfile(null);
      setUserProfile(user);
      
      // Create a mock user object for compatibility
      const mockUser = {
        id: user.id,
        email: user.pin + '@mock.local', // Mock email for compatibility
        user_metadata: { name: user.name }
      };
      
      console.log("Setting mock user:", mockUser);
      setUser(mockUser as any);

      return { error: null };
    } catch (error) {
      console.error('PIN login error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear doctor session from localStorage
      localStorage.removeItem('doctorSession');
      
      // Sign out from Supabase auth
      await supabase.auth.signOut();
      
      setUserProfile(null);
      setDoctorProfile(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Check user roles
  const isAdmin = user?.email === "admin@admin.com" || false;
  const isDoctor = !!doctorProfile && !userProfile; // Only doctor if no user profile
  const isUser = !!userProfile && !doctorProfile; // Only user if no doctor profile
  
  console.log("Auth state - user:", !!user, "userProfile:", !!userProfile, "doctorProfile:", !!doctorProfile, "isUser:", isUser, "isDoctor:", isDoctor, "isAdmin:", isAdmin);

  const value = {
    user,
    session,
    userProfile,
    doctorProfile,
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
