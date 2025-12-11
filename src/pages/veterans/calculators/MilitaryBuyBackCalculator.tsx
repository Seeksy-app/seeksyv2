import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calculator, DollarSign, Calendar, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { calculateMilitaryBuyBack, MilitaryBuyBackResult } from "@/lib/veteranCalculators";

const BRANCHES = ["Army", "Navy", "Air Force", "Marine Corps", "Coast Guard", "Space Force"];
const GRADES = [
  "E-1", "E-2", "E-3", "E-4", "E-5", "E-6", "E-7", "E-8", "E-9",
  "W-1", "W-2", "W-3", "W-4", "W-5",
  "O-1", "O-2", "O-3", "O-4", "O-5", "O-6"
];

export default function MilitaryBuyBackCalculator() {
  const [formData, setFormData] = useState({
    branch: "",
    payEntryDate: "",
    separationDate: "",
    separationGrade: "",
    fedStartDate: "",
    retirementPlan: "",
    yearsToRetirement: "",
    annualBasePay: "",
  });
  const [results, setResults] = useState<MilitaryBuyBackResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const calculated = calculateMilitaryBuyBack({
      branch: formData.branch,
      payEntryDate: new Date(formData.payEntryDate),
      separationDate: new Date(formData.separationDate),
      separationGrade: formData.separationGrade.replace("-", ""),
      fedStartDate: new Date(formData.fedStartDate),
      retirementPlan: formData.retirementPlan as 'fers' | 'csrs',
      yearsToRetirement: parseInt(formData.yearsToRetirement),
      annualBasePay: parseFloat(formData.annualBasePay),
    });
    
    setResults(calculated);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/veterans" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Veterans Home
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full mb-4">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Military Buy-Back Calculator</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Calculate Your Military Service Deposit
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how buying back your military time can increase your federal retirement annuity
          </p>
        </div>

        {!results ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Enter Your Information
              </CardTitle>
              <CardDescription>
                All fields are required for an accurate calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch of Service</Label>
                    <Select value={formData.branch} onValueChange={(v) => handleChange("branch", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map(b => (
                          <SelectItem key={b} value={b.toLowerCase()}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="separationGrade">Separation Grade</Label>
                    <Select value={formData.separationGrade} onValueChange={(v) => handleChange("separationGrade", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payEntryDate">Pay Entry Base Date (PEBD)</Label>
                    <Input 
                      type="date" 
                      id="payEntryDate"
                      value={formData.payEntryDate}
                      onChange={(e) => handleChange("payEntryDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="separationDate">Separation Date</Label>
                    <Input 
                      type="date" 
                      id="separationDate"
                      value={formData.separationDate}
                      onChange={(e) => handleChange("separationDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fedStartDate">Federal Employment Start Date</Label>
                    <Input 
                      type="date" 
                      id="fedStartDate"
                      value={formData.fedStartDate}
                      onChange={(e) => handleChange("fedStartDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retirementPlan">Retirement Plan</Label>
                    <Select value={formData.retirementPlan} onValueChange={(v) => handleChange("retirementPlan", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fers">FERS</SelectItem>
                        <SelectItem value="csrs">CSRS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearsToRetirement">Years Until Retirement</Label>
                    <Input 
                      type="number" 
                      id="yearsToRetirement"
                      placeholder="e.g., 15"
                      value={formData.yearsToRetirement}
                      onChange={(e) => handleChange("yearsToRetirement", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualBasePay">Current Annual Base Pay ($)</Label>
                    <Input 
                      type="number" 
                      id="annualBasePay"
                      placeholder="e.g., 85000"
                      value={formData.annualBasePay}
                      onChange={(e) => handleChange("annualBasePay", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-lg">
                  Calculate My Buy-Back
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Recommendation Card */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                  Analysis Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{results.recommendation}</p>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Military Service</span>
                  </div>
                  <p className="text-3xl font-bold">{results.totalMilitaryService.toFixed(1)} years</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                    <span className="text-sm text-muted-foreground">Total Deposit</span>
                  </div>
                  <p className="text-3xl font-bold">${results.depositAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-sm text-muted-foreground">Including ${results.interestAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} interest</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-muted-foreground">Annual Increase</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">+${results.annuityIncrease.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-sm text-muted-foreground">Added to your pension yearly</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-1">Lump Sum</h4>
                    <p className="text-2xl font-bold">${results.depositAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-1">Monthly Installments</h4>
                    <p className="text-2xl font-bold">${results.monthlyPaymentOption.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Break-Even */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Break-Even Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recoup investment in</p>
                    <p className="text-4xl font-bold text-primary">{results.breakEvenYears.toFixed(1)} years</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">20-year lifetime benefit</p>
                    <p className="text-4xl font-bold text-emerald-600">${results.lifetimeBenefit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
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
