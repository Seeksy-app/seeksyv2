import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, LogIn, Clock, Trash2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useVeteranCalculatorResults } from "@/hooks/useVeteranCalculatorResults";
import { format } from "date-fns";
import * as LucideIcons from "lucide-react";

interface CalculatorLayoutProps {
  calculatorId: string;
  title: string;
  description: string;
  icon: string;
  iconColor?: string;
  category: string;
  children: ReactNode;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  resultSummary?: string;
  hasResults?: boolean;
  onReset?: () => void;
}

export function CalculatorLayout({
  calculatorId,
  title,
  description,
  icon,
  iconColor = "text-primary",
  category,
  children,
  inputs,
  outputs,
  resultSummary,
  hasResults,
  onReset,
}: CalculatorLayoutProps) {
  const { results, loading, save, deleteResult, isLoggedIn } = useVeteranCalculatorResults(calculatorId);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSavedResults, setShowSavedResults] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get icon component dynamically
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Calculator;

  const handleSave = async () => {
    if (!inputs || !outputs) return;
    
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    setSaving(true);
    await save(inputs, outputs, resultSummary);
    setSaving(false);
  };

  const handleSaveAnyway = async () => {
    if (!inputs || !outputs) return;
    setSaving(true);
    await save(inputs, outputs, resultSummary);
    setSaving(false);
    setShowLoginPrompt(false);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link to="/veterans" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Veterans Home
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="text-center mb-8 lg:text-left">
              <div className={`inline-flex items-center gap-2 ${iconColor.replace('text-', 'bg-').replace('-500', '-500/10')} ${iconColor} px-4 py-2 rounded-full mb-4`}>
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{category}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{title}</h1>
              <p className="text-muted-foreground text-balance">{description}</p>
            </div>

            {children}

            {/* Save Button */}
            {hasResults && (
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Results"}
                </Button>
                {onReset && (
                  <Button variant="outline" onClick={onReset}>
                    Calculate Again
                  </Button>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  This tool is for planning only and doesn't replace official VA or federal guidance. 
                  Always verify with official sources before making decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Saved Results Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Saved Results
                  </span>
                  {results.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowSavedResults(!showSavedResults)}
                      className="lg:hidden"
                    >
                      {showSavedResults ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className={`${!showSavedResults ? 'hidden lg:block' : ''}`}>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : results.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">No saved results yet</p>
                    {!isLoggedIn && (
                      <p className="text-xs text-muted-foreground">
                        Results will be saved to your browser. 
                        <Link to="/auth" className="text-primary hover:underline ml-1">
                          Sign in
                        </Link>
                        {" "}to save across devices.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((result) => (
                      <div 
                        key={result.id} 
                        className="p-3 bg-muted/50 rounded-lg text-sm group relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(result.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {result.summary && (
                              <p className="font-medium mt-1 truncate">{result.summary}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteResult(result.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a free account to save your results</DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>With an account, you can:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Come back later and see your past calculations</li>
                <li>Access your results from any device</li>
                <li>Share a summary with a claims professional</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSaveAnyway}>
              Save to browser only
            </Button>
            <Button asChild>
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Create Account
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
