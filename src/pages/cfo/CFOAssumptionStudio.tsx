import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sliders, TrendingUp, CreditCard, DollarSign, Calendar, ArrowLeft, Sparkles, Info, Lock, Unlock, CheckCircle2, ExternalLink, Check, Building2, PiggyBank, Save, RefreshCw, FileCheck2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { useCFOLockStatus } from '@/hooks/useCFOLockStatus';
import { useCFOProFormaStatus, type CFOSectionKey } from '@/hooks/useCFOProFormaStatus';
import { useCFOProFormaVersions } from '@/hooks/useCFOProFormaVersions';
import { GrowthCACCalculator } from '@/components/cfo/calculators/GrowthCACCalculator';
import { SubscriptionRevenueCalculator } from '@/components/cfo/calculators/SubscriptionRevenueCalculator';
import { AdRevenueCalculator } from '@/components/cfo/calculators/AdRevenueCalculator';
import { EventsAwardsCalculator } from '@/components/cfo/calculators/EventsAwardsCalculator';
import { ExpenseCalculator } from '@/components/cfo/calculators/ExpenseCalculator';
import { CapitalRunwayCalculator } from '@/components/cfo/calculators/CapitalRunwayCalculator';
import { AssumptionsSummaryPanel } from '@/components/cfo/AssumptionsSummaryPanel';

import { SaveProFormaVersionModal } from '@/components/cfo/SaveProFormaVersionModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CFOAssumptionStudio() {
  const navigate = useNavigate();
  const { rdCount, cfoOverrideCount, schemaCount, isLoading, deleteAssumption, cfoAssumptions, effectiveAssumptions } = useCFOAssumptions();
  const { isLocked, lockedAt, toggleLock, isToggling } = useCFOLockStatus();
  const { sectionStatus, markSectionSaved, resetAllSections } = useCFOProFormaStatus();
  const { saveVersion, isSaving, isProFormaComplete, buildFullAssumptions } = useCFOProFormaVersions();
  
  const [activeTab, setActiveTab] = useState('growth');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const handleResetAll = async () => {
    // Delete all CFO overrides
    if (cfoAssumptions) {
      for (const assumption of cfoAssumptions) {
        deleteAssumption(assumption.metric_key);
      }
    }
    // Reset all section statuses
    resetAllSections();
    toast.success('Assumptions reset — rebuild required.');
  };

  // Tab order for auto-advance
  const tabOrder: CFOSectionKey[] = ['growth', 'subscriptions', 'adRevenue', 'events', 'expenses', 'capital'];
  
  // Map section keys to tab values (adRevenue uses 'ads' as tab value)
  const sectionToTabValue = (section: CFOSectionKey): string => {
    return section === 'adRevenue' ? 'ads' : section;
  };

  // Handler for when a calculator saves - mark section as saved and auto-advance to next unsaved
  const handleCalculatorSave = (section: CFOSectionKey, data?: Record<string, any>) => {
    markSectionSaved(section, data);
    setShowSaveSuccess(true);
    toast.success('Saved to Pro Forma — this section is now included in the forecast.');
    
    // Find the next UNSAVED section and auto-advance to it
    const currentIndex = tabOrder.indexOf(section);
    for (let i = currentIndex + 1; i < tabOrder.length; i++) {
      if (!sectionStatus[tabOrder[i]]) {
        setActiveTab(sectionToTabValue(tabOrder[i]));
        return;
      }
    }
    // If no unsaved section after current, check from beginning
    for (let i = 0; i < currentIndex; i++) {
      if (!sectionStatus[tabOrder[i]]) {
        setActiveTab(sectionToTabValue(tabOrder[i]));
        return;
      }
    }
    // All sections saved - stay on current tab
  };

  // Auto-hide the success message after 8 seconds
  useEffect(() => {
    if (showSaveSuccess) {
      const timer = setTimeout(() => setShowSaveSuccess(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showSaveSuccess]);

  // Handle full version save
  const handleSaveFullVersion = (name: string, notes?: string) => {
    const assumptions = {
      ...buildFullAssumptions(),
      effectiveAssumptions: Object.fromEntries(
        Object.entries(effectiveAssumptions).map(([k, v]) => [k, v.value])
      ),
    };
    saveVersion({ name, notes, assumptions });
    setSaveModalOpen(false);
  };

  // Count saved sections
  const savedCount = Object.values(sectionStatus).filter(Boolean).length;
  const totalSections = Object.keys(sectionStatus).length;

  // Tab configuration
  const tabs = [
    { key: 'growth' as CFOSectionKey, label: 'Growth & CAC', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'subscriptions' as CFOSectionKey, label: 'Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'adRevenue' as CFOSectionKey, label: 'Ad Revenue', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'events' as CFOSectionKey, label: 'Events & Awards', icon: <Calendar className="w-4 h-4" /> },
    { key: 'expenses' as CFOSectionKey, label: 'Expenses', icon: <Building2 className="w-4 h-4" /> },
    { key: 'capital' as CFOSectionKey, label: 'Capital & Runway', icon: <PiggyBank className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Sliders className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">CFO Assumption Studio</h1>
              <p className="text-muted-foreground">Configure financial assumptions for AI Pro Forma forecasts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm">
              {schemaCount} total metrics
            </Badge>
            <Badge variant="outline" className="text-sm bg-slate-50 text-slate-700 border-slate-200">
              {rdCount} R&D benchmarks
            </Badge>
            <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
              {cfoOverrideCount} CFO overrides
            </Badge>
            
            {/* Lock Toggle for Board */}
            <div className="flex items-center gap-2 border-l border-border pl-3 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={isLocked}
                      onCheckedChange={(checked) => toggleLock(checked)}
                      disabled={isToggling}
                    />
                    <span className="text-sm font-medium">
                      {isLocked ? 'Locked for Board' : 'Unlock for Board'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    When locked, Board members can only view published assumptions. 
                    They cannot see real-time changes until you unlock.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Button onClick={() => navigate('/cfo/proforma')} variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Preview Pro Forma
            </Button>
          </div>
        </div>

        {/* Pro Forma Status Bar */}
        <div className={cn(
          "p-4 rounded-lg border flex items-center justify-between",
          isProFormaComplete 
            ? "bg-emerald-50 border-emerald-200" 
            : "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-center gap-3">
            {isProFormaComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Info className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <p className={cn(
                "font-medium",
                isProFormaComplete ? "text-emerald-800" : "text-amber-800"
              )}>
                {isProFormaComplete 
                  ? 'All sections saved — ready to publish!' 
                  : `${savedCount} of ${totalSections} sections saved`}
              </p>
              <p className={cn(
                "text-sm",
                isProFormaComplete ? "text-emerald-700" : "text-amber-700"
              )}>
                {isProFormaComplete 
                  ? 'Click "Save Full Pro Forma Version" to lock and publish to Board.'
                  : 'Save each section to include it in the Pro Forma.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetAll}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset All
            </Button>
            <Button 
              onClick={() => setSaveModalOpen(true)}
              disabled={!isProFormaComplete}
              className={cn(
                "gap-2 transition-all",
                isProFormaComplete 
                  ? "bg-emerald-600 hover:bg-emerald-700 animate-pulse" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <FileCheck2 className="w-4 h-4" />
              Save Full Pro Forma Version
            </Button>
          </div>
        </div>

        {/* Section Status Chips */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <Badge
              key={tab.key}
              variant="outline"
              className={cn(
                "text-xs py-1.5 px-3 cursor-pointer transition-all",
                sectionStatus[tab.key]
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-muted text-muted-foreground border-border"
              )}
              onClick={() => setActiveTab(tab.key === 'adRevenue' ? 'ads' : tab.key)}
            >
              {sectionStatus[tab.key] && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {tab.label}
            </Badge>
          ))}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr,420px] gap-6 overflow-visible">
          {/* Left: Calculators */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted border border-border p-1 flex-wrap h-auto gap-1">
                {tabs.map(tab => {
                  const tabValue = tab.key === 'adRevenue' ? 'ads' : tab.key;
                  return (
                    <TabsTrigger 
                      key={tab.key} 
                      value={tabValue} 
                      className="gap-2 data-[state=active]:bg-background"
                    >
                      {tab.icon}
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="growth">
                <GrowthCACCalculator onSave={(data) => handleCalculatorSave('growth', data)} />
              </TabsContent>

              <TabsContent value="subscriptions">
                <SubscriptionRevenueCalculator onSave={(data) => handleCalculatorSave('subscriptions', data)} />
              </TabsContent>

              <TabsContent value="ads">
                <AdRevenueCalculator onSave={(data) => handleCalculatorSave('adRevenue', data)} />
              </TabsContent>

              <TabsContent value="events">
                <EventsAwardsCalculator onSave={(data) => handleCalculatorSave('events', data)} />
              </TabsContent>

              <TabsContent value="expenses">
                <ExpenseCalculator onSave={(data) => handleCalculatorSave('expenses', data)} />
              </TabsContent>

              <TabsContent value="capital">
                <CapitalRunwayCalculator onSave={(data) => handleCalculatorSave('capital', data)} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Key Assumptions Summary */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <AssumptionsSummaryPanel onResetAll={handleResetAll} />
          </div>
        </div>

        {/* Inline Success State */}
        {showSaveSuccess && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm text-emerald-800">
                <strong>Section saved.</strong> {savedCount} of {totalSections} sections complete.
              </span>
            </div>
            {isProFormaComplete && (
              <Button 
                size="sm"
                onClick={() => setSaveModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <FileCheck2 className="w-4 h-4" />
                Save Full Version
              </Button>
            )}
          </div>
        )}

        {/* Footer Reminder */}
        {!showSaveSuccess && !isProFormaComplete && (
          <div className="mt-8 p-4 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Complete all sections to save a Pro Forma version.</strong>
              <span className="ml-2">
                Each saved section turns green. Once all are green, you can publish to the Board.
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/cfo/proforma')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Preview Pro Forma
            </Button>
          </div>
        )}
      </div>

      {/* Save Version Modal */}
      <SaveProFormaVersionModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSaveFullVersion}
        isSaving={isSaving}
      />
    </div>
  );
}
