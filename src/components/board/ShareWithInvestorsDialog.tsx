import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Mail, ExternalLink, TrendingUp, Trophy, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShareWithInvestorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareWithInvestorsDialog({
  open,
  onOpenChange,
}: ShareWithInvestorsDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share with Investors
          </DialogTitle>
          <DialogDescription>
            Choose what to share with investors and potential buyers.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="platform" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Platform Pro Forma
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Events & Awards
            </TabsTrigger>
          </TabsList>

          {/* Platform Pro Forma Tab */}
          <TabsContent value="platform" className="mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Platform Pro Forma
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Send a summary of the AI-Powered 3-Year Pro Forma, including key revenue drivers, 
                scenarios, and CFO assumptions.
              </p>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  navigate('/board/share');
                }}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Investor Sharing
              </Button>
            </div>
          </TabsContent>

          {/* Events & Awards Pro Forma Tab */}
          <TabsContent value="events" className="mt-4">
            <div className="bg-gradient-to-br from-purple-50 to-amber-50 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Events & Awards Pro Forma
                </h3>
                <p className="text-sm text-slate-600">
                  Share a focused summary of the Seeksy Events & Awards Platform, including its 
                  3-year financial outlook, strategic positioning, and asset-sale details for the 
                  Veteran Podcast Awards.
                </p>
              </div>

              {/* Explainer Block */}
              <div className="bg-white/70 rounded-lg p-4 mb-4 border border-purple-100">
                <p className="text-sm text-slate-700">
                  <strong>About this asset:</strong> The Events & Awards Platform was originally 
                  built to power the Veteran Podcast Awards and is now positioned as a repeatable, 
                  white-label awards engine for buyers.
                </p>
              </div>

              {/* VPA Link Button */}
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline"
                  className="w-full gap-2 border-purple-200 hover:bg-purple-50"
                  onClick={() => window.open('https://veteranpodcastawards.com', '_blank')}
                >
                  <Globe className="w-4 h-4 text-purple-600" />
                  View Veteran Podcast Awards Site
                </Button>
                <Button 
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/board/share');
                  }}
                  className="w-full gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Create Investor Link
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> All shared links require investors to accept 
            your NDA before viewing. You can revoke access at any time.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
