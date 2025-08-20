import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Edit, Plus, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Doctor {
  id: string;
  name: string;
  degree: string;
  experience: string;
  designation: string;
  specialties: string[];
  username: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
}

export const DoctorManagement = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    degree: "",
    experience: "",
    designation: "",
    specialties: "",
    username: "",
    password: ""
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching doctors:", error);
        return;
      }

      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDoctorForm({
      name: "",
      degree: "",
      experience: "",
      designation: "",
      specialties: "",
      username: "",
      password: ""
    });
  };

  const handleAddDoctor = async () => {
    // Validate required fields
    if (!doctorForm.name || !doctorForm.degree || !doctorForm.username || !doctorForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const specialtiesArray = doctorForm.specialties 
        ? doctorForm.specialties.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const { error } = await supabase
        .from("doctors")
        .insert({
          name: doctorForm.name,
          degree: doctorForm.degree,
          experience: doctorForm.experience,
          designation: doctorForm.designation,
          specialties: specialtiesArray,
          username: doctorForm.username,
          password_hash: doctorForm.password, // Store plain password as requested
          is_active: true
        });

      if (error) {
        if (error.message.includes("duplicate key")) {
          toast({
            title: "Error",
            description: "Username already exists. Please choose a different username.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add doctor",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Doctor added successfully"
      });

      setShowAddForm(false);
      resetForm();
      fetchDoctors();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      name: doctor.name,
      degree: doctor.degree,
      experience: doctor.experience,
      designation: doctor.designation || "",
      specialties: doctor.specialties ? doctor.specialties.join(", ") : "",
      username: doctor.username,
      password: ""
    });
  };

  const handleUpdateDoctor = async () => {
    if (!editingDoctor) return;

    try {
      const specialtiesArray = doctorForm.specialties 
        ? doctorForm.specialties.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const updateData: any = {
        name: doctorForm.name,
        degree: doctorForm.degree,
        experience: doctorForm.experience,
        designation: doctorForm.designation,
        specialties: specialtiesArray,
        username: doctorForm.username
      };

      // Only update password if provided
      if (doctorForm.password) {
        updateData.password_hash = doctorForm.password;
      }

      const { error } = await supabase
        .from("doctors")
        .update(updateData)
        .eq("id", editingDoctor.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update doctor",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Doctor updated successfully"
      });

      setEditingDoctor(null);
      resetForm();
      fetchDoctors();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (doctorId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ is_active: !isActive })
        .eq("id", doctorId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update doctor status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Doctor ${!isActive ? 'activated' : 'deactivated'} successfully`
      });

      fetchDoctors();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      // Delete related data first
      await supabase.from("prescriptions").delete().eq("doctor_id", doctorId);
      await supabase.from("appointments").delete().eq("doctor_id", doctorId);
      await supabase.from("doctor_schedules").delete().eq("doctor_id", doctorId);

      // Delete doctor
      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", doctorId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete doctor",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Doctor deleted successfully"
      });

      fetchDoctors();
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

  if (loading) {
    return <div className="text-center py-8">Loading doctors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Doctor Management</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Doctors ({doctors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No doctors found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>{doctor.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded max-w-20 truncate">
                          {doctor.password_hash}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(doctor.password_hash)}
                        >
                          Copy
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{doctor.degree}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {doctor.specialties?.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {doctor.specialties?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{doctor.specialties.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doctor.is_active ? "default" : "destructive"}>
                        {doctor.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(doctor.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDoctor(doctor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={doctor.is_active ? "secondary" : "default"}
                          onClick={() => handleToggleActive(doctor.id, doctor.is_active)}
                        >
                          {doctor.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete Dr. {doctor.name}? This will also delete all their schedules, appointments, and prescriptions. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDoctor(doctor.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Doctor Dialog */}
      <Dialog open={showAddForm || !!editingDoctor} onOpenChange={() => {
        setShowAddForm(false);
        setEditingDoctor(null);
        resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? `Edit Doctor - ${editingDoctor.name}` : "Add New Doctor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="doctor-name">Name *</Label>
              <Input
                id="doctor-name"
                value={doctorForm.name}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Dr. Full Name"
              />
            </div>

            <div>
              <Label htmlFor="doctor-degree">Degree *</Label>
              <Input
                id="doctor-degree"
                value={doctorForm.degree}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, degree: e.target.value }))}
                placeholder="MBBS, FCPS, etc."
              />
            </div>

            <div>
              <Label htmlFor="doctor-designation">Designation</Label>
              <Input
                id="doctor-designation"
                value={doctorForm.designation}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, designation: e.target.value }))}
                placeholder="Consultant, Senior Consultant, etc."
              />
            </div>

            <div>
              <Label htmlFor="doctor-experience">Experience</Label>
              <Textarea
                id="doctor-experience"
                value={doctorForm.experience}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Years of experience, previous positions, etc."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="doctor-specialties">Specialties</Label>
              <Input
                id="doctor-specialties"
                value={doctorForm.specialties}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, specialties: e.target.value }))}
                placeholder="Cardiology, Neurology, etc. (comma separated)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctor-username">Username *</Label>
                <Input
                  id="doctor-username"
                  value={doctorForm.username}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="dr_username"
                />
              </div>
              <div>
                <Label htmlFor="doctor-password">
                  Password {editingDoctor ? "(leave empty to keep current)" : "*"}
                </Label>
                <Input
                  id="doctor-password"
                  type="password"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Password for doctor login"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingDoctor ? handleUpdateDoctor : handleAddDoctor}
                className="flex-1"
              >
                {editingDoctor ? "Update Doctor" : "Add Doctor"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDoctor(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};