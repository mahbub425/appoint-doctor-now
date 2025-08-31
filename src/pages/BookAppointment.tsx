import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Clock, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

export default function BookAppointment({
	isInline = false,
	onBack,
}: BookAppointmentProps = {}) {
	const navigate = useNavigate();
	const { userProfile } = useAuth();

	// Get doctor ID from localStorage instead of URL params
	const doctorId = localStorage.getItem('selectedDoctorId');

	const [doctor, setDoctor] = useState<Doctor | null>(null);
	const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [selectedReason, setSelectedReason] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [booking, setBooking] = useState(false);

	useEffect(() => {
		if (!doctorId) {
			// If no doctor ID in localStorage, handle based on mode
			if (!isInline) {
				navigate('/user');
			}
			return;
		}

		if (doctorId && userProfile) {
			fetchDoctorData();
		}
	}, [doctorId, userProfile, navigate, isInline]);

	const fetchDoctorData = async () => {
		if (!doctorId) return;

		try {
			// Fetch doctor details
			const { data: doctorData, error: doctorError } = await supabase
				.from('doctors')
				.select('*')
				.eq('id', doctorId)
				.single();

			if (doctorError || !doctorData) {
				toast({
					title: 'Error',
					description: 'Doctor not found',
					variant: 'destructive',
				});
				if (!isInline) {
					navigate('/user');
				} else if (onBack) {
					onBack();
				}
				return;
			}

			setDoctor(doctorData);

			// Fetch doctor's next availability
			const { data: scheduleData, error: scheduleError } = await supabase
				.from('doctor_schedules')
				.select('*')
				.eq('doctor_id', doctorId)
				.gte('availability_date', new Date().toISOString().split('T')[0])
				.order('availability_date', { ascending: true })
				.limit(1)
				.single();

			if (scheduleError || !scheduleData) {
				setSchedule(null);
				setLoading(false);
				return;
			}

			setSchedule(scheduleData);

			// Fetch existing appointments for this date
			const { data: appointmentsData, error: appointmentsError } =
				await supabase
					.from('appointments')
					.select('*')
					.eq('doctor_id', doctorId)
					.eq('appointment_date', scheduleData.availability_date)
					.order('serial_number', { ascending: true });

			if (appointmentsError) {
				console.error('Error fetching appointments:', appointmentsError);
			} else {
				setAppointments(appointmentsData || []);
			}
		} catch (error) {
			console.error('Error fetching doctor data:', error);
		} finally {
			setLoading(false);
		}
	};

	const calculateAppointmentTime = (serialNumber: number, reason: string) => {
		if (!schedule) return '';

		const durations: { [key: string]: number } = {
			'New Patient': 10,
			'Follow Up': 7,
			'Report Show': 12,
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
				title: 'Error',
				description: 'Please select a reason for your appointment',
				variant: 'destructive',
			});
			return;
		}

		// Check if user already has an appointment with this doctor on this date
		const existingAppointment = appointments.find(
			(apt) => apt.user_id === userProfile.id,
		);
		if (existingAppointment) {
			toast({
				title: 'Error',
				description: 'You can only book one appointment per doctor per day',
				variant: 'destructive',
			});
			return;
		}

		// Check if max appointments reached
		if (appointments.length >= schedule.max_appointments) {
			toast({
				title: 'Error',
				description: 'Maximum appointments for this date have been reached',
				variant: 'destructive',
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
				.from('appointments')
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
					status: 'upcoming',
				})
				.select()
				.single();

			if (error) {
				toast({
					title: 'Error',
					description: 'Failed to book appointment',
					variant: 'destructive',
				});
				return;
			}

			toast({
				title: 'Success',
				description: `Appointment booked successfully! Your appointment is scheduled for ${appointmentTime} on ${new Date(
					schedule.availability_date,
				).toLocaleDateString('en-GB')}`,
			});

			// Handle navigation based on mode
			if (!isInline) {
				// Navigate to appointment details page with appointment data
				navigate('/appointment-details', {
					state: {
						appointmentData: {
							...data,
							doctor_name: doctor.name,
							location: schedule.location,
						},
					},
				});
			} else {
				// In inline mode, navigate to appointments tab
				navigate('/user', { state: { activeTab: 'appointments' } });
			}
		} catch (error) {
			toast({
				title: 'Error',
				description: 'An unexpected error occurred',
				variant: 'destructive',
			});
		} finally {
			setBooking(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-GB');
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	if (!doctor) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Doctor not found</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			{/* Doctor Details */}
			<Card className="border bg-gradient-to-br from-card to-card/80">
				<CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b sr-only">
					<CardTitle className="text-xl text-primary">Doctor Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6 p-6">
					<div className="space-y-2">
						<h3 className="text-xl md:text-2xl font-bold">{doctor.name}</h3>
						<div className="space-y-1 text-sm">
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
					</div>

					{schedule && (
						<div className="space-y-4">
							{/* Next Availability */}
							<h2 className="text-base font-semibold text-primary">
								Next Availability
							</h2>
							<div className="space-y-4">
								{/* Date Section */}
								<div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg bg-[#F6FBFE] border border-[#F6FBFE/50]">
									<div className="p-3 bg-blue-500/10 rounded-full">
										<Calendar className="h-5 w-5 text-blue-600" />
									</div>
									<div>
										<p className="text-sm font-normal text-muted-foreground uppercase tracking-wide">
											Date
										</p>
										<p className="text-lg font-bold card-foreground">
											{formatDate(schedule.availability_date)}
										</p>
									</div>
								</div>

								{/* Chamber Time Section */}
								<div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg bg-[#F6FBFE] border border-[#F6FBFE/50]">
									<div className="p-3 bg-teal-500/10 rounded-full">
										<Clock className="h-5 w-5 text-teal-400" />
									</div>
									<div>
										<p className="text-sm font-normal text-muted-foreground uppercase tracking-wide">
											Chamber Time
										</p>
										<p className="text-lg font-bold card-foreground">
											{schedule.start_time} - {schedule.end_time}
										</p>
									</div>
								</div>

								{/* Available Slots */}
								<div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg bg-[#F6FBFE] border border-[#F6FBFE/50]">
									<div className="p-3 bg-purple-500/10 rounded-full">
										<Users className="h-5 w-5 text-purple-600" />
									</div>
									<div>
										<p className="text-sm font-normal text-muted-foreground uppercase tracking-wide">
											Available Slots
										</p>
										<p className="text-lg font-bold card-foreground">
											{schedule.max_appointments - appointments.length}/
											{schedule.max_appointments}
										</p>
									</div>
								</div>

								{/* Location */}
								<div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg bg-[#F6FBFE] border border-[#F6FBFE/50]">
									<div className="p-3 bg-emerald-500/10 rounded-full">
										<MapPin className="h-5 w-5 text-emerald-500" />
									</div>
									<div>
										<p className="text-sm font-normal text-muted-foreground uppercase tracking-wide">
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
				<CardHeader>
					<CardTitle className="text-primary font-bold text-xl md:text-2xl">
						Book Your Appointment
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
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
								<Label className="text-sm font-medium">Name</Label>
								<p className="text-sm text-muted-foreground mt-1">
									{userProfile?.name}
								</p>
							</div>

							<div>
								<Label className="text-sm font-medium">PIN</Label>
								<p className="text-sm text-muted-foreground mt-1">
									{userProfile?.pin}
								</p>
							</div>

							<div>
								<Label className="text-sm font-medium">Concern</Label>
								<p className="text-sm text-muted-foreground mt-1">
									{userProfile?.concern}
								</p>
							</div>

							<div>
								<Label className="text-sm font-medium">Phone Number</Label>
								<p className="text-sm text-muted-foreground mt-1">
									{userProfile?.phone}
								</p>
							</div>

							<div>
								<Label htmlFor="reason">Reason for Visit</Label>
								<Select
									value={selectedReason}
									onValueChange={setSelectedReason}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select reason" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="New Patient">New Patient</SelectItem>
										<SelectItem value="Follow Up">Follow Up</SelectItem>
										<SelectItem value="Report Show">Report Show</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Button
								onClick={handleBookAppointment}
								disabled={booking || !selectedReason}
								className="w-full"
							>
								{booking ? 'Booking...' : 'Book Appointment'}
							</Button>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
