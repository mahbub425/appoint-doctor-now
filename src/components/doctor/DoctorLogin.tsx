
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type AuthenticatedDoctor = Database['public']['Functions']['authenticate_doctor']['Returns'][number];

export const DoctorLogin = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      console.log("Attempting doctor login with username:", credentials.username);
      
      const { data, error: rpcError } = await supabase.rpc('authenticate_doctor', {
        doctor_username: credentials.username,
        doctor_password: credentials.password
      });

      const doctors: AuthenticatedDoctor[] | null = data as AuthenticatedDoctor[] | null;

      if (rpcError) {
        console.error("RPC authentication error:", rpcError);
        throw rpcError;
      }

      console.log("Authenticated doctor data from RPC:", doctors);

      if (!doctors || doctors.length === 0) {
        setError("Invalid username or password, or your account is inactive.");
        setIsSubmitting(false);
        return;
      }

      const doctor = doctors[0];
      
      localStorage.setItem('doctorSession', JSON.stringify({
        id: doctor.id,
        username: doctor.username,
        name: doctor.name,
        degree: doctor.degree,
        experience: doctor.experience,
        designation: doctor.designation,
        specialties: doctor.specialties,
        is_active: doctor.is_active,
        created_at: doctor.created_at,
        updated_at: doctor.updated_at
      }));
      
      toast({
        title: "Login Successful",
        description: `Welcome, Dr. ${doctor.name}`,
      });
      
      // Refresh auth context and wait for it to complete
      await refreshAuth();
      
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        console.log("Doctor login completed, navigating to doctor dashboard");
        navigate('/doctor');
      }, 100);
      
    } catch (error: any) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <UserCheck className="h-5 w-5" />
            Doctor Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the doctor panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
