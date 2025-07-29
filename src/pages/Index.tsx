import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentBookingForm } from "@/components/AppointmentBookingForm";
import { AppointmentList } from "@/components/AppointmentList";
import { Header } from "@/components/Header";
import { NoticeSection } from "@/components/NoticeSection";
import { toast } from "@/hooks/use-toast";

interface DoctorSchedule {
  id: string;
  availability_date: string;
  start_time: string;
  break_start: string;
  break_end: string;
  end_time: string;
  max_appointments: number;
}

interface Appointment {
  id: string;
  name: string;
  pin: number;
  concern: string;
  phone: string;
  reason: string;
  appointment_date: string;
  serial_number: number;
  appointment_time: string;
  status: string;
}

const Index = () => {
  const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    const { data, error } = await supabase
      .from("doctor_schedules")
      .select("*")
      .gte("availability_date", new Date().toISOString().split('T')[0])
      .order("availability_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching schedule:", error);
      return;
    }

    setSchedule(data);
  };

  const fetchAppointments = async () => {
    if (!schedule) return;

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", schedule.availability_date)
      .order("serial_number", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      return;
    }

    setAppointments(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSchedule();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (schedule) {
      fetchAppointments();
    }
  }, [schedule]);

  // Set up real-time subscription for appointments
  useEffect(() => {
    if (!schedule) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `appointment_date=eq.${schedule.availability_date}`
        },
        () => fetchAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schedule]);

  const calculateAppointmentTime = (serialNumber: number, reason: string) => {
    if (!schedule) return "";

    const durations: { [key: string]: number } = {
      "New Patient": 10,
      "Follow Up": 7,
      "Report Show": 12
    };

    let currentTime = new Date(`2000-01-01T${schedule.start_time}`);
    const breakStart = new Date(`2000-01-01T${schedule.break_start}`);
    const breakEnd = new Date(`2000-01-01T${schedule.break_end}`);

    // Calculate time for appointments before this one
    for (let i = 1; i < serialNumber; i++) {
      const appointment = appointments.find(apt => apt.serial_number === i);
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

  const handleBookingSuccess = (newAppointment: Appointment) => {
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => a.serial_number - b.serial_number));
    toast({
      title: "Appointment Booked Successfully",
      description: `Your appointment is scheduled for ${newAppointment.appointment_time} on ${newAppointment.appointment_date}`,
    });
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AppointmentBookingForm
            schedule={schedule}
            appointments={appointments}
            calculateAppointmentTime={calculateAppointmentTime}
            onBookingSuccess={handleBookingSuccess}
          />
          <AppointmentList
            schedule={schedule}
            appointments={appointments}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
