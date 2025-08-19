import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2, Edit, UserCheck, UserX, Ban, ShieldCheck, MoreVertical, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  pin: string;
  concern: string;
  phone: string;
  created_at: string;
  is_active?: boolean;
  is_blocked?: boolean;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    concern: ""
  });
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone,
      concern: user.concern
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

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

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editForm.name,
          phone: editForm.phone,
          concern: editForm.concern
        })
        .eq("id", editingUser.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "User updated successfully"
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_blocked: !isBlocked })
        .eq("id", userId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update user status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `User ${!isBlocked ? 'blocked' : 'unblocked'} successfully`
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // First delete related appointments
      await supabase
        .from("appointments")
        .delete()
        .eq("user_id", userId);

      // Then delete related documents
      await supabase
        .from("documents")
        .delete()
        .eq("user_id", userId);

      // Then delete related prescriptions
      await supabase
        .from("prescriptions")
        .delete()
        .eq("user_id", userId);

      // Finally delete the user
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "User deleted successfully"
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handlePasswordReset = (user: User) => {
    setPasswordResetUser(user);
    setNewPassword("");
  };

  const handlePasswordResetSubmit = async () => {
    if (!passwordResetUser || !newPassword) return;

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ password: newPassword })
        .eq("id", passwordResetUser.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to reset password",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Password reset successfully for ${passwordResetUser.name}`
      });

      setPasswordResetUser(null);
      setNewPassword("");
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
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="text-sm text-muted-foreground">
          Total Users: {users.length}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Concern</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.pin}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.concern}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_blocked ? "destructive" : "default"}>
                        {user.is_blocked ? "Blocked" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePasswordReset(user)}>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleBlock(user.id, user.is_blocked || false)}
                          >
                            {user.is_blocked ? (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Unblock User
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Block User
                              </>
                            )}
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.name}? This will also delete all their appointments, documents, and prescriptions. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User - {editingUser?.name}</DialogTitle>
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
                  <SelectValue placeholder="Select concern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OnnoRokom Group">OnnoRokom Group</SelectItem>
                  <SelectItem value="OnnoRokom Projukti Limited">OnnoRokom Projukti Limited</SelectItem>
                  <SelectItem value="Udvash-Unmesh-Uttoron">Udvash-Unmesh-Uttoron</SelectItem>
                  <SelectItem value="OnnoRorkom Electronics Co. Ltd.">OnnoRorkom Electronics Co. Ltd.</SelectItem>
                  <SelectItem value="OnnoRokom Solutions Ltd.">OnnoRokom Solutions Ltd.</SelectItem>
                  <SelectItem value="Pi Labs Bangladesh Ltd.">Pi Labs Bangladesh Ltd.</SelectItem>
                  <SelectItem value="OnnoRokom EdTech Ltd.">OnnoRokom EdTech Ltd.</SelectItem>
                  <SelectItem value="Techshop Bangladesh">Techshop Bangladesh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateUser} className="flex-1">
                Update User
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingUser(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordResetUser} onOpenChange={() => setPasswordResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password - {passwordResetUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePasswordResetSubmit} className="flex-1">
                Reset Password
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPasswordResetUser(null)}
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