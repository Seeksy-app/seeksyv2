import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssumptionsTab } from "@/components/cfo/AssumptionsTab";
import { ScenariosTab } from "@/components/cfo/ScenariosTab";
import { CreatorEarningsTab } from "@/components/cfo/CreatorEarningsTab";
import { InvestorViewTab } from "@/components/cfo/InvestorViewTab";
import { DollarSign, TrendingUp, Users, PresentationIcon } from "lucide-react";

export default function AdFinancialModels() {
  const [activeTab, setActiveTab] = useState("assumptions");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Ad Revenue Financial Model
          </h1>
          <p className="text-muted-foreground mt-1">
            12-36 month projections, scenario planning, and investor reporting
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assumptions" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Assumptions
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Scenarios
          </TabsTrigger>
          <TabsTrigger value="earnings" className="gap-2">
            <Users className="h-4 w-4" />
            Creator Earnings
          </TabsTrigger>
          <TabsTrigger value="investor" className="gap-2">
            <PresentationIcon className="h-4 w-4" />
            Investor View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assumptions" className="space-y-4">
          <AssumptionsTab />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <ScenariosTab />
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <CreatorEarningsTab />
        </TabsContent>

        <TabsContent value="investor" className="space-y-4">
          <InvestorViewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
