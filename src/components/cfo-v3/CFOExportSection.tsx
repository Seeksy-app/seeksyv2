import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Share2, Users, Download } from 'lucide-react';
import { toast } from 'sonner';

interface CFOExportSectionProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  onShareToBoard: () => void;
}

export function CFOExportSection({ onExportExcel, onExportPDF, onShareToBoard }: CFOExportSectionProps) {
  const handleCreatorProforma = () => {
    toast.success('Creator Pro Forma generated — check downloads');
  };

  return (
    <section id="export" className="scroll-mt-32 space-y-6">
      {/* Creator Proforma */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-pink-500" />
            </div>
            Creator Pro Forma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a 3-year creator-focused revenue projection based on your model assumptions.
          </p>
          <Button onClick={handleCreatorProforma} className="gap-2">
            <Download className="w-4 h-4" />
            Generate Creator 3-Year Pro Forma
          </Button>
        </CardContent>
      </Card>

      {/* Export Tools */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Download className="w-4 h-4 text-slate-500" />
            </div>
            Export & Share
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={onExportExcel}
              className="flex flex-col items-center justify-center gap-3 p-6 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Export Excel</p>
                <p className="text-xs text-muted-foreground">3-Year Financial Model</p>
              </div>
            </button>

            <button
              onClick={onExportPDF}
              className="flex flex-col items-center justify-center gap-3 p-6 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Investor PDF Pack</p>
                <p className="text-xs text-muted-foreground">Board-ready summary</p>
              </div>
            </button>

            <button
              onClick={onShareToBoard}
              className="flex flex-col items-center justify-center gap-3 p-6 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Share to Board</p>
                <p className="text-xs text-muted-foreground">Publish to Board Portal</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
