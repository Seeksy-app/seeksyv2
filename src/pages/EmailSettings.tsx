import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriberListManager } from "@/components/email/SubscriberListManager";
import { EmailAccountManager } from "@/components/email/EmailAccountManager";
import { Mail, List, Settings, TrendingUp } from "lucide-react";

export default function EmailSettings() {
  const [activeTab, setActiveTab] = useState("lists");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9]">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold text-foreground">Email Settings</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Manage your email accounts, subscriber lists, and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] h-auto">
            <TabsTrigger 
              value="accounts" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-6 py-2.5 rounded-lg"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Accounts
            </TabsTrigger>
            <TabsTrigger 
              value="lists"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-6 py-2.5 rounded-lg"
            >
              <List className="h-4 w-4 mr-2" />
              Subscriber Lists
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-6 py-2.5 rounded-lg"
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="deliverability"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-6 py-2.5 rounded-lg"
              disabled
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Deliverability
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-6">
            <EmailAccountManager />
          </TabsContent>

          <TabsContent value="lists" className="mt-6">
            <SubscriberListManager />
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <div className="bg-white rounded-xl p-8 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-lg font-semibold mb-4">Email Preferences</h3>
              <p className="text-muted-foreground">Global email preferences will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
