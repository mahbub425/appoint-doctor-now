import { DoctorLogin as DoctorLoginComponent } from "@/components/doctor/DoctorLogin";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DoctorLogin = () => {
  const { doctorProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("DoctorLogin: Auth state changed", { loading, doctorProfile: !!doctorProfile });
    if (!loading && doctorProfile) {
      console.log("DoctorLogin: Redirecting to doctor dashboard");
      navigate('/doctor');
    }
  }, [doctorProfile, loading, navigate]);

  // Removed the problematic if (!loading && doctorProfile) { navigate('/doctor'); return null; }
  // This logic is now handled solely by the useEffect above for better consistency.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return <DoctorLoginComponent />;
};

export default DoctorLogin;