import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Users, UserPlus, Mail, Copy, Check, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TruckingPageWrapper } from "@/components/trucking/TruckingPageWrapper";

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  agency_name?: string;
}

interface Agency {
  id: string;
  name: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  agency_name?: string;
}

export default function TruckingAdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  const [inviteForm, setInviteForm] = useState({
    email: "",
    agency_id: "",
    role: "admin",
  });

  useEffect(() => {
    fetchUsers();
    fetchAgencies();
    fetchPendingInvites();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("trucking_admin_users")
        .select(`
          *,
          trucking_agencies(name)
        `)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const formattedUsers = (data || []).map((u: any) => ({
        ...u,
        agency_name: u.trucking_agencies?.name
      }));
      
      setUsers(formattedUsers);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from("trucking_agencies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setAgencies(data || []);
    } catch (error: any) {
      console.error("Error fetching agencies:", error);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const { data, error } = await supabase
        .from("trucking_user_invites")
        .select(`
          *,
          trucking_agencies(name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedInvites = (data || []).map((i: any) => ({
        ...i,
        agency_name: i.trucking_agencies?.name
      }));
      
      setPendingInvites(formattedInvites);
    } catch (error: any) {
      console.error("Error fetching pending invites:", error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteForm.email) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create invite record
      const { data: invite, error } = await supabase
        .from("trucking_user_invites")
        .insert({
          email: inviteForm.email,
          agency_id: inviteForm.agency_id || null,
          role: inviteForm.role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate invite link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/trucking/signup?invite=${invite.invite_token}`;
      setInviteLink(link);

      toast({ 
        title: "Invite created!", 
        description: "Share the link with the user to complete their signup." 
      });

      // Reset form but keep dialog open to show link
      setInviteForm({ email: "", agency_id: "", role: "admin" });
      fetchPendingInvites();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("trucking_user_invites")
        .update({ status: "revoked" })
        .eq("id", inviteId);

      if (error) throw error;
      toast({ title: "Invite revoked" });
      fetchPendingInvites();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("trucking_admin_users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
      toast({ title: "Role updated" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const copyToClipboard = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setInviteLink(null);
    setInviteForm({ email: "", agency_id: "", role: "admin" });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-500/10 text-purple-600">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500/10 text-blue-600">Admin</Badge>;
      case 'agent':
        return <Badge className="bg-green-500/10 text-green-600">Agent</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <TruckingPageWrapper
      title="Admin Users"
      description="Users with administrative access to AITrucking"
      action={
        <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : closeDialog()}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: '#FF9F1C' }} className="text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation link to add a new admin user to AITrucking.
              </DialogDescription>
            </DialogHeader>
            
            {inviteLink ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700">Invite created successfully!</span>
                </div>
                <div className="space-y-2">
                  <Label>Share this link with the user:</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="text-xs" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={closeDialog} className="w-full">Done</Button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency">Agency</Label>
                  <Select
                    value={inviteForm.agency_id}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, agency_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleSendInvite} 
                  disabled={sending || !inviteForm.email}
                  className="w-full"
                  style={{ backgroundColor: '#FF9F1C' }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {sending ? "Creating..." : "Create Invite Link"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Invites ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{invite.agency_name || '—'}</TableCell>
                    <TableCell>{getRoleBadge(invite.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invite.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invite.expires_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Administrators ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No admin users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                            {getInitials(user.full_name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name || 'Admin'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{user.agency_name || '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleChangeRole(user.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TruckingPageWrapper>
  );
}
