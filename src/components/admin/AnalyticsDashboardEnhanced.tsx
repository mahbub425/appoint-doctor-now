import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Analytics {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  totalPrescriptions: number;
  appointmentsByDoctor: Array<{ name: string; appointments: number }>;
  appointmentsByStatus: Array<{ name: string; value: number }>;
  monthlyGrowth: Array<{ month: string; users: number; appointments: number; prescriptions: number }>;
}

export const AnalyticsDashboardEnhanced = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("last_6_months");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDoctor, selectedDateRange]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching doctors:", error);
        return;
      }

      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate = '';

    switch (selectedDateRange) {
      case 'today':
        startDate = endDate;
        break;
      case 'last_7_days':
        const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = week.toISOString().split('T')[0];
        break;
      case 'last_1_month':
        const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = month.toISOString().split('T')[0];
        break;
      case 'last_3_months':
        const threeMonths = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate = threeMonths.toISOString().split('T')[0];
        break;
      case 'last_6_months':
      default:
        const sixMonths = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        startDate = sixMonths.toISOString().split('T')[0];
        break;
    }

    return { startDate, endDate };
  };

  const fetchAnalytics = async () => {
    try {
      const { startDate, endDate } = getDateFilter();
      
      // Base query for appointments
      let appointmentsQuery = supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          status,
          doctor:doctors(name)
        `)
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate);

      if (selectedDoctor !== "all") {
        appointmentsQuery = appointmentsQuery.eq("doctor_id", selectedDoctor);
      }

      // Base query for prescriptions
      let prescriptionsQuery = supabase
        .from("prescriptions")
        .select("id, created_at")
        .gte("created_at", startDate + "T00:00:00")
        .lte("created_at", endDate + "T23:59:59");

      if (selectedDoctor !== "all") {
        prescriptionsQuery = prescriptionsQuery.eq("doctor_id", selectedDoctor);
      }

      const [appointmentsResponse, prescriptionsResponse, usersResponse, doctorsResponse] = await Promise.all([
        appointmentsQuery,
        prescriptionsQuery,
        supabase.from("users").select("id, created_at"),
        supabase.from("doctors").select("id, name").eq("is_active", true)
      ]);

      if (appointmentsResponse.error || prescriptionsResponse.error || usersResponse.error || doctorsResponse.error) {
        console.error("Error fetching analytics data");
        return;
      }

      const appointments = appointmentsResponse.data || [];
      const prescriptions = prescriptionsResponse.data || [];
      const users = usersResponse.data || [];
      const doctors = doctorsResponse.data || [];

      // Process appointments by doctor
      const appointmentsByDoctor = doctors.map(doctor => ({
        name: doctor.name,
        appointments: appointments.filter(apt => apt.doctor?.name === doctor.name).length
      }));

      // Process appointments by status
      const statusCounts = appointments.reduce((acc, apt) => {
        const status = apt.status || 'upcoming';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const appointmentsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      // Process monthly growth with proper date calculations
      const monthlyGrowth = [];
      const now = new Date();
      const startDateObj = new Date(startDate);
      
      // Generate months based on selected date range
      const getMonthsToShow = () => {
        switch (selectedDateRange) {
          case 'today':
          case 'last_7_days':
            return 1;
          case 'last_1_month':
            return 1;
          case 'last_3_months':
            return 3;
          case 'last_6_months':
          default:
            return 6;
        }
      };

      const monthsToShow = getMonthsToShow();
      
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = monthDate.toISOString().split('T')[0];
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];
        
        // Filter data for this month
        const monthUsers = users.filter(user => {
          const userDate = user.created_at?.split('T')[0];
          return userDate >= monthStart && userDate <= monthEnd;
        }).length;
        
        const monthAppointments = appointments.filter(apt => {
          return apt.appointment_date >= monthStart && apt.appointment_date <= monthEnd;
        }).length;
        
        const monthPrescriptions = prescriptions.filter(pres => {
          const presDate = pres.created_at?.split('T')[0];
          return presDate >= monthStart && presDate <= monthEnd;
        }).length;
        
        monthlyGrowth.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          users: monthUsers,
          appointments: monthAppointments,
          prescriptions: monthPrescriptions
        });
      }

      setAnalytics({
        totalUsers: users.length,
        totalDoctors: doctors.length,
        totalAppointments: appointments.length,
        totalPrescriptions: prescriptions.length,
        appointmentsByDoctor,
        appointmentsByStatus,
        monthlyGrowth
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const { startDate, endDate } = getDateFilter();
      
      let query = supabase
        .from("appointments")
        .select(`
          *,
          doctor:doctors(name),
          user:users(name, phone)
        `)
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate);

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
      const headers = ["Date", "Time", "Patient Name", "Phone", "Doctor", "Concern", "Reason", "Status"];
      const csvContent = [
        headers.join(","),
        ...(data || []).map(appointment => [
          appointment.appointment_date,
          appointment.appointment_time,
          appointment.name,
          appointment.user?.phone || appointment.phone,
          appointment.doctor?.name || "Unknown",
          appointment.concern,
          appointment.reason,
          appointment.status
        ].join(","))
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments-${startDate}-to-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Data exported successfully"
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
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

          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_1_month">Last 1 Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportToCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDoctors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPrescriptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.appointmentsByDoctor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analytics.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Users"
              />
              <Line 
                type="monotone" 
                dataKey="appointments" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Appointments"
              />
              <Line 
                type="monotone" 
                dataKey="prescriptions" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Prescriptions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};