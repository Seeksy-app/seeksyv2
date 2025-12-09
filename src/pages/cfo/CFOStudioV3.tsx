import { useState } from 'react';
import { toast } from 'sonner';
import { useCFOStudioV3 } from '@/hooks/useCFOStudioV3';
import { CFOStickyHeader } from '@/components/cfo-v3/CFOStickyHeader';
import { CFORevenueSection } from '@/components/cfo-v3/CFORevenueSection';
import { CFOCOGSSection } from '@/components/cfo-v3/CFOCOGSSection';
import { CFOOpExSection } from '@/components/cfo-v3/CFOOpExSection';
import { CFOHeadcountSection } from '@/components/cfo-v3/CFOHeadcountSection';
import { CFOMetricsSection } from '@/components/cfo-v3/CFOMetricsSection';
import { CFOAssumptionsSection } from '@/components/cfo-v3/CFOAssumptionsSection';
import { CFOFinancialSummary } from '@/components/cfo-v3/CFOFinancialSummary';
import { CFOExportSection } from '@/components/cfo-v3/CFOExportSection';
import { ShareToBoardModal } from '@/components/cfo-v3/ShareToBoardModal';

export default function CFOStudioV3() {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const {
    state,
    metrics,
    setForecastMode,
    updateRevenue,
    updateCOGS,
    updateOpEx,
    updateHeadcount,
    updateAssumptions,
  } = useCFOStudioV3();

  const handleExportPDF = () => {
    toast.success('PDF export started — check downloads');
  };

  const handleExportExcel = () => {
    toast.success('Excel export started — check downloads');
  };

  const handleShareToBoard = () => {
    setShareModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <CFOStickyHeader
        forecastMode={state.forecastMode}
        onForecastModeChange={setForecastMode}
        metrics={metrics}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onShareToBoard={handleShareToBoard}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <CFORevenueSection
          revenue={state.revenue}
          onUpdate={updateRevenue}
        />

        <CFOCOGSSection
          cogs={state.cogs}
          grossMargins={metrics.grossMargins}
          onUpdate={updateCOGS}
        />

        <CFOOpExSection
          opex={state.opex}
          onUpdate={updateOpEx}
        />

        <CFOHeadcountSection
          headcount={state.headcount}
          onUpdate={updateHeadcount}
        />

        <CFOMetricsSection metrics={metrics} />

        <CFOAssumptionsSection
          assumptions={state.assumptions}
          onUpdate={updateAssumptions}
        />

        <CFOFinancialSummary metrics={metrics} />

        <CFOExportSection
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onShareToBoard={handleShareToBoard}
        />
      </main>

      {/* Share to Board Modal */}
      <ShareToBoardModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        versionLabel="Current Pro Forma"
      />
    </div>
  );
}
