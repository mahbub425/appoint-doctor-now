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
            .select("availability_date, location")
            .eq("doctor_id", doctor.id)
            .gte("availability_date", new Date().toISOString().split('T')[0])
            .order("availability_date", { ascending: true })
            .limit(1)
            .single();

          return {
            ...doctor,
            next_availability: schedule?.availability_date || null,
            location: schedule?.location || null
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
      navigate("/auth");
      return;
    }
    navigate(`/book-appointment/${doctorId}`);
  };

  if (loading) {
    return <div className="text-center py-8">Loading doctors...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Available Doctors</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-primary mb-2">{doctor.name}</CardTitle>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm font-medium">{doctor.degree}</p>
                <p className="text-muted-foreground text-sm">{doctor.designation}</p>
                <p className="text-muted-foreground text-sm">{doctor.experience}</p>
                <p className="text-muted-foreground text-sm">{doctor.specialties?.join(", ")}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Next Availability - Prominent Display */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary text-lg">Next Availability</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {doctor.next_availability 
                    ? formatDate(doctor.next_availability)
                    : "No upcoming availability"
                  }
                </p>
              </div>

              {/* Location - Prominent Display */}
              {doctor.location && (
                <div className="bg-gradient-to-r from-secondary/20 to-secondary/10 p-4 rounded-lg border-l-4 border-secondary">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-secondary" />
                    <span className="font-semibold text-secondary text-lg">Location</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{doctor.location}</p>
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
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
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <DoctorListWithLoginCheck />
      </div>
    </div>
  );
};

export default Index;
