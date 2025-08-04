import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { NoticeSection } from "@/components/NoticeSection";

interface DoctorSchedule {
  id: string;
  availability_date: string;
  start_time: string;
  break_start: string;
  break_end: string;
  end_time: string;
  max_appointments: number;
}

interface Appointment {
  id: string;
  name: string;
  pin: number;
  concern: string;
  phone: string;
  reason: string;
  appointment_date: string;
  serial_number: number;
  appointment_time: string;
  status: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isDoctor, isUser, loading } = useAuth();

  useEffect(() => {
    console.log("Index.tsx redirect check - loading:", loading, "user:", !!user, "isAdmin:", isAdmin, "isDoctor:", isDoctor, "isUser:", isUser);
    
    if (!loading && user) {
      if (isAdmin) {
        console.log("Redirecting to admin");
        navigate("/admin");
      } else if (isDoctor) {
        console.log("Redirecting to doctor");
        navigate("/doctor");
      } else if (isUser) {
        console.log("Redirecting to user");
        navigate("/user");
      }
    }
  }, [user, isAdmin, isDoctor, isUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NoticeSection />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Patient Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Book appointments, view medical history, and manage your profile.
              </p>
              <Button 
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Access Patient Portal
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Doctor Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Manage your schedule, view appointments, and handle consultations.
              </p>
              <Button 
                onClick={() => navigate("/doctor-login")}
                className="w-full"
                variant="outline"
              >
                Doctor Login
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Admin Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Complete system management, user oversight, and analytics.
              </p>
              <Button 
                onClick={() => navigate("/admin")}
                className="w-full"
                variant="secondary"
              >
                Admin Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
