import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Star, Zap, Bug, Sparkles } from "lucide-react";

const changelogEntries = [
  {
    version: "2.4.0",
    date: "December 10, 2024",
    type: "feature" as const,
    title: "Email Suite Improvements",
    description: "New email signatures, improved inbox UI, and better email tracking.",
    items: [
      "Added email signature management",
      "Improved inbox performance",
      "New email analytics dashboard"
    ]
  },
  {
    version: "2.3.5",
    date: "December 8, 2024",
    type: "improvement" as const,
    title: "Board Portal Enhancements",
    description: "Enhanced investor sharing and new settings page for board members.",
    items: [
      "Board member settings page",
      "Improved investor access links",
      "New data mode toggles"
    ]
  },
  {
    version: "2.3.0",
    date: "December 5, 2024",
    type: "feature" as const,
    title: "CFO Studio V3",
    description: "Complete redesign of the financial modeling experience.",
    items: [
      "Single-page scrolling layout",
      "Real-time KPI updates",
      "Improved scenario switching"
    ]
  }
];

const getTypeBadge = (type: string) => {
  switch (type) {
    case "feature":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><Sparkles className="h-3 w-3 mr-1" />New Feature</Badge>;
    case "improvement":
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Zap className="h-3 w-3 mr-1" />Improvement</Badge>;
    case "bugfix":
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20"><Bug className="h-3 w-3 mr-1" />Bug Fix</Badge>;
    default:
      return <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Update</Badge>;
  }
};

export default function AdminChangelog() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Megaphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">What's New</h1>
          <p className="text-muted-foreground">Latest updates and improvements to Seeksy</p>
        </div>
      </div>

      <div className="space-y-6">
        {changelogEntries.map((entry, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{entry.title}</CardTitle>
                  {getTypeBadge(entry.type)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">v{entry.version}</span>
                  <span className="mx-2">•</span>
                  {entry.date}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{entry.description}</p>
              <ul className="space-y-2">
                {entry.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
