import { useState } from 'react';
import { BoardLayout } from '@/components/board/BoardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Share2, Shield, Copy, Check, AlertTriangle, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const scopeOptions = [
  { id: 'dashboard', label: 'Dashboard KPIs' },
  { id: 'business-model', label: 'Business Model' },
  { id: 'gtm', label: 'GTM Strategy' },
  { id: 'forecasts', label: '3-Year Forecasts' },
  { id: 'videos', label: 'Investor Videos' },
  { id: 'documents', label: 'Documents' },
];

const durationOptions = [
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: 'never', label: 'No expiration' },
];

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function BoardShare() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'configure' | 'confirm' | 'success'>('configure');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [investorName, setInvestorName] = useState('');
  const [selectedScope, setSelectedScope] = useState<string[]>(['dashboard', 'gtm', 'forecasts']);
  const [dataMode, setDataMode] = useState('demo');
  const [duration, setDuration] = useState('7d');
  const [allowAI, setAllowAI] = useState(true);
  const [allowPDF, setAllowPDF] = useState(false);
  
  // Generated link data
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedPasscode, setGeneratedPasscode] = useState('');

  const handleScopeChange = (scopeId: string, checked: boolean) => {
    if (checked) {
      setSelectedScope([...selectedScope, scopeId]);
    } else {
      setSelectedScope(selectedScope.filter(s => s !== scopeId));
    }
  };

  const handleContinue = () => {
    if (selectedScope.length === 0) {
      toast.error('Please select at least one section to share');
      return;
    }
    setStep('confirm');
  };

  const handleCreateLink = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create investor links');
        return;
      }

      const token = generateToken();
      const passcode = generatePasscode();
      
      let expiresAt: string | null = null;
      if (duration !== 'never') {
        const now = new Date();
        if (duration === '24h') now.setHours(now.getHours() + 24);
        if (duration === '3d') now.setDate(now.getDate() + 3);
        if (duration === '7d') now.setDate(now.getDate() + 7);
        expiresAt = now.toISOString();
      }

      const { data, error } = await supabase.from('investor_links').insert({
        token,
        passcode,
        investor_name: investorName || null,
        data_mode: dataMode,
        scope: selectedScope,
        allow_ai: allowAI,
        allow_pdf: allowPDF,
        created_by: user.id,
        expires_at: expiresAt,
        status: 'active',
      }).select().single();

      if (error) throw error;

      const baseUrl = window.location.origin;
      setGeneratedLink(`${baseUrl}/investor/${token}`);
      setGeneratedPasscode(passcode);
      setStep('success');
      toast.success('Investor link created successfully');
    } catch (error) {
      console.error('Error creating investor link:', error);
      toast.error('Failed to create investor link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = () => {
    const fullText = `Seeksy Investor View\n\nLink: ${generatedLink}\nAccess Code: ${generatedPasscode}\n\nThis is a secure, time-limited view of our business metrics.`;
    navigator.clipboard.writeText(fullText);
    toast.success('Link and code copied');
  };

  return (
    <BoardLayout>
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-700 mb-6 -ml-2"
          onClick={() => navigate('/board')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Share with Investor</h1>
            <p className="text-slate-500">Create a secure, time-limited investor view</p>
          </div>
        </div>

        {step === 'configure' && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Create Investor View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Investor Name */}
              <div className="space-y-2">
                <Label htmlFor="investor-name">Investor Name (optional)</Label>
                <Input
                  id="investor-name"
                  placeholder="e.g., Acme Ventures"
                  value={investorName}
                  onChange={(e) => setInvestorName(e.target.value)}
                />
              </div>

              {/* Scope */}
              <div className="space-y-3">
                <Label>What can they see?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {scopeOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedScope.includes(option.id)}
                        onCheckedChange={(checked) => handleScopeChange(option.id, checked as boolean)}
                      />
                      <label htmlFor={option.id} className="text-sm text-slate-700 cursor-pointer">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Mode */}
              <div className="space-y-3">
                <Label>Data Mode for this link</Label>
                <RadioGroup value={dataMode} onValueChange={setDataMode}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="demo" id="demo" />
                    <label htmlFor="demo" className="text-sm text-slate-700 cursor-pointer">
                      Demo Data Only <span className="text-emerald-600">(Recommended)</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="real" id="real" />
                    <label htmlFor="real" className="text-sm text-slate-700 cursor-pointer">
                      Real Data <span className="text-amber-600">(Restricted)</span>
                    </label>
                  </div>
                </RadioGroup>
                {dataMode === 'real' && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    Real data access shows live platform metrics. Use with caution.
                  </p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <Label>Access Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={duration === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDuration(option.value)}
                      className={duration === option.value ? 'bg-blue-600' : ''}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-ai"
                      checked={allowAI}
                      onCheckedChange={(checked) => setAllowAI(checked as boolean)}
                    />
                    <label htmlFor="allow-ai" className="text-sm text-slate-700 cursor-pointer">
                      Allow AI Q&A inside investor view
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-pdf"
                      checked={allowPDF}
                      onCheckedChange={(checked) => setAllowPDF(checked as boolean)}
                    />
                    <label htmlFor="allow-pdf" className="text-sm text-slate-700 cursor-pointer">
                      Allow export to PDF
                    </label>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleContinue}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={step === 'confirm'} onOpenChange={() => setStep('configure')}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Confidentiality & Sharing Acknowledgment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-3">
                <p><b>Confidential Information Notice</b></p>
                <p>
                  By creating this investor view, you acknowledge that the information shared is 
                  confidential and intended for a limited audience.
                </p>
                <p>I understand that:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>This link is for one investor or firm only.</li>
                  <li>I am responsible for how this link is forwarded or used.</li>
                  <li>Seeksy may revoke access at any time if misuse is detected.</li>
                </ul>
                <p className="text-xs text-slate-500 pt-2">
                  By clicking "I Agree & Create Link", I confirm that I understand and accept these responsibilities.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('configure')} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateLink} disabled={isLoading} className="flex-1 bg-blue-600">
                {isLoading ? 'Creating...' : 'I Agree & Create Link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success State */}
        {step === 'success' && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Link Created Successfully</h2>
              <p className="text-slate-500 mb-6">Share these details with your investor</p>

              <div className="space-y-4 text-left">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-slate-500">Investor Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={generatedLink} readOnly className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={() => handleCopy(generatedLink)}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-slate-500">Access Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={generatedPasscode} readOnly className="font-mono text-2xl tracking-[0.3em] text-center" />
                    <Button size="icon" variant="outline" onClick={() => handleCopy(generatedPasscode)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-6" onClick={handleCopyAll}>
                <Link2 className="w-4 h-4 mr-2" />
                Copy Link + Code for Email
              </Button>

              <p className="text-xs text-slate-400 mt-4">
                Tip: We recommend including the passcode in a separate line for security.
              </p>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => navigate('/board/investor-links')} className="flex-1">
                  View All Links
                </Button>
                <Button variant="outline" onClick={() => {
                  setStep('configure');
                  setInvestorName('');
                  setSelectedScope(['dashboard', 'gtm', 'forecasts']);
                }} className="flex-1">
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BoardLayout>
  );
}
