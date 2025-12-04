import { useState } from "react";
import { 
  FileText, 
  Plus, 
  Upload, 
  Copy, 
  Edit2, 
  Trash2, 
  Archive,
  CheckCircle,
  Loader2,
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useAllLeadMagnets,
  useCreateLeadMagnet,
  useUpdateLeadMagnet,
  useToggleLeadMagnetStatus,
  useDeleteLeadMagnet,
  uploadLeadMagnetPdf,
  getLeadMagnetSignedUrl,
  type LeadMagnet,
} from "@/hooks/useLeadMagnets";

const AUDIENCE_ROLES = [
  { value: "podcaster", label: "Podcaster" },
  { value: "influencer", label: "Creator / Influencer" },
  { value: "event_creator", label: "Event Host / Speaker" },
  { value: "business", label: "Business Professional" },
  { value: "advertiser", label: "Brand / Advertiser" },
  { value: "investor", label: "Investor / Analyst" },
  { value: "agency", label: "Agency / Consultant" },
];

interface LeadMagnetFormData {
  title: string;
  description: string;
  slug: string;
  audience_roles: string[];
  bullets: string[];
}

export default function LeadMagnetsAdmin() {
  const { data: leadMagnets, isLoading } = useAllLeadMagnets();
  const createMutation = useCreateLeadMagnet();
  const updateMutation = useUpdateLeadMagnet();
  const toggleMutation = useToggleLeadMagnetStatus();
  const deleteMutation = useDeleteLeadMagnet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadMagnet | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<LeadMagnetFormData>({
    title: "",
    description: "",
    slug: "",
    audience_roles: [],
    bullets: [],
  });
  const [bulletInput, setBulletInput] = useState("");

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      slug: "",
      audience_roles: [],
      bullets: [],
    });
    setSelectedFile(null);
    setBulletInput("");
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: LeadMagnet) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      slug: item.slug,
      audience_roles: item.audience_roles || [],
      bullets: item.bullets || [],
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error("Please select a PDF file");
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const addBullet = () => {
    if (bulletInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        bullets: [...prev.bullets, bulletInput.trim()],
      }));
      setBulletInput("");
    }
  };

  const removeBullet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== index),
    }));
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      audience_roles: prev.audience_roles.includes(role)
        ? prev.audience_roles.filter((r) => r !== role)
        : [...prev.audience_roles, role],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug) {
      toast.error("Title and slug are required");
      return;
    }

    if (!editingItem && !selectedFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      let storagePath = editingItem?.storage_path || "";

      if (selectedFile) {
        const { path, error } = await uploadLeadMagnetPdf(selectedFile, formData.slug);
        if (error) throw error;
        storagePath = path;
      }

      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          title: formData.title,
          description: formData.description || undefined,
          slug: formData.slug,
          storage_path: storagePath,
          audience_roles: formData.audience_roles,
          bullets: formData.bullets,
        });
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          description: formData.description || undefined,
          slug: formData.slug,
          storage_path: storagePath,
          audience_roles: formData.audience_roles,
          bullets: formData.bullets,
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving lead magnet:", error);
      toast.error("Failed to save lead magnet");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = async (item: LeadMagnet) => {
    const url = await getLeadMagnetSignedUrl(item.storage_path);
    if (url) {
      await navigator.clipboard.writeText(url);
      toast.success("Download link copied to clipboard");
    } else {
      toast.error("Failed to generate download link");
    }
  };

  const handleToggleActive = (item: LeadMagnet) => {
    toggleMutation.mutate({ id: item.id, is_active: !item.is_active });
  };

  const handleDelete = (item: LeadMagnet) => {
    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Lead Magnets
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage downloadable reports and guides for lead generation
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead Magnet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Lead Magnets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : leadMagnets?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lead magnets yet. Click "Add Lead Magnet" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadMagnets?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.audience_roles?.slice(0, 2).map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {AUDIENCE_ROLES.find((r) => r.value === role)?.label || role}
                          </Badge>
                        ))}
                        {(item.audience_roles?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.audience_roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.download_count}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(item)}
                          title="Copy download link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(item)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(item)}
                          title={item.is_active ? "Archive" : "Activate"}
                        >
                          {item.is_active ? (
                            <Archive className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
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
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Lead Magnet" : "Add Lead Magnet"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., 5 Ways AI Will Transform Podcasting"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                placeholder="e.g., ai-podcast-guide"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for the file path and URL
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the lead magnet..."
                rows={2}
              />
            </div>

            <div>
              <Label>PDF File {!editingItem && "*"}</Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-4 text-center">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload or drag & drop
                      </span>
                      <span className="text-xs text-muted-foreground">PDF only</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {editingItem && !selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current file: {editingItem.storage_path}
                </p>
              )}
            </div>

            <div>
              <Label>Audience Roles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AUDIENCE_ROLES.map((role) => (
                  <Badge
                    key={role.value}
                    variant={formData.audience_roles.includes(role.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRole(role.value)}
                  >
                    {role.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Bullet Points</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={bulletInput}
                  onChange={(e) => setBulletInput(e.target.value)}
                  placeholder="Add a bullet point..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBullet())}
                />
                <Button type="button" variant="outline" onClick={addBullet}>
                  Add
                </Button>
              </div>
              {formData.bullets.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {formData.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      <span className="flex-1">{bullet}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeBullet(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingItem ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
