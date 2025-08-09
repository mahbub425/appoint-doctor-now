import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DoctorSchedule {
  id: string;
  doctor_id: string;
  availability_date: string;
  location?: string;
  start_time: string;
  break_start: string;
  break_end: string;
  end_time: string;
  max_appointments: number;
}

interface DoctorScheduleFormProps {
  schedule?: DoctorSchedule | null;
  onScheduleUpdate: () => void;
}

export const DoctorScheduleForm = ({ schedule, onScheduleUpdate }: DoctorScheduleFormProps) => {
  const [formData, setFormData] = useState({
    doctor_id: "",
    availability_date: "",
    location: "",
    start_time: "11:00",
    break_start: "13:15",
    break_end: "14:30",
    end_time: "16:30",
    max_appointments: 17
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch active doctors
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name, degree")
        .eq("is_active", true)
        .order("name");
      
      if (!error && data) {
        setDoctors(data);
      }
    };
    
    fetchDoctors();
    
    if (schedule) {
      setFormData({
        doctor_id: "",
        availability_date: schedule.availability_date,
        location: schedule.location || "",
        start_time: schedule.start_time.slice(0, 5),
        break_start: schedule.break_start.slice(0, 5),
        break_end: schedule.break_end.slice(0, 5),
        end_time: schedule.end_time.slice(0, 5),
        max_appointments: schedule.max_appointments
      });
    }
  }, [schedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If updating existing schedule
      if (schedule) {
        const { data, error } = await supabase
          .from("doctor_schedules")
          .update({
            availability_date: formData.availability_date,
            location: formData.location,
            start_time: formData.start_time + ":00",
            break_start: formData.break_start + ":00",
            break_end: formData.break_end + ":00",
            end_time: formData.end_time + ":00",
            max_appointments: formData.max_appointments
          })
          .eq("id", schedule.id)
          .select()
          .single();

        if (error) throw error;

        // Reschedule appointments only for this doctor and date
        await supabase.rpc('reschedule_appointments_for_doctor', {
          p_doctor_id: schedule.doctor_id,
          p_availability_date: formData.availability_date,
          p_start_time: formData.start_time + ":00",
          p_break_start: formData.break_start + ":00",
          p_break_end: formData.break_end + ":00"
        });

        onScheduleUpdate();
      } else {
        // Creating new schedule - only delete appointments for this doctor/date
        await supabase
          .from("appointments")
          .delete()
          .eq("doctor_id", formData.doctor_id)
          .eq("appointment_date", formData.availability_date);

        const { data, error } = await supabase
          .from("doctor_schedules")
          .insert({
            doctor_id: formData.doctor_id,
            availability_date: formData.availability_date,
            location: formData.location,
            start_time: formData.start_time + ":00",
            break_start: formData.break_start + ":00",
            break_end: formData.break_end + ":00",
            end_time: formData.end_time + ":00",
            max_appointments: formData.max_appointments
          })
          .select()
          .single();

        if (error) throw error;
        onScheduleUpdate();
      }

      toast({
        title: "Schedule Saved",
        description: "Doctor schedule has been saved successfully",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save schedule",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Doctor Schedule Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctor">Select Doctor</Label>
            <Select
              value={formData.doctor_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, doctor_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name} - {doctor.degree}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability_date">Doctor Availability Date</Label>
            <Input
              id="availability_date"
              type="date"
              value={formData.availability_date}
              onChange={(e) => setFormData(prev => ({ ...prev, availability_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Karwan Bazar">Karwan Bazar</SelectItem>
                <SelectItem value="Motijheel">Motijheel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="break_start">Break Start</Label>
              <Input
                id="break_start"
                type="time"
                value={formData.break_start}
                onChange={(e) => setFormData(prev => ({ ...prev, break_start: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="break_end">Break End</Label>
              <Input
                id="break_end"
                type="time"
                value={formData.break_end}
                onChange={(e) => setFormData(prev => ({ ...prev, break_end: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_appointments">Maximum Appointments</Label>
            <Input
              id="max_appointments"
              type="number"
              min="1"
              value={formData.max_appointments}
              onChange={(e) => setFormData(prev => ({ ...prev, max_appointments: parseInt(e.target.value) }))}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Schedule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};