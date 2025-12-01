import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Search, ExternalLink, User, Calendar, Award, Filter } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function VoiceCertificationPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["voice-certifications-admin", statusFilter, dateFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("voice_blockchain_certificates")
        .select(`
          *,
          creator_voice_profiles(
            id,
            voice_name,
            user_id,
            is_verified
          )
        `)
        .order("created_at", { ascending: false });

      // Status filter
      if (statusFilter !== "all") {
        query = query.eq("certification_status", statusFilter);
      }

      // Date filter
      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte("created_at", today.toISOString());
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("created_at", weekAgo.toISOString());
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte("created_at", monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Client-side search filtering
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return data?.filter(
          (cert: any) =>
            cert.token_id.toLowerCase().includes(lowerQuery) ||
            cert.voice_fingerprint_hash.toLowerCase().includes(lowerQuery) ||
            cert.creator_voice_profiles?.voice_name?.toLowerCase().includes(lowerQuery)
        );
      }

      return data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      verified: { variant: "default", className: "bg-green-500/10 text-green-600 border-green-200" },
      pending: { variant: "secondary", className: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
      failed: { variant: "destructive", className: "bg-red-500/10 text-red-600 border-red-200" },
    };

    const config = variants[status] || variants.verified;
    return (
      <Badge variant="outline" className={config.className}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Voice Certification Records
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive view of all voice blockchain certificates
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Token ID, hash, or creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voice Certificates</CardTitle>
              <CardDescription>
                {certificates?.length || 0} certificate{certificates?.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading certificates...</p>
            </div>
          ) : !certificates || certificates.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Certificates Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Voice certificates will appear here once creators verify their voice"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Token ID</TableHead>
                    <TableHead>Voice Hash</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert: any) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {cert.creator_voice_profiles?.voice_name || "Unknown"}
                          </span>
                          {cert.creator_voice_profiles?.is_verified && (
                            <Badge variant="outline" className="w-fit text-xs mt-1">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {cert.token_id.substring(0, 12)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {cert.voice_fingerprint_hash.substring(0, 16)}...
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(cert.certification_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(cert.created_at), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cert.transaction_hash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = cert.cert_explorer_url || 
                                  `https://polygonscan.com/tx/${cert.transaction_hash}`;
                                window.open(url, "_blank");
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {cert.creator_voice_profiles?.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/creators/${cert.creator_voice_profiles.user_id}`)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/certificate/voice/${cert.id}`)}
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
