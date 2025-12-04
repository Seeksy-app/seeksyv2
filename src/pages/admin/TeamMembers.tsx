import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  UserPlus, 
  MoreHorizontal, 
  Mail,
  Shield,
  Loader2,
  RefreshCw,
  UserX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string | null;
  profile?: {
    full_name: string | null;
    email?: string;
  };
}

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full platform access' },
  { value: 'admin', label: 'Admin', description: 'Everything except platform settings' },
  { value: 'cfo', label: 'CFO', description: 'Financials + user list read' },
  { value: 'cmo', label: 'CMO', description: 'Marketing + Revenue Insights' },
  { value: 'cco', label: 'CCO', description: 'Creator + Content Management' },
  { value: 'manager', label: 'Manager', description: 'Help Desk + Billing overview' },
];

export default function TeamMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");

  // Fetch team members with their roles
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin-team-members'],
    queryFn: async () => {
      // Get users with admin roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['super_admin', 'admin', 'cfo', 'cmo', 'cco', 'manager']);

      if (rolesError) throw rolesError;

      // Get profile info for each user
      const userIds = [...new Set(roles.map(r => r.user_id))];
      
      if (userIds.length === 0) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      return roles.map(role => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role,
        joined_at: role.created_at,
        profile: profiles?.find(p => p.id === role.user_id) || { full_name: 'Unknown' }
      }));
    }
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Use the correct column names from team_invitations table
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          invitee_email: email,
          inviter_id: user.id,
          role: role,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invitation sent successfully" });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("manager");
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Error sending invitation", 
        description: err.message,
        variant: "destructive" 
      });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Remove old admin roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', ['super_admin', 'admin', 'cfo', 'cmo', 'cco', 'manager']);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as any });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Error updating role", 
        description: err.message,
        variant: "destructive" 
      });
    }
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', ['super_admin', 'admin', 'cfo', 'cmo', 'cco', 'manager']);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User removed from team" });
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Error removing user", 
        description: err.message,
        variant: "destructive" 
      });
    }
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cfo': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'cmo': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'cco': return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'manager': return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Team Members
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage admin team members and their roles
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Teammate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join the admin team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Assign Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span>{role.label}</span>
                          <span className="text-xs text-muted-foreground">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ADMIN_ROLES.map((role) => (
              <div key={role.value} className="text-center p-3 border rounded-lg">
                <Badge className={getRoleBadgeColor(role.value)}>{role.label}</Badge>
                <p className="text-xs text-muted-foreground mt-2">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Team</CardTitle>
          <CardDescription>
            {members.length} team member{members.length !== 1 ? 's' : ''} with admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm">Invite your first teammate to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{member.user_id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {ADMIN_ROLES.find(r => r.value === member.role)?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.joined_at 
                        ? new Date(member.joined_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ADMIN_ROLES.map((role) => (
                            <DropdownMenuItem
                              key={role.value}
                              onClick={() => updateRoleMutation.mutate({ 
                                userId: member.user_id, 
                                newRole: role.value 
                              })}
                              disabled={member.role === role.value}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Change to {role.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => deactivateMutation.mutate(member.user_id)}
                            className="text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove from team
                          </DropdownMenuItem>
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
    </div>
  );
}
