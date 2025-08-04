import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { NoticeSection } from "@/components/NoticeSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Doctor {
  id: string;
  name: string;
  degree: string;
  experience: string;
  designation: string;
  specialties: string[];
  is_active: boolean;
  next_availability?: string;
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
      const { data: doctorsData, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching doctors:", error);
        return;
      }

      // Fetch next availability for each doctor
      const doctorsWithAvailability = await Promise.all(
        (doctorsData || []).map(async (doctor) => {
          const { data: schedule } = await supabase
            .from("doctor_schedules")
            .select("availability_date")
            .eq("doctor_id", doctor.id)
            .gte("availability_date", new Date().toISOString().split('T')[0])
            .order("availability_date", { ascending: true })
            .limit(1)
            .single();

          return {
            ...doctor,
            next_availability: schedule?.availability_date || null
          };
        })
      );

      setDoctors(doctorsWithAvailability);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleBookAppointment = (doctorId: string) => {
    if (!user) {
      toast.error("You can't book any appointment without login");
      return;
    }
    navigate(`/book-appointment/${doctorId}`);
  };

  if (loading) {
    return <div className="text-center py-8">Loading doctors...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Available Doctors</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{doctor.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{doctor.degree}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Designation:</p>
                <p className="text-sm text-muted-foreground">{doctor.designation}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Experience:</p>
                <p className="text-sm text-muted-foreground">{doctor.experience}</p>
              </div>

              {doctor.specialties && doctor.specialties.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {doctor.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Next Availability:</p>
                <p className="text-sm text-muted-foreground">
                  {doctor.next_availability 
                    ? formatDate(doctor.next_availability)
                    : "No upcoming availability"
                  }
                </p>
              </div>

              <Button 
                className="w-full"
                onClick={() => handleBookAppointment(doctor.id)}
                disabled={!doctor.next_availability}
              >
                {doctor.next_availability ? "Book Appointment" : "Not Available"}
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
  const { user, isAdmin, isDoctor, isUser, loading } = useAuth();

  useEffect(() => {
    console.log("Index.tsx redirect check - loading:", loading, "user:", !!user, "isAdmin:", isAdmin, "isDoctor:", isDoctor, "isUser:", isUser);
    
    if (!loading && user) {
      if (isAdmin) {
        console.log("Redirecting to admin");
        navigate("/admin");
      } else if (isDoctor) {
        console.log("Redirecting to doctor");
        navigate("/doctor");
      } else if (isUser) {
        console.log("Redirecting to user");
        navigate("/user");
      }
    }
  }, [user, isAdmin, isDoctor, isUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NoticeSection />
      
      <div className="container mx-auto px-4 py-8">
        <DoctorListWithLoginCheck />
      </div>
    </div>
  );
};

export default Index;
