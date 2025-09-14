import { useState, useEffect } from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppointmentDetailsCard } from '@/pages/AppointmentDetails';

interface Appointment {
	id: string;
	name: string;
	pin: string | number;
	concern: string;
	reason: string;
	appointment_date: string;
	appointment_time: string;
	serial_number: number;
	status: string;
	location?: string;
	doctor: {
		name: string;
	};
}

interface Doctor {
	id: string;
	name: string;
}

export const UserAppointmentsList = () => {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
	const [loading, setLoading] = useState(true);
	const [selectedAppointment, setSelectedAppointment] =
		useState<Appointment | null>(null);
	const { userProfile } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (userProfile) {
			fetchDoctors();
			fetchAppointments();
		}
	}, [userProfile]);

	useEffect(() => {
		if (userProfile) {
			fetchAppointments();
		}
	}, [selectedDoctorId, userProfile]);

	const fetchDoctors = async () => {
		try {
			const { data, error } = await supabase
				.from('doctors')
				.select('id, name')
				.eq('is_active', true);

			if (error) {
				console.error('Error fetching doctors:', error);
				return;
			}

			setDoctors(data || []);
		} catch (error) {
			console.error('Error fetching doctors:', error);
		}
	};

	const fetchAppointments = async () => {
		if (!userProfile) return;

		try {
			let query = supabase
				.from('appointments')
				.select(
					`
          *,
          doctor:doctors(name)
        `,
				)
				.eq('user_id', userProfile.id)
				.order('appointment_date', { ascending: false })
				.order('appointment_time', { ascending: true });

			if (selectedDoctorId !== 'all') {
				query = query.eq('doctor_id', selectedDoctorId);
			}

			const { data: appointmentsData, error } = await query;

			if (error) {
				console.error('Error fetching appointments:', error);
				return;
			}

			// Fetch locations for each appointment by matching doctor_id and appointment_date
			const appointmentsWithLocation = await Promise.all(
				(appointmentsData || []).map(async (appointment) => {
					const { data: scheduleData } = await supabase
						.from('doctor_schedules')
						.select('location')
						.eq('doctor_id', appointment.doctor_id)
						.eq('availability_date', appointment.appointment_date)
						.single();

					return {
						...appointment,
						location: scheduleData?.location || 'Not specified',
					};
				}),
			);

			setAppointments(appointmentsWithLocation);
		} catch (error) {
			console.error('Error fetching appointments:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-GB');
	};

	const getStatusBadge = (appointment: Appointment) => {
		const now = new Date();
		const appointmentDateTime = new Date(
			`${appointment.appointment_date}T${appointment.appointment_time}`,
		);

		// Check database status first
		if (appointment.status === 'absent') {
			return <Badge variant="destructive">Absent</Badge>;
		}

		if (appointment.status === 'completed') {
			return <Badge variant="secondary">Completed</Badge>;
		}

		// For upcoming status, check if appointment is current or future
		if (
			appointmentDateTime.toDateString() === now.toDateString() &&
			Math.abs(appointmentDateTime.getTime() - now.getTime()) < 30 * 60 * 1000
		) {
			return <Badge variant="default">Current</Badge>;
		}

		if (appointmentDateTime > now) {
			return <Badge variant="outline">Upcoming</Badge>;
		}

		// If appointment is in the past but not marked as completed, show as completed
		return <Badge variant="secondary">Completed</Badge>;
	};

	const handleViewAppointment = (appointment: Appointment) => {
		setSelectedAppointment(appointment);
	};

	const handleBackToList = () => {
		setSelectedAppointment(null);
	};

	if (loading) {
		return <div className="text-center py-8">Loading appointments...</div>;
	}

	// If an appointment is selected, show appointment details inline
	if (selectedAppointment) {
		return (
			<AppointmentDetailsCard
				appointmentData={{
					id: selectedAppointment.id,
					name: selectedAppointment.name,
					pin:
						typeof selectedAppointment.pin === 'string'
							? parseInt(selectedAppointment.pin)
							: selectedAppointment.pin,
					appointment_date: selectedAppointment.appointment_date,
					appointment_time: selectedAppointment.appointment_time,
					serial_number: selectedAppointment.serial_number,
					reason: selectedAppointment.reason,
					doctor_name: selectedAppointment.doctor?.name || 'Unknown',
					location: selectedAppointment.location || 'Not specified',
				}}
				onViewMyAppointments={handleBackToList}
				onFindAnotherDoctor={() =>
					navigate('/user', { state: { activeTab: 'doctors' } })
				}
				title="Appointment Details"
				description="Your appointment information"
			/>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h2 className="text-2xl font-bold">My Appointments</h2>

				<div className="w-full sm:w-auto">
					<Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
						<SelectTrigger className="w-full sm:w-[200px]">
							<SelectValue placeholder="Filter by doctor" />
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
			</div>

			{appointments.length === 0 ? (
				<Card>
					<CardContent className="py-8">
						<div className="text-center text-muted-foreground">
							No appointments found.
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader className='pb-0'>
						<CardTitle className="sr-only">Appointment History</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Location</TableHead>
									<TableHead>Serial</TableHead>
									<TableHead>Doctor</TableHead>
									<TableHead>Concern</TableHead>
									<TableHead>Reason</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>View</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{appointments.map((appointment) => (
									<TableRow key={appointment.id}>
										<TableCell>
											{formatDate(appointment.appointment_date)}
										</TableCell>
										<TableCell>{appointment.appointment_time}</TableCell>
										<TableCell>
											{appointment.location || 'Not specified'}
										</TableCell>
										<TableCell>{appointment.serial_number}</TableCell>
										<TableCell>
											{appointment.doctor?.name || 'Unknown'}
										</TableCell>
										<TableCell>{appointment.concern}</TableCell>
										<TableCell>{appointment.reason}</TableCell>
										<TableCell>{getStatusBadge(appointment)}</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleViewAppointment(appointment)}
												className="h-8 w-8 p-0"
											>
												<Eye className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
};
