import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { DoctorNav } from "@/components/doctor/DoctorNav";
import { DoctorProfileManagement } from "@/components/doctor/DoctorProfileManagement";
import { DoctorScheduleViewing } from "@/components/doctor/DoctorScheduleViewing";
import { DoctorAppointmentManagementEnhanced } from "@/components/doctor/DoctorAppointmentManagementEnhanced";
import { ConsultationManagement } from "@/components/doctor/ConsultationManagement";
import { NotificationIcon } from "@/components/NotificationIcon";
import { useNavigate } from "react-router-dom";

type TabType = "profile" | "schedule" | "appointments" | "consultations";

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>("appointments");
  const { doctorProfile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !doctorProfile) {
      // If not loading and no doctor profile, redirect to doctor login
      navigate('/doctor-login');
    }
  }, [doctorProfile, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/doctor-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">No doctor profile found</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <DoctorProfileManagement />;
      case "schedule":
        return <DoctorScheduleViewing />;
      case "appointments":
        return <DoctorAppointmentManagementEnhanced />;
      case "consultations":
        return <ConsultationManagement />;
      default:
        return <DoctorAppointmentManagementEnhanced />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome, Dr. {doctorProfile.name.split(' ').pop()}</h1>
              <p className="text-sm text-muted-foreground">{doctorProfile.designation}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationIcon userType="doctor" />
              <Button onClick={handleSignOut} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <DoctorNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;