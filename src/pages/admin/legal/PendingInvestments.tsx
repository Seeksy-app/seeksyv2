import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Eye, Clock, CheckCircle, XCircle, RefreshCw, Settings, Plus, X, Activity, FileText, Copy, Share2, FileX, Trash2, CopyPlus } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import TemplateLibrary from "@/components/admin/legal/TemplateLibrary";
import TemplateSelector from "@/components/admin/legal/TemplateSelector";

interface PendingInvestment {
  id: string;
  status: string;
  purchaser_email: string;
  recipient_name: string;
  template_id: string;
  field_values_json: {
    purchaser_name?: string;
    purchaser_email?: string;
    purchaser_street?: string;
    purchaser_city?: string;
    purchaser_state?: string;
    purchaser_zip?: string;
    purchaser_address?: string;
    numberOfShares?: string;
    pricePerShare?: string;
    investor_certification?: string;
  };
  computed_values_json: {
    totalAmount?: string | number;
    numberOfShares?: number;
    pricePerShare?: number;
  };
  created_at: string;
  signwell_status?: string;
}

interface InvestorSettings {
  id: string;
  name: string;
  slug: string | null;
  price_per_share: number;
  price_per_share_tier2: number | null;
  tier2_start_date: string | null;
  allowed_emails: string[];
  is_active: boolean;
  confidentiality_notice: string;
  minimum_investment: number;
}

interface AccessLog {
  id: string;
  email: string;
  accessed_at: string;
  user_agent: string | null;
}

interface AccessSummary {
  email: string;
  access_count: number;
  last_accessed: string;
}

export default function PendingInvestments() {
  const [investments, setInvestments] = useState<PendingInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState<PendingInvestment | null>(null);
  const [sendingSignature, setSendingSignature] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [activeTab, setActiveTab] = useState("applications");
  
  // Settings state
  const [allSettings, setAllSettings] = useState<InvestorSettings[]>([]);
  const [selectedSettingsId, setSelectedSettingsId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  
  const settings = allSettings.find(s => s.id === selectedSettingsId) || null;
  
  // Activity log state
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [accessSummary, setAccessSummary] = useState<AccessSummary[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Admin signature info
  const [sellerName, setSellerName] = useState("Seeksy, Inc.");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [chairmanName, setChairmanName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [chairmanEmail, setChairmanEmail] = useState("");

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("legal_doc_instances")
        .select("*")
        .eq("document_type", "stock_purchase_agreement")
        .in("status", ["pending", "pending_signatures", "partially_signed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvestments((data as PendingInvestment[]) || []);
    } catch (err) {
      console.error("Error fetching investments:", err);
      toast.error("Failed to load pending investments");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("investor_application_settings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((d: any) => ({
        id: d.id,
        name: d.name || "Default Application",
        slug: d.slug,
        price_per_share: Number(d.price_per_share),
        price_per_share_tier2: d.price_per_share_tier2 ? Number(d.price_per_share_tier2) : null,
        tier2_start_date: d.tier2_start_date || null,
        allowed_emails: d.allowed_emails || [],
        is_active: d.is_active ?? true,
        confidentiality_notice: d.confidentiality_notice || "",
        minimum_investment: Number(d.minimum_investment) || 100,
      }));
      setAllSettings(mapped);
      if (mapped.length > 0 && !selectedSettingsId) {
        setSelectedSettingsId(mapped[0].id);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to load settings");
    }
  };

  const fetchAccessLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("investor_application_access_logs")
        .select("*")
        .order("accessed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAccessLogs((data as AccessLog[]) || []);
      
      // Calculate summary by email
      const summary: Record<string, AccessSummary> = {};
      (data || []).forEach((log: AccessLog) => {
        if (!summary[log.email]) {
          summary[log.email] = {
            email: log.email,
            access_count: 0,
            last_accessed: log.accessed_at,
          };
        }
        summary[log.email].access_count++;
      });
      setAccessSummary(Object.values(summary).sort((a, b) => b.access_count - a.access_count));
    } catch (err) {
      console.error("Error fetching access logs:", err);
      toast.error("Failed to load access logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
    fetchSettings();
    fetchAccessLogs();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const slug = settings.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { error } = await supabase
        .from("investor_application_settings")
        .update({
          name: settings.name,
          slug: slug,
          price_per_share: settings.price_per_share,
          price_per_share_tier2: settings.price_per_share_tier2,
          tier2_start_date: settings.tier2_start_date,
          allowed_emails: settings.allowed_emails,
          is_active: settings.is_active,
          confidentiality_notice: settings.confidentiality_notice,
          minimum_investment: settings.minimum_investment,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved");
      fetchSettings();
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const createNewApplication = async () => {
    if (!newAppName.trim()) {
      toast.error("Please enter an application name");
      return;
    }
    try {
      const slug = newAppName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { data, error } = await supabase
        .from("investor_application_settings")
        .insert({
          name: newAppName.trim(),
          slug: slug,
          price_per_share: 0.20,
          is_active: false,
          allowed_emails: [],
          minimum_investment: 100,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Application created");
      setShowCreateModal(false);
      setNewAppName("");
      await fetchSettings();
      if (data) setSelectedSettingsId(data.id);
      // Switch to Applications tab after creating
      setActiveTab("applications");
    } catch (err: any) {
      console.error("Error creating application:", err);
      toast.error(err.message || "Failed to create application");
    }
  };

  const deleteApplication = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to delete "${appName}"? This cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from("investor_application_settings")
        .delete()
        .eq("id", appId);
      if (error) throw error;
      toast.success("Application deleted");
      await fetchSettings();
      // If we deleted the selected one, reset selection
      if (selectedSettingsId === appId) {
        setSelectedSettingsId(allSettings.find(s => s.id !== appId)?.id || null);
      }
    } catch (err: any) {
      console.error("Error deleting application:", err);
      toast.error(err.message || "Failed to delete application");
    }
  };

  const updateSettings = (updates: Partial<InvestorSettings>) => {
    setAllSettings(prev => prev.map(s => 
      s.id === selectedSettingsId ? { ...s, ...updates } : s
    ));
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (settings?.allowed_emails.includes(email)) {
      toast.error("Email already in list");
      return;
    }
    updateSettings({ allowed_emails: [...(settings?.allowed_emails || []), email] });
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    updateSettings({ allowed_emails: settings?.allowed_emails.filter(e => e !== email) || [] });
  };

  const getStatusBadge = (status: string, signwellStatus?: string) => {
    if (signwellStatus === "sent" || status === "pending_signatures") {
      return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
    }
    if (signwellStatus === "partially_signed") {
      return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
    }
    if (status === "completed") {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
    }
    if (status === "declined") {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Declined</Badge>;
    }
    // Pending status = Editable
    return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
  };

  const handleCopyLink = (investment: PendingInvestment) => {
    const link = `${window.location.origin}/invest/view/${investment.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const handleDelete = async (investment: PendingInvestment) => {
    // Only allow deletion of pending investments
    if (investment.status !== "pending") {
      toast.error("Only pending applications can be deleted. This application has already been shared.");
      return;
    }
    if (!confirm(`Are you sure you want to delete the application for ${investment.recipient_name || investment.field_values_json.purchaser_name}? This cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from("legal_doc_instances")
        .delete()
        .eq("id", investment.id);
      if (error) throw error;
      toast.success("Application deleted");
      fetchInvestments();
    } catch (err: any) {
      console.error("Error deleting application:", err);
      toast.error(err.message || "Failed to delete application");
    }
  };

  const handleClone = async (investment: PendingInvestment) => {
    try {
      const insertData: any = {
        document_type: "stock_purchase_agreement",
        status: "pending",
        purchaser_email: investment.purchaser_email,
        recipient_name: investment.recipient_name,
        field_values_json: investment.field_values_json,
        computed_values_json: investment.computed_values_json,
        template_id: investment.template_id,
      };
      const { error } = await supabase
        .from("legal_doc_instances")
        .insert(insertData);
      if (error) throw error;
      toast.success("Application cloned");
      fetchInvestments();
    } catch (err: any) {
      console.error("Error cloning application:", err);
      toast.error(err.message || "Failed to clone application");
    }
  };

  const handleApprove = (investment: PendingInvestment) => {
    setSelectedInvestment(investment);
    setShowApproveModal(true);
  };

  const handleSendForSignature = async () => {
    if (!selectedInvestment) return;
    if (!sellerEmail || !chairmanEmail) {
      toast.error("Please enter seller and chairman email addresses");
      return;
    }

    setSendingSignature(true);
    try {
      const fieldValues = selectedInvestment.field_values_json;
      const computedValues = selectedInvestment.computed_values_json;
      
      const purchaserName = fieldValues.purchaser_name || selectedInvestment.recipient_name;
      const purchaserEmail = fieldValues.purchaser_email || selectedInvestment.purchaser_email;
      const purchaserAddress = fieldValues.purchaser_address || 
        `${fieldValues.purchaser_street}, ${fieldValues.purchaser_city}, ${fieldValues.purchaser_state} ${fieldValues.purchaser_zip}`;
      const numberOfShares = computedValues.numberOfShares || parseInt(fieldValues.numberOfShares || "0");
      const pricePerShare = computedValues.pricePerShare || parseFloat(fieldValues.pricePerShare || "0.20");

      // Generate the document using template
      const { data: docData, error: docError } = await supabase.functions.invoke(
        "generate-from-template",
        {
          body: {
            templateName: selectedTemplate || "stock-purchase-agreement.docx",
            purchaserName,
            purchaserAddress,
            purchaserEmail,
            sellerName: sellerName || "Seeksy, Inc.",
            sellerAddress: sellerAddress || "",
            sellerEmail,
            chairmanName: chairmanName || "Chairman",
            chairmanTitle: "Chairman of the Board",
            companyName: "Seeksy, Inc.",
            numberOfShares,
            pricePerShare,
            agreementDate: new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            investorCertification: fieldValues.investor_certification || "",
          },
        }
      );

      if (docError) throw docError;
      if (!docData?.document) throw new Error("No document generated");

      // Update status to pending_signatures
      await supabase
        .from("legal_doc_instances")
        .update({ status: "pending_signatures" })
        .eq("id", selectedInvestment.id);

      // Send to SignWell
      const { data: signWellResult, error: signWellError } = await supabase.functions.invoke(
        "signwell-send-document",
        {
          body: {
            documentBase64: docData.document,
            documentName: `Stock_Purchase_Agreement_${purchaserName.replace(/\s+/g, "_")}.docx`,
            instanceId: selectedInvestment.id,
            subject: `Stock Purchase Agreement - ${purchaserName}`,
            message: `Please review and sign the Stock Purchase Agreement for ${numberOfShares} shares at $${pricePerShare.toFixed(2)} per share (Total: $${computedValues.totalAmount}).`,
            recipients: [
              {
                id: "seller",
                email: sellerEmail,
                name: sellerName || "Seeksy, Inc.",
                role: "Seller",
              },
              {
                id: "purchaser",
                email: purchaserEmail,
                name: purchaserName,
                role: "Purchaser",
              },
              {
                id: "chairman",
                email: chairmanEmail,
                name: chairmanName || "Chairman",
                role: "Chairman of the Board",
              },
            ],
            sellerName: sellerName || "Seeksy, Inc.",
            sellerEmail,
          },
        }
      );

      if (signWellError) throw signWellError;
      if (signWellResult?.error) throw new Error(signWellResult.error);

      // Update with SignWell ID
      await supabase
        .from("legal_doc_instances")
        .update({
          signwell_document_id: signWellResult.documentId,
          signwell_status: "sent",
        })
        .eq("id", selectedInvestment.id);

      toast.success("Agreement sent for e-signature!");
      setShowApproveModal(false);
      setSelectedInvestment(null);
      fetchInvestments();
    } catch (err: any) {
      console.error("Error sending for signature:", err);
      toast.error(err.message || "Failed to send for signature");
    } finally {
      setSendingSignature(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Investment Applications</h1>
            <p className="text-muted-foreground">Manage investor applications and settings</p>
          </div>
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="template">
              <FileText className="h-4 w-4 mr-2" />
              Template
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="applications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Investment Applications</CardTitle>
                <CardDescription>
                  Manage investment offerings and investor submissions
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { fetchInvestments(); fetchSettings(); }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Application
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allSettings.length === 0 && investments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No investment applications. Create one to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Show application settings as "Ready to Share" */}
                    {allSettings.map((app) => (
                      <TableRow key={`setting-${app.id}`} className="bg-muted/30">
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.name}</p>
                            <p className="text-xs text-muted-foreground">/invest/apply/{app.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell>${app.price_per_share.toFixed(2)}/share</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <FileText className="h-3 w-3 mr-1" /> Ready to Share
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/invest/apply/${app.slug}`);
                                toast.success("Link copied to clipboard");
                              }}
                              title="Copy application link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedSettingsId(app.id);
                                setActiveTab("settings");
                              }}
                              title="Edit settings"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteApplication(app.id, app.name)}
                              title="Delete application"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Show investor submissions */}
                    {investments.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inv.recipient_name || inv.field_values_json.purchaser_name}</p>
                            <p className="text-sm text-muted-foreground">{inv.purchaser_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(inv.computed_values_json.numberOfShares || parseInt(inv.field_values_json.numberOfShares || "0")).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ${parseFloat(String(inv.computed_values_json.totalAmount) || "0").toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(inv.status, inv.signwell_status)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(inv.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleClone(inv)}
                              title="Clone application"
                            >
                              <CopyPlus className="h-4 w-4" />
                            </Button>
                            {inv.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyLink(inv)}
                                  title="Copy link"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(inv)}
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </Button>
                              </>
                            )}
                            {inv.status !== "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedInvestment(inv)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            )}
                            {inv.status === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(inv)}
                                title="Delete application"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template">
          <TemplateLibrary />
        </TabsContent>

        <TabsContent value="activity">
          <div className="space-y-6">
            {/* Access Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Access Summary</CardTitle>
                  <CardDescription>
                    Number of times each email accessed the application link
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAccessLogs} disabled={loadingLogs}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : accessSummary.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No access logs yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Access Count</TableHead>
                        <TableHead>Last Accessed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessSummary.map((item) => (
                        <TableRow key={item.email}>
                          <TableCell className="font-medium">{item.email}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item.access_count}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.last_accessed), "MMM d, yyyy h:mm a")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Recent Access Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Access Log</CardTitle>
                <CardDescription>
                  Individual access events (last 100)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No access logs yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Accessed At</TableHead>
                        <TableHead>Browser</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.email}</TableCell>
                          <TableCell>
                            {format(new Date(log.accessed_at), "MMM d, yyyy h:mm a")}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                            {log.user_agent?.split(' ').slice(0, 3).join(' ') || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure price per share, allowed emails, and disclosure notice
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Application Selector */}
              {allSettings.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Application</Label>
                  <div className="flex flex-wrap gap-2">
                    {allSettings.map((app) => (
                      <div key={app.id} className="flex items-center gap-1">
                        <Button
                          variant={selectedSettingsId === app.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSettingsId(app.id)}
                        >
                          {app.name}
                          {app.is_active && <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteApplication(app.id, app.name)}
                          title="Delete application"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {settings?.slug && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Link: <code className="bg-muted px-1 rounded">/invest/apply/{settings.slug}</code>
                    </p>
                  )}
                </div>
              )}

              {/* Application Name */}
              {settings && (
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={settings.name}
                    onChange={(e) => updateSettings({ name: e.target.value })}
                    placeholder="e.g., Series A Round"
                    className="max-w-sm"
                  />
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Accept Applications</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable the application form
                  </p>
                </div>
                <Switch
                  checked={settings?.is_active ?? true}
                  onCheckedChange={(checked) => updateSettings({ is_active: checked })}
                />
              </div>

              {/* Price Per Share - Tier 1 */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Price Per Share</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure tiered pricing based on purchase date
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pps">Current PPS ($)</Label>
                    <Input
                      id="pps"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={settings?.price_per_share || ""}
                      onChange={(e) => updateSettings({ price_per_share: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Active price shown to investors
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pps2">Future PPS ($)</Label>
                    <Input
                      id="pps2"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={settings?.price_per_share_tier2 || ""}
                      onChange={(e) => updateSettings({ price_per_share_tier2: parseFloat(e.target.value) || null })}
                      placeholder="Optional"
                    />
                    <p className="text-xs text-muted-foreground">
                      Price after tier date
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tier2Date">Tier 2 Start Date</Label>
                  <Input
                    id="tier2Date"
                    type="date"
                    value={settings?.tier2_start_date || ""}
                    onChange={(e) => updateSettings({ tier2_start_date: e.target.value || null })}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    On this date, the Future PPS becomes active
                  </p>
                </div>
              </div>

              {/* Minimum Investment */}
              <div className="space-y-2">
                <Label htmlFor="minInvestment">Minimum Investment ($)</Label>
                <Input
                  id="minInvestment"
                  type="number"
                  step="1"
                  min="1"
                  value={settings?.minimum_investment || ""}
                  onChange={(e) => updateSettings({ minimum_investment: parseFloat(e.target.value) || 0 })}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Investors must invest at least this amount
                </p>
              </div>

              {/* Allowed Emails */}
              <div className="space-y-3">
                <div>
                  <Label>Allowed Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Only these emails can access the application. Leave empty to allow anyone.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="investor@example.com"
                    className="max-w-sm"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                  />
                  <Button type="button" variant="outline" onClick={addEmail}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {settings?.allowed_emails && settings.allowed_emails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.allowed_emails.map((email) => (
                      <Badge key={email} variant="secondary" className="pl-3 pr-1 py-1">
                        {email}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 ml-2 hover:bg-destructive/20"
                          onClick={() => removeEmail(email)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Confidentiality Notice */}
              <div className="space-y-2">
                <Label htmlFor="notice">Confidentiality Notice</Label>
                <Textarea
                  id="notice"
                  value={settings?.confidentiality_notice || ""}
                  onChange={(e) => updateSettings({ confidentiality_notice: e.target.value })}
                  rows={4}
                  placeholder="Enter the confidentiality disclosure text..."
                />
                <p className="text-xs text-muted-foreground">
                  This notice is shown before users can access the application form
                </p>
              </div>

              <Button onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve & Send Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send for E-Signature</DialogTitle>
            <DialogDescription>
              Review the investment details and enter signature party emails
            </DialogDescription>
          </DialogHeader>

          {selectedInvestment && (
            <div className="space-y-4">
              {/* Investment Summary */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Investor:</span>
                  <span className="font-medium">{selectedInvestment.recipient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span>{selectedInvestment.purchaser_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shares:</span>
                  <span className="font-medium">
                    {(selectedInvestment.computed_values_json.numberOfShares || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-semibold">
                    ${parseFloat(String(selectedInvestment.computed_values_json.totalAmount) || "0").toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Template Selection */}
              <TemplateSelector
                value={selectedTemplate}
                onChange={setSelectedTemplate}
                label="Select Document Template"
              />

              {/* Signature Party Emails */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="sellerName">Seller Name *</Label>
                  <Input
                    id="sellerName"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Seeksy, Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerAddress">Seller Address *</Label>
                  <Input
                    id="sellerAddress"
                    value={sellerAddress}
                    onChange={(e) => setSellerAddress(e.target.value)}
                    placeholder="123 Business Ave, City, State 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerEmail">Seller Email *</Label>
                  <Input
                    id="sellerEmail"
                    type="email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    placeholder="ceo@seeksy.io"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chairmanName">Chairman Name</Label>
                  <Input
                    id="chairmanName"
                    value={chairmanName}
                    onChange={(e) => setChairmanName(e.target.value)}
                    placeholder="Paul Mujane"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chairmanEmail">Chairman Email *</Label>
                  <Input
                    id="chairmanEmail"
                    type="email"
                    value={chairmanEmail}
                    onChange={(e) => setChairmanEmail(e.target.value)}
                    placeholder="chairman@seeksy.io"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendForSignature} disabled={sendingSignature}>
              {sendingSignature ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send for Signature
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Application Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Application</DialogTitle>
            <DialogDescription>
              Create a new investment application with its own settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newAppName">Application Name *</Label>
              <Input
                id="newAppName"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="e.g., Series A Round, Friends & Family"
              />
              <p className="text-xs text-muted-foreground">
                This will create a unique link for this application
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={createNewApplication}>
              <Plus className="mr-2 h-4 w-4" />
              Create Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}