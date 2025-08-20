import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AdminLoginProps {
  onLoginSuccess: (adminData: { id: string; name: string }) => void;
}

export const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [credentials, setCredentials] = useState({
    pin: "",
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
      // Authenticate admin user against database
      const { data, error } = await supabase.rpc('authenticate_admin', {
        user_pin: credentials.pin,
        user_password: credentials.password
      });

      if (error) {
        console.error('Authentication error:', error);
        setError("Authentication failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (data && data.length > 0) {
        const adminUser = data[0];
        // Store admin session
        localStorage.setItem('adminSession', JSON.stringify({
          authenticated: true,
          adminId: adminUser.user_id,
          adminName: adminUser.user_name
        }));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${adminUser.user_name}!`,
        });

        onLoginSuccess({
          id: adminUser.user_id,
          name: adminUser.user_name
        });
      } else {
        setError("Invalid credentials or you don't have admin access");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Login failed. Please try again.");
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
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="text"
                value={credentials.pin}
                onChange={(e) => setCredentials(prev => ({ ...prev, pin: e.target.value }))}
                placeholder="Enter your PIN"
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