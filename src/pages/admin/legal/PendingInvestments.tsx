import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Eye, Clock, CheckCircle, XCircle, RefreshCw, Settings, Plus, X } from "lucide-react";
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

interface PendingInvestment {
  id: string;
  status: string;
  purchaser_email: string;
  recipient_name: string;
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
  price_per_share: number;
  allowed_emails: string[];
  is_active: boolean;
  confidentiality_notice: string;
}

export default function PendingInvestments() {
  const [investments, setInvestments] = useState<PendingInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState<PendingInvestment | null>(null);
  const [sendingSignature, setSendingSignature] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [activeTab, setActiveTab] = useState("applications");
  
  // Settings state
  const [settings, setSettings] = useState<InvestorSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  
  // Admin signature info
  const [sellerEmail, setSellerEmail] = useState("");
  const [chairmanName, setChairmanName] = useState("");
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
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          price_per_share: Number(data.price_per_share),
          allowed_emails: data.allowed_emails || [],
          is_active: data.is_active ?? true,
          confidentiality_notice: data.confidentiality_notice || "",
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to load settings");
    }
  };

  useEffect(() => {
    fetchInvestments();
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from("investor_application_settings")
        .update({
          price_per_share: settings.price_per_share,
          allowed_emails: settings.allowed_emails,
          is_active: settings.is_active,
          confidentiality_notice: settings.confidentiality_notice,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
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
    setSettings(prev => prev ? {
      ...prev,
      allowed_emails: [...prev.allowed_emails, email]
    } : null);
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    setSettings(prev => prev ? {
      ...prev,
      allowed_emails: prev.allowed_emails.filter(e => e !== email)
    } : null);
  };

  const getStatusBadge = (status: string, signwellStatus?: string) => {
    if (signwellStatus === "sent" || status === "pending_signatures") {
      return <Badge variant="secondary"><Send className="h-3 w-3 mr-1" /> Awaiting Signatures</Badge>;
    }
    if (signwellStatus === "partially_signed") {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Partially Signed</Badge>;
    }
    if (status === "completed") {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
    }
    if (status === "declined") {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Declined</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pending Review</Badge>;
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

      // Generate the document
      const { data: docData, error: docError } = await supabase.functions.invoke(
        "generate-stock-agreement-docx",
        {
          body: {
            purchaserName,
            purchaserAddress,
            numberOfShares,
            pricePerShare,
            agreementDate: new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
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
                name: "Seeksy, Inc.",
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
                <CardTitle>Pending Investments</CardTitle>
                <CardDescription>
                  Review and approve investor applications for stock purchase
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchInvestments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {investments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending investment applications
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((inv) => (
                      <TableRow key={inv.id}>
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
                          {inv.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(inv)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Approve & Send
                            </Button>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Configure price per share, allowed emails, and disclosure notice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, is_active: checked } : null)}
                />
              </div>

              {/* Price Per Share */}
              <div className="space-y-2">
                <Label htmlFor="pps">Price Per Share ($)</Label>
                <Input
                  id="pps"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings?.price_per_share || ""}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, price_per_share: parseFloat(e.target.value) || 0 } : null)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed to investors on the application form
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
                  onChange={(e) => setSettings(prev => prev ? { ...prev, confidentiality_notice: e.target.value } : null)}
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

              {/* Signature Party Emails */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="sellerEmail">Seller Email (Seeksy, Inc.) *</Label>
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
    </div>
  );
}