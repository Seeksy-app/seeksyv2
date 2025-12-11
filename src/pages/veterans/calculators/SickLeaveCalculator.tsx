import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Heart, Clock, Calendar, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { calculateSickLeave, SickLeaveResult } from "@/lib/veteranCalculators";

export default function SickLeaveCalculator() {
  const [sickLeaveHours, setSickLeaveHours] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [results, setResults] = useState<SickLeaveResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const calculated = calculateSickLeave({
      unusedSickLeaveHours: parseInt(sickLeaveHours),
      currentSalary: currentSalary ? parseFloat(currentSalary) : undefined,
    });
    
    setResults(calculated);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/veterans" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Veterans Home
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 px-4 py-2 rounded-full mb-4">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Sick Leave Calculator</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Convert Sick Leave to Service Credit
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how your unused sick leave hours boost your retirement annuity
          </p>
        </div>

        {!results ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Enter Your Sick Leave Balance
              </CardTitle>
              <CardDescription>
                Find your sick leave hours on your pay stub or leave statement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sickLeaveHours">Unused Sick Leave Hours</Label>
                  <Input 
                    type="number" 
                    id="sickLeaveHours"
                    placeholder="e.g., 1840"
                    value={sickLeaveHours}
                    onChange={(e) => setSickLeaveHours(e.target.value)}
                    className="text-lg h-14"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Full-time employees earn about 4 hours per pay period (104 hours/year)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentSalary">Current Annual Salary (optional)</Label>
                  <Input 
                    type="number" 
                    id="currentSalary"
                    placeholder="e.g., 85000"
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(e.target.value)}
                    className="text-lg h-14"
                  />
                  <p className="text-sm text-muted-foreground">
                    Adding salary helps estimate your annual benefit increase
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full text-lg">
                  Calculate My Credit
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Result */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Heart className="w-6 h-6 text-purple-500" />
                  Your Sick Leave Credit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{results.description}</p>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Hours</span>
                  </div>
                  <p className="text-3xl font-bold">{results.totalHours.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Work Days</span>
                  </div>
                  <p className="text-3xl font-bold">{results.daysEquivalent}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-muted-foreground">Service Credit</span>
                  </div>
                  {results.yearsCredit > 0 ? (
                    <p className="text-3xl font-bold text-emerald-600">
                      {results.yearsCredit}yr {results.monthsCredit}mo
                    </p>
                  ) : (
                    <p className="text-3xl font-bold text-emerald-600">{results.monthsCredit} months</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <span className="text-sm text-muted-foreground">Pension Boost</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-600">+{results.pensionIncrease}</p>
                </CardContent>
              </Card>
            </div>

            {/* Estimated Benefit */}
            {results.estimatedAnnualBenefit > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Estimated Annual Benefit Increase</p>
                    <p className="text-4xl font-bold text-emerald-600">
                      ${results.estimatedAnnualBenefit.toLocaleString('en-US', { maximumFractionDigits: 0 })}/year
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Conversion to Service Credit</h4>
                    <p className="text-sm text-muted-foreground">
                      Every 2,087 hours of sick leave = 1 full year of service credit
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Pension Calculation Impact</h4>
                    <p className="text-sm text-muted-foreground">
                      Additional service time is included in your total years when calculating your annuity
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Automatic at Retirement</h4>
                    <p className="text-sm text-muted-foreground">
                      Your unused sick leave is automatically applied—no special forms needed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setResults(null)} variant="outline" className="flex-1">
                Calculate Again
              </Button>
              <Button asChild className="flex-1">
                <Link to="/veterans/claims-agent">Talk to Claims Agent</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
