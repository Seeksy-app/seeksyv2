import { useState } from 'react';
import { BoardLayout } from '@/components/board/BoardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Link2, Copy, Trash2, Eye, Clock, Users, AlertTriangle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InvestorShareModal } from '@/components/board/InvestorShareModal';
import { format } from 'date-fns';

interface InvestorLink {
  id: string;
  token: string;
  passcode: string;
  investor_name: string | null;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  data_mode: string;
  scope: string[];
  status: string;
  last_viewed_at: string | null;
  total_views: number;
  tabs_viewed: string[];
}

interface LinkActivity {
  id: string;
  event_type: string;
  tab_viewed: string | null;
  created_at: string;
}

export default function BoardInvestorLinks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<InvestorLink | null>(null);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [linkToRevoke, setLinkToRevoke] = useState<InvestorLink | null>(null);

  const { data: links, isLoading } = useQuery({
    queryKey: ['investorLinks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_links')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InvestorLink[];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ['linkActivity', selectedLink?.id],
    queryFn: async () => {
      if (!selectedLink) return [];
      const { data, error } = await supabase
        .from('investor_link_activity')
        .select('*')
        .eq('link_id', selectedLink.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LinkActivity[];
    },
    enabled: !!selectedLink,
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investor_links')
        .update({ status: 'revoked' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investorLinks'] });
      toast.success('Link revoked successfully');
      setRevokeDialogOpen(false);
      setLinkToRevoke(null);
    },
  });

  const copyLink = (link: InvestorLink) => {
    const url = `${window.location.origin}/investor/${link.token}`;
    navigator.clipboard.writeText(`${url}\n\nAccess Code: ${link.passcode}`);
    toast.success('Link and code copied to clipboard');
  };

  const getStatusBadge = (link: InvestorLink) => {
    if (link.status === 'revoked') {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>;
  };

  return (
    <BoardLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-700 -ml-2"
          onClick={() => navigate('/board')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Shared Investor Links</h1>
              <p className="text-slate-500">Manage and track investor access to board content</p>
            </div>
          </div>
          <Button onClick={() => setShareModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Link
          </Button>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : links?.length === 0 ? (
              <div className="p-8 text-center">
                <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No investor links created yet.</p>
                <Button className="mt-4" onClick={() => setShareModalOpen(true)}>
                  Create Your First Link
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Investor</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Scope</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Data Mode</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Views</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Last Viewed</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {links?.map((link) => (
                      <tr key={link.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{link.investor_name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-500">{format(new Date(link.created_at), 'MMM d, yyyy')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600">{link.scope.slice(0, 3).join(', ')}{link.scope.length > 3 && '...'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={link.data_mode === 'demo' ? 'border-amber-300 text-amber-700' : 'border-emerald-300 text-emerald-700'}>
                            {link.data_mode === 'demo' ? 'Demo' : 'Real'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(link)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{link.total_views}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {link.last_viewed_at ? format(new Date(link.last_viewed_at), 'MMM d, h:mm a') : 'Never'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => copyLink(link)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedLink(link); setActivitySheetOpen(true); }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {link.status === 'active' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => { setLinkToRevoke(link); setRevokeDialogOpen(true); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InvestorShareModal open={shareModalOpen} onOpenChange={setShareModalOpen} />

      {/* Activity Sheet */}
      <Sheet open={activitySheetOpen} onOpenChange={setActivitySheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Link Activity: {selectedLink?.investor_name || 'Unnamed'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {activity?.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity recorded yet.</p>
            ) : (
              activity?.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{event.event_type}</p>
                    {event.tab_viewed && <p className="text-xs text-slate-500">Tab: {event.tab_viewed}</p>}
                    <p className="text-xs text-slate-400">{format(new Date(event.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Revoke Access
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to revoke access for <strong>{linkToRevoke?.investor_name || 'this investor'}</strong>? 
            They will see a message indicating that their link is no longer active.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => linkToRevoke && revokeMutation.mutate(linkToRevoke.id)}>
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BoardLayout>
  );
}
