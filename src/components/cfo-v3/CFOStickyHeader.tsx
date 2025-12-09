import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Share2 } from 'lucide-react';
import { ForecastMode } from '@/hooks/useCFOStudioV3';

interface CFOStickyHeaderProps {
  forecastMode: ForecastMode;
  onForecastModeChange: (mode: ForecastMode) => void;
  metrics: {
    arr: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    grossMargin: number;
    burnRate: number;
    runway: number;
    breakevenMonth: number | string;
  };
  onExportPDF: () => void;
  onExportExcel: () => void;
  onShareToBoard: () => void;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatRatio = (value: number) => value.toFixed(1) + 'x';
const formatPercent = (value: number) => value.toFixed(1) + '%';
const formatMonths = (value: number | string) => typeof value === 'number' ? value + ' mo' : value;

export function CFOStickyHeader({
  forecastMode,
  onForecastModeChange,
  metrics,
  onExportPDF,
  onExportExcel,
  onShareToBoard,
}: CFOStickyHeaderProps) {
  const kpis = [
    { label: 'ARR', value: formatCurrency(metrics.arr) },
    { label: 'CAC', value: formatCurrency(metrics.cac) },
    { label: 'LTV', value: formatCurrency(metrics.ltv) },
    { label: 'LTV:CAC', value: formatRatio(metrics.ltvCacRatio) },
    { label: 'Gross Margin', value: formatPercent(metrics.grossMargin) },
    { label: 'Burn Rate', value: formatCurrency(metrics.burnRate) + '/mo' },
    { label: 'Runway', value: formatMonths(metrics.runway) },
    { label: 'Breakeven', value: typeof metrics.breakevenMonth === 'number' ? `Month ${metrics.breakevenMonth}` : metrics.breakevenMonth },
  ];

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">CFO Studio V3</h1>
            <Select value={forecastMode} onValueChange={(v) => onForecastModeChange(v as ForecastMode)}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="ai">AI Forecast</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onExportPDF} className="gap-1.5">
              <FileText className="w-4 h-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onExportExcel} className="gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button size="sm" onClick={onShareToBoard} className="gap-1.5">
              <Share2 className="w-4 h-4" />
              Share to Board
            </Button>
          </div>
        </div>

        {/* KPI Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-sm whitespace-nowrap"
            >
              <span className="text-muted-foreground">{kpi.label}</span>
              <span className="font-semibold text-foreground">{kpi.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
