import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { DoctorScheduleManagement } from "./DoctorScheduleManagement";
import { AppointmentManagementEnhanced } from "./AppointmentManagementEnhanced";
import { UserManagement } from "./UserManagement";
import { DoctorManagement } from "./EnhancedDoctorManagement";
import { AnalyticsDashboardEnhanced } from "./AnalyticsDashboardEnhanced";

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
			<div className="flex w-full">
				<AdminSidebar
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					handleLogout={onLogout}
				/>

				<div className="flex-1 flex flex-col max-w-full overflow-x-auto">
					<div className="md:hidden fixed top-2.5 right-2 size-8 p-0 content-center text-center hover:bg-transparent z-50">
						<SidebarTrigger />
					</div>
					<div className="flex-1 p-4 md:p-6 bg-background">
						{renderContent()}
					</div>
				</div>
			</div>
		</SidebarProvider>
	);
};
