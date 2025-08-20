import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession);
        if (sessionData.authenticated && sessionData.adminId) {
          setIsAuthenticated(true);
          setAdminData({
            id: sessionData.adminId,
            name: sessionData.adminName
          });
        }
      } catch (error) {
        console.error('Error parsing admin session:', error);
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  const handleLoginSuccess = (userData: { id: string; name: string }) => {
    setIsAuthenticated(true);
    setAdminData(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setAdminData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Admin;