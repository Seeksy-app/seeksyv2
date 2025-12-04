import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Link2, Copy, Shield, Clock, Eye, Trash2, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface InvestorLink {
  id: string;
  passcode: string;
  expiration: string;
  createdAt: Date;
  viewed: boolean;
  timeSpent: string;
  tabsOpened: string[];
}

export function ShareWithInvestorTab() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [boardMemberName, setBoardMemberName] = useState('');
  const [expiration, setExpiration] = useState('24h');
  const [generatedLinks, setGeneratedLinks] = useState<InvestorLink[]>([
    {
      id: 'inv-001',
      passcode: '847291',
      expiration: '24 hours',
      createdAt: new Date(Date.now() - 3600000),
      viewed: true,
      timeSpent: '12 min',
      tabsOpened: ['Market Overview', 'GTM Strategy', 'Key Metrics'],
    },
    {
      id: 'inv-002',
      passcode: '392847',
      expiration: '7 days',
      createdAt: new Date(Date.now() - 86400000),
      viewed: false,
      timeSpent: '0 min',
      tabsOpened: [],
    },
  ]);

  const generateLink = () => {
    if (!boardMemberName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!acknowledged) {
      toast.error('Please acknowledge the confidentiality agreement');
      return;
    }

    const newLink: InvestorLink = {
      id: `inv-${Date.now()}`,
      passcode: Math.floor(100000 + Math.random() * 900000).toString(),
      expiration: expiration === '24h' ? '24 hours' : expiration === '3d' ? '3 days' : expiration === '7d' ? '7 days' : 'Never',
      createdAt: new Date(),
      viewed: false,
      timeSpent: '0 min',
      tabsOpened: [],
    };

    setGeneratedLinks([newLink, ...generatedLinks]);
    setShowDisclaimer(false);
    setBoardMemberName('');
    setAcknowledged(false);
    toast.success('Investor link generated successfully');
  };

  const copyLink = (link: InvestorLink) => {
    const url = `${window.location.origin}/investor-portal/${link.id}?code=${link.passcode}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const revokeLink = (id: string) => {
    setGeneratedLinks(generatedLinks.filter(l => l.id !== id));
    toast.success('Link revoked');
  };

  return (
    <div className="space-y-6">
      {/* Generate New Link */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <Link2 className="w-5 h-5 text-blue-600" />
            Generate Investor Access Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Create a secure, time-limited link to share the GTM Strategy with potential investors.
          </p>
          <Button onClick={() => setShowDisclaimer(true)} className="bg-blue-600 hover:bg-blue-700">
            Generate New Link
          </Button>
        </CardContent>
      </Card>

      {/* Active Links */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Active Investor Links</CardTitle>
        </CardHeader>
        <CardContent>
          {generatedLinks.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No active links. Generate one above.</p>
          ) : (
            <div className="space-y-3">
              {generatedLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm bg-white px-2 py-1 rounded border border-slate-200">
                        {link.passcode}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        Expires: {link.expiration}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {link.viewed ? (
                          <span className="text-emerald-600 font-medium">Viewed ({link.timeSpent})</span>
                        ) : (
                          'Not viewed'
                        )}
                      </span>
                      {link.tabsOpened.length > 0 && (
                        <span>Tabs: {link.tabsOpened.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyLink(link)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => revokeLink(link.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Investor Access Guidelines</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li><strong>Do NOT</strong> share screenshots or exports of this portal</li>
                <li>All investor access must be initiated via this secure link system</li>
                <li>Links auto-accept NDA and expire based on your settings</li>
                <li><strong>Shareable:</strong> Overview video, pitch deck, demo mode data</li>
                <li><strong>Not shareable:</strong> Internal KPIs, real creator data, R&D feeds</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Confidentiality Agreement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600 leading-relaxed">
              I, <strong>{boardMemberName || '[Board Member Name]'}</strong>, acknowledge that this link is 
              <strong> confidential</strong> and may only be shared with <strong>one investor</strong>. 
              I assume responsibility for unauthorized disclosure and understand that link activity is tracked.
            </div>
            
            <div>
              <Label className="text-sm text-slate-600">Your Name</Label>
              <Input
                value={boardMemberName}
                onChange={(e) => setBoardMemberName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm text-slate-600">Link Expiration</Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="3d">3 days</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="never">Never expire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              />
              <label htmlFor="acknowledge" className="text-sm text-slate-600 leading-tight cursor-pointer">
                I acknowledge the confidentiality requirements and accept responsibility for this link.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisclaimer(false)}>Cancel</Button>
            <Button onClick={generateLink} disabled={!acknowledged || !boardMemberName.trim()}>
              <Check className="w-4 h-4 mr-2" />
              Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
