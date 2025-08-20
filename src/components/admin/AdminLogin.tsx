import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AdminLoginProps {
  onLoginSuccess: (adminData: { id: string; name: string; role: string }) => void;
}

export const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Trim whitespace from username and password
      const trimmedUsername = credentials.username.trim();
      const trimmedPassword = credentials.password.trim();

      // Authenticate admin user against database using username and password
      const { data, error } = await supabase.rpc('authenticate_admin', {
        admin_username: trimmedUsername,
        admin_password: trimmedPassword
      });

      if (error) {
        console.error('Authentication error:', error);
        setError("Authentication failed. Please try again. Details: " + error.message);
        setIsSubmitting(false);
        return;
      }

      if (data && data.length > 0) {
        const adminUser = data[0];
        // Store admin session
        localStorage.setItem('adminSession', JSON.stringify({
          authenticated: true,
          adminId: adminUser.user_id,
          adminName: adminUser.user_name,
          adminRole: adminUser.user_role
        }));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${adminUser.user_name}!`,
        });

        onLoginSuccess({
          id: adminUser.user_id,
          name: adminUser.user_name,
          role: adminUser.user_role
        });
      } else {
        setError("Invalid credentials or you don't have admin access. Please check your username, password, and ensure your account has the 'admin' role and is not blocked.");
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError("Login failed. An unexpected error occurred: " + err.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
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
                placeholder="Enter your username"
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
                placeholder="Enter your password"
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