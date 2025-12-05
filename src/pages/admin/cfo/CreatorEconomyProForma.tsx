import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, Share2, Copy, Check, TrendingUp, Users, Sparkles, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { useCreatorEconomyProForma } from "@/hooks/useCreatorEconomyProForma";

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const CreatorEconomyProForma = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { 
    financialData, 
    assumptions, 
    baselineAssumptions,
    adjustmentPercent, 
    updateAdjustment 
  } = useCreatorEconomyProForma();

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.setFillColor(5, 56, 119);
      pdf.rect(0, 0, 210, 20, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("Seeksy Creator Economy - 3-Year Pro Forma", 10, 13);
      
      pdf.addImage(imgData, "PNG", 0, 25, imgWidth, imgHeight);
      
      pdf.save("seeksy-creator-economy-proforma.pdf");
      toast.success("PDF exported successfully!");
    } catch (error) {
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/proforma/creator-economy/share`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const chartData = financialData.years.map((year, idx) => ({
    year,
    revenue: financialData.revenue[idx],
    expenses: financialData.expenses[idx],
    ebitda: financialData.ebitda[idx],
    users: financialData.users[idx],
    subscriptionRevenue: financialData.subscriptionRevenue[idx],
    adRevenue: financialData.adRevenue[idx],
  }));

  const getScenarioLabel = () => {
    if (adjustmentPercent > 10) return "Optimistic";
    if (adjustmentPercent > 0) return "Growth";
    if (adjustmentPercent === 0) return "AI Baseline";
    if (adjustmentPercent > -10) return "Conservative";
    return "Pessimistic";
  };

  const getScenarioColor = () => {
    if (adjustmentPercent > 0) return "text-emerald-600";
    if (adjustmentPercent === 0) return "text-blue-600";
    return "text-amber-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CFO
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleCopyShareLink}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Share Link"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/proforma/creator-economy/share")}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Preview Share Page
            </Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={exporting}
              className="gap-2 bg-[#053877] hover:bg-[#053877]/90"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Download PDF"}
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-[#053877]">
              Creator Economy - 3-Year Pro Forma
            </h1>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Generated
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Financial projections based on podcasting & creator economy market research (Edison, Goldman Sachs, McKinsey 2024)
          </p>
        </div>

        {/* Adjustment Slider */}
        <Card className="mb-6 border-2 border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Scenario Adjustment
              <Badge className={getScenarioColor() + " ml-2"}>
                {getScenarioLabel()} ({adjustmentPercent > 0 ? "+" : ""}{adjustmentPercent}%)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Pessimistic (-20%)</span>
                <span className="font-medium text-foreground">AI Baseline (0%)</span>
                <span>Optimistic (+20%)</span>
              </div>
              <Slider
                value={[adjustmentPercent]}
                onValueChange={([value]) => updateAdjustment(value)}
                min={-20}
                max={20}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Adjust the slider to model conservative or optimistic scenarios. The AI baseline uses industry-standard growth assumptions from creator economy research.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div ref={contentRef}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="assumptions">AI Assumptions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-[#053877] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      2028 Projected Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-[#053877]">
                      {formatCurrency(financialData.revenue[2])}
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      +{(((financialData.revenue[2] - financialData.revenue[0]) / financialData.revenue[0]) * 100).toFixed(0)}% growth from 2026
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      2028 Projected EBITDA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-emerald-600">
                      {formatCurrency(financialData.ebitda[2])}
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      {((financialData.ebitda[2] / financialData.revenue[2]) * 100).toFixed(1)}% margin
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      2028 Active Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatNumber(financialData.users[2])}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Podcasters & Creators
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      3-Year CAGR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-amber-600">
                      {(Math.pow(financialData.revenue[2] / financialData.revenue[0], 1/2) * 100 - 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compound Annual Growth Rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Projections Table */}
              <Card className="rounded-lg">
                <CardHeader className="bg-[#053877] text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Subscription Revenue</TableHead>
                        <TableHead className="text-right">Ad Revenue</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">YoY Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.years.map((year, idx) => (
                        <TableRow key={year}>
                          <TableCell className="font-medium">{year}</TableCell>
                          <TableCell className="text-right">{formatCurrency(financialData.subscriptionRevenue[idx])}</TableCell>
                          <TableCell className="text-right">{formatCurrency(financialData.adRevenue[idx])}</TableCell>
                          <TableCell className="text-right font-semibold text-[#053877]">
                            {formatCurrency(financialData.revenue[idx])}
                          </TableCell>
                          <TableCell className="text-right">
                            {idx === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">
                                +{(((financialData.revenue[idx] - financialData.revenue[idx - 1]) / financialData.revenue[idx - 1]) * 100).toFixed(1)}%
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Operating Expenses Table */}
              <Card className="rounded-lg">
                <CardHeader className="bg-rose-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Operating Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Total Expenses</TableHead>
                        <TableHead className="text-right">% of Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.years.map((year, idx) => (
                        <TableRow key={year}>
                          <TableCell className="font-medium">{year}</TableCell>
                          <TableCell className="text-right text-rose-600">
                            {formatCurrency(financialData.expenses[idx])}
                          </TableCell>
                          <TableCell className="text-right">
                            {((financialData.expenses[idx] / financialData.revenue[idx]) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* EBITDA Table */}
              <Card className="rounded-lg">
                <CardHeader className="bg-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    EBITDA Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">EBITDA</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.years.map((year, idx) => (
                        <TableRow key={year}>
                          <TableCell className="font-medium">{year}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">
                            {formatCurrency(financialData.ebitda[idx])}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600">
                            {((financialData.ebitda[idx] / financialData.revenue[idx]) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              {/* Revenue Growth Chart */}
              <Card className="rounded-lg">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-[#053877]">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Growth Trajectory
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: '#6b7280' }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="subscriptionRevenue"
                          name="Subscription Revenue"
                          stackId="1"
                          stroke="#053877"
                          fill="#053877"
                          fillOpacity={0.8}
                        />
                        <Area
                          type="monotone"
                          dataKey="adRevenue"
                          name="Ad Revenue"
                          stackId="1"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.8}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* EBITDA Chart */}
              <Card className="rounded-lg">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                    EBITDA Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: '#6b7280' }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="ebitda" name="EBITDA" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* User Growth Chart */}
              <Card className="rounded-lg">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <Users className="h-5 w-5" />
                    User Growth Projection
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
                        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: '#6b7280' }} />
                        <Tooltip formatter={(value: number) => formatNumber(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="users"
                          name="Active Users"
                          stroke="#9333ea"
                          strokeWidth={3}
                          dot={{ fill: '#9333ea', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assumptions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI-Generated Market Assumptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Industry Growth Rates (CAGR)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Based on Edison Research, Goldman Sachs, McKinsey, and eMarketer (2024)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Podcasting Market</span>
                        <Badge variant="secondary">{(baselineAssumptions.podcastingGrowthRate * 100)}%</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Creator Economy</span>
                        <Badge variant="secondary">{(baselineAssumptions.creatorEconomyGrowthRate * 100)}%</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>AI Tools Adoption</span>
                        <Badge variant="secondary">{(baselineAssumptions.aiToolsAdoptionRate * 100)}%</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Digital Advertising</span>
                        <Badge variant="secondary">{(baselineAssumptions.digitalAdGrowthRate * 100)}%</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Pricing Model (Monthly)</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead>Target Segment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Basic</TableCell>
                          <TableCell className="text-right">${baselineAssumptions.basicPlanPrice}</TableCell>
                          <TableCell>Individual creators, hobbyists</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Pro</TableCell>
                          <TableCell className="text-right">${baselineAssumptions.proPlanPrice}</TableCell>
                          <TableCell>Professional podcasters</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Enterprise</TableCell>
                          <TableCell className="text-right">${baselineAssumptions.enterprisePlanPrice}</TableCell>
                          <TableCell>Podcast networks, agencies</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Ad Revenue Model</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Average CPM</span>
                        <Badge variant="secondary">${baselineAssumptions.avgCPM}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Platform Revenue Share</span>
                        <Badge variant="secondary">{(baselineAssumptions.adRevShare * 100)}%</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Current Adjusted Values</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      With {adjustmentPercent > 0 ? "+" : ""}{adjustmentPercent}% adjustment applied
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Starting Podcasters</p>
                        <p className="text-xl font-bold text-purple-600">{formatNumber(assumptions.startingPodcasters)}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Starting Creators</p>
                        <p className="text-xl font-bold text-purple-600">{formatNumber(assumptions.startingCreators)}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Monthly Growth Rate</p>
                        <p className="text-xl font-bold text-purple-600">{(assumptions.monthlyGrowthRate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CreatorEconomyProForma;
