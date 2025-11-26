import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Search, Mail, Shield, UserCog, Calendar, Award, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminCreators = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch all creator users (users who are not admins)
  const { data: creators, isLoading } = useQuery({
    queryKey: ["admin-creators", roleFilter],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles for all users
      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get credits for all users
      const { data: allCredits, error: creditsError } = await supabase
        .from("user_credits")
        .select("user_id, balance");

      if (creditsError) throw creditsError;

      // Get subscriptions for all users
      const { data: allSubscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("user_id, plan_name, status");

      if (subsError) throw subsError;

      // Combine the data
      const combinedData = profiles?.map((profile) => {
        const userRoles = allRoles?.filter((r) => r.user_id === profile.id) || [];
        const userCredits = allCredits?.find((c) => c.user_id === profile.id);
        const userSub = allSubscriptions?.find((s) => s.user_id === profile.id);

        return {
          ...profile,
          user_roles: userRoles,
          user_credits: userCredits,
          subscriptions: userSub,
        };
      });

      // Filter out admin users and apply role filter
      const filteredCreators = combinedData?.filter((profile) => {
        const roles = profile.user_roles?.map((r: any) => r.role) || [];
        const isAdmin = roles.includes("admin") || roles.includes("super_admin");
        
        if (isAdmin) return false;
        
        if (roleFilter === "all") return true;
        if (roleFilter === "podcaster") return roles.includes("podcaster");
        if (roleFilter === "event_creator") return roles.includes("event_creator");
        if (roleFilter === "influencer") return roles.includes("influencer");
        
        return true;
      });

      return filteredCreators || [];
    },
  });

  // Fetch creator stats
  const { data: stats } = useQuery({
    queryKey: ["creator-stats"],
    queryFn: async () => {
      const { count: totalCreators } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: activePodcasters } = await supabase
        .from("podcasts")
        .select("*", { count: "exact", head: true });

      const { count: activeEvents } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("event_date", new Date().toISOString());

      const { count: totalMeetings } = await supabase
        .from("meetings")
        .select("*", { count: "exact", head: true });

      return {
        totalCreators: totalCreators || 0,
        activePodcasters: activePodcasters || 0,
        activeEvents: activeEvents || 0,
        totalMeetings: totalMeetings || 0,
      };
    },
  });

  // Search and filter creators
  const filteredCreators = creators?.filter((creator) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      creator.full_name?.toLowerCase().includes(searchLower) ||
      creator.username?.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  const getRoleBadges = (roles: any[]) => {
    if (!roles || roles.length === 0) return <Badge variant="secondary">Member</Badge>;

    return roles.map((roleObj: any, index: number) => (
      <Badge key={index} variant="secondary" className="mr-1">
        {roleObj.role}
      </Badge>
    ));
  };

  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription) {
      return <Badge variant="outline">Free</Badge>;
    }

    const variants: any = {
      free: "outline",
      basic: "secondary",
      pro: "default",
      enterprise: "default",
    };

    return (
      <Badge variant={variants[subscription.plan_name] || "outline"} className="capitalize">
        {subscription.plan_name}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading creators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Creators Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor all creator accounts on the platform
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCreators || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Podcasters</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePodcasters || 0}</div>
            <p className="text-xs text-muted-foreground">With podcasts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeEvents || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground">Meetings booked</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Directory</CardTitle>
          <CardDescription>Search and filter creator accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Creators</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  <SelectItem value="podcaster">Podcasters</SelectItem>
                  <SelectItem value="event_creator">Event Creators</SelectItem>
                  <SelectItem value="influencer">Influencers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creators Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Creators ({filteredCreators?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreators && filteredCreators.length > 0 ? (
                  filteredCreators.map((creator) => (
                    <TableRow key={creator.id}>
                      <TableCell className="font-medium">
                        {creator.full_name || "No name"}
                      </TableCell>
                      <TableCell>{creator.username || "—"}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>{getRoleBadges(creator.user_roles)}</TableCell>
                      <TableCell>{getSubscriptionBadge(creator.subscriptions)}</TableCell>
                      <TableCell>
                        {creator.user_credits?.balance || 0} credits
                      </TableCell>
                      <TableCell>
                        {creator.created_at
                          ? new Date(creator.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No creators found matching your search" : "No creators yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCreators;
