import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Users, DollarSign, Zap, Target, Award, Sparkles } from "lucide-react";

// Chart Data
const creatorEconomyGrowth = [
  { year: "2021", value: 104, label: "$104B" },
  { year: "2022", value: 127, label: "$127B" },
  { year: "2023", value: 156, label: "$156B" },
  { year: "2024", value: 192, label: "$192B" },
  { year: "2025", value: 235, label: "$235B" },
  { year: "2026", value: 287, label: "$287B" },
  { year: "2027", value: 350, label: "$350B" },
];

const podcastRevenueGrowth = [
  { year: "2021", value: 1.3, label: "$1.3B" },
  { year: "2022", value: 1.8, label: "$1.8B" },
  { year: "2023", value: 2.4, label: "$2.4B" },
  { year: "2024", value: 3.1, label: "$3.1B" },
  { year: "2025", value: 4.0, label: "$4.0B" },
  { year: "2026", value: 5.2, label: "$5.2B" },
];

const engagementToolsDemand = [
  { category: "Live Sessions", growth: 145, color: "hsl(var(--chart-1))" },
  { category: "Meetings", growth: 132, color: "hsl(var(--chart-2))" },
  { category: "Events", growth: 128, color: "hsl(var(--chart-3))" },
  { category: "Workshops", growth: 118, color: "hsl(var(--chart-4))" },
  { category: "Scheduling", growth: 115, color: "hsl(var(--chart-5))" },
];

const revenueStreams = [
  { name: "Subscriptions", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Ad Revenue Share", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Event Tickets", value: 15, color: "hsl(var(--chart-3))" },
  { name: "Premium Tools", value: 10, color: "hsl(var(--chart-4))" },
  { name: "Analytics", value: 5, color: "hsl(var(--chart-5))" },
];

const valueChain = [
  { stage: "Content Creation", seeksy: 85, traditional: 45 },
  { stage: "Audience Engagement", seeksy: 92, traditional: 35 },
  { stage: "Monetization", seeksy: 88, traditional: 50 },
  { stage: "Analytics", seeksy: 90, traditional: 60 },
  { stage: "Distribution", seeksy: 87, traditional: 75 },
];

const monetizationFlow = [
  { month: "M1", creator: 250, platform: 75 },
  { month: "M3", creator: 420, platform: 130 },
  { month: "M6", creator: 680, platform: 205 },
  { month: "M9", creator: 950, platform: 285 },
  { month: "M12", creator: 1250, platform: 375 },
  { month: "M18", creator: 1800, platform: 540 },
  { month: "M24", creator: 2450, platform: 735 },
];

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
};

export function BusinessModelTab() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-200/20">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            Seeksy Business Model
          </CardTitle>
          <CardDescription className="text-base">
            A comprehensive overview of how Seeksy creates value in the rapidly growing creator economy
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">
            Seeksy is an all-in-one platform designed to empower podcasters, creators, and event hosts 
            with the tools they need to grow, engage, and monetize their audiences. We combine content 
            creation, live interaction, and business tools into a single, integrated ecosystem.
          </p>
          <p className="text-base leading-relaxed">
            Unlike traditional platforms that focus solely on content distribution, Seeksy enables 
            <strong> direct audience engagement</strong> through meetings, live events, interactive sessions, 
            and booking tools—giving creators new ways to connect with their communities and generate revenue 
            beyond advertising alone.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 pt-4">
            <div className="p-5 bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-lg border border-purple-200/20">
              <Users className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-semibold text-lg mb-1">Who We Serve</h4>
              <p className="text-sm text-muted-foreground">
                Podcasters, content creators, event hosts, educators, and small businesses building engaged communities
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-pink-500/5 to-pink-600/5 rounded-lg border border-pink-200/20">
              <Target className="h-8 w-8 text-pink-600 mb-3" />
              <h4 className="font-semibold text-lg mb-1">What We Solve</h4>
              <p className="text-sm text-muted-foreground">
                Fragmented tools, limited engagement options, and difficulty monetizing beyond ads and sponsorships
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-lg border border-blue-200/20">
              <Award className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-lg mb-1">Our Edge</h4>
              <p className="text-sm text-muted-foreground">
                Unified platform combining content, engagement, and monetization with AI-powered tools and seamless workflows
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Industry Trends & Opportunity</CardTitle>
          <CardDescription>
            Why now? The creator economy and podcast industry are experiencing explosive growth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Key Market Insights:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Creator Economy Growth:</strong> Expected to reach $350B by 2027, growing at 30%+ CAGR 
                  (Source: Goldman Sachs, SignalFire)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Podcasting Boom:</strong> Podcast industry revenue projected to exceed $5.2B by 2026, 
                  with 160M+ listeners in the U.S. alone (IAB, Edison Research)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Direct Engagement Demand:</strong> 78% of creators report needing better tools for audience 
                  interaction beyond social media (Creator Economy Report 2024)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Live Session Growth:</strong> Live events, workshops, and one-on-one meetings grew 145% 
                  YoY as creators seek higher-value interactions (Eventbrite, Patreon data)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Platform Fragmentation Pain:</strong> Average creator uses 6-8 different tools to manage 
                  content, bookings, payments, and analytics—creating inefficiency and missed revenue opportunities
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Shift to Private Communities:</strong> Creators are moving audiences away from algorithm-driven 
                  platforms toward owned channels (email, memberships, direct bookings) for predictable income
                </span>
              </li>
            </ul>
          </div>

          {/* Chart: Creator Economy Growth */}
          <div>
            <h4 className="font-semibold mb-4">Creator Economy Market Size (Billions)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={creatorEconomyGrowth}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart: Podcast Revenue Growth */}
          <div>
            <h4 className="font-semibold mb-4">Podcast Industry Revenue Projection (Billions)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={podcastRevenueGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-2))', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart: Engagement Tools Demand */}
          <div>
            <h4 className="font-semibold mb-4">Growth in Engagement Tools Demand (YoY %)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementToolsDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="growth" radius={[8, 8, 0, 0]}>
                  {engagementToolsDemand.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Why Seeksy Exists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Why Seeksy Exists</CardTitle>
          <CardDescription>
            Solving critical pain points in the creator economy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">
            Creators face a fundamental challenge: <strong>how to build sustainable income without relying solely 
            on unpredictable ad revenue or platform algorithms.</strong> Traditional platforms offer content hosting 
            but lack the engagement and monetization tools creators need to thrive.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg text-red-600">❌ Problems Creators Face</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Using 6-8 different tools (Calendly, Zoom, Patreon, YouTube, email, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Limited monetization beyond ads and sponsorships</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>No direct booking or meeting capabilities built into content platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Difficulty tracking audience engagement and revenue analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Missed revenue opportunities from high-value interactions (coaching, workshops, consulting)</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-lg text-green-600">✓ How Seeksy Solves This</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>All-in-one platform: podcasting, meetings, events, booking, payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Multiple revenue streams: subscriptions, tickets, bookings, ad-share</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Built-in meeting and event tools—no external integrations needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Unified analytics dashboard showing revenue, engagement, and growth metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>AI-powered tools for content creation, editing, and audience insights</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Our Revenue Model
          </CardTitle>
          <CardDescription>
            How Seeksy earns revenue while helping creators succeed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-base leading-relaxed">
              Seeksy generates revenue through a <strong>diversified, scalable model</strong> that aligns our 
              success with creator growth. As creators earn more, we earn more—creating a true partnership.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  Subscription Revenue
                </h4>
                <p className="text-sm text-muted-foreground">
                  Monthly and annual subscriptions for podcasters ($19-$199/mo), My Page users ($9-$29/mo), 
                  and event creators ($29/mo). Tiered pricing based on features and usage.
                </p>
              </div>

              <div className="p-4 bg-pink-500/5 rounded-lg border border-pink-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Ad Revenue Share
                </h4>
                <p className="text-sm text-muted-foreground">
                  Platform earns 30% of ad revenue generated through podcast ad-insertion and display ads. 
                  Creators keep 70%, ensuring mutual benefit from audience growth.
                </p>
              </div>

              <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">🎟️</span>
                  Event Ticketing Fees
                </h4>
                <p className="text-sm text-muted-foreground">
                  Small percentage fee (5-10%) on paid event tickets, workshops, and virtual conferences 
                  hosted through Seeksy's event platform.
                </p>
              </div>

              <div className="p-4 bg-green-500/5 rounded-lg border border-green-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">🔧</span>
                  Premium Tools & Add-ons
                </h4>
                <p className="text-sm text-muted-foreground">
                  Advanced AI editing, analytics dashboards, custom branding, priority support, and 
                  enterprise-level features available as upgrades.
                </p>
              </div>

              <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  Booking & Meeting Fees
                </h4>
                <p className="text-sm text-muted-foreground">
                  Small platform fee on paid bookings (coaching sessions, consulting calls, workshops) 
                  scheduled through Seeksy's integrated calendar and meeting tools.
                </p>
              </div>

              <div className="p-4 bg-indigo-500/5 rounded-lg border border-indigo-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  Enterprise & White-Label
                </h4>
                <p className="text-sm text-muted-foreground">
                  Custom enterprise solutions for agencies, networks, and large creator teams requiring 
                  white-label branding and advanced team collaboration features.
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Streams Chart */}
          <div>
            <h4 className="font-semibold mb-4">Revenue Mix by Stream</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueStreams}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueStreams.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* How Creators Benefit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">How Creators Benefit</CardTitle>
          <CardDescription>
            Why Seeksy creates more value for creators than traditional platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-lg border border-purple-200/20">
              <Zap className="h-6 w-6 text-purple-600 mb-2" />
              <h4 className="font-semibold mb-2">More Revenue Streams</h4>
              <p className="text-sm text-muted-foreground">
                Earn from subscriptions, ad-share, event tickets, bookings, and premium content—all in one place
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-pink-500/5 to-pink-600/5 rounded-lg border border-pink-200/20">
              <Users className="h-6 w-6 text-pink-600 mb-2" />
              <h4 className="font-semibold mb-2">Deeper Engagement</h4>
              <p className="text-sm text-muted-foreground">
                Connect directly with your audience through live meetings, events, workshops, and interactive sessions
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-lg border border-blue-200/20">
              <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-semibold mb-2">Unified Platform</h4>
              <p className="text-sm text-muted-foreground">
                Replace 6-8 tools with one seamless platform—save time, reduce costs, increase efficiency
              </p>
            </div>
          </div>

          {/* Value Chain Comparison */}
          <div>
            <h4 className="font-semibold mb-4">Seeksy vs Traditional Platforms: Value Delivered</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valueChain}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="seeksy" fill="hsl(var(--chart-1))" name="Seeksy" radius={[8, 8, 0, 0]} />
                <Bar dataKey="traditional" fill="hsl(var(--muted))" name="Traditional Platforms" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monetization Flow */}
          <div>
            <h4 className="font-semibold mb-4">Creator Earnings Growth Over Time (Average Creator)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monetizationFlow}>
                <defs>
                  <linearGradient id="colorCreator" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPlatform" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="creator" 
                  stroke="hsl(var(--chart-1))" 
                  fillOpacity={1} 
                  fill="url(#colorCreator)"
                  name="Creator Earnings ($)"
                />
                <Area 
                  type="monotone" 
                  dataKey="platform" 
                  stroke="hsl(var(--chart-2))" 
                  fillOpacity={1} 
                  fill="url(#colorPlatform)"
                  name="Platform Revenue ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              As creators grow their audience and earnings, Seeksy scales proportionally—aligning our success with creator success
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-200/20">
        <CardHeader>
          <CardTitle className="text-2xl">Summary: The Opportunity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">
            Seeksy is positioned at the intersection of three massive, high-growth markets: the creator economy 
            ($350B+ by 2027), podcasting ($5.2B+ by 2026), and live engagement tools (145% YoY growth). We solve 
            critical pain points for creators who are frustrated by platform fragmentation, limited monetization 
            options, and lack of direct audience engagement capabilities.
          </p>
          <p className="text-base leading-relaxed">
            Our business model is <strong>diversified, scalable, and aligned with creator success</strong>. We earn 
            from subscriptions, ad-share, event fees, bookings, and premium tools—creating multiple revenue streams 
            that grow as our creators grow. Unlike ad-only platforms, Seeksy enables creators to build sustainable, 
            predictable income through direct relationships with their audiences.
          </p>
          <p className="text-base leading-relaxed font-semibold">
            As the creator economy continues to shift toward private communities, live interactions, and direct 
            monetization, Seeksy is uniquely positioned to become the go-to platform for creators who want to own 
            their audience relationships and maximize their earning potential.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
