import { DoctorLogin as DoctorLoginComponent } from "@/components/doctor/DoctorLogin";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DoctorLogin = () => {
  const { doctorProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If loading is complete and doctorProfile exists, redirect to doctor dashboard
    if (!loading && doctorProfile) {
      navigate('/doctor');
    }
  }, [doctorProfile, loading, navigate]);

  // If still loading or doctorProfile exists (and will redirect), show a loading state or null
  if (loading || doctorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If not loading and no doctorProfile, render the login component
  return <DoctorLoginComponent onLoginSuccess={() => navigate('/doctor')} />;
};

export default DoctorLogin;