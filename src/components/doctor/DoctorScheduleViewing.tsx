import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DoctorSchedule {
	id: string;
	availability_date: string;
	start_time: string;
	break_start: string;
	break_end: string;
	end_time: string;
	max_appointments: number;
	location: string;
	created_at: string;
	appointments_booked?: number;
}

export const DoctorScheduleViewing = () => {
	const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
	const [loading, setLoading] = useState(true);
	const { doctorProfile } = useAuth();

	useEffect(() => {
		if (doctorProfile) {
			fetchSchedules();
		}
	}, [doctorProfile]);

	const fetchSchedules = async () => {
		if (!doctorProfile) return;

		try {
			const { data, error } = await supabase
				.from("doctor_schedules")
				.select("*")
				.eq("doctor_id", doctorProfile.id)
				.order("availability_date", { ascending: true });

			if (error) {
				console.error("Error fetching schedules:", error);
				return;
			}

			// Fetch actual appointment counts for each schedule
			const schedulesWithBookings = await Promise.all(
				(data || []).map(async (schedule) => {
					const { count, error: appointmentError } = await supabase
						.from("appointments")
						.select("*", { count: "exact", head: true })
						.eq("doctor_id", doctorProfile.id)
						.eq("appointment_date", schedule.availability_date);

					if (appointmentError) {
						console.error(
							"Error fetching appointment count:",
							appointmentError,
						);
						return {
							...schedule,
							appointments_booked: 0,
						};
					}

					return {
						...schedule,
						appointments_booked: count || 0,
					};
				}),
			);

			setSchedules(schedulesWithBookings);
		} catch (error) {
			console.error("Error fetching schedules:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			day: "numeric",
			month: "long",
			year: "numeric",
			weekday: "long",
		};
		return date.toLocaleDateString("en-US", options);
	};

	const getScheduleStatus = (schedule: DoctorSchedule) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const scheduleDate = new Date(schedule.availability_date);
		scheduleDate.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (scheduleDate < today) {
			return { label: "Cancel", variant: "secondary" as const };
		} else if (scheduleDate.getTime() === today.getTime()) {
			return { label: "Live Now", variant: "destructive" as const };
		} else {
			return { label: "Upcoming", variant: "default" as const };
		}
	};

	const getProgressPercentage = (booked: number = 0, total: number) => {
		return (booked / total) * 100;
	};

	if (loading) {
		return <div className="text-center py-8">Loading schedules...</div>;
	}

	return (
		<>
			{schedules.length === 0 ? (
				<Card>
					<CardContent className="py-8">
						<div className="text-center text-muted-foreground">
							No schedules found. Contact admin to set up your schedule.
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					{schedules
						.sort((a, b) => {
							// Get status for both schedules
							const statusA = getScheduleStatus(a);
							const statusB = getScheduleStatus(b);

							// Define priority order: Live Now (1), Upcoming (2), Cancel (3)
							const getPriority = (status: { label: string }) => {
								if (status.label === "Live Now") return 1;
								if (status.label === "Upcoming") return 2;
								if (status.label === "Cancel") return 3;
								return 4;
							};

							const priorityA = getPriority(statusA);
							const priorityB = getPriority(statusB);

							// Sort by priority first
							if (priorityA !== priorityB) {
								return priorityA - priorityB;
							}

							// If same priority, sort by date
							return (
								new Date(a.availability_date).getTime() -
								new Date(b.availability_date).getTime()
							);
						})
						.map((schedule) => {
							const status = getScheduleStatus(schedule);
							const appointmentsBooked = schedule.appointments_booked || 0;
							const progressPercentage = getProgressPercentage(
								appointmentsBooked,
								schedule.max_appointments,
							);

							return (
								<Card key={schedule.id} className="overflow-hidden">
									<CardContent className="p-3 md:p-6">
										{/* Header with Date and Status */}
										<div className="flex gap-2 justify-between items-start mb-6">
											<h3 className="text-base md:text-lg font-semibold text-gray-900 max-w-[calc(100%-85px)] md:max-w-auto">
												{formatDate(schedule.availability_date)}
											</h3>
											<Badge
												variant={status.variant}
												className={`${
													status.label === "Live Now"
														? "bg-red-50 text-red-500 hover:text-white"
														: status.label === "Upcoming"
														? "bg-secondary text-primary hover:text-white"
														: "bg-muted-foreground/40 text-white hover:bg-muted-foreground/80"
												} ms-auto`}
											>
												{status.label}
											</Badge>
										</div>

										{/* Schedule Details */}
										<div className="space-y-2 md:space-y-4">
											{/* Time Information */}
											<div className="grid md:grid-cols-2 gap-2 md:gap-4">
												<div className="flex items-center space-x-2">
													<Clock className="size-4 md:size-6 text-gray-400 mt-0.5" />
													<div>
														<p className="text-xs hidden md:block">
															Session Duration
														</p>
														<p className="text-sm md:font-medium text-accent-foreground">
															{schedule.start_time} - {schedule.end_time}
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<Coffee className="size-4 md:size-6 text-gray-400 mt-0.5" />
													<div>
														<p className="text-xs hidden md:block">
															Break Time
														</p>
														<p className="text-sm md:font-medium text-accent-foreground">
															{schedule.break_start} - {schedule.break_end}
														</p>
													</div>
												</div>
											</div>

											{/* Slots Information */}
											<div className="grid md:grid-cols-2 gap-2 md:gap-4">
												<div className="flex items-center space-x-2">
													<Users className="size-4 md:size-6 text-gray-400 mt-0.5" />
													<div>
														<p className="text-xs hidden md:block">Slots</p>
														<p className="text-sm md:font-medium text-accent-foreground">
															{schedule.max_appointments} Total
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<MapPin className="size-4 md:size-6 text-gray-400 mt-0.5" />
													<div>
														<p className="text-xs hidden md:block">Location</p>
														<p className="text-sm md:font-medium text-accent-foreground">
															{schedule.location || "Not Specified"}
														</p>
													</div>
												</div>
											</div>

											{/* Appointments Progress */}
											<div className="mt-6">
												<div className="flex justify-between items-center mb-2">
													<p className="text-xs">Appointments Booked</p>
													<p className="text-sm md:font-medium text-accent-foreground">
														{appointmentsBooked}/{schedule.max_appointments}
													</p>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
													<div
														className={`h-full transition-all duration-300 ${
															status.label === "Live Now"
																? "bg-blue-500"
																: "bg-gray-400"
														}`}
														style={{ width: `${progressPercentage}%` }}
													/>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
				</div>
			)}
		</>
	);
};
