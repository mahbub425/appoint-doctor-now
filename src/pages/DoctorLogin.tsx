import { useState, useEffect } from "react";
import { DoctorLogin as DoctorLoginComponent } from "@/components/doctor/DoctorLogin";
import { useNavigate } from "react-router-dom";

const DoctorLogin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if doctor is already logged in
    const doctorSession = localStorage.getItem('doctorSession');
    if (doctorSession) {
      setIsAuthenticated(true);
      navigate('/doctor');
    }
  }, [navigate]);

  const handleLoginSuccess = (doctor: any) => {
    setIsAuthenticated(true);
    navigate('/doctor');
  };

  if (isAuthenticated) {
    return null; // Will redirect to /doctor
  }

  return <DoctorLoginComponent onLoginSuccess={handleLoginSuccess} />;
};

export default DoctorLogin;