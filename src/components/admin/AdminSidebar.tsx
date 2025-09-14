import {
	BarChart3,
	Users,
	UserCheck,
	Calendar,
	ClipboardList,
	LogOut,
	X,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AdminSidebarProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
	handleLogout: () => void;
}

const menuItems = [
	{ id: "analytics", label: "Analytics", icon: BarChart3 },
	{ id: "users", label: "Users", icon: Users },
	{ id: "doctors", label: "Doctors", icon: UserCheck },
	{ id: "schedules", label: "Schedules", icon: Calendar },
	{ id: "appointments", label: "Appointments", icon: ClipboardList },
];

export function AdminSidebar({
	activeTab,
	setActiveTab,
	handleLogout,
}: AdminSidebarProps) {
	const navigate = useNavigate();
	const { isMobile, setOpenMobile } = useSidebar();

	const handleMenuClick = (tabId: string) => {
		setActiveTab(tabId);
		// Close sidebar on mobile after selection
		if (isMobile) {
			setOpenMobile(false);
		}
	};

	return (
		<Sidebar collapsible="offcanvas" className={`pt-[72px]`}>
			<SidebarContent>
				<div className="flex justify-between md:hidden px-4 py-3 border-b">
					<img
						src="/images/logo.png"
						alt="Logo"
						onClick={() => navigate("/")}
						className="cursor-pointer h-8 md:h-10"
					/>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setOpenMobile(false)}
						className="-mt-2 -me-3"
					>
						<X />
					</Button>
				</div>
				<SidebarGroup className="flex-grow md:pt-3">
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => (
								<SidebarMenuItem key={item.id}>
									<SidebarMenuButton
										asChild
										className={
											activeTab === item.id
												? "bg-primary text-primary-foreground"
												: ""
										}
									>
										<button
											onClick={() => handleMenuClick(item.id)}
											className="w-full flex items-center"
										>
											<item.icon className="h-4 w-4" />
											<span>{item.label}</span>
										</button>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup className="py-4">
					<Button
						onClick={() => {
							handleLogout();
							if (isMobile) {
								setOpenMobile(false);
							}
						}}
						variant="ghost"
						className="w-max"
					>
						<LogOut className="h-4 w-4 mr-2" />
						Logout
					</Button>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
