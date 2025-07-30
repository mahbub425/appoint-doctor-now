import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    pin: "",
    concern: "",
    phone: ""
  });

  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive"
      });
      return;
    }

    if (isSignUp) {
      if (!formData.name || !formData.pin || !formData.concern || !formData.phone) {
        toast({
          title: "Error",
          description: "All fields are required for registration",
          variant: "destructive"
        });
        return;
      }

      // Validate phone number format
      const phoneRegex = /^[0-9]{11}$/;
      if (!phoneRegex.test(formData.phone)) {
        toast({
          title: "Error",
          description: "Please enter a valid 11-digit phone number",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, {
          name: formData.name,
          pin: formData.pin,
          concern: formData.concern,
          phone: formData.phone
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Error",
              description: "Email already registered. Please sign in instead.",
              variant: "destructive"
            });
          } else if (error.message.includes("PIN already exists")) {
            toast({
              title: "Error",
              description: "PIN already exists. Please choose a different PIN.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Account created successfully! Please check your email to verify your account."
          });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          toast({
            title: "Error",
            description: "Invalid email or password",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Signed in successfully!"
          });
          navigate("/");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Create a new account to book appointments" 
              : "Sign in to your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  value={formData.pin}
                  onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
                  placeholder="Enter a unique PIN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concern">Concern</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, concern: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your concern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPL">OPL</SelectItem>
                    <SelectItem value="OG">OG</SelectItem>
                    <SelectItem value="Udvash">Udvash</SelectItem>
                    <SelectItem value="Rokomari">Rokomari</SelectItem>
                    <SelectItem value="Unmesh">Unmesh</SelectItem>
                    <SelectItem value="Uttoron">Uttoron</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter 11-digit phone number"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;