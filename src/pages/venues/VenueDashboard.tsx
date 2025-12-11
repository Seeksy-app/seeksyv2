import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarPlus, 
  UserPlus, 
  FileText, 
  Megaphone, 
  Mail,
  TrendingUp,
  CalendarCheck,
  Users,
  DollarSign,
  Clock
} from "lucide-react";

const stats = [
  { label: "Upcoming Events", value: "12", icon: CalendarCheck, change: "+3 this week" },
  { label: "Active Clients", value: "48", icon: Users, change: "+5 this month" },
  { label: "Revenue (MTD)", value: "$42,500", icon: DollarSign, change: "+12% vs last month" },
  { label: "Pending Inquiries", value: "7", icon: Clock, change: "Respond within 24h" },
];

const quickActions = [
  { label: "Add new inquiry", icon: UserPlus, color: "#2C6BED" },
  { label: "Schedule tour", icon: CalendarPlus, color: "#10B981" },
  { label: "Create proposal", icon: FileText, color: "#8B5CF6" },
  { label: "Plan campaign", icon: Megaphone, color: "#F59E0B" },
  { label: "Send email", icon: Mail, color: "#EF4444" },
];

const upcomingEvents = [
  { name: "Smith Wedding", date: "Dec 15, 2025", space: "Grand Ballroom", guests: 150 },
  { name: "TechCorp Annual Meeting", date: "Dec 18, 2025", space: "Conference Hall A", guests: 75 },
  { name: "Johnson Anniversary", date: "Dec 20, 2025", space: "Garden Terrace", guests: 50 },
  { name: "New Year Gala", date: "Dec 31, 2025", space: "Grand Ballroom", guests: 300 },
];

const recentLeads = [
  { name: "Emily Parker", event: "Wedding", date: "Dec 10, 2025", status: "New" },
  { name: "Acme Corp", event: "Corporate Event", date: "Dec 9, 2025", status: "Contacted" },
  { name: "David Chen", event: "Birthday Party", date: "Dec 8, 2025", status: "Tour Scheduled" },
];

export default function VenueDashboard() {
  return (
    <VenueLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening at your venue today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:bg-gray-50"
                >
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                  <span className="text-xs text-gray-700">{action.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-600">{event.space} • {event.guests} guests</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Leads</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-600">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeads.map((lead, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-gray-900">{lead.name}</p>
                    <p className="text-sm text-gray-600">{lead.event} • Inquired {lead.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lead.status === 'New' ? 'bg-green-100 text-green-700' :
                      lead.status === 'Contacted' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {lead.status}
                    </span>
                    <Button size="sm" variant="outline">
                      Follow Up
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Prompt */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-blue-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-lg font-semibold mb-1">Need help with your venue?</h3>
              <p className="text-white/80">Ask Mia, your AI venue coordinator, for assistance with bookings, proposals, or planning.</p>
            </div>
            <Button variant="secondary" className="shrink-0">
              Chat with Mia
            </Button>
          </CardContent>
        </Card>
      </div>
    </VenueLayout>
  );
}
