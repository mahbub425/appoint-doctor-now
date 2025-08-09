import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { DoctorScheduleManagement } from "./DoctorScheduleManagement";
import { AppointmentManagementEnhanced } from "./AppointmentManagementEnhanced";
import { UserManagement } from "./UserManagement";
import { DoctorManagement } from "./EnhancedDoctorManagement";
import { AnalyticsDashboardEnhanced } from "./AnalyticsDashboardEnhanced";
import { NotificationIcon } from "@/components/NotificationIcon";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("analytics");

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return <AnalyticsDashboardEnhanced />;
      case "users":
        return <UserManagement />;
      case "doctors":
        return <DoctorManagement />;
      case "schedules":
        return <DoctorScheduleManagement />;
      case "appointments":
        return <AppointmentManagementEnhanced />;
      default:
        return <AnalyticsDashboardEnhanced />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <div className="flex items-center gap-4">
                <NotificationIcon userType="admin" />
                <Button onClick={onLogout} variant="outline">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-background">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};