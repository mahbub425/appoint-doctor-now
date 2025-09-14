import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Analytics {
  totalPatients: number;
  totalVisits: number;
  totalSchedules: number;
  rating: number;
  visitsByDoctor: Array<{ name: string; visits: number }>;
  visitsByReason: Array<{ name: string; value: number }>;
  monthlyGrowth: Array<{ month: string; visits: number }>;
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

    // Set up real-time subscriptions for automatic updates
    const appointmentsChannel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          console.log('Appointments table changed, refreshing analytics...');
          fetchAnalytics();
        }
      )
      .subscribe();

    const schedulesChannel = supabase
      .channel('schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctor_schedules'
        },
        () => {
          console.log('Doctor schedules table changed, refreshing analytics...');
          fetchAnalytics();
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          console.log('Users table changed, refreshing analytics...');
          fetchAnalytics();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(schedulesChannel);
      supabase.removeChannel(usersChannel);
    };
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
    // Include future appointments - extend end date to 1 year from now
    const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const endDate = futureDate.toISOString().split('T')[0];
    let startDate = '';

    switch (selectedDateRange) {
      case 'today':
        startDate = now.toISOString().split('T')[0];
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
        // Show data from the beginning of time to capture all data including future
        startDate = '2020-01-01'; // Very old date to capture all data
        break;
    }

    return { startDate, endDate };
  };

  const fetchAnalytics = async () => {
    try {
      const { startDate, endDate } = getDateFilter();
      
      // Fetch all appointments with proper joins
      let appointmentsQuery = supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          created_at,
          reason,
          status,
          user_id,
          doctor_id,
          doctor:doctors(name)
        `)
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate);

      if (selectedDoctor !== "all") {
        appointmentsQuery = appointmentsQuery.eq("doctor_id", selectedDoctor);
      }

      // Fetch all schedules
      let schedulesQuery = supabase
        .from("doctor_schedules")
        .select("id, availability_date, doctor_id")
        .gte("availability_date", startDate)
        .lte("availability_date", endDate);

      if (selectedDoctor !== "all") {
        schedulesQuery = schedulesQuery.eq("doctor_id", selectedDoctor);
      }

      // Fetch ALL users - use secure function for total count
      const allUsersQuery = supabase.rpc('count_total_users');
      
      // Fetch all active doctors for visits by doctor chart
      const doctorsQuery = supabase
        .from("doctors")
        .select("id, name")
        .eq("is_active", true);

      const [appointmentsResponse, schedulesResponse, allUsersResponse, doctorsResponse] = await Promise.all([
        appointmentsQuery,
        schedulesQuery,
        allUsersQuery,
        doctorsQuery
      ]);

      if (appointmentsResponse.error || schedulesResponse.error || allUsersResponse.error || doctorsResponse.error) {
        console.error("Error fetching analytics data:", appointmentsResponse.error || schedulesResponse.error || allUsersResponse.error || doctorsResponse.error);
        return;
      }

      const appointments = appointmentsResponse.data || [];
      const schedules = schedulesResponse.data || [];
      const doctors = doctorsResponse.data || [];

      // Total Patients is ALWAYS the total count of all users, never filtered
      const totalPatients = allUsersResponse.data || 0;

      // Process visits by doctor - show all doctors but with their actual appointment counts
      const visitsByDoctor = doctors.map(doctor => {
        const doctorAppointments = appointments.filter(apt => apt.doctor_id === doctor.id);
        return {
          name: doctor.name,
          visits: doctorAppointments.length
        };
      }).filter(doctor => doctor.visits > 0 || selectedDoctor === "all"); // Only show doctors with visits or show all when not filtered

      // Process visits by reason
      const reasonCounts = appointments.reduce((acc, apt) => {
        const reason = apt.reason || 'Other';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const visitsByReason = Object.entries(reasonCounts).map(([name, value]) => ({
        name: name,
        value
      }));

      // Process monthly growth - based on appointment dates
      const monthlyGrowth = [];
      const now = new Date();
      
      const getMonthsToShow = () => {
        switch (selectedDateRange) {
          case 'today':
            return 1;
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
        
        const monthVisits = appointments.filter(apt => {
          return apt.appointment_date >= monthStart && apt.appointment_date <= monthEnd;
        }).length;
        
        monthlyGrowth.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          visits: monthVisits
        });
      }

      // Calculate totals
      const totalVisits = appointments.length;
      const totalSchedules = schedules.length;
      const rating = 4.8; // Static rating for now - could be calculated from feedback in future
      
      setAnalytics({
        totalPatients, // This is always the total count, never filtered
        totalVisits,
        totalSchedules,
        rating,
        visitsByDoctor,
        visitsByReason,
        monthlyGrowth
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
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
				<h2 className="text-xl md:text-2xl font-bold">Analytics Dashboard</h2>

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

					<Select
						value={selectedDateRange}
						onValueChange={setSelectedDateRange}
					>
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

					<Button onClick={exportToCSV}>Export CSV</Button>
				</div>
			</div>

			{/* Analytics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Patients
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalPatients}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Visits</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalVisits}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Schedules
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalSchedules}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Rating</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.rating}</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Visits by Doctor</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={analytics.visitsByDoctor}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip formatter={(value) => [`${value} Visits`, "Visits"]} />
								<Bar dataKey="visits" fill="#8884d8" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Visits by Reason</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={analytics.visitsByReason}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) =>
										`${name} ${(percent * 100).toFixed(0)}%`
									}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
								>
									{analytics.visitsByReason.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
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
							<Tooltip formatter={(value) => [`${value} Visits`, "Visits"]} />
							<Line
								type="monotone"
								dataKey="visits"
								stroke="#8884d8"
								strokeWidth={2}
								name="Visits"
							/>
						</LineChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</div>
	);
};