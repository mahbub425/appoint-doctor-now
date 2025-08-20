import { useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { adminProfile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !adminProfile) {
      // If not loading and no admin profile, redirect to admin login page
      navigate("/admin-login"); // Assuming /admin-login is the correct path for admin login
    }
  }, [loading, adminProfile, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!adminProfile) {
    // If not loading and no admin profile, render AdminLogin (or let useEffect redirect)
    return <AdminLogin onLoginSuccess={() => {}} />; // onLoginSuccess will be handled by AuthContext
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard onLogout={handleLogout} />
    </div>
  );
};

export default Admin;