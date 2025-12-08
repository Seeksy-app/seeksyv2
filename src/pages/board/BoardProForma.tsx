import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InteractiveSpreadsheet } from '@/components/cfo/InteractiveSpreadsheet';
import { CFOAIChat } from '@/components/cfo/CFOAIChat';

export default function BoardProForma() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Pro Forma Quick Links */}
      <Card className="border-l-4 border-l-[#053877]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#053877]" />
            Available Pro Formas
          </CardTitle>
          <CardDescription>Financial models for business segments and acquisition opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate('/board/proforma/events-awards')}
              className="bg-[#053877] hover:bg-[#053877]/90"
            >
              Events & Awards Pro Forma
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Financial Models with AI Chat */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <InteractiveSpreadsheet />
        </div>
        <div>
          <CFOAIChat />
        </div>
      </div>
    </div>
  );
}
