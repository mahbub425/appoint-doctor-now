import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Check,
	Eye,
	Search,
	Trash,
	X,
	RotateCw,
	ArrowDown10,
	HeartPulse,
	Clock,
	Calendar,
	MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Appointment {
	id: string;
	name: string;
	pin: number;
	concern: string;
	phone: string;
	reason: string;
	appointment_date: string;
	appointment_time: string;
	serial_number: number;
	status: string;
	user: {
		name: string;
		pin: string;
	};
}

interface Doctor {
	id: string;
	name: string;
}

export const DoctorAppointmentManagementEnhanced = () => {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedAppointment, setSelectedAppointment] =
		useState<Appointment | null>(null);
	const [activeTab, setActiveTab] = useState("upcoming");
	const [dateFilter, setDateFilter] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const { doctorProfile } = useAuth();

	useEffect(() => {
		if (doctorProfile) {
			fetchAppointments();
			// Cleanup old appointments when component loads
			cleanupOldAppointments();
		}
	}, [doctorProfile]);

	const cleanupOldAppointments = async () => {
		try {
			await supabase.rpc("cleanup_old_appointments");
		} catch (error) {
			console.error("Error cleaning up old appointments:", error);
		}
	};

	const fetchAppointments = async () => {
		if (!doctorProfile) return;

		try {
			const { data, error } = await supabase
				.from("appointments")
				.select(
					`
          *,
          user:users(name, pin)
        `,
				)
				.eq("doctor_id", doctorProfile.id)
				.order("appointment_date", { ascending: false })
				.order("appointment_time", { ascending: true });

			if (error) {
				console.error("Error fetching appointments:", error);
				return;
			}

			// Filter out appointments with invalid user data
			const validAppointments = (data || []).filter(
				(appointment) =>
					appointment &&
					appointment.user &&
					typeof appointment.user === "object" &&
					appointment.user.name,
			);
			setAppointments(validAppointments as Appointment[]);
		} catch (error) {
			console.error("Error fetching appointments:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleMarkAbsent = async (appointmentId: string) => {
		try {
			const { error } = await supabase
				.from("appointments")
				.update({ status: "absent" })
				.eq("id", appointmentId);

			if (error) {
				toast({
					title: "Error",
					description: "Failed to mark appointment as absent",
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Success",
				description: "Appointment marked as absent",
			});

			fetchAppointments();
		} catch (error) {
			toast({
				title: "Error",
				description: "An unexpected error occurred",
				variant: "destructive",
			});
		}
	};

	const handleMarkComplete = async (appointmentId: string) => {
		try {
			const { error } = await supabase
				.from("appointments")
				.update({ status: "completed" })
				.eq("id", appointmentId);

			if (error) {
				toast({
					title: "Error",
					description: "Failed to mark appointment as completed",
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Success",
				description: "Appointment marked as completed",
			});

			fetchAppointments();
		} catch (error) {
			toast({
				title: "Error",
				description: "An unexpected error occurred",
				variant: "destructive",
			});
		}
	};

	const handleResetAppointment = async (appointmentId: string) => {
		try {
			const { error } = await supabase
				.from("appointments")
				.update({ status: "upcoming" })
				.eq("id", appointmentId);

			if (error) {
				toast({
					title: "Error",
					description: "Failed to reset appointment",
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Success",
				description: "Appointment reset to upcoming",
			});

			fetchAppointments();
		} catch (error) {
			toast({
				title: "Error",
				description: "An unexpected error occurred",
				variant: "destructive",
			});
		}
	};

	const getStatusBadge = (appointment: Appointment) => {
		const now = new Date();
		const appointmentDateTime = new Date(
			`${appointment.appointment_date}T${appointment.appointment_time}`,
		);

		switch (appointment.status) {
			case "absent":
				return (
					<Badge className="bg-red-100 text-red-800 hover:bg-red-100">
						Absent
					</Badge>
				);
			case "completed":
				return (
					<Badge className="bg-green-100 text-green-800 hover:bg-green-100">
						Completed
					</Badge>
				);
			default:
				if (appointmentDateTime < now) {
					return (
						<Badge className="bg-green-100 text-green-800 hover:bg-green-100">
							Completed
						</Badge>
					);
				}
				return (
					<Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
						Upcoming
					</Badge>
				);
		}
	};

	const getReasonBadge = (reason: string) => {
		switch (reason) {
			case "New Patient":
				return (
					<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
						{reason}
					</Badge>
				);
			case "Follow Up":
				return (
					<Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
						{reason}
					</Badge>
				);
			case "Report Show":
				return (
					<Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
						{reason}
					</Badge>
				);
			default:
				return <Badge variant="outline">{reason}</Badge>;
		}
	};

	const filterAppointments = (status: string) => {
		const now = new Date();
		let filteredAppointments = appointments;

		// Apply search filter
		if (searchTerm) {
			filteredAppointments = appointments.filter(
				(apt) =>
					apt.pin.toString().includes(searchTerm) ||
					apt.name.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		}

		// Apply date filter if set
		if (dateFilter) {
			filteredAppointments = filteredAppointments.filter(
				(apt) => apt.appointment_date === dateFilter,
			);
		}

		switch (status) {
			case "upcoming":
				return filteredAppointments.filter((apt) => {
					const appointmentDateTime = new Date(
						`${apt.appointment_date}T${apt.appointment_time}`,
					);
					return (
						appointmentDateTime >= now &&
						apt.status !== "absent" &&
						apt.status !== "completed"
					);
				});
			case "past":
				return filteredAppointments.filter((apt) => {
					const appointmentDateTime = new Date(
						`${apt.appointment_date}T${apt.appointment_time}`,
					);
					return (
						appointmentDateTime < now ||
						apt.status === "completed" ||
						apt.status === "absent"
					);
				});
			default:
				return filteredAppointments;
		}
	};

	const getTotalAppointments = () => {
		return appointments.length;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-GB");
	};

	const getTabCount = (tabName: string) => {
		return filterAppointments(tabName).length;
	};

	if (loading) {
		return <div className="text-center py-8">Loading appointments...</div>;
	}

	return (
		<div className="space-y-6">
			{/* Search and Filter Controls */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4"
			>
				<div className="flex flex-col-reverse md:flex-row justify-between md:items-center gap-3">
					<TabsList className="w-full md:w-max bg-transparent md:bg-muted">
						<TabsTrigger
							value="upcoming"
							className="flex-grow md:text-base border-b md:border-0 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none data-[state=active]:shadow-none md:data-[state=active]:shadow-sm"
						>
							Upcoming ({getTabCount("upcoming")})
						</TabsTrigger>
						<TabsTrigger
							value="past"
							className="flex-grow md:text-base border-b md:border-0 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none data-[state=active]:shadow-none md:data-[state=active]:shadow-sm"
						>
							Past ({getTabCount("past")})
						</TabsTrigger>
					</TabsList>
					<div className="flex items-center gap-3 relative">
						<Label htmlFor="date-filter text-accent-foreground">
							Filter by Date
						</Label>
						<Input
							id="date-filter"
							type="date"
							value={dateFilter}
							onChange={(e) => setDateFilter(e.target.value)}
							className={`${
								dateFilter || searchTerm ? "w-48" : "w-max"
							} border border-primary/30`}
						/>
						{(dateFilter || searchTerm) && (
							<Button
								variant="link"
								onClick={() => {
									setDateFilter("");
									setSearchTerm("");
								}}
								className="absolute right-0 border-l border-primary/30 rounded-none p-3 text-red-500"
							>
								<Trash />
							</Button>
						)}
					</div>
				</div>
				<div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
					<p className="text-sm text-muted-foreground">
						Total: {getTotalAppointments()} Appointments
					</p>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by PIN or Name..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="text-sm md:text-base pl-10 md:w-64"
						/>
					</div>
				</div>

				<TabsContent value="upcoming">
					<AppointmentTable
						appointments={filterAppointments("upcoming")}
						onMarkAbsent={handleMarkAbsent}
						onMarkComplete={handleMarkComplete}
						onResetAppointment={handleResetAppointment}
						onViewDetails={setSelectedAppointment}
						showAbsentAction={true}
						showCompleteAction={true}
						showResetAction={false}
						showStatusColumn={false}
						getReasonBadge={getReasonBadge}
						getStatusBadge={getStatusBadge}
						currentPage={currentPage}
						itemsPerPage={itemsPerPage}
						setCurrentPage={setCurrentPage}
						setItemsPerPage={setItemsPerPage}
					/>
				</TabsContent>

				<TabsContent value="past">
					<AppointmentTable
						appointments={filterAppointments("past")}
						onMarkAbsent={handleMarkAbsent}
						onMarkComplete={handleMarkComplete}
						onResetAppointment={handleResetAppointment}
						onViewDetails={setSelectedAppointment}
						showAbsentAction={false}
						showCompleteAction={false}
						showResetAction={true}
						showStatusColumn={true}
						getReasonBadge={getReasonBadge}
						getStatusBadge={getStatusBadge}
						currentPage={currentPage}
						itemsPerPage={itemsPerPage}
						setCurrentPage={setCurrentPage}
						setItemsPerPage={setItemsPerPage}
					/>
				</TabsContent>
			</Tabs>

			{/* Patient Details Dialog */}
			<Dialog
				open={!!selectedAppointment}
				onOpenChange={() => setSelectedAppointment(null)}
			>
				<DialogContent className="rounded-t-lg md:rounded-lg bottom-0 md:bottom-auto top-auto md:top-2/4 translate-y-0 md:translate-y-[-50%]">
					<DialogHeader>
						<DialogTitle className="text-primary md:text-xl text-left">
							Patient Details
						</DialogTitle>
					</DialogHeader>
					{selectedAppointment && (
						<div className="space-y-4">
							<div className="grid md:grid-cols-2 gap-4 text-sm md:text-base">
								<div>
									<p className="font-medium">Name:</p>
									<p className="text-muted-foreground">
										{selectedAppointment.name}
									</p>
								</div>
								<div>
									<p className="font-medium">PIN:</p>
									<p className="text-muted-foreground">
										{selectedAppointment.pin}
									</p>
								</div>
								<div>
									<p className="font-medium">User PIN:</p>
									<p className="text-muted-foreground">
										{selectedAppointment.user?.pin || "N/A"}
									</p>
								</div>
								<div>
									<p className="font-medium">Phone:</p>
									<p className="text-muted-foreground">
										{selectedAppointment.phone}
									</p>
								</div>
								<div>
									<p className="font-medium">Concern:</p>
									<p className="text-muted-foreground">
										{selectedAppointment.concern}
									</p>
								</div>
								<div>
									<p className="font-medium">Reason:</p>
									<p className="text-muted-foreground">
										{selectedAppointment.reason}
									</p>
								</div>
							</div>
							<div>
								<p className="font-medium">Appointment Details:</p>
								<p className="text-muted-foreground">
									{formatDate(selectedAppointment.appointment_date)} at{" "}
									{selectedAppointment.appointment_time}
									(Serial: {selectedAppointment.serial_number})
								</p>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};

interface AppointmentTableProps {
	appointments: Appointment[];
	onMarkAbsent: (id: string) => void;
	onMarkComplete: (id: string) => void;
	onResetAppointment: (id: string) => void;
	onViewDetails: (appointment: Appointment) => void;
	showAbsentAction: boolean;
	showCompleteAction: boolean;
	showResetAction: boolean;
	showStatusColumn: boolean;
	getReasonBadge: (reason: string) => JSX.Element;
	getStatusBadge: (appointment: Appointment) => JSX.Element;
	currentPage: number;
	itemsPerPage: number;
	setCurrentPage: (page: number) => void;
	setItemsPerPage: (items: number) => void;
}

const AppointmentTable = ({
	appointments,
	onMarkAbsent,
	onMarkComplete,
	onResetAppointment,
	onViewDetails,
	showAbsentAction,
	showCompleteAction,
	showResetAction,
	showStatusColumn = false,
	getReasonBadge,
	getStatusBadge,
	currentPage,
	itemsPerPage,
	setCurrentPage,
	setItemsPerPage,
}: AppointmentTableProps) => {
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-GB");
	};

	const totalPages = Math.ceil(appointments.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentAppointments = appointments.slice(startIndex, endIndex);

	if (appointments.length === 0) {
		return (
			<Card>
				<CardContent className="py-8">
					<div className="text-center text-muted-foreground">
						No appointments found.
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-none md:border bg-transparent md:bg-white shadow-none md:shadow">
			<CardContent className="p-0 pb-10 md:p-6">
				{/* Desktop Table View */}
				<div className="hidden md:block">
					<Table>
						<TableHeader>
							<TableRow className="[&>th]:text-center">
								<TableHead>Date</TableHead>
								<TableHead>Time</TableHead>
								<TableHead>Serial</TableHead>
								<TableHead>PIN</TableHead>
								<TableHead>Patient</TableHead>
								<TableHead>Concern</TableHead>
								<TableHead>Reason</TableHead>
								{showStatusColumn && <TableHead>Status</TableHead>}
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{currentAppointments.map((appointment) => (
								<TableRow key={appointment.id}>
									<TableCell>
										{formatDate(appointment.appointment_date)}
									</TableCell>
									<TableCell>{appointment.appointment_time}</TableCell>
									<TableCell>{appointment.serial_number}</TableCell>
									<TableCell>{appointment.pin}</TableCell>
									<TableCell>{appointment.name}</TableCell>
									<TableCell>{appointment.concern}</TableCell>
									<TableCell className="whitespace-nowrap">
										{getReasonBadge(appointment.reason)}
									</TableCell>
									{showStatusColumn && (
										<TableCell>{getStatusBadge(appointment)}</TableCell>
									)}
									<TableCell>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="ghost"
												onClick={() => onViewDetails(appointment)}
												className="size-7 bg-accent"
											>
												<Eye />
											</Button>
											{showResetAction && (
												<Button
													size="sm"
													variant="default"
													onClick={() => onResetAppointment(appointment.id)}
													className="h-7 text-[12px]"
													title="Reset to Upcoming"
												>
													<RotateCw className="size-2" /> Reset
												</Button>
                      )}
                      
											{showAbsentAction && (
												<Button
													size="sm"
													variant="destructive"
													onClick={() => onMarkAbsent(appointment.id)}
													className="h-7 text-[12px] px-2 bg-transparent border border-red-200 text-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
													disabled={new Date(appointment.appointment_date).toDateString() !== new Date().toDateString()}
												>
													<X /> Absent
												</Button>
											)}
											{showCompleteAction && (
												<Button
													size="sm"
													onClick={() => onMarkComplete(appointment.id)}
													className="h-7 text-[12px] px-2 bg-green-600/80 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
													disabled={new Date(appointment.appointment_date).toDateString() !== new Date().toDateString()}
												>
													<Check /> Complete
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Mobile Card View */}
				<div className="md:hidden space-y-4">
					{currentAppointments.map((appointment) => (
						<Card
							key={appointment.id}
							className="border rounded-lg p-4 shadow-sm"
						>
							<div className="space-y-3">
								{/* Patient Name Header */}
								<div className="grid grid-cols-[1fr_40px] items-start">
									<h3 className="font-semibold text-lg">{appointment.name}</h3>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => onViewDetails(appointment)}
										className="size-8 p-0"
									>
										<Eye className="size-4 ms-auto" />
									</Button>
								</div>

								{/* Appointment Details */}
								<div className="space-y-2 text-sm">
									<div className="flex items-center gap-2">
										<ArrowDown10 className="size-4 text-gray-400" />
										<span className="font-medium">
											#{appointment.serial_number}
										</span>
									</div>

									<div className="flex items-center gap-2">
										<HeartPulse className="size-4 text-gray-400" />
										<span>
											{appointment.reason === "New Patient"
												? "New Patient"
												: "Follow Up"}
										</span>
									</div>

									<div className="flex items-center gap-2">
										<Clock className="size-4 text-gray-400" />
										<span>{appointment.appointment_time}</span>
									</div>

									<div className="flex items-center gap-2">
										<Calendar className="size-4 text-gray-400" />
										<span>{formatDate(appointment.appointment_date)}</span>
									</div>

									<div className="flex items-center gap-2">
										<MapPin className="size-4 text-gray-400" />
										<span>{appointment.concern}</span>
									</div>
								</div>

								{/* Status Badge for Past Appointments */}
								{showStatusColumn && (
									<div className="pt-2">{getStatusBadge(appointment)}</div>
								)}

								{/* Action Buttons */}
								<div className="flex gap-2 pt-2">
									{showResetAction && (
										<Button
											variant="default"
											onClick={() => onResetAppointment(appointment.id)}
											className="flex-1 h-10"
										>
											<RotateCw className="size-4 mr-2" /> Reset
										</Button>
									)}
									{showAbsentAction && (
										<Button
											variant="outline"
											onClick={() => onMarkAbsent(appointment.id)}
											className="flex-1 h-10 bg-white text-red-500 border-red-200 hover:bg-red-50"
										>
											<X className="size-4 mr-1" /> Absent
										</Button>
									)}
									{showCompleteAction && (
										<Button
											onClick={() => onMarkComplete(appointment.id)}
											className="flex-1 h-10 bg-green-600/80 hover:bg-green-700 text-white"
										>
											<Check className="size-4 mr-1" /> Complete
										</Button>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>

				<div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
					<div className="flex gap-2 items-center">
						<Label className="text-sm">Show:</Label>
						<Select
							value={itemsPerPage.toString()}
							onValueChange={(value) => setItemsPerPage(Number(value))}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10</SelectItem>
								<SelectItem value="20">20</SelectItem>
								<SelectItem value="50">50</SelectItem>
								<SelectItem value="100">100</SelectItem>
							</SelectContent>
						</Select>
						<div className="text-sm text-muted-foreground ml-4">
							Total: {appointments.length} appointments
						</div>
					</div>

					{totalPages > 1 && (
						<div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
							<div className="text-sm text-muted-foreground">
								Showing {startIndex + 1} to{" "}
								{Math.min(endIndex, appointments.length)} of{" "}
								{appointments.length} appointments
							</div>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href="#"
											onClick={(e) => {
												e.preventDefault();
												if (currentPage > 1) setCurrentPage(currentPage - 1);
											}}
											className={
												currentPage === 1
													? "pointer-events-none opacity-50"
													: ""
											}
										/>
									</PaginationItem>

									{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
										let pageNum;
										if (totalPages <= 5) {
											pageNum = i + 1;
										} else if (currentPage <= 3) {
											pageNum = i + 1;
										} else if (currentPage >= totalPages - 2) {
											pageNum = totalPages - 4 + i;
										} else {
											pageNum = currentPage - 2 + i;
										}

										return (
											<PaginationItem key={pageNum}>
												<PaginationLink
													href="#"
													onClick={(e) => {
														e.preventDefault();
														setCurrentPage(pageNum);
													}}
													isActive={currentPage === pageNum}
												>
													{pageNum}
												</PaginationLink>
											</PaginationItem>
										);
									})}

									<PaginationItem>
										<PaginationNext
											href="#"
											onClick={(e) => {
												e.preventDefault();
												if (currentPage < totalPages)
													setCurrentPage(currentPage + 1);
											}}
											className={
												currentPage === totalPages
													? "pointer-events-none opacity-50"
													: ""
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
