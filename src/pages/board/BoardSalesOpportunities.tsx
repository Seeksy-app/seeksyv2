import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Award, Calendar, Sparkles, Trophy } from "lucide-react";

const opportunities = [
  {
    id: 1,
    title: "Veteran Podcast Awards",
    description: "Sponsorship and advertising opportunities for the Veteran Podcast Awards ceremony and related events.",
    icon: Trophy,
    link: "https://veteranpodcastawards.com/opportunity",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: 2,
    title: "National Military Podcast Day",
    description: "Partner with us for National Military Podcast Day - the premier celebration of military podcasting.",
    icon: Award,
    link: "https://veteranpodcastawards.com/",
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    id: 3,
    title: "Full Stack Event Management App",
    description: "Complete event management platform for conferences, summits, and live events.",
    icon: Calendar,
    link: "https://eventcrunch.co",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: 4,
    title: "Full Stack Awards Management App",
    description: "End-to-end awards management solution for nominations, judging, and ceremonies.",
    icon: Sparkles,
    link: "https://eventcrunch.co",
    gradient: "from-purple-500 to-pink-600",
  },
];

export default function BoardSalesOpportunities() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales Opportunities</h1>
        <p className="text-slate-600 mt-1">
          Explore partnership and sponsorship opportunities across our portfolio of products and events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {opportunities.map((opp) => {
          const Icon = opp.icon;
          return (
            <Card key={opp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opp.gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{opp.title}</CardTitle>
                    <CardDescription className="mt-1">{opp.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => window.open(opp.link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Learn More
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
