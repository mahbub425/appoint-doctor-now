import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Trash2, Edit, UserCheck, UserX, Ban, ShieldCheck, MoreVertical, KeyRound, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  pin: string;
  concern: string;
  phone: string;
  created_at: string;
  is_blocked?: boolean;
  user_role: string;
  username?: string; // Re-added username as optional
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    concern: "",
    username: "" // Added username to edit form
  });
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      setFilteredUsers(data || []);
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
      concern: user.concern,
      username: user.username || "" // Populate username if exists
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
          concern: editForm.concern,
          username: editForm.username // Update username
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

  const handleToggleAdmin = async (user: User) => {
    try {
      let rpcError;
      if (user.user_role === 'admin') { // Check user_role
        // Revoke admin access
        const { error } = await supabase.rpc('revoke_admin_access', { target_user_id: user.id });
        rpcError = error;
      } else {
        // Grant admin access
        const { error } = await supabase.rpc('grant_admin_access', { target_user_id: user.id });
        rpcError = error;
      }

      if (rpcError) {
        toast({
          title: "Error",
          description: rpcError.message || "Failed to update admin status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `User role updated successfully`
      });

      fetchUsers(); // Re-fetch users to reflect the change
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

  useEffect(() => {
    const filtered = users.filter(user => 
      user.pin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) // Search by username too
    );
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page on search/filter change
  }, [users, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PIN, Name, or Username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No users found matching your search." : "No users found."}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Username</TableHead> {/* Added Username column */}
                    <TableHead>Phone</TableHead>
                    <TableHead>Concern</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.pin}</TableCell>
                    <TableCell>{user.username || 'N/A'}</TableCell> {/* Display username or N/A */}
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.concern}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_blocked ? "destructive" : "default"}>
                        {user.is_blocked ? "Blocked" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.user_role === 'admin' ? "default" : "secondary"}>
                        {user.user_role === 'admin' ? "Admin" : "User"}
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
                          <DropdownMenuItem 
                            onClick={() => handleToggleAdmin(user)}
                          >
                            {user.user_role === 'admin' ? ( // Check user_role
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Revoke Admin
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Grant Admin
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
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Show:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageNum);
                              }}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </>
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
              <Label htmlFor="edit-username">Username (for Admin role)</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username (optional)"
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