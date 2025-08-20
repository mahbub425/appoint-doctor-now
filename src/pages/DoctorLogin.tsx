import { DoctorLogin as DoctorLoginComponent } from "@/components/doctor/DoctorLogin";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DoctorLogin = () => {
  const { doctorProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && doctorProfile) {
      navigate('/doctor');
    }
  }, [doctorProfile, loading, navigate]);

  if (loading || doctorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return <DoctorLoginComponent />; // Removed onLoginSuccess prop
};

export default DoctorLogin;