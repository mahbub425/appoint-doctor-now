import { AdminLogin as AdminLoginComponent } from "@/components/admin/AdminLogin";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AdminLogin = () => {
  const { adminProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && adminProfile) {
      navigate('/admin');
    }
  }, [adminProfile, loading, navigate]);

  if (loading || adminProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return <AdminLoginComponent />;
};

export default AdminLogin;