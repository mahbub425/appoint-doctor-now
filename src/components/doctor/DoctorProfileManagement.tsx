import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const DoctorProfileManagement = () => {
  const { doctorProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: doctorProfile?.name || "",
    degree: doctorProfile?.degree || "",
    experience: doctorProfile?.experience || "",
    designation: doctorProfile?.designation || ""
  });

  const handleUpdateProfile = async () => {
    if (!doctorProfile) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("doctors")
        .update({
          name: editForm.name,
          degree: editForm.degree,
          experience: editForm.experience,
          designation: editForm.designation
        })
        .eq("id", doctorProfile.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!doctorProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile Management</h2>

      <Card>
        <CardHeader>
          <CardTitle>Professional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-muted-foreground mt-1">{doctorProfile.name}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Username</Label>
              <p className="text-sm text-muted-foreground mt-1">{doctorProfile.username}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Degree</Label>
              <p className="text-sm text-muted-foreground mt-1">{doctorProfile.degree}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Experience</Label>
              <p className="text-sm text-muted-foreground mt-1">{doctorProfile.experience}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Designation</Label>
              <p className="text-sm text-muted-foreground mt-1">{doctorProfile.designation}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <p className="text-sm text-muted-foreground mt-1">
                <Badge variant={doctorProfile.is_active ? "default" : "destructive"}>
                  {doctorProfile.is_active ? "Active" : "Inactive"}
                </Badge>
              </p>
            </div>
          </div>

          {doctorProfile.specialties && doctorProfile.specialties.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Specialties</Label>
              <div className="flex flex-wrap gap-2">
                {doctorProfile.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Member Since</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(doctorProfile.created_at).toLocaleDateString('en-GB')}
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4">Edit Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Professional Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-degree">Degree</Label>
                  <Input
                    id="edit-degree"
                    value={editForm.degree}
                    onChange={(e) => setEditForm(prev => ({ ...prev, degree: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-experience">Experience</Label>
                  <Input
                    id="edit-experience"
                    value={editForm.experience}
                    onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-designation">Designation</Label>
                  <Input
                    id="edit-designation"
                    value={editForm.designation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                  />
                </div>

                <Button 
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};