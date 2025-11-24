import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export function ProFormaSpreadsheetGenerator() {
  const [generating, setGenerating] = useState(false);

  const generateSpreadsheet = () => {
    setGenerating(true);
    
    try {
      const workbook = XLSX.utils.book_new();

      // TAB 1: Executive Summary
      const executiveSummary = generateExecutiveSummary();
      const ws1 = XLSX.utils.aoa_to_sheet(executiveSummary);
      XLSX.utils.book_append_sheet(workbook, ws1, "Executive Summary");

      // TAB 2: Assumptions
      const assumptions = generateAssumptions();
      const ws2 = XLSX.utils.aoa_to_sheet(assumptions);
      XLSX.utils.book_append_sheet(workbook, ws2, "Assumptions");

      // TAB 3: 36-Month Forecast
      const monthlyForecast = generateMonthlyForecast();
      const ws3 = XLSX.utils.aoa_to_sheet(monthlyForecast);
      XLSX.utils.book_append_sheet(workbook, ws3, "36-Month Forecast");

      // TAB 4: Annual Summary
      const annualSummary = generateAnnualSummary();
      const ws4 = XLSX.utils.aoa_to_sheet(annualSummary);
      XLSX.utils.book_append_sheet(workbook, ws4, "Annual Summary");

      // TAB 5: Revenue Breakdown
      const revenueBreakdown = generateRevenueBreakdown();
      const ws5 = XLSX.utils.aoa_to_sheet(revenueBreakdown);
      XLSX.utils.book_append_sheet(workbook, ws5, "Revenue Breakdown");

      // TAB 6: Cost Breakdown
      const costBreakdown = generateCostBreakdown();
      const ws6 = XLSX.utils.aoa_to_sheet(costBreakdown);
      XLSX.utils.book_append_sheet(workbook, ws6, "Cost Breakdown");

      // TAB 7: Unit Economics
      const unitEconomics = generateUnitEconomics();
      const ws7 = XLSX.utils.aoa_to_sheet(unitEconomics);
      XLSX.utils.book_append_sheet(workbook, ws7, "Unit Economics");

      // Generate file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Seeksy_ProForma_3Year_Financial_Model.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Pro forma spreadsheet generated successfully!");
    } catch (error) {
      console.error("Error generating spreadsheet:", error);
      toast.error("Failed to generate spreadsheet");
    } finally {
      setGenerating(false);
    }
  };

  const generateExecutiveSummary = () => {
    return [
      ["SEEKSY - EXECUTIVE SUMMARY", "", "", "", ""],
      ["3-Year Financial Pro Forma", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "Year 1", "Year 2", "Year 3", "Total"],
      ["Annual Revenue", "=SUM('36-Month Forecast'!B50:M50)", "=SUM('36-Month Forecast'!N50:Y50)", "=SUM('36-Month Forecast'!Z50:AK50)", "=SUM(B5:D5)"],
      ["Annual Costs", "=SUM('36-Month Forecast'!B65:M65)", "=SUM('36-Month Forecast'!N65:Y65)", "=SUM('36-Month Forecast'!Z65:AK65)", "=SUM(B6:D6)"],
      ["Net Profit", "=B5-B6", "=C5-C6", "=D5-D6", "=E5-E6"],
      ["", "", "", "", ""],
      ["Gross Margin %", "=(B5-B6)/B5", "=(C5-C6)/C5", "=(D5-D6)/D5", "=(E5-E6)/E5"],
      ["Net Margin %", "=B7/B5", "=C7/C5", "=D7/D5", "=E7/E5"],
      ["", "", "", "", ""],
      ["Average Users", "=AVERAGE('36-Month Forecast'!B10:M10)", "=AVERAGE('36-Month Forecast'!N10:Y10)", "=AVERAGE('36-Month Forecast'!Z10:AK10)", ""],
      ["Ending Users", "='36-Month Forecast'!M10", "='36-Month Forecast'!Y10", "='36-Month Forecast'!AK10", ""],
      ["YoY Growth %", "", "=(C13-B13)/B13", "=(D13-C13)/C13", ""],
      ["", "", "", "", ""],
      ["KEY DRIVERS", "", "", "", ""],
      ["Subscription ARPU", "=B5/B12", "=C5/C12", "=D5/D12", ""],
      ["CAC", "=Assumptions!B28", "", "", ""],
      ["LTV", "=(Assumptions!B6*12)/Assumptions!B31", "", "", ""],
      ["Payback Period (months)", "=Assumptions!B28/(Assumptions!B6*Assumptions!B31)", "", "", ""],
      ["", "", "", "", ""],
      ["KEY ASSUMPTIONS", "", "", "", ""],
      ["Starting Users", "=Assumptions!B14", "", "", ""],
      ["Monthly Growth %", "=Assumptions!B15", "", "", ""],
      ["Platform CPM", "=Assumptions!B20", "", "", ""],
      ["Ad Fill Rate", "=Assumptions!B22", "", "", ""],
    ];
  };

  const generateAssumptions = () => {
    return [
      ["SEEKSY - ASSUMPTIONS", "", ""],
      ["All pricing and growth assumptions", "", ""],
      ["", "", ""],
      ["SUBSCRIPTION PRICING (Monthly)", "", ""],
      ["Podcaster Basic", 29, ""],
      ["Podcaster Pro", 79, ""],
      ["Podcaster Enterprise", 199, ""],
      ["Event Creator", 49, ""],
      ["Event Organization", 149, ""],
      ["Political Campaign", 299, ""],
      ["My Page Basic", 19, ""],
      ["My Page Pro", 49, ""],
      ["Industry Creator", 99, ""],
      ["", "", ""],
      ["CUSTOMER GROWTH", "", ""],
      ["Starting Total Users", 100, ""],
      ["Monthly Growth Rate %", 15, "%"],
      ["", "", ""],
      ["SEGMENT DISTRIBUTION %", "", ""],
      ["Podcasters %", 35, "%"],
      ["Event Creators %", 20, "%"],
      ["Event Organizations %", 10, "%"],
      ["Political Campaigns %", 5, "%"],
      ["My Page Users %", 25, "%"],
      ["Industry Creators %", 5, "%"],
      ["", "", ""],
      ["AD REVENUE ASSUMPTIONS", "", ""],
      ["Platform CPM", 15, "per 1000"],
      ["Episodes per Podcaster/Month", 4, ""],
      ["Avg Listeners per Episode", 500, ""],
      ["Ad Fill Rate %", 65, "%"],
      ["Platform Rev Share %", 30, "%"],
      ["", "", ""],
      ["QUICK ADS - ADVERTISER PRICING", "", ""],
      ["Quick Ads Starter - Monthly", 199, "1 ad, 10k impressions"],
      ["Quick Ads Growth - Monthly", 499, "3 ads, 50k impressions"],
      ["Quick Ads Pro - Monthly", 999, "Unlimited ads, 200k impressions"],
      ["Quick Ads Enterprise - Low", 2500, "Custom campaigns"],
      ["Quick Ads Enterprise - High", 25000, "Full enterprise solution"],
      ["Quick Ads Avg Advertisers/Month", 50, "Starting count"],
      ["Quick Ads Growth Rate %", 20, "%"],
      ["Quick Ads Tier Mix: Starter %", 50, "%"],
      ["Quick Ads Tier Mix: Growth %", 30, "%"],
      ["Quick Ads Tier Mix: Pro %", 15, "%"],
      ["Quick Ads Tier Mix: Enterprise %", 5, "%"],
      ["", "", ""],
      ["COST STRUCTURE", "", ""],
      ["AI Compute Cost per User", 2.5, "per month"],
      ["Storage Cost per GB", 0.02, ""],
      ["Avg Storage per User (GB)", 5, ""],
      ["Bandwidth Cost per GB", 0.08, ""],
      ["Avg Bandwidth per User (GB)", 10, ""],
      ["Streaming Cost per Hour", 0.15, ""],
      ["Avg Streaming Hours per User", 5, ""],
      ["Support Cost per User", 1.5, "per month"],
      ["CAC (Customer Acquisition Cost)", 45, ""],
      ["Payment Processing Fee %", 2.9, "%"],
      ["Monthly Churn Rate %", 5, "%"],
    ];
  };

  const generateMonthlyForecast = () => {
    const headers = ["METRIC", ...Array.from({ length: 36 }, (_, i) => `Month ${i + 1}`)];
    
    const rows = [
      ["SEEKSY - 36 MONTH FORECAST"],
      [""],
      headers,
      [""],
      ["USER COUNTS"],
      ["Total Users", ...Array.from({ length: 36 }, (_, i) => 
        i === 0 
          ? "=Assumptions!B14" 
          : `=B10*(1+Assumptions!$B$15)`
      )],
      ["Podcasters", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$19`)],
      ["Event Creators", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$20`)],
      ["Event Organizations", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$21`)],
      ["Political Campaigns", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$22`)],
      ["My Page Users", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$23`)],
      ["Industry Creators", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$24`)],
      [""],
      ["REVENUE"],
      ["Podcaster Subscriptions", ...Array.from({ length: 36 }, (_, i) => `=B11*((Assumptions!$B$6*0.4)+(Assumptions!$B$7*0.4)+(Assumptions!$B$8*0.2))`)],
      ["Event Tools Revenue", ...Array.from({ length: 36 }, (_, i) => `=(B12*Assumptions!$B$9)+(B13*Assumptions!$B$10)`)],
      ["Political Campaign Revenue", ...Array.from({ length: 36 }, (_, i) => `=B14*Assumptions!$B$11`)],
      ["My Page Revenue", ...Array.from({ length: 36 }, (_, i) => `=B15*((Assumptions!$B$12*0.7)+(Assumptions!$B$13*0.3))`)],
      ["Industry Creator Revenue", ...Array.from({ length: 36 }, (_, i) => `=B16*Assumptions!$B$14`)],
      ["Podcast Ad Insertion Revenue", ...Array.from({ length: 36 }, (_, i) => `=(B11*Assumptions!$B$27*Assumptions!$B$28*(Assumptions!$B$26/1000)*Assumptions!$B$29)*Assumptions!$B$30`)],
      ["Quick Ads Advertiser Revenue", ...Array.from({ length: 36 }, (_, i) => {
        if (i === 0) {
          return `=(Assumptions!$B$38*Assumptions!$B$41*Assumptions!$B$33)+(Assumptions!$B$38*Assumptions!$B$42*Assumptions!$B$34)+(Assumptions!$B$38*Assumptions!$B$43*Assumptions!$B$35)+(Assumptions!$B$38*Assumptions!$B$44*((Assumptions!$B$36+Assumptions!$B$37)/2))`;
        }
        return `=(Assumptions!$B$38*(1+Assumptions!$B$39)^${i})*((Assumptions!$B$41*Assumptions!$B$33)+(Assumptions!$B$42*Assumptions!$B$34)+(Assumptions!$B$43*Assumptions!$B$35)+(Assumptions!$B$44*((Assumptions!$B$36+Assumptions!$B$37)/2)))`;
      })],
      ["Blog Module Revenue", ...Array.from({ length: 36 }, (_, i) => `=B10*0.15*25`)],
      ["RSS Auto-Posting Revenue", ...Array.from({ length: 36 }, (_, i) => `=B11*0.2*15`)],
      ["Auto-Publishing Tools", ...Array.from({ length: 36 }, (_, i) => `=B10*0.1*10`)],
      [""],
      ["TOTAL REVENUE", ...Array.from({ length: 36 }, (_, i) => `=SUM(B19:B27)`)],
      [""],
      ["COSTS"],
      ["AI Compute Costs", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$47`)],
      ["Storage Costs", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$49*Assumptions!$B$48`)],
      ["Bandwidth Costs", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$51*Assumptions!$B$50`)],
      ["Streaming Costs", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$53*Assumptions!$B$52`)],
      ["Support Costs", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$54`)],
      ["CAC (New Users)", ...Array.from({ length: 36 }, (_, i) => 
        i === 0 
          ? `=Assumptions!$B$14*Assumptions!$B$55` 
          : `=(B10-${String.fromCharCode(66 + Math.min(i - 1, 25))}10)*Assumptions!$B$55`
      )],
      ["Payment Processing", ...Array.from({ length: 36 }, (_, i) => `=B29*Assumptions!$B$56`)],
      ["Churn Impact", ...Array.from({ length: 36 }, (_, i) => `=B10*Assumptions!$B$57*((Assumptions!$B$6+Assumptions!$B$12)/2)`)],
      [""],
      ["TOTAL COSTS", ...Array.from({ length: 36 }, (_, i) => `=SUM(B32:B39)`)],
      [""],
      ["FINANCIAL METRICS"],
      ["Gross Margin", ...Array.from({ length: 36 }, (_, i) => `=B29-B41`)],
      ["Gross Margin %", ...Array.from({ length: 36 }, (_, i) => `=IF(B29>0,B44/B29,0)`)],
      ["Net Profit", ...Array.from({ length: 36 }, (_, i) => `=B29-B41`)],
      ["Net Margin %", ...Array.from({ length: 36 }, (_, i) => `=IF(B29>0,B46/B29,0)`)],
    ];

    return rows;
  };

  const generateAnnualSummary = () => {
    return [
      ["SEEKSY - ANNUAL SUMMARY"],
      [""],
      ["METRIC", "Year 1", "Year 2", "Year 3"],
      [""],
      ["Total Revenue", "=SUM('36-Month Forecast'!B29:M29)", "=SUM('36-Month Forecast'!N29:Y29)", "=SUM('36-Month Forecast'!Z29:AK29)"],
      ["Total Costs", "=SUM('36-Month Forecast'!B41:M41)", "=SUM('36-Month Forecast'!N41:Y41)", "=SUM('36-Month Forecast'!Z41:AK41)"],
      ["Net Profit", "=B5-B6", "=C5-C6", "=D5-D6"],
      [""],
      ["Average Users", "=AVERAGE('36-Month Forecast'!B10:M10)", "=AVERAGE('36-Month Forecast'!N10:Y10)", "=AVERAGE('36-Month Forecast'!Z10:AK10)"],
      ["Ending Users", "='36-Month Forecast'!M10", "='36-Month Forecast'!Y10", "='36-Month Forecast'!AK10"],
      ["User Growth", "=B10", "=C10-B10", "=D10-C10"],
      ["YoY Growth %", "", "=C11/B10", "=D11/C10"],
      [""],
      ["Gross Margin %", "=(B5-B6)/B5", "=(C5-C6)/C5", "=(D5-D6)/D5"],
      ["Net Margin %", "=B7/B5", "=C7/C5", "=D7/D5"],
      [""],
      ["ARPU (Annual)", "=B5/B9", "=C5/C9", "=D5/D9"],
      ["ARPU (Monthly)", "=B17/12", "=C17/12", "=D17/12"],
    ];
  };

  const generateRevenueBreakdown = () => {
    const headers = ["REVENUE STREAM", ...Array.from({ length: 36 }, (_, i) => `Month ${i + 1}`), "Year 1", "Year 2", "Year 3"];
    
    return [
      ["SEEKSY - REVENUE BREAKDOWN"],
      [""],
      headers,
      ["Podcaster Subscriptions", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}19`), "=SUM(B4:M4)", "=SUM(N4:Y4)", "=SUM(Z4:AK4)"],
      ["Event Tools", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}20`), "=SUM(B5:M5)", "=SUM(N5:Y5)", "=SUM(Z5:AK5)"],
      ["Political Campaigns", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}21`), "=SUM(B6:M6)", "=SUM(N6:Y6)", "=SUM(Z6:AK6)"],
      ["My Page", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}22`), "=SUM(B7:M7)", "=SUM(N7:Y7)", "=SUM(Z7:AK7)"],
      ["Industry Creators", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}23`), "=SUM(B8:M8)", "=SUM(N8:Y8)", "=SUM(Z8:AK8)"],
      ["Podcast Ad Insertion", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}24`), "=SUM(B9:M9)", "=SUM(N9:Y9)", "=SUM(Z9:AK9)"],
      ["Quick Ads (Advertisers)", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}25`), "=SUM(B10:M10)", "=SUM(N10:Y10)", "=SUM(Z10:AK10)"],
      ["Blog Module", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}26`), "=SUM(B11:M11)", "=SUM(N11:Y11)", "=SUM(Z11:AK11)"],
      ["RSS Auto-Posting", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}27`), "=SUM(B12:M12)", "=SUM(N12:Y12)", "=SUM(Z12:AK12)"],
      ["Auto-Publishing", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}28`), "=SUM(B13:M13)", "=SUM(N13:Y13)", "=SUM(Z13:AK13)"],
      [""],
      ["TOTAL REVENUE", ...Array.from({ length: 36 }, (_, i) => `=SUM(B4:B13)`), "=SUM(B15:M15)", "=SUM(N15:Y15)", "=SUM(Z15:AK15)"],
    ];
  };

  const generateCostBreakdown = () => {
    const headers = ["COST CATEGORY", ...Array.from({ length: 36 }, (_, i) => `Month ${i + 1}`), "Year 1", "Year 2", "Year 3"];
    
    return [
      ["SEEKSY - COST BREAKDOWN"],
      [""],
      headers,
      ["AI Compute", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}32`), "=SUM(B4:M4)", "=SUM(N4:Y4)", "=SUM(Z4:AK4)"],
      ["Storage", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}33`), "=SUM(B5:M5)", "=SUM(N5:Y5)", "=SUM(Z5:AK5)"],
      ["Bandwidth", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}34`), "=SUM(B6:M6)", "=SUM(N6:Y6)", "=SUM(Z6:AK6)"],
      ["Streaming", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}35`), "=SUM(B7:M7)", "=SUM(N7:Y7)", "=SUM(Z7:AK7)"],
      ["Support", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}36`), "=SUM(B8:M8)", "=SUM(N8:Y8)", "=SUM(Z8:AK8)"],
      ["CAC", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}37`), "=SUM(B9:M9)", "=SUM(N9:Y9)", "=SUM(Z9:AK9)"],
      ["Payment Processing", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}38`), "=SUM(B10:M10)", "=SUM(N10:Y10)", "=SUM(Z10:AK10)"],
      ["Churn Impact", ...Array.from({ length: 36 }, (_, i) => `='36-Month Forecast'!${String.fromCharCode(66 + i)}39`), "=SUM(B11:M11)", "=SUM(N11:Y11)", "=SUM(Z11:AK11)"],
      [""],
      ["TOTAL COSTS", ...Array.from({ length: 36 }, (_, i) => `=SUM(B4:B11)`), "=SUM(B13:M13)", "=SUM(N13:Y13)", "=SUM(Z13:AK13)"],
    ];
  };

  const generateUnitEconomics = () => {
    return [
      ["SEEKSY - UNIT ECONOMICS"],
      [""],
      ["SEGMENT", "Users (Avg)", "ARPU", "CAC", "LTV", "Gross Margin %", "Payback (Months)"],
      [""],
      ["Podcasters", "=AVERAGE('36-Month Forecast'!B11:AK11)", "=(Assumptions!B6*0.4+Assumptions!B7*0.4+Assumptions!B8*0.2)", "=Assumptions!B55", "=C5*12/Assumptions!B57", "=0.65", "=D5/C5"],
      ["Event Creators", "=AVERAGE('36-Month Forecast'!B12:AK12)", "=Assumptions!B9", "=Assumptions!B55", "=C6*12/Assumptions!B57", "=0.70", "=D6/C6"],
      ["Event Organizations", "=AVERAGE('36-Month Forecast'!B13:AK13)", "=Assumptions!B10", "=Assumptions!B55", "=C7*12/Assumptions!B57", "=0.72", "=D7/C7"],
      ["Political Campaigns", "=AVERAGE('36-Month Forecast'!B14:AK14)", "=Assumptions!B11", "=Assumptions!B55", "=C8*12/Assumptions!B57", "=0.75", "=D8/C8"],
      ["My Page Users", "=AVERAGE('36-Month Forecast'!B15:AK15)", "=(Assumptions!B12*0.7+Assumptions!B13*0.3)", "=Assumptions!B55", "=C9*12/Assumptions!B57", "=0.68", "=D9/C9"],
      ["Industry Creators", "=AVERAGE('36-Month Forecast'!B16:AK16)", "=Assumptions!B14", "=Assumptions!B55", "=C10*12/Assumptions!B57", "=0.73", "=D10/C10"],
      [""],
      ["QUICK ADS ADVERTISERS", "", "", "", "", "", ""],
      ["Starter Tier", "=Assumptions!B38*Assumptions!B41", "=Assumptions!B33", "=Assumptions!B55*2", "=C13*12/0.15", "=0.80", "=D13/C13"],
      ["Growth Tier", "=Assumptions!B38*Assumptions!B42", "=Assumptions!B34", "=Assumptions!B55*2", "=C14*12/0.15", "=0.82", "=D14/C14"],
      ["Pro Tier", "=Assumptions!B38*Assumptions!B43", "=Assumptions!B35", "=Assumptions!B55*2", "=C15*12/0.15", "=0.85", "=D15/C15"],
      ["Enterprise Tier", "=Assumptions!B38*Assumptions!B44", "=(Assumptions!B36+Assumptions!B37)/2", "=Assumptions!B55*3", "=C16*12/0.10", "=0.88", "=D16/C16"],
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Full 3-Year Pro Forma Spreadsheet
        </CardTitle>
        <CardDescription>
          Download a comprehensive Excel file with 7 tabs, all formulas, assumptions, and detailed financial projections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Included Tabs:</h4>
            <ul className="space-y-1 text-sm">
              <li>✓ Executive Summary - Investor-ready overview</li>
              <li>✓ Assumptions - All pricing, growth, and cost drivers</li>
              <li>✓ 36-Month Forecast - Detailed monthly projections</li>
              <li>✓ Annual Summary - Yearly rollups and KPIs</li>
              <li>✓ Revenue Breakdown - All revenue streams by product</li>
              <li>✓ Cost Breakdown - Infrastructure and scaling costs</li>
              <li>✓ Unit Economics - CAC, LTV, ARPU, payback by segment</li>
            </ul>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Revenue Streams Included:</h4>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>• Podcaster subscriptions (3 tiers)</li>
              <li>• Event tools (Creator + Org)</li>
              <li>• Political campaigns</li>
              <li>• My Page Basic & Pro</li>
              <li>• Industry creators</li>
              <li>• Podcast ad insertion</li>
              <li>• Quick Ads (4 advertiser tiers)</li>
              <li>• Blog module</li>
              <li>• RSS auto-posting</li>
              <li>• Auto-publishing tools</li>
            </ul>
          </div>

          <Button 
            onClick={generateSpreadsheet} 
            disabled={generating}
            size="lg"
            className="w-full"
          >
            {generating ? (
              "Generating..."
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download Full Pro Forma Spreadsheet (.xlsx)
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            All formulas reference the Assumptions tab. Edit assumptions in Excel to dynamically update all projections.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
