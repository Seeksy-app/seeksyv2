import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, Target, Mail, Phone } from "lucide-react";

export default function SalesLeads() {
  const leads = [
    { id: 1, name: "Acme Corp", contact: "Sarah Wilson", email: "sarah@acme.com", phone: "(555) 123-4567", value: "$50,000", status: "qualified", stage: "proposal" },
    { id: 2, name: "TechStart Inc", contact: "Mike Chen", email: "mike@techstart.com", phone: "(555) 234-5678", value: "$25,000", status: "new", stage: "discovery" },
    { id: 3, name: "Global Solutions", contact: "Emily Brown", email: "emily@global.com", phone: "(555) 345-6789", value: "$75,000", status: "qualified", stage: "negotiation" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Sales & Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage sales pipeline and lead conversion
          </p>
        </div>
        <Button>
          Add Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">156</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">42</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">$2.4M</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">27%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Leads</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="qualified">Qualified</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                      <Badge>{lead.status}</Badge>
                      <Badge variant="outline">{lead.stage}</Badge>
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3" />
                        {lead.contact}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{lead.value}</div>
                    <p className="text-xs text-muted-foreground">Deal Value</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="new">
          <p className="text-muted-foreground text-center py-8">New leads will appear here</p>
        </TabsContent>

        <TabsContent value="qualified">
          <p className="text-muted-foreground text-center py-8">Qualified leads will appear here</p>
        </TabsContent>

        <TabsContent value="closed">
          <p className="text-muted-foreground text-center py-8">Closed deals will appear here</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
