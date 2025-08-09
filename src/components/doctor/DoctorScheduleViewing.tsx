import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        .order("availability_date", { ascending: false });

      if (error) {
        console.error("Error fetching schedules:", error);
        return;
      }

      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getScheduleStatus = (schedule: DoctorSchedule) => {
    const today = new Date().toISOString().split('T')[0];
    const scheduleDate = schedule.availability_date;

    if (scheduleDate < today) {
      return <Badge variant="secondary">Past</Badge>;
    } else if (scheduleDate === today) {
      return <Badge variant="default">Today</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading schedules...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Schedule Viewing</h2>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No schedules found. Contact admin to set up your schedule.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {formatDate(schedule.availability_date)}
                  </CardTitle>
                  {getScheduleStatus(schedule)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Highlighted Location */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <p className="font-semibold text-primary">Location:</p>
                    <p className="font-bold text-primary text-lg">{schedule.location || 'Not Specified'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Start Time:</p>
                    <p className="text-muted-foreground">{schedule.start_time}</p>
                  </div>
                  <div>
                    <p className="font-medium">End Time:</p>
                    <p className="text-muted-foreground">{schedule.end_time}</p>
                  </div>
                  <div>
                    <p className="font-medium">Break Start:</p>
                    <p className="text-muted-foreground">{schedule.break_start}</p>
                  </div>
                  <div>
                    <p className="font-medium">Break End:</p>
                    <p className="text-muted-foreground">{schedule.break_end}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-sm">Max Appointments:</p>
                  <p className="text-muted-foreground text-sm">{schedule.max_appointments}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};