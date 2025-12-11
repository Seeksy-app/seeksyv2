import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, FileText, MessageSquare, Shield, Clock, DollarSign, Award, TrendingUp, Heart, CheckCircle, Calendar, MapPin, GraduationCap, Stethoscope, Home, Car, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { BenefitsOfRatingModal } from "@/components/veterans/BenefitsOfRatingModal";
import { VeteransFaq } from "@/components/veterans/VeteransFaq";
import { Helmet } from "react-helmet";
import { CALCULATORS, CALCULATOR_CATEGORIES } from "@/lib/veteranCalculatorRegistry";

const ICON_MAP: Record<string, any> = {
  DollarSign, Clock, Calculator, MessageSquare, Shield, Award, TrendingUp, Heart, 
  CheckCircle, Calendar, MapPin, GraduationCap, Stethoscope, Home, Car, Scale,
};

export default function VeteransHome() {
  const featuredTools = [
    {
      title: "AI Claims Agent",
      description: "Get personalized guidance on filing your VA disability claim with Intent to File support",
      icon: MessageSquare,
      href: "/veterans/claims-agent",
      color: "text-orange-500",
      featured: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Military & Federal Benefits Hub | Seeksy</title>
        <meta name="description" content="Your all-in-one guide to maximizing federal and VA benefits — calculators, claim prep, and AI-powered support." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Military & Federal Benefits Hub</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Maximize Your{" "}
              <span className="text-primary">Federal&nbsp;Benefits</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Free calculators and AI-powered guidance to help service members, veterans, and federal employees understand and claim the benefits they've&nbsp;earned.
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

      {/* AI Claims Agent Featured */}
      <section className="py-12 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/veterans/claims-agent">
            <Card className="border-2 border-primary/30 bg-primary/5 transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-lg bg-background border text-orange-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded">
                    AI-POWERED
                  </span>
                </div>
                <CardTitle className="text-xl">AI Claims Agent</CardTitle>
                <CardDescription className="text-base">Get personalized guidance on filing your VA disability claim with Intent to File support</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {/* Calculators by Category */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Your Benefits Toolkit</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            20+ calculators and tools to understand and maximize your benefits
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-12">
          {CALCULATOR_CATEGORIES.filter(cat => cat.id !== 'Assistant').map((category) => {
            const categoryCalcs = CALCULATORS.filter(c => c.category === category.id);
            if (categoryCalcs.length === 0) return null;
            
            return (
              <div key={category.id}>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className={category.color}>{category.label}</span>
                  <span className="text-sm text-muted-foreground font-normal">({categoryCalcs.length} tools)</span>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryCalcs.map((calc) => {
                    const IconComponent = ICON_MAP[calc.icon] || Calculator;
                    return (
                      <Link key={calc.id} to={calc.route}>
                        <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-muted ${calc.color}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base leading-tight">{calc.title}</CardTitle>
                                <CardDescription className="text-sm mt-1 line-clamp-2">{calc.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
                <p className="text-muted-foreground text-balance">
                  Lock in today's date for potential retroactive pay while you gather&nbsp;evidence
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Maximize Benefits</h3>
                <p className="text-muted-foreground text-balance">
                  Get up to 1 year of retroactive benefits from your Intent to File&nbsp;date
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Risk</h3>
                <p className="text-muted-foreground text-balance">
                  Filing intent costs nothing and gives you time to prepare your claim&nbsp;properly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits of Rating Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full mb-4 w-fit">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">Unlock More</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Benefits of Having a VA Disability Rating
                </h2>
                <p className="text-muted-foreground mb-6">
                  A disability rating does more than provide monthly compensation. It can unlock healthcare, family support, and lifetime&nbsp;benefits.
                </p>
                <BenefitsOfRatingModal />
              </div>
              <div className="md:w-1/2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-8 md:p-10 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-background/80 backdrop-blur rounded-lg p-4">
                    <p className="text-2xl font-bold text-primary">Tax-Free</p>
                    <p className="text-sm text-muted-foreground">Monthly Pay</p>
                  </div>
                  <div className="bg-background/80 backdrop-blur rounded-lg p-4">
                    <p className="text-2xl font-bold text-primary">VA Health</p>
                    <p className="text-sm text-muted-foreground">Care Access</p>
                  </div>
                  <div className="bg-background/80 backdrop-blur rounded-lg p-4">
                    <p className="text-2xl font-bold text-primary">Home Loan</p>
                    <p className="text-sm text-muted-foreground">Fee Waiver</p>
                  </div>
                  <div className="bg-background/80 backdrop-blur rounded-lg p-4">
                    <p className="text-2xl font-bold text-primary">Job</p>
                    <p className="text-sm text-muted-foreground">Preference</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <VeteransFaq />
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
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto text-balance">
              Our AI Claims Agent will walk you through the process step by step, help you describe your conditions in plain language, and connect you with trusted partners who can file on your&nbsp;behalf.
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
