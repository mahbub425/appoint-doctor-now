
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { DoctorNav } from "@/components/doctor/DoctorNav";
import { DoctorProfileManagement } from "@/components/doctor/DoctorProfileManagement";
import { DoctorScheduleViewing } from "@/components/doctor/DoctorScheduleViewing";
import { DoctorAppointmentManagementEnhanced } from "@/components/doctor/DoctorAppointmentManagementEnhanced";
import { ConsultationManagement } from "@/components/doctor/ConsultationManagement";
import { useNavigate } from "react-router-dom";

type TabType = "profile" | "schedule" | "appointments" | "consultations";

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>("appointments");
  const [localDoctorProfile, setLocalDoctorProfile] = useState<any>(null);
  const { doctorProfile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for doctor session
    const doctorSession = localStorage.getItem('doctorSession');
    if (doctorSession) {
      try {
        const doctorData = JSON.parse(doctorSession);
        setLocalDoctorProfile(doctorData);
      } catch (error) {
        console.error('Error parsing doctor session:', error);
        localStorage.removeItem('doctorSession');
        navigate('/doctor-login');
      }
    } else if (!loading && !doctorProfile) {
      // If no doctor session and not loading, redirect to login
      navigate('/doctor-login');
    }
  }, [doctorProfile, loading, navigate]);

  const currentDoctorProfile = localDoctorProfile || doctorProfile;

  const handleSignOut = async () => {
    localStorage.removeItem('doctorSession');
    await signOut();
    navigate('/doctor-login');
  };

  if (loading && !localDoctorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentDoctorProfile) {
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
              <h1 className="text-2xl font-bold">Welcome, Dr. {currentDoctorProfile.name.split(' ').pop()}</h1>
              <p className="text-sm text-muted-foreground">{currentDoctorProfile.designation}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Logout
            </Button>
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
