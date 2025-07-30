import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  name: string;
  concern: string;
  reason: string;
  appointment_date: string;
  appointment_time: string;
  serial_number: number;
  status: string;
  user_id: string;
  user: {
    name: string;
  };
}

interface Prescription {
  id: string;
  appointment_id: string;
  consultation_notes: string;
  prescription_text: string;
  created_at: string;
}

export const ConsultationManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [consultationNotes, setConsultationNotes] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { doctorProfile } = useAuth();

  useEffect(() => {
    if (doctorProfile) {
      fetchAppointments();
      fetchPrescriptions();
    }
  }, [doctorProfile]);

  const fetchAppointments = async () => {
    if (!doctorProfile) return;

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          user:users(name)
        `)
        .eq("doctor_id", doctorProfile.id)
        .eq("status", "accepted")
        .order("appointment_date", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    if (!doctorProfile) return;

    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("doctor_id", doctorProfile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prescriptions:", error);
        return;
      }

      setPrescriptions(data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment || !doctorProfile) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive"
      });
      return;
    }

    if (!consultationNotes && !prescriptionText) {
      toast({
        title: "Error",
        description: "Please add consultation notes or prescription",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const selectedApt = appointments.find(apt => apt.id === selectedAppointment);
      if (!selectedApt) return;

      const { error } = await supabase
        .from("prescriptions")
        .insert({
          appointment_id: selectedAppointment,
          doctor_id: doctorProfile.id,
          user_id: selectedApt.user_id,
          consultation_notes: consultationNotes,
          prescription_text: prescriptionText
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save consultation notes",
          variant: "destructive"
        });
        return;
      }

      // Mark appointment as completed
      await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", selectedAppointment);

      toast({
        title: "Success",
        description: "Consultation notes saved successfully"
      });

      // Reset form
      setConsultationNotes("");
      setPrescriptionText("");
      setSelectedAppointment("");

      // Refresh data
      fetchPrescriptions();
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const generatePrescriptionPDF = (prescription: Prescription) => {
    // In a real app, you'd use jsPDF or similar library
    const content = `
PRESCRIPTION

Doctor: ${doctorProfile?.name}
Degree: ${doctorProfile?.degree}
Designation: ${doctorProfile?.designation}

Patient: ${appointments.find(apt => apt.id === prescription.appointment_id)?.name || 'Unknown'}
Date: ${new Date(prescription.created_at).toLocaleDateString('en-GB')}

CONSULTATION NOTES:
${prescription.consultation_notes}

PRESCRIPTION:
${prescription.prescription_text}

Signature: _______________
Dr. ${doctorProfile?.name}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription_${appointments.find(apt => apt.id === prescription.appointment_id)?.name || 'patient'}_${new Date(prescription.created_at).toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Prescription downloaded"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading) {
    return <div className="text-center py-8">Loading consultations...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Consultation Management</h2>

      {/* New Consultation */}
      <Card>
        <CardHeader>
          <CardTitle>New Consultation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="appointment-select">Select Appointment</Label>
            <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an appointment" />
              </SelectTrigger>
              <SelectContent>
                {appointments.map((appointment) => (
                  <SelectItem key={appointment.id} value={appointment.id}>
                    {appointment.name} - {formatDate(appointment.appointment_date)} at {appointment.appointment_time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAppointment && (
            <>
              <div>
                <Label htmlFor="consultation-notes">Consultation Notes</Label>
                <Textarea
                  id="consultation-notes"
                  placeholder="Enter consultation notes, diagnosis, observations..."
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="prescription">Prescription</Label>
                <Textarea
                  id="prescription"
                  placeholder="Enter prescription details, medications, dosage..."
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  rows={6}
                />
              </div>

              <Button 
                onClick={handleSaveNotes}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Consultation & Prescription"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Previous Consultations */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Consultations</CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No consultations recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Consultation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>{appointments.find(apt => apt.id === prescription.appointment_id)?.name || 'Unknown'}</TableCell>
                    <TableCell>{formatDate(prescription.created_at)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {prescription.consultation_notes || 'No notes'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePrescriptionPDF(prescription)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};