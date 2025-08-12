import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, Users, UserCheck, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Analytics {
  totalUsers: number;
  totalAppointments: number;
  totalDoctors: number;
  totalPrescriptions: number;
  appointmentsByDoctor: Array<{ doctor: string; count: number }>;
  appointmentsByStatus: Array<{ status: string; count: number; color: string }>;
  usersByMonth: Array<{ month: string; users: number }>;
  appointmentsByMonth: Array<{ month: string; appointments: number }>;
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchDoctors();
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching doctors:", error);
        return;
      }

      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch total counts
      const [usersResult, appointmentsResult, doctorsResult, prescriptionsResult] = await Promise.all([
        // Note: User count may be restricted due to RLS policies for security
        supabase.rpc('count_total_users').then(result => result).catch(() => ({ count: 0 })),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("doctors").select("id", { count: "exact", head: true }),
        supabase.from("prescriptions").select("id", { count: "exact", head: true })
      ]);

      // Fetch appointments by doctor
      let appointmentsByDoctorQuery = supabase
        .from("appointments")
        .select(`
          doctor_id,
          doctor:doctors(name)
        `);

      if (selectedDoctor !== "all") {
        appointmentsByDoctorQuery = appointmentsByDoctorQuery.eq("doctor_id", selectedDoctor);
      }

      const { data: appointmentsByDoctorData } = await appointmentsByDoctorQuery;

      // Process appointments by doctor
      const doctorCounts: { [key: string]: number } = {};
      appointmentsByDoctorData?.forEach((apt: any) => {
        const doctorName = apt.doctor?.name || "Unknown";
        doctorCounts[doctorName] = (doctorCounts[doctorName] || 0) + 1;
      });

      const appointmentsByDoctor = Object.entries(doctorCounts).map(([doctor, count]) => ({
        doctor,
        count
      }));

      // Fetch appointments by status
      let appointmentsByStatusQuery = supabase
        .from("appointments")
        .select("status");

      if (selectedDoctor !== "all") {
        appointmentsByStatusQuery = appointmentsByStatusQuery.eq("doctor_id", selectedDoctor);
      }

      const { data: appointmentsByStatusData } = await appointmentsByStatusQuery;

      const statusCounts: { [key: string]: number } = {};
      appointmentsByStatusData?.forEach((apt) => {
        statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
      });

      const statusColors: { [key: string]: string } = {
        "upcoming": "#3b82f6",
        "completed": "#10b981",
        "absent": "#f59e0b",
        "rejected": "#ef4444",
        "accepted": "#8b5cf6"
      };

      const appointmentsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        color: statusColors[status] || "#6b7280"
      }));

      // Fetch monthly data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: usersMonthlyData } = await supabase
        .from("users")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString());

      const { data: appointmentsMonthlyData } = await supabase
        .from("appointments")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString());

      // Process monthly data
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const usersByMonth: { [key: string]: number } = {};
      const appointmentsByMonth: { [key: string]: number } = {};

      usersMonthlyData?.forEach((user) => {
        const month = monthNames[new Date(user.created_at).getMonth()];
        usersByMonth[month] = (usersByMonth[month] || 0) + 1;
      });

      appointmentsMonthlyData?.forEach((apt) => {
        const month = monthNames[new Date(apt.created_at).getMonth()];
        appointmentsByMonth[month] = (appointmentsByMonth[month] || 0) + 1;
      });

      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = monthNames[date.getMonth()];
        last6Months.push({
          month: monthName,
          users: usersByMonth[monthName] || 0,
          appointments: appointmentsByMonth[monthName] || 0
        });
      }

      setAnalytics({
        totalUsers: usersResult.count || 0,
        totalAppointments: appointmentsResult.count || 0,
        totalDoctors: doctorsResult.count || 0,
        totalPrescriptions: prescriptionsResult.count || 0,
        appointmentsByDoctor,
        appointmentsByStatus,
        usersByMonth: last6Months,
        appointmentsByMonth: last6Months
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          user:users(name, phone),
          doctor:doctors(name)
        `);

      if (selectedDoctor !== "all") {
        query = query.eq("doctor_id", selectedDoctor);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error",
          description: "Failed to export data",
          variant: "destructive"
        });
        return;
      }

      // Create CSV content
      const headers = ["Date", "Doctor", "Patient", "Phone", "Concern", "Reason", "Serial", "Time", "Status"];
      const csvContent = [
        headers.join(","),
        ...(data || []).map((row: any) => [
          new Date(row.appointment_date).toLocaleDateString('en-GB'),
          row.doctor?.name || 'Unknown',
          row.user?.name || row.name,
          row.user?.phone || row.phone || 'N/A',
          row.concern,
          row.reason,
          row.serial_number,
          row.appointment_time,
          row.status
        ].join(","))
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments_${selectedDoctor === "all" ? "all" : "filtered"}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report exported successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-4">
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-[200px]">
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
          <Button onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Doctors</p>
                <p className="text-2xl font-bold">{analytics.totalDoctors}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold">{analytics.totalAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Prescriptions</p>
                <p className="text-2xl font-bold">{analytics.totalPrescriptions}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Doctor */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.appointmentsByDoctor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="doctor" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointments by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.appointmentsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Growth (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.usersByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#10b981" name="New Users" />
              <Bar dataKey="appointments" fill="#3b82f6" name="New Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};