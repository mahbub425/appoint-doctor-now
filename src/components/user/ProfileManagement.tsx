import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const ProfileManagement = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: userProfile?.name || "",
    phone: userProfile?.phone || "",
    concern: userProfile?.concern || ""
  });

  const handleUpdateProfile = async () => {
    if (!userProfile) return;

    // Validate phone number
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(editForm.phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid 11-digit phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editForm.name,
          phone: editForm.phone,
          concern: editForm.concern
        })
        .eq("id", userProfile.id);

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

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile Management</h2>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-muted-foreground mt-1">{userProfile.name}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">PIN</Label>
              <p className="text-sm text-muted-foreground mt-1">{userProfile.pin}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground mt-1">{userProfile.email}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Phone Number</Label>
              <p className="text-sm text-muted-foreground mt-1">{userProfile.phone}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Concern</Label>
              <p className="text-sm text-muted-foreground mt-1">{userProfile.concern}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(userProfile.created_at).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4">Edit Details</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
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
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter 11-digit phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-concern">Concern</Label>
                  <Select 
                    value={editForm.concern}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, concern: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your concern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPL">OPL</SelectItem>
                      <SelectItem value="OG">OG</SelectItem>
                      <SelectItem value="Udvash">Udvash</SelectItem>
                      <SelectItem value="Rokomari">Rokomari</SelectItem>
                      <SelectItem value="Unmesh">Unmesh</SelectItem>
                      <SelectItem value="Uttoron">Uttoron</SelectItem>
                    </SelectContent>
                  </Select>
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