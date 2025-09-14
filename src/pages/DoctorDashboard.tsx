import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DoctorNav } from "@/components/doctor/DoctorNav";
import { DoctorProfileManagement } from "@/components/doctor/DoctorProfileManagement";
import { DoctorScheduleViewing } from "@/components/doctor/DoctorScheduleViewing";
import { DoctorAppointmentManagementEnhanced } from "@/components/doctor/DoctorAppointmentManagementEnhanced";
import { ConsultationManagement } from "@/components/doctor/ConsultationManagement";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { NotificationIcon } from "@/components/NotificationIcon";

type TabType = "profile" | "schedule" | "appointments" | "consultations";

const DoctorDashboard = () => {
	const [activeTab, setActiveTab] = useState<TabType>("schedule");
	const { doctorProfile, signOut, loading } = useAuth();
	const navigate = useNavigate();
	const [mobileMenu, setMobileMenu] = useState(false);

	useEffect(() => {
		if (!loading && !doctorProfile) {
			// If not loading and no doctor profile, redirect to doctor login
			navigate("/doctor-login");
		}
	}, [doctorProfile, loading, navigate]);

	const handleSignOut = async () => {
		await signOut();
		navigate("/doctor-login");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	if (!doctorProfile) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">No doctor profile found</div>
			</div>
		);
	}

	const renderContent = () => {
		switch (activeTab) {
			case "schedule":
				return <DoctorScheduleViewing />;
			case "appointments":
				return <DoctorAppointmentManagementEnhanced />;
			case "profile":
				return <DoctorProfileManagement />;
			case "consultations":
				return <ConsultationManagement />;
			default:
				return <DoctorScheduleViewing />;
		}
	};

	return (
		<div className="container mx-auto px-4 md:py-8">
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
				<div className="hidden md:block lg:col-span-1">
					<DoctorNav activeTab={activeTab} setActiveTab={setActiveTab} />
				</div>

				{/* Mobile menu */}
				<div className="md:hidden">
					<Button
						variant="ghost"
						className="fixed top-2.5 right-2 size-8 p-0 content-center text-center hover:bg-transparent z-50"
						onClick={() => setMobileMenu(!mobileMenu)}
					>
						{mobileMenu ? (
							<X className="min-h-8 min-w-8 text-primary" />
						) : (
							<Menu className="min-h-8 min-w-8 text-primary" />
						)}
					</Button>
					<div
						className={cn(
							"transition-all duration-300 ease-in-out",
							mobileMenu ? "h-auto opacity-100 pt-4 z-40" : "overflow-hidden h-0 max-h-0 opacity-s0 -z-10",
						)}
					>
						<DoctorNav
							activeTab={activeTab}
							setActiveTab={(tab) => {
								setActiveTab(tab);
								setMobileMenu(false);
							}}
						/>
					</div>
					{/* Backdrop */}
					{/* {mobileMenu && (
						<div
							className="fixed inset-0 bg-black/20 z-30 animate-in fade-in duration-200"
							onClick={() => setMobileMenu(false)}
						/>
					)} */}
				</div>

				<div className="lg:col-span-3">{renderContent()}</div>
			</div>
		</div>
	);
};

export default DoctorDashboard;
