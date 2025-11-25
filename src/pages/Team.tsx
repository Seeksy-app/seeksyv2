import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Mail, Loader2, ArrowLeft, RefreshCw } from "lucide-react";

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type TeamInvitation = {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
};

type AppRole = "member" | "manager" | "scheduler" | "sales";

export default function Team() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadTeamData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadTeamData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await Promise.all([
        loadTeamMembers(user.id),
        loadInvitations(user.id)
      ]);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (userId: string) => {
    // Get the current user's team, create one if it doesn't exist
    let { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!team) {
      // Create team for this user
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", userId)
        .single();

      const teamName = `${profile?.full_name || profile?.username || 'User'}'s Team`;
      
      const { data: newTeam, error: createError } = await supabase
        .from("teams")
        .insert({
          owner_id: userId,
          name: teamName,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add owner as team member
      await supabase
        .from("team_members")
        .insert({
          team_id: newTeam.id,
          user_id: userId,
          role: 'owner',
        });

      team = newTeam;
    }

    // Get team members from team_members table
    const { data: members, error } = await supabase
      .from("team_members")
      .select(`
        id,
        user_id,
        role,
        joined_at
      `)
      .eq("team_id", team.id);

    if (error) throw error;

    // Get profile info for each member
    if (!members || members.length === 0) {
      setTeamMembers([]);
      return;
    }

    const memberIds = members.map(m => m.user_id);
    
    // Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, account_full_name, full_name, username, avatar_url")
      .in("id", memberIds);
    
    const membersWithDetails: TeamMember[] = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      
      return {
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        email: "", // Will be populated if needed
        full_name: profile?.account_full_name || profile?.full_name || profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        created_at: member.joined_at,
      };
    });

    setTeamMembers(membersWithDetails);
  };

  const loadInvitations = async (userId: string) => {
    const { data, error } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("inviter_id", userId)
      .eq("status", "pending")
      .order("invited_at", { ascending: false });

    if (error) {
      console.error("Error loading invitations:", error);
      return;
    }

    setInvitations(data || []);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) {
      toast({
        title: "Required fields",
        description: "Please enter both name and email address",
        variant: "destructive",
      });
      return;
    }

    setInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the current user's team
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!team) throw new Error("Team not found");

      // Use edge function to send invitation
      const { data, error } = await supabase.functions.invoke("send-team-invitation", {
        body: {
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          team_id: team.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `Invited ${inviteName} (${inviteEmail}) to join your team`,
      });

      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
      
      // Reload team data
      loadTeamData();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send team invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitation: TeamInvitation) => {
    setResendingId(invitation.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call edge function to resend invitation
      const { error } = await supabase.functions.invoke("send-team-invitation", {
        body: {
          email: invitation.invitee_email,
          name: invitation.invitee_name,
          role: invitation.role,
          team_id: null, // Will use existing team
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation resent",
        description: `Resent invitation to ${invitation.invitee_email}`,
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      });

      loadTeamData();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Team member has been removed from the team",
      });

      loadTeamData();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-500";
      case "manager":
      case "admin":
        return "bg-blue-500";
      case "scheduler":
        return "bg-green-500";
      case "sales":
        return "bg-purple-500";
      default:
        return "bg-muted";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "accepted":
        return "bg-green-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingCount = invitations.filter(i => i.status === "pending").length;
  const activeCount = teamMembers.length;
  const totalCount = pendingCount + activeCount;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold mb-2">Team Management</h1>
            <p className="text-muted-foreground">
              Invite and manage team members for your creator account
            </p>
          </div>

          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: AppRole) => setInviteRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="scheduler">Scheduler</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={inviting} className="w-full">
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {totalCount} total ({activeCount} active, {pendingCount} pending)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No active team members yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Invite team members to collaborate on your content
                    </p>
                    <Button onClick={() => setShowInviteDialog(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Your First Member
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.full_name || "Member"}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium">
                                    {member.full_name?.[0]?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium">
                                {member.full_name || "Unnamed"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(member.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {member.role !== "owner" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                {invitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
                    <p className="text-muted-foreground">
                      All sent invitations will appear here
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            {invitation.invitee_name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {invitation.invitee_email}
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(invitation.role)}>
                              {invitation.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(invitation.status)}>
                              {invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invitation.invited_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvitation(invitation)}
                                disabled={resendingId === invitation.id}
                              >
                                {resendingId === invitation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}