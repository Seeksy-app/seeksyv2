import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Download, Mail, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SubscriberLists() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["admin-newsletter-subscribers", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const stats = {
    total: subscribers?.length || 0,
    active: subscribers?.filter(s => s.status === "active").length || 0,
    unsubscribed: subscribers?.filter(s => s.status === "unsubscribed").length || 0,
    thisMonth: subscribers?.filter(s => {
      const date = new Date(s.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length || 0,
  };

  const handleExport = () => {
    if (!subscribers?.length) {
      toast.error("No subscribers to export");
      return;
    }

    const csv = [
      ["Email", "Name", "Status", "Source", "Subscribed At"].join(","),
      ...subscribers.map(s => [
        s.email,
        s.name || "",
        s.status,
        s.source || "",
        s.created_at ? format(new Date(s.created_at), "yyyy-MM-dd HH:mm") : ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported subscribers");
  };

  return (
    <div className="px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Subscriber Lists
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage newsletter and email subscribers
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Subscribers</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Active
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unsubscribed</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{stats.unsubscribed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> This Month
            </CardDescription>
            <CardTitle className="text-2xl text-primary">{stats.thisMonth}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Subscribers</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : subscribers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No subscribers yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers?.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>{subscriber.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={subscriber.status === "active" ? "default" : "secondary"}>
                        {subscriber.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subscriber.source || "direct"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {subscriber.created_at 
                        ? format(new Date(subscriber.created_at), "MMM d, yyyy")
                        : "—"}
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