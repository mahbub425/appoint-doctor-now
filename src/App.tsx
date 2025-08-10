import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import BookAppointment from "./pages/BookAppointment";
import AppointmentDetails from "./pages/AppointmentDetails";
import DoctorDashboard from "./pages/DoctorDashboard";
import Admin from "./pages/Admin";
import DoctorLogin from "./pages/DoctorLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/book-appointment/:doctorId" element={<BookAppointment />} />
            <Route path="/appointment-details" element={<AppointmentDetails />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor-login" element={<DoctorLogin />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
