import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DoctorScheduleForm } from "./DoctorScheduleForm";

interface Doctor {
	id: string;
	name: string;
	designation?: string;
}

interface Schedule {
	id: string;
	doctor_id: string;
	availability_date: string;
	start_time: string;
	end_time: string;
	break_start: string;
	break_end: string;
	max_appointments: number;
	doctor?: Doctor;
}

export const DoctorScheduleManagement = () => {
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [schedules, setSchedules] = useState<Schedule[]>([]);
	const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
	const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
	const [loading, setLoading] = useState(true);
	const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
	const [editForm, setEditForm] = useState({
		start_time: "",
		end_time: "",
		break_start: "",
		break_end: "",
		max_appointments: 17,
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	const fetchDoctors = async () => {
		try {
			const { data, error } = await supabase
				.from("doctors")
				.select("id, name, designation")
				.eq("is_active", true)
				.order("name");

			if (error) throw error;
			setDoctors(data || []);
		} catch (error) {
			console.error("Error fetching doctors:", error);
			toast({
				title: "Error",
				description: "Failed to fetch doctors",
				variant: "destructive",
			});
		}
	};

	const fetchSchedules = async () => {
		try {
			const { data, error } = await supabase
				.from("doctor_schedules")
				.select(
					`
          *,
          doctor:doctors(id, name, designation)
        `,
				)
				.order("availability_date", { ascending: false });

			if (error) throw error;
			setSchedules(data || []);
		} catch (error) {
			console.error("Error fetching schedules:", error);
			toast({
				title: "Error",
				description: "Failed to fetch schedules",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (schedule: Schedule) => {
		setEditingSchedule(schedule);
		setEditForm({
			start_time: schedule.start_time,
			end_time: schedule.end_time,
			break_start: schedule.break_start,
			break_end: schedule.break_end,
			max_appointments: schedule.max_appointments,
		});
	};

	const handleUpdate = async () => {
		if (!editingSchedule) return;

		try {
			const { error } = await supabase
				.from("doctor_schedules")
				.update({
					start_time: editForm.start_time,
					end_time: editForm.end_time,
					break_start: editForm.break_start,
					break_end: editForm.break_end,
					max_appointments: editForm.max_appointments,
					updated_at: new Date().toISOString(),
				})
				.eq("id", editingSchedule.id);

			if (error) throw error;

			// Call reschedule function
			await supabase.rpc("reschedule_appointments_for_doctor", {
				p_doctor_id: editingSchedule.doctor_id,
				p_availability_date: editingSchedule.availability_date,
				p_start_time: editForm.start_time,
				p_break_start: editForm.break_start,
				p_break_end: editForm.break_end,
			});

			toast({
				title: "Success",
				description:
					"Schedule updated successfully and appointments rescheduled",
			});

			setEditingSchedule(null);
			fetchSchedules();
		} catch (error) {
			console.error("Error updating schedule:", error);
			toast({
				title: "Error",
				description: "Failed to update schedule",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (scheduleId: string) => {
		const scheduleToDelete = schedules.find((s) => s.id === scheduleId);
		if (!scheduleToDelete) return;

		try {
			// First check if there are any appointments for this schedule
			const { data: appointments, error: appointmentError } = await supabase
				.from("appointments")
				.select("id")
				.eq("doctor_id", scheduleToDelete.doctor_id)
				.eq("appointment_date", scheduleToDelete.availability_date);

			if (appointmentError) {
				console.error("Error checking appointments:", appointmentError);
				toast({
					title: "Error",
					description: "Failed to check existing appointments",
					variant: "destructive",
				});
				return;
			}

			// If there are appointments, show warning
			if (appointments && appointments.length > 0) {
				const confirmed = window.confirm(
					`This schedule has ${appointments.length} appointment(s). Deleting it will also cancel these appointments. Are you sure you want to continue?`,
				);

				if (!confirmed) return;

				// Delete appointments first
				const { error: deleteAppointmentsError } = await supabase
					.from("appointments")
					.delete()
					.eq("doctor_id", scheduleToDelete.doctor_id)
					.eq("appointment_date", scheduleToDelete.availability_date);

				if (deleteAppointmentsError) {
					console.error(
						"Error deleting appointments:",
						deleteAppointmentsError,
					);
					toast({
						title: "Error",
						description: "Failed to cancel appointments",
						variant: "destructive",
					});
					return;
				}
			}

			const { error } = await supabase
				.from("doctor_schedules")
				.delete()
				.eq("id", scheduleId);

			if (error) throw error;

			toast({
				title: "Success",
				description:
					appointments && appointments.length > 0
						? `Schedule and ${appointments.length} appointment(s) deleted successfully`
						: "Schedule deleted successfully",
			});

			fetchSchedules();
		} catch (error) {
			console.error("Error deleting schedule:", error);
			toast({
				title: "Error",
				description: "Failed to delete schedule",
				variant: "destructive",
			});
		}
	};

	const formatTime = (timeString: string) => {
		return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getScheduleStatus = (schedule: Schedule) => {
		const now = new Date();
		const scheduleDate = new Date(schedule.availability_date);

		if (scheduleDate.toDateString() === now.toDateString()) {
			const currentTime = now.getHours() * 60 + now.getMinutes();
			
			const [startHour, startMin] = schedule.start_time.split(':').map(Number);
			const [endHour, endMin] = schedule.end_time.split(':').map(Number);
			const [breakStartHour, breakStartMin] = schedule.break_start.split(':').map(Number);
			const [breakEndHour, breakEndMin] = schedule.break_end.split(':').map(Number);
			
			const startTimeMinutes = startHour * 60 + startMin;
			const endTimeMinutes = endHour * 60 + endMin;
			const breakStartMinutes = breakStartHour * 60 + breakStartMin;
			const breakEndMinutes = breakEndHour * 60 + breakEndMin;
			
			const isWithinSchedule = currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
			const isDuringBreak = currentTime >= breakStartMinutes && currentTime <= breakEndMinutes;
			
			if (isWithinSchedule && !isDuringBreak) {
				return <Badge variant="destructive">Live</Badge>;
			} else if (currentTime < startTimeMinutes) {
				return <Badge variant="default">Today</Badge>;
			} else {
				return <Badge variant="secondary">Past</Badge>;
			}
		} else if (scheduleDate < now) {
			return <Badge variant="secondary">Past</Badge>;
		} else {
			return <Badge variant="outline">Upcoming</Badge>;
		}
	};

	useEffect(() => {
		fetchDoctors();
		fetchSchedules();
	}, []);

	useEffect(() => {
		if (selectedDoctor === "all") {
			setFilteredSchedules(schedules);
		} else {
			setFilteredSchedules(
				schedules.filter((schedule) => schedule.doctor_id === selectedDoctor),
			);
		}
		setCurrentPage(1);
	}, [schedules, selectedDoctor]);

	const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentSchedules = filteredSchedules.slice(startIndex, endIndex);

	const onScheduleUpdate = () => {
		fetchSchedules();
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Schedule List */}
			<Card className="md:border-0 md:bg-transparent md:shadow-none">
				<CardHeader className="p-4 md:pt-0">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<CardTitle className="text-xl md:text-2xl font-bold text-foreground">
							Doctor Schedules
						</CardTitle>
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
							<div className="md:flex items-center gap-2">
								<Label htmlFor="doctor-filter">Filter by Doctor:</Label>
								<Select
									value={selectedDoctor}
									onValueChange={setSelectedDoctor}
								>
									<SelectTrigger className="w-64">
										<SelectValue placeholder="Select doctor" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Doctors</SelectItem>
										{doctors.map((doctor) => (
											<SelectItem key={doctor.id} value={doctor.id}>
												{doctor.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
								<DialogTrigger asChild>
									<Button>Add Schedules</Button>
								</DialogTrigger>
								<DialogContent className="max-h-[90vh] overflow-auto max-w-2xl">
									<DialogHeader>
										<DialogTitle>Add Doctor Schedule</DialogTitle>
									</DialogHeader>
									<DoctorScheduleForm
										onScheduleUpdate={onScheduleUpdate}
										onClose={() => setIsAddDialogOpen(false)}
									/>
								</DialogContent>
							</Dialog>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-4 md:pb-0">
					{currentSchedules.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No schedules found for the selected filters.
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="md:ps-0">Doctor</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Time</TableHead>
										<TableHead>Break</TableHead>
										<TableHead>Max Appointments</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="w-12 md:pe-0">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{currentSchedules.map((schedule) => (
										<TableRow key={schedule.id}>
											<TableCell className="min-w-44 md:ps-0">
												<div>
													<div className="font-medium">
														{schedule.doctor?.name}
													</div>
													{schedule.doctor?.designation && (
														<div className="text-sm text-muted-foreground">
															{schedule.doctor.designation}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell>
												{formatDate(schedule.availability_date)}
											</TableCell>
											<TableCell>
												{formatTime(schedule.start_time)} -{" "}
												{formatTime(schedule.end_time)}
											</TableCell>
											<TableCell>
												{formatTime(schedule.break_start)} -{" "}
												{formatTime(schedule.break_end)}
											</TableCell>
											<TableCell>{schedule.max_appointments}</TableCell>
											<TableCell>{getScheduleStatus(schedule)}</TableCell>
											<TableCell className="md:pe-0">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="sm">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => handleEdit(schedule)}
														>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleDelete(schedule.id)}
															className="text-destructive"
														>
															<Trash2 className="h-4 w-4 mr-2" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							<div className="flex justify-between items-center mt-6">
								<div className="flex items-center gap-2">
									<span className="text-sm">Show:</span>
									<Select
										value={itemsPerPage.toString()}
										onValueChange={(value) => setItemsPerPage(Number(value))}
									>
										<SelectTrigger className="w-16">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="10">10</SelectItem>
											<SelectItem value="20">20</SelectItem>
											<SelectItem value="50">50</SelectItem>
											<SelectItem value="100">100</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{totalPages > 1 && (
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													href="#"
													onClick={(e) => {
														e.preventDefault();
														if (currentPage > 1)
															setCurrentPage(currentPage - 1);
													}}
													className={
														currentPage === 1
															? "pointer-events-none opacity-50"
															: ""
													}
												/>
											</PaginationItem>

											{Array.from(
												{ length: Math.min(5, totalPages) },
												(_, i) => {
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
												},
											)}

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
								)}
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Edit Schedule Dialog */}
			<Dialog
				open={!!editingSchedule}
				onOpenChange={() => setEditingSchedule(null)}
			>
				<DialogContent className="max-h-[90vh] overflow-auto">
					<DialogHeader>
						<DialogTitle>Edit Schedule</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="start_time">Start Time</Label>
								<Input
									id="start_time"
									type="time"
									value={editForm.start_time}
									onChange={(e) =>
										setEditForm((prev) => ({
											...prev,
											start_time: e.target.value,
										}))
									}
								/>
							</div>
							<div>
								<Label htmlFor="end_time">End Time</Label>
								<Input
									id="end_time"
									type="time"
									value={editForm.end_time}
									onChange={(e) =>
										setEditForm((prev) => ({
											...prev,
											end_time: e.target.value,
										}))
									}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="break_start">Break Start</Label>
								<Input
									id="break_start"
									type="time"
									value={editForm.break_start}
									onChange={(e) =>
										setEditForm((prev) => ({
											...prev,
											break_start: e.target.value,
										}))
									}
								/>
							</div>
							<div>
								<Label htmlFor="break_end">Break End</Label>
								<Input
									id="break_end"
									type="time"
									value={editForm.break_end}
									onChange={(e) =>
										setEditForm((prev) => ({
											...prev,
											break_end: e.target.value,
										}))
									}
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="max_appointments">Max Appointments</Label>
							<Input
								id="max_appointments"
								type="number"
								value={editForm.max_appointments}
								onChange={(e) =>
									setEditForm((prev) => ({
										...prev,
										max_appointments: parseInt(e.target.value),
									}))
								}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setEditingSchedule(null)}
							>
								Cancel
							</Button>
							<Button onClick={handleUpdate}>Update Schedule</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};
