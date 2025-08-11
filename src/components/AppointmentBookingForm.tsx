import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
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

interface AppointmentBookingFormProps {
  schedule: DoctorSchedule | null;
  appointments: Appointment[];
  doctorId: string;
  calculateAppointmentTime: (serialNumber: number, reason: string) => string;
  onBookingSuccess: (newAppointment: Appointment) => void;
}

export const AppointmentBookingForm = ({ 
  schedule, 
  appointments, 
  doctorId,
  calculateAppointmentTime,
  onBookingSuccess 
}: AppointmentBookingFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    pin: "",
    concern: "",
    reason: "",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  const concerns = ["OnnoRokom Group", "OnnoRokom Projukti Limited", "Udvash-Unmesh-Uttoron", "OnnoRorkom Electronics Co. Ltd.", "OnnoRokom Solutions Ltd.", "Pi Labs Bangladesh Ltd.", "OnnoRokom EdTech Ltd.", "Techshop Bangladesh"];
  const reasons = ["New Patient", "Follow Up", "Report Show"];

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schedule) {
      toast({
        title: "No Schedule Available",
        description: "এই সপ্তাহের জন্য এখনো ডাক্তারের আসার তারিখ নির্ধারণ করা হয়নি। অনুগ্রহ করে পরবর্তীতে চেষ্টা করুন।",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name || !formData.pin || !formData.concern || !formData.reason || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Bangladeshi phone number",
        variant: "destructive"
      });
      return;
    }

    if (appointments.length >= schedule.max_appointments) {
      toast({
        title: "Booking Full",
        description: "Maximum appointments for this date have been reached.",
        variant: "destructive"
      });
      return;
    }

    // Check PIN uniqueness for this date
    const existingPin = appointments.find(apt => apt.pin === parseInt(formData.pin));
    if (existingPin) {
      toast({
        title: "PIN Already Used",
        description: "This PIN has already been used for this date. Please use a different PIN.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const serialNumber = appointments.length + 1;
      const appointmentTime = calculateAppointmentTime(serialNumber, formData.reason);

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          name: formData.name,
          pin: parseInt(formData.pin),
          concern: formData.concern,
          phone: formData.phone,
          reason: formData.reason,
          doctor_id: doctorId,
          appointment_date: schedule.availability_date,
          serial_number: serialNumber,
          appointment_time: appointmentTime,
          status: 'upcoming'
        })
        .select()
        .single();

      if (error) throw error;

      setBookedAppointment(data);
      onBookingSuccess(data);
      
      // Reset form
      setFormData({
        name: "",
        pin: "",
        concern: "",
        reason: "",
        phone: ""
      });

    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (bookedAppointment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Appointment Confirmed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">Appointment Details:</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Date:</span> {formatDate(bookedAppointment.appointment_date)}</p>
              <p><span className="font-medium">Time:</span> {bookedAppointment.appointment_time}</p>
              <p><span className="font-medium">Name:</span> {bookedAppointment.name}</p>
              <p><span className="font-medium">Serial Number:</span> {bookedAppointment.serial_number}</p>
              <p><span className="font-medium">Concern:</span> {bookedAppointment.concern}</p>
              <p><span className="font-medium">Reason:</span> {bookedAppointment.reason}</p>
            </div>
          </div>
          <Button 
            onClick={() => setBookedAppointment(null)}
            className="w-full"
          >
            Book Another Appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Book Doctor Appointment
          </CardTitle>
          <CardDescription>
            Fill in your details to schedule an appointment with the doctor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              এই সপ্তাহের জন্য এখনো ডাক্তারের আসার তারিখ নির্ধারণ করা হয়নি। অনুগ্রহ করে পরবর্তীতে চেষ্টা করুন।
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Book Doctor Appointment
        </CardTitle>
        <CardDescription>
          Fill in your details to schedule an appointment with the doctor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN *</Label>
            <Input
              id="pin"
              type="number"
              value={formData.pin}
              onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concern">Concern *</Label>
            <Select value={formData.concern} onValueChange={(value) => setFormData(prev => ({ ...prev, concern: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select concern" />
              </SelectTrigger>
              <SelectContent>
                {concerns.map((concern) => (
                  <SelectItem key={concern} value={concern}>
                    {concern}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || appointments.length >= schedule.max_appointments}
          >
            {isSubmitting ? "Booking..." : "Book Appointment"}
          </Button>

          {appointments.length >= schedule.max_appointments && (
            <p className="text-sm text-red-600 text-center">
              Maximum appointments for this date have been reached.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};