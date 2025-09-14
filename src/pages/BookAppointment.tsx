import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AppointmentDetailsCard } from "./AppointmentDetails";

interface Doctor {
	id: string;
	name: string;
	degree: string;
	experience: string;
	designation: string;
	specialties: string[];
}

interface DoctorSchedule {
	id: string;
	availability_date: string;
	start_time: string;
	break_start: string;
	break_end: string;
	end_time: string;
	max_appointments: number;
	location: string;
}

interface Appointment {
	id: string;
	serial_number: number;
	reason: string;
	appointment_time: string;
	user_id: string;
}

interface BookAppointmentProps {
	isInline?: boolean;
	onBack?: () => void;
}

interface AppointmentDetailsData {
	id: string;
	name: string;
	pin: number;
	appointment_date: string;
	appointment_time: string;
	serial_number: number;
	reason: string;
	doctor_name: string;
	location: string;
}

export default function BookAppointment({
	isInline = false,
	onBack,
}: BookAppointmentProps = {}) {
	const navigate = useNavigate();
	const { userProfile } = useAuth();

	// Get schedule data from localStorage
	const [scheduleInfo, setScheduleInfo] = useState<{doctorId: string, date?: string, location?: string} | null>(null);
	const [doctorId, setDoctorId] = useState<string | null>(null);
	
	useEffect(() => {
		const scheduleDataStr = localStorage.getItem("selectedSchedule");
		if (scheduleDataStr) {
			try {
				const parsedData = JSON.parse(scheduleDataStr);
				setScheduleInfo(parsedData);
				setDoctorId(parsedData.doctorId);
			} catch (error) {
				console.error("Error parsing schedule data:", error);
				// Fallback to old method if parsing fails
				const oldDoctorId = localStorage.getItem("selectedDoctorId");
				if (oldDoctorId) {
					setDoctorId(oldDoctorId);
				}
			}
		} else {
			// Fallback to old method if new data not available
			const oldDoctorId = localStorage.getItem("selectedDoctorId");
			if (oldDoctorId) {
				setDoctorId(oldDoctorId);
			}
		}
	}, []);

	const [doctor, setDoctor] = useState<Doctor | null>(null);
	const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [selectedReason, setSelectedReason] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [booking, setBooking] = useState(false);
	const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
	const [appointmentData, setAppointmentData] =
		useState<AppointmentDetailsData | null>(null);

	useEffect(() => {
		if (!doctorId) {
			// If no doctor ID in localStorage, handle based on mode
			if (!isInline) {
				navigate("/user");
			}
			return;
		}

		if (doctorId && userProfile) {
			fetchDoctorData();
		}
		
		// Cleanup localStorage when component unmounts
		return () => {
			if (!isInline) {
				localStorage.removeItem("selectedSchedule");
				localStorage.removeItem("selectedDoctorId");
			}
		};
	}, [doctorId, userProfile, scheduleInfo]);

	const fetchDoctorData = async () => {
		if (!doctorId) return;

		try {
			setLoading(true);
			
			// Fetch doctor details
			const { data: doctorData, error: doctorError } = await supabase
				.from("doctors")
				.select("*")
				.eq("id", doctorId)
				.single();

			if (doctorError || !doctorData) {
				console.error("Doctor fetch error:", doctorError);
				toast({
					title: "Error",
					description: "Doctor not found",
					variant: "destructive",
				});
				if (!isInline) {
					navigate("/user");
				} else if (onBack) {
					onBack();
				}
				return;
			}

			setDoctor(doctorData);

			// Fetch specific schedule if we have date and location, otherwise fetch next availability
			let scheduleData = null;
			let scheduleError = null;

			if (scheduleInfo?.date && scheduleInfo?.location) {
				// Fetch specific schedule using date and location
				console.log("Fetching specific schedule:", {
					doctorId,
					date: scheduleInfo.date,
					location: scheduleInfo.location
				});
				
				const result = await supabase
					.from("doctor_schedules")
					.select("*")
					.eq("doctor_id", doctorId)
					.eq("availability_date", scheduleInfo.date)
					.eq("location", scheduleInfo.location)
					.single();
				
				scheduleData = result.data;
				scheduleError = result.error;
				
				if (!scheduleData || scheduleError) {
					console.log("Specific schedule not found, fetching next available");
					// If specific schedule not found, try to get next available
					const fallbackResult = await supabase
						.from("doctor_schedules")
						.select("*")
						.eq("doctor_id", doctorId)
						.gte("availability_date", new Date().toISOString().split("T")[0])
						.order("availability_date", { ascending: true })
						.limit(1)
						.single();
					
					scheduleData = fallbackResult.data;
					scheduleError = fallbackResult.error;
				}
			} else {
				// Fallback to fetching next availability
				console.log("No schedule info provided, fetching next available");
				const result = await supabase
					.from("doctor_schedules")
					.select("*")
					.eq("doctor_id", doctorId)
					.gte("availability_date", new Date().toISOString().split("T")[0])
					.order("availability_date", { ascending: true })
					.limit(1)
					.single();
				
				scheduleData = result.data;
				scheduleError = result.error;
			}

			if (scheduleError || !scheduleData) {
				console.error("Schedule fetch error:", scheduleError);
				setSchedule(null);
				toast({
					title: "Notice",
					description: "No schedule available for this doctor at the moment",
				});
			} else {
				setSchedule(scheduleData);
				console.log("Schedule loaded:", scheduleData);

				// Fetch existing appointments for this date
				const { data: appointmentsData, error: appointmentsError } =
					await supabase
						.from("appointments")
						.select("*")
						.eq("doctor_id", doctorId)
						.eq("appointment_date", scheduleData.availability_date)
						.order("serial_number", { ascending: true });

				if (appointmentsError) {
					console.error("Error fetching appointments:", appointmentsError);
				} else {
					setAppointments(appointmentsData || []);
					console.log("Appointments loaded:", appointmentsData?.length || 0);
				}
			}
		} catch (error) {
			console.error("Error fetching doctor data:", error);
			toast({
				title: "Error",
				description: "Failed to load appointment data",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const calculateAppointmentTime = (serialNumber: number, reason: string) => {
		if (!schedule) return "";

		const durations: { [key: string]: number } = {
			"New Patient": 10,
			"Follow Up": 7,
			"Report Show": 12,
		};

		let currentTime = new Date(`2000-01-01T${schedule.start_time}`);
		const breakStart = new Date(`2000-01-01T${schedule.break_start}`);
		const breakEnd = new Date(`2000-01-01T${schedule.break_end}`);

		// Calculate time for appointments before this one
		for (let i = 1; i < serialNumber; i++) {
			const appointment = appointments.find((apt) => apt.serial_number === i);
			if (appointment) {
				const duration = durations[appointment.reason] || 10;
				currentTime.setMinutes(currentTime.getMinutes() + duration);

				// Skip break time
				if (currentTime >= breakStart && currentTime < breakEnd) {
					currentTime = new Date(breakEnd);
				}
			}
		}

		return currentTime.toTimeString().slice(0, 5);
	};

	const handleBookAppointment = async () => {
		if (!userProfile || !doctor || !schedule || !selectedReason) {
			toast({
				title: "Error",
				description: "Please select a reason for your appointment",
				variant: "destructive",
			});
			return;
		}

		// Check if user already has an appointment with this doctor on this date
		const existingAppointment = appointments.find(
			(apt) => apt.user_id === userProfile.id,
		);
		if (existingAppointment) {
			toast({
				title: "Error",
				description: "You can only book one appointment per doctor per day",
				variant: "destructive",
			});
			return;
		}

		// Check if max appointments reached
		if (appointments.length >= schedule.max_appointments) {
			toast({
				title: "Error",
				description: "Maximum appointments for this date have been reached",
				variant: "destructive",
			});
			return;
		}

		setBooking(true);

		try {
			const nextSerial = appointments.length + 1;
			const appointmentTime = calculateAppointmentTime(
				nextSerial,
				selectedReason,
			);

			const { data, error } = await supabase
				.from("appointments")
				.insert({
					user_id: userProfile.id,
					doctor_id: doctor.id,
					name: userProfile.name,
					pin: parseInt(userProfile.pin),
					concern: userProfile.concern,
					phone: userProfile.phone,
					reason: selectedReason,
					appointment_date: schedule.availability_date,
					serial_number: nextSerial,
					appointment_time: appointmentTime,
					status: "upcoming",
				})
				.select()
				.single();

			if (error) {
				toast({
					title: "Error",
					description: "Failed to book appointment",
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Success",
				description: `Appointment booked successfully! Your appointment is scheduled for ${appointmentTime} on ${new Date(
					schedule.availability_date,
				).toLocaleDateString("en-GB")}`,
			});

			// Handle navigation based on mode
			if (!isInline) {
				// Navigate to appointment details page with appointment data
				navigate("/appointment-details", {
					state: {
						appointmentData: {
							...data,
							doctor_name: doctor.name,
							location: schedule.location,
						},
					},
				});
			} else {
				// In inline mode, show appointment details instead of navigating
				setAppointmentData({
					...data,
					doctor_name: doctor.name,
					location: schedule.location,
				});
				setShowAppointmentDetails(true);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "An unexpected error occurred",
				variant: "destructive",
			});
		} finally {
			setBooking(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-GB");
	};

	// If showing appointment details in inline mode, render same UI as AppointmentDetails
	if (showAppointmentDetails && isInline && appointmentData) {
		return (
			<AppointmentDetailsCard
				appointmentData={appointmentData}
				onViewMyAppointments={() =>
					navigate("/user", { state: { activeTab: "appointments" } })
				}
				onFindAnotherDoctor={() => {
					setShowAppointmentDetails(false);
					setAppointmentData(null);
					navigate("/user", { state: { activeTab: "doctors" } });
				}}
				title="Appointment Confirmed"
				description="Your appointment has been successfully booked"
			/>
		);
	}

	if (loading) {
		return (
			<div
				className={`${
					isInline ? "" : "min-h-screen"
				} flex items-center justify-center py-8`}
			>
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	if (!doctor) {
		return (
			<div
				className={`${
					isInline ? "" : "min-h-screen"
				} flex items-center justify-center py-8`}
			>
				<div className="text-lg">Doctor not found</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
			{/* Doctor Details */}
			<Card>
				<CardHeader className="p-5 pb-0">
					<CardTitle className="text-xl text-accent-foreground md:text-2xl font-bold">
						{doctor.name}
					</CardTitle>
				</CardHeader>
				<CardContent
					className={`${
						isInline ? "space-y-4 p-5 pt-4" : "space-y-6 p-5 pt-4"
					}`}
				>
					<div className="space-y-2 text-sm">
						<p>
							<strong>Degree: </strong> {doctor.degree}
						</p>
						<p>
							<strong>Designation: </strong> {doctor.designation}
						</p>
						<p>
							<strong>Specialties: </strong> {doctor.specialties}
						</p>
						<p>
							<strong>Experience: </strong> {doctor.experience}
						</p>
					</div>

					{schedule && (
						<div className="space-y-4">
							{/* Next Availability */}
							<h2 className="text-base font-semibold text-primary">
								Next Availability
							</h2>
							<div className="space-y-4">
								{/* Date Section */}
								<div
									className={`flex items-center gap-4 ${
										isInline ? "p-3" : "p-4"
									} rounded-lg bg-ring/5 border border-border/50`}
								>
									<div
										className={`${
											isInline ? "p-3" : "p-2"
										} bg-blue-500/10 rounded-full`}
									>
										<Calendar
											className={`${
												isInline ? "h-4 w-4" : "h-5 w-5"
											} text-blue-600`}
										/>
									</div>
									<div>
										<p className="text-sm font-normal text-muted-foreground tracking-wide">
											Date
										</p>
										<p className="text-lg font-bold card-foreground">
											{formatDate(schedule.availability_date)}
										</p>
									</div>
								</div>

								{/* Chamber Time Section */}
								<div
									className={`flex items-center gap-4 ${
										isInline ? "p-3" : "p-4"
									} rounded-lg bg-ring/5 border border-border/50`}
								>
									<div
										className={`${
											isInline ? "p-3" : "p-2"
										} bg-teal-500/10 rounded-full`}
									>
										<Clock
											className={`${
												isInline ? "h-4 w-4" : "h-5 w-5"
											} text-teal-400`}
										/>
									</div>
									<div>
										<p className="text-sm font-normal text-muted-foreground tracking-wide">
											Chamber Time
										</p>
										<p className="text-lg font-bold card-foreground">
											{schedule.start_time} - {schedule.end_time}
										</p>
									</div>
								</div>

								{/* Available Slots */}
								<div
									className={`flex items-center gap-4 ${
										isInline ? "p-3" : "p-4"
									} rounded-lg bg-ring/5 border border-border/50`}
								>
									<div
										className={`${
											isInline ? "p-3" : "p-2"
										} bg-purple-500/10 rounded-full`}
									>
										<Users
											className={`${
												isInline ? "h-4 w-4" : "h-5 w-5"
											} text-purple-600`}
										/>
									</div>
									<div>
										<p className="text-sm font-normal text-muted-foreground tracking-wide">
											Available Slots
										</p>
										<p className="text-lg font-bold card-foreground">
											{schedule.max_appointments - appointments.length}/
											{schedule.max_appointments}
										</p>
									</div>
								</div>

								{/* Location */}
								<div
									className={`flex items-center gap-4 ${
										isInline ? "p-3" : "p-4"
									} rounded-lg bg-ring/5 border border-border/50`}
								>
									<div
										className={`${
											isInline ? "p-3" : "p-2"
										} bg-emerald-500/10 rounded-full`}
									>
										<MapPin
											className={`${
												isInline ? "h-4 w-4" : "h-5 w-5"
											} text-emerald-500`}
										/>
									</div>
									<div>
										<p className="text-sm font-normal text-muted-foreground tracking-wide">
											Location
										</p>
										<p className="text-lg font-bold card-foreground">
											{schedule.location}
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Booking Form */}
			<Card>
				<CardHeader className={isInline ? "pb-4" : ""}>
					<CardTitle
						className={`text-xl text-primary md:text-2xl font-bold ${
							isInline ? "text-lg" : "text-xl md:text-2xl"
						}`}
					>
						Book Your Appointment
					</CardTitle>
				</CardHeader>
				<CardContent
					className={`text-sm ${isInline ? "space-y-5" : "space-y-4"}`}
				>
					{!schedule ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								এই সপ্তাহের জন্য এখনো ডাক্তারের আসার তারিখ নির্ধারণ করা হয়নি।
								অনুগ্রহ করে পরবর্তীতে চেষ্টা করুন।
							</p>
						</div>
					) : appointments.length >= schedule.max_appointments ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								Maximum appointments for this date have been reached.
							</p>
						</div>
					) : (
						<>
							<div>
								<Label className="font-normal">Name</Label>
								<p className="text-accent-foreground font-semibold mt-2">
									{userProfile?.name}
								</p>
							</div>

							<div>
								<Label className="font-normal">PIN</Label>
								<p className="text-accent-foreground font-semibold mt-2">
									{userProfile?.pin}
								</p>
							</div>

							<div>
								<Label className="font-normal">Concern</Label>
								<p className="text-accent-foreground font-semibold mt-2">
									{userProfile?.concern}
								</p>
							</div>

							<div>
								<Label className="font-normal">Phone Number</Label>
								<p className="text-accent-foreground font-semibold mt-2">
									{userProfile?.phone}
								</p>
							</div>

							<div>
								<Label htmlFor="reason" className="font-normal">
									Reason for Visit
								</Label>
								<Select
									value={selectedReason}
									onValueChange={setSelectedReason}
								>
									<SelectTrigger className="mt-2 min-h-11 text-accent-foreground font-semibold">
										<SelectValue placeholder="Select reason" />
									</SelectTrigger>
									<SelectContent className="text-accent-foreground font-semibold">
										<SelectItem className="min-h-11" value="New Patient">
											New Patient
										</SelectItem>
										<SelectItem className="min-h-11" value="Follow Up">
											Follow Up
										</SelectItem>
										<SelectItem className="min-h-11" value="Report Show">
											Report Show
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Book Appointment */}
							<Button
								onClick={handleBookAppointment}
								disabled={booking || !selectedReason}
								className="w-full min-h-12"
							>
								{booking ? "Booking..." : "Book Appointment"}
							</Button>

							{/* Cancel Button */}
							{isInline && (
								<Button
									variant="outline"
									onClick={onBack}
									className="w-full min-h-12 text-base border-primary text-primary"
									disabled={booking}
								>
									Cancel
								</Button>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
