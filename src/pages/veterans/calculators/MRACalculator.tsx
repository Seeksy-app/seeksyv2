import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Clock, Calendar, Award, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { calculateMRA, MRAResult } from "@/lib/veteranCalculators";
import { format } from "date-fns";

export default function MRACalculator() {
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    startDate: "",
    hasMilitaryService: "no",
    hasSpecialProvisions: false,
  });
  const [results, setResults] = useState<MRAResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const calculated = calculateMRA({
      dateOfBirth: new Date(formData.dateOfBirth),
      startDate: new Date(formData.startDate),
      hasMilitaryService: formData.hasMilitaryService === "yes",
      hasSpecialProvisions: formData.hasSpecialProvisions,
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
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">MRA Calculator</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Find Your Minimum Retirement Age
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover when you're eligible for federal retirement based on your birth year
          </p>
        </div>

        {!results ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Enter Your Information
              </CardTitle>
              <CardDescription>
                We'll calculate your MRA based on OPM FERS retirement rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input 
                      type="date" 
                      id="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Federal Service Start Date</Label>
                    <Input 
                      type="date" 
                      id="startDate"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Do you have creditable military service?</Label>
                  <RadioGroup 
                    value={formData.hasMilitaryService}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, hasMilitaryService: v }))}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="military-yes" />
                      <Label htmlFor="military-yes" className="font-normal">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="military-no" />
                      <Label htmlFor="military-no" className="font-normal">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="specialProvisions"
                    checked={formData.hasSpecialProvisions}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSpecialProvisions: !!checked }))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="specialProvisions" className="font-normal cursor-pointer">
                      Special Provisions (6c) Employee
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Law Enforcement Officers, Firefighters, Air Traffic Controllers
                    </p>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-lg">
                  Calculate My MRA
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Result Card */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Award className="w-6 h-6 text-blue-500" />
                  Your Retirement Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Minimum Retirement Age (MRA)</p>
                    <p className="text-5xl font-bold text-primary">
                      {results.mraYears}
                      <span className="text-2xl text-muted-foreground ml-1">years</span>
                    </p>
                    {results.mraMonths > 0 && (
                      <p className="text-lg text-muted-foreground">{results.mraMonths} months</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Earliest Eligibility Date</p>
                    <p className="text-3xl font-bold text-primary">
                      {format(results.retirementEligibilityDate, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Required */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Service at MRA</span>
                </div>
                <p className="text-3xl font-bold">
                  {results.yearsOfServiceNeeded} years, {results.monthsOfServiceNeeded} months
                </p>
              </CardContent>
            </Card>

            {/* Special Provisions */}
            {results.specialProvisionAge && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold">Special Provision Eligible</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    Retire at age {results.specialProvisionAge} with 20 years
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Retirement Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Your Retirement Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">{results.canRetireAt}</p>
                
                <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
                  <p><strong>MRA + 30 years:</strong> Full unreduced annuity</p>
                  <p><strong>Age 60 + 20 years:</strong> Full unreduced annuity</p>
                  <p><strong>Age 62 + 5 years:</strong> Full unreduced annuity</p>
                  <p><strong>MRA + 10 years:</strong> Reduced annuity (5% per year under 62)</p>
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
