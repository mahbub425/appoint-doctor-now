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
  created_at: string;
}

export const DoctorScheduleViewing = () => {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    start_time: "",
    break_start: "",
    break_end: "",
    end_time: "",
    max_appointments: 17
  });
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
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

  const handleEditSchedule = (schedule: DoctorSchedule) => {
    setEditingSchedule(schedule);
    setEditForm({
      start_time: schedule.start_time,
      break_start: schedule.break_start,
      break_end: schedule.break_end,
      end_time: schedule.end_time,
      max_appointments: schedule.max_appointments
    });
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    try {
      const { error } = await supabase
        .from("doctor_schedules")
        .update({
          start_time: editForm.start_time,
          break_start: editForm.break_start,
          break_end: editForm.break_end,
          end_time: editForm.end_time,
          max_appointments: editForm.max_appointments
        })
        .eq("id", editingSchedule.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update schedule",
          variant: "destructive"
        });
        return;
      }

      // Reschedule appointments for this doctor's schedule
      await supabase.rpc('reschedule_appointments_for_doctor', {
        p_doctor_id: doctorProfile.id,
        p_availability_date: editingSchedule.availability_date,
        p_start_time: editForm.start_time,
        p_break_start: editForm.break_start,
        p_break_end: editForm.break_end
      });

      toast({
        title: "Success",
        description: "Schedule updated and appointments rescheduled successfully"
      });

      setEditingSchedule(null);
      fetchSchedules();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
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
              <CardContent className="space-y-3">
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

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditSchedule(schedule)}
                      className="w-full"
                    >
                      Edit Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Schedule - {formatDate(schedule.availability_date)}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-time">Start Time</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={editForm.start_time}
                            onChange={(e) => setEditForm(prev => ({ ...prev, start_time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-time">End Time</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={editForm.end_time}
                            onChange={(e) => setEditForm(prev => ({ ...prev, end_time: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="break-start">Break Start</Label>
                          <Input
                            id="break-start"
                            type="time"
                            value={editForm.break_start}
                            onChange={(e) => setEditForm(prev => ({ ...prev, break_start: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="break-end">Break End</Label>
                          <Input
                            id="break-end"
                            type="time"
                            value={editForm.break_end}
                            onChange={(e) => setEditForm(prev => ({ ...prev, break_end: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="max-appointments">Max Appointments</Label>
                        <Input
                          id="max-appointments"
                          type="number"
                          value={editForm.max_appointments}
                          onChange={(e) => setEditForm(prev => ({ ...prev, max_appointments: parseInt(e.target.value) }))}
                        />
                      </div>

                      <Button onClick={handleUpdateSchedule} className="w-full">
                        Update Schedule
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};