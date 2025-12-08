import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Mail, Link, ExternalLink } from 'lucide-react';
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share with Investors
          </DialogTitle>
          <DialogDescription>
            Share a Pro Forma summary and key highlights with investors.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Investor Sharing Portal
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Create secure, time-limited access links to share your Pro Forma 
              and key business metrics with investors.
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

          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> All shared links require investors to accept 
              your NDA before viewing. You can revoke access at any time.
            </p>
          </div>
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
