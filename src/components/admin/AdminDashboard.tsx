import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { DoctorScheduleForm } from "./DoctorScheduleForm";
import { AppointmentManagement } from "./AppointmentManagement";
import { supabase } from "@/integrations/supabase/client";
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

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
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

  const handleScheduleUpdate = (newSchedule: DoctorSchedule) => {
    setSchedule(newSchedule);
    // Clear appointments when schedule changes
    setAppointments([]);
    toast({
      title: "Schedule Updated",
      description: "Doctor schedule has been updated successfully",
    });
  };

  const exportToCSV = () => {
    if (appointments.length === 0) {
      toast({
        title: "No Data",
        description: "No appointments to export",
        variant: "destructive"
      });
      return;
    }

    const headers = ["Name", "PIN", "Concern", "Phone", "Reason", "Serial", "Schedule Time"];
    const csvContent = [
      headers.join(","),
      ...appointments.map(apt => [
        apt.name,
        apt.pin,
        apt.concern,
        apt.phone,
        apt.reason,
        apt.serial_number,
        apt.appointment_time
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments_${schedule?.availability_date || 'export'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Appointments exported to CSV file",
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
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex gap-4">
              <Button onClick={exportToCSV} variant="outline">
                Export to CSV
              </Button>
              <Button onClick={onLogout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <DoctorScheduleForm
              schedule={schedule}
              onScheduleUpdate={handleScheduleUpdate}
            />
          </div>
          
          <div className="space-y-6">
            <AppointmentManagement
              schedule={schedule}
              appointments={appointments}
              onAppointmentsUpdate={fetchAppointments}
            />
          </div>
        </div>
      </main>
    </div>
  );
};