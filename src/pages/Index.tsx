import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { NoticeSection } from '@/components/NoticeSection';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Calendar } from 'lucide-react';

interface Doctor {
	id: string;
	name: string;
	degree: string;
	experience: string;
	designation: string;
	specialties: string[];
	is_active: boolean;
	next_availability?: string;
	location?: string;
}

const DoctorListWithLoginCheck = () => {
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const { user } = useAuth();

	useEffect(() => {
		fetchDoctors();
	}, []);

	const fetchDoctors = async () => {
		try {
			// First fetch all active doctors
			const { data: doctorsData, error } = await supabase
				.from('doctors')
				.select('*')
				.eq('is_active', true);

			if (error) {
				console.error('Error fetching doctors:', error);
				return;
			}

			// Then fetch ALL upcoming schedules for ALL doctors
			const { data: allSchedules, error: schedulesError } = await supabase
				.from('doctor_schedules')
				.select('*')
				.gte('availability_date', new Date().toISOString().split('T')[0])
				.order('availability_date', { ascending: true });

			if (schedulesError) {
				console.error('Error fetching schedules:', schedulesError);
			}

			// Create a map of doctor schedules
			const doctorSchedulesMap = new Map();
			(allSchedules || []).forEach(schedule => {
				if (!doctorSchedulesMap.has(schedule.doctor_id)) {
					doctorSchedulesMap.set(schedule.doctor_id, []);
				}
				doctorSchedulesMap.get(schedule.doctor_id).push(schedule);
			});

			// Now create doctor entries for each unique schedule
			const doctorsWithAllSchedules = [];
			(doctorsData || []).forEach(doctor => {
				const doctorSchedules = doctorSchedulesMap.get(doctor.id) || [];
				
				if (doctorSchedules.length === 0) {
					// No schedules for this doctor
					doctorsWithAllSchedules.push({
						...doctor,
						next_availability: null,
						location: null,
					});
				} else {
					// Create separate entries for each schedule date
					doctorSchedules.forEach(schedule => {
						doctorsWithAllSchedules.push({
							...doctor,
							// Create unique ID for each doctor-schedule combination
							id: `${doctor.id}_${schedule.availability_date}`,
							original_doctor_id: doctor.id,
							next_availability: schedule.availability_date,
							location: schedule.location,
						});
					});
				}
			});

			// Sort by availability date
			doctorsWithAllSchedules.sort((a, b) => {
				if (!a.next_availability) return 1;
				if (!b.next_availability) return 1;
				return new Date(a.next_availability).getTime() - new Date(b.next_availability).getTime();
			});

			setDoctors(doctorsWithAllSchedules);
		} catch (error) {
			console.error('Error fetching doctors:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-GB');
	};

	const handleBookAppointment = (doctorId: string, scheduleDate?: string, location?: string) => {
		if (!user) {
			navigate('/auth');
			return;
		}
		// Extract original doctor ID if it's a composite ID
		const originalDoctorId = doctorId.includes('_') 
			? doctorId.split('_')[0] 
			: doctorId;
		
		// Store doctor ID and schedule details in localStorage
		const scheduleData = {
			doctorId: originalDoctorId,
			date: scheduleDate,
			location: location
		};
		localStorage.setItem('selectedSchedule', JSON.stringify(scheduleData));
		navigate('/book-appointment');
	};

	if (loading) {
		return <div className="text-center py-8">Loading doctors...</div>;
	}

	return (
		<div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
				{doctors.map((doctor) => (
					<Card
						key={doctor.id}
						className="group flex flex-col hover:shadow-xl transition-all duration-300 border hover:border-primary/20"
					>
						<CardHeader className="flex-grow pb-4">
							<CardTitle className="text-xl text-primary md:text-2xl font-bold mb-2">
								{doctor.name}
							</CardTitle>
							<div className="space-y-2 text-sm">
								<p>
									<strong>Degree: </strong> {doctor.degree}
								</p>
								<p>
									<strong>Designation: </strong>
									{doctor.designation}
								</p>
								<p>
									<strong>Specialties: </strong>
									{doctor.experience}
								</p>
								<p>
									<strong>Experience: </strong>
									{doctor.specialties?.join(', ')}
								</p>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Next Availability - Prominent Display */}
							<div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border-l-4 border-primary flex items-center gap-3">
								<Calendar className="size-8 text-primary" />
								<div>
									<p className=" text-base mb-1 font-semibold text-primary">
										Next Availability
									</p>
									<p className="text-xl font-bold text-foreground">
										{doctor.next_availability
											? formatDate(doctor.next_availability)
											: 'N/A'}
									</p>
								</div>
							</div>

							{/* Location - Prominent Display */}
							<div className="bg-gradient-to-r from-success/20 to-success/10 p-4 rounded-lg border-l-4 border-success flex items-center gap-3">
								<MapPin className="size-8 text-success" />
								<div>
									<p className="font-semibold text-success text-base mb-1">
										Location
									</p>
									<p className="text-lg font-bold text-foreground">
										{doctor.location ? doctor.location : 'N/A'}
									</p>
								</div>
							</div>

							<Button
								className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
								onClick={() => handleBookAppointment(doctor.id, doctor.next_availability, doctor.location)}
								disabled={!doctor.next_availability}
							>
								{doctor.next_availability
									? 'Book Appointment'
									: 'Not Available'}
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			{doctors.length === 0 && (
				<div className="text-center py-8 text-muted-foreground">
					No doctors available at the moment.
				</div>
			)}
		</div>
	);
};

const Index = () => {
	const navigate = useNavigate();
	const { isAdmin, isDoctor, isUser, loading } = useAuth(); // Removed 'user' from destructuring as it's not the primary check for custom auth

	useEffect(() => {
		console.log(
			'Index.tsx redirect check - loading:',
			loading,
			'isAdmin:',
			isAdmin,
			'isDoctor:',
			isDoctor,
			'isUser:',
			isUser,
		);

		if (!loading) {
			// Only proceed if loading is false
			if (isAdmin) {
				console.log('Redirecting to admin');
				navigate('/admin');
			} else if (isDoctor) {
				console.log('Redirecting to doctor');
				navigate('/doctor');
			} else if (isUser) {
				console.log('Redirecting to user');
				navigate('/user');
			}
		}
	}, [isAdmin, isDoctor, isUser, loading, navigate]); // Updated dependencies

	if (loading) {
		return (
			<div className="flex items-center justify-center py-14">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	return (
		<div className="bg-background">
			<NoticeSection />

			<div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
				<DoctorListWithLoginCheck />
			</div>
		</div>
	);
};

export default Index;
