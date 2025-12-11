import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, FileText, MessageSquare, Shield, Clock, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

export default function VeteransHome() {
  const tools = [
    {
      title: "Military Buy-Back Calculator",
      description: "Calculate the cost and benefits of buying back your military time for federal retirement",
      icon: DollarSign,
      href: "/veterans/calculators/military-buyback",
      color: "text-emerald-500",
    },
    {
      title: "MRA Calculator",
      description: "Find your Minimum Retirement Age and earliest retirement eligibility date",
      icon: Clock,
      href: "/veterans/calculators/mra",
      color: "text-blue-500",
    },
    {
      title: "Sick Leave Calculator",
      description: "See how your unused sick leave converts to additional service credit",
      icon: Calculator,
      href: "/veterans/calculators/sick-leave",
      color: "text-purple-500",
    },
    {
      title: "AI Claims Agent",
      description: "Get personalized guidance on filing your VA disability claim with Intent to File",
      icon: MessageSquare,
      href: "/veterans/claims-agent",
      color: "text-orange-500",
      featured: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Veteran Benefits Made Simple</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Maximize Your{" "}
              <span className="text-primary">Federal Benefits</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Free calculators and AI-powered guidance to help veterans and federal employees 
              understand and claim the benefits they've earned.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link to="/veterans/claims-agent">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start Your Claim
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link to="/veterans/calculators/military-buyback">
                  <Calculator className="w-5 h-5 mr-2" />
                  Use Calculators
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </section>

      {/* Tools Grid */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Your Benefits Toolkit</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to understand and maximize your federal retirement benefits
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => (
            <Link key={tool.href} to={tool.href}>
              <Card className={`h-full transition-all hover:shadow-lg hover:border-primary/50 ${tool.featured ? 'border-2 border-primary/30 bg-primary/5' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg bg-background border ${tool.color}`}>
                      <tool.icon className="w-6 h-6" />
                    </div>
                    {tool.featured && (
                      <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded">
                        NEW
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-base">{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Why File Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why File an Intent to File?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Preserve Your Date</h3>
                <p className="text-muted-foreground">
                  Lock in today's date for potential retroactive pay while you gather evidence
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Maximize Benefits</h3>
                <p className="text-muted-foreground">
                  Get up to 1 year of retroactive benefits from your Intent to File date
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Risk</h3>
                <p className="text-muted-foreground">
                  Filing intent costs nothing and gives you time to prepare your claim properly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 container mx-auto px-4">
        <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Your Claim?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Our AI Claims Agent will walk you through the entire process, help you understand 
              your symptoms, and connect you with experts who can file on your behalf.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg">
              <Link to="/veterans/claims-agent">
                Talk to the Claims Agent
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
