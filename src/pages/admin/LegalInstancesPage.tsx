import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Eye, Plus, CheckCircle, Clock, Send, FileCheck, Link, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FieldValues {
  purchaser_name?: string;
  purchase_amount?: number;
  number_of_shares?: number;
}

interface ComputedValues {
  price_per_share?: number;
}

export default function LegalInstancesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: instances, isLoading } = useQuery({
    queryKey: ["legal-instances-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_doc_instances")
        .select(`
          *,
          legal_templates (name)
        `)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <Clock className="h-4 w-4" />;
      case "submitted": return <Send className="h-4 w-4" />;
      case "admin_review": return <Eye className="h-4 w-4" />;
      case "finalized": return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "draft": return "secondary";
      case "submitted": return "default";
      case "admin_review": return "outline";
      case "finalized": return "default";
      default: return "secondary";
    }
  };

  const generateInviteToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createInviteMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const token = generateInviteToken();
      const { error } = await supabase
        .from("legal_doc_instances")
        .update({ 
          invite_token: token,
          invite_sent_at: new Date().toISOString(),
          status: "submitted"
        })
        .eq("id", instanceId);
      
      if (error) throw error;
      return token;
    },
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ["legal-instances-admin"] });
      const inviteUrl = `${window.location.origin}/legal/purchaser/${token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied to clipboard!");
    },
    onError: () => {
      toast.error("Failed to generate invite link");
    }
  });

  const copyInviteLink = (token: string, instanceId: string) => {
    const inviteUrl = `${window.location.origin}/legal/purchaser/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(instanceId);
    toast.success("Invite link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Legal Document Instances</h1>
          <p className="text-muted-foreground">Review and manage stock purchase agreements</p>
        </div>
        <Button onClick={() => navigate("/admin/legal/stock-purchase/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Agreement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            All Instances
          </CardTitle>
          <CardDescription>
            {instances?.length || 0} total agreements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : instances?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agreements yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchaser</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Price/Share</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances?.map(instance => {
                  const fv = instance.field_values_json as FieldValues || {};
                  const cv = instance.computed_values_json as ComputedValues || {};
                  
                  return (
                    <TableRow key={instance.id}>
                      <TableCell className="font-medium">
                        {fv.purchaser_name || instance.purchaser_email || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(instance as any).legal_templates?.name || "—"}
                      </TableCell>
                      <TableCell>
                        {cv.price_per_share ? `$${cv.price_per_share.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        {fv.number_of_shares?.toLocaleString() || "—"}
                      </TableCell>
                      <TableCell>
                        {fv.purchase_amount ? `$${fv.purchase_amount.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(instance.status)} className="capitalize">
                          {getStatusIcon(instance.status)}
                          <span className="ml-1">{instance.status.replace("_", " ")}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(instance.updated_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/legal/stock-purchase/${instance.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View/Edit</TooltipContent>
                            </Tooltip>

                            {instance.invite_token ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyInviteLink(instance.invite_token!, instance.id)}
                                  >
                                    {copiedId === instance.id ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy Invite Link</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => createInviteMutation.mutate(instance.id)}
                                    disabled={createInviteMutation.isPending}
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Generate & Copy Invite Link</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
