import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";

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
	original_doctor_id?: string;
}

interface DoctorListProps {
	onDoctorSelect?: (doctorId: string) => void;
}

export const DoctorList = ({ onDoctorSelect }: DoctorListProps) => {
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		fetchDoctors();
	}, []);

	const fetchDoctors = async () => {
		try {
			// First fetch all active doctors
			const { data: doctorsData, error } = await supabase
				.from("doctors")
				.select("*")
				.eq("is_active", true);

			if (error) {
				console.error("Error fetching doctors:", error);
				return;
			}

			// Then fetch ALL upcoming schedules for ALL doctors
			const { data: allSchedules, error: schedulesError } = await supabase
				.from("doctor_schedules")
				.select("*")
				.gte("availability_date", new Date().toISOString().split("T")[0])
				.order("availability_date", { ascending: true });

			if (schedulesError) {
				console.error("Error fetching schedules:", schedulesError);
			}

			// Create a map of doctor schedules
			const doctorSchedulesMap = new Map();
			(allSchedules || []).forEach((schedule) => {
				if (!doctorSchedulesMap.has(schedule.doctor_id)) {
					doctorSchedulesMap.set(schedule.doctor_id, []);
				}
				doctorSchedulesMap.get(schedule.doctor_id).push(schedule);
			});

			// Now create doctor entries for each unique schedule
			const doctorsWithAllSchedules = [];
			(doctorsData || []).forEach((doctor) => {
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
					doctorSchedules.forEach((schedule) => {
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
				return (
					new Date(a.next_availability).getTime() -
					new Date(b.next_availability).getTime()
				);
			});

			setDoctors(doctorsWithAllSchedules);
		} catch (error) {
			console.error("Error fetching doctors:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-GB");
	};

	if (loading) {
		return <div className="text-center py-8">Loading doctors...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{doctors.map((doctor) => (
					<Card
						key={doctor.id}
						className="group flex flex-col hover:shadow-xl transition-all duration-300 border hover:border-primary/20"
					>
						<CardHeader className="flex-grow pb-4">
							<CardTitle className="text-2xl font-bold text-primary mb-2">
								{doctor.name}
							</CardTitle>
							<div className="space-y-2 text-sm">
								<p>
									<strong>Degree: </strong> {doctor.degree}
								</p>
								<p>
									<strong>Designation: </strong> {doctor.designation}
								</p>
								<p>
									<strong>Specialties: </strong>{" "}
									{doctor.specialties?.join(", ")}
								</p>
								<p>
									<strong>Experience: </strong> {doctor.experience}
								</p>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Next Availability - Prominent Display */}
							<div className="bg-gradient-to-r from-ring/10 to-ring/5 p-4 rounded-lg border-l-4 border-primary flex items-center gap-3">
								<Calendar className="size-8 text-primary" />
								<div>
									<p className="font-semibold text-primary text-base mb-1">
										Next Availability
									</p>
									<p className="text-xl font-bold text-foreground">
										{doctor.next_availability
											? formatDate(doctor.next_availability)
											: "N/A"}
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
										{doctor.location ? doctor.location : "N/A"}
									</p>
								</div>
							</div>

							{/* Book Appointment */}
							<Button
								className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
								onClick={() => {
									// Extract original doctor ID if it's a composite ID
									const originalDoctorId =
										doctor.original_doctor_id || doctor.id;

									// Always store schedule data in localStorage for consistency
									const scheduleData = {
										doctorId: originalDoctorId,
										date: doctor.next_availability,
										location: doctor.location,
									};
									localStorage.setItem(
										"selectedSchedule",
										JSON.stringify(scheduleData),
									);

									if (onDoctorSelect) {
										// If callback is provided, use it (for inline display)
										onDoctorSelect(originalDoctorId);
									} else {
										// Navigate to book appointment page
										navigate("/book-appointment");
									}
								}}
								disabled={!doctor.next_availability}
							>
								{doctor.next_availability
									? "Book Appointment"
									: "Not Available"}
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
